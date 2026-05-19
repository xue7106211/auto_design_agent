# Notes_NavigationBar 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = Notes_NavigationBar`（笔记 业务专属标题栏）。

> 通用 `NavigationBar_ComponentSet_00 ~ _18` / `Pad_TopBar_*` / `TopBar_*` 在 `navigation-bar.md`，本文件不重复。
> CSV2 权威：`componentFamily = Notes_NavigationBar`（CSV2 2026-05-19 切分），variantId 沿用 `NavigationBar_ComponentSet_Notes_*`。

## 适用记录

命中以下 `variantId` 时加载本文档：

- `NavigationBar_ComponentSet_Notes_01`（笔记 标题栏 默认 / 详情）
- `NavigationBar_ComponentSet_Notes_02`（笔记 思维导图 标题栏）
- `NavigationBar_ComponentSet_Notes_03`（笔记 Pad 思维导图 / Pad NC 收起 L 栏）
- `NavigationBar_ComponentSet_Notes_04`（笔记 标题栏 变体）

## 核心结论

- `componentFamily = Notes_NavigationBar`
- `componentName = NavigationBar_ComponentSet_Notes`
- `componentSetKey = ac60af7e28e6491b3520ecaefd71fa7e03832c31`（笔记 业务组件库 set；2026-05-15 实测从主 `NavigationBar` set 拆分）
- 主属性键 `VariantId`

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `VariantId` | 主变体 | `NavigationBar_ComponentSet_Notes_01` ~ `_04` |

## 执行记录

| variantId | nodeId | size | 语义 | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `NavigationBar_ComponentSet_Notes_01` | 待补 | 待补 | 笔记 业务_标题栏 | 待补 | `csv2-listed` |
| `NavigationBar_ComponentSet_Notes_02` | 待补 | 待补 | 笔记 思维导图 标题栏 | 待补 | `csv2-listed` |
| `NavigationBar_ComponentSet_Notes_03` | 待补 | 待补 | Pad 思维导图 / Pad NC 收起 L 栏 标题栏 | 待补 | `csv2-listed` |
| `NavigationBar_ComponentSet_Notes_04` | 待补 | 待补 | 笔记 标题栏 变体 | 待补 | `csv2-listed` |

## 内部 padding（按 CSV2）

| 变体 | padding |
| --- | --- |
| `_01` ~ `_04` | 左 12；右 12 |

## 落位规则

- 各变体在 C 栏 / L 栏作为标题栏 framework 组件出现：`x=0, width=栏W` 铺满
- 不参与栏 padding 合算（`common-rules.md §3.4a`「特殊（框架性）组件」）
- z-order：栏内顶部，常态显示

## 笔记 应用规则

按 `app-variant-map-笔记.md` 「标题栏 NavigationBar」相关表执行：

- `_01`：C 栏默认标题栏（NLC / LC / 详情全屏 各模式 C 栏；Fold 内屏 / Pad 全模式）
- `_02`：思维导图 浏览 / MindMap_Edit 标题栏（手机 / Fold外 / Fold内 全设备 C 栏）
- `_03`：Pad 思维导图 / Pad NC 收起 L 栏 标题栏
- `_04`：备用变体（具体应用场景待 CSV1 同步后回填）

## 缺口

- 各 variant 的 `nodeId` / `componentKey` / 自然尺寸 待 探查
- `_04` 的具体应用场景待 CSV1 总表回填

> CSV1 / CSV2 同步日期：2026-05-19。
