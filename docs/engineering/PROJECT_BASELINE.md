# 项目基线

> 本文记录 `origin/dev` 在 2026-09-30 的比赛版基线。当前基线提交为 `873f7f0`。

## 产品约束

- 日记默认只保存在浏览器 IndexedDB。
- 只有用户主动选择并确认后，前端才能请求整理 API。
- 后端只在请求处理期间使用日记内容，不保存日记，不记录原文、Prompt、完整 AI 输出或 Authorization。
- 每条 AI 结论都必须带提交记录中的精确原文 quote；后端从本次请求计算位置，找不到 quote 就拒绝结果。
- 本版本不加入登录、云端数据库、向量库、多 Agent、推送或社交功能。

## 已实现

### 浏览器端

- React、TypeScript、Vite 和 PWA 基础结构已存在。
- `apps/web/src/storage/db.ts` 使用 Dexie 把日记写入 IndexedDB。
- 当前页面支持写入记录、刷新后读取列表和删除单条记录。

### API 和 AI 服务

- `GET /health` 可在没有 AI 配置时检查后端状态。
- `POST /v1/organize` 要求请求包含 `consent: true` 和 1-20 条已选择记录。
- `apps/api/app/services/qwen.py` 从环境变量读取 DashScope key、模型和超时，并使用 HTTP JSON 请求 Qwen。
- `apps/api/app/services/organize.py` 要求模型返回结构化 JSON，拒绝额外字段，并把模型 evidence 转成 API response。
- `apps/api/app/validators/evidence.py` 要求 `entry_id` 来自请求，要求 quote 是对应原文的非空子串，并用 `content.find(quote)` 计算 `start/end`。
- 缺少 API key 时返回 `503`；超时返回 `504`；上游错误、非法 JSON 或非法 evidence 返回 `502`。
- 现有 API 测试覆盖 consent、字段限制、Qwen transport、非法 JSON 和错误引用等行为。

### 评测和规则资产

- `docs/ai-prompt-v1.md` 已规定七个分类、fact/inference 和证据规则。
- `eval/cases.json` 使用虚构文本覆盖计划、负面情绪、空内容、长内容、重复引用、缺失引用、错误 entry_id、空结果和混合分类。

## 尚未实现

- 前端还没有选择记录、发送前确认、`POST /v1/organize` 调用、整理结果展示、引用跳转、导出和清空全部数据流程。
- 尚未用真实 DashScope key 完成端到端演示验收；没有 key 时的 `503` 是预期行为。
- 尚未完成部署和真实浏览器多尺寸验收。

## 验证状态

- 代码事实来自 `origin/dev` 的源文件和测试文件。
- 本次工程文档任务完成前会重新运行前端构建、前端测试和后端 pytest；测试结果以本次命令输出为准。

## 已知风险

- Python `str.find()` 返回按 Unicode code point 计数的位置，而浏览器 JavaScript `slice()` 使用 UTF-16 索引。包含 emoji 等非 BMP 字符时，后端 `start/end` 与浏览器定位可能不一致。
- 该风险需要前端和后端共同决定契约策略；本次文档任务只记录，不修改接口或实现。
