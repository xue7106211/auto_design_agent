# Notes_Menu 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = Notes_Menu`（笔记 业务专属浮窗 / 菜单）。

> ⚠️ **variantId vs family base 不一致**：CSV2 权威 family = `Notes_Menu`，但 variantId 仍沿用 `FloatingWindow_ComponentSet_Notes_01`。CSV2 为权威，按原样保留 variantId 字符串。

## 适用记录

- `FloatingWindow_ComponentSet_Notes_01`（CSV2 2026-05-18 新增，笔记 业务专属浮窗，定宽 320；待 Figma 探查）

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `FloatingWindow_ComponentSet_Notes_01` |

## 执行记录

| variantId | nodeId | size | 语义 | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `FloatingWindow_ComponentSet_Notes_01` | 待补 | 待补 | 笔记 业务专属浮窗（菜单 / 定宽 320） | 待补 | `csv2-listed` |

## 内部 padding（按 CSV2）

| 变体 | padding |
| --- | --- |
| `FloatingWindow_ComponentSet_Notes_01` | 定宽 320（CSV2 仅记录定宽，左/右 padding 待 Figma 探查） |

## 落位规则

- 浮层窗口，定宽 320dp，居中对齐于触发点周边
- z-order：在 mask 之上，杆子之下

## 笔记 应用规则

按 `app-variant-map-笔记.md` 浮层 / 菜单相关表执行（具体 trigger 场景待 CSV1 同步后回填）。

## 缺口

- `nodeId` / `componentKey` / `componentSetId` 待补
- 自然尺寸（除定宽 320 外的高度 / padding）待 探查
- variantId 命名建议未来重命名为 `Notes_Menu_01` 以匹配 family；当前以 CSV2 字符串为权威，不修改

> CSV1 / CSV2 同步日期：2026-05-19。
