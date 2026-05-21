# 通用规则

本文档定义所有多终端适配 Skill 共享的执行原则和禁止项。

## §0. 快速执行摘要

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
11. **任何组件落位、变体切换、resize 必须走 `references/component-placement-protocol.md` 的标准序列**，禁止 inline 重写。Phase 6 必须调用 `verifyChecklist(...)`，错误项必须修复后才能汇报完成。
12. **任何 fill 写入必须经 token 解析**（`bindFill(...)`）。直接写 RGB SOLID 仅作为 fallback，必须留告警。Phase 0/4 调用 `buildTokenCache()` 一次性加载所有库 token。
13. **数据不确定时立即报告，禁止猜测**。CSV 损坏 / 编码异常 / 字段缺失 / 映射条目带「需要Check / 待补 / `(／／／)`」标记 等情况，必须中止并向用户报告。禁止用「合理推测」「按上下文推断」填补未知数据。
14. **栏标识前缀格式统一**：表格 / 文档 / 输出 / 注释中提到栏归属时，**必须用** `L栏：` / `C栏：` / `N栏：`（**含全角冒号**）。禁止变体写法如 `L栏 ：` / `L 栏:` / `L:` / `L-栏` 等。这是跨文档一致性约定，便于 grep 和自动校验。
15. **Phase 2 钻取层级塌缩检测必做**：源稿多个 phone frame 是同一内容的不同导航深度（list / detail / edit 等）时，`targetVariantPlan` 项数 = **设备 × 方向数**，**不与源 frame 数相乘**。AskUserQuestion 询问 scope 前必须先汇报计数结果 + 塌缩判定。检测触发条件与例外见 `SKILL.md` Phase 2 补充节「targetVariantPlan 计数规则」。
16. **用户拒绝发言精确范围适用**：用户说「X 不用」/「X 不该出现」时，仅删除 X 本身。**禁止**自动牵连删除堆叠的其它独立组件（Y/Z 等），即使它们语义相邻。模糊时先 confirm。例：用户说「NoteEditPanel 这里不用」 ≠ 同时删除 TextInput（两者各自独立，spec 里来自不同表行）。
17. **遮罩 / z-order 决策禁止推测**：遮罩位置、尺寸、z-order 必须按以下顺序直接 read 源文件，不可凭直觉：
    - `device-dimensions.md`「遮罩定义 / 适用范围」（基本范围 + 触发控件除外原则）
    - 应用 `app-variant-map-{app}.md`「遮罩规则」（应用专用触发条件 + 范围）
    - `component-placement-protocol.md §3` (z-order 模板)
    - 如有用户提供 reference frame，**直接 dump 其 children z-order 比对**，不要从 spec text 推测多 mask 叠加顺序。
18. **A 类标准组件 padding 风满（核心规则）**：所有自带 internal padding 的标准组件（StatusBar / NavBar / TopBar / SearchBar / Chip / List / Detail / ToolBar / BottomBar / Sidebar / TextInput / Fab 等）一律 `x = 0, width = 栏W` 风满。**禁止任何 outer 合算**，禁止把 device-dim 断点表 spec 应用到 A 类组件。视觉 padding 由组件 internal 提供（默认 12dp）。详见 §3.4a.1 A/B 二分。
19. **应用专用 N 收起 L 栏 width 规则**：笔记 / 待办 NL framework 收起态下 N 栏自身消失（不是 device-dim 通用 N=88 + L 缩窄），**L 栏 width = frameW**（吸收 N 宽度）。其它应用按各自 `app-variant-map-{app}.md` 声明，未声明则沿用 device-dim 通用规则。落位 L 栏 frame 时必须先查 app-variant-map 是否有覆盖。
20. **inner componentProperties 必须与源稿同步**：源稿 instance 的内部 INSTANCE 子节点 `componentProperties`（如 ToolBar 按钮 `状态=禁用` / `数量=4个`、List item 编辑态、SearchBar 激活态等）反映源稿业务态。适配 frame 必须递归继承，**禁止** 仅 swap 顶层 variant 而 inner state 停留在 main default。Phase 1 dump `sourceInnerStateMap` → Phase 5 `placeStandardComponent({ sourceInst, inheritInnerState=true })` 自动继承 → Phase 6 verifyChecklist ⑯ 通过 `spec.componentChecks[i].sourceInstId` 自动比对差异。详见 `component-placement-protocol.md §2 内部状态继承` + §6.2 #25。
21. **组件 import 时源稿实际 ComponentSet 优先**：Phase 4 组件 import 时，**必须先读取源稿 instance 的 `mainComponent.parent`（= 源稿实际使用的 ComponentSet）**，从该 set 中查找目标 variant。`search_design_system` 同名结果可能返回不同 set（同名异库），直接采用会导致错误组件落位。仅当源稿中不存在该组件时才走 `search_design_system` 路径。
22. **源稿实际 variant 与 CSV / 映射表冲突时处理**：源稿 instance 的实际 variant 与 `app-variant-map` 映射表不一致时，**以源稿实际 variant 为准**执行适配，同时向用户报告差异并建议更新映射表。原因：源稿是设计师最新交付物，映射表可能滞后。（与 §3.11 互补：§3.11 处理 CSV vs .md 冲突；本条处理源稿实物 vs 映射表冲突）
23. **禁止以「视觉无影响」为由跳过正确 variant 匹配**：组件的 device-specific variant（如 `杆子` 的 `设备=折叠屏/pad × 横竖屏=横屏/竖屏`）必须按目标设备 + 方向精确选择。即使当前 variant 视觉上透明 / 不可见 / 与目标 variant 外观一致，也**不允许**保留错误 variant。原因：①设计系统的 variant 携带语义信息（适用设备、方向等），后续自动化检查 / 主题切换 / 深色模式可能产生差异；②「视觉无影响」是当前状态的主观判断，不是持久保证；③映射表 / spec 规定的精确值是强制要求，无豁免条件。

24. **HyperOS v0.8 库组件禁止使用（MUST）**：所有 import 必须来自文件已订阅的三个权威库（`Xiaomi HyperOS 业务组件库` / `HyperOS4-Design-Token-Lib` / `Xiaomi Hyper OS4 UI Kit: Figma UI Kit 4.0 AI 测试版`）。**`Xiaomi HyperOS v0.8`（libraryKey `lk-bd807c2a...`）绝对禁止**。v0.8 与 OS4 UI Kit 中存在同名 ComponentSet（如 `杆子` / `StatusBar` 等），`importComponentSetByKeyAsync` 可能跨库调用成功但实际 import 旧库版本。**强制验证流程**：Phase 5 落位完成后，对任一关键组件 instance 执行 `inst.mainComponent.remote === true` + Figma UI 右侧面板确认 library name 不含 "v0.8"。§0.4 记录的 key 如经 Figma UI 确认来自 v0.8 → 必须立即用 `search_design_system`（scope = OS4 UI Kit libraryKey）找到正确 key 并替换。

## §0.5 组件源文件架构（强制，Phase 4 / Phase 5 前置）

### §0.5.1 两个权威源文件

所有多端适配的组件**必须且仅从**以下两个 Figma 文件获取：

| # | 文件名 | fileKey | 角色 | 典型组件 |
|---|--------|---------|------|---------|
| 1 | **Xiaomi-HyperOS-业务组件库** | `mrvMGwkbZ7qZML7iOfQsvI` | 应用专属业务组件 | List_Task, DetailTask, List_Notes, Detail_Notes, AIWindow_Notes, RecordNotes, NewTaskWindow, TextInput_Notes, BottomBar_Showcase_Notes, BottomBar_NoteEditPanel 等 |
| 2 | **Xiaomi-Hyper-OS4-UI-Kit** | `FBvQ3xM5C62MgIcA1JHWIs` | 系统通用组件 | StatusBar, NavigationBar, SearchBar, BottomBar, Sidebar, ToolBar, Fab, SelectableChip, SwipeIndicator, TopBar, Scrollbar, Menu, FloatingWindow 等 |

### §0.5.2 CSV 与源文件的关系

| CSV | 内容 | 与源文件关系 |
|-----|------|-------------|
| **控件总表**（结构变化表——总表） | 应用 × 设备 × screenMode → variantId 全量映射 | 每个 variantId 对应上述两文件之一中的实际组件变体 |
| **控件变体清单**（全表） | 所有 variant 的 ComponentFamily / VariantId / Space(padding) / 完成状况 | variant 是否已落地、spacing spec 的权威来源 |

### §0.5.3 执行约束

| # | 规则 |
|---|------|
| 1 | **framework 判定必须基于 CSV 控件总表**：判断某 app 在某 device 下是否有 C 栏内容（Detail / Fab / TextInput 等），以 CSV 该 app 行的对应设备列是否存在 `C栏：XXX` 为准。**禁止**仅根据源 section 内是否有 detail frame 来判断 framework |
| 2 | **Phase 4 variant lookup**：`app-variant-map-{app}.md` 映射表 → CSV 控件总表（cross-check）→ 源文件 import。三者一致时直接执行；不一致时按 §3.11 冲突处理 |
| 3 | **源 section 内未见 detail frame ≠ 该 app 无 detail**：业务组件库中的 Detail 组件（如 `DetailTask_01`）通过 `importComponentByKeyAsync` 导入，不要求源 section 中预先存在 detail frame |
| 4 | **`search_design_system` 查询时**：优先使用 `app-variant-map-{app}.md §0.4` 中记录的 component set key；未记录时用 CSV 控件变体清单中的 ComponentFamily + VariantId 构造查询词 |

