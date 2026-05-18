---
name: SKILL
description: 多终端界面适配生产主入口技能。默认用于整页 Fold / Pad 适配，在主链路内部完成页面级组件任务生成、按需读取 reference、组件处理、布局执行和验证。
disable-model-invocation: false
version: 1.0.1
lastUpdated: 2026-05-07
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

> 📌 **全 Phase 通用前置**：本 Skill 任何 `use_figma` 调用前，**必须先调用 `figma-use` skill**（Figma plugin 工具的 mandatory prerequisite）。`use_figma` 直接调用会触发隐藏的 fail 模式（字体加载 / instance reflow / page 切换错误等），`figma-use` skill 内含完整使用规则。**首次 `use_figma` 出现在 Phase 1（字体预检），所以 Phase 1 进入前必须先 figma-use skill 加载完成**。

### Phase 0：进入生产主链路

> **🔁 RE-CHECK（Phase 0 必读）**：
> - common-rules §1 检索与复用边界（当前 page 隔离 / 整页复用条件 / 标准实例必探查）
> - common-rules §2 内容来源边界（密度守恒 / 业务内容 vs 结构组件 / 宽 frame 行为）
> - common-rules §0 #11~#17（落位协议 / token 绑定 / 数据不猜测 / 栏前缀格式 / Phase 2 塌缩 / 用户拒绝精确范围 / **遮罩+z-order 禁止推测**）

### Phase 0.0：权威源 inventory gate（soft gate, .md-only 为 default）

> **作用**（2026-05-18 修订）：默认信任 `references/app-variant-map-{app}.md`，**不再每次 session 强制 user 提供 CSV**。CSV 仅在 .md 编辑 / 新增 mapping 条目时显式触发。

**默认行为（任务 ≠ .md 编辑时）**：

| # | 检查项 | 通过条件 |
|---|---|---|
| 1 | `app-variant-map-{app}.md` 存在且任务路径有覆盖 | git-tracked 文件直接 read，无需 user 确认 |
| 2 | 既存映射表条目 `(／／／)` / `待补` / `需要Check` 标记 | 任务路径上命中 → 必须 user confirm 后才能继续，**禁止推测**（common-rules §0 #13）|

**CSV 强制要求（仅以下场景，AI 主动索取）**：

- user 任务包含「.md 更新 / 新增映射 / 修复映射」类工作 → 必须最新 CSV
- 任务路径上的 .md 条目自身存在矛盾（同 variant 不同 size）→ 必须 CSV cross-check
- user 显式提供 CSV → 按提供版本以 CSV 为准

**输出**（向 user 显式报告，1 行）：

```
✓ Phase 0.0 inventory: app-variant-map-{app}.md last edit = YYYY-MM-DD; mode = .md-only (default) | csv-checked (CSV provided YYYY-MM-DD)
```

**.md-only 默认下，AI 不再每次输出 "results may diverge from latest CSV" 警告**（noise 制造）。该警告仅在以下时刻输出：

- 任务路径上有 `需要Check` / `待补` / `(／／／)` 条目命中（具体条目列出）
- user 显式声明 "本次跳过 CSV 也确认" 但路径含明显风险条目

**绕过条件（无 CSV 检查必要）**：

- 仅 figma 探查 / 截图等只读任务，不涉及 .md 写入或 spec 决策
- 全 .md 任务路径（已 git-tracked，无 stale 嫌疑）

默认进入整页多端适配主链路。

执行原则：

- 优先读取整页源稿上下文，判断目标设备和布局类型
- 默认同时覆盖 `Fold` + `Pad`、横屏 + 竖屏；仅在用户明确缩小范围时减少
- 组件任务链：盘点页面级组件实例 → 识别 `resolvedUiElement` → 生成 `componentTaskList` → 批量查询 `app-variant-map` → 按需读取 `figma-component-dictionary.md`
- 未读取对应布局 reference 前，禁止执行 Figma 写入
- 检索边界 = 源稿所在的当前 page；禁止跨 page 搜索、比对或复用；用户新建 page / section 或指定”就在这个 page 里做”视为显式隔离，进一步收紧边界；整页级复用必须用户确认（同页面内容 + 同目标设备 + 同布局语义）
- 目标适配稿放源稿旁边，同 section、同横向对照带

### Phase 1：读取源设计稿上下文

> **🔁 RE-CHECK（Phase 1 必读）**：
> - 全 Phase 通用前置：**进入 Phase 1 前必须先 `figma-use` skill 加载完成**（首次 `use_figma` 出现于本 Phase 第 4 步字体预检）
> - 字体预检脚本（本节 inline）必须运行；产出 `fontDegradationMap` 是 Phase 5 必要前置
> - common-rules §0 #13 数据不确定时报告，禁止猜测（CSV / metadata 异常时立即停止）
> - 「字体降级规则」节（本文档 Phase 5 后）—— `fontDegradationMap` 结构示例与降级表

获取手机端源设计稿的完整信息：

0. **源 page 识别（强制）**：`getNodeByIdAsync(sourceId)` 返回结果与 `currentPage` 无关。**必须**通过 `node.parent` 链向上追溯到 `type === 'PAGE'` 节点确定真实 page，禁止假设第一个 page 即源 page。然后 `await figma.setCurrentPageAsync(sourcePage)` 并对源节点重新 `getNodeByIdAsync` 取 fresh ref。**目标 frame 必须从一开始就在该 page 创建**，禁止跨 page move（cross-page `appendChild` + 后续 stale ref 访问会破坏 atomic，已观察到节点丢失）。
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

