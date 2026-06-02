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
> - `common-rules-principles.md §1` 检索与复用边界（当前 page 隔离 / 整页复用条件 / 标准实例必探查）
> - `common-rules-principles.md §2` 内容来源边界（密度守恒 / 业务内容 vs 结构组件 / 宽 frame 行为）
> - `common-rules-principles.md §0 #11~#17`（落位协议 / token 绑定 / 数据不猜测 / 栏前缀格式 / Phase 2 塌缩 / 用户拒绝精确范围 / **遮罩+z-order 禁止推测**）

### Phase 0.0a：csv-pipeline 新鲜度检查（auto-extract gate）

> **作用**（2026-05-25 新增，仅在 workflow-reform 进行期间活性）：随着 `csv-pipeline/` 映射流水线引入，若设计师上游 CSV (`csv-pipeline/mapping-input/*.csv`) 比最近一次抽取 (`csv-pipeline/mapping-output/.last-extract`) 更新，则自动重新抽取后再继续。

**判定逻辑**：

```
sentinel = csv-pipeline/mapping-output/.last-extract (mtime)
sources  = csv-pipeline/mapping-input/*.csv (各自 mtime)

if any(source.mtime > sentinel.mtime):
    run: cd csv-pipeline && npm run extract
    report: ✓ Phase 0.0a: mapping-output 已重新抽取（检测到 source 变更）
else:
    skip: ✓ Phase 0.0a: mapping-output 新鲜（无需重新抽取）
```

**等价命令**：`npm run status` 一行可做同样判定（输出含"建议重新抽取"提示）。

**例外**：
- 当 `csv-pipeline/` 自身（脚本修改等）为显式 task 时，跳过自动抽取（由用户直接掌控）
- 当 user 正在 `csv-pipeline/mapping-input/` 内编辑时，先向 user 确认再继续

**有效期限**：workflow-reform 全部 Stage 完成后移除本 Phase 0.0a（csv-pipeline 转入稳定运营阶段，无需独立触发）。

---

### Phase 0.0：权威源 inventory gate（soft gate, .md-only 为 default）

> **作用**（2026-05-18 修订）：默认信任 `references/app-variant-map-{app}.md`，**不再每次 session 强制 user 提供 CSV**。CSV 仅在 .md 编辑 / 新增 mapping 条目时显式触发。

**默认行为（任务 ≠ .md 编辑时）**：

| # | 检查项 | 通过条件 |
|---|---|---|
| 1 | `app-variant-map-{app}.md` 存在且任务路径有覆盖 | git-tracked 文件直接 read，无需 user 确认 |
| 2 | 既存映射表条目 `(／／／)` / `待补` / `需要Check` 标记 | 任务路径上命中 → 必须 user confirm 后才能继续，**禁止推测**（`common-rules-principles.md §0 #13`）|

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

### Phase 0.1：APP + 画面识别确认（hard gate）

> **作用**：防止仅凭 source frame metadata 误判 framework（如待办=NLC 被误判为 NL）。APP 名 + 画面场景是 `app-variant-map-{app}.md` lookup 的前提。

**强制步骤**：

1. **向 user 确认**：「本次适配的 APP 是什么？适配的是哪个画面 / 子场景？」
   - 若 source frame 名匹配 `references/naming-conventions.md §1` 的正规格式 (`{App}_{Scene}_{State}_{Device}` 或包含 sub-scene 的格式) → 自动提取 app/scene/state/device, 向 user 复述 1 次后进入. 无需追加提问.
   - 若 source frame 名超出正规格式 (e.g. `列表页` / `笔记主页` 这类 non-token 名) → 必须 AskUserQuestion
2. **确定 app-variant-map 文件**：`references/app-variant-map-{app}.md`
   - 文件不存在 → 中止，报告缺口
   - **sub-scene 例外**：`待办` (Tasks) 是 笔记 app 内 子场景（非独立 app）→ 使用 `app-variant-map-笔记.md` + `app-Notes-mapping.csv`. 源 frame 名为 `待办_*` 时仍按 `app = 笔记` 处理
3. **确定子场景**：如 笔记/待办、默认/编辑 等
4. **强制读取 `csv-pipeline/mapping-input/结构变化表-{App}.csv` 任务 scope 全部相关行**（uiElement × device 矩阵）：
   - app + scene 确定后 **第一步**就读 CSV，**Phase 1 metadata / 字体预检 之前**
   - 仅靠 mapping-output CSV 不够 — input CSV 的多行合并单元格 / 备注列 / 子场景标记承载映射意图（如 待办「手机 inline list+detail，Fold/Pad 分 L/C」从 line 800 「待办详情 DetailTask / NLC」行 + 手机列空白 + Fold/Pad 列 `C栏:DetailTask_01` 才能读出）
   - 输出（向 user 1 行）：`✓ Phase 0.1 CSV: 结构变化表-{App}.csv line {N}-{M} 已读, 待办全 uiElement × device 映射已内化`
   - 读取后才能进入 Phase 1
