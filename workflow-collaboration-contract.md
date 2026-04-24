# Workflow Collaboration Contract

本文档用于对齐 `auto_design_agent` 当前的主执行流程、协作分工、文件结构，以及上下游之间必须稳定的输入输出字段。

适用对象：

- 主流程 Skill / reference 维护者
- 应用 variant 映射表维护者

## 1. 当前主执行流程

当前主执行模型只保留一条生产主链路：进入 `skill-main-workflow`。

重要约束：

- `skill-main-workflow` 是唯一生产主入口
- `figma-component-dictionary.md` 不再作为并列入口出现，而是主流程按需读取的组件字典 reference
- 组件切换逻辑作为主链路内部复用的组件处理步骤存在

更合理的整页流程是：

1. 读取源稿结构、截图、组件清单
2. 判断目标设备
3. 判断布局类型：`NLC / NC / LC / C`
4. 盘点页面级关键组件实例
5. 识别每个实例的 `resolvedUiElement`
6. 生成 `componentTaskList`
7. 按 `appName + device + screenMode + resolvedUiElement` 批量查询 `app-variant-map`
8. 对需要组件级处理的任务，读取 `figma-component-dictionary.md`
9. 按布局类型读取 `references/layouts/*.md` 并做回写
10. 回读 metadata 做结构校验
11. 按布局 reference 的验收项做最终校验

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

- `skill-main-workflow.md`
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

## 3. 文件结构和职责边界

### 3.1 主流程 Skill

文件：

- `skill-main-workflow.md`

职责：

- 接收入口上下文
- 默认进入整页生产主链路
- 在整页链路内生成页面级任务
- 在主链路内复用组件处理步骤
- 按布局 reference 执行布局写入

### 3.2 组件字典 reference

文件：

- `figma-component-dictionary.md`

职责：

- 探查当前实例
- 识别 `resolvedUiElement`
- 查询目标 `variantId`
- 定位组件 reference
- 决定执行动作
- 负责组件级回写和验证

### 3.3 布局 reference

文件：

- `references/layouts/lc-nc-layout.md`
- `references/layouts/nlc-layout.md`
- `references/layouts/c-layout.md`
- `references/layouts/device-dimensions.md`

职责：

- 提供目标设备尺寸、栏宽、padding、栏位职责
- 提供布局执行步骤和布局验收项
- 不作为独立 Skill 触发，必须由 `skill-main-workflow.md` 按需读取

### 3.4 通用规则 reference

文件：

- `references/common-rules.md`

职责：

- 提供通用执行原则、禁止项、clone 降级规则和分步写入规范

### 3.5 应用 variant 映射表

文件：

- `references/app-variant-map-{appName}.md`

职责：

- 在已知 `appName + device + screenMode + resolvedUiElement` 的情况下
- 返回目标结果：`resultType + variantId`

### 3.6 组件族 reference

文件：

- `references/component-dictionary/{component-family}.md`

职责：

- 提供组件族定位、真实字段、值域、执行记录、回退规则

## 4. 应用 variant 映射表层需要稳定输出给主流程的字段

上下游之间最核心的接口如下。

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