**页面状态完整性约束**：源 Section 中每个直接子 Frame 必须在最终输出中有对应物（适配 frame、叠加态、或标记跳过原因）。源 Frame 数量与目标覆盖数量对不上时，不得报适配完成。

### Phase 2：判断目标设备和布局类型

> **🔁 RE-CHECK（Phase 2 必读）**：
> - **`references/layouts/device-dimensions.md`**（设备画布尺寸 + 栏宽 + 圆角 + statusBar 高度 + 断点 padding 表）—— Phase 5 落位的 spec 来源
> - 各布局 reference（按 layoutType 选一）：
>   - NLC → `references/layouts/nlc-layout.md`（Pad 专用）
>   - LC / NC → `references/layouts/lc-nc-layout.md`
>   - C → `references/layouts/c-layout.md`
> - 应用专用 layout 例外（如 笔记 N 收起规则 / Pad 竖 NLC 覆盖 z-order）→ `references/app-variant-map-{app}.md §0`
> - 默认必出 4 版本（Fold 横 / Fold 竖 / Pad 横 / Pad 竖），用户明确缩小范围才减

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

### Phase 2 补充：targetVariantPlan 计数规则（钻取层级合并 / drilldown collapse）

**规则**：`targetVariantPlan` 项数 = **设备 × 方向数**，**不与源 frame 数相乘**。

**原因**：手机端因屏幕窄，会把同一份内容的不同导航深度（list / detail / edit 等）拆为多个独立 frame（钻取式导航）。Fold / Pad 的 LC / NLC 把这些层级**并置在同一画面**，所以源稿的 N 个 phone frame 在适配稿中**塌缩为 1 个 frame**。

**检测触发条件（命中任一即应用塌缩）**：

| # | 触发条件 | 例子 |
|---|---------|------|
| 1 | 源 frame 是同一 App / 同一数据模型的不同导航深度 | 笔记首页（list）+ 笔记详情页（detail） |
| 2 | 源 frame A 的列表项点击后跳转到 frame B（master → detail 关系）| 列表 → 详情 |
| 3 | 源 frame 同属于一个 BottomBar / Sidebar tab 下的不同层级 | 同一"笔记" tab 的两个深度 |
| 4 | 各源 frame 判定的 layoutType 都相同（全部 LC 或全部 NLC）| LC 天然吸收两个层级 |

**正确映射示例（笔记 App）**：

- 源：`笔记首页`（list, phone）+ `笔记详情页`（detail, phone）
- 适配：Fold 内横 / Fold 内竖 / Pad 横 / Pad 竖 = **4 frame**
  - 每个 frame：`L 栏 ← 笔记首页 list 内容`，`C 栏 ← 笔记详情页 detail 内容`
- ❌ 错误映射：`2 × 4 = 8 frame`（`笔记首页_*` 4 个 + `笔记详情页_*` 4 个，C 栏内容重复 / 一半 frame 残缺）

**例外（不塌缩的情况）**：

| 场景 | 保留独立 frame 的理由 |
|------|---------------------|
| 不同 BottomBar tab | 信息域不同（如`笔记` tab vs `待办` tab）|
| 不同数据模型 / 业务域 | 笔记 list vs 设置 page |
| 浮层 / Modal 独立画面 | 适配稿仍需作为独立浮层表达 |
| 用户**显式**要求"两个层级各自独立 frame" | 显式优先 |

**Phase 2 强制执行步骤**：

1. 列出源 section 的所有直接子 frame
2. 用上表逐项检查 → 识别需要塌缩的 frame 组
3. 按 **每组 1 frame × 设备数** 计算 `targetVariantPlan` 项数
4. **每个 frame 单独查 `app-variant-map-{app}.md §0.1a` 决定 layoutType**（device 别 lookup，禁止跨设备共用 layoutType）
5. 通过 `AskUserQuestion` 与用户确认 scope 时，**必须先汇报计数结果 + 塌缩判定 + 各 frame 的 layoutType**，再询问执行规模
   - ❌ 错误问法："8 frame 一次性 vs 分批"（计数错了用户也无从纠正）
   - ❌ 错误问法："塌缩为 LC（4 frame）vs 各自独立"（把所有 device 统一为 LC，忽略 Pad 默认 NLC）
   - ✅ 正确问法："`笔记首页` + `笔记详情页` 是 list/detail 钻取关系 → 4 个适配 frame：Fold 横/竖 = LC，Pad 横/竖 = NLC（按 app-variant-map §0.1a 默认）。是否正确？"
   - 用户若希望 Pad 也用 LC（如秘密笔记），必须 **显式偏离**并记录在妥协项

> **本规则的根因**：2026-05-16 笔记多端适配任务中，AI 误把"2 源 frame × 4 设备 = 8 frame"作为默认计数，导致一半 frame 的 C 栏空缺。此规则将检测点固化在 Phase 2 计数阶段，并强制 AskUserQuestion 暴露计数结果，避免错误计数被用户的"完整执行"答复掩盖。

### Phase 3：加载通用规则

> **🔁 RE-CHECK（Phase 3 必读 = 单纯加载）**：本 Phase 唯一动作是加载下表 3 个文件。任何文件未完整读取严禁进入 Phase 4。

**强制读取以下三个文件全文（不可只读目录或片段）**：

