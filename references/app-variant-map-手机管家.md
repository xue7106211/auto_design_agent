---
name: app-variant-map
description: 手机管家应用的语义组件在不同设备与屏幕模式下的目标变体映射表。
app: 手机管家
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

> 本文档由 `figma-component-dictionary.md` 的 Step 1 按需加载。

# 手机管家 App Variant Map

## 映射表

全设备无导航栏。

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `导航_页面框架` | `Phone` | `C` | `absent` | | 无导航栏 |
| `导航_页面框架` | `Fold外屏` | `C` | `absent` | | 无导航栏 |
| `导航_页面框架` | `Fold内屏` | `C` | `absent` | | 无导航栏 |
| `导航_页面框架` | `Pad竖屏` | `C` | `absent` | | 无导航栏 |
| `导航_页面框架` | `Pad横屏` | `C` | `absent` | | 无导航栏 |
| `标题栏` | `Phone` | `C` | `variant` | `NavigationBar_ComponentSet_10` | |
| `标题栏` | `Fold外屏` | `C` | `variant` | `NavigationBar_ComponentSet_15` | |
| `标题栏` | `Fold内屏` | `C` | `variant` | `NavigationBar_ComponentSet_15` | |
| `标题栏` | `Pad竖屏` | `C` | `variant` | `NavigationBar_ComponentSet_10` | |
| `标题栏` | `Pad横屏` | `C` | `variant` | `NavigationBar_ComponentSet_10` | |
