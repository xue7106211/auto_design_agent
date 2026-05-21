---
name: app-variant-map
description: 笔记应用的语义组件在不同设备与屏幕模式下的目标变体映射表
app: 笔记
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

# 笔记 App Variant Map

## 查询契约

- 输入：`appName + device + screenMode + resolvedUiElement`
- 输出：`resultType + variantId`
- 若未命中：返回 `undefined`，调用方必须中止，不允许猜测

---

## §0. 应用规则要点（必读，先于映射表）

> 本节是 笔记 / 待办 适配的**强制规则**，落位前必须全部内化。映射表只回答「用哪个 variant」，本节回答「怎么放」。Phase 6 通用 `verifyChecklist` 之外另需验证本节项目。

### §0.1 落位关键规则（速查）

| # | 规则 | 详细 |
|---|------|------|
| 1 | **C 栏 TextInput bottom flush** | `y = mainH − TI.h`，**bottom 贴 frame 底**，与杆子 16dp 重叠（笔记 NoteEditPanel 源稿 convention） |
| 2 | **Detail / DetailTask 位置与高度（Fold + Pad C 栏共通）** | **`y = 62, height = mainH − 62`**。即使 C 栏 NavigationBar = `_00`（不渲染），Detail 仍从 y=62 起始（保留 NavBar 预留区域 6+56=62dp）。笔记 NLC 有 TI 时 Detail 延伸到 TI 下方（TI 通过 z-order + fade overlay）；待办无 TI 时 Detail 直接延伸到 mainH 底部。**禁止** NavBar 不渲染时将 Detail 上提到 `y=0`（破坏统一栏内起始线） |
| 3 | **C 栏 z-order** | `NavBar → Detail → TextInput`（TI 在上层 fade overlay 在 Detail 之上）；杆子在 frame 直接子级 |
| 4 | **L 栏 顺序** | `NavBar(56) → SearchBar(56) → SelectableChip(52) → List → BottomBar(100, 底)`；**与源稿 Chip↔Search 顺序差异时以 spec 为准** |
| 5 | **杆子（home indicator）** | `x=0, width=frameW` 风满；`fills=[]` 透明；frame 直接子级**最顶 z-order**（Sidebar 之上） |
| 6 | **覆盖模式 遮罩 z-order**（2026-05-18 修订）| Pad 竖 NLC 覆盖：z-order = `main → 状态栏 → 遮罩-N覆盖 → 分割线 → Sidebar → 杆子`。**遮罩-N覆盖 必须在状态栏之上**（按列归属：N 列以外含状态栏全部 dim）。Sidebar 在遮罩之上（trigger 列豁免）。**旧版「保证可读」rationale 已弃用**。L 编辑遮罩同理：`遮罩-编辑` 在 `状态栏` 之上 |
| 7 | **栏背景色 token（card-presence rule）** | 容器有卡片 / Sidebar 菜单 / 套卡 list 时 fill = `背景色/surface_low`（灰底）；单一全幅 panel / 不带卡片 flat list = `背景色/surface`（白底）。**笔记**：L栏(卡片) + N栏 + frame = `surface_low`；C栏 Detail = `surface`。**待办**：L栏(不带卡片) + C栏 + frame = `surface`；N栏 = `surface_low`。详见 §0.3 + 末尾「栏背景色」表 |
| 8 | **NL framework L 栏 顶部通则** | 笔记 / 待办 **宫格 NL framework**：N 收起时 N 栏自身消失 + **L 栏 width = frameW**（满幅吸收）。**⚠️ 禁止** device-dim 通用 NL 收起 split（`N=88 + L=1334/861`）。<br>**NL framework L 栏 NavBar 一律 `_00`（不渲染，默认 + 编辑均同）** — 顶部统一使用 `TopBar_X` 单独放置；TopBar 自身为 NavBar + SearchBar 合成变体（NavigationBar set 内「顶部导航」family）。<br>**NL framework N 栏 NavBar 也一律 `_00`（不渲染，默认 + 编辑、展开 + 收起 均同）** — Sidebar (`Sidebar_Component_PAD_NLC_01`) 内部 `NavigationAtoms`（56dp）已承担 N 栏标题栏角色，**禁止** 在 N 栏外部额外放置 `NavigationBar_ComponentSet_12 / _18` 等（旧版「N 栏：NavBar_12」表述已废弃）：<br>&nbsp;&nbsp;• **默认 展开** → `TopBar_03`（内含 NavBar_07 + SearchBar_02）<br>&nbsp;&nbsp;• **默认 收起** → `TopBar_07`（内含 NavBar_17 + SearchBar_02，**自带 N 恢复 icon**）<br>&nbsp;&nbsp;• **编辑 展开** → `TopBar_09`（内含 NavBar_18 + SearchBar_02）<br>&nbsp;&nbsp;• **编辑 收起** → `TopBar_08`（内含 NavBar_18 + SearchBar_02，**自带 N 恢复 icon**）<br>NL framework 中 L NavBar 不允许单独放置，TopBar_X 已吸收 NavBar 角色。NLC framework（笔记 / 待办之外的应用）才使用 88dp `Sidebar_Component_PAD_NLC_00`。详见「N 收起 规则」节 + common-rules §0 #19 |
| 9 | **Fold 内 NL→C 单栏 fallback 通则** | Fold 内屏 framework 仅含 `NC / LC / C`，**无 NL**。NL 语义（`N+L`，无 C）在 Fold 内屏渲染时 fallback 为 **C 单栏 + L 内容上提**：list / 顶部模块直接占据 C 栏。CSV 表中 NL 行 `Fold内竖-C` / `Fold内横-C` 列即该 fallback 形态使用的具体 variant，**device-specific**。本规则仅适用 Fold 内屏；Pad 上 NL 是真实 framework 不 fallback。**List 默认 / NL** device-specific 变体（奇数序列）：`手机竖=_05` / `Fold外竖=_07` / `Fold内竖 C 单栏=_09` / `Fold内横 C 单栏=_11` / `Pad竖NL=_13` / `Pad竖NL收起=_15` / `Pad横NL=_17` / `Pad横NL收起=_19`。**编辑 NL** device-specific 变体（偶数序列）：`手机竖=_06` / `Fold外竖=_08` / `Fold内竖=_10` / `Fold内横=_12` / `Pad竖NL=_14` / `Pad竖NL收起=_16` / `Pad横NL=_18` / `Pad横NL收起=_20`。 |

### §0.1a 各设备默认 layoutType（强制 lookup，禁止跨设备共用）

> **本表是 Phase 2 `targetVariantPlan` 的 layoutType 决定权威**。每个适配 frame 的 layoutType 必须按本表 device 列查询，**不得**因「源稿塌缩为单一画面」而把所有 frame 统一为同一 layoutType。

| device | default layoutType | 子模式 / 说明 |
|---|---|---|
| 手机 / Fold 外屏 | C（单一画面）| — |
| Fold 内屏 横屏 | **LC** | 0.4:0.6（笔记常规）；0.5:0.5 仅电话 |
| Fold 内屏 竖屏 | **LC** | — |
| Pad 横屏 | **NLC（并列）** | N 272 + L 428 + C 722；NLC 横屏无覆盖形态 |
| Pad 竖屏 | **NLC（覆盖）** | N 272 覆盖 L 428 + C 521；含 `遮罩-N覆盖` |

**例外（必须 user 显式指定才允许偏离）**：

| 偏离场景 | 触发条件 |
|---|---|
| Pad 用 LC（无 N 栏） | 仅秘密笔记 / 用户明确「Pad 不要 N 栏」|
| Pad 用 NL / NC | 用户明确「无 C 栏 / 无 L 栏」 |
| Fold 内用 NC / C | 用户明确指定 |

**Phase 2 强制流程**：

1. step A：钻取塌缩（drilldown collapse）→ 决定 frame 数（device × 方向）
2. step B：每个 frame 查本表 → 决定该 frame 的 layoutType（**device 别**，不共用）
3. step C：AskUserQuestion 时 **device 别**列示 layoutType（如 `Fold→LC, Pad→NLC`），禁止「全部 LC」「全部 NLC」单选项作为默认

**Phase 6 校验**：`frame.name` 中的 layoutType ↔ 本表 device default 一致。偏离 → user 明示记录在「妥协项」中。

### §0.1b scenarioFlags 导出信号表（笔记 / 待办）

> **作用**：SKILL Phase 4 step 7 输出 `scenarioFlags` JSON 时，唯一权威 lookup source。**禁止从直觉推测 flag 值**，必须按本表信号匹配。

| flag | 激活信号（任一 ✅ 即激活）| 关联触发 |
|------|--------------------------|---------|
| `LEditMode` | source frame 名含 `已选` / `选择` / `编辑模式` • L 栏 `List_Notes` variant ∈ `{_02, _04, _06}`（编辑系列）• L 栏出现 `ToolBar_ComponentSet_01` / `_02`（编辑工具栏）• L 栏 NavigationBar variant ∈ `{_03, _06, _09, _18}`（编辑系列） | **`§3.7a` `遮罩-编辑`（C 列）** |
| `NEditMode` | Sidebar variant = `Sidebar_Component_PAD_NLC_03`（编辑态）• N 栏 NavigationBar variant ∈ `{_13}`（编辑） | **`§3.7a` 整 frame 遮罩，Sidebar 除外** |
| `CEditMode` | C 栏 NoteEditPanel 变体 ∈ `{_01, _02, _03}` 出现 • C 栏 NavigationBar variant ∈ `{_03, _06, _09}` | **`§3.7a` 末 → 无 mask** |
| `NCovering` | layoutType = `NLC覆盖`（per §0.1a 由 device 决定：Pad 竖 NLC default = 覆盖） | **`§3.7` `遮罩-N覆盖`（全 frame）** |

**填写规则**：

1. **每 flag 独立判定**，互不互斥；多 flag 同时 `true` 时按 `§3.7b` 多 mask z-order 处理
2. **信号 缺失 → flag 默认 `false`**，不可推测
3. 笔记 / 待办 共用本表（同 app 子场景）；其他应用各自独立信号集
4. **新增 flag**（如 search active）→ 本表 + `common-rules §3.7*` 同步增行

#### NL framework + LEditMode 处理

笔记 / 待办 NL framework（宫格编辑场景，含 Fold 内 NL→C 单栏 fallback、Pad NL 展开、Pad NL 收起 全形态）在 `LEditMode = true` 时 **一律 mask 不渲染**。L 栏不 promote，z-order 沿用一般 NL 通则。

