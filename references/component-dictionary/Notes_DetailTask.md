# Notes_DetailTask 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = Notes_DetailTask`（待办 详情承载容器）。

> CSV2 权威：`componentFamily = Notes_DetailTask`（CSV2 2026-05-19 切分；从原 `DetailNotes` family 拆出）。

## 适用记录

- `DetailTask_01`（CSV2 2026-05-18 新增，待办 图标详情承载容器；待 Figma 探查）

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `DetailTask_01` |

## 执行记录

| variantId | nodeId | size | 语义 | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `DetailTask_01` | 待补 | 待补 | 待办 图标详情承载容器 | 待补 | `csv2-listed` |

## 落位规则

- 待办详情 C 栏内容容器
- 出现在 待办 子场景 LC / NLC C 栏（Fold 内 / Pad 全模式）

## 笔记 应用规则

按 `app-variant-map-笔记.md`「待办 / 弹窗 AlertDialog / 待办详情」表执行：

| 设备 / 场景 | variant |
| --- | --- |
| Fold 内屏 LC C 栏 / Pad 全模式 NLC C 栏 | `DetailTask_01` |
| 手机 / Fold 外屏 | 不展示（用 NewTaskWindow / DrawerWindow 承载） |

## 缺口

- `nodeId` / `componentKey` / `componentSetId` 待补
- 自然尺寸 / 内部 padding 待 探查

> CSV1 / CSV2 同步日期：2026-05-19。