| # | 文件 | 角色 | 必读理由 |
|---|------|------|---------|
| 1 | `references/common-rules.md` | 通用原则 / 内容边界 / 检索规则 / §3.x 实例陷阱 / §6.2 验证清单 / §7 禁止项 | Phase 0~6 横跨；§3.6 reflow 陷阱是过去 18+ 错误的核心 |
| 2 | `references/component-placement-protocol.md` | **`placeStandardComponent` / `buildTokenCache` / `bindFill` / `verifyChecklist` 四个函数本体** | **唯一权威源**。Phase 5 落位 / Phase 6 验证 都直接调用这些函数。SKILL.md 本文档只列签名 + 示例，函数体在此 |
| 3 | `references/font-degradation.md` | **`fixFonts` 函数本体** + 降级 / 强制顺序 / degradationMap 结构示例 | **唯一权威源**。Phase 5 字体不可用实例处理直接调用 `fixFonts`；本节签名 + 业务降级表在 SKILL.md 内 |

> ⚠️ **未完整读取上述 3 文件严禁进入 Phase 4 / Phase 5**。Phase 5 写入代码会调用 `placeStandardComponent({...})` / `bindFill(...)` / `verifyChecklist(...)` / `fixFonts(...)`；这些函数仅在对应 reference 内有完整实现。未读 → 调用失败 / 误用必发生。
>
> 应用专属规则另在 `app-variant-map-{app}.md`（Phase 4 读取）。

> 关键决定（2026-05-15）：`resetOverrides` **默认 OFF**。仅当 swap 后必须清旧 override 时才显式 `true`。reset 会清掉 width override 触发 instance hug content reflow，是过去最频繁的失败根因。

### Phase 4：生成页面级组件任务 + Token 缓存

> **🔁 RE-CHECK（Phase 4 进入时必读）**：
> - common-rules §3.1 基础组件清单（必入清单的最少 9 个 family）
> - common-rules §0 #13 数据不确定时报告，禁止猜测（CSV "需要Check" / "待补" 必须用户确认）
> - app-variant-map-{app}.md §0 应用规则要点 + §0.6 历史踩坑

**强制 7 步**（顺序固定，缺一不可）：

| # | 动作 | 函数本体 | 输出 / 副作用 |
|---|------|---------|--------------|
| 1 | 盘点页面级关键组件实例（基于 Phase 1 metadata）| — | 实例列表 |
| 2 | 识别每个实例的 `resolvedUiElement` | — | 业务语义标签 |
| 3 | 推导 `screenMode`（由 `layoutType` + 栏位 / 子场景）| — | screenMode 值 |
| 4 | 批量查询 `app-variant-map` (`appName + device + screenMode + resolvedUiElement`) | `references/app-variant-map-{app}.md` | 各组件 variantId |
| 5 | 生成 `componentTaskList`：每条目含 **`variantId + 目标 x/y/w/h + parent + z-order + sourceDetected + status`** | — | 完整任务清单 |
| 6 | **执行 `TOKEN_CACHE = await buildTokenCache()`**（一次性缓存所有库 token，赋全局变量） | **`protocol.md §4`** | `TOKEN_CACHE.color` 就绪 |
| **7** | **导出 `scenarioFlags` JSON（trigger 单一权威 source）** — 仅使用 `app-variant-map-{app}.md §0「scenarioFlags 导出信号表」` lookup 结果，**禁止推测** | `app-variant-map-{app}.md` | `{ LEditMode, NEditMode, CEditMode, NCovering, ... }` |

> ⚠️ **Step 7 = Phase 5/6 的 single source of truth**：后续 mask 决定 / spec auto-derive / verifyChecklist 自动检查 全部引用 `scenarioFlags`。本 step 缺失即 Phase 5 进入阻断。
>
> ⚠️ flag 导出规则仅来自各 app `app-variant-map-{app}.md §0` 的「scenarioFlags 导出信号表」。表缺失或信号无匹配 → 必须 user confirm，**禁止推测** entries（common-rules §0 #13, #17）。

> ⚠️ 第 6 步是 Phase 5 `bindFill(...)` 的前置依赖。若漏掉 → Phase 5 fill 写入会全部 fallback RGB，token 绑定失败。Phase 6 `verifyChecklist` ② 必报错。

> ⚠️ 第 5 步 componentTaskList 必须**列齐 spec**（不仅是 variantId）。落位时直接调用 `placeStandardComponent({inst, targetVariant, x, y, w, h, parent, ...})`，**禁止落位时再现场决定** x / y / w / h。

**强制约束**（与 Phase 4 强制 6 步并行执行）：

| # | 约束 | 详细 |
|---|------|------|
| 1 | 任务生成不可跳过 | metadata 中所有源稿直接子组件**全部**进 `componentTaskList`；读取差异只能记录，不可删项 |
| 2 | 检索边界遵循 Phase 0 | 组件级节点 / 骨架节点 / 当前 frame 局部结构可复用，整页级复用仍需用户确认 |
| 3 | 基础组件独立映射 | StatusBar / NavBar / BottomBar / Sidebar / SearchBar / SelectableChip / Fab + 布局 reference 点名的组件，**每个独立**走完 `resolvedUiElement → screenMode → app-variant-map → 实例命中` 全链路 |
| 4 | 映射表优先级 | `resolvedUiElement` + `app-variant-map` 返回值 > 组件名 / 族名 / 直觉。如 `BottomBar_Showcase_Notes_01` 命中`底部工具栏` 必须按工具栏，不得按底部导航删 |
| 5 | 标准实例命中优先级 | 映射表 / 布局 reference / 字典 / 用户给明确目标 → **必须优先命中**；本地不存在才允许退化 |
| 6 | 标准组件保留实例态 | 默认不预先 `detachInstance` |
| 7 | 内容密度 | 只迁源稿已有内容；空态源稿保持空态；补示例内容需用户确认 |

