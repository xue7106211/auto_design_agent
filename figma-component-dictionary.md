# 组件字典

本文档由 `SKILL.md` 在组件处理阶段按需读取，不是独立 Skill，不直接触发执行。

它是主链路内部的组件处理网关，只负责：

1. 从当前实例或目标节点探查并识别 `resolvedUiElement`
2. 消费 `appName + device + screenMode + resolvedUiElement`，从应用映射表得到 `resultType + variantId`
3. 用 `variantId` 命中字典层和组件族 reference
4. 决定并执行 `setProperties(...)` / `swapComponent(...)` / 回退 / 中止
5. 返回组件任务状态和验证结果

## 1. 作用边界

### 负责

- 当前实例探查
- `resolvedUiElement` 识别与校验
- `variantId` 精确匹配
- 字典层 / 执行层查询
- 组件族 reference 按需加载
- Figma 回写动作分流
- screenshot + metadata 验证

### 不负责

- 不判断页面级 `layoutType`
- 不推导 `screenMode`
- 不维护应用映射表覆盖矩阵
- 不替代布局 reference
- 不把 pending 组件族当作已验证组件执行

`layoutType` 与 `screenMode` 必须区分：

| 字段 | 归属 | 合法值 / 说明 |
| --- | --- | --- |
| `layoutType` | `SKILL.md` 页面级判断 | `NLC / NC / LC / C` |
| `screenMode` | 主链路传给 app 映射表的查询键 | `N / L / C / NC / LC / NLC`，由 `layoutType + 栏位 / 子场景` 生成 |

本文件只消费 `screenMode`，不得自行从栏位名或组件名推断目标组件族。

## 2. 输入与标准输出

### 输入

| 字段 | 必需性 | 说明 |
| --- | --- | --- |
| `componentTask.nodeId` / 当前实例上下文 | 默认必需 | 实际执行时不能缺 |
| `appName` | 查应用映射表时必需 | 例如 `文管`、`录音` |
| `device` | 查应用映射表时必需 | `Phone / Fold外屏 / Fold内屏 / Pad竖屏 / Pad横屏` |
| `screenMode` | 查应用映射表时必需 | 由主链路传入 |
| `uiElement` | 可选 | 只作为探查后的校验或显式覆写，不代替实例识别 |
| `variantId` | 可选 | 直接指定后可跳过应用映射表查询，但不能跳过实例探查 |
| `fontDegradationMap` | 可选 | 涉及 appendChild 或文本修改时使用 |

若既没有可执行的当前实例上下文，也没有显式 `variantId`，必须中止。

### 输出

组件任务返回给主链路的状态只允许：

| `status` | 含义 |
| --- | --- |
| `mapped` | 已命中目标组件或变体，并通过验证 |
| `hidden` | 应用映射表返回 `hidden`，当前场景隐藏 |
| `absent` | 应用映射表返回 `absent`，当前场景不存在 |
| `fallback` | 标准路径失败，使用同语义回退 |
| `blocked` | 缺少映射、缺少真实值域、语义冲突或执行失败，需上游处理 |

标准输出结构：

```json
{
  "appName": "xxx",
  "resolvedUiElement": "标题栏_一级",
  "variantId": "NavigationBar_ComponentSet_01",
  "matched": true,
  "status": "mapped",
  "componentFamily": "NavigationBar",
  "componentName": "NavigationBar_ComponentSet",
  "referenceDoc": "references/component-dictionary/navigation-bar.md",
  "actionType": "setProperties",
  "resolvedBy": "anchor",
  "componentSetKey": "a439b7cbc33b1c7e3b1611e4b6499d442b3ac7cc",
  "componentKey": null,
  "mainComponent": "VariantId=NavigationBar_ComponentSet_01",
  "appliedVariantProperties": {
    "VariantId": "NavigationBar_ComponentSet_01"
  },
  "swapTarget": null,
  "fallbackUsed": false,
  "fallbackReason": null,
  "validationResult": "screenshot + metadata passed"
}
```

## 3. 强制执行路径

