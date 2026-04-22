---
name: figma-component-dictionary
description: 组件字典（试点）技能。用于根据上游给出的 variantId 定位标题栏组件，并按执行层协议稳定执行 setProperties 或 swapComponent。
disable-model-invocation: false
---

# 组件字典（标题栏试点）

## Skill 目标

本 Skill 给 AI 直接执行，不给人类查表。

本 Skill 只解决两件事：

1. 用 `variantId` 找到目标组件来源
2. 找到后决定执行 `setProperties(...)` 还是 `swapComponent(...)`

本试点只覆盖标题栏，暂时不处理导航栏、底Tab、搜索栏、标签栏。

## 输入与输出

### 输入

- `appName`
- `variantId`
- 当前实例或目标节点的上下文

### 输出

- 是否命中字典记录
- 命中的 `variantId`
- 执行动作类型：`setProperties` 或 `swapComponent`
- 组件来源：`key` / `search` / `anchor` / `clone`
- 最终属性值或替换目标
- 是否使用回退路径

## 执行协议

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

参考文档按组件表单独形成，按需加载，不一次性全部加载。

AI 使用规则：

1. 主 Skill 默认只读取当前文件。
2. 当 `variantId` 命中某个组件族后，再加载该组件族对应的参考文档。
3. 参考文档只补充该组件族的细节，不重复本文件中的通用执行协议。
4. 若参考文档缺失，仍按本文件的字典层 + 执行层协议执行，不阻塞主链路。

### 文档组织规则

- 建议路径：`references/component-dictionary/{component-family}.md`
- 一份组件表对应一份参考文档
- 一个参考文档只服务一个组件族，不混写多个组件族
- 主文档只记录索引和执行入口，不重复组件字段细节

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