5. **输出**（1 行）：`✓ Phase 0.1: app={app}, scene={子场景}, variant-map=app-variant-map-{app}.md`

**通过条件**：user 确认 APP + 画面后才可进入 Phase 1。

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
> - `common-rules-principles.md §0 #13` 数据不确定时报告，禁止猜测（CSV / metadata 异常时立即停止）
> - `references/font-degradation.md` —— `fontDegradationMap` 结构示例与降级表（本文档 Phase 5 后「字体降级规则」节为 pointer）

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
| `sourceInnerStateMap` | 源稿每个组件实例 → 内部 INSTANCE 子节点的 `componentProperties` 快照（递归收集 状态 / 数量 / 材质 / 编辑态 / 文本 / instance-swap 等业务态）| 源 frame 全部组件 inner state 已 dump，作为 Phase 5 `placeStandardComponent({ sourceInst })` 与 Phase 6 verifyChecklist ⑯ 的同步源 |
| `sourceVisibleInventory` | 源 frame 全部 `visible=true` instance 的分类 dump (Phase 1 step 5, 2026-05-31 添加) | **3 分类必须**: ① `[bar]` (StatusBar / NavBar / BottomBar / TabBar / SwipeIndicator 等), ② `[main-content]` (List / Detail / Sidebar / SearchBar / Chip / TextInput 等 frame body), ③ `[overlay]` (Sidebar_Notes / FloatingWindow / DrawerWindow / Modal / ActionSheet / Menu / Picker / Dialog 等 active state overlay layer). 所有 `[overlay]` entry 必须包含到 Phase 4 componentTaskList, 并向所有 target frame propagate (除非用户明确指示 overlay 仅适用于单一 device). [overlay] active state 是 source 在该画面展示了 overlay 弹出状态的信号 = 用户意图. **禁止默认遗漏** |

**Phase 1 step 5 强制 user 输出** (sourceVisibleInventory dump 后立即 1 行报告):

```
✓ Phase 1 source state: 持有 [overlay] (e.g. Sidebar_Notes_01 attached form). 计划向全部 target frame propagate 适用.
   或
✓ Phase 1 source state: 无 [overlay]. main-content + bars only.
```

发现 [overlay] 时, 除非 user 明示「本 task 排除 overlay」, **适用于所有 target frame**. user 看到本 1 行输出后可立即修正. 遗漏后于 Phase 5 后段发现 → 产生所有 frame 修改成本 (代表案例: 2026-05-31 笔记 Sidebar_Notes / Notes_FloatingWindow 遗漏 → 7 frame 全部修改).

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
> - 默认必出 4 版本（Fold内横 / Fold内竖 / Pad横 / Pad竖），用户明确缩小范围才减

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
- **NL**（导航-列表）：源页面只有列表（含 ToolBar 创建工具），**无 detail 页面**；适合 Sidebar + 列表（Pad）/ C 单栏 fallback（Fold 内）
- **NC**（导航-内容）：源页面有底部 Tab 导航但无需列表栏，适合分栏
- **LC**（列表-内容）：源页面是列表 + 详情的组合，无底部 Tab 导航，适合分栏
- **C**（通栏）：源页面是单一内容页（设置、关于等），适合通栏拉宽

判断依据（**先看 detail 是否存在**）：

| 源 frame 包含 | framework |
|---|---|
| 底部 Tab + 列表 + detail | **NLC** |
| 底部 Tab + detail（无列表） | **NC** |
| 列表 + detail（无底部 Tab） | **LC** |
| **列表 + ToolBar（无 detail，无底部 Tab）** | **NL** ← list-only 核心分支 |
| 底部 Tab + 列表（无 detail） | **NL** |
| 单一 detail 内容 | **C** |

**list-only 强制 NL 规则**（重要）：

- 源 frame 中 detail 页面**不存在时** framework = **NL** 确定。**禁止优先判定为 NLC / LC**。
- 「detail 不存在 → C 栏怎么填充」类问题是**错误问题**。NL 本身没有 C 栏。
- NL 映射 lookup 必须从 `app-variant-map-{app}.md` 的 **NL 行**查找。从 NLC / LC 行 lookup 会产生虚假 detail / 错误 list variant（例：正确答案是 `_05` 而非 `List_Notes_03`）。
- Fold 内屏 NL → **C 单栏 fallback**（per `app-variant-map-{app}.md §0 #9`「Fold 内 NL→C 单栏 fallback 通则」）。list / 顶部模块 / ToolBar 全部直接堆叠在 C 单栏中。
- Pad NL = N 栏（Sidebar）+ L 栏（list 统合单栏）。无 C 栏。各栏 padding 按 device-dimensions「Pad NL 展开 / 收起」spec 适用。

