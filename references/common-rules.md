# 通用规则

本文档定义所有多终端适配 Skill 共享的执行原则和禁止项。

## 0. 快速执行摘要

1. 先探查，后修改；读取完整上下文后再动手。
2. 默认只在源稿所在当前 page 执行搜索、比对和复用。
3. 不默认搜索或复用整页目标稿；整页复用必须满足条件并经用户确认。
4. 禁止整页复用不等于禁止标准组件实例探查；目标布局依赖标准组件时必须探查。
5. `get_metadata` 是基础组件任务清单的基线，metadata 中出现的源稿直接子组件不得删除。
6. 业务内容只迁移源移动端页面已有内容，不为填满目标布局跨画布补内容。
7. 标准组件默认保持实例态，`detachInstance` 只能作为最后手段。
8. 所有写入必须分步执行；每次 `use_figma` 只处理一个逻辑单元。
9. 每一步写入后必须做截图校验和结构校验。
10. 多端适配结果默认紧邻源移动端设计稿放置，保持同一 section / 同一工作区内可直接对照。

## 1. 检索与复用边界

| 动作 | 默认规则 | 允许例外 |
| --- | --- | --- |
| 当前 page 检索 | 整页适配的搜索、比对和复用范围只允许落在源稿所在当前 page 内 | 用户明确要求“参考其他 page”或“复用其他 page 已有结果” |
| 整页目标稿复用 | 默认禁止全文件搜索并直接复用别处整页目标稿 | 同时满足整页复用条件，且用户明确确认 |
| 标准组件实例探查 | 默认允许；目标布局依赖明确标准组件时属于必做项 | 最终不用标准实例时，必须说明允许原因 |

以下信号一旦出现，应视为“当前 page 隔离约束”生效：

1. 用户明确说“不要跨 page”
2. 用户专门为当前任务新建了 page
3. 用户明确要求“就在这个 page / section 里做”

隔离约束生效时：

1. 不跨 page 搜索现成整页目标稿、旧测试样例或历史适配结果
2. 不跨 page 借用整页骨架作为当前任务的直接输入
3. 标准布局适配只能基于当前 page 的源稿、当前 page 内直接命中的节点和已加载 reference 执行

“优先复用”只适用于当前任务直接命中的组件、骨架节点或当前 frame 内可明确复用的局部结构，不等于允许默认复用整页目标稿。

只有同时满足以下条件时，才允许考虑整页复用：

1. 已按主 Skill 完成源稿读取、布局类型判断和必要 reference 加载
2. 确认候选目标稿与当前任务是同一页面内容、同一目标设备、同一布局语义
3. 候选目标稿不是“相似页面”或“历史样例”，而是可视为当前任务的等价目标稿
4. 已先向用户说明将复用现成整页目标稿，并获得明确确认

任一条件不满足时，必须回到主链路，按 reference 搭骨架、生成任务并执行，不得以“提高效率”为由直接 clone 整页结果。

当 `app-variant-map`、布局 reference、组件字典或用户明确提供了目标组件线索时，必须优先命中对应的标准实例、标准变体或标准骨架。不能因为“不要全文件探查整页目标稿”，就提前停止在当前文件内对标准组件的必要检索。

如果最终没有使用标准实例，输出中必须明确说明原因，原因只允许是以下几类：

1. 当前文件内确实不存在该标准实例
2. 当前实例无法访问、无法 clone 或无法实例化
3. 当前实例受字体、组件依赖或写入限制阻塞，且已经尝试过更直接的标准路径

导航类组件必须按语义区分，不得混用替代：

1. 手机底部导航 `BottomBar`
2. Pad `N` 栏 `Sidebar`
3. 标题栏 / `NavigationBar`
4. `StatusBar`

找到其中一种，不代表可以跳过另外一种的标准实例探查。

## 2. 内容来源边界

多端适配默认只允许迁移源移动端页面中已经存在的业务内容，不允许为了把目标布局“填满”而从其他画布、历史样例、相似页面或别的目标稿中跨画布搬运业务内容。

业务内容包括但不限于：

1. 列表项
2. 正文文案
3. 标题、副标题、摘要
4. 图片、封面、缩略图
5. 时间、标签、统计值等业务数据

执行时必须遵守“内容密度守恒”：

1. 源稿里有什么，就适配什么
2. 源稿里没有的具体业务内容，默认不要补
3. 如果源稿是空态、低保真或仅有框架，目标稿也应保持空态、低保真或框架态，只做结构适配

内容密度守恒只限制业务内容补全，不允许省略源稿已有结构组件。标题栏、状态栏、底部导航、侧边导航、抽屉指示器、FAB、搜索栏、浮层容器（浮窗 / 抽屉 / 弹窗 / 菜单）等结构组件，只要源稿存在且映射表未明确返回 `hidden` / `absent`，就必须迁移、映射或以 `fallback` 状态说明原因。

