# 组件适配映射表

本文档定义手机端组件在不同设备 / 布局下应替换为哪个目标组件。

> **负责人**：老唐
> **Kim 修改建议**：基于 Figma UI Kit 组件库实测补充。组件 Key 查 `component-routing.md`。

## 使用方式

适配时按以下步骤操作：

1. 识别手机端源页面中的组件
2. 根据目标设备和布局类型，查本表找到对应的目标组件
3. 通过 `search_design_system` 搜索目标组件，搜索失败时查 `component-routing.md` 获取精确路径
4. 用目标组件替换源组件

## 导航类组件

### Pad

| 手机端组件 | 目标布局 | 目标组件 | 说明 |
|-----------|---------|---------|------|
| 悬浮底部导航栏（BottomBar-Showcase） | NLC | Sidebar-Component | 底部 Tab 转为侧边导航栏（N 栏），原悬浮底部导航栏移除 |
| 悬浮底部导航栏（BottomBar-Showcase） | NC | Sidebar-Component | 同上，底部 Tab 转为 N 栏 |
| 悬浮底部导航栏（BottomBar-Showcase） | LC | 保留（悬浮） | LC 无 N 栏，悬浮底部导航栏保留 |
| 悬浮底部导航栏（BottomBar-Showcase） | C | 保留（悬浮） | 悬浮底部导航栏保留，不转为侧边导航 |

### Fold 内屏

| 手机端组件 | 目标布局 | 目标组件 | 说明 |
|-----------|---------|---------|------|
| 悬浮底部导航栏（BottomBar-Showcase） | 分栏（左栏为 N） | Sidebar-Component | 底部 Tab 转为侧边导航栏，原悬浮底部导航栏移除 |
| 悬浮底部导航栏（BottomBar-Showcase） | 通栏 | 保留（悬浮） | 悬浮底部导航栏保留 |
| 悬浮底部导航栏（BottomBar-Showcase） | 分栏 LC + 底导航并存（Q18 特殊） | 保留（悬浮） | 底导航与 fab 分开展示，fab 置于最右侧，底导航控制在左侧 L 栏宽度以内（详见 `device-dimensions.md`） |

### 横屏 / 小尺寸屏组件替换（Fold / Pad 通用）

| 手机端组件 | 目标场景 | 目标组件 | 说明 |
|-----------|---------|---------|------|
| 悬浮底部导航栏（BottomBar-Showcase） | 横屏 | BottomBar-Horizontal-Showcase | 竖屏组件替换为横屏组件 |
| 悬浮底部导航 tab（BottomTab-Showcase） | 横屏 | BottomTab-Horizontal-Showcase | 竖屏 tab 替换为横屏 tab |


## 标题栏类组件

### Fold 内屏

| 手机端组件 | 目标栏 | 目标组件 | 说明 |
|-----------|-------|---------|------|
| 大标题 / 小标题（NavigationBar 手机端变形） | 各栏 | 中标题（NavigationBar Fold 变形） | 56dp；多行时 64dp |

### Pad

| 手机端组件 | 目标栏 | 目标组件 | 说明 |
|-----------|-------|---------|------|
| 大标题 / 小标题（NavigationBar 手机端变形） | N 栏 | 中标题 56dp / 大标题 116dp | — |
| 大标题 / 小标题（NavigationBar 手机端变形） | L 栏 | 小标题 56dp | — |
| 大标题 / 小标题（NavigationBar 手机端变形） | C 栏 | 小标题 56dp | — |

## FAB 类组件

| 手机端组件 | 目标布局 | 目标组件 | 说明 |
|-----------|---------|---------|------|
| 悬浮操作按钮（Fab-Showcase） | 所有 | Fab-Showcase（保留） | FAB 组件跨设备通用，位置按布局规则调整 |


## 通用规则

- 优先通过 `search_design_system` 搜索目标组件
- 搜索失败时查 `component-routing.md` 获取 componentKey
- 两者均失败时，clone 画布上已有的目标设备组件实例
