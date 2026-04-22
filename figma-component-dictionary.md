---
name: figma-component-dictionary
description: 组件字典技能。根据 appName + 设备 + 屏幕模式查断点表获取 variantId，再定位组件并执行 setProperties 或 swapComponent。
disable-model-invocation: false
---

# 组件字典

## Skill 目标

本 Skill 给 AI 直接执行，不给人类查表。

本 Skill 解决三件事：

1. 根据 `appName` + `device` + `screenMode` 从断点表查出目标 `variantId`
2. 用 `variantId` 找到目标组件来源
3. 找到后决定执行 `setProperties(...)` 还是 `swapComponent(...)`

## 输入与输出

### 输入

- `appName`（必须，用于加载对应断点表）
- `device`（Phone / Fold外屏 / Fold内屏 / Pad竖屏 / Pad横屏）
- `screenMode`（N / L / C / NC）
- `uiElement`（标题栏_一级 / 导航_FAB_搜索 / 工具栏 等）
- `variantId`（可直接指定，跳过断点表查询）
- 当前实例或目标节点的上下文

### 输出

- 是否命中字典记录
- 命中的 `variantId`
- 执行动作类型：`setProperties` 或 `swapComponent`
- 组件来源：`key` / `search` / `anchor` / `clone`
- 最终属性值或替换目标
- 是否使用回退路径

## 执行协议

### Step 0：加载断点表

根据 `appName` 加载对应的断点-结构变化表：

- 路径规则：`references/breakpoint-component-map-{appName}.md`
- 例如：`appName=文管` → `references/breakpoint-component-map-文管.md`

从断点表中按 `device` + `screenMode` + `uiElement` 交叉查出目标 `variantId`。

若调用方已直接提供 `variantId`，跳过此步，直接进入 Step 1。

若断点表文件不存在，报错并中止，不允许猜测 variantId。

#### 已注册断点表

| appName | 断点表路径 | 状态 |
|---------|-----------|------|
| 文管 | `references/breakpoint-component-map-文管.md` | 已建立 |
| 笔记 | `references/breakpoint-component-map-笔记.md` | 待建立 |
| 电话 | `references/breakpoint-component-map-电话.md` | 待建立 |

### Step 1：探查

使用以下工具读取真实结构：

- `get_metadata`
- `get_context_for_code_connect`
- `get_design_context`

必须拿到：

- `mainComponent`
- `variantProperties`
- 变体属性的可选值
- 当前实例是否支持同组件族切换

### Step 2：查字典层

按 `variantId` 精确匹配字典层记录，禁止模糊匹配。

定位顺序：

1. `componentSetKey`
2. `lookupBy.query`
3. `lookupBy.anchor`
4. clone 已存在目标实例

使用 `search_design_system` 做定位，避免手工猜组件来源。

### Step 3：查执行层

读取该 `variantId` 对应的执行层记录：

- `actionType`
- `propertyPatch`
- `applicableWhen`
- `targetComponentFamily`
- `targetComponentSetKey`
- `fallbackStrategy`
- `verifyBy`

### Step 4：决定动作

- 如果当前实例与目标记录属于同组件族，且 `propertyPatch` 中的键和值都存在于真实可选值中，执行 `setProperties(...)`
- 如果设备语义变化、组件族变化，或当前实例不存在稳定可切换属性，执行 `swapComponent(...)`
- `variantName` 只用于语义理解，不允许直接当作属性名或属性值

### Step 5：执行

在 `use_figma` 中执行：

- `instance.setProperties(...)`
- `swapComponent(...)`
- `importComponentSetByKeyAsync(...)`

执行约束：

- 先校验 `mainComponent`
- 再执行动作
- 不允许猜属性名
- 不允许把跨组件族替换伪装成属性切换

### Step 6：验证

使用 `get_screenshot` 做视觉校验；必要时再次读取 metadata 做结构校验。

必须验证：

- 组件外观与目标语义一致
- `mainComponent` 正确
- `variantProperties` 已生效
- 实例仍挂在正确容器下

## 参考文档

参考文档分两类，按需加载，不一次性全部加载。

### 文档类型

| 类型 | 路径规则 | 用途 | 加载时机 |
|------|---------|------|---------|
| 断点表 | `references/breakpoint-component-map-{appName}.md` | 设备 × 模式 → variantId 映射 | Step 0：收到 appName 时 |
| 组件族参考 | `references/component-dictionary/{component-family}.md` | 组件属性、变体、执行细节 | Step 2：命中字典层记录后 |

### AI 使用规则

1. 主 Skill 默认只读取当前文件。
2. 收到 `appName` 后，先加载该应用的断点表，查出目标 `variantId`。
3. 当 `variantId` 命中某个组件族后，再加载该组件族对应的参考文档。
4. 参考文档只补充细节，不重复本文件中的通用执行协议。
5. 若断点表缺失，报错中止。若组件族参考文档缺失，仍按字典层 + 执行层协议执行，不阻塞主链路。

