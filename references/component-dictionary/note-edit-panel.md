# BottomBar_NoteEditPanel 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = BottomBar`（笔记 NoteEditPanel 编辑面板 sub-family）。

> 与 `bottom-bar-notes.md`（`BottomBar_Showcase_Notes_*`）同族但语义不同；本文档专注编辑面板。

## 适用记录

- `BottomBar_NoteEditPanel_00`（待入库）
- `BottomBar_NoteEditPanel_01`（默认）
- `BottomBar_NoteEditPanel_02`（Pad / Fold 内屏 NLC C 栏）
- `BottomBar_NoteEditPanel_03`（**2026-05-18 新增**，场景 spec 待补）

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `_00` ~ `_03` |

## 内部尺寸（按 CSV2）

| 变体 | 尺寸 / padding |
| --- | --- |
| `_01` | 内部工具条定宽 320 |
| 其他 | 待补 |

## 设备 × 变体 lookup（按 笔记 应用规则）

按 `app-variant-map-笔记.md` 「ToolBar / NoteEditPanel」表：

| 场景 | 手机 / Fold 外 | Fold 内 LC C 栏 | Pad NLC C 栏 |
| --- | --- | --- | --- |
| NoteEditPanel / NLC | `_01` | `_01` | `_02` |
| NoteEditPanel / LC  | `_01` | `_01` | `_02`（Pad LC C 栏）|

## 落位规则

- C 栏底部 flush，与 杆子 16dp 重叠
- z-order：在 Detail / TextInput 同层 / 上层（按 笔记 §0.1 落位规则 #3）

## 缺口

- 各 variant 的 `nodeId` / `componentKey` / `componentSetId` 待补
- `_03` 场景 spec 与子节点结构待 探查

> CSV1 / CSV2 同步日期：2026-05-18。
