# 通用规则

本文档定义所有多终端适配 Skill 共享的执行原则和禁止项。

## §0. 快速执行摘要

1. 先探查，后修改；读取完整上下文后再动手。
2. 默认只在源稿所在当前 page 执行搜索、比对和复用。
3. 不默认搜索或复用整页目标稿；整页复用必须满足条件并经用户确认。
4. 禁止整页复用不等于禁止标准组件实例探查；目标布局依赖标准组件时必须探查。
5. `get_metadata` 是基础组件任务清单的基线，metadata 中出现的源稿直接子组件不得删除。
6. 业务内容只迁移源移动端页面已有内容，不为填满目标布局跨画布补内容。
7. 标准组件默认保持实例态，`detachInstance` 只能作为最后手段。
8. 所有写入必须分步执行；每次 `use_figma` 只处理一个逻辑单元。
9. 每一步写入后必须做截图校验和结构校验。
10. 多端适配结果默认紧邻源移动端设计稿放置，保持同一 section / 同一工作区内可直接对照。
11. **任何组件落位、变体切换、resize 必须走 `references/component-placement-protocol.md` 的标准序列**，禁止 inline 重写。Phase 6 必须调用 `verifyChecklist(...)`，错误项必须修复后才能汇报完成。
12. **任何 fill 写入必须经 token 解析**（`bindFill(...)`）。直接写 RGB SOLID 仅作为 fallback，必须留告警。Phase 0/4 调用 `buildTokenCache()` 一次性加载所有库 token。
13. **数据不确定时立即报告，禁止猜测**。CSV 损坏 / 编码异常 / 字段缺失 / 映射条目带「需要Check / 待补 / `(／／／)`」标记 等情况，必须中止并向用户报告。禁止用「合理推测」「按上下文推断」填补未知数据。
14. **栏标识前缀格式统一**：表格 / 文档 / 输出 / 注释中提到栏归属时，**必须用** `L栏：` / `C栏：` / `N栏：`（**含全角冒号**）。禁止变体写法如 `L栏 ：` / `L 栏:` / `L:` / `L-栏` 等。这是跨文档一致性约定，便于 grep 和自动校验。
15. **Phase 2 钻取层级塌缩检测必做**：源稿多个 phone frame 是同一内容的不同导航深度（list / detail / edit 等）时，`targetVariantPlan` 项数 = **设备 × 方向数**，**不与源 frame 数相乘**。AskUserQuestion 询问 scope 前必须先汇报计数结果 + 塌缩判定。检测触发条件与例外见 `SKILL.md` Phase 2 补充节「targetVariantPlan 计数规则」。

## §1. 检索与复用边界

### §1.1 默认范围

| 动作 | 默认规则 | 允许例外 |
| --- | --- | --- |
| 当前 page 检索 | 搜索 / 比对 / 复用 仅限源稿当前 page | 用户明确要求"参考其他 page" |
| 整页目标稿复用 | **禁止**全文件搜索并直接复用别处整页结果 | 同时满足 §1.3 全部条件 + 用户确认 |
| 标准组件实例探查 | **允许**；目标布局依赖标准组件时**必做** | 不用标准实例时必须说明 §1.4 三类原因之一 |

### §1.2 当前 page 隔离约束

| 触发信号（任一） | 约束生效后禁止动作 |
|---|---|
| 用户说"不要跨 page" | 跨 page 搜索现成整页目标稿 / 旧测试样例 |
| 用户为当前任务新建 page | 跨 page 借用整页骨架 |
| 用户说"就在这个 page / section 里做" | 用其它 page 节点作为当前任务直接输入 |

隔离约束下只允许：源稿 / 当前 page 直接命中的节点 / 已加载 reference 的内容。

### §1.3 整页复用允许条件（必须**全部**满足）

1. 已按主 Skill 完成源稿读取、布局判断、reference 加载
2. 候选目标稿 = 同页面内容 + 同目标设备 + 同布局语义
3. 候选目标稿是"等价目标稿"，**不是**相似页面 / 历史样例
4. 已向用户说明并获明确确认

任一缺失 → 回到主链路，按 reference 搭骨架。

### §1.4 不用标准实例的允许原因（仅以下三类）

1. 当前文件内确实不存在该标准实例
2. 当前实例无法访问 / 无法 clone / 无法实例化
3. 实例受字体 / 依赖 / 写入限制阻塞，且已尝试更直接的标准路径

### §1.5 导航族不可混用