### §0.5.4 常见误判与纠正

| 误判 | 根因 | 正确做法 |
|------|------|---------|
| "源 frame 无 detail → 判定 NL" | 仅看源 section，未查 CSV | 查 CSV 控件总表该 app 行 `C栏` 列；存在 DetailTask / DetailNotes → LC/NLC |
| "业务组件库是另一个文件，与适配无关" | 不了解两文件架构 | 业务组件库 = 业务组件唯一权威源 |
| "手机源稿是单一列表页所以大屏也只有列表" | 忽视大屏 C 栏内容来自库而非源稿 | 大屏 LC/NLC 的 C 栏通过 import 库组件填充 |

## §1. 检索与复用边界

### §1.1 默认范围

| 动作 | 默认规则 | 允许例外 |
| --- | --- | --- |
| 当前 page 检索 | 搜索 / 比对 / 复用 仅限源稿当前 page | 用户明确要求"参考其他 page" |
| 整页目标稿复用 | **禁止**全文件搜索并直接复用别处整页结果 | 同时满足 §1.3 全部条件 + 用户确认 |
| 标准组件实例探查 | **允许**；目标布局依赖标准组件时**必做** | 不用标准实例时必须说明 §1.4 三类原因之一 |

### §1.2 当前 page 隔离约束

| 触发信号（任一） | 约束生效后禁止动作 |
|---|---|
| 用户说"不要跨 page" | 跨 page 搜索现成整页目标稿 / 旧测试样例 |
| 用户为当前任务新建 page | 跨 page 借用整页骨架 |
| 用户说"就在这个 page / section 里做" | 用其它 page 节点作为当前任务直接输入 |

隔离约束下只允许：源稿 / 当前 page 直接命中的节点 / 已加载 reference 的内容。

### §1.3 整页复用允许条件（必须**全部**满足）

1. 已按主 Skill 完成源稿读取、布局判断、reference 加载
2. 候选目标稿 = 同页面内容 + 同目标设备 + 同布局语义
3. 候选目标稿是"等价目标稿"，**不是**相似页面 / 历史样例
4. 已向用户说明并获明确确认

任一缺失 → 回到主链路，按 reference 搭骨架。

### §1.4 不用标准实例的允许原因（仅以下三类）

1. 当前文件内确实不存在该标准实例
2. 当前实例无法访问 / 无法 clone / 无法实例化
3. 实例受字体 / 依赖 / 写入限制阻塞，且已尝试更直接的标准路径

### §1.5 导航族不可混用

| 组件 | 语义 |
|---|---|
| `BottomBar` | 手机底部导航 |
| `Sidebar` | Pad N 栏 |
| `NavigationBar` | 标题栏 |
| `StatusBar` | 状态栏 |

**找到其中一种 ≠ 跳过其它的标准实例探查**。`app-variant-map` / 布局 reference / 字典 给出明确组件线索时，必须按线索探查命中。

## §2. 内容来源边界

### §2.1 内容密度守恒（核心原则）

| 源稿状态 | 目标稿状态 |
|---|---|
| 有 X 列表项 | 有 X 列表项（不可补到 Y > X） |
| 空态 / 低保真 / 仅框架 | 保持空态 / 低保真 / 仅框架，只做结构适配 |
| 无具体业务内容 | 不补具体业务内容 |

### §2.2 业务内容（不允许跨画布迁入）

列表项 / 正文文案 / 标题副标题摘要 / 图片封面缩略图 / 时间标签统计值

### §2.3 结构组件（必须迁移，不算跨画布补内容）

`NavigationBar` / `StatusBar` / `BottomBar` / `Sidebar` / `DrawerIndicator` / `Fab` / `SearchBar` / 浮层容器（`FloatingWindow` / `DrawerWindow` / `AlertDialog` / `Menu`）等。

源稿存在 + 映射表未明确返回 `hidden`/`absent` → 必须迁移、映射或以 `fallback` 状态说明。

### §2.4 目标布局比源稿宽时（行为指南）

| 允许 ✓ | 禁止 ✗ |
|---|---|
| 扩展布局骨架 | 从其它画布拖入现成文章 / 卡片 / 图片 |
| 复制源稿已有控件 / 标题 / 导航 / 空态容器 | 用别处页面数据假装当前页面已有内容 |
| 为 L / C / N 栏预留空白区或占位骨架 | 因布局是 LC / NLC 就擅自补齐列表 / 详情 |

例外：用户明确要求"参考其他画布补齐示例内容"时允许跨画布引入。

## §3. 标准组件闭环

### §3.1 基础组件任务清单

**WHEN**: Phase 4 生成 componentTaskList 时
**MUST**: `get_metadata` 中出现的源稿直接子组件**全部进入**清单。后续读不到只能记录差异，**不可删除**。

**最少必入族（9 类）**：

| # | family | 备注 |
|---|--------|------|
| 1 | `StatusBar` | |
| 2 | `NavigationBar` | 含 `_Notes` 等业务变体 |
| 3 | `BottomBar` | 含 `_Showcase_*` / `_NoteEditPanel_*` 等 |
| 4 | `Sidebar` | |
| 5 | `SearchBar` | |
| 6 | `SelectableChip` | |
| 7 | `Fab` | |
| 8 | `DrawerIndicator` / `杆子` | 控制杆 / 小白条 |
| 9 | 浮层容器 | `FloatingWindow` / `DrawerWindow` / `AlertDialog` / `Menu`，依 `layouts/device-dimensions.md`「浮层规格」 |

**每个任务必填字段**：

| 字段 | 取值 |
|---|---|
| `sourceDetected` | true / false（是否在源稿 metadata） |
| `resolvedUiElement` | 业务语义（如"标题栏"/"侧边栏"/...） |
| `targetRule` | 映射表命中 / 布局规则 / 显式回退 |
| `action` | `setProperties` \| `swapComponent` \| `clone` \| `hide` \| `skip` |
| `status` | `mapped` \| `hidden` \| `absent` \| `fallback` \| `blocked` |
| `fallbackReason` | 仅 `fallback` / `blocked` 时填 |

**完成判据**：清单所有任务 status 已关闭。否则禁止汇报"适配完成"。

### §3.1a variantId → ComponentSet 归属确认（Phase 4 强制）

**WHEN**: `app-variant-map` 返回 `variantId`（如 `Fab_01` / `List_Task_04` / `Sidebar_Component_PAD_NLC_01` 等）后执行 import 之前

**MUST**:

1. **先查 `app-variant-map-{app}.md §0.4` 确定该 variantId 归属哪个 ComponentSet**（key 已记录）
2. 以 set key 执行 `importComponentSetByKeyAsync(key)` → `set.children.find(c => c.name.includes(variantId))`
3. **禁止**以 variantId 名称直接 `search_design_system` 然后盲取首个结果 —— 同名 / 近名组件可能分布在多个 set 中，语义不同

**典型错误**：

| variantId | 错误路径 | 正确路径 |
|---|---|---|
| `Fab_01` | `search_design_system('Fab')` → `Fab-Showcase`（内部 icon 子组件）| §0.4 `BottomBar` set (`414cabc8...`) → `children.find(/^variantId=Fab_01,/)` |
| `List_Task_04` | `importComponentSetByKeyAsync(List_Notes key)` → not found | §0.4 或 `search_design_system('List_Task')` → 业务组件库独立 set |
| `Sidebar_Component_PAD_NLC_01` | 新建 search → 多个同名结果 | §0.4 `BottomBar` set → 同一 set 内 variant |

**核心原则**：映射表的 `variantId` 是 ComponentSet 内部的变体标识符，不是独立组件名。**必须先定位 set，再在 set 内查 variant**。set 归属以 §0.4 记录为首要权威；§0.4 未记录时通过源稿 instance 的 `mainComponent.parent` 确定。

**componentTaskList 强制列 `belongsToSet`**：Phase 4 生成 componentTaskList 时，每行必须填写：

| 字段 | 内容 | 来源 |
|------|------|------|
| `belongsToSet.name` | ComponentSet 名称 | §0.4 / source `mainComponent.parent.name` |
| `belongsToSet.key` | ComponentSet key | §0.4 / source `mainComponent.parent.key` |
| `belongsToSet.library` | 库名 | `search_design_system` 结果的 `libraryName` |

该字段为空 = **Phase 5 进入阻断**（SKILL.md Phase 4.5 Gate C）。确保每个 variantId 的 set 归属在进入落位前已明确。

### §3.2 标准组件实例保护

**WHEN**: 任何对标准结构组件（`NavigationBar` / `StatusBar` / `Sidebar` / `BottomBar` 等）的修改
**MUST**: 默认保持 INSTANCE 状态。只允许 variant 切换 / 属性调整 / 尺寸调整 / 位置调整。
**NEVER**: 预先 `detachInstance` 规避风险。

**允许 detach 的条件（**全部满足**）**：

1. 已尝试实例路径（loadFontAsync + setProperties + swapComponent + 实例级文本修改）
2. 当前任务确实需要修改实例内部文本 / 结构，且实例态走不通
3. 字体 / 依赖 / 写入限制已明确阻塞实例路径

**detach 后输出必须说明**：哪个组件 / 为何实例态走不通 / 为何 detach 是最后手段。