| 步骤 | 必须做 | 产物 | 失败处理 |
| --- | --- | --- | --- |
| 0 | 探查当前实例真实结构 | `mainComponent`、`variantProperties`、可选值、组件族、语义线索 | 无法探查或无法识别语义则 `blocked` |
| 1 | 查应用 variant 映射表，除非已显式传入 `variantId` | `resultType`、`variantId` | 映射表缺失或 `undefined` 则 `blocked` |
| 2 | 按 `variantId` 精确查字典层 | `componentFamily`、`componentName`、`referenceDoc`、记录状态 | 未命中则 `blocked` |
| 3 | 命中组件族后加载 `referenceDoc` | 真实字段、值域、锚点、回退规则 | `executable` 记录缺 reference 则标风险；app 映射表缺失仍必须中止 |
| 4 | 查执行层并决定动作 | `actionType`、`propertyPatch`、替换边界 | 无执行记录则 `blocked`，pending 组件不得执行 |
| 5 | 执行回写 | `setProperties(...)` / `swapComponent(...)` / 同语义 fallback | 不允许猜属性或跨语义族 fallback |
| 6 | 验证 | screenshot + metadata 结果 | 不通过则局部修正或 `blocked` |

### Step 0：实例探查

先读取当前实例或目标节点的真实结构，禁止只靠 `uiElement` 文本直接查表。

可用工具：

- `get_metadata`
- `get_context_for_code_connect`
- `get_design_context`

必须拿到：

- `mainComponent`
- `variantProperties`
- 变体属性的可选值
- 当前实例所属组件族
- 当前实例在页面中的语义角色线索
- 当前实例是否支持同组件族切换

识别规则：

- 优先从当前实例的组件族、当前 `VariantId`、所在区域和交互语义识别 `resolvedUiElement`
- 若调用方已提供 `uiElement`，只能在探查结果与之不冲突时采用
- 若调用方未提供 `uiElement`，必须由探查流程产出 `resolvedUiElement`
- 当前实例语义无法判定时必须中止，不允许猜测

### Step 1：应用映射表分流

应用 variant 映射表路径规则：

```text
references/app-variant-map-{appName}.md
```

已注册应用和覆盖状态以 `manifest.json` 的 `appVariantMaps` 为准。

从映射表中按 `device + screenMode + resolvedUiElement` 精确查出目标记录。若调用方已直接提供 `variantId`，则 `appName / device / screenMode` 可省略，跳过本步，直接进入 Step 2。

`resultType` 处理矩阵：

| `resultType` | 处理方式 | 返回状态 |
| --- | --- | --- |
| `variant` | 读取该行 `variantId`，进入字典层 | 继续 |
| `hidden` | 当前场景隐藏，不执行组件切换 | `hidden` |
| `absent` | 当前场景不存在，不创建、不切换 | `absent` |
| `undefined` | 未建档或未命中，禁止猜测 | `blocked` |

映射表文件不存在时必须 `blocked`，不允许猜测 `variantId`。

#### 已注册应用 variant 映射表

| appName | 映射表路径 | 状态 |
|---------|-----------|------|
| 文管 | `references/app-variant-map-文管.md` | 已建立 |
| 笔记 | `references/app-variant-map-笔记.md` | 已建立 |
| 录音 | `references/app-variant-map-录音.md` | 已建立 |
| 计算器 | `references/app-variant-map-计算器.md` | 已建立 |
| 日历 | `references/app-variant-map-日历.md` | 已建立 |
| 收藏 | `references/app-variant-map-收藏.md` | 已建立 |
| 扫一扫 | `references/app-variant-map-扫一扫.md` | 已建立 |
| 设置 | `references/app-variant-map-设置.md` | 已建立 |
| 电话 | `references/app-variant-map-电话.md` | 已建立 |
| 联系人 | `references/app-variant-map-联系人.md` | 已建立 |
| 短信 | `references/app-variant-map-短信.md` | 已建立 |
| 下载管理 | `references/app-variant-map-下载管理.md` | 已建立 |
| 小米换机 | `references/app-variant-map-小米换机.md` | 已建立 |
| 天气 | `references/app-variant-map-天气.md` | 已建立 |
| 相册 | `references/app-variant-map-相册.md` | 已建立 |
| 手机管家 | `references/app-variant-map-手机管家.md` | 已建立 |

