# 吾身 / wushen-diary

本地优先的 AI 日记整理工具。日记保存在浏览器 IndexedDB 中，只有用户主动选择并确认后，选中的内容才会发送到整理 API。

## 当前状态

- React、TypeScript、Vite、PWA 前端骨架。
- FastAPI 后端骨架和 `/health` 检查。
- `/v1/organize` 请求/响应模型及接口草案。
- AI 尚未接入；整理接口会返回 `503`，不会伪造整理结果。

## 启动

前置条件：Node.js 20+、npm、Python 3.12+、uv。

前端：

```powershell
npm install
npm run dev:web
```

后端（从项目根目录运行）：

```powershell
Set-Location apps/api
uv sync --cache-dir ..\.uv-cache
uv run --cache-dir ..\.uv-cache uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

前端默认运行在 `http://localhost:5173`，后端运行在 `http://127.0.0.1:8000`。后端健康检查：`http://127.0.0.1:8000/health`。

## 测试与构建

```powershell
npm run build:web
npm run test:web
Set-Location apps/api
uv run --cache-dir ..\.uv-cache pytest tests
```

## 目录

```text
apps/web/       React 前端
apps/api/       FastAPI 后端
docs/           接口、产品和工程协作约定
eval/           AI 评测样例与规则
```

整理请求字段与证据校验规则见 [docs/api-contract.md](docs/api-contract.md)。

团队现有的快速启动、分工和分支说明见 [docs/team-workflow.md](docs/team-workflow.md)。

详细的 AI 与人协作规则见：

- [工程项目基线](docs/engineering/PROJECT_BASELINE.md)
- [人类协作手册](docs/engineering/HUMAN_PLAYBOOK.md)
- [AI 工作手册](docs/engineering/AI_PLAYBOOK.md)
- [接口与数据契约](docs/engineering/CONTRACTS.md)
- [开发路线图](docs/engineering/ROADMAP.md)
- [技术决策记录](docs/engineering/DECISIONS.md)

AI 开始任务前必须阅读根目录的 [AGENTS.md](AGENTS.md)。

## 分支约定

`dev` 是集成分支，`main` 是可演示发布分支。日常功能从 `dev` 创建功能分支，通过 Pull Request 合并到 `dev`；阶段验收通过后再发布到 `main`。

## 下一条任务

下一条建议创建的 Issue 是：

> `建立可运行的 React PWA + FastAPI 工程骨架`

该 Issue 的目标和验收条件已经写在 [docs/engineering/ROADMAP.md](docs/engineering/ROADMAP.md) 的“Issue 0.1”中。