| 组件 | 语义 |
|---|---|
| `BottomBar` | 手机底部导航 |
| `Sidebar` | Pad N 栏 |
| `NavigationBar` | 标题栏 |
| `StatusBar` | 状态栏 |

**找到其中一种 ≠ 跳过其它的标准实例探查**。`app-variant-map` / 布局 reference / 字典 给出明确组件线索时，必须按线索探查命中。

## §2. 内容来源边界

### §2.1 内容密度守恒（核心原则）

| 源稿状态 | 目标稿状态 |
|---|---|
| 有 X 列表项 | 有 X 列表项（不可补到 Y > X） |
| 空态 / 低保真 / 仅框架 | 保持空态 / 低保真 / 仅框架，只做结构适配 |
| 无具体业务内容 | 不补具体业务内容 |

### §2.2 业务内容（不允许跨画布迁入）

列表项 / 正文文案 / 标题副标题摘要 / 图片封面缩略图 / 时间标签统计值

### §2.3 结构组件（必须迁移，不算跨画布补内容）

`NavigationBar` / `StatusBar` / `BottomBar` / `Sidebar` / `DrawerIndicator` / `Fab` / `SearchBar` / 浮层容器（`FloatingWindow` / `DrawerWindow` / `AlertDialog` / `Menu`）等。

源稿存在 + 映射表未明确返回 `hidden`/`absent` → 必须迁移、映射或以 `fallback` 状态说明。

### §2.4 目标布局比源稿宽时（行为指南）

| 允许 ✓ | 禁止 ✗ |
|---|---|
| 扩展布局骨架 | 从其它画布拖入现成文章 / 卡片 / 图片 |
| 复制源稿已有控件 / 标题 / 导航 / 空态容器 | 用别处页面数据假装当前页面已有内容 |
| 为 L / C / N 栏预留空白区或占位骨架 | 因布局是 LC / NLC 就擅自补齐列表 / 详情 |

例外：用户明确要求"参考其他画布补齐示例内容"时允许跨画布引入。

## §3. 标准组件闭环

### §3.1 基础组件任务清单

**WHEN**: Phase 4 生成 componentTaskList 时
**MUST**: `get_metadata` 中出现的源稿直接子组件**全部进入**清单。后续读不到只能记录差异，**不可删除**。

**最少必入族（9 类）**：

| # | family | 备注 |
|---|--------|------|
| 1 | `StatusBar` | |
| 2 | `NavigationBar` | 含 `_Notes` 等业务变体 |
| 3 | `BottomBar` | 含 `_Showcase_*` / `_NoteEditPanel_*` 等 |
| 4 | `Sidebar` | |
| 5 | `SearchBar` | |
| 6 | `SelectableChip` | |
| 7 | `Fab` | |
| 8 | `DrawerIndicator` / `杆子` | 控制杆 / 小白条 |
| 9 | 浮层容器 | `FloatingWindow` / `DrawerWindow` / `AlertDialog` / `Menu`，依 `layouts/device-dimensions.md`「浮层规格」 |

**每个任务必填字段**：

| 字段 | 取值 |
|---|---|
| `sourceDetected` | true / false（是否在源稿 metadata） |
| `resolvedUiElement` | 业务语义（如"标题栏"/"侧边栏"/...） |
| `targetRule` | 映射表命中 / 布局规则 / 显式回退 |
| `action` | `setProperties` \| `swapComponent` \| `clone` \| `hide` \| `skip` |
| `status` | `mapped` \| `hidden` \| `absent` \| `fallback` \| `blocked` |
| `fallbackReason` | 仅 `fallback` / `blocked` 时填 |

**完成判据**：清单所有任务 status 已关闭。否则禁止汇报"适配完成"。

### §3.2 标准组件实例保护

**WHEN**: 任何对标准结构组件（`NavigationBar` / `StatusBar` / `Sidebar` / `BottomBar` 等）的修改
**MUST**: 默认保持 INSTANCE 状态。只允许 variant 切换 / 属性调整 / 尺寸调整 / 位置调整。
**NEVER**: 预先 `detachInstance` 规避风险。

**允许 detach 的条件（**全部满足**）**：

1. 已尝试实例路径（loadFontAsync + setProperties + swapComponent + 实例级文本修改）
2. 当前任务确实需要修改实例内部文本 / 结构，且实例态走不通
3. 字体 / 依赖 / 写入限制已明确阻塞实例路径

**detach 后输出必须说明**：哪个组件 / 为何实例态走不通 / 为何 detach 是最后手段。