### Step 2：查字典层

按 `variantId` 精确匹配字典层记录，禁止模糊匹配。

定位顺序：

1. `componentSetKey`
2. `lookupBy.query`
3. `lookupBy.anchor`
4. clone 已存在目标实例

优先使用 `search_design_system` 或组件族 reference 中的锚点 / `componentSetKey` 定位，避免手工猜组件来源。

### Step 3：执行层查询

读取该 `variantId` 对应的执行层记录：

- `actionType`
- `propertyPatch`
- `applicableWhen`
- `targetComponentFamily`
- `targetComponentSetKey`
- `fallbackStrategy`
- `verifyBy`

若字典层有记录但执行层无记录，当前任务返回 `blocked`。pending 组件族只能作为已知缺口记录，不能执行。

### Step 4：动作分流

- 当前实例与目标记录属于同组件族，且 `propertyPatch` 中的键和值都存在于真实可选值中，执行 `setProperties(...)`
- 设备语义变化、组件族变化，或当前实例不存在稳定可切换属性时，执行 `swapComponent(...)`
- `variantName` 只用于语义理解，不允许直接当作属性名或属性值
- `setProperties(...)` 只能用于映射表命中的精确 `variantId`
- 不能因为同一组件集暴露了其他可选 `variantId`，就改切到“看起来相近”的变体
- 组件 fallback 必须保持同一业务语义和同一 `componentFamily`
- `layoutRole` 只描述栏位职责，不等于组件族。`layoutRole=L` 表示列表栏，不能自动命中 `Sidebar`；只有 `layoutRole=N` 且 `app-variant-map` 明确返回 `Sidebar_*` 时，才允许使用 `Sidebar`

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
- 涉及不可用字体、appendChild 或实例内部文本修改时，必须按 `SKILL.md` 中的 `fontDegradationMap` 和字体降级顺序处理

### Step 6：验证

使用 `get_screenshot` 做视觉校验；必要时再次读取 metadata 做结构校验。

必须验证：

- 组件外观与目标语义一致
- `mainComponent` 正确
- `variantProperties` 已生效
- 实例仍挂在正确容器下

## 4. 中止条件与禁止动作

以下情况必须返回 `status = blocked`，不得继续猜测：

- 未完成当前实例探查
- 无法识别 `resolvedUiElement`
- 应用映射表文件不存在
- `device × screenMode × resolvedUiElement` 未命中，或结果为 `undefined`
- `variantId` 未命中字典层
- 命中的记录状态为 `unavailable` 或 `pending`
- 目标 `variantId` 未在真实 `variantOptions` 中出现
- 找不到真实属性键或属性值
- `layoutRole` 与 `componentFamily` 语义冲突
- 同一 `variantId` 在不同页面语义下执行方式不同但执行层未拆分记录

禁止动作：

- 不允许绕过当前实例探查，直接靠 `uiElement` 文本做组件切换
- 不允许模糊匹配 `variantId`
- 不允许猜属性名或属性值
- 不允许把 `variantName` 当执行参数
- 不允许把同一 ComponentSet 中的其他 `variantOptions` 当作映射表目标变体的替代品；`variantOptions` 只用于校验目标值是否真实存在
- 不允许仅凭 `variantId` 名称中包含设备或布局词（如 `Fold_LC`、`PAD_NLC`）判定可用
- 不允许跨语义族 fallback，例如从 `BottomBar_Showcase_Notes_01` 改切到 `Sidebar_Component_Fold_LC_01`
- 不允许把 `Pad_TopBar_01` / `Pad_TopBar_02` 当独立组件 `swapComponent(...)`

## 5. 参考文档加载规则

