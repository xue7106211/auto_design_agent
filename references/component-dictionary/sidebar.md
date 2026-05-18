# Sidebar 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = Sidebar`。

## 适用记录

- `Sidebar_Component_PAD_NLC_00` ~ `_03`
- `Sidebar_Component_PAD_LC_01`、`Sidebar_Component_PAD_LC_Fab_01`
- `Sidebar_Component_Fold_LC_01`、`Sidebar_Component_Fold_LC_Fab_01`

## 核心结论

### 组件归属（重要）

`Sidebar_*` 变体不在独立 `Sidebar` 组件集中，而是落在 **统一 `BottomBar` 组件集**（与 `BottomBar_Showcase_*` / `Fab_01` / `TopBar_01/02` 共集）。这与 `NavigationBar` / `TopBar` 合并的形态相同。

- `componentFamily = Sidebar`（语义）
- 实际 `componentName = BottomBar`（设计系统集名称）
- `componentSetId = 1089:30478`（本地分支已 import 的最新版本）
- `componentSetKey = 414cabc8e633c33cc6441ff0f936f971dc9babd3`
- 设计系统更新日期：2026-05-15
- 主属性键 `variantId` + `如何展示` + `fab` + `底导航`

### 同名旧版本组件

历史会话中曾使用 mainComponent ID `244:9067` 的旧 Sidebar，结构差异：旧版卡片 `y=6, h=782`，新版卡片 `y=0, h=788`（顶部 6dp 偏移消除）。

clone 旧 instance 之前必须 `search_design_system` 比对 `updatedAt`，确认是否需要 `swapComponent` 到新版。详见 `common-rules.md §3.10`。

## 真实属性键

| 字段 | 说明 | 取值 |
| --- | --- | --- |
| `variantId` | 主变体 | 见执行记录 |
| `如何展示` | Fab / 内容布局变体 | `无` / `居中` / `居左` / `分开` / `右侧` |
| `fab` | 是否含 Fab | `有` / `无` |
| `底导航` | 是否含底导航 | `有` / `无` |

## 执行记录（笔记 / 通用 Sidebar 部分）

| variantId | nodeId | size | 语义 | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `Sidebar_Component_PAD_NLC_01` | `1089:30487` | `272x800` | Pad NLC 侧边栏（展开） | `6d04ad3531a9074c6b54767618ea73b8aacc7e71` | `probed` |
| `Sidebar_Component_PAD_NLC_02` | `1089:30489` | `88x800` | Pad NLC 侧边栏（收起 88dp） | `a9e29c4c41e5fa6e501c7dbca2645e95cbbb5df4` | `probed` |
| `Sidebar_Component_PAD_NLC_03` | `1089:30488` | `272x800` | Pad NLC 侧边栏（编辑态） | `36dde21615cb7745cb3bda960ddf5b34f0738530` | `probed` |
| `Sidebar_Component_PAD_LC_01` | `1089:30485` | `440x800` | Pad LC 侧边栏 | `9e4a2e04f7d24eff00b5ea5666424da8cb49d0a3` | `probed` |
| `Sidebar_Component_PAD_LC_Fab_01` | `1089:30486` | `440x800` | Pad LC 侧边栏（Fab） | `387b1b670548a2e3411f7266faf34467d0224007` | `probed` |
| `Sidebar_Component_Fold_LC_01` | `1089:30490` | `353x800` | Fold 内 LC 侧边栏 | `823b7d6e7b079ed679b780b5f2541e9f212dad61` | `probed` |
| `Sidebar_Component_Fold_LC_Fab_01` | `1089:30491` | `353x800` | Fold 内 LC 侧边栏（Fab） | `dbdf1cdae0406b55d5aa6830fc1faa79a6ac5375` | `probed` |

> `Sidebar_Component_PAD_NLC_00` 在 CSV1 中作为「笔记 / 待办收起态」占位（不渲染），当前本地组件集中**未落地**。笔记执行时按映射表「N 栏直接消失」处理，不需要变体本体。

