---
generated_from_state_version: 10
---

# Verification

## Current result

- Result: **Passed, user confirmation required**
- Assurance: **skill-coordinated**
- Goal cycle: 2
- Iteration: 1
- Verifier attempt: 1
- Completed: 2026-08-25T06:46:57.625Z
- Summary: 45 项验收全部通过。Runtime 本轮 pnpm typecheck 与 pnpm test 均 exit 0（64 文件 / 659 通过）。第 2 轮新增的 A17/A18 文案对齐与 A19/A20 stash 错误就近展示均已逐项落到具体实现行与新增测试用例。

## Acceptance

| ID | Result | Source | Criterion | Reason |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1 `src/git.ts` 导出 `stash`、`stashList`、`stashPop`、`stashApply`、`stashDrop`，全部经 `runGit` 执行；`stash` 使用 `git stash push --include-untracked`。 | src/git.ts:236-262 导出 stash/stashList/stashPop/stashApply/stashDrop，全部经 runGit；stash 为 ['stash','push','--include-untracked']。 |
| A2 | passed | brief.md | A2 `stashList` 返回条目数组，每项含 `ref`（如 `stash@{0}`）与 `message`（如 `WIP on yy-main: ...`），空栈返回空数组。 | src/git.ts:241-247 按 -z NUL 切分 + \x1f 拆 ref/message；tests/git.spec.ts 真实仓库用例断言空栈为 []、有栈时 ref 为 stash@{0}。 |
| A3 | passed | brief.md | A3 `src/index.ts` 新增 `git.stash`、`git.stash-list`、`git.stash-pop`、`git.stash-apply`、`git.stash-drop` 五个路由，与既有 git 路由同样的 scope/错误处理方式。 | src/index.ts:317-340 五条路由，均用与既有 git 路由相同的 cwdOf(payload) 取 scope，错误经同一 wire 错误通道抛出。 |
| A4 | passed | brief.md | A4 `src/client/api.ts` 新增 `gitStash`、`gitStashList`、`gitStashPop`、`gitStashApply`、`gitStashDrop` 并调用上述路由。 | src/client/api.ts 新增 gitStash/gitStashList/gitStashPop/gitStashApply/gitStashDrop，分别 call 上述五个路由名。 |
| A5 | passed | brief.md | A5 GitView 在"未跟踪"区块之后、提交输入框之前渲染一个可折叠区块，标题为 `Stash (n)`，n 为 stash 条目数；折叠状态与其他三个区块相互独立。 | GitView.tsx:652-685 区块 aria-controls=git-stash-entries，位于 git-untracked-changes(643) 之后、css.gitCommit(687) 之前；标题 {t('stash')} ({stashEntries.length})；折叠绑定 expandedSections.stash 独立字段。 |
| A6 | passed | brief.md | A6 Stash 区块为空时显示与其他区块一致的空态文案（`noChanges`）。 | GitView.tsx:668 stashEntries.length === 0 时渲染 <div className={css.gitEmpty}>{t('noChanges')}</div>，与其余三区块同一写法。 |
| A7 | passed | brief.md | A7 Stash 区块头部有 Stash 按钮；工作区没有任何改动（三个区块都为空）或正忙时该按钮禁用。 | GitView.tsx:659 disabled={busy \|\| changedCount === 0}，changedCount(448) = 三组之和；tests/git-view.spec.tsx 空 status 用例断言 disabled === true。 |
| A8 | passed | brief.md | A8 点击 Stash 按钮后调用 `gitStash`，成功后刷新 status 与 stash 列表；成功时"已 Add / 未 Add / 未跟踪"三区块清空，新条目出现在 Stash 区块顶部。 | GitView.tsx:660 runStashAction(() => api.gitStash(scope))，runStashAction(253-265) 成功后 await refresh()，refresh(156) 并行重取 gitStatus 与 gitStashList；git.spec.ts 证明 stash 后 status.entries 为 [] 且新条目为 stash@{0}；git-view 用例断言 gitStash 被调用且 gitStatus/gitStashList 各调 2 次。 |
| A9 | passed | brief.md | A9 stash 条目右键弹出菜单，含 Pop、Apply、Drop 三项，分别对该条 `ref` 调用 `gitStashPop`、`gitStashApply`、`gitStashDrop`。 | GitView.tsx:807-834 菜单三项 pop/apply/drop，分别调 api.gitStashPop/gitStashApply/gitStashDrop(scope, target.entry.ref)；git-view 用例断言 Pop 触发 gitStashPop(scope,'stash@{0}')。 |
| A10 | passed | brief.md | A10 Drop 走既有确认弹窗（`runConfirmed`）后才执行；Pop 与 Apply 不弹确认。 | GitView.tsx:826-833 drop 分支走 runConfirmed(406)；pop/apply 分支直接 runStashAction，无确认弹窗。 |
| A11 | passed | brief.md | A11 stash 相关操作失败时以既有 git 错误展示方式呈现，不静默吞掉。 | runStashAction(255/260) 与 Drop(833) 的失败都写入 stashError，由 GitView.tsx:667 的 css.gitError 渲染，不静默吞掉；git-view 失败用例断言错误文案确实出现。 |
| A12 | passed | brief.md | A12 zh-CN 文案：`staged`→`已 Add`、`unstaged`→`未 Add`、`stage`→`Add`、`unstage`→`取消 Add`、`stageAll`→`全部 Add`、`unstageAll`→`全部取消 Add`，`discardAllDesc` 中的"取消暂存"同步改为"取消 Add"。 | locales.ts:73-76 stage='Add'、unstage='取消 Add'、stageAll='全部 Add'、unstageAll='全部取消 Add'；133-134 staged='已 Add'、unstaged='未 Add'；150 discardAllDesc 使用「取消 Add」。 |
| A13 | passed | brief.md | A13 en locale 的 `staged`/`unstaged`/`stage`/`unstage`/`stageAll`/`unstageAll` 保持原文不变。 | locales.ts:381-384 Stage/Unstage/Stage all/Unstage all、441-442 Staged/Unstaged 均为原文未改。 |
| A14 | passed | brief.md | A14 zh-CN 与 en 新增的 stash 文案 key 一一对应，`tests/locales.spec.ts` 通过。 | 双语各新增同 7 个 key（zh 77-83 / en 385-391）；Runtime 检查 pnpm test 通过，含 tests/locales.spec.ts 的字典 parity 断言。 |
| A15 | passed | brief.md | A15 新增测试覆盖：Stash 区块渲染条目数与条目文本、Stash 按钮触发 `gitStash`、Pop 菜单项触发 `gitStashPop`。 | tests/git-view.spec.tsx 新增用例覆盖列表条目与计数、空树禁用、Stash 按钮触发 gitStash 并刷新、Pop 菜单项触发 gitStashPop；Runtime 检查 pnpm test 通过。 |
| A16 | passed | brief.md | A16 `pnpm typecheck` 与 `pnpm test` 全部通过。 | Runtime 本轮检查 typecheck exit 0、test exit 0，均为 passed。 |
| A17 | passed | brief.md | A17 `README.md` 的 Git 面板功能介绍行不再出现"暂存"，改用 Add 措辞并写明 stash / pop；`README_EN.md` 与 `README.md` 的历史 changelog 条目不变。 | README.md:27 现为「右键 Add / 提交 / 还原、stash / pop」，该行已无「暂存」；README_EN.md 全文无中文「暂存」（grep 计数 0）且未修改；README.md:93 与 172 的历史 changelog / 脚本注释保留原文，属已确认非目标。 |
| A18 | passed | brief.md | A18 `src/client/locales.ts` 的 zh-CN `pluginGitRemotesDesc` 中"内置 Git 的暂存/提交"改为"内置 Git 的 Add/提交"；en 同名文案不变。 | locales.ts:314 zh-CN pluginGitRemotesDesc 现为「不替换内置 Git 的 Add/提交」；622 的 en 同名文案仍为 'built-in Git stage/commit tab' 未改。 |
| A19 | passed | brief.md | A19 stash 操作（Stash / Pop / Apply / Drop）失败时，错误信息显示在 Stash 区块内部，不再出现在提交框下方的错误区；commit、discard、revert、cherry-pick 的错误展示位置不变。 | GitView.tsx:139 新增 stashError 状态，667 在 Stash 区块头部下方渲染 css.gitError；runStashAction(255/260) 写入 stashError，Drop 经 runConfirmed(406) 的新第二参 reportError 传入 setStashError(833)；runConfirmed 默认参数仍为 setCommitError，discard/revert/cherry-pick 调用点未传第二参，commit 等路径的 setCommitError 未改。git-view 用例断言 pop 失败时含该文案的 gitError 节点恰有 1 个且位于 Stash 区块内。 |
| A20 | passed | brief.md | A20 一次成功的 stash 操作会清掉 Stash 区块内的上一条错误信息。 | runStashAction(255) 每次操作开始即 setStashError(null)；git-view 用例在 pop 失败后再点一次 Stash，断言错误文案已从容器中消失。 |
| A21 | passed | specs/git-changes-panel/spec.md | 侧边栏 Git 面板中与工作区改动相关的部分：三个改动分组（已 Add / 未 Add / 未跟踪）、Stash 区块，以及它们的文案。归档后本 Spec 描述该能力的完整行为。 | 该能力已按 Spec 实现：三个改动分组沿用原判定逻辑仅换文案，新增 Stash 区块、主机侧接口与就近错误展示，逐项证据见 A22-A45。 |
| A22 | passed | specs/git-changes-panel/spec.md | 面板在仓库有效时自顶向下渲染：全部还原入口（有可还原文件时）、`已 Add`、`未 Add`、`未跟踪`、`Stash`、提交输入框、历史。 | GitView.tsx 渲染顺序：全部还原入口(579)、git-staged-changes(594)、git-unstaged-changes(613)、git-untracked-changes(632)、git-stash-entries(652)、gitCommit(687)、history(710)。 |
| A23 | passed | specs/git-changes-panel/spec.md | `已 Add`：porcelain XY 的 X 位非空且非 `?` 的条目。区块头在非空时提供「全部取消 Add」。 | GitView.tsx:33-36 isStagedEntry 判 X 位非空非 ?；区块头非空时按钮为 t('unstageAll') = 「全部取消 Add」。 |
| A24 | passed | specs/git-changes-panel/spec.md | `未 Add`：Y 位非空且非 `?`、且不是未跟踪的条目。区块头在非空时提供「全部 Add」。 | GitView.tsx:452 unstagedEntries = isUnstagedEntry && !isUntracked；区块头按钮 t('stageAll') = 「全部 Add」。 |
| A25 | passed | specs/git-changes-panel/spec.md | `未跟踪`：XY 为 `??` 的条目。区块头在非空时提供「全部 Add」。 | GitView.tsx:453 untrackedEntries = filter(isUntracked)（badgeOf 为 '?' 即 ??）；区块头按钮 t('stageAll') = 「全部 Add」。 |
| A26 | passed | specs/git-changes-panel/spec.md | 三个区块各自可折叠，折叠状态互不影响；为空时显示统一空态文案。 | 三区块 aria-expanded 各绑定 expandedSections 独立字段，toggleSection 只翻转对应键；空时均渲染 t('noChanges')；git-view 既有折叠用例仍通过。 |
| A27 | passed | specs/git-changes-panel/spec.md | 文件行右键菜单：打开编辑器、Add / 取消 Add（按所在区块）、放弃（未跟踪文件除外）、复制路径。 | GitView.tsx 文件行菜单项为 open / stage(标签随 t('stage')\|t('unstage') 显示 Add\|取消 Add) / discard(非未跟踪时) / relative / absolute，结构未改。 |
| A28 | passed | specs/git-changes-panel/spec.md | 位置在 `未跟踪` 之后、提交输入框之前，与其他区块同样可折叠且折叠状态独立。 | 见 A5：位于 git-untracked-changes 之后、gitCommit 之前，expandedSections.stash 为独立折叠状态。 |
| A29 | passed | specs/git-changes-panel/spec.md | 标题为 `Stash (n)`，n 为当前 stash 栈的条目数；n 为 0 时区块内显示统一空态文案。 | GitView.tsx:654 标题 {t('stash')} ({stashEntries.length})；668 空栈渲染 t('noChanges')；git-view 用例断言渲染出 'Stash (2)'。 |
| A30 | passed | specs/git-changes-panel/spec.md | 区块头提供 Stash 按钮：点击后执行 `git stash push --include-untracked`，把已 Add、未 Add 与未跟踪的改动一并存入栈顶。三个改动区块都为空，或面板正忙时按钮禁用。 | GitView.tsx:655-663 头部按钮调 api.gitStash → 路由 git.stash → git.ts:237 stash push --include-untracked；disabled={busy \|\| changedCount === 0}；git.spec.ts 用例证明已跟踪改动与未跟踪文件一并入栈。 |
| A31 | passed | specs/git-changes-panel/spec.md | 每个条目显示其 ref（`stash@{n}`）与描述信息（`WIP on <branch>: ...`），按栈顺序自顶向下排列，栈顶在最上。 | GitView.tsx:669-683 每行渲染 css.gitLogHash 的 ref 与 css.gitName 的 message；顺序即 stashList 返回顺序（git stash list 栈顶 stash@{0} 在先）；git-view 用例断言首行含 stash@{0}、次行含 stash@{1}。 |
| A32 | passed | specs/git-changes-panel/spec.md | 条目右键菜单三项： | GitView.tsx:807-810 菜单 items 恰为 pop、apply、drop 三项（中间一条 separator）。 |
| A33 | passed | specs/git-changes-panel/spec.md | Pop：`git stash pop <ref>`，恢复该条并从栈中移除； | GitView.tsx:816-819 → api.gitStashPop → 路由 git.stash-pop → git.ts:250-252 runGit(['stash','pop',ref])；git.spec.ts 验证 pop 后改动与未跟踪文件均复原且栈清空。 |
| A34 | passed | specs/git-changes-panel/spec.md | Apply：`git stash apply <ref>`，恢复该条但保留在栈中； | GitView.tsx:820-823 → api.gitStashApply → 路由 git.stash-apply → git.ts:255-257 runGit(['stash','apply',ref])，不移除栈条目。 |
| A35 | passed | specs/git-changes-panel/spec.md | Drop：`git stash drop <ref>`，丢弃该条。不可逆，先弹既有确认弹窗，用户确认后才执行。 | GitView.tsx:826-833 drop 经 runConfirmed 弹窗（title=t('stashDropTitle')、desc=t('stashDropDesc',{ref})），确认回调才调 api.gitStashDrop → git.ts:260-262 runGit(['stash','drop',ref])。 |
| A36 | passed | specs/git-changes-panel/spec.md | 任一 stash 操作成功后刷新工作区 status 与 stash 列表，并清掉区块内的上一条错误信息；失败时把 git 错误就近显示在 Stash 区块内部（不进提交框下方的错误区），不静默忽略。 | runStashAction(253-265) 与 runConfirmed(406-420) 成功后都 await refresh()（同时重取 gitStatus 与 gitStashList），且开始时把 stashError 置空；失败写入 stashError，由 667 的 css.gitError 在区块内展示；git-view 用例断言该错误节点唯一且落在 Stash 区块内、成功后消失。 |
| A37 | passed | specs/git-changes-panel/spec.md | `src/git.ts` 经 `runGit` 提供： | git.ts:236/241/250/255/260 五个函数体内唯一的 git 调用均为 runGit(cwd, [...])，无其他执行路径。 |
| A38 | passed | specs/git-changes-panel/spec.md | `stash(cwd)` → `git stash push --include-untracked` | git.ts:237 runGit(cwd, ['stash','push','--include-untracked'])。 |
| A39 | passed | specs/git-changes-panel/spec.md | `stashList(cwd)` → `{ ref, message }[]`，空栈为空数组 | git.ts:241-247 返回 GitStashEntry[]（{ref,message}）；git.spec.ts 断言空栈为 []。 |
| A40 | passed | specs/git-changes-panel/spec.md | `stashPop(cwd, ref)` / `stashApply(cwd, ref)` / `stashDrop(cwd, ref)` | git.ts:250-262 三个函数签名均为 (cwd, ref)，分别执行 stash pop/apply/drop。 |
| A41 | passed | specs/git-changes-panel/spec.md | wire 路由：`git.stash`、`git.stash-list`、`git.stash-pop`、`git.stash-apply`、`git.stash-drop`，scope 解析与错误处理与既有 git 路由一致。客户端对应 `api.gitStash` / `gitStashList` / `gitStashPop` / `gitStashApply` / `gitStashDrop`。 | src/index.ts:317-340 五条路由名与 Spec 一致，均用 cwdOf(payload) 解析 scope；ref 经 requireStashRef(97-101) 以 /^stash@\{\d+\}$/ 校验后才进入 argv；api.ts 五个方法名与 Spec 一致。 |
| A42 | passed | specs/git-changes-panel/spec.md | zh-CN 使用 Add 措辞表示 git index，避免与 stash 混淆：`Add`、`取消 Add`、`全部 Add`、`全部取消 Add`、`已 Add`、`未 Add`、`未跟踪`；「全部还原」描述文案中同样使用「取消 Add」。stash 相关文案使用 `Stash`、`Pop`、`Apply`、`Drop`。 | locales.ts:73-76、133-135 为 Add / 取消 Add / 全部 Add / 全部取消 Add / 已 Add / 未 Add / 未跟踪；150 discardAllDesc 使用「取消 Add」；77-83 stash 文案为 Stash / 存入 Stash / Pop / Apply / Drop。 |
| A43 | passed | specs/git-changes-panel/spec.md | en 保留 git 官方术语：`Stage`、`Unstage`、`Stage all`、`Unstage all`、`Staged`、`Unstaged`、`Untracked`，以及同名的 stash 文案。 | locales.ts:381-384、441-443 保持 Stage/Unstage/Stage all/Unstage all/Staged/Unstaged/Untracked；385-391 为同名 stash 文案（stashSave 英文作 'Stash all'）。 |
| A44 | passed | specs/git-changes-panel/spec.md | 两套 locale 的 key 集合完全一致。zh-CN 的 `pluginGitRemotesDesc` 同样使用「内置 Git 的 Add/提交」。 | zh 与 en 新增 key 集合相同，tests/locales.spec.ts 的 parity 断言随 pnpm test 通过；locales.ts:314 zh-CN pluginGitRemotesDesc 已改为「内置 Git 的 Add/提交」。 |
| A45 | passed | specs/git-changes-panel/spec.md | `README.md` 的 Git 面板功能介绍行与界面措辞保持一致（Add 而非暂存，并写明 stash / pop）；`README_EN.md` 和历史 changelog 条目保留原文。 | README.md:27 已与界面一致（Add + stash / pop）；README_EN.md 未改（无中文「暂存」），README.md:93 的历史 changelog 条目按非目标保留原文。 |

