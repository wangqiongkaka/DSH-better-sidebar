// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { api, type GitStashEntry, type GitStatusResult } from '../src/client/api.ts'
import { GitView } from '../src/client/GitView.tsx'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const dirtyStatus: GitStatusResult = {
  isRepo: true,
  branch: 'main',
  ahead: 0,
  entries: [
    { path: 'staged.ts', xy: 'M ' },
    { path: 'unstaged.ts', xy: ' M' },
    { path: 'new.ts', xy: '??' },
  ],
}

const stashStack: GitStashEntry[] = [
  { ref: 'stash@{0}', message: 'WIP on main: 1a2b3c4 newest' },
  { ref: 'stash@{1}', message: 'WIP on main: 5d6e7f8 older' },
]

const flush = async (): Promise<void> => {
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)) })
}

function renderGitView(): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  act(() => {
    root.render(createElement(GitView, {
      scope: { sessionId: 'session-1', cwd: '/repo' },
      onOpenFile: () => {},
      onOpenDiff: () => {},
      onOpenWorktree: async () => {},
    }))
  })
  return { container, root }
}

function discardButtons(): HTMLButtonElement[] {
  return [...document.querySelectorAll<HTMLButtonElement>('button')].filter(button =>
    button.textContent?.trim() === 'Discard all changes' || button.textContent?.trim() === '放弃所有更改',
  )
}