> **AskUserQuestion 指南**：framework 在决策树上模糊时，**不可从「C 栏处理方法」开始提问**（会锁定 NLC framing）。必须将 **framework 本身**（NL vs NLC vs LC vs NC vs C）作为首个问题的选项呈现。

- 用户明确指定布局类型时，以用户指定为准

加载设备尺寸规则：读取 `references/layouts/device-dimensions.md` 获取目标设备的画布尺寸和栏宽参数。

本阶段必须形成 `targetVariantPlan`，至少明确以下四项是否需要生成 **+ 各 frame 的 framework**:

| target | framework 决定 |
|---|---|
| `Fold内横` | NLC 不可（仅 Pad）；其他 framework 按上方决策树。**list-only 时 = Fold内 NL→C 单栏 fallback** |
| `Fold内竖` | 同上 |
| `Pad-横屏` | list-only 时 = **Pad NL**（Sidebar + L 单栏，无 C）；list+detail 时 = NLC |
| `Pad-竖屏` | 同上 |

若用户没有缩小范围，上述四项默认都为必做项；后续写入与验证都必须以这份计划为准，不允许执行中途静默漏掉竖屏版本。

**framework × device 矩阵一致性验证**：4 frame 的 framework 不一致时（例：Fold = LC + Pad = NLC）属正常，但**全部来自同一 source 时 framework 本身必须一致**（list-only → 全部 NL fallback / list+detail → LC + NLC 配对）。发现 framework 不一致时须向 user 确认意图。

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
   - ✅ 正确问法："`笔记首页` + `笔记详情页` 是 list/detail 钻取关系 → 4 个适配 frame：Fold内横/Fold内竖 = LC，Pad横/Pad竖 = NLC（按 app-variant-map §0.1a 默认）。是否正确？"
   - 用户若希望 Pad 也用 LC（如秘密笔记），必须 **显式偏离**并记录在妥协项

> **本规则的根因**：2026-05-16 笔记多端适配任务中，AI 误把"2 源 frame × 4 设备 = 8 frame"作为默认计数，导致一半 frame 的 C 栏空缺。此规则将检测点固化在 Phase 2 计数阶段，并强制 AskUserQuestion 暴露计数结果，避免错误计数被用户的"完整执行"答复掩盖。

6. **特殊子场景 framework 异设备分化检测**：AI提问 / 录音 / 设置 等子场景的 framework 可能**按 device 不同**（如 Fold=C, Pad=NC）。Phase 2 判定 framework 时必须读取 CSV `结构变化表-{App}.csv` **该行**的每个 device 列 header，**禁止**仅从源 frame 外观推断单一 framework 后全设备共用。异设备 framework 时 `targetVariantPlan` 各 frame 的 layoutType 独立标注。参见 `app-variant-map-笔记.md §0.1-AI`。

### Phase 3：加载通用规则

**强制读取 7 文件全文** (单纯加载阶段, 未读时禁止进入 Phase 4/5):

1. `references/common-rules-principles.md` — §0 (28 原则) + §1/§2 边界 + §3.11/§3.13/§3.14/§3.15 元规则
2. `references/common-rules-instance.md` — §3.1~§3.6 实例闭环 + §3.10/§3.12 + §4 写入优先级 (§3.6 reflow 陷阱 = 18+ 历史错误核心)
3. `references/common-rules-mask-zorder.md` — §3.7~§3.7b 遮罩 z-order + §3.8 分割线 + §3.9 pointer
4. `references/common-rules-verify.md` — §5 落位 + §6 检查清单 25 项
5. `references/common-rules-prohibit.md` — §7 禁止索引
6. `references/component-placement-protocol.md` — `placeStandardComponent` / `buildTokenCache` / `bindFill` / `verifyChecklist` 4 函数签名 + 调用顺序 (函数本体 = `csv-pipeline/runtime/placement.ts` + `verify.ts`)
7. `references/font-degradation.md` — `fixFonts` 函数本体 + 降级 / 强制顺序 / degradationMap

应用专用规则 = `app-variant-map-{app}.md` (Phase 4 加载).

> **关键决定**: `resetOverrides` 默认 **OFF** (reset → width override 清, hug content reflow → 过去最频繁的 fail root cause).

