---
name: app-variant-map
description: 录音应用的语义组件在不同设备与屏幕模式下的目标变体映射表。
app: 录音
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

> 本文档由 `figma-component-dictionary.md` 的 Step 1 按需加载。

# 录音 App Variant Map

## 映射表

| | 手机竖 | 手机横 | Fold外竖 | Fold外横 | Fold内竖NC | Fold内竖LC | Fold内竖C | Fold内横NC | Fold内横LC | Fold内横C | Pad竖NLC | Pad竖NLC收起 | Pad竖NC | Pad竖LC | Pad竖C | Pad横NLC | Pad横NLC收起 | Pad横NC | Pad横LC | Pad横C |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| 导航栏 | 无导航栏 | | 无导航栏 | | | L栏：Sidebar_Component_Fold_LC_Fab_01 | | | L栏：Sidebar_Component_Fold_LC_Fab_01 | | | | | L栏：Sidebar_Component_PAD_LC_Fab_01 | | | | | L栏：Sidebar_Component_PAD_LC_Fab_01 | |
| 标题栏 | NavigationBar_ComponentSet_01 | | NavigationBar_ComponentSet_04 | | | L栏：NavigationBar_ComponentSet_04；C栏：NavigationBar_ComponentSet_04 | | | L栏：NavigationBar_ComponentSet_04；C栏：NavigationBar_ComponentSet_04 | | | | | L栏：NavigationBar_ComponentSet_01；C栏：NavigationBar_ComponentSet_07 | | | | | L栏：NavigationBar_ComponentSet_01；C栏：NavigationBar_ComponentSet_07 | |
| 标签栏 | SelectableChip_ComponentSet_01 | | SelectableChip_ComponentSet_01 | | | SelectableChip_ComponentSet_01 | | | SelectableChip_ComponentSet_01 | | | | | L栏：SelectableChip_ComponentSet_01 | | | | | L栏：SelectableChip_ComponentSet_01 | |
| Fab | Fab_Rec_01；彩色 | | Fab_Rec_01；彩色 | | | L栏：Fab_Rec_01；彩色 | | | L栏：Fab_Rec_01；彩色 | | | | | L栏：Fab_Rec_01；彩色 | | | | | L栏：Fab_Rec_01；彩色 | |

## 组件间距

| 组件 | variantId | Space |
|------|-----------|-------|
| 标题栏 | NavigationBar_ComponentSet_01 | 左12；右12；标题左侧：28 |
| 标题栏 | NavigationBar_ComponentSet_04 | 左12；右12；标题左侧：28 |
| 标题栏 | NavigationBar_ComponentSet_07 | 左12；右12 |
| 标签栏 | SelectableChip_ComponentSet_01 | 左12；右12 |
| Fab | Fab_Rec_01 | 右24 |
| 侧边栏 | Sidebar_Component_Fold_LC_Fab_01 | 侧边栏组件左侧：12；侧边栏组件内：左12；右12 |
| 侧边栏 | Sidebar_Component_PAD_LC_Fab_01 | 侧边栏组件左侧：12；侧边栏组件内：左12；右12 |

## 栏背景色

### 手机

| screenMode | 背景色 |
|-----------|-------|
| 竖屏 | 背景色/surface_low |
| 横屏 | 待定 |

### Fold Q18 — 外屏

| screenMode | 背景色 |
|-----------|-------|
| 竖屏 | 背景色/surface_low |
| 横屏 | 待定 |

### Fold Q18 — 内屏 / 竖屏

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NC | 不存在 | 不存在 | 不存在 |
| LC | 不存在 | 背景色/surface | 背景色/surface_low |
| C | 不存在 | 不存在 | 不存在 |

### Fold Q18 — 内屏 / 横屏

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NC | 不存在 | 不存在 | 不存在 |
| LC | 不存在 | 背景色/surface | 背景色/surface_low |
| C | 不存在 | 不存在 | 不存在 |

### Pad — 竖屏

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NLC | 不存在 | 不存在 | 不存在 |
| NLC 收起 | 不存在 | 不存在 | 不存在 |
| NC | 不存在 | 不存在 | 不存在 |
| LC | 不存在 | 背景色/surface | 背景色/surface_low |
| C | 不存在 | 不存在 | 不存在 |

### Pad — 横屏

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NLC | 不存在 | 不存在 | 不存在 |
| NLC 收起 | 不存在 | 不存在 | 不存在 |
| NC | 不存在 | 不存在 | 不存在 |
| LC | 不存在 | 背景色/surface | 背景色/surface_low |
| C | 不存在 | 不存在 | 不存在 |

## 当前覆盖缺口

- 手机横屏模式
- Fold 外屏横屏模式
