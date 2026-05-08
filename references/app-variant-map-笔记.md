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

## 映射表

### 笔记

| | 手机竖 | 手机横 | Fold外竖 | Fold外横 | Fold内竖NC | Fold内竖LC | Fold内竖C | Fold内横NC | Fold内横LC | Fold内横C | Pad竖NLC | Pad竖NLC收起 | Pad竖NC | Pad竖LC | Pad竖C | Pad横NLC | Pad横NLC收起 | Pad横NC | Pad横LC | Pad横C |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| 导航栏 | BottomBar_Showcase_00 | | BottomBar_Showcase_00 | | | L栏：BottomBar_Showcase_00 | | | L栏：BottomBar_Showcase_00 | | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_02 | | | | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_02 | | | |
| 标题栏 | NavigationBar_ComponentSet_01 | | NavigationBar_ComponentSet_04 | | | L栏：NavigationBar_ComponentSet_04；C栏：NavigationBar_ComponentSet_Notes_01 | | | L栏：NavigationBar_ComponentSet_04；C栏：NavigationBar_ComponentSet_Notes_01 | | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_14；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_Notes_01 | | | | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_14；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_Notes_01 | | | |
| 搜索 | SearchBar_ComponentSet_02 | | SearchBar_ComponentSet_02 | | | L栏：SearchBar_ComponentSet_02 | | | L栏：SearchBar_ComponentSet_02 | | L栏：NavigationBar_ComponentSet_07 搜索图标 | L栏：NavigationBar_ComponentSet_07 搜索图标 | | | | L栏：NavigationBar_ComponentSet_07 搜索图标 | L栏：NavigationBar_ComponentSet_07 搜索图标 | | | |
| 标签栏 | SelectableChip_ComponentSet_Notes_01 | | SelectableChip_ComponentSet_Notes_01 | | | L栏：SelectableChip_ComponentSet_Notes_02 | | | L栏：SelectableChip_ComponentSet_Notes_02 | | N栏：Sidebar_Component_PAD_NLC_01 文件夹列表 | 不展示 | | | 不展示 | N栏：Sidebar_Component_PAD_NLC_01 文件夹列表 | 不展示 | | | 不展示 |
| 列表 | List_Notes_01 | | List_Notes_01 | | | L栏：List_Notes_03 | | | L栏：List_Notes_03 | | L栏：List_Notes_03 | L栏：List_Notes_03 | | | | L栏：List_Notes_03 | L栏：List_Notes_03 | | | |
| | List_Notes_02 | | List_Notes_02 | | | L栏：List_Notes_04 | | | L栏：List_Notes_04 | | L栏：List_Notes_04 | L栏：List_Notes_04 | | | | L栏：List_Notes_04 | L栏：List_Notes_04 | | | |
| | List_Notes_05 | | List_Notes_05 | | | L栏：List_Notes_03 | | | L栏：List_Notes_03 | | L栏：List_Notes_03 | L栏：List_Notes_03 | | | | L栏：List_Notes_03 | L栏：List_Notes_03 | | | |
| | List_Notes_06 | | List_Notes_06 | | | L栏：List_Notes_04 | | | L栏：List_Notes_04 | | L栏：List_Notes_04 | L栏：List_Notes_04 | | | | L栏：List_Notes_04 | L栏：List_Notes_04 | | | |
| 底部工具栏 | BottomBar_Showcase_Notes_01 | | BottomBar_Showcase_Notes_01 | | | L栏：BottomBar_Showcase_Notes_01 | | | L栏：BottomBar_Showcase_Notes_01 | | L栏：BottomBar_Showcase_Notes_01 | L栏：BottomBar_Showcase_Notes_01 | | | | L栏：BottomBar_Showcase_Notes_01 | L栏：BottomBar_Showcase_Notes_01 | | | |
| 文字格式弹窗 | TextFormatPanel_01 | | TextFormatPanel_01 | | | C栏：TextFormatPanel_02 | | | C栏：TextFormatPanel_01 | | C栏：TextFormatPanel_01 | C栏：TextFormatPanel_01 | | | | C栏：TextFormatPanel_01 | C栏：TextFormatPanel_01 | | | |

### 待办

