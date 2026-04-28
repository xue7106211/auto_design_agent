---
name: SKILL
description: 多终端界面适配生产主入口技能。默认用于整页 Fold / Pad 适配，在主链路内部完成页面级组件任务生成、按需读取 reference、组件处理、布局执行和验证。
disable-model-invocation: false
version: 1.0.0
lastUpdated: 2026-04-26
---

# 多终端界面适配

使用这个 skill 将手机端 Figma 设计稿适配到折叠屏（Fold）或平板（Pad）。本 skill 是唯一生产主入口，负责读取源稿、判断布局类型、生成页面级组件任务、按需读取 reference、执行布局和验证结果。

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

- 优先读取整页源稿上下文，判断目标设备和布局类型
- 默认同时覆盖 `Fold` + `Pad`、横屏 + 竖屏；仅在用户明确缩小范围时减少
- 组件任务链：盘点页面级组件实例 → 识别 `resolvedUiElement` → 生成 `componentTaskList` → 批量查询 `app-variant-map` → 按需读取 `figma-component-dictionary.md`
- 未读取对应布局 reference 前，禁止执行 Figma 写入
- 检索边界 = 源稿所在的当前 page；禁止跨 page 搜索、比对或复用；用户新建 page / section 或指定”就在这个 page 里做”视为显式隔离，进一步收紧边界；整页级复用必须用户确认（同页面内容 + 同目标设备 + 同布局语义）
- 目标适配稿放源稿旁边，同 section、同横向对照带

### Phase 1：读取源设计稿上下文

获取手机端源设计稿的完整信息：

1. 用 `get_metadata` 获取源页面的图层结构（节点 ID、名称、类型、位置、尺寸）
2. 若结构复杂（节点数 > 50）或局部信息不足，分区域用 `get_design_context` 补充组件、Auto Layout、层级和局部布局信息
3. 用 `get_screenshot` 获取源页面视觉参考，作为后续布局和验证的视觉基线
4. 字体可用性预检：用 `use_figma` 扫描源页面所有文本节点的字体，生成 `fontDegradationMap`（降级规则见"字体降级规则"专节）

字体预检脚本：

```javascript
const textNodes = figma.currentPage.findAll(n => n.type === 'TEXT');
const usedFonts = new Set();
for (const node of textNodes) {
  if (node.fontName !== figma.mixed) {
    usedFonts.add(JSON.stringify(node.fontName));
  } else {
    for (let i = 0; i < node.characters.length; i++) {
      usedFonts.add(JSON.stringify(node.getRangeFontName(i, i + 1)));
    }
  }
}

const unavailable = [];
for (const fontJson of usedFonts) {
  const font = JSON.parse(fontJson);
  try {
    await figma.loadFontAsync(font);
  } catch {
    unavailable.push(font);
  }
}

return { unavailableFonts: unavailable, totalTextNodes: textNodes.length };
```

将上述结果汇总为 `sourceDesignContext`（面向 Phase 2-6），必须包含以下产物且全部就绪后才可进入下一阶段：

| 产物 | 内容 | 完成条件 |
|------|------|----------|
| `metadata` | 页面结构、节点 ID、层级、尺寸 | 完整结构已读取 |
| `designContext` | 关键区域的组件和布局补充信息 | 复杂区域已经过 `get_design_context` 补读 |
| `screenshot` | 当前页面视觉快照 | 视觉基线截图已生成 |
| `fontDegradationMap` | 不可用字体 → fallback 映射（全部可用则为空） | 不可用字体已记录降级映射 |

此外，`sourceDesignContext` 中还必须明确：关键组件和变体已识别、页面功能区域已划分（导航区、列表区、内容区、操作区等）。

### Phase 2：判断目标设备和布局类型

根据用户需求和源设计稿特征，确定：

**目标设备**（用户指定或推断）：

- Fold 内屏（展开态）
- Pad

**方向要求**（默认必须覆盖）：

- Fold：横屏 + 竖屏
- Pad：横屏 + 竖屏
- 若用户只提“多端适配”“Fold / Pad 适配”而未限定方向，不允许只输出横屏版本
- 只有在用户明确指定“仅横屏”“仅竖屏”，或当前任务已经给出明确的单方向交付范围时，才允许减少目标版本数

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

