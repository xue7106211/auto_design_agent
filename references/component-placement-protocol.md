# 标准组件落位协议 Component Placement Protocol

本文档为多端适配 Skill 中**所有标准组件落位**的强制协议。Skill / 各 layout reference / app-variant-map 必须按本协议执行，禁止 inline 临时序列。

> **🚀 2026-05-28 协议运行时迁移（推荐方式）**：
> 本文档 §2 / §4 的函数本体已抽离为 **`csv-pipeline/runtime/placement.ts`** (单一 source). use_figma 调用前先 `Read` 该文件，将其内容作为 prefix inject 到 use_figma code 中，然后调用 `placeStandardComponent({...})` / `bindFill(...)` / `buildTokenCache(...)` 等 global 函数。
>
> **优势**：① AI 不需每次重新读 600+ 行 protocol.md, 只需读 ~190 行 .ts; ② 函数累积 fix (chip-like 保护 / capsule 后处理 / 等) 在 .ts 中 single source 一致应用; ③ session 间 context 节约. **注**: 本 .md 的 §2 / §4 代码块为 historical reference, 实际执行以 .ts 为权威.

## 0. 设计动机

历次会话发现的 18+ 项错误中，**有效率最高的根因来自三类**：

1. **自带 auto-layout 实例 swap 后 width / height / position reflow**（涵盖 Sidebar / NavBar / SearchBar / TextInput / Detail / List / Chip / BottomBar 等所有标准组件）
2. **每次 inline 写组件落位代码** → 一处漏一步则 N 处同时漏
3. **token 未绑定** → 直接写 RGB

本协议把这三件事固化为可调用的标准序列。SKILL 与 layout reference 在执行 Phase 5 / Phase B-D 时只调用本协议中的函数模板，禁止重新写序列。

## 1. 适用范围

| 触发场景 | 必须走本协议 |
|---|---|
| `clone` 源稿实例 → swap 到目标 variant | ✅ |
| `importComponentByKeyAsync` 后 `createInstance` 落位 | ✅ |
| 已落地实例的 `swapComponent` 或 variant 切换 | ✅ |
| 已落地实例的 `resize` | ✅ |
| 仅修改 `setProperties`（不改尺寸）| 部分（步骤 6 验证仍执行）|

适用组件家族：`StatusBar` / `NavigationBar`（含 `_Notes`）/ `SearchBar` / `SelectableChip` / `List_*` / `Detail_*` / `BottomBar_*`（含 Showcase / NoteEditPanel / Outline / ToolBar）/ `TextInput_*` / `Sidebar_*` / `Fab` / `杆子` / 任意其它带 auto-layout 的标准组件实例。

## 2. 标准落位序列（Canonical Sequence）

### Pre-placement checklist（调用 placeStandardComponent 前强制确认）

每次调用前，调用方必须已确认以下 4 项。任一项未确认 = 禁止调用：

| # | 检查项 | 确认方式 | 违反后果 |
|---|--------|---------|---------|
| 1 | **`y` 值来源** | 从 `device-dimensions.md` 或 `app-variant-map §0.1` 直接 lookup 获得。**禁止 y=0 默认**（C 栏 Detail 即使 NavBar 不渲染也必须 y=62） | Phase 6 verifyChecklist fail |
| 2 | **`h` 值来源** | `mainComponent.height`（自然高度）与 `device-dimensions.md` spec 比对后取值。**禁止沿用源稿高度** | reflow / 尺寸不合格 |
| 3 | **源稿存在性** | source frame metadata 中该组件存在（Phase 1 已确认）。源稿无该组件 → 不配置（§2.1 密度守恒）| 多余组件 / 内容溢出 |
| 4 | **set key 归属** | `belongsToSet.library` ∈ {`Xiaomi Hyper OS4 UI Kit`, `Xiaomi HyperOS 业务组件库`}。**非 v0.8** | 错误库版本落位 |

