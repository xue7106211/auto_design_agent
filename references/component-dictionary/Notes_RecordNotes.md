# Notes_RecordNotes 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = Notes_RecordNotes`（笔记 录音窗口）。

## 适用记录

- `RecordNotes_01`（手机 / Fold 外）
- `RecordNotes_02`（Fold 内 / Pad）

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `_01` / `_02` |

## 执行记录

| variantId | nodeId | size | 语义 | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `RecordNotes_01` | 待补 | 待补 | 录音窗口（手机 / Fold 外） | 待补 | `csv2-listed` |
| `RecordNotes_02` | 待补 | 待补 | 录音窗口（Fold 内 / Pad） | 待补 | `csv2-listed` |

## 设备 × 变体 lookup（按 笔记 应用规则）

| 设备 | variant |
| --- | --- |
| 手机 / Fold 外 | `RecordNotes_01` |
| Fold 内 LC | `RecordNotes_02` |
| Pad 全模式 | `RecordNotes_02` |

## 落位规则

- 录音窗口浮层，附着于 C 栏 / 当前活跃栏
- 由笔记编辑录音入口触发

## 缺口

- `nodeId` / `componentKey` / `componentSetId` 待补
- 自然尺寸待 探查

> CSV1 / CSV2 同步日期：2026-05-19。
