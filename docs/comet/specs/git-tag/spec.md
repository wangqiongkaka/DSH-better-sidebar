# Git 面板：Tag

侧边栏 Git 面板中与 Git tag 相关的部分：Tag 区块、创建 Tag 弹窗、历史提交右键菜单的建 Tag 入口，以及支撑它们的主机侧能力与文案。归档后本 Spec 描述该能力的完整行为。

## Tag 区块

- 位置在 Stash 区块之后、提交输入框之前，与其他区块同样可折叠且折叠状态独立。
- 标题为 `Tag (n)`，n 为仓库当前的 tag 数；n 为 0 时区块内显示与其他区块相同的统一空态文案。
- 每个条目显示 tag 名与其 subject：附注 tag 显示附注消息首行，轻量 tag 显示所指提交的 subject。条目按创建时间倒序排列，最新的在最上；创建时间相同（git 的时间戳精确到秒）时由 git 按 ref 名升序决定先后。
- 区块头提供「新建 Tag」按钮：点击打开创建 Tag 弹窗，目标为当前 HEAD。面板正忙时按钮禁用。
- 条目的上下文菜单在左键点击与右键点击时都会打开（与 Stash 行一致），包含三项：
  - 推送到远端：把该 tag 推送到远端。属于外发操作，先弹既有确认弹窗，用户确认后才执行；
  - 复制 Tag 名：把 tag 名写入剪贴板，不触发任何 git 命令；
  - 删除：删除本地 tag。先弹既有确认弹窗，用户确认后才执行。
- 任一 tag 操作成功后刷新 tag 列表与工作区 status，并清掉区块内的上一条错误信息；失败时把 git 错误就近显示在 Tag 区块内部（不进提交框下方的错误区），不静默忽略。

## 创建 Tag 弹窗

- 含两个输入框：Tag 名必填，描述选填。Tag 名为空时创建按钮禁用。
- 描述非空时创建附注 tag（`git tag -a <name> -m <message>`）；描述为空时创建轻量 tag（`git tag <name>`）。
- 目标提交由打开方式决定：从区块头的「新建 Tag」打开时目标是当前 HEAD，弹窗不显示目标提交；从历史行菜单打开时目标是该提交，弹窗内显示它的短 hash 与 subject。
- 创建成功后关闭弹窗、清空两个输入框，并刷新 tag 列表与历史。
- 创建失败时错误显示在弹窗内部，弹窗保持打开且输入保留，用户可以改名后重试。

## 历史提交右键菜单

菜单项自上而下为：查看提交差异、复制短 hash、复制完整 hash、复制标题、分隔线、还原此提交、捡取此提交。在复制标题与分隔线之间新增一项「在此提交创建 Tag」，点击后打开创建 Tag 弹窗并以该提交为目标。其余菜单项的存在与相对顺序不变。

历史行本身继续通过 `git log --decorate=short` 的 `%D`（`GitLogEntry.refs`）渲染 tag 与分支的装饰名，该显示不受本能力影响。

## 主机侧接口

`src/git.ts` 经 `runGit` 提供：

- `tags(cwd)` → `{ name, subject }[]`：`git for-each-ref --sort=-creatordate --format=%(refname:short)%1f%(contents:subject) refs/tags`，按行解析、`%1f` 分字段；没有 tag 时为空数组。`git for-each-ref` 不支持 `-z`，因此不使用 NUL 分隔；tag 名与 `%(contents:subject)` 均不含换行，按行解析是安全的。
- `createTag(cwd, name, message?, commit?)` → message 为空走 `git tag <name> [<commit>]`，非空走 `git tag -a <name> -m <message> [<commit>]`；不传 commit 时指向 HEAD。
- `deleteTag(cwd, name)` → `git tag -d <name>`。
- `pushTag(cwd, name)` → 推送单个 tag。远端优先取 `origin`，否则取 `git remote` 列出的第一个；一个远端都没有时抛 `GitCommandError`，不静默视为成功。

wire 路由：`git.tag-list`、`git.tag-create`、`git.tag-delete`、`git.tag-push`，scope 解析与错误处理与既有 git 路由一致。

路由层的入参校验与 `requireStashRef` 同级：

- tag 名为空时由通用的字符串入参校验拒绝；以 `-`、`.`、`/` 开头，含空格、控制字符或 `~^:?*[\` 中任一字符，含 `..`、`@{`、`//`，或以 `/`、`.`、`.lock` 结尾时，返回 `bad-request` 且不执行任何 git 命令。这些正是 git 自身拒绝的 ref 名，同时挡住以 `-` 开头的名字被当作 git 参数解析。
- `git.tag-create` 的 commit 参数必须是 40 位十六进制全 hash，否则返回 `bad-request`。

客户端对应 `api.gitTags`、`api.gitTagCreate`、`api.gitTagDelete`、`api.gitTagPush`。

## 文案

zh-CN 与 en 两套 locale 的 key 集合完全一致。zh-CN 的 tag 文案统一使用「Tag」术语，与 Stash 区块的措辞风格保持一致；en 使用 git 官方术语。

## 不属于本能力

删除远端 tag、检出 tag、重命名或强制移动已有 tag、从远端拉取 tag，以及一次推送全部 tag，都不在本能力范围内。
