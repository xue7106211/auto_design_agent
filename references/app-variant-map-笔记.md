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
| 2 | **Detail 高度延伸** | `Detail.height = mainH − 62`（延伸到 TI 下方，TI 通过 z-order + fade 自然 overlay）；不能算成 `mainH − 154` |
| 3 | **C 栏 z-order** | `NavBar → Detail → TextInput`（TI 在上层 fade overlay 在 Detail 之上）；杆子在 frame 直接子级 |
| 4 | **L 栏 顺序** | `NavBar(56) → SearchBar(56) → SelectableChip(52) → List → BottomBar(100, 底)`；**与源稿 Chip↔Search 顺序差异时以 spec 为准** |
| 5 | **杆子（home indicator）** | `x=0, width=frameW` 风满；`fills=[]` 透明；frame 直接子级**最顶 z-order**（Sidebar 之上） |
| 6 | **覆盖模式 遮罩 z-order**（2026-05-18 修订）| Pad 竖 NLC 覆盖：z-order = `main → 状态栏 → 遮罩-N覆盖 → 分割线 → Sidebar → 杆子`。**遮罩-N覆盖 必须在状态栏之上**（按列归属：N 列以外含状态栏全部 dim）。Sidebar 在遮罩之上（trigger 列豁免）。**旧版「保证可读」rationale 已弃用**。L 编辑遮罩同理：`遮罩-编辑` 在 `状态栏` 之上 |
| 7 | **栏背景色 token** | 所有 LC / NLC 模式的 frame / L栏 / C栏 fill 必须绑定 `背景色/surface`（key `5804f51e302d6fda00b3a8ce9d509d9b8ee09225`）。详见本文档「栏背景色」表 |
| 8 | **N 收起 替代规则** | 笔记 / 待办专属：N 收起态**不使用** `Sidebar_Component_PAD_NLC_02`（88dp 形态）；改为 N 栏直接消失 + L/C 栏 NavigationBar 最左加 `_17`(默认)/`_18`(编辑) 收起图标。详见「N 收起 规则」节 |

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

### §0.2 padding 合算应用表（笔记 / 待办）

> 通用合算公式见 `common-rules.md §3.4a`。本表列具体 frame × 栏 × 组件的 `outer / x / 写入 width`，**直接抄表**。

**特殊（框架性）组件**：`NavigationBar` / `NavigationBar_ComponentSet_Notes` / `BottomBar_*` / `ToolBar_*` / `Sidebar_*` / `TextInput_ComponentSet_Notes` —— 在所属栏内**永远 `x=0, width=栏W` 风满**，**不参与下表合算**。

**Detail_Notes 特殊 `internal=20`**：Detail 外层 frame `paddingLeft=0` 但封面图距 Detail 左缘恒为 20dp，作为 Detail 「自带 padding」参与合算。**仅适用 Detail_Notes**，不推广到其它组件。

| frame | 栏 | 栏宽 | spec | 组件 | internal | outer | x | 写入 width |
|-------|----|------|------|------|----------|-------|---|------------|
| Fold 内横 LC | L | 353 | 12 | SearchBar | 12 | 0 | 0 | 353 |
| | L | 353 | 12 | SelectableChip | 12 | 0 | 0 | 353 |
| | L | 353 | 12 | List_Notes | 12 | 0 | 0 | 353 |
| | C | 535 | 12 | **Detail_Notes** | 20 | 0 | 0 | 535 |
| Fold 内竖 LC | L | 282 | 12 | SearchBar | 12 | 0 | 0 | 282 |
| | L | 282 | 12 | SelectableChip | 12 | 0 | 0 | 282 |
| | L | 282 | 12 | List_Notes | 12 | 0 | 0 | 282 |
| | C | 346 | 12 | **Detail_Notes** | 20 | 0 | 0 | 346 |
| Pad 横 NLC（展开）| L | 428 | **20** | SearchBar | 12 | 8 | 8 | 412 |
| | L | 428 | 20 | List_Notes | 12 | 8 | 8 | 412 |
| | C | 722 | **28** | **Detail_Notes** | 20 | 8 | 8 | 706 |
| Pad 竖 NLC（展开 / 覆盖）| L | 428 | **20** | SearchBar | 12 | 8 | 8 | 412 |
| | L | 428 | 20 | List_Notes | 12 | 8 | 8 | 412 |
| | C | 521 | 12 | **Detail_Notes** | 20 | 0 | 0 | 521 |
| Pad 横 NLC 收起 | L | 428 | **20** | SearchBar | 12 | 8 | 8 | 412 |
| | L | 428 | 20 | List_Notes | 12 | 8 | 8 | 412 |
| | C | 994 | **56** | **Detail_Notes** | 20 | 36 | 36 | 922 |
| Pad 竖 NLC 收起 | L | 428 | **20** | SearchBar | 12 | 8 | 8 | 412 |
| | L | 428 | 20 | List_Notes | 12 | 8 | 8 | 412 |
| | C | 521 | **20** | **Detail_Notes** | 20 | 0 | 0 | 521 |

