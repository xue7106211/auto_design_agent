---
name: app-variant-map
description: 笔记应用的语义组件在不同设备与屏幕模式下的目标变体映射表
app: 笔记
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

# 笔记 App Variant Map

## 查询契约

- 输入：`appName + device + screenMode + resolvedUiElement`
- 输出：`resultType + variantId`
- 若未命中：返回 `undefined`，调用方必须中止，不允许猜测

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
| `L` | List，列表画面 |
| `C` | Content，内容画面 |
| `NC` | Navigation + Content 复合画面 |
| `LC` | List + Content 复合画面 |
| `NLC` | Navigation + List + Content 三栏 |

### `resultType`

| 值 | 含义 |
| --- | --- |
| `variant` | 命中真实 `variantId` |
| `hidden` | 元素保留语义但当前场景不显示 |
| `absent` | 该场景下无此元素 |
| `undefined` | 尚未建档，调用方必须中止 |

## 子场景约定

| 子场景 | uiElement 前缀 | 说明 |
| --- | --- | --- |
| 笔记列表 | `笔记_` | 笔记列表浏览与管理 |
| 图文编辑 | `图文_` | 图文编辑模式 |

## 业务语义约束

- 笔记 Fold 内屏 `LC` 的左栏是笔记列表 / 列表骨架承载区，不是侧边导航栏。
- 笔记 Fold 内屏 `LC` 不允许将 `BottomBar_Showcase_Notes_01`、列表骨架或底部导航缺失情况 fallback 到 `Sidebar_Component_Fold_LC_01`。
- 如果当前 Figma 组件集未暴露 `BottomBar_Showcase_Notes_01`，调用方应中止并汇报目标变体不可访问，或退化为空列表容器 / 源内容低密度占位；不得引入新的 `Sidebar` 语义。
- 笔记 Pad `NLC` 才由 N 栏 `Sidebar_Component_PAD_NLC_01` 承载导航。

