# 工程协作文档 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `origin/dev` 基线上补齐吾身比赛版的工程协作入口，冻结当前状态、公共契约规则和前端下一步工作范围。

**Architecture:** 新增 `docs/engineering/` 作为工程协作入口；字段定义继续由 `docs/api-contract.md` 单一维护。根目录 `AGENTS.md` 和 `README.md` 只增加入口链接与当前状态，不承载重复的接口细节。

**Tech Stack:** Markdown、Git、PowerShell 检查脚本；现有 React/Vite、FastAPI/pytest 仅用于回归验证。

**Spec:** `docs/superpowers/specs/2026-09-30-engineering-docs-design.md`

## Global Constraints

- 日记默认只保存在浏览器 IndexedDB，只有用户明确确认后才发送已选记录。
- 后端不保存日记、不记录日记原文、Prompt、完整 AI 输出或 Authorization。
- 每条 AI 结论必须带提交记录中的精确 quote，位置由后端计算。
- 不引入登录、云端数据库、向量库、多 Agent、推送或社交功能。
- 本计划不修改 React 页面、FastAPI 路由、请求响应字段或 Qwen 服务。
- 不提交 `.env`、真实日记、`node_modules`、`.venv`、`dist` 或测试缓存。

### Task 1: 写当前基线和协作规则

**Files:**
- Create: `docs/engineering/PROJECT_BASELINE.md`
- Create: `docs/engineering/HUMAN_PLAYBOOK.md`
- Create: `docs/engineering/AI_PLAYBOOK.md`

**Interfaces:**
- Consumes: `origin/dev` 的 README、API 契约、现有目录和测试状态。
- Produces: 后续任务开始前必须阅读的项目事实、人工决策边界和 AI 执行协议。

- [ ] **Step 1: 写 `PROJECT_BASELINE.md`**
  - 记录已实现：浏览器本地日记、用户确认语义、FastAPI `/health`、Qwen 配置、JSON 解析、evidence quote 校验、缺少 API key 时的 `503`。
  - 记录未实现：完整前端整理流程、真实密钥运行验收、部署验收。
  - 单独列出已验证事实、尚未验证事实和已知风险。

- [ ] **Step 2: 写 `HUMAN_PLAYBOOK.md`**
  - 规定用户决定产品方向、范围、公共契约、是否接受待决风险和是否合并 PR。
  - 规定只有涉及大方向、范围、接口或数据格式时提供多个方案。

- [ ] **Step 3: 写 `AI_PLAYBOOK.md`**
  - 固定开始顺序：Issue、AGENTS、基线、playbook、Issue、契约和源文件。
  - 固定执行顺序：复述目标和边界、列修改文件、逐小功能验证、报告测试和未完成项。
  - 规定发生契约冲突、范围变化或公共接口变化时暂停并请求用户决定。

- [ ] **Step 4: 检查 Markdown 格式**

Run: `git diff --check`

Expected: no output and exit code 0.

- [ ] **Step 5: Commit**

```powershell
git add docs/engineering/PROJECT_BASELINE.md docs/engineering/HUMAN_PLAYBOOK.md docs/engineering/AI_PLAYBOOK.md
git commit -m "docs: add project baseline and collaboration playbooks"
```

### Task 2: 写契约、决定记录和短期路线

**Files:**
- Create: `docs/engineering/CONTRACTS.md`
- Create: `docs/engineering/DECISIONS.md`
- Create: `docs/engineering/ROADMAP.md`

**Interfaces:**
- Consumes: `docs/api-contract.md`、Task 1 的基线和项目分支约定。
- Produces: 公共接口变更规则、已批准决定清单和下一阶段前端工作入口。

- [ ] **Step 1: 写 `CONTRACTS.md`**
  - 声明 `docs/api-contract.md` 是请求响应字段唯一权威来源。
  - 说明 AI 只返回 `entry_id` 与 `quote`，`start/end` 由后端计算。
  - 记录 Python code point 与浏览器 UTF-16 offset 差异为未决风险，不在本任务解决。

- [ ] **Step 2: 写 `DECISIONS.md`**
  - 只记录已有证据支持的决定：浏览器本地优先、用户确认后发送、后端不持久化、引用必须可验证、`dev` 集成与 `main` 发布。
  - 将 offset 处理标为待用户决定，而不是既成决定。

- [ ] **Step 3: 写 `ROADMAP.md`**
  - 只保留三个阶段：工程入口、前端主线、完整链路验收。
  - 每阶段写明确的完成证据，不扩展比赛版范围。

- [ ] **Step 4: 检查引用目标**

Run: `Test-Path docs/api-contract.md; Test-Path docs/team-workflow.md; Test-Path apps/api/app/services/qwen.py`

Expected: three `True` lines.

- [ ] **Step 5: Commit**

```powershell
git add docs/engineering/CONTRACTS.md docs/engineering/DECISIONS.md docs/engineering/ROADMAP.md
git commit -m "docs: define contracts decisions and roadmap"
```

### Task 3: 更新项目入口

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 1 和 Task 2 的工程文档路径及 `origin/dev` 当前状态。
- Produces: 新成员可从仓库根目录进入完整工作协议。

- [ ] **Step 1: 更新 `AGENTS.md`**
  - 增加工程文档读取顺序和 `docs/api-contract.md` 权威说明。
  - 保留原有项目约束，不删除安全和范围规则。

- [ ] **Step 2: 更新 `README.md`**
  - 将 API 状态改为已接入 Qwen 配置、JSON 解析和引用校验；未配置 key 时返回 `503`。
  - 增加 `docs/engineering/` 文档入口链接。

- [ ] **Step 3: 检查根目录差异**

Run: `git diff --check; git diff --name-only`

Expected: only `AGENTS.md`, `README.md` and the approved `docs/` files are listed.

- [ ] **Step 4: Commit**

```powershell
git add AGENTS.md README.md
git commit -m "docs: link engineering workflow from project entrypoints"
```

### Task 4: 回归验证并准备 PR

**Files:**
- Test: existing web and API test suites; no new code tests.

- [ ] **Step 1: 检查文档链接和禁止文件**

Run: `Get-ChildItem docs/engineering -File; git status --short; git diff --check`

Expected: six engineering documents exist; no `.env`, diary, dependency, build or cache files are staged.

- [ ] **Step 2: 运行前端验证**

Run: `npm run build:web; npm run test:web`

Expected: both commands exit 0.

- [ ] **Step 3: 运行后端验证**

Run from `apps/api`: `uv run --cache-dir ..\.uv-cache pytest tests`

Expected: all existing API tests pass.

- [ ] **Step 4: 汇总变更**

Run: `git diff origin/dev...HEAD --stat; git log --oneline origin/dev..HEAD`

Expected: commits and files match Issue #7; no source code changes outside the approved document scope.

- [ ] **Step 5: Commit any final documentation correction**

Only if a correction is required after verification:

```powershell
git add <approved-document-files>
git commit -m "docs: correct engineering workflow references"
```
