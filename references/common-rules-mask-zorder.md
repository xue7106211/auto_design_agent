# 通用规则 — 遮罩 / z-order / 栏间分割线

> Phase 5 落位 시 매번 로드. NLC 覆盖 / L 编辑 / NL framework / NLC 并列 / 多 mask 叠加 / 栏间分割线 / Sidebar 阴影.
> 본 파일 = §3.7~§3.7b (mask z-order) + §3.8 (栏间 분할선) + §3.9 (Sidebar 阴影 pointer).
> 원칙 → `common-rules-principles.md`. instance → `common-rules-instance.md`. 验证 → `common-rules-verify.md`. 禁止 → `common-rules-prohibit.md`.

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

**遮罩覆盖范围原则（核心）**：
- 遮罩 = 该 trigger 列**全域**（含其上方 status bar 区域）。
- N 覆盖 trigger = Sidebar 列。**Sidebar 列以外的全部区域（含 状态栏 全幅）= 遮罩范围**。
- ❌ 不要再用「状态栏可读性 / 时间信号可读」这类 rationale 推导 z-order。覆盖关系按「列归属」决定：trigger 列豁免，其它列（含 status bar 对应区段）一律 dim。

**frame 直接子级 z-order**（从底到顶）：

```
1. main（含 L 栏 + C 栏）
2. 状态栏-StatusBar
3. 栏间分割线              ← 遮罩-N覆盖 之下 → 分割线 一同 dim
4. 遮罩-N覆盖              ← 在状态栏 + 分割线 之上 → 状态栏 / 分割线 均被 dim（仅 N 列除外，由 Sidebar promote 完成）
5. Sidebar                 ← N 覆盖遮罩之上（Sidebar = N trigger，唯一豁免）
6. 杆子                    ← 风满 + 透明 + 最顶 z
```

**MUST**:
- 遮罩-N覆盖 必须在状态栏之上（否则状态栏不被 dim，违反「全 frame 除 trigger 列豁免」原则）。
- Sidebar 在所有后续 appendChild 后必须保持上述 z 位（不能被杆子取代）。

**NEVER**:
- 把 `状态栏` 提升到 `遮罩-N覆盖` 之上。
- 缺 `遮罩-N覆盖` —— 否则 N 栏与 L+C 视觉无分层。

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

**关键解释**：spec `device-dimensions.md`「遮罩定义 / 适用范围」 写「整个 frame，触发控件除外」。**触发控件 = L 栏整列**（含其上方 status bar 区域）。所以遮罩区 = `frame − L 列 = C 列（含 C 列上方 status bar 区段）`。N 栏触发时同理（遮罩 = 全 frame − Sidebar 列）。

**遮罩覆盖范围原则（与 §3.7 一致）**：
- 遮罩-编辑覆盖 **C 列全域，含 C 列上方的 status bar 区段**（即 status bar 的 C 列区段必须被 dim）。
- ❌ 不要再用「状态栏可读性 / 时间信号可读」rationale 推导 z-order。L 列上方的 status bar 不被 dim 是因为它属于 trigger 列（L），与「可读性」无关。

**z-order 强制（遮罩-编辑 必须在状态栏之上，C 列 status bar 区段才会 dim）**：

```
1. main（仅含 C 栏；L 栏从 main 提升到 frame 直接子级）
2. 状态栏-StatusBar
3. 栏间分割线              ← 遮罩-编辑 之下 → 分割线 一同 dim
4. 遮罩-编辑（C 列）       ← 在状态栏 + 分割线 之上 → C 列 status bar 区段被 dim
5. L 栏                    ← frame 直接子，覆盖在编辑遮罩之上（trigger 除外）
6. 杆子
```

**MUST**:
- 遮罩-编辑 必须在状态栏之上（C 列 status bar 区段 dim 必需）。
- L 栏从 main 内部移出至 frame 直接子级（`frame.appendChild(L)`），定位 `x = L 列起点, y = statusBarH`。否则无法在 z-order 上凌驾于 frame 级遮罩之上。
- main 内部仅保留 C 栏（其它列 promote）。
- 遮罩-编辑 必须位于 frame 直接子级，禁止放入 C 栏内部（C 栏内部遮罩无法盖住 C 列上方 status bar 区域，且无法被 frame-level 圆角裁切）。

**NEVER**:
- 把 `状态栏` 提升到 `遮罩-编辑` 之上。
- 把 `遮罩-编辑` 做成全 frame 尺寸 → 会盖住 L 列触发区域。
- 把 `遮罩-编辑` 放入 C 栏 children → C 栏只占 mainH 高，盖不到 status bar 区。
- L 栏继续留在 main 内部 → 无法 z-promote 到遮罩之上。

### §3.7a-NL NL framework + LEditMode 处理

**WHEN**: framework = NL (list-only, 无 detail 列), `flags.LEditMode = true`. NL 无 C 列 → 无「编辑遮罩」概念.

