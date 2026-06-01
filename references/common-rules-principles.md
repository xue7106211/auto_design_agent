# 通用规则 — 原则与边界

> Phase 0~2 + 全 phase 메타 룰. SKILL.md / app-variant-map-{app}.md / protocol.md 가 매번 참조.
> 본 파일 = §0 (28원칙) + §1~§2 (검색/내용 边界) + §3.11/§3.13/§3.14/§3.15 (메타 룰).
> 기타: instance → `common-rules-instance.md` / mask-zorder → `common-rules-mask-zorder.md` / verify → `common-rules-verify.md` / prohibit → `common-rules-prohibit.md`.

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
18. **A 类标准组件 padding 风满（核心规则）**：所有自带 internal padding 的标准组件（StatusBar / NavBar / TopBar / SearchBar / Chip / List / Detail / ToolBar / BottomBar / Sidebar / TextInput / Fab 等）一律 `x = 0, width = 栏W` 风满。**禁止任何 outer 合算**，禁止把 device-dim 断点表 spec 应用到 A 类组件。视觉 padding 由组件 internal 提供（默认 12dp）。详见 `common-rules-instance.md §3.4a.1` A/B 二分。
19. **应用专用 N 收起 L 栏 width 规则**：笔记 / 待办 NL framework 收起态下 N 栏自身消失（不是 device-dim 通用 N=88 + L 缩窄），**L 栏 width = frameW**（吸收 N 宽度）。其它应用按各自 `app-variant-map-{app}.md` 声明，未声明则沿用 device-dim 通用规则。落位 L 栏 frame 时必须先查 app-variant-map 是否有覆盖。
20. **inner componentProperties 必须与源稿同步**：源稿 instance 的内部 INSTANCE 子节点 `componentProperties`（如 ToolBar 按钮 `状态=禁用` / `数量=4个`、List item 编辑态、SearchBar 激活态等）反映源稿业务态。适配 frame 必须递归继承，**禁止** 仅 swap 顶层 variant 而 inner state 停留在 main default。Phase 1 dump `sourceInnerStateMap` → Phase 5 `placeStandardComponent({ sourceInst, inheritInnerState=true })` 自动继承 → Phase 6 verifyChecklist ⑯ 通过 `spec.componentChecks[i].sourceInstId` 自动比对差异。详见 `component-placement-protocol.md §2 内部状态继承` + `common-rules-verify.md §6.2 #25`。
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

标准组件**必须以标准实例使用**. 「实例不存在 / 无法访问 / 字体限制」等任何理由必须经 §3.14「妥协声明前实证强制」流程, 在 `componentTaskList` 记录为 `blocked` 项 + 向用户报告. **禁止任何绕过 / detach / 自建 frame 替代**. 详见 `common-rules-instance.md §3.2` + §3.14.

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
3. 针对该错误的二次修复尝试（如 fresh import `common-rules-instance.md §3.10`）

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

**核心 self-check (1 行)**: **「이 pattern 이 다른 app 에도 反復될 가능성 있나?」** — No → 룰 文 不要, 「데이터」만 기록 (CSV cell + footnote).

**4점 review (MUST 自答, NEVER 1점이라도 fail 시 추가)**:

1. **다른 app 에서 (다른 子場景 / device) 反復 발생 증거가 있나?** No → CSV direct (mapping → `结构变化表-{App}.csv` cell, 1회성 spec 偏差 → CSV cell, 1회성 variant 选择 → CSV + 1줄 footnote).
2. **runtime 함수 본체로 解決 가능한가?** Yes → `runtime/placement.ts` / `verify.ts` 추가, 룰 文 不要 (또는 1줄 pointer 만).
3. **既存 §0.X / §3.X 룰의 sub-case 인가?** Yes → 既存 룰 본문 修正, 새 §N 추가 不要 (drift 위험).
4. **룰 文 본문 ≤ 5 줄 압축 가능한가?** No → over-engineering. CSV / runtime 으로 二分.

**Yes 통과 시 위치 결정 트리**:

| 룰 性质 | 위치 |
|---|---|
| 단 1 app 内 multi-device cascade (예: `Sidebar_Notes attached form`) | `app-variant-map-{app}.md §0.1 #N` |
| multi-app 共有 cascade / fix recipe (예: A 类 风满, instance reflow 6 step) | `common-rules-instance.md` 或 `common-rules-mask-zorder.md` |
| runtime 实행 가능 algorithm (예: inner state walk, capsule 后처리) | `runtime/placement.ts` / `verify.ts` 함수 본체 |
| token / set key / library key 列表 | `app-variant-map-{app}.md §0.4` 表 |

**判別 例**: 笔记 LC L NavBar device 별 `_04/_07/_08` → **CSV direct** (기계적 device × variant). 笔记 Sidebar_Notes attached form (Fold 全 device 풀히트 + inner FILL only children[0]) → **§0.1 #10 룰** (4 device cascade + boundary 必要). 私密笔记 Pad 도 LC → **CSV cell** (1회성 偏离). `instance.children[0].layoutSizingV='FILL'` cascade auto-apply → **`placement.ts` step 7c** (runtime 行为).

**既存 룰 retrospective**: 새 task 完了 후, 추가한 룰이 4점 통과 여부 재검. 통과 못 하면 CSV / runtime 으로 移籍 + 룰 文 削除 (또는 pointer 만).

---

> **연관 파일**: instance → `common-rules-instance.md` / mask-zorder → `common-rules-mask-zorder.md` / verify → `common-rules-verify.md` / prohibit → `common-rules-prohibit.md`.