## 映射表

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `笔记_导航` | `Phone` | `L` | `variant` | `NavigationBar_ComponentSet_01` | 图文图标 |
| `笔记_导航` | `Fold外屏` | `L` | `variant` | `NavigationBar_ComponentSet_04` | 图文图标 |
| `笔记_导航` | `Fold内屏` | `LC` | `variant` | `NavigationBar_ComponentSet_04` | 图文图标 |
| `笔记_导航` | `Pad竖屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | L栏侧边栏 |
| `笔记_导航` | `Pad竖屏` | `C` | `variant` | `TopBar_05` | |
| `笔记_导航` | `Pad横屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | L栏侧边栏 |
| `笔记_导航` | `Pad横屏` | `C` | `variant` | `TopBar_05` | |
| `笔记_搜索` | `Phone` | `L` | `variant` | `SearchBar_ComponentSet_02` | |
| `笔记_搜索` | `Fold外屏` | `L` | `variant` | `SearchBar_ComponentSet_02` | |
| `笔记_搜索` | `Fold内屏` | `LC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `笔记_搜索` | `Pad竖屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_07` | L栏搜索图标 |
| `笔记_搜索` | `Pad竖屏` | `C` | `absent` | | TopBar_05 搜索栏（集成在导航组件内） |
| `笔记_搜索` | `Pad横屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_07` | L栏搜索图标 |
| `笔记_搜索` | `Pad横屏` | `C` | `absent` | | TopBar_05 搜索栏（集成在导航组件内） |
| `笔记_标签栏` | `Phone` | `L` | `variant` | `SelectableChip_ComponentSet_Notes_01` | |
| `笔记_标签栏` | `Fold外屏` | `L` | `variant` | `SelectableChip_ComponentSet_Notes_01` | |
| `笔记_标签栏` | `Fold内屏` | `LC` | `variant` | `SelectableChip_ComponentSet_Notes_01` | L栏 |
| `笔记_标签栏` | `Pad竖屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_12` | N栏文件夹列表 |
| `笔记_标签栏` | `Pad竖屏` | `NLC收起` | `hidden` | | 侧边栏隐藏；不展示 NavigationBar_ComponentSet_12 文件夹列表 |
| `笔记_标签栏` | `Pad横屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_12` | N栏文件夹列表 |
| `笔记_标签栏` | `Pad横屏` | `NLC收起` | `hidden` | | 侧边栏隐藏；不展示 NavigationBar_ComponentSet_12 文件夹列表 |
| `笔记_底部工具栏` | `Phone` | `L` | `variant` | `BottomBar_Showcase_Notes_01` | |
| `笔记_底部工具栏` | `Fold外屏` | `L` | `variant` | `BottomBar_Showcase_Notes_01` | |
| `笔记_底部工具栏` | `Fold内屏` | `LC` | `variant` | `BottomBar_Showcase_Notes_01` | L栏承载 |
| `笔记_底部工具栏` | `Pad竖屏` | `NLC` | `variant` | `BottomBar_Showcase_Notes_01` | L栏承载 |
| `笔记_底部工具栏` | `Pad竖屏` | `C` | `variant` | `BottomBar_Showcase_Notes_01` | |
| `笔记_底部工具栏` | `Pad横屏` | `NLC` | `variant` | `BottomBar_Showcase_Notes_01` | L栏承载 |
| `笔记_底部工具栏` | `Pad横屏` | `C` | `variant` | `BottomBar_Showcase_Notes_01` | |
| `图文_标题栏` | `Phone` | `L` | `variant` | `NavigationBar_ComponentSet_02` | 返回标题栏 |
| `图文_Fab` | `Phone` | `L` | `variant` | `Fab_01` |  |
| `图文_标题栏` | `Fold外屏` | `L` | `variant` | `NavigationBar_ComponentSet_02` |  |
| `图文_Fab` | `Fold外屏` | `L` | `variant` | `Fab_01` |  |
| `图文_标题栏` | `Fold内屏` | `NC` | `variant` | `NavigationBar_ComponentSet_02` | N面板承载 |
| `图文_Fab` | `Fold内屏` | `NC` | `absent` |  | 当前场景不显示 |
| `图文_标题栏` | `Fold内屏` | `LC` | `absent` |  | 当前场景不显示 |
| `图文_Fab` | `Fold内屏` | `LC` | `absent` |  | 当前场景不显示 |
| `图文_标题栏` | `Fold内屏` | `C` | `absent` |  | 当前场景不显示 |
| `图文_Fab` | `Fold内屏` | `C` | `variant` | `Fab_01` | C面板承载 |
| `图文_页面框架` | `Pad竖屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | N栏侧边栏骨架 |
| `图文_标题栏` | `Pad竖屏` | `NLC` | `absent` |  | 当前场景不显示 |
| `图文_Fab` | `Pad竖屏` | `NLC` | `absent` |  | 当前场景不显示 |
| `图文_页面框架` | `Pad竖屏` | `NC` | `absent` |  | 当前场景不使用 |
| `图文_页面框架` | `Pad竖屏` | `LC` | `absent` |  | 当前场景不使用 |
| `图文_页面框架` | `Pad竖屏` | `C` | `absent` |  | 当前场景不使用 |
| `图文_页面框架` | `Pad横屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | N栏侧边栏骨架 |
| `图文_标题栏` | `Pad横屏` | `NLC` | `absent` |  | 当前场景不显示 |
| `图文_Fab` | `Pad横屏` | `NLC` | `absent` |  | 当前场景不显示 |
| `图文_页面框架` | `Pad横屏` | `NC` | `absent` |  | 当前场景不使用 |
| `图文_页面框架` | `Pad横屏` | `LC` | `absent` |  | 当前场景不使用 |
| `图文_页面框架` | `Pad横屏` | `C` | `absent` |  | 当前场景不使用 |

### 标题栏补充映射

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `笔记_标题栏` | `Phone` | `L` | `variant` | `NavigationBar_ComponentSet_01` | |
| `笔记_标题栏` | `Fold外屏` | `L` | `variant` | `NavigationBar_ComponentSet_04` | L栏 |
| `笔记_标题栏` | `Fold内屏` | `LC` | `variant` | `NavigationBar_ComponentSet_04` | L栏; C栏: NavigationBar_ComponentSet_Notes_01 |
| `笔记_标题栏` | `Pad竖屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_12` | N栏; L栏: _07; C栏: Notes_01 |
| `笔记_标题栏` | `Pad竖屏` | `C` | `absent` | | TopBar_05 标题栏（集成在导航组件内） |
| `笔记_标题栏` | `Pad横屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_12` | N栏; L栏: _07; C栏: Notes_01 |
| `笔记_标题栏` | `Pad横屏` | `C` | `absent` | | TopBar_05 标题栏（集成在导航组件内） |
| `图文_标题栏` | `Phone` | `L` | `variant` | `NavigationBar_ComponentSet_02` | |
| `图文_标题栏` | `Fold外屏` | `L` | `variant` | `NavigationBar_ComponentSet_05` | |
| `图文_标题栏` | `Fold内屏` | `LC` | `variant` | `NavigationBar_ComponentSet_05` | L栏; C栏: 无标题 |
| `图文_标题栏` | `Pad竖屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_12` | N栏; L栏: _07; C栏: 无标题 |
| `图文_标题栏` | `Pad竖屏` | `C` | `absent` | | TopBar_05 标题栏（集成在导航组件内） |
| `图文_标题栏` | `Pad横屏` | `NLC` | `variant` | `NavigationBar_ComponentSet_12` | N栏; L栏: _07; C栏: 无标题 |
| `图文_标题栏` | `Pad横屏` | `C` | `absent` | | TopBar_05 标题栏（集成在导航组件内） |

## 栏背景色

按设备和 screenMode 逐一标注各栏背景色。「不存在」表示笔记应用不使用该模式。

### 手机

| screenMode | 主 frame | N 栏 | L 栏 | C 栏 | 侧边栏卡片 |
|-----------|---------|------|------|------|----------|
| 竖屏 | 背景色/surface_low | 不存在 | 不存在 | 背景色/surface_low | 不存在 |
| 横屏 | 待定 | 不存在 | 不存在 | 待定 | 不存在 |

### Fold Q18 — 外屏

| screenMode | 主 frame | N 栏 | L 栏 | C 栏 | 侧边栏卡片 |
|-----------|---------|------|------|------|----------|
| 竖屏 | 背景色/surface_low | 不存在 | 不存在 | 背景色/surface_low | 不存在 |
| 横屏 | 待定 | 不存在 | 不存在 | 待定 | 不存在 |

### Fold Q18 — 内屏 / 竖屏

| screenMode | 主 frame | N 栏 | L 栏 | C 栏 | 侧边栏卡片 |
|-----------|---------|------|------|------|----------|
| NC | 不存在 | 不存在 | 不存在 | 不存在 | 不存在 |
| LC | 背景色/surface | 不存在 | 背景色/surface | 背景色/surface | 不存在 |
| C | 不存在 | 不存在 | 不存在 | 不存在 | 不存在 |

### Fold Q18 — 内屏 / 横屏

| screenMode | 主 frame | N 栏 | L 栏 | C 栏 | 侧边栏卡片 |
|-----------|---------|------|------|------|----------|
| NC | 不存在 | 不存在 | 不存在 | 不存在 | 不存在 |
| LC | 背景色/surface | 不存在 | 背景色/surface | 背景色/surface | 不存在 |
| C | 不存在 | 不存在 | 不存在 | 不存在 | 不存在 |

### Pad — 竖屏

| screenMode | 主 frame | N 栏 | L 栏 | C 栏 | 侧边栏卡片 |
|-----------|---------|------|------|------|----------|
| NLC | 背景色/surface | 背景色/surface | 背景色/surface | 背景色/surface | 背景色/surface |
| NLC 收起 | 背景色/surface | 背景色/surface | 背景色/surface | 背景色/surface | 不存在 |
| NC | 不存在 | 不存在 | 不存在 | 不存在 | 不存在 |
| LC | 不存在 | 不存在 | 不存在 | 不存在 | 不存在 |
| C | 背景色/surface_low | 不存在 | 不存在 | 背景色/surface_low | 不存在 |

### Pad — 横屏

| screenMode | 主 frame | N 栏 | L 栏 | C 栏 | 侧边栏卡片 |
|-----------|---------|------|------|------|----------|
| NLC | 背景色/surface | 背景色/surface | 背景色/surface | 背景色/surface | 背景色/surface |
| NLC 收起 | 背景色/surface | 背景色/surface | 背景色/surface | 背景色/surface | 不存在 |
| NC | 不存在 | 不存在 | 不存在 | 不存在 | 不存在 |
| LC | 不存在 | 不存在 | 不存在 | 不存在 | 不存在 |
| C | 背景色/surface_low | 不存在 | 不存在 | 背景色/surface_low | 不存在 |

## 当前覆盖缺口

以下内容仍未形成正式映射，后续补齐后建议直接追加到上表：

- Phone 横屏模式
- Fold 外屏横屏模式
- NLC收起模式下的映射