详见 `common-rules §3.7a-NL`。

### §0.2 padding 应用规则（A 类一律风满）

> **核心原则**：自带 internal padding 的标准组件（A 类）一律 `x=0, width=栏W` 风满。视觉 padding 由组件 internal 提供（默认 12dp）。详见 common-rules §3.4a.1。

#### 笔记 / 待办 标准组件落位规则（覆盖所有 frame / 栏 / framework）

| 组件类别 | 处理 |
|---------|------|
| **A 类（全部自带 internal padding 的标准组件）**：`StatusBar_*` / `NavigationBar*`（含 `_Notes`）/ `TopBar_*` / `SearchBar_ComponentSet` / `SelectableChip_ComponentSet_Notes` / `List_Notes` / `Detail_Notes` / `BottomBar_*`（含 `_Showcase_*` / `_NoteEditPanel_*` / `_Notes_Outline_*`）/ `ToolBar_*` / `Sidebar_Component_*` / `TextInput_ComponentSet_Notes` / `Fab_*` | **instance 外壳 `x = 0, width = 栏W` 永远风满**。栏内视觉 padding = 组件 internal（默认 12dp，Detail_Notes 例外为 20dp 描述视觉左偏移，**不参与合算**）。<br>⚠️ **本规则仅约束 instance 外壳；instance 内部子节点（inner 胶囊 / TopBar root child / Sidebar BoardMaterialSection 等）的 sizing 由 `device-dimensions.md` 各组件专章规定，不可递归套用「外壳风满」**。具体：<br>&nbsp;&nbsp;• **ToolBar / BottomBar_Showcase 系 inner 胶囊** (`工具个数举例` / `TabMaterial-Showcase`)：依 `device-dimensions.md`「工具栏规格 / 胶囊尺寸」line 657~663 — 栏 W ≤ 440 → 风满（栏W − 48），栏 W > 440 → **定宽 344dp 居中**（parent `Overlay-Showcase.primaryAxisAlignItems = 'CENTER'`，capsule `sizH=FIXED, resize(344, h)`）。verifyChecklist ⑭ 自动检查<br>&nbsp;&nbsp;• **TopBar_03/_07 root child** (`Pad-TopBar_01`)：`inst.children[0].layoutSizingHorizontal = 'FILL'`（参 §0.5 末行）<br>&nbsp;&nbsp;• **Sidebar_Component 内部 BoardMaterialSection / NavigationSizeSection / 内容区域**：3 级递归 FILL override（参 §0.5）|
| **B 类**：裸 frame / 自定义业务容器 | 按 `device-dimensions.md` 断点表合算（详见 common-rules §3.4a.3） |

#### 笔记 NL framework 各 frame L 栏 width（**收起态特殊覆盖 device-dim 通用规则**）

| frame | L 栏 width | 备注 |
|-------|-----------|------|
| Fold 内 横 NL→C fallback | **888**（= frameW，单栏 fallback） | NL 语义在 Fold 内屏 fallback 为 C 单栏 |
| Fold 内 竖 NL→C fallback | **628**（= frameW，单栏 fallback） | 同上 |
| Pad 横 NL 展开 | **1150**（= frameW − 272，N 可见） | N + L 并列 |
| Pad 横 NL 收起 | **1422**（= frameW，N 自体 消失）| 笔记 / 待办 special；**禁止** device-dim 通用 `N=88 + L=1334` |
| Pad 竖 NL 展开 | **677**（= frameW − 272，N 可见） | N + L 并列 |
| Pad 竖 NL 收起 | **949**（= frameW，N 自体 消失）| 同上，**禁止** `N=88 + L=861` |

#### 笔记 NLC framework 各 frame 栏 width（保持原 device-dim spec 不变，仅落位规则改为风满）

| frame | N 栏 | L 栏 | C 栏 |
|-------|------|------|------|
| Fold 内 横 LC | — | 353 | 535 |
| Fold 内 竖 LC | — | 282 | 346 |
| Pad 横 NLC 展开（并列）| 272 | 428 | 722 |
| Pad 横 NLC 收起 | — | 428 | 994（N 88 收起占位） |
| Pad 竖 NLC 展开（覆盖）| 272 覆盖 | 428 | 521 |
| Pad 竖 NLC 收起 | — | 428 | 521 |

> **示范对照**（旧 vs 新）：
> - 旧：Pad 横 NLC L=428 spec=20 → SearchBar `outer=8 / x=8 / w=412`
> - 新：Pad 横 NLC L=428 → SearchBar `x=0 / w=428` 风满（视觉 padding = internal 12dp）
> - 旧：Pad 横 NL 收起 L=1334 → List `outer=173 / w=988` 居中
> - 新：Pad 横 NL 收起 **L=1422** → List `x=0 / w=1422` 风满

### §0.3 必用 token 引用

| 用途 | Token 名 | Library Key |
|------|---------|------------|
| **有卡片 / 套卡 / Sidebar 菜单 等 floating 内容的容器 fill**（灰底，卡片浮起对比） | `背景色/surface_low` | `e74b063d74a3444a44a4e00bb7417c2dbea305ba` |
| **单一 panel / 全幅 Detail 等无卡片容器 fill**（白底） | `背景色/surface` | `5804f51e302d6fda00b3a8ce9d509d9b8ee09225` |
| 卡片 / 内容容器 fill（浮于 surface_low 之上，自身白底） | `背景色/surface` | 同上（组件自带 binding，无需手动）|
| 栏间分割线 fill | `分割线色/outline` | `96f2cf4d1ce0d56cff2f8e98da6a5e16bd59983e` |
| Pad 竖 NLC 覆盖 遮罩 fill（opacity 0.2）| `遮罩色/mask` | `0ed62540049dd3839b40b63d40f82492c4bac664` |

> **背景 token 选择规则（核心 + 普遍）**：
> - **判定标准 = 该容器内的列表组件是否带卡片，不是 app 名 / framework / 设备**：
>   - 容器上有卡片 / 套卡 list / Sidebar 菜单 / 浮起 floating 内容 → 容器 fill = **`背景色/surface_low`**（灰底，让卡片浮起）
>   - 容器是单一全幅 panel / **不带卡片的 flat list**（如 `List_Task_03`）→ 容器 fill = **`背景色/surface`**（白底）
>   - 卡片自身永远 `背景色/surface`（白），由组件自带 binding 提供
>   - ⚠️ **同一 app 内不同子场景 / 不同设备可能不同**：笔记 `List_Notes` = 全设备带卡片 → `surface_low`；待办 `List_Task_01`（手机/Fold外）= 套卡 → `surface_low`；待办 `List_Task_03`（Fold内/Pad）= flat list 无卡片 → `surface`。**禁止按 app 名或 framework 统一判定，必须按实际 variant 的卡片样式决定**。
> - **笔记 / 待办 各栏归属（具体应用）**：
>   - **L 栏 笔记**（List_Notes 卡片 stacked，全 framework：NL / NLC / LC）→ `surface_low`
>   - **L 栏 待办 手机 / Fold 外屏**（`List_Task_01` 套卡样式）→ `surface_low`
>   - **L 栏 待办 Fold 内屏 / Pad**（`List_Task_03` flat list 无卡片）→ `surface`
>   - **N 栏**（外壳 272dp，内部 Sidebar 单一卡片 260dp 浮起）→ `surface_low`
>   - **C 栏 笔记 Detail**（单一全幅 note 内容 panel）→ `surface`
>   - **C 栏 NL→C fallback 笔记**（list 上提到 C 栏 单一画面，仍是 list 卡片）→ `surface_low`
>   - **C 栏 NL→C fallback 待办**（`List_Task_01` 套卡上提，Fold 内屏 C 单栏）→ `surface_low`
>   - **frame 笔记**（外框层）→ `surface_low`（保持卡片浮起视觉一致）
>   - **frame 待办 手机 / Fold 外屏**（List_Task_01 套卡）→ `surface_low`
>   - **frame 待办 Fold 内屏 / Pad**（List_Task_03 无卡片）→ `surface`
> - **强制规则**：每个 frame 的 `bindFill` 调用前，必须重新 trace 该 device 的 List variant → card-presence → token 决定链，禁止跨 device 复用上一 frame 的 token 选择。

### §0.4 关键组件 set keys（重要）

| set | key | 备注 |
|-----|-----|------|
| `StatusBar_ComponentSet`（Hyper OS4 UI Kit AI 测试版） | set: **`1047f2112a230a27d3888d27b34a5857815216e3`** | 含 `_01/_02/_03` 三 variant。**2026-05-21 fresh import 确认可用**。旧 key `003ec04e...` / `dadf3838...` / `57a5ea78...` 均已 stale |
| `StatusBar_01`（手机+Fold） | **通过 set import 后 `children.find(/01/)`** | 自然 392×46。resize 至 888×46（Fold横）/ 628×46（Fold竖）|
| `StatusBar_03`（Pad） | **通过 set import 后 `children.find(/03/)`** | 自然 1422×38。resize 至 frameW×**34**（强制 H=34）|
| `NavigationBar` | `a89cd38d06061fcbb5ff7e596b92f8f3cf3888de` | 含 `_00`~`_18` 系列。**`_Notes_*` 已分离到下方独立 set** |
| `NavigationBar_ComponentSet_Notes` | `ac60af7e28e6491b3520ecaefd71fa7e03832c31` | 业务组件库；含 `_Notes_01`/`_Notes_02` |
| `SearchBar_ComponentSet` | `2316a63eb824ab38f388c3127101e535b7668398` | LC 默认风满用 `_05`（不是 `_02`）|
| `SelectableChip_ComponentSet_Notes` | `af1e1df353e8fb1fe8005b82fed310422f2eae4c` | |
| `List_Notes` | `94f9b4085ba12b43511a95282fa84225241f6f9e` | |
| `待办列表`（List_Task，业务组件库） | **`1107d1e9566fff3d96635c2485ed1d96607903b6`** | 源稿实际使用 set。含 `_01/_02/_03/_04`。**禁止**使用 `List_Task` set (`629a1367...`)（同名异 set，视觉不同）|
| `Detail_Notes` | `961f0e237edea438d52e6d2ad9b4e38c99bd2c68` | |
| `BottomBar_Showcase_Notes` | `303649c8435835bcbfb5e85e668a0b6562497cad` | |
| `TextInput_ComponentSet_Notes` | `0dc20401cde070d654725146db336032d2f886a2` | **Fold 内 LC C 栏 默认 = `_08`**（非 `_01`）|
| `BottomBar`（含 `Sidebar_Component_PAD_NLC_*`）| `414cabc8e633c33cc6441ff0f936f971dc9babd3` | Sidebar 在此 set 内；2026-05-15 卡片 y=0 h=788 |
| `Fab-Showcase`（OS4 UI Kit，独立 Fab 按钮） | set: **`67603f39593a06d446c43bd7767882c4b26e2f57`** | 56×56 standalone 按钮。`功能=新建`（待办 "+" 按钮）/ `功能=拨号` / `功能=搜索` 等。**⚠️ 与 BottomBar set 内 `Fab_01`（392×100 容器）完全不同 — 映射表 `Fab_01；彩色` 指的是本 set，不是 BottomBar 容器** |
| `杆子`（SwipeIndicator_ComponentSet，OS4 UI Kit） | set: **`8356fb53480febeb853a6c391bcd2dc8f13198f2`** | `_05`=Fold内竖(628) / `_06`=Fold内横(888) / `_07`=Pad竖(949) / `_08`=Pad横(1422)。**旧 key `eaa1eedc...` = HyperOS v0.8，禁止使用** |

