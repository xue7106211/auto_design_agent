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

### 每份参考文档应包含

- 组件集结构和已验证的 `componentSetKey`
- 常见实例的 `mainComponent`
- 真实 `variantProperties` 与可选值
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


| 字段                | 含义      | 规则                                             |
| ----------------- | ------- | ---------------------------------------------- |
| `componentFamily` | 组件族     | 如 `NavigationBar`、`Pad-TopBar`                 |
| `componentSetKey` | 组件集 key | 优先使用；没有稳定 key 时留空                              |
| `variantId`       | 变体编号    | 固定 `NavigationBar-ComponentSet_XX`，两位序号，递增且不复用 |
| `variantName`     | 语义标签    | 只用于理解，不用于直接执行                                  |
| `lookupBy`        | 回退定位信息  | 至少包含搜索词和 Figma 锚点                              |
| `sourceOfTruth`   | 数据来源    | `probed` / `manual` / `inferred`，优先 `probed`   |


### 记录

> 来源基线：Xiaomi Hyper OS4 UI Kit  
> `NavigationBar-ComponentSet` 的 `componentSetKey`：`818d2f110e386c48bcae60dfef60b5868d052cdd`
>
> 已验证探查（2026-04-22）：
> - 文件：`自动生成设计稿`
> - 节点：`105:5686`
> - 实例名：`NavigationBar-ComponentSet`
> - 真实变体属性：`标题类型` / `交互状态` / `辅助标题` / `颜色模式`
> - 真实 `mainComponent`：`标题类型=大标题, 交互状态=默认态（平面放置）, 辅助标题=no, 颜色模式=亮色模式`
>
> 冲突说明：
> - `componentSetKey=818d2f110e386c48bcae60dfef60b5868d052cdd` 对应的是 OS4 UI Kit 的 `NavigationBar-ComponentSet`
> - 这套组件不支持 `样式=中标题一级`
> - `样式=大标题/中标题一级` 属于另一套同名但不同组件集的 `NavigationBar`，必须拆分记录，禁止继续复用到本组件集


| componentFamily | componentSetKey                            | variantId                       | variantName       | lookupBy                                               | sourceOfTruth |
| --------------- | ------------------------------------------ | ------------------------------- | ----------------- | ------------------------------------------------------ | ------------- |
| `NavigationBar-ComponentSet` | `818d2f110e386c48bcae60dfef60b5868d052cdd` | `NavigationBar-ComponentSet_01` | 大标题（手机默认）         | 搜索词: `NavigationBar-ComponentSet`; 锚点: `node-id=105:5686`      | `probed`      |
| `NavigationBar-ComponentSet` | `818d2f110e386c48bcae60dfef60b5868d052cdd` | `NavigationBar-ComponentSet_03` | 中标题（Q18）          | 搜索词: `NavigationBar-ComponentSet`; 锚点: `node-id=105:5686` | `probed`      |
| `NavigationBar-ComponentSet` | `818d2f110e386c48bcae60dfef60b5868d052cdd` | `NavigationBar-ComponentSet_04` | 中标题二级页            | 搜索词: `NavigationBar-ComponentSet`; 锚点: `node-id=105:5686`   | `probed`      |
| `Pad-TopBar`                | `8c86de4da41e550784b835f9ce615302a7d8177d` | `NavigationBar-ComponentSet_05` | Pad L/C 小标题（56dp） | 搜索词: `Pad-TopBar`; 锚点: `node-id=80765:11993`                | `probed`      |

#### 暂停执行记录（待复探）

| variantId                       | 原语义 | 暂停原因 |
| ------------------------------- | ------ | -------- |
| `NavigationBar-ComponentSet_02` | 中标题一级（Fold Q18） | 历史文档把 `样式=中标题一级` 误挂到 `componentSetKey=818d2f110e386c48bcae60dfef60b5868d052cdd`。该 key 的真实属性体系是 `标题类型`，不包含 `中标题一级`。恢复前必须先为另一套 `NavigationBar` 单独建记录。 |


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


| variantId                       | actionType      | propertyPatch            | applicableWhen                                | targetComponentFamily | targetComponentSetKey                      | fallbackStrategy                   | verifyBy                |
| ------------------------------- | --------------- | ------------------------ | --------------------------------------------- | --------------------- | ------------------------------------------ | ---------------------------------- | ----------------------- |
| `NavigationBar-ComponentSet_01` | `setProperties` | `{ "标题类型": "大标题" }`        | `device=Phone; layoutRole=Full`               |                       |                                            | `key -> search -> anchor -> clone` | `screenshot + metadata` |
| `NavigationBar-ComponentSet_03` | `setProperties` | `{ "标题类型": "中标题（Q18）" }` | `device=Fold; posture=inner; layoutRole=Full` |                       |                                            | `key -> search -> anchor -> clone` | `screenshot + metadata` |
| `NavigationBar-ComponentSet_04` | `setProperties` | `{ "标题类型": "中标题二级页" }`   | `device=Fold; posture=inner; layoutRole=C`    |                       |                                            | `key -> search -> anchor -> clone` | `screenshot + metadata` |
| `NavigationBar-ComponentSet_05` | `swapComponent` | `{}`                     | `device=Pad; layoutRole=L/C`                  | `Pad-TopBar`          | `8c86de4da41e550784b835f9ce615302a7d8177d` | `key -> search -> anchor -> clone` | `screenshot + metadata` |

#### 暂停执行记录（待复探）

| variantId                       | actionType | propertyPatch | applicableWhen | 暂停原因 |
| ------------------------------- | ---------- | ------------- | -------------- | -------- |
| `NavigationBar-ComponentSet_02` | -          | -             | `device=Fold; posture=inner; layoutRole=L` | 当前只确认它属于另一套 `NavigationBar` 的 `样式=中标题一级` 路径，尚未为该组件集建立独立字典层记录。禁止对 `818d2f110e386c48bcae60dfef60b5868d052cdd` 执行该条。 |


## 硬约束

- 不允许模糊匹配 `variantId`
- 不允许猜属性名或属性值
- 不允许把 `variantName` 当执行参数
- 同名标题栏来自不同组件族时，先看 `mainComponent`，再决定动作
- 当 `componentSetKey = 818d2f110e386c48bcae60dfef60b5868d052cdd` 时，只允许使用 `标题类型` / `交互状态` / `辅助标题` / `颜色模式`
- 若同一 `variantId` 在不同页面语义下执行方式不同，必须拆分执行层记录，不要复用一条

## 标准输出

```json
{
  "appName": "xxx",
  "variantId": "NavigationBar-ComponentSet_01",
  "matched": true,
  "componentFamily": "NavigationBar-ComponentSet",
  "componentSetKey": "818d2f110e386c48bcae60dfef60b5868d052cdd",
  "actionType": "setProperties",
  "resolvedBy": "search_design_system",
  "mainComponent": "标题类型=大标题, 交互状态=默认态（平面放置）, 辅助标题=no, 颜色模式=亮色模式",
  "appliedVariantProperties": {
    "标题类型": "大标题"
  },
  "swapTarget": null,
  "fallbackUsed": false
}
```
