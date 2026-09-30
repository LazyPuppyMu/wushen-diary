# AI 工作手册

## 开始顺序

开始任何仓库任务前，按以下顺序读取：

1. 根目录 `AGENTS.md`。
2. `docs/engineering/PROJECT_BASELINE.md`。
3. `docs/engineering/AI_PLAYBOOK.md`。
4. 当前 GitHub Issue。
5. 与任务相关的 `docs/engineering/CONTRACTS.md`、`docs/engineering/DECISIONS.md`、`docs/api-contract.md` 和源文件。

没有 GitHub Issue 时，不开始修改代码或正式文档；先补齐 Issue 的目标、边界和验收条件。

## 开始前复述

AI 必须先用自己的话说明：

- 要解决的一个问题。
- 明确不做的内容。
- 准备修改的目录和文件。
- 完成后运行的最小验证命令。

如果基线、契约和源代码互相冲突，暂停修改并把冲突交给用户决定。

## 执行规则

- 一次只处理一个 Issue，不顺手重构无关文件。
- 只修改 Issue 批准的目录；公共接口变化必须先更新 `docs/api-contract.md` 并说明原因。
- 按小功能完成和验证，不一次重写整个项目。
- 日记只在用户确认后发送；API 不持久化日记，不记录日记原文、Prompt、完整 AI 输出或 Authorization。
- AI 结论必须带精确 quote；模型不能生成 `start/end`，后端计算并拒绝找不到的 quote。
- 不添加哈希、SHA-256、登录、云端数据库、向量库、多 Agent、推送或社交功能。

## 验证规则

每个小功能完成后运行对应的最小测试，并记录：

- 修改文件。
- 测试命令和结果。
- 未完成项、未验证项和已知风险。

错误响应、占位结果和 mock 数据不能被描述为真实 AI 结果。没有真实 provider 配置时，应明确说明整理接口会返回 `503`。

## 结束规则

提交前检查 Git 状态和 diff，确认修改没有越过目录边界。AI 可以创建提交和 Pull Request；合并须经过审查，并获得用户对该次合并的明确授权或委托。日常功能不能直接推送到 `dev` 或 `main`。
