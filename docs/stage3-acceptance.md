# 完整链路验收清单

关联任务：[Issue #11](https://github.com/LazyPuppyMu/wushen-diary/issues/11)，依赖 [PR #10](https://github.com/LazyPuppyMu/wushen-diary/pull/10) 合并到 `dev`。依据 [比赛版路线](engineering/ROADMAP.md) 阶段 3；字段、限制和错误状态以 [API 契约](api-contract.md) 为准。

本文是待执行的验收流程。评测资产自检、自动化测试、真实 Qwen 请求和浏览器实测分别记录。没有实际执行的项填写“未验证”，不预填通过结果。

本轮已执行项和剩余问题见 [2026-09-30 本地验收记录](stage3-local-record-2026-09-30.md)。该记录不代表完整链路通过。

## 分工和开始条件

| 负责人 | 要完成的事 |
| --- | --- |
| 用户 / AI 产品与评测负责人 | 检查结论是否忠于原文，记录演练时间和未完成项，决定阶段是否通过 |
| 前端成员 | 在合并后的版本验证浏览器流程、引用定位和 320px 布局 |
| 后端成员 | 在本机配置 provider 并启动服务，核对前端来源和 API 地址 |
| AI | 准备虚构数据、命令和记录模板，执行已授权的离线校验与测试 |
| 审查成员 | 审查变更和证据；阶段通过后由用户决定是否发布到 `main` |

- [ ] PR #10 已合并，本次测试使用干净功能分支或工作区中的最新 `origin/dev`；记录提交 ID。
- [ ] 按 [README](../README.md) 启动前后端；`GET /health` 返回成功。健康检查不代表 Qwen 已配置或调用成功。
- [ ] 后端成员在自己的本机配置 `DASHSCOPE_API_KEY`、`QWEN_MODEL`、`QWEN_TIMEOUT_SECONDS` 和 `WEB_ORIGINS`。不把 key 发到聊天、浏览器或仓库。
- [ ] 浏览器地址与 `WEB_ORIGINS` 完全匹配。例如 `.env.example` 默认允许 `http://localhost:5173`，不能直接当成允许 `http://127.0.0.1:5173`；使用其他端口时由后端成员调整本机配置。
- [ ] 前端 `VITE_API_BASE_URL` 指向启动的后端，默认 `http://127.0.0.1:8000`；修改前端环境配置后重启 Vite。
- [ ] 使用专用浏览器演示配置文件，只有虚构记录。清空会不可撤销地删除该来源的全部日记；不要在个人日记环境验收。
- [ ] 打开浏览器开发者工具 Network，过滤 `/v1/organize`，保留操作期间的请求列表。不要导出 HAR 或带请求体、密钥的网络日志。

## 自动化检查

以下命令均从验收版本根目录开始；Python 环境由 Windows 的 uv 创建，不与 WSL 共用。

```powershell
npm ci
npm run test:web
npm run build:web
Push-Location apps/api
uv run --cache-dir ..\.uv-cache python ../../eval/check_assets.py
uv run --cache-dir ..\.uv-cache pytest tests
Pop-Location
git diff --check
```

`check_assets.py` 只检查虚构 fixture 和确定性引用校验，不访问 Qwen、数据库或日记文件。pytest 使用测试 transport 的成功结果也不代表真实 Qwen 成功。测试或构建失败时记录失败，修复后重新运行相关项。

## 浏览器逐步验收

从 [演示记录](../eval/demo-entries.json) 手动输入日期和 `content`，每条保存一次。文件中的 `id` 只用于标识评测样本；页面生成新的本地 ID，复核 API evidence 时使用本次实际提交的本地 ID。该文件不包含实际 AI 响应，也不是自动发送请求的载荷。

| 编号 | 操作 | 通过条件 | 初始状态 |
| --- | --- | --- | --- |
| B01 | 写入三个虚构记录，刷新 | 日记原文、日期、数量恢复；写入和刷新没有 POST 整理请求 | 未验证 |
| B02 | 不选择记录 | “整理所选”不可用，没有整理请求 | 未验证 |
| B03 | 选择两个记录，查看确认框，取消 | 数量、日期范围和字符数正确；取消时 Network 没有新增 POST | 未验证 |
| B04 | 再次选择并确认发送 | 只发送选中快照和 `consent: true`，出现 loading，没有占位结论；真实 provider 配置后返回可用结果 | 未验证 |
| B05 | 对照原文查看分类、fact/inference、confidence | 结论有语义依据；计划保持未完成，负面内容不强行变正面，无证据的分类不生成 | 未验证 |
| B06 | 点击正常结论的“查看原文” | 引用属于提交的记录，连续原文精确相等，定位选中正确文本 | 未验证 |
| B07 | 单独整理 `demo-emoji`，点击返回引用 | 含 emoji 前缀的文本按 code point 复核，DOM 定位不偏移；使用实际返回的 quote，不要求模型固定选中某一句 | 未验证 |
| B08 | 设置日期筛选把已有引用来源隐藏，再点击该引用 | 来源重新可见并正确定位 | 未验证 |
| B09 | 导出并打开 Markdown | 包含本地日记日期和原文，无额外上传；当前导出不含整理结果 | 未验证 |
| B10 | 清空时先取消，再明确确认 | 取消不删除；确认后日记和当前页面结果消失，刷新仍无日记 | 未验证 |
| B11 | 清空后重新写入一条虚构记录；由后端成员在独立进程启动未配置 key 的测试服务，确认前端连接它后选择记录并发送 | 显示 `503`，没有成功结论；日记仍可刷新恢复和导出 | 未验证 |
| B12 | 停止本机后端；选择虚构记录并确认发送，随后恢复后端 | 显示连接错误，无成功结论；日记仍在 | 未验证 |
| B13 | 恢复正常后端并对虚构记录确认发送，取得有效结果；设为 320px 宽，检查输入、选择、结果和确认框，再检查正常桌面宽度 | 无横向溢出、遮挡或文字重叠，所有按钮可操作；记录实际视口和截图 | 未验证 |

B03 的“字符数”按 Unicode code point 计数，emoji 不按 JavaScript UTF-16 长度当作两个字。B13 可在控制台检查 `document.documentElement.scrollWidth <= document.documentElement.clientWidth`，同时目视检查布局；单个布尔值不能证明确认框和按钮没有遮挡。

B11 只改变隔离测试服务进程的配置，不删除或改写现有本机 key。如果测试服务使用其他端口，调整本机前端 `VITE_API_BASE_URL` 并重启 Vite，同时核对测试服务的 `WEB_ORIGINS`；确认 Network 的请求地址确实是测试服务。完成 B11 后恢复正常服务地址。B12 执行前确保至少一条虚构日记仍在，停止的是前端实际连接的本机后端；测试完重新启动服务。

B11/B12 会清除之前页面上的整理结果。B13 必须重新取得真实有效结果，才能覆盖结果区域；只有输入和列表时，记录“部分验证”，结果布局继续待验证。

如果 Qwen 在 `demo-emoji` 中没有给出可以点击的结论，记录本次空结果，并把 emoji 引用浏览器验证标为未验证。不能把手写响应填入页面当作真实返回。

## 错误引用的确定性证明

在 `apps/api/` 运行，展示测试名称和实际通过数量：

```powershell
uv run --cache-dir ..\.uv-cache pytest -q tests/test_organize.py::test_organize_rejects_invalid_quote tests/test_evidence_validator.py::test_validate_evidence_rejects_entry_id_that_is_not_submitted
```

第一项用 FakeClient 给路由注入错误 quote，要求 `502` 通用错误，不能返回正常结论；第二项直接调用独立 validator，要求错误 `entry_id` 被拒绝。两项均不调用 Qwen，也不访问演示页面的 IndexedDB。

在合并后前端版本根目录运行：

```powershell
npm --workspace apps/web run test -- src/lib/result-validation.test.ts src/lib/evidence.test.ts
```

前端测试证明本次提交范围内的引用复核和 emoji 索引行为。它们不等于完整 React/IndexedDB 浏览器集成测试。后端错误引用通常直接返回错误；前端“待复核”用于再次发现非法 evidence。正常 API 不应为了演示而主动放行错误引用。

## AI 质量评测

按 [评测说明](../eval/README.md) 逐案例人工核对。精确 quote 存在只能证明引用匹配，还必须看 quote 是否支持结论。`expected.items` 是人工参考，不能要求真实模型逐字复现其措辞、固定置信度或填满分类。

空内容、超限内容、错误引用等使用离线资产自检或已有 pytest；真实模型质量用有效虚构日记评测，每次仍经前端选择并确认。不为评测另建自动批量发送通道。

## 本次记录模板

只填写执行信息和结论，不保存真实日记、Prompt、完整 AI 输出、Authorization 或 key。截图只展示专用演示配置文件中的虚构内容。

| 项目 | 填写内容 |
| --- | --- |
| 日期、执行者、提交 ID | 待填写 |
| 前后端地址、浏览器版本、视口 | 待填写 |
| 模型名称、是否调用真实 provider | 待填写，不填写 key |
| 资产自检、前端测试、构建、后端测试 | 命令、实际数量、通过/失败/未验证 |
| B01-B13 | 逐项状态、简短理由和仅含虚构内容的截图/人工观察 |
| 错误引用证明 | 测试命令、通过数量，明确标注 FakeClient / 独立 validator |
| AI 质量 | 已执行案例 ID、计划/负面/引用语义是否合格、未验证项 |
| 三分钟演练 | 实际时长，含模型等待时间 |
| 剩余问题 | 失败步骤、影响、对应 Issue、负责人 |
| 阶段结论 | 待验收 / 未通过 / 通过，由用户确认 |

## 阶段通过条件

- [ ] 合并后的验收版本前端测试、构建、后端 pytest 和资产自检通过。
- [ ] B01-B13 实际执行并通过，真实 Qwen 响应发生在用户确认后。
- [ ] 计划、负面情绪、空分类和混合分类评测符合原文，错误引用被拒绝。
- [ ] 原文和证据位置未被校验过程改写，包含 emoji 的引用正确定位。
- [ ] 后端代码及实际测试运行没有新增日记、Prompt、完整 AI 输出或 Authorization 的日志/持久化；仓库未包含密钥、真实日记、环境配置或构建产物。
- [ ] 三分钟脚本实测可完成，用户认可剩余风险并决定是否发布到 `main`。

缺少真实 provider、仅自动化测试通过、或只看到 HTTP 200 的页面，都不足以将阶段标为“通过”。本清单本身不授权合并或发布。