| 文档 | 路径规则 | 加载时机 | 失败处理 |
| --- | --- | --- | --- |
| 应用 variant 映射表 | `references/app-variant-map-{appName}.md` | Step 1，完成实例语义识别后 | 缺失即 `blocked` |
| 组件族 reference | `references/component-dictionary/{component-family}.md` | Step 2，命中字典层记录后 | `executable` 记录应加载；缺失时按字典层继续但标风险 |

组件族 reference 只补充该组件族细节，不重复本文件中的通用协议。每份组件族 reference 应至少包含：

- 组件名、组件集、组件 key / 组件集 key
- 组件集结构和已验证的 `componentSetKey`
- 常见实例的 `mainComponent`
- 真实 `variantProperties` 与可选值
- 已验证变体列表
- 已验证可用的 `propertyPatch`
- 何时用 `setProperties(...)`
- 何时必须改用 `swapComponent(...)`
- 已知陷阱、失败案例和回退方式

若 reference 中声明了“当前基准链接”，定位和锚点以该链接为准。

## 6. 字典层

字典层只回答“去哪找组件”，不回答“怎么切”。

### 字段

| 字段 | 含义 | 规则 |
| --- | --- | --- |
| `componentFamily` | 组件族 | 如 `NavigationBar`、`TopBar` |
| `componentName` | 组件名 | Figma 中实际组件或组件集名称，如 `NavigationBar_ComponentSet` |
| `variantId` | 变体编号 | 必须与 Figma 真实 `VariantId` 精确一致 |
| `variantName` | 语义标签 | 只用于理解，不用于直接执行 |
| `referenceDoc` | 参考文档 | active 记录命中后必须按需加载 |
| `status` | 记录状态 | `executable` / `unavailable` / `pending` |
| `sourceOfTruth` | 数据来源 | `probed` / `manual` / `inferred`，优先 `probed` |

### 可执行记录

`NavigationBar` 相关记录的最新 Figma 锚点以 `references/component-dictionary/navigation-bar.md` 中的当前基准链接为准。
当前基准组件集已切换到 UI Kit 分支节点 `123486:63329`，真实属性体系为 `VariantId`。

| componentFamily | componentName | variantId | variantName | referenceDoc | status | sourceOfTruth |
| --- | --- | --- | --- | --- | --- | --- |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_00` | 无标题 | `references/component-dictionary/navigation-bar.md` | `executable` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_01` | 大标题（右 1 图标） | `references/component-dictionary/navigation-bar.md` | `executable` | `probed` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_02` | 大标题（左返回/右 1 图标） | `references/component-dictionary/navigation-bar.md` | `executable` | `inferred` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_03` | 大标题（左关闭/右 1 图标） | `references/component-dictionary/navigation-bar.md` | `executable` | `probed` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_04` | 中标题（右 2 图标） | `references/component-dictionary/navigation-bar.md` | `executable` | `probed` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_05` | 中标题（左返回/右 1 图标） | `references/component-dictionary/navigation-bar.md` | `executable` | `probed` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_06` | 中标题（左关闭/右 1 图标） | `references/component-dictionary/navigation-bar.md` | `executable` | `inferred` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_07` | 小标题居中（右 1 图标） | `references/component-dictionary/navigation-bar.md` | `executable` | `probed` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_08` | 小标题_返回 | `references/component-dictionary/navigation-bar.md` | `executable` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_09` | 小标题_编辑 / 小标题_关闭 | `references/component-dictionary/navigation-bar.md` | `executable` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_10` | 小标题_无标题 | `references/component-dictionary/navigation-bar.md` | `executable` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_11` | 小标题_无标题_返回 | `references/component-dictionary/navigation-bar.md` | `executable` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `Pad_TopBar_01` | Pad 顶栏（中间导航） | `references/component-dictionary/navigation-bar.md` | `executable` | `probed` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `Pad_TopBar_02` | Pad 顶栏（返回 + 中间导航） | `references/component-dictionary/navigation-bar.md` | `executable` | `inferred` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `TopBar_00` | Pad 顶栏容器，无顶部导航 | `references/component-dictionary/navigation-bar.md` | `executable` | `probed` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `TopBar_03` | 顶部导航搜索 | `references/component-dictionary/navigation-bar.md` | `executable` | `probed` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `TopBar_04` | 顶部导航搜索_返回 | `references/component-dictionary/navigation-bar.md` | `executable` | `probed` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `TopBar_05` | 顶部导航搜索_无标题 | `references/component-dictionary/navigation-bar.md` | `executable` | `probed` |

