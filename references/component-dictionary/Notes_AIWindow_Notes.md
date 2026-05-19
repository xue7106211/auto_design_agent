# Notes_AIWindow_Notes 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = Notes_AIWindow_Notes`（笔记 AI 窗口）。

## 适用记录

- `AIWindow_Notes_01` ~ `AIWindow_Notes_06`

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `_01` ~ `_06` |

## 执行记录

| variantId | nodeId | size | 语义 | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `AIWindow_Notes_01` | 待补 | 待补 | AI 窗口（手机 / Fold 外，默认） | 待补 | `csv2-listed` |
| `AIWindow_Notes_02` | 待补 | 待补 | AI 窗口（Fold 内 LC，默认） | 待补 | `csv2-listed` |
| `AIWindow_Notes_03` | 待补 | 待补 | AI 窗口（手机 / Fold 外，变体） | 待补 | `csv2-listed` |
| `AIWindow_Notes_04` | 待补 | 待补 | AI 窗口（Fold 内 LC，变体） | 待补 | `csv2-listed` |
| `AIWindow_Notes_05` | 待补 | 待补 | AI 窗口（Pad 全模式，默认） | 待补 | `csv2-listed` |
| `AIWindow_Notes_06` | 待补 | 待补 | AI 窗口（Pad 全模式，变体） | 待补 | `csv2-listed` |

## 内部 padding（按 CSV2）

| 变体 | padding |
| --- | --- |
| `_02` / `_04` | 右 12；下 12 |
| 其他 | 待补 |

## 设备 × 变体 lookup（按 笔记 应用规则）

| 场景 | 手机 / Fold外 | Fold 内 LC | Pad 全模式 |
| --- | --- | --- | --- |
| 默认 | `AIWindow_Notes_01` | `AIWindow_Notes_02` | `AIWindow_Notes_05` |
| 变体 | `AIWindow_Notes_03` | `AIWindow_Notes_04` | `AIWindow_Notes_06` |

## 落位规则

- AI 窗口浮层，附着于 C 栏 / 当前活跃栏
- 由笔记编辑场景触发

## 缺口

- 各 variant 的 `nodeId` / `componentKey` / `componentSetId` 待补
- `_01 / _03 / _05 / _06` padding 待 探查

> CSV1 / CSV2 同步日期：2026-05-19。
