---
name: app-variant-map
description: 短信应用的语义组件在不同设备与屏幕模式下的目标变体映射表。
app: 短信
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

> 本文档由 `figma-component-dictionary.md` 的 Step 1 按需加载。

# 短信 App Variant Map

## 映射表

短信为 LC 布局应用，Phone/Fold外屏无导航栏。

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `导航` | `Phone` | `L` | `absent` | | 无导航栏 |
| `导航` | `Fold外屏` | `L` | `absent` | | 无导航栏 |
| `导航` | `Fold内屏` | `LC` | `absent` | | LC栏; 具体组件待定义 |
| `导航` | `Pad竖屏` | `LC` | `absent` | | LC栏; 具体组件待定义 |
| `导航` | `Pad横屏` | `LC` | `absent` | | LC栏; 具体组件待定义 |
| `搜索` | `Phone` | `L` | `variant` | `SearchBar_ComponentSet_02` | |
| `搜索` | `Fold外屏` | `L` | `variant` | `SearchBar_ComponentSet_02` | |
| `搜索` | `Fold内屏` | `LC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `搜索` | `Pad竖屏` | `LC` | `absent` | | L栏: 标题栏新建图标 |
| `搜索` | `Pad横屏` | `LC` | `absent` | | L栏: 标题栏新建图标 |
| `Fab` | `Phone` | `L` | `variant` | `Fab_01` | 彩色 |
| `Fab` | `Fold外屏` | `L` | `variant` | `Fab_01` | 彩色 |
| `Fab` | `Fold内屏` | `LC` | `variant` | `Fab_01` | L栏; 彩色 |
| `Fab` | `Pad竖屏` | `LC` | `absent` | | L栏: 标题栏新建图标 |
| `Fab` | `Pad横屏` | `LC` | `absent` | | L栏: 标题栏新建图标 |
