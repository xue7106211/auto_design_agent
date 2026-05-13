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

| 场景 | 手机竖 | Fold外竖 | Fold内竖/横 LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad竖NC | Pad竖NC收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad横NC | Pad横NC收起 |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | NavigationBar_ComponentSet_01 | NavigationBar_ComponentSet_04 | L栏：NavigationBar_ComponentSet_04；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_17；C栏：NavigationBar_ComponentSet_Notes_01 | — | — | — | — | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_17；C栏：NavigationBar_ComponentSet_Notes_01 | — | — | — | — |
| NL  | NavigationBar_ComponentSet_01 | NavigationBar_ComponentSet_04 | — | — | — | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_17 | — | — | — | — | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_17 | — | — |
| NC  | NavigationBar_ComponentSet_11 | NavigationBar_ComponentSet_11 | — | — | — | — | — | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_11 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_Notes_03 | — | — | — | — | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_11 | N栏：NavigationBar_ComponentSet_00；L栏：NavigationBar_ComponentSet_Notes_03 |
| LC  | NavigationBar_ComponentSet_02 | NavigationBar_ComponentSet_05 | N栏：NavigationBar_ComponentSet_05；C栏：NavigationBar_ComponentSet_Notes_01 | — | — | — | — | — | — | — | — | — | — | — | — |

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

| 场景 | 手机竖 | Fold外竖 | Fold内竖/横 LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad竖LC | Pad横LC |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | SearchBar_ComponentSet_02 | SearchBar_ComponentSet_02 | L栏：SearchBar_ComponentSet_02 | L栏：SearchBar_ComponentSet_02 | L栏：SearchBar_ComponentSet_02 | — | — | L栏：SearchBar_ComponentSet_02 | L栏：SearchBar_ComponentSet_02 | — | — | — | — |
| NL  | SearchBar_ComponentSet_02 | SearchBar_ComponentSet_02 | — | — | — | L栏：TopBar_03 | L栏：TopBar_07 | — | — | L栏：TopBar_03 | L栏：TopBar_07 | — | — |
| LC  | SearchBar_ComponentSet_02 | SearchBar_ComponentSet_02 | L栏：SearchBar_ComponentSet_02 | — | — | — | — | — | — | — | — | L栏：SearchBar_ComponentSet_02 | L栏：SearchBar_ComponentSet_02 |

> Pad NL 收起 使用 `TopBar_07`（顶部导航搜索_侧边栏收起变体），同时承载 N 栏恢复功能。

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
| NL  | List_Notes_06 | List_Notes_06 | — | — | — | L栏：List_Notes_04 | L栏：List_Notes_04 | — | — | L栏：List_Notes_04 | L栏：List_Notes_04 | — | — |
| LC  | List_Notes_02 | List_Notes_02 | L栏：List_Notes_04 | — | — | — | — | — | — | — | — | L栏：List_Notes_04 | L栏：List_Notes_04 |

#### 底部工具栏 ToolBar / BottomBar