目标布局天然比手机页更宽时：

| 允许 | 禁止 |
| --- | --- |
| 扩展布局骨架 | 从其他画布拖入现成文章、卡片、图片来补内容 |
| 复制源稿里已经存在的控件、标题、导航、空态容器 | 用别处页面的数据假装当前页面已有内容 |
| 为 `L/C/N` 栏预留空白区域或占位骨架 | 因为目标布局是 `LC / NLC`，就擅自补齐列表区或详情区的业务数据 |

只有在用户明确要求“参考其他画布补齐示例内容”时，才允许跨画布引入内容；否则必须保持与源稿一致的内容边界。

## 3. 标准组件闭环

### 3.1 基础组件任务清单

`get_metadata` 是源稿直接子组件盘点的基线。凡是在 metadata 中出现的源稿直接子组件，都必须进入基础组件任务清单；如果后续 `use_figma`、局部 `get_design_context` 或脚本遍历读不到这些节点，只能记录为读取差异、访问受限或回退原因，不能把该组件从任务清单中删除。

基础组件至少包括：

1. `StatusBar`
2. `NavigationBar`
3. `BottomBar`
4. `Sidebar`
5. `SearchBar`
6. `SelectableChip`
7. `Fab`
8. `DrawerIndicator`
9. `FloatingWindow` / `DrawerWindow` / `AlertDialog` / `Menu`（浮层容器；出现时按 `layouts/device-dimensions.md` 的「浮层规格」小节与 app variant map 的「浮层」小节处理）

每个基础组件任务必须记录以下字段：

| 字段 | 要求 |
| --- | --- |
| `sourceDetected` | 是否在源稿 metadata 中出现 |
| `resolvedUiElement` | 识别后的业务语义 |
| `targetRule` | 映射表命中、布局规则要求或显式回退规则 |
| `action` | 只允许 `setProperties` / `swapComponent` / `clone` / `hide` / `skip` |
| `status` | 只允许 `mapped` / `hidden` / `absent` / `fallback` / `blocked` |
| `fallbackReason` | 仅在 `fallback` 或 `blocked` 时填写 |

基础组件任务没有逐项关闭前，不得把整页适配标记为完成。

### 3.2 标准组件实例保护

标准组件默认必须保留实例状态。对 `NavigationBar`、`StatusBar`、`Sidebar`、底部导航等标准结构组件，默认只允许做实例级的变体切换、属性调整、尺寸调整和位置调整，不允许为了规避风险而预先 `detachInstance`。

只有在以下条件同时满足时，才允许把标准组件从实例降级为普通节点：

1. 已经优先尝试过实例路径，包括必要的字体加载、`setProperties(...)`、`swapComponent(...)` 或实例级文本修改
2. 当前任务确实需要修改实例内部文本或结构，且该修改无法在实例态完成
3. 字体、组件依赖或 Figma 写入限制已经明确阻塞实例路径

一旦对标准组件执行了 `detachInstance`，输出中必须明确说明：

1. 哪个标准组件被降级
2. 为什么实例态走不通
3. 为什么这次 `detach` 是最后手段

## 3.3 实例克隆与变体切换时的尺寸同步

克隆一个标准组件实例并用 `setProperties` / `swapComponent` 切换变体后，Figma Plugin API **不会** 自动把实例尺寸调整到目标变体的默认大小。实例将保留克隆前的 width / height（即源实例 variant 的自然尺寸）。

因此，对涉及"跨设备 variant 切换"的基础组件，切换后必须根据 `layouts/device-dimensions.md` 对应设备规格 **显式 `resize(targetW, targetH)`**，不能依赖实例自带的 height。

典型踩坑组件：

| 组件 | 源 variant 自然高度 | 目标 variant 规格高度 |
|------|--------------------|------------------------|
| `状态栏-StatusBar` | 手机 38dp（常见误值） | Fold 内屏 46dp / Pad 34dp / 手机 46dp |
| `NavigationBar` | 变体间 56 / 116 / 139 等差异大 | 按 `device-dimensions.md` 各栏 NavigationBar 高度表 |
| `Drawer-Max-BottomIndicator` / `杆子` | 设备 variant 间差异 | 按设备实际控制杆 / 小白条高度 |
| `BottomBar_Showcase_*` / `ToolBar_*` | 常规态 56 / 缩小态 44 | 按工具栏规格 |
| `Sidebar_Component_PAD_NLC_*` | 设计稿上固定高度 | 须按 N 栏实际可用高度（mainH）拉伸 |

