# App Variant Map 统一模板

本文档定义 `references/app-variant-map-{appName}.md` 的推荐结构。
目标不是解释业务，而是约束这类映射表应该如何组织，保证主链路能够稳定按
`appName + device + screenMode + resolvedUiElement`
查到
`resultType + variantId`。

## 适用范围

- 所有应用级 variant 映射表
- 如 `references/app-variant-map-笔记.md`
- 如 `references/app-variant-map-文管.md`
- 如 `references/app-variant-map-录音.md`

## 模板目标

统一模板只服务三件事：

1. 明确查询键
2. 明确合法值域
3. 用结构化表格承载映射结果

不负责：

- 替代 `figma-component-dictionary.md`
- 替代组件探查
- 替代布局 reference
- 记录迁移历史、原始脏数据或临时清洗过程

## 推荐文件头

```yaml
---
name: app-variant-map
description: {appName} 应用的语义组件在不同设备与屏幕模式下的目标变体映射表
app: {appName}
kind: app-variant-map
sourceOfTruth: manual
status: draft
---
```

说明：

- `name` 固定为 `app-variant-map`
- `app` 必须与文件名中的 `{appName}` 一致
- `status` 可用 `draft` / `active`
- 不额外引入与执行无关的 frontmatter 字段

## 推荐正文结构

每份 `app-variant-map` 建议保持以下顺序：

0. **应用规则要点 §0（含 scenarioFlags 导出信号表 —— 含遮罩 / 编辑 trigger 的应用必填）**
1. 查询契约
2. 枚举定义
3. 子场景约定（如果需要）
4. 映射表
5. 当前覆盖缺口

除上述结构外，默认不要追加大段重复说明。

## 0. 应用规则要点（含 scenarioFlags 导出信号表）

**适用范围**：当该应用在多端适配中 **可能触发任一 mask 或 编辑 trigger**（如 L 栏多选编辑 / N 覆盖 / N 编辑 等）时，本节 **必填**。无 trigger 的纯静态应用可省略本节。

### §0.1 layoutType 默认（必填）

每设备给出 default `layoutType`，禁止跨设备共用。示例：

```md
| device | default layoutType | 子模式 / 说明 |
|---|---|---|
| Phone / Fold外屏 | C | — |
| Fold内屏 横/竖 | LC | — |
| Pad 横屏 | NLC（并列）| — |
| Pad 竖屏 | NLC（覆盖）| 含 `遮罩-N覆盖` |
```

### §0.X scenarioFlags 导出信号表（**含 trigger 应用必填**）

**作用**：SKILL Phase 4 step 7 输出 `scenarioFlags` JSON 时，唯一权威 lookup source。**禁止从 source frame 名 / variant 推测 flag 值** —— 必须按本表的列出信号匹配。

**标准 skeleton**：

```md
### §0.X scenarioFlags 导出信号表

| flag | 激活信号（任一 ✅ 即激活）| 关联 §3.7? |
|------|--------------------------|-----------|
| `LEditMode` | source frame 名含 `已选` / `选择` / `编辑` • L 栏 List variant ∈ 编辑系列（如 `_02/_04/_06`）• L 栏出现 `ToolBar_*` 编辑工具栏 | §3.7a 触发 |
| `NEditMode` | source N 栏明确 编辑标识 • Sidebar variant ∈ 编辑系列（如 `_03`）| §3.7a / §3.7b 触发 |
| `CEditMode` | source C 栏明确 编辑/输入 状态（如 NoteEditPanel `_01/_02/_03` 出现） | §3.7a 末（无 mask）|
| `NCovering` | layoutType = `NLC覆盖` （由 §0.1 决定） | §3.7 触发 |
```

**填写规则**：

