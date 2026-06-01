# 通用规则 — 落位 + 校验

> Phase 5 (落位) + Phase 6 (验证) 매번 로드. 落位 위치 + 写入 节奏 + 容器 resize atomic + verifyChecklist 25항.
> 본 파일 = §5 (落位 规则) + §6 (校验 + 修정).
> 원칙 → `common-rules-principles.md`. instance → `common-rules-instance.md`. mask-zorder → `common-rules-mask-zorder.md`. 禁止 → `common-rules-prohibit.md`.

## §5. 目标稿落位规则

### §5.1 落位优先级

| 顺序 | 规则 |
|---|---|
| 1 | 与源稿同一 section（源稿在 section 中时） |
| 2 | 同一 page 的源稿右侧（源稿不在 section 中时） |
| 3 | 与源稿相同的 `y` 起点（方便横向对照） |
| 4 | 默认顺序：`Fold内横 → Fold内竖 → Pad横 → Pad竖` |

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
| 5 | **组件替换（`remove` + `appendChild`）后即时验证 parent.children z-order 与 spec 一致** |
| 6 | 确认无误 → 进入下一步 |

**§6.0 追加：组件替换后 z-order 即时确认**

`remove()` + 新 `appendChild()` 替换组件时，同一 `use_figma` 调用内必须验证 `parent.children` 顺序：

| parent | z-order 约束 |
|--------|-------------|
| L 栏 | ToolBar / BottomBar 必须最顶 z（List 之上）|
| C 栏 | TextInput 必须最顶 z（Detail 之上）|
| frame | 杆子必须最顶 z；Sidebar 在遮罩之上 |

**根因**：2026-05-21 List_Task 替换后 `appendChild(newList)` 使 List 成为最后 child → ToolBar 被覆盖。替换操作本身不保持 z-order，必须在替换后显式 `parent.appendChild(topZChild)` 将需要置顶的节点重新提升。

