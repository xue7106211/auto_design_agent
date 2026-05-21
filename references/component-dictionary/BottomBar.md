# BottomBar 组件字典参考

本文档是 `figma-component-dictionary.md` 的组件族 reference，只服务 `componentFamily = BottomBar`（通用底部栏）。

## 适用记录

命中以下 `variantId` 时加载本文档：

- `BottomBar_Showcase_00`（无底部导航栏）
- `BottomBar_Showcase_01`（默认）
- `BottomBar_Showcase_02`（无 FAB / 分区展示）
- `BottomBar_Showcase_Fab_01`（随 FAB：BottomBar_Showcase_01 + Fab_01）
- `BottomBar_Showcase_Fab_02`（随 FAB / 分区展示：BottomBar_Showcase_02 + Fab_02）

> 笔记业务专属 BottomBar `BottomBar_Showcase_Notes_*` / `BottomBar_Notes_Outline_*` / `BottomBar_NoteEditPanel_*` 已分离至 `Notes_BottomBar.md`（family = `Notes_BottomBar`）。本文档不再覆盖。

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `BottomBar_Showcase_00` / `_01` / `_02` / `_Fab_01` / `_Fab_02` |

## 内部 padding（按 CSV2）

| 变体 | spec |
| --- | --- |
| `BottomBar_Showcase_01` | 屏宽 ≥ 440 定宽 344；< 440 铺满 + padding 24 |
| `BottomBar_Showcase_02` | 左 24 |
| `BottomBar_Showcase_Fab_01` | BottomBar_Showcase_01 spec + Gap 12（与 Fab） |
| `BottomBar_Showcase_Fab_02` | 左 24；右 24 |

## 落位规则

- BottomBar 在 Phone / Fold 外屏 上承载底部导航
- 与 Fab 复合时，按 `_Fab_01 / _02` 变体处理 Gap / 对齐
- 笔记业务请使用 `Notes_BottomBar.md`

## 缺口

- `nodeId` / `componentKey` / `componentSetKey` 待 Figma 探查后补齐
- `_Fab_01` / `_Fab_02` 是组合变体还是独立组件集，待确认

> CSV2 同步日期：2026-05-21。新建独立 family（之前未单独建立字典文件）。
