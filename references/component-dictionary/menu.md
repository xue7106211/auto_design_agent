# Menu 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = Menu`（浮层菜单）。

## 适用记录

- `Menu_ComponentSet_00`（待入库 / 占位）
- `Menu_ComponentSet_01`（默认 / 进入二级菜单）
- `Menu_ComponentSet_02`（分组 / 选择菜单）
- `Menu_ComponentSet_03`（分组 / 进入二级菜单）

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `_00` / `_01` / `_02` / `_03` |

## 内部 padding（按 CSV2）

| 场景 | 内置 padding |
| --- | --- |
| 默认（从父样式） | 上 6；右 12 |
| 在侧边栏 / 容器内 | 从容器顶部 12；右 12 |

## 落位规则

- **触发**：点击 trigger 元素（NavigationBar 右图标 / SelectableChip / List item 右图标 等）
- **位置**：anchor 至 trigger，按可用空间向下 / 向上展开
- **z-order**：浮层最顶 z-order，在 mask / 杆子 之下

## 缺口

- 各 variant 的 `nodeId` / `componentKey` / `componentSetId` 待补
- 自然尺寸（每 variant）待 探查

> CSV1 / CSV2 同步日期：2026-05-18。
