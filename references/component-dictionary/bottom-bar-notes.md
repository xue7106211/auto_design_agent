# BottomBar_Showcase_Notes 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = BottomBar`（笔记业务工具栏 `Showcase` 类）。

> 笔记业务还包含 `BottomBar_Notes_Outline_00 / _01 / _02`（思维导图 / 大纲工具栏） 与 `BottomBar_NoteEditPanel_00 / _01 / _02 / _03`（编辑面板）变体集，未在本文档落库；后续按需补充。
>
> 通用 `BottomBar_Showcase_00 / _01 / _02 / _Fab_01 / _Fab_02` 也属于同族但不归本文档；后续可拆分至独立 `bottom-bar-showcase.md` 字典文件。
>
> CSV1 / CSV2 同步日期：2026-05-18。

## 适用记录

- `BottomBar_Showcase_Notes_00`（待入库）
- `BottomBar_Showcase_Notes_01`
- `BottomBar_Showcase_Notes_02`（**source 文件未落地**）

## 核心结论

- `componentFamily = BottomBar`
- `componentName = BottomBar_Showcase_Notes`
- `componentSetId = 536:15144`
- `componentSetKey = 303649c8435835bcbfb5e85e668a0b6562497cad`
- 主属性键 `variantid`
- **属于「特殊（框架性）」组件**：栏内 `x=0, width=栏W` 铺满，外层不参与合算。内部胶囊层（`TabMaterial-Showcase`）按工具栏规格独立适配（详见 `device-dimensions.md`「工具栏规格」+ `common-rules.md §3.9`）。

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `BottomBar_Showcase_Notes_01` |

## 执行记录

| variantId | nodeId | size | 语义 | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `BottomBar_Showcase_Notes_01` | `536:15145` | `392x100` | 笔记列表底部工具栏（默认） | `6eb3e008d0b867352b3a67bf4a29e29ba784d1e0` | `probed` |

## 内部 padding（按变体清单 CSV2）

| 变体 | 屏宽 ≥ 440 | 屏宽 < 440 |
| --- | --- | --- |
| `_01` / `_02` | 内部胶囊定宽 344dp（屏内居中） | 铺满 + 左右 padding 24dp |

外层 instance 一律栏内铺满（`x=0, width=栏W`）。

## 统一执行写法

```js
instance.setProperties({
  variantid: "BottomBar_Showcase_Notes_01"
});
```

## 笔记 应用规则（按 `app-variant-map-笔记.md`）

- 手机 / Fold 外屏 NLC / NL / LC：`_01`
- Fold 内屏 LC（NLC / LC）L 栏：**`_02`**（CSV1 spec 已更新；当前组件库未落地，临时 `_01` fallback）
- Pad NLC / NL（展开 / 收起）：`_00`（栏不渲染）
- Pad 竖 LC / 横 LC：`_00`

## 缺口

- `_00` 变体（Pad 不渲染占位）未在本地组件集中落地。Pad 执行直接省略渲染。
- `_02` 变体（Fold 内屏 LC L 栏 spec）**source 文件未落地**。映射表保持 `_02` 不修改作为权威 spec；执行时降级使用 `_01`，记录 `fallback`，待组件库补齐后通过 `swapComponent` 升级。
