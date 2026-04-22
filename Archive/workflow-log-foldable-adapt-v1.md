# 折叠屏适配工作流实录 — 笔记首页 LC 双栏

> 基于一次完整的 Q18 折叠屏适配实操，提炼可复用的工作流、决策点和踩坑记录。

## 任务概述


| 项目  | 内容                                                                 |
| --- | ------------------------------------------------------------------ |
| 输入  | 2 个移动端 frame（首页列表 392x851 + 详情页菜单 392x851）                         |
| 输出  | 1 个 Q18 折叠屏横屏 frame（888x628，LC 双栏 356:532）                         |
| 变更  | 状态栏→Q18-横屏、NavigationBar→中标题一级、标签页→灰底、列表→Q18、保留 BottomBar-Showcase |


## 实际执行流程

### Phase 0: 探查（2 次 use_figma 调用）

**做了什么**：读取源页面 8 个关键实例的 `mainComponent`、`variantProperties`、`componentProperties`。

**为什么必须先探查**：

- 组件的 variant 属性名不可预测。同一个文件中，左栏 NavigationBar 的属性名是 `样式`（值：大标题/中标题一级），右栏 NavigationBar-ComponentSet 的属性名是 `标题类型`（值：大标题/中标题（Q18）/中标题二级页）。两个名字叫 NavigationBar 的组件来自不同组件集，属性体系完全不同。
- 列表的属性名是 `Property 1`（值：移动端/Q18），标签页有两个属性 `状态`（默认/左滑）和 `样式`（白底/灰底）。不探查直接猜属性名必定失败。

**关键产出**：


| 组件                | 属性名        | 当前值 | 目标值    |
| ----------------- | ---------- | --- | ------ |
| 状态栏               | Property 1 | 手机  | Q18-横屏 |
| NavigationBar（左栏） | 样式         | 大标题 | 中标题一级  |
| 标签页               | 样式         | 白底  | 灰底     |
| 列表                | Property 1 | 移动端 | Q18    |


**探查脚本模式**（可复用）：

```javascript
// 批量读取实例的组件信息
const ids = ['46:9244', '46:9245', ...];
for (const id of ids) {
  const node = figma.getNodeById(id);
  if (node.type === 'INSTANCE') {
    const mc = node.mainComponent;
    const parent = mc.parent; // component set
    info.availableVariants = parent.children.map(c => c.name);
    info.variantProperties = node.variantProperties;
  }
}
```

---

### Phase A: 搭骨架（3 次调用 + 1 次截图）

**执行顺序**：

1. 配置目标 frame → VERTICAL auto-layout, 888x628, 圆角 51, clipsContent
2. Clone 状态栏 → append, layoutSizingHorizontal: FILL（自动拉伸到 888）
3. 创建 MainContent(HORIZONTAL) → LeftPanel(356) + RightPanel(532)

**骨架层级**：

```
首页 (VERTICAL, 888x628, r=51, clipsContent)
├── 状态栏 (FILL x 46)
└── MainContent (HORIZONTAL, FILL x FILL)
    ├── LeftPanel (356 x FILL, VERTICAL, clipsContent)
    └── RightPanel (532 x FILL, VERTICAL, clipsContent)
```

**分割线实现**：右栏左侧 1px stroke inside。使用 `strokeLeftWeight = 1` 配合其他三边为 0 实现单侧边框。

**关键代码**：

```javascript
rightPanel.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
rightPanel.strokeWeight = 1;
rightPanel.strokeAlign = 'INSIDE';
rightPanel.strokeTopWeight = 0;
rightPanel.strokeRightWeight = 0;
rightPanel.strokeBottomWeight = 0;
rightPanel.strokeLeftWeight = 1;
```

---

### Phase B: 填充左栏（5 次调用 + 1 次截图）

**正常路径（3 个组件成功）**：

- NavigationBar、搜索&AI、标签页：clone → appendChild → layoutSizingHorizontal: FILL
- 需要先 `loadFontAsync({ family: 'MiSans', style: 'Regular/Medium/Demibold' })`

**异常路径（列表遇到字体问题）**：

`appendChild()` 报错：`unloaded font "MiSans VF Regular"`。

**排查过程**：