### 函数实现

> **🚀 函数本体已迁移到 `csv-pipeline/runtime/placement.ts` (2026-05-28)**.
> 本节仅保留 signature + 关键规则. 实际执行 = .ts 文件 inject 到 use_figma code.

**Signature**:
```js
async function placeStandardComponent({
  inst,             // 已 createInstance 的 instance (caller 负责创建)
  targetVariant,    // (可选) 目标 variant component, 提供时执行 swapComponent
  x, y, w, h,       // 栏内坐标系 + 大小. A 类 component 必须 x=0 w=栏W 风满 (§0 #18)
  parent,           // 落位 target parent
  sourceInst,       // (可选) source inst, 用于 inner componentProperties 继承
  opts: {
    fillFirstChild?,    // 默认 true. multi-child component 自动 skip (chip-like 保护)
    resetOverrides?,    // 默认 OFF (关键决定 — reset 会清 width override 触发 reflow)
    inheritInnerState?, // 默认 true (sourceInst 提供时执行)
  }
}) → Promise<string>  // 返回 inst.id
```

**实际执行步骤** (placement.ts 中实现):
1. 迁移到 target parent
2. variant swap (可选)
3. resetOverrides (默认 OFF)
4. sizing FIXED 四项设置
5. resize → x/y
6. inner state 继承 (sourceInst 提供时, 递归 同 index + 同 name 匹配, 复制 componentProperties)
7. children[0] FILL — 仅 single wrapper 应用 (multi-child component 保护, 2026-05-28 chip-like fix)
8. 落位后 self-check (reflow 立即 throw)
9. ToolBar / BottomBar_Showcase 胶囊后处理 (栏W > 440 → 定宽 344 居中, device-dim「工具栏规格」)

**关键决定**:
- `resetOverrides` 默认 OFF — 关键决定 (§3.4 / §3.6 与之统一). reset 会清空 width 等数值 override 触发 hug content reflow, 是落位失败最常见根因. 仅当目标 variant 与源 variant 内部结构差异巨大需要清掉旧 override 时才 `true`.
- `inheritInnerState` 默认 ON — 源稿 inner componentProperties 反映业务态 (如 ToolBar 按钮 `状态=禁用`), 适配 frame 必须同步. 禁止仅 swap 顶层 variant 而忽略 inner state. 源 instance 必须通过 `sourceInst` 传入.
- `fillFirstChild` 默认 ON — `inst.children.length === 1` 时 또는 **SearchBar 系 instance** 时 자동 적용. SearchBar active variant (`_01` 等) inner = `[InputBackground (FILL 必要), CloseButton (FIXED right-aligned)]` 2-child 구조이므로 multi-child 보호 룰 (chip-like) 의 예외. instance 폭 < 자연 392 时 inner reflow 안 되어 CloseButton 잘림 防止 (2026-05-31 笔记搜索 task 에서 폴드 L 폭 353/282 时 close X 잘림 발견, runtime 자동화 채택). 그 외 chip-like (SelectableChip 의 folder icon FIXED + 内容 FILL) 인 multi-child 는 保护 유지.

**变更规则**: placement.ts 为 single source. 修改函数本体只在 .ts commit, 本 .md signature / 规则同步更新即可.

## 3. 父节点结构与 z-order 强制

**栏 frame 的子节点 z-order 模板**（落位前必须先建好骨架）：

| 布局 | 直接子节点（从底到顶） |
|---|---|
| LC（Fold 内屏） | `main` → `状态栏` → `栏间分割线` → `杆子`（最顶 / 透明 / 风满）|
| NLC 并列（Pad 横） | `main`（含 L/C，N 栏空位）→ `状态栏` → `栏间分割线` → `Sidebar`（z-顶其二）→ `杆子`（z-顶其一 / 风满 / 透明）|
| NLC 覆盖（Pad 竖） | `main`（含 L/C）→ `状态栏` → `遮罩-N覆盖` → `栏间分割线` → `Sidebar`（z-顶其二）→ `杆子`（z-顶其一 / 风满 / 透明）|