### §0.3 必用 token 引用

| 用途 | Token 名 | Library Key |
|------|---------|------------|
| frame / L栏 / C栏 fill | `背景色/surface` | `5804f51e302d6fda00b3a8ce9d509d9b8ee09225` |
| 栏间分割线 fill | `分割线色/outline` | `96f2cf4d1ce0d56cff2f8e98da6a5e16bd59983e` |
| Pad 竖 NLC 覆盖 遮罩 fill（opacity 0.2）| `遮罩色/mask` | `0ed62540049dd3839b40b63d40f82492c4bac664` |

### §0.4 关键组件 set keys（重要）

| set | key | 备注 |
|-----|-----|------|
| `状态栏-StatusBar` | `599a7d4bf61b848414c8141da76ab3b3c6596686` | 含 手机/fold/pad 三 variant；pad 自然高 38, **强制 resize 34** |
| `NavigationBar` | `a89cd38d06061fcbb5ff7e596b92f8f3cf3888de` | 含 `_00`~`_18` 系列。**`_Notes_*` 已分离到下方独立 set** |
| `NavigationBar_ComponentSet_Notes` | `ac60af7e28e6491b3520ecaefd71fa7e03832c31` | 业务组件库；含 `_Notes_01`/`_Notes_02` |
| `SearchBar_ComponentSet` | `2316a63eb824ab38f388c3127101e535b7668398` | LC 默认风满用 `_05`（不是 `_02`）|
| `SelectableChip_ComponentSet_Notes` | `af1e1df353e8fb1fe8005b82fed310422f2eae4c` | |
| `List_Notes` | `94f9b4085ba12b43511a95282fa84225241f6f9e` | |
| `Detail_Notes` | `961f0e237edea438d52e6d2ad9b4e38c99bd2c68` | |
| `BottomBar_Showcase_Notes` | `303649c8435835bcbfb5e85e668a0b6562497cad` | |
| `TextInput_ComponentSet_Notes` | `0dc20401cde070d654725146db336032d2f886a2` | **Fold 内 LC C 栏 默认 = `_08`**（非 `_01`）|
| `BottomBar`（含 `Sidebar_Component_PAD_NLC_*`）| `414cabc8e633c33cc6441ff0f936f971dc9babd3` | Sidebar 在此 set 内；2026-05-15 卡片 y=0 h=788 |
| `杆子` | `eaa1eedcfecafc098f1383119303223843baa3c5` | 含 手机/折叠屏/pad × 横/竖 × 浅/深 全 variant |

### §0.5 组件库变更日志

| 组件 | 更新日期 | 影响 |
|------|---------|------|
| `Sidebar_Component_PAD_NLC_01` | 2026-05-15 | 卡片 `y=6, h=782` → `y=0, h=788`。卡片紧贴外壳上沿，无 6dp 顶部空间 |
| `NavigationAtoms` 高度（Sidebar 内部使用）| 2026-05-14 之前 | 44dp → 56dp。内容区域起点变为 `y = 56 + 6 = 62` |
| `NavigationBar` set ↔ `NavigationBar_ComponentSet_Notes` set 拆分 | 2026-05-15 实测 | `_Notes_*` variant 已迁到独立 set，引用旧 set 找不到 `_Notes_01` |
| `TextInput_ComponentSet_Notes_08` | 2026-05-15 新增 | 392×92, Q18 内屏 padding 左20 右20。Fold 内 LC C 栏 NoteEditPanel 默认从 `_01` 改用 `_08` |
| `TextInput_ComponentSet_Notes_00` | 2026-05-18 落地 | Pad NLC C 栏 NoteEditPanel 输入框；先前标记 `（／／／）` 不渲染已废弃 |
| `BottomBar_NoteEditPanel_03` | 2026-05-18 落地 | 新增 NoteEditPanel 变体（场景 spec 待补） |
| NoteEditPanel / NLC Fold 内横 LC | 2026-05-18 修订 | C 栏 `_02` → `_01` (CSV2 控件总表) |
| **CSV1 / CSV2 全表同步** | 2026-05-18 完成 | 与 `结构变化表-控件总表` (CSV1) + `多端控件映射-控件变体清单` (CSV2) 全行块比对完成；`笔记` + `待办` 子场景所有 cell 已一致。SearchBar LC 行 CSV1 仍标 `_02`（错误），本表保持 `_05`（spec 正确），等待 CSV1 下次回填修正 |
| **CSV2 新增 variant 信号** | 2026-05-15 标记 / 2026-05-18 同步 | `NavigationBar_ComponentSet_16/17/18`、`TopBar_06/07`、`SearchBar_ComponentSet_03/04/05`、`Sidebar_Component_PAD_NLC_00`、`Fab_00`、`TextInput_ComponentSet_Notes_08` 已在 CSV2 标 "15日 YES"；本表已使用 `_17/_18`、`TopBar_07`、`SearchBar_05`、`PAD_NLC_00`、`Fab_00`、`TextInput_08`。`_16` / `TopBar_06` 暂未在 笔记 行块中出现，保留观察 |

