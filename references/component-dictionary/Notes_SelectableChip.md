# Notes_SelectableChip 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = Notes_SelectableChip`（笔记 业务专属标签栏）。

> 通用 `SelectableChip_ComponentSet_00 / _01` 不在本文档范围（属于公共 SelectableChip 集，单独落库）。

## 适用记录

命中以下 `variantId` 时加载本文档：

- `SelectableChip_ComponentSet_Notes_00`（待入库）
- `SelectableChip_ComponentSet_Notes_01`
- `SelectableChip_ComponentSet_Notes_02`

## 核心结论

- `componentFamily = Notes_SelectableChip`
- `componentName = SelectableChip_ComponentSet_Notes`
- `componentSetId = 536:15179`
- `componentSetKey = af1e1df353e8fb1fe8005b82fed310422f2eae4c`
- 主属性键 `variantid`

## 已验证组件身份

| 字段 | 值 |
| --- | --- |
| `componentFamily` | `Notes_SelectableChip` |
| `componentName` | `SelectableChip_ComponentSet_Notes` |
| `componentSetId` | `536:15179` |
| `componentSetKey` | `af1e1df353e8fb1fe8005b82fed310422f2eae4c` |

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `SelectableChip_ComponentSet_Notes_01` / `_02` |

## 执行记录

| variantId | nodeId | size | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- |
| `SelectableChip_ComponentSet_Notes_00` | 待补 | 待补 | 待补 | `csv2-listed` |
| `SelectableChip_ComponentSet_Notes_01` | `536:15180` | `392x52` | `c4a5237b08cb7cb6ae0cc64c440cc91d44b6cafb` | `probed` |
| `SelectableChip_ComponentSet_Notes_02` | `536:15197` | `392x52` | `7d2d83d88d1de6ea6888713ad6508e4e7748b149` | `probed` |

## 内部 padding（按变体清单 CSV2）

| 变体 | 内置左 / 右 padding |
| --- | --- |
| `_01` / `_02` | **左 12，右 0** |

> Figma 实测「直接子节点 x」可能返回 0，但 CSV2 权威值为 **左 12**。合算 padding 时使用 `internal pl = 12`，不使用实测 0。详见 `common-rules.md §3.4a`「权威来源」。

合算规则：SelectableChip 属于「内容容器」，按所在栏 spec 与 `internal pl = 12` 合算决定 outer。

## 统一执行写法

```js
instance.setProperties({
  variantid: "SelectableChip_ComponentSet_Notes_02"
});
```

## 笔记 / 待办 应用规则

- 笔记 / 待办 Pad NLC / NL / NC 收起态 →「不展示」（直接从栏中移除，**不**插入空容器）
- Pad NLC 展开 → `_00`（栏不渲染；标签筛选 / 文件夹切换 由 L 栏 NavigationBar 右侧图标承载）
- Fold 内屏 LC → `_02`
- 手机 / Fold 外屏 → `_01`

## 缺口

- `_00`（笔记 Pad 展开规格）未在本地组件集中落地。Pad 执行时省略渲染（按映射表「不展示」），不需要变体本体即可完成。

> CSV1 / CSV2 同步日期：2026-05-19。
