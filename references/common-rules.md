# 通用规则

本文档定义所有多终端适配 Skill 共享的执行原则和禁止项。

## 执行原则

1. 先探查，后修改——读取完整上下文后再动手
2. 优先复用已有组件、变体、画布节点
3. 能 clone 已落地节点时，不优先 createInstance
4. 所有写入必须分步执行，不要一次性大脚本
5. 每一步写入后必须做截图校验和结构校验
6. 如果实例化受字体或组件限制，立即切换为 clone 策略
7. 只做局部修正，不整页推翻重做

## 组件选择原则

组件选择与组件执行必须分离：

- **选择哪个变体** → 由 `app-variant-map-{appName}.md` 决定
- **怎么执行切换** → 由 `figma-component-dictionary.md` + 组件族 reference 决定
- **布局 reference 不做组件选择**，只定义槽位位置和结构规则

禁止在布局执行中直接 clone 源页面模块代替组件查表流程。正确顺序：

1. 识别源实例的 `resolvedUiElement`
2. 查 `app-variant-map` 获取目标 `variantId`
3. 用 `figma-component-dictionary` 执行 `setProperties` 或 `swapComponent`

## 禁止项

- 禁止新建「V2」「副本」「新页面」等并行设计稿，除非用户明确要求
- 禁止一次性写入超过 10 个节点的大脚本（20KB 响应限制）
- 禁止修改组件内部结构（只改属性、尺寸、位置）
- 禁止使用自定义字体（Figma MCP 不支持）
- 禁止插入图片资源（Figma MCP 不支持）
- 禁止在布局 reference 中硬编码组件 variantId（必须通过 app-variant-map 查询）

## 实现策略优先级

1. `search_design_system` 搜索并复用已有组件/变体
2. clone 画布上的现成节点
3. 使用 Plugin API 新建节点（最后手段）

## clone 降级规则

出现以下情况时，从组件实例化切换到 clone 策略：

- `createInstance()` 失败
- `appendChild()` 因字体问题失败
- 组件依赖不可用字体
- 实例内部文本难以稳定修改

降级后：clone 已在画布中的现成节点，优先改布局、尺寸、位置，不改组件内部结构。

## 分步写入规范

每次 `use_figma` 调用只处理一个逻辑单元。步骤间需要：

1. 记录上一步创建的 node ID
2. 截图校验当前状态
3. 结构校验关键节点的尺寸和位置
4. 确认无误后再进入下一步

## 修正原则

结果不符合预期时：

1. 先修尺寸
2. 再修位置
3. 最后修文本或局部视觉

不要整页重做。
