// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { api, type GitStatusResult } from '../src/client/api.ts'
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
      ])
      expect(toggles.map(button => button.getAttribute('aria-expanded'))).toEqual(['true', 'true', 'true'])
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
