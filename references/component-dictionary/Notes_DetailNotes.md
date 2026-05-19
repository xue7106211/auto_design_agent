# Notes_DetailNotes 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = Notes_DetailNotes`（笔记 详情承载容器）。

> CSV2 权威：`componentFamily = Notes_DetailNotes`（CSV2 2026-05-19 切分）。`DetailTask_01`（待办 详情）已分离至 `Notes_DetailTask.md`。

## 适用记录

- `DetailNotes_01`（笔记详情承载容器）

## 核心结论

- `componentFamily = Notes_DetailNotes`
- `componentName = Detail_Notes`
- `componentSetId = 561:23028`
- `componentSetKey = 961f0e237edea438d52e6d2ad9b4e38c99bd2c68`
- 主属性键 `variantid`
- **不属于「自带 padding 组件」**：归为「内容容器」并采用特殊 internal=20 处理（详见 `common-rules.md §3.4a`）

## 已验证组件身份

| 字段 | 值 |
| --- | --- |
| `componentFamily` | `Notes_DetailNotes` |
| `componentName` | `Detail_Notes` |
| `componentSetId` | `561:23028` |
| `componentSetKey` | `961f0e237edea438d52e6d2ad9b4e38c99bd2c68` |

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `Detail_Notes_01` |

## 执行记录

| variantId | nodeId | size | 语义 | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `DetailNotes_01` | `561:23029` | `530x626` | 笔记详情正文容器（含封面图、标题、正文） | `2c438f359a098df063155044dbf7470fbca21e36` | `probed` |

## 内部 padding（特殊处理）

`DetailNotes_01` 的「外层 frame paddingLeft」实测为 **0**，但封面图（`image 675`）距 Detail 左缘恒为 **20dp**。在 `§3.4a` 合算规则中：

- **`Detail` 的 internal pl 取 20dp**（封面图偏移），**不**取外层 frame paddingLeft 0。
- 此规则**仅** Detail 适用，不要推广到其他组件。

合算结果（与 Figma 实绘一致）：

| frame | C 栏宽 | spec | outer | x | width |
|-------|--------|------|-------|---|-------|
| Fold 内横 LC | 535 | 12 | 0（internal 20 ≥ 12） | 0 | 535 |
| Fold 内竖 LC | 346 | 12 | 0 | 0 | 346 |
| Pad 横 NLC（展开） | 722 | 28 | 8（28-20） | 8 | 706 |
| Pad 竖 NLC（展开/覆盖） | 521 | 12 | 0 | 0 | 521 |
| Pad 横 NLC 收起 | 994 | 56 | 36（56-20） | 36 | 922 |
| Pad 竖 NLC 收起 | 521 | 20（断点） | 0（20-20） | 0 | 521 |

## 内嵌图片 `image 675`

- 远程子组件（id 链 `91:3015;381:44408`），instance 外部**不可** `maxWidth` / `resize` / parent.resize 改写（全部被锁定）
- 必须保持 `layoutGrow=1, layoutAlign=STRETCH, layoutSizingHorizontal=FILL`，跟随 Detail 外层宽度自动伸缩
- 通过限制 Detail 外层 width 间接控制图片宽度

## 统一执行写法

```js
instance.setProperties({
  variantid: "Detail_Notes_01"
});
```

## 笔记 应用规则

按 `app-variant-map-笔记.md`「内容容器 - 笔记详情 DetailNotes」一律使用 `_01`，所有设备 / 模式（NLC / LC / NC / C）共用。

## 缺口

- 没有其他变体（仅 `_01`）
- 内嵌图片 maxWidth 约束需在 main component 层设置（远程库待落地）；目前依赖外层 width cap 间接实现