> **遮罩覆盖范围按列归属决定**：N 覆盖 trigger = Sidebar 列；遮罩覆盖 = 全 frame − Sidebar 列（含状态栏的 N 列以外区段）。因此 `遮罩-N覆盖` 必须**在状态栏之上** —— 状态栏被 dim 是正答，旧版「保证时间 / 信号可读」rationale 已弃用（用户 2026-05-18 显式确认）。Sidebar 必须在 `遮罩-N覆盖` 之上（trigger 列豁免）。**杆子在所有模式下必须最顶 z-order + 透明背景 + 风满 frame 宽**（设备 home indicator 标准）。

### 编辑模式（L 栏 触发遮罩）扩展模板

**触发**：`app-variant-map-{app}.md`「遮罩规则」声明 L 栏编辑触发遮罩（笔记 / 待办：L 栏编辑 → 仅 C 栏覆盖遮罩）。详见 `common-rules-mask-zorder.md §3.7a`。

**结构变更**（与上表区别）：
- `main` 内只保留 C 栏，**L 栏（含 N 栏 Sidebar 如有）必须从 main 内部 promote 到 frame 直接子级**。原因：遮罩在 frame 直接子级，main 内部子节点无法在 frame z-order 中超越遮罩。
- 新增 `遮罩-编辑`（`Cw × frameH`，仅 C 列）放 frame 直接子级。

**z-order（笔记 / 待办 编辑模式 LC + NLC 通用，含多遮罩叠加）**：

| 布局 | frame 直接子级 z-order（从底到顶） |
|---|---|
| LC（Fold） + L 编辑 | `main(C only)` → `状态栏` → `遮罩-编辑(C 列)` → `栏间分割线` → `L 栏` → `杆子` |
| NLC 并列（Pad 横） + L 编辑 | `main(C only)` → `状态栏` → `遮罩-编辑(C 列)` → `栏间分割线` → `L 栏` → `Sidebar` → `杆子` |
| NLC 覆盖（Pad 竖） + L 编辑 | `main(C only)` → `状态栏` → `遮罩-编辑(C 列)` → `栏间分割线` → `L 栏` → `遮罩-N覆盖(全幅)` → `Sidebar` → `杆子` |

**关键**：
- **遮罩按列归属覆盖**：`遮罩-编辑` 覆盖 C 列全域（**含 C 列上方 status bar 区段**），`遮罩-N覆盖` 覆盖 frame − Sidebar 列（**含状态栏除 N 列外区段**）。因此两遮罩都必须**在状态栏之上**。
- `遮罩-编辑` 在 L 栏 **下方** z（L 栏豁免），`遮罩-N覆盖` 在 L 栏 **上方** z（L 栏被覆盖一并 dim）。两遮罩各自有不同的 trigger 控件豁免（L 栏 vs Sidebar），不可并列同 z 处理。
- ❌ **NEVER**：把 `状态栏` 提升到任一遮罩之上（旧版「保证可读」rationale 已弃用）。
- 用户提供 reference frame 时，**直接 dump 其 children z-order 比对**，不要从 spec text 推测多 mask 顺序 —— 但若 reference 与本表冲突（旧版 V2 reference 状态栏放错 z），按本表为准并提示用户更新 reference。

**栏内组件 stack 顺序模板**（顶部 6dp 间距起始）：

| 顺序 | 控件 | y 起点 | 高度 |
|---|---|---|---|
| 1 | NavigationBar | `6` | 56 |
| 2 | SearchBar | `62` | 44 / 56（按 variant）|
| 3 | SelectableChip | y₂ + h₂ | 52 |
| 4 | List | y₃ + h₃ | mainH - top - 100（如有 BottomBar）/ - 0（如无）|
| 5 | BottomBar / ToolBar / Showcase | mainH - 100 | 100 |

