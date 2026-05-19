# Scrollbar 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = Scrollbar`（滚动条）。

## 适用记录

- `Scrollbar_ComponentSet_01`

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `_01` |

## 内部 padding（按 CSV2）

- 右 0（贴栏右沿）

## 落位规则

- 栏内右沿，自然高度按内容滚动区间
- 各栏 NLC / NL / NC / LC / C 模式下均可使用
- N 收起 形态下：N 栏不展示 Scrollbar（N 已消失），L / C 栏正常展示
- z-order：栏内最顶层

## 缺口

- `nodeId` / `componentKey` / `componentSetId` 待补

> CSV1 / CSV2 同步日期：2026-05-18。