## §3.3 实例克隆与变体切换时的尺寸同步

**核心**：`clone` / `setProperties` / `swapComponent` 后，Figma 不会自动把实例 resize 到目标 variant 默认大小。**必须显式 `resize(targetW, targetH)`**。

**典型踩坑组件**：

| 组件 | 源 variant 自然 | 目标规格 |
|------|-----------------|----------|
| `状态栏-StatusBar` | 手机 38（误值）| 手机 46 / Fold 46 / Pad **34**（pad 自然 38, 必须强制 34）|
| `NavigationBar` | 变体间 56 / 116 / 139 差异大 | 按 `device-dimensions.md` 各栏高度表 |
| `Drawer-Max-BottomIndicator` / `杆子` | 设备 variant 间差异 | 按设备 spec |
| `BottomBar_Showcase_*` / `ToolBar_*` | 常规 56 / 缩小 44 | 按工具栏 spec |
| `Sidebar_Component_PAD_NLC_*` | 设计稿上固定高度 | 按 N 栏实际 mainH |

**MUST**:
1. clone → swap → **显式 `resize(targetW, targetH)`**（缺一不可）
2. 跨 screenMode / 栏宽时**宽度也显式传入**
3. Phase 6 校验：差值 > 1dp 判不合格

**NEVER**:
- `clone.resize(w, clone.height)` 把旧高度原样保留
- 依赖 instance 自带高度

## §3.4 variant 切换后残留 override 的清理

> ⚠️ **优先级警告**：`resetOverrides()` **默认 OFF**（见 §3.6 关键决定）。本节是 OPT-IN 路径 —— 仅当目标 variant 内部结构差异巨大、必须清旧文本/旧 padding override 时才打开。**§3.4 vs §3.6 冲突时以 §3.6 为准**。

**症状**：`swapComponent()` 后旧 variant 的 **节点级 override**（子节点 `x` / `width` / `layoutSizingHorizontal` / 文本 layoutGrow）残留在实例上：

| 现象 | 例子 |
|------|------|
| 标题 `x` / `width` 卡在旧值 | NavBar `_05`（含返回图标）→ `_04`（无返回）后，标题仍从 `x=22` 开始 |
| Auto-layout FILL 被旧 override 忽略 | `resize()` 不向子节点传播 |
| 视觉与原生规格偏离 | NavBar 标题原生 `pl=28` 被压到 `pl=50` |

**MUST**:
1. swap 后 `inst.resetOverrides()` 清空，**再写入业务值**（例 `text.characters = "笔记"`）
2. 组件内置 padding / 间距是**权威值**，文档与之冲突以组件为准
3. reset + resize 后校验 `text.absoluteBoundingBox.x - inst.absoluteBoundingBox.x` 与原生一致；不一致 → `layoutSizingHorizontal` 强制 `FILL`

**NEVER**:
- 手动调子节点 `x` / `width` "掰回"正确位置 → 先 reset 让组件原生 auto-layout 决定

> ⚠️ **§3.6 与本节差异（关键）**：§3.6 默认 **OFF** `resetOverrides`（width override 是 reflow 的最后防线），仅当目标 variant 内部结构差异巨大、必须清旧文本/旧 padding 时才打开。本节 §3.4 适用于"明确需要清 override"的情况；§3.6 适用于"避免 reflow 优先"的情况。两节冲突时以 §3.6 优先。

## §3.4a 组件 padding 分类与容器合算规则（通用骨架）

> 应用专用实测应用表已迁出：笔记 / 待办 → `app-variant-map-笔记.md §0.2`。其它应用 → 各自 `app-variant-map-{app}.md`。

### §3.4a.1 组件分类（A/B 二分）

> **核心原则**：分类标准 = 「**是否自带 internal padding**」。所有自带 padding 的标准组件统一为 A 类风满，禁止合算；裸控件 / 自定义业务 frame 为 B 类，按 device-dim 断点表合算。

| 类别 | 判定标准 | 组件 | padding 处理 |
|------|---------|------|----------|
| **A 类：自带 internal padding 的标准组件** | `instance.children[0].x > 0` 即自带（典型值 12dp） | `StatusBar_*` / `NavigationBar*`（含 `_Notes`）/ `TopBar_*` / `SearchBar_ComponentSet` / `SelectableChip_ComponentSet_*` / `List_*` / `Detail_*` / `BottomBar_*`（含 `_Showcase_*` / `_NoteEditPanel_*` / `_Notes_Outline_*`）/ `ToolBar_*` / `Sidebar_Component_*` / `TextInput_ComponentSet_Notes` / `Fab_*` 等 | **永远 `x = 0, width = 栏W` 风满**。视觉左右 padding = 组件 internal（默认 12dp）。**禁止任何 outer 合算**，禁止把 device-dim 断点表 spec 应用到 A 类组件 |
| **B 类：裸控件 / 业务自定义 frame** | 无 internal padding 的纯 Frame / 分组卡片外框 / 用户自建容器 | 自定义 frame / 业务容器 | 按 `device-dimensions.md` 断点间距表取 spec：`x = spec, width = 栏W − 2 × spec`。1100 < 栏W 时改 `x = (栏W − 988)/2, width = 988` 居中 |

判定要诀：**「有自带 padding ⇒ A 类风满；没有 ⇒ B 类合算」**。Figma 实测 `instance.children[0].x` > 0 即 A 类；查不到 internal padding 才是 B 类。**未列出的标准组件默认按 A 类处理**（风满），如确认是 B 类（裸 frame）才走合算。

**Detail_Notes 例外**：自带 internal=20（封面图距 Detail 左缘 20dp）仍属 A 类风满，internal=20 仅描述视觉左 padding，不参与合算。

### §3.4a.2 internal padding 定义

| 组件类型 | internal pl 测量方法 |
|---------|--------------------|
| 通用内容容器（List / Search / Chip） | `direct.absoluteBoundingBox.x − inst.absoluteBoundingBox.x` |
| **`Detail_Notes` 特殊** | **直接 = 20dp**（封面图距 Detail 左缘的偏移；外层 frame `pl=0` 但 internal 视作 20）|

```javascript
const direct = inst.children[0];
const internalPl = direct.absoluteBoundingBox.x - inst.absoluteBoundingBox.x;
```

**权威来源**：组件 internal pl 以「控件变体清单」CSV `Space` 列为准。文件内实测与 CSV 冲突时**以 CSV 为准**。

| 组件 | CSV Space | 实测 | 取值 |
|---|---|---|---|
| `SelectableChip_ComponentSet_Notes_01/02` | 左 12, 右 0 | 0 | **CSV `12`**（实测易误判）|
| `SearchBar_ComponentSet_*` | 左 12, 右 12 | 一致 | 12 |
| `List_Notes_*` | 左 12, 右 12 | 一致 | 12 |

### §3.4a.3 合算公式（仅适用 B 类）

> ⚠️ **适用范围**：本节合算公式**仅适用 §3.4a.1 B 类（裸控件 / 业务自定义 frame）**。A 类标准组件（含 `SearchBar` / `Chip` / `List` / `Detail` 等所有自带 padding 的组件）**禁止**调用本公式 —— 一律 `x=0, w=栏W` 风满。

| 关系（仅 B 类）| x | 写入 width | visible 总 padding |
|------|---|-----------|-------------------|
| `internal ≥ spec` | 0 | 栏W | internal（自动 ≥ spec）|
| `internal < spec` | `spec − internal` | `栏W − 2 × outer` | `outer + internal = spec` |

简言之（仅 B 类）：`outer = max(0, spec − internal)`。1100 < 栏W 时进一步用 `x = (栏W − 988)/2, w = 988` 居中。

### §3.4a.4 执行准则

| # | 规则 |
|---|------|
| 1 | 通用内容容器：实测 `direct.x` 作 internal pl；`Chip` 的 `pl=0` 易误判，**以 CSV 为准** |
| 2 | `Detail_Notes`：直接 `internal=20`，不测量外层 frame |
| 3 | spec 来自 `device-dimensions.md` 栏 padding 表 + 断点表 |
| 4 | 写入：`inst.x = outer; inst.width = 栏W − 2 × outer` |
| 5 | **特殊组件不参与合算**：永远 `x=0, width=栏W` 风满 |
| 6 | 远程组件 internal 不可在 instance 中改写；`internal > spec` 时风满 + 接受 over |

## §3.5 状态栏跨设备 variant 切换 + 强制高度

**症状**：源稿 StatusBar = 手机 variant，clone 到 Fold/Pad 后**不会自动切换**。必须显式 `swapComponent` + `resize`。

**CSV 权威映射**：

权威库 = **Xiaomi Hyper OS4 UI Kit AI 测试版**（file `FBvQ3xM5C62MgIcA1JHWIs`）。2026-05-21 起已归并为 **ComponentSet**（set key = `1047f2112a230a27d3888d27b34a5857815216e3`），内含 `StatusBar_01` + `StatusBar_03` 两个 variant（`_02` deprecated 已移除）。

**⚠️ 禁止使用个别 component key 直接 import**（个别 key 随 library republish 会失效）。唯一安全路径：
```
const sbSet = await figma.importComponentSetByKeyAsync('1047f2112a230a27d3888d27b34a5857815216e3');
const sb01 = sbSet.children.find(c => c.name.includes('01')); // Fold
const sb03 = sbSet.children.find(c => c.name.includes('03')); // Pad
```

