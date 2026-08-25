# Outcome

DSH 侧边栏 Git 面板支持 Git tag 的日常操作：面板内可以查看仓库的全部 tag、在 HEAD 或任意历史提交上创建 tag、删除本地 tag、把 tag 推送到远端，不需要切到终端敲 `git tag`。

# Scope

- Git 面板新增可折叠的「Tag」区块，位于 Stash 区块之后、提交输入框之前，列出仓库的全部 tag。
- 区块头的「新建 Tag」按钮在当前 HEAD 上创建 tag；历史提交右键菜单新增「在此提交创建 Tag」，在指定提交上创建。
- 创建弹窗中 Tag 名必填、描述选填：填了描述创建附注 tag（`git tag -a -m`），留空创建轻量 tag（`git tag`）。
- tag 行的上下文菜单提供：推送到远端、复制 Tag 名、删除本地 tag。
- 主机侧新增 `tags` / `createTag` / `deleteTag` / `pushTag`，以及对应的 wire 路由与客户端 api 方法。
- 新增 zh-CN 与 en 两份文案，新增主机侧与面板两层测试。

# Non-goals

- 删除远端 tag（`git push --delete`）。
- 检出 tag（会进入 detached HEAD）。
- 重命名或强制移动已有 tag（`git tag -f`）。
- 从远端拉取 tag（现有 fetch 行为不变）。
- 历史行已有的 tag 装饰名显示（`GitLogEntry.refs`）不做改动。
- 一次推送全部 tag（`git push --tags`）。

# Acceptance examples

## 主机侧 Git 能力（src/git.ts）

- A1 `tags(cwd)` 返回 `{ name, subject }[]`，按 creatordate 倒序（最新创建在最前）；仓库没有 tag 时返回空数组。
- A2 附注 tag 的 `subject` 是附注消息首行；轻量 tag 的 `subject` 是其所指提交的 subject。
- A3 `createTag(cwd, name)` 在 message 为空时执行 `git tag <name>` 创建轻量 tag；message 非空时执行 `git tag -a <name> -m <message>` 创建附注 tag。
- A4 `createTag` 传入 commit 时 tag 指向该提交；不传时指向 HEAD。
- A5 `deleteTag(cwd, name)` 执行后 `tags()` 不再包含该名字。
- A6 `pushTag(cwd, name)` 推送到远端：已配置 `origin` 时用 `origin`，否则用第一个已配置远端；没有任何远端时抛 `GitCommandError`，不静默视为成功。

## wire 路由（src/index.ts）