| 场景 | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad竖LC | Pad横LC |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| ToolBar / NLC | BottomBar_Showcase_Notes_01 | BottomBar_Showcase_Notes_01 | L栏：BottomBar_Showcase_Notes_01 | L栏：BottomBar_Showcase_Notes_00 | L栏：BottomBar_Showcase_Notes_00 | — | — | L栏：BottomBar_Showcase_Notes_00 | L栏：BottomBar_Showcase_Notes_00 | — | — | — | — |
| ToolBar / NL | BottomBar_Showcase_Notes_01 | BottomBar_Showcase_Notes_01 | — | — | — | L栏：BottomBar_Showcase_Notes_00 | L栏：BottomBar_Showcase_Notes_00 | — | — | L栏：BottomBar_Showcase_Notes_00 | L栏：BottomBar_Showcase_Notes_00 | — | — |
| ToolBar / LC | BottomBar_Showcase_Notes_01 | BottomBar_Showcase_Notes_01 | BottomBar_Showcase_Notes_01 | — | — | — | — | — | — | — | — | BottomBar_Showcase_Notes_00 | BottomBar_Showcase_Notes_00 |
| Outline / C | BottomBar_Notes_Outline_01 | BottomBar_Notes_Outline_01 | BottomBar_Notes_Outline_01 | — | — | — | — | — | — | — | — | — | — |
| NoteEditPanel / NLC | BottomBar_NoteEditPanel_01 | BottomBar_NoteEditPanel_01 | C栏：BottomBar_NoteEditPanel_01 | C栏：BottomBar_NoteEditPanel_00 | C栏：BottomBar_NoteEditPanel_00 | — | — | C栏：BottomBar_NoteEditPanel_00 | C栏：BottomBar_NoteEditPanel_00 | — | — | — | — |
| NoteEditPanel / LC | BottomBar_NoteEditPanel_01 | BottomBar_NoteEditPanel_01 | BottomBar_NoteEditPanel_01 | — | — | — | — | — | — | — | — | L栏：BottomBar_NoteEditPanel_00 | L栏：BottomBar_NoteEditPanel_00 |
| Edit Mode / NLC | ToolBar_ComponentSet_01（未选：Disabled；选中：Normal） | ToolBar_ComponentSet_01（同左） | L栏：ToolBar_ComponentSet_01（同左） | L栏：ToolBar_ComponentSet_00 | L栏：ToolBar_ComponentSet_00 | — | — | L栏：ToolBar_ComponentSet_00 | L栏：ToolBar_ComponentSet_00 | — | — | — | — |
| Edit Mode / NL | ToolBar_ComponentSet_01（同左） | ToolBar_ComponentSet_01（同左） | ToolBar_ComponentSet_01（同左） | — | — | L栏：ToolBar_ComponentSet_00 | L栏：ToolBar_ComponentSet_00 | — | — | L栏：ToolBar_ComponentSet_00 | L栏：ToolBar_ComponentSet_00 | — | — |
| Edit Mode / LC | ToolBar_ComponentSet_01（同左） | ToolBar_ComponentSet_01（同左） | L栏：ToolBar_ComponentSet_01（同左） | — | — | — | — | — | — | — | — | L栏：ToolBar_ComponentSet_01（同左） | L栏：ToolBar_ComponentSet_01（同左） |
| MindMap_Edit / C | BottomBar_Notes_Outline_02 | BottomBar_Notes_Outline_02 | BottomBar_Notes_Outline_02 | — | — | — | — | — | — | — | — | — | — |

#### 底部输入框 Input

| 场景 | 手机竖 | Fold外竖 | Fold内LC | Pad竖NLC | Pad竖NLC收起 | Pad横NLC | Pad横NLC收起 |
|--|--|--|--|--|--|--|--|
| NoteEditPanel / _01 | TextInput_ComponentSet_Notes_01 | TextInput_ComponentSet_Notes_01 | C栏：TextInput_ComponentSet_Notes_01 | C栏：TextInput_ComponentSet_Notes_00 | C栏：TextInput_ComponentSet_Notes_00 | C栏：TextInput_ComponentSet_Notes_00 | C栏：TextInput_ComponentSet_Notes_00 |
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
| AI 窗口 AIWindow_Notes_01/02 | AIWindow_Notes_01 | AIWindow_Notes_01 | AIWindow_Notes_02 | AIWindow_Notes_02 | AIWindow_Notes_02 | AIWindow_Notes_02 | AIWindow_Notes_02 |
| AI 窗口 AIWindow_Notes_03/04 | AIWindow_Notes_03 | AIWindow_Notes_03 | AIWindow_Notes_04 | AIWindow_Notes_04 | AIWindow_Notes_04 | AIWindow_Notes_04 | AIWindow_Notes_04 |
| 录音窗口 RecordNotes | RecordNotes_01 | RecordNotes_01 | RecordNotes_02 | RecordNotes_02 | RecordNotes_02 | RecordNotes_02 | RecordNotes_02 |

