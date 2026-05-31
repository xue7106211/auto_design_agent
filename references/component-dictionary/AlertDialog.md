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

### 键盘联动

弹窗内含输入控件且键盘可见时，弹窗底部相对键盘顶沿 **12dp**：

- 手机 / 折叠屏内外屏：弹窗底 ↔ 键盘顶 **12dp**（覆盖默认底部对齐通则）
- Pad：默认上下居中；居中时与键盘相交则向上推移直至弹窗底 ↔ 键盘顶 = **12dp**，不相交则保持居中

> 仅 `AlertDialog_ComponentSet_01` 适用。详见 `references/layouts/device-dimensions.md`「弹窗 Dialog / 键盘联动」。

## 缺口

- `nodeId` / `componentKey` / `componentSetId` 待补

> CSV1 / CSV2 同步日期：2026-05-18。
