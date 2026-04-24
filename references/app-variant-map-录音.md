---
name: app-variant-map
description: 录音应用的语义组件在不同设备与屏幕模式下的目标变体映射表。供 `figma-component-dictionary.md` 在识别当前实例语义后查询。
app: 录音
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

> 本文档由 `figma-component-dictionary.md` 的 Step 1 按需加载。
> 查到目标记录后，回到主文档继续 Step 2-6 执行。

# 录音 App Variant Map

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
| `L` | List，列表画面 |
| `C` | Content，内容画面 |
| `LC` | List + Content 复合画面 |

### 状态约定

| `resultType` | 含义 |
| --- | --- |
| `variant` | 单元格命中真实 `variantId` |
| `hidden` | 元素保留语义但当前场景不显示 |
| `absent` | 该场景下无此元素 |
| `undefined` | 尚未定义 |

## 映射表

仅记录各设备的有效 `screenMode` 组合：

- `Phone` / `Fold外屏` 只使用全屏（等效 `L` + Fab）
- `Fold内屏` 使用 `LC`
- `Pad竖屏` / `Pad横屏` 使用 `LC`
- 若传入设备不支持的 `screenMode`，视为无效输入，应直接报错

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `页面框架` | `Phone` | `L` | `absent` | | L栏本体，具体组件待定义 |
| `Fab` | `Phone` | `L` | `variant` | `Fab_Rec_01` | 录音专用 Fab |
| `页面框架` | `Fold外屏` | `L` | `absent` | | L栏本体，具体组件待定义 |
| `Fab` | `Fold外屏` | `L` | `variant` | `Fab_Rec_01` | |
| `侧边栏` | `Fold内屏` | `LC` | `variant` | `Sidebar_Component_Fold_LC_Fab_01` | Fold专用侧边栏带Fab（Sidebar_Component_Fold_LC_01 + Fab_01） |
| `Fab` | `Fold内屏` | `LC` | `variant` | `Fab_Rec_01` | |
| `侧边栏` | `Pad竖屏` | `LC` | `variant` | `Sidebar_Component_PAD_LC_Fab_01` | Pad专用侧边栏带Fab（Sidebar_Component_PAD_LC_01 + Fab_01 + Fab_Rec_01） |
| `Fab` | `Pad竖屏` | `LC` | `variant` | `Fab_Rec_01` | |
| `侧边栏` | `Pad横屏` | `LC` | `variant` | `Sidebar_Component_PAD_LC_Fab_01` | |
| `Fab` | `Pad横屏` | `LC` | `variant` | `Fab_Rec_01` | |

## 当前覆盖缺口

以下内容仍未形成正式映射，后续补齐后建议直接追加到上表：

- Phone / Fold外屏 横屏模式
- Phone / Fold外屏 L栏具体组件定义
- UI 元素级详细映射（标题栏、搜索栏、工具栏等逐项）