### §0.5 历史踩坑（笔记 / 待办 应用专用）

> 通用 instance reflow 陷阱见 `common-rules.md §3.6`。本表只列 **笔记 / 待办 变体选择 / 特殊位置** 的应用专属失误。

| 类别 | 失误 | 正确做法 |
|------|------|---------|
| 库选择 | StatusBar 适配时使用 HyperOS v0.8 set（`15e94d49...`）（PM7） | **权威 = Xiaomi Hyper OS4 UI Kit** 的 3 个独立 COMPONENT（`StatusBar_01/_02/_03` 各自独立 key）。file `FBvQ3xM5C62MgIcA1JHWIs` node `127160:4132`。禁止依据 v0.8 ↔ Hyper OS4 名字相似性自行推测（PM8 修订） |
| 变体选择 | L 栏 NavBar 用 `_05`（带返回箭头）| 笔记 LC 列表页 default = `_04`（无返回）|
| 变体选择 | L 栏 SearchBar 用 `_02`（自然 176×44 是 Pad 顶部导航内嵌）| LC 风满 = `_05`（392×56）|
| 变体选择 | C 栏 TextInput 用 `_01` | Fold 内 LC C 栏 = `_08`（CSV2 2026-05-15 新增，Q18 内屏 padding 20）|
| 位置 | Pad 竖 NLC 覆盖 杆子 `x=272`（避 Sidebar）| 杆子风满 `x=0, w=frameW`；z-order 而非位置避让 |
| 位置 | C 栏 TextInput `y=mainH-108`（避 杆子）| `y=mainH-92`（bottom flush，与杆子 16dp 重叠）|
| 位置 | Detail 高度 `mainH-154`（避 TI）| `mainH-62`（延伸到 TI 下方，TI 通过 z-order + fade overlay）|
| 顺序 | L 栏 Chip→Search（源稿顺序）| spec 通例 NavBar→Search→Chip→List |
| Token | frame fill 直接 RGB 灰色 / 白色 | `bindFill('背景色/surface', ...)` 绑定 |
| Token | 分割线 fill RGB | `bindFill('分割线色/outline', ...)` |
| Token | 遮罩 fill RGB | `bindFill('遮罩色/mask', ..., 0.2)` |
| 变体内部 sizing | Sidebar mainH resize 后 inner `BoardMaterialSection` 仍 800/812（HUG）→ 卡片不延伸；Pad 竖 NLC 覆盖时 L 栏 list/ToolBar 从卡片下方 leak；Pad 横 NLC N 栏下方留白 | swap + resize 后 **3 级递归 FILL override 必需**（仅 1 级则 NavigationSizeSection 仍 HUG=800 固定，导致下方留白；实测 Pad 竖 NL 展开 = 576dp 留白）：<br>① `inst.children[0].layoutSizingVertical = 'FILL'`（BoardMaterialSection）<br>② `inst.children[0].children[0].layoutSizingVertical = 'FILL'`（NavigationSizeSection，default HUG=800 固定）<br>③ `inst.children[0].children[0].children.find(c=>c.name==='内容区域').layoutSizingVertical = 'FILL'`<br>校验：`inst.children[0].height === inst.height − 12 (pb)` 且 `navSize.height === BoardMaterialSection.height`（旧组件 default = FILL；2026-05-18 起 default = HUG，必须显式 override）|
| 变体内部 sizing | TopBar_03 / TopBar_07（笔记 宫格 NL Pad 4 frame 顶部 search 变体）`instance.resize(targetW)` 后 root child `Pad-TopBar_01` 仍保持自然 width 1422 + `layoutSizingHorizontal='FIXED'` → 右侧裁切（搜索框 / 编辑 / 菜单 icon 不显示）。实测：Pad 横 NL 展开=272dp 裁切，Pad 竖 NL 展开=745dp 裁切（过半），Pad 竖 NL 收起=473dp 裁切 | common-rules §3.6 强制 6 步序列外，需追加 **`inst.children[0].layoutSizingHorizontal = 'FILL'`** override。校验：`inst.children[0].width === inst.width` |

---

## 枚举定义

### `device`

| 值 | 含义 |
| --- | --- |
| `Phone` | 手机 |
| `Fold外屏` | 折叠屏外屏 |
| `Fold内屏` | 折叠屏内屏 |
| `Pad竖屏` | 平板竖屏 |
| `Pad横屏` | 平板横屏 |

### `screenMode`

| 值 | 含义 |
| --- | --- |
| `L` | List，列表画面 |
| `C` | Content，内容画面 |
| `NC` | Navigation + Content 复合画面 |
| `LC` | List + Content 复合画面 |
| `NL` | Navigation + List 复合画面（无 C） |
| `NLC` | Navigation + List + Content 三栏 |

### `resultType`

| 值 | 含义 |
| --- | --- |
| `variant` | 命中真实 `variantId` |
| `hidden` | 元素保留语义但当前场景不显示 |
| `absent` | 该场景下无此元素 |
| `undefined` | 尚未建档，调用方必须中止 |

## 子场景约定

| 子场景 | 说明 |
| --- | --- |
| 笔记 | 笔记列表浏览与管理 |
| 待办 | 待办事项浏览与管理 |

## N 收起 规则（笔记 / 待办 专用）

Pad NLC / NL / NC 框架在 **N 收起态** 下不使用 `Sidebar_Component_PAD_NLC_02`（88dp 侧边栏收起形态）。改为：

- N 栏直接消失
  - Pad 横屏：L / C 吸收 N 宽度（收起尺寸等同 LC 模式）
  - Pad 竖屏：N 本来以覆盖形式叠加于 LC 上，收起后 LC 回归原尺寸
- N 恢复图标 위치 (framework 별 분기):
  - **NLC framework / 默认**: L 栏 NavigationBar 최左 = `NavigationBar_ComponentSet_17`
  - **NLC framework / 编辑**: L 栏 NavigationBar 최左 = `NavigationBar_ComponentSet_18`
  - **NL framework（宫格默认）**：L 栏 NavBar 不渲染（`_00`），**N 栏 NavBar 也不渲染（`_00`）** —— Sidebar 内部 `NavigationAtoms`（56dp）已承担标题栏角色，外部无需再放 NavBar_12。N 恢复 icon = **`TopBar_07`**（search 变体自带）。无需另放 NavBar_17。
  - **NL framework（编辑）**：L 栏 NavBar 不渲染（`_00`），**N 栏 NavBar 也不渲染（`_00`）** —— 同默认 NL，由 Sidebar 内部 NavigationAtoms 承担。L 栏 顶部由 `TopBar_09`（展开）/ `TopBar_08`（收起）承担 NavBar 合成（含编辑变体 NavBar_18 与 N 恢复 icon）。**禁止** 在 N 栏额外放置 `NavigationBar_ComponentSet_18`（旧版表述已废弃）。
- 侧边栏组件本体：
  - 展开态: `Sidebar_Component_PAD_NLC_01`
  - 收起态: N 栏 자체 消失 (笔记 NL 宫格 specifically). 笔记 NLC framework 에서는 `Sidebar_Component_PAD_NLC_00` (空 容器 변체).

本规则仅适用于笔记应用（`笔记` + `待办` 子场景）。电话、联系人、文件管理等其他应用仍沿用 `Sidebar_Component_PAD_NLC_02` 的 88dp 收起形态。

## `_00` 变体解释（Pad 专用）

笔记 / 待办在 **Pad 全 screenMode**（NLC / NL / NC / LC 等）下，手机 / Fold 版本中出现的若干辅助控件在 Pad 上统一切换为对应的 **`_00` 变体**。`_00` 的统一含义为：

1. **栏内不渲染对应控件**（`_00` 为空内容占位；实际执行时直接从目标栏中移除，不保留空容器）
2. 对应的操作功能在 Pad 上被 **该栏 NavigationBar 的右侧图标承载**（`NavigationBar_ComponentSet_07 / _08 / _09` 等 Pad 标题栏变体自带右侧图标 slot），或通过别的交互入口实现
3. 释出的空间由同栏的主内容（`List_Notes` / `Detail_Notes` 等）扩展吸收
4. Fold 内屏（LC / NC）以及手机版本 **不适用** 本规则，继续使用 `_01`（可见形态）

适用组件清单：

| 源变体（手机 / Fold） | Pad 对应 `_00` 变体 | Pad 处理 |
|---|---|---|
| `BottomBar_Showcase_Notes_01` (L 栏 工具栏) | `BottomBar_Showcase_Notes_00` | L 栏不渲染；功能 → L 栏 NavigationBar 右侧图标 |
| `TextInput_ComponentSet_Notes_01` (C 栏 底部输入框) | `TextInput_ComponentSet_Notes_00` | **2026-05-18 起 `_00` 已落地**（CSV2 控件总表 + CSV1 控件变体清单）。Pad NLC C 栏直接使用 `_00` 变体。先前 `（／／／）` / "省略渲染" 描述废弃。|
| `SelectableChip_ComponentSet_Notes_01 / _02` (L 栏 标签栏) | `SelectableChip_ComponentSet_Notes_00` | L 栏不渲染；标签筛选 → L 栏 NavigationBar 右侧图标 / 文件夹切换 |

