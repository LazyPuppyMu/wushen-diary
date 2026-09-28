# 团队协作说明

这个版本的目标是 48 小时内跑通一条稳定演示链路：

```text
本地写日记 -> 用户选择 -> 明确确认 -> AI 整理 -> 原文引用 -> 程序校验 -> 展示/导出
```

## 第一次启动

每个人先克隆仓库并进入项目目录：

```powershell
git clone https://github.com/LazyPuppyMu/wushen-diary.git
Set-Location wushen-diary
npm install
```

前端：

```powershell
npm run dev:web
```

后端另开一个 PowerShell：

```powershell
Set-Location apps/api
uv sync --cache-dir ..\.uv-cache
uv run --cache-dir ..\.uv-cache uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

检查后端：打开 `http://127.0.0.1:8000/health`，应该看到 `{"status":"ok"}`。前端地址是 `http://localhost:5173/`。

## 三人分工

### A：AI、产品、测试

- `eval/`：虚构日记、错误案例、评测记录
- `docs/`：Prompt、分类规则、演示脚本
- `apps/api/app/validators/`：AI 输出和引用规则
- 验证计划、事实与推断区分、错误引用拒绝

### B：前端

- `apps/web/src/features/entries/`：写日记、列表、日期筛选、删除、导出
- `apps/web/src/features/organize/`：选择确认、结果展示、引用跳转
- `apps/web/src/storage/`：IndexedDB
- 负责移动端适配和浏览器端引用复核

### C：后端、AI、部署

- `apps/api/app/routes/`：接口
- `apps/api/app/services/`：Qwen 调用
- `apps/api/app/schemas/`：Pydantic 请求与响应
- `apps/api/app/validators/`：引用查找和拒绝逻辑
- 负责 CORS、环境变量、超时、限流和部署

## Git 分支和提交

`main` 是可演示版本，`dev` 是集成分支。日常开发从 `dev` 切出：

```powershell
git switch dev
git pull --ff-only origin dev
git switch -c feature/web
```

建议分支名：`feature/web`、`feature/api`、`feature/ai`。一次提交只解决一个明确任务：

```powershell
git add <changed-files>
git commit -m "feat: save diary entries locally"
git push -u origin feature/web
```

然后向 `dev` 发 Pull Request，由另一名成员检查后合并。不要直接向 `main` 推送日常功能。

## 接口约定

整理接口只接收用户已选择并确认的记录。后端不保存日记，也不记录原文、Prompt 或完整 AI 输出。AI 只返回 `entry_id` 和原文中的 `quote`；后端用原文自行计算位置，找不到精确引用就拒绝结果。

字段和示例见 [api-contract.md](api-contract.md)。AI 尚未配置时，`POST /v1/organize` 返回 `503`，不会返回伪造内容。

## 提交前检查

```powershell
npm run build:web
npm run test:web
Set-Location apps/api
uv run --cache-dir ..\.uv-cache pytest tests
```

不要提交 `.env`、真实日记、`node_modules/`、`.venv/`、构建产物或测试缓存。
