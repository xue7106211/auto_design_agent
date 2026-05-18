# BottomBar_Notes_Outline 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = BottomBar`（笔记 思维导图 / 大纲工具栏 sub-family）。

> 与 `bottom-bar-notes.md` / `note-edit-panel.md` 同族但语义不同；本文档专注 思维导图 / 大纲工具栏。

## 适用记录

- `BottomBar_Notes_Outline_00`（待入库）
- `BottomBar_Notes_Outline_01`（默认 / 思维导图浏览）
- `BottomBar_Notes_Outline_02`（思维导图编辑 MindMap_Edit）

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `_00` ~ `_02` |

## 设备 × 变体 lookup（按 笔记 应用规则）

按 `app-variant-map-笔记.md` 「ToolBar / Outline」 + 「ToolBar / MindMap_Edit」表：

| 场景 | 全设备 |
| --- | --- |
| Outline / C（思维导图浏览） | `BottomBar_Notes_Outline_01` |
| MindMap_Edit / C（思维导图编辑） | `BottomBar_Notes_Outline_02` |

## 落位规则

- C 栏底部 flush
- 思维导图 (`NavigationBar_ComponentSet_Notes_02 / _03`) 与本工具栏配套出现

## 缺口

- 各 variant 的 `nodeId` / `componentKey` / `componentSetId` 待补
- `_00` 场景 spec 待 探查

> CSV1 / CSV2 同步日期：2026-05-18。