1. **每行 trigger 至少一个 信号**；信号缺失 → flag 默认 `false`（不可推测为 `true`）
2. **同应用内信号统一**：信号集应该 cross-frame 一致；不同 frame 同 trigger 的信号不一致 → 在 notes 列说明
3. **多 trigger 同时**：每 flag 独立判定，不互斥 —— Phase 4 step 7 输出时所有 flag 都给出 boolean
4. **新增 flag**：当应用引入新 trigger（例：搜索激活、浮层 弹出）时，向本表增行 + 同步更新 `common-rules §3.7*` 触发条件描述

### §0.Y 应用专用 trigger 例外（可选）

若该应用对 `common-rules §3.7 / §3.7a / §3.7b` 的通用规则有 **明确偏离**，本节列出。无偏离时省略。

示例：

```md
### §0.Y 应用专用 trigger 例外

| 偏离场景 | 说明 |
|---|---|
| 笔记 N 收起 (framework 分支) | NLC: 不使用 `Sidebar_PAD_NLC_02`；改为 N 栏直接消失 + L/C 标题栏内嵌 `_17/_18` 恢复图标. NL (宫格): N 栏直接消失 + L NavBar = `_00` (不渲染) + TopBar_07 自带 N 复原 icon. 详见 `app-variant-map-笔记.md §0 #8` |
```

### §0.Z 其他应用规则（落位关键 / padding / token / 历史踩坑）

参考 `app-variant-map-笔记.md §0.1~§0.6` 实例。各应用按需展开，不强制全部填写。

---

## 1. 查询契约

建议固定为短格式：

```md
## 查询契约

- 输入：`appName + device + screenMode + resolvedUiElement`
- 输出：`resultType + variantId`
- 若未命中：返回 `undefined`，调用方必须中止，不允许猜测
```

要求：

- 只保留执行必须的信息
- 不重复解释主 Skill 已经覆盖的流程
- 不写“本文档不负责什么”的长段落

## 1.1 分号 · 跨表合并解释规则

各 `app-variant-map-*.md` 的主映射表采用 **宽透视（wide pivot）形式**：一行 = 一个 uiElement / 子场景，列 = 设备 × screenMode，一个单元格内可出现 `栏：variantId` 的组合。单元格内部与跨表的解释规则如下：

### 1) 单元格内的分号 `；` = sibling（平行）

- `栏A：X；栏B：Y` → 分别放入不同栏 X、Y
- `栏A：X；栏A：Y` → 同一栏内 X 与 Y **平行放置**（同栏多组件并列）
- 本规则仅在 **单个单元格范围内** 生效，跨表不适用

### 2) 不同子表针对 **同一栏** = 包含关系（outer → inner）

一份 `app-variant-map` 按组件类型分成多个子表（`#### 导航栏 Sidebar / BottomBar`、`#### 标题栏 NavigationBar`、`#### 搜索栏 SearchBar`、`#### 标签栏`、`#### 列表 List`、`#### 底部工具栏 ToolBar` 等）。当同一栏在两个及以上子表中被提到时，**按下列层级从 outer 合并到 inner，不是 sibling**：

| 层级 | 子表 | 角色 |
|------|------|------|
| L0 | `导航栏 Sidebar / BottomBar` | 该栏的外壳 / 底座（Sidebar、BottomBar、TopBar 等） |
| L1 | `标题栏 NavigationBar` | L0 内部的顶部标题栏 |
| L2 | `搜索栏 SearchBar` / `标签栏 SelectableChip` / `信息提示 NoticeBar` 等 | L0 内部的顶部辅助控件 |
| L3 | `列表 List` / `内容容器 Detail*` 等 | L0 内部的主内容 |
| L4 | `底部工具栏 ToolBar / BottomBar_Showcase` / `底部输入框 Input` | L0 内部的底部控件 |
| L5 | `Fab` | 位于 L0 之上的定位元素 |

### 3) 外壳（L0）已内置标题栏的情形

`Sidebar_Component_PAD_NLC_*` 等部分外壳组件默认就包含内部标题栏。此时 L1 子表中的 `NavigationBar_*` 条目是 **「该内置标题栏应采用的 variant」** 元数据，**不再以 sibling 形式另外放置**。