### 当前基准不可访问记录

以下 `variantId` 曾在映射表或旧记录中出现，但不在当前组件集 `123486:63329` 的真实值域内。命中这些值时不得直接执行，必须返回“目标变体不可访问 / 未暴露”。

| componentFamily | componentName | variantId | variantName | referenceDoc | status | sourceOfTruth |
| --- | --- | --- | --- | --- | --- | --- |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_12` | 小标题_侧边栏 | `references/component-dictionary/navigation-bar.md` | `unavailable` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_13` | 小标题_侧边栏_编辑 | `references/component-dictionary/navigation-bar.md` | `unavailable` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_14` | 小标题_侧边栏_收起 | `references/component-dictionary/navigation-bar.md` | `unavailable` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_15` | 中标题_左对齐_无标题 | `references/component-dictionary/navigation-bar.md` | `unavailable` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_Notes_01` | 业务_笔记 | `references/component-dictionary/navigation-bar.md` | `unavailable` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_Weather_01` | 业务_天气 | `references/component-dictionary/navigation-bar.md` | `unavailable` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_Calendar_01` | 业务_日历 | `references/component-dictionary/navigation-bar.md` | `unavailable` | `manual` |

### 待验证记录

以下记录已作为已知目标语义注册，但组件族 reference 或执行层记录尚未通过 Figma 探查验证。命中时只能返回 `blocked` 或等待补充 reference，不得直接执行。

| componentFamily | variantId | variantName | referenceDoc | status | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_01` | 大标题（右 1 图标） | `references/component-dictionary/navigation-bar.md` | `probed` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_02` | 大标题（左返回/右 1 图标） | `references/component-dictionary/navigation-bar.md` | `inferred` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_03` | 大标题（左关闭/右 1 图标） | `references/component-dictionary/navigation-bar.md` | `probed` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_04` | 中标题（右 2 图标） | `references/component-dictionary/navigation-bar.md` | `probed` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_05` | 中标题（左返回/右 1 图标） | `references/component-dictionary/navigation-bar.md` | `probed` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_06` | 中标题（左关闭/右 1 图标） | `references/component-dictionary/navigation-bar.md` | `inferred` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_07` | 小标题居中（右 1 图标） | `references/component-dictionary/navigation-bar.md` | `probed` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `Pad_TopBar_01` | Pad 顶栏（中间导航） | `references/component-dictionary/navigation-bar.md` | `probed` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `Pad_TopBar_02` | Pad 顶栏（返回 + 中间导航） | `references/component-dictionary/navigation-bar.md` | `inferred` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_00` | 无标题 | `references/component-dictionary/navigation-bar.md` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_08` | 小标题_返回 | `references/component-dictionary/navigation-bar.md` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_09` | 小标题_编辑 / 小标题_关闭 | `references/component-dictionary/navigation-bar.md` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_10` | 小标题_无标题 | `references/component-dictionary/navigation-bar.md` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_11` | 小标题_无标题_返回 | `references/component-dictionary/navigation-bar.md` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_12` | 小标题_侧边栏 | `references/component-dictionary/navigation-bar.md` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_13` | 小标题_侧边栏_编辑 | `references/component-dictionary/navigation-bar.md` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_14` | 小标题_侧边栏_收起 | `references/component-dictionary/navigation-bar.md` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_15` | 中标题_左对齐_无标题 | `references/component-dictionary/navigation-bar.md` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_Notes_01` | 业务_笔记 | `references/component-dictionary/navigation-bar.md` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_Weather_01` | 业务_天气 | `references/component-dictionary/navigation-bar.md` | `manual` |
| `NavigationBar` | `NavigationBar_ComponentSet` | `NavigationBar_ComponentSet_Calendar_01` | 业务_日历 | `references/component-dictionary/navigation-bar.md` | `manual` |
| `TopBar` | — | `TopBar_00` | 无顶部导航 | 待建立 | `manual` |
| `TopBar` | — | `TopBar_01` | 顶部导航组合（NavigationBar_ComponentSet_10 + TopBar_Navigation_01） | 待建立 | `manual` |
| `TopBar` | — | `TopBar_02` | 顶部导航组合_返回（NavigationBar_ComponentSet_11 + TopBar_Navigation_01） | 待建立 | `manual` |
| `TopBar` | — | `TopBar_03` | 顶部导航搜索（NavigationBar_ComponentSet_07 + SearchBar_ComponentSet_02） | 待建立 | `manual` |
| `TopBar` | — | `TopBar_04` | 顶部导航搜索_返回（NavigationBar_ComponentSet_11 + TopBar_Navigation_01 + SearchBar_ComponentSet_02） | 待建立 | `manual` |
| `TopBar` | — | `TopBar_05` | 顶部导航搜索_无标题（NavigationBar_ComponentSet_10 + TopBar_Navigation_01 + SearchBar_ComponentSet_02） | 待建立 | `manual` |
| `TopBar` | — | `TopBar_Navigation_01` | 顶部导航_中间 | 待建立 | `manual` |
| `TopBar` | — | `TopBar_Calendar_01` | 业务_日历（NavigationBar_ComponentSet_Calendar_01 + TopBar_Navigation_01） | 待建立 | `manual` |
| `BottomBar` | — | `BottomBar_Showcase_00` | 无底部导航栏 | 待建立 | `manual` |
| `BottomBar` | — | `BottomBar_Showcase_01` | 默认 | 待建立 | `manual` |
| `BottomBar` | — | `BottomBar_Showcase_02` | 无FAB_分区展示 | 待建立 | `manual` |
| `BottomBar` | — | `BottomBar_Showcase_Fab_01` | 随FAB（BottomBar_Showcase_01 + Fab_01） | 待建立 | `manual` |
| `BottomBar` | — | `BottomBar_Showcase_Fab_02` | 随FAB_分区展示（BottomBar_Showcase_02 + Fab_01） | 待建立 | `manual` |
| `BottomBar` | — | `BottomBar_Showcase_Notes_01` | 业务_笔记（底部工具栏） | 待建立 | `manual` |
| `Fab` | — | `Fab_01` | Fab | 待建立 | `manual` |
| `Fab` | — | `Fab_Rec_01` | 业务_录音 | 待建立 | `manual` |
| `Sidebar` | — | `Sidebar_Component_PAD_NLC_01` | Pad_NLC（内部标题栏: NavigationBar_ComponentSet_11） | 待建立 | `manual` |
| `Sidebar` | — | `Sidebar_Component_PAD_NLC_02` | Pad_NLC_收起（内部标题栏: NavigationBar_ComponentSet_14） | 待建立 | `manual` |
| `Sidebar` | — | `Sidebar_Component_PAD_NLC_03` | Pad_NLC_编辑（内部标题栏: NavigationBar_ComponentSet_11） | 待建立 | `manual` |
| `Sidebar` | — | `Sidebar_Component_PAD_LC_01` | Pad_LC | 待建立 | `manual` |
| `Sidebar` | — | `Sidebar_Component_Fold_LC_01` | Fold_LC | 待建立 | `manual` |
| `Sidebar` | — | `Sidebar_Component_PAD_LC_Fab_01` | Pad_LC_随FAB（Sidebar_Component_PAD_LC_01 + Fab_01 + Fab_Rec_01） | 待建立 | `manual` |
| `Sidebar` | — | `Sidebar_Component_Fold_LC_Fab_01` | Fold_LC_随FAB（Sidebar_Component_Fold_LC_01 + Fab_01） | 待建立 | `manual` |
| `Sidebar` | — | `Sidebar_BG_01` | 侧边栏_面板 | 待建立 | `manual` |
| `SelectableChip` | — | `SelectableChip_ComponentSet_00` | 无标签栏 | 待建立 | `manual` |
| `SelectableChip` | — | `SelectableChip_ComponentSet_01` | 等宽 | 待建立 | `manual` |
| `SelectableChip` | — | `SelectableChip_ComponentSet_Notes_01` | 业务_笔记 | 待建立 | `manual` |
| `SearchBar` | — | `SearchBar_ComponentSet_00` | 无搜索栏 | 待建立 | `manual` |
| `SearchBar` | — | `SearchBar_ComponentSet_01` | 激活 | 待建立 | `manual` |
| `SearchBar` | — | `SearchBar_ComponentSet_02` | 默认 | 待建立 | `manual` |
| `SearchReceiving` | — | `SearchReceiving_00` | 无搜索面板 | 待建立 | `manual` |
| `SearchReceiving` | — | `SearchReceiving_01` | 搜索面板 | 待建立 | `manual` |
| `ToolBar` | — | `ToolBar_ComponentSet_01` | 默认 | 待建立 | `manual` |
| `Divider` | — | `Divider_ComponentSet_01` | 0.7 | 待建立 | `manual` |
| `FloatingWindow` | — | `FloatingWindow_ComponentSet_01` | 浮窗窗口 | 待建立 | `manual` |
| `FloatingWindow` | — | `FloatingWindowBG_01` | 浮窗_面板 | 待建立 | `manual` |
| `DrawerWindow` | — | `DrawerWindow_ComponentSet_high_01` | 抽屉窗口_高 | 待建立 | `manual` |
| `DrawerWindow` | — | `DrawerWindow_ComponentSet_mid_01` | 抽屉窗口_中 | 待建立 | `manual` |
| `DrawerWindow` | — | `DrawerWindow_ComponentSet_low_01` | 抽屉窗口_低 | 待建立 | `manual` |
| `DrawerWindow` | — | `DrawerHandle_Bar_10` | 抽屉控制条 | 待建立 | `manual` |
| `DrawerWindow` | — | `DrawerWindow_BG_01` | 抽屉_面板 | 待建立 | `manual` |

注意：浮窗_小标题和抽屉_小标题直接引用 `NavigationBar_ComponentSet_09`，不单独注册。

## 7. 执行层

执行层只回答“找到后怎么切”，不负责定位。

### 字段

| 字段 | 含义 | 规则 |
| --- | --- | --- |
| `actionType` | 执行动作 | 仅允许 `setProperties` 或 `swapComponent` |
| `propertyPatch` | 属性补丁 | 真实属性键值映射 |
| `applicableWhen` | 适用条件 | 至少写清设备和布局角色 |
| `targetComponentFamily` | 目标组件族 | `swapComponent` 时填写 |
| `targetComponentSetKey` | 目标组件集 key | `swapComponent` 时优先使用 |
| `fallbackStrategy` | 回退顺序 | 默认 `key -> anchor -> clone` |
| `verifyBy` | 验证方式 | 默认 `screenshot + metadata` |

默认值：

| 字段 | 默认值 |
| --- | --- |
| `fallbackStrategy` | `key -> anchor -> clone` |
| `verifyBy` | `screenshot + metadata` |

### 可执行记录

| variantId | actionType | propertyPatch | applicableWhen | targetComponentFamily |
| --- | --- | --- | --- | --- |
| `NavigationBar_ComponentSet_00` | `setProperties` | `{ "VariantId": "NavigationBar_ComponentSet_00" }` | `device=Phone/Fold/Pad; layoutRole=NoTitle` |  |
| `NavigationBar_ComponentSet_01` | `setProperties` | `{ "VariantId": "NavigationBar_ComponentSet_01" }` | `device=Phone; layoutRole=Full` |  |
| `NavigationBar_ComponentSet_02` | `setProperties` | `{ "VariantId": "NavigationBar_ComponentSet_02" }` | `device=Phone; layoutRole=Full` |  |
| `NavigationBar_ComponentSet_03` | `setProperties` | `{ "VariantId": "NavigationBar_ComponentSet_03" }` | `device=Phone/Fold; layoutRole=Full` |  |
| `NavigationBar_ComponentSet_04` | `setProperties` | `{ "VariantId": "NavigationBar_ComponentSet_04" }` | `device=Fold; layoutRole=C` |  |
| `NavigationBar_ComponentSet_05` | `setProperties` | `{ "VariantId": "NavigationBar_ComponentSet_05" }` | `device=Fold; layoutRole=C` |  |
| `NavigationBar_ComponentSet_06` | `setProperties` | `{ "VariantId": "NavigationBar_ComponentSet_06" }` | `device=Fold; layoutRole=C` |  |
| `NavigationBar_ComponentSet_07` | `setProperties` | `{ "VariantId": "NavigationBar_ComponentSet_07" }` | `device=Phone/Fold; layoutRole=Compact` |  |
| `NavigationBar_ComponentSet_08` | `setProperties` | `{ "VariantId": "NavigationBar_ComponentSet_08" }` | `device=Phone/Fold/Pad; layoutRole=Compact/Back` |  |
| `NavigationBar_ComponentSet_09` | `setProperties` | `{ "VariantId": "NavigationBar_ComponentSet_09" }` | `device=Phone/Fold/Pad; layoutRole=Edit/Close` |  |
| `NavigationBar_ComponentSet_10` | `setProperties` | `{ "VariantId": "NavigationBar_ComponentSet_10" }` | `device=Phone/Fold/Pad; layoutRole=Compact/NoTitle` |  |
| `NavigationBar_ComponentSet_11` | `setProperties` | `{ "VariantId": "NavigationBar_ComponentSet_11" }` | `device=Phone/Fold/Pad; layoutRole=Compact/NoTitle/Back` |  |
| `Pad_TopBar_01` | `setProperties` | `{ "VariantId": "Pad_TopBar_01" }` | `device=Pad; layoutRole=L/C` |  |
| `Pad_TopBar_02` | `setProperties` | `{ "VariantId": "Pad_TopBar_02" }` | `device=Pad; layoutRole=L/C` |  |
| `TopBar_00` | `setProperties` | `{ "VariantId": "TopBar_00" }` | `device=Pad; layoutRole=L/C` |  |
| `TopBar_03` | `setProperties` | `{ "VariantId": "TopBar_03" }` | `device=Pad; layoutRole=L/C` |  |
| `TopBar_04` | `setProperties` | `{ "VariantId": "TopBar_04" }` | `device=Pad; layoutRole=L/C` |  |
| `TopBar_05` | `setProperties` | `{ "VariantId": "TopBar_05" }` | `device=Pad; layoutRole=L/C` |  |

### 待补执行层

以下组件族已在字典层注册，但执行层记录尚未通过 Figma 探查验证，需逐步补充：

TopBar（组合 / 导航子组件部分）/ BottomBar / Fab / Sidebar / SelectableChip / SearchBar / SearchReceiving / ToolBar / Divider / FloatingWindow / DrawerWindow

## 8. NavigationBar 当前基准硬规则

- 先用 `references/component-dictionary/navigation-bar.md` 中的 `componentSetKey` 定位，再用 `componentName` 和 `mainComponent` 校验是不是目标组件
- 当 `componentSetKey = a439b7cbc33b1c7e3b1611e4b6499d442b3ac7cc` 时，只允许使用 `VariantId`
- `Pad_TopBar_01` / `Pad_TopBar_02` 在当前基准中属于 `NavigationBar_ComponentSet` 的变体，不再按独立组件 `swapComponent(...)`
- `TopBar_00` / `TopBar_03` / `TopBar_04` / `TopBar_05` 在当前基准中也属于 `NavigationBar_ComponentSet` 的变体，不再按独立组件 `swapComponent(...)`
- 同一 `componentFamily` 下允许存在多个 `componentName`，不得混用
- 旧组件集字段 `标题类型` / `交互状态` / `辅助标题` / `颜色模式` / `样式` 不得写入当前基准