执行准则：

1. **克隆 → 切换 variant → 显式 resize 到目标规格**，缺一不可。
2. 不要以 `clone.resize(w, clone.height)` 的写法把旧高度原样保留；必须传入目标规格高度。
3. Phase 6 验收时须比对各基础组件高度与规格表，差值超过 1dp 判不合格。
4. 宽度同理：跨 screenMode / 栏宽变化时目标宽度也要显式传入。

## 3.4 variant 切换后残留 override 的清理

`swapComponent()` 会保留原 variant 遗留下来的 **节点级 override**（子节点 `x` / `width` / `layoutSizingHorizontal` / 文本 layoutGrow 等）。目标 variant 即使结构不同，实例内部仍可能被旧 variant 的尺寸定住，导致：

- 标题文本 `x`、`width` 被卡在旧值（例如原 variant 有 `左侧` 图标，swap 到无 `左侧` 的 variant 后，文本仍从原 `x=22` 开始而非 `x=0`）
- Auto-layout FILL 被旧 override 忽略，`resize()` 不再向子节点传播
- 视觉上与组件原生规格偏离（例：NavigationBar 标题文案 `28dp` 被压到 `50dp`）

执行准则：

1. `swapComponent()` 后，优先用 `inst.resetOverrides()` 清空所有实例 override，再仅重新写入必要的业务值（例：`text.characters = "笔记"`）。
2. 不要用手动调整子节点 `x` / `width` 的方式去"掰回"正确位置——先 reset，再让组件原生 auto-layout 决定位置。
3. 组件内置的 padding / 间距（例如 NavigationBar 的 `pl=28`）是 **权威值**；规格文档若与组件内置值冲突，以组件内置值为准并修正文档。
4. reset + resize 后必须校验 `text.absoluteBoundingBox.x - inst.absoluteBoundingBox.x` 是否与组件原生值一致，不一致说明 Container / text 的 `layoutSizingHorizontal` 需强制设回 `FILL`。

典型现场：NavigationBar 从 `ComponentSet_05`（含 `左侧` 返回图标）swap 到 `ComponentSet_04`（无 `左侧`）后，如果不 resetOverrides，标题 `笔记` 会停留在 `absX=50`（应为 `28`）。

## 3.4a 组件 padding 分类与容器合算规则

栏内组件分两类。本节只列出 **当前已实测验证** 的组件（笔记应用 LC / NLC 场景）。其他应用 / 组件需先经测量验证后才能加入。

### 分类（已验证）

| 类别 | 含义 | 已验证组件 | padding 处理 |
|------|------|----------|----------|
| **特殊（框架性，自身 padding 铺满）** | 屏幕上 / 下 / 侧 边的固定框架结构 | `NavigationBar` / `NavigationBar_ComponentSet_Notes`、`BottomBar_Showcase_*` / `ToolBar_*`、`Sidebar_Component_*`、`TextInput_ComponentSet_Notes` | 一律栏内 `x=0, width=栏W` 铺满，visible 由组件 internal 决定，**不与栏 spec 合算** |
| **内容容器（栏内承载中间内容）** | 栏中间承载内容、列表、搜索、标签的内容控件 | `List_Notes`（及各应用 `List_*`）、`Detail_Notes`（及各应用 `Detail_*`）、`SearchBar_ComponentSet`、`SelectableChip_ComponentSet_*` | 按所在栏 spec padding 与组件 internal padding **合算** |

> 判定要诀：「上下 / 侧 边 框架概念」=特殊；「栏内中间承载的内容控件」=内容容器。
> 未列出的组件（如 `NoticeBar`、`分段按钮` 等）在本节范围之外，**不要凭印象套用本节规则**，必须先实测后再扩充本表。

### internal padding 定义

**通用内容容器**（List / SearchBar / SelectableChip）：

`internal pl` = **组件外层 frame 的 paddingLeft** = **组件外层 frame 左缘到第一个直接子节点的水平距离**。

```javascript
const direct = inst.children[0];
const internalPl = direct.absoluteBoundingBox.x − inst.absoluteBoundingBox.x;
```

**`Detail_Notes` 特殊**（在内容容器中再做特殊处理）：

`internal pl` = **`20dp`**（Detail 自身定义的封面图左侧距离，非外层 frame paddingLeft）。Detail 的外层 frame `pl=0` 但封面图距 Detail 左缘恒为 20dp，作为 Detail 的「自带 padding」参与合算。本规则**仅适用于 Detail**，不要推广到其他组件。

### 合算规则

