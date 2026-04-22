---
name: figma-navigation-framework-components
description: 在 Xiaomi Hyper OS4 UI Kit 中调用导航框架类组件，并根据目标设备、方向和布局切换正确的组件或属性。适用于“标题栏切到 Q18”“Pad 端标题栏应该用哪个组件”“搜索栏/标签栏/分段按钮/底部导航栏/底部工具栏/侧边导航栏如何获取和切换属性”等场景。
disable-model-invocation: false
---

# Figma 导航框架组件调用

使用这个 skill 处理导航框架类组件的两类问题：

1. **获取组件**：应该从哪个组件集、哪个变体、哪个 Figma 锚点取组件
2. **切换属性**：当目标设备从手机切到 Fold Q18 或 Pad 时，实例的属性该切到哪个值

本 skill 只处理**组件调用与属性切换**，不负责整页布局重组。

## 适用场景

- “把移动端标题栏切成 Q18 版本”
- “Pad 端标题栏该调用哪个组件”
- “底部导航栏在 NLC / NC / LC / C 下怎么处理”
- “搜索栏、标签栏、分段按钮应该如何获取和切换属性”
- “给我一个稳定的 Figma 组件获取与变体切换流程”

## 组件范围

本 skill 当前覆盖第一波导航框架组件：

- 标题栏（NavigationBar）
- Pad 端标题栏（Pad-TopBar）
- 搜索栏（SearchBar）
- 标签栏
- 分段按钮（SegmentedControls）
- 底部导航栏（BottomBar / BottomTab）
- 底部工具栏
- 侧边导航栏（Sidebar）

组件锚点、关键词和已知切换规则见：`references/navigation-framework-components.md`

## 核心原则

1. 先区分这是**同组件族属性切换**还是**跨组件族替换**
2. 不猜属性名，必须先探查实例的 `variantProperties`、`componentProperties` 和 `mainComponent`
3. 优先复用现有组件族；只有设备语义变化时才跨组件族替换
4. 搜索组件优先 `search_design_system`，搜索不稳定时再查 reference 和 componentKey
5. 目标是“语义正确 + 变体正确”，不是把所有组件都强行切成同一套属性

## 强制工作流

### Phase 1：识别任务类型

先明确以下信息：

- 源组件是什么：标题栏、搜索栏、标签栏、分段按钮、底部导航栏、底部工具栏还是侧边导航栏
- 目标设备是什么：手机 / Fold Q18 / Pad
- 目标方向是什么：竖屏 / 横屏
- 目标布局角色是什么：N 栏 / L 栏 / C 栏 / 通栏
- 当前动作是什么：
  - 同组件族切属性
  - 更换为另一组件族
  - 新插入一个目标组件

判断规则：

- **同组件族属性切换**：例如手机标题栏切到 Q18 变体、底部导航竖屏切横屏
- **跨组件族替换**：例如手机底部导航转侧边导航、手机标题栏替换为 Pad-TopBar

### Phase 2：获取正确的目标组件

按以下优先级获取：

1. 如果画布里已有当前页面同语义实例，优先读取该实例并复用
2. 用 `search_design_system` 按 reference 中的推荐关键词搜索目标组件
3. 如果搜索结果不准，使用 `references/navigation-framework-components.md` 中的 Figma 锚点和 node-id 重新定位
4. 如果已经有 `componentKey`，查 `references/component-routing.md`
5. 以上都不稳定时，clone 画布上已存在的目标设备实例

注意：

- “获取组件”和“切属性”是两步，不要混为一步
- 如果目标是 Pad L/C 栏标题栏，优先考虑直接换成 `Pad-TopBar`，而不是强行把手机 NavigationBar 改成 Pad 语义

### Phase 3：探查实例属性，不要猜

必须读取：

- 当前实例的 `variantProperties`
- 当前实例的 `componentProperties`
- `mainComponent` 的名字
- `mainComponent.parent` 下所有 sibling 变体名称或可选值

尤其注意：

- 同名“标题栏”可能来自不同组件集，属性名完全不同
- 已知案例里，标题栏可能出现 `样式`、`标题类型` 这类不同属性键
- 已知案例里，标签栏至少出现过 `状态`、`样式`

如果探查不到稳定属性名：

- 不要盲切
- 改为换组件族或 clone 目标变体

### Phase 4：执行导航框架组件切换

#### A. 标题栏

读取：

- `references/navigation-framework-components.md`
- `references/component-adaptation.md`
- `references/device-dimensions.md`

执行规则：

- **手机 → Fold Q18**
  - 如果还是同一套 NavigationBar 组件集，优先切到 Q18 对应的中标题变体
  - 已知案例 1：左栏标题栏属性键为 `样式`，值从 `大标题` 切到 `中标题一级`
  - 已知案例 2：另一套标题栏属性键为 `标题类型`，常见目标值是 `中标题（Q18）` 或 `中标题二级页`
  - 多行标题优先选择 64dp 对应变体
