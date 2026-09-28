# Project Instructions

- Windows commands use PowerShell 7 by default; Linux scripts use WSL2 Ubuntu.
- Do not use Bash heredocs in PowerShell. Put complex scripts in files.
- Windows and WSL must not share `node_modules` or Python virtual environments.
- Keep the 48-hour version small and understandable; avoid speculative defensive code.
- Do not add hashes or SHA-256 checks unless a specific requirement needs them.
- Diary entries stay in the browser. Send them to the AI service only after explicit user confirmation.
- The API must not persist diary content or log diary text, prompts, AI output, or authorization headers.
- Every AI conclusion must include an exact quote from a submitted entry. The server calculates quote positions and rejects missing quotes.
- Never present placeholder or mock output as a real AI result.

# 吾身 AI 工作入口

这是仓库中所有 AI 工作的第一入口。开始任何任务前，按下面的顺序读取项目上下文：

1. `AGENTS.md`
2. `docs/engineering/PROJECT_BASELINE.md`
3. `docs/engineering/AI_PLAYBOOK.md`
4. 当前 GitHub Issue
5. 与当前任务相关的 `docs/engineering/CONTRACTS.md`、`docs/engineering/DECISIONS.md` 和源文件

## 开始任务前

- 必须有一个 GitHub Issue，写明目标、边界和验收条件。
- 先用自己的话复述目标、明确不做的内容和准备修改的文件。
- 如果文档、契约和代码互相冲突，停止修改并请求人决定。
- 如果任务需要改变技术栈、公共接口、数据格式或其他 Issue 的范围，停止修改并请求人决定。

## 工作边界

- AI 可以起草代码、测试、文档和技术选项。
- AI 不能自行决定产品范围、合并代码、修改 `dev` 或 `main`、暴露密钥或把未验证的结果称为完成。
- 每次只处理一个 Issue；不顺手重构无关文件。
- API 密钥、真实日记、`.env` 文件和临时构建产物不能写入仓库。

## 权威文档

项目事实和技术基线以 `docs/engineering/PROJECT_BASELINE.md` 为准。具体工作协议见 `docs/engineering/AI_PLAYBOOK.md`，接口和数据格式见 `docs/engineering/CONTRACTS.md`，已批准的技术决定见 `docs/engineering/DECISIONS.md`。

远程仓库的分支约定是：`dev` 用于集成，`main` 用于可演示发布。功能分支只能通过 Pull Request 合并到 `dev`，阶段验收通过后再发布到 `main`。