判断外壳实例是否已内置标题栏的标准：

- 该外壳 variant 的定义 / 画布实例中已存在标题栏子节点
- 外壳属于 `Sidebar_Component_*` / `FloatingWindow_ComponentSet_*` / `DrawerWindow_ComponentSet_*` 系列（几乎总是内置标题栏）

外壳未内置标题栏的情形（例如普通 `Frame` 外壳）：

- L1 条目 `NavigationBar_*` 作为 sibling 放置在外壳内部最顶部

### 4) 示例

以 `笔记 Pad 竖屏 NLC` 为例，合并读取两行：

```
#### 导航栏 Sidebar / BottomBar   → N 栏：Sidebar_Component_PAD_NLC_01
#### 标题栏 NavigationBar — 默认  → N 栏：NavigationBar_ComponentSet_12
#### 标题栏 NavigationBar — 默认  → L 栏：NavigationBar_ComponentSet_07
#### 搜索栏 SearchBar             → L 栏：SearchBar_ComponentSet_05
#### 列表 List — 默认             → L 栏：List_Notes_03
```

合并结果：

- **N 栏**：Sidebar_PAD_NLC_01（外壳，内置标题栏）。NavigationBar_12 是其内置标题栏的 variant 指定，**不是** sibling。
- **L 栏**：普通 Frame 外壳 + 顶部 NavigationBar_07（sibling，平行） + 其下 SearchBar_05 + 主内容 List_Notes_03。

## 2. 枚举定义

建议每份文件只保留执行期真正会用到的枚举。

### `device`

```md
### `device`

| 值 | 含义 |
| --- | --- |
| `Phone` | 手机 |
| `Fold外屏` | 折叠屏外屏 |
| `Fold内屏` | 折叠屏内屏 |
| `Pad竖屏` | 平板竖屏 |
| `Pad横屏` | 平板横屏 |
```

### `screenMode`

只列当前应用实际使用到的值，不强求每份文件都列满。

示例：

```md
### `screenMode`

| 值 | 含义 |
| --- | --- |
| `L` | List，列表画面 |
| `C` | Content，内容画面 |
| `LC` | List + Content 复合画面 |
| `NC` | Navigation + Content 复合画面 |
| `NLC` | Navigation + List + Content 三栏 |
```

### `resultType`

```md
### `resultType`

| 值 | 含义 |
| --- | --- |
| `variant` | 命中真实 `variantId` |
| `hidden` | 元素保留语义但当前场景不显示 |
| `absent` | 该场景下无此元素 |
| `undefined` | 尚未建档，调用方必须中止 |
```

要求：

- 不写“原始记录为 `-` / `null` / 留空”这类迁移说明
- 不在枚举区掺入业务解释

## 3. 子场景约定

只有在同一应用内确实存在多套语义前缀或子场景时，才保留这一节。

示例：

```md
## 子场景约定

| 子场景 | uiElement 前缀 | 说明 |
| --- | --- | --- |
| 笔记列表 | `笔记_` | 列表浏览与管理 |
| 图文编辑 | `图文_` | 图文编辑模式 |
```

要求：

- 这一节只定义前缀和场景，不写映射结果
- 如果应用没有子场景，整节省略

## 4. 映射表

这是整个文件的核心。

推荐字段：

| 字段 | 是否必需 | 用途 |
| --- | --- | --- |
| `uiElement` | 必需 | 组件语义键 |
| `device` | 必需 | 目标设备 |
| `screenMode` | 必需 | 查询键的一部分 |
| `resultType` | 必需 | 返回类型 |
| `variantId` | 必需 | 仅 `resultType=variant` 时填写 |
| `notes` | 可选 | 极短执行补充 |

推荐表头：

```md
| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
```

### `uiElement` 编写规则

`uiElement` 应优先使用组件级粒度，而不是页面级粒度。