| | 手机竖 | 手机横 | Fold外竖 | Fold外横 | Fold内竖NC | Fold内竖LC | Fold内竖C | Fold内横NC | Fold内横LC | Fold内横C | Pad竖NLC | Pad竖NLC收起 | Pad竖NC | Pad竖LC | Pad竖C | Pad横NLC | Pad横NLC收起 | Pad横NC | Pad横LC | Pad横C |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| 导航栏 | BottomBar_Showcase_00 | | BottomBar_Showcase_00 | | | L栏：BottomBar_Showcase_00 | | | L栏：BottomBar_Showcase_00 | | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_02 | | | | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_02 | | | |
| 标题栏 | NavigationBar_ComponentSet_02 | | NavigationBar_ComponentSet_05 | | | L栏：NavigationBar_ComponentSet_05；C栏：无标题 | | | L栏：NavigationBar_ComponentSet_05；C栏：无标题 | | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：无标题 | N栏：NavigationBar_ComponentSet_14；L栏：NavigationBar_ComponentSet_07；C栏：无标题 | | | | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：无标题 | N栏：NavigationBar_ComponentSet_14；L栏：NavigationBar_ComponentSet_07；C栏：无标题 | | | |
| 搜索 | SearchBar_ComponentSet_02 | | SearchBar_ComponentSet_02 | | | L栏：SearchBar_ComponentSet_02 | | | L栏：SearchBar_ComponentSet_02 | | L栏：NavigationBar_ComponentSet_07 搜索图标 | L栏：NavigationBar_ComponentSet_07 搜索图标 | | | | L栏：NavigationBar_ComponentSet_07 搜索图标 | L栏：NavigationBar_ComponentSet_07 搜索图标 | | | |
| 标签栏 | SelectableChip_ComponentSet_Notes_01 | | SelectableChip_ComponentSet_Notes_01 | | | L栏：SelectableChip_ComponentSet_Notes_01 | | | L栏：SelectableChip_ComponentSet_Notes_01 | | N栏：Sidebar_Component_PAD_NLC_01 待办列表 | 不展示 | | | 不展示 | N栏：Sidebar_Component_PAD_NLC_01 待办列表 | 不展示 | | | 不展示 |
| 列表 | List_Task_01 | | List_Task_01 | | | List_Task_03 | | | List_Task_03 | | List_Task_03 | List_Task_03 | | | | List_Task_03 | List_Task_03 | | | |
| | List_Task_02 | | List_Task_02 | | | List_Task_04 | | | List_Task_04 | | List_Task_04 | List_Task_04 | | | | List_Task_04 | List_Task_04 | | | |
| Fab | Fab_01；彩色 | | Fab_01；彩色 | | | C栏：Fab_01；彩色 | | | C栏：Fab_01；彩色 | | C栏：Fab_01；彩色 | C栏：Fab_01；彩色 | | | Fab_01；彩色 | C栏：Fab_01；彩色 | C栏：Fab_01；彩色 | | | Fab_01；彩色 |

## 浮层

浮层容器（浮窗 / 抽屉 / 弹窗 / 菜单）的尺寸、位置、遮罩、背景色规范统一位于 `layouts/device-dimensions.md` 的「浮层规格」小节。本节只记录 **笔记应用在各设备 / screenMode 下要调用哪个 variant**，不重复规格。

来源：结构变化表——总表（`笔记 Notes` 行块，2026-05-06 版）。

### 文件夹管理窗口 ManageFoldWindow

Fold 内屏上该容器覆盖整屏，不按 NC / LC / C 分栏；Pad 上仍附着于 L 栏。

| | 手机竖 | Fold外竖 | Fold内竖 全模式 | Fold内横 全模式 | Pad竖NLC | Pad竖NLC收起 | Pad横NLC | Pad横NLC收起 |
|--|--|--|--|--|--|--|--|--|
| variant | `Sidebar_Component_Fold_LC_01`（宽度定制 283dp） | `Sidebar_Component_Fold_LC_01`（宽度定制 283dp） | `FloatingWindow_ComponentSet_01` | `FloatingWindow_ComponentSet_01` | L栏：`Sidebar_Component_PAD_NLC_01` 文件夹列表 | 不展示 | L栏：`Sidebar_Component_PAD_NLC_01` 文件夹列表 | 不展示 |

### 抽屉窗口 / 浮窗 FloatingWindow

| | 手机竖 | Fold外竖 | Fold内 全模式 | Pad竖NLC | Pad横NLC |
|--|--|--|--|--|--|
| variant | `DrawerWindow_ComponentSet_high_01` | `DrawerWindow_ComponentSet_high_01` | `FloatingWindow_ComponentSet_01` | `FloatingWindow_ComponentSet_01` | `FloatingWindow_ComponentSet_01` |

### 弹窗 Dialog

| | 全设备 / 全 screenMode |
|--|--|
| variant | `AlertDialog_ComponentSet_01` |

### 行动操作按钮 ActionSheet

底部对齐的浮层，规格（宽度、位置）参见 `device-dimensions.md` 的「浮层规格」小节。

| | 全设备 / 全 screenMode |
|--|--|
| variant | `Actionsheet_ComponentSet_01` |

### 分段按钮 Segmented Controls

仅在浮窗 / 抽屉内部使用（如 录音详情的「总结 / 原文」切换），不作为独立浮层。全设备 / 全 screenMode 统一使用同一 variant。

| | 全设备 / 全 screenMode |
|--|--|
| variant | `SegmentedControls-ComponentSet_01` |

### 选择器 Picker

日期 / 时间选择的浮层容器，规格（宽度、位置）参见 `device-dimensions.md` 的「浮层规格」小节。

| | 全设备 / 全 screenMode |
|--|--|
| variant | `WheelPicker_ComponentSet_01` |

### 滚动条 Scrollbar

各栏内容区均可按需挂载；全设备 / 全 screenMode 统一使用同一 variant。Pad NLC 收起态下 N 栏不展示滚动条。

| | 全设备 / 全 screenMode |
|--|--|
| variant | `Scrollbar_ComponentSet_01` |
| 例外 | Pad NLC 收起 → N 栏不展示 |