## 内部 padding

| 层级 | 值 |
| --- | --- |
| 外壳（Sidebar instance） | 左 12（卡片区域偏移） |
| 卡片（`BoardMaterialSection`） | 内左 12，右 12 |
| 卡片含 Fab 时 | 右 24 |

外层 instance **一律栏内 / 主内容区 / 覆盖位置铺满**（特殊组件，不参与合算）。

## 统一执行写法

Sidebar 变体在统一 `BottomBar` 集中，必须同时设置 4 个属性：

```js
instance.setProperties({
  variantId: "Sidebar_Component_PAD_NLC_01",
  "如何展示": "无",
  fab: "无",
  底导航: "无"
});
```

或者通过 `swapComponent(targetVariant)` 切换（推荐，避免属性配置漏写）。

## 强制写入序列（关键）

`Sidebar` 是「复杂 instance」，仅 `swap + resize` 经常被忽略，instance 会保持自然 800dp 高度。必须按 `common-rules.md §3.6` 强制：

```js
inst.swapComponent(targetVariant);
inst.resetOverrides();
inst.primaryAxisSizingMode = "FIXED"; // 关键
inst.resize(targetW, targetH);
inst.x = 0;
inst.y = (Pad横 ? 0 : statusBarH);   // overlay 模式从 statusBarH 开始
```

## 笔记 / 待办 应用规则

笔记 / 待办 收起态**不**使用 88dp `_02` 形态。改为：

- N 栏直接消失（Pad 横：L/C 吸收 N 宽度；Pad 竖：N 原本覆盖 LC，收起后 LC 回归原尺寸）
- N 恢复图标内嵌于 L 标题栏最左：`NavigationBar_ComponentSet_17`（默认）/ `_18`（编辑态）

电话 / 联系人 / 文件管理等其他应用仍使用 `_02` 收起形态。

## 阴影裁切防止

- Pad 横（Sidebar 在 N 栏内）：N 栏 + 主内容区 `clipsContent = false`，否则阴影被裁
- Pad 竖（Sidebar 是 frame 直接子级，覆盖布局）：frame `clipsContent` 保持 `true`（保留圆角），其他容器不影响
- 详见 `common-rules.md §3.9`

## NLC 覆盖模式 z-order

Pad 竖 NLC 覆盖时 frame 子级顺序（`scenarioFlags.NCovering=true` 单独激活）：

```
1. 主内容区（main，含 L/C）
2. 遮罩-N覆盖
3. 状态栏-StatusBar  ← 在遮罩之上保证时间/信号可读（笔记/待办 修订）
4. 栏间分割线（如有）
5. Sidebar           ← 紧贴状态栏下沿
6. 杆子（最顶 z）
```

详见 `common-rules.md §3.7`（笔记/待办 修订版表）。

## 多 mask 同时激活时的 z-order（§3.7b）

当 `scenarioFlags.LEditMode + NCovering` **同时为 true** 时（如 笔记 编辑模式 V2 适配 中 列表多选 + Pad 竖覆盖），Sidebar 的 z 位与单 NCovering 不同：

```
1. 主内容区（仅 C 栏；L 栏已 promote 至 frame 直接子级）
2. 遮罩-编辑 (Cw × frameH)
3. 状态栏-StatusBar
4. 栏间分割线
5. L 栏              ← 编辑遮罩 之上，N 覆盖遮罩 之下
6. 遮罩-N覆盖（全 frame）
7. Sidebar           ← N 覆盖遮罩 之上（唯一豁免：Sidebar = N 覆盖 trigger）
8. 杆子（最顶）
```

**关键**：Sidebar 在多 mask 场景仍位于 N 覆盖遮罩之上（trigger 豁免原则）。L 栏不豁免 N 覆盖遮罩，但豁免编辑遮罩。**禁止凭直觉将 L 栏与 Sidebar 同 z 层处理**。

详见 `common-rules.md §3.7b`。
