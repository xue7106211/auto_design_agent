# Notes_List 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = Notes_List`（笔记 / 待办 业务列表）。

> CSV2 权威：`componentFamily = Notes_List`（CSV2 2026-05-19 切分）。`List_NoteSetting_01` 已分离至 `Notes_List_NoteSetting.md`。

## 适用记录

命中以下 `variantId` 时加载本文档：

- `List_Notes_01` ~ `List_Notes_06`
- `List_Notes_07` ~ `List_Notes_13`（CSV2 2026-05-18 新增，卡片列表 Fold/Pad 设备分化变体；待 Figma 探查）
- `List_Task_01` ~ `List_Task_04`（待办子场景）

## 核心结论

- `componentFamily = Notes_List`
- `componentName = List_Notes`
- `componentSetId = 554:15367`
- `componentSetKey = 94f9b4085ba12b43511a95282fa84225241f6f9e`
- 主属性键 `variantid`

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `List_Notes_01` / `_02` / `_03` / `_04` / `_05` / `_06` |

## 执行记录

| variantId | nodeId | size | 语义 | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `List_Notes_01` | `554:15390` | `392x1017` | 笔记列表 - 卡片样式 | `5afc5ed80e5b0d8d1ac2e5ace609dd85b0e63258` | `probed` |
| `List_Notes_02` | `554:15399` | `392x1017` | 笔记列表 - 卡片 - 编辑模式 | `b393790a316330578d4c9dd8e3e6667c4d3c62b4` | `probed` |
| `List_Notes_03` | `554:15408` | `356x938` | 笔记列表（栏内，非卡片） | `69a49103b5b885f6964776119a91cc286ca4d5d3` | `probed` |
| `List_Notes_04` | `554:15424` | `356x938` | 笔记列表（栏内）- 编辑模式 | `2a5a09e76ccf6ee26520d45ba56f8e91c71a2581` | `probed` |
| `List_Notes_05` | `554:15368` | `392x998` | 笔记列表 - 板状 | `895f14edf5a6947a8485a2d09be0ac642f9326e9` | `probed` |
| `List_Notes_06` | `554:15379` | `392x998` | 笔记列表 - 板状 - 编辑模式 | `0b695d3f690315d0acf8112fb9958f0300283f3d` | `probed` |
| `List_Notes_07` | 待补 | 待补 | 卡片列表 - Fold 外屏 | 待补 | `csv2-listed` |
| `List_Notes_08` | 待补 | 待补 | 卡片列表 - Fold 内竖 | 待补 | `csv2-listed` |
| `List_Notes_09` | 待补 | 待补 | 卡片列表 - Fold 内横 | 待补 | `csv2-listed` |
| `List_Notes_10` | 待补 | 待补 | 卡片列表 - Pad 竖 | 待补 | `csv2-listed` |
| `List_Notes_11` | 待补 | 待补 | 卡片列表 - Pad 竖 收起 | 待补 | `csv2-listed` |
| `List_Notes_12` | 待补 | 待补 | 卡片列表 - Pad 横 | 待补 | `csv2-listed` |
| `List_Notes_13` | 待补 | 待补 | 卡片列表 - Pad 横 收起 | 待补 | `csv2-listed` |
| `List_Task_01` | 待补 | 待补 | 待办列表（卡片） | 待补 | `csv2-listed` |
| `List_Task_02` | 待补 | 待补 | 待办列表（卡片 编辑） | 待补 | `csv2-listed` |
| `List_Task_03` | 待补 | 待补 | 待办列表（栏内） | 待补 | `csv2-listed` |
| `List_Task_04` | 待补 | 待补 | 待办列表（栏内 编辑） | 待补 | `csv2-listed` |

## 内部 padding（按变体清单 CSV2）

| 变体 | 内置左 / 右 padding |
| --- | --- |
| `List_Notes_01` | 左 12，右 12 |
| `List_Notes_02` ~ `List_Notes_06` | 左 12，右 12 |
| `List_Notes_07` ~ `List_Notes_13` | 左 12，右 12 |
| `List_Task_01` ~ `List_Task_04` | 左 12，右 12 |

合算规则：List 属于「内容容器」。`common-rules.md §3.4a`：

- spec ≤ 12（手机 / Fold / Pad 大多数 NLC C 栏）→ outer = 0，铺满
- spec = 20（Pad 横/竖 NLC L 栏，断点 428→20）→ outer = 8

## 统一执行写法

```js
instance.setProperties({
  variantid: "List_Notes_03"
});
```

## 笔记 / 待办 应用规则

按 `app-variant-map-笔记.md`「列表 List」表执行。要点：

- 手机 / Fold 外屏 NLC = `_01`，编辑 = `_02`
- Fold 内屏 LC（NLC / LC）L 栏 = `_03`，编辑 = `_04`
- Pad NLC L 栏（展开 / 收起）= `_03`，编辑 = `_04`
- NL 默认（device-specific 变体，CSV1 控件总表）：手机竖 `_05` / Fold 外竖 `_07` / Fold 内竖 C fallback `_08` / Fold 内横 C fallback `_09` / Pad 竖 NL `_10` / Pad 竖 NL 收起 `_11` / Pad 横 NL `_12` / Pad 横 NL 收起 `_13`
- NL 编辑：全设备一致 `_06`（CSV1 sources 一致；唯一编辑变体）

> CSV1 / CSV2 同步日期：2026-05-19。
