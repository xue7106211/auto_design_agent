---
name: app-variant-map
description: 电话应用的语义组件在不同设备与屏幕模式下的目标变体映射表。包含"展示拨号键盘"和"收起拨号键盘"两个子场景。
app: 电话
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

> 本文档由 `figma-component-dictionary.md` 的 Step 1 按需加载。

# 电话 App Variant Map

## 子场景说明

| 子场景 | uiElement 前缀 | 说明 |
|--------|---------------|------|
| 展示拨号键盘 | `展示_` | 拨号键盘展开状态 |
| 收起拨号键盘 | `收起_` | 拨号键盘收起状态 |

## 映射表

### 展示拨号键盘

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `展示_导航` | `Phone` | `L` | `variant` | `BottomBar_Showcase_Fab_01` | |
| `展示_导航` | `Fold外屏` | `L` | `hidden` | | 隐藏导航栏 |
| `展示_导航` | `Fold内屏` | `LC` | `variant` | `BottomBar_Showcase_02` | L栏 |
| `展示_导航` | `Pad竖屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | N栏 |
| `展示_导航` | `Pad竖屏` | `NLC收起` | `variant` | `Sidebar_Component_PAD_NLC_02` | N栏收起 |
| `展示_导航` | `Pad横屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | N栏 |
| `展示_导航` | `Pad横屏` | `NLC收起` | `variant` | `Sidebar_Component_PAD_NLC_02` | N栏收起 |
| `展示_搜索` | `Phone` | `L` | `variant` | `SearchBar_ComponentSet_02` | |
| `展示_搜索` | `Fold外屏` | `L` | `variant` | `SearchBar_ComponentSet_02` | |
| `展示_搜索` | `Fold内屏` | `LC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `展示_搜索` | `Pad竖屏` | `NLC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `展示_搜索` | `Pad竖屏` | `NLC收起` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `展示_搜索` | `Pad横屏` | `NLC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `展示_搜索` | `Pad横屏` | `NLC收起` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `展示_Fab` | `Phone` | `L` | `variant` | `Fab_01` | 白色 |
| `展示_Fab` | `Fold外屏` | `L` | `absent` | | 变为拨号盘功能区按键 |
| `展示_Fab` | `Fold内屏` | `LC` | `absent` | | C栏: Fab_01消失，拨号盘功能区按键 |
| `展示_Fab` | `Pad竖屏` | `NLC` | `absent` | | C栏: Fab_01消失，拨号盘功能区按键 |
| `展示_Fab` | `Pad竖屏` | `NLC收起` | `absent` | | C栏: Fab_01消失，拨号盘功能区按键 |
| `展示_Fab` | `Pad横屏` | `NLC` | `absent` | | C栏: Fab_01消失，拨号盘功能区按键 |
| `展示_Fab` | `Pad横屏` | `NLC收起` | `absent` | | C栏: Fab_01消失，拨号盘功能区按键 |

### 收起拨号键盘

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `收起_导航` | `Phone` | `L` | `variant` | `BottomBar_Showcase_Fab_01` | |
| `收起_导航` | `Fold外屏` | `L` | `variant` | `BottomBar_Showcase_Fab_01` | |
| `收起_导航` | `Fold内屏` | `LC` | `variant` | `BottomBar_Showcase_02` | L栏 |
| `收起_导航` | `Pad竖屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | N栏 |
| `收起_导航` | `Pad竖屏` | `NLC收起` | `variant` | `Sidebar_Component_PAD_NLC_02` | N栏收起 |
| `收起_导航` | `Pad横屏` | `NLC` | `variant` | `Sidebar_Component_PAD_NLC_01` | N栏 |
| `收起_导航` | `Pad横屏` | `NLC收起` | `variant` | `Sidebar_Component_PAD_NLC_02` | N栏收起 |
| `收起_搜索` | `Phone` | `L` | `variant` | `SearchBar_ComponentSet_02` | |
| `收起_搜索` | `Fold外屏` | `L` | `variant` | `SearchBar_ComponentSet_02` | |
| `收起_搜索` | `Fold内屏` | `LC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `收起_搜索` | `Pad竖屏` | `NLC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `收起_搜索` | `Pad竖屏` | `NLC收起` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `收起_搜索` | `Pad横屏` | `NLC` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `收起_搜索` | `Pad横屏` | `NLC收起` | `variant` | `SearchBar_ComponentSet_02` | L栏 |
| `收起_Fab` | `Phone` | `L` | `variant` | `Fab_01` | 彩色 |
| `收起_Fab` | `Fold外屏` | `L` | `variant` | `Fab_01` | 彩色 |
| `收起_Fab` | `Fold内屏` | `LC` | `variant` | `Fab_01` | C栏; 彩色 |
| `收起_Fab` | `Pad竖屏` | `NLC` | `variant` | `Fab_01` | C栏; 彩色 |
| `收起_Fab` | `Pad竖屏` | `NLC收起` | `variant` | `Fab_01` | C栏; 彩色 |
| `收起_Fab` | `Pad横屏` | `NLC` | `variant` | `Fab_01` | C栏; 彩色 |
| `收起_Fab` | `Pad横屏` | `NLC收起` | `variant` | `Fab_01` | C栏; 彩色 |