> 顺序遵循 device-dimensions.md「基本对齐方式」：标题栏 → 搜索栏 → 标签栏 → 内容 → 底部对齐控件。**与源稿顺序冲突时以本表为准**。

C 栏 stack 顺序（笔记应用）：

| 顺序 | 控件 | y / h |
|---|---|---|
| 1 | NavigationBar_Notes | y=6, h=56 |
| 2 | Detail_Notes | y=62, h=`mainH - 62`（**延伸到 frame 底部**，TextInput 通过 z-order 覆盖最后 92dp）|
| 3 | TextInput_Notes（z-上）| y=`mainH - h`, h=92, **bottom flush frame bottom**（与杆子 16dp 重叠）|

## 4. Token 解析协议

> **🚀 函数本体已迁移到 `csv-pipeline/runtime/placement.ts` (2026-05-28)**.

**Signatures**:
```js
async function buildTokenCache(names: string[]) → Promise<Record<string, Variable>>
//   Phase 4 一次性调用. names 数组限定加载范围 (例: ['背景色/surface', '分割线色/outline', '遮罩色/mask'])
//   赋值 global TOKEN_CACHE 后供 bindFill 使用

async function bindFill(node, tokenName, fallbackRGB, opacity?) → Promise<boolean>
//   绑定 color token 到 node.fills. 返回 true=token 已绑定, false=fallback RGB
//   TOKEN_CACHE 全局必须先 buildTokenCache 后定义

async function bindStrokePaint(tokenName, fallbackRGB, opacity?) → Promise<Paint>
//   创建 stroke paint 对象 (caller 自己赋值给 node.strokes)
//   common-rules-mask-zorder.md §3.8: 栏间分割线 = C 栏 strokeLeftWeight=1 + strokes 绑定
```

**强制规则**: 禁止在 fills 里直接写 RGB SOLID. 必须经 `bindFill(...)` 调用, 至少留 token 绑定尝试 + 失败告警.

笔记应用必用 token：

| 用途 | Token 名 |
|---|---|
| frame fill / L 栏 / C 栏 fill | `背景色/surface` |
| 栏间分割线 fill | `分割线色/outline` |
| Pad 竖 NLC 覆盖 遮罩 fill | `遮罩色/mask`（opacity 0.2）|
| Detail 内文字 / NavigationBar 文字 等 | 由组件自身已绑定，无需手动 |

## 5. 变体选择校验

`app-variant-map-{app}.md` 是首要权威，但**CSV 来源标记 "需要Check" 的 variant 必须二次校验**：

1. 先按 `app-variant-map` 表落位
2. 取出该 variant 的 `mainComponent.width` / `height`
3. 若**自然尺寸与目标栏宽 / 通用 spec 偏差 > 50%**（例：variant 自然 176×44 而目标栏 282 风满）→ 触发警告，向用户确认变体选择，禁止 silently 风满 stretch
4. 若映射表条目带 "需要Check"、"待补"、"待修"、`(／／／)` 等不确定标记 → 必须向用户确认

历史踩坑：
- 笔记 LC SearchBar `_02`（自然 176×44，CSV2 标 "Pad/顶部导航/默认 - 需要Check"）→ 应改为 `_05`（392×56）
- NavigationBar `_05`（带返回 ←）→ 笔记 LC default 列表页应为 `_04`（无返回）

## 6. 组件落位后的强制验证

**每个 frame 写完所有组件后**，调用统一 `verifyChecklist(frame, spec, scenarioFlags?)` 函数。失败任何一项立即修复 + 重检。

**`scenarioFlags` 参数**（可选，向后兼容）：未传入时 ⑩~⑬ 检查跳过 — graceful degradation。传入时直接采用 SKILL Phase 4 step 7 输出。

