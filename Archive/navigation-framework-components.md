# 导航框架组件调用表

本文档给 `figma-navigation-framework-components.md` 提供第一波导航框架组件的定位锚点、推荐关键词和已知切换规则。

> 范围：只覆盖组件调用与属性切换，不覆盖整页布局改造。
> 原则：没有探查结果时，不要猜属性名；先用本表定位组件，再读取实例的真实属性。

## 使用方式

1. 先按“组件名”定位本次要处理的组件
2. 用“推荐搜索词”走 `search_design_system`
3. 搜索结果不准时，用“Figma 锚点”回到 UI Kit 对应节点
4. 如果本表写明“已知属性”，可优先验证这些键和值是否存在
5. 如果本表写明“替换”，说明这是跨组件族操作，不要只切属性

## 组件清单

| 组件 | Figma 锚点 | 推荐搜索词 | 获取方式建议 | 已知属性 / 目标值 | 调用说明 |
|------|-----------|-----------|-------------|-------------------|---------|
| 标题栏（手机 NavigationBar） | https://www.figma.com/design/7PVSm4yEbknNLFaqauI4EM/Xiaomi-Hyper-OS4-UI-Kit?node-id=1890-3345&t=1XpD5lqT7Of7PW3I-11 | `NavigationBar` | 先搜组件集，再探查实例属性 | 已知可能出现 `样式`、`标题类型`；Q18 常见目标值有 `中标题一级`、`中标题（Q18）`、`中标题二级页` | 同名标题栏可能来自不同组件集，必须先读 `mainComponent` |
| Pad 端标题栏（Pad-TopBar） | https://www.figma.com/design/7PVSm4yEbknNLFaqauI4EM/Xiaomi-Hyper-OS4-UI-Kit?node-id=80765-11993&t=1XpD5lqT7Of7PW3I-11 | `Pad-TopBar` | 优先用搜索；若搜不稳，用锚点定位 | 通常用于 Pad 的 L 栏 / C 栏小标题 56dp | 手机标题栏切到 Pad L/C 栏时，优先换成它，不要强行沿用手机 NavigationBar |
| 搜索栏 | https://www.figma.com/design/7PVSm4yEbknNLFaqauI4EM/Xiaomi-Hyper-OS4-UI-Kit?node-id=1890-7003&t=1XpD5lqT7Of7PW3I-11 | `SearchBar-ComponentSet` | 先搜；搜不到再查 `component-routing.md` | 当前仓库已知组件 key：`f845b46113de732897ad097e9d266a682109603c` | 优先保留组件族，通过宽度和容器适配大屏 |
| 标签栏 | https://www.figma.com/design/7PVSm4yEbknNLFaqauI4EM/Xiaomi-Hyper-OS4-UI-Kit?node-id=36597-12853&t=1XpD5lqT7Of7PW3I-11 | `Tab` / `Tabs` / 组件实际命名 | 先用锚点确认组件名，再搜索 | 已知案例存在 `样式: 白底 -> 灰底`；同时可能有 `状态` 属性 | Q18 列表场景优先验证灰底样式是否可用 |
| 分段按钮 | https://www.figma.com/design/7PVSm4yEbknNLFaqauI4EM/Xiaomi-Hyper-OS4-UI-Kit?node-id=105830-9508&t=1XpD5lqT7Of7PW3I-11 | `SegmentedControls` | 先搜组件集；搜不稳时回锚点 | 未沉淀统一属性名，必须先探查 | 保留分段数量、文案顺序、选中态 |
| 底部导航栏 | https://www.figma.com/design/7PVSm4yEbknNLFaqauI4EM/Xiaomi-Hyper-OS4-UI-Kit?node-id=2-4&p=f&t=1XpD5lqT7Of7PW3I-11 | `BottomBar-Showcase` / `BottomTab-Showcase` | 优先查 `component-routing.md` | 已知横屏替换：`BottomBar-Showcase` → `BottomBar-Horizontal-Showcase`；`BottomTab-Showcase` → `BottomTab-Horizontal-Showcase` | NLC / NC 下通常不是切属性，而是改为 Sidebar 语义 |
| 底部工具栏 | https://www.figma.com/design/7PVSm4yEbknNLFaqauI4EM/Xiaomi-Hyper-OS4-UI-Kit?node-id=80431-27747&t=1XpD5lqT7Of7PW3I-11 | `BottomToolbar` / 组件实际命名 | 先用锚点确认名称 | 暂无稳定属性名；必须先探查 | 仅在页面仍保留底部操作区语义时继续使用 |
| 侧边导航栏 | https://www.figma.com/design/7PVSm4yEbknNLFaqauI4EM/Xiaomi-Hyper-OS4-UI-Kit?node-id=80443-18827&t=1XpD5lqT7Of7PW3I-11 | `Sidebar-Component` | 优先查 `component-routing.md` 或直接搜索 | 当前仓库已知组件 key：`cc53f6f08d2b3b6571e0aa65f10ca11f751dbe84` | 用于 NLC / NC 的 N 栏，导航项来自源底部 Tab |

## 已知切换规则

### 1. 标题栏

| 来源 | 目标 | 处理方式 | 备注 |
|------|------|---------|------|
| 手机 NavigationBar | Fold Q18 左栏 | 同组件族切属性 | 已知案例：`样式: 大标题 -> 中标题一级` |
| 手机 NavigationBar / 详情标题栏 | Fold Q18 详情区 | 同组件族切属性 | 已知常见目标值：`中标题（Q18）` 或 `中标题二级页` |
| 手机 NavigationBar | Pad N 栏 | 先探查后切换或替换 | 取决于具体标题层级，常见为中标题 / 大标题 |
| 手机 NavigationBar | Pad L 栏 / C 栏 | 替换为 `Pad-TopBar` | 小标题 56dp 为默认优先项 |

### 2. 底部导航

| 来源 | 目标 | 处理方式 | 备注 |
|------|------|---------|------|
| `BottomBar-Showcase` | 横屏底部导航 | 同组件族换横屏变体 | 用 `BottomBar-Horizontal-Showcase` |
| `BottomTab-Showcase` | 横屏底部 Tab | 同组件族换横屏变体 | 用 `BottomTab-Horizontal-Showcase` |
| 手机底部导航 | NLC / NC | 替换为 `Sidebar-Component` | 迁移图标、文案、顺序、选中态 |
| 手机底部导航 | LC / C | 通常保留悬浮底部导航 | 位置和宽度按布局规则调整 |

### 3. 标签栏

| 来源 | 目标 | 处理方式 | 备注 |
|------|------|---------|------|
| 手机标签栏 | Fold Q18 列表场景 | 同组件族切属性 | 已知案例：`样式: 白底 -> 灰底` |

## 探查重点

以下组件在当前仓库里仍然需要“先探查，再定值”：

- 标签栏
- 分段按钮
- 底部工具栏

执行时至少要确认：

- `variantProperties`
- `componentProperties`
- 可选值列表
- 是否属于 component set，还是独立 component