| CSV VariantId | 获取方式 | 自然尺寸 | 适用设备 |
|---|---|---|---|
| `StatusBar_01` | set import → `children.find(/01/)` | 392×46 | **手机 + Fold（外+内）通用** |
| `StatusBar_03` | set import → `children.find(/03/)` | 1422×38→**强制34** | **Pad 专用** |

**核心**: Fold 内屏/外屏 一律使用 `StatusBar_01`；Pad 一律使用 `StatusBar_03`；`StatusBar_02` 已移除。

| 设备 | Component | spec 高度 | 自然高度 | 备注 |
|------|-----------|----------|---------|------|
| 手机 | `StatusBar_01` | 46 | 46 | 自然一致 |
| Fold 外屏 / 内屏 | `StatusBar_01` | 46 | 46 | 自然 W=392，target W 不同（888/628 等）时需 `inst.children[0].layoutSizingHorizontal = 'FILL'` + resize |
| Pad 横/竖 | `StatusBar_03` | **34** | **38** | swap 后强制 resize 34；**易 reflow 回 38** |

**MUST**:
1. **禁止 `importComponentByKeyAsync` 直接导入**。必须经 set key + `children.find()` 路径（个别 component key 随 library republish 失效，set key 稳定）
2. Fold 适配时使用 `StatusBar_01`（set import 后 `children.find(/01/)`）
3. Pad 适配时使用 `StatusBar_03`（set import 后 `children.find(/03/)`）
4. swap 后立即 `resize(frameW, specH) → x=0, y=0`
5. **resize 后强制 inner child FILL**：`inst.children[0].layoutSizingHorizontal = 'FILL'`（组件 default 为 FILL，但已生成 instance 的 override 可能残留 FIXED。不论新旧 instance 均需显式设置）
6. **完成全部变更后二次校验**：`inst.children[0].width === inst.width`，不一致则重复 step 5
7. Phase 6 必检：`(width === frameW, height ∈ {46, 34}, children[0].width === inst.width)`

**NEVER**:
- 源稿 deprecated set（旧 key `599a7d4b...` 等）直接沿用（必须 swap 至 canonical）
- 使用 HyperOS v0.8（`15e94d49...`）（非 file 订阅库 —— PM7 尝试失败，PM8 修订）
- 使用 StatusBar_02（deprecated）
- 未核对 file 订阅库即凭推测选 set/component（违反 common-rules §0 #13）

## §3.6 自带 auto-layout 实例的 resize / 落位通用陷阱

**所有自带 auto-layout 的标准组件实例**（不仅 Sidebar，亦含 NavigationBar / SearchBar / SelectableChip / List_* / Detail_* / TextInput_* / BottomBar_* / ToolBar_* / Sidebar_* 等）在 `swapComponent` 或 `clone` 后，单纯调用 `resize()` 经常被忽略 —— instance 会回到 main component 的自然尺寸，并且 `x/y` 可能被 auto-layout 改写。

历史踩坑（同一陷阱反复出现）：

| 组件 | 自然尺寸 | 我们目标 | 不修复时的实际值 |
|------|---------|---------|-----------------|
| `Sidebar_Component_PAD_NLC_01` | 272×800 | 272×915 / 1388 | 800h, y=149/622 |
| `NavigationBar_05` 等 | 392×56 | 栏W×56 | 392 |
| `NavigationBar_Notes_01` | 530×56 | C栏W×56 | 530 |
| `SearchBar_05` | 392×56 | 栏W×56 | 392, x=18（hug 居中）|
| `SearchBar_02` | 176×44 | 栏W×44 | 176, x≈居中 |
| `TextInput_Notes_01/_08` | 392×92 | C栏W×92 | 392, x=-23（负数！）|

强制写入序列（任何标准组件实例通用）：

```javascript
// 1. 先迁移到目标 parent（如果不一致）
if (inst.parent !== targetParent) targetParent.appendChild(inst);

// 2. variant 切换（如有）
if (targetVariant) inst.swapComponent(targetVariant);

// 3. resetOverrides 默认 OFF（关键决定！）
//    reset 会清空 width override，立即触发 hug content reflow。
//    仅当目标 variant 内部结构变化、需要清旧文本/旧 padding 时才 true。
// inst.resetOverrides();   // ← 默认不调用

// 4. 强制 sizing FIXED（四项一并设置，互不替代）
try { inst.layoutSizingHorizontal = 'FIXED'; } catch {}
try { inst.layoutSizingVertical   = 'FIXED'; } catch {}
try { inst.primaryAxisSizingMode  = 'FIXED'; } catch {}
try { inst.counterAxisSizingMode  = 'FIXED'; } catch {}

// 5. resize → 位置（顺序不可调换）
inst.resize(targetW, targetH);
inst.x = targetX;
inst.y = targetY;

// 6. 落位后立即自检
if (Math.abs(inst.width - targetW) > 0.5) throw new Error(`reflow: ${inst.name}`);
```

**MUST**:

| # | 规则 |
|---|------|
| 1 | 任何标准组件实例的 swap / clone / resize 都走以上 6 步，**禁止 inline 简化**。封装见 `component-placement-protocol.md §2` |
| 1a | **resize 前必须读取 `mainComponent.width` / `mainComponent.height`（自然尺寸）**，与 `device-dimensions.md` spec 比对后决定 targetH。**禁止从源稿高度推测目标高度**（例：源稿手机端 NavBar 大标题 116dp ≠ Fold/Pad 中标题 56dp；TopBar_09 自然 56dp ≠ NavBar+SearchBar 算术和 100dp）。公式：`targetH = min(自然高度, device-dim spec)`；两者冲突时以 device-dim 为准 |
| 2 | **`resetOverrides` 默认 OFF**（2026-05-15 修订）—— reset 清掉 width override 几乎必然 reflow |
| 3 | Phase 6 调用 `verifyChecklist(...)` 自动检测 width/height/x/y 偏差 > 0.5dp 即不合格 |
| 4 | Sidebar 额外校验：Pad 横 NLC `height === N 栏 mainH`；Pad 竖 NLC 覆盖 `height === frame.height − statusBarH` |
| 5 | 视觉异常（卡片多余留白 / 内容错位）→ 先怀疑 component 库版本（参见 §3.10），后查 instance 写错 |
| **6** | **Instance resize 后 `inst.children[0].width === inst.width` 自动校验**。不一致时立即 `inst.children[0].layoutSizingHorizontal = 'FILL'`; 仍不一致则尝试 `inst.children[0].layoutSizingVertical = 'FILL'`. 失败则报告「component limitation」妥协项 + 拆分到 design-team 专项 task (instance-level 不可解决). |
| **7** | **Sidebar / Pad-TopBar 等含多层 auto-layout 组件需 3 级递归 FILL override**: `inst.children[0].layoutSizingVertical = 'FILL'` + `inst.children[0].children[0].layoutSizingVertical = 'FILL'` + `(.children[0].children[0]).children.find(c=>c.name==='内容区域'相似).layoutSizingVertical = 'FILL'`. 单一层 override 不足 (PM3 验证). |
| **8** | **ToolBar / BottomBar_Showcase inner state 2nd pass 必须在 `placeStandardComponent` 函数体内执行**（protocol.md step 10），禁止依赖调用方 inline 补充。capsule `setProperties({数量:X})` 会 rebuild children（全新 ID），首次 walk 只传递首项，后续 `.组件状态变化` 等 deep-inner 节点 miss。修复 = 统一走 protocol.md 完整函数，禁止 simplified inline helper |

### §3.6.A 自动校验函数补强 (verifyChecklist 增项)

**WHEN**: 标准组件 instance 落位后调用 verifyChecklist 时
**MUST**: 除外部 instance W/H 校验外，**inner first child W 比对**（clipping 检测）：

```js
// clipping 检测
for (const chk of spec.componentChecks) {
  const node = await figma.getNodeByIdAsync(chk.id);
  // 外部
  if (Math.abs(node.width - chk.w) > 0.5) errors.push(`${chk.label}.width reflow`);
  // 内部 first child clipping
  if (node.children?.[0] && Math.abs(node.children[0].width - node.width) > 0.5) {
    errors.push(`${chk.label} INNER clipping: instance ${node.width} vs child[0] ${node.children[0].width}`);
  }
}
```

**根因**: `Pad-TopBar_01`（TopBar_03/_07 root child）`layoutSizingHorizontal='FIXED'` 自然 1422. instance.resize(targetW) 仅作用于外层, child 不跟随. PM5 验证 4 frame 中 3 frame 右侧裁切 (272~745dp). verifyChecklist 通过但视觉 fail.

**Phase 6 强制增项**: 全部 `componentChecks` 项必须包含 inner clipping 自动检测. **仅校验外部 W 不足**.

### §3.6.B `_00` 变体语义一致性表

**WHEN**: variant lookup 结果为 `*_00` 时
**MUST**: 按下表确定语义 (family 不同含义不同)：