### Phase 4：生成页面级组件任务 + Token 缓存

> **🔁 RE-CHECK（Phase 4 进入时必读）**：
> - `common-rules-instance.md §3.1` 基础组件清单（必入清单的最少 9 个 family）
> - `common-rules-principles.md §0 #13` 数据不确定时报告，禁止猜测（CSV "需要Check" / "待补" 必须用户确认）
> - app-variant-map-{app}.md §0 应用规则要点 + §0.6 历史踩坑

**强制 7 步**（顺序固定，缺一不可）：

| # | 动作 | 函数本体 | 输出 / 副作用 |
|---|------|---------|--------------|
| 1 | 盘点页面级关键组件实例（基于 Phase 1 metadata）| — | 实例列表 |
| 2 | 识别每个实例的 `resolvedUiElement` | — | 业务语义标签 |
| 3 | 推导 `screenMode`（由 `layoutType` + 栏位 / 子场景）| — | screenMode 值 |
| 4 | 批量查询 `app-variant-map` (`appName + device + screenMode + resolvedUiElement`) | `references/app-variant-map-{app}.md` | 各组件 variantId |
| 5 | 生成 `componentTaskList`：每条目含 **`variantId + 目标 x/y/w/h + parent + z-order + sourceDetected + status`**。**`h` 必须从 `device-dimensions.md` 查表获取，禁止沿用源稿高度**（例：Fold/Pad 中标题 56dp，不是手机大标题 116dp；TopBar 自然高度 56dp，不是 NavBar+SearchBar 算术和 100dp）。查表后与 `mainComponent.height` 比对，取 device-dim spec 值 | — | 完整任务清单 |
| 6 | **执行 `TOKEN_CACHE = await buildTokenCache()`**（一次性缓存所有库 token，赋全局变量） | **`protocol.md §4`** | `TOKEN_CACHE.color` 就绪 |
| **7** | **导出 `scenarioFlags` JSON（trigger 单一权威 source）** — 仅使用 `app-variant-map-{app}.md §0「scenarioFlags 导出信号表」` lookup 结果，**禁止推测** | `app-variant-map-{app}.md` | `{ LEditMode, NEditMode, CEditMode, NCovering, ... }` |

> ⚠️ **Step 7 = Phase 5/6 的 single source of truth**：后续 mask 决定 / spec auto-derive / verifyChecklist 自动检查 全部引用 `scenarioFlags`。本 step 缺失即 Phase 5 进入阻断。
>
> ⚠️ flag 导出规则仅来自各 app `app-variant-map-{app}.md §0` 的「scenarioFlags 导出信号表」。表缺失或信号无匹配 → 必须 user confirm，**禁止推测** entries（`common-rules-principles.md §0 #13, #17`）。

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

### Phase 4.5：Phase 5 进入前强制验证 gate（hard gate，全部通过才可进入 Phase 5）

> **作用**：2026-05-21 session 根因分析后追加。防止 stale key / 错误 set / 源稿不存在组件 / v0.8 库混入等问题进入 Phase 5 后才暴露。

#### Gate A：key validation（库归属验证）

componentTaskList 中所有 set key 必须确认归属于文件已订阅的权威库：

```
OS4_UI_KIT_LIB_KEY = 'lk-99b74bcae3830e7fa42bff92b9af247770c40d33650ac8e37d311dbcd02321a55beac93407846a401603f5a1125359b845a83ebd62c2c10b2e56f524f729b9d6'
业务组件库_LIB_KEY = 'lk-5e5ef4ed4b44063baacfd6b3c0d26f1e054d3e79c42cd17c69cd3a63b96c95827462d9c7b516f941f3d8f83ed15a2ac273b99110e7fbb595c92eefaf58488b29'
```

验证方式：`search_design_system(query=setName, includeLibraryKeys=[上述两 key])` → 结果中 `componentKey` 与 §0.4 记录一致 → pass。不一致 → 阻断 + 用搜索结果更新 §0.4 + 重新 import。

**特别禁止**：`Xiaomi HyperOS v0.8`（libraryKey `lk-bd807c2a...`）的任何组件。v0.8 与 OS4 UI Kit 存在大量同名 set，cross-library import 可能静默成功但落位旧版本组件。

#### Gate B：source cross-check（源稿对照验证）

componentTaskList 每条目必须通过以下 **3 项双向**检查（**双向 = 源稿 → 适配 + CSV → 适配 同时执行**，缺一不可）：