**发现错误时修正优先级**: 尺寸 → 位置 → 文本 / 局部视觉. **禁止整页推翻重做**, 只做局部修正.

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
| 1 | Section 命名 | 형식 = `TEST_{App}_{Scene}_{State}_{YYYY-MM-DD}_{Operator}` (권위 `references/naming-conventions.md §2`). 정규식 매칭 시 자동 통과 |
| 2 | 4 个目标版本完整 | Fold横/竖 + Pad横/竖 全部存在，对照 `targetVariantPlan` 无遗漏 |
| 3 | 设备 frame 圆角 | Fold 内屏 50dp / Pad 34dp 精确匹配 |
| 4 | 状态栏 variant + 高度 | Fold 用 `变体类型=fold`（46dp），Pad 用 `变体类型=pad`（**34dp，非 38dp 自然高度**） |
| 5 | 状态栏宽度 | 等于目标 frame 宽度 |
| 6 | 主内容区 y 起点 | 等于 statusBarH（46 或 34），不依赖 status bar 自然高度 |
| 7 | 栏宽 | 与 `device-dimensions.md` 表完全一致（如 Fold 内竖 LC: L=282 + C=346） |
| 8 | 任何标准组件实例 width / height === 目标值 | 以 `placeStandardComponent` 落位后自检 + Phase 6 verifyChecklist 双重校验。偏差 > 0.5dp 视为 reflow 失败 |
| 9 | Sidebar 高度 | Pad 横 = N 栏 mainH；Pad 竖覆盖 = frameH − statusBarH。经过 `common-rules-instance.md §3.6` 强制序列 |
| 10 | NLC 覆盖遮罩 | Pad 竖 NLC 必须有 `遮罩-N覆盖` RECTANGLE，且 fill 已绑定 `遮罩色/mask` token |
| 11 | frame 子节点 z-order | 见 `component-placement-protocol.md`「§3 父节点结构与 z-order 模板」。**杆子永远最顶 z + 透明背景 + 风满 frame 宽** |
| 12 | 栏间分割线 | LC / NLC 并列 / NLC 覆盖 / NLC 收起 → **C 栏 strokeLeftWeight=1** + strokes 绑定 `分割线色/outline` token (`common-rules-mask-zorder.md §3.8` 2026-05-28 修订)；NC / C 通栏 → 无 |
| 13 | 分割线高度 | C 栏自身 height = frameH (栏 y=0 h=frameH 风满) → strokeLeft 自然表达 frame 全高. status bar instance fills=[] 透明，视觉自然连续 |
| 14 | Sidebar 阴影 | Pad 横 N 栏 + 主内容区 `clipsContent = false`，截图能看到阴影越过 N\|L 边界 |
| 15 | 浮动 Tab / 键盘 / 玻璃材质 | 删除或 `visible=false`，不得保留移动端语义 |
| 16 | 组件库时间戳 | 怀疑视觉异常时优先 `search_design_system` 比对 `updatedAt`，使用最新版本 |
| 17 | frame fill / L栏 / C栏 fill / 分割线 / 遮罩 全部绑定 token | `frame.fills[0].boundVariables.color` 必须存在。RGB SOLID 视为 fallback，需有告警记录 |
| 18 | **A 类标准组件全部风满** | 全部 A 类组件（StatusBar / NavBar / TopBar / SearchBar / Chip / List / Detail / ToolBar / BottomBar / Sidebar / TextInput / Fab 等自带 internal padding 的组件）`x === 0` 且 `width === 栏W`。**任何 `x !== 0` 或 `width !== 栏W` 直接判 fail**。详见 `common-rules-instance.md §3.4a.1` A/B 二分 |
| 19 | **B 类裸控件合算（仅在确认无 internal padding 时）** | 裸 frame / 业务自定义容器：按 `device-dimensions.md` 断点表取 spec，`x = spec, w = 栏W − 2×spec`；1100 < 栏W 时 `x = (栏W − 988)/2, w = 988` 居中。A 类组件**不**走本路径 |
| 19a | **应用专用 N 收起 L 栏 width** | 笔记 / 待办 NL framework 收起：`L 栏 width === frameW`（N 自体消失通则）。其它应用按 `app-variant-map-{app}.md` 声明 |
| 20 | C 栏 TextInput bottom flush | 笔记 / 待办：C 栏 TextInput `y = mainH − h`（bottom 贴 frame 底，与杆子 16dp 重叠）；Detail 高度 = `mainH − 62`（延伸到 TI 底，TI 通过 z-order 与 fade overlay 自然遮盖）|
| 21 | **L 编辑遮罩** (`common-rules-mask-zorder.md §3.7a`) | `scenarioFlags.LEditMode === true` 时 → `遮罩-编辑` RECTANGLE 存在 + 尺寸 `Cw × frameH` + 位置 `x=C 列起点, y=0` + fill 绑定 `遮罩色/mask` token + opacity 0.2 + L 栏 已从 main 提升至 frame 直接子级 + **`遮罩-编辑` 在 `状态栏` 之上**（C 列 status bar 区段必须 dim） |
| 22 | **多 mask z-order** (`common-rules-mask-zorder.md §3.7b`) | `LEditMode + NCovering` 同时 时 → frame.children 顺序 `main(仅 C) → 状态栏 → 分割线 → 遮罩-编辑 → L 栏 → 遮罩-N覆盖 → Sidebar → 杆子` 完全一致（**状态栏 + 分割线 在两遮罩之下**，按列归属 dim）|
| 22b | **NLC 覆盖 z-order** (`common-rules-mask-zorder.md §3.7`) | `NCovering === true && LEditMode === false` 时 → frame.children 顺序 `main → 状态栏 → 分割线 → 遮罩-N覆盖 → Sidebar → 杆子`（状态栏 + 分割线 在 遮罩-N覆盖 之下，整 frame status bar / 分割线 dim）|
| 23 | **scenarioFlags 一致性** | Phase 4 step 7 输出的 `scenarioFlags` JSON 必须作为参数传入 verifyChecklist 调用；flags 激活项与 frame 实际 mask 存在与否无矛盾 |
| 24 | **C 栏编辑时无 mask** (`common-rules-mask-zorder.md §3.7a` 末) | `CEditMode === true && LEditMode === false && NEditMode === false` 时 → 确认 `遮罩-编辑` 节点不存在 |
| 25 | **inner componentProperties 与源稿同步** | 适配 frame 各标准组件 instance 的 inner INSTANCE 子节点 `componentProperties`（变体属性 / boolean / instance-swap / 文本）必须等于源稿同位置 instance 的对应值。覆盖业务态如 ToolBar 按钮 `状态=禁用`（未选编辑模式）、`数量=4个`（源 icon 数量）、List item `编辑态=true` 等。**禁止** 仅 swap 顶层 variant 而忽略 inner state — 源稿 instance 必须通过 `placeStandardComponent({ sourceInst })` 传入，verifyChecklist ⑯ 自动检测 |

### §6.3 每个目标 frame 写入完成后的强制截图

每完成一个目标 frame（4 个版本中的一个）必须立即 `get_screenshot` 验证，**不允许等到 4 个全部完成后再统一验证**。原因：早期错误（如 status bar variant 错、Sidebar 高度 800dp）会被克隆传播到后续 frame，最后再修需要重做多个 frame。

写入 → 截图 → 校验清单 6.2 中本 frame 的相关项 → 通过后再写下一个 frame。

---

> **연관 파일**: principles → `common-rules-principles.md` / instance → `common-rules-instance.md` / mask-zorder → `common-rules-mask-zorder.md` / prohibit → `common-rules-prohibit.md`.