## §3.3 实例克隆与变体切换时的尺寸同步

**核心**：`clone` / `setProperties` / `swapComponent` 后，Figma 不会自动把实例 resize 到目标 variant 默认大小。**必须显式 `resize(targetW, targetH)`**。

**典型踩坑组件**：

| 组件 | 源 variant 自然 | 目标规格 |
|------|-----------------|----------|
| `状态栏-StatusBar` | 手机 38（误值）| 手机 46 / Fold 46 / Pad **34**（pad 自然 38, 必须强制 34）|
| `NavigationBar` | 变体间 56 / 116 / 139 差异大 | 按 `device-dimensions.md` 各栏高度表 |
| `Drawer-Max-BottomIndicator` / `杆子` | 设备 variant 间差异 | 按设备 spec |
| `BottomBar_Showcase_*` / `ToolBar_*` | 常规 56 / 缩小 44 | 按工具栏 spec |
| `Sidebar_Component_PAD_NLC_*` | 设计稿上固定高度 | 按 N 栏实际 mainH |

**MUST**:
1. clone → swap → **显式 `resize(targetW, targetH)`**（缺一不可）
2. 跨 screenMode / 栏宽时**宽度也显式传入**
3. Phase 6 校验：差值 > 1dp 判不合格

**NEVER**:
- `clone.resize(w, clone.height)` 把旧高度原样保留
- 依赖 instance 自带高度

## §3.4 variant 切换后残留 override 的清理

> ⚠️ **优先级警告**：`resetOverrides()` **默认 OFF**（见 §3.6 关键决定）。本节是 OPT-IN 路径 —— 仅当目标 variant 内部结构差异巨大、必须清旧文本/旧 padding override 时才打开。**§3.4 vs §3.6 冲突时以 §3.6 为准**。

**症状**：`swapComponent()` 后旧 variant 的 **节点级 override**（子节点 `x` / `width` / `layoutSizingHorizontal` / 文本 layoutGrow）残留在实例上：

| 现象 | 例子 |
|------|------|
| 标题 `x` / `width` 卡在旧值 | NavBar `_05`（含返回图标）→ `_04`（无返回）后，标题仍从 `x=22` 开始 |
| Auto-layout FILL 被旧 override 忽略 | `resize()` 不向子节点传播 |
| 视觉与原生规格偏离 | NavBar 标题原生 `pl=28` 被压到 `pl=50` |

**MUST**:
1. swap 后 `inst.resetOverrides()` 清空，**再写入业务值**（例 `text.characters = "笔记"`）
2. 组件内置 padding / 间距是**权威值**，文档与之冲突以组件为准
3. reset + resize 后校验 `text.absoluteBoundingBox.x - inst.absoluteBoundingBox.x` 与原生一致；不一致 → `layoutSizingHorizontal` 强制 `FILL`

**NEVER**:
- 手动调子节点 `x` / `width` "掰回"正确位置 → 先 reset 让组件原生 auto-layout 决定

> ⚠️ **§3.6 与本节差异（关键）**：§3.6 默认 **OFF** `resetOverrides`（width override 是 reflow 的最后防线），仅当目标 variant 内部结构差异巨大、必须清旧文本/旧 padding 时才打开。本节 §3.4 适用于"明确需要清 override"的情况；§3.6 适用于"避免 reflow 优先"的情况。两节冲突时以 §3.6 优先。

## §3.4a 组件 padding 分类与容器合算规则（通用骨架）

> 应用专用实测应用表已迁出：笔记 / 待办 → `app-variant-map-笔记.md §0.2`。其它应用 → 各自 `app-variant-map-{app}.md`。

### §3.4a.1 组件分类

| 类别 | 含义 | 组件 | padding 处理 |
|------|------|------|----------|
| **特殊（框架性）** | 屏幕上/下/侧边固定框架 | `NavigationBar*` / `BottomBar_Showcase_*` / `ToolBar_*` / `Sidebar_Component_*` / `TextInput_ComponentSet_Notes` | **永远 `x=0, width=栏W` 风满，不参与合算** |
| **内容容器** | 栏中间承载内容 / 列表 / 搜索 / 标签 | `List_*` / `Detail_*` / `SearchBar_ComponentSet` / `SelectableChip_ComponentSet_*` | 按 spec ↔ internal **合算** |

判定要诀：「上下/侧 边 框架概念」=特殊；「栏中间承载内容」=内容容器。**未列出组件不要凭印象套用，先实测**。

### §3.4a.2 internal padding 定义