| 关系 | 处理 |
|------|------|
| `internal ≥ spec` | 组件外层铺满（`x=0, width=栏W`），visible（外层 + internal）= `internal`，自动 ≥ spec |
| `internal < spec` | `outer = spec − internal`，`x = outer`，`width = 栏W − 2 × outer`，visible = `outer + internal = spec` |

### 应用表（与当前 Figma 实绘一致）

| frame | 栏 | 栏宽 | spec | 组件 | internal | outer | x | 写入 width |
|-------|----|------|------|------|----------|-------|---|------------|
| Fold 内横 LC | L | 353 | 12 | SearchBar | 12 | 0 | 0 | 353 |
| | L | 353 | 12 | SelectableChip | 0 | 12 | 12 | 329 |
| | L | 353 | 12 | List_Notes | 12 | 0 | 0 | 353 |
| | C | 535 | 12 | **Detail_Notes**（特殊 internal=20） | 20 | 0 | 0 | 535 |
| Fold 内竖 LC | L | 282 | 12 | SearchBar | 12 | 0 | 0 | 282 |
| | L | 282 | 12 | SelectableChip | 0 | 12 | 12 | 258 |
| | L | 282 | 12 | List_Notes | 12 | 0 | 0 | 282 |
| | C | 346 | 12 | **Detail_Notes**（特殊 internal=20） | 20 | 0 | 0 | 346 |
| Pad 横 NLC | L | 428 | **20** | SearchBar | 12 | 8 | 8 | 412 |
| | L | 428 | 20 | List_Notes | 12 | 8 | 8 | 412 |
| | C | 722 | **28** | **Detail_Notes**（特殊 internal=20） | 20 | 8 | 8 | 706 |
| Pad 竖 NLC | L | 428 | **20**（依断点表，详见 device-dimensions.md L 栏 428 → 20dp 解释） | SearchBar | 12 | 8 | 8 | 412 |
| | L | 428 | 20 | List_Notes | 12 | 8 | 8 | 412 |
| | C | 521 | 12 | **Detail_Notes**（特殊 internal=20） | 20 | 0 | 0 | 521 |

### 执行准则

1. 通用内容容器：实测 `direct.x` 作为 internal pl。`SelectableChip` 的 `pl=0` 容易误判，必须实测。
2. `Detail_Notes`：直接使用 `internal=20`（封面图 internal 偏移），不测量外层 frame paddingLeft。
3. 比对所在栏 spec padding（详见 `device-dimensions.md` 栏 padding 表 + 断点表）。
4. 按合算规则决定 outer：`outer = max(0, spec − internal)`，写入 `inst.x = outer`，`inst.width = 栏W − 2 × outer`。
5. **特殊组件不参与合算**，永远 `x=0, width=栏W` 铺满。其 visible 由 internal 决定，可能 ≠ spec（spec 主要约束内容容器）。
6. 远程组件 internal 不可在 instance 中改写。`internal > spec` 时不参与合算（铺满 + over 接受）。

## 3.5 状态栏跨设备 variant 切换 + 强制高度

源移动端设计稿的 `状态栏-StatusBar` 实例为 **手机 variant**，clone 到 Fold / Pad 目标稿时 **不会自动切换** 到目标设备 variant。必须显式 `swapComponent` 到对应 variant，并显式 `resize` 到目标规格高度。

| 设备 | 目标 variant 名 | 目标高度 |
|------|----------------|----------|
| 手机 | `变体类型=手机` | 46dp |
| Fold 内屏 | `变体类型=fold` | 46dp |
| Pad 横/竖 | `变体类型=pad` | 34dp（**注意 pad variant 的自然高度为 38dp，必须强制 resize 到 34**） |

执行准则：

1. clone 源 `状态栏-StatusBar` 实例后，第一步 `swapComponent` 到目标设备 variant，**禁止**沿用手机 variant 适配 Fold / Pad。
2. swap 后立即 `resetOverrides() → resize(targetW, 46或34) → x=0; y=0`。
3. **Pad 自然高度陷阱**：pad variant 的 main component 自然高度为 38dp。`resize(_, 34)` 后若紧接着进行其他变更（如再次 swap 同帧内其他实例、或后续 resize），状态栏可能被自动 reflow 回 38dp。**完成所有变更后必须再次校验状态栏高度，发现 38 立即 `resize(_, 34)` 强制写回**。
4. Phase 6 验收必检项：所有 4 设备版本 status bar `(width = frameW, height ∈ {46, 34})` 与设备规格一致。

## 3.6 Sidebar / 复杂 instance 的 resize 被忽略

`Sidebar_Component_PAD_NLC_*` 等复杂 instance 在 `swapComponent` 或 `clone` 后，单纯调用 `resize(_, targetH)` 经常被忽略，instance 会保持 main component 的自然高度（如 800dp），且 `y` 坐标会被 auto-layout 重置（如 `y=115`、`y=622`）。

