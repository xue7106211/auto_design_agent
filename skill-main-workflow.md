---
name: figma-multi-terminal-adapt
description: 多终端界面适配生产主入口技能。默认用于整页 Fold / Pad 适配，在主链路内部完成页面级组件任务生成、组件处理、布局委托和验证。
disable-model-invocation: false
---

# 多终端界面适配（入口）

使用这个 skill 将手机端 Figma 设计稿适配到折叠屏（Fold）或平板（Pad）。本 skill 是唯一生产主入口，负责读取源稿、判断布局类型、生成页面级组件任务、委托执行和验证结果，不直接操作画布。

## 适用场景

当用户提出以下类型需求时使用本 skill：

- "把手机端设计稿适配到折叠屏"
- "做 Pad 端适配"
- "多终端适配"
- "把这个页面做成大屏版本"
- "折叠屏 / Pad 布局"

## 强制工作流

### Phase 0：进入生产主链路

默认进入整页多端适配主链路。

执行原则：

- 优先读取整页源稿上下文
- 优先判断目标设备和布局类型
- 在主链路内部盘点页面级关键组件实例
- 在主链路内部识别每个实例的 `resolvedUiElement`
- 在主链路内部生成 `componentTaskList`
- 按任务列表批量查询 `app-variant-map`
- 当某个任务收敛为组件级处理时，内部复用 `figma-component-dictionary`

### Phase 1：读取源设计稿上下文

获取手机端源设计稿的完整信息：

1. 用 `get_metadata` 获取源页面的图层结构（节点 ID、名称、类型、位置、尺寸）
2. 判断页面是否复杂，或是否存在仅靠 metadata 无法确定的局部区域
3. 如果结构复杂（节点数 > 50）或局部信息不足，分区域逐个用 `get_design_context` 补充组件、Auto Layout、层级和局部布局信息
4. 用 `get_screenshot` 获取源页面视觉参考，作为后续布局和验证的视觉基线
5. 将上述结果汇总为 `sourceDesignContext`
6. 记录关键信息：页面尺寸、顶层节点列表、使用的组件、布局方式

Figma MCP 读取阶段的最小产物应包括：

- `metadata`: 页面结构、节点 ID、层级、尺寸
- `designContext`: 关键区域的组件和布局补充信息
- `screenshot`: 当前页面视觉快照
- `sourceDesignContext`: 面向后续 Phase 2-6 的汇总上下文

必须确认：

- 源设计稿的完整结构已读取
- 关键区域已经过必要的 `get_design_context` 补读
- 视觉基线截图已生成
- 关键组件和变体已识别
- 页面的功能区域已划分清楚（导航区、列表区、内容区、操作区等）

### Phase 2：判断目标设备和布局类型

根据用户需求和源设计稿特征，确定：

**目标设备**（用户指定或推断）：

- Fold 内屏（展开态）
- Pad

**布局类型**（根据源页面功能结构判断）：

- **NLC**（导航-列表-内容）：源页面有底部 Tab 导航 + 列表 + 详情，适合三栏（Pad 专用）
- **NC**（导航-内容）：源页面有底部 Tab 导航但无需列表栏，适合分栏
- **LC**（列表-内容）：源页面是列表 + 详情的组合，无底部 Tab 导航，适合分栏
- **C**（通栏）：源页面是单一内容页（设置、关于等），适合通栏拉宽

判断依据：

- 有底部 Tab 导航 + 列表 + 详情 → NLC（仅 Pad）
- 有底部 Tab 导航，无列表栏 → NC
- 有明确的列表-详情关系，无底部 Tab → LC
- 单一内容展示 → C
- 用户明确指定布局类型时，以用户指定为准

加载设备尺寸规则：读取 `references/device-dimensions.md` 获取目标设备的画布尺寸和栏宽参数。

### Phase 3：加载通用规则

读取 `references/common-rules.md`，确认执行原则和禁止项。

### Phase 4：生成页面级组件任务

在委托布局子 Skill 之前，先完成页面级组件任务生成：

1. 盘点页面级关键组件实例
2. 识别每个实例的 `resolvedUiElement`
3. 生成 `componentTaskList`
4. 按 `appName + device + screenMode + resolvedUiElement` 批量查询 `app-variant-map`

如果某个任务已经收敛为组件级处理，允许在主链路内部复用 `figma-component-dictionary`，执行协议至少包括：

1. 探查当前实例
2. 识别组件族、当前 `VariantId`、`resolvedUiElement`
3. 查字典层
4. 加载组件族 reference
5. 决定 `setProperties(...)` 或 `swapComponent(...)`
6. 执行 Figma 回写
7. 做截图和 metadata 验证

### Phase 5：委托子 Skill 执行

根据 Phase 2 和 Phase 4 的结果，将以下信息传递给对应子 Skill。

**传递信息**：

- 源设计稿节点 ID 和结构摘要
- 目标设备类型和画布尺寸
- 布局类型和对应栏宽
- 已识别的关键组件列表
- `componentTaskList`

**委托规则**：

- 布局类型为 NLC → 加载 `figma-adapt-nlc-layout` skill（Pad 专用）
- 布局类型为 LC 或 NC → 加载 `figma-adapt-lc-nc-layout` skill
- 布局类型为 C → 加载 `figma-adapt-c-layout` skill

### Phase 6：调用验证

子 Skill 执行完成后，加载 `figma-adapt-verify` skill 对生成结果进行验证。

将以下信息传递给验证 Skill：

- 目标 frame 的节点 ID
- 目标设备类型和布局类型
- 预期的尺寸参数（画布尺寸、栏宽、边距）

如果验证不通过，根据验证 Skill 返回的偏差项进行修正，修正后再次验证，最多循环 3 次。

## 输出要求

最终向用户汇报：

1. 目标设备和布局类型的判断结果
2. 适配完成状态（成功 / 部分成功）
3. 验证结果摘要
4. 如有妥协项（如图片占位、字体降级、组件记录待复探），明确列出

不要输出冗长的方案说明或设计建议。