| 组件类型 | internal pl 测量方法 |
|---------|--------------------|
| 通用内容容器（List / Search / Chip） | `direct.absoluteBoundingBox.x − inst.absoluteBoundingBox.x` |
| **`Detail_Notes` 特殊** | **直接 = 20dp**（封面图距 Detail 左缘的偏移；外层 frame `pl=0` 但 internal 视作 20）|

```javascript
const direct = inst.children[0];
const internalPl = direct.absoluteBoundingBox.x - inst.absoluteBoundingBox.x;
```

**权威来源**：组件 internal pl 以「控件变体清单」CSV `Space` 列为准。文件内实测与 CSV 冲突时**以 CSV 为准**。

| 组件 | CSV Space | 实测 | 取值 |
|---|---|---|---|
| `SelectableChip_ComponentSet_Notes_01/02` | 左 12, 右 0 | 0 | **CSV `12`**（实测易误判）|
| `SearchBar_ComponentSet_*` | 左 12, 右 12 | 一致 | 12 |
| `List_Notes_*` | 左 12, 右 12 | 一致 | 12 |

### §3.4a.3 合算公式

| 关系 | x | 写入 width | visible 总 padding |
|------|---|-----------|-------------------|
| `internal ≥ spec` | 0 | 栏W | internal（自动 ≥ spec）|
| `internal < spec` | `spec − internal` | `栏W − 2 × outer` | `outer + internal = spec` |

简言之：`outer = max(0, spec − internal)`。

### §3.4a.4 执行准则

| # | 规则 |
|---|------|
| 1 | 通用内容容器：实测 `direct.x` 作 internal pl；`Chip` 的 `pl=0` 易误判，**以 CSV 为准** |
| 2 | `Detail_Notes`：直接 `internal=20`，不测量外层 frame |
| 3 | spec 来自 `device-dimensions.md` 栏 padding 表 + 断点表 |
| 4 | 写入：`inst.x = outer; inst.width = 栏W − 2 × outer` |
| 5 | **特殊组件不参与合算**：永远 `x=0, width=栏W` 风满 |
| 6 | 远程组件 internal 不可在 instance 中改写；`internal > spec` 时风满 + 接受 over |

## §3.5 状态栏跨设备 variant 切换 + 强制高度

**症状**：源稿 StatusBar = 手机 variant，clone 到 Fold/Pad 后**不会自动切换**。必须显式 `swapComponent` + `resize`。

| 设备 | variant 名 | spec 高度 | 自然高度 | 备注 |
|------|-----------|----------|---------|------|
| 手机 | `变体类型=手机` | 46 | 46 | OK |
| Fold 内屏 | `变体类型=fold` | 46 | 38 | swap 后强制 resize 46 |
| Pad 横/竖 | `变体类型=pad` | **34** | **38** | swap 后强制 resize 34；**易 reflow 回 38** |

**MUST**:
1. clone 后**第一步** swap 到目标 variant
2. swap 后立即 `resetOverrides() → resize(targetW, specH) → x=0, y=0`
3. **完成所有变更后再次校验**，发现 38 立即 `resize(_, 34)` 强制
4. Phase 6 必检：`(width === frameW, height ∈ {46, 34})`

**NEVER**: 沿用手机 variant 适配 Fold / Pad。

## §3.6 自带 auto-layout 实例的 resize / 落位通用陷阱

**所有自带 auto-layout 的标准组件实例**（不仅 Sidebar，亦含 NavigationBar / SearchBar / SelectableChip / List_* / Detail_* / TextInput_* / BottomBar_* / ToolBar_* / Sidebar_* 等）在 `swapComponent` 或 `clone` 后，单纯调用 `resize()` 经常被忽略 —— instance 会回到 main component 的自然尺寸，并且 `x/y` 可能被 auto-layout 改写。

历史踩坑（同一陷阱反复出现）：

| 组件 | 自然尺寸 | 我们目标 | 不修复时的实际值 |
|------|---------|---------|-----------------|
| `Sidebar_Component_PAD_NLC_01` | 272×800 | 272×915 / 1388 | 800h, y=149/622 |
| `NavigationBar_05` 等 | 392×56 | 栏W×56 | 392 |
| `NavigationBar_Notes_01` | 530×56 | C栏W×56 | 530 |
| `SearchBar_05` | 392×56 | 栏W×56 | 392, x=18（hug 居中）|
| `SearchBar_02` | 176×44 | 栏W×44 | 176, x≈居中 |
| `TextInput_Notes_01/_08` | 392×92 | C栏W×92 | 392, x=-23（负数！）|

