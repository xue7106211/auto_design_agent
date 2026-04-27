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

| 子场景 | uiElement 前缀 | 说明 |
| --- | --- | --- |
| 笔记列表 | `笔记_` | 笔记列表浏览与管理 |
| 图文编辑 | `图文_` | 图文编辑模式 |

## 映射表

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `笔记_导航` | `Phone` | `L` | `variant` | `NavigationBar_ComponentSet_01` | 图文图标 |
| `笔记_导航` | `Fold外屏` | `L` | `variant` | `NavigationBar_ComponentSet_04` | 图文图标 |
| `笔记_导航` | `Fold内屏` | `LC` | `variant` | `NavigationBar_ComponentSet_04` | 图文图标 |
| `笔记_导航` | `Pad竖屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | L栏侧边栏 |
| `笔记_导航` | `Pad竖屏` | `C` | `variant` | `TopBar_05` | |
| `笔记_导航` | `Pad横屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | L栏侧边栏 |
| `笔记_导航` | `Pad横屏` | `C` | `variant` | `TopBar_05` | |
| `笔记_底部工具栏` | `Phone` | `L` | `variant` | `BottomBar_Showcase_Notes_01` | |
| `笔记_底部工具栏` | `Fold外屏` | `L` | `variant` | `BottomBar_Showcase_Notes_01` | |
| `笔记_底部工具栏` | `Fold内屏` | `LC` | `variant` | `BottomBar_Showcase_Notes_01` | L栏承载 |
| `笔记_底部工具栏` | `Pad竖屏` | `NLC` | `variant` | `BottomBar_Showcase_Notes_01` | L栏承载 |
| `笔记_底部工具栏` | `Pad竖屏` | `C` | `variant` | `BottomBar_Showcase_Notes_01` | |
| `笔记_底部工具栏` | `Pad横屏` | `NLC` | `variant` | `BottomBar_Showcase_Notes_01` | L栏承载 |
| `笔记_底部工具栏` | `Pad横屏` | `C` | `variant` | `BottomBar_Showcase_Notes_01` | |
| `图文_标题栏` | `Phone` | `L` | `variant` | `NavigationBar_ComponentSet_02` | 返回标题栏 |
| `图文_Fab` | `Phone` | `L` | `variant` | `Fab_01` |  |
| `图文_标题栏` | `Fold外屏` | `L` | `variant` | `NavigationBar_ComponentSet_02` |  |
| `图文_Fab` | `Fold外屏` | `L` | `variant` | `Fab_01` |  |
| `图文_标题栏` | `Fold内屏` | `NC` | `variant` | `NavigationBar_ComponentSet_02` | N面板承载 |
| `图文_Fab` | `Fold内屏` | `NC` | `absent` |  | 当前场景不显示 |
| `图文_标题栏` | `Fold内屏` | `LC` | `absent` |  | 当前场景不显示 |
| `图文_Fab` | `Fold内屏` | `LC` | `absent` |  | 当前场景不显示 |
| `图文_标题栏` | `Fold内屏` | `C` | `absent` |  | 当前场景不显示 |
| `图文_Fab` | `Fold内屏` | `C` | `variant` | `Fab_01` | C面板承载 |
| `图文_页面框架` | `Pad竖屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | N栏侧边栏骨架 |
| `图文_标题栏` | `Pad竖屏` | `NLC` | `absent` |  | 当前场景不显示 |
| `图文_Fab` | `Pad竖屏` | `NLC` | `absent` |  | 当前场景不显示 |
| `图文_页面框架` | `Pad竖屏` | `NC` | `absent` |  | 当前场景不使用 |
| `图文_页面框架` | `Pad竖屏` | `LC` | `absent` |  | 当前场景不使用 |
| `图文_页面框架` | `Pad竖屏` | `C` | `absent` |  | 当前场景不使用 |
| `图文_页面框架` | `Pad横屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | N栏侧边栏骨架 |
| `图文_标题栏` | `Pad横屏` | `NLC` | `absent` |  | 当前场景不显示 |
| `图文_Fab` | `Pad横屏` | `NLC` | `absent` |  | 当前场景不显示 |
| `图文_页面框架` | `Pad横屏` | `NC` | `absent` |  | 当前场景不使用 |
| `图文_页面框架` | `Pad横屏` | `LC` | `absent` |  | 当前场景不使用 |
| `图文_页面框架` | `Pad横屏` | `C` | `absent` |  | 当前场景不使用 |

| `笔记_标题栏` | `Phone` | `L` | `variant` | `NavigationBar_ComponentSet_01` | |
| `笔记_标题栏` | `Fold外屏` | `L` | `variant` | `NavigationBar_ComponentSet_04` | L栏 |
| `笔记_标题栏` | `Fold内屏` | `LC` | `variant` | `NavigationBar_ComponentSet_04` | L栏; C栏: NavigationBar_ComponentSet_Notes_01 |
| `笔记_标题栏` | `Pad竖屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_12` | N栏; L栏: _07; C栏: Notes_01 |
| `笔记_标题栏` | `Pad竖屏` | `C` | `absent` | | TopBar_05 标题栏（集成在导航组件内） |
| `笔记_标题栏` | `Pad横屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_12` | N栏; L栏: _07; C栏: Notes_01 |
| `笔记_标题栏` | `Pad横屏` | `C` | `absent` | | TopBar_05 标题栏（集成在导航组件内） |
| `图文_标题栏` | `Phone` | `L` | `variant` | `NavigationBar_ComponentSet_02` | |
| `图文_标题栏` | `Fold外屏` | `L` | `variant` | `NavigationBar_ComponentSet_05` | |
| `图文_标题栏` | `Fold内屏` | `LC` | `variant` | `NavigationBar_ComponentSet_05` | L栏; C栏: 无标题 |
| `图文_标题栏` | `Pad竖屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_12` | N栏; L栏: _07; C栏: 无标题 |
| `图文_标题栏` | `Pad竖屏` | `C` | `absent` | | TopBar_05 标题栏（集成在导航组件内） |
| `图文_标题栏` | `Pad横屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_12` | N栏; L栏: _07; C栏: 无标题 |
| `图文_标题栏` | `Pad横屏` | `C` | `absent` | | TopBar_05 标题栏（集成在导航组件内） |

## 当前覆盖缺口

以下内容仍未形成正式映射，后续补齐后建议直接追加到上表：

- Phone 横屏模式
- Fold 外屏横屏模式
- NLC收起模式下的映射