**设计系统组件检索（明确 `variantId` 时必走顺序）**：

| 步 | 动作 |
|---|------|
| 1 | 读源实例 `mainComponent` / 组件集 / 组件属性 / 可用 `VariantId` |
| 2 | `search_design_system` 查目标组件族 / 集 / `variantId` |
| 3 | **同名结果 ≥ 2 个时强制验证（不可信任首匹配）**：逐个 `importComponentSetByKeyAsync` 后比对 ① `propDefs` 的 variant property 名称 ② 自然 W×H ③ 变体个数 — 与 CSV 「控件变体清单」 spec 完全一致的才采用。`updatedAt` 较新的优先但不绝对（同名 deprecated 可能仍存在）。例：`ToolBar_ComponentSet` 同名两个 set，正确 set propDef = `Property 1` 含 `_00/_01/_02`、自然 392×100；错误 set propDef = `材质 × 深色模式`、自然 344×56 |
| 4 | 命中 → `importComponentByKeyAsync` / `importComponentSetByKeyAsync` 导入 + `createInstance` / `setProperties` / `swapComponent` 命中变体 |
| 5 | 当前 page / section 已落地实例检索（作 clone 资源补充）|
| 6 | 仅以下情况进入 `fallback` / `blocked`：搜索无结果 / 导入失败 / 目标 `variantId` 不存在 / Figma 写入限制 |

**检索结论分类**：

| 结论 | 含义 | 后续动作 |
| --- | --- | --- |
| 当前 page 未落地目标实例 | 画布无现成节点（不证明库无）| 继续设计系统搜索 / 库导入 |
| 设计系统搜索无结果 | 外部库未命中 | 记录词 + 结果，`blocked` 或同族 fallback |
| 组件集存在但 `variantId` 不存在 | 族存在变体缺失 | **中止该映射**；不得跨族替换 |
| 导入 / 实例化失败 | 存在但写入受限 | 记错后判 clone / detach 降级 |

**导航语义约束**：

| 模式 | 允许 | 禁止 |
|------|------|------|
| `LC` 的 L 栏 | 列表 / 列表骨架 | **不可放 Sidebar**（除非映射表明确返回 Sidebar_*）|
| `NC / NLC` 的 N 栏 | Sidebar | — |
| 任意 `variantId` 在组件集中不可用 | 中止 + 汇报缺口 | **不可自动改用其他 variantId**（如 BottomBar → Sidebar）|

**组件级处理协议**（如某任务收敛到组件级）：

| 步 | 动作 |
|---|------|
| 1 | 探查当前实例 |
| 2 | 识别 family / `VariantId` / `resolvedUiElement` |
| 3 | 查 `figma-component-dictionary.md` |
| 4 | 加载组件族 reference |
| 5 | 外部库 → 设计系统搜索 + `importComponentByKeyAsync` |
| 6 | 决定 `setProperties` 或 `swapComponent` |
| 7 | 检查 `fontDegradationMap`，决定路径（标准 = 实例态保留；降级 = `clone → setProperties → detachInstance → fixFonts → appendChild`）|
| 8 | 通过 `placeStandardComponent` 写入 Figma |
| 9 | 截图 + metadata 验证 |

**componentTaskList 关闭判据**：

| 字段 | 取值 |
|------|------|
| `status` | 仅允许 `mapped` / `hidden` / `absent` / `fallback` / `blocked`；未记录视为未完成 |
| 完成标准 | 命中**目标设备 / 方向 / screenMode 下的标准实例**；停留在源稿原始 `VariantId` / 旧设备 variant / 未校验 clone 视为未完成 |
| layoutRole ↔ componentFamily 校验 | `layoutRole=L` + `componentFamily=Sidebar`，或 `layoutRole=C` + 底部导航 / 侧边栏族 → 判为语义冲突并中止 |

### Phase 5：读取布局 reference 并执行

> **🔁 RE-CHECK（落位前必读，每次进入 Phase 5 重新加载到工作记忆）**：
>
> | § | 内容 |
> |---|------|
> | §3.3 | 实例克隆 / variant 切换后必须显式 resize（不会自动） |
> | §3.4 | swap 后 override 残留清理（与 §3.6 关系：本节 OPT-IN，§3.6 默认 OFF）|
> | §3.4a | padding 合算 / 特殊 vs 内容容器分类 |
> | §3.5 | StatusBar 跨设备 variant 强制高度（pad 自然 38 → 强制 34）|
> | §3.6 | 自带 auto-layout 实例 reflow 陷阱 / 强制 6 步序列 ★ 最高频失败根因 |
> | §3.7 | NLC 覆盖 遮罩 + z-order（**2026-05-18 修订**：遮罩-N覆盖 在状态栏 **之上**，状态栏被 dim 是正答；旧版「保证可读」rationale 已弃用）|
> | **§3.7a** | **L 编辑模式遮罩 `遮罩-编辑`（Cw × frameH，仅 C 列）+ L 栏从 main 提升至 frame 直接子级 ★ scenarioFlags.LEditMode trigger ★ 遮罩-编辑 在状态栏之上** |
> | **§3.7b** | **多 mask z-order（编辑遮罩 + N 覆盖遮罩 同时存在时）；以 reference frame children dump 比对为准，但 reference 与 §3.7/§3.7a 修订冲突时按修订为准（旧 V2 reference 状态栏 z-order 错位 case）** |
> | §3.8 | 栏间分割线（独立 RECTANGLE，frame 直接子级，全帧高度）|
> | §3.9 | Sidebar 阴影裁切防止（Pad 横 N + main `clipsContent = false`）|
> | §3.10 | 视觉异常时优先怀疑 component 库版本（`search_design_system` 比对 `updatedAt`）|
>
> **关键决定**：`resetOverrides` 默认 **OFF**。reset 清空 width override → instance hug content reflow，是过去最频繁失败根因。
>
> **任何组件 swap / resize / 落位** 必须调用 `protocol.md §2` 的 `placeStandardComponent({...})`（本节列签名 + 调用顺序，函数本体在 protocol.md §2），禁止 inline 临时序列。

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