强制写入序列（任何标准组件实例通用）：

```javascript
// 1. 先迁移到目标 parent（如果不一致）
if (inst.parent !== targetParent) targetParent.appendChild(inst);

// 2. variant 切换（如有）
if (targetVariant) inst.swapComponent(targetVariant);

// 3. resetOverrides 默认 OFF（关键决定！）
//    reset 会清空 width override，立即触发 hug content reflow。
//    仅当目标 variant 内部结构变化、需要清旧文本/旧 padding 时才 true。
// inst.resetOverrides();   // ← 默认不调用

// 4. 强制 sizing FIXED（四项一并设置，互不替代）
try { inst.layoutSizingHorizontal = 'FIXED'; } catch {}
try { inst.layoutSizingVertical   = 'FIXED'; } catch {}
try { inst.primaryAxisSizingMode  = 'FIXED'; } catch {}
try { inst.counterAxisSizingMode  = 'FIXED'; } catch {}

// 5. resize → 位置（顺序不可调换）
inst.resize(targetW, targetH);
inst.x = targetX;
inst.y = targetY;

// 6. 落位后立即自检
if (Math.abs(inst.width - targetW) > 0.5) throw new Error(`reflow: ${inst.name}`);
```

**MUST**:

| # | 规则 |
|---|------|
| 1 | 任何标准组件实例的 swap / clone / resize 都走以上 6 步，**禁止 inline 简化**。封装见 `component-placement-protocol.md §2` |
| 2 | **`resetOverrides` 默认 OFF**（2026-05-15 修订）—— reset 清掉 width override 几乎必然 reflow |
| 3 | Phase 6 调用 `verifyChecklist(...)` 自动检测 width/height/x/y 偏差 > 0.5dp 即不合格 |
| 4 | Sidebar 额外校验：Pad 横 NLC `height === N 栏 mainH`；Pad 竖 NLC 覆盖 `height === frame.height − statusBarH` |
| 5 | 视觉异常（卡片多余留白 / 内容错位）→ 先怀疑 component 库版本（参见 §3.10），后查 instance 写错 |

## §3.7 NLC 覆盖模式 遮罩 + z-order

**WHEN**: Pad 竖屏 NLC **覆盖** 模式（N 栏覆盖于 L+C 之上）

**MUST 添加 `遮罩-N覆盖` 矩形**：

| 属性 | 值 |
|------|-----|
| 类型 | `RECTANGLE` |
| 名称 | `遮罩-N覆盖` |
| 尺寸 | `frameW × frameH`（盖满整 frame 含状态栏） |
| 位置 | `x=0, y=0` |
| fill | 绑定 `遮罩色/mask` token，opacity `0.2` |
| 圆角 | 与 frame 一致（Pad 34dp） |

**frame 直接子级 z-order**（从底到顶；笔记 / 待办 修订版）：

```
1. main（含 L 栏 + C 栏）
2. 遮罩-N覆盖
3. 状态栏-StatusBar  ← 在遮罩之上保证时间/信号可读
4. 栏间分割线
5. Sidebar           ← 紧贴状态栏下沿（笔记/待办 N 栏标题栏）
6. 杆子              ← 风满 + 透明 + 最顶 z
```

**MUST**:
- Sidebar 在所有后续 appendChild 后必须保持上述 z 位（不能在最末位时杆子取代）
- 状态栏 必须显式提到 mask 之上（默认 mask 覆盖 frame 全幅会盖住 status bar 时间信号）

**NEVER**: 缺 `遮罩-N覆盖` —— 否则 N 栏与 L+C 视觉无分层。

## §3.8 栏间分割线规则

**节点形态**: 独立 `RECTANGLE`（**不是** 栏 frame 的 stroke）。栏 frame `strokes = []`。

**布局模式 → 数量 / 位置**：

| 模式 | 位置 | 数量 |
|------|------|------|
| LC（Fold 内横/内竖）| `x = L栏width` | 1 |
| NLC 并列（Pad 横）| `x = N栏 + L栏` (L\|C) | 1（**N\|L 无**，Sidebar 阴影分隔）|
| NLC 覆盖（Pad 竖）| `x = L栏width` | 1 |
| NC | — | 0 |
| C 通栏 | — | 0 |

**节点规格**：

