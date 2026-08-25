# Git 面板：改动区块与 Stash

侧边栏 Git 面板中与工作区改动相关的部分：三个改动分组（已 Add / 未 Add / 未跟踪）、Stash 区块，以及它们的文案。归档后本 Spec 描述该能力的完整行为。

## 改动分组

面板在仓库有效时自顶向下渲染：全部还原入口（有可还原文件时）、`已 Add`、`未 Add`、`未跟踪`、`Stash`、提交输入框、历史。

- `已 Add`：porcelain XY 的 X 位非空且非 `?` 的条目。区块头在非空时提供「全部取消 Add」。
- `未 Add`：Y 位非空且非 `?`、且不是未跟踪的条目。区块头在非空时提供「全部 Add」。
- `未跟踪`：XY 为 `??` 的条目。区块头在非空时提供「全部 Add」。
- 三个区块各自可折叠，折叠状态互不影响；为空时显示统一空态文案。
- 文件行右键菜单：打开编辑器、Add / 取消 Add（按所在区块）、放弃（未跟踪文件除外）、复制路径。

## Stash 区块

- 位置在 `未跟踪` 之后、提交输入框之前，与其他区块同样可折叠且折叠状态独立。
- 标题为 `Stash (n)`，n 为当前 stash 栈的条目数；n 为 0 时区块内显示统一空态文案。
- 区块头提供 Stash 按钮：点击后执行 `git stash push --include-untracked`，把已 Add、未 Add 与未跟踪的改动一并存入栈顶。三个改动区块都为空，或面板正忙时按钮禁用。
- 每个条目显示其 ref（`stash@{n}`）与描述信息（`WIP on <branch>: ...`），按栈顺序自顶向下排列，栈顶在最上。
- 条目右键菜单三项：
  - Pop：`git stash pop <ref>`，恢复该条并从栈中移除；
  - Apply：`git stash apply <ref>`，恢复该条但保留在栈中；
  - Drop：`git stash drop <ref>`，丢弃该条。不可逆，先弹既有确认弹窗，用户确认后才执行。
- 任一 stash 操作成功后刷新工作区 status 与 stash 列表，并清掉区块内的上一条错误信息；失败时把 git 错误就近显示在 Stash 区块内部（不进提交框下方的错误区），不静默忽略。

## 主机侧接口

`src/git.ts` 经 `runGit` 提供：

- `stash(cwd)` → `git stash push --include-untracked`
- `stashList(cwd)` → `{ ref, message }[]`，空栈为空数组
- `stashPop(cwd, ref)` / `stashApply(cwd, ref)` / `stashDrop(cwd, ref)`

wire 路由：`git.stash`、`git.stash-list`、`git.stash-pop`、`git.stash-apply`、`git.stash-drop`，scope 解析与错误处理与既有 git 路由一致。客户端对应 `api.gitStash` / `gitStashList` / `gitStashPop` / `gitStashApply` / `gitStashDrop`。

## 文案

zh-CN 使用 Add 措辞表示 git index，避免与 stash 混淆：`Add`、`取消 Add`、`全部 Add`、`全部取消 Add`、`已 Add`、`未 Add`、`未跟踪`；「全部还原」描述文案中同样使用「取消 Add」。stash 相关文案使用 `Stash`、`Pop`、`Apply`、`Drop`。

en 保留 git 官方术语：`Stage`、`Unstage`、`Stage all`、`Unstage all`、`Staged`、`Unstaged`、`Untracked`，以及同名的 stash 文案。

两套 locale 的 key 集合完全一致。zh-CN 的 `pluginGitRemotesDesc` 同样使用「内置 Git 的 Add/提交」。

`README.md` 的 Git 面板功能介绍行与界面措辞保持一致（Add 而非暂存，并写明 stash / pop）；`README_EN.md` 和历史 changelog 条目保留原文。
