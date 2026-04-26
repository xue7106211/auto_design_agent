---
name: skill-main-workflow
description: 多终端界面适配生产主入口技能。默认用于整页 Fold / Pad 适配，在主链路内部完成页面级组件任务生成、按需读取 reference、组件处理、布局执行和验证。
disable-model-invocation: false
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

- 优先读取整页源稿上下文
- 优先判断目标设备和布局类型
- 在主链路内部盘点页面级关键组件实例
- 在主链路内部识别每个实例的 `resolvedUiElement`
- 在主链路内部生成 `componentTaskList`
- 按任务列表批量查询 `app-variant-map`
- 当某个任务收敛为组件级处理时，按需读取 `figma-component-dictionary.md`
- 未读取对应布局 reference 前，不允许执行 Figma 写入
- 不把“全文件搜索现成目标稿”作为默认步骤；默认只围绕源稿、当前 frame 和当前任务直接命中的节点执行
- 如需复用别处已存在的整页目标稿，必须先确认其与当前任务是同一页面内容、同一目标设备、同一布局语义，并先获得用户确认
- 目标适配稿默认直接放在源移动端设计稿旁边，优先保持同一 section、同一横向对照带

### Phase 1：读取源设计稿上下文

获取手机端源设计稿的完整信息：

1. 用 `get_metadata` 获取源页面的图层结构（节点 ID、名称、类型、位置、尺寸）
2. 判断页面是否复杂，或是否存在仅靠 metadata 无法确定的局部区域
3. 如果结构复杂（节点数 > 50）或局部信息不足，分区域逐个用 `get_design_context` 补充组件、Auto Layout、层级和局部布局信息
4. 用 `get_screenshot` 获取源页面视觉参考，作为后续布局和验证的视觉基线
5. 将上述结果汇总为 `sourceDesignContext`
6. 记录关键信息：页面尺寸、顶层节点列表、使用的组件、布局方式
7. 字体可用性预检：用 `use_figma` 扫描源页面所有文本节点的字体，与运行环境可用字体比对，生成 `fontDegradationMap`

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

根据返回的 `unavailableFonts` 构建 `fontDegradationMap`，降级规则见"字体降级规则"专节。

Figma MCP 读取阶段的最小产物应包括：

- `metadata`: 页面结构、节点 ID、层级、尺寸
- `designContext`: 关键区域的组件和布局补充信息
- `screenshot`: 当前页面视觉快照
- `fontDegradationMap`: 不可用字体 → 可用 fallback 字体的映射（如果全部可用则为空）
- `sourceDesignContext`: 面向后续 Phase 2-6 的汇总上下文，包含上述所有产物

必须确认：

- 源设计稿的完整结构已读取
- 关键区域已经过必要的 `get_design_context` 补读
- 视觉基线截图已生成
- 关键组件和变体已识别
- 页面的功能区域已划分清楚（导航区、列表区、内容区、操作区等）
- 字体可用性已检查，不可用字体已记录降级映射

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

加载设备尺寸规则：读取 `references/layouts/device-dimensions.md` 获取目标设备的画布尺寸和栏宽参数。

### Phase 3：加载通用规则

读取 `references/common-rules.md`，确认执行原则和禁止项。

### Phase 4：生成页面级组件任务

在读取布局 reference 并执行写入之前，先完成页面级组件任务生成：

1. 盘点页面级关键组件实例
2. 识别每个实例的 `resolvedUiElement`
3. 生成 `componentTaskList`
4. 先基于页面级 `layoutType` 和组件所在栏位或子场景推导 `screenMode`，再按 `appName + device + screenMode + resolvedUiElement` 批量查询 `app-variant-map`

在本阶段补充强制约束：