| family | `_00` 含义 | 适配处理 |
|---|---|---|
| `NavigationBar_ComponentSet_00` | 无 NavBar (空变体) | **不创建 instance** (skip) |
| `Sidebar_Component_PAD_NLC_00` | 笔记 / 待办 NLC framework **收起态**: N 栏直接消失（笔记 N 收起规则） | **不创建 instance**（N 消失，L/C 吸收宽度） |
| `Sidebar_Component_PAD_NLC_00` | 笔记 / 待办 **NL framework**: N 栏自身消失 | **不创建 instance** |
| `Sidebar_Component_PAD_NLC_00` | 其他应用 NLC 收起态: 88dp 图标侧边栏 | 创建 instance, 撑 88dp |
| `BottomBar_Showcase_Notes_00` / `_Showcase_00` | 不渲染 | 不创建 instance |
| `SelectableChip_ComponentSet_Notes_00` | 不渲染 | 不创建 instance |
| `ToolBar_ComponentSet_00` | Pad NL framework 工具栏占位 | 仅 Pad NL, 创建 instance |
| `Fab_00` | 无 Fab | 不创建 instance |
| `TextInput_ComponentSet_Notes_00` | 不渲染占位 | 不创建 instance |

**原则**: `_00` 默认含义 = **「不渲染」或「空容器」**. family 未列出时**默认不创建 instance**. 应用层例外 (如「保留 88dp 容器」) 须在 `app-variant-map-{app}.md §0` 显式声明.

## §3.7 NLC 覆盖模式 遮罩 + z-order

**WHEN**: Pad 竖屏 NLC **覆盖** 模式（N 栏覆盖于 L+C 之上）

**MUST 添加 `遮罩-N覆盖` 矩形**：

| 属性 | 值 |
|------|-----|
| 类型 | `RECTANGLE` |
| 名称 | `遮罩-N覆盖` |
| 尺寸 | `frameW × frameH`（盖满整 frame 含状态栏） |
| 位置 | `x=0, y=0` |
| fill | 绑定 `遮罩色/mask` token，opacity `0.2` |
| 圆角 | 与 frame 一致（Pad 34dp） |

**遮罩覆盖范围原则（核心）**：
- 遮罩 = 该 trigger 列**全域**（含其上方 status bar 区域）。
- N 覆盖 trigger = Sidebar 列。**Sidebar 列以外的全部区域（含 状态栏 全幅）= 遮罩范围**。
- ❌ 不要再用「状态栏可读性 / 时间信号可读」这类 rationale 推导 z-order。覆盖关系按「列归属」决定：trigger 列豁免，其它列（含 status bar 对应区段）一律 dim。

**frame 直接子级 z-order**（从底到顶）：

```
1. main（含 L 栏 + C 栏）
2. 状态栏-StatusBar
3. 遮罩-N覆盖              ← 在状态栏之上 → 状态栏被 dim（仅 N 列除外，由 Sidebar promote 完成）
4. 栏间分割线
5. Sidebar                 ← N 覆盖遮罩之上（Sidebar = N trigger，唯一豁免）
6. 杆子                    ← 风满 + 透明 + 最顶 z
```

**MUST**:
- 遮罩-N覆盖 必须在状态栏之上（否则状态栏不被 dim，违反「全 frame 除 trigger 列豁免」原则）。
- Sidebar 在所有后续 appendChild 后必须保持上述 z 位（不能被杆子取代）。

**NEVER**:
- 把 `状态栏` 提升到 `遮罩-N覆盖` 之上（旧版「保证可读」rationale 已弃用 —— 用户 2026-05-18 显式确认 V2 reference 中 状态栏 在 N 覆盖遮罩之下 dim 是正答）。
- 缺 `遮罩-N覆盖` —— 否则 N 栏与 L+C 视觉无分层。

### §3.7a 编辑状态遮罩（L 栏进入编辑模式时）

**WHEN**: `app-variant-map-{app}.md`「遮罩规则」表声明 L 栏编辑模式触发遮罩（笔记 / 待办：「L 栏进入编辑模式 → 仅 C 栏覆盖遮罩」）。

**MUST 添加 `遮罩-编辑` 矩形（C 列形态，非全幅）**：

| 属性 | 值 |
|------|-----|
| 类型 | `RECTANGLE` |
| 名称 | `遮罩-编辑` |
| 父节点 | frame 直接子级（不放入 main / C 栏内部） |
| 尺寸 | **`Cw × frameH`**（仅 C 列，从画面顶到底；不是全 frame）|
| 位置 | `x = C 列起点` (LC: x=Lw；NLC 并列: x=N+L；NLC 覆盖: x=Lw)，`y = 0` |
| 圆角 | `topRightRadius / bottomRightRadius = 34 (Pad) / 50 (Fold)`，左侧两角 `0`（被 L 栏遮住） |
| fill | 绑定 `遮罩色/mask` token，opacity `0.2` |

**关键解释**：spec `device-dimensions.md`「遮罩定义 / 适用范围」 写「整个 frame，触发控件除外」。**触发控件 = L 栏整列**（含其上方 status bar 区域）。所以遮罩区 = `frame − L 列 = C 列（含 C 列上方 status bar 区段）`。N 栏触发时同理（遮罩 = 全 frame − Sidebar 列）。

**遮罩覆盖范围原则（与 §3.7 一致）**：
- 遮罩-编辑覆盖 **C 列全域，含 C 列上方的 status bar 区段**（即 status bar 的 C 列区段必须被 dim）。
- ❌ 不要再用「状态栏可读性 / 时间信号可读」rationale 推导 z-order。L 列上方的 status bar 不被 dim 是因为它属于 trigger 列（L），与「可读性」无关。

**z-order 强制（遮罩-编辑 必须在状态栏之上，C 列 status bar 区段才会 dim）**：

```
1. main（仅含 C 栏；L 栏从 main 提升到 frame 直接子级）
2. 状态栏-StatusBar
3. 遮罩-编辑（C 列）       ← 在状态栏之上 → C 列 status bar 区段被 dim
4. 栏间分割线
5. L 栏                    ← frame 直接子，覆盖在编辑遮罩之上（trigger 除外）
6. 杆子
```

**MUST**:
- 遮罩-编辑 必须在状态栏之上（C 列 status bar 区段 dim 必需）。
- L 栏从 main 内部移出至 frame 直接子级（`frame.appendChild(L)`），定位 `x = L 列起点, y = statusBarH`。否则无法在 z-order 上凌驾于 frame 级遮罩之上。
- main 内部仅保留 C 栏（其它列 promote）。
- 遮罩-编辑 必须位于 frame 直接子级，禁止放入 C 栏内部（C 栏内部遮罩无法盖住 C 列上方 status bar 区域，且无法被 frame-level 圆角裁切）。

**NEVER**:
- 把 `状态栏` 提升到 `遮罩-编辑` 之上（旧版 z-order 已弃用 —— 用户 2026-05-18 显式确认「C 列遮罩必须覆盖状态栏」是正答）。
- 把 `遮罩-编辑` 做成全 frame 尺寸 → 会盖住 L 列触发区域。
- 把 `遮罩-编辑` 放入 C 栏 children → C 栏只占 mainH 高，盖不到 status bar 区。
- L 栏继续留在 main 内部 → 无法 z-promote 到遮罩之上。

### §3.7a-NL NL framework + LEditMode 处理

**WHEN**: framework = NL（list-only，无 detail 列），且 `flags.LEditMode = true`。

**规则**：**所有 device / 所有子形态 一律 mask 不渲染**。NL framework 没有「编辑遮罩」概念。L 栏不 promote，z-order 沿用一般 NL 通则（`main → 状态栏 → 栏间分割线（如有）→ 杆子`）。

§3.7a 的 「mask = C 列形态」 + 「L 栏 promote」 机制仅适用于 LC / NLC / NLC 覆盖 framework（含 C 列）。NL 因结构无 C 列，不存在「编辑遮罩」适用条件。

**verifyChecklist 兼容**：`spec.framework = 'NL'` 时 ⑩~⑫ 全部跳过；不要传 `spec.editMask` 等字段。

### §3.7b 多遮罩叠加 z-order（编辑遮罩 + N 覆盖遮罩同时存在）

**WHEN**: Pad 竖 NLC 覆盖模式 + L 栏编辑同时激活（用户显式确认两种 trigger 共存）。

**z-order 强制（按 reference frame 验证，禁止从 spec text 推测）**：

```
1. main（仅 C 栏）
2. 状态栏-StatusBar
3. 遮罩-编辑（C 列）       ← 在状态栏之上（与 §3.7a 一致）→ C 列 status bar 区段 dim
4. 栏间分割线
5. L 栏                    ← 编辑遮罩 之上，N 覆盖遮罩 之下
6. 遮罩-N覆盖（全 frame）  ← 高 z；L 栏 / 状态栏 / 编辑遮罩 都被 N 覆盖一并 dim
7. Sidebar                 ← N 覆盖遮罩 之上（唯一豁免：Sidebar = N 覆盖 trigger）
8. 杆子
```

**关键**：
- **每个遮罩都覆盖该 trigger 列以外的全域（含 status bar 对应区段）**，与「可读性」rationale 无关。
- 两遮罩对 L 栏的覆盖关系**不同** —— 编辑遮罩在 L 之下（L 豁免），N 覆盖遮罩在 L 之上（L 被覆盖）。各自的 trigger 控件（L 栏 / Sidebar）相对各自遮罩 z-up，与另一 trigger 无关。
- ❌ **不可**凭直觉把两遮罩并列在 L 栏下方（曾发生过的错误）。
- ❌ **不可**把 `状态栏` 提升到任一遮罩之上（V2/V3 旧版 z-order 已弃用 —— 状态栏在两遮罩之下，按列归属规则被 dim 是正答）。