| 属性 | 值 |
|------|-----|
| 类型 | `RECTANGLE` |
| 名称 | `栏间分割线` |
| 尺寸 | `1 × frameH`（**全帧高，贯穿状态栏**）|
| 位置 | `x = 边界值, y = 0` |
| fill | 绑定 `分割线色/outline` token |
| 父节点 | **frame 直接子级**（不放入 main / C 栏内部）|

**NEVER**:
- 用 C 栏 `strokeLeftWeight` 实现 → 只画到栏 frame 高度，**无法贯穿状态栏**
- 在 NLC N\|L 边界加分割线 → 与 Sidebar 阴影双重分隔

## §3.9 Sidebar 阴影裁切防止

**症状**: `Sidebar_Component_PAD_NLC_*` 卡片自带圆角 + 外阴影。父 frame 链上任一层 `clipsContent = true` → 阴影被裁掉，N \| L 边界视觉无浮起。

**clipsContent 配置**：

| 模式 | 目标 frame | main | N 栏 |
|------|-----------|------|-----|
| Pad 横 NLC（Sidebar 在 N 栏内）| `true`（保留圆角）| **`false`** | **`false`** |
| Pad 竖 NLC（Sidebar 是 frame 直接子级）| `true` | 不影响 | — |

**Phase 6 校验**: Pad 横截图能看到 Sidebar 右侧阴影渐变越过 N\|L 边界进入 L 栏。

## §3.10 组件库时间戳校验

**WHEN**: clone 文件内已落地的旧 instance 之前 / 视觉异常调查时

**MUST**:
1. `search_design_system` 用名称搜索，比对 `updatedAt` 时间戳
2. 设计系统有更新版本 → **`importComponentSetByKeyAsync` 导入并替换**，**不要**继续 clone 旧结构
3. 替换流程：`importComponentSetByKeyAsync(key) → 找目标 variant → 旧 instance.swapComponent(新 variant) → §3.6 强制序列`
4. 视觉异常优先怀疑 component 库版本不一致，**后**查 instance 写错

**应用专用变更日志**（迁出，避免本节膨胀）：
- 笔记 / 待办 → `app-variant-map-笔记.md §0.5`
- 其它应用 → 各自 `app-variant-map-{app}.md`

## §4. 写入与降级策略

### §4.1 实现方式优先级（从高到低）

| 顺序 | 方式 |
|---|---|
| 1 | `search_design_system` 搜索并复用已有组件 / 变体 |
| 2 | clone 画布上的现成节点 |
| 3 | Plugin API 新建节点（**最后手段**） |

能 clone 已落地节点时，**不优先** `createInstance`。

### §4.2 立即降级触发（实例化 → clone）

| 情况 | 降级动作 |
|---|---|
| `createInstance()` 失败 | clone 源组件 |
| `appendChild()` 因字体问题失败 | clone + `fixFonts` |
| 组件依赖不可用字体 | clone + `fixFonts` |
| 实例内部文本难以稳定修改 | clone + 文本编辑 |

**降级后**：clone 已落地节点，**优先改布局 / 尺寸 / 位置，不改组件内部结构**。

### §4.3 标准组件映射失败的降级序列

1. 优先尝试标准实例 / 标准变体映射
2. 失败 → clone 源组件
3. 对 clone 结果执行 `fixFonts`
4. clone 结果 resize / Auto Layout 收敛到目标栏宽 / 高度
5. componentTaskList 标记 `status = fallback` + 记录 `fallbackReason`

**例外**：映射表 / 布局规则明确返回 `hidden` / `absent` 才允许省略组件。

## §5. 目标稿落位规则

### §5.1 落位优先级

| 顺序 | 规则 |
|---|---|
| 1 | 与源稿同一 section（源稿在 section 中时） |
| 2 | 同一 page 的源稿右侧（源稿不在 section 中时） |
| 3 | 与源稿相同的 `y` 起点（方便横向对照） |
| 4 | 默认顺序：`Fold横屏 → Fold竖屏 → Pad横屏 → Pad竖屏` |

### §5.2 默认间距

| 场景 | 间距 |
|---|---|
| 源稿 ↔ 第一个目标稿 | **75dp** |
| 相邻目标稿之间 | **60dp** |

### §5.3 禁止 / 允许

| ✗ 禁止 | ✓ 允许 |
|---|---|
| 跳到 page 其他区域随意落位 | 偏离时必须用户明确指定或当前空间不足，且输出中说明 |
| 多版本只生成首个就停 | 按 `targetVariantPlan` 全部顺排 |
| 与无关样例交错摆放 | 紧邻同任务目标稿继续顺排 |

## §6. 校验与修正

