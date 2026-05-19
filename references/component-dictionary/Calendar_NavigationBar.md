# Calendar_NavigationBar 组件字典参考

本文档是 `figma-component-dictionary.md` 的组件族 reference，只服务 `componentFamily = Calendar_NavigationBar`（业务_日历 NavigationBar）。

## 适用记录

命中以下 `variantId` 时加载本文档：

- `NavigationBar_ComponentSet_Calendar_01`（业务_日历 顶部 NavigationBar）

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `NavigationBar_ComponentSet_Calendar_01` |

## 内部 padding（按 CSV2）

| 变体 | padding |
| --- | --- |
| `NavigationBar_ComponentSet_Calendar_01` | 左 16；右 12 |

## 落位规则

- 用于「日历」应用顶栏，独立于通用 NavigationBar family
- 通用 NavigationBar spec 参见 `NavigationBar.md`
- 与 `TopBar_Calendar_01` 复合时，内嵌于 `Calendar_TopBar.md`

## 缺口

- `nodeId` / `componentKey` / `componentSetKey` 待 Figma 探查后补齐

> CSV2 同步日期：2026-05-19。从通用 NavigationBar family 切分独立。