### 文档组织规则

- 断点表路径：`references/breakpoint-component-map-{appName}.md`，一个应用一份
- 组件族参考路径：`references/component-dictionary/{component-family}.md`，一个组件族一份
- 主文档只记录索引和执行入口，不重复细节

### 每份参考文档应包含

- 组件名、组件集、组件 key / 组件集 key
- 组件集结构和已验证的 `componentSetKey`
- 常见实例的 `mainComponent`
- 真实 `variantProperties` 与可选值
- 已验证变体列表
- 已验证可用的 `propertyPatch`
- 何时用 `setProperties(...)`
- 何时必须改用 `swapComponent(...)`
- 已知陷阱、失败案例和回退方式

### 加载时机

| 文档 | 加载时机 | 覆盖内容 |
| --- | --- | --- |
| `{component-family}.md` | 命中字典层记录后 | 该组件族的属性矩阵、执行细节、已验证补丁 |
| `{component-family}.md` | `setProperties(...)` 前 | 真实属性键、可选值、属性切换限制 |
| `{component-family}.md` | `swapComponent(...)` 前 | 目标组件族、目标组件集、替换边界 |
| `{component-family}.md` | 执行失败或回退时 | 已知错误模式、回退顺序、修复建议 |

## 字典层

字典层只回答“去哪找组件”，不回答“怎么切”。

### 字段


| 字段 | 含义 | 规则 |
| --- | --- | --- |
| `componentFamily` | 组件族 | 如 `NavigationBar`、`Pad-TopBar` |
| `componentName` | 组件名 | Figma 中实际组件或组件集名称，如 `NavigationBar-ComponentSet` |
| `variantId` | 变体编号 | 必须与 Figma 真实 `VariantId` 精确一致，如 `NavigationBar-ComponentSet_01`、`Pad-TopBar_01` |
| `variantName` | 语义标签 | 只用于理解，不用于直接执行 |
| `referenceDoc` | 参考文档 | 命中记录后必须按需加载对应组件文档 |
| `sourceOfTruth` | 数据来源 | `probed` / `manual` / `inferred`，优先 `probed` |

### 记录

`NavigationBar` 相关记录的最新 Figma 锚点以 `references/component-dictionary/navigation-bar.md` 中的当前基准链接为准。
当前基准组件集已切换到 UI Kit 分支节点 `123486:63329`，真实属性体系为 `VariantId`。

| componentFamily | componentName | variantId | variantName | referenceDoc | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `NavigationBar` | `NavigationBar-ComponentSet` | `NavigationBar-ComponentSet_01` | 大标题（右 1 图标） | `references/component-dictionary/navigation-bar.md` | `probed` |
| `NavigationBar` | `NavigationBar-ComponentSet` | `NavigationBar-ComponentSet_02` | 大标题（左返回/右 1 图标） | `references/component-dictionary/navigation-bar.md` | `inferred` |
| `NavigationBar` | `NavigationBar-ComponentSet` | `NavigationBar-ComponentSet_03` | 大标题（左关闭/右 1 图标） | `references/component-dictionary/navigation-bar.md` | `probed` |
| `NavigationBar` | `NavigationBar-ComponentSet` | `NavigationBar-ComponentSet_04` | 中标题（右 2 图标） | `references/component-dictionary/navigation-bar.md` | `probed` |
| `NavigationBar` | `NavigationBar-ComponentSet` | `NavigationBar-ComponentSet_05` | 中标题（左返回/右 1 图标） | `references/component-dictionary/navigation-bar.md` | `probed` |
| `NavigationBar` | `NavigationBar-ComponentSet` | `NavigationBar-ComponentSet_06` | 中标题（左关闭/右 1 图标） | `references/component-dictionary/navigation-bar.md` | `inferred` |
| `NavigationBar` | `NavigationBar-ComponentSet` | `NavigationBar-ComponentSet_07` | 小标题居中（右 1 图标） | `references/component-dictionary/navigation-bar.md` | `probed` |
| `NavigationBar` | `NavigationBar-ComponentSet` | `Pad-TopBar_01` | Pad 顶栏（中间导航） | `references/component-dictionary/navigation-bar.md` | `probed` |
| `NavigationBar` | `NavigationBar-ComponentSet` | `Pad-TopBar_02` | Pad 顶栏（返回 + 中间导航） | `references/component-dictionary/navigation-bar.md` | `inferred` |


## 执行层

执行层只回答“找到后怎么切”，不负责定位。

### 字段