### 菜单 Menu

| | 手机竖 | Fold外竖 | Fold内竖LC | Fold内横LC | Pad竖NLC | Pad竖NLC收起 | Pad横NLC | Pad横NLC收起 |
|--|--|--|--|--|--|--|--|--|
| variant | `Menu_ComponentSet_03` | `Menu_ComponentSet_03` | L栏：`Menu_ComponentSet_03` | L栏：`Menu_ComponentSet_03` | N栏：搜索图标对应到 `NavigationBar_ComponentSet_12` 中的设置图标；L栏：其他菜单项对应到 `Menu_ComponentSet_03` | N栏：不展示；L栏：其他菜单项对应到 `Menu_ComponentSet_03` | N栏：搜索图标对应到 `NavigationBar_ComponentSet_12` 中的设置图标；L栏：其他菜单项对应到 `Menu_ComponentSet_03` | N栏：不展示；L栏：其他菜单项对应到 `Menu_ComponentSet_03` |

## 遮罩规则

笔记和待办在 NLC / LC 模式下均适用以下遮罩规则。遮罩样式参见 `device-dimensions.md` 中的遮罩定义（遮罩色/mask，#000000，20%）。

| 触发条件 | 遮罩位置 |
|---------|---------|
| N 栏进入编辑模式 | L + C 栏全部覆盖遮罩 |
| L 栏进入编辑模式 | 仅 C 栏覆盖遮罩 |
| C 栏进入编辑模式 | 无遮罩 |

## 组件间距

| 组件 | variantId | Space |
|------|-----------|-------|
| 导航栏 | NavigationBar_ComponentSet_01 | 左12；右12；标题左侧：28 |
| 导航栏 | NavigationBar_ComponentSet_02 | 左12；右12；标题左侧：28 |
| 导航栏 | NavigationBar_ComponentSet_04 | 左12；右12；标题左侧：28 |
| 导航栏 | NavigationBar_ComponentSet_05 | 左12；右12；标题左侧：28 |
| 导航栏 | NavigationBar_ComponentSet_07 | 左12；右12 |
| 导航栏 | NavigationBar_ComponentSet_12 | 左12；右12 |
| 导航栏 | NavigationBar_ComponentSet_14 | 左12；右12 |
| 导航栏 | NavigationBar_ComponentSet_Notes_01 | 左12；右12 |
| 搜索 | SearchBar_ComponentSet_02 | 左12；右12 |
| 标签栏 | SelectableChip_ComponentSet_Notes_01 | 左12 |
| 标签栏 | SelectableChip_ComponentSet_Notes_02 | 左12 |
| 底部工具栏 | BottomBar_Showcase_Notes_01 | 最小：左24；右24 |
| Fab | Fab_01 | 右24 |
| 侧边栏 | Sidebar_Component_PAD_NLC_01 | 侧边栏组件左侧：12；侧边栏组件内：左12；右12 |
| 侧边栏 | Sidebar_Component_PAD_NLC_02 | 侧边栏组件左侧：12；侧边栏组件内：左12；右12 |
| 文字格式弹窗 | TextFormatPanel_01 | 最小：左12；右12 |
| 分段按钮 | SegmentedControls-ComponentSet_01 | 左12；右12 |
| 选择器 | WheelPicker_ComponentSet_01 | 定宽 368；最小左右 padding 12；底部：有控制杆→距控制杆顶沿 12dp，无控制杆→距屏幕底部 12dp；Pad：上下居中 |
| 弹窗 | AlertDialog_ComponentSet_01 | 定宽 368；最小左右 padding 12；底部：有控制杆→距控制杆顶沿 12dp，无控制杆→距屏幕底部 12dp；Pad：上下居中 |
| 行动操作按钮 | Actionsheet_ComponentSet_01 | 定宽 368；最小左右 padding 12；底部：有控制杆→距控制杆顶沿 12dp，无控制杆→距屏幕底部 12dp |
| 滚动条 | Scrollbar_ComponentSet_01 | 右 0 |
| 文字格式弹窗 | TextFormatPanel_02 | 最小：左12；右12 |
| 列表 | List_Notes_01 ~ 06 | 左12；右12 |
| 列表 | List_Task_01 ~ 04 | 左12；右12 |

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
| NLC 收起 | 背景色/surface | 背景色/surface | 背景色/surface |
| NC | 不存在 | 不存在 | 不存在 |
| LC | 不存在 | 不存在 | 不存在 |
| C | 不存在 | 不存在 | 背景色/surface_low |

### Pad — 横屏

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NLC | 背景色/surface | 背景色/surface | 背景色/surface |
| NLC 收起 | 背景色/surface | 背景色/surface | 背景色/surface |
| NC | 不存在 | 不存在 | 不存在 |
| LC | 不存在 | 不存在 | 不存在 |
| C | 不存在 | 不存在 | 背景色/surface_low |

## 当前覆盖缺口

以下内容仍未形成正式映射，后续补齐后建议直接追加到上表：

- Phone 横屏模式
- Fold 外屏横屏模式