> **组件库缺口（2026-05-15 更新）**：
> - `Sidebar_Component_PAD_NLC_00` 已落地（CSV2 标 "15日 YES"）✅
> - **2026-05-18 落地**：`TextInput_ComponentSet_Notes_00` ✅、`BottomBar_NoteEditPanel_03` ✅
> - `BottomBar_Showcase_Notes_00` / `SelectableChip_ComponentSet_Notes_00` 仍未落地；Pad 执行按"省略渲染"
> - `TextInput_ComponentSet_Notes_08` (Fold 内屏 LC C 栏 NoteEditPanel 默认态, Q18 padding 左20/右20)

## 映射表

来源：结构变化表——总表（`笔记 Notes` + `待办 Tasks` 行块，2026-05-12 版）。

列结构（26 列）：手机竖 / 手机横 / Fold外竖 / Fold外横 / Fold内竖NC / Fold内竖LC / Fold内竖C / Fold内横NC / Fold内横LC / Fold内横C / Pad竖NLC / Pad竖NLC收起 / Pad竖NL / Pad竖NL收起 / Pad竖NC / Pad竖NC收起 / Pad竖LC / Pad竖C / Pad横NLC / Pad横NLC收起 / Pad横NL / Pad横NL收起 / Pad横NC / Pad横NC收起 / Pad横LC / Pad横C。

由于表格列数较多，映射表按组件 / 场景拆分为多个小表呈现，方便阅读与维护。空单元格表示该组合不适用或暂未建档。

### 笔记

#### 导航栏 Sidebar / BottomBar

| 场景 | 手机竖 | Fold外竖 | Fold内竖LC | Fold内横LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad竖NC | Pad竖NC收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad横NC | Pad横NC收起 |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | BottomBar_Showcase_00 | BottomBar_Showcase_00 | L栏：BottomBar_Showcase_00 | L栏：BottomBar_Showcase_00 | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_00 | — | — | — | — | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_00 | — | — | — | — |
| NL  | BottomBar_Showcase_00 | BottomBar_Showcase_00 | C栏：BottomBar_Showcase_00 | C栏：BottomBar_Showcase_00 | — | — | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_00 | — | — | — | — | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_00 | — | — |
| NC  | BottomBar_Showcase_00 | BottomBar_Showcase_00 | — | — | — | — | — | — | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_00 | — | — | — | — | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_00 |

#### 标题栏 NavigationBar — 默认

| 场景 | 手机竖 | Fold外竖 | Fold内竖/横 LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad竖NC | Pad竖NC收起 | Pad竖LC | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad横NC | Pad横NC收起 | Pad横LC |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | NavigationBar_ComponentSet_01 | NavigationBar_ComponentSet_04 | L栏：NavigationBar_ComponentSet_04；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_17；C栏：NavigationBar_ComponentSet_Notes_01 | — | — | — | — | — | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_17；C栏：NavigationBar_ComponentSet_Notes_01 | — | — | — | — | — |
| NL  | NavigationBar_ComponentSet_01 | NavigationBar_ComponentSet_04 | C栏：NavigationBar_ComponentSet_04 | — | — | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_00 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_00 | — | — | — | — | — | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_00 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_00 | — | — | — |
| NC  | NavigationBar_ComponentSet_11 | NavigationBar_ComponentSet_11 | — | — | — | — | — | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_11 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_Notes_03 | — | — | — | — | — | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_11 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_Notes_03 | — |
| LC  | NavigationBar_ComponentSet_02 | NavigationBar_ComponentSet_05 | N栏：NavigationBar_ComponentSet_05；C栏：NavigationBar_ComponentSet_Notes_01 | — | — | — | — | — | — | L栏：NavigationBar_ComponentSet_08；C栏：NavigationBar_ComponentSet_Notes_01 | — | — | — | — | — | — | L栏：NavigationBar_ComponentSet_08；C栏：NavigationBar_ComponentSet_Notes_01 |

#### 标题栏 NavigationBar — 详情 NoteDetail / NLC

| | 手机竖 | Fold外竖 | Fold内竖/横 LC | Pad竖NLC | Pad竖NLC收起 | Pad横NLC | Pad横NLC收起 |
|--|--|--|--|--|--|--|--|
| variant | NavigationBar_ComponentSet_11 | NavigationBar_ComponentSet_11 | L栏：NavigationBar_ComponentSet_04；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_17；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_17；C栏：NavigationBar_ComponentSet_Notes_01 |

#### 标题栏 NavigationBar — 编辑模式 Edit Mode

| 场景 | 手机竖 | Fold外竖 | Fold内竖/横 LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad竖LC | Pad横LC |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | NavigationBar_ComponentSet_03 | NavigationBar_ComponentSet_06 | L栏：NavigationBar_ComponentSet_06；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_09；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_18；C栏：NavigationBar_ComponentSet_Notes_01 | — | — | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_09；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_18；C栏：NavigationBar_ComponentSet_Notes_01 | — | — | — | — |
| NL  | NavigationBar_ComponentSet_03 | NavigationBar_ComponentSet_06 | C栏：NavigationBar_ComponentSet_06 | — | — | N栏：NavigationBar_ComponentSet_00；**L栏：NavigationBar_ComponentSet_00**（不渲染；TopBar_09 자체 NavBar 합성, §0 #8） | N栏：NavigationBar_ComponentSet_00；**L栏：NavigationBar_ComponentSet_00**（不渲染；TopBar_08 자체 NavBar 합성） | — | — | N栏：NavigationBar_ComponentSet_00；**L栏：NavigationBar_ComponentSet_00**（同上） | N栏：NavigationBar_ComponentSet_00；**L栏：NavigationBar_ComponentSet_00**（同上） | — | — |
| LC  | NavigationBar_ComponentSet_03 | NavigationBar_ComponentSet_06 | L栏：NavigationBar_ComponentSet_06；C栏：NavigationBar_ComponentSet_Notes_01 | — | — | — | — | — | — | — | — | L栏：NavigationBar_ComponentSet_09；C栏：NavigationBar_ComponentSet_Notes_01 | L栏：NavigationBar_ComponentSet_09；C栏：NavigationBar_ComponentSet_Notes_01 |

#### 标题栏 NavigationBar — 其他子场景（C 栏单屏）

| 子场景 | 手机竖 | Fold外竖 | Fold内竖/横 C | Pad竖C | Pad横C |
|--|--|--|--|--|--|
| 详情全屏 | NavigationBar_ComponentSet_11 | NavigationBar_ComponentSet_11 | NavigationBar_ComponentSet_Notes_01 | NavigationBar_ComponentSet_Notes_01 | NavigationBar_ComponentSet_Notes_01 |
| 秘密笔记宫格 | NavigationBar_ComponentSet_02 | NavigationBar_ComponentSet_05 | NavigationBar_ComponentSet_05 | NavigationBar_ComponentSet_08 | NavigationBar_ComponentSet_08 |
| 思维导图 | NavigationBar_ComponentSet_Notes_02 | NavigationBar_ComponentSet_Notes_02 | NavigationBar_ComponentSet_Notes_02 | NavigationBar_ComponentSet_Notes_03 | NavigationBar_ComponentSet_Notes_03 |
| MindMap_Edit | NavigationBar_ComponentSet_Notes_02 | NavigationBar_ComponentSet_Notes_02 | C栏：NavigationBar_ComponentSet_Notes_02 | NavigationBar_ComponentSet_Notes_03 | NavigationBar_ComponentSet_Notes_03 |

#### 标题栏 NavigationBar — 秘密笔记 / LC

| | 手机竖 | Fold外竖 | Fold内竖/横 LC | Pad竖LC | Pad横LC |
|--|--|--|--|--|--|
| variant | NavigationBar_ComponentSet_02 | NavigationBar_ComponentSet_02 | L栏：NavigationBar_ComponentSet_05；C栏：NavigationBar_ComponentSet_Notes_01 | L栏：NavigationBar_ComponentSet_08；C栏：NavigationBar_ComponentSet_Notes_00 | L栏：NavigationBar_ComponentSet_08；C栏：NavigationBar_ComponentSet_Notes_00 |

#### 搜索栏 SearchBar

> **2026-05-15 修订**：LC 行原来 `_02` 映射有误（CSV2 `_02` = 平板/顶部导航 内嵌 search icon，自然 176×44）。LC 风满搜索栏正确变体为 `_05`（默认，自然 392×56）。CSV1 LC 行待下次同步时一并修正。

| 场景 | 手机竖 | Fold外竖 | Fold内竖/横 LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad竖LC | Pad横LC |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | SearchBar_ComponentSet_05 | SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 | — | — | L栏：SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 | — | — | — | — |
| NL  | SearchBar_ComponentSet_05 | SearchBar_ComponentSet_05 | C栏：SearchBar_ComponentSet_05 | — | — | L栏：TopBar_03 | L栏：TopBar_07 | — | — | L栏：TopBar_03 | L栏：TopBar_07 | — | — |
| NL 编辑 | SearchBar_ComponentSet_05 | SearchBar_ComponentSet_05 | C栏：SearchBar_ComponentSet_05 | — | — | L栏：TopBar_09 | L栏：TopBar_08 | — | — | L栏：TopBar_09 | L栏：TopBar_08 | — | — |
| LC  | SearchBar_ComponentSet_05 | SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 | — | — | — | — | — | — | — | — | L栏：SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 |

> Pad NL 默认 收起 = `TopBar_07`（含 N 复원 icon）；Pad NL 编辑 收起 = **`TopBar_08`**（含 N 复원 + 编辑 NavBar_18）；Pad NL 编辑 展开 = **`TopBar_09`**（编辑 NavBar_18）。NL framework 시 L NavBar 절대 单独 不渲染，TopBar 자체가 NavBar 합성. CSV1「搜索栏 SearchBar / 编辑模式 Edit Mode / NL」row 권위.

#### 搜索页面 SearchPage（SearchBar + SearchReceiving 复合）

激活搜索态后承接面板。`搜索页面` 与上方常态 `搜索栏 SearchBar` 互斥（激活时替换）。