## §3.8 栏间分割线规则

**节点形态**: 独立 `RECTANGLE`（**不是** 栏 frame 的 stroke）。栏 frame `strokes = []`。

**布局模式 → 数量 / 位置**：

| 模式 | 位置 | 数量 |
|------|------|------|
| LC（Fold 内横/内竖）| `x = L栏width` | 1 |
| NLC 并列（Pad 横）| `x = N栏 + L栏` (L\|C) | 1（**N\|L 无**，Sidebar 阴影分隔）|
| NLC 覆盖（Pad 竖）| `x = L栏width` | 1 |
| NC | — | 0 |
| C 通栏 | — | 0 |

**节点规格**：

| 属性 | 值 |
|------|-----|
| 类型 | `RECTANGLE` |
| 名称 | `栏间分割线` |
| 尺寸 | `1 × frameH`（**全帧高，贯穿状态栏**）|
| 位置 | `x = 边界值, y = 0` |
| fill | 绑定 `分割线色/outline` token |
| 父节点 | **frame 直接子级**（不放入 main / C 栏内部）|

**NEVER**:
- 用 C 栏 `strokeLeftWeight` 实现 → 只画到栏 frame 高度，**无法贯穿状态栏**
- 在 NLC N\|L 边界加分割线 → 与 Sidebar 阴影双重分隔

## §3.9 Sidebar 阴影裁切防止

**症状**: `Sidebar_Component_PAD_NLC_*` 卡片自带圆角 + 外阴影。父 frame 链上任一层 `clipsContent = true` → 阴影被裁掉，N \| L 边界视觉无浮起。

**Sidebar 配置位置（强制）**：

| 模式 | Sidebar 父节点 | 原因 |
|------|--------------|------|
| Pad 横 NLC（并列）| **frame 直接子级**（不放入 N 栏内部）| N 栏内部放置 → 阴影被 N 栏边界裁切，即使 `clipsContent=false` 也因 z-order 层级不足无法越过 L 栏 |
| Pad 竖 NLC（覆盖）| **frame 直接子级** | 覆盖模式天然满足 |

> ⚠️ **禁止将 Sidebar 放入 `main > N 栏` 内部**。Sidebar 必须是 frame 直接子级，通过 z-order（`protocol.md §3` 模板）实现阴影投射到 L 栏之上。N 栏 frame 仅作为 main 内部的空间占位（可保留空 frame 或省略）。

**clipsContent 配置**：

| 模式 | 目标 frame | main |
|------|-----------|------|
| Pad 横 NLC | `true`（保留圆角）| **`false`** |
| Pad 竖 NLC | `true` | 不影响 |

**Phase 6 校验**: Pad 横截图能看到 Sidebar 右侧阴影渐变越过 N\|L 边界进入 L 栏。

## §3.10 组件库时间戳校验

**WHEN**: clone 文件内已落地的旧 instance 之前 / 视觉异常调查时

**MUST**:
1. `search_design_system` 用名称搜索，比对 `updatedAt` 时间戳
2. 设计系统有更新版本 → **`importComponentSetByKeyAsync` 导入并替换**，**不要**继续 clone 旧结构
3. 替换流程：`importComponentSetByKeyAsync(key) → 找目标 variant → 旧 instance.swapComponent(新 variant) → §3.6 强制序列`
4. 视觉异常优先怀疑 component 库版本不一致，**后**查 instance 写错

### §3.10.A 「variant 未落地」 判定前 fresh-import 强制

**WHEN**: variant lookup `set.children.find(c => /TargetVariantName/.test(c.name))` 结果 `undefined` 时
**NEVER**: 立即得出「未落地 / 需 fallback」结论
**MUST 顺序**:

1. `search_design_system` 重新搜索 set 名 → 检查 `updatedAt`
2. 比当前 session import 时刻更新 → **重新调用 `importComponentSetByKeyAsync(key)`** (废弃旧 import 对象)
3. fresh set.children 中重新查找 target variant
4. 仍缺失 → 才能判定「未落地」+ 仅 spec

**根因案例**: TopBar_07 首次搜索时 NavigationBar set 内仅见 TopBar_00~_06 → 判定「未落地」→ 使用 TopBar_03 fallback. 后经用户指出, fresh import 重试 → 找到 TopBar_07 (set 在 task 进行中已更新, key=`b95b5b9e2f3d6a1306a0cbd14975164463528cf6`). NavigationBar set updatedAt = 2026-05-19 07:35Z, 之前 import 缓存 stale.

**自动检查推荐**: 发现 variant 缺失时强制执行如下:
```js
// 规避 stale cache
const freshSet = await figma.importComponentSetByKeyAsync(setKey);
const freshTarget = freshSet.children.find(c => predicate(c.name));
if (freshTarget) return freshTarget; // 废弃旧搜索结果, 用 fresh
// 真实缺失 → 上报
```

### §3.10.B Set key stale 检测 (PM2 根因)

**WHEN**: `importComponentSetByKeyAsync(key)` 抛出 `Component set with key not found` 错误
**NEVER**: 信任 app-variant-map §0.4 的 key 为永久权威
**MUST**:
1. `search_design_system` 重新搜索 set 名
2. 同名 set 中取最大 `updatedAt` 对应的 `componentKey`
3. 用该 key 重试 `importComponentSetByKeyAsync`
4. 成功后**更新 `app-variant-map-{app}.md §0.4` 的 key** + §0.5 变更日志增项

**根因案例**: §0.4 的 `状态栏-StatusBar` key `599a7d4b...`（Hyper OS4 UI Kit ComponentSet）stale → `not found`。当时 search_design_system 显示活跃 set = `15e94d49...`（HyperOS v0.8）。**PM8 修订**: HyperOS v0.8 并非 file 订阅库。权威 = Xiaomi Hyper OS4 UI Kit 的 3 个独立 COMPONENT（StatusBar_01 `51a9e973...`、StatusBar_02 `3f550237...` deprecated、StatusBar_03 `6c9d87a1...`），file `FBvQ3xM5C62MgIcA1JHWIs` node `127160:4132`。「`15e94d49...` 可调用」仅说明 cross-library import 成功，并非 file 的 canonical 库。**教训**: 禁止仅凭 search_design_system 结果断定权威库 → 必须通过 `get_libraries` 的 `libraries_added_to_file` 直接确认。

### §3.10.C Stale key 예방: import 실패 시 §0.4 즉시 업데이트 강제

**WHEN**: `importComponentByKeyAsync(key)` 또는 `importComponentSetByKeyAsync(key)` 이 `not found` 에러 반환 시
**MUST**:
1. `search_design_system` 으로 해당 component/set 의 최신 key 탐색
2. 최신 key 로 import 재시도 성공 시, **해당 session 내에서 즉시 `app-variant-map-{app}.md §0.4` 의 key 업데이트** (git commit 필수)
3. 개별 component key (`StatusBar_01` 등) 가 독립 key 로 관리 불안정한 경우 → **ComponentSet key 로 통합 후 `children.find()` 패턴으로 전환** (set key 가 더 안정적)

**근본 원인**: Figma library 가 update/republish 될 때 개별 component key 가 재생성될 수 있음. ComponentSet key 는 상대적으로 안정적이지만 역시 stale 가능. §0.4 는 **cache** 이지 permanent truth 가 아님 — stale 발견 즉시 갱신해야 다음 session 에서 반복 실패를 방지.

**StatusBar 특수 케이스 (2026-05-21 확정)**: `StatusBar_ComponentSet` set key = `1047f2112a230a27d3888d27b34a5857815216e3` (Hyper OS4 UI Kit AI 测试版). 개별 variant 는 set import 후 `children.find(/01|03/)` 으로 접근. 독립 component key 는 더 이상 §0.4 에 기록하지 않음.

## §3.11 CSV vs map source-of-truth 冲突 (PM4/PM6 根因)

**WHEN**: 用户提供 CSV1/CSV2 + `app-variant-map-{app}.md` 已更新版本同时存在
**NEVER**: 偏信任一方 / silently 无视一方
**MUST**:

| # | 动作 |
|---|------|
| 1 | 收到 CSV1/CSV2 立即对**全部行进行差异 audit** (特别是变更频繁的 NL/编辑 row) |
| 2 | 发现差异 → **立即向用户提示「CSV 为新值, .md outdated」+ 询问是否进行修正** |
| 3 | **CSV1 默认权威**, .md 为 CSV1 的反映. 若 CSV2 与 spec 存在差异 (如 variant 自然尺寸 mismatch), 用 footnote 标注 .md 的有意分支 |
| 4 | 同一 row **多次变更**时: 变更日志按时间顺序 (PM1/PM2/PM3...) 全记. 明确**作废前次修正** (PM4 entry → PM6 polite override) |
| 5 | NL row 等变更频繁的行须**每次询问用户「本次 CSV 是否最新」**确认 |

**根因案例** (笔记 NL row 历史):
- PM3: List/NL Pad 映射 `_05` (全设备一致) → 错误
- PM4 修正: device-specific `_08/_09/_10/_11/_12/_13` → 仍错 (序列忽略 编辑/默认 分离)
- PM5 再修正: `_05/_07/_09/_11/_13/_15/_17/_19` (奇数=默认, 偶数=编辑) → 正解
- PM6 追加: ToolBar/NL `_02 → _01` 变更, NavBar/NL `_07/_17 → _00` 变更

