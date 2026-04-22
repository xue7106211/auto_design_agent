# 组件路由表

本文档记录高频组件在 Figma 组件库中的精确 componentKey，供 AI 直接定位组件，避免搜索不准或速度慢。

> **负责人**：一飞
> 使用前建议先用 `search_design_system` 测试搜索效果，如果搜索足够准确，本表作为兜底补充。
> 组件的适配映射关系（手机端 → 目标设备）见 `component-adaptation.md`。

## 使用方式

AI 在需要调用组件时：
1. 优先使用 `search_design_system` 搜索
2. 搜索结果不准确时，查阅本表获取精确 componentKey
3. 通过 `importComponentSetByKeyAsync` 或 `importComponentByKeyAsync` 实例化

## 导航类

| 组件名 | 类型 | componentKey | 备注 |
|--------|------|-------------|------|
| BottomBar-Showcase | component_set | `225b7b2887bbf495234da3e5c485878adad6cbaa` | 竖屏悬浮底部栏 |
| BottomBar-Horizontal-Showcase | component_set | `f6274cf3f8fddc5ba79546cf2595215d1b44b465` | 横屏悬浮底部栏 |
| BottomBar-Mini-Showcase | component_set | `5e55632f7fbb01e701a3e59a460780944413de0f` | 小尺寸屏底部栏 |
| BottomTab-Showcase | component_set | `ea64cdb5d6f0f128052728bfb3de4e220e298670` | 竖屏 tab |
| BottomTab-Horizontal-Showcase | component_set | `0799ea3b430742f8053fb5192f64dcd84bda3739` | 横屏 tab |
| BottomTab-Mini-Showcase | component_set | `91f0e06fb65f1605a929ecc53e24291c1bfd4462` | 小尺寸屏 tab |
| Sidebar-Component | component | `cc53f6f08d2b3b6571e0aa65f10ca11f751dbe84` | 侧边导航栏（NLC / NC 的 N 栏） |


## 顶部栏

| 组件名 | 类型 | componentKey | 备注 |
|--------|------|-------------|------|
| Pad-TopBar | component | `8c86de4da41e550784b835f9ce615302a7d8177d` | L 栏 / C 栏用小标题 |

## FAB

| 组件名 | 类型 | componentKey | 备注 |
|--------|------|-------------|------|
| Fab-Showcase | component_set | `7710c1d8bacc622f1a86d99fda527fabd1fbd511` | 悬浮操作按钮 |
| Fab-MiniHorizontal-Showcase | component_set | `9844d874aad35b9928228461e784267277855680` | 横向迷你 FAB |

## 搜索栏

| 组件名 | 类型 | componentKey | 备注 |
|--------|------|-------------|------|
| SearchBar-ComponentSet | component_set | `f845b46113de732897ad097e9d266a682109603c` | 搜索栏 |

## 其他

| 组件名 | 类型 | componentKey | 备注 |
|--------|------|-------------|------|
| Overlay-Showcase | component_set | `423531a595f296056d1b0297a1dc755e9548999c` | 遮罩层 |
| Overlay-MiniHorizontal-Showcase | component_set | `56a62cee005f9a32d3a90fac77bd6a3771eed5cc` | 横向迷你遮罩层 |

> 以上均来自 **Xiaomi Hyper OS4 UI Kit** 组件库。后续发现新的高频组件时持续补充。