| 场景 | 手机竖 | Fold外竖 | Fold内竖/横 LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad竖LC | Pad横LC |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | SearchBar_01 + SearchReceiving_00 | SearchBar_01 + SearchReceiving_00 | L栏：SearchBar_01 + SearchReceiving_00 | L栏：SearchBar_01 + SearchReceiving_00 | L栏：SearchBar_01 + SearchReceiving_00 | — | — | L栏：SearchBar_01 + SearchReceiving_00 | L栏：SearchBar_01 + SearchReceiving_00 | — | — | — | — |
| NL  | SearchBar_01 + SearchReceiving_00 | SearchBar_01 + SearchReceiving_00 | L栏：SearchBar_01 + SearchReceiving_00 | — | — | C栏：SearchBar_04 + SearchReceiving_01 | C栏：SearchBar_04 + SearchReceiving_01 | — | — | C栏：SearchBar_04 + SearchReceiving_01 | C栏：SearchBar_04 + SearchReceiving_01 | — | — |
| LC  | SearchBar_01 + SearchReceiving_00 | SearchBar_01 + SearchReceiving_00 | L栏：SearchBar_01 + SearchReceiving_00 | — | — | — | — | — | — | — | — | L栏：SearchBar_01 + SearchReceiving_00 | L栏：SearchBar_01 + SearchReceiving_00 |

> Pad NL 的激活搜索为 **C 栏承接**（`SearchBar_04` 激活态 + `SearchReceiving_01` Dropdown），对应 `device-dimensions.md` 搜索规格「Pad 承接面板」章节。其余形态使用 `SearchBar_01`（激活态）+ `SearchReceiving_00`（无 / 占位）—— 新页面承接样式。

#### 信息提示 NoticeBar

| 场景 | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 |
|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | NoticeBar_ComponentSet_01 | NoticeBar_ComponentSet_01 | L栏：NoticeBar_ComponentSet_01 | L栏：NoticeBar_ComponentSet_01 | L栏：NoticeBar_ComponentSet_01 | — | — | L栏：NoticeBar_ComponentSet_01 | L栏：NoticeBar_ComponentSet_01 | — | — |
| NL  | NoticeBar_ComponentSet_01 | NoticeBar_ComponentSet_01 | C栏：NoticeBar_ComponentSet_01 | — | — | L栏：NoticeBar_ComponentSet_01 | L栏：NoticeBar_ComponentSet_01 | — | — | C栏：NoticeBar_ComponentSet_01 | C栏：NoticeBar_ComponentSet_01 |

#### 标签栏 SelectableChip

| 场景 | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad竖C | Pad横C |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | SelectableChip_ComponentSet_Notes_01 | SelectableChip_ComponentSet_Notes_01 | L栏：SelectableChip_ComponentSet_Notes_02 | L栏：SelectableChip_ComponentSet_Notes_00 | 不展示 | — | — | L栏：SelectableChip_ComponentSet_Notes_00 | 不展示 | — | — | 不展示 | 不展示 |
| NL  | SelectableChip_ComponentSet_Notes_01 | SelectableChip_ComponentSet_Notes_01 | C栏：SelectableChip_ComponentSet_Notes_01 | — | — | L栏：SelectableChip_ComponentSet_Notes_00 | 不展示 | — | — | L栏：SelectableChip_ComponentSet_Notes_00 | 不展示 | — | — |

#### 列表 List — 默认

| 场景 | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad竖LC | Pad横LC |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | List_Notes_01 | List_Notes_01 | L栏：List_Notes_03 | L栏：List_Notes_03 | L栏：List_Notes_03 | — | — | L栏：List_Notes_03 | L栏：List_Notes_03 | — | — | — | — |
| NL  | List_Notes_05 | List_Notes_07 | **Fold内竖C：List_Notes_09 / Fold内横C：List_Notes_11** | — | — | L栏：List_Notes_13 | L栏：List_Notes_15 | — | — | L栏：List_Notes_17 | L栏：List_Notes_19 | — | — |
| LC  | List_Notes_01 | List_Notes_01 | L栏：List_Notes_03 | — | — | — | — | — | — | — | — | L栏：List_Notes_03 | L栏：List_Notes_03 |

> **Fold 内 NL→C 单栏 fallback**：Fold 内屏 framework 仅含 NC / LC / C，无 NL。NL 语义在 Fold 内屏 fallback 为 **C 单栏**，list 直接占据 C 栏：`Fold内竖 C 单栏：List_Notes_09` / `Fold内横 C 单栏：List_Notes_11`（CSV2 卡片列表 family；竖屏 = `Fold_内屏_竖屏`、横屏 = `Fold_内屏_横屏`）。详见 §0「Fold 内 NL→C fallback 通则」。
> List/NL 行 device-specific 变体使用奇数序列（`_05/_07/_09/_11/_13/_15/_17/_19`），对应 Phone/Fold外/Fold内竖/Fold内横/Pad竖NL/Pad竖NL收起/Pad横NL/Pad横NL收起。CSV2 List_Notes 目录权威。

#### 列表 List — 编辑模式 Edit Mode

| 场景 | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad竖LC | Pad横LC |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | List_Notes_02 | List_Notes_02 | L栏：List_Notes_04 | L栏：List_Notes_04 | L栏：List_Notes_04 | — | — | L栏：List_Notes_04 | L栏：List_Notes_04 | — | — | — | — |
| NL  | List_Notes_06 | List_Notes_08 | **Fold内竖C：List_Notes_10 / Fold内横C：List_Notes_12** | — | — | L栏：List_Notes_14 | L栏：List_Notes_16 | — | — | L栏：List_Notes_18 | L栏：List_Notes_20 | — | — |
| LC  | List_Notes_02 | List_Notes_02 | L栏：List_Notes_04 | — | — | — | — | — | — | — | — | L栏：List_Notes_04 | L栏：List_Notes_04 |

> **Fold 内 NL→C 单栏 fallback (编辑)**：`Fold内竖 C 单栏：List_Notes_10` / `Fold内横 C 单栏：List_Notes_12` (CSV2 짝수 시퀀스 = 编辑 변체).
> List/NL **编辑** 行 device-specific 变体使用偶数序列（`_06/_08/_10/_12/_14/_16/_18/_20`），偶数索引 = 该 device 的编辑变体。

#### 底部工具栏 ToolBar / BottomBar

| 场景 | 手机竖 | Fold外竖 | Fold内竖LC | Fold内横LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad竖LC | Pad横LC |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| ToolBar / NLC | BottomBar_Showcase_Notes_01 | BottomBar_Showcase_Notes_01 | L栏：BottomBar_Showcase_Notes_02 | L栏：BottomBar_Showcase_Notes_02 | L栏：BottomBar_Showcase_Notes_00 | L栏：BottomBar_Showcase_Notes_00 | — | — | L栏：BottomBar_Showcase_Notes_00 | L栏：BottomBar_Showcase_Notes_00 | — | — | — | — |
| ToolBar / NL | BottomBar_Showcase_Notes_01 | BottomBar_Showcase_Notes_01 | L栏：BottomBar_Showcase_Notes_01 | L栏：BottomBar_Showcase_Notes_01 | — | — | L栏：BottomBar_Showcase_Notes_01 | L栏：BottomBar_Showcase_Notes_01 | — | — | L栏：BottomBar_Showcase_Notes_01 | L栏：BottomBar_Showcase_Notes_01 | — | — |
| ToolBar / LC | BottomBar_Showcase_Notes_01 | BottomBar_Showcase_Notes_01 | BottomBar_Showcase_Notes_02 | BottomBar_Showcase_Notes_02 | — | — | — | — | — | — | — | — | BottomBar_Showcase_Notes_00 | BottomBar_Showcase_Notes_00 |

> **`BottomBar_Showcase_Notes_02` 变体源文件未落地**：CSV 总表已将 Fold 内屏 LC 模式（NLC / LC）的 L 栏 ToolBar 规格更新为 `_02`，但当前 Figma 组件库中该变体尚未落地（仅有 `_01`）。临时方案：执行时先用 `_01` fallback 渲染，待组件库补齐 `_02` 后通过 `swapComponent` 升级。映射表保持 `_02` 不修改，作为权威 spec。
| Outline / C | BottomBar_Notes_Outline_01 | BottomBar_Notes_Outline_01 | BottomBar_Notes_Outline_01 | BottomBar_Notes_Outline_01 | — | — | — | — | — | — | — | — | — | — |
| NoteEditPanel / NLC | BottomBar_NoteEditPanel_01 | BottomBar_NoteEditPanel_01 | C栏：BottomBar_NoteEditPanel_01 | C栏：BottomBar_NoteEditPanel_01 | C栏：BottomBar_NoteEditPanel_02 | C栏：BottomBar_NoteEditPanel_02 | — | — | C栏：BottomBar_NoteEditPanel_02 | C栏：BottomBar_NoteEditPanel_02 | — | — | — | — |
| NoteEditPanel / LC | BottomBar_NoteEditPanel_01 | BottomBar_NoteEditPanel_01 | BottomBar_NoteEditPanel_01 | BottomBar_NoteEditPanel_01 | — | — | — | — | — | — | — | — | C栏：BottomBar_NoteEditPanel_02 | C栏：BottomBar_NoteEditPanel_02 |
| Edit Mode / NLC | ToolBar_ComponentSet_02（未选：Disabled；选中：Normal） | ToolBar_ComponentSet_02（同左） | L栏：ToolBar_ComponentSet_01（同左） | L栏：ToolBar_ComponentSet_01（同左） | L栏：ToolBar_ComponentSet_01 | L栏：ToolBar_ComponentSet_01 | — | — | L栏：ToolBar_ComponentSet_01 | L栏：ToolBar_ComponentSet_01 | — | — | — | — |
| Edit Mode / NL | ToolBar_ComponentSet_02（同左） | ToolBar_ComponentSet_02（同左） | ToolBar_ComponentSet_02（同左） | ToolBar_ComponentSet_02（同左） | — | — | L栏：ToolBar_ComponentSet_02 | L栏：ToolBar_ComponentSet_02 | — | — | L栏：ToolBar_ComponentSet_02 | L栏：ToolBar_ComponentSet_02 | — | — |
| Edit Mode / LC | ToolBar_ComponentSet_02（同左） | ToolBar_ComponentSet_02（同左） | L栏：ToolBar_ComponentSet_01（同左） | L栏：ToolBar_ComponentSet_01（同左） | — | — | — | — | — | — | — | — | L栏：ToolBar_ComponentSet_01（同左） | L栏：ToolBar_ComponentSet_01（同左） |
| MindMap_Edit / C | BottomBar_Notes_Outline_02 | BottomBar_Notes_Outline_02 | BottomBar_Notes_Outline_02 | BottomBar_Notes_Outline_02 | — | — | — | — | — | — | — | — | — | — |