| 字段                      | 含义        | 规则                                    |
| ----------------------- | --------- | ------------------------------------- |
| `actionType`            | 执行动作      | 仅允许 `setProperties` 或 `swapComponent` |
| `propertyPatch`         | 属性补丁      | 真实属性键值映射                              |
| `applicableWhen`        | 适用条件      | 至少写清设备和布局角色                           |
| `targetComponentFamily` | 目标组件族     | `swapComponent` 时填写                   |
| `targetComponentSetKey` | 目标组件集 key | `swapComponent` 时优先使用                 |
| `fallbackStrategy`      | 回退顺序      | 默认 `key -> search -> anchor -> clone` |
| `verifyBy`              | 验证方式      | 默认 `screenshot + metadata`            |


### 记录

| variantId | actionType | propertyPatch | applicableWhen | targetComponentFamily | fallbackStrategy | verifyBy |
| --- | --- | --- | --- | --- | --- | --- |
| `NavigationBar-ComponentSet_01` | `setProperties` | `{ "VariantId": "NavigationBar-ComponentSet_01" }` | `device=Phone; layoutRole=Full` |  | `key -> anchor -> clone` | `screenshot + metadata` |
| `NavigationBar-ComponentSet_02` | `setProperties` | `{ "VariantId": "NavigationBar-ComponentSet_02" }` | `device=Phone; layoutRole=Full` |  | `key -> anchor -> clone` | `screenshot + metadata` |
| `NavigationBar-ComponentSet_03` | `setProperties` | `{ "VariantId": "NavigationBar-ComponentSet_03" }` | `device=Phone/Fold; layoutRole=Full` |  | `key -> anchor -> clone` | `screenshot + metadata` |
| `NavigationBar-ComponentSet_04` | `setProperties` | `{ "VariantId": "NavigationBar-ComponentSet_04" }` | `device=Fold; layoutRole=C` |  | `key -> anchor -> clone` | `screenshot + metadata` |
| `NavigationBar-ComponentSet_05` | `setProperties` | `{ "VariantId": "NavigationBar-ComponentSet_05" }` | `device=Fold; layoutRole=C` |  | `key -> anchor -> clone` | `screenshot + metadata` |
| `NavigationBar-ComponentSet_06` | `setProperties` | `{ "VariantId": "NavigationBar-ComponentSet_06" }` | `device=Fold; layoutRole=C` |  | `key -> anchor -> clone` | `screenshot + metadata` |
| `NavigationBar-ComponentSet_07` | `setProperties` | `{ "VariantId": "NavigationBar-ComponentSet_07" }` | `device=Phone/Fold; layoutRole=Compact` |  | `key -> anchor -> clone` | `screenshot + metadata` |
| `Pad-TopBar_01` | `setProperties` | `{ "VariantId": "Pad-TopBar_01" }` | `device=Pad; layoutRole=L/C` |  | `key -> anchor -> clone` | `screenshot + metadata` |
| `Pad-TopBar_02` | `setProperties` | `{ "VariantId": "Pad-TopBar_02" }` | `device=Pad; layoutRole=L/C` |  | `key -> anchor -> clone` | `screenshot + metadata` |


## 硬约束

- 多端适配必须先加载断点表，不允许跳过 Step 0 直接猜 variantId
- 断点表中查不到的 设备×模式×元素 组合，视为"该元素在此场景下不存在"，不执行
- 不允许模糊匹配 `variantId`
- 不允许猜属性名或属性值
- 不允许把 `variantName` 当执行参数
- 命中字典层后，必须加载 `referenceDoc`，再读取组件字段、变体和值域
- 若 reference 中声明了“当前基准链接”，定位和锚点以该链接为准
- 先用 reference 中的 `componentSetKey` 定位，再用 `componentName` 和 `mainComponent` 校验是不是目标组件
- 当 `componentSetKey = a439b7cbc33b1c7e3b1611e4b6499d442b3ac7cc` 时，只允许使用 `VariantId`
- `Pad-TopBar_01` / `Pad-TopBar_02` 在当前基准中属于 `NavigationBar-ComponentSet` 的变体，不再按独立组件 `swapComponent(...)`
- 同一 `componentFamily` 下允许存在多个 `componentName`，不得混用
- 若同一 `variantId` 在不同页面语义下执行方式不同，必须拆分执行层记录，不要复用一条

## 标准输出

```json
{
  "appName": "xxx",
  "variantId": "NavigationBar-ComponentSet_01",
  "matched": true,
  "componentFamily": "NavigationBar",
  "componentName": "NavigationBar-ComponentSet",
  "referenceDoc": "references/component-dictionary/navigation-bar.md",
  "actionType": "setProperties",
  "resolvedBy": "anchor",
  "componentSetKey": "a439b7cbc33b1c7e3b1611e4b6499d442b3ac7cc",
  "componentKey": null,
  "mainComponent": "VariantId=NavigationBar-ComponentSet_01",
  "appliedVariantProperties": {
    "VariantId": "NavigationBar-ComponentSet_01"
  },
  "swapTarget": null,
  "fallbackUsed": false
}
```
