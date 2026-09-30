# 吾身接口与数据契约

**契约版本：** `0.1`

**状态：** 开发起始契约。代码实现和 OpenAPI 文件必须逐步与本文件保持一致。

这份文档规定浏览器本地数据、React 前端、FastAPI 网关和 AI 结果之间共享的名称、类型、边界和错误方式。它不是对当前未实现代码的完成声明。

## 1. 契约原则

- 原始记录由浏览器本地保存，网关不把它当作长期数据库。
- 只有用户主动选择并确认的记录才可以组成 `OrganizeRequest`。
- 模型输出必须先解析为结构化结果，再经过来源校验和语义复核。
- 无法回指原文的结论不能作为有效结论保存。
- 公共字段的删除、重命名或类型改变必须新增决策记录和迁移说明。
- 前端用 Zod 做运行时校验，后端用 Pydantic 做输入输出校验，OpenAPI 是 API 的机器可读描述。

## 2. 本地记录

### `JournalEntry`（浏览器本地）

```json
{
  "id": "entry_01J00000000000000000000000",
  "date": "2026-09-28",
  "content": "今天把开发环境跑通了。",
  "createdAt": "2026-09-28T20:15:00+08:00"
}
```

字段规则：

| 字段 | 类型 | 规则 |
|---|---|---|
| `id` | string | 本地生成的稳定唯一标识，创建后不因展示排序改变 |
| `date` | `YYYY-MM-DD` string | 用户记录所属日期 |
| `content` | string | 用户原文，不由 AI 改写；第一阶段不能为空白 |
| `createdAt` | ISO 8601 string | 记录创建时间，保留时区信息 |

浏览器负责生成、保存、读取和删除 `JournalEntry`。任何服务端请求都必须带上需要处理的记录标识和确认信息，而不是默认上传整个本地数据库。

## 3. AI 整理请求

### `OrganizeRequest`

```json
{
  "consent": true,
  "entries": [
    {
      "id": "entry_01J00000000000000000000000",
      "date": "2026-09-28",
      "content": "今天把开发环境跑通了。"
    }
  ]
}
```

字段规则：

| 字段 | 类型 | 规则 |
|---|---|---|
| `consent` | `true` | 必填且只能为 `true`；表示用户已对本次请求作出明确确认 |
| `entries` | SelectedEntry[] | 1–20 个用户选中的记录快照；只包含本次确认的内容 |

网关是无状态服务，不根据 ID 访问本地数据库，因此请求体必须携带经过用户确认的记录快照。前端只有在用户明确确认后才能发送请求；网关同时要求 `consent` 为 `true`，缺失或为 `false` 都会被拒绝。该字段是本次请求的确认声明，不替代前端确认交互，也不包含确认时间。网关只处理 `entries` 中的内容，不接收未选中的本地记录；请求结束后不把这些内容写入长期数据库。

### `SelectedEntry`

```json
{
  "id": "entry_01J00000000000000000000000",
  "date": "2026-09-28",
  "content": "今天把开发环境跑通了。"
}
```

`SelectedEntry` 的字段名和含义与 `JournalEntry` 保持一致，但它是本次用户确认后发送的请求快照，不代表网关拥有该记录的所有权。API 限制 `id` 为 1–100 个字符，`date` 为有效的 `YYYY-MM-DD` 日期，`content` 为 1–10,000 个字符且不能全为空白；拒绝校验不会改写原文。

## 4. AI 整理结果

### `OrganizeResponse`

```json
{
  "items": [
    {
      "category": "reflection",
      "type": "fact",
      "text": "你完成了开发环境的第一次运行。",
      "confidence": "high",
      "evidence": [
        {
          "entry_id": "entry_01J00000000000000000000000",
          "quote": "把开发环境跑通了。",
          "start": 5,
          "end": 14
        }
      ]
    }
  ]
}
```

字段规则：

| 字段 | 类型 | 规则 |
|---|---|---|
| `items` | Conclusion[] | 可以为空；不能为了填满模块而编造内容 |

### `Conclusion`

```json
{
  "category": "joy",
  "type": "fact",
  "text": "原文支持的结论",
  "confidence": "high",
  "evidence": []
}
```

`category` 的初始允许值为：`joy`、`fulfillment`、`reflection`、`improvement`、`gratitude`、`weight`、`murmur`。`type` 允许 `fact` 或 `inference`；`confidence` 允许 `high`、`medium`、`low` 或 `insufficient`。`text` 长度为 1–500 个字符；每条结论必须包含至少一条证据。

### `Evidence`

```json
{
  "entry_id": "entry_01J00000000000000000000000",
  "quote": "原文片段",
  "start": 0,
  "end": 4
}
```

模型只返回 `entry_id` 和精确的 `quote`；服务端根据提交内容计算 `start` 和 `end`。找不到对应记录或精确引用时拒绝结果。浏览器还要用自己的本地原文复核范围后才能展示结论。

`entry_id` 为 1–100 个字符，`quote` 非空，`start` 不小于 0，`end` 不小于 1。偏移量单位和多字节文本的范围定义仍按后续来源校验决策处理。

## 5. 错误契约

### `ErrorResponse`

```json
{
  "code": "UPSTREAM_TIMEOUT",
  "message": "AI 服务暂时没有返回，请稍后重试。",
  "retryable": true,
  "requestId": "req_01J00000000000000000000000"
}
```

初始错误码：

| 错误码 | 含义 | `retryable` |
|---|---|---|
| `INVALID_INPUT` | 请求字段或文本不符合契约 | false |
| `CONSENT_REQUIRED` | 没有用户明确确认 | false |
| `UPSTREAM_TIMEOUT` | 模型服务超时 | true |
| `UPSTREAM_FAILURE` | 模型服务返回错误 | true |
| `INVALID_MODEL_OUTPUT` | 模型结果无法通过结构化解析 | true |
| `EVIDENCE_VALIDATION_FAILED` | 结果无法回指原文 | true |
| `INTERNAL_ERROR` | 未分类的服务错误 | false |

这组 `ErrorResponse` 错误码是统一错误结构。当前 Pydantic 请求校验由 FastAPI 返回 HTTP 422 默认 `detail` 结构；AI 未配置时端点返回 HTTP 503 默认 `detail` 结构。两者都是 AI 网关完善前的临时行为，尚未映射为 `ErrorResponse`。

错误发生时，前端必须保留原始本地记录，并向用户展示可理解的状态。不得用错误结果覆盖已保存的原始内容。

## 6. API 边界示例

第一阶段可以按以下边界验证前后端连接：

```text
POST /v1/organize
Request: {"consent": true, "entries": [经过用户确认的 SelectedEntry]}
Response 200: OrganizeResponse
Response 422: FastAPI 当前的默认请求校验错误；缺失/false consent 或无效字段均被拒绝
Response 503: AI 尚未配置时当前的默认 detail 响应（临时例外，不返回整理结果）
Response 5xx: AI 配置后的 UPSTREAM_*、INVALID_MODEL_OUTPUT 或 INTERNAL_ERROR
```

FastAPI 实现后，实际 OpenAPI 输出、Pydantic 模型和前端生成类型必须与本文件核对；若发生差异，先更新契约或新增决策记录。

## 7. 版本和兼容规则

- 持久化数据使用 `schemaVersion`。
- 后端响应和前端解析使用同一契约版本。
- 删除字段、改变字段类型或改变错误含义属于破坏性变更，必须先写决策记录。
- 新增可选字段可以在同一主版本内完成，但必须补测试。
- 无法迁移的旧数据必须可导出，不能静默丢失。
