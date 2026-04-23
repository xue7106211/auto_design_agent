---
name: app-variant-map
description: 文管应用的语义组件在不同设备与屏幕模式下的目标变体映射表。供 `figma-component-dictionary.md` 在识别当前实例语义后查询。
app: 文管
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

> 本文档由 `figma-component-dictionary.md` 的 Step 1 按需加载。
> 查到目标记录后，回到主文档继续 Step 2-6 执行。

# 文管 App Variant Map

## 用途

本文档只负责一件事：

- 当 `figma-component-dictionary.md` 已经从 Figma 当前实例识别出源组件语义后，
- 根据 `appName + targetDevice + targetScreenMode + resolvedUiElement` 查出目标结果

本文档不负责：

- 不负责从 Figma 文件中定位实际实例
- 不负责判断当前节点属于哪个语义角色
- 不负责替代组件探查流程

输出结果分为四类：

- `variant`：返回可执行的 `variantId`
- `hidden`：该元素在此场景下需要隐藏，不执行组件切换
- `absent`：该元素在此场景下不存在，不执行
- `undefined`：该组合尚未建档，调用方应报错并回收上下文，不允许猜测

## 枚举定义

### `device`

| 值 | 含义 |
| --- | --- |
| `Phone` | 手机 |
| `Fold外屏` | 折叠屏外屏 |
| `Fold内屏` | 折叠屏内屏 |
| `Pad竖屏` | 平板竖屏 |
| `Pad横屏` | 平板横屏 |

### `screenMode`

| 值 | 含义 |
| --- | --- |
| `N` | Navigation，导航画面 |
| `L` | List，列表画面 |
| `C` | Content，内容画面 |
| `NC` | Navigation + Content 复合画面 |

### 状态约定

| `resultType` | 含义 |
| --- | --- |
| `variant` | 单元格命中真实 `variantId` |
| `hidden` | 原文中的 `null`，代表元素保留语义但当前场景不显示 |
| `absent` | 原文中的 `-` / `—`，代表该场景下无此元素 |
| `undefined` | 原文留空，代表尚未定义 |

## 映射表

仅记录各设备的有效 `screenMode` 组合：

