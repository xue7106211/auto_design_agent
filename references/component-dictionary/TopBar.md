# TopBar 组件字典参考

本文档是 `figma-component-dictionary.md` 的组件族 reference，只服务 `componentFamily = TopBar`（通用顶部栏）。

## 适用记录

命中以下 `variantId` 时加载本文档：

- `TopBar_00`（无顶部导航）
- `TopBar_01`（顶部导航组合：NavigationBar_ComponentSet_10 + TopBar_Navigation_01）
- `TopBar_02`（顶部导航组合_返回：NavigationBar_ComponentSet_11 + TopBar_Navigation_01）

> 业务_日历 顶部栏复合体 `TopBar_Calendar_01` 已分离至 `Calendar_TopBar.md`（family = `Calendar_TopBar`）。
> `TopBar_03 / _04 / _05 / _06 / _07`（含搜索的复合体）按 CSV2 family 归属 `SearchBar`，详见 `SearchBar.md`。
> `TopBar_Navigation_01` sub-variant 在与 NavigationBar 复合时由 `NavigationBar.md` 提供基础 spec；与 Calendar 复合时由 `Calendar_TopBar.md` 提供 spec。

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `TopBar_00` / `TopBar_01` / `TopBar_02` |

## 内部 padding（按 CSV2）

| 变体 | padding |
| --- | --- |
| `TopBar_00` | 待补 |
| `TopBar_01` | 左 12；右 12 |
| `TopBar_02` | 左 12；右 12 |

## 已验证 nodeId（继承自旧 `NavigationBar.md` 探查）

| variantId | nodeId | size | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- |
| `TopBar_00` | `124384:75396` | `1422x56` | `11228235e3de54e013d5bce361b668e902ba7143` | `probed` |

> 注意：`TopBar_00` 当前作为 `NavigationBar_ComponentSet` 同集变体被探查到。CSV2 把 family 重新归属为 `TopBar`，但执行路径仍可能通过 NavigationBar 组件集 `setProperties({VariantId: "TopBar_00"})` 触达。具体走法见 `NavigationBar.md`「执行规则」。

## 落位规则

- TopBar 是 Pad / Fold 大屏的顶栏容器，承载 NavigationBar + 可选 SearchBar / Navigation 中段
- 与具体业务复合时，优先查业务 family 文件（`Calendar_TopBar.md` / `SearchBar.md`）

## 缺口

- `TopBar_01` / `TopBar_02` 的 nodeId / componentKey 待 Figma 探查
- `TopBar_00` 在重新切分 family 后是否需要独立组件集，待确认

> CSV2 同步日期：2026-05-19。从 `NavigationBar.md` 切分独立 family。