#### 底部输入框 Input

> **2026-05-15 更新**：源自结构变化表 CSV1 + 控件变体清单 CSV2。`_01` 在 Fold 内屏 LC C 栏改用 **`_08`** 新变体（Q18 内屏 padding `左20；右20`）；Pad NLC C 栏暂标记 `（／／／）`（待补，组件 spec 尚未定型）。`_00` 仍为不渲染占位。

| 场景 | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad横NLC | Pad横NLC收起 |
|--|--|--|--|--|--|--|--|
| NoteEditPanel / _01 | TextInput_ComponentSet_Notes_01 | TextInput_ComponentSet_Notes_01 | C栏：TextInput_ComponentSet_Notes_08 | C栏：TextInput_ComponentSet_Notes_00 | C栏：TextInput_ComponentSet_Notes_00 | C栏：TextInput_ComponentSet_Notes_00 | C栏：TextInput_ComponentSet_Notes_00 |
| _02 | TextInput_ComponentSet_Notes_02 | TextInput_ComponentSet_Notes_02 | C栏：TextInput_ComponentSet_Notes_02 | C栏：TextInput_ComponentSet_Notes_02 | C栏：TextInput_ComponentSet_Notes_02 | C栏：TextInput_ComponentSet_Notes_02 | C栏：TextInput_ComponentSet_Notes_02 |
| _03 | TextInput_ComponentSet_Notes_03 | TextInput_ComponentSet_Notes_03 | C栏：TextInput_ComponentSet_Notes_03 | C栏：TextInput_ComponentSet_Notes_03 | C栏：TextInput_ComponentSet_Notes_03 | C栏：TextInput_ComponentSet_Notes_03 | C栏：TextInput_ComponentSet_Notes_03 |
| _04 | TextInput_ComponentSet_Notes_04 | TextInput_ComponentSet_Notes_04 | C栏：TextInput_ComponentSet_Notes_04 | C栏：TextInput_ComponentSet_Notes_04 | C栏：TextInput_ComponentSet_Notes_04 | C栏：TextInput_ComponentSet_Notes_04 | C栏：TextInput_ComponentSet_Notes_04 |
| _05 | TextInput_ComponentSet_Notes_05 | TextInput_ComponentSet_Notes_05 | C栏：TextInput_ComponentSet_Notes_05 | C栏：TextInput_ComponentSet_Notes_05 | C栏：TextInput_ComponentSet_Notes_05 | C栏：TextInput_ComponentSet_Notes_05 | C栏：TextInput_ComponentSet_Notes_05 |
| _06 | TextInput_ComponentSet_Notes_06 | TextInput_ComponentSet_Notes_06 | C栏：TextInput_ComponentSet_Notes_06 | C栏：TextInput_ComponentSet_Notes_06 | C栏：TextInput_ComponentSet_Notes_06 | C栏：TextInput_ComponentSet_Notes_06 | C栏：TextInput_ComponentSet_Notes_06 |
| _07 | TextInput_ComponentSet_Notes_07 | TextInput_ComponentSet_Notes_07 | C栏：TextInput_ComponentSet_Notes_07 | C栏：TextInput_ComponentSet_Notes_07 | C栏：TextInput_ComponentSet_Notes_07 | C栏：TextInput_ComponentSet_Notes_07 | C栏：TextInput_ComponentSet_Notes_07 |

#### 滚动条 Scrollbar

| 场景 | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad竖NC | Pad竖NC收起 | Pad竖LC | Pad竖C | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad横NC | Pad横NC收起 | Pad横LC | Pad横C |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | Scrollbar_ComponentSet_01 | Scrollbar_ComponentSet_01 | L栏 / C栏：Scrollbar_ComponentSet_01 | N栏 / L栏 / C栏：Scrollbar_ComponentSet_01 | N栏：不展示；L栏 / C栏：Scrollbar_ComponentSet_01 | — | — | — | — | — | — | N栏 / L栏 / C栏：Scrollbar_ComponentSet_01 | N栏：不展示；L栏 / C栏：Scrollbar_ComponentSet_01 | — | — | — | — | — | — |
| NL  | Scrollbar_ComponentSet_01 | Scrollbar_ComponentSet_01 | — | — | — | N栏 / L栏：Scrollbar_ComponentSet_01 | N栏：不展示；L栏：Scrollbar_ComponentSet_01 | — | — | — | — | — | — | N栏 / L栏：Scrollbar_ComponentSet_01 | N栏：不展示；L栏：Scrollbar_ComponentSet_01 | — | — | — | — |
| NC  | Scrollbar_ComponentSet_01 | Scrollbar_ComponentSet_01 | — | — | — | — | — | N栏 / C栏：Scrollbar_ComponentSet_01 | N栏：不展示；C栏：Scrollbar_ComponentSet_01 | — | — | — | — | — | — | N栏 / C栏：Scrollbar_ComponentSet_01 | N栏：不展示；C栏：Scrollbar_ComponentSet_01 | — | — |
| LC  | Scrollbar_ComponentSet_01 | Scrollbar_ComponentSet_01 | L栏 / C栏：Scrollbar_ComponentSet_01 | — | — | — | — | — | — | L栏 / C栏：Scrollbar_ComponentSet_01 | — | — | — | — | — | — | — | L栏 / C栏：Scrollbar_ComponentSet_01 | — |
| C   | Scrollbar_ComponentSet_01 | Scrollbar_ComponentSet_01 | Scrollbar_ComponentSet_01 | — | — | — | — | — | — | — | Scrollbar_ComponentSet_01 | — | — | — | — | — | — | — | Scrollbar_ComponentSet_01 |

#### 文字格式弹窗 TextFormatPanel

| | 手机竖 | Fold外竖 | Fold内竖LC | Fold内横LC | Pad竖NLC | Pad竖NLC收起 | Pad横NLC | Pad横NLC收起 |
|--|--|--|--|--|--|--|--|--|
| NLC | TextFormatPanel_01 | TextFormatPanel_01 | C栏：TextFormatPanel_02 | C栏：TextFormatPanel_01 | C栏：TextFormatPanel_01 | C栏：TextFormatPanel_01 | C栏：TextFormatPanel_01 | C栏：TextFormatPanel_01 |

#### 内容容器

| 组件 | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad横NLC | Pad横NLC收起 |
|--|--|--|--|--|--|--|--|
| 笔记详情 DetailNotes | DetailNotes_01 | DetailNotes_01 | C栏：DetailNotes_01 | C栏：DetailNotes_01 | C栏：DetailNotes_01 | C栏：DetailNotes_01 | C栏：DetailNotes_01 |
| AI 窗口 AIWindow_Notes_01/02/05 | AIWindow_Notes_01 | AIWindow_Notes_01 | AIWindow_Notes_02 | AIWindow_Notes_05 | AIWindow_Notes_05 | AIWindow_Notes_05 | AIWindow_Notes_05 |
| AI 窗口 AIWindow_Notes_03/04/06 | AIWindow_Notes_03 | AIWindow_Notes_03 | AIWindow_Notes_04 | AIWindow_Notes_06 | AIWindow_Notes_06 | AIWindow_Notes_06 | AIWindow_Notes_06 |
| 录音窗口 RecordNotes | RecordNotes_01 | RecordNotes_01 | RecordNotes_02 | RecordNotes_02 | RecordNotes_02 | RecordNotes_02 | RecordNotes_02 |

#### 应用设置 AppSettings

依 `layouts/app-settings-layout.md` 通用规则。笔记 / 待办 无 App 级 override。

承载形态概要（详细 slot 分解、2depth 切换规则见上述 layout 文档）：

| 层级 | 手机竖 | Fold外竖 | Fold内 全模式 | Pad 全模式 |
|--|--|--|--|--|
| 一级 | 全屏：NavigationBar_ComponentSet_02 | 全屏：NavigationBar_ComponentSet_05 | 浮窗：FloatingWindow_ComponentSet_01（内 `NavigationBar_09`） | 浮窗：FloatingWindow_ComponentSet_01（内 `NavigationBar_09`） |
| 二级 | 全屏：NavigationBar_ComponentSet_02 | 全屏：NavigationBar_ComponentSet_05 | 浮窗：FloatingWindow_ComponentSet_02（内 `NavigationBar_08`） | 浮窗：FloatingWindow_ComponentSet_02（内 `NavigationBar_08`） |

### 待办

#### 导航栏 Sidebar / BottomBar

| 场景 | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad横NLC | Pad横NLC收起 |
|--|--|--|--|--|--|--|--|
| NLC | BottomBar_Showcase_00 | BottomBar_Showcase_00 | L栏：BottomBar_Showcase_00 | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_00 | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_00 |

#### 标题栏 NavigationBar — 默认

| | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad横NLC | Pad横NLC收起 |
|--|--|--|--|--|--|--|--|
| variant | NavigationBar_ComponentSet_02 | NavigationBar_ComponentSet_05 | L栏：NavigationBar_ComponentSet_05；C栏：无标题 | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_00 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_17；C栏：NavigationBar_ComponentSet_00 | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_00 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_17；C栏：NavigationBar_ComponentSet_00 |

#### 标题栏 NavigationBar — 编辑模式

| | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad横NLC | Pad横NLC收起 |
|--|--|--|--|--|--|--|--|
| variant | NavigationBar_ComponentSet_03 | NavigationBar_ComponentSet_06 | L栏：NavigationBar_ComponentSet_06；C栏：NavigationBar_ComponentSet_00 | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_09；C栏：NavigationBar_ComponentSet_00 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_18；C栏：NavigationBar_ComponentSet_00 | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_09；C栏：NavigationBar_ComponentSet_00 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_18；C栏：NavigationBar_ComponentSet_00 |

#### 搜索栏 / 标签栏 / 列表 / Fab

