# DrawerWindow 组件字典参考

本文档是 `figma-component-dictionary.md` 的组件族 reference，只服务 `componentFamily = DrawerWindow`（抽屉窗口）。

## 适用记录

命中以下 `variantId` 时加载本文档：

- `DrawerWindow_ComponentSet_high_01`（高抽屉）
- `DrawerWindow_ComponentSet_mid_01`（中抽屉）
- `DrawerWindow_ComponentSet_low_01`（低抽屉）
- `DrawerHandle_Bar_10`（拖拽手柄 sub-component）
- `DrawerWindow_BG_01`（背景遮罩 sub-component）

> 原 spec 与 FloatingWindow 共存于 `FloatingWindow.md`，CSV2 2026-05-19 切分独立 family。FloatingWindow spec 见 `FloatingWindow.md`。

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `DrawerWindow_ComponentSet_high_01` / `_mid_01` / `_low_01` / `DrawerHandle_Bar_10` / `DrawerWindow_BG_01` |

## 内部 padding（按 CSV2）

| 变体 | padding |
| --- | --- |
| `DrawerWindow_ComponentSet_high_01` | 左 24；右 24 |
| `DrawerWindow_ComponentSet_mid_01` | 左 24；右 24 |
| `DrawerWindow_ComponentSet_low_01` | 左 24；右 24 |

## 内部 NavigationBar

- `DrawerWindow_*` 内部使用 `NavigationBar_ComponentSet_09`

## 落位规则

- DrawerWindow 在手机 / Fold 外屏 上承载抽屉式浮层（high / mid / low 三档高度）
- z-order：在 mask（DrawerWindow_BG_01）之上，DrawerHandle_Bar_10 之下

## 缺口

- `nodeId` / `componentKey` / `componentSetKey` 待 Figma 探查后补齐
- 各 DrawerWindow 自然高度阈值待探查

> CSV2 同步日期：2026-05-19。从 `FloatingWindow.md` 切分独立 family。
