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
22. **源稿实际 variant 与 CSV / 映射表冲突时处理**：源稿 instance 的实际 variant 与 `app-variant-map` / CSV 映射表不一致时，**以映射表为准**执行适配，同时向用户报告差异。原因：① 源稿 variant 是源 device 上下文（如手机编辑模式 ToolBar `_02`）的产物，与目标 device 的语义不必然一致；② 映射表 = CSV `结构变化表-{App}.csv` (designer 编写) 的镜像 = 多端规格的单一权威；③ 源稿是 reference frame，但 device 별 variant 결정은 mapping CSV 가 진정한 single source of truth. **例外**：源稿 inner 子组件 componentProperties (如 ToolBar 内 各按钮 `状态=禁用` / `数量=4个` 등) 反映 业务 interaction state — 对此类 inner state 적용 §0 #20 (inner componentProperties 必须与源稿同步) 으로 inheritInnerState 复制. 즉 **顶层 variant = 映射表 / inner state = 源稿** 의 二元 구조. **映射表 outdated 의심 시**: 사용자에게 보고 + CSV `结构变化表-{App}.csv` 业데이트 후 재추출 (§3.11). (与 §3.11 互补：§3.11 处理 CSV vs .md 冲突；本条 confirms CSV/映射表 over 源稿 物。)
23. **禁止以「视觉无影响」为由跳过正确 variant 匹配**：组件的 device-specific variant（如 `杆子` 的 `设备=折叠屏/pad × 横竖屏=横屏/竖屏`）必须按目标设备 + 方向精确选择。即使当前 variant 视觉上透明 / 不可见 / 与目标 variant 外观一致，也**不允许**保留错误 variant。原因：①设计系统的 variant 携带语义信息（适用设备、方向等），后续自动化检查 / 主题切换 / 深色模式可能产生差异；②「视觉无影响」是当前状态的主观判断，不是持久保证；③映射表 / spec 规定的精确值是强制要求，无豁免条件。

24. **HyperOS v0.8 库组件禁止使用（MUST）**：所有 import 必须来自 §0.5.1 列出的三个权威 **fileKey** 之一（`mrvMGwkbZ7qZML7iOfQsvI` 业务组件库 / `FBvQ3xM5C62MgIcA1JHWIs` OS4 UI Kit / `5gZYD8i6JqBvsaS7yvnO9c` Token-Lib），即 — 权威基准是 **fileKey**，非 library 显示名。OS4 UI Kit 的源 file 名包含 "Figma UI Kit 4.0 AI 测试版" 字符串，但 fileKey `FBvQ3xM5C62MgIcA1JHWIs` 即权威 OS4 源（§0.5.1 的单一来源）。该 file 发布 lib 的 libraryKey 形式为 `lk-99b74bcae...`（即检索结果中遇到此 libraryKey 不属于规避对象，而是权威本身）。**`Xiaomi HyperOS v0.8`（libraryKey `lk-bd807c2a...`）绝对禁止** — v0.8 与 OS4 UI Kit 中存在同名 ComponentSet（如 `杆子` / `StatusBar` 等），`importComponentSetByKeyAsync` 可能跨库调用成功但实际 import 旧库版本。**强制验证流程**：Phase 5 落位完成后，对任一关键组件 instance 执行 `inst.mainComponent.remote === true` + Figma UI 右侧面板确认 library 的 source fileKey 是 §0.5.1 三 fileKey 之一（尤其不是 v0.8 `lk-bd807c2a...`）。§0.4 / `csv-pipeline/data/setkeys.json` 记录的 key 如经 Figma UI 确认来自 v0.8 → 必须立即用 `search_design_system` 找到正确 key 并替换。**强制 scope (MUST)**：调用 `mcp__plugin_figma_figma__search_design_system` 时 **必须** 在 `includeLibraryKeys` 参数中传入 `csv-pipeline/data/setkeys.json` 的 `authoritativeLibraryKeys` 值。仅靠 unsubscribe 无法屏蔽 community/test/legacy lib 结果 — `includeLibraryKeys` scope 是唯一保障。权威 key 列表以 `setkeys.json` 的 `authoritativeLibraryKeys` 为单一来源。

26. **禁止 frame fill, 各 栏 自身负责 fill (核心)**：multi-栏 适配 frame (LC / NLC / NLC覆盖 / NL / NC) 的外层 frame 必须 **fills=[] (透明)**。颜色责任由**各栏 (`L 栏` / `C 栏` / `N 栏`) 自身**承担。各栏 **frame full-height (`y=0, h=frameH`)** 拉满，使其自身颜色覆盖到 status bar 区域。status bar instance 同样 fills=[] (透明)，让各栏颜色自然透到 status bar 区域。**原因**：frame fill 单一色无法满足 LC/NLC 等左右不同色的场景在 status bar 区域的分支表达 (例: 手机/Fold外 的 LC/NLC 套卡 layout 出现 L=surface_low / C=surface 分支时, status bar 区域也需 L 侧灰 / C 侧白 分支表达). 注: 单色 (Pad/Fold内 全 surface 或 手机 全 surface_low) 时也适用本通则 = 各栏自身 fill + frame 透明. device 各自 default 色決定 → `csv-pipeline/data/tokens.json` selectionRules.step1_deviceDefault, 卡片 list override → step2_cardOverride.各栏 fill + frame 透明 模式在所有 device × interaction state 下一致工作。**禁止**：① frame 自身设单一 fill ② 栏 height = mainH (frameH − statusBarH) 而由 frame fill 填充 status bar 区域。(2026-05-28 笔记 LEdit 适配时 frame fill 错设 `surface_low` 经用户指出 → 改为 各栏 fill + frame 透明 模式定型该规则)。

27. **浮层 Overlay 行的容器映射禁止套用 C栏直接使用子场景**：`app-variant-map §浮层 Overlay`「抽屉窗口 / 浮窗 FloatingWindow」行定义的是**通用 Overlay 容器转换**（手机 DrawerWindow → 大屏 FloatingWindow）。当子场景（AI提问 / 录音 等）的 C栏内容直接占据 frame 而非浮层时，**禁止**将 FloatingWindow 作为容器 import — 按 CSV 该行 "容器" 列值决定承载方式（`竖屏背景` = frame fill，非组件容器）。

