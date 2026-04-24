---
name: app-variant-map
description: 设置应用的语义组件在不同设备与屏幕模式下的目标变体映射表。
app: 设置
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

> 本文档由 `figma-component-dictionary.md` 的 Step 1 按需加载。

# 设置 App Variant Map

## 映射表

设置为 LC 布局应用，Phone/Fold外屏无导航栏，Fold内屏/Pad 使用 LC 栏。

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `导航_页面框架` | `Phone` | `L` | `absent` | | 无导航栏 |
| `导航_页面框架` | `Fold外屏` | `L` | `absent` | | 无导航栏 |
| `导航_页面框架` | `Fold内屏` | `LC` | `absent` | | LC栏; 具体组件待定义 |
| `导航_页面框架` | `Pad竖屏` | `LC` | `absent` | | LC栏; 具体组件待定义 |
| `导航_页面框架` | `Pad横屏` | `LC` | `absent` | | LC栏; 具体组件待定义 |
| `搜索` | `Phone` | `L` | `variant` | `SearchBar_ComponentSet_02` | |
| `搜索` | `Fold外屏` | `L` | `variant` | `SearchBar_ComponentSet_02` | |
| `搜索` | `Fold内屏` | `LC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `搜索` | `Pad竖屏` | `LC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `搜索` | `Pad横屏` | `LC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