## Checks

| Check | Command | Working directory | Status | Exit | Duration |
| --- | --- | --- | --- | ---: | ---: |
| pnpm typecheck | typecheck | . | passed | 0 | 1958 ms |
| pnpm test | test | . | passed | 0 | 8245 ms |

## Blockers

- **user**: The generic Skill bridge cannot prove an independent Verifier execution; user confirmation is required before Archive. — next: `await-user`

## Risks and skipped work

- README.md:93 的历史 changelog 条目与 172 行的脚本注释仍含「暂存」，按已确认非目标保留。

## Previous iterations

| Goal cycle | Iteration | Attempt | Outcome | Unresolved | Summary | Completed |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 1 | pass | — | 40 项验收全部通过。Runtime 检查 pnpm typecheck 与 pnpm test 均 exit 0；实现证据逐项落到 src/git.ts、src/index.ts、src/client/api.ts、src/client/GitView.tsx、src/client/locales.ts 的具体行，以及 tests/git.spec.ts 的真实仓库 stash/pop 往返用例与 tests/git-view.spec.tsx 的四个 Stash UI 用例。 | 2026-08-25T04:09:31.872Z |
| 1 | 1 | 1 | recovery | — | 用户要求把两处已知问题纳入需求：README.md 的中文暂存措辞需与界面 Add 措辞一致；stash 操作失败信息需就近展示在 Stash 区块内，不再复用提交框下方的错误区。验收标准与 Scope 变化，回到 Shape。 | 2026-08-25T06:42:51.009Z |
| 2 | 1 | 1 | pass | — | 45 项验收全部通过。Runtime 本轮 pnpm typecheck 与 pnpm test 均 exit 0（64 文件 / 659 通过）。第 2 轮新增的 A17/A18 文案对齐与 A19/A20 stash 错误就近展示均已逐项落到具体实现行与新增测试用例。 | 2026-08-25T06:46:57.625Z |

## Conclusion

45 项验收全部通过。Runtime 本轮 pnpm typecheck 与 pnpm test 均 exit 0（64 文件 / 659 通过）。第 2 轮新增的 A17/A18 文案对齐与 A19/A20 stash 错误就近展示均已逐项落到具体实现行与新增测试用例。