优先保留：

- `标题栏_一级`
- `标题栏_二级`
- `状态栏`
- `底部导航`
- `侧边栏`
- `搜索栏`
- `标签栏`
- `Fab`
- `工具栏`
- `浮窗` / `抽屉` / `弹窗` / `菜单`（浮层容器；规格见 `layouts/device-dimensions.md` 的「浮层规格」小节）

谨慎使用：

- `页面框架`
- `页面容器`
- `页面骨架`

规则：

- 页面框架类记录只能作为骨架级补充，不能替代基础组件映射
- 如果一个页面会命中 `NavigationBar`、`StatusBar`、`BottomBar`、`Sidebar` 等基础组件，必须优先给这些组件单独建行
- 不允许只写 `页面框架`，却缺少对应的基础组件映射

### `variantId` 编写规则

- `variantId` 必须是当前仓库内已注册、可执行、稳定的真实值
- 不允许填写临时命名、口语名、占位名
- 如尚未拿到真实值，应改为 `resultType=undefined`，不要伪造 `variantId`

错误示例：

```md
| `AI输入框` | `Pad横屏` | `C` | `variant` | `输入框1` | 临时命名 |
```

推荐改法：

```md
| `AI输入框` | `Pad横屏` | `C` | `undefined` |  | 待补真实 variantId |
```

### `notes` 使用规则

`notes` 只写短补充，允许内容示例：

- `L栏承载`
- `C面板承载`
- `Pad 专用`
- `随 Fab`
- `待补真实 variantId`

`notes` 不应承载：

- 原始迁移痕迹
- 清洗前的脏值说明
- 长段执行逻辑

### 推荐写法示例

```md
## 映射表

| uiElement | device | screenMode | resultType | variantId | notes |
| --- | --- | --- | --- | --- | --- |
| `标题栏_一级` | `Phone` | `L` | `variant` | `NavigationBar_ComponentSet_01` |  |
| `标题栏_一级` | `Fold内屏` | `LC` | `variant` | `NavigationBar_ComponentSet_04` | L栏承载 |
| `标题栏_一级` | `Pad横屏` | `NC` | `variant` | `NavigationBar_ComponentSet_07` | N栏承载 |
| `状态栏` | `Fold内屏` | `LC` | `variant` | `StatusBar_Fold_01` |  |
| `底部导航` | `Pad横屏` | `NLC` | `hidden` |  | 保留语义但不显示 |
| `AI输入框` | `Pad横屏` | `C` | `undefined` |  | 待补真实 variantId |
```

## 5. 当前覆盖缺口

这一节应保留，但只记录“还没定义什么”，不记录迁移过程。

推荐格式：

```md
## 当前覆盖缺口

- `标题栏_编辑` 在 `Fold内屏 + LC` 下尚未建档
- `AI输入框` 的真实 `variantId` 待补
- `Pad竖屏 + NLC` 的标签栏映射待补
```

要求：

- 用“缺什么”表述
- 不用“原始表里是什么值”表述
- 不写与当前应用无关的泛泛 TODO

## 应移除或收缩的内容

以下内容不建议继续作为每份 `app-variant-map` 的主体：

- 大段“本文档不负责什么”
- 大段“主 Skill 会如何调用本文件”
- “原始记录为 `-` / `null` / 留空”
- 临时清洗痕迹
- 与执行无关的业务说明

这些内容如果确实需要，优先放到：

- `README.md`
- `figma-component-dictionary.md`
- 专门的清洗记录或归档文档

## 最小合格标准

一份合格的 `app-variant-map` 至少应满足：

1. 有合法 frontmatter
2. 查询键和值域定义清楚
3. 主表字段统一为 `uiElement / device / screenMode / resultType / variantId / notes`
4. 基础组件优先于页面框架建档
5. 不使用临时 `variantId`
6. 未建档组合明确写成 `undefined`
7. 覆盖缺口可直接指导后续补档