加载设备尺寸规则：读取 `references/layouts/device-dimensions.md` 获取目标设备的画布尺寸和栏宽参数。

本阶段必须形成 `targetVariantPlan`，至少明确以下四项是否需要生成：

- `Fold内屏-横屏`
- `Fold内屏-竖屏`
- `Pad-横屏`
- `Pad-竖屏`

若用户没有缩小范围，上述四项默认都为必做项；后续写入与验证都必须以这份计划为准，不允许执行中途静默漏掉竖屏版本。

### Phase 3：加载通用规则

读取 `references/common-rules.md`，确认执行原则和禁止项。

### Phase 4：生成页面级组件任务

在读取布局 reference 并执行写入之前，先完成页面级组件任务生成：

1. 盘点页面级关键组件实例
2. 识别每个实例的 `resolvedUiElement`
3. 生成 `componentTaskList`
4. 先基于页面级 `layoutType` 和组件所在栏位或子场景推导 `screenMode`，再按 `appName + device + screenMode + resolvedUiElement` 批量查询 `app-variant-map`

强制约束：

**任务生成不可跳过**：不管文件内有无相似样例，`metadata` 中出现的源稿直接子组件必须全部进入 `componentTaskList`，不可跳过或删除；后续读取结果少于 metadata 时只能记录差异，不允许据此删减任务

**检索边界**：遵循 Phase 0 检索边界规则；本阶段补充——组件级节点、骨架节点或当前 frame 内局部结构可复用，但整页级复用仍需用户确认

**基础组件独立映射**：基础组件（至少包括 `StatusBar`、`NavigationBar`、`BottomBar`、`Sidebar`、`SearchBar`、`SelectableChip`、`Fab` 及布局 reference 点名的标准结构组件）必须单独收敛为组件任务，不允许混在”顶部模块””页面骨架”等打包动作中跳过；每个基础组件必须独立走完 `resolvedUiElement` → `screenMode` → `app-variant-map` → 目标实例命中全链路，仅完成位置迁移、尺寸拉伸、整体 clone 或”沿用源稿当前变体”不视为完成；命中标准实例后，后续骨架执行只能复用该命中结果，不允许回退到源稿原始变体

**标准实例命中与退化**：有明确目标实例名时（来自 `app-variant-map`、布局 reference、组件字典或用户输入）必须优先命中；仅在确认当前文件内不存在、无法访问或实例化失败后才允许退化为局部素材重组，并说明退化原因；标准组件默认保留实例状态，不预先执行 `detachInstance`

**导航语义约束**：
- 组件族由映射表决定，不由 `layoutType` / 栏位名 / `screenMode` 推断；`LC` 的 `L` 栏 ≠ `Sidebar`，仅 `NC / NLC` 显式存在 `N` 栏时才允许把底部导航迁移为 `Sidebar`
- `variantId` 不可跨语义替换：映射表命中的 `variantId` 在组件集中不可用时，不允许自动改用其他 `variantId`（尤其禁止 `BottomBar` → `Sidebar`）；此时中止汇报缺口，或退化为无新增导航语义的空容器
- Fold 内屏 `LC` 默认不得出现 `Sidebar`，除非映射表明确返回 `Sidebar_*` 且 notes 说明为侧边导航承载

**内容密度**：只迁移源稿已有内容，不跨画布搬运业务数据来”填满”目标栏位；低保真 / 空内容源稿保持相同密度，补示例内容需用户确认

如果某个任务已经收敛为组件级处理，允许在主链路内部读取 `figma-component-dictionary.md`，执行协议至少包括：

1. 探查当前实例
2. 识别组件族、当前 `VariantId`、`resolvedUiElement`
3. 查字典层
4. 加载组件族 reference
5. 决定 `setProperties(...)` 或 `swapComponent(...)`
6. 检查 `fontDegradationMap`，决定回写路径：
   - 标准组件优先保留实例态：先尝试 `loadFontAsync → setProperties / swapComponent → 必要的实例级文本或属性修改 → appendChild`
   - 只有在以下条件同时成立时，才允许进入 `detachInstance` 降级路径：目标实例路径已尝试失败、确实需要修改实例内部文本或结构、且字体或组件依赖阻塞无法通过实例态完成
   - 如果进入降级路径 → `clone → setProperties(target variant) → detachInstance → fixFonts → appendChild`
   - 如果字体全部可用 → 走正常路径：直接 `setProperties` 或 `swapComponent`
