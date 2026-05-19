# Notes_BottomBar 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = Notes_BottomBar`（笔记 业务专属底部工具栏 / 编辑面板 / 大纲工具栏）。

> CSV2 权威：`componentFamily = Notes_BottomBar`（CSV2 2026-05-19 切分），吸收原 `BottomBar_Showcase_Notes_*` / `BottomBar_Notes_Outline_*` / `BottomBar_NoteEditPanel_*` 三个 sub-family。
> 通用 `BottomBar_Showcase_00 / _01 / _02 / _Fab_*` 仍属公共 BottomBar，**不**在本文档。

## 适用记录

### Showcase（笔记列表底部工具栏）

- `BottomBar_Showcase_Notes_00`（待入库）
- `BottomBar_Showcase_Notes_01`
- `BottomBar_Showcase_Notes_02`（**source 文件未落地**；Fold 内 LC L 栏 spec）

### Outline（思维导图 / 大纲工具栏）

- `BottomBar_Notes_Outline_00`（待入库）
- `BottomBar_Notes_Outline_01`（默认 / 思维导图浏览）
- `BottomBar_Notes_Outline_02`（思维导图编辑 MindMap_Edit）

### NoteEditPanel（笔记编辑面板）

- `BottomBar_NoteEditPanel_00`（待入库）
- `BottomBar_NoteEditPanel_01`（默认；内部工具条定宽 320）
- `BottomBar_NoteEditPanel_02`（Pad NLC / Pad LC C 栏）
- `BottomBar_NoteEditPanel_03`（**2026-05-18 新增**，场景 spec 待补）

## 核心结论

- `componentFamily = Notes_BottomBar`
- Showcase sub-family：`componentName = BottomBar_Showcase_Notes`，`componentSetId = 536:15144`，`componentSetKey = 303649c8435835bcbfb5e85e668a0b6562497cad`
- 主属性键 `variantid`
- **属于「特殊（框架性）」组件**：栏内 `x=0, width=栏W` 铺满，外层不参与合算。内部胶囊层（`TabMaterial-Showcase`）按工具栏规格独立适配（详见 `device-dimensions.md`「工具栏规格」+ `common-rules.md §3.9`）。

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | Showcase: `BottomBar_Showcase_Notes_01`；其他 sub-family 待 探查 |

## 执行记录

| variantId | nodeId | size | 语义 | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `BottomBar_Showcase_Notes_00` | 待补 | 待补 | 不渲染占位（Pad NLC L 栏） | 待补 | `csv2-listed` |
| `BottomBar_Showcase_Notes_01` | `536:15145` | `392x100` | 笔记列表底部工具栏（默认） | `6eb3e008d0b867352b3a67bf4a29e29ba784d1e0` | `probed` |
| `BottomBar_Showcase_Notes_02` | 待补 | 待补 | Fold 内屏 LC L 栏 spec（**未落地**） | 待补 | `csv2-listed` |
| `BottomBar_Notes_Outline_00` | 待补 | 待补 | 不渲染占位 | 待补 | `csv2-listed` |
| `BottomBar_Notes_Outline_01` | 待补 | 待补 | 思维导图浏览工具栏（默认） | 待补 | `csv2-listed` |
| `BottomBar_Notes_Outline_02` | 待补 | 待补 | 思维导图编辑工具栏 | 待补 | `csv2-listed` |
| `BottomBar_NoteEditPanel_00` | 待补 | 待补 | 不渲染占位 | 待补 | `csv2-listed` |
| `BottomBar_NoteEditPanel_01` | 待补 | 待补 | 笔记编辑面板（默认；内部工具条定宽 320） | 待补 | `csv2-listed` |
| `BottomBar_NoteEditPanel_02` | 待补 | 待补 | Pad NLC / Pad LC C 栏 编辑面板 | 待补 | `csv2-listed` |
| `BottomBar_NoteEditPanel_03` | 待补 | 待补 | 编辑面板 3（场景待补） | 待补 | `csv2-listed` |

## 内部 padding（按变体清单 CSV2）

### Showcase

| 变体 | 屏宽 ≥ 440 | 屏宽 < 440 |
| --- | --- | --- |
| `_01` / `_02` | 内部胶囊定宽 344dp（屏内居中） | 铺满 + 左右 padding 24dp |

外层 instance 一律栏内铺满（`x=0, width=栏W`）。

### NoteEditPanel

| 变体 | 尺寸 / padding |
| --- | --- |
| `_01` | 内部工具条定宽 320 |
| `_02` / `_03` | 待补 |

### Outline

| 变体 | 尺寸 / padding |
| --- | --- |
| `_00` ~ `_02` | 待补 |

## 统一执行写法

```js
instance.setProperties({
  variantid: "BottomBar_Showcase_Notes_01"
});
```

## 笔记 应用规则（按 `app-variant-map-笔记.md`）

### Showcase

- 手机 / Fold 外屏 NLC / NL / LC：`BottomBar_Showcase_Notes_01`
- Fold 内屏 LC（NLC / LC）L 栏：**`_02`**（CSV1 spec 已更新；当前组件库未落地，临时 `_01` fallback）
- Pad NLC / NL（展开 / 收起）：`_00`（栏不渲染）
- Pad 竖 LC / 横 LC：`_00`

### Outline

- 思维导图浏览（手机 / Fold 外 / Fold 内 / 全设备 C 栏）：`BottomBar_Notes_Outline_01`
- 思维导图编辑（MindMap_Edit / C 栏）：`BottomBar_Notes_Outline_02`

### NoteEditPanel

| 场景 | 手机 / Fold 外 | Fold 内 LC C 栏 | Pad NLC C 栏 / Pad LC C 栏 |
| --- | --- | --- | --- |
| NLC | `_01` | `_01` | `_02` |
| LC | `_01` | `_01` | `_02` |

## 落位规则

- C 栏底部 flush，与 杆子 16dp 重叠
- z-order：在 Detail / TextInput 同层 / 上层（按 笔记 §0.1 落位规则 #3）
- 思维导图（`NavigationBar_ComponentSet_Notes_02 / _03`）与 Outline 工具栏配套出现

## 缺口

- `_00` 各 sub-family 占位变体未在本地组件集中落地。Pad 执行直接省略渲染。
- Showcase `_02` 变体 **source 文件未落地**。映射表保持 `_02` 不修改作为权威 spec；执行时降级使用 `_01`，记录 `fallback`，待组件库补齐后通过 `swapComponent` 升级。
- Outline 与 NoteEditPanel 各 variant 的 `nodeId` / `componentKey` / `componentSetId` 待 探查
- NoteEditPanel `_03` 场景 spec 与子节点结构待 探查

> CSV1 / CSV2 同步日期：2026-05-19。
