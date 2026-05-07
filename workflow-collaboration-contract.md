# Workflow Collaboration Contract

本文档用于对齐 `auto_design_agent` 当前的主执行流程、协作分工、文件结构，以及上下游之间必须稳定的输入输出字段。

适用对象：

- 主流程 Skill / reference 维护者
- 应用 variant 映射表维护者

> 通用文件约束、类型规范、修改原则和一致性检查清单见 [AGENTS.md](./AGENTS.md)。本文档仅聚焦协作分工、执行流程和接口契约，不重复声明通用规则。

## 1. 当前主执行流程

当前主执行模型只保留一条生产主链路：进入 `SKILL`。

> 唯一主 Skill 入口、不新增并列 Skill、按需加载策略等通用约束见 [AGENTS.md](./AGENTS.md)。补充约束：

- 组件切换逻辑作为主链路内部复用的组件处理步骤存在，不作为独立入口

更合理的整页流程是：

1. 读取源稿结构、截图、组件清单
2. 判断目标设备
3. 判断布局类型：`NLC / NC / LC / C`
4. 盘点页面级关键组件实例
5. 识别每个实例的 `resolvedUiElement`
6. 生成 `componentTaskList`
7. 按 `appName + device + screenMode + resolvedUiElement` 批量查询 `app-variant-map`
8. 将 `resultType = variant` 且未标记 `hidden / absent` 的记录收敛为目标稿必落地清单
9. 对需要组件级处理的任务，读取 `figma-component-dictionary.md`
10. 按布局类型读取 `references/layouts/*.md` 并做回写
11. 回读 metadata 做结构校验
12. 按布局 reference 的验收项和 `componentTaskList` 做最终校验

其中主链路内的组件处理步骤至少包括：

1. 探查当前实例
2. 识别组件族、当前 `VariantId`、`resolvedUiElement`
3. 查组件字典层
4. 加载组件族 reference
5. 决定 `setProperties(...)` 或 `swapComponent(...)`
6. 执行 Figma 回写
7. 做截图和 metadata 验证

## 2. 当前协作分工

### 2.1 主流程 / 组件字典维护者负责

负责文件：

- `SKILL.md`
- `figma-component-dictionary.md`
- `references/component-dictionary/{component-family}.md`

负责内容：

- 主流程编排
- 页面级组件任务生成
- 当前实例探查
- `resolvedUiElement` 识别和消费
- 字典层 / 执行层
- `setProperties(...)` / `swapComponent(...)`
- Figma 回写
- metadata / screenshot 验证

### 2.2 应用 variant 映射表维护者负责

负责文件：

- `references/app-variant-map-{appName}.md`

负责内容：

- 应用级语义组件到目标设备/目标屏幕模式的结果映射
- 输出 `resultType`
- 输出目标 `variantId`
- 补齐覆盖缺口

不负责内容：

- 不负责从 Figma 文件中定位实例
- 不负责判断当前实例属于哪个语义角色
- 不负责组件切换执行
- 不负责 Figma 回写

## 3. 文件职责边界

> 文件树、类型约束和命名规范见 [AGENTS.md](./AGENTS.md)。本节仅补充各文件在协作流程中的输入输出边界。

| 文件 | 协作角色 | 输入 | 输出 |
|------|---------|------|------|
| `SKILL.md` | 主链路编排（§1 步骤 1-11） | 源稿 fileKey / nodeId | 适配完成的目标 frame |
| `figma-component-dictionary.md` | 组件级处理（§1 组件处理步骤 1-7） | 当前实例 nodeId | 执行动作 + 验证结果 |
| `references/layouts/*.md` | 布局执行参数供给 | 布局类型 + 设备 | 栏宽、padding、验收项 |
| `references/common-rules.md` | 通用执行原则供给 | — | 禁止项、降级规则、写入规范 |
| `references/app-variant-map-*.md` | 语义→目标映射（§4 详述） | appName + device + screenMode + resolvedUiElement | resultType + variantId |
| `references/component-dictionary/*.md` | 组件族定位与执行参数供给 | 组件族名 | 字段、值域、回退规则 |