### §6.0 写入节奏（每次 `use_figma` 调用单位）

| 步骤 | 动作 |
|---|---|
| 1 | 只处理一个逻辑单元 |
| 2 | 记录上一步创建的 node ID |
| 3 | 截图校验当前状态 |
| 4 | 结构校验关键节点的尺寸 / 位置 |
| 5 | 确认无误 → 进入下一步 |

### §6.0.1 修正优先级

| 顺序 | 修正项 |
|---|---|
| 1 | 尺寸 |
| 2 | 位置 |
| 3 | 文本 / 局部视觉 |

**禁止整页推翻重做**，只做局部修正。

### §6.1 容器 resize / 结构变更 原子单位

在改动 non-autolayout Frame（`L 栏` / `C 栏` / `N 栏` / `main` 等）的宽度或结构时，以下三步必须作为 **单一原子单位** 执行，中途中断会留下不一致的画布状态：

1. `container.resize(newW, newH)`
2. 在同一次 `use_figma` 调用内立即执行 `for (child of container.children) { child.resize(newW, child.height); child.x = 0; }`
3. 调用结束后立即用 `get_screenshot` 验证对应 frame（或其所在 section）

**原因**：non-autolayout 容器不会把自身宽度自动传递给子节点。若只 resize 容器，子节点仍保持旧宽度，下一步操作将建立在错误前提之上；若「先容器、后子节点」拆开执行，一旦漏掉第 2 步，第 1 步的成功会掩盖问题。

**适用场景**：

- 覆盖 ↔ 并列 切换导致 `L / C / N` 宽度变化
- NLC ↔ LC ↔ NC 等布局类型的重构
- 分割线 / 边距 / 分栏比例调整导致栏宽发生实际变化的任何情况
- 浮层用 non-autolayout 容器尺寸变化但保留既有子节点时

**禁止**：

- 以 token 成本 / 响应速度为由跳过上述三步中的任意一步
- 仅 resize 容器、以「子节点稍后再修」为由进入下一操作

### §6.2 多端适配 Phase 6 强制检查清单（通用项）

每次完成多端适配后，必须按下表逐项验证。任一项不通过判为未完成。**实际执行通过 `references/component-placement-protocol.md`「§6 verifyChecklist」函数自动跑**，禁止手工核对。

| # | 检查项 | 通过标准 |
|---|--------|----------|
| 1 | Section 命名 | 含测试名 + 日期（如 `TEST_xxx_2026-05-15_..._KIM`） |
| 2 | 4 个目标版本完整 | Fold横/竖 + Pad横/竖 全部存在，对照 `targetVariantPlan` 无遗漏 |
| 3 | 设备 frame 圆角 | Fold 内屏 50dp / Pad 34dp 精确匹配 |
| 4 | 状态栏 variant + 高度 | Fold 用 `变体类型=fold`（46dp），Pad 用 `变体类型=pad`（**34dp，非 38dp 自然高度**） |
| 5 | 状态栏宽度 | 等于目标 frame 宽度 |
| 6 | 主内容区 y 起点 | 等于 statusBarH（46 或 34），不依赖 status bar 自然高度 |
| 7 | 栏宽 | 与 `device-dimensions.md` 表完全一致（如 Fold 内竖 LC: L=282 + C=346） |
| 8 | 任何标准组件实例 width / height === 目标值 | 以 `placeStandardComponent` 落位后自检 + Phase 6 verifyChecklist 双重校验。偏差 > 0.5dp 视为 reflow 失败 |
| 9 | Sidebar 高度 | Pad 横 = N 栏 mainH；Pad 竖覆盖 = frameH − statusBarH。经过 §3.6 强制序列 |
| 10 | NLC 覆盖遮罩 | Pad 竖 NLC 必须有 `遮罩-N覆盖` RECTANGLE，且 fill 已绑定 `遮罩色/mask` token |
| 11 | frame 子节点 z-order | 见 `component-placement-protocol.md`「§3 父节点结构与 z-order 模板」。**杆子永远最顶 z + 透明背景 + 风满 frame 宽** |
| 12 | 栏间分割线 | LC 1 条（L\|C）；NLC 并列 1 条（L\|C，**N\|L 无**）；NC / C 通栏 0 条；fill 已绑定 `分割线色/outline` token |
| 13 | 分割线高度 | 等于 frameH（贯穿状态栏到底部），不允许只到主内容区高度 |
| 14 | Sidebar 阴影 | Pad 横 N 栏 + 主内容区 `clipsContent = false`，截图能看到阴影越过 N\|L 边界 |
| 15 | 浮动 Tab / 键盘 / 玻璃材质 | 删除或 `visible=false`，不得保留移动端语义 |
| 16 | 组件库时间戳 | 怀疑视觉异常时优先 `search_design_system` 比对 `updatedAt`，使用最新版本 |
| 17 | frame fill / L栏 / C栏 fill / 分割线 / 遮罩 全部绑定 token | `frame.fills[0].boundVariables.color` 必须存在。RGB SOLID 视为 fallback，需有告警记录 |
| 18 | 特殊组件铺满 | `NavigationBar` / `BottomBar` / `ToolBar` / `Sidebar` / `TextInput_Notes` 在所属栏内 `x=0, width=栏W`，不参与 padding 合算，**禁止**给它们加 outer 偏移 |
| 19 | 通用内容容器 padding 合算 | `List_*` / `SearchBar_*` / `SelectableChip_*` / `Detail_*` 按所在栏 spec 与组件 internal padding 合算；具体应用表见各应用 `app-variant-map-{app}.md`「padding 合算应用表」节 |
| 20 | C 栏 TextInput bottom flush | 笔记 / 待办：C 栏 TextInput `y = mainH − h`（bottom 贴 frame 底，与杆子 16dp 重叠）；Detail 高度 = `mainH − 62`（延伸到 TI 底，TI 通过 z-order 与 fade overlay 自然遮盖）|

