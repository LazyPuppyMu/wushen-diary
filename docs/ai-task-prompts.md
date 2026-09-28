# 三人 AI 开发任务单

这份文件可以直接发给三位开发者。每个人先切自己的分支，再把对应 Prompt 复制给 AI。

```powershell
git switch dev
git pull --ff-only origin dev
git switch -c feature/ai   # 负责人
git switch -c feature/web  # 前端
git switch -c feature/api  # 后端
```

## 共同规则

把下面这段附在每个人的 Prompt 前面：

```text
你在“吾身”项目中工作。这是一个 48 小时比赛演示版，不要扩展成完整产品。

项目原则：
1. 日记默认只保存在浏览器 IndexedDB。
2. 只有用户主动选择并确认后，前端才能请求整理 API。
3. 后端不保存日记，不记录日记原文、Prompt、完整 AI 输出或 Authorization。
4. AI 结论必须有提交记录中的精确原文 quote。后端计算 quote 的位置；找不到 quote 就拒绝。
5. 不要写哈希或 SHA256，不要为极端情况堆叠防御代码，不要加入登录、云端数据库、向量库、多 Agent、推送、社交等延期功能。
6. 每完成一个小功能就运行对应测试。不要一次重写整个项目。
7. 只修改自己负责的目录。需要改公共接口时，先在 docs/api-contract.md 记录并说明原因。
8. 不要提交 .env、真实日记、node_modules、.venv、dist 或测试缓存。

工作方式：先阅读现有代码，再给出简短实施计划；完成后列出修改文件、测试命令和未完成项。不要把 mock 数据或占位结果描述成真实 AI 结果。
```

---

## 任务 A：负责人 / AI、产品、测试

### 分支和目录

```text
分支：feature/ai
主要目录：eval/、docs/、apps/api/app/validators/
```

### 可复制 Prompt

```text
你是“吾身”的 AI 产品和评测负责人。请在现有仓库上逐步完成 AI 整理规则和评测资产，不要改动 React 页面或 FastAPI 路由。

第一步：阅读 README.md、docs/api-contract.md、apps/api/app/schemas/organize.py，确认当前请求和响应字段。

按下面顺序完成：
1. 在 docs/ 中写 Prompt v1：要求模型只返回结构化 JSON；每条结论必须包含 category、type、text、confidence 和 evidence；evidence 只允许返回 entry_id 与 quote，不允许模型生成 start/end。
2. 明确七个分类的含义：joy、fulfillment、reflection、improvement、gratitude、weight、murmur。没有证据的分类不要生成。
3. 明确 fact 与 inference 的区别。计划不能写成已完成；负面内容不能被强行包装成正面；没有原文证据就使用 insufficient 或不生成。
4. 在 eval/cases.json 中添加至少 10 条虚构日记和期望行为，覆盖：普通事实、计划未完成、负面情绪、空内容、超长内容、重复引用、缺失引用、错误 entry_id、没有可归类内容、混合多分类。
5. 在 apps/api/app/validators/ 中实现可独立测试的结果校验：entry_id 必须来自请求；quote 必须是 entry 原文的非空子串；start = content.find(quote)；end = start + len(quote)；校验失败时返回清晰错误，不修改原文。
6. 为校验器写 pytest，至少覆盖通过、quote 不存在、entry_id 不存在、空 quote、同一原文重复 quote。
7. 写一份 docs/demo-script.md，列出 3 分钟比赛演示步骤：写日记、刷新、选择、确认发送、查看分类、点击引用、演示错误引用被拒绝、导出、清空。

验收标准：
- 规则文档能让前端和后端直接实现，不依赖口头解释。
- eval 中不出现真实个人日记。
- 校验器不调用 Qwen、不访问数据库、不写日志。
- pytest 通过，且错误引用不能进入正常结果。
- 最后只提交自己负责目录的变更。
```

### A 的交付顺序

```text
规则文档 -> 虚构评测数据 -> quote 校验器 -> 测试 -> 演示脚本
```

A 不要一开始接真实 Qwen API。先把“什么结果算合格”定下来，B 和 C 才能并行开发。

---

## 任务 B：前端

### 分支和目录

```text
分支：feature/web
主要目录：apps/web/src/
```

### 可复制 Prompt

