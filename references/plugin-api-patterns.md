# Figma Plugin API 常用模式

本文档记录多终端适配中常用的 Figma Plugin API 写入模式，供 `use_figma` 调用时参考。

> **负责人**：一飞
> 基于实际调试经验持续补充，记录验证可用的代码模式。

## 创建基础 Frame

```javascript
// 创建一个带 Auto Layout 的容器
const frame = figma.createFrame()
frame.name = "目标名称"
frame.resize(宽度, 高度)
frame.layoutMode = "VERTICAL"  // 或 "HORIZONTAL"
frame.primaryAxisAlignItems = "MIN"
frame.counterAxisAlignItems = "MIN"
frame.clipsContent = true
```

## 创建左右分栏

```javascript
// 主内容区水平布局
const mainContent = figma.createFrame()
mainContent.name = "主内容区"
mainContent.layoutMode = "HORIZONTAL"
mainContent.resize(全宽, 内容高度)

// 左栏
const leftPanel = figma.createFrame()
leftPanel.name = "列表栏"
leftPanel.resize(左栏宽度, 内容高度)
leftPanel.layoutMode = "VERTICAL"

// 右栏
const rightPanel = figma.createFrame()
rightPanel.name = "内容区"
rightPanel.resize(右栏宽度, 内容高度)
rightPanel.layoutMode = "VERTICAL"

mainContent.appendChild(leftPanel)
mainContent.appendChild(rightPanel)
```

## Clone 节点

```javascript
// clone 画布上的现有节点（保留所有属性和子节点）
const sourceNode = figma.getNodeById("源节点ID")
const cloned = sourceNode.clone()
cloned.name = "新名称"
targetFrame.appendChild(cloned)
```

## 搜索并实例化组件

```javascript
// 通过 key 导入组件
const component = await figma.importComponentByKeyAsync("组件Key")
const instance = component.createInstance()
targetFrame.appendChild(instance)
```

## 设置节点属性

```javascript
// 修改尺寸
node.resize(新宽度, 新高度)

// 修改位置
node.x = X坐标
node.y = Y坐标

// 修改 Auto Layout 属性
node.layoutMode = "VERTICAL"
node.itemSpacing = 间距值
node.paddingLeft = 左内边距
node.paddingRight = 右内边距
node.paddingTop = 上内边距
node.paddingBottom = 下内边距
```

## 删除节点

```javascript
// 删除不需要的子节点（如移动端底部导航）
const toRemove = targetFrame.findOne(n => n.name === "底部导航栏")
if (toRemove) toRemove.remove()
```

## 注意事项

- 每次 `use_figma` 调用的响应限制为 20KB，单次操作不要过多
- 不支持设置自定义字体，使用默认字体
- 不支持插入图片资源，图片区域留占位 Frame
- `createInstance()` 可能因字体问题失败，失败时切换为 clone 策略
- 操作完成后返回创建的 node ID，供后续步骤引用

<!-- TODO: 一飞根据实际调试经验补充更多验证可用的模式 -->