| # | 检查方向 | 检查 | 通过条件 | 未通过处理 |
|---|------|------|---------|----------|
| 1 | 源稿 → 适配 | **源稿存在性**（防 spurious 添加）| source frame metadata 中存在同语义组件（`resolvedUiElement` 匹配）| 不存在 → 删除该条目（§2.1 密度守恒：源稿无 → 目标无）|
| 2 | **CSV → 适配**（防 phone-context 误传递）| **CSV 映射表行存在性**：`app-{App}-mapping.csv` 中 `(子场景, device, layoutType, lane, resolvedUiElement)` 行必须存在 | 行 absent → **删除** (例: 编辑模式行中无 TextInput → 不在 C 栏绘制 TextInput). **「源 phone frame 有 X」 ≠ 「目标 device 编辑模式有 X」** — 源稿 phone DrawerWindow / AI 对话等 phone-only context 附属组件, 禁止在 device 别子场景转换中自动 transfer |
| 2a | **state-column matrix activity check**（state 维度活性检查，2026-05-29 追加）| input CSV `结构变化表-{App}.csv` 每个 uiElement 行，**当前 state 行的 target device 列 cell 为空 → 该组件不适配**。仅看「默认模式行」就把 SearchBar / NavBar 默认等补入 = 违规。每个 uiElement × (state, device) cell 必须显式 lookup | cell 为空仍添加 → 删除。例：待办 编辑未选 → input CSV `line 747 SearchBar` 行的「编辑模式」列本身缺失 → 编辑未选 4 frame 全部不放 SearchBar。仅 lookup 默认 NLC 行 (line 761) 会导致 SearchBar 误加入（本规则缺失时实际发生过）|
| 3 | ComponentSet 出处 | 优先使用 `source instance.mainComponent.parent` 的 set; 该 set 内含目标 variant → 直接使用 | set 内无目标 variant → search_design_system. **但顶层 variant 值依 §0 #22, CSV 映射表优先 (源稿 variant ≠ 自动权威)** |

> **双向检查的含义** (2026-05-28 笔记编辑模式 Pad 适配回顾时添加)：
> - 仅单向 (源稿 → 适用) 检查时, 会出现「源 frame 有 X → 默认适用」误判 (例: 笔记详情页 phone DrawerWindow 的 TextInput 被不当自动添加到编辑模式 Pad C 栏)
> - 仅单向 (CSV → 适用) 检查时, 会出现「CSV 行存在 → 默认适用」误判 (例: 源稿无 NoticeBar, 仅因 CSV 行存在而添加)
> - 双向均通过才适用. 一方明确 absent → 删除 / 双方一致 → 适用 / **仅 CSV absent + 源稿有** → 向 user 确认是否需要 CSV update.

#### Gate C：belongsToSet 强制列

componentTaskList 每行必须含 `belongsToSet`（set name + set key + library name）字段。该字段由 Gate A + B 产出。空白行 = Phase 5 进入阻断。

**输出**（向 user 显示）：

```
✓ Phase 4.5 gate: N 条目 key 验证通过 / M 条目源稿对照通过 / 0 条目来自 v0.8
```

### Phase 5：读取布局 reference 并执行

> **🔁 RE-CHECK（落位前必读）**：每次进入 Phase 5 必须重读 `common-rules-instance.md` 全文 (§3.6 reflow 陷阱 + §3.10 库 updatedAt 比较) + `common-rules-mask-zorder.md` 全文 (§3.7~§3.7b 遮罩 z-order + §3.7a-NL「NL framework + LEditMode 一律 mask 不渲染」 + §3.8 分割线 + §3.9 Sidebar 阴影) + `device-dimensions.md`「工具栏规格」(ToolBar 胶囊 width spec, verifyChecklist ⑭ 自动检查).
>
> **关键决定**：`resetOverrides` 默认 **OFF**（reset → width override 清, hug content reflow → 最频繁的 failure root cause）.
>
> **任何组件 swap / resize / 落位** 必须调用 `placeStandardComponent({...})`（函数本体 = `csv-pipeline/runtime/placement.ts`, 签名 + 调用顺序 = 本文档 「标准落位代码模板」节）, 禁止 inline 临时序列.

#### Phase 5 prior frames consistency check (hard gate, 2026-05-31 添加)

> **作用**: 在已有 frame 已适用的状态下追加新 frame 时 (例: 完成最初 4 个 frame 后 user 要求追加 收起态 / Fold外) **自动保证与已有 frame 的 component list 一致性**. 仅写入新 frame 自身 main content → 防止 `[overlay]` / 公共 component 遗漏.

**触发**: 进入 Phase 5 新 frame N 写入时 (除 frame N=1 外, frame N≥2 全部适用).

**强制 step (frame 落位前必须输出 1 行)**:

