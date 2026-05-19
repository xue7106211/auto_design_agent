# ActionSheet 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = ActionSheet`（行动操作按钮）。

## 适用记录

- `Actionsheet_ComponentSet_01`

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `_01` |

## 尺寸与 padding（按 CSV2）

- **弹窗定宽 368**（屏中对齐）
- 最小左右 padding 12
- 底部距离：
  - 有控制杆：距控制杆顶沿 12dp
  - 无控制杆：距屏幕底部 12dp

## 落位规则

- 模态浮层，从底部弹出（手机 / Fold 外屏）或屏中弹出（Pad / Fold 内）
- 背后渲染遮罩
- z-order：mask 之上，杆子之下

## 缺口

- `nodeId` / `componentKey` / `componentSetId` 待补

> CSV1 / CSV2 同步日期：2026-05-18。
