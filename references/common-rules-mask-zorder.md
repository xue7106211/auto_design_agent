# 通用规则 — 遮罩 / z-order / 栏间分割线

> Phase 5 落位时每次加载. NLC 覆盖 / L 编辑 / NL framework / NLC 并列 / 多 mask 叠加 / 栏间分割线 / Sidebar 阴影.
> 本文件 = §3.7~§3.7b (mask z-order) + §3.8 (栏间分割线) + §3.9 (Sidebar 阴影 pointer).
> 原则 → `common-rules-principles.md`. instance → `common-rules-instance.md`. 验证 → `common-rules-verify.md`. 禁止 → `common-rules-prohibit.md`.

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

> **★ z-order 核心原则（2026-06-02 用户指示，正本，覆盖旧版「状态栏 dim」规则）**：
> **`状态栏` 与 `Sidebar`(N) = 「绝对不可被遮挡」层**。任何 `遮罩` / lane 都不得盖在它们之上。
> - `状态栏` = 仅次于 `杆子`(/`Keyboard`)，在所有 遮罩·lane·main 之上。
> - `Sidebar`(N) = 在 `状态栏` 之下、但在所有 遮罩·lane 之上（N=trigger，永不 dim）。
> - `遮罩` = 盖在「自身 dim 对象」之上、「豁免对象（trigger lane / 状态栏 / Sidebar）」之下。
> **旧版「遮罩在状态栏之上、status bar 一同 dim」已废弃** —— 该规则使 L 栏 promote 后完全遮住状态栏（时间/信号消失），用户反复指出（6 个月 7+ 次）。dim 只作用于内容区（main / 被 dim lane），状态栏与 Sidebar 始终明亮可见。

**遮罩覆盖范围原则（核心）**：
- 遮罩-N覆盖 dim 对象 = L 栏 + C 栏（main 内容全域）。**豁免** = `状态栏` + `Sidebar`(N trigger)。
- 即 N 覆盖时 L、C 均 dim；状态栏、Sidebar 在遮罩之上不被 dim。

**frame 直接子级 z-order**（从底到顶）：

```
1. main（含 L 栏 + C 栏）   ← 被 遮罩-N覆盖 dim
2. 遮罩-N覆盖              ← 盖在 main(L+C) 之上 → L、C dim
3. Sidebar                 ← 遮罩之上（N=trigger 豁免，永不 dim）
4. 状态栏-StatusBar        ← 所有 遮罩·lane 之上（绝对不可遮挡）
5. 杆子                    ← 风满 + 透明 + 最顶 z
```
> 栏间分割线 = C 栏 `strokeLeftWeight`（§3.8），无独立节点。

**MUST**:
- `状态栏` 必须在 `遮罩-N覆盖` **之上**（否则被遮罩 / L 栏遮住，时间信号不可见）。
- `Sidebar` 必须在 `遮罩-N覆盖` 之上、`状态栏` 之下。
- 缺 `遮罩-N覆盖` —— 否则 N 栏与 L+C 视觉无分层。

**NEVER**:
- 把 `遮罩-N覆盖` 提升到 `状态栏` 或 `Sidebar` 之上（会遮住绝对不可遮挡层）。

### §3.7a 编辑状态遮罩（L 栏进入编辑模式时）

**WHEN**: `app-variant-map-{app}.md`「遮罩规则」表声明 L 栏编辑模式触发遮罩（笔记 / 待办：「L 栏进入编辑模式 → 仅 C 栏覆盖遮罩」）。

**MUST 添加 `遮罩-编辑` 矩形（C 列形态，非全幅）**：

| 属性 | 值 |
|------|-----|
| 类型 | `RECTANGLE` |
| 名称 | `遮罩-编辑` |
| 父节点 | frame 直接子级（不放入 main / C 栏内部） |
| 尺寸 | **`Cw × frameH`**（仅 C 列，从画面顶到底；不是全 frame）|
| 位置 | `x = C 列起点` (LC: x=Lw；NLC 并列: x=N+L；NLC 覆盖: x=Lw)，`y = 0` |
| 圆角 | **必须 object form**（非对称）：`topLeft = 0, topRight = frameR, bottomLeft = 0, bottomRight = frameR`。frameR 取 `device-dimensions.md` 各 device cornerRadius (Pad=34 / Fold内=50 / Fold外右侧=56). **禁止** scalar `cornerRadius = 50`（会让左侧 inner edge 也圆角化，与 L 栏右缘形成可见 gap）|
| fill | 绑定 `遮罩色/mask` token，opacity `0.2` |
| 代码映射 | `csv-to-spec.ts` editMask emit 时使用 `{topLeft:0, topRight:fcr.tr, bottomLeft:0, bottomRight:fcr.br}` 对象形式（Fold外 非对称 frame 也自动适配）。render-spec / use_figma 调用方需用 typeof guard 分支（`typeof === 'number'` ? scalar : object 4-corner）。|