| 组件 | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad横NLC | Pad横NLC收起 |
|--|--|--|--|--|--|--|--|
| 搜索栏 | SearchBar_ComponentSet_05 | SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 |
| 标签栏 | SelectableChip_ComponentSet_Notes_01 | SelectableChip_ComponentSet_Notes_01 | L栏：SelectableChip_ComponentSet_Notes_02 | N栏：SelectableChip_ComponentSet_Notes_00 | N栏：SelectableChip_ComponentSet_Notes_00 | N栏：SelectableChip_ComponentSet_Notes_00 | N栏：SelectableChip_ComponentSet_Notes_00 |
| 列表（默认） | List_Task_01 | List_Task_01 | L栏：List_Task_03 | L栏：List_Task_03 | L栏：List_Task_03 | L栏：List_Task_03 | L栏：List_Task_03 |
| 列表（编辑） | List_Task_02 | List_Task_02 | L栏：List_Task_04 | L栏：List_Task_04 | L栏：List_Task_04 | L栏：List_Task_04 | L栏：List_Task_04 |
| Fab | Fab_01；彩色 | Fab_01；彩色 | C栏：Fab_01 | C栏：Fab_00 | C栏：Fab_00 | C栏：Fab_00 | C栏：Fab_00 |

#### 弹窗 AlertDialog / 待办详情

| 组件 | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad横NLC | Pad横NLC收起 |
|--|--|--|--|--|--|--|--|
| NewTaskWindow_01 | NewTaskWindow_01 | NewTaskWindow_01 | C栏：NewTaskWindow_01 | C栏：NewTaskWindow_01 | C栏：NewTaskWindow_01 | C栏：NewTaskWindow_01 | C栏：NewTaskWindow_01 |
| NewTaskWindow_02 | NewTaskWindow_02 | NewTaskWindow_02 | C栏：NewTaskWindow_02 | C栏：NewTaskWindow_02 | C栏：NewTaskWindow_02 | C栏：NewTaskWindow_02 | C栏：NewTaskWindow_02 |
| DetailTask | / | / | C栏：DetailTask_01 | C栏：DetailTask_01 | C栏：DetailTask_01 | C栏：DetailTask_01 | C栏：DetailTask_01 |

## 浮层 Overlay

浮层容器（浮窗 / 抽屉 / 弹窗 / 菜单 / 行动操作按钮 / 选择器 / 分段按钮）的尺寸、位置、遮罩、背景色规范统一位于 `layouts/device-dimensions.md` 的「浮层规格」小节。本节只记录 **笔记应用在各设备 / screenMode 下要调用哪个 variant**，不重复规格。

来源：结构变化表——总表（`笔记 Notes` 行块，2026-05-12 版）。

### 文件夹管理窗口 ManageFoldWindow

Fold 内屏上该容器覆盖整屏，不按 NC / LC / C 分栏；Pad 上仍附着于 L 栏（NLC / NL）或 N 栏（NC）。

| | 手机竖 | Fold外竖 | Fold内竖 全模式 | Fold内横 全模式 | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad竖NC | Pad竖NC收起 | Pad横NLC | Pad横NLC收起 | Pad横NC | Pad横NC收起 |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| ManageFoldWindow / NLC | Sidebar_Component_Fold_LC_01（宽度定制 282dp） | Sidebar_Component_Fold_LC_01（宽度定制 282dp） | FloatingWindow_ComponentSet_01 | FloatingWindow_ComponentSet_01 | N栏：Sidebar_Component_PAD_NLC_01 | 不展示 | — | — | — | — | N栏：Sidebar_Component_PAD_NLC_01 | 不展示 | — | — |
| ManageFoldWindow / NL  | Sidebar_Component_Fold_LC_01（宽度定制 282dp） | Sidebar_Component_Fold_LC_01（宽度定制 282dp） | FloatingWindow_ComponentSet_01 | FloatingWindow_ComponentSet_01 | — | — | N栏：Sidebar_Component_PAD_NLC_01 | 不展示 | — | — | — | — | — | — |
| ManageFoldWindow / NC  | Sidebar_Component_Fold_LC_01（宽度定制 282dp） | Sidebar_Component_Fold_LC_01（宽度定制 282dp） | FloatingWindow_ComponentSet_01 | FloatingWindow_ComponentSet_01 | — | — | — | — | N栏：Sidebar_Component_PAD_NLC_01 文件夹列表 | 不展示 | — | — | N栏：Sidebar_Component_PAD_NLC_01 文件夹列表 | 不展示 |

### 抽屉窗口 / 浮窗 FloatingWindow

| | 手机竖 | Fold外竖 | Fold内 全模式 | Pad竖 全模式 | Pad横 全模式 |
|--|--|--|--|--|--|
| variant | DrawerWindow_ComponentSet_high_01 | DrawerWindow_ComponentSet_high_01 | FloatingWindow_ComponentSet_01 | FloatingWindow_ComponentSet_01 | FloatingWindow_ComponentSet_01 |

### 分段按钮 Segmented Controls

仅在浮窗 / 抽屉内部使用（如 录音详情的「总结 / 原文」切换），不作为独立浮层。

| | 手机竖 | Fold外竖 | Fold内 全模式 | Pad竖 全模式 | Pad横 全模式 |
|--|--|--|--|--|--|
| variant | SegmentedControls_ComponentSet_01 | SegmentedControls_ComponentSet_01 | SegmentedControls_ComponentSet_01 | SegmentedControls_ComponentSet_02 | SegmentedControls_ComponentSet_02 |

### 弹窗 Dialog / 行动操作按钮 ActionSheet / 选择器 Picker

| 组件 | 全设备 / 全 screenMode |
|--|--|
| AlertDialog | AlertDialog_ComponentSet_01 |
| ActionSheet | Actionsheet_ComponentSet_01 |
| Picker | WheelPicker_ComponentSet_01 |

### 菜单 Menu

| 场景 | 手机竖 | Fold外竖 | Fold内LC | Fold内横LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad竖NC | Pad竖NC收起 | Pad竖LC | Pad竖C | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad横NC | Pad横NC收起 | Pad横LC | Pad横C |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | Menu_ComponentSet_03 | Menu_ComponentSet_03 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | — | — | — | — | — | — | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | — | — | — | — | — | — |
| NL  | Menu_ComponentSet_03 | Menu_ComponentSet_03 | — | — | — | — | N栏：NavigationBar_ComponentSet_12；L栏：Menu_ComponentSet_03 | N栏：不展示；L栏：Menu_ComponentSet_03 | — | — | — | — | — | — | N栏：NavigationBar_ComponentSet_12；L栏：Menu_ComponentSet_03 | N栏：不展示；L栏：Menu_ComponentSet_03 | — | — | — | — |
| NC  | Menu_ComponentSet_03 | Menu_ComponentSet_03 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | — | — | — | — | N栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | N栏：Menu_ComponentSet_00；C栏：Menu_ComponentSet_01 | — | — | — | — | — | — | N栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | N栏：Menu_ComponentSet_00；C栏：Menu_ComponentSet_01 | — | — |
| LC  | Menu_ComponentSet_03 | Menu_ComponentSet_03 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | — | — | — | — | — | — | L栏：Menu_ComponentSet_00；C栏：Menu_ComponentSet_01 | — | — | — | — | — | — | — | L栏：Menu_ComponentSet_00；C栏：Menu_ComponentSet_01 | — |
| C   | Menu_ComponentSet_03 | Menu_ComponentSet_03 | Menu_ComponentSet_01 | Menu_ComponentSet_01 | — | — | — | — | — | — | — | Menu_ComponentSet_03 | — | — | — | — | — | — | — | Menu_ComponentSet_03 |

## Pad 分栏行为覆盖

| 场景 | 行为 |
|------|------|
| Pad 竖屏 NLC 展开 | 采用 **覆盖** 模式：L/C 回归 LC 基准尺寸（L 428 + C 521），Sidebar 覆盖于 L+C 之上；遮罩覆盖整个 frame（含状态栏），Sidebar 位于遮罩之上。详见 `layouts/device-dimensions.md`「覆盖 布局实例示范」。 |
| Pad 横屏 NLC 展开 | **并列**（通则；仅此模式，无覆盖选项） |
| Pad NLC / NL / NC 收起 | N 栏消失（笔记例外规则）；Pad 横屏 L/C 扩展吸收 N 宽度；Pad 竖屏 L/C 回归 LC 尺寸 |

## C 栏图片适配

`Detail_Notes` 内含图片的原始最大宽度为 **395dp**。各设备 / screenMode 下 C 栏（或单栏）实际内容宽度不同，按以下规则适配：

**核心公式**：`图片.width = min(C 栏内容宽, 395)`，`图片.height = 图片.width × (原始H / 原始W)`（**原始比例等比缩放**），**左对齐**，右侧产生空白留白。

| screenMode / 设备 | C 栏内容宽 | 图片宽 | 备注 |
|---|---|---|---|
| 手机竖（单栏） | 392 | 392 | cap 接近原值，近全幅 |
| Fold 外竖（单栏） | 392 | 392 | 同上 |
| Fold 内竖 LC | 346 | **346**（cap 未达，随栏宽缩） | 图片随栏宽等比缩小，高度同比缩 |
| Fold 内横 LC | 535 | **395** | 右侧留白 140 |
| Pad 竖 NLC / NLC 收起 / LC | 521 | **395** | 右侧留白 126 |
| Pad 横 NLC 展开 | 706（内容宽，去 8dp 左 padding） | **395** | 右侧留白 311 |
| Pad 横 NLC 收起 | 922（内容宽，去左右 36dp padding） | **395** | 右侧留白 527 |
| Pad 横 LC | 521 | **395** | 右侧留白 126 |

执行注意：

- 所有端 **必须等比缩放**，禁止固定高度或裁切
- 图片容器在 `Detail_Notes` 内 **左对齐 hug**，右侧空白保留为留白，不拉伸图片
- Fold 内竖（346）是唯一 cap 未达的端，实例 swap / resize 后必须显式 override `width = 346` 并按比例 resize 高度（参见 [[feedback_swap_reset_overrides]] / [[feedback_variant_swap_resize]]）
- 本规则仅适用 **笔记**（含 `笔记` 子场景的 `Detail_Notes` 内媒体），不影响 `待办` / 其他应用

## 遮罩规则

笔记和待办在 NLC / LC 模式下均适用以下遮罩规则。遮罩样式与适用范围参见 `device-dimensions.md`「遮罩定义」及其「适用范围」小节（默认覆盖整个 frame，覆盖组件 / 触发组件自身除外）。

