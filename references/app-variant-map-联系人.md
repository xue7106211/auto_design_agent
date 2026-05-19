---
name: app-variant-map
description: 联系人应用的语义组件在不同设备与屏幕模式下的目标变体映射表。
app: 联系人
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

> 本文档由 `figma-component-dictionary.md` 的 Step 1 按需加载。

# 联系人 App Variant Map

## §0. 应用规则要点（必读，先于映射表）

### §0.1 各设备默认 layoutType

| device | default layoutType | 说明 |
|---|---|---|
| 手机 / Fold 外屏 | C | 单栏 |
| Fold 内屏 横/竖 | LC | 列表 + 详情 |
| Pad 横屏 | NLC（并列）| 含 Sidebar |
| Pad 竖屏 | NLC（并列）| 默认并列；覆盖仅 user 显式指定 |

### §0.1b scenarioFlags 导出信号表

> **状态**：skeleton。实际适配 联系人 时按 source frame 实测填写，**禁止推测**。

| flag | 激活信号 | 关联触发 |
|------|---------|---------|
| `LEditMode` | （待实测）| §3.7a |
| `NEditMode` | （待实测）| §3.7a / §3.7b |
| `CEditMode` | （待实测）| §3.7a 末 |
| `NCovering` | layoutType = `NLC覆盖`（仅 user 显式指定）| §3.7 |

## 子场景约定

| 子场景 | 说明 |
| --- | --- |
| 联系人 | 全设备通用 |
| Pad端联系人 | 仅 Pad 竖屏/横屏，LC 布局 |

## 映射表

### 联系人

| | 手机竖 | 手机横 | Fold外竖 | Fold外横 | Fold内竖NC | Fold内竖LC | Fold内竖C | Fold内横NC | Fold内横LC | Fold内横C | Pad竖NLC | Pad竖NLC收起 | Pad竖NC | Pad竖LC | Pad竖C | Pad横NLC | Pad横NLC收起 | Pad横NC | Pad横LC | Pad横C |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| 导航栏 | BottomBar_Showcase_Fab_01 | | BottomBar_Showcase_Fab_01 | | | L栏：BottomBar_Showcase_02 | | | L栏：BottomBar_Showcase_02 | | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_02 | | | | N栏：Sidebar_Component_PAD_NLC_01 | N栏：Sidebar_Component_PAD_NLC_02 | | | |
| 标题栏 | NavigationBar_ComponentSet_01 | | NavigationBar_ComponentSet_04 | | | L栏：NavigationBar_ComponentSet_04；C栏：1.未选中L栏list：无标题 2.选中L栏list：NavigationBar_ComponentSet_15 | | | L栏：NavigationBar_ComponentSet_04；C栏：1.未选中L栏list：无标题 2.选中L栏list：NavigationBar_ComponentSet_15 | | N栏：Sidebar_Component_PAD_NLC_01 标题栏；L栏：NavigationBar_ComponentSet_07；C栏：1.未选中L栏list：无标题 2.选中L栏list：NavigationBar_ComponentSet_10 | N栏：Sidebar_Component_PAD_NLC_02 标题栏；L栏：NavigationBar_ComponentSet_07；C栏：1.未选中L栏list：无标题 2.选中L栏list：NavigationBar_ComponentSet_10 | | | | N栏：Sidebar_Component_PAD_NLC_01 标题栏；L栏：NavigationBar_ComponentSet_07；C栏：1.未选中L栏list：无标题 2.选中L栏list：NavigationBar_ComponentSet_10 | N栏：Sidebar_Component_PAD_NLC_02 标题栏；L栏：NavigationBar_ComponentSet_07；C栏：1.未选中L栏list：无标题 2.选中L栏list：NavigationBar_ComponentSet_10 | | | |
| 搜索 | SearchBar_ComponentSet_02 | | SearchBar_ComponentSet_02 | | | L栏：SearchBar_ComponentSet_02 | | | L栏：SearchBar_ComponentSet_02 | | L栏：SearchBar_ComponentSet_02 | L栏：SearchBar_ComponentSet_02 | | | | L栏：SearchBar_ComponentSet_02 | L栏：SearchBar_ComponentSet_02 | | | |
| Fab | Fab_01；彩色 | | Fab_01；彩色 | | | C栏：Fab_01；彩色 | | | C栏：Fab_01；彩色 | | L栏：标题栏 新建图标 | L栏：标题栏 新建图标 | | | | L栏：标题栏 新建图标 | L栏：标题栏 新建图标 | | | |