| # | 规则 | 详见 |
|---|------|------|
| 1 | 未读取对应布局 reference 前禁止 Figma 写入 | layouts/{nlc,lc-nc,c}-layout.md |
| 2 | 布局 reference 的栏宽 / 栏位职责 / 验收项优先级**高于模型推断** | — |
| 3 | reference ↔ 源稿直觉冲突 → 以 reference 为准；无法判断时中止汇报缺口 | — |
| 4 | 栏宽约束必须贯穿到栏内第一层语义容器（不只 viewport / 外层骨架）| 不允许保留旧固定宽度后靠 `clipsContent` 裁切 |
| 5 | 栏级容器优先 Auto Layout + `Fill Container`；不能把 clone 固定宽度直接视为完成 | — |
| 6 | 文件内已有的整页结果只能作”比对样例”，不能直接当输出（除非用户明确复用确认）| common-rules §1.3 |
| 7 | “复用顶部模块 / 底部模块”不可执行成”直接保留源稿当前变体”；基础组件必须先独立映射 | common-rules §3.1 |
| 8 | clone 是 fallback 路径，**不是默认路径**（命中目标实例失败时才 clone）| common-rules §4.2 |
| 9 | “当前 page 未找到” ≠ “组件库不存在”；进入 `fallback` / `blocked` 前必须执行 `search_design_system` + 导入校验 | — |
| 10 | `app-variant-map` 返回 `variant` 且未 `hidden`/`absent` 的组件**必须落地**；只允许标 `fallback` / `blocked` 但保留语义位置 | — |

**目标稿放置约束**：

| # | 规则 |
|---|------|
| 1 | 整页适配 frame 默认放源稿旁边，不可远处随意落 |
| 2 | 源稿在 section 中 → 目标 frame 优先写回同一 section |
| 3 | 多设备 / 多方向版本：稳定顺序 + 可读间距，便于左→右对照 |
| 4 | 默认顺序 `Fold横屏 → Fold竖屏 → Pad横屏 → Pad竖屏` |
| 5 | 不可只创建首个横屏版本就停；`targetVariantPlan` 未生成项必须继续 |
| 6 | 偏离默认落位 → 仅在用户明确要求或空间不足时允许，且输出说明 |

### 标准落位代码模板（必用，禁止 inline 临时序列）

> 📌 **单一权威源**：所有函数本体定义在 **`references/component-placement-protocol.md`**。本节只列签名 + 调用顺序 + 笔记应用 token 列表。Phase 5 启动前必须已读 protocol.md（Phase 3 已要求）。

**Phase 5 函数调用顺序（强制）**：

| 阶段 | 函数（签名）| 函数本体定义 | 作用 |
|------|------------|-------------|------|
| Phase 4 完成 | `await buildTokenCache()` | protocol.md §4 | 一次性缓存所有库 token → 全局 `TOKEN_CACHE` |
| Phase 5 落位 each component | `await placeStandardComponent({ inst, targetVariant, parent, x, y, w, h, parentZ?, resetOverrides=false, loadFontFamilies=[] })` | **protocol.md §2** | swap → FIXED → resize → x/y → 自检 6 步 |
| Phase 5 fill 写入 each node | `await bindFill(node, tokenName, fallbackRGB, opacity=1)` | protocol.md §4 | token lookup + setBoundVariableForPaint，无则 RGB fallback |
| Phase 5 字体不可用时 | `await fixFonts(node, degradationMap)` | 本文档「字体降级规则」节（笔记业务专用，未抽到 protocol） | clone → swap → detach → fixFonts → appendChild 链中最后一步 |
| Phase 6 frame 完成后 | `const errors = await verifyChecklist(frame, spec)` | **protocol.md §6** | 9 项自动检测，`errors.length > 0` 必须修复 |

**禁止顺序倒置**：
- `bindFill` 必须在 `placeStandardComponent` 之后（节点已落位才能写 fill）
- `fixFonts` 仅用于不可用字体实例，且 `appendChild` 之前必须完成
- `verifyChecklist` 只在 frame 全部 component 落位完毕后调用

**笔记 / 待办 应用必用 token（`bindFill` 第二参传值）**：

| 用途 | tokenName | library key | fallbackRGB | opacity |
|------|-----------|-------------|-------------|---------|
| frame / L栏 / C栏 fill | `背景色/surface` | `5804f51e302d6fda00b3a8ce9d509d9b8ee09225` | `{r:1,g:1,b:1}` | 1 |
| 栏间分割线 fill | `分割线色/outline` | `96f2cf4d1ce0d56cff2f8e98da6a5e16bd59983e` | `{r:0,g:0,b:0}` | 0.1 |
| Pad 竖 NLC 覆盖 遮罩 fill | `遮罩色/mask` | `0ed62540049dd3839b40b63d40f82492c4bac664` | `{r:0,g:0,b:0}` | **0.2** |

