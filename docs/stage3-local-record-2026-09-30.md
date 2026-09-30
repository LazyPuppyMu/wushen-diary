# 阶段 3 本地验收记录

关联 [Issue #11](https://github.com/LazyPuppyMu/wushen-diary/issues/11)，操作清单见 [完整链路验收](stage3-acceptance.md)。日期：2026-09-30，执行者：AI，用户已明确要求先完成离线和浏览器本地验收，后端尚未配置 DashScope。

## 版本与环境

- PR #10 已合并；集成版本为 `origin/dev` 的 `06ae425`。
- 本轮工作区为 `codex/stage3-acceptance`，执行测试时提交为 `794bcac`，已同步上述集成版本。运行时代码与该 `dev` 版本一致；本任务只修改 `docs/` 和 `eval/`。
- Windows Python 3.12.9；前端 Vite 开发地址为 `http://127.0.0.1:5175/`；浏览器为 Codex 内置浏览器。工具未提供可核实的浏览器版本，本记录不猜测版本号。
- 前端默认请求 `http://127.0.0.1:8000`，本次该端口没有启动后端。未调用真实 provider，没有真实 AI 返回或 AI 质量评测结果。
- 本地来源开始时无记录。三条虚构演示原文已保存；初次日期自动填值没有同步 React 状态，三条均保存为 2026-09-30。随后通过日期控件键盘操作另存一条 2026-09-29 的虚构日期验收记录，重新打开页面后四条记录及日期恢复。未接触个人日记。

## 自动化结果

前端命令从项目根目录运行；Python 命令从 `apps/api/` 运行。

| 命令 | 实际结果 | 证明范围 |
| --- | --- | --- |
| `uv run --cache-dir ..\.uv-cache python ../../eval/check_assets.py` | 13 个案例、3 条虚构输入通过 | fixture 与当前 schema、解析器和引用位置一致；没有模型调用 |
| `uv run --cache-dir ..\.uv-cache pytest tests` | 34 passed | 后端单元及测试 transport 校验；不是线上 provider 验收 |
| `uv run --cache-dir ..\.uv-cache pytest -q tests/test_organize.py::test_organize_rejects_invalid_quote tests/test_evidence_validator.py::test_validate_evidence_rejects_entry_id_that_is_not_submitted` | 2 passed | FakeClient 错误 quote 返回 502，独立 validator 拒绝未提交 entry_id |
| `npm run test:web` | 9 个文件、26 passed | 前端现有测试，包括取消确认、引用复核、emoji 位置及请求状态 |
| `npm run build:web` | exit 0，PWA 构建完成 | TypeScript 与生产构建 |
| `git diff --check` | exit 0 | 文本差异格式检查 |

pytest 有现有 Starlette/httpx 弃用警告；本任务没有更改依赖。

## 浏览器结果

“部分验证”表示只证明表内描述的行为，不把剩余条件计为通过。本轮未取得 Network 请求列表，也未导出 HAR。

| 编号 | 状态 | 已观察到的证据与限制 |
| --- | --- | --- |
| B01 | 部分验证 | 保存与重新打开页面后原文、四条数量及日期恢复；指定日期键盘操作成功。写入/刷新无 POST 的 Network 证据待补 |
| B02 | 部分验证 | 未选中记录时“整理所选”disabled；未记录 Network |
| B03 | 未验证 | 勾选负面记录与 emoji 记录后显示 2 条、32 字，计数正确。内置浏览器操作原生确认框超时，未捕获框内文本及取消动作，不能证明取消不发送 |
| B04 | 未验证 | 自动化点击整理后页面显示连接错误；确认框操作结果未能可靠捕获，不计为已验证的确认发送。没有真实 provider 结果 |
| B05 | 未验证 | 无真实模型结论，不能评估分类或语义 |
| B06 | 未验证 | 无有效返回，未执行浏览器引用跳转 |
| B07 | 未验证 | 离线 emoji 位置测试通过；浏览器真实引用定位待补 |
| B08 | 未验证 | 未执行隐藏来源后的引用定位 |
| B09 | 部分验证 | 点击导出后显示成功，下载目录实际生成 `wushen-diary-2026-09-30.md`；读取文件核对三个日期和虚构原文相符，无 AI 结果。下载事件等待超时，但文件落盘已核实；没有 Network 证据 |
| B10 | 未验证 | 未执行取消/确认清空；四条虚构记录保留在本地来源，供人工复核 |
| B11 | 未验证 | 启动隔离无 key 服务的两个命令被自动审批拒绝，工具仅返回 blocked by policy，没有具体原因；停止启动尝试。pytest 配置缺失测试不替代浏览器 503 验收 |
| B12 | 部分验证 | 后端未启动时页面显示连接错误，无成功结论；重新打开页面日记仍在。未执行已启动服务的停止与恢复 |
| B13 | 未通过 | 320 × 740 视口、传统滚动条环境下 `clientWidth=305`、`scrollWidth=320`，底部横向滚动条可见；1280 × 720 桌面下两者均为 1265，无横向溢出。结果区域及确认框布局未验证 |

## 320px 问题交接

复现：在 Windows 内置浏览器打开上述本地页面，确保有足够内容触发纵向滚动，设置 320 × 740 视口。在显示传统滚动条时检查 `document.documentElement.scrollWidth > document.documentElement.clientWidth`，并观察底部横向滚动条。

该状态下 `body` 宽度和 CSS `min-width` 均为 320px；纵向滚动条占 15px 后，可用内容宽度为 305px。完整页面截图可能临时隐藏滚动条，不能用这种截图时的 `320=320` 覆盖普通视口中的复现结果。输入和列表区域未观察到文字重叠，但 B13 的无横向溢出条件未通过。

交接前端成员处理 `apps/web/src/app/styles.css` 的窄屏宽度约束，并在有纵向滚动条的 320px 视口复测。本任务未修改该文件；该问题在 Issue #11 的 B13 验收中保持待解决。

截图保存在执行电脑的仓库外，不作为构建产物提交：

- `C:/Temp/wushen-stage3-acceptance/desktop-local.jpg`
- `C:/Temp/wushen-stage3-acceptance/mobile-overflow.jpg`

截图仅含虚构记录。下载文件也只在本机，未提交到 Git。

## 剩余验收与结论

1. 前端成员在正常浏览器中补录确认框文本、取消不发送和清空后刷新流程，保留仅含虚构内容的证据；补齐写入、刷新及导出的 Network 观察。
2. 前端成员修复并复测 B13 的传统滚动条环境；有效结果布局仍需取得真实返回后检查。
3. 后端成员在本机配置 provider 并启动服务，核对 API 地址与 CORS；在浏览器分别完成配置缺失 503 和服务停止/恢复测试。
4. 用户通过页面选择并确认有效虚构案例，完成真实 Qwen、引用点击、emoji 定位及计划/负面/空分类/混合分类的人工语义评测。
5. 上述步骤通过后实测三分钟演示时长，由用户确认阶段结论和发布决定。

当前结论：离线资产与现有自动化测试通过，本地浏览器流程部分验证，发现一个窄屏布局问题；完整链路和三分钟演练未通过验收。资产 PR 使用 `Refs #11`，不关闭 Issue，不合并或发布 `main`。