beforeEach(() => {
  vi.spyOn(api, 'gitStatus').mockResolvedValue(dirtyStatus)
  vi.spyOn(api, 'gitBranch').mockResolvedValue({ current: 'main', names: ['main'] })
  vi.spyOn(api, 'gitLog').mockResolvedValue([])
  vi.spyOn(api, 'gitWorktrees').mockResolvedValue({ entries: [], pathPrefix: '' })
  vi.spyOn(api, 'gitOperation').mockResolvedValue({ operation: null })
  vi.spyOn(api, 'gitDiscardAll').mockResolvedValue({ ok: true })
  vi.spyOn(api, 'gitStashList').mockResolvedValue({ entries: stashStack })
  vi.spyOn(api, 'gitStash').mockResolvedValue({ ok: true })
  vi.spyOn(api, 'gitStashPop').mockResolvedValue({ ok: true })
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('GitView change groups', () => {
  it('renders staged, unstaged, and untracked groups expanded and folds them independently', async () => {
    const { container, root } = renderGitView()
    try {
      await flush()
      const toggles = [...container.querySelectorAll<HTMLButtonElement>('button[aria-controls^="git-"]')]
      expect(toggles.map(button => button.getAttribute('aria-controls'))).toEqual([
        'git-staged-changes',
        'git-unstaged-changes',
        'git-untracked-changes',
        'git-stash-entries',
      ])
      expect(toggles.map(button => button.getAttribute('aria-expanded'))).toEqual(['true', 'true', 'true', 'true'])
      expect(container.textContent).toContain('staged.ts')
      expect(container.textContent).toContain('unstaged.ts')
      expect(container.textContent).toContain('new.ts')

      act(() => { toggles[1]!.click() })
      expect(toggles[1]!.getAttribute('aria-expanded')).toBe('false')
      expect(container.textContent).toContain('staged.ts')
      expect(container.textContent).not.toContain('unstaged.ts')
      expect(container.textContent).toContain('new.ts')
    } finally {
      act(() => { root.unmount() })
      container.remove()
    }
  })

  it('confirms discard-all, refreshes on success, and keeps untracked files visible', async () => {
    const cleanTracked: GitStatusResult = {
      ...dirtyStatus,
      entries: [{ path: 'new.ts', xy: '??' }],
    }
    vi.mocked(api.gitStatus).mockResolvedValueOnce(dirtyStatus).mockResolvedValue(cleanTracked)
    const { container, root } = renderGitView()
    try {
      await flush()
      expect(discardButtons()).toHaveLength(1)
      act(() => { discardButtons()[0]!.click() })
      expect(document.body.textContent).toContain('2')
      expect(document.body.textContent).toMatch(/Untracked files will be kept|未跟踪文件将保留/)

      const confirm = discardButtons().at(-1)!
      await act(async () => { confirm.click(); await Promise.resolve() })
      await flush()

      expect(api.gitDiscardAll).toHaveBeenCalledWith({ sessionId: 'session-1', cwd: '/repo' })
      expect(api.gitStatus).toHaveBeenCalledTimes(2)
      expect(container.textContent).not.toContain('staged.ts')
      expect(container.textContent).not.toContain('unstaged.ts')
      expect(container.textContent).toContain('new.ts')
      expect(discardButtons()).toHaveLength(0)
    } finally {
      act(() => { root.unmount() })
      container.remove()
    }
  })

  it('keeps the current list and reports an error when discard-all fails', async () => {
    vi.mocked(api.gitDiscardAll).mockRejectedValue(new Error('discard failed'))
    const { container, root } = renderGitView()
    try {
      await flush()
      act(() => { discardButtons()[0]!.click() })
      const confirm = discardButtons().at(-1)!
      await act(async () => { confirm.click(); await Promise.resolve() })
      await flush()

      expect(container.textContent).toContain('discard failed')
      expect(container.textContent).toContain('staged.ts')
      expect(container.textContent).toContain('unstaged.ts')
      expect(container.textContent).toContain('new.ts')
    } finally {
      act(() => { root.unmount() })
      container.remove()
    }
  })
})

/** The stash section's action button (header) by its label. */
function stashSaveButton(): HTMLButtonElement {
  return [...document.querySelectorAll<HTMLButtonElement>('button')]
    .find(button => button.textContent?.trim() === 'Stash all' || button.textContent?.trim() === '存入 Stash')!
}

/** A menu item by its visible label (the Menu renders through a portal). */
function menuItem(label: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')]
    .find(node => node.textContent?.trim() === label)
}

describe('GitView stash', () => {
  it('lists the stash stack newest first with its count', async () => {
    const { container, root } = renderGitView()
    try {
      await flush()
      expect(container.textContent).toContain('Stash (2)')
      expect(container.textContent).toContain('stash@{0}')
      expect(container.textContent).toContain('WIP on main: 1a2b3c4 newest')
      expect(container.textContent).toContain('stash@{1}')
      const refs = [...container.querySelectorAll('#git-stash-entries button')]
        .map(node => node.textContent ?? '')
      expect(refs[0]).toContain('stash@{0}')
      expect(refs[1]).toContain('stash@{1}')
    } finally {
      act(() => { root.unmount() })
      container.remove()
    }
  })

  // WHY: stashing is only meaningful when there is something to stash; an
  // enabled button on a clean tree just produces a git error.
  it('disables the stash button when the three change groups are empty', async () => {
    vi.mocked(api.gitStatus).mockResolvedValue({ isRepo: true, branch: 'main', ahead: 0, entries: [] })
    const { container, root } = renderGitView()
    try {
      await flush()
      expect(stashSaveButton().disabled).toBe(true)
    } finally {
      act(() => { root.unmount() })
      container.remove()
    }
  })

  it('stashes every change and refreshes the panel', async () => {
    const { container, root } = renderGitView()
    try {
      await flush()
      expect(stashSaveButton().disabled).toBe(false)
      await act(async () => { stashSaveButton().click(); await Promise.resolve() })
      await flush()

      expect(api.gitStash).toHaveBeenCalledWith({ sessionId: 'session-1', cwd: '/repo' })
      expect(api.gitStatus).toHaveBeenCalledTimes(2)
      expect(api.gitStashList).toHaveBeenCalledTimes(2)
    } finally {
      act(() => { root.unmount() })
      container.remove()
    }
  })

  it('pops the clicked entry from its row menu', async () => {
    const { container, root } = renderGitView()
    try {
      await flush()
      const row = container.querySelector<HTMLButtonElement>('#git-stash-entries button')!
      await act(async () => { row.click(); await Promise.resolve() })
      const pop = menuItem('Pop')
      expect(pop).toBeDefined()
      await act(async () => { pop!.click(); await Promise.resolve() })
      await flush()

      expect(api.gitStashPop).toHaveBeenCalledWith({ sessionId: 'session-1', cwd: '/repo' }, 'stash@{0}')
    } finally {
      act(() => { root.unmount() })
      container.remove()
    }
  })
})

/** The stash section element (the block that owns the entry list). */
function stashSection(container: HTMLElement): HTMLElement {
  return container.querySelector<HTMLElement>('#git-stash-entries')!.parentElement!
}

describe('GitView stash errors', () => {
  // WHY: an error about a stash lands next to the stash section; down by the
  // commit box it reads as a commit failure and is easy to miss entirely.
  it('reports a failed pop inside the stash section, not the commit box', async () => {
    vi.mocked(api.gitStashPop).mockRejectedValueOnce(new Error('pop conflicted'))
    const { container, root } = renderGitView()
    try {
      await flush()
      const row = container.querySelector<HTMLButtonElement>('#git-stash-entries button')!
      await act(async () => { row.click(); await Promise.resolve() })
      await act(async () => { menuItem('Pop')!.click(); await Promise.resolve() })
      await flush()

      const shown = [...container.querySelectorAll('[class*="gitError"]')]
        .filter(node => node.textContent?.includes('pop conflicted'))
      expect(shown).toHaveLength(1)
      expect(stashSection(container).contains(shown[0]!)).toBe(true)

      // A later successful stash clears it.
      await act(async () => { stashSaveButton().click(); await Promise.resolve() })
      await flush()
      expect(container.textContent).not.toContain('pop conflicted')
    } finally {
      act(() => { root.unmount() })
      container.remove()
    }
  })
})