```
✓ Phase 5 frame {N} prior consistency: prior {N-1} frames 的 [overlay] = [Sidebar_Notes / Notes_FloatingWindow / ...] 
  → 本 frame 计划适用: [Notes_FloatingWindow_01 (Pad device 映射 per §0.1 #11)] / [Sidebar_Notes_01 (Fold device 映射 per §0.1 #10)] / [无 — 理由: ...]
```

**判定规则**:

| prior frame component | 新 frame 适用 | device 映射 |
|---|---|---|
| `[overlay]` Sidebar_Notes (Fold attached form) | Fold device → 适用; Pad device → 依 §0.1 #11 规则转换为 `Notes_FloatingWindow_01` | 通过 mapping CSV `Overay 行` 按 device 查询 |
| `[overlay]` Notes_FloatingWindow (Pad 浮窗) | Pad device → 适用; Fold device → 依 §0.1 #10 规则转换为 `Sidebar_Notes_01` | 同上 |
| `[bar]` StatusBar / SwipeIndicator | 全 device 适用, variant 按 device 查询 | SystemUIKIT-mapping.csv |
| `[main-content]` List / Detail / NavBar 等 | 全 device 适用, variant + size 按 device | app-mapping CSV |
| `[overlay]` 不在 prior frame 中, 仅新 frame 新增 | 必须 user explicit 明示 (禁止默认添加) | — |

**遗漏自动检查 (gate fail 处理)**:
- prior frame 全部 ∋ X (overlay class) 且新 frame 中存在 X mapping → 未适用 → **gate fail, 修正后重新进入**
- prior frame 全部 ∌ X 但新 frame 中追加了 X → 必须 user explicit 明示 (无明示则 fail)

**代表回顾 (2026-05-31 笔记 task)**:
- 第 1 次遗漏: 写入最初 4 个 frame 时, source `[overlay]` Sidebar_Notes 全部遗漏 → 经 user 指出后追加
- 第 2 次遗漏: 追加 frame 5,6,7 时, frame 6,7 (Pad NLC 收起) 的 `Notes_FloatingWindow` 再次遗漏 → 经 user 指出后追加
- 引入本规则后 expected: prior frame 3,4 持有浮窗 → 自动 propagate, 不可遗漏

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

**强制约束 10 项** (核心 4 + 委派): ① 未读布局 reference → 禁止写入 Figma ② reference 栏宽 / 栏位职责 / 验收项 > 模型推断 ③ reference ↔ 源稿冲突 → reference 优先, 无法判断 → 中止 ④ `app-variant-map` 返回 `variant` + 未 hidden/absent → 必须落地 (允许 fallback/blocked 标记, 保留位置, 详 `common-rules-instance.md §4.2`). 其余 6 项 (栏宽 vertical propagation / Auto Layout Fill / 禁止整页 clone 既有 / 复用 ≠ 保留源稿 variant / clone = fallback path / 设计系统检索义务) → 与 `common-rules-principles.md §1.1` + `common-rules-instance.md §3.1 / §4.1` 相同, 以那边为优先.

**目标稿放置约定**: 与源稿同 section 紧邻, 顺序 `Fold 内横 → Fold 内竖 → Pad 横 → Pad 竖`, 偏离时仅在用户明示下允许 + 输出理由. `targetVariantPlan` 未生成项 = 未完成 (禁止仅生成首个 frame 后中止).

### 标准落位代码模板（必用，禁止 inline 临时序列）

> 📌 **单一权威源**：所有函数本体定义在 **`references/component-placement-protocol.md`**。本节只列签名 + 调用顺序 + 笔记应用 token 列表。Phase 5 启动前必须已读 protocol.md（Phase 3 已要求）。

**Phase 5 函数调用顺序（强制）**：