```text
你是“吾身”的前端负责人。请在现有 React + TypeScript + Vite + Dexie 项目上，完成本地日记到整理确认的前端流程。不要修改 apps/api，也不要自行发明后端字段。

先阅读 apps/web/src/app/App.tsx、apps/web/src/storage/db.ts、apps/web/src/lib/evidence.ts 和 docs/api-contract.md。

按下面顺序完成，每一步完成后测试：
1. 把当前单页拆成容易理解的 entries 和 organize 组件或 feature 目录，但不要为了拆分引入复杂状态管理。
2. 完成本地日记功能：新增、列表、按日期范围筛选、单条删除、清空全部本地数据、刷新后仍存在。IndexedDB 使用现有 Dexie 数据库，不要把日记放 localStorage。
3. 为每条日记增加选择状态。整理入口只能对已选择的记录生效。
4. 在发送前展示确认信息：记录数量、最早日期、最晚日期、总字符数，并明确说明“选中的内容会发送给 AI 服务”。用户取消时不能发请求。
5. 调用 POST /v1/organize。API 地址从环境变量读取，默认 http://127.0.0.1:8000。请求字段严格使用 docs/api-contract.md。
6. 处理 loading、网络失败、HTTP 503、校验失败；不能把错误或占位内容渲染成 AI 结果。
7. 展示七类整理结果，区分 fact/inference 和 confidence。每条结果显示原文 quote，并能定位到对应日记。
8. 在浏览器再次校验 evidence：entry_id 必须对应本地记录，content.slice(start, end) 必须等于 quote；失败时显示“待复核”，不能当作可信结论。
9. 增加 Markdown 导出和清空全部数据操作。清空前给出确认；导出只导出浏览器本地已有数据。
10. 保持移动端可用：320px 宽度不能横向溢出，textarea、列表、确认区域不能重叠。

验收标准：
- 刷新页面后日记仍在；删除和清空后列表正确更新。
- 未选择记录或未确认时绝不请求 /v1/organize。
- 确认框准确显示条数和字符数。
- API 错误不会显示伪造整理结果。
- 精确引用可定位；错误引用显示待复核。
- Markdown 导出可打开，且不上传任何数据。
- npm run build:web 和 npm run test:web 通过。
- 只提交 apps/web/ 下的变更；若必须调整接口，先暂停并说明。
```

### B 的交付顺序

```text
IndexedDB 增补 -> 选择和统计 -> 确认弹窗 -> API 调用 -> 结果和引用 -> 导出/清空 -> 移动端测试
```

B 不要先做视觉大改，也不要在前端写一套假 AI 数据。先把核心操作链路跑通。

---

## 任务 C：后端、Qwen、部署

### 分支和目录

```text
分支：feature/api
主要目录：apps/api/
```

### 可复制 Prompt

```text
你是“吾身”的后端和部署负责人。请在现有 FastAPI 项目上完成 /v1/organize 的真实后端链路。不要修改 apps/web，也不要建立云端日记数据库。

先阅读 apps/api/app/main.py、apps/api/app/routes/organize.py、apps/api/app/schemas/organize.py 和 docs/api-contract.md。

按下面顺序完成，每一步完成后测试：
1. 保持现有 POST /v1/organize 请求和响应结构；如果必须变更，先更新 docs/api-contract.md，并给前端负责人发出字段变更说明。
2. 把 quote 校验放在独立 validator 中：模型只返回 entry_id 和 quote；服务端用原始请求内容 find quote，计算 start/end；entry_id 不存在、quote 为空或找不到时拒绝整个结果或标记为待复核，不能悄悄放行。
3. 增加 Qwen DashScope HTTPX 客户端。API key、模型名、超时和允许的前端来源全部来自环境变量；API key 只能在服务端读取。
4. 设计稳定的 Prompt 和 JSON 解析流程：要求模型只输出 JSON；解析失败、字段不合规、分类不合法时返回可理解的 4xx/502 错误，不返回假结果。
5. 确认请求只在内存中处理。禁止把请求体、Prompt、模型输出、Authorization 或日记原文写入日志、文件、数据库或缓存。
6. 加入基本请求限制：entries 数量和单条字符数沿用 Pydantic 限制；超限返回 422；AI 调用设置明确超时。
7. 保持 CORS 只允许 WEB_ORIGINS 中列出的前端地址，不使用通配符加 credentials。
8. 写 pytest：health、空 entries、超长 entry、AI 成功且 quote 通过、错误 quote 被拒绝、模型 JSON 损坏、Qwen 超时、缺少 API key。
9. 更新 .env.example 和 README：写明 DASHSCOPE_API_KEY、QWEN_MODEL、WEB_ORIGINS；不要把真实密钥写进仓库。

验收标准：
- 未配置 AI 时接口明确返回 503 或配置错误，不返回 mock 结果。
- Qwen 返回的每条结论都经过 entry_id 和 quote 校验。
- start/end 由 Python 计算，绝不信任模型提供的位置。
- 日志中没有日记、Prompt、完整输出或密钥。
- uv run pytest tests 通过。
- 只提交 apps/api/、必要的 .env.example 和后端文档变更。
```

### C 的交付顺序

```text
validator -> mock transport 测试 -> Qwen 客户端 -> 路由串联 -> 错误/超时 -> CORS/配置 -> 部署说明
```

C 不要一开始就把 Qwen 调用塞进路由函数。先让 validator 和假 transport 测试稳定，再接真实网络。

---

## 合并顺序

1. A 先提交规则、数据和 validator 接口。
2. C 根据 validator 接口完成后端串联，并更新 API 契约。
3. B 根据冻结后的 API 契约完成确认、请求和结果页面。
4. 三人各自通过测试后向 `dev` 提 Pull Request。
5. 合并到 `dev` 后再做一次完整链路测试，最后才合并 `main`。

公共接口只认 `docs/api-contract.md`，不要以聊天记录或 AI 自己生成的字段为准。
