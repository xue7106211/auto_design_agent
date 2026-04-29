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
| 导航栏 | NavigationBar_ComponentSet_01 待办图标 | | NavigationBar_ComponentSet_04 待办图标 | | | NavigationBar_ComponentSet_04 待办图标 | | | NavigationBar_ComponentSet_04 待办图标 | | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_02 | | | | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_02 | | | |
| 标题栏 | NavigationBar_ComponentSet_01 | | L栏：NavigationBar_ComponentSet_04 | | | L栏：NavigationBar_ComponentSet_04；C栏：NavigationBar_ComponentSet_Notes_01 | | | L栏：NavigationBar_ComponentSet_04；C栏：NavigationBar_ComponentSet_Notes_01 | | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_14；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_Notes_01 | | | | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_Notes_01 | N栏：NavigationBar_ComponentSet_14；L栏：NavigationBar_ComponentSet_07；C栏：NavigationBar_ComponentSet_Notes_01 | | | |
| 搜索 | SearchBar_ComponentSet_02 | | SearchBar_ComponentSet_02 | | | L栏：SearchBar_ComponentSet_02 | | | L栏：SearchBar_ComponentSet_02 | | L栏：NavigationBar_ComponentSet_07 搜索图标 | L栏：NavigationBar_ComponentSet_07 搜索图标 | | | | L栏：NavigationBar_ComponentSet_07 搜索图标 | L栏：NavigationBar_ComponentSet_07 搜索图标 | | | |
| 标签栏 | SelectableChip_ComponentSet_Notes_01 | | SelectableChip_ComponentSet_Notes_01 | | | L栏：SelectableChip_ComponentSet_Notes_01 | | | L栏：SelectableChip_ComponentSet_Notes_01 | | N栏：Sidebar_Component_PAD_NLC_01 文件夹列表 | 不展示 | | | 不展示 | N栏：Sidebar_Component_PAD_NLC_01 文件夹列表 | 不展示 | | | 不展示 |
| 底部工具栏 | BottomBar_Showcase_Notes_01 | | BottomBar_Showcase_Notes_01 | | | L栏：BottomBar_Showcase_Notes_01 | | | L栏：BottomBar_Showcase_Notes_01 | | L栏：BottomBar_Showcase_Notes_01 | L栏：BottomBar_Showcase_Notes_01 | | | | L栏：BottomBar_Showcase_Notes_01 | L栏：BottomBar_Showcase_Notes_01 | | | |

### 待办

| | 手机竖 | 手机横 | Fold外竖 | Fold外横 | Fold内竖NC | Fold内竖LC | Fold内竖C | Fold内横NC | Fold内横LC | Fold内横C | Pad竖NLC | Pad竖NLC收起 | Pad竖NC | Pad竖LC | Pad竖C | Pad横NLC | Pad横NLC收起 | Pad横NC | Pad横LC | Pad横C |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| 导航栏 | NavigationBar_ComponentSet_02 | | NavigationBar_ComponentSet_05 | | | L栏：NavigationBar_ComponentSet_05 | | | L栏：NavigationBar_ComponentSet_05 | | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_02 | | | | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_02 | | | |
| 标题栏 | NavigationBar_ComponentSet_02 | | NavigationBar_ComponentSet_05 | | | L栏：NavigationBar_ComponentSet_05；C栏：无标题 | | | L栏：NavigationBar_ComponentSet_05；C栏：无标题 | | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：无标题 | N栏：NavigationBar_ComponentSet_14；L栏：NavigationBar_ComponentSet_07；C栏：无标题 | | | | N栏：NavigationBar_ComponentSet_12；L栏：NavigationBar_ComponentSet_07；C栏：无标题 | N栏：NavigationBar_ComponentSet_14；L栏：NavigationBar_ComponentSet_07；C栏：无标题 | | | |
| 搜索 | SearchBar_ComponentSet_02 | | SearchBar_ComponentSet_02 | | | L栏：SearchBar_ComponentSet_02 | | | L栏：SearchBar_ComponentSet_02 | | L栏：NavigationBar_ComponentSet_07 搜索图标 | L栏：NavigationBar_ComponentSet_07 搜索图标 | | | | L栏：NavigationBar_ComponentSet_07 搜索图标 | L栏：NavigationBar_ComponentSet_07 搜索图标 | | | |
| 标签栏 | SelectableChip_ComponentSet_Notes_01 | | SelectableChip_ComponentSet_Notes_01 | | | L栏：SelectableChip_ComponentSet_Notes_01 | | | L栏：SelectableChip_ComponentSet_Notes_01 | | N栏：Sidebar_Component_PAD_NLC_01 待办列表 | 不展示 | | | 不展示 | N栏：Sidebar_Component_PAD_NLC_01 待办列表 | 不展示 | | | 不展示 |
| Fab | Fab_01；彩色 | | Fab_01；彩色 | | | C栏：Fab_01；彩色 | | | C栏：Fab_01；彩色 | | C栏：Fab_01；彩色 | C栏：Fab_01；彩色 | | | Fab_01；彩色 | C栏：Fab_01；彩色 | C栏：Fab_01；彩色 | | | Fab_01；彩色 |

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