- **手机 → Pad**
  - N 栏：使用 Pad 语义标题栏，按层级选 `中标题` 或 `大标题`
  - L 栏 / C 栏：优先换成 `Pad-TopBar`，通常使用小标题 56dp
- 如果只是同设备内调整层级，优先同组件族内切属性；如果设备语义变了，优先换组件

#### B. 搜索栏

读取：

- `references/navigation-framework-components.md`
- `references/component-routing.md`

执行规则：

- 优先使用 `SearchBar-ComponentSet`
- 如果只是屏幕变宽，先保持组件族不变，优先调整容器宽度
- 只有在组件集里明确存在横屏/小尺寸/Pad 变体时，才做属性切换
- 不改搜索栏内部结构，不手搓输入框、图标、占位符

#### C. 标签栏

读取：

- `references/navigation-framework-components.md`
- `references/workflow-log-foldable-adapt-v1.md`（仅在 Q18 标签栏切换时）

执行规则：

- 先探查标签栏有哪些属性键和值
- 已知案例：标签栏存在 `样式`，可从 `白底` 切到 `灰底`
- 已知案例：标签栏存在 `状态`，需保留当前交互态，不要只切样式忘记状态
- 如果目标是 Fold Q18 列表场景，优先使用与 Q18 视觉一致的灰底样式

#### D. 分段按钮

读取：

- `references/navigation-framework-components.md`

执行规则：

- 优先搜索 `SegmentedControls`
- 保留源组件的分段数量、当前选中态和文案顺序
- 先判断是否只是宽度变化；如果只是宽度变化，优先改容器尺寸
- 只有组件集明确存在不同设备变体时，才做属性切换

#### E. 底部导航栏 / 底部 Tab

读取：

- `references/navigation-framework-components.md`
- `references/component-adaptation.md`
- `references/component-routing.md`
- `references/device-dimensions.md`

执行规则：

- **手机 → NLC / NC**
  - 底部导航不是切属性，而是**替换为 Sidebar**
  - 需要把源页面底部 Tab 的图标、文案、顺序、选中态迁移到侧边导航
- **手机 → LC / C**
  - 底部导航通常保留为悬浮底部导航
- **竖屏 → 横屏**
  - 同组件族优先切横屏变体
  - 已知组件：`BottomBar-Showcase` → `BottomBar-Horizontal-Showcase`
  - 已知组件：`BottomTab-Showcase` → `BottomTab-Horizontal-Showcase`

#### F. 底部工具栏

读取：

- `references/navigation-framework-components.md`

执行规则：

- 先判断源页面的底部工具栏是页面级操作区还是局部浮层操作区
- 若仍保留底部工具栏语义，优先保留组件族，只调整宽度、对齐和位置
- 若大屏场景已被分栏或侧边操作替代，不要机械保留底部工具栏
- 该组件当前只提供 Figma 锚点，具体属性值必须先探查再切换

#### G. 侧边导航栏

读取：

- `references/navigation-framework-components.md`
- `references/component-routing.md`
- `references/layout-lc-nc.md` 或 `references/layout-nlc.md`

执行规则：

- 用于 NLC / NC 的 N 栏
- 不是从底部导航“切一个属性”得到，而是直接调用 `Sidebar` 组件族
- 导航项数量、顺序、选中态必须来自源页面底部 Tab
- 如果有展开 / 收起态，先探查实例属性，再决定是否切换

### Phase 5：写入与校验

每次只处理一个逻辑单元：

- 获取一个组件
- 或切一个组件的属性
- 或替换一个组件族

每步之后都要做：

1. 结构校验：实例是否仍然挂在正确容器下
2. 属性校验：目标属性值是否生效
3. 截图校验：视觉是否与目标设备一致

## 输出要求

执行本 skill 时，最终至少输出以下信息：

- 识别到的组件名
- 目标设备 / 方向 / 布局角色
- 获取方式：
  - `search_design_system`
  - Figma 锚点
  - `component-routing.md`
  - clone
- 实际探查到的属性键
- 实际执行的切换：
  - 同组件族切属性
  - 或跨组件族替换
- 兜底方案：若属性名不稳定，改用什么方式

## 验收标准

- 不凭空猜属性名和属性值
- 标题栏能区分手机 NavigationBar、Fold Q18 变体、Pad-TopBar 三种语义
- 底部导航能区分“同族横屏切换”和“替换为 Sidebar”两类操作
- 标签栏和分段按钮不会只改外观而丢失选中态
- 搜索栏、底部工具栏优先复用组件族，不手工拼组件内部结构
- 所有组件调用都能回溯到 reference 或实际探查结果