原因：instance 自带 vertical auto-layout，`primaryAxisSizingMode` 在 swap 之后被某种方式重置，使 `resize` 不生效。

强制写入序列：

```javascript
inst.swapComponent(targetVariant);   // 切换变体
inst.resetOverrides();                // 清空旧 override
inst.primaryAxisSizingMode = "FIXED"; // 强制改为定高（关键）
inst.resize(targetW, targetH);        // 显式高度
inst.x = 0;
inst.y = (Pad横 ? 0 : statusBarH);    // overlay 模式从 statusBarH 开始
```

执行准则：

1. Sidebar / 大型 instance 完成 swap + resetOverrides 后，**必须**显式设置 `primaryAxisSizingMode = "FIXED"`，否则 instance 会回到 800dp 自然高度。
2. 设置完后再 `resize`，最后强制 `x` / `y`。三步缺一会被 instance 内部 auto-layout 改写。
3. Phase 6 校验：Sidebar 实例的 `height === N 栏 mainH`（Pad 横）或 `height === frame.height − statusBarH`（Pad 竖 overlay）。差异即视为不合格。
4. Sidebar 实际尺寸校验后，必须比对 component 内卡片层结构是否为最新版（参见 §3.10 组件库时间戳校验）。

## 3.7 NLC 覆盖模式 遮罩 + z-order

Pad 竖屏 NLC **覆盖** 模式（N 栏覆盖于 L+C 之上）必须包含一层 **遮罩-N覆盖** 矩形，否则 N 栏与 L+C 没有视觉分层，看起来像 N 栏漂浮在内容上而非覆盖。

遮罩规格：

| 属性 | 值 |
|------|-----|
| 节点类型 | `RECTANGLE` |
| 名称 | `遮罩-N覆盖` |
| 尺寸 | `frameW × frameH`（盖满整个 frame，包括状态栏区域） |
| 位置 | `x=0, y=0` |
| 填充 | 半透明白色或半透明黑色（参考既有遮罩节点 `fills` 复制使用） |
| 圆角 | 与 frame 一致（如 Pad 34dp） |

frame 直接子级 z-order（从底到顶）：

```
1. 主内容区（包含 L 栏、C 栏）
2. 状态栏-StatusBar
3. 遮罩-N覆盖
4. 栏间分割线（如有）
5. Sidebar_Component_PAD_NLC_01（最顶层）
```

执行准则：

1. 构建 Pad 竖 NLC 覆盖 frame 时，**必须**在 Sidebar 之前先添加 `遮罩-N覆盖` 矩形。
2. Sidebar 必须是 frame 的 **最后一个** 子节点（保证最顶 z-order，阴影外溢到 L+C 上）。任何后续添加的节点（分割线等）若导致 Sidebar 不再是最后一个，必须 `frame.appendChild(sidebar)` 重新置顶。
3. Phase 6 校验：Pad 竖 NLC frame 的 `children` 顺序与上表一致。

## 3.8 栏间分割线规则

分割线节点是独立的 `RECTANGLE`，**不是** 栏 frame 的 stroke。栏 frame 的 `strokes` 数组留空。

| 布局模式 | 分割线位置 | 数量 |
|---------|-----------|------|
| LC（Fold 内横/内竖） | `x = L栏width` | 1 条 |
| NLC 并列（Pad 横） | `x = L栏width + N栏width`（即 L\|C 边界） | **1 条**，N\|L 边界 **无分割线**（Sidebar 阴影承担分隔） |
| NLC 覆盖（Pad 竖） | `x = L栏width` | 1 条 |
| NC | 无分割线（Sidebar 浮起 / 并列） | 0 条 |
| C 通栏 | 无 | 0 条 |

分割线规格：

| 属性 | 值 |
|------|-----|
| 类型 | `RECTANGLE` |
| 名称 | `栏间分割线` |
| 尺寸 | `1 × frameH`（**全帧高度**，从顶端到底部，贯穿状态栏区域） |
| 位置 | `x = 边界值, y = 0` |
| 填充 | 黑色 10% 透明（`{r:0, g:0, b:0}`, opacity `0.1`） |
| 父节点 | frame 直接子级（**不放入** 主内容区或 C 栏内部） |

执行准则：

1. 分割线必须是 frame 的直接子节点，`y=0` 高度等于 `frameH`，**不允许只画到主内容区高度** —— 否则状态栏区域分割线断开。
2. NLC 模式下 **不要** 在 N\|L 边界添加分割线。Sidebar 卡片自带阴影 + 圆角浮起，添加分割线会变成两套分隔语义重叠。
3. C 栏 / L 栏 / N 栏 frame 的 `strokes` 必须保持空数组，不允许借助 `strokeLeftWeight` 实现分隔（这种写法仅画到栏 frame 高度，无法贯穿状态栏）。
4. Phase 6 校验：分割线节点 `height === frameH`，且只有 LC / NLC 的 L\|C 边界存在分割线。

