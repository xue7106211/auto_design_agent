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
| `笔记_页面框架` | `Phone` | `L` | `variant` | `BottomBar_Showcase_Notes_01` | 手机全屏骨架 |
| `笔记_页面框架` | `Fold外屏` | `L` | `variant` | `BottomBar_Showcase_Notes_01` | 外屏沿用手机骨架 |
| `笔记_页面框架` | `Fold内屏` | `NC` | `absent` |  | 当前场景不使用 |
| `笔记_页面框架` | `Fold内屏` | `LC` | `variant` | `BottomBar_Showcase_Notes_01` | Fold 列表侧骨架 |
| `笔记_页面框架` | `Fold内屏` | `C` | `absent` |  | 当前场景不使用 |
| `笔记_页面框架` | `Pad竖屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | N栏侧边栏骨架 |
| `笔记_页面框架` | `Pad竖屏` | `NC` | `absent` |  | 当前场景不使用 |
| `笔记_页面框架` | `Pad竖屏` | `LC` | `absent` |  | 当前场景不使用 |
| `笔记_页面框架` | `Pad竖屏` | `C` | `absent` |  | 当前场景不使用 |
| `笔记_页面框架` | `Pad横屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | N栏侧边栏骨架 |
| `笔记_页面框架` | `Pad横屏` | `NC` | `absent` |  | 当前场景不使用 |
| `笔记_页面框架` | `Pad横屏` | `LC` | `absent` |  | 当前场景不使用 |
| `笔记_页面框架` | `Pad横屏` | `C` | `absent` |  | 当前场景不使用 |
| `笔记_底部导航` | `Phone` | `L` | `variant` | `BottomBar_Showcase_Notes_01` | Phone 竖屏 |
| `笔记_底部导航` | `Fold外屏` | `L` | `variant` | `BottomBar_Showcase_Notes_01` | 外屏竖屏沿用手机 |
| `笔记_底部导航` | `Fold内屏` | `NC` | `absent` |  | 当前场景不显示 |
| `笔记_底部导航` | `Fold内屏` | `LC` | `variant` | `BottomBar_Showcase_Notes_01` | L栏承载 |
| `笔记_底部导航` | `Fold内屏` | `C` | `absent` |  | 当前场景不显示 |
| `笔记_底部导航` | `Pad竖屏` | `NLC` | `absent` |  | 当前场景由侧边栏承载 |
| `笔记_底部导航` | `Pad竖屏` | `NC` | `absent` |  | 当前场景不显示 |
| `笔记_底部导航` | `Pad竖屏` | `LC` | `absent` |  | 当前场景不显示 |
| `笔记_底部导航` | `Pad竖屏` | `C` | `absent` |  | 当前场景不显示 |
| `笔记_底部导航` | `Pad横屏` | `NLC` | `absent` |  | 当前场景由侧边栏承载 |
| `笔记_底部导航` | `Pad横屏` | `NC` | `absent` |  | 当前场景不显示 |
| `笔记_底部导航` | `Pad横屏` | `LC` | `absent` |  | 当前场景不显示 |
| `笔记_底部导航` | `Pad横屏` | `C` | `absent` |  | 当前场景不显示 |
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

## 当前覆盖缺口

- `笔记_标题栏` 尚未建立组件级映射；后续需补齐 `Phone / Fold外屏 / Fold内屏 / Pad竖屏 / Pad横屏` 在各自有效 `screenMode` 下的真实 `variantId`
- `笔记_状态栏` 尚未建立组件级映射
- `笔记_底部导航` 已部分建档；当前已确认 `Phone / Fold外屏 / Fold内屏 LC` 使用 `BottomBar_Showcase_Notes_01`，其余模式待继续核对
- `笔记_侧边栏` 尚未建立组件级映射
- `笔记_搜索栏` 尚未建立组件级映射
- `笔记_标签栏` 尚未建立组件级映射
- `笔记_Fab` 尚未建立组件级映射
- `笔记` 场景当前仍以 `页面框架` 为主粒度；后续应逐步下钻为基础组件级条目
- `Phone` 横屏模式尚未建档
- `Fold外屏` 横屏模式尚未建档
- `NLC` 收起模式尚未建档