补充执行约束：

- `resolvedUiElement` 和 `app-variant-map` 返回结果优先级高于组件名、组件族名和布局直觉；主流程不得仅凭组件名改写语义。
- `app-variant-map` 返回 `variant` 且未标记 `hidden` / `absent` 的组件必须进入目标稿必落地清单；无法命中标准实例时只能标记 `fallback` 或 `blocked`。
- 验证阶段必须反查 `componentTaskList`；`fallback` 不等于 `mapped`，跨组件族 fallback 不得通过验收。

## 4. 应用 variant 映射表层需要稳定输出给主流程的字段

上下游之间最核心的接口如下。

### 4.0 `layoutType` 与 `screenMode` 的区分

- `layoutType` 是页面级布局类型（合法值见 [AGENTS.md](./AGENTS.md) 一致性检查清单）
- `screenMode` 是传给 `app-variant-map` 的查询键，用于表达当前组件所处的目标画面模式
- 当前活跃映射表中的 `screenMode` 取值允许 `N / L / C / NC / LC / NLC`
- 主流程不得把两者混为同一个字段；应先判断 `layoutType`，再结合组件所在栏位或子场景生成 `screenMode`

### 4.1 输入给 `app-variant-map` 的字段

- `appName`
- `device`
- `screenMode`
- `resolvedUiElement`

说明：

- `resolvedUiElement` 由主流程 / 组件字典在探查真实实例后识别得到
- `app-variant-map` 不负责生成这个字段

### 4.2 `app-variant-map` 输出给主流程的字段

- `resultType`
- `variantId`

其中：

- `resultType` 必须固定为以下四种之一：
  - `variant`
  - `hidden`
  - `absent`
  - `undefined`
- `variantId` 只有在 `resultType = variant` 时才填写

## 5. 应用 variant 映射表维护者必须保证的字段质量

### 5.1 `resolvedUiElement` 命名要稳定

这是上游识别实例后查映射表的关键键之一。

要求：

- 同一语义组件只保留一种命名
- 不同应用内如果语义一致，优先复用同一套命名风格
- 不要在不同文档里出现多个别名同时存在

### 5.2 `resultType` 语义要稳定

- `variant`：返回可执行的 `variantId`
- `hidden`：该元素在此场景需要隐藏
- `absent`：该元素在此场景不存在
- `undefined`：该组合尚未建档，主流程应报错

### 5.3 `variantId` 要尽量是真实可执行值

要求：

- 优先写 Figma 中真实存在的正式 `VariantId`
- 不要长期保留临时命名
- 如果暂时只能用占位值，必须在 `notes` 中标记
- 只要 `resultType = variant`，主流程会按必落地任务处理；如果目标组件族尚未具备执行路径，映射表维护者应在 `notes` 中明确缺口，避免调用方误判为已完成映射

## 6. 应用 variant 映射表推荐结构

统一推荐以下结构：

1. frontmatter
2. 用途
3. 枚举定义
4. 状态约定
5. 映射表
6. 当前覆盖缺口

推荐使用扁平表，不要再写成“每个组件一张矩阵表”。

推荐列：

- `uiElement`
- `device`
- `screenMode`
- `resultType`
- `variantId`
- `notes`

## 7. 当前协作中最容易出现的问题

### 7.1 语义命名不一致

典型风险：

- 同一个语义组件在不同文件里叫法不同
- 主流程识别出的 `resolvedUiElement` 在映射表里查不到

### 7.2 `resultType` 和 `variantId` 混用

典型风险：

- 用空值代替 `absent`
- 用 `null` 语义代替 `hidden`
- 把未建档和不存在混为一类

### 7.3 把实例定位逻辑写进映射表

典型风险：

- 在 `app-variant-map` 里混入“怎么从 Figma 找节点”的逻辑
- 造成职责串层，后续无法稳定复用
