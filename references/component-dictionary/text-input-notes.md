# TextInput_Notes 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = TextInput`（笔记业务输入框）。

## 适用记录

- `TextInput_ComponentSet_Notes_00`（待入库 / 不渲染占位）
- `TextInput_ComponentSet_Notes_01` ~ `_07`

## 核心结论

- `componentFamily = TextInput`
- `componentName = TextInput_ComponentSet_Notes`
- `componentSetId = 561:16235`
- `componentSetKey = 0dc20401cde070d654725146db336032d2f886a2`
- 主属性键 `variantid`
- **属于「特殊（框架性）」组件**：栏内 `x=0, width=栏W` 铺满，**不**参与栏 padding 合算（见 `common-rules.md §3.4a`）

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `_01` ~ `_07` |

## 执行记录

| variantId | nodeId | size | 语义 | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `TextInput_ComponentSet_Notes_01` | `561:16236` | `392x92` | NoteEditPanel 默认 | `e42144d9d18ec4de4445cb6a5eed68df91cfe958` | `probed` |
| `TextInput_ComponentSet_Notes_02` | `561:16246` | `392x92` | NoteEditPanel 变体 02 | `6f63c740b9b8c8c37b1b613d4b71a1e3931456c9` | `probed` |
| `TextInput_ComponentSet_Notes_03` | `561:16256` | `392x124` | NoteEditPanel 变体 03 | `9eda0aea6a517b34768e2380bf186b2e5b00516d` | `probed` |
| `TextInput_ComponentSet_Notes_04` | `561:16260` | `392x124` | NoteEditPanel 变体 04 | `771da21deec7679c9f484047a08ab159b800ba45` | `probed` |
| `TextInput_ComponentSet_Notes_05` | `561:16288` | `392x295` | NoteEditPanel 变体 05 | `cd6cf80e5b74dfe6335be872400bb2d320d4ab90` | `probed` |
| `TextInput_ComponentSet_Notes_06` | `561:16264` | `392x313` | NoteEditPanel 变体 06 | `be1411d62a1bb1135747e326ba435156b497b7d2` | `probed` |
| `TextInput_ComponentSet_Notes_07` | `561:16312` | `392x295` | NoteEditPanel 变体 07 | `88e306bc4037d42c5e72c9f8c7c39ade2213e072` | `probed` |

## 内部 padding（按变体清单 CSV2，按设备区分）

| 变体 | Q18 内屏（Fold 内）| Q18 外屏 / 手机 | Q18 横屏（Pad 类似） | Q18 竖屏 |
| --- | --- | --- | --- | --- |
| `_01` | 左 20，右 20 | 左 16，右 16 | — | — |
| `_02` | — | 左 16，右 16 | 左 116，右 116 | 左 24，右 24 |
| `_03` | — | 左 16，右 16 | 左 116，右 116 | 左 24，右 24 |
| `_04` | — | 左 16，右 16 | 左 116，右 116 | 左 24，右 24 |
| `_05` / `_06` / `_07` | 定宽，屏中对齐 | 定宽，屏中对齐 | 定宽，屏中对齐 | 定宽，屏中对齐 |

## 统一执行写法

```js
instance.setProperties({
  variantid: "TextInput_ComponentSet_Notes_01"
});
```

## 笔记 应用规则

按 `app-variant-map-笔记.md`「底部输入框 Input」表执行：

- Fold 内 LC C 栏 NoteEditPanel：`_01`
- Pad NLC（展开 / 收起）C 栏：`_00`（栏不渲染；功能由 C 栏 NavigationBar 右侧图标承载）
- 其他变体（`_02` ~ `_07`）按 NoteEditPanel 子状态使用

## 缺口

- `_00`（不渲染占位）变体本地组件集中未落地。Pad 执行直接省略渲染（按映射表「不渲染」），不需要变体本体。