1. 先尝试 `loadFontAsync({ family: 'MiSans VF', style: 'Regular' })` → 失败，字体不存在
2. 调用 `listAvailableFontsAsync()` 确认环境只有 `MiSans`（非 VF 版本）
3. 尝试关闭左栏 auto-layout 后 appendChild → 仍然失败（appendChild 本身触发字体加载，与 auto-layout 无关）

**最终解法：detach + 字体替换 + append**

```
clone → detachInstance() → 遍历替换不可用字体 → appendChild
```

```javascript
// 1. Clone 并 detach
const clone = source.clone();
const detached = clone.detachInstance(); // instance → frame

// 2. 递归替换不可用字体
function fixFonts(node) {
  if (node.type === 'TEXT' && node.characters.length > 0) {
    const fn = node.fontName;
    if (fn !== figma.mixed) {
      if (fn.family === 'MiSans VF' || fn.family === 'HyperOS Symbols VF') {
        node.fontName = { family: 'MiSans', style: fn.style === 'Medium' ? 'Medium' : 'Regular' };
      }
    } else {
      // 混合字体逐字符处理
      for (let i = 0; i < node.characters.length; i++) {
        const rf = node.getRangeFontName(i, i + 1);
        if (rf.family === 'MiSans VF' || rf.family === 'HyperOS Symbols VF') {
          node.setRangeFontName(i, i + 1, { family: 'MiSans', style: rf.style === 'Medium' ? 'Medium' : 'Regular' });
        }
      }
    }
  }
  if ('children' in node) {
    for (const child of node.children) { fixFonts(child); }
  }
}

// 3. 替换后 append
fixFonts(detached);
leftPanel.appendChild(detached);
```

**代价**：detach 后节点不再是 instance，无法通过属性面板切换 variant。

**BottomBar-Showcase 定位**：

```javascript
clone.layoutPositioning = 'ABSOLUTE';
clone.x = 0;
clone.y = leftPanel.height - clone.height; // 底部浮层
```

---

### Phase C: 填充右栏（3 次调用 + 1 次截图）

三个组件全部直接 clone + append 成功（不含 MiSans VF 字体），无需降级。

**迁移/排除决策**：


| 源节点                        | 决策  | 原因        |
| -------------------------- | --- | --------- |
| NavigationBar-ComponentSet | 迁移  | 详情页导航栏    |
| 笔记详情                       | 迁移  | 主内容区      |
| 详情页AI入口                    | 迁移  | 底部操作栏     |
| 状态栏                        | 排除  | 全局状态栏已在顶部 |
| 杆子                         | 排除  | 移动端底部指示器  |
| 玻璃材质_原子（键盘弹窗）              | 排除  | 移动端专用     |
| hidden 节点                  | 排除  | 不可见       |


---

### Phase D: 属性切换（2 次调用 + 1 次截图）

**成功切换 3 个 instance**（状态栏、NavigationBar、标签页）：

```javascript
statusBar.setProperties({ 'Property 1': 'Q18-横屏' });
navBar.setProperties({ '样式': '中标题一级' });
tabs.setProperties({ '样式': '灰底' });
```

降级链：`setProperties` → `swapComponent(importComponentByKeyAsync(key))` → 保持 clone

**列表特殊处理**（已 detach，无法 setProperties）：

1. 删除旧的 detach 列表
2. 重新 clone 源列表
3. 在 clone 上 `setProperties({ 'Property 1': 'Q18' })` → 切换 variant
4. detach + 字体替换 + append

**教训**：variant 切换应在 detach 之前完成。如果流程中已知某个组件需要 variant 切换，应该在 Phase B 就先切 variant 再 detach，不要留到 Phase D。

---

### Phase E: 最终校验（1 次 get_metadata + 1 次 get_screenshot）

**结构校验要点**：


| 校验项      | 预期            | 实际                             |
| -------- | ------------- | ------------------------------ |
| 目标 frame | 888x628       | 888x628 ✅                      |
| 状态栏      | 888 宽, Q18-横屏 | 888x38 ✅（Q18 variant 自带 38 高度） |
| 左栏       | 356 宽         | 356x590 ✅                      |
| 右栏       | 532 宽         | 532x590 ✅                      |
| 左栏组件数    | 5 个           | 5 个 ✅                          |
| 右栏组件数    | 3 个           | 3 个 ✅                          |
| 不含移动端专属  | 无键盘/杆子        | 无 ✅                            |