| 阶段 | 函数（签名）| 函数本体定义 | 作用 |
|------|------------|-------------|------|
| Phase 4 完成 | `await buildTokenCache()` | protocol.md §4 | 一次性缓存所有库 token → 全局 `TOKEN_CACHE` |
| Phase 5 落位 each component | `await placeStandardComponent({ inst, targetVariant, parent, x, y, w, h, parentZ?, resetOverrides=false, loadFontFamilies=[], sourceInst?, inheritInnerState=true })` | **protocol.md §2** | swap → FIXED → resize → x/y → **inner state 继承** → 自检 7 步。**`sourceInst` 必传**（来自 Phase 1 `sourceInnerStateMap`），否则 inner 业务态（如 ToolBar 按钮 `状态=禁用` / `数量=1个`）停留在 main default，与源稿不一致。**禁止 shortcut path** = 直接使用 `createInstance() + resize() + x/y` 序列 → inner state 未继承自动 fail（例：2026-05-29 待办 编辑未选 ToolBar 落位为 default `数量=5个 / 状态=常态` → 源稿 `数量=1个 / 状态=禁用` 不一致）。verifyChecklist ⑯ 自动检查 = `sourceInst.componentProperties` ≡ placed `inst.componentProperties`（recursive inner） |
| Phase 5 fill 写入 each node | `await bindFill(node, tokenName, fallbackRGB, opacity=1)` | protocol.md §4 | token lookup + setBoundVariableForPaint，无则 RGB fallback |
| Phase 5 字体不可用时 | `await fixFonts(node, degradationMap)` | `references/font-degradation.md` | clone → swap → detach → fixFonts → appendChild 链中最后一步 |
| Phase 6 frame 完成后 | `const errors = await verifyChecklist(frame, spec, scenarioFlags)` | **`csv-pipeline/runtime/verify.ts`** (映射表 = protocol.md §6) | 16 项自动检测（含 ⑭~⑯ 扩展），`errors.length > 0` 必须修复 |

> **spec-adapter.ts (optional helper, 2026-06-01 添加)**: 将 csv-pipeline 的 spec.json (nested shape, e.g. `spec.frame.w` / `spec.layout.lanes.L.w`) 转换为 verify.ts 读取的 flat shape (`spec.frameW` / `spec.cols['L栏']`) 的 helper. 若实际 task 基于 spec.json, 则 `await Read('csv-pipeline/runtime/spec-adapter.ts')` 后调用 `verifySpec = specToVerifyShape(SPEC, frame)` 1 次即可自动化转换. 使用手填 spec 模板时无需此 helper. **Phase 5 wire-up 的 mandatory 化在 Step 3 (独立 session, 实 figma 1 frame end-to-end 验证后) 决定** — 详情参见 `Improvement_doc/3A-wire-up-plan.md`.

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

**调用示例**（笔记应用 Fold内横 LC frame fill）：
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
>
> 📌 **单一权威源**：栏内 stack 顺序 / frame 直接子节点 z-order 5 种布局 / 编辑模式扩展模板 / 杆子通用规则 → **`protocol.md §3`**（栏 frame z-order + 编辑模式扩展 + 栏内组件 stack 顺序 + C 栏 stack 笔记应用 四表完整定义）。SKILL 不重复，避免两文件不同步。

**Phase 5 调用前必查**：
- `protocol.md §3` 表 1 — 普通 frame z-order（LC / NLC 并列 / NLC 覆盖）
- `protocol.md §3` 表 2 — 编辑模式扩展（LC + L 编辑 / NLC + L 编辑 等）
- `protocol.md §3` 表 3 — 栏内组件 stack 顺序（NavBar 6 → SearchBar 62 → Chip → List → BottomBar mainH-100）
- `protocol.md §3` 表 4 — C 栏 stack（笔记应用 NavBar_Notes / Detail / TextInput bottom flush）
- `protocol.md §3`「杆子通用规则」—— 所有 Pad/Fold 模式 `x=0, width=frameW, fills=[]`，z-order 最顶

### 字体降级规则

> 📌 **单一权威源** = **`references/font-degradation.md`** （Phase 3 必读，已加载到工作记忆）。
>
> 该文件含：① 降级映射表（MiSans VF / HyperOS Symbols VF → MiSans） ② 强制执行顺序 `clone → setProperties → detachInstance → fixFonts → appendChild` + 顺序约束 ③ `fixFonts` 函数本体 + `degradationMap` 结构示例 ④ 文本属性修改场景 (`loadFontAsync` 先行)。
>
> Phase 5 字体不可用实例处理 = 直接调用 `await fixFonts(node, degradationMap)`。函数签名 / degradationMap 字面值 / 顺序约束在两文件不重复声明，避免不同步。
>
> **业务范围**：本表覆盖笔记 / HyperOS 业务全部不可用字体。表外字体降级 fallback = `{family:'MiSans', style:'Regular'}`（详见 font-degradation.md 末段）。

### Phase 6：验证 + 自动验证函数

> **🔁 RE-CHECK** (验证前必读): `common-rules-verify.md §6.2` (25 项强制清单) + `§6.3` (frame 完成后强制截图) + `common-rules-prohibit.md §7` (禁止项索引) + `app-variant-map-{app}.md §C` (应用专用验证, 若存在). 函数本体 = `csv-pipeline/runtime/verify.ts`.

