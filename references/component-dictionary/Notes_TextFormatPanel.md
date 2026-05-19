# Notes_TextFormatPanel 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = Notes_TextFormatPanel`（笔记 文字格式弹窗）。

## 适用记录

- `TextFormatPanel_01`（默认）
- `TextFormatPanel_02`（Fold 内竖 LC C 栏 专用）

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `_01` / `_02` |

## 执行记录

| variantId | nodeId | size | 语义 | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `TextFormatPanel_01` | 待补 | 待补 | 文字格式弹窗（默认） | 待补 | `csv2-listed` |
| `TextFormatPanel_02` | 待补 | 待补 | 文字格式弹窗（Fold 内竖 LC C 栏） | 待补 | `csv2-listed` |

## 内部 padding（按 CSV2）

| 变体 | padding |
| --- | --- |
| `_01` / `_02` | 最小 左 12；右 12 |

## 设备 × 变体 lookup（按 笔记 应用规则）

| 场景 | variant |
| --- | --- |
| 手机 / Fold 外 / Fold内横 LC / Pad 全 | `TextFormatPanel_01` |
| Fold 内竖 LC C 栏 | `TextFormatPanel_02` |

## 落位规则

- 浮层弹窗，触发自笔记编辑 + 选中文字
- 浮窗位于选中文字上方 / 下方（按可用空间）

## 缺口

- `nodeId` / `componentKey` / `componentSetId` 待补
- `_01` 与 `_02` 自然尺寸差异 待 探查

> CSV1 / CSV2 同步日期：2026-05-19。
