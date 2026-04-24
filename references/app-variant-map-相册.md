---
name: app-variant-map
description: 相册应用的语义组件在不同设备与屏幕模式下的目标变体映射表。
app: 相册
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

> 本文档由 `figma-component-dictionary.md` 的 Step 1 按需加载。

# 相册 App Variant Map

## 映射表

相册支持横屏，且横屏使用不同变体。

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `导航` | `Phone` | `L` | `variant` | `BottomBar_Showcase_Fab_01` | 竖屏 |
| `导航` | `Phone横` | `L` | `variant` | `BottomBar_Showcase_Fab_02` | 横屏 |
| `导航` | `Fold外屏` | `L` | `variant` | `BottomBar_Showcase_Fab_01` | 竖屏 |
| `导航` | `Fold外屏横` | `L` | `variant` | `BottomBar_Showcase_Fab_02` | 横屏 |
| `导航` | `Fold内屏` | `C` | `variant` | `BottomBar_Showcase_Fab_01` | 竖屏 |
| `导航` | `Fold内屏横` | `C` | `variant` | `BottomBar_Showcase_Fab_02` | 横屏 |
| `导航` | `Pad竖屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | |
| `导航` | `Pad竖屏` | `C` | `variant` | `TopBar_01` | |
| `导航` | `Pad横屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | |
| `导航` | `Pad横屏` | `C` | `variant` | `TopBar_01` | |
| `搜索入口` | `Phone` | `L` | `variant` | `Fab_01` | 白色FAB |
| `搜索入口` | `Phone横` | `L` | `variant` | `Fab_01` | 白色FAB |
| `搜索入口` | `Fold外屏` | `L` | `variant` | `Fab_01` | 白色FAB |
| `搜索入口` | `Fold外屏横` | `L` | `variant` | `Fab_01` | 白色FAB |
| `搜索入口` | `Fold内屏` | `C` | `variant` | `Fab_01` | 白色FAB |
| `搜索入口` | `Fold内屏横` | `C` | `variant` | `Fab_01` | 白色FAB |
| `搜索入口` | `Pad竖屏` | `NC` | `absent` | | C栏: NavigationBar_ComponentSet_07 搜索图标 |
| `搜索入口` | `Pad竖屏` | `C` | `absent` | | TopBar_01 搜索图标 |
| `搜索入口` | `Pad横屏` | `NC` | `absent` | | C栏: NavigationBar_ComponentSet_07 搜索图标 |
| `搜索入口` | `Pad横屏` | `C` | `absent` | | TopBar_01 搜索图标 |