### §6.3 每个目标 frame 写入完成后的强制截图

每完成一个目标 frame（4 个版本中的一个）必须立即 `get_screenshot` 验证，**不允许等到 4 个全部完成后再统一验证**。原因：早期错误（如 status bar variant 错、Sidebar 高度 800dp）会被克隆传播到后续 frame，最后再修需要重做多个 frame。

写入 → 截图 → 校验清单 6.2 中本 frame 的相关项 → 通过后再写下一个 frame。

## §7. 禁止项索引

### §7.1 文件 / 写入级

| # | 禁止 | 例外 |
|---|------|------|
| 1 | 新建「V2」/「副本」/「新页面」等并行设计稿 | 用户明确要求 |
| 2 | 一次性写入超过 10 个节点的大脚本（20KB 响应限制）| 无 |
| 3 | 修改组件内部结构；只改属性 / 尺寸 / 位置 | 无 |
| 4 | 使用自定义字体（Figma MCP 不支持）| 无 |
| 5 | 插入图片资源（Figma MCP 不支持）| 无 |

### §7.2 检索 / 复用级

| # | 禁止 | 详见 |
|---|------|------|
| 6 | "全文件探查可复用目标稿" 作为默认 | §1.1 |
| 7 | 未向用户确认就复用别处整页结果 | §1.3 |
| 8 | 当前 page 隔离约束下跨 page 搜索 | §1.2 |
| 9 | 把"不要整页复用"扩大成"组件级标准实例也不查" | §1.5 |
| 10 | `app-variant-map` / reference 给出明确实例时跳过优先命中 | §1.5 |
| 11 | 标准组件默认 detach 成普通 Frame | §3.2 |
| 12 | 跨画布搬运源稿不存在的业务内容 | §2.2 |
| 13 | 适配结果落到远离源稿位置 | §5.1 |

### §7.3 实例 / 落位级

| # | 禁止 | 详见 |
|---|------|------|
| 14 | StatusBar 沿用手机 variant 适配 Fold / Pad | §3.5 |
| 15 | 仅 `inst.resize()` 设 Sidebar 高度，缺 sizing FIXED 序列 | §3.6 |
| 16 | 省略 Pad 竖 NLC 覆盖模式的 `遮罩-N覆盖` 矩形 | §3.7 |
| 17 | NLC 模式 N\|L 边界添加分割线 | §3.8 |
| 18 | 用 C 栏 `strokeLeftWeight` 实现栏间分割线 | §3.8 |
| 19 | Pad 横 NLC 时 N 栏 / 主内容区 `clipsContent = true` | §3.9 |

### §7.4 验证级

| # | 禁止 | 详见 |
|---|------|------|
| 20 | 4 个目标 frame 写完之后再统一验证（必须每 frame 即时截图）| §6.3 |
| 21 | `verifyChecklist` 错误项 > 0 时汇报"适配完成" | §6.2 |
| 22 | fills 直接 RGB SOLID（不经 token lookup）| §0 #12 |
| 23 | 数据不确定时猜测填补 | §0 #13 |