**关键解释**：触发控件 = L 栏（豁免，不 dim）。遮罩-编辑 dim 对象 = **C 列内容区（main）**。L 栏、状态栏、Sidebar 均在遮罩之上，不被 dim。

**遮罩覆盖范围原则（2026-06-02 正本，与 §3.7 一致）**：
- 遮罩-编辑 dim 对象 = **C 列内容（main 内 C 栏）**。L 栏（trigger 豁免）+ 状态栏（绝对不可遮挡）在遮罩之上。
- ❌ 旧版「遮罩盖住 C 列 status bar 区段、status bar 一同 dim」已废弃 —— 该规则使状态栏被遮住（时间信号消失），用户反复指出。**状态栏始终在最上层明亮可见**。

**z-order 强制（从底到顶；状态栏 = 绝对不可遮挡，仅次于杆子）**：

```
1. main（仅含 C 栏；L 栏从 main 提升到 frame 直接子级）   ← 被 遮罩-编辑 dim
2. 遮罩-编辑（C 列尺寸 Cw × frameH）  ← 盖在 main(C) 之上 → C 内容 dim
3. L 栏                    ← frame 直接子，编辑遮罩之上（trigger 豁免，不 dim）
4. 状态栏-StatusBar        ← 所有 遮罩·lane 之上（绝对不可遮挡，时间信号始终可见）
5. 杆子                    ← 最顶 z
```
> 栏间分割线 = C 栏 `strokeLeftWeight`（§3.8），无独立节点。

**MUST**:
- `状态栏` 必须在 `遮罩-编辑` + `L 栏` **之上**（绝对不可遮挡；否则 status bar 被 L 栏 promote 后完全遮住）。
- L 栏从 main 内部移出至 frame 直接子级（`frame.appendChild(L)`），定位 `x = L 列起点, y = statusBarH`，z 在遮罩-编辑之上、状态栏之下。
- main 内部仅保留 C 栏（其它列 promote）。
- 遮罩-编辑 必须位于 frame 直接子级（被 frame-level 圆角裁切），尺寸 `Cw × frameH`，z 在 main 之上、L 栏之下。

**NEVER**:
- 把 `遮罩-编辑` 或 `L 栏` 提升到 `状态栏` 之上（会遮住绝对不可遮挡的状态栏）。
- 把 `遮罩-编辑` 做成全 frame 尺寸 → 会盖住 L 列触发区域。
- L 栏继续留在 main 内部 → 无法 z-promote 到遮罩之上。

### §3.7a-NL NL framework + LEditMode 处理

**WHEN**: framework = NL (list-only, 无 detail 列), `flags.LEditMode = true`. NL 无 C 列 → 无「编辑遮罩」概念.

**规则**: 所有 device / 子形态 一律 mask 不渲染, L 栏不 promote, z-order 沿用 NL 通则 (`main → 状态栏 → 栏间分割线 → 杆子`). §3.7a 的 mask + L promote 机制仅适用于含 C 列 framework (LC / NLC / NLC 覆盖).

**verifyChecklist 兼容**: `spec.framework = 'NL'` 时 ⑩~⑫ 全部 skip, 勿传 `spec.editMask` 等.

### §3.7a-NLC并列 NLC并列 framework + LEditMode → Sidebar 也 promote

**WHEN**: framework = NLC并列 (Pad横 default), `flags.LEditMode = true`，N 栏存在。

