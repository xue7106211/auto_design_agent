---
name: app-variant-map
description: 文件管理应用的语义组件在不同设备与屏幕模式下的目标变体映射表。
app: 文件管理
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

> 本文档由 `figma-component-dictionary.md` 的 Step 1 按需加载。

# 文件管理 App Variant Map

## 映射表

| | 手机竖 | 手机横 | Fold外竖 | Fold外横 | Fold内竖NC | Fold内竖LC | Fold内竖C | Fold内横NC | Fold内横LC | Fold内横C | Pad竖NLC | Pad竖NLC收起 | Pad竖NC | Pad竖LC | Pad竖C | Pad横NLC | Pad横NLC收起 | Pad横NC | Pad横LC | Pad横C |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| 导航栏 | BottomBar_Showcase_Fab_01 | | BottomBar_Showcase_Fab_01 | | N栏：Sidebar_Component_NC_01 | | TopBar_01 | N栏：Sidebar_Component_NC_01 | | TopBar_01 | | | N栏：Sidebar_Component_PAD_NLC_01 | | TopBar_05 | | | N栏：Sidebar_Component_PAD_NLC_01 | | TopBar_05 |
| 标题栏 | NavigationBar_ComponentSet_01 | | NavigationBar_ComponentSet_04 | | N栏：NavigationBar_ComponentSet_12；C栏：NavigationBar_ComponentSet_04 | | NavigationBar_ComponentSet_10 | N栏：NavigationBar_ComponentSet_12；C栏：NavigationBar_ComponentSet_04 | | NavigationBar_ComponentSet_10 | | | N栏：NavigationBar_ComponentSet_12；C栏：NavigationBar_ComponentSet_07 | | TopBar_05 标题栏 | | | N栏：NavigationBar_ComponentSet_12；C栏：NavigationBar_ComponentSet_07 | | NavigationBar_ComponentSet_10 |
| 搜索 | Fab_01；白色 | | Fab_01；白色 | | C栏：NavigationBar_ComponentSet_04 搜索图标 | | TopBar_01 搜索图标 | C栏：NavigationBar_ComponentSet_04 搜索图标 | | TopBar_01 搜索图标 | | | C栏：TopBar_03 搜索栏 | | TopBar_05 搜索栏 | | | C栏：TopBar_03 搜索栏 | | TopBar_05 搜索栏 |
| 搜索面板 | | | | | | | | | | | | | C栏：SearchReceiving_01 | | SearchReceiving_01 | | | C栏：SearchReceiving_01 | | SearchReceiving_01 |

## 组件间距

| 组件 | variantId | Space |
|------|-----------|-------|
| 导航栏 | BottomBar_Showcase_Fab_01 | Padding：最小弹：左24；右24；Gap：12 |
| 导航栏 | Sidebar_Component_NC_01 | 侧边栏组件左侧：12；侧边栏组件内：左12；右12 |
| 导航栏 | Sidebar_Component_PAD_NLC_01 | 侧边栏组件左侧：12；侧边栏组件内：左12；右12 |
| 导航栏 | TopBar_01 | 左12；右12 |
| 导航栏 | TopBar_05 | 左12；右12 |
| 标题栏 | NavigationBar_ComponentSet_01 | 左12；右12；标题左侧：28 |
| 标题栏 | NavigationBar_ComponentSet_04 | 左12；右12；标题左侧：28 |
| 标题栏 | NavigationBar_ComponentSet_07 | 左12；右12 |
| 标题栏 | NavigationBar_ComponentSet_10 | 左12；右12 |
| 标题栏 | NavigationBar_ComponentSet_12 | 左12；右12 |
| 搜索 | Fab_01 | 右24 |
| 搜索 | TopBar_03 | 左12；右12 |
| 搜索面板 | SearchReceiving_01 | 左16；右16 |

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
| NC | 背景色/surface | 不存在 | 背景色/surface |
| LC | 不存在 | 不存在 | 不存在 |
| C | 不存在 | 不存在 | 背景色/surface |

### Fold Q18 — 内屏 / 横屏

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NC | 背景色/surface | 不存在 | 背景色/surface |
| LC | 不存在 | 不存在 | 不存在 |
| C | 不存在 | 不存在 | 背景色/surface |

### Pad — 竖屏

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NLC | 不存在 | 不存在 | 不存在 |
| NLC 收起 | 不存在 | 不存在 | 不存在 |
| NC | 背景色/surface | 不存在 | 背景色/surface |
| LC | 不存在 | 不存在 | 不存在 |
| C | 不存在 | 不存在 | 背景色/surface_low |

### Pad — 横屏

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NLC | 不存在 | 不存在 | 不存在 |
| NLC 收起 | 不存在 | 不存在 | 不存在 |
| NC | 背景色/surface | 不存在 | 背景色/surface |
| LC | 不存在 | 不存在 | 不存在 |
| C | 不存在 | 不存在 | 背景色/surface_low |

## 当前覆盖缺口

- 手机横屏模式
- Fold 外屏横屏模式
