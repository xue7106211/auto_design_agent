# Fab 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = Fab`（悬浮操作按钮）。

## 适用记录

- `Fab_00`（待入库 / 不渲染占位）
- `Fab_01`（默认，右 24dp）
- `Fab_02`（分开展示用，与 BottomBar_Showcase_Fab_02 配套）
- `Fab_Rec_01`（录音业务专用）

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `Fab_00` / `Fab_01` / `Fab_02` / `Fab_Rec_01` |

## 内部 padding（按 CSV2）

| 变体 | 内置右 padding |
| --- | --- |
| `Fab_01` | 右 24 |
| `Fab_02` | 右 24（分开展示配套） |
| `Fab_00` | 不渲染 |
| `Fab_Rec_01` | 右 24 |

## 颜色分支

`Fab_01` 在 app-variant-map 中按业务标注 **彩色** / **白色**（如 笔记 / 待办 通常彩色，文件管理 / 电话 / 联系人 通常白色）。颜色由 app md 的 notes 列承载，本字典不分支 variantId。

## 落位规则

- **位置**：通常右下角，与 BottomBar / 杆子叠加
- 详见 `BottomBar_Showcase_Fab_01 / _02` 复合体（`bottom-bar-showcase.md` 待建）

## 缺口

- 各 variant 的 `nodeId` / `componentKey` / `componentSetId` 待补
- `Fab_00`（占位）落地状态待确认

> CSV1 / CSV2 同步日期：2026-05-21。