## 3.9 Sidebar 阴影裁切防止

`Sidebar_Component_PAD_NLC_*` 卡片自带圆角 + 外阴影。如果 Sidebar 所在父 frame 链上任何一层 `clipsContent = true`，阴影就会被裁掉，看起来 Sidebar 与 L 栏之间没有"浮起"分隔。

Pad 横 NLC（Sidebar 在 N 栏内，并列布局）配置：

| 容器 | clipsContent |
|------|---------|
| 目标 frame | `true`（保留圆角，外部不溢出） |
| 主内容区 | **`false`**（关键：让 N 阴影流入 L 栏） |
| N 栏 | **`false`**（关键：让阴影从 272dp 边缘外溢） |

Pad 竖 NLC（Sidebar 是 frame 直接子级，覆盖布局）配置：

| 容器 | clipsContent |
|------|---------|
| 目标 frame | `true` |
| 主内容区 | 不影响（Sidebar 不在主内容区内） |

执行准则：

1. 构建 Pad 横 NLC 时，N 栏 frame 与主内容区 frame 都必须 `clipsContent = false`，否则 Sidebar 阴影截断。
2. 目标 frame 的 `clipsContent` 保持 `true` 维持设备圆角形态，阴影只在 frame 内部扩散是合理的。
3. Phase 6 校验：Pad 横截图能看到 Sidebar 右侧阴影渐变越过 N\|L 边界进入 L 栏。

## 3.10 组件库时间戳校验

设计系统组件会被持续更新。同一组件 `componentKey` 在不同时间点对应的内部结构可能已变更（卡片偏移、内边距、子节点层级等）。clone 已在文件中的旧实例会保留旧结构。

近期已知重大更新：

| 组件 | 更新日期 | 旧版结构 | 新版结构 | 影响 |
|------|---------|----------|----------|------|
| `Sidebar_Component_PAD_NLC_01`（在 `BottomBar` set 中，key `414cabc8e633c33cc6441ff0f936f971dc9babd3`） | 2026-05-15 | 卡片 `y=6, h=782` | 卡片 `y=0, h=788` | 卡片紧贴外壳上沿，无 6dp 顶部空间 |
| `NavigationAtoms` 高度（`Sidebar` 内部使用） | 2026-05-14 之前 | 44dp | 56dp | 内容区域起点变为 `y = 56 + 6 = 62` |

执行准则：

1. clone 文件内已落地的旧 instance 之前，先 `search_design_system` 用名称搜索，对比 `updatedAt` 时间戳。如果设计系统中存在更新版本，**优先 `importComponentSetByKeyAsync` 导入并替换**，不要继续 clone 旧结构。
2. 若上一次会话留下的目标稿使用了旧 component 实例（mainComponent ID 与新导入版本不同），新会话应该考虑替换为新版本，并记录 diff（如卡片 `y` 由 6 变为 0）。
3. 替换流程：`importComponentSetByKeyAsync(key) → 找到目标 variant → 旧 instance.swapComponent(新 variant) → resetOverrides → §3.6 强制 resize 序列`。
4. Phase 6 验收时，**怀疑视觉异常**（如卡片顶部多余留白、内容起点错位）应优先怀疑 component 库版本不一致，而非 instance 自身写错。

## 4. 写入与降级策略

实现方式按以下顺序选择：

1. `search_design_system` 搜索并复用已有组件/变体
2. clone 画布上的现成节点
3. 使用 Plugin API 新建节点，作为最后手段

能 clone 已落地节点时，不优先 `createInstance`。

出现以下情况时，立即从组件实例化切换到 clone 策略：

1. `createInstance()` 失败
2. `appendChild()` 因字体问题失败
3. 组件依赖不可用字体
4. 实例内部文本难以稳定修改

降级后：clone 已在画布中的现成节点，优先改布局、尺寸、位置，不改组件内部结构。

标准组件映射失败时的降级顺序为：

1. 优先尝试标准实例或标准变体映射
2. 若实例化、变体切换或字体加载失败，clone 源组件
3. 对 clone 结果执行必要的 `fixFonts`
4. 将 clone 结果 resize / Auto Layout 收敛到目标栏宽和目标高度
5. 在基础组件任务中标记 `status = fallback` 并记录原因

除非映射表或布局规则明确返回 `hidden` / `absent`，否则标准组件映射失败不能直接省略该组件。

