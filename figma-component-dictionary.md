---
name: figma-component-dictionary-table1
description: 表1组件字典（试点）技能。先覆盖标题栏组件，定义变体编号与反查规则，供 AI 根据表2给出的编号定位 componentKey 并调用组件。
disable-model-invocation: false
---

# 表1：组件字典（标题栏试点）

## 适用场景

当任务链路为“应用名 -> 表2给出变体编号 -> 表1反查组件并调用”时，使用本 Skill。

本试点只覆盖标题栏，不处理导航栏、底Tab、搜索栏、标签栏。

## 字段定义


| 字段                  | 含义         | 规则                             |
| ------------------- | ---------- | ------------------------------ |
| `componentFamily`   | 组件族        | 如 `NavigationBar`、`Pad-TopBar` |
| `componentKey`      | 精确组件定位 key | 有稳定 key 则填写；未沉淀则留空并走 `lookupBy` |
| `variantId`         | 变体编号       | 固定 `NavigationBar-ComponentSet_XX`，两位序号，递增且不复用 |
| `variantName`       | 变体语义名      | 使用 Figma 组件语义，不写抽象别名           |
| `lookupBy`          | 回退定位信息     | 至少包含 Figma 锚点和推荐搜索词            |


## 表1正文（NavigationBar-ComponentSet）

> 来源基线：Xiaomi Hyper OS4 UI Kit  
> [https://www.figma.com/design/7PVSm4yEbknNLFaqauI4EM/Xiaomi-Hyper-OS4-UI-Kit?node-id=1890-3345&t=1XpD5lqT7Of7PW3I-11](https://www.figma.com/design/7PVSm4yEbknNLFaqauI4EM/Xiaomi-Hyper-OS4-UI-Kit?node-id=1890-3345&t=1XpD5lqT7Of7PW3I-11)  
> 组件集 `NavigationBar-ComponentSet` 的 `componentKey`：`818d2f110e386c48bcae60dfef60b5868d052cdd`


| componentFamily | componentKey                               | variantId | variantName       | lookupBy |
| --------------- | ------------------------------------------ | --------- | ----------------- | -------- |
| `NavigationBar` | `818d2f110e386c48bcae60dfef60b5868d052cdd` | `NavigationBar-ComponentSet_01` | 大标题（手机默认）         | 锚点: `node-id=1890:3345`; 搜索词: `NavigationBar 大标题` |
| `NavigationBar` | `818d2f110e386c48bcae60dfef60b5868d052cdd` | `NavigationBar-ComponentSet_02` | 中标题一级（Fold Q18）   | 锚点: `node-id=1890:3345`; 搜索词: `NavigationBar 中标题一级` |
| `NavigationBar` | `818d2f110e386c48bcae60dfef60b5868d052cdd` | `NavigationBar-ComponentSet_03` | 中标题（Q18）          | 锚点: `node-id=1890:3345`; 搜索词: `NavigationBar 中标题(Q18)` |
| `NavigationBar` | `818d2f110e386c48bcae60dfef60b5868d052cdd` | `NavigationBar-ComponentSet_04` | 中标题二级页            | 锚点: `node-id=1890:3345`; 搜索词: `NavigationBar 中标题二级页` |
| `Pad-TopBar`    | `8c86de4da41e550784b835f9ce615302a7d8177d` | `NavigationBar-ComponentSet_05` | Pad L/C 小标题（56dp） | 锚点: `node-id=80765:11993`; 搜索词: `Pad-TopBar` |


## 强制调用流程（应用名 -> 表2编号 -> 表1 -> 调用组件）

### 1. 探查层

使用以下工具读取组件真实结构，不允许凭经验猜：

- `get_metadata`
- `get_context_for_code_connect`
- `get_design_context`

目标是拿到并记录：

- `variantProperties`
- 变体属性的可选值
- `mainComponent`
- 组件集结构

### 2. 定位层

使用 `search_design_system` 定位目标组件，用来拿到稳定的 `componentSet` / `componentKey`，避免手工猜组件来源或变体归属。

执行要求：

1. 读取输入：`appName`、`variantId`（由表2给出）。
2. 在本表按 `variantId` 精确匹配，禁止模糊匹配。
3. 若表内已有稳定 `componentKey`，优先按 key 定位。
4. 若 `componentKey` 缺失、结果不稳定或导入失败，再按 `lookupBy` 中的搜索词和锚点，用 `search_design_system` 回退定位。

### 3. 执行层

使用 `use_figma` 在插件上下文执行真实写入。

允许的典型操作包括：

- `instance.setProperties(...)`
- `swapComponent(...)`
- `importComponentSetByKeyAsync(...)`

执行要求：

1. 实例化或复用目标组件后，先确认 `mainComponent` 与表内记录一致。
2. 根据探查得到的真实属性键和值执行变体切换，不得猜属性名。
3. 若 `variantName` 与真实可选属性冲突，按“key -> 搜索 -> 锚点 -> clone”顺序回退。

### 4. 验证层

使用 `get_screenshot` 做视觉校验；必要时再次读取 metadata 做结构校验。

验证要求：

- 视觉校验：组件外观、层级、选中态、文案和目标变体一致。
- 结构校验：`mainComponent`、`variantProperties`、实例挂载位置和组件来源可回溯。

### 5. 输出结果

输出调用结果，必须包含：

- 命中编号
- 组件来源（key / 搜索 / 锚点 / clone）
- 最终属性值
- 是否使用回退路径

## 标准输出格式

```json
{
  "appName": "xxx",
  "variantId": "NavigationBar-ComponentSet_02",
  "matched": true,
  "componentFamily": "NavigationBar",
  "resolvedBy": "search_design_system",
  "componentKey": "818d2f110e386c48bcae60dfef60b5868d052cdd",
  "mainComponent": "NavigationBar",
  "appliedVariantProperties": {
    "样式": "中标题一级"
  },
  "fallbackUsed": false
}
```

## 验收标准

- 编号格式严格为 `NavigationBar-ComponentSet_XX`，且在本表内唯一。
- 每个编号都可落到可执行路径：`componentKey` 或 `lookupBy`。
- 调用后可回溯命中来源（key、搜索、锚点、clone）。
- 同名标题栏来自不同组件族时，先校验 `mainComponent` 再应用变体。
- 失败兜底不允许“猜属性名”，必须按“搜索 -> 锚点 -> clone”顺序执行。

## 后续扩展约束

- 保持同一字段结构，后续可平移到 `Nav-XX`、`Tab-XX`、`Search-XX`、`Label-XX`。
- 若补齐标题栏稳定 `componentKey`，仅更新 `componentKey` 列，不改 `variantId`。
