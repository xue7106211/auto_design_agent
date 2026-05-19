# Keyboard 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = Keyboard`（系统 UI Kit / SystemUIKIT 顶层）。

> Keyboard 不属于任一应用业务组件，由系统 SystemUIKIT 统一提供。所有应用在需要键盘时按 **device + 屏幕方向** 直接 lookup 本文档。app-variant-map 中无需重复登记。

## 适用记录

命中以下 `variantId` 时加载本文档：

- `Keyboard_phone_h_01` — 手机 竖屏
- `Keyboard_phone_l_01` — 手机 横屏
- `Keyboard_fold_inside_h_01` — Fold 内屏 竖屏
- `Keyboard_fold_inside_l_01` — Fold 内屏 横屏
- `Keyboard_fold_outside_h_01` — Fold 外屏 竖屏
- `Keyboard_fold_outside_l_01` — Fold 外屏 横屏
- `Keyboard_pad_h_01` — Pad 竖屏
- `Keyboard_pad_l_01` — Pad 横屏

## 设备 × 方向 lookup 表（按 CSV1 SystemUIKIT 行）

| device | 竖屏 | 横屏 |
|---|---|---|
| 手机 Phone | `Keyboard_phone_h_01` | `Keyboard_phone_l_01` |
| Fold 外屏 | `Keyboard_fold_outside_h_01` | `Keyboard_fold_outside_l_01` |
| Fold 内屏 | `Keyboard_fold_inside_h_01` | `Keyboard_fold_inside_l_01` |
| Pad | `Keyboard_pad_h_01` | `Keyboard_pad_l_01` |

> 命名规范：`Keyboard_{device}_{orientation}_{seq}`
> - `device` ∈ `phone` / `fold_inside` / `fold_outside` / `pad`
> - `orientation` ∈ `h`（竖屏 / horizontal-narrow ≡ portrait）/ `l`（横屏 / landscape）
> - `seq` 当前固定 `01`

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | 见上表 8 个变体 |

## 内部 padding（按 CSV2）

所有 8 个变体：**左 0，右 0**（栏内 / frame 直接铺满，不参与栏 padding 合算）。

属于「特殊（框架性）」组件 —— 与 `BottomBar_*` / `ToolBar_*` / `Sidebar_*` 同类，**`x = 0, width = frameW` 强制铺满**。

## 统一执行写法

```js
instance.setProperties({
  variantid: "Keyboard_phone_h_01"
});
```

或直接 `swapComponent(targetVariant)`。

## 落位规则

- **位置**：贴 frame 底部，`y = frameH − keyboardH`
- **宽度**：与 frame 等宽
- **z-order**：键盘弹出时位于所有内容层之上、`杆子` 之下（杆子保持最顶 z）
- **状态栏 / 杆子**：键盘出现不影响状态栏与杆子的位置与渲染

## 已知陷阱

| 风险 | 处理方式 |
| --- | --- |
| 把 `_l_01`（横屏）误用于竖屏 | 按 `device + orientation` 严格 lookup，不要 fallback |
| Fold 内 / 外屏混用 | Fold 内屏与外屏键盘自然尺寸不同，必须按 `fold_inside` / `fold_outside` 区分 |
| Pad 用 phone 键盘 | Pad 必须使用 `Keyboard_pad_*`，phone 变体在 Pad 上比例错误 |

## 缺口

- 各 variant 的 `nodeId` / `componentKey` / `componentSetId` 待首次 import 后补齐
- 自然高度（每 device × orientation）待实测后补回本文档

> CSV1 / CSV2 同步日期：2026-05-18。