| 触发条件 | 遮罩范围 | z-order 强制 |
|---------|---------|---|
| N 栏进入编辑模式 / NLC 覆盖 | 整个 frame（含 N 列以外的状态栏区段），Sidebar 自身除外 | `遮罩-N覆盖` 在 `状态栏` **之上**（含 status bar dim） |
| L 栏进入编辑模式 | 仅 C 列（含 C 列上方 status bar 区段），L 列豁免 | `遮罩-编辑` 在 `状态栏` **之上**（C 列 status bar 区段 dim） |
| C 栏进入编辑模式（仅 CEditMode）| 无遮罩 | — |

**核心原则**（2026-05-18 修订）：遮罩按 **列归属** 决定覆盖范围。trigger 列以外的全域（含 status bar 该列对应区段）一律 dim。**禁止**用「时间 / 信号可读性」rationale 把状态栏提升到遮罩之上。

收起态下 N 栏已消失（笔记例外规则），不再产生 N 栏遮罩触发。

### 编辑状态 + 浮层遮罩叠加

编辑状态下弹出带遮罩的浮层（模态抽屉 / 弹窗 / ActionSheet / 选择器 等）时，**编辑状态遮罩与浮层遮罩叠加显示**（双层遮罩，透明度按各自定义相乘叠加），不互相替代或取消。

## 组件间距

| 组件 | variantId | Space |
|------|-----------|-------|
| 导航栏 | NavigationBar_ComponentSet_00 | 左12；右12 |
| 导航栏 | NavigationBar_ComponentSet_01 | 左12；右12；标题左侧：28 |
| 导航栏 | NavigationBar_ComponentSet_02 | 左12；右12；标题左侧：28 |
| 导航栏 | NavigationBar_ComponentSet_04 | 左12；右12；标题左侧：28 |
| 导航栏 | NavigationBar_ComponentSet_05 | 左12；右12；标题左侧：28 |
| 导航栏 | NavigationBar_ComponentSet_07 | 左12；右12 |
| 导航栏 | NavigationBar_ComponentSet_08 | 左12；右12 |
| 导航栏 | NavigationBar_ComponentSet_09 | 左12；右12 |
| 导航栏 | NavigationBar_ComponentSet_11 | 左12；右12 |
| 导航栏 | NavigationBar_ComponentSet_12 | 左12；右12 |
| 导航栏 | NavigationBar_ComponentSet_17 | 左12；右12 |
| 导航栏 | NavigationBar_ComponentSet_18 | 左12；右12 |
| 导航栏 | NavigationBar_ComponentSet_Notes_01 | 左12；右12 |
| 导航栏 | NavigationBar_ComponentSet_Notes_03 | 左12；右12 |
| 顶部导航 | TopBar_03 | 左12；右12 |
| 顶部导航 | TopBar_07 | 左12；右12 |
| 搜索 | SearchBar_ComponentSet_02 | 左12；右12 |
| 标签栏 | SelectableChip_ComponentSet_Notes_00 | 左12 |
| 标签栏 | SelectableChip_ComponentSet_Notes_01 | 左12 |
| 标签栏 | SelectableChip_ComponentSet_Notes_02 | 左12 |
| 底部工具栏 | BottomBar_Showcase_Notes_01 | 最小：左24；右24 |
| Fab | Fab_00 | 右24 |
| Fab | Fab_01 | 右24 |
| 侧边栏 | Sidebar_Component_PAD_NLC_00 | 侧边栏组件左侧：12；侧边栏组件内：左12；右12 |
| 侧边栏 | Sidebar_Component_PAD_NLC_01 | 侧边栏组件左侧：12；侧边栏组件内：左12；右12 |
| 文字格式弹窗 | TextFormatPanel_01 | 最小：左12；右12 |
| 文字格式弹窗 | TextFormatPanel_02 | 最小：左12；右12 |
| 分段按钮 | SegmentedControls_ComponentSet_01 | 左12；右12 |
| 分段按钮 | SegmentedControls_ComponentSet_02 | 最小：左16；右16（Pad） |
| 底部输入框 | TextInput_ComponentSet_Notes_01 | ⚠️ 组件自身问题：本行记录的 `Q18 内屏：左20；右20` 与 `device-dimensions.md` 栏断点规则（Q18 w≤640 默认 12dp）冲突。以 **device-dimensions.md 栏 padding 默认为准** (Fold 内屏 LC 12dp)，本行值将在组件修正后同步更新 |
| 底部输入框 | TextInput_ComponentSet_Notes_02 | ⚠️ 同上：本行 `Q18 横屏：左116；右116；Q18 竖屏：左24；右24` 与栏断点规则冲突，**以 device-dimensions.md 栏 padding 为准** |
| 底部输入框 | TextInput_ComponentSet_Notes_03 ~ 04 | ⚠️ 同上，**以 device-dimensions.md 栏 padding 为准** |
| 底部输入框 | TextInput_ComponentSet_Notes_05 ~ 07 | 定宽；屏中对齐 |
| 底部工具栏 | BottomBar_NoteEditPanel_01 | 内部工具条定宽 320 |
| 信息提示 | NoticeBar_ComponentSet_01 | 左12；右12 |
| 选择器 | WheelPicker_ComponentSet_01 | 定宽 368；最小左右 padding 12；底部：有控制杆→距控制杆顶沿 12dp，无控制杆→距屏幕底部 12dp；Pad：上下居中 |
| 弹窗 | AlertDialog_ComponentSet_01 | 定宽 368；最小左右 padding 12；底部：有控制杆→距控制杆顶沿 12dp，无控制杆→距屏幕底部 12dp；Pad：上下居中 |
| 行动操作按钮 | Actionsheet_ComponentSet_01 | 定宽 368；最小左右 padding 12；底部：有控制杆→距控制杆顶沿 12dp，无控制杆→距屏幕底部 12dp |
| 滚动条 | Scrollbar_ComponentSet_01 | 右 0 |
| 列表 | List_Notes_01 ~ 06 | 左12；右12 |
| 列表 | List_Task_01 ~ 04 | 左12；右12 |

> `Sidebar_Component_PAD_NLC_02` 不再用于笔记 / 待办（见「N 收起规则」）。

## 栏背景色

> **規則 (2026-05-20 修订)**: card-presence rule. 容器에 卡片 / 套卡 list / Sidebar 菜单 浮 时 = `背景色/surface_low` (灰底); 单一全幅 panel / 不带卡片 flat list = `背景色/surface` (白底). 笔记 / 待办 적용:
> - **L 栏 笔记** (List_Notes 卡片 stacked) → `surface_low`
> - **L 栏 待办** (List_Task 不带卡片 flat list) → `surface`
> - **N 栏** (외壳 안에 Sidebar 单一卡片 浮起, 即「N 栏 = 外壳 + 卡片」구조) → `surface_low`
> - **C 栏 笔记 Detail** (단일 全幅 note panel) → `surface`
> - **C 栏 待办 DetailTask** (단일 全幅 panel) → `surface`
> - **C 栏 NL→C fallback 笔记** (list 카드 上提) → `surface_low`
> - **C 栏 NL→C fallback 待办** (list 不带卡片 上提) → `surface`
> - **frame 笔记** → `surface_low` (卡片浮起视觉一致)
> - **frame 待办** → `surface` (不带卡片, 白底统一)

「不存在」表示笔记应用不使用该模式。

### 手机

| screenMode | 背景色 |
|-----------|-------|
| 竖屏 | 背景色/surface_low |
| 横屏 | 待定 |

### Fold Q18 — 外屏

| screenMode | 背景色 |
|-----------|-------|
| 竖屏 | 背景色/surface_low |
| 横屏 | 待定 |

### Fold Q18 — 内屏 / 竖屏

| screenMode | frame | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|------|
| NC | 背景色/surface_low | 背景色/surface_low | 不存在 | 背景色/surface |
| LC | 背景色/surface_low | 不存在 | 背景色/surface_low | 背景色/surface (笔记 Detail) |
| NL→C fallback | 背景色/surface_low | 不存在 | 不存在 | 背景色/surface_low (list 上提) |
| C | 背景色/surface_low | 不存在 | 不存在 | 背景色/surface (Detail full bleed) |

### Fold Q18 — 内屏 / 横屏

| screenMode | frame | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|------|
| NC | 背景色/surface_low | 背景色/surface_low | 不存在 | 背景色/surface |
| LC | 背景色/surface_low | 不存在 | 背景色/surface_low | 背景色/surface (笔记 Detail) |
| NL→C fallback | 背景色/surface_low | 不存在 | 不存在 | 背景色/surface_low (list 上提) |
| C | 背景色/surface_low | 不存在 | 不存在 | 背景色/surface (Detail full bleed) |

### Pad — 竖屏

| screenMode | frame | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|------|
| NLC | 背景色/surface_low | 背景色/surface_low | 背景色/surface_low | 背景色/surface (笔记 Detail) |
| NLC 收起 | 背景色/surface_low | 不存在 (N 消失) | 背景色/surface_low | 背景色/surface |
| NL | 背景色/surface_low | 背景色/surface_low | 背景色/surface_low | — |
| NL 收起 | 背景色/surface_low | 不存在 (N 消失) | 背景色/surface_low | — |
| NC | 背景色/surface_low | 背景色/surface_low | — | 背景色/surface |
| NC 收起 | 背景色/surface_low | 不存在 (N 消失) | — | 背景色/surface |
| LC | 背景色/surface_low | 不存在 | 背景色/surface_low | 背景色/surface |
| C | 背景色/surface_low | 不存在 | 不存在 | 背景色/surface_low |

### Pad — 横屏

| screenMode | frame | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|------|
| NLC | 背景色/surface_low | 背景色/surface_low | 背景色/surface_low | 背景色/surface (笔记 Detail) |
| NLC 收起 | 背景色/surface_low | 不存在 (N 消失) | 背景色/surface_low | 背景色/surface |
| NL | 背景色/surface_low | 背景色/surface_low | 背景色/surface_low | — |
| NL 收起 | 背景色/surface_low | 不存在 (N 消失) | 背景色/surface_low | — |
| NC | 背景色/surface_low | 背景色/surface_low | — | 背景色/surface |
| NC 收起 | 背景色/surface_low | 不存在 (N 消失) | — | 背景色/surface |
| LC | 不存在 | 不存在 | 不存在 |
| C | 不存在 | 不存在 | 背景色/surface_low |

## 当前覆盖缺口

以下内容仍未形成正式映射，后续补齐后建议直接追加到上表：

- Phone 横屏模式
- Fold 外屏横屏模式
- Pad NL 的 List 变体（结构表 2026-05-12 占位，标注为「待补」）
