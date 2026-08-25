---
generated_from_state_version: 11
---

# Verification

## Current result

- Result: **Passed**
- Assurance: **skill-coordinated**
- Goal cycle: 2
- Iteration: 1
- Verifier attempt: 2
- Completed: 2026-08-25T07:29:37.338Z
- Summary: 62 项验收全部通过（A1-A33 来自 brief，A34-A62 由 specs/git-tag/spec.md 派生）。Runtime 本轮 pnpm typecheck 与 pnpm test 均 exit 0。每项均回到实现代码取证：git.ts 的四个 tag 函数、index.ts 的两个校验与四条路由、api.ts 的四个方法、GitView.tsx 的 Tag 区块/行菜单/创建弹窗/历史菜单，以及三个测试文件新增的 8 个用例；非目标以检索确认未被实现。构建期两处 Spec 澄清（同秒 tag 由 ref 名决胜、空名由 requireString 拒绝）已由用户确认并回写 Spec。

## Acceptance

| ID | Result | Source | Criterion | Reason |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1 `tags(cwd)` 返回 `{ name, subject }[]`，按 creatordate 倒序（最新创建在最前）；仓库没有 tag 时返回空数组。 | src/git.ts tags() 用 for-each-ref --sort=-creatordate 返回 {name,subject}[]；tests/git.spec.ts 断言空仓库返回 [] 且两个 tag 按新→旧排列，Runtime pnpm test exit 0。 |
| A2 | passed | brief.md | A2 附注 tag 的 `subject` 是附注消息首行；轻量 tag 的 `subject` 是其所指提交的 subject。 | 同一用例断言附注 tag v0.2.0 的 subject 是 'second release'（附注首行），轻量 tag v0.1.0 的 subject 是 'base commit'（所指提交），来自 %(contents:subject) 的 git 回退语义。 |
| A3 | passed | brief.md | A3 `createTag(cwd, name)` 在 message 为空时执行 `git tag <name>` 创建轻量 tag；message 非空时执行 `git tag -a <name> -m <message>` 创建附注 tag。 | createTag 中 annotate = message 非空 ? ['-a','-m',message] : []，argv 为 ['tag',...annotate,name,...]；两个 tag 用例分别走了空与非空两条分支并得到相符的 subject。 |
| A4 | passed | brief.md | A4 `createTag` 传入 commit 时 tag 指向该提交；不传时指向 HEAD。 | createTag 末尾拼接 commit；tests/git.spec.ts 'tags the requested commit rather than HEAD' 断言 rev-parse on-older 等于较早那个提交的 hash，而 HEAD 已前进一次提交。 |
| A5 | passed | brief.md | A5 `deleteTag(cwd, name)` 执行后 `tags()` 不再包含该名字。 | deleteTag 执行 git tag -d；用例删除 v0.2.0 后断言 tags() 只剩 v0.1.0。 |
| A6 | passed | brief.md | A6 `pushTag(cwd, name)` 推送到远端：已配置 `origin` 时用 `origin`，否则用第一个已配置远端；没有任何远端时抛 `GitCommandError`，不静默视为成功。 ## wire 路由（src/index.ts） | pushTag 先 git remote 取列表，names.includes('origin') ? 'origin' : names[0]，undefined 时抛 GitCommandError('no remote configured') 而非静默返回。代码路径已核对；无真实远端的端到端测试，见风险。 |
| A7 | passed | brief.md | A7 注册 `git.tag-list`、`git.tag-create`、`git.tag-delete`、`git.tag-push` 四个路由，scope 解析与错误映射与既有 git 路由一致。 | src/index.ts:364-388 注册 git.tag-list / tag-create / tag-delete / tag-push，四个都用与既有 git 路由相同的 cwdOf(payload) 解析 scope，错误经同一 SidebarError 通道。 |
| A8 | passed | brief.md | A8 tag 名校验拒绝 git 本身不接受的名字——为空，以 `-`、`.`、`/` 开头，含空格、控制字符或 `~^:?*[\` 中任一字符，含 `..`、`@{`、`//`，以 `/`、`.`、`.lock` 结尾——返回 `bad-request` 且不执行任何 git 命令。 | requireTagName 拒绝 /^[-.\/]/、空白与控制字符与 ~^:?*[\、..、@{、//、以 / . .lock 结尾；空名由其上游 requireString 以 bad-request 拒绝。tests/smoke.spec.ts 用 18 个非法名与 3 个合法名断言，Runtime pnpm test exit 0。 |
| A9 | passed | brief.md | A9 `git.tag-create` 的 commit 参数必须是 40 位十六进制全 hash，否则返回 `bad-request`。 ## 客户端接口（src/client/api.ts） | git.tag-create 的 commit 走 requireCommitHash，正则 /^[0-9a-f]{40}$/，否则抛 SidebarError('bad-request','invalid commit hash')。 |
| A10 | passed | brief.md | A10 新增 `gitTags`、`gitTagCreate`、`gitTagDelete`、`gitTagPush`，分别调用上述四个路由。 ## Tag 区块（src/client/GitView.tsx） | src/client/api.ts:191-203 四个方法分别调用对应路由；gitTagCreate 在 message 为空时不把 message 放进 payload，与 A3 的轻量 tag 分支一致。 |
| A11 | passed | brief.md | A11 Tag 区块位于 Stash 区块之后、提交输入框之前，可折叠，且折叠状态与其他区块互相独立。 | GitView.tsx 中 Tag 区块（739-774 行）位于 stash 区块（704 行起）之后、css.gitCommit（777 行）之前，用独立的 expandedSections.tag 折叠。git-view.spec.tsx 断言 aria-controls 序列以 git-tag-entries 结尾且五个区块初始都展开。 |
| A12 | passed | brief.md | A12 标题为 `Tag (n)`，n 为当前 tag 数；n 为 0 时区块内显示与 Stash 相同的统一空态文案。 | 区块标题为 {t('tag')} ({tagEntries.length})；tagEntries 为空时渲染 css.gitEmpty + t('noChanges')，与 stash 区块同一文案键。测试断言 'Tag (2)'。 |
| A13 | passed | brief.md | A13 每行显示 tag 名与其 subject，最新创建的排在最上。 | 每行渲染 entry.name 与 entry.subject；测试断言第一行含 v0.2.0 与 second release、第二行含 v0.1.0，顺序即 tags() 的倒序。 |
| A14 | passed | brief.md | A14 区块头提供「新建 Tag」按钮，点击打开创建弹窗；面板正忙时禁用。 | 区块头「新建 Tag」按钮 disabled={busy}，onClick 置 tagDraft={commit:null,...} 打开弹窗；测试从该按钮打开弹窗完成一次创建。 |
| A15 | passed | brief.md | A15 tag 行左键点击与右键都打开该行的上下文菜单（与 Stash 行一致）。 | tag 行的按钮同时绑定 onClick 与 onContextMenu，都调用 openTagMenu，与 stash 行写法一致；测试用左键 click 打开菜单成功。 |
| A16 | passed | brief.md | A16 tag 行菜单包含三项：推送到远端、复制 Tag 名、删除（danger 样式）。 | 菜单项为 push / copy / 分隔线 / delete(danger, 垃圾桶图标)，即推送到远端、复制 Tag 名、删除三项操作。 |
| A17 | passed | brief.md | A17 删除先弹出既有确认 Modal，用户确认后才执行；取消时不执行任何 git 命令。 | delete 分支走 runConfirmed({title,description,confirmLabel,onConfirm:()=>api.gitTagDelete(...)}, setTagError)，git 调用只在 onConfirm 里；取消只清 confirm 状态，不触发。 |
| A18 | passed | brief.md | A18 推送到远端先弹出既有确认 Modal，用户确认后才执行。 | push 分支同样走 runConfirmed；测试点开菜单后再点确认按钮才断言到 gitTagPush 被调用。 |
| A19 | passed | brief.md | A19 复制 Tag 名把 tag 名写入剪贴板，不触发任何 git 命令。 ## 创建弹窗 | copy 分支调用 copy(target.entry.name) 走 writeClipboard 后直接 return，不经过任何 api.git* 调用。 |
| A20 | passed | brief.md | A20 弹窗含必填的 Tag 名输入框与选填的描述输入框；Tag 名为空时创建按钮禁用。 | 弹窗两个 Input：名占位符 tagNamePlaceholder、描述占位符 tagMessagePlaceholder；创建按钮 disabled={busy \|\| (tagDraft?.name.trim() ?? '') === ''}。测试断言刚打开时创建按钮 disabled 为 true。 |
| A21 | passed | brief.md | A21 描述非空时创建附注 tag；描述为空时创建轻量 tag。 | createTag 传 draft.message.trim() 给 api.gitTagCreate，api 层空串不进 payload、路由层 message 为 undefined、git 层走轻量分支。两个 UI 用例分别断言了 '' 与 'release notes' 两种调用。 |
| A22 | passed | brief.md | A22 从「新建 Tag」按钮打开时目标是当前 HEAD；从历史行菜单打开时目标是该提交，且弹窗内显示该提交的短 hash 与 subject。 | tagDraft.commit 为 null 时渲染 t('tagAtHead') 且 createTag 传 undefined；来自历史菜单时 commit 为该 GitLogEntry，渲染 t('tagAtCommit',{hash,subject}) 并传 hashFull。测试断言弹窗含 1a2b3c4 与 older commit，且 gitTagCreate 收到 logEntry.hashFull。 |
| A23 | passed | brief.md | A23 创建成功后关闭弹窗、清空输入，并刷新 tag 列表与历史。 ## 历史右键菜单 | createTag 成功后 setTagDraft(null) 再 await refresh()；测试断言创建后名字输入框已不存在且 api.gitTags 被调用 2 次（初次加载 + 刷新）。 |
| A24 | passed | brief.md | A24 历史提交右键菜单新增「在此提交创建 Tag」，位于三个复制项之后、还原/捡取分隔线之前。 | 历史菜单 items 顺序为 view / copyShort / copyFull / copySubject / tag / 分隔线 sep2 / revert / cherryPick，新增项正落在复制类之后、分隔线之前。 |
| A25 | passed | brief.md | A25 既有菜单项（查看提交差异、复制短 hash、复制完整 hash、复制标题、还原此提交、捡取此提交）的存在与相对顺序不变。 ## 错误与刷新 | 同一份 items 中既有的六项及其相对顺序与改动前逐字一致，onSelect 里既有分支未改；tests/git-view.spec.tsx 与其余 63 个测试文件全部通过。 |
| A26 | passed | brief.md | A26 任一 tag 操作成功后刷新 tag 列表与工作区状态，并清掉 Tag 区块内上一条错误信息。 | runTagAction 与 runConfirmed(…, setTagError) 都在开始时 reportError(null)，成功后 await refresh()，refresh 同时重取 gitStatus 与 gitTags。 |
| A27 | passed | brief.md | A27 tag 操作失败时，git 错误就近显示在 Tag 区块内部，不进入提交框下方的错误区，也不静默忽略。 | tagError 渲染为 Tag 区块内部的 css.gitError，位于区块头之下；测试断言含 'remote rejected' 的 gitError 节点全局恰有 1 个且被 tagSection 包含。 |
| A28 | passed | brief.md | A28 创建弹窗内的操作失败时错误显示在弹窗内，弹窗不关闭且输入保留，用户可改名重试。 ## 文案 | createTag 的 catch 写 tagDraftError 而不动 tagDraft，弹窗内渲染该错误；测试断言创建失败后页面含 'invalid tag name' 且名字输入框仍为 'bad name'。 |
| A29 | passed | brief.md | A29 zh-CN 与 en 两份 locale 的 key 集合完全一致，新增的全部 tag 文案两边都有。 | zh 与 en 各新增同样 17 个 tag 键；tests/locales.spec.ts 的字典 parity 断言在本轮 Runtime pnpm test 中通过。 |
| A30 | passed | brief.md | A30 zh-CN 的 tag 文案统一使用「Tag」术语，与 Stash 区块的措辞风格一致。 ## 测试与检查 | zh-CN 文案为 Tag / 新建 Tag / 在此提交创建 Tag / 复制 Tag 名 / 推送到远端 / 删除 等，统一保留 Tag 术语，与 Stash 区块保留 Stash / Pop / Apply / Drop 的风格一致。 |
| A31 | passed | brief.md | A31 `tests/git.spec.ts` 新增真实仓库用例：创建轻量与附注 tag → `tags()` 返回两条且 subject 分别为提交 subject 与附注首行 → 删除其中一个后列表不再含它。 | tests/git.spec.ts 新增 describe('tags') 两个真实临时仓库用例，覆盖两种 tag 的列出与 subject、倒序、删除后消失，以及指定提交打 tag。 |
| A32 | passed | brief.md | A32 `tests/git-view.spec.tsx` 新增用例覆盖：Tag 区块渲染 tag 行；新建 Tag 弹窗填名创建后调用 `api.gitTagCreate`；历史行右键菜单含「在此提交创建 Tag」；tag 操作失败时 `gitError` 节点位于 Tag 区块内。 | tests/git-view.spec.tsx 新增 describe('GitView tags') 五个用例，覆盖列表渲染、HEAD 上创建轻量 tag、历史右键创建附注 tag、失败时弹窗保留输入、推送失败错误落在 Tag 区块内。 |
| A33 | passed | brief.md | A33 `pnpm typecheck` 与 `pnpm test` 全部通过。 | Runtime 本轮执行 pnpm typecheck（exit 0）与 pnpm test（exit 0），非 Builder 自报。 |
| A34 | passed | specs/git-tag/spec.md | 侧边栏 Git 面板中与 Git tag 相关的部分：Tag 区块、创建 Tag 弹窗、历史提交右键菜单的建 Tag 入口，以及支撑它们的主机侧能力与文案。归档后本 Spec 描述该能力的完整行为。 | 能力范围与实现落点一致：Tag 区块在 GitView.tsx:739-774，创建弹窗在同文件的 Modal（open={tagDraft!==null}），历史入口为历史菜单的 tag 项，主机侧为 git.ts 的 tags/createTag/deleteTag/pushTag 与 index.ts 的四条 git.tag-* 路由，文案在 locales.ts 的 zh/en 两份。 |
| A35 | passed | specs/git-tag/spec.md | 位置在 Stash 区块之后、提交输入框之前，与其他区块同样可折叠且折叠状态独立。 | Tag 区块（739 行起）在 stash 区块（704 行起）之后、css.gitCommit（777 行）之前；折叠用独立键 expandedSections.tag。git-view.spec.tsx 断言 aria-controls 序列为 staged/unstaged/untracked/stash/tag。 |
| A36 | passed | specs/git-tag/spec.md | 标题为 `Tag (n)`，n 为仓库当前的 tag 数；n 为 0 时区块内显示与其他区块相同的统一空态文案。 | 标题渲染 {t('tag')} ({tagEntries.length})；空列表渲染 css.gitEmpty + t('noChanges')，与其余区块同一文案键。测试断言 'Tag (2)'。 |
| A37 | passed | specs/git-tag/spec.md | 每个条目显示 tag 名与其 subject：附注 tag 显示附注消息首行，轻量 tag 显示所指提交的 subject。条目按创建时间倒序排列，最新的在最上；创建时间相同（git 的时间戳精确到秒）时由 git 按 ref 名升序决定先后。 | 行渲染 entry.name 与 entry.subject；tags() 用 --sort=-creatordate。tests/git.spec.ts 用 2020 年的提交日期把轻量 tag 的 creatordate 与附注 tag 拉开，断言 v0.2.0 在前；同秒平手由 git 自身按 ref 名升序决定，实现未额外干预排序。 |
| A38 | passed | specs/git-tag/spec.md | 区块头提供「新建 Tag」按钮：点击打开创建 Tag 弹窗，目标为当前 HEAD。面板正忙时按钮禁用。 | 「新建 Tag」按钮 disabled={busy}，onClick 置 tagDraft={commit:null,name:'',message:''}，commit 为 null 即目标 HEAD。测试从该按钮完成一次 HEAD 上的创建。 |
| A39 | passed | specs/git-tag/spec.md | 条目的上下文菜单在左键点击与右键点击时都会打开（与 Stash 行一致），包含三项： | tag 行按钮同时绑定 onClick 与 onContextMenu 到 openTagMenu，与 stash 行写法逐字一致；菜单 items 为 push、copy、分隔线、delete 三项操作。测试用左键 click 打开菜单成功。 |
| A40 | passed | specs/git-tag/spec.md | 推送到远端：把该 tag 推送到远端。属于外发操作，先弹既有确认弹窗，用户确认后才执行； | push 分支走 runConfirmed({...onConfirm:()=>api.gitTagPush(scope,name)}, setTagError)，git 调用只在确认回调内。测试点开菜单后再点确认按钮才断言到 gitTagPush 被调用。 |
| A41 | passed | specs/git-tag/spec.md | 复制 Tag 名：把 tag 名写入剪贴板，不触发任何 git 命令； | copy 分支调用 copy(target.entry.name) 后直接 return，该函数只走 writeClipboard，不经任何 api.git* 调用。 |
| A42 | passed | specs/git-tag/spec.md | 删除：删除本地 tag。先弹既有确认弹窗，用户确认后才执行。 | delete 分支同样走 runConfirmed，onConfirm 为 api.gitTagDelete；未确认时只有 confirm 状态变化。 |
| A43 | passed | specs/git-tag/spec.md | 任一 tag 操作成功后刷新 tag 列表与工作区 status，并清掉区块内的上一条错误信息；失败时把 git 错误就近显示在 Tag 区块内部（不进提交框下方的错误区），不静默忽略。 | runTagAction 与 runConfirmed(…, setTagError) 都先 reportError(null) 再执行，成功后 await refresh()，refresh 并行重取 gitStatus 与 gitTags；失败写 tagError，渲染为 Tag 区块内部的 css.gitError。测试断言含 'remote rejected' 的 gitError 全局恰有 1 个且被 tagSection 包含。 |
| A44 | passed | specs/git-tag/spec.md | 含两个输入框：Tag 名必填，描述选填。Tag 名为空时创建按钮禁用。 | 弹窗两个 Input（tagNamePlaceholder / tagMessagePlaceholder）；创建按钮 disabled={busy \|\| (tagDraft?.name.trim() ?? '')===''}。测试断言刚打开时创建按钮 disabled。 |
| A45 | passed | specs/git-tag/spec.md | 描述非空时创建附注 tag（`git tag -a <name> -m <message>`）；描述为空时创建轻量 tag（`git tag <name>`）。 | createTag 传 draft.message.trim()；api 层空串不进 payload → 路由层 message 为 undefined → git 层 annotate 为 []，即 git tag <name>；非空时 ['-a','-m',message]。两个 UI 用例分别断言 '' 与 'release notes'，git.spec.ts 用例断言两种 tag 的 subject 来源不同。 |
| A46 | passed | specs/git-tag/spec.md | 目标提交由打开方式决定：从区块头的「新建 Tag」打开时目标是当前 HEAD，弹窗不显示目标提交；从历史行菜单打开时目标是该提交，弹窗内显示它的短 hash 与 subject。 | tagDraft.commit 为 null 时渲染 t('tagAtHead') 且不显示提交，传 undefined；来自历史菜单时渲染 t('tagAtCommit',{hash,subject}) 并传 hashFull。测试断言弹窗含 1a2b3c4 与 older commit，gitTagCreate 收到 logEntry.hashFull。 |
| A47 | passed | specs/git-tag/spec.md | 创建成功后关闭弹窗、清空两个输入框，并刷新 tag 列表与历史。 | 成功后 setTagDraft(null) 再 await refresh()；下次打开是全新草稿，两个输入框都为空。测试断言创建后名字输入框已不存在、api.gitTags 被调用 2 次。 |
| A48 | passed | specs/git-tag/spec.md | 创建失败时错误显示在弹窗内部，弹窗保持打开且输入保留，用户可以改名后重试。 | catch 写 tagDraftError 而不动 tagDraft，弹窗内渲染该错误。测试断言失败后页面含 'invalid tag name' 且名字输入框仍为 'bad name'。 |
| A49 | passed | specs/git-tag/spec.md | 菜单项自上而下为：查看提交差异、复制短 hash、复制完整 hash、复制标题、分隔线、还原此提交、捡取此提交。在复制标题与分隔线之间新增一项「在此提交创建 Tag」，点击后打开创建 Tag 弹窗并以该提交为目标。其余菜单项的存在与相对顺序不变。 | 历史菜单 items 实际顺序为 view / copyShort / copyFull / copySubject / tag / 分隔线 sep2 / revert / cherryPick，新增项正落在复制标题与分隔线之间；既有六项与 onSelect 中的既有分支逐字未改。 |
| A50 | passed | specs/git-tag/spec.md | 历史行本身继续通过 `git log --decorate=short` 的 `%D`（`GitLogEntry.refs`）渲染 tag 与分支的装饰名，该显示不受本能力影响。 | GitView.tsx:822 的 refNames(entry.refs) 渲染保持原样，git.ts 的 log() 仍用 --decorate=short 与 %D；本次改动未触及这两处。 |
| A51 | passed | specs/git-tag/spec.md | `src/git.ts` 经 `runGit` 提供： | 四个 tag 函数都在 src/git.ts 内经 runGit 执行，与既有 stash/branch 函数同一通道。 |
| A52 | passed | specs/git-tag/spec.md | `tags(cwd)` → `{ name, subject }[]`：`git for-each-ref --sort=-creatordate --format=%(refname:short)%1f%(contents:subject) refs/tags`，按行解析、`%1f` 分字段；没有 tag 时为空数组。`git for-each-ref` 不支持 `-z`，因此不使用 NUL 分隔；tag 名与 `%(contents:subject)` 均不含换行，按行解析是安全的。 | tags() 的 argv 为 ['for-each-ref','--sort=-creatordate','--format=%(refname:short)%1f%(contents:subject)','refs/tags']，按 \n 切行、按 \x1f 切字段，空输出得空数组（用例断言）。for-each-ref 无 -z 是本机 git 2.50.1 实测结论，已写进注释与 Spec。 |
| A53 | passed | specs/git-tag/spec.md | `createTag(cwd, name, message?, commit?)` → message 为空走 `git tag <name> [<commit>]`，非空走 `git tag -a <name> -m <message> [<commit>]`；不传 commit 时指向 HEAD。 | createTag 的 argv 为 ['tag',...annotate,name,...(commit?[commit]:[])]，annotate 依 message 是否为空二选一；commit 省略即 git 默认的 HEAD。git.spec.ts 两个用例分别覆盖两条 message 分支与指定 commit。 |
| A54 | passed | specs/git-tag/spec.md | `deleteTag(cwd, name)` → `git tag -d <name>`。 | deleteTag 的 argv 为 ['tag','-d',name]；用例断言删除后 tags() 不再含该名。 |
| A55 | passed | specs/git-tag/spec.md | `pushTag(cwd, name)` → 推送单个 tag。远端优先取 `origin`，否则取 `git remote` 列出的第一个；一个远端都没有时抛 `GitCommandError`，不静默视为成功。 | pushTag 先 git remote 取名单，origin 优先否则取第一个，全空时抛 GitCommandError('no remote configured')，再 git push <remote> refs/tags/<name>（120s 超时）。分支已逐行核对；无真实远端的端到端测试，见风险。 |
| A56 | passed | specs/git-tag/spec.md | wire 路由：`git.tag-list`、`git.tag-create`、`git.tag-delete`、`git.tag-push`，scope 解析与错误处理与既有 git 路由一致。 | src/index.ts:364-388 四条路由均用 cwdOf(payload) 解析 scope，异常沿既有 SidebarError 通道返回，与相邻 git.stash-* 路由写法一致。 |
| A57 | passed | specs/git-tag/spec.md | 路由层的入参校验与 `requireStashRef` 同级： | requireTagName 与 requireCommitHash 与 requireStashRef 定义在同一段、同样在 argv 组装前抛 SidebarError('bad-request', …)。 |
| A58 | passed | specs/git-tag/spec.md | tag 名为空时由通用的字符串入参校验拒绝；以 `-`、`.`、`/` 开头，含空格、控制字符或 `~^:?*[\` 中任一字符，含 `..`、`@{`、`//`，或以 `/`、`.`、`.lock` 结尾时，返回 `bad-request` 且不执行任何 git 命令。这些正是 git 自身拒绝的 ref 名，同时挡住以 `-` 开头的名字被当作 git 参数解析。 | requireTagName 依次拒绝 /^[-.\/]/、[\s~^:?*[\\ 与控制字符]、..、@{、//、以 / . .lock 结尾；空名先被上游 requireString 以 bad-request 拒绝（故 requireTagName 内原有的 name==='' 分支是死代码，已删除）。tests/smoke.spec.ts 以 1 个空名 + 17 个非法名 + 3 个合法名断言。 |
| A59 | passed | specs/git-tag/spec.md | `git.tag-create` 的 commit 参数必须是 40 位十六进制全 hash，否则返回 `bad-request`。 | requireCommitHash 用 /^[0-9a-f]{40}$/，不匹配即抛 SidebarError('bad-request','invalid commit hash')，在 git.createTag 调用之前求值。 |
| A60 | passed | specs/git-tag/spec.md | 客户端对应 `api.gitTags`、`api.gitTagCreate`、`api.gitTagDelete`、`api.gitTagPush`。 | src/client/api.ts:191-203 定义四个方法，路由名与主机侧一一对应；git-view.spec.tsx 通过 vi.spyOn 这四个方法断言调用参数。 |
| A61 | passed | specs/git-tag/spec.md | zh-CN 与 en 两套 locale 的 key 集合完全一致。zh-CN 的 tag 文案统一使用「Tag」术语，与 Stash 区块的措辞风格保持一致；en 使用 git 官方术语。 | zh 与 en 各新增同样 17 个 tag 键，zh 侧文案为 Tag / 新建 Tag / 在此提交创建 Tag / 复制 Tag 名 / 推送到远端 / 删除 等，en 侧为 New tag / Create tag here / Push to remote 等。tests/locales.spec.ts 的字典 parity 断言在本轮 Runtime pnpm test 中通过。 |
| A62 | passed | specs/git-tag/spec.md | 删除远端 tag、检出 tag、重命名或强制移动已有 tag、从远端拉取 tag，以及一次推送全部 tag，都不在本能力范围内。 | 对 --tags、tag -f、push --delete、checkout <tag> 在 git.ts / index.ts / api.ts / GitView.tsx 四个文件中检索均无匹配，非目标确未被实现。 |

## Checks

| Check | Command | Working directory | Status | Exit | Duration |
| --- | --- | --- | --- | ---: | ---: |
| pnpm typecheck | typecheck | . | passed | 0 | 2182 ms |
| pnpm test | test | . | passed | 0 | 7873 ms |

## Blockers

_None._

## Risks and skipped work

- A6 的远端选择与 A18 的推送链路没有真实 remote 的端到端测试，只核对了实现分支与 UI 调用参数。
- README.md / README_EN.md 的 Git 面板介绍行未提及 tag；文档同步不在本次确认的 Scope 与验收项内。

## Previous iterations

| Goal cycle | Iteration | Attempt | Outcome | Unresolved | Summary | Completed |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 0 | recovery | — | Native confirmed acceptance criteria changed | 2026-08-25T07:20:15.431Z |
| 2 | 1 | 1 | execution-error | — | Native Verifier response was invalid: Native Verifier acceptance coverage is invalid (duplicate: none; unknown: none; missing: A34, A35, A36, A37, A38, A39, A40, A41, A42, A43, A44, A45, A46, A47, A48, A49, A50, A51, A52, A53, A54, A55, A56, A57, A58, A59, A60, A61, A62) | 2026-08-25T07:28:10.867Z |
| 2 | 1 | 2 | pass | — | 62 项验收全部通过（A1-A33 来自 brief，A34-A62 由 specs/git-tag/spec.md 派生）。Runtime 本轮 pnpm typecheck 与 pnpm test 均 exit 0。每项均回到实现代码取证：git.ts 的四个 tag 函数、index.ts 的两个校验与四条路由、api.ts 的四个方法、GitView.tsx 的 Tag 区块/行菜单/创建弹窗/历史菜单，以及三个测试文件新增的 8 个用例；非目标以检索确认未被实现。构建期两处 Spec 澄清（同秒 tag 由 ref 名决胜、空名由 requireString 拒绝）已由用户确认并回写 Spec。 | 2026-08-25T07:29:37.338Z |

## Conclusion

62 项验收全部通过（A1-A33 来自 brief，A34-A62 由 specs/git-tag/spec.md 派生）。Runtime 本轮 pnpm typecheck 与 pnpm test 均 exit 0。每项均回到实现代码取证：git.ts 的四个 tag 函数、index.ts 的两个校验与四条路由、api.ts 的四个方法、GitView.tsx 的 Tag 区块/行菜单/创建弹窗/历史菜单，以及三个测试文件新增的 8 个用例；非目标以检索确认未被实现。构建期两处 Spec 澄清（同秒 tag 由 ref 名决胜、空名由 requireString 拒绝）已由用户确认并回写 Spec。