每个 frame 落位完成后立即调用 `await verifyChecklist(frame, spec, scenarioFlags)`. errors.length > 0 → 修复 → 重新 verify (循环 max 3, 仍 fail → 向用户报告 + 中止). 禁止 silently 通过.

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
  cols: { 'L栏': 428, 'C栏': 521 },  // 无空格 (common-rules §0 #14, 与 render-spec 产物一致)
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
| `componentChecks[i].sourceInstId` | Phase 1 `sourceInnerStateMap` 配套（源稿同位置 instance ID）| ✅（涉及业务态组件如 ToolBar / List 编辑态等必填，触发 verifyChecklist ⑯ 内部状态同步检查）|
| ~~`mask` / `editMask` / `NCoverMask`~~ | **已废弃** —— `scenarioFlags` 派生 | — |

**verifyChecklist 内部 16 项检查 (函数本体 = `csv-pipeline/runtime/verify.ts`, 项目 ↔ §6.2 # 映射 = `protocol.md §6`)**：

> 16 项明细 (StatusBar / cornerRadius / frame fill / 栏宽 / 杆子 / Sidebar / componentChecks reflow / N覆盖遮罩 / 分割线 / 编辑遮罩 / 多 mask z / C 编辑无 mask / scenarioFlags 一致性 / ToolBar 胶囊 / Pad N 栏 z / inner 同步) → 不在 SKILL 重复, 直接看 `protocol.md §6`「检查项映射」表 + verify.ts 实现。trigger 条件按 `scenarioFlags` 字段, 详见同表。

### 验收 自动 vs 手动 分类（独立维度，与 §6.2 互补）

> 📌 **权威源**：完整 25 项检查清单在 **`common-rules-verify.md §6.2`**。本表是**互补维度** —— 把 25 项按 "verifyChecklist 自动覆盖" vs "需手动校验" 分类，便于 AI 区分调用策略。

**A. verifyChecklist 自动覆盖（13 项 ↔ protocol.md §6 内的 ①~⑬, ⑭~⑯ 扩展）**：

→ `protocol.md §6` 「检查项映射」表（① StatusBar / ② cornerRadius / ③ frame fill / ④ 栏宽 / ⑤ 杆子 / ⑥ Sidebar / ⑦ componentChecks reflow / ⑧ N覆盖 / ⑨ 分割线 / ⑩ 编辑遮罩 / ⑪ 多 mask z / ⑫ C 编辑无 mask / ⑬ scenarioFlags 一致 / ⑭ ToolBar 胶囊 / ⑮ Pad N 栏 z / ⑯ inner 同步）。SKILL 不重复，避免两文件不同步。

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

1. 每完成一个 frame → 立即 `await verifyChecklist(frame, spec, scenarioFlags)`（A 部分自动；scenarioFlags 必传，缺失则 §6.2 #23 报错）
2. `errors.length > 0` → 修复（按 `common-rules-verify.md §6.0` 优先级：尺寸 → 位置 → 文本）
3. `errors === 0` + B 部分手动项全部通过 → 进入下一 frame
4. 4 frame 全部完成后 → 总验证（B 部分必查）

验证循环最多 3 次；仍 fail → 中止汇报，向用户报告未通过项 + 缺口。

### Phase 6.5：完成报告前 3 问 gate（hard gate，必通过才能汇报"适配完成"）

> **作用**：阻止 verifyChecklist 自动检查 + 截图通过后即匆忙汇报，强制 AI 在汇报前明确回答 trigger 状态 / 适用规则 / 实际产物 三个问题，发现自检漏项。

**3 问 强制回答**（每个问题必须 explicit reference 形式回答，含 file:line 锚点；含糊回答视为未通过）：

| Q | 问题 | 通过标准 |
|---|---|---|
| Q1 | 该 source frame 的 interaction state 是什么？（trigger 标识）| 一句话 + scenarioFlags JSON 实际值，如 `LEditMode=true (源 frame "列表选择-已选" 命中 §0.1b 信号)` |
| Q2 | `common-rules-mask-zorder.md §3.7 / §3.7a / §3.7b` 哪些节被本次 trigger 激活？| 列出激活节 + 对应 mask 名称（如 `§3.7a → 遮罩-编辑(C 列)`，`§3.7 不激活`）|
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
2. 实际生成的设备 × 方向版本列表（如 `Fold内横 / Fold内竖 / Pad横 / Pad竖`）
3. 适配完成状态（成功 / 部分成功）
4. 验证结果摘要
5. 如有妥协项（如图片占位、字体降级、组件记录待复探，或经用户确认后省略某些方向版本），明确列出
6. 如有字体降级，列出具体映射：哪些字体被降级、降级到什么字体、涉及哪些节点
7. 不要输出冗长的方案说明或设计建议。
