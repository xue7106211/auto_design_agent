---
name: app-variant-map
description: 联系人应用的语义组件在不同设备与屏幕模式下的目标变体映射表。包含通用联系人和 Pad 端联系人子场景。
app: 联系人
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

> 本文档由 `figma-component-dictionary.md` 的 Step 1 按需加载。

# 联系人 App Variant Map

## 子场景说明

| 子场景 | 说明 |
|--------|------|
| 联系人 | 全设备通用 |
| Pad端联系人 | 仅 Pad 竖屏/横屏，LC 布局 |

## 映射表

### 联系人

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `导航` | `Phone` | `L` | `variant` | `BottomBar_Showcase_Fab_01` | |
| `导航` | `Fold外屏` | `L` | `variant` | `BottomBar_Showcase_Fab_01` | |
| `导航` | `Fold内屏` | `LC` | `variant` | `BottomBar_Showcase_02` | L栏 |
| `导航` | `Pad竖屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | N栏 |
| `导航` | `Pad竖屏` | `NLC收起` | `variant` | `Sidebar_Component_PAD_NLC_02` | N栏收起 |
| `导航` | `Pad横屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | N栏 |
| `导航` | `Pad横屏` | `NLC收起` | `variant` | `Sidebar_Component_PAD_NLC_02` | N栏收起 |
| `搜索` | `Phone` | `L` | `variant` | `SearchBar_ComponentSet_02` | |
| `搜索` | `Fold外屏` | `L` | `variant` | `SearchBar_ComponentSet_02` | |
| `搜索` | `Fold内屏` | `LC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `搜索` | `Pad竖屏` | `NLC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `搜索` | `Pad竖屏` | `NLC收起` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `搜索` | `Pad横屏` | `NLC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `搜索` | `Pad横屏` | `NLC收起` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `Fab` | `Phone` | `L` | `variant` | `Fab_01` | 彩色 |
| `Fab` | `Fold外屏` | `L` | `variant` | `Fab_01` | 彩色 |
| `Fab` | `Fold内屏` | `LC` | `variant` | `Fab_01` | C栏; 彩色 |
| `Fab` | `Pad竖屏` | `NLC` | `absent` | | L栏: 标题栏新建图标 |
| `Fab` | `Pad竖屏` | `NLC收起` | `absent` | | L栏: 标题栏新建图标 |
| `Fab` | `Pad横屏` | `NLC` | `absent` | | L栏: 标题栏新建图标 |
| `Fab` | `Pad横屏` | `NLC收起` | `absent` | | L栏: 标题栏新建图标 |

### Pad端联系人

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `导航` | `Pad竖屏` | `LC` | `absent` | | LC栏; 具体组件待定义 |
| `导航` | `Pad横屏` | `LC` | `absent` | | LC栏; 具体组件待定义 |
| `搜索` | `Pad竖屏` | `LC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `搜索` | `Pad横屏` | `LC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
