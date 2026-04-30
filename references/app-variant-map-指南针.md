---
name: app-variant-map
description: 指南针应用的语义组件在不同设备与屏幕模式下的目标变体映射表。
app: 指南针
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

> 本文档由 `figma-component-dictionary.md` 的 Step 1 按需加载。

# 指南针 App Variant Map

## 映射表

> 指南针应用使用 **dark mode** 颜色 token。

| | 手机竖 | 手机横 | Fold外竖 | Fold外横 | Fold内竖NC | Fold内竖LC | Fold内竖C | Fold内横NC | Fold内横LC | Fold内横C | Pad竖NLC | Pad竖NLC收起 | Pad竖NC | Pad竖LC | Pad竖C | Pad横NLC | Pad横NLC收起 | Pad横NC | Pad横LC | Pad横C |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| 导航栏 | BottomBar_Showcase_01 | | BottomBar_Showcase_01 | | | | BottomBar_Showcase_01 | | | 不存在 | | | | | 不存在 | | | | | 不存在 |
| 标题栏 | NavigationBar_ComponentSet_10 | | NavigationBar_ComponentSet_10 | | | | NavigationBar_ComponentSet_10 | | | 不存在 | | | | | 不存在 | | | | | 不存在 |

## 组件间距

| 组件 | variantId | Space |
|------|-----------|-------|
| 导航栏 | BottomBar_Showcase_01 | 最小弹：左24；右24 |
| 标题栏 | NavigationBar_ComponentSet_10 | 左12；右12 |

## 栏背景色

> 指南针应用默认使用 dark mode。颜色 token 名称与 light mode 相同（如 背景色/surface、背景色/surface_low），但系统会自动切换为 dark mode 下的对应色值。

### 手机

| screenMode | 背景色 |
|-----------|-------|
| 竖屏 | 背景色/surface（dark mode） |
| 横屏 | 待定 |

### Fold Q18 — 外屏

| screenMode | 背景色 |
|-----------|-------|
| 竖屏 | 背景色/surface（dark mode） |
| 横屏 | 待定 |

### Fold Q18 — 内屏 / 竖屏

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NC | 不存在 | 不存在 | 不存在 |
| LC | 不存在 | 不存在 | 不存在 |
| C | 不存在 | 不存在 | 背景色/surface（dark mode） |

### Fold Q18 — 内屏 / 横屏

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NC | 不存在 | 不存在 | 不存在 |
| LC | 不存在 | 不存在 | 不存在 |
| C | 不存在 | 不存在 | 不存在 |

### Pad — 竖屏

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NLC | 不存在 | 不存在 | 不存在 |
| NLC 收起 | 不存在 | 不存在 | 不存在 |
| NC | 不存在 | 不存在 | 不存在 |
| LC | 不存在 | 不存在 | 不存在 |
| C | 不存在 | 不存在 | 不存在 |

### Pad — 横屏

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NLC | 不存在 | 不存在 | 不存在 |
| NLC 收起 | 不存在 | 不存在 | 不存在 |
| NC | 不存在 | 不存在 | 不存在 |
| LC | 不存在 | 不存在 | 不存在 |
| C | 不存在 | 不存在 | 不存在 |

## 当前覆盖缺口

- 手机横屏模式
- Fold 外屏横屏模式
