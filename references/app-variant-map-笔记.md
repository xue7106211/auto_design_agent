---
name: app-variant-map
description: 笔记应用的语义组件在不同设备与屏幕模式下的目标变体映射表。供 `figma-component-dictionary.md` 在识别当前实例语义后查询。
app: 笔记
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

> 本文档由 `figma-component-dictionary.md` 的 Step 1 按需加载。
> 查到目标记录后，回到主文档继续 Step 2-6 执行。

# 笔记 App Variant Map

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
| `LC` | List + Content 复合画面 |
| `NLC` | Navigation + List + Content 三栏 |

### 状态约定

| `resultType` | 含义 |
| --- | --- |
| `variant` | 单元格命中真实 `variantId` |
| `hidden` | 元素保留语义但当前场景不显示 |
| `absent` | 该场景下无此元素 |
| `undefined` | 尚未定义 |

## 子场景说明

笔记应用包含两个子场景，通过 `uiElement` 前缀区分：

| 子场景 | uiElement 前缀 | 说明 |
|--------|---------------|------|
| 笔记列表 | `笔记_` | 笔记列表浏览与管理 |
| 图文编辑 | `图文_` | 图文编辑模式 |

## 映射表

仅记录各设备的有效 `screenMode` 组合：

- `Phone` / `Fold外屏` 只使用全屏（等效 `L`）
- `Fold内屏` 使用 `NC` / `LC` / `C`
- `Pad竖屏` / `Pad横屏` 使用 `NLC` / `NC` / `LC` / `C`
- 若传入设备不支持的 `screenMode`，视为无效输入，应直接报错

### 笔记列表场景

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `笔记_页面框架` | `Phone` | `L` | `variant` | `BottomBar_Showcase_Notes_01` | |
| `笔记_页面框架` | `Fold外屏` | `L` | `variant` | `BottomBar_Showcase_Notes_01` | |
| `笔记_页面框架` | `Fold内屏` | `NC` | `absent` | | |
| `笔记_页面框架` | `Fold内屏` | `LC` | `variant` | `BottomBar_Showcase_Notes_01` | |
| `笔记_页面框架` | `Fold内屏` | `C` | `absent` | | |
| `笔记_页面框架` | `Pad竖屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | L栏侧边栏 |
| `笔记_页面框架` | `Pad竖屏` | `NC` | `absent` | | |
| `笔记_页面框架` | `Pad竖屏` | `LC` | `absent` | | |
| `笔记_页面框架` | `Pad竖屏` | `C` | `absent` | | |
| `笔记_页面框架` | `Pad横屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | L栏侧边栏 |
| `笔记_页面框架` | `Pad横屏` | `NC` | `absent` | | |
| `笔记_页面框架` | `Pad横屏` | `LC` | `absent` | | |
| `笔记_页面框架` | `Pad横屏` | `C` | `absent` | | |

### 图文编辑场景

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `图文_标题栏` | `Phone` | `L` | `variant` | `NavigationBar_ComponentSet_02` | 返回标题栏 |
| `图文_Fab` | `Phone` | `L` | `variant` | `Fab_01` | |
| `图文_标题栏` | `Fold外屏` | `L` | `variant` | `NavigationBar_ComponentSet_02` | |
| `图文_Fab` | `Fold外屏` | `L` | `variant` | `Fab_01` | |
| `图文_标题栏` | `Fold内屏` | `NC` | `variant` | `NavigationBar_ComponentSet_02` | N面板承载 |
| `图文_Fab` | `Fold内屏` | `NC` | `absent` | | |
| `图文_标题栏` | `Fold内屏` | `LC` | `absent` | | |
| `图文_Fab` | `Fold内屏` | `LC` | `absent` | | |
| `图文_标题栏` | `Fold内屏` | `C` | `absent` | | |
| `图文_Fab` | `Fold内屏` | `C` | `variant` | `Fab_01` | C面板承载 |
| `图文_页面框架` | `Pad竖屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | L栏侧边栏 |
| `图文_标题栏` | `Pad竖屏` | `NLC` | `absent` | | |
| `图文_Fab` | `Pad竖屏` | `NLC` | `absent` | | |
| `图文_页面框架` | `Pad竖屏` | `NC` | `absent` | | |
| `图文_页面框架` | `Pad竖屏` | `LC` | `absent` | | |
| `图文_页面框架` | `Pad竖屏` | `C` | `absent` | | |
| `图文_页面框架` | `Pad横屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | L栏侧边栏 |
| `图文_标题栏` | `Pad横屏` | `NLC` | `absent` | | |
| `图文_Fab` | `Pad横屏` | `NLC` | `absent` | | |
| `图文_页面框架` | `Pad横屏` | `NC` | `absent` | | |
| `图文_页面框架` | `Pad横屏` | `LC` | `absent` | | |
| `图文_页面框架` | `Pad横屏` | `C` | `absent` | | |

## 当前覆盖缺口

以下内容仍未形成正式映射，后续补齐后建议直接追加到上表：

- Phone 横屏模式
- Fold 外屏横屏模式
- NLC收起模式下的映射
- 各子场景的 UI 元素级详细映射（标题栏、搜索栏、工具栏等逐项）