**规则**: 所有 device / 子形态 一律 mask 不渲染, L 栏不 promote, z-order 沿用 NL 通则 (`main → 状态栏 → 栏间分割线 → 杆子`). §3.7a 的 mask + L promote 机制仅适用于含 C 列 framework (LC / NLC / NLC 覆盖).

**verifyChecklist 兼容**: `spec.framework = 'NL'` 时 ⑩~⑫ 全部 skip, 勿传 `spec.editMask` 等.

### §3.7a-NLC并列 NLC并列 framework + LEditMode → Sidebar 也 promote

**WHEN**: framework = NLC并列 (Pad横 default), `flags.LEditMode = true`，N 栏存在。

**规则**: 除编辑遮罩 + L promote 外，**Sidebar (N 栏) 也必须 promote 为 frame 直接子级**。原因: §3.9 Sidebar 阴影裁切防止 — Sidebar 阴影要越过 N|L 边界可见，需 N+main `clipsContent=false` + Sidebar z 在 L 之上。NLC并列 default (LEditMode=false) 时 Sidebar 在 main/N 内、L 也在 main 内，处于同一 z 平面。LEditMode 下 L promote 为 frame 直接子级后，若 Sidebar 仍在 main 内则 z 低于 L → 阴影被 L 的 surface fill 遮挡。

**z-order 强制**（与 §3.7b 同一模式，仅缺 N覆盖遮罩）:

```
1. main（仅含 C 栏 + N 栏外壳，但 N 栏内部不再含 Sidebar）
2. 状态栏-StatusBar
3. 栏间分割线              ← 遮罩-编辑 之下
4. 遮罩-编辑（C 列）       ← 状态栏 + 分割线 之上
5. L 栏                    ← frame 直接子，编辑遮罩之上
6. Sidebar                 ← frame 直接子，L 之上（阴影 visible）
7. 杆子
```

**MUST**:
- N 栏 + main `clipsContent = false`（§3.9 Sidebar 阴影裁切防止）
- 将 Sidebar 移至 frame 直接子级（`frame.appendChild(sidebarInst)`），保持绝对坐标（`absX = main.x + N.x + sidebarInst.x; absY = main.y + N.y + sidebarInst.y`）
- N 栏 frame 自身保留在 main 内（保留背景色 + width slot — 仅 Sidebar promote，N 外壳 frame 留在 main 内）

**NEVER**:
- 仅 promote Sidebar 而未设置 N+main `clipsContent` → 阴影在 N 右边界被裁切
- 将 N 栏 frame 整体 promote → 其它 column 与 layout 错乱

**csv-to-spec.ts zOrder 输出**:
```
NLC并列 + LEditMode → ['main','状态栏','分割线','遮罩-编辑','L栏','Sidebar','杆子']
```
（`lanes.N` 存在时自动追加 'Sidebar' entry；`lanes.N` 不存在时 = LC framework → 无 Sidebar entry）

### §3.7b 多遮罩叠加 z-order（编辑遮罩 + N 覆盖遮罩同时存在）

**WHEN**: Pad 竖 NLC 覆盖模式 + L 栏编辑同时激活（用户显式确认两种 trigger 共存）。

**z-order 强制（按 reference frame 验证，禁止从 spec text 推测）**：

```
1. main（仅 C 栏）
2. 状态栏-StatusBar
3. 栏间分割线              ← 所有遮罩 之下 → 分割线 一同 dim
4. 遮罩-编辑（C 列）       ← 在状态栏 + 分割线 之上（与 §3.7a 一致）→ C 列 status bar 区段 dim
5. L 栏                    ← 编辑遮罩 之上，N 覆盖遮罩 之下
6. 遮罩-N覆盖（全 frame）  ← 高 z；L 栏 / 状态栏 / 编辑遮罩 都被 N 覆盖一并 dim
7. Sidebar                 ← N 覆盖遮罩 之上（唯一豁免：Sidebar = N 覆盖 trigger）
8. 杆子
```

**关键**：
- **每个遮罩都覆盖该 trigger 列以外的全域（含 status bar 对应区段）**，与「可读性」rationale 无关。
- 两遮罩对 L 栏的覆盖关系**不同** —— 编辑遮罩在 L 之下（L 豁免），N 覆盖遮罩在 L 之上（L 被覆盖）。各自的 trigger 控件（L 栏 / Sidebar）相对各自遮罩 z-up，与另一 trigger 无关。
- ❌ **不可**凭直觉把两遮罩并列在 L 栏下方（曾发生过的错误）。
- ❌ **不可**把 `状态栏` 提升到任一遮罩之上。状态栏在两遮罩之下，按列归属规则被 dim。

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

---

> **연관 파일**: principles → `common-rules-principles.md` / instance → `common-rules-instance.md` / verify → `common-rules-verify.md` / prohibit → `common-rules-prohibit.md`.