**规则**: 除编辑遮罩 + L promote 外，**Sidebar (N 栏) 也必须 promote 为 frame 直接子级**。原因: §3.9 Sidebar 阴影裁切防止 — Sidebar 阴影要越过 N|L 边界可见，需 N+main `clipsContent=false` + Sidebar z 在 L 之上。NLC并列 default (LEditMode=false) 时 Sidebar 在 main/N 内、L 也在 main 内，处于同一 z 平面。LEditMode 下 L promote 为 frame 直接子级后，若 Sidebar 仍在 main 内则 z 低于 L → 阴影被 L 的 surface fill 遮挡。

**z-order 强制**（2026-06-02 正本；与 §3.7b 同一模式，仅缺 N覆盖遮罩。状态栏/Sidebar = 绝对不可遮挡）:

```
1. main（仅含 C 栏 + N 栏外壳，但 N 栏内部不再含 Sidebar）   ← 被 遮罩-编辑 dim（C 内容）
2. 遮罩-编辑（C 列）       ← 盖在 main(C) 之上
3. L 栏                    ← frame 直接子，编辑遮罩之上（trigger 豁免）
4. Sidebar                 ← frame 直接子，L 之上（阴影 visible，N 绝对不可遮挡）
5. 状态栏-StatusBar        ← 所有 遮罩·lane·Sidebar 之上（绝对不可遮挡）
6. 杆子                    ← 最顶 z
```
> 栏间分割线 = C 栏 `strokeLeftWeight`（§3.8），无独立节点。

**MUST**:
- N 栏 + main `clipsContent = false`（§3.9 Sidebar 阴影裁切防止）
- 将 Sidebar 移至 frame 直接子级（`frame.appendChild(sidebarInst)`），保持绝对坐标（`absX = main.x + N.x + sidebarInst.x; absY = main.y + N.y + sidebarInst.y`）
- N 栏 frame 自身保留在 main 内（保留背景色 + width slot — 仅 Sidebar promote，N 外壳 frame 留在 main 内）

**NEVER**:
- 仅 promote Sidebar 而未设置 N+main `clipsContent` → 阴影在 N 右边界被裁切
- 将 N 栏 frame 整体 promote → 其它 column 与 layout 错乱

**csv-to-spec.ts zOrder 输出**（2026-06-02 正本，状态栏/Sidebar 上提至顶）:
```
NLC并列 + LEditMode → ['main','遮罩-编辑','L栏','Sidebar','状态栏','杆子']
```
（`lanes.N` 存在时自动追加 'Sidebar' entry；`lanes.N` 不存在时 = LC framework → 无 Sidebar entry，则 `['main','遮罩-编辑','L栏','状态栏','杆子']`。分割线 = strokeLeft 无独立节点）

### §3.7b 多遮罩叠加 z-order（编辑遮罩 + N 覆盖遮罩同时存在）

**WHEN**: Pad 竖 NLC 覆盖模式 + L 栏编辑同时激活（用户显式确认两种 trigger 共存）。

**z-order 强制（2026-06-02 正本；状态栏/Sidebar = 绝对不可遮挡，提至顶）**：

```
1. main（仅 C 栏）          ← 被 遮罩-编辑 + 遮罩-N覆盖 dim
2. 遮罩-编辑（C 列）        ← 盖在 main(C) 之上
3. L 栏                     ← 编辑遮罩 之上（编辑时 L 豁免），N 覆盖遮罩 之下（覆盖时 L 被 dim）
4. 遮罩-N覆盖（全 frame）   ← 盖在 L+C 之上 → L、C 均 dim
5. Sidebar                  ← N 覆盖遮罩 之上（N=trigger 豁免，绝对不可遮挡）
6. 状态栏-StatusBar         ← 所有 遮罩·lane·Sidebar 之上（绝对不可遮挡，时间信号始终可见）
7. 杆子                     ← 最顶 z
```
> 栏间分割线 = C 栏 `strokeLeftWeight`（§3.8），无独立节点。

**关键**：
- **状态栏 + Sidebar = 绝对不可被任何遮罩遮挡**，永远在所有遮罩之上（状态栏仅次于杆子）。dim 只作用于内容区（main / L 栏）。
- 两遮罩对 L 栏的覆盖关系**不同** —— 编辑遮罩在 L 之下（编辑时 L 豁免），N 覆盖遮罩在 L 之上（覆盖时 L 被 dim）。
- ❌ **不可**凭直觉把两遮罩并列在 L 栏下方（曾发生过的错误）。
- ❌ **不可**把 `遮罩-N覆盖` 或 `遮罩-编辑` 提升到 `状态栏` / `Sidebar` 之上（会遮住绝对不可遮挡层 —— 用户 2026-06-02 指示）。

