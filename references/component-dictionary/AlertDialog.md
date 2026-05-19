# AlertDialog 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = AlertDialog`（弹窗）。

## 适用记录

- `AlertDialog_ComponentSet_01`

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `_01` |

## 尺寸与 padding（按 CSV2）

- **定宽 368**（屏中对齐）
- 最小左右 padding 12
- 底部距离：
  - 有控制杆：距控制杆顶沿 12dp
  - 无控制杆：距屏幕底部 12dp
- Pad：上下居中

## 落位规则

- 模态弹窗，触发后覆盖整屏
- 背后渲染遮罩（mask 0.2 opacity）
- z-order：mask 之上，杆子之下

## 缺口

- `nodeId` / `componentKey` / `componentSetId` 待补

> CSV1 / CSV2 同步日期：2026-05-18。
