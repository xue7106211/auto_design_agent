# FloatingWindow 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = FloatingWindow`（浮层窗口）。

## 适用记录

- `FloatingWindow_ComponentSet_01`（一级浮窗）
- `FloatingWindow_ComponentSet_02`（二级浮窗）
- `FloatingWindowBG_01`（背景遮罩 sub-component）

> **CSV2 2026-05-19 family 切分**：
> - `DrawerWindow_*` 已分离至 `DrawerWindow.md`（family = `DrawerWindow`）。本文档不再覆盖 DrawerWindow。
> - 笔记业务专属浮窗 `FloatingWindow_ComponentSet_Notes_01` 已分离至 `Notes_Menu.md`（family = `Notes_Menu`）。本文档不再覆盖。

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | 见各家族变体 |

## 内部 padding（按 CSV2）

| 变体 | padding |
| --- | --- |
| `FloatingWindow_*` | 左 12；右 12 |

## 内部 NavigationBar

- `FloatingWindow_ComponentSet_01` 内部使用 `NavigationBar_ComponentSet_09`
- `FloatingWindow_ComponentSet_02` 内部使用 `NavigationBar_ComponentSet_08`

## 落位规则

- **FloatingWindow**：Fold 内 / Pad 上承载 AppSettings / ManageFoldWindow 等浮层场景
- **z-order**：在 mask 之上

## 缺口

- 各 variant 的 `nodeId` / `componentKey` / `componentSetId` 待补

> CSV1 / CSV2 同步日期：2026-05-19。
