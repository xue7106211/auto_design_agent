# NewTaskWindow 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = NewTaskWindow`（待办 新建任务弹窗）。

## 适用记录

- `NewTaskWindow_01`
- `NewTaskWindow_02`

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `_01` / `_02` |

## 尺寸（按 CSV2）

| 变体 | 尺寸 / padding |
| --- | --- |
| `_01` | 最小宽度 368；最大宽度 411；左 12；右 12 |
| `_02` | 最小 368；最大 412 |

## 设备 × 变体 lookup（按 待办 应用规则）

按 `app-variant-map-笔记.md` 「待办 / 弹窗 AlertDialog」表：

| 场景 | variant |
| --- | --- |
| 全设备 / 全模式 | `NewTaskWindow_01` 或 `_02`（按子场景）|

## 落位规则

- 模态弹窗，触发自待办列表 + Fab 点击
- 背后渲染遮罩
- z-order：mask 之上，杆子之下

## 缺口

- `nodeId` / `componentKey` / `componentSetId` 待补
- `_01` 与 `_02` 子场景差异（输入态 / 编辑态）待 探查

> CSV1 / CSV2 同步日期：2026-05-18。
