# FloatingWindow / DrawerWindow 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，服务 `componentFamily = FloatingWindow` 与 `componentFamily = DrawerWindow`（浮层窗口 / 抽屉窗口）。

## 适用记录

### FloatingWindow

- `FloatingWindow_ComponentSet_01`（一级浮窗）
- `FloatingWindow_ComponentSet_02`（二级浮窗）
- `FloatingWindowBG_01`（背景遮罩 sub-component）

### DrawerWindow

- `DrawerWindow_ComponentSet_high_01`（高抽屉）
- `DrawerWindow_ComponentSet_mid_01`（中抽屉）
- `DrawerWindow_ComponentSet_low_01`（低抽屉）
- `DrawerHandle_Bar_10`（拖拽手柄 sub-component）
- `DrawerWindow_BG_01`（背景遮罩 sub-component）

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | 见各家族变体 |

## 内部 padding（按 CSV2）

| 变体 | padding |
| --- | --- |
| `FloatingWindow_*` | 左 12；右 12 |
| `DrawerWindow_*` | 左 24；右 24 |

## 内部 NavigationBar

- `FloatingWindow_ComponentSet_01` 内部使用 `NavigationBar_ComponentSet_09`
- `FloatingWindow_ComponentSet_02` 内部使用 `NavigationBar_ComponentSet_08`
- `DrawerWindow_*` 内部使用 `NavigationBar_ComponentSet_09`

## 落位规则

- **FloatingWindow**：Fold 内 / Pad 上承载 AppSettings / ManageFoldWindow 等浮层场景
- **DrawerWindow**：手机 / Fold 外屏 上承载抽屉式浮层（high / mid / low 三档高度）
- **z-order**：在 mask 之上，杆子之下

## 缺口

- 各 variant 的 `nodeId` / `componentKey` / `componentSetId` 待补
- 各 DrawerWindow 自然高度阈值待 探查

> CSV1 / CSV2 同步日期：2026-05-18。