7. 执行 Figma 回写
8. 做截图和 metadata 验证

基础组件的额外硬约束：

- `componentTaskList` 必须显式列出每个基础组件任务；每个任务必须逐项关闭，状态只能是 `mapped` / `hidden` / `absent` / `fallback` / `blocked`；未记录状态视为未完成
- 完成标准 = 命中目标设备 / 方向 / `screenMode` 下的标准实例或标准变体；仍停留在源稿原始 `VariantId`、旧设备变体或未经校验的 clone 状态视为未完成；只有映射完成后才允许装配回目标骨架，不允许先拼装再补映射
- 映射前必须校验 `layoutRole` 与 `componentFamily` 的匹配关系；`layoutRole=L` + `componentFamily=Sidebar`，或 `layoutRole=C` + 底部导航/侧边栏族，判为语义冲突并中止该任务

### Phase 5：读取布局 reference 并执行

根据 Phase 2 和 Phase 4 的结果，读取对应布局 reference，并由主 Skill 按 reference 中的骨架、栏位、组件放置和验收规则执行。

**传递信息**：

- 源设计稿节点 ID 和结构摘要
- 目标设备类型和画布尺寸
- `targetVariantPlan`（本次需要落地的设备 × 方向清单）
- 布局类型和对应栏宽
- 已识别的关键组件列表
- `componentTaskList`
- `screenMode` 生成规则（由 `layoutType` + 栏位 / 子场景推导）
- `fontDegradationMap`（不可用字体的降级映射，后续 appendChild 和文本操作时必须遵守）

**Reference 加载规则**：

- 布局类型为 NLC → 读取 `references/layouts/nlc-layout.md`（Pad 专用）
- 布局类型为 LC 或 NC → 读取 `references/layouts/lc-nc-layout.md`
- 布局类型为 C → 读取 `references/layouts/c-layout.md`

**强制约束**：

- 未读取对应布局 reference 前，不允许执行 Figma 写入
- 布局 reference 中的栏宽、栏位职责和验收项优先级高于模型推断
- 若 reference 与源稿直觉冲突，以 reference 为准；无法判断时中止并汇报缺口
- 栏宽约束不能只停留在 viewport 或外层骨架；凡是 `L / C / N` 栏，栏内第一层语义容器也必须跟随栏宽收敛，不允许保留移动端或其他设备的固定宽度后再靠 `clipsContent` / 裁切隐藏超出部分
- 对需要随栏宽变化的栏级容器，必须优先使用 Auto Layout；列表栏、标题栏、搜索栏、标签栏、正文栏等主内容容器默认应使用 `Fill Container` 跟随父栏宽度，不能把 `clone` 出来的固定宽度直接视为适配完成
- 即使文件中已有看似可用的整页结果，也不得直接视为当前任务输出；最多只能作为比对样例，除非用户已明确确认复用
- 不允许把“复用顶部模块 / 底部模块 / 页面局部结构”执行成“直接保留源稿基础组件的当前变体”；凡属于基础组件的节点，在装配进目标骨架前必须先完成独立映射
- 不允许用“源稿里已经有标题栏 / 状态栏 / 底部导航，所以先 clone 过去”替代组件映射；clone 只能作为命中目标实例失败后的回退路径，不能作为默认路径

**目标稿放置约束**：

- 执行整页适配时，目标 frame 必须默认放在源移动端 frame 旁边，不得随意落在当前 page 的远处
- 如果源稿位于 section 中，目标 frame 必须优先写回同一 section
- 放置多个目标设备或多个方向版本时，必须保持稳定顺序和可读间距，便于用户直接从左到右比较
- 默认顺序应为：`Fold横屏 → Fold竖屏 → Pad横屏 → Pad竖屏`
- 不允许只创建首个横屏版本就结束；若 `targetVariantPlan` 中仍有未生成版本，必须继续顺排创建
- 只有在用户明确要求或当前 section 空间明显不足时，才允许偏离“源稿旁边”的默认落位

### 字体降级规则

本节适用于主链路和所有 reference 执行阶段。当 Phase 1 检测到不可用字体时，后续所有涉及 appendChild 或文本属性修改的操作必须遵守以下规则。

**降级映射表**：

