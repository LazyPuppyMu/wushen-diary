# 吾身 / wushen-diary

本地优先的 AI 日记整理工具。日记保存在浏览器 IndexedDB 中，只有用户主动选择并确认后，选中的内容才会发送到整理 API。

## 当前状态

- React、TypeScript、Vite、PWA 前端骨架。
- FastAPI 后端骨架和 `/health` 检查。
- `/v1/organize` 请求/响应模型及接口草案。
- 后端已接入 Qwen 配置、JSON 解析和原文引用校验；未配置 API key 时整理接口返回 `503`，不会伪造整理结果。

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
if (-not (Test-Path .env)) { Copy-Item ..\..\.env.example .env }
uv run --cache-dir ..\.uv-cache uvicorn app.main:app --env-file .env --reload --host 127.0.0.1 --port 8000
```

配置后端前，将根目录的 `.env.example` 复制为 `apps/api/.env`，填写 `DASHSCOPE_API_KEY`；可按需调整 `QWEN_MODEL`、`QWEN_TIMEOUT_SECONDS` 和 `WEB_ORIGINS`。API 不保存日记内容，也不记录 Prompt 或模型输出。

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
docs/           接口和产品约定
docs/engineering/ 工程基线、协作手册、契约维护和比赛版路线
eval/           AI 评测样例与规则
```

整理请求字段与证据校验规则见 [docs/api-contract.md](docs/api-contract.md)。

团队分工、分支规范、首次启动和提交前检查见 [docs/team-workflow.md](docs/team-workflow.md)。

工程任务开始顺序、当前基线和人工/AI 协作边界见 [docs/engineering/PROJECT_BASELINE.md](docs/engineering/PROJECT_BASELINE.md)、[docs/engineering/AI_PLAYBOOK.md](docs/engineering/AI_PLAYBOOK.md) 和 [docs/engineering/HUMAN_PLAYBOOK.md](docs/engineering/HUMAN_PLAYBOOK.md)。公共契约维护规则见 [docs/engineering/CONTRACTS.md](docs/engineering/CONTRACTS.md)，短期演示路线见 [docs/engineering/ROADMAP.md](docs/engineering/ROADMAP.md)。