### §0.6 历史踩坑（笔记 / 待办 应用专用）

> 通用 instance reflow 陷阱见 `common-rules.md §3.6`。本表只列 **笔记 / 待办 变体选择 / 特殊位置** 的应用专属失误。

| 类别 | 失误 | 正确做法 |
|------|------|---------|
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
- N 恢复图标内嵌于 L（或 C）标题栏最左
  - 默认态使用 `NavigationBar_ComponentSet_17`
  - 编辑态使用 `NavigationBar_ComponentSet_18`
- 侧边栏组件本体：
  - 展开态：`Sidebar_Component_PAD_NLC_01`
  - 收起态：`Sidebar_Component_PAD_NLC_00`（极简/空容器变体，不再使用 `_02`）

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
| NL  | BottomBar_Showcase_00 | BottomBar_Showcase_00 | — | — | — | — | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_00 | — | — | — | — | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_00 | — | — |
| NC  | BottomBar_Showcase_00 | BottomBar_Showcase_00 | — | — | — | — | — | — | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_00 | — | — | — | — | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_00 |

#### 标题栏 NavigationBar — 默认

| 场景 | 手机竖 | Fold外竖 | Fold内竖/横 LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad竖NC | Pad竖NC收起 | Pad竖LC | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad横NC | Pad横NC收起 | Pad横LC |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | NavigationBar_ComponentSet_01 | NavigationBar_ComponentSet_04 | L栏：NavigationBar_ComponentSet_04；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_17；C栏：NavigationBar_ComponentSet_Notes_01 | — | — | — | — | — | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_17；C栏：NavigationBar_ComponentSet_Notes_01 | — | — | — | — | — |
| NL  | NavigationBar_ComponentSet_01 | NavigationBar_ComponentSet_04 | — | — | — | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_17 | — | — | — | — | — | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_17 | — | — | — |
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
| NL  | NavigationBar_ComponentSet_03 | NavigationBar_ComponentSet_06 | — | — | — | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_09 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_18 | — | — | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_09 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_18 | — | — |
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
| variant | NavigationBar_ComponentSet_02 | NavigationBar_ComponentSet_02 | L栏：NavigationBar_ComponentSet_05；C栏：NavigationBar_ComponentSet_Notes_01 | L栏：NavigationBar_ComponentSet_08；C栏：NavigationBar_ComponentSet_Notes_01 | L栏：NavigationBar_ComponentSet_08；C栏：NavigationBar_ComponentSet_Notes_01 |

#### 搜索栏 SearchBar

> **2026-05-15 修订**：LC 行原来 `_02` 映射有误（CSV2 `_02` = 平板/顶部导航 内嵌 search icon，自然 176×44）。LC 风满搜索栏正确变体为 `_05`（默认，自然 392×56）。CSV1 LC 行待下次同步时一并修正。

| 场景 | 手机竖 | Fold外竖 | Fold内竖/横 LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad竖LC | Pad横LC |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | SearchBar_ComponentSet_05 | SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 | — | — | L栏：SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 | — | — | — | — |
| NL  | SearchBar_ComponentSet_05 | SearchBar_ComponentSet_05 | — | — | — | L栏：TopBar_03 | L栏：TopBar_07 | — | — | L栏：TopBar_03 | L栏：TopBar_07 | — | — |
| LC  | SearchBar_ComponentSet_05 | SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 | — | — | — | — | — | — | — | — | L栏：SearchBar_ComponentSet_05 | L栏：SearchBar_ComponentSet_05 |