| 不可用字体 | 降级目标 family | style 映射 |
|-----------|----------------|------------|
| MiSans VF | MiSans | Medium → Medium，其余 → Regular |
| HyperOS Symbols VF | MiSans | Medium → Medium，其余 → Regular |

如果遇到不在此表中的不可用字体，用 `listAvailableFontsAsync()` 查找同 family 的可用变体；如果没有同 family 可用变体，降级到 `{ family: 'MiSans', style: 'Regular' }` 并在输出中记录。

**涉及不可用字体的实例，强制执行顺序**：

```
clone → setProperties(target variant) → detachInstance → fixFonts → appendChild
```

关键约束：
- variant 切换（`setProperties`）必须在 `detachInstance` 之前完成，detach 后无法再切换 variant
- `fixFonts` 必须在 `appendChild` 之前完成，否则 appendChild 触发字体加载报错
- detach 后节点不再是 instance，这是已知代价，在输出中标记为妥协项

**fixFonts 代码模板**：

```javascript
async function fixFonts(node, degradationMap) {
  if (node.type === 'TEXT' && node.characters.length > 0) {
    const fn = node.fontName;
    if (fn !== figma.mixed) {
      const key = fn.family;
      if (degradationMap[key]) {
        const target = degradationMap[key];
        const newFont = { family: target.family, style: target.styleMap[fn.style] || target.defaultStyle };
        await figma.loadFontAsync(newFont);
        node.fontName = newFont;
      }
    } else {
      for (let i = 0; i < node.characters.length; i++) {
        const rf = node.getRangeFontName(i, i + 1);
        const key = rf.family;
        if (degradationMap[key]) {
          const target = degradationMap[key];
          const newFont = { family: target.family, style: target.styleMap[rf.style] || target.defaultStyle };
          await figma.loadFontAsync(newFont);
          node.setRangeFontName(i, i + 1, newFont);
        }
      }
    }
  }
  if ('children' in node) {
    for (const child of node.children) { await fixFonts(child, degradationMap); }
  }
}
```

其中 `degradationMap` 结构示例：

```javascript
{
  'MiSans VF': { family: 'MiSans', styleMap: { 'Medium': 'Medium' }, defaultStyle: 'Regular' },
  'HyperOS Symbols VF': { family: 'MiSans', styleMap: { 'Medium': 'Medium' }, defaultStyle: 'Regular' }
}
```

**文本属性修改场景**：

如果需要修改已有文本节点的 fontSize、characters 等属性（非 appendChild 场景），必须先加载降级后的字体：

```javascript
await figma.loadFontAsync({ family: 'MiSans', style: 'Regular' });
await figma.loadFontAsync({ family: 'MiSans', style: 'Medium' });
// 然后才能修改文本属性
```

### Phase 6：验证

布局执行完成后，先按对应布局 reference 的验收标准验证；如存在独立验证 reference，再做最终校验。

验收检查（任一不通过即视为适配未完成）：

**版本完整性**：对照 `targetVariantPlan`，每个设备 × 方向版本都已实际创建；缺失任何未经用户豁免的版本不得报成功

**尺寸与栏宽**：画布尺寸、栏宽、边距符合预期参数；栏内第一层语义容器必须使用 Auto Layout / `Fill Container` 跟随栏宽收敛，禁止保留旧固定宽度后靠裁切隐藏；Fold 内屏还须验证目标 frame 四角圆角为 `50dp`

**基础组件映射**：源稿中的基础组件（`NavigationBar`、`StatusBar`、`BottomBar` 等）在目标稿中已完成独立映射，而非源稿原始实例、原始 `VariantId` 或未经校验的 clone；映射表返回 `hidden` / `absent` 的除外

验证不通过时，根据偏差项修正后再次验证，最多循环 3 次。

## 输出要求

最终向用户汇报：

1. 目标设备和布局类型的判断结果
2. 实际生成的设备 × 方向版本列表（如 `Fold横屏 / Fold竖屏 / Pad横屏 / Pad竖屏`）
3. 适配完成状态（成功 / 部分成功）
4. 验证结果摘要
5. 如有妥协项（如图片占位、字体降级、组件记录待复探，或经用户确认后省略某些方向版本），明确列出
6. 如有字体降级，列出具体映射：哪些字体被降级、降级到什么字体、涉及哪些节点
7. 不要输出冗长的方案说明或设计建议。
