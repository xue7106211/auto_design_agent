---
name: breakpoint-component-map
description: 文管应用的设备 × 屏幕模式组件映射表。多端适配时定义每个 UI 元素应使用哪个 variantId。
app: 文管
sourceOfTruth: manual
---

> 本文档由 `figma-component-dictionary.md` 的 Step 0 按需加载。
> 查到 variantId 后，回到主文档继续 Step 1–6 执行。

# 文管 断点-结构变化表

## 设备与屏幕模式定义

| 缩写 | 含义 |
|------|------|
| N | Navigation（导航画面） |
| L | List（列表画面） |
| C | Content（内容画面） |
| NC | Navigation + Content 复合 |

| 设备 | 可用模式 |
|------|---------|
| Phone | N, L, C |
| Fold(Q18) 外屏 | N, L, C |
| Fold(Q18) 内屏 | N, L, C |
| Pad 竖屏 | NC, C |
| Pad 横屏 | NC, C |

## 组件映射表

`-` = 该模式下无此元素 / `null` = 不显示 / 空 = 未定义

### 导航_FAB_搜索

| 设备 | N | L | C |
|------|---|---|---|
| Phone | — | BottomBar-Showcase_01 | — |
| Fold 外屏 | — | BottomBar-Showcase_02 | — |
| Fold 内屏 | — | BottomBar-Showcase_02 | — |
| Pad 竖屏 | Sidebar-Component_01 (NC) | — | Pad-TopBar_Navigation_01 (C) |
| Pad 横屏 | Sidebar-Component_01 (NC) | — | Pad-TopBar_Navigation_01 (C) |

### 标题栏_一级

| 设备 | N | L | C |
|------|---|---|---|
| Phone | — | NavigationBar-ComponentSet_01 | — |
| Fold 外屏 | — | NavigationBar-ComponentSet_04 | — |
| Fold 内屏 | — | NavigationBar-ComponentSet_04 | — |
| Pad 竖屏 | NavigationBar-ComponentSet_07 (NC) | — | NavigationBar-ComponentSet_10 (C) |
| Pad 横屏 | NavigationBar-ComponentSet_07 (NC) | — | NavigationBar-ComponentSet_10 (C) |

### 标题栏_二级

| 设备 | N | L | C |
|------|---|---|---|
| Phone | — | NavigationBar-ComponentSet_02 | — |
| Fold 外屏 | — | NavigationBar-ComponentSet_05 | — |
| Fold 内屏 | — | NavigationBar-ComponentSet_05 | — |
| Pad 竖屏 | NavigationBar-ComponentSet_07 (NC) | — | NavigationBar-ComponentSet_10 (C) |
| Pad 横屏 | NavigationBar-ComponentSet_07 (NC) | — | NavigationBar-ComponentSet_10 (C) |

### 标题栏_三级_无标题

| 设备 | N | L | C |
|------|---|---|---|
| Phone | — | - | NavigationBar-ComponentSet_11 |
| Fold 外屏 | — | — | NavigationBar-ComponentSet_11 |
| Fold 内屏 | — | — | NavigationBar-ComponentSet_11 |
| Pad 竖屏 | NavigationBar-ComponentSet_11 (NC) | — | NavigationBar-ComponentSet_11 (C) |
| Pad 横屏 | NavigationBar-ComponentSet_11 (NC) | — | NavigationBar-ComponentSet_11 (C) |

### 标题栏_编辑

| 设备 | N | L | C |
|------|---|---|---|
| Phone | — | NavigationBar-ComponentSet_03 | — |
| Fold 外屏 | — | NavigationBar-ComponentSet_06 | — |
| Fold 内屏 | — | NavigationBar-ComponentSet_06 | — |
| Pad 竖屏 | NavigationBar-ComponentSet_09 (NC) | — | NavigationBar-ComponentSet_09 (C) |
| Pad 横屏 | NavigationBar-ComponentSet_09 (NC) | — | NavigationBar-ComponentSet_09 (C) |

### 容器标题_抽屉

