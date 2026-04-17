---
name: figma-adapt-c-layout
description: 在现有 Figma 目标 frame 内完成 C（通栏）布局适配。适用于"把单一内容页适配到大屏""通栏拉宽""设置页/关于页的折叠屏适配"等场景。由主 Skill figma-multi-terminal-adapt 委托调用，也可独立使用。
disable-model-invocation: false
---

# C 通栏布局适配

在目标 frame 内完成 C（通栏）布局适配：单栏内容在大屏上的宽度调整和边距重算。不新建并行页面，直接执行。

## 适用场景

- "把设置页适配到折叠屏"
- "单一内容页的大屏适配"
- "通栏拉宽"
- "不需要分栏，只调宽度和边距"

## 前置条件

执行前需确认以下信息已就绪（由主 Skill 传入或自行获取）：

- 源设计稿节点 ID 和结构摘要
- 目标设备类型（Fold / Pad）
- 目标画布尺寸（参考 `references/device-dimensions.md`）
- 目标 frame 已存在且有编辑权限

## 核心原则

1. 先探查，后修改
2. 优先复用已有组件、变体、画布节点（详见 `references/common-rules.md`）
3. C 布局是最简单的适配类型，核心操作是宽度调整和边距重算
4. 所有写入分步执行
5. 每一步写入后做截图校验和结构校验
6. 不要过度改造——通栏页面保持通栏，不要自作主张加分栏

## 强制工作流

### Phase A：搭目标骨架

读取布局规则：`references/layout-c.md`

执行：
- 清空目标 frame 子节点
- 设置目标 frame 尺寸（从 `references/device-dimensions.md` 获取）
- 建立全局状态栏（通过 `search_design_system` 搜索目标设备变体，或 clone 源页面状态栏）
- 建立主内容区 frame（垂直布局）
- 如果 `references/layout-c.md` 定义了最大内容宽度，设置内容区居中限宽
- 为视口容器设置 `clipsContent = true`

写入模式参考：`references/plugin-api-patterns.md`

完成后校验：截图 + 确认骨架尺寸正确。

### Phase B：填充内容

读取组件规则：`references/component-routing.md` + `references/component-adaptation.md`

执行：
- 按源页面从上到下的顺序，逐个模块 clone 或实例化到内容区
- 应用组件属性切换（参考 `references/component-adaptation.md`）
- 调整各模块宽度以适应新的内容区宽度
- 重算左右边距（参考 `references/layout-c.md`）
- 删除不需要的移动端元素（底部手势条等）

完成后校验：截图 + 确认内容宽度和边距正确。

### Phase C：整体调整

- 检查边距是否符合 `references/layout-c.md` 定义
- 确认全局状态栏只有一套
- 确认内容区宽度是否需要居中限宽
- 检查列表项是否需要变为网格布局（参考 `references/layout-c.md` 中的特殊处理）

完成后校验：全页截图 + 完整结构校验。

## 每步校验标准

### 截图校验

每次关键写入后调用 screenshot，检查：
- 是否有异常拉伸
- 是否有异常留白
- 内容是否居中（如果规则要求居中限宽）
- 顶部状态栏是否只有一套

### 结构校验

每次关键写入后读取结构，检查：
- 目标 frame 尺寸
- 内容区宽度和边距
- 顶层节点数量和位置

## 修正原则

结果不符合预期时：
1. 先修尺寸
2. 再修位置
3. 最后修文本或局部视觉

不要整页重做，只做局部修正。

## 输出要求

最终只输出：
- 已完成的结构变化
- 实际尺寸结果（内容区宽度、左右边距、总宽度）
- 是否满足验收项
- 是否存在妥协项

## 默认验收标准

- 目标页面尺寸精确匹配设备规格
- 内容区宽度和边距精确匹配 `references/layout-c.md` 定义
- 顶部全局状态栏只有一套
- 内容模块顺序与源页面一致
- 不保留移动端底部手势条
- 整体视觉无明显拉伸、裁切、异常空白
