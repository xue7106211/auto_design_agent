# Calendar_TopBar 组件字典参考

本文档是 `figma-component-dictionary.md` 的组件族 reference，只服务 `componentFamily = Calendar_TopBar`（业务_日历 顶部栏）。

## 适用记录

命中以下 `variantId` 时加载本文档：

- `TopBar_Calendar_01`（业务_日历 复合顶部栏：NavigationBar_ComponentSet_Calendar_01 + TopBar_Navigation_01）
- `TopBar_Navigation_01`（顶部导航 sub-variant，最小张：左 16；右 16；CSV2 标 YES）

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `TopBar_Calendar_01` / `TopBar_Navigation_01` |

## 内部 padding（按 CSV2）

| 变体 | padding |
| --- | --- |
| `TopBar_Calendar_01` | 左 16；右 12 |
| `TopBar_Navigation_01` | 左 16；右 16（最小张） |

## 落位规则

- 用于「日历」应用 Pad / Fold 顶栏复合
- 通用 TopBar spec 参见 `TopBar.md`
- 内嵌 NavigationBar 业务变体 见 `Calendar_NavigationBar.md`

## 缺口

- `nodeId` / `componentKey` / `componentSetKey` 待 Figma 探查后补齐

> CSV2 同步日期：2026-05-19。
