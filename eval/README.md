# AI 整理评测

关联 [Issue #11](https://github.com/LazyPuppyMu/wushen-diary/issues/11)。本目录只有虚构评测资产，没有真实个人日记或真实 AI 返回。验收操作和记录模板见 [完整链路验收清单](../docs/stage3-acceptance.md)。

## 文件和用途

| 文件 | 用途 |
| --- | --- |
| `cases.json` | 13 个虚构案例的原文、人工参考行为，以及故意无效的模型输出样本 |
| `demo-entries.json` | 三个可手动输入浏览器的虚构日记；没有预写 AI 结果 |
| `check_assets.py` | 离线复核输入 schema、精确引用、拒绝行为和 emoji code point 位置；不发请求 |

`expected.items` 是人工参考，不要求真实 Qwen 使用相同措辞、固定数量或相同置信度。`raw_model_output` 是测试注入样本，不能在页面上当成真实 Qwen 返回。`expected.evidence_ranges` 只记录后端计算后的离线预期；模型 evidence 仍只能提供 `entry_id` 和 `quote`。

## 先运行离线自检

从项目根目录进入后端目录：

```powershell
Push-Location apps/api
uv run --cache-dir ..\.uv-cache python ../../eval/check_assets.py
uv run --cache-dir ..\.uv-cache pytest tests
Pop-Location
git diff --check
```

自检使用现有 `OrganizeRequest`、`parse_ai_response` 和 validator。只读取本目录的两个 JSON 文件，输出案例通过数量，不输出日记内容或完整响应；不访问 Qwen、数据库或日志系统。通过说明 fixture 与现有确定性校验一致，不说明真实模型质量已经通过。

## 案例与评测路径

| 案例 ID | 路径 | 要检查的行为 |
| --- | --- | --- |
| `ordinary-fact` | 真实模型人工评测 + 自检 | 已完成行动有精确、支持结论的原文引用 |
| `plan-not-completed` | 真实模型人工评测 + 自检 | 只记录计划，不写成已经跑步 |
| `negative-emotion` | 真实模型人工评测 + 自检 | 保留沮丧，不能凭空生成积极成长 |
| `empty-content` | 输入自检 + 后端 pytest | 空原文被拒绝；不尝试从页面自动发送无效记录 |
| `long-content` | 真实模型人工评测 + 自检 | 较长但合法的原文能准确引用；超过 10,000 字由 `test_organize_rejects_entry_content_over_limit` 单独验证 |
| `repeated-quote` | 自检 + validator pytest | 同一 quote 多次出现，服务端使用第一次位置 |
| `missing-quote` | 注入样本自检 + 路由 pytest | 原文没有该 quote，拒绝整个正常结果 |
| `wrong-entry-id` | 注入样本自检 + validator pytest | 未提交的记录 ID 被拒绝 |
| `no-categorizable-content` | 真实模型人工评测 + 自检 | 中性描述不为了凑七类生成结论 |
| `mixed-categories` | 真实模型人工评测 + 自检 | 已完成、喜悦、感谢、未来计划和担忧可以同时存在，结论逐条有证据 |
| `missing-evidence` | 注入样本自检 | 缺少 evidence 的 item 不能进入正常结果 |
| `emoji-quote-position` | 自检 + 浏览器实测 | code point `[1, 7)` 对应 UTF-16 `[2, 9)`；真实返回按实际 quote 验证 |
| `insufficient-no-generation` | 真实模型人工评测 + 自检 | 无充分分类依据时不凭语气编造内容 |

## 真实模型人工评测

PR #10 合并且本机后端已配置 provider 后，在专用浏览器中手动输入有效案例的日期和原文。每次选择案例并明确确认后才发送；不增加批量自动请求。样本 ID 仅是标签，API evidence 应对应浏览器实际提交的本地 ID。

每个实际返回的结论逐项检查：

1. 分类、fact/inference 和置信度与 [Prompt v1](../docs/ai-prompt-v1.md) 及原文相符，没有靠猜测补齐类别。
2. 计划、已完成行动和未完成行动保持时间与状态；负面内容没有被强行改成正面。
3. 每条 evidence 都属于本次提交的记录，quote 是连续、非空、精确原文，服务端位置可以复算。
4. quote 的语义支持结论。例如只引用“明天打算”不能支持“已经完成”。机械子串校验不会替代这一项。
5. 引用可定位，emoji 不造成偏移；有一条错误引用的结论不能进入正常结果。

记录案例 ID、是否真实 provider、通过/失败/未验证及一句理由。保留通过数量和问题描述，不保存完整输出、Prompt、密钥或真实个人数据；发现问题后建对应 Issue，不直接跨目录修改运行时代码。

本阶段要求计划、负面情绪、没有可归类内容、混合分类和 emoji 的检查全部实际完成；任何编造完成事实、强行正面化或证据不支持结论的情况都记为失败。这里只记录当前样本的表现，不据此声称普遍准确率。
