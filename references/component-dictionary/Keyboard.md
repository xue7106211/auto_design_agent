# Keyboard 组件字典参考

本文档是 `figma-component-dictionary.md` 的组件族 reference，只服务 `componentFamily = Keyboard`（系统键盘）。

## 适用记录

命中以下 `variantId` 时加载本文档：

- `Keyboard_phone_h_01`（Phone 横屏）
- `Keyboard_phone_l_01`（Phone 竖屏）
- `Keyboard_fold_inside_h_01`（Fold 内屏 横屏）
- `Keyboard_fold_inside_l_01`（Fold 内屏 竖屏）
- `Keyboard_fold_outside_h_01`（Fold 外屏 横屏）
- `Keyboard_fold_outside_l_01`（Fold 外屏 竖屏）
- `Keyboard_pad_h_01`（Pad 横屏）
- `Keyboard_pad_l_01`（Pad 竖屏）

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | 见上述 8 个变体 |

## 内部 padding（按 CSV2）

| 变体 | padding |
| --- | --- |
| 全部 Keyboard_* | 左 0；右 0（铺满屏宽） |

## 落位规则

- 键盘按设备 + 屏幕方向选择对应 variant
- 命名约定：`Keyboard_{device}_{orientation}_01`，其中 `device ∈ {phone, fold_inside, fold_outside, pad}`，`orientation ∈ {h: 横屏, l: 竖屏}`
- z-order：浮于主内容之上，与系统手势区相邻

## 缺口

- `nodeId` / `componentKey` / `componentSetKey` 待 Figma 探查后补齐
- 各 variant 高度 / 自适应规则待补

> CSV2 同步日期：2026-05-19。新建独立 family（之前未单独建立字典文件）。