## §3.8 栏间分割线规则

**节点形态**（2026-05-28 修订, 复原 user 原定义）: **C 栏自身的 `strokeLeftWeight = 1`**。栏 frame 左侧外框线表达分割线 (状态栏区域因 status bar instance fills=[] 透明 + 各栏 y=0 h=frameH 风满 → 栏 fill 透出至状态栏区域, stroke 自然延续).

**旧版 (`独立 RECTANGLE`) 废弃理由**: 仅当 status bar 不透明时才 valid. 本 skill 的 status bar fills=[] (`common-rules-principles.md §0 #26` + Q1 user choice) 上下文中 strokeLeftWeight 更自然且符合 user 原定义.

**布局模式 → 位置**:

| 模式 | 适用对象 | strokeLeft |
|------|---|---|
| LC（Fold 内横/内竖）| C 栏 | 1 |
| NLC 并列（Pad 横）| C 栏 (L\|C) | 1（**N\|L 无**，Sidebar 阴影分隔）|
| NLC 覆盖（Pad 竖）| C 栏 | 1 |
| NLC 收起 (笔记/待办: N 自体消失 → 回归 LC) | C 栏 | 1 |
| NC | — | 0 |
| C 通栏 | — | 0 |

**实现代码**:
```js
const strokePaint = await bindStrokePaint('分割线色/outline', {r:0,g:0,b:0}, 0.1);
C.strokes = [strokePaint];
C.strokeWeight = 0;       // disable all sides default
C.strokeTopWeight = 0;
C.strokeRightWeight = 0;
C.strokeBottomWeight = 0;
C.strokeLeftWeight = 1;   // only left
C.strokeAlign = 'INSIDE';
```

**MUST**:
- 各栏 frame `y = 0, h = frameH` 风满 (栏 fill 透出至状态栏区域)
- status bar instance `fills = []` (透明)
- C.strokes[0] 必须绑定 `分割线色/outline` token

**NEVER**:
- 用独立 RECTANGLE 表达栏间分割线 (status bar 透明时 redundant)
- 在 NLC N\|L 边界加分割线 → 与 Sidebar 阴影双重分隔

## §3.9 Sidebar 阴影裁切防止 (已迁出)

> **2026-05-26 迁出**: 该规则迁至 [`component-dictionary/sidebar.md` 「阴影裁切防止」节](component-dictionary/sidebar.md) 单一来源. 配置位置 / clipsContent 设置 / Phase 6 校验 全部参见该文件.

### §3.9-scope clipsContent 规则的精确 scope (2026-06-02 追加, MUST)

**Default**: `frame` / `main` / `L 栏` / `C 栏` / `N 栏` 全部 **`clipsContent = true`** (圆角 visible + lane overflow 防止).

**例外 (Pad横 NLC并列 仅 1 case)**: §3.9 Sidebar 阴影可见性需要, 仅 **`main` + `N 栏`** 设 `clipsContent = false`. **`frame` / `L 栏` / `C 栏` 保持 `true`**.

**禁止**:
- §3.9 规则被错误泛化导致 `frame.clipsContent=false` → cornerRadius 视觉表现消失
- `L 栏 / C 栏.clipsContent=false` → chip `.选项` items, SearchBar inner, NavBar 标题 text 溢出 lane

**runtime 自动检查**: `verify.ts ⑱` 自动检测 (`spec.framework='NLC并列' && spec.device='Pad横'` flag 触发).

**回顾 (2026-06-02)**: 笔记多终端适配 task 中 §3.9 规则被错误泛化 → 4 frame 全部 frame/main/L/C 全套设 false. 圆角消失 + chip overflow + 标题 overflow. user 指出后修正. .md only 规则 6 个月内 7 次复发 (依据 memory `feedback_runtime_enforce_rules`) → 必须 runtime guard 化.

---

> **关联文件**: principles → `common-rules-principles.md` / instance → `common-rules-instance.md` / verify → `common-rules-verify.md` / prohibit → `common-rules-prohibit.md`.
