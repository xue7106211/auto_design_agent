# SelectableChip 组件字典参考

本文档是 `figma-component-dictionary.md` 的组件族 reference，只服务 `componentFamily = SelectableChip`（通用标签栏 / 可选 chip）。

## 适用记录

命中以下 `variantId` 时加载本文档：

- `SelectableChip_ComponentSet_00`（无标签栏）
- `SelectableChip_ComponentSet_01`（等宽）

> 笔记业务专属 `SelectableChip_ComponentSet_Notes_*` 已分离至 `Notes_SelectableChip.md`（family = `Notes_SelectableChip`）。本文档不再覆盖。

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `SelectableChip_ComponentSet_00` / `_01` |

## 内部 padding（按 CSV2）

| 变体 | padding |
| --- | --- |
| `SelectableChip_ComponentSet_00` | 待补 |
| `SelectableChip_ComponentSet_01` | 左 12；右 12 |

## 落位规则

- SelectableChip 用于横向滚动的可选标签 / chip 容器
- 笔记业务请使用 `Notes_SelectableChip.md`

## 缺口

- `nodeId` / `componentKey` / `componentSetKey` 待 Figma 探查后补齐
- 内部 chip item spec（max width / spacing）待补

> CSV2 同步日期：2026-05-19。