**调用示例**（笔记应用 Fold 横 LC frame fill）：
```javascript
// Phase 4 已完成：const TOKEN_CACHE = await buildTokenCache();
const frame = figma.createFrame();
frame.resize(888, 628);
frame.cornerRadius = 50;
await bindFill(frame, '背景色/surface', { r: 1, g: 1, b: 1 });

// 落位 NavigationBar
await placeStandardComponent({
  inst: navInst,
  targetVariant: navBar04,
  parent: lCol,
  x: 0, y: 6, w: 353, h: 56,
});
```

### 落位 layout spec 模板（与上节代码模板搭配使用）

> 上节是「**怎么调用函数**」，本节是「**spec 应该填什么值**」。

**栏内 stack 顺序（spec 通例，源稿冲突时以本表为准）**：

| 栏 | 顺序 |
|---|------|
| L 栏 | `NavBar(y=6, h=56) → SearchBar(y=62, h=44/56) → Chip → List → BottomBar(y=mainH-100, h=100)` |
| C 栏（笔记应用）| `NavBar_Notes(y=6, h=56) → Detail(y=62, h=mainH-62)` + `TextInput(y=mainH-92, h=92, bottom flush)` |

C 栏 z-order：必须 `Detail → TextInput`（TextInput 在上层 fade overlay）。

**frame 直接子节点 z-order**：

| 布局 | z-order（从底到顶） |
|---|---|
| LC（Fold 内屏） | `main` → `状态栏` → `分割线` → `杆子`（最顶 / 透明 / 风满） |
| NLC 并列（Pad 横） | `main`（含 L/C） → `状态栏` → `分割线` → `Sidebar`(z-2) → `杆子`(z-1, 风满, 透明) |
| NLC 覆盖（Pad 竖）| `main` → `状态栏` → `遮罩-N覆盖`(状态栏之上, 含状态栏 dim) → `分割线` → `Sidebar`(z-2) → `杆子`(z-1, 风满, 透明) |
| LC + L 编辑 | `main(C only)` → `状态栏` → `遮罩-编辑`(C 列, 状态栏之上) → `分割线` → `L 栏` → `杆子` |
| NLC 覆盖 + L 编辑 | `main(C only)` → `状态栏` → `遮罩-编辑`(C 列) → `分割线` → `L 栏` → `遮罩-N覆盖`(全幅) → `Sidebar` → `杆子` |

**杆子（home indicator）通用规则**：所有 Pad / Fold 模式下统一 —— `x=0, width=frameW, fills=[]`（透明背景），z-order 最顶。

### 字体降级规则

> 📌 **单一权威源**：完整降级表 + 强制执行顺序 + `fixFonts` 函数本体 + `degradationMap` 结构示例 + 文本属性修改场景，全部在 **`references/font-degradation.md`**。本节只列签名 + 强制顺序 + 笔记业务降级表索引。Phase 5 启动前必须已读 font-degradation.md（Phase 3 已要求）。

**降级映射表（笔记 / HyperOS 业务）**：

| 不可用字体 | 降级目标 family | style 映射 |
|-----------|----------------|------------|
| MiSans VF | MiSans | Medium → Medium，其余 → Regular |
| HyperOS Symbols VF | MiSans | Medium → Medium，其余 → Regular |

> 不在此表中的字体 → `listAvailableFontsAsync()` 查同 family 可用变体；没有 → 降级到 `{family:'MiSans', style:'Regular'}` 并在输出中记录。

**涉及不可用字体的实例，强制执行顺序**（详见 font-degradation.md）：

```
clone → setProperties(target variant) → detachInstance → fixFonts → appendChild
```

| 约束 | 说明 |
|------|------|
| variant 切换（`setProperties`）必须在 `detachInstance` 之前 | detach 后无法切换 variant |
| `fixFonts` 必须在 `appendChild` 之前 | 否则 appendChild 触发字体加载报错 |
| detach 后节点不再是 instance | 已知代价，输出中标记为妥协项 |

**`fixFonts` 函数签名（本体见 font-degradation.md）**：

```javascript
await fixFonts(node, degradationMap);
```

`degradationMap` 结构（笔记业务）：
```javascript
{
  'MiSans VF': { family: 'MiSans', styleMap: { 'Medium': 'Medium' }, defaultStyle: 'Regular' },
  'HyperOS Symbols VF': { family: 'MiSans', styleMap: { 'Medium': 'Medium' }, defaultStyle: 'Regular' }
}
```

**文本属性修改场景（非 appendChild）**：先加载降级后字体再改属性：

```javascript
await figma.loadFontAsync({ family: 'MiSans', style: 'Regular' });
await figma.loadFontAsync({ family: 'MiSans', style: 'Medium' });
// 然后才能修改 fontSize / characters 等
```

### Phase 6：验证

> **🔁 RE-CHECK（验证前必读）**：
> - common-rules §6.2（20 项强制清单）
> - common-rules §6.3（每 frame 写入完成后的强制截图）
> - app-variant-map-{app}.md 「§C 应用专项验证」（如有）
> - **必须调用 `protocol.md §6` 的 `verifyChecklist(frame, spec)` 函数**（本节列签名 + spec 模板，函数本体在 protocol.md §6）。错误项 > 0 不得汇报"适配完成"

布局执行完成后，先按对应布局 reference 的验收标准验证；如存在独立验证 reference，再做最终校验。

### 自动验证函数（必调用，每 frame 写入完成后立即跑）

> 📌 **单一权威源**：`verifyChecklist` 函数本体定义在 **`references/component-placement-protocol.md §6`**。本节只列签名 + spec 模板 + 调用方式 + 9 项检查清单。Phase 6 启动前必须已读 protocol.md（Phase 3 已要求）。

**函数签名 + 调用模式**：