**发现**：状态栏 Q18-横屏 variant 的高度是 38（非 device-dimensions.md 中记录的 46）。以组件实际 variant 为准，文档数值可能含间距或版本差异。

---

## 调用统计


| 阶段         | use_figma    | get_screenshot | get_metadata | 合计     |
| ---------- | ------------ | -------------- | ------------ | ------ |
| Phase 0 探查 | 2            | 0              | 0            | 2      |
| Phase A 骨架 | 3            | 1              | 0            | 4      |
| Phase B 左栏 | 5（含 2 次失败重试） | 1              | 0            | 6      |
| Phase C 右栏 | 3            | 1              | 0            | 4      |
| Phase D 切换 | 2            | 1              | 0            | 3      |
| Phase E 校验 | 0            | 0              | 1            | 1      |
| **合计**     | **15**       | **4**          | **1**        | **20** |


其中 2 次 use_figma 是字体问题导致的失败重试。理想情况下（无字体问题）为 13 次。

---

## 踩坑记录与可复用经验

### 1. MiSans VF 字体不可用

**现象**：`appendChild()` 报 `unloaded font "MiSans VF Regular"`，`loadFontAsync()` 报字体不存在。

**根因**：MiSans VF（小米可变字体）和 HyperOS Symbols VF 未注册到 Figma MCP 运行环境，`listAvailableFontsAsync()` 中只有标准 MiSans。

**解法**：detach → 递归替换 → append。

**适用范围**：任何包含不可用字体的 instance 的 reparenting 操作。不仅限于 auto-layout，普通 frame 的 appendChild 也会触发字体加载。

**预防**：Phase 0 中增加一步字体可用性检查：

```javascript
// 探查时收集所有字体 → 批量检查可用性
const fonts = collectFontsFromNode(sourceInstance);
for (const font of fonts) {
  try {
    await figma.loadFontAsync(font);
  } catch {
    // 标记该实例需要 detach 降级
  }
}
```

### 2. variant 切换必须在 detach 之前

**现象**：列表在 Phase B detach 后变成 frame，Phase D 无法 `setProperties()` 切换 variant。

**解法**：删除旧节点 → 重新 clone → setProperties → detach → 字体替换 → append。

**优化建议**：将 Phase D 的 variant 切换前置到 Phase B/C 的 clone 步骤中。流程变为：

```
clone → setProperties(target variant) → [如需 detach] detach → fixFonts → append
```

### 3. 两个同名组件来自不同组件集

**现象**：左栏「NavigationBar」和右栏「NavigationBar-ComponentSet」都叫导航栏，但：

- 左栏来自本地组件集，属性名 `样式`，值域 `大标题/中标题一级/中标题二级`
- 右栏来自 OS4 UI Kit，属性名 `标题类型`，值域 `大标题/中标题（Q18）/中标题二级页/小标题`

**教训**：不能根据组件名推测属性。必须通过 `node.variantProperties` 读取实际属性。

### 4. BottomBar-Showcase 的绝对定位

在 auto-layout 容器中，使用 `layoutPositioning: 'ABSOLUTE'` 将浮层组件固定在底部。计算公式：`y = parentHeight - componentHeight`。

### 5. 分割线的独立边实现

Figma 支持 `strokeLeftWeight` 等独立边属性。配合 `strokeAlign: 'INSIDE'` 不占额外宽度。

---

## 推荐工作流优化（对比原 Skill）

基于本次实操，建议对 `figma-adapt-foldable-layout.md` 的工作流做以下调整：


| 原 Skill 流程                            | 实操发现                     | 建议调整                                 |
| ------------------------------------- | ------------------------ | ------------------------------------ |
| Step 1 读取上下文（泛指）                      | 必须精确读取 variantProperties | Phase 0 明确要求输出 variant 属性表           |
| Step 2 选择实现策略                         | 字体问题在 appendChild 时才暴露   | Phase 0 增加字体可用性预检                    |
| Phase B/C 先 clone 再 Phase D 切 variant | detach 后无法切 variant      | clone → setProperties → detach 合并为一步 |
| 未提及字体降级                               | MiSans VF 是高频问题          | 新增「字体降级」章节，含 detach + fixFonts 模板    |
| 截图校验频率未明确                             | 每个 Phase 结束后 1 次足够       | 每 Phase 结束后 1 次截图 + 最终 1 次结构校验       |