### Pad端联系人

| | 手机竖 | 手机横 | Fold外竖 | Fold外横 | Fold内竖NC | Fold内竖LC | Fold内竖C | Fold内横NC | Fold内横LC | Fold内横C | Pad竖NLC | Pad竖NLC收起 | Pad竖NC | Pad竖LC | Pad竖C | Pad横NLC | Pad横NLC收起 | Pad横NC | Pad横LC | Pad横C |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| 导航栏 | | | | | | | | | | | | | | LC栏 | | | | | LC栏 | |
| 标题栏 | | | | | | | | | | | | | | L栏：NavigationBar_ComponentSet_01；C栏：1.未选中L栏list：无标题 2.选中L栏list：NavigationBar_ComponentSet_10 | | | | | L栏：NavigationBar_ComponentSet_01；C栏：1.未选中L栏list：无标题 2.选中L栏list：NavigationBar_ComponentSet_10 | |
| 搜索 | | | | | | | | | | | | | | L栏：SearchBar_ComponentSet_02 | | | | | L栏：SearchBar_ComponentSet_02 | |

## 组件间距

| 组件 | variantId | Space |
|------|-----------|-------|
| 导航栏 | BottomBar_Showcase_Fab_01 | Padding：最小：左24；右24；Gap：12 |
| 导航栏 | BottomBar_Showcase_02 | 左24 |
| 导航栏 | Sidebar_Component_PAD_NLC_01 | 侧边栏组件左侧：12；侧边栏组件内：左12；右12 |
| 导航栏 | Sidebar_Component_PAD_NLC_02 | 侧边栏组件左侧：12；侧边栏组件内：左12；右12 |
| 标题栏 | NavigationBar_ComponentSet_01 | 左12；右12；标题左侧：28 |
| 标题栏 | NavigationBar_ComponentSet_04 | 左12；右12；标题左侧：28 |
| 标题栏 | NavigationBar_ComponentSet_07 | 左12；右12 |
| 标题栏 | NavigationBar_ComponentSet_10 | 左12；右12 |
| 标题栏 | NavigationBar_ComponentSet_15 | 左12；右12 |
| 搜索 | SearchBar_ComponentSet_02 | 左12；右12 |
| Fab | Fab_01 | 右24 |

## 栏背景色

### 手机

| screenMode | 背景色 |
|-----------|-------|
| 竖屏 | 背景色/surface |
| 横屏 | 待定 |

### Fold Q18 — 外屏

| screenMode | 背景色 |
|-----------|-------|
| 竖屏 | 背景色/surface |
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
| NLC | 背景色/surface | 背景色/surface | 背景色/surface_low |
| NLC 收起 | 背景色/surface | 背景色/surface | 背景色/surface_low |
| NC | 不存在 | 不存在 | 不存在 |
| LC | 不存在 | 不存在 | 不存在 |
| C | 不存在 | 不存在 | 不存在 |

### Pad — 横屏

| screenMode | N 栏 | L 栏 | C 栏 |
|-----------|------|------|------|
| NLC | 背景色/surface | 背景色/surface | 背景色/surface_low |
| NLC 收起 | 背景色/surface | 背景色/surface | 背景色/surface_low |
| NC | 不存在 | 不存在 | 不存在 |
| LC | 不存在 | 不存在 | 不存在 |
| C | 不存在 | 不存在 | 不存在 |

## 当前覆盖缺口

- 手机横屏模式
- Fold 外屏横屏模式
