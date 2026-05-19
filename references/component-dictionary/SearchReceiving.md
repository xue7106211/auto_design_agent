# SearchReceiving 组件字典参考

本文档是 `figma-component-dictionary.md` 的组件族 reference，只服务 `componentFamily = SearchReceiving`（搜索承接面板）。

## 适用记录

命中以下 `variantId` 时加载本文档：

- `SearchReceiving_00`（无搜索面板 / 占位）
- `SearchReceiving_01`（搜索面板 Dropdown；Pad NL C 栏激活态使用）

> 原 spec 在 `SearchBar.md` 中，CSV2 2026-05-19 切分独立 family。

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `SearchReceiving_00` / `SearchReceiving_01` |

## 内部 padding（按 CSV2）

| 变体 | padding |
| --- | --- |
| `SearchReceiving_00` | 待补 |
| `SearchReceiving_01` | 左 16；右 16 |

## 落位规则

- SearchReceiving 与 SearchBar 复合使用，承接搜索激活态下的 dropdown 面板
- Pad NL C 栏激活态：SearchBar_ComponentSet_04 (左 8 / 右 8) + SearchReceiving_01 (左 16 / 右 16)
- z-order：在 SearchBar 之下，主内容之上

## 缺口

- `nodeId` / `componentKey` / `componentSetKey` 待 Figma 探查后补齐
- `SearchReceiving_00` / `SearchReceiving_01` 是否在同一组件集，待确认

> CSV2 同步日期：2026-05-19。从 `SearchBar.md` 切分独立 family。