> **🚀 函数本体已迁移到 `csv-pipeline/runtime/verify.ts` (2026-05-28)**.

**Signature**:
```js
async function verifyChecklist(frame, spec, scenarioFlags?) → Promise<string[]>
//   返回 errors 数组. errors.length > 0 时禁止汇报「适配完成」, 必须先修后再 verify.
```

**spec 字段**:
- `frameW`, `frameH`, `cornerRadius` (number 或 4-corner object), `statusBarH` — frame 基本规格
- `frameTransparent: true` 或 `frameFillToken: '...'` — frame fill 检查模式 (二选一)
- `cols: { 'L栏': 282, 'C栏': 346 }` — 栏宽 expected (key 무공백, common-rules §0 #14)
- `sidebar: { h: 1388 }` — Pad NLC sidebar 高度
- `mask: true` — 遮罩-N覆盖 期待存在 (或由 scenarioFlags.NCovering trigger)
- `framework: 'NL'` — NL framework 时 ⑩~⑫ 跳过 (NL 一律 mask 不渲染)
- `componentChecks: [{ id, label, w?, h?, x?, y?, sourceInstId? }]` — 组件 reflow 自动检查

**scenarioFlags 字段** (Phase 4 step 7 输出):
- `LEditMode` / `NEditMode` / `CEditMode` / `NCovering` — boolean trigger

**错误清单 > 0 时禁止汇报「适配完成」. 修复 → 重 verify (循环最多 3 次, 仍 fail → 中止 + 用户报告)**.

**检查项映射** (`common-rules-verify.md §6.2`)：

| 函数项 | §6.2 # | 说明 |
|---|---|---|
| ① | #4-#6 | StatusBar |
| ② | #3 | cornerRadius |
| ③ | #17 | frame fill token |
| ④ | #7 | 栏宽 |
| ⑤ | #11 | 杆子 z-order |
| ⑥ | #9 | Sidebar 高度 |
| ⑦ | #8 | componentChecks reflow |
| ⑧ | #10 | NLC 覆盖遮罩 |
| ⑨ | #12 | 分割线 token |
| ⑩ | #21 | L 编辑遮罩 (§3.7a) |
| ⑪ | #22 | 多 mask z-order (§3.7b) |
| ⑫ | #24 | C 编辑无 mask |
| ⑬ | #23 | scenarioFlags 一致性 |
| ⑭ | — | ToolBar 胶囊 width（device-dim「工具栏规格」line 657~663） |
| ⑮ | — | Pad N 栏 z-order（NavBar 必须在 Sidebar 之上） |
| ⑯ | — | inner componentProperties 与源稿同步（spec.componentChecks[i].sourceInstId 提供时；覆盖 状态 / 数量 / 材质 / 编辑态 等业务态） |

## 7. 与既有规则文件的关系

| 文件 | 角色 |
|---|---|
| `SKILL.md` | 主入口，调用本协议 |
| `references/common-rules-{principles,instance,mask-zorder,verify,prohibit}.md` | 通用规则 5 파일 (검색边界 / 实例 闭环 / mask z-order / 验证 25 항 / 禁止 索引). 호환 hub: `common-rules.md` |
| `references/layouts/{nlc,lc-nc,c}-layout.md` | 各布局骨架与栏宽 |
| `references/layouts/device-dimensions.md` | 设备规格、断点 padding、对齐方式 |
| **本文件 `component-placement-protocol.md`** | **任何组件落位的标准序列 + 验证函数 + token 协议** |
| `references/app-variant-map-{app}.md` | 各应用变体映射 + 应用专用例外 |
| `references/component-dictionary/*.md` | 各组件家族字典 |

调用顺序：

```
SKILL → layout reference 决定骨架 → component-placement-protocol 落位每个组件
    → app-variant-map 给出变体 → component-dictionary 给出 nodeId/key
    → token cache（Phase 4）→ verifyChecklist（Phase 6）
```