#### 应用设置 AppSettings

| 层级 | 手机竖 | Fold外竖 | Fold内 全模式 | Pad 全模式 |
|--|--|--|--|--|
| 一级 | 全屏：NavigationBar_ComponentSet_02 | 全屏：NavigationBar_ComponentSet_02 | 浮窗：FloatingWindow_ComponentSet_01 | 浮窗：FloatingWindow_ComponentSet_01 |
| 二级 | 全屏：NavigationBar_ComponentSet_02 | 全屏：NavigationBar_ComponentSet_02 | 浮窗：FloatingWindow_ComponentSet_02 | 浮窗：FloatingWindow_ComponentSet_02 |

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
| ManageFoldWindow / NLC | Sidebar_Component_Fold_LC_01（宽度定制 283dp） | Sidebar_Component_Fold_LC_01（宽度定制 283dp） | FloatingWindow_ComponentSet_01 | FloatingWindow_ComponentSet_01 | N栏：Sidebar_Component_PAD_NLC_01 | 不展示 | — | — | — | — | N栏：Sidebar_Component_PAD_NLC_01 | 不展示 | — | — |
| ManageFoldWindow / NL  | Sidebar_Component_Fold_LC_01（宽度定制 283dp） | Sidebar_Component_Fold_LC_01（宽度定制 283dp） | FloatingWindow_ComponentSet_01 | FloatingWindow_ComponentSet_01 | — | — | N栏：Sidebar_Component_PAD_NLC_01 | 不展示 | — | — | — | — | — | — |
| ManageFoldWindow / NC  | Sidebar_Component_Fold_LC_01（宽度定制 283dp） | Sidebar_Component_Fold_LC_01（宽度定制 283dp） | FloatingWindow_ComponentSet_01 | FloatingWindow_ComponentSet_01 | — | — | — | — | N栏：Sidebar_Component_PAD_NLC_01 文件夹列表 | 不展示 | — | — | N栏：Sidebar_Component_PAD_NLC_01 文件夹列表 | 不展示 |

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
| Pad 竖屏 NLC 展开 | N 栏（侧边栏）以 **覆盖** 形式叠加于 L+C 栏之上；被覆盖的 L+C 栏依「遮罩规则」展示遮罩 |
| Pad 横屏 NLC 展开 | N 栏与 LC **并列**，沿用 `device-dimensions.md` 通则，无遮罩 |
| Pad NLC / NL / NC 收起 | N 栏直接消失（见「N 收起规则」章节）；Pad 横屏 L/C 扩展吸收 N 宽度；Pad 竖屏 L/C 回归 LC 模式尺寸 |

## 遮罩规则

笔记和待办在 NLC / LC 模式下均适用以下遮罩规则。遮罩样式参见 `device-dimensions.md` 中的遮罩定义（遮罩色/mask，#000000，20%）。

| 触发条件 | 遮罩位置 |
|---------|---------|
| N 栏进入编辑模式 | L + C 栏全部覆盖遮罩 |
| L 栏进入编辑模式 | 仅 C 栏覆盖遮罩 |
| C 栏进入编辑模式 | 无遮罩 |

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
| 底部输入框 | TextInput_ComponentSet_Notes_01 | Q18 内屏：左20；右20；手机 / Q18 外屏：左16；右16 |
| 底部输入框 | TextInput_ComponentSet_Notes_02 | Q18 横屏：左116；右116；Q18 竖屏：左24；右24；手机 / Q18 外屏：左16；右16 |
| 底部输入框 | TextInput_ComponentSet_Notes_03 ~ 04 | Q18 横屏：左116；右116；Q18 竖屏：左24；右24；手机 / Q18 外屏：左16；右16 |
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