## 5. 目标稿落位规则

多端适配的目标 frame 默认直接放在源移动端设计稿旁边，并遵守以下规则：

1. 优先放在与源稿相同的 section 内；如果源稿不在 section 内，则放在同一 page 的源稿右侧
2. 优先保持与源稿相同的 `y` 起点，方便横向对照
3. 多个目标设备从左到右顺序排布，默认顺序为：`Fold横屏 → Fold竖屏 → Pad横屏 → Pad竖屏`
4. 相邻目标 frame 之间保留固定且可读的水平间距，不要与无关样例交错摆放
5. 如果当前 section 内已有同任务目标稿，则优先在这些目标稿后方继续顺排，而不是跳到文件其他区域
6. 只有在用户明确指定其他位置或当前局部空间不足时，才允许调整到别处；如调整，输出中必须说明

推荐默认间距：

| 场景 | 间距 |
| --- | --- |
| 源稿与第一个目标稿之间 | `75dp` |
| 相邻目标稿之间 | `60dp` |

## 6. 校验与修正

每次 `use_figma` 调用只处理一个逻辑单元。步骤间需要：

1. 记录上一步创建的 node ID
2. 截图校验当前状态
3. 结构校验关键节点的尺寸和位置
4. 确认无误后再进入下一步

结果不符合预期时，按以下顺序修正：

1. 先修尺寸
2. 再修位置
3. 最后修文本或局部视觉

只做局部修正，不整页推翻重做。

### 6.1 容器 resize / 结构变更 原子单位

在改动 non-autolayout Frame（`L 栏` / `C 栏` / `N 栏` / `main` 等）的宽度或结构时，以下三步必须作为 **单一原子单位** 执行，中途中断会留下不一致的画布状态：

1. `container.resize(newW, newH)`
2. 在同一次 `use_figma` 调用内立即执行 `for (child of container.children) { child.resize(newW, child.height); child.x = 0; }`
3. 调用结束后立即用 `get_screenshot` 验证对应 frame（或其所在 section）

**原因**：non-autolayout 容器不会把自身宽度自动传递给子节点。若只 resize 容器，子节点仍保持旧宽度，下一步操作将建立在错误前提之上；若「先容器、后子节点」拆开执行，一旦漏掉第 2 步，第 1 步的成功会掩盖问题。

**适用场景**：

- 覆盖 ↔ 并列 切换导致 `L / C / N` 宽度变化
- NLC ↔ LC ↔ NC 等布局类型的重构
- 分割线 / 边距 / 分栏比例调整导致栏宽发生实际变化的任何情况
- 浮层用 non-autolayout 容器尺寸变化但保留既有子节点时

**禁止**：

- 以 token 成本 / 响应速度为由跳过上述三步中的任意一步
- 仅 resize 容器、以「子节点稍后再修」为由进入下一操作

### 6.2 多端适配 Phase 6 强制检查清单

每次完成多端适配后，必须按下表逐项验证。任一项不通过判为未完成。

