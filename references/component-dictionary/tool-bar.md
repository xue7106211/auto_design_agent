# ToolBar 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = ToolBar`（编辑模式底部工具栏）。

> 笔记 / 待办 编辑模式专用 ToolBar；常规底部工具栏使用 `BottomBar_Showcase_*`（详见 `bottom-bar-notes.md`）。

## 适用记录

- `ToolBar_ComponentSet_00`（待入库）
- `ToolBar_ComponentSet_01`（编辑工具栏，主用）
- `ToolBar_ComponentSet_02`（编辑工具栏，未选 Disabled / 选中 Normal 两态合并）

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `_00` / `_01` / `_02` |

## 内部 padding（按 CSV2）

| 变体 | 屏宽 ≥ 440 | 屏宽 < 440 |
| --- | --- | --- |
| `_01` / `_02` | 内部胶囊定宽 344dp（屏内居中） | 铺满 + 左右 padding 24dp |

属于「特殊（框架性）」组件，外层 instance **栏内 `x=0, width=栏W` 铺满**，不参与栏 padding 合算。

## 状态分支

`ToolBar_ComponentSet_02` 在 app-variant-map (笔记 / 待办 编辑模式) 标注：
- 未选列表时：禁用态 Disabled
- 选中列表时：正常态 Normal

状态由 SKILL Phase 4 step 7 输出 `LEditMode + 列表选择状态` 联合判定，写入 instance 的子节点状态属性 (本组件主属性 `variantid` 不受影响)。

## 落位规则

- **位置**：栏底部，`y = mainH − ToolBarH`，与 杆子 重叠（按 笔记 NoteEditPanel convention）
- **z-order**：在 List 之上，杆子之下

## 缺口

- 各 variant 的 `nodeId` / `componentKey` / `componentSetId` 待补
- 状态分支（Disabled / Normal）的子节点细节待 探查 后补

> CSV1 / CSV2 同步日期：2026-05-18。