```javascript
// verifyChecklist 定义于 protocol.md §6；返回 errors[]，长度 > 0 即未通过
const errors = await verifyChecklist(frame, spec);
if (errors.length > 0) {
  // 修复后重新跑，禁止 silently 通过
  return { status: 'failed', errors };
}
```

**spec 模板（Pad 竖 NLC 覆盖 + L 编辑模式 示例）**：

```javascript
// Phase 4 step 7 输出（单一权威 source）
const scenarioFlags = {
  LEditMode: true,    // 来自 app-variant-map §0「scenarioFlags 导出信号表」lookup
  NEditMode: false,
  CEditMode: false,
  NCovering: true,    // Pad 竖 NLC default 覆盖（per app-variant-map §0.1a）
};

// spec 由 scenarioFlags + 设备/布局 自动推导（不手写 mask/editMask 字段）
const spec = {
  frameW: 949, frameH: 1422,
  cornerRadius: 34,
  statusBarH: 34,                    // pad 强制 34（自然 38）
  cols: { 'L 栏': 428, 'C 栏': 521 },
  sidebar: { h: 1388 },              // 仅 Pad NLC 时设
  divider: true,                     // LC / NLC 模式 true，NC / C 通栏 false
  componentChecks: [                 // 任何需要 reflow 自检的组件
    { id: '1xxx:yyyy', label: 'L NavBar_09', w: 428, h: 56 },
    { id: '1xxx:yyyy', label: 'L SearchBar_05', w: 412, h: 56 },
  ]
  // mask / editMask 字段已废弃 —— 由 scenarioFlags trigger，protocol.md §6 ⑩~⑫ 自动检查
};

// 调用必须三参数齐全（scenarioFlags 缺失则 §6.2 #23 报错）
const errors = await verifyChecklist(frame, spec, scenarioFlags);
```

**字段约定**：

| 字段 | 来源 | 必填 |
|---|---|---|
| `frameW` / `frameH` / `cornerRadius` / `statusBarH` | `device-dimensions.md` | ✅ |
| `cols` | `device-dimensions.md` 分栏宽度 | ✅ |
| `sidebar.h` | `device-dimensions.md` + 应用规则 | Pad NLC 时 ✅ |
| `divider` | layoutType（LC/NLC = true）| ✅ |
| `componentChecks` | Phase 4 `componentTaskList` 派生 | ✅ |
| ~~`mask` / `editMask` / `NCoverMask`~~ | **已废弃** —— `scenarioFlags` 派生 | — |

**verifyChecklist 内部 13 项检查（与 protocol.md §6 一一对应）**：