| # | 检查项 | 通过标准 |
|---|--------|----------|
| 1 | Section 命名 | 含测试名 + 日期（如 `TEST_xxx_2026-05-15_..._KIM`） |
| 2 | 4 个目标版本完整 | Fold横/竖 + Pad横/竖 全部存在，对照 `targetVariantPlan` 无遗漏 |
| 3 | 设备 frame 圆角 | Fold 内屏 50dp / Pad 34dp 精确匹配 |
| 4 | 状态栏 variant + 高度 | Fold 用 `变体类型=fold`（46dp），Pad 用 `变体类型=pad`（**34dp，非 38dp 自然高度**） |
| 5 | 状态栏宽度 | 等于目标 frame 宽度 |
| 6 | 主内容区 y 起点 | 等于 statusBarH（46 或 34），不依赖 status bar 自然高度 |
| 7 | 栏宽 | 与 `device-dimensions.md` 表完全一致（如 Fold 内竖 LC: L=282 + C=346） |
| 8 | NavigationBar 标题 absX | 与 main component 自然值一致（变体 04: 28dp）；不一致即怀疑 swap 后未 `resetOverrides` |
| 9 | Sidebar 高度 | Pad 横 = N 栏 mainH；Pad 竖覆盖 = frameH − statusBarH。**经过 §3.6 强制 resize 序列** |
| 10 | Sidebar 卡片 y | 新版（2026-05-15+）= 0；旧版 = 6。怀疑卡片有多余顶部空白时切换到新版 |
| 11 | NLC 覆盖遮罩 | Pad 竖 NLC 必须有 `遮罩-N覆盖` RECTANGLE，z-order 在 Sidebar 下方 |
| 12 | frame 子节点 z-order（Pad 竖 NLC） | `主内容区 → 状态栏 → 遮罩 → 分割线 → Sidebar`（Sidebar 最后） |
| 13 | 栏间分割线 | LC 1 条（L\|C）；NLC 并列 1 条（L\|C，**N\|L 无**）；NC / C 通栏 0 条 |
| 14 | 分割线高度 | 等于 frameH（贯穿状态栏到底部），不允许只到主内容区高度 |
| 15 | Sidebar 阴影 | Pad 横 N 栏 + 主内容区 `clipsContent = false`，截图能看到阴影越过 N\|L 边界 |
| 16 | 浮动 Tab / 键盘 / 玻璃材质 | 删除或 `visible=false`，不得保留移动端语义 |
| 17 | 组件库时间戳 | 怀疑视觉异常时优先 `search_design_system` 比对 `updatedAt`，使用最新版本 |
| 18 | 内容容器 padding 合算（按 §3.4a 应用表完全一致） | 各 frame × 栏 × 组件 实际 `x` / `width` 与 §3.4a 应用表逐项一致；`Detail_Notes` 用 internal=20（特殊），其他内容容器用实测 direct child x |
| 19 | 特殊组件铺满 | `NavigationBar` / `BottomBar` / `ToolBar` / `Sidebar` / `TextInput_Notes` 在所属栏内 `x=0, width=栏W`，不参与合算，**禁止**给它们加 outer 偏移 |
| 20 | Pad 竖 L 栏 padding 取值 | Pad 竖 NLC L 栏 `padding=20`（依 `device-dimensions.md` 断点表，非该设备「各栏间距」表的 12）；内容容器（List/Search）`outer=8`，组件最终 `x=8, width=412` |

### 6.3 每个目标 frame 写入完成后的强制截图

每完成一个目标 frame（4 个版本中的一个）必须立即 `get_screenshot` 验证，**不允许等到 4 个全部完成后再统一验证**。原因：早期错误（如 status bar variant 错、Sidebar 高度 800dp）会被克隆传播到后续 frame，最后再修需要重做多个 frame。

写入 → 截图 → 校验清单 6.2 中本 frame 的相关项 → 通过后再写下一个 frame。

## 7. 禁止项索引

1. 禁止新建「V2」「副本」「新页面」等并行设计稿，除非用户明确要求。
2. 禁止一次性写入超过 10 个节点的大脚本（20KB 响应限制）。
3. 禁止修改组件内部结构；只改属性、尺寸、位置。
4. 禁止使用自定义字体（Figma MCP 不支持）。
5. 禁止插入图片资源（Figma MCP 不支持）。
6. 禁止把“全文件探查可复用目标稿”作为默认步骤。
7. 禁止在未向用户确认的情况下，直接复用别处已完成的整页目标稿。
8. 禁止在用户已给出“当前 page 隔离约束”后，跨 page 搜索、比对或复用旧测试样例、整页骨架或历史结果。
9. 禁止把“不要整页复用”错误扩大成“组件级标准实例也不要查”。
10. 禁止在 `app-variant-map` 或布局 reference 已明确给出目标实例的情况下，跳过对该标准实例的优先命中。
11. 禁止将标准组件默认断开实例，直接变成普通 `Frame` / 节点。
12. 禁止跨画布搬运源稿中不存在的具体业务内容，用来填充目标适配稿。
13. 禁止将适配结果默认落到远离源稿的位置，导致用户无法就地对照。
14. 禁止 clone 源 `状态栏-StatusBar` 后沿用手机 variant 适配 Fold / Pad，必须 swap 到目标设备 variant 并显式 resize（详见 §3.5）。
15. 禁止只调用 `inst.resize()` 来设定 Sidebar 高度，必须先 `primaryAxisSizingMode = "FIXED"` 再 resize 再强制 `x` / `y`（详见 §3.6）。
16. 禁止省略 Pad 竖 NLC 覆盖模式的 `遮罩-N覆盖` 矩形（详见 §3.7）。
17. 禁止在 NLC 模式 N\|L 边界添加分割线；只 LC / NLC 的 L\|C 边界画 1 条全帧高度分割线（详见 §3.8）。
18. 禁止用 C 栏 `strokeLeftWeight` 实现栏间分割线 —— 只能贯穿到栏 frame 高度，无法贯穿状态栏（详见 §3.8）。
19. 禁止 N 栏或主内容区 `clipsContent = true`（Pad 横 NLC），会裁掉 Sidebar 阴影（详见 §3.9）。
20. 禁止 4 个目标 frame 全部写完之后再统一验证；每完成一个 frame 立即截图 + 检查清单 6.2 相关项（详见 §6.3）。
