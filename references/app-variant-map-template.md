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

1. 查询契约
2. 枚举定义
3. 子场景约定（如果需要）
4. 映射表
5. 当前覆盖缺口

除上述结构外，默认不要追加大段重复说明。

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