| 项 | 检查内容 | trigger |
|---|---|---|
| ① | StatusBar：宽度 / 高度 / `y=0`（Pad 自然 38 → 必须强制 34）| 通用 |
| ② | `frame.cornerRadius === spec.cornerRadius` | 通用 |
| ③ | `frame.fills[0].boundVariables.color` 已绑定 token | 通用 |
| ④ | 栏宽 与 `spec.cols` 一致 | 通用 |
| ⑤ | 杆子 风满 + `fills=[]` 透明 + 最顶 z-order | 通用 |
| ⑥ | Sidebar 高度（`spec.sidebar` 时）| Pad NLC |
| ⑦ | `componentChecks` reflow 自检（width / height / x / y 偏差 < 0.5dp）| 通用 |
| ⑧ | 遮罩-N覆盖 存在 + 绑定 `遮罩色/mask` token | `flags.NCovering` |
| ⑨ | 栏间分割线 fill 绑定 `分割线色/outline` token | LC / NLC |
| **⑩** | **遮罩-编辑 (Cw × frameH) + L 栏 frame 直接子级 promote** (§3.7a) | **`flags.LEditMode`** |
| **⑪** | **多 mask z-order 完全一致 (§3.7b)** | **`flags.LEditMode + NCovering`** |
| **⑫** | **遮罩-编辑 不存在** (§3.7a 末) | **`flags.CEditMode` only** |
| **⑬** | **scenarioFlags 一致性** (§6.2 #23) | flags 缺失 + spec 含 mask 字段时报错 |

### 验收 自动 vs 手动 分类（独立维度，与 §6.2 互补）

> 📌 **权威源**：完整 24 项检查清单在 **`common-rules.md §6.2`**。本表是**互补维度** —— 把 24 项按 "verifyChecklist 自动覆盖" vs "需手动校验" 分类，便于 AI 区分调用策略。

**A. verifyChecklist 自动覆盖（13 项 ↔ protocol.md §6 内的 ①~⑬）**：

| `verifyChecklist` 项 | §6.2 # | 说明 |
|---|---|---|
| ① StatusBar 高 / 宽 / y=0 | §6.2 #4-6 | Pad 强制 34（自然 38）|
| ② cornerRadius | §6.2 #3 | Fold 50 / Pad 34 |
| ③ frame fill token | §6.2 #17 | 绑定 `背景色/surface` |
| ④ 栏宽 | §6.2 #7 | 与 device-dimensions 一致 |
| ⑤ 杆子 风满 + 透明 + 最顶 z | §6.2 #11 | 全模式 |
| ⑥ Sidebar 高度 | §6.2 #9 | Pad NLC 仅 |
| ⑦ componentChecks reflow | §6.2 #8 | 列出的所有标准组件 |
| ⑧ 遮罩-N覆盖 + token | §6.2 #10 | `flags.NCovering` |
| ⑨ 栏间分割线 token | §6.2 #12 | LC / NLC 仅 |
| **⑩ 遮罩-编辑 (§3.7a)** | **§6.2 #21** | **`flags.LEditMode` ★ NEW** |
| **⑪ 多 mask z-order (§3.7b)** | **§6.2 #22** | **`flags.LEditMode + NCovering` ★ NEW** |
| **⑫ C 编辑无 mask** | **§6.2 #24** | **`flags.CEditMode` only ★ NEW** |
| **⑬ scenarioFlags 一致性** | **§6.2 #23** | **flags 缺失 + spec mask 矛盾时 ★ NEW** |

**B. 必须手动校验（剩余 11 项，verifyChecklist 不覆盖）**：

| §6.2 # | 项目 | 备注 |
|---|---|---|
| #1 | Section 命名（含测试名 + 日期）| 用户确认 |
| #2 | 4 版本完整性（`targetVariantPlan`）| 用户确认 |
| #14 | Pad 横 NLC Sidebar 阴影越过 N\|L 边界 | 截图视觉验证 |
| #15 | 浮动 Tab / 键盘 / 玻璃材质 删除或 visible=false | 截图 |
| #16 | 组件库时间戳（视觉异常时 `search_design_system` 比 `updatedAt`）| §3.10 |
| §6.1 | 容器 resize 一致性（main / L / C / N 与子节点同步）| 结构变更后必查 |
| §6.3 | 每 frame 写入完成后立即截图 | 强制 |
| §3.4a | 通用内容容器（List / Search / Chip / Detail）合算 padding | 与 app-variant-map §A 应用表对照 |
| device-dim | 栏顶 6dp 间距（NavBar / Search / Chip 起 y=6；Sidebar 例外 y=0）| 「基本对齐方式」|
| device-dim | 工具栏 instance 栏风满（不缩 `栏W-48`）；胶囊层另算 | 「工具栏规格」|
| app §C | 应用专项验证（如笔记 TI bottom flush / Detail h 延伸）| `app-variant-map-{app}.md §C` |

**调用流程**：

1. 每完成一个 frame → 立即 `await verifyChecklist(frame, spec)`（A 部分自动）
2. `errors.length > 0` → 修复（按 common-rules §6.0.1 优先级：尺寸 → 位置 → 文本）
3. `errors === 0` + B 部分手动项全部通过 → 进入下一 frame
4. 4 frame 全部完成后 → 总验证（B 部分必查）

验证循环最多 3 次；仍 fail → 中止汇报，向用户报告未通过项 + 缺口。

### Phase 6.5：完成报告前 3 问 gate（hard gate，必通过才能汇报"适配完成"）

> **作用**：阻止 verifyChecklist 自动检查 + 截图通过后即匆忙汇报，强制 AI 在汇报前明确回答 trigger 状态 / 适用规则 / 实际产物 三个问题，发现自检漏项。

**3 问 强制回答**（每个问题必须 explicit reference 形式回答，含 file:line 锚点；含糊回答视为未通过）：

| Q | 问题 | 通过标准 |
|---|---|---|
| Q1 | 该 source frame 的 interaction state 是什么？（trigger 标识）| 一句话 + scenarioFlags JSON 实际值，如 `LEditMode=true (源 frame "列表选择-已选" 命中 §0.1b 信号)` |
| Q2 | `common-rules §3.7 / §3.7a / §3.7b` 哪些节被本次 trigger 激活？| 列出激活节 + 对应 mask 名称（如 `§3.7a → 遮罩-编辑(C 列)`，`§3.7 不激活`）|
| Q3 | 这些 mask / z-order 在最终 Figma frame 中的实际位置？| 每 mask 报 frame.children index + 节点名（如 `frame.children[1]: 遮罩-编辑`）；scenarioFlags 任一 flag=true 但对应 mask 缺席 → fail |

**通过条件**：
- 3 问全部 explicit 回答 + 回答内容与 verifyChecklist errors=0 结果一致
- 任一回答为 "未确认" / "default" / "推测" 等含糊表达 → fail，重新验证

**fail 处理**：
- Q1 fail → Phase 4 step 7 重新执行（scenarioFlags 缺失）
- Q2 fail → Phase 5 RE-CHECK 表 §3.7~§3.7b 重读，识别遗漏 trigger
- Q3 fail → 补加遗漏 mask + verifyChecklist 重新执行

**示例（笔记 编辑模式V2 适配）**：
```
Q1: LEditMode=true (源 "列表选择-已选" 含 "已选" 信号 + List_Notes_04 + ToolBar_01 → §0.1b 匹配)
    NCovering=true (Pad 竖 default per §0.1a 覆盖)
    NEditMode=false, CEditMode=false
Q2: §3.7 (NCovering=true → 遮罩-N覆盖) + §3.7a (LEditMode=true → 遮罩-编辑) + §3.7b (两者同时 → 多 mask z-order)
Q3: frame.children = [main, 状态栏, 遮罩-编辑, 分割线, L 栏, 遮罩-N覆盖, Sidebar, 杆子] (§3.7b 修订 一致 — 状态栏 在两遮罩之下, 遮罩 按列归属覆盖含 status bar 区段)
```

## 输出要求

最终向用户汇报：

1. 目标设备和布局类型的判断结果
2. 实际生成的设备 × 方向版本列表（如 `Fold横屏 / Fold竖屏 / Pad横屏 / Pad竖屏`）
3. 适配完成状态（成功 / 部分成功）
4. 验证结果摘要
5. 如有妥协项（如图片占位、字体降级、组件记录待复探，或经用户确认后省略某些方向版本），明确列出
6. 如有字体降级，列出具体映射：哪些字体被降级、降级到什么字体、涉及哪些节点
7. 不要输出冗长的方案说明或设计建议。
