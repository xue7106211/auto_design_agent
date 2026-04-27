---
name: app-variant-map
description: 图库应用的语义组件在不同设备与屏幕模式下的目标变体映射表。
app: 图库
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

> 本文档由 `figma-component-dictionary.md` 的 Step 1 按需加载。

# 图库 App Variant Map

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
| `LC` | List + Content 复合画面 |
| `NLC` | Navigation + List + Content 三栏 |
| `NLC收起` | NLC 侧边栏收起 |

### `resultType`

| 值 | 含义 |
| --- | --- |
| `variant` | 命中真实 `variantId` |
| `hidden` | 元素保留语义但当前场景不显示 |
| `absent` | 该场景下无此元素 |
| `undefined` | 尚未建档，调用方必须中止 |

## 映射表

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `导航` | `Phone` | `L` | `variant` | `NavigationBar_ComponentSet_02` | |
| `导航` | `Fold外屏` | `L` | `variant` | `NavigationBar_ComponentSet_05` | |
| `导航` | `Fold内屏` | `LC` | `variant` | `NavigationBar_ComponentSet_05` | L栏 |
| `导航` | `Pad竖屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | N栏 |
| `导航` | `Pad竖屏` | `C` | `variant` | `TopBar_05` | |
| `导航` | `Pad横屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | N栏 |
| `导航` | `Pad横屏` | `C` | `variant` | `TopBar_05` | |
| `标题栏` | `Phone` | `L` | `variant` | `NavigationBar_ComponentSet_02` | |
| `标题栏` | `Fold外屏` | `L` | `variant` | `NavigationBar_ComponentSet_05` | |
| `标题栏` | `Fold内屏` | `LC` | `variant` | `NavigationBar_ComponentSet_05` | L栏; C栏: 无标题 |
| `标题栏` | `Pad竖屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_12` | N栏; L栏: NavigationBar_ComponentSet_07; C栏: 无标题 |
| `标题栏` | `Pad竖屏` | `C` | `absent` | | TopBar_05 标题栏（集成在导航组件内） |
| `标题栏` | `Pad横屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_12` | N栏; L栏: NavigationBar_ComponentSet_07; C栏: 无标题 |
| `标题栏` | `Pad横屏` | `C` | `absent` | | TopBar_05 标题栏（集成在导航组件内） |
| `搜索` | `Phone` | `L` | `variant` | `SearchBar_ComponentSet_02` | |
| `搜索` | `Fold外屏` | `L` | `variant` | `SearchBar_ComponentSet_02` | |
| `搜索` | `Fold内屏` | `LC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `搜索` | `Pad竖屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_07` | L栏搜索图标 |
| `搜索` | `Pad竖屏` | `C` | `absent` | | TopBar_05 搜索栏（集成在导航组件内） |
| `搜索` | `Pad横屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_07` | L栏搜索图标 |
| `搜索` | `Pad横屏` | `C` | `absent` | | TopBar_05 搜索栏（集成在导航组件内） |
| `标签栏` | `Phone` | `L` | `variant` | `SelectableChip_ComponentSet_Notes_01` | |
| `标签栏` | `Fold外屏` | `L` | `variant` | `SelectableChip_ComponentSet_Notes_01` | |
| `标签栏` | `Fold内屏` | `LC` | `variant` | `SelectableChip_ComponentSet_Notes_01` | L栏 |
| `标签栏` | `Pad竖屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_12` | N栏图库列表 |
| `标签栏` | `Pad竖屏` | `NLC收起` | `hidden` | | 侧边栏隐藏；不展示 NavigationBar_ComponentSet_12 文件夹列表 |
| `标签栏` | `Pad横屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_12` | N栏图库列表 |
| `标签栏` | `Pad横屏` | `NLC收起` | `hidden` | | 侧边栏隐藏；不展示 NavigationBar_ComponentSet_12 文件夹列表 |
| `Fab` | `Phone` | `L` | `variant` | `Fab_01` | 彩色 |
| `Fab` | `Fold外屏` | `L` | `variant` | `Fab_01` | 彩色 |
| `Fab` | `Fold内屏` | `LC` | `variant` | `Fab_01` | C栏; 彩色 |
| `Fab` | `Pad竖屏` | `NLC` | `variant` | `Fab_01` | C栏; 彩色 |
| `Fab` | `Pad竖屏` | `C` | `variant` | `Fab_01` | 彩色 |
| `Fab` | `Pad横屏` | `NLC` | `variant` | `Fab_01` | C栏; 彩色 |
| `Fab` | `Pad横屏` | `C` | `variant` | `Fab_01` | 彩色 |