| 设备 | N | L | C |
|------|---|---|---|
| Phone | — | Drawer-Max-HandleSection_01 | — |
| Fold 外屏 | — | Drawer-Max-HandleSection_01 | — |
| Fold 内屏 | — | Drawer-Max-HandleSection_01 | — |
| Pad 竖屏 | Drawer-Max-HandleSection_01 (NC) | — | Drawer-Max-HandleSection_01 (C) |
| Pad 横屏 | Drawer-Max-HandleSection_01 (NC) | — | Drawer-Max-HandleSection_01 (C) |

### 标签栏

| 设备 | N | L | C |
|------|---|---|---|
| Phone | — | SelectableChip-ComponentSet_01 | — |
| Fold 外屏 | — | SelectableChip-ComponentSet_01 | — |
| Fold 内屏 | — | SelectableChip-ComponentSet_01 | — |
| Pad 竖屏 | SelectableChip-ComponentSet_01 (NC) | — | SelectableChip-ComponentSet_01 (C) |
| Pad 横屏 | SelectableChip-ComponentSet_01 (NC) | — | SelectableChip-ComponentSet_01 (C) |

### 搜索栏

| 设备 | N | L | C |
|------|---|---|---|
| Phone | — | SearchBar-ComponentSet_01 | — |
| Fold 外屏 | — | SearchBar-ComponentSet_01 | — |
| Fold 内屏 | — | SearchBar-ComponentSet_01 | — |
| Pad 竖屏 | SearchBar-ComponentSet_02 (NC) | — | SearchBar-ComponentSet_02 (C) |
| Pad 横屏 | SearchBar-ComponentSet_02 (NC) | — | SearchBar-ComponentSet_02 (C) |

### 搜索面板

| 设备 | N | L | C |
|------|---|---|---|
| Phone | — | - | — |
| Fold 外屏 | — | - | — |
| Fold 内屏 | — | - | — |
| Pad 竖屏 | SearchReceiving_01 (NC) | — | SearchReceiving_01 (C) |
| Pad 横屏 | SearchReceiving_01 (NC) | — | SearchReceiving_01 (C) |

### 工具栏

| 设备 | N | L | C |
|------|---|---|---|
| Phone | — | ToolBar-ComponentSet_01 | — |
| Fold 外屏 | — | ToolBar-ComponentSet_01 | — |
| Fold 内屏 | — | ToolBar-ComponentSet_01 | — |
| Pad 竖屏 | ToolBar-ComponentSet_01 (NC) | — | ToolBar-ComponentSet_01 (C) |
| Pad 横屏 | ToolBar-ComponentSet_01 (NC) | — | ToolBar-ComponentSet_01 (C) |

### 侧边栏编辑

| 设备 | N | L | C |
|------|---|---|---|
| Phone | — | - | — |
| Fold 外屏 | — | - | — |
| Fold 内屏 | — | - | — |
| Pad 竖屏 | Sidebar-Component_03 (NC) | — | - |
| Pad 横屏 | Sidebar-Component_03 (NC) | — | - |

### AI输入框

| 设备 | N | L | C |
|------|---|---|---|
| Phone | null | null | 输入框1 |
| Fold 外屏 | — | — | — |
| Fold 内屏 | null | null | 输入框1 |
| Pad 竖屏 | null (NC) | — | 输入框1 (C) |
| Pad 横屏 | null (NC) | — | 输入框1 (C) |

## 断点模式总结

### 设备间主要切换规则

1. **Phone → Fold**：同组件族，variantId 编号上升
   - NavigationBar：`_01~03` → `_04~06`
   - BottomBar：`Showcase_01` → `Showcase_02`

2. **Fold → Pad**：导航结构整体变更
   - BottomBar → `Sidebar-Component_01` + `Pad-TopBar_Navigation_01`
   - NavigationBar 一级/二级：`_04/_05` → `_07`(NC) + `_10`(C)

3. **全设备一致的组件**：Drawer、SelectableChip、ToolBar

### 未定义项

CSV 中空行的项目（后续需补充）：
- 列表
- 宫格
- 新建工具栏
- 列表-编辑中
- 宫格-编辑中
