# 工程协作文档设计

## 目标

补齐 `docs/engineering/` 工程入口文档，让后续前端、后端和评测工作都以 `origin/dev` 的实际状态、GitHub Issue 和公共 API 契约为准。文档服务于 48 小时比赛演示版，不扩大产品范围。

## 基线

- 当前基线为 `origin/dev`（提交 `873f7f0`）。
- 后端已经接入 Qwen 配置、JSON 解析和原文引用校验；缺少 API key 时返回 `503`。
- 日记默认保存在浏览器 IndexedDB；只有用户明确确认后才发送已选择记录。
- `docs/api-contract.md` 是请求、响应和证据字段的唯一权威来源。
- 前端仍需要补齐选择确认、整理调用、结果展示、引用定位、导出和清空流程。

## 文档边界

新增以下文件：

- `PROJECT_BASELINE.md`：已实现、未实现、风险和验证状态。
- `HUMAN_PLAYBOOK.md`：用户负责产品方向、范围、公共契约和合并决策。
- `AI_PLAYBOOK.md`：Issue 驱动、任务复述、目录边界、小步验证和暂停条件。
- `CONTRACTS.md`：指向 `docs/api-contract.md`，记录契约维护规则和未决 offset 风险。
- `DECISIONS.md`：只记录已批准的技术决定。
- `ROADMAP.md`：记录工程文档、前端主线和完整链路验收的短期顺序。

更新以下入口文件：

- `AGENTS.md`：增加工程文档读取顺序和当前分支协作入口。
- `README.md`：增加工程文档链接，并修正当前 API 状态描述。

## 明确不做

- 不改 React 页面、IndexedDB 实现、FastAPI 路由、请求响应字段或 Qwen 服务。
- 不引入登录、云端数据库、向量库、多 Agent、推送或社交功能。
- 不把旧分支 `codex/docs-collaboration-system` 整体合并进当前基线。
- 不解决 Python `str.find()` code point offset 与浏览器 UTF-16 `slice()` 索引之间的差异；该风险只记录为待决事项，后续由前端任务单独决定。

## 验收方式

- 所有新增文档都能从 `README.md` 或 `AGENTS.md` 找到。
- 文档中的当前状态与 `origin/dev` 代码和测试一致。
- 文档不复制一份独立 API 字段表，避免与 `docs/api-contract.md` 漂移。
- 使用 PowerShell 检查链接目标存在，并运行现有前端构建、前端测试和后端 pytest。
- 提交只包含本设计文件、`docs/engineering/`、`AGENTS.md` 和 `README.md` 的批准范围变更。