各阶段均为用户提供 CSV 后发现 — 即 AI 仅信任前次 .md 必 stale. **每次必须强制 audit CSV1**.

## §3.12 Component property 缺失时 instance-level 调整界限 (PM6 SearchBar 264dp 案例)

**WHEN**: spec (如 device-dimensions §搜索规格) 要求 instance-level 调整 (width 264dp 等), 实测 component 未提供对应 property
**NEVER**:
- 用 detach 绕过 (§3.2 违规)
- 硬编码强制尺寸 (无视 HUG layoutSizingHorizontal)
- 假报告「AI 已按 spec 应用」

**MUST**:
1. dump `node.mainComponent.parent.componentPropertyDefinitions` (set 级 propDefs)
2. 检查 propDefs 中是否含 spec 所需 property (如 `搜索框宽度: 264/176`)
3. propDefs 为空 (`{}`) 或缺失对应 property → **报告「component limitation」妥协项 + 拆分到 design-team 组件修正专项 task**
4. 保持自然尺寸不变 (HUG 结果)

**根因案例**: Pad-TopBar_01 `componentPropertyDefinitions = {}`. 内部 SearchBar `layoutSizingHorizontal='HUG'` + variant `_02` 自然 176×44. AI 尝试 resize 至 264 → 被忽略. 保持自然 176 + 报告「component limitation: SearchBar 264 default 未应用. 库需在 `Pad-TopBar` 增加 `搜索框宽度` 变体 property」妥协项.

## §3.13 CSV column 表示歧义处理 (PM4 NL→C fallback 案例)

**WHEN**: CSV1 column header 为单一 `Fold內LC`, 但 NL framework 中存在 NL→C fallback 内容上提
**NEVER**:
- 单一列内 silently 合并两个分支值
- 自行修改「L 栏:」/「C 栏:」 prefix

**MUST**:
1. 严格遵循 CSV1 NL row Fold內 列值 (含 prefix)
2. 单一列内 device 间存在不同值 (Fold內竖 vs 横) 时**用 footnote 显式分离**: `**Fold内竖C：X / Fold内横C：Y**` 格式
3. 「L 栏:」/「C 栏:」 prefix 冲突时 **CSV1 表示优先** (不做语义分析)

**根因案例**: PM4 ToolBar/NL row Fold內竖LC 列 = CSV1 「L栏:_02」, 但 framework 上系 NL→C fallback, 「C 栏」语义更准. AI silently 改为「C栏:_02」. PM5 校验时与 CSV1 表示 mismatch → 又改回「L栏:_01」. 最终 CSV1 「L栏:」 prefix 保持不变才是正解 (NL→C fallback 时 L 内容 promote 的语义保留).

**应用专用变更日志**（迁出，避免本节膨胀）：
- 笔记 / 待办 → `app-variant-map-笔记.md §0.5`
- 其它应用 → 各自 `app-variant-map-{app}.md`

## §3.14 妥协声明前实证强制（2026-05-21 追加）

**WHEN**: componentTaskList 某条目准备标记为 `fallback` / `blocked`，或声明「无法同步」「结构差异」等

**MUST 提供实证**：

1. 实际执行的代码片段（setProperties / swapComponent / importComponentSetByKeyAsync 等）
2. 执行返回的**具体错误信息**（error message 或 undefined 结果）
3. 针对该错误的二次修复尝试（如 fresh import §3.10.A）

**以下表述不构成有效妥协理由**（直接判为规则违反）：

| 无效表述 | 原因 |
|---------|------|
| 「结构差异导致无法同步」 | 未实际尝试 setProperties |
| 「视觉无影响所以可以跳过」 | §0 #23 禁止 |
| 「variant 间外观一致」 | 不替代精确 variant 匹配 |
| 「同步不可能」 | 未提供错误证据 |

**有效妥协理由（仅限以下 4 类）**：

| 有效理由 | 需提供的证据 |
|---------|------------|
| `importComponentSetByKeyAsync` 或 `importComponentByKeyAsync` 抛错 | error message |
| `setProperties` / `swapComponent` 抛错 | error message + 尝试代码 |
| variant 不存在（fresh import 后 `set.children.find()` 仍 undefined）| fresh import 时间戳 + children 列表 |
| 用户显式指示跳过 | 用户原话引用 |

## §4. 写入与降级策略

### §4.1 实现方式优先级（从高到低）

| 顺序 | 方式 |
|---|---|
| 1 | `search_design_system` 搜索并复用已有组件 / 变体 |
| 2 | clone 画布上的现成节点 |
| 3 | Plugin API 新建节点（**最后手段**） |

能 clone 已落地节点时，**不优先** `createInstance`。

### §4.2 立即降级触发（实例化 → clone）

| 情况 | 降级动作 |
|---|---|
| `createInstance()` 失败 | clone 源组件 |
| `appendChild()` 因字体问题失败 | clone + `fixFonts` |
| 组件依赖不可用字体 | clone + `fixFonts` |
| 实例内部文本难以稳定修改 | clone + 文本编辑 |

**降级后**：clone 已落地节点，**优先改布局 / 尺寸 / 位置，不改组件内部结构**。

### §4.3 标准组件映射失败的降级序列

1. 优先尝试标准实例 / 标准变体映射
2. 失败 → clone 源组件
3. 对 clone 结果执行 `fixFonts`
4. clone 结果 resize / Auto Layout 收敛到目标栏宽 / 高度
5. componentTaskList 标记 `status = fallback` + 记录 `fallbackReason`

**例外**：映射表 / 布局规则明确返回 `hidden` / `absent` 才允许省略组件。

## §5. 目标稿落位规则

### §5.1 落位优先级

| 顺序 | 规则 |
|---|---|
| 1 | 与源稿同一 section（源稿在 section 中时） |
| 2 | 同一 page 的源稿右侧（源稿不在 section 中时） |
| 3 | 与源稿相同的 `y` 起点（方便横向对照） |
| 4 | 默认顺序：`Fold横屏 → Fold竖屏 → Pad横屏 → Pad竖屏` |

### §5.2 默认间距

| 场景 | 间距 |
|---|---|
| 源稿 ↔ 第一个目标稿 | **75dp** |
| 相邻目标稿之间 | **60dp** |

### §5.3 禁止 / 允许

| ✗ 禁止 | ✓ 允许 |
|---|---|
| 跳到 page 其他区域随意落位 | 偏离时必须用户明确指定或当前空间不足，且输出中说明 |
| 多版本只生成首个就停 | 按 `targetVariantPlan` 全部顺排 |
| 与无关样例交错摆放 | 紧邻同任务目标稿继续顺排 |

## §6. 校验与修正

### §6.0 写入节奏（每次 `use_figma` 调用单位）

| 步骤 | 动作 |
|---|---|
| 1 | 只处理一个逻辑单元 |
| 2 | 记录上一步创建的 node ID |
| 3 | 截图校验当前状态 |
| 4 | 结构校验关键节点的尺寸 / 位置 |
| 5 | **组件替换（`remove` + `appendChild`）后即时验证 parent.children z-order 与 spec 一致** |
| 6 | 确认无误 → 进入下一步 |

**§6.0 追加：组件替换后 z-order 即时确认**

`remove()` + 新 `appendChild()` 替换组件时，同一 `use_figma` 调用内必须验证 `parent.children` 顺序：

| parent | z-order 约束 |
|--------|-------------|
| L 栏 | ToolBar / BottomBar 必须最顶 z（List 之上）|
| C 栏 | TextInput 必须最顶 z（Detail 之上）|
| frame | 杆子必须最顶 z；Sidebar 在遮罩之上 |

**根因**：2026-05-21 List_Task 替换后 `appendChild(newList)` 使 List 成为最后 child → ToolBar 被覆盖。替换操作本身不保持 z-order，必须在替换后显式 `parent.appendChild(topZChild)` 将需要置顶的节点重新提升。

### §6.0.1 修正优先级

| 顺序 | 修正项 |
|---|---|
| 1 | 尺寸 |
| 2 | 位置 |
| 3 | 文本 / 局部视觉 |

**禁止整页推翻重做**，只做局部修正。

### §6.1 容器 resize / 结构变更 原子单位

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

### §6.2 多端适配 Phase 6 强制检查清单（通用项）

每次完成多端适配后，必须按下表逐项验证。任一项不通过判为未完成。**实际执行通过 `references/component-placement-protocol.md`「§6 verifyChecklist」函数自动跑**，禁止手工核对。

