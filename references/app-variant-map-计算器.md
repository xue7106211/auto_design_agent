---
name: app-variant-map
description: 计算器应用的语义组件在不同设备与屏幕模式下的目标变体映射表。
app: 计算器
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

> 本文档由 `figma-component-dictionary.md` 的 Step 1 按需加载。

# 计算器 App Variant Map

## 用途

根据 `appName + targetDevice + targetScreenMode + resolvedUiElement` 查出目标结果。

## 映射表

计算器全设备统一使用 `TopBar_01`，无导航栏/侧边栏切换。

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `导航_顶部导航` | `Phone` | `C` | `variant` | `TopBar_01` | |
| `导航_顶部导航` | `Fold外屏` | `C` | `variant` | `TopBar_01` | |
| `导航_顶部导航` | `Fold内屏` | `C` | `variant` | `TopBar_01` | |
| `导航_顶部导航` | `Pad竖屏` | `C` | `variant` | `TopBar_01` | |
| `导航_顶部导航` | `Pad横屏` | `C` | `variant` | `TopBar_01` | |