- A7 注册 `git.tag-list`、`git.tag-create`、`git.tag-delete`、`git.tag-push` 四个路由，scope 解析与错误映射与既有 git 路由一致。
- A8 tag 名校验拒绝 git 本身不接受的名字——为空，以 `-`、`.`、`/` 开头，含空格、控制字符或 `~^:?*[\` 中任一字符，含 `..`、`@{`、`//`，以 `/`、`.`、`.lock` 结尾——返回 `bad-request` 且不执行任何 git 命令。
- A9 `git.tag-create` 的 commit 参数必须是 40 位十六进制全 hash，否则返回 `bad-request`。

## 客户端接口（src/client/api.ts）

- A10 新增 `gitTags`、`gitTagCreate`、`gitTagDelete`、`gitTagPush`，分别调用上述四个路由。

## Tag 区块（src/client/GitView.tsx）

- A11 Tag 区块位于 Stash 区块之后、提交输入框之前，可折叠，且折叠状态与其他区块互相独立。
- A12 标题为 `Tag (n)`，n 为当前 tag 数；n 为 0 时区块内显示与 Stash 相同的统一空态文案。
- A13 每行显示 tag 名与其 subject，最新创建的排在最上。
- A14 区块头提供「新建 Tag」按钮，点击打开创建弹窗；面板正忙时禁用。
- A15 tag 行左键点击与右键都打开该行的上下文菜单（与 Stash 行一致）。
- A16 tag 行菜单包含三项：推送到远端、复制 Tag 名、删除（danger 样式）。
- A17 删除先弹出既有确认 Modal，用户确认后才执行；取消时不执行任何 git 命令。
- A18 推送到远端先弹出既有确认 Modal，用户确认后才执行。
- A19 复制 Tag 名把 tag 名写入剪贴板，不触发任何 git 命令。

## 创建弹窗

- A20 弹窗含必填的 Tag 名输入框与选填的描述输入框；Tag 名为空时创建按钮禁用。
- A21 描述非空时创建附注 tag；描述为空时创建轻量 tag。
- A22 从「新建 Tag」按钮打开时目标是当前 HEAD；从历史行菜单打开时目标是该提交，且弹窗内显示该提交的短 hash 与 subject。
- A23 创建成功后关闭弹窗、清空输入，并刷新 tag 列表与历史。

## 历史右键菜单

- A24 历史提交右键菜单新增「在此提交创建 Tag」，位于三个复制项之后、还原/捡取分隔线之前。
- A25 既有菜单项（查看提交差异、复制短 hash、复制完整 hash、复制标题、还原此提交、捡取此提交）的存在与相对顺序不变。

## 错误与刷新

- A26 任一 tag 操作成功后刷新 tag 列表与工作区状态，并清掉 Tag 区块内上一条错误信息。
- A27 tag 操作失败时，git 错误就近显示在 Tag 区块内部，不进入提交框下方的错误区，也不静默忽略。
- A28 创建弹窗内的操作失败时错误显示在弹窗内，弹窗不关闭且输入保留，用户可改名重试。

## 文案

- A29 zh-CN 与 en 两份 locale 的 key 集合完全一致，新增的全部 tag 文案两边都有。
- A30 zh-CN 的 tag 文案统一使用「Tag」术语，与 Stash 区块的措辞风格一致。

## 测试与检查

- A31 `tests/git.spec.ts` 新增真实仓库用例：创建轻量与附注 tag → `tags()` 返回两条且 subject 分别为提交 subject 与附注首行 → 删除其中一个后列表不再含它。
- A32 `tests/git-view.spec.tsx` 新增用例覆盖：Tag 区块渲染 tag 行；新建 Tag 弹窗填名创建后调用 `api.gitTagCreate`；历史行右键菜单含「在此提交创建 Tag」；tag 操作失败时 `gitError` 节点位于 Tag 区块内。
- A33 `pnpm typecheck` 与 `pnpm test` 全部通过。

# Constraints and invariants

- 沿用仓库现有 Git 能力的分层：`src/git.ts` 经 `runGit` 导出纯函数 → `src/index.ts` 注册 `git.*` 路由并校验入参 → `src/client/api.ts` 暴露 `gitXxx` 方法 → `src/client/GitView.tsx` 渲染 → `src/client/locales.ts` 同步 zh-CN 与 en。
- 破坏性与外发操作必须先经 `runConfirmed` 的确认 Modal（参照 `stashDrop` / `revert`）。
- 操作失败信息就近展示在所属区块内（参照 `stashError` 的 `css.gitError`），不复用提交框下方的错误区。
- tag 名来自用户输入，必须像 `requireStashRef` 那样在路由层校验后才交给 git，避免以 `-` 开头的名字被当作 git 参数。
- 现状事实：历史行已通过 `git log --decorate=short` 的 `%D`（`GitLogEntry.refs`）渲染 tag 装饰名，因此 tag 已可见但完全不可操作；本需求解决的是「操作」。
- 现状事实：`git for-each-ref` 不支持 `-z`（已在 git 2.50.1 实测），因此 tag 列表按行解析，字段用 `%1f` 分隔；tag 名与 `%(contents:subject)` 都不含换行，按行解析是安全的。
- 测试沿用现有两层：`tests/git.spec.ts`（真实临时仓库）与 `tests/git-view.spec.tsx`（面板 UI）。

# Decisions

- 入口形态：独立 Tag 区块 + 历史提交右键菜单两者都要。区块负责总览与删除/推送，历史菜单负责给旧提交精准补打 tag。
- 操作集合：列出、创建、删除本地 tag、推送单个 tag 到远端。不做删除远端 tag，不做检出 tag——检出会进入 detached HEAD，容易让人迷失在游离头指针上。
- 创建形式：描述选填。填了描述就是附注 tag，留空就是轻量 tag，一个弹窗覆盖两种用法。
- 推送远端的选择：优先 `origin`，否则第一个已配置远端。既覆盖绝大多数仓库，也不会在远端叫别的名字时直接失效。
- tag 列表排序按 creatordate 倒序，与分支列表按 committerdate 倒序的既有习惯一致。

# Open questions

（无未解决问题；用户已确认目标、范围、关键决定、验收标准与非目标）

# Verification expectations

- `pnpm typecheck` 与 `pnpm test` 均通过。
- Tag 区块与创建弹窗的行为由 `tests/git-view.spec.tsx` 覆盖；主机侧 tag 行为由 `tests/git.spec.ts` 在真实临时仓库中覆盖。