> Pad NL 收起 使用 `TopBar_07`（顶部导航搜索_侧边栏收起变体），同时承载 N 栏恢复功能。

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
| NL  | NoticeBar_ComponentSet_01 | NoticeBar_ComponentSet_01 | — | — | — | L栏：NoticeBar_ComponentSet_01 | L栏：NoticeBar_ComponentSet_01 | — | — | C栏：NoticeBar_ComponentSet_01 | C栏：NoticeBar_ComponentSet_01 |

#### 标签栏 SelectableChip

| 场景 | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad竖C | Pad横C |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | SelectableChip_ComponentSet_Notes_01 | SelectableChip_ComponentSet_Notes_01 | L栏：SelectableChip_ComponentSet_Notes_02 | L栏：SelectableChip_ComponentSet_Notes_00 | 不展示 | — | — | L栏：SelectableChip_ComponentSet_Notes_00 | 不展示 | — | — | 不展示 | 不展示 |
| NL  | SelectableChip_ComponentSet_Notes_01 | SelectableChip_ComponentSet_Notes_01 | — | — | — | L栏：SelectableChip_ComponentSet_Notes_00 | 不展示 | — | — | L栏：SelectableChip_ComponentSet_Notes_00 | 不展示 | — | — |

#### 列表 List — 默认

| 场景 | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad竖LC | Pad横LC |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | List_Notes_01 | List_Notes_01 | L栏：List_Notes_03 | L栏：List_Notes_03 | L栏：List_Notes_03 | — | — | L栏：List_Notes_03 | L栏：List_Notes_03 | — | — | — | — |
| NL  | List_Notes_05 | List_Notes_05 | — | — | — | L栏：待补 | L栏：待补 | — | — | L栏：待补 | L栏：待补 | — | — |
| LC  | List_Notes_01 | List_Notes_01 | L栏：List_Notes_03 | — | — | — | — | — | — | — | — | L栏：List_Notes_03 | L栏：List_Notes_03 |

> Pad NL 的 List 变体待补（结构表 2026-05-12 占位）。

#### 列表 List — 编辑模式 Edit Mode

| 场景 | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad竖LC | Pad横LC |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | List_Notes_02 | List_Notes_02 | L栏：List_Notes_04 | L栏：List_Notes_04 | L栏：List_Notes_04 | — | — | L栏：List_Notes_04 | L栏：List_Notes_04 | — | — | — | — |
| NL  | List_Notes_06 | List_Notes_06 | — | — | — | L栏：待补 | L栏：待补 | — | — | L栏：待补 | L栏：待补 | — | — |
| LC  | List_Notes_02 | List_Notes_02 | L栏：List_Notes_04 | — | — | — | — | — | — | — | — | L栏：List_Notes_04 | L栏：List_Notes_04 |

#### 底部工具栏 ToolBar / BottomBar

| 场景 | 手机竖 | Fold外竖 | Fold内竖LC | Fold内横LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad竖LC | Pad横LC |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| ToolBar / NLC | BottomBar_Showcase_Notes_01 | BottomBar_Showcase_Notes_01 | L栏：BottomBar_Showcase_Notes_02 | L栏：BottomBar_Showcase_Notes_02 | L栏：BottomBar_Showcase_Notes_00 | L栏：BottomBar_Showcase_Notes_00 | — | — | L栏：BottomBar_Showcase_Notes_00 | L栏：BottomBar_Showcase_Notes_00 | — | — | — | — |
| ToolBar / NL | BottomBar_Showcase_Notes_01 | BottomBar_Showcase_Notes_01 | — | — | — | — | L栏：BottomBar_Showcase_Notes_00 | L栏：BottomBar_Showcase_Notes_00 | — | — | L栏：BottomBar_Showcase_Notes_00 | L栏：BottomBar_Showcase_Notes_00 | — | — |
| ToolBar / LC | BottomBar_Showcase_Notes_01 | BottomBar_Showcase_Notes_01 | BottomBar_Showcase_Notes_02 | BottomBar_Showcase_Notes_02 | — | — | — | — | — | — | — | — | BottomBar_Showcase_Notes_00 | BottomBar_Showcase_Notes_00 |

