# 公共契约规则

## 权威来源

`docs/api-contract.md` 是 `/health` 和 `/v1/organize` 的请求、响应、枚举、校验限制和错误语义的唯一权威来源。本文只规定维护方式和跨模块边界，不复制一份会漂移的字段表。

如果本文与 `docs/api-contract.md`、Pydantic schema 或实际路由不一致，暂停实现，以实际冲突为问题提交给用户决定；不要在代码中自行选择一套字段。

## 整理请求边界

- 浏览器是日记存储的拥有者，API 只接收本次由用户选择并确认的记录快照。
- `consent` 必须明确为 `true`；未确认或未选择记录时，前端不能请求整理接口。
- 后端在内存中处理请求，不把日记原文、Prompt、完整 AI 输出或 Authorization 写入日志、文件、数据库或缓存。
- API 地址、Qwen 模型、超时和 provider key 通过服务端环境配置提供；key 不进入浏览器代码或仓库。

## 证据边界

- 模型只提供 `entry_id` 和精确、连续、非空的 `quote`。
- 模型不得提供 `start` 或 `end`；服务端根据本次请求的原文执行 `content.find(quote)`，再计算 `end = start + len(quote)`。
- `entry_id` 不在本次请求中、quote 为空或 quote 不是对应原文的子串时，结果不能进入正常 API response。
- API 不修改日记原文；浏览器仍需用本地记录复核返回的证据。

## 待决风险：字符位置

Python `str.find()` 的返回值按 Unicode code point 计数，浏览器 JavaScript `slice()` 按 UTF-16 code unit 计数。包含 emoji 等非 BMP 字符时，服务端的 `start/end` 可能无法直接用于浏览器定位。

本任务不修改字段、不转换索引，也不增加哈希或额外存储。前端任务开始前，用户需要在保持接口简单和支持完整 Unicode 定位之间选择策略；选择结果才可以写入 `DECISIONS.md` 并更新本契约说明。

## 变更流程

1. 先在 GitHub Issue 写明字段、调用方、兼容性和验收变化。
2. 先更新 `docs/api-contract.md`，再修改 schema、路由、服务或前端调用。
3. 同一 Pull Request 增加覆盖新行为的测试，并在 PR 描述中说明未完成项。
4. 另一名成员审查通过后合并到 `dev`；未经过阶段验收不能直接合并到 `main`。
