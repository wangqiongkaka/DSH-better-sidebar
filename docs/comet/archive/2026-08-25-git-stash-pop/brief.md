# Outcome

Git 面板新增 stash / pop 能力（含 Stash 列表区块），并把中文界面里表示 git index 的"暂存"文案统一改成 Add 措辞，使 add（暂存区）与 stash（储藏栈）在界面上不再混淆。

# Scope

- `src/git.ts`：新增 stash 保存、列表、pop、apply、drop 的 git 命令封装。
- `src/index.ts`：新增对应 wire 路由。
- `src/client/api.ts`：新增客户端调用方法。
- `src/client/GitView.tsx`：新增可折叠 Stash 区块与右键菜单入口。
- `src/client/locales.ts`：zh-CN 文案由"暂存"改为 Add 措辞，新增 stash 相关文案；en 新增 stash 文案。
- `README.md`：中文功能介绍行的暂存措辞与界面对齐。
- `tests/`：新增/更新对应测试。

# Non-goals

- 不改动 commit、discard、worktree、history 等既有功能的行为。
- 不新增模型可调用的 git 工具（`src/tools.ts` 现无 git 工具，保持现状）。
- 不支持点击 stash 条目打开 diff tab（本次不动 `DiffTab` 取数路径）。
- 不支持 `git stash push -- <path>` 的按文件 stash。
- 不改动英文 locale 的 Staged / Unstaged 术语，`README_EN.md` 同样不动。
- 不改 `README.md` 中历史 changelog 条目（第 93 行等）的原文——那是当时发布的记录。

# Acceptance examples

- A1 `src/git.ts` 导出 `stash`、`stashList`、`stashPop`、`stashApply`、`stashDrop`，全部经 `runGit` 执行；`stash` 使用 `git stash push --include-untracked`。
- A2 `stashList` 返回条目数组，每项含 `ref`（如 `stash@{0}`）与 `message`（如 `WIP on yy-main: ...`），空栈返回空数组。
- A3 `src/index.ts` 新增 `git.stash`、`git.stash-list`、`git.stash-pop`、`git.stash-apply`、`git.stash-drop` 五个路由，与既有 git 路由同样的 scope/错误处理方式。
- A4 `src/client/api.ts` 新增 `gitStash`、`gitStashList`、`gitStashPop`、`gitStashApply`、`gitStashDrop` 并调用上述路由。
- A5 GitView 在"未跟踪"区块之后、提交输入框之前渲染一个可折叠区块，标题为 `Stash (n)`，n 为 stash 条目数；折叠状态与其他三个区块相互独立。
- A6 Stash 区块为空时显示与其他区块一致的空态文案（`noChanges`）。
- A7 Stash 区块头部有 Stash 按钮；工作区没有任何改动（三个区块都为空）或正忙时该按钮禁用。
- A8 点击 Stash 按钮后调用 `gitStash`，成功后刷新 status 与 stash 列表；成功时"已 Add / 未 Add / 未跟踪"三区块清空，新条目出现在 Stash 区块顶部。
- A9 stash 条目右键弹出菜单，含 Pop、Apply、Drop 三项，分别对该条 `ref` 调用 `gitStashPop`、`gitStashApply`、`gitStashDrop`。
- A10 Drop 走既有确认弹窗（`runConfirmed`）后才执行；Pop 与 Apply 不弹确认。
- A11 stash 相关操作失败时以既有 git 错误展示方式呈现，不静默吞掉。
- A12 zh-CN 文案：`staged`→`已 Add`、`unstaged`→`未 Add`、`stage`→`Add`、`unstage`→`取消 Add`、`stageAll`→`全部 Add`、`unstageAll`→`全部取消 Add`，`discardAllDesc` 中的"取消暂存"同步改为"取消 Add"。
- A13 en locale 的 `staged`/`unstaged`/`stage`/`unstage`/`stageAll`/`unstageAll` 保持原文不变。
- A14 zh-CN 与 en 新增的 stash 文案 key 一一对应，`tests/locales.spec.ts` 通过。
- A15 新增测试覆盖：Stash 区块渲染条目数与条目文本、Stash 按钮触发 `gitStash`、Pop 菜单项触发 `gitStashPop`。
- A16 `pnpm typecheck` 与 `pnpm test` 全部通过。
- A17 `README.md` 的 Git 面板功能介绍行不再出现"暂存"，改用 Add 措辞并写明 stash / pop；`README_EN.md` 与 `README.md` 的历史 changelog 条目不变。
- A18 `src/client/locales.ts` 的 zh-CN `pluginGitRemotesDesc` 中"内置 Git 的暂存/提交"改为"内置 Git 的 Add/提交"；en 同名文案不变。
- A19 stash 操作（Stash / Pop / Apply / Drop）失败时，错误信息显示在 Stash 区块内部，不再出现在提交框下方的错误区；commit、discard、revert、cherry-pick 的错误展示位置不变。
- A20 一次成功的 stash 操作会清掉 Stash 区块内的上一条错误信息。

# Constraints and invariants

- 沿用现有分层：`git.ts` 封装命令 → `index.ts` wire 路由 → `api.ts` 客户端方法 → `GitView.tsx` UI；不引入新依赖。
- 所有 git 调用经 `runGit`，错误经 `GitCommandError` 返回。
- zh-CN 与 en 两套 locale 的 key 必须保持一致（`tests/locales.spec.ts` 校验）。
- Stash 区块沿用既有 `css.gitSection` / `gitSectionHeader` / `gitSectionToggle` 样式与 `Menu` 组件，不新增样式体系。

# Decisions

- 工作区隔离方式：`current`（当前目录、当前分支 `yy-main`），工作区干净且无并行需求。
- Q1 中文措辞：直接用英文原词 Add——「已 Add / 未 Add / Add / 取消 Add / 全部 Add / 全部取消 Add」。理由：与 Stash 并列时最不容易混淆，且贴合用户"改成 add"的原话。
- Q2 英文 locale：保持 Staged / Unstaged 不变。理由：英文里 staged 与 stash 本就是 git 官方术语，不存在歧义。
- Q3 Stash UI 范围：顶部 Stash 按钮 + 可折叠 Stash 列表区块，条目右键 Pop / Apply / Drop。理由：能看到栈里还有几条，避免存了就忘。
- Q4 stash 包含未跟踪文件（`--include-untracked`）。理由：面板上有"未跟踪"区块，若不收进来点了 Stash 会像没生效。
- 区块位置：Stash 区块放在"未跟踪"之后、提交输入框之前，与其余工作区状态区块相邻。
- Drop 为不可逆操作，复用既有确认弹窗；Pop / Apply 不弹确认。
- stash 错误就近展示：错误信息属于 Stash 区块，放在提交框下方离触发点太远。

# Open questions

# Verification expectations

- `pnpm typecheck`
- `pnpm test`