28. **规则添加前 self-check (核心)**: 发现 special mapping / fix recipe 时禁止自动规则化. **「该 pattern 在其他 app 中是否可能反复出现？」 1 行 self-check** 必先. 决策树 (CSV direct / app §0.1 #N / common §3.X / runtime 函数) + 4 点 strong review = **§3.15 本文单一权威**. 违反则规则爆增 → context cost / drift / 一次性 fix 规则文残留.

## §0.4 共通枚举定义（单一权威）

本表是 csv-pipeline + 所有 `app-variant-map-{app}.md` + Phase 0~6 代码 / 文档共享的 **公共 enum** 的单一权威。各 app reference 不应自行重述 enum 表。

### `device` (8-device 约定)

| 值 | 含义 |
| --- | --- |
| `手机竖` | 手机 竖屏 |
| `手机横` | 手机 横屏 |
| `Fold外竖` | 折叠屏 外屏 竖屏 |
| `Fold外横` | 折叠屏 外屏 横屏 |
| `Fold内竖` | 折叠屏 内屏 竖屏 |
| `Fold内横` | 折叠屏 内屏 横屏 |
| `Pad竖` | 平板 竖屏 |
| `Pad横` | 平板 横屏 |

### `screenMode`

| 值 | 含义 |
| --- | --- |
| `L` | List, 列表画面 |
| `C` | Content, 内容画面 |
| `NC` | Navigation + Content 复合画面 |
| `LC` | List + Content 复合画面 |
| `NL` | Navigation + List 复合画面 (无 C) |
| `NLC` | Navigation + List + Content 三栏 |

`{NLC|NL|NC|LC}收起` 变体表示 N 栏收起态（`Sidebar` 为 `_00` 或自身消失的状态）。各 app reference 单独定义 N 收起规则。

### `resultType`

| 值 | 含义 |
| --- | --- |
| `variant` | 命中真实 `variantId` |
| `hidden` | 元素保留语义但当前场景不显示（`_00` 等空变体）|
| `absent` | 该场景下无此元素（mapping CSV 中无对应行）|
| `undefined` | 尚未建档，调用方必须中止（lookup 失败，需用户确认）|

## §0.5 组件源文件架构（强制，Phase 4 / Phase 5 前置）

### §0.5.1 三个权威源文件

所有多端适配的资源**必须且仅从**以下三个 Figma 文件获取（按用途分两类）：

**组件 (ComponentSet) 源 — 2 个文件**：

| # | 文件名 | fileKey | 角色 | 典型组件 |
|---|--------|---------|------|---------|
| 1 | **Xiaomi-HyperOS-业务组件库** | `mrvMGwkbZ7qZML7iOfQsvI` | 应用专属业务组件 | List_Task, DetailTask, List_Notes, Detail_Notes, AIWindow_Notes, RecordNotes, NewTaskWindow, TextInput_Notes, BottomBar_Showcase_Notes, BottomBar_NoteEditPanel 等 |
| 2 | **Xiaomi-Hyper-OS4-UI-Kit**（实际 file 名末尾含 "Figma UI Kit 4.0 AI 测试版" — 但 fileKey 即权威标识，名字仅为出处版本号，§0 #24 互参） | `FBvQ3xM5C62MgIcA1JHWIs` | 系统通用组件 | StatusBar, NavigationBar, SearchBar, BottomBar, Sidebar, ToolBar, Fab, SelectableChip, SwipeIndicator, TopBar, Scrollbar, Menu, FloatingWindow, WheelPicker, SearchReceiving, DrawerWindow 等 |

**Token (变量 / 颜色 / 字体) 源 — 1 个文件**：

| # | 文件名 | fileKey | 角色 | 典型 token |
|---|--------|---------|------|---------|
| 3 | **HyperOS4-Design-Token-Lib** | `5gZYD8i6JqBvsaS7yvnO9c` | 全局 design token (无 ComponentSet) | `背景色/surface_low`, `背景色/surface`, `分割线色/outline`, `遮罩色/mask` 等 |

> 上述 3 个库以外的任何库（尤其 **HyperOS v0.8** `lk-bd807c2a...`）**绝对禁止** 使用 (§0 #24). v0.8 与 OS4 UI Kit 中存在同名 ComponentSet, cross-library import 看似成功实际取到旧版本.

### §0.5.2 CSV 与源文件的关系

csv-pipeline 输入 CSV 两种 (`csv-pipeline/mapping-input/`):

| CSV | 内容 | 与 §0.5.1 关系 |
|-----|------|-------------|
| **`结构变化表-{App}.csv`** (按 app 拆分, 17 个) | 应用 × 设备 × screenMode → variantId 全量映射 | 每个 variantId 对应 §0.5.1 中两个组件库之一的实际组件变体 |
| **`控件变体清单.csv`** | 所有 variant 的 ComponentFamily / VariantId / Space(padding) / 完成状况 | variant 是否已落地、spacing spec 的权威来源 |

> 两 CSV 为 csv-pipeline 的**输入** (mapping-input/). `npm run extract` 生成 derived 产物到 `mapping-output/` (`SystemUIKIT-mapping.csv` / `app-{App}-mapping.csv` × 18 / `components.csv` / `extract-report.md`). Phase 4 lookup 使用 derived 产物, 不直接解析输入 CSV.

### §0.5.3 执行约束

| # | 规则 |
|---|------|
| 1 | **framework 判定必须基于 CSV `结构变化表-{App}.csv`**：判断某 app 在某 device 下是否有 C 栏内容（Detail / Fab / TextInput 等），以 CSV 该 app 行的对应设备列是否存在 `C栏：XXX` 为准。**禁止**仅根据源 section 内是否有 detail frame 来判断 framework |
| 2 | **Phase 4 variant lookup**：`app-variant-map-{app}.md` 映射表 → CSV `结构变化表-{App}.csv`（cross-check）→ 源文件 import。三者一致时直接执行；不一致时按 §3.11 冲突处理 |
| 3 | **源 section 内未见 detail frame ≠ 该 app 无 detail**：业务组件库中的 Detail 组件（如 `DetailTask_01`）通过 `importComponentByKeyAsync` 导入，不要求源 section 中预先存在 detail frame |
| 4 | **`search_design_system` 查询时**：优先使用 `app-variant-map-{app}.md §0.4` 中记录的 component set key；未记录时用 CSV 控件变体清单中的 ComponentFamily + VariantId 构造查询词 |

### §0.5.4 常见误判与纠正

| 误判 | 根因 | 正确做法 |
|------|------|---------|
| "源 frame 无 detail → 判定 NL" | 仅看源 section，未查 CSV | 查 CSV `结构变化表-{App}.csv`该 app 行 `C栏` 列；存在 DetailTask / DetailNotes → LC/NLC |
| "业务组件库是另一个文件，与适配无关" | 不了解两文件架构 | 业务组件库 = 业务组件唯一权威源 |
| "手机源稿是单一列表页所以大屏也只有列表" | 忽视大屏 C 栏内容来自库而非源稿 | 大屏 LC/NLC 的 C 栏通过 import 库组件填充 |

## §1. 检索与复用边界

### §1.1 默认范围

| 动作 | 默认规则 | 允许例外 |
| --- | --- | --- |
| 当前 page 检索 | 搜索 / 比对 / 复用 仅限源稿当前 page | 用户明确要求"参考其他 page" |
| 整页 cloning | **禁止** (无例外). 用户即使明示 "X page 结果参考", 也只能作为 reference 使用, 禁止直接 clone | 无 |
| 标准组件实例探查 | **必做** (无例外). 目标布局所有标准组件依赖一律以标准实例满足 | 无 |

### §1.2 标准实例使用强制

标准组件**必须以标准实例使用**. 「实例不存在 / 无法访问 / 字体限制」等任何理由必须经 §3.14「妥协声明前实证强制」流程, 在 `componentTaskList` 记录为 `blocked` 项 + 向用户报告. **禁止任何绕过 / detach / 自建 frame 替代**. 详见 §3.2 + §3.14.

### §1.3 导航族不可混用

| 组件 | 语义 |
|---|---|
| `BottomBar` | 手机底部导航 |
| `Sidebar` | N 栏 (Pad / Fold 均可使用, device 别 spec 见 device-dimensions.md) |
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

> **目标布局比源稿宽时**同样适用: 空白区直接保留, 或以空 L/C/N 栏占位骨架预留. **禁止因布局是 LC / NLC 就擅自补齐 list / detail / 图片等内容** — 空间富余 ≠ 允许填充内容.

### §2.2 业务内容（不允许跨画布迁入）

列表项 / 正文文案 / 标题副标题摘要 / 图片封面缩略图 / 时间标签统计值

### §2.3 结构组件（必须迁移，不算跨画布补内容）

`NavigationBar` / `StatusBar` / `BottomBar` / `Sidebar` / `DrawerIndicator` / `Fab` / `SearchBar` / 浮层容器（`FloatingWindow` / `DrawerWindow` / `AlertDialog` / `Menu`）等。

源稿存在 + 映射表未明确返回 `hidden`/`absent` → 必须迁移、映射或以 `fallback` 状态说明。

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
**MUST**: 保持 INSTANCE 状态。只允许 variant 切换 / 属性调整 / 尺寸调整 / 位置调整。
**NEVER**: `detachInstance` (无例外). 实例路径阻塞时, 经 §3.14「妥协声明前实证强制」流程在 componentTaskList 标记 `blocked` + 向用户报告. **禁止任何 detach / clone / 自建 frame 替代** (§1.2 + §1.3).

## §3.3 ~ §3.4 (原独立小节, 已并入 §3.6)

> §3.3「clone / variant 切换后尺寸同步」+ §3.4「残留 override 清理」已并入 §3.6「自带 auto-layout 实例的 resize / 落位通用陷阱」强制序列. **resize / swap / override 处理以 §3.6 6 步强制序列为单一来源**.

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

### §3.4a.5 `_00` 变体语义一致性表

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

## §3.5 状态栏 (已迁出)

> **2026-05-26 迁出**: cross-device variant 切换 + 强制高度 规则迁至 [`component-dictionary/StatusBar.md`](component-dictionary/StatusBar.md) 单一来源. set key, variant 映射, MUST/NEVER, code, device 别 spec 全部参见该文件.

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
| **9** | **master `layoutSizingV='Fill'` ↔ instance default `'FIXED'` 격차 통칙**（2026-05-31 정식 채택, MUST）: master component 가 `layoutSizingHorizontal/Vertical = 'Fill'` 로 정의되어 있어도 figma `createInstance()` 는 default `'FIXED'` 로 시작 — master Fill default 가 자동 전파되지 않음. 따라서 `inst.resize(targetW, targetH)` 또는 `inst.layoutSizingVertical = 'FILL'` (auto-layout slot 부모) 를 **반드시 명시 호출**. master 만 수정해서는 instance 자동 풀히트 보장 안 됨. 본 통칙은 모든 app 에 적용; app-specific 사례는 각 `app-variant-map-{app}.md` 에 룰로 명시 (예: 笔记 의 `Sidebar_Notes` attached form → `app-variant-map-笔记.md §0.1 #10`). **검증 시 master 만 보고 「Fill 정의됐으니 instance 도 Fill 일 것」 추론 절대 금지** — 반드시 actual instance 의 `layoutSizingVertical` property 직접 dump 후 확인. 회고: 2026-05-31 笔记 ManageFoldWindow 적응 시 user 가 master 를 H=Fill 수정했지만 fresh createInstance 가 여전히 FIXED 로 나와 manual resize 가 정식 룰임을 확정. |
| **9a** | **cross-file master cascade FIXED chain + ABSOLUTE constraints 통칙**（2026-05-31 추가）: master 의 inner ABSOLUTE auto-layout child (배경 / blur layer 等) 의 `constraints` 는 **instance level override 不可** (figma 제약: "This property cannot be overridden in an instance"). 따라서 cross-file (业务组件库 → 사용 file) instance 가 master 의 자연 H 보다 큰 size 로 resize 必要 시:<br>① master file 측에서 ABSOLUTE child `constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' }` + AUTO child sizingV='FILL' 을 cascade 적용<br>② **library publish 必要** — master 변경은 publish 후에야 사용 file instance 가 picking up<br>③ publish 후 사용 file 에서 fresh import + createInstance + resize 시 자동 cascade<br>④ publish 전 사용 file 임시 fallback = master 자연 H 로 resize + 居中 (instance level override 不可 layer 가 stuck 되어 视觉 빈 공간 발생). 회고: 2026-05-31 `Notes_FloatingWindow_01` Pad横 H=759 적용 시 inner `FloatingWindow-ComponentSet` (ABSOLUTE) 636 stuck → 하단 123dp 빈 공간. master cascade FILL + publish 후 759 cascade 정상 동작 확인. |

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
3. 栏间分割线              ← 遮罩-N覆盖 之下 → 分割线 一同 dim
4. 遮罩-N覆盖              ← 在状态栏 + 分割线 之上 → 状态栏 / 分割线 均被 dim（仅 N 列除外，由 Sidebar promote 完成）
5. Sidebar                 ← N 覆盖遮罩之上（Sidebar = N trigger，唯一豁免）
6. 杆子                    ← 风满 + 透明 + 最顶 z
```

**MUST**:
- 遮罩-N覆盖 必须在状态栏之上（否则状态栏不被 dim，违反「全 frame 除 trigger 列豁免」原则）。
- Sidebar 在所有后续 appendChild 后必须保持上述 z 位（不能被杆子取代）。

**NEVER**:
- 把 `状态栏` 提升到 `遮罩-N覆盖` 之上。
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
| 圆角 | **必须 object form**（非对称）：`topLeft = 0, topRight = frameR, bottomLeft = 0, bottomRight = frameR`。frameR 取 `device-dimensions.md` 各 device cornerRadius (Pad=34 / Fold内=50 / Fold外右侧=56). **禁止** scalar `cornerRadius = 50`（会让左侧 inner edge 也圆角化，与 L 栏右缘形成可见 gap）|
| fill | 绑定 `遮罩色/mask` token，opacity `0.2` |
| 代码映射 | `csv-to-spec.ts` editMask emit 时使用 `{topLeft:0, topRight:fcr.tr, bottomLeft:0, bottomRight:fcr.br}` 对象形式（Fold外 非对称 frame 也自动适配）。render-spec / use_figma 调用方需用 typeof guard 分支（`typeof === 'number'` ? scalar : object 4-corner）。|

**关键解释**：spec `device-dimensions.md`「遮罩定义 / 适用范围」 写「整个 frame，触发控件除外」。**触发控件 = L 栏整列**（含其上方 status bar 区域）。所以遮罩区 = `frame − L 列 = C 列（含 C 列上方 status bar 区段）`。N 栏触发时同理（遮罩 = 全 frame − Sidebar 列）。

**遮罩覆盖范围原则（与 §3.7 一致）**：
- 遮罩-编辑覆盖 **C 列全域，含 C 列上方的 status bar 区段**（即 status bar 的 C 列区段必须被 dim）。
- ❌ 不要再用「状态栏可读性 / 时间信号可读」rationale 推导 z-order。L 列上方的 status bar 不被 dim 是因为它属于 trigger 列（L），与「可读性」无关。

**z-order 强制（遮罩-编辑 必须在状态栏之上，C 列 status bar 区段才会 dim）**：

```
1. main（仅含 C 栏；L 栏从 main 提升到 frame 直接子级）
2. 状态栏-StatusBar
3. 栏间分割线              ← 遮罩-编辑 之下 → 分割线 一同 dim
4. 遮罩-编辑（C 列）       ← 在状态栏 + 分割线 之上 → C 列 status bar 区段被 dim
5. L 栏                    ← frame 直接子，覆盖在编辑遮罩之上（trigger 除外）
6. 杆子
```

**MUST**:
- 遮罩-编辑 必须在状态栏之上（C 列 status bar 区段 dim 必需）。
- L 栏从 main 内部移出至 frame 直接子级（`frame.appendChild(L)`），定位 `x = L 列起点, y = statusBarH`。否则无法在 z-order 上凌驾于 frame 级遮罩之上。
- main 内部仅保留 C 栏（其它列 promote）。
- 遮罩-编辑 必须位于 frame 直接子级，禁止放入 C 栏内部（C 栏内部遮罩无法盖住 C 列上方 status bar 区域，且无法被 frame-level 圆角裁切）。

**NEVER**:
- 把 `状态栏` 提升到 `遮罩-编辑` 之上。
- 把 `遮罩-编辑` 做成全 frame 尺寸 → 会盖住 L 列触发区域。
- 把 `遮罩-编辑` 放入 C 栏 children → C 栏只占 mainH 高，盖不到 status bar 区。
- L 栏继续留在 main 内部 → 无法 z-promote 到遮罩之上。

### §3.7a-NL NL framework + LEditMode 处理

**WHEN**: framework = NL (list-only, 无 detail 列), `flags.LEditMode = true`. NL 无 C 列 → 无「编辑遮罩」概念.

**规则**: 所有 device / 子形态 一律 mask 不渲染, L 栏不 promote, z-order 沿用 NL 通则 (`main → 状态栏 → 栏间分割线 → 杆子`). §3.7a 的 mask + L promote 机制仅适用于含 C 列 framework (LC / NLC / NLC 覆盖).

**verifyChecklist 兼容**: `spec.framework = 'NL'` 时 ⑩~⑫ 全部 skip, 勿传 `spec.editMask` 等.

### §3.7a-NLC并列 NLC并列 framework + LEditMode → Sidebar 也 promote

**WHEN**: framework = NLC并列 (Pad横 default), `flags.LEditMode = true`，N 栏存在。

**规则**: 除编辑遮罩 + L promote 外，**Sidebar (N 栏) 也必须 promote 为 frame 直接子级**。原因: §3.9 Sidebar 阴影裁切防止 — Sidebar 阴影要越过 N|L 边界可见，需 N+main `clipsContent=false` + Sidebar z 在 L 之上。NLC并列 default (LEditMode=false) 时 Sidebar 在 main/N 内、L 也在 main 内，处于同一 z 平面。LEditMode 下 L promote 为 frame 直接子级后，若 Sidebar 仍在 main 内则 z 低于 L → 阴影被 L 的 surface fill 遮挡。

**z-order 强制**（与 §3.7b 同一模式，仅缺 N覆盖遮罩）:

```
1. main（仅含 C 栏 + N 栏外壳，但 N 栏内部不再含 Sidebar）
2. 状态栏-StatusBar
3. 栏间分割线              ← 遮罩-编辑 之下
4. 遮罩-编辑（C 列）       ← 状态栏 + 分割线 之上
5. L 栏                    ← frame 直接子，编辑遮罩之上
6. Sidebar                 ← frame 直接子，L 之上（阴影 visible）
7. 杆子
```

**MUST**:
- N 栏 + main `clipsContent = false`（§3.9 Sidebar 阴影裁切防止）
- 将 Sidebar 移至 frame 直接子级（`frame.appendChild(sidebarInst)`），保持绝对坐标（`absX = main.x + N.x + sidebarInst.x; absY = main.y + N.y + sidebarInst.y`）
- N 栏 frame 自身保留在 main 内（保留背景色 + width slot — 仅 Sidebar promote，N 外壳 frame 留在 main 内）

**NEVER**:
- 仅 promote Sidebar 而未设置 N+main `clipsContent` → 阴影在 N 右边界被裁切
- 将 N 栏 frame 整体 promote → 其它 column 与 layout 错乱

**csv-to-spec.ts zOrder 输出**:
```
NLC并列 + LEditMode → ['main','状态栏','分割线','遮罩-编辑','L栏','Sidebar','杆子']
```
（`lanes.N` 存在时自动追加 'Sidebar' entry；`lanes.N` 不存在时 = LC framework → 无 Sidebar entry）

### §3.7b 多遮罩叠加 z-order（编辑遮罩 + N 覆盖遮罩同时存在）

**WHEN**: Pad 竖 NLC 覆盖模式 + L 栏编辑同时激活（用户显式确认两种 trigger 共存）。

**z-order 强制（按 reference frame 验证，禁止从 spec text 推测）**：

```
1. main（仅 C 栏）
2. 状态栏-StatusBar
3. 栏间分割线              ← 所有遮罩 之下 → 分割线 一同 dim
4. 遮罩-编辑（C 列）       ← 在状态栏 + 分割线 之上（与 §3.7a 一致）→ C 列 status bar 区段 dim
5. L 栏                    ← 编辑遮罩 之上，N 覆盖遮罩 之下
6. 遮罩-N覆盖（全 frame）  ← 高 z；L 栏 / 状态栏 / 编辑遮罩 都被 N 覆盖一并 dim
7. Sidebar                 ← N 覆盖遮罩 之上（唯一豁免：Sidebar = N 覆盖 trigger）
8. 杆子
```

**关键**：
- **每个遮罩都覆盖该 trigger 列以外的全域（含 status bar 对应区段）**，与「可读性」rationale 无关。
- 两遮罩对 L 栏的覆盖关系**不同** —— 编辑遮罩在 L 之下（L 豁免），N 覆盖遮罩在 L 之上（L 被覆盖）。各自的 trigger 控件（L 栏 / Sidebar）相对各自遮罩 z-up，与另一 trigger 无关。
- ❌ **不可**凭直觉把两遮罩并列在 L 栏下方（曾发生过的错误）。
- ❌ **不可**把 `状态栏` 提升到任一遮罩之上。状态栏在两遮罩之下，按列归属规则被 dim。

## §3.8 栏间分割线规则

**节点形态**（2026-05-28 修订, 复原 user 原定义）: **C 栏自身的 `strokeLeftWeight = 1`**。栏 frame 左侧外框线表达分割线 (状态栏区域因 status bar instance fills=[] 透明 + 各栏 y=0 h=frameH 风满 → 栏 fill 透出至状态栏区域, stroke 自然延续).

**旧版 (`独立 RECTANGLE`) 废弃理由**: 仅当 status bar 不透明时才 valid. 本 skill 的 status bar fills=[] (§0 #26 + Q1 user choice) 上下文中 strokeLeftWeight 更自然且符合 user 原定义.

**布局模式 → 位置**:

| 模式 | 适用对象 | strokeLeft |
|------|---|---|
| LC（Fold 内横/内竖）| C 栏 | 1 |
| NLC 并列（Pad 横）| C 栏 (L\|C) | 1（**N\|L 无**，Sidebar 阴影分隔）|
| NLC 覆盖（Pad 竖）| C 栏 | 1 |
| NLC 收起 (笔记/待办: N 自体消失 → 回归 LC) | C 栏 | 1 |
| NC | — | 0 |
| C 通栏 | — | 0 |

**实现代码**:
```js
const strokePaint = await bindStrokePaint('分割线色/outline', {r:0,g:0,b:0}, 0.1);
C.strokes = [strokePaint];
C.strokeWeight = 0;       // disable all sides default
C.strokeTopWeight = 0;
C.strokeRightWeight = 0;
C.strokeBottomWeight = 0;
C.strokeLeftWeight = 1;   // only left
C.strokeAlign = 'INSIDE';
```

**MUST**:
- 各栏 frame `y = 0, h = frameH` 风满 (栏 fill 透出至状态栏区域)
- status bar instance `fills = []` (透明)
- C.strokes[0] 必须绑定 `分割线色/outline` token

**NEVER**:
- 用独立 RECTANGLE 表达栏间分割线 (status bar 透明时 redundant)
- 在 NLC N\|L 边界加分割线 → 与 Sidebar 阴影双重分隔

## §3.9 Sidebar 阴影裁切防止 (已迁出)

> **2026-05-26 迁出**: 该规则迁至 [`component-dictionary/sidebar.md` 「阴影裁切防止」节](component-dictionary/sidebar.md) 单一来源. 配置位置 / clipsContent 设置 / Phase 6 校验 全部参见该文件.

## §3.10 组件库时间戳校验 + fresh-import 强制 + Set key stale 检测

**WHEN**: 以下 3 种情况 — (a) clone 文件内旧 instance 落地前 / 视觉异常调查, (b) `set.children.find(/TargetVariant/)` 结果 `undefined`, (c) `importComponentSetByKeyAsync(key)` 抛出 `not found`.

**核心原则**: §0.4 / `setkeys.json` 的 key 是 **cache** 而非 permanent truth. variant 缺失 / not found 发生时 **禁止立即判定「未落地」** — 必须 fresh import.

**MUST 顺序**:

1. **`search_design_system`** 重新搜索 set 名 → 比对 `updatedAt` (取最大 timestamp 的 componentKey)
2. **`importComponentSetByKeyAsync(key)`** 重新调用 (废弃旧 import 对象) → fresh set.children 内重新查找 target variant
3. **替换流程**: `importComponentSetByKeyAsync(key) → set.children.find(/variant/) → 旧 instance.swapComponent(new variant) → §3.6 强制序列`
4. 仍缺失 / 仍 not found → 才能判定「未落地」或上报 user
5. 视觉异常优先怀疑 component 库版本不一致, **后**查 instance 写错

**自动检查推荐** (variant 缺失时):
```js
const freshSet = await figma.importComponentSetByKeyAsync(setKey);
const freshTarget = freshSet.children.find(c => predicate(c.name));
if (freshTarget) return freshTarget;  // 废弃旧搜索结果, 用 fresh
// 真实缺失 → 上报
```

**Key 更新后 Action (MUST)**:
- 当前 session 内立即更新 `app-variant-map-{app}.md §0.4` (或 `csv-pipeline/data/setkeys.json`) 的 key + git commit
- §0.5 变更日志增项
- 同名 set 在多个库存在时 → 通过 `get_libraries` 的 `libraries_added_to_file` 直接确认权威库 (禁止单凭 search 判定)
- 个别 component key (`StatusBar_01` 等) 独立管理不稳定时 → 统合为 ComponentSet key + 转换为 `children.find()` 模式 (set key 更稳定)

**根因案例**:
- **PM2 (2026-05-21 StatusBar)**: `状态栏-StatusBar` key `599a7d4b...` stale → not found. 当时 search 活跃 set = `15e94d49...` (HyperOS v0.8). **PM8 修订**: v0.8 非订阅库. 权威 = Xiaomi Hyper OS4 UI Kit ComponentSet `1047f2112a230a27d3888d27b34a5857815216e3`. cross-library import 成功 ≠ canonical 库. 决定: 个别 variant key 不再记录于 §0.4, set import 后 `children.find(/01|03/)` 访问.
- **TopBar_07 fresh-import 案例**: 首次搜索时 NavigationBar set 内仅见 TopBar_00~_06 → 判定「未落地」→ 使用 TopBar_03 fallback. 后经用户指出, fresh import 重试 → 找到 TopBar_07 (key=`b95b5b9e2f3d6a1306a0cbd14975164463528cf6`). NavigationBar set updatedAt = 2026-05-19 07:35Z, 旧 import 缓存 stale.

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

## §3.13 CSV column 表示 / Fold内 framework drilldown (PM4 / PM-2026-05-27)

**WHEN**:
- (a) CSV column header = 单一 `Fold內LC`, 但 NL framework 内存在 NL→C fallback 内容上提
- (b) extract-mapping CSV col 1 含有 `/ NLC` 等 sceneCondition 标记, Fold内竖 / Fold内横 column (NC/LC/C) 有数据

**NEVER**:
- 单一列内 silently 合并两个分支值
- 自行修改「L 栏:」/「C 栏:」 prefix
- 应用旧 P2 filter (`colScene !== sceneCondition` 时 skip) — 废弃, drilldown 数据被屏蔽

**MUST**:
1. 严格遵循 CSV NL row Fold內 列值 (含 prefix). 列内 device 间存在不同值 (Fold內竖 vs 横) 时**用 footnote 显式分离**: `**Fold内竖C：X / Fold内横C：Y**`. prefix 冲突时 CSV 表示优先 (不做语义分析).
2. Fold内 device 时 extract-mapping 须 emit 所有 sceneCondition × colScene 组合. row 的 `framework` 列 = 原始 sceneCondition, `scene` 列 = colScene.
3. csv-to-spec lookup 时 (app, subScene, device, scene, lane, uiElement) key 一致也可能存在 framework 不同的多个候选. 优先级: app default framework (app-variant-map 标注) → 其余顺序由设计师评估.

**drilldown 案例表**:

| sceneCondition | colScene | 含义 |
|---|---|---|
| NLC | LC | NLC framework drilldown 至 Fold内 LC |
| NLC | NC | NLC framework drilldown 至 Fold内 NC |
| NLC | C  | NLC framework drilldown 至 Fold内 单面 C |
| LC  | C  | LC framework 的 NL→C fallback (旧 PM4 案例) |

**根因案例**:
- PM4 (NL→C fallback): ToolBar/NL row Fold內竖LC 列 = CSV 「L栏:_02」, framework 上系 NL→C fallback. AI silently 改为「C栏:_02」. PM5 校验 mismatch → 又改回「L栏:_01」. 最终 CSV 「L栏:」 prefix 保持不变才是正解 (NL→C fallback 时 L 内容 promote 语义保留).
- PM-2026-05-27 (extract-mapping.ts:582-595 fix): 笔记 standard=NLC. CSV row 22 `/ NLC` col 7 (Fold内竖 LC) cell `_04` = NLC drilldown 至 Fold内 LC, 笔记 default 的正解. 旧 P2 filter 屏蔽该数据 → row 101 LC 的 `_05` (私密笔记) 被错误映射的 bug.

**应用专用变更日志** (迁出, 避免本节膨胀): 笔记 / 待办 → `app-variant-map-笔记.md §0.5`. 其它 → 各 `app-variant-map-{app}.md`.

## §3.14 妥协声明前实证强制（2026-05-21 追加）

**WHEN**: componentTaskList 某条目准备标记为 `fallback` / `blocked`，或声明「无法同步」「结构差异」等

**MUST 提供实证**：

1. 实际执行的代码片段（setProperties / swapComponent / importComponentSetByKeyAsync 等）
2. 执行返回的**具体错误信息**（error message 或 undefined 结果）
3. 针对该错误的二次修复尝试（如 fresh import §3.10）

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

## §3.15 规则添加决策标准（2026-05-31 追加）

**WHEN**: 适配过程에서「common 不到의 special mapping / cascade pattern / fix recipe」 등장 시, 룰 文 추가 commit 前 必须 통과.

**核心 self-check (1 행)**: **「이 pattern 이 다른 app 에도 反復될 가능성 있나?」** — No → 룰 文 不要, 「데이터」만 기록 (CSV cell + footnote).

**4점 review (MUST 自答, NEVER 1점이라도 fail 시 추가)**:

1. **다른 app 에서 (다른 子場景 / device) 反復 발생 증거가 있나?** No → CSV direct (mapping → `结构变化表-{App}.csv` cell, 1회성 spec 偏差 → CSV cell, 1회성 variant 选择 → CSV + 1줄 footnote).
2. **runtime 함수 본체로 解決 가능한가?** Yes → `runtime/placement.ts` / `verify.ts` 추가, 룰 文 不要 (또는 1줄 pointer 만).
3. **既存 §0.X / §3.X 룰의 sub-case 인가?** Yes → 既存 룰 본문 修正, 새 §N 추가 不要 (drift 위험).
4. **룰 文 본문 ≤ 5 줄 압축 가능한가?** No → over-engineering. CSV / runtime 으로 二分.

**Yes 통과 시 위치 결정 트리**:

| 룰 性质 | 위치 |
|---|---|
| 단 1 app 内 multi-device cascade (예: `Sidebar_Notes attached form`) | `app-variant-map-{app}.md §0.1 #N` |
| multi-app 共有 cascade / fix recipe (예: A 类 风满, instance reflow 6 step) | 本文档 §3.X |
| runtime 实행 가능 algorithm (예: inner state walk, capsule 后처리) | `runtime/placement.ts` / `verify.ts` 함수 본체 |
| token / set key / library key 列表 | `app-variant-map-{app}.md §0.4` 表 |

**判別 例**: 笔记 LC L NavBar device 별 `_04/_07/_08` → **CSV direct** (기계적 device × variant). 笔记 Sidebar_Notes attached form (Fold 全 device 풀히트 + inner FILL only children[0]) → **§0.1 #10 룰** (4 device cascade + boundary 必要). 私密笔记 Pad 도 LC → **CSV cell** (1회성 偏离). `instance.children[0].layoutSizingV='FILL'` cascade auto-apply → **`placement.ts` step 7c** (runtime 行为).

**既存 룰 retrospective**: 새 task 完了 후, 추가한 룰이 4점 통과 여부 재검. 통과 못 하면 CSV / runtime 으로 移籍 + 룰 文 削除 (또는 pointer 만).

## §4. 写入优先级与失败处理

### §4.1 组件 import 优先级

| 顺序 | 方式 |
|---|---|
| 1 | **`importComponentSetByKeyAsync`** (§0.4 权威 set key) → `set.children.find(variantId)` |
| 2 | §0.4 未登记时 **`search_design_system`** (scope = §0.5.1 库) → 定位 set 后 import |
| 3 | 上述均失败 → **§3.14 实证后 `componentTaskList` 标记 `blocked`** |

依据 §1.2「标准实例使用强制」 + §3.14「妥协声明前实证强制」, **自动降级 (clone fallback) 路径已废止**. 实例路径失败时:

1. 收集实证 (error message + 尝试代码)
2. componentTaskList `status = blocked` + 记录原因
3. 向用户报告等待决策
4. **禁止擅自 clone / detach / 自建 frame 绕过** (§3.2)

### §4.2 映射表 hidden / absent 处理 (与 `blocked` 区分)

映射表 / 布局规则明确返回如下状态 → 省略组件 (skip):

| status | 含义 | 处理 |
|---|---|---|
| `hidden` | 语义保留, 视觉不显示 (`_00` 等空变体) | 不创建 instance, 无需用户报告 |
| `absent` | 该场景下要素缺失 (mapping CSV 无此行) | 不创建 instance, 无需用户报告 |
| `blocked` | 实例路径失败 (§4.1 序列未通过) | 实证 + 用户决策等待 |

## §5. 目标稿落位规则

### §5.1 落位优先级

| 顺序 | 规则 |
|---|---|
| 1 | 与源稿同一 section（源稿在 section 中时） |
| 2 | 同一 page 的源稿右侧（源稿不在 section 中时） |
| 3 | 与源稿相同的 `y` 起点（方便横向对照） |
| 4 | 默认顺序：`Fold内横 → Fold内竖 → Pad横 → Pad竖` |

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

**发现错误时修正优先级**: 尺寸 → 位置 → 文本 / 局部视觉. **禁止整页推翻重做**, 只做局部修正.

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
| 12 | 栏间分割线 | LC / NLC 并列 / NLC 覆盖 / NLC 收起 → **C 栏 strokeLeftWeight=1** + strokes 绑定 `分割线色/outline` token (§3.8 2026-05-28 修订)；NC / C 通栏 → 无 |
| 13 | 分割线高度 | C 栏自身 height = frameH (栏 y=0 h=frameH 风满) → strokeLeft 自然表达 frame 全高. status bar instance fills=[] 透明，视觉自然连续 |
| 14 | Sidebar 阴影 | Pad 横 N 栏 + 主内容区 `clipsContent = false`，截图能看到阴影越过 N\|L 边界 |
| 15 | 浮动 Tab / 键盘 / 玻璃材质 | 删除或 `visible=false`，不得保留移动端语义 |
| 16 | 组件库时间戳 | 怀疑视觉异常时优先 `search_design_system` 比对 `updatedAt`，使用最新版本 |
| 17 | frame fill / L栏 / C栏 fill / 分割线 / 遮罩 全部绑定 token | `frame.fills[0].boundVariables.color` 必须存在。RGB SOLID 视为 fallback，需有告警记录 |
| 18 | **A 类标准组件全部风满** | 全部 A 类组件（StatusBar / NavBar / TopBar / SearchBar / Chip / List / Detail / ToolBar / BottomBar / Sidebar / TextInput / Fab 等自带 internal padding 的组件）`x === 0` 且 `width === 栏W`。**任何 `x !== 0` 或 `width !== 栏W` 直接判 fail**。详见 §3.4a.1 A/B 二分 |
| 19 | **B 类裸控件合算（仅在确认无 internal padding 时）** | 裸 frame / 业务自定义容器：按 `device-dimensions.md` 断点表取 spec，`x = spec, w = 栏W − 2×spec`；1100 < 栏W 时 `x = (栏W − 988)/2, w = 988` 居中。A 类组件**不**走本路径 |
| 19a | **应用专用 N 收起 L 栏 width** | 笔记 / 待办 NL framework 收起：`L 栏 width === frameW`（N 自体消失通则）。其它应用按 `app-variant-map-{app}.md` 声明 |
| 20 | C 栏 TextInput bottom flush | 笔记 / 待办：C 栏 TextInput `y = mainH − h`（bottom 贴 frame 底，与杆子 16dp 重叠）；Detail 高度 = `mainH − 62`（延伸到 TI 底，TI 通过 z-order 与 fade overlay 自然遮盖）|
| 21 | **L 编辑遮罩** (§3.7a) | `scenarioFlags.LEditMode === true` 时 → `遮罩-编辑` RECTANGLE 存在 + 尺寸 `Cw × frameH` + 位置 `x=C 列起点, y=0` + fill 绑定 `遮罩色/mask` token + opacity 0.2 + L 栏 已从 main 提升至 frame 直接子级 + **`遮罩-编辑` 在 `状态栏` 之上**（C 列 status bar 区段必须 dim） |
| 22 | **多 mask z-order** (§3.7b) | `LEditMode + NCovering` 同时 时 → frame.children 顺序 `main(仅 C) → 状态栏 → 分割线 → 遮罩-编辑 → L 栏 → 遮罩-N覆盖 → Sidebar → 杆子` 完全一致（**状态栏 + 分割线 在两遮罩之下**，按列归属 dim）|
| 22b | **NLC 覆盖 z-order** (§3.7) | `NCovering === true && LEditMode === false` 时 → frame.children 顺序 `main → 状态栏 → 分割线 → 遮罩-N覆盖 → Sidebar → 杆子`（状态栏 + 分割线 在 遮罩-N覆盖 之下，整 frame status bar / 分割线 dim）|
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
| 6 | 把别处整页结果直接 clone (无例外) | §1.1 |
| 7 | 把"不要整页复用"扩大成"组件级标准实例也不查" | §1.3 |
| 8 | `app-variant-map` / reference 给出明确实例时跳过优先命中 | §1.3 |
| 9 | 标准组件 detach (无例外); 阻塞时经 §3.14 标 `blocked` | §3.2 / §1.2 |
| 10 | 实例失败时自动 clone fallback (降级路径已废止) | §4.1 / §1.2 |
| 11 | 跨画布搬运源稿不存在的业务内容 | §2.2 |
| 12 | 适配结果落到远离源稿位置 | §5.1 |

### §7.3 实例 / 落位级

| # | 禁止 | 详见 |
|---|------|------|
| 13 | StatusBar 沿用手机 variant 适配 Fold / Pad | §3.5 |
| 14 | 仅 `inst.resize()` 设 Sidebar 高度，缺 sizing FIXED 序列 | §3.6 |
| 15 | 省略 Pad 竖 NLC 覆盖模式的 `遮罩-N覆盖` 矩形 | §3.7 |
| 15b | 把 `状态栏` 提升到 `遮罩-N覆盖` / `遮罩-编辑` 之上 | §3.7 / §3.7a / §3.7b |
| 16 | NLC 模式 N\|L 边界添加分割线 | §3.8 |
| 18 | Pad 横 NLC 时 N 栏 / 主内容区 `clipsContent = true` | §3.9 |

### §7.4 验证级

| # | 禁止 | 详见 |
|---|------|------|
| 19 | 4 个目标 frame 写完之后再统一验证（必须每 frame 即时截图）| §6.3 |
| 20 | `verifyChecklist` 错误项 > 0 时汇报"适配完成" | §6.2 |
| 21 | fills 直接 RGB SOLID（不经 token lookup）| §0 #12 |
| 22 | 数据不确定时猜测填补 | §0 #13 |
| 23 | `scenarioFlags.LEditMode === true` 时省略 `遮罩-编辑` 矩形或不 promote L 栏 | §3.7a / §6.2 #21 |
| 24 | `LEditMode + NCovering` 同时为 true 时 z-order 错放（如把两遮罩并列于同一 z 层 / L 栏置于 N 覆盖遮罩之上）| §3.7b / §6.2 #22 |
| 25 | `scenarioFlags` JSON 缺失下汇报"适配完成"（Phase 4 step 7 未执行）| §6.2 #23 / SKILL Phase 4 step 7 |
| 26 | 实例失败时绕道 「fallback / clone」 后汇报"适配完成"（未通过 §3.14 实证）| §3.14 / §4.1 |
| 27 | scenarioFlags 信号未在 `app-variant-map-{app}.md §0.1b 导出信号表` 列出时凭直觉填 flag 值 | §0 #13 / app-variant-map-template §0.X |
| 28 | 1회성 special case 를 §0.1 #N / §3.X 룰로 추가 (self-check 「다른 app 에서도 反復?」 통과 못 했는데) | §0 #28 / §3.15 |
| 29 | runtime 函수로 解決 가능한 fix recipe 를 룰 文 본문에 매번 read 강제로 포함 | §3.15 #2 |