> **`BottomBar_Showcase_Notes_02` 变体源文件未落地**：CSV 总表已将 Fold 内屏 LC 模式（NLC / LC）的 L 栏 ToolBar 规格更新为 `_02`，但当前 Figma 组件库中该变体尚未落地（仅有 `_01`）。临时方案：执行时先用 `_01` fallback 渲染，待组件库补齐 `_02` 后通过 `swapComponent` 升级。映射表保持 `_02` 不修改，作为权威 spec。
| Outline / C | BottomBar_Notes_Outline_01 | BottomBar_Notes_Outline_01 | BottomBar_Notes_Outline_01 | BottomBar_Notes_Outline_01 | — | — | — | — | — | — | — | — | — | — |
| NoteEditPanel / NLC | BottomBar_NoteEditPanel_01 | BottomBar_NoteEditPanel_01 | C栏：BottomBar_NoteEditPanel_01 | C栏：BottomBar_NoteEditPanel_01 | C栏：BottomBar_NoteEditPanel_02 | C栏：BottomBar_NoteEditPanel_02 | — | — | C栏：BottomBar_NoteEditPanel_02 | C栏：BottomBar_NoteEditPanel_02 | — | — | — | — |
| NoteEditPanel / LC | BottomBar_NoteEditPanel_01 | BottomBar_NoteEditPanel_01 | BottomBar_NoteEditPanel_01 | BottomBar_NoteEditPanel_01 | — | — | — | — | — | — | — | — | C栏：BottomBar_NoteEditPanel_02 | C栏：BottomBar_NoteEditPanel_02 |
| Edit Mode / NLC | ToolBar_ComponentSet_01（未选：Disabled；选中：Normal） | ToolBar_ComponentSet_01（同左） | L栏：ToolBar_ComponentSet_01（同左） | L栏：ToolBar_ComponentSet_01（同左） | L栏：ToolBar_ComponentSet_01（同左） | L栏：ToolBar_ComponentSet_01（同左） | — | — | L栏：ToolBar_ComponentSet_01（同左） | L栏：ToolBar_ComponentSet_01（同左） | — | — | — | — |
| Edit Mode / NL | ToolBar_ComponentSet_01（同左） | ToolBar_ComponentSet_01（同左） | ToolBar_ComponentSet_01（同左） | ToolBar_ComponentSet_01（同左） | — | — | L栏：ToolBar_ComponentSet_00 | L栏：ToolBar_ComponentSet_00 | — | — | L栏：ToolBar_ComponentSet_00 | L栏：ToolBar_ComponentSet_00 | — | — |
| Edit Mode / LC | ToolBar_ComponentSet_01（同左） | ToolBar_ComponentSet_01（同左） | L栏：ToolBar_ComponentSet_01（同左） | L栏：ToolBar_ComponentSet_01（同左） | — | — | — | — | — | — | — | — | L栏：ToolBar_ComponentSet_01（同左） | L栏：ToolBar_ComponentSet_01（同左） |
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
| 搜索栏 | SearchBar_ComponentSet_02 | SearchBar_ComponentSet_02 | L栏：SearchBar_ComponentSet_02 | L栏：SearchBar_ComponentSet_02 | L栏：SearchBar_ComponentSet_02 | L栏：SearchBar_ComponentSet_02 | L栏：SearchBar_ComponentSet_02 |
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

按设备和 screenMode 逐一标注各栏背景色。「不存在」表示笔记应用不使用该模式。

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

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NC | 不存在 | 不存在 | 不存在 |
| LC | 不存在 | 背景色/surface | 背景色/surface |
| C | 不存在 | 不存在 | 不存在 |

### Fold Q18 — 内屏 / 横屏

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NC | 不存在 | 不存在 | 不存在 |
| LC | 不存在 | 背景色/surface | 背景色/surface |
| C | 不存在 | 不存在 | 不存在 |

### Pad — 竖屏

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NLC | 背景色/surface | 背景色/surface | 背景色/surface |
| NLC 收起 | 不存在（N 消失） | 背景色/surface | 背景色/surface |
| NL | 背景色/surface | 背景色/surface | — |
| NL 收起 | 不存在（N 消失） | 背景色/surface | — |
| NC | 背景色/surface | — | 背景色/surface |
| NC 收起 | 不存在（N 消失） | — | 背景色/surface |
| LC | 不存在 | 不存在 | 不存在 |
| C | 不存在 | 不存在 | 背景色/surface_low |

### Pad — 横屏

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NLC | 背景色/surface | 背景色/surface | 背景色/surface |
| NLC 收起 | 不存在（N 消失） | 背景色/surface | 背景色/surface |
| NL | 背景色/surface | 背景色/surface | — |
| NL 收起 | 不存在（N 消失） | 背景色/surface | — |
| NC | 背景色/surface | — | 背景色/surface |
| NC 收起 | 不存在（N 消失） | — | 背景色/surface |
| LC | 不存在 | 不存在 | 不存在 |
| C | 不存在 | 不存在 | 背景色/surface_low |

## 当前覆盖缺口

以下内容仍未形成正式映射，后续补齐后建议直接追加到上表：

- Phone 横屏模式
- Fold 外屏横屏模式
- Pad NL 的 List 变体（结构表 2026-05-12 占位，标注为「待补」）
