# TextInput 组件字典参考（公共 / 现在不使用 / hidden）

本文档是 `figma-component-dictionary` 的组件族 reference，服务 `componentFamily = TextInput`（公共底部输入框组件族）。

> ⚠️ **当前状态：现在不使用 / hidden**。
>
> 本族下记录的 variant `TextInput_ComponentSet_Notes_02 ~ _07` 在 `app-variant-map-笔记.md` 中标记为可调用，但当前 笔记 业务流程 实际并未启用这些子变体；仅 `_00` / `_01` / `_08` 被使用，已分离至 `Notes_TextInput.md`。
>
> 本文档保留这些变体的探查数据，待业务规则确认后再决定是否复用 / 删除。

## 适用记录（hidden）

- `TextInput_ComponentSet_Notes_02` ~ `_07`（**当前不使用，hidden**）

## 核心结论

- `componentFamily = TextInput`
- `componentName = TextInput_ComponentSet_Notes`（与 notes_text_input.md 同 set；按 variant 切分使用面）
- `componentSetId = 561:16235`
- `componentSetKey = 0dc20401cde070d654725146db336032d2f886a2`
- 主属性键 `variantid`

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `_02` ~ `_07` |

## 执行记录

| variantId | nodeId | size | 语义 | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `TextInput_ComponentSet_Notes_02` | `561:16246` | `392x92` | NoteEditPanel 变体 02 | `6f63c740b9b8c8c37b1b613d4b71a1e3931456c9` | `probed` |
| `TextInput_ComponentSet_Notes_03` | `561:16256` | `392x124` | NoteEditPanel 变体 03 | `9eda0aea6a517b34768e2380bf186b2e5b00516d` | `probed` |
| `TextInput_ComponentSet_Notes_04` | `561:16260` | `392x124` | NoteEditPanel 变体 04 | `771da21deec7679c9f484047a08ab159b800ba45` | `probed` |
| `TextInput_ComponentSet_Notes_05` | `561:16288` | `392x295` | NoteEditPanel 变体 05 | `cd6cf80e5b74dfe6335be872400bb2d320d4ab90` | `probed` |
| `TextInput_ComponentSet_Notes_06` | `561:16264` | `392x313` | NoteEditPanel 变体 06 | `be1411d62a1bb1135747e326ba435156b497b7d2` | `probed` |
| `TextInput_ComponentSet_Notes_07` | `561:16312` | `392x295` | NoteEditPanel 变体 07 | `88e306bc4037d42c5e72c9f8c7c39ade2213e072` | `probed` |

## 内部 padding（按变体清单 CSV2，按设备区分）

| 变体 | Q18 横屏（Pad 类似） | Q18 竖屏 | Q18 外屏 / 手机 |
| --- | --- | --- | --- |
| `_02` | 左 116，右 116 | 左 24，右 24 | 左 16，右 16 |
| `_03` | 左 116，右 116 | 左 24，右 24 | 左 16，右 16 |
| `_04` | 左 116，右 116 | 左 24，右 24 | 左 16，右 16 |
| `_05` / `_06` / `_07` | 定宽，屏中对齐 | 定宽，屏中对齐 | 定宽，屏中对齐 |

## 当前应用规则

**当前不使用** —— 笔记业务实际启用 `_00` / `_01` / `_08`（详见 `Notes_TextInput.md`）。

本文档仅保留探查数据，待业务规则确认后处理。

## 缺口

- `_02 ~ _07` 在何业务场景下激活，待 CSV1 同步后明确

> CSV1 / CSV2 同步日期：2026-05-19。