- `Phone` / `Fold外屏` / `Fold内屏` 只使用 `N` / `L` / `C`
- `Pad竖屏` / `Pad横屏` 只使用 `NC` / `C`
- 若传入设备不支持的 `screenMode`，视为无效输入，应直接报错

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `导航_FAB_搜索` | `Phone` | `N` | `absent` |  |  |
| `导航_FAB_搜索` | `Phone` | `L` | `variant` | `BottomBar-Showcase_01` |  |
| `导航_FAB_搜索` | `Phone` | `C` | `absent` |  |  |
| `导航_FAB_搜索` | `Fold外屏` | `N` | `absent` |  |  |
| `导航_FAB_搜索` | `Fold外屏` | `L` | `variant` | `BottomBar-Showcase_02` |  |
| `导航_FAB_搜索` | `Fold外屏` | `C` | `absent` |  |  |
| `导航_FAB_搜索` | `Fold内屏` | `N` | `absent` |  |  |
| `导航_FAB_搜索` | `Fold内屏` | `L` | `variant` | `BottomBar-Showcase_02` |  |
| `导航_FAB_搜索` | `Fold内屏` | `C` | `absent` |  |  |
| `导航_FAB_搜索` | `Pad竖屏` | `NC` | `variant` | `Sidebar-Component_01` |  |
| `导航_FAB_搜索` | `Pad竖屏` | `C` | `variant` | `Pad-TopBar_Navigation_01` |  |
| `导航_FAB_搜索` | `Pad横屏` | `NC` | `variant` | `Sidebar-Component_01` |  |
| `导航_FAB_搜索` | `Pad横屏` | `C` | `variant` | `Pad-TopBar_Navigation_01` |  |
| `标题栏_一级` | `Phone` | `N` | `absent` |  |  |
| `标题栏_一级` | `Phone` | `L` | `variant` | `NavigationBar-ComponentSet_01` |  |
| `标题栏_一级` | `Phone` | `C` | `absent` |  |  |
| `标题栏_一级` | `Fold外屏` | `N` | `absent` |  |  |
| `标题栏_一级` | `Fold外屏` | `L` | `variant` | `NavigationBar-ComponentSet_04` |  |
| `标题栏_一级` | `Fold外屏` | `C` | `absent` |  |  |
| `标题栏_一级` | `Fold内屏` | `N` | `absent` |  |  |
| `标题栏_一级` | `Fold内屏` | `L` | `variant` | `NavigationBar-ComponentSet_04` |  |
| `标题栏_一级` | `Fold内屏` | `C` | `absent` |  |  |
| `标题栏_一级` | `Pad竖屏` | `NC` | `variant` | `NavigationBar-ComponentSet_07` |  |
| `标题栏_一级` | `Pad竖屏` | `C` | `variant` | `NavigationBar-ComponentSet_10` |  |
| `标题栏_一级` | `Pad横屏` | `NC` | `variant` | `NavigationBar-ComponentSet_07` |  |
| `标题栏_一级` | `Pad横屏` | `C` | `variant` | `NavigationBar-ComponentSet_10` |  |
| `标题栏_二级` | `Phone` | `N` | `absent` |  |  |
| `标题栏_二级` | `Phone` | `L` | `variant` | `NavigationBar-ComponentSet_02` |  |
| `标题栏_二级` | `Phone` | `C` | `absent` |  |  |
| `标题栏_二级` | `Fold外屏` | `N` | `absent` |  |  |
| `标题栏_二级` | `Fold外屏` | `L` | `variant` | `NavigationBar-ComponentSet_05` |  |
| `标题栏_二级` | `Fold外屏` | `C` | `absent` |  |  |
| `标题栏_二级` | `Fold内屏` | `N` | `absent` |  |  |
| `标题栏_二级` | `Fold内屏` | `L` | `variant` | `NavigationBar-ComponentSet_05` |  |
| `标题栏_二级` | `Fold内屏` | `C` | `absent` |  |  |
| `标题栏_二级` | `Pad竖屏` | `NC` | `variant` | `NavigationBar-ComponentSet_07` |  |
| `标题栏_二级` | `Pad竖屏` | `C` | `variant` | `NavigationBar-ComponentSet_10` |  |
| `标题栏_二级` | `Pad横屏` | `NC` | `variant` | `NavigationBar-ComponentSet_07` |  |
| `标题栏_二级` | `Pad横屏` | `C` | `variant` | `NavigationBar-ComponentSet_10` |  |
| `标题栏_三级_无标题` | `Phone` | `N` | `absent` |  |  |
| `标题栏_三级_无标题` | `Phone` | `L` | `absent` |  | 原始记录为 `-` |
| `标题栏_三级_无标题` | `Phone` | `C` | `variant` | `NavigationBar-ComponentSet_11` |  |
| `标题栏_三级_无标题` | `Fold外屏` | `N` | `absent` |  |  |
| `标题栏_三级_无标题` | `Fold外屏` | `L` | `absent` |  |  |
| `标题栏_三级_无标题` | `Fold外屏` | `C` | `variant` | `NavigationBar-ComponentSet_11` |  |
| `标题栏_三级_无标题` | `Fold内屏` | `N` | `absent` |  |  |
| `标题栏_三级_无标题` | `Fold内屏` | `L` | `absent` |  |  |
| `标题栏_三级_无标题` | `Fold内屏` | `C` | `variant` | `NavigationBar-ComponentSet_11` |  |
| `标题栏_三级_无标题` | `Pad竖屏` | `NC` | `variant` | `NavigationBar-ComponentSet_11` |  |
| `标题栏_三级_无标题` | `Pad竖屏` | `C` | `variant` | `NavigationBar-ComponentSet_11` |  |
| `标题栏_三级_无标题` | `Pad横屏` | `NC` | `variant` | `NavigationBar-ComponentSet_11` |  |
| `标题栏_三级_无标题` | `Pad横屏` | `C` | `variant` | `NavigationBar-ComponentSet_11` |  |
| `标题栏_编辑` | `Phone` | `N` | `absent` |  |  |
| `标题栏_编辑` | `Phone` | `L` | `variant` | `NavigationBar-ComponentSet_03` |  |
| `标题栏_编辑` | `Phone` | `C` | `absent` |  |  |
| `标题栏_编辑` | `Fold外屏` | `N` | `absent` |  |  |
| `标题栏_编辑` | `Fold外屏` | `L` | `variant` | `NavigationBar-ComponentSet_06` |  |
| `标题栏_编辑` | `Fold外屏` | `C` | `absent` |  |  |
| `标题栏_编辑` | `Fold内屏` | `N` | `absent` |  |  |
| `标题栏_编辑` | `Fold内屏` | `L` | `variant` | `NavigationBar-ComponentSet_06` |  |
| `标题栏_编辑` | `Fold内屏` | `C` | `absent` |  |  |
| `标题栏_编辑` | `Pad竖屏` | `NC` | `variant` | `NavigationBar-ComponentSet_09` |  |
| `标题栏_编辑` | `Pad竖屏` | `C` | `variant` | `NavigationBar-ComponentSet_09` |  |
| `标题栏_编辑` | `Pad横屏` | `NC` | `variant` | `NavigationBar-ComponentSet_09` |  |
| `标题栏_编辑` | `Pad横屏` | `C` | `variant` | `NavigationBar-ComponentSet_09` |  |
| `容器标题_抽屉` | `Phone` | `N` | `absent` |  |  |
| `容器标题_抽屉` | `Phone` | `L` | `variant` | `Drawer-Max-HandleSection_01` |  |
| `容器标题_抽屉` | `Phone` | `C` | `absent` |  |  |
| `容器标题_抽屉` | `Fold外屏` | `N` | `absent` |  |  |
| `容器标题_抽屉` | `Fold外屏` | `L` | `variant` | `Drawer-Max-HandleSection_01` |  |
| `容器标题_抽屉` | `Fold外屏` | `C` | `absent` |  |  |
| `容器标题_抽屉` | `Fold内屏` | `N` | `absent` |  |  |
| `容器标题_抽屉` | `Fold内屏` | `L` | `variant` | `Drawer-Max-HandleSection_01` |  |
| `容器标题_抽屉` | `Fold内屏` | `C` | `absent` |  |  |
| `容器标题_抽屉` | `Pad竖屏` | `NC` | `variant` | `Drawer-Max-HandleSection_01` |  |
| `容器标题_抽屉` | `Pad竖屏` | `C` | `variant` | `Drawer-Max-HandleSection_01` |  |
| `容器标题_抽屉` | `Pad横屏` | `NC` | `variant` | `Drawer-Max-HandleSection_01` |  |
| `容器标题_抽屉` | `Pad横屏` | `C` | `variant` | `Drawer-Max-HandleSection_01` |  |
| `标签栏` | `Phone` | `N` | `absent` |  |  |
| `标签栏` | `Phone` | `L` | `variant` | `SelectableChip-ComponentSet_01` |  |
| `标签栏` | `Phone` | `C` | `absent` |  |  |
| `标签栏` | `Fold外屏` | `N` | `absent` |  |  |
| `标签栏` | `Fold外屏` | `L` | `variant` | `SelectableChip-ComponentSet_01` |  |
| `标签栏` | `Fold外屏` | `C` | `absent` |  |  |
| `标签栏` | `Fold内屏` | `N` | `absent` |  |  |
| `标签栏` | `Fold内屏` | `L` | `variant` | `SelectableChip-ComponentSet_01` |  |
| `标签栏` | `Fold内屏` | `C` | `absent` |  |  |
| `标签栏` | `Pad竖屏` | `NC` | `variant` | `SelectableChip-ComponentSet_01` |  |
| `标签栏` | `Pad竖屏` | `C` | `variant` | `SelectableChip-ComponentSet_01` |  |
| `标签栏` | `Pad横屏` | `NC` | `variant` | `SelectableChip-ComponentSet_01` |  |
| `标签栏` | `Pad横屏` | `C` | `variant` | `SelectableChip-ComponentSet_01` |  |
| `搜索栏` | `Phone` | `N` | `absent` |  |  |
| `搜索栏` | `Phone` | `L` | `variant` | `SearchBar-ComponentSet_01` |  |
| `搜索栏` | `Phone` | `C` | `absent` |  |  |
| `搜索栏` | `Fold外屏` | `N` | `absent` |  |  |
| `搜索栏` | `Fold外屏` | `L` | `variant` | `SearchBar-ComponentSet_01` |  |
| `搜索栏` | `Fold外屏` | `C` | `absent` |  |  |
| `搜索栏` | `Fold内屏` | `N` | `absent` |  |  |
| `搜索栏` | `Fold内屏` | `L` | `variant` | `SearchBar-ComponentSet_01` |  |
| `搜索栏` | `Fold内屏` | `C` | `absent` |  |  |
| `搜索栏` | `Pad竖屏` | `NC` | `variant` | `SearchBar-ComponentSet_02` |  |
| `搜索栏` | `Pad竖屏` | `C` | `variant` | `SearchBar-ComponentSet_02` |  |
| `搜索栏` | `Pad横屏` | `NC` | `variant` | `SearchBar-ComponentSet_02` |  |
| `搜索栏` | `Pad横屏` | `C` | `variant` | `SearchBar-ComponentSet_02` |  |
| `搜索面板` | `Phone` | `N` | `absent` |  |  |
| `搜索面板` | `Phone` | `L` | `absent` |  | 原始记录为 `-` |
| `搜索面板` | `Phone` | `C` | `absent` |  |  |
| `搜索面板` | `Fold外屏` | `N` | `absent` |  |  |
| `搜索面板` | `Fold外屏` | `L` | `absent` |  | 原始记录为 `-` |
| `搜索面板` | `Fold外屏` | `C` | `absent` |  |  |
| `搜索面板` | `Fold内屏` | `N` | `absent` |  |  |
| `搜索面板` | `Fold内屏` | `L` | `absent` |  | 原始记录为 `-` |
| `搜索面板` | `Fold内屏` | `C` | `absent` |  |  |
| `搜索面板` | `Pad竖屏` | `NC` | `variant` | `SearchReceiving_01` |  |
| `搜索面板` | `Pad竖屏` | `C` | `variant` | `SearchReceiving_01` |  |
| `搜索面板` | `Pad横屏` | `NC` | `variant` | `SearchReceiving_01` |  |
| `搜索面板` | `Pad横屏` | `C` | `variant` | `SearchReceiving_01` |  |
| `工具栏` | `Phone` | `N` | `absent` |  |  |
| `工具栏` | `Phone` | `L` | `variant` | `ToolBar-ComponentSet_01` |  |
| `工具栏` | `Phone` | `C` | `absent` |  |  |
| `工具栏` | `Fold外屏` | `N` | `absent` |  |  |
| `工具栏` | `Fold外屏` | `L` | `variant` | `ToolBar-ComponentSet_01` |  |
| `工具栏` | `Fold外屏` | `C` | `absent` |  |  |
| `工具栏` | `Fold内屏` | `N` | `absent` |  |  |
| `工具栏` | `Fold内屏` | `L` | `variant` | `ToolBar-ComponentSet_01` |  |
| `工具栏` | `Fold内屏` | `C` | `absent` |  |  |
| `工具栏` | `Pad竖屏` | `NC` | `variant` | `ToolBar-ComponentSet_01` |  |
| `工具栏` | `Pad竖屏` | `C` | `variant` | `ToolBar-ComponentSet_01` |  |
| `工具栏` | `Pad横屏` | `NC` | `variant` | `ToolBar-ComponentSet_01` |  |
| `工具栏` | `Pad横屏` | `C` | `variant` | `ToolBar-ComponentSet_01` |  |
| `侧边栏编辑` | `Phone` | `N` | `absent` |  |  |
| `侧边栏编辑` | `Phone` | `L` | `absent` |  | 原始记录为 `-` |
| `侧边栏编辑` | `Phone` | `C` | `absent` |  |  |
| `侧边栏编辑` | `Fold外屏` | `N` | `absent` |  |  |
| `侧边栏编辑` | `Fold外屏` | `L` | `absent` |  | 原始记录为 `-` |
| `侧边栏编辑` | `Fold外屏` | `C` | `absent` |  |  |
| `侧边栏编辑` | `Fold内屏` | `N` | `absent` |  |  |
| `侧边栏编辑` | `Fold内屏` | `L` | `absent` |  | 原始记录为 `-` |
| `侧边栏编辑` | `Fold内屏` | `C` | `absent` |  |  |
| `侧边栏编辑` | `Pad竖屏` | `NC` | `variant` | `Sidebar-Component_03` |  |
| `侧边栏编辑` | `Pad竖屏` | `C` | `absent` |  | 原始记录为 `-` |
| `侧边栏编辑` | `Pad横屏` | `NC` | `variant` | `Sidebar-Component_03` |  |
| `侧边栏编辑` | `Pad横屏` | `C` | `absent` |  | 原始记录为 `-` |
| `AI输入框` | `Phone` | `N` | `hidden` |  | 原始记录为 `null` |
| `AI输入框` | `Phone` | `L` | `hidden` |  | 原始记录为 `null` |
| `AI输入框` | `Phone` | `C` | `variant` | `输入框1` | 临时命名，待补正式 `variantId` |
| `AI输入框` | `Fold外屏` | `N` | `absent` |  |  |
| `AI输入框` | `Fold外屏` | `L` | `absent` |  |  |
| `AI输入框` | `Fold外屏` | `C` | `absent` |  |  |
| `AI输入框` | `Fold内屏` | `N` | `hidden` |  | 原始记录为 `null` |
| `AI输入框` | `Fold内屏` | `L` | `hidden` |  | 原始记录为 `null` |
| `AI输入框` | `Fold内屏` | `C` | `variant` | `输入框1` | 临时命名，待补正式 `variantId` |
| `AI输入框` | `Pad竖屏` | `NC` | `hidden` |  | 原始记录为 `null` |
| `AI输入框` | `Pad竖屏` | `C` | `variant` | `输入框1` | 临时命名，待补正式 `variantId` |
| `AI输入框` | `Pad横屏` | `NC` | `hidden` |  | 原始记录为 `null` |
| `AI输入框` | `Pad横屏` | `C` | `variant` | `输入框1` | 临时命名，待补正式 `variantId` |

## 当前覆盖缺口

以下 `uiElement` 仍未形成正式映射，后续补齐后建议直接追加到上表：

- `列表`
- `宫格`
- `新建工具栏`
- `列表-编辑中`
- `宫格-编辑中`