- 不允许因为文件中存在相似的多端样例，就跳过 `componentTaskList`、`screenMode` 和 `app-variant-map` 的生成
- 不允许在本阶段扩展成“全文件探查整页可复用目标稿”；除非用户明确要求比对现有样例，或已经确认存在可直接复用的同页目标稿
- 可以复用组件级节点、骨架节点或当前 frame 内局部结构，但整页级复用必须升级为显式确认动作
- 不允许把“禁止整页复用”误解为“禁止查找标准组件实例”；凡是当前目标布局落地所必需的标准组件、标准变体或标准骨架，仍然必须继续探查并命中
- 当 `app-variant-map`、布局 reference、组件字典或用户输入已经给出明确目标实例名时，必须优先命中该标准实例；只有在确认当前文件内不存在、无法访问或实例化失败后，才允许退化为局部素材重组，并在输出中说明退化原因
- 导航类组件必须按语义分层处理：手机 `BottomBar`、Pad `N` 栏 `Sidebar`、标题栏 / StatusBar 互不替代；禁止因为找到了“某种导航素材”就停止继续查找目标布局所需的标准实例
- 标准组件默认必须保留实例状态；对 `NavigationBar`、`StatusBar`、`Sidebar`、底部导航等标准结构组件，不能为了求稳而预先执行 `detachInstance`
- 多端适配默认只迁移源稿中已经存在的内容，不得从其他画布、历史样例或相似页面跨画布搬运列表项、正文、图片或业务数据来“填满”目标栏位
- 当源稿为低保真、空内容或仅有框架的页面时，目标稿必须保持相同内容密度，只做布局骨架和已有元素的适配；如需补示例内容，必须先得到用户明确确认

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

### Phase 5：读取布局 reference 并执行

根据 Phase 2 和 Phase 4 的结果，读取对应布局 reference，并由主 Skill 按 reference 中的骨架、栏位、组件放置和验收规则执行。

**传递信息**：

- 源设计稿节点 ID 和结构摘要
- 目标设备类型和画布尺寸
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
- 即使文件中已有看似可用的整页结果，也不得直接视为当前任务输出；最多只能作为比对样例，除非用户已明确确认复用

**目标稿放置约束**：

- 执行整页适配时，目标 frame 必须默认放在源移动端 frame 旁边，不得随意落在当前 page 的远处
- 如果源稿位于 section 中，目标 frame 必须优先写回同一 section
- 放置多个目标设备时，必须保持稳定顺序和可读间距，便于用户直接从左到右比较
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
function fixFonts(node, degradationMap) {
  if (node.type === 'TEXT' && node.characters.length > 0) {
    const fn = node.fontName;
    if (fn !== figma.mixed) {
      const key = fn.family;
      if (degradationMap[key]) {
        const target = degradationMap[key];
        node.fontName = { family: target.family, style: target.styleMap[fn.style] || target.defaultStyle };
      }
    } else {
      for (let i = 0; i < node.characters.length; i++) {
        const rf = node.getRangeFontName(i, i + 1);
        const key = rf.family;
        if (degradationMap[key]) {
          const target = degradationMap[key];
          node.setRangeFontName(i, i + 1, {
            family: target.family,
            style: target.styleMap[rf.style] || target.defaultStyle
          });
        }
      }
    }
  }
  if ('children' in node) {
    for (const child of node.children) { fixFonts(child, degradationMap); }
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

布局执行完成后，先按对应布局 reference 的验收标准对生成结果进行验证；如存在独立验证 reference，再按验证 reference 做最终校验。

验证时至少使用以下信息：

- 目标 frame 的节点 ID
- 目标设备类型和布局类型
- 预期的尺寸参数（画布尺寸、栏宽、边距）
- Fold 内屏 Q18 还必须验证目标 frame 四角圆角为 `50dp`

如果验证不通过，根据偏差项进行修正，修正后再次验证，最多循环 3 次。

## 输出要求

最终向用户汇报：

1. 目标设备和布局类型的判断结果
2. 适配完成状态（成功 / 部分成功）
3. 验证结果摘要
4. 如有妥协项（如图片占位、字体降级、组件记录待复探），明确列出
5. 如有字体降级，列出具体映射：哪些字体被降级、降级到什么字体、涉及哪些节点

不要输出冗长的方案说明或设计建议。