| # | 检查项 | 通过标准 |
|---|--------|----------|
| 1 | Section 命名 | 含测试名 + 日期（如 `TEST_xxx_2026-05-15_..._KIM`） |
| 2 | 4 个目标版本完整 | Fold横/竖 + Pad横/竖 全部存在，对照 `targetVariantPlan` 无遗漏 |
| 3 | 设备 frame 圆角 | Fold 内屏 50dp / Pad 34dp 精确匹配 |
| 4 | 状态栏 variant + 高度 | Fold 用 `变体类型=fold`（46dp），Pad 用 `变体类型=pad`（**34dp，非 38dp 自然高度**） |
| 5 | 状态栏宽度 | 等于目标 frame 宽度 |
| 6 | 主内容区 y 起点 | 等于 statusBarH（46 或 34），不依赖 status bar 自然高度 |
| 7 | 栏宽 | 与 `device-dimensions.md` 表完全一致（如 Fold 内竖 LC: L=282 + C=346） |
| 8 | 任何标准组件实例 width / height === 目标值 | 以 `placeStandardComponent` 落位后自检 + Phase 6 verifyChecklist 双重校验。偏差 > 0.5dp 视为 reflow 失败 |
| 9 | Sidebar 高度 | Pad 横 = N 栏 mainH；Pad 竖覆盖 = frameH − statusBarH。经过 §3.6 强制序列 |
| 10 | NLC 覆盖遮罩 | Pad 竖 NLC 必须有 `遮罩-N覆盖` RECTANGLE，且 fill 已绑定 `遮罩色/mask` token |
| 11 | frame 子节点 z-order | 见 `component-placement-protocol.md`「§3 父节点结构与 z-order 模板」。**杆子永远最顶 z + 透明背景 + 风满 frame 宽** |
| 12 | 栏间分割线 | LC 1 条（L\|C）；NLC 并列 1 条（L\|C，**N\|L 无**）；NC / C 通栏 0 条；fill 已绑定 `分割线色/outline` token |
| 13 | 分割线高度 | 等于 frameH（贯穿状态栏到底部），不允许只到主内容区高度 |
| 14 | Sidebar 阴影 | Pad 横 N 栏 + 主内容区 `clipsContent = false`，截图能看到阴影越过 N\|L 边界 |
| 15 | 浮动 Tab / 键盘 / 玻璃材质 | 删除或 `visible=false`，不得保留移动端语义 |
| 16 | 组件库时间戳 | 怀疑视觉异常时优先 `search_design_system` 比对 `updatedAt`，使用最新版本 |
| 17 | frame fill / L栏 / C栏 fill / 分割线 / 遮罩 全部绑定 token | `frame.fills[0].boundVariables.color` 必须存在。RGB SOLID 视为 fallback，需有告警记录 |
| 18 | **A 类标准组件全部风满** | 全部 A 类组件（StatusBar / NavBar / TopBar / SearchBar / Chip / List / Detail / ToolBar / BottomBar / Sidebar / TextInput / Fab 等自带 internal padding 的组件）`x === 0` 且 `width === 栏W`。**任何 `x !== 0` 或 `width !== 栏W` 直接判 fail**。详见 §3.4a.1 A/B 二分 |
| 19 | **B 类裸控件合算（仅在确认无 internal padding 时）** | 裸 frame / 业务自定义容器：按 `device-dimensions.md` 断点表取 spec，`x = spec, w = 栏W − 2×spec`；1100 < 栏W 时 `x = (栏W − 988)/2, w = 988` 居中。A 类组件**不**走本路径 |
| 19a | **应用专用 N 收起 L 栏 width** | 笔记 / 待办 NL framework 收起：`L 栏 width === frameW`（N 自体消失通则）。其它应用按 `app-variant-map-{app}.md` 声明 |
| 20 | C 栏 TextInput bottom flush | 笔记 / 待办：C 栏 TextInput `y = mainH − h`（bottom 贴 frame 底，与杆子 16dp 重叠）；Detail 高度 = `mainH − 62`（延伸到 TI 底，TI 通过 z-order 与 fade overlay 自然遮盖）|
| 21 | **L 编辑遮罩** (§3.7a) | `scenarioFlags.LEditMode === true` 时 → `遮罩-编辑` RECTANGLE 存在 + 尺寸 `Cw × frameH` + 位置 `x=C 列起点, y=0` + fill 绑定 `遮罩色/mask` token + opacity 0.2 + L 栏 已从 main 提升至 frame 直接子级 + **`遮罩-编辑` 在 `状态栏` 之上**（C 列 status bar 区段必须 dim） |
| 22 | **多 mask z-order** (§3.7b) | `LEditMode + NCovering` 同时 时 → frame.children 顺序 `main(仅 C) → 状态栏 → 遮罩-编辑 → 分割线 → L 栏 → 遮罩-N覆盖 → Sidebar → 杆子` 完全一致（**状态栏 在两遮罩之下**，按列归属 dim）|
| 22b | **NLC 覆盖 z-order** (§3.7) | `NCovering === true && LEditMode === false` 时 → frame.children 顺序 `main → 状态栏 → 遮罩-N覆盖 → 分割线 → Sidebar → 杆子`（状态栏 在 遮罩-N覆盖 之下，整 frame status bar dim）|
| 23 | **scenarioFlags 一致性** | Phase 4 step 7 输出的 `scenarioFlags` JSON 必须作为参数传入 verifyChecklist 调用；flags 激活项与 frame 实际 mask 存在与否无矛盾 |
| 24 | **C 栏编辑时无 mask** (§3.7a 末) | `CEditMode === true && LEditMode === false && NEditMode === false` 时 → 确认 `遮罩-编辑` 节点不存在 |
| 25 | **inner componentProperties 与源稿同步** | 适配 frame 各标准组件 instance 的 inner INSTANCE 子节点 `componentProperties`（变体属性 / boolean / instance-swap / 文本）必须等于源稿同位置 instance 的对应值。覆盖业务态如 ToolBar 按钮 `状态=禁用`（未选编辑模式）、`数量=4个`（源 icon 数量）、List item `编辑态=true` 等。**禁止** 仅 swap 顶层 variant 而忽略 inner state — 源稿 instance 必须通过 `placeStandardComponent({ sourceInst })` 传入，verifyChecklist ⑯ 自动检测 |

### §6.3 每个目标 frame 写入完成后的强制截图

每完成一个目标 frame（4 个版本中的一个）必须立即 `get_screenshot` 验证，**不允许等到 4 个全部完成后再统一验证**。原因：早期错误（如 status bar variant 错、Sidebar 高度 800dp）会被克隆传播到后续 frame，最后再修需要重做多个 frame。

写入 → 截图 → 校验清单 6.2 中本 frame 的相关项 → 通过后再写下一个 frame。

## §7. 禁止项索引

### §7.1 文件 / 写入级

| # | 禁止 | 例外 |
|---|------|------|
| 1 | 新建「V2」/「副本」/「新页面」等并行设计稿 | 用户明确要求 |
| 2 | 一次性写入超过 10 个节点的大脚本（20KB 响应限制）| 无 |
| 3 | 修改组件内部结构；只改属性 / 尺寸 / 位置 | 无 |
| 4 | 使用自定义字体（Figma MCP 不支持）| 无 |
| 5 | 插入图片资源（Figma MCP 不支持）| 无 |

### §7.2 检索 / 复用级

| # | 禁止 | 详见 |
|---|------|------|
| 6 | "全文件探查可复用目标稿" 作为默认 | §1.1 |
| 7 | 未向用户确认就复用别处整页结果 | §1.3 |
| 8 | 当前 page 隔离约束下跨 page 搜索 | §1.2 |
| 9 | 把"不要整页复用"扩大成"组件级标准实例也不查" | §1.5 |
| 10 | `app-variant-map` / reference 给出明确实例时跳过优先命中 | §1.5 |
| 11 | 标准组件默认 detach 成普通 Frame | §3.2 |
| 12 | 跨画布搬运源稿不存在的业务内容 | §2.2 |
| 13 | 适配结果落到远离源稿位置 | §5.1 |

### §7.3 实例 / 落位级

| # | 禁止 | 详见 |
|---|------|------|
| 14 | StatusBar 沿用手机 variant 适配 Fold / Pad | §3.5 |
| 15 | 仅 `inst.resize()` 设 Sidebar 高度，缺 sizing FIXED 序列 | §3.6 |
| 16 | 省略 Pad 竖 NLC 覆盖模式的 `遮罩-N覆盖` 矩形 | §3.7 |
| 16b | 把 `状态栏` 提升到 `遮罩-N覆盖` / `遮罩-编辑` 之上（旧版「保证可读」rationale 已弃用）| §3.7 / §3.7a / §3.7b |
| 17 | NLC 模式 N\|L 边界添加分割线 | §3.8 |
| 18 | 用 C 栏 `strokeLeftWeight` 实现栏间分割线 | §3.8 |
| 19 | Pad 横 NLC 时 N 栏 / 主内容区 `clipsContent = true` | §3.9 |

### §7.4 验证级

| # | 禁止 | 详见 |
|---|------|------|
| 20 | 4 个目标 frame 写完之后再统一验证（必须每 frame 即时截图）| §6.3 |
| 21 | `verifyChecklist` 错误项 > 0 时汇报"适配完成" | §6.2 |
| 22 | fills 直接 RGB SOLID（不经 token lookup）| §0 #12 |
| 23 | 数据不确定时猜测填补 | §0 #13 |
| 24 | `scenarioFlags.LEditMode === true` 时省略 `遮罩-编辑` 矩形或不 promote L 栏 | §3.7a / §6.2 #21 |
| 25 | `LEditMode + NCovering` 同时为 true 时 z-order 错放（如把两遮罩并列于同一 z 层 / L 栏置于 N 覆盖遮罩之上）| §3.7b / §6.2 #22 |
| 26 | `scenarioFlags` JSON 缺失下汇报"适配完成"（Phase 4 step 7 未执行）| §6.2 #23 / SKILL Phase 4 step 7 |
| 27 | scenarioFlags 信号未在 `app-variant-map-{app}.md §0.1b 导出信号表` 列出时凭直觉填 flag 值 | §0 #13 / app-variant-map-template §0.X |
