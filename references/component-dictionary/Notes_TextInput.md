# Notes_TextInput 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = Notes_TextInput`（笔记 业务专属底部输入框）。

> CSV2 权威：`componentFamily = Notes_TextInput`（CSV2 2026-05-19 切分）。当前应用使用：`_00` / `_01` / `_08`。其他 `_02 ~ _07` 已分离至 `TextInput.md` 并标记「现在不使用」。

## 适用记录

- `TextInput_ComponentSet_Notes_00`（待入库 / 不渲染占位）
- `TextInput_ComponentSet_Notes_01`（NoteEditPanel 默认；手机 / Fold 外屏）
- `TextInput_ComponentSet_Notes_08`（**2026-05-15 新增**，Q18 内屏专用，Fold 内 LC C 栏 默认；padding `左20；右20`）

## 核心结论

- `componentFamily = Notes_TextInput`
- `componentName = TextInput_ComponentSet_Notes`
- `componentSetId = 561:16235`
- `componentSetKey = 0dc20401cde070d654725146db336032d2f886a2`
- 主属性键 `variantid`
- **属于「特殊（框架性）」组件**：栏内 `x=0, width=栏W` 铺满，**不**参与栏 padding 合算（见 `common-rules.md §3.4a`）

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `_00` / `_01` / `_08` |

## 执行记录

| variantId | nodeId | size | 语义 | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `TextInput_ComponentSet_Notes_00` | 待补 | 待补 | 不渲染占位（Pad NLC C 栏） | 待补 | `csv2-listed` |
| `TextInput_ComponentSet_Notes_01` | `561:16236` | `392x92` | NoteEditPanel 默认（手机 / Fold 外屏） | `e42144d9d18ec4de4445cb6a5eed68df91cfe958` | `probed` |
| `TextInput_ComponentSet_Notes_08` | `1254:58241` | `392x92` | Q18 内屏 NoteEditPanel 默认（Fold 内 LC C 栏） | `d9b9c1b293fdaef7d75d7ca51fe761a9ceda5631` | `probed` |

## 内部 padding（按变体清单 CSV2，按设备区分）

| 变体 | Q18 内屏（Fold 内）| Q18 外屏 / 手机 |
| --- | --- | --- |
| `_01` | 左 20，右 20 | 左 16，右 16 |
| `_08` | 左 20，右 20 | 左 16，右 16 |

## 统一执行写法

```js
instance.setProperties({
  variantid: "TextInput_ComponentSet_Notes_01"
});
```

## 笔记 应用规则

按 `app-variant-map-笔记.md`「底部输入框 Input」表执行：

- Fold 内 LC C 栏 NoteEditPanel：**`_08`**（2026-05-15 起，新增 variant，替换原 `_01`）
- Pad NLC（展开 / 收起）C 栏：`（／／／）` 待补 → 临时按"省略渲染"处理
- 手机 / Fold 外屏：`_01`

## 落位规则

- C 栏底部 flush：`y = mainH − TI.h`，与杆子 16dp 重叠
- z-order：C 栏 NavBar → Detail → TextInput（TI 在 Detail 之上 fade overlay）
- `x=0, width=栏W` 铺满（特殊框架性组件，不参与外栏合算）

## 缺口

- `_00`（不渲染占位）变体本地组件集中未落地。Pad 执行直接省略渲染（按映射表「不渲染」），不需要变体本体
- Pad NLC C 栏 NoteEditPanel 输入框规格 `（／／／）` 待组件库给出明确变体后填回

> CSV1 / CSV2 同步日期：2026-05-19。
