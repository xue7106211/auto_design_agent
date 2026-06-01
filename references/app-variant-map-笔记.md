---
name: app-variant-map
description: 笔记应用的语义组件在不同设备与屏幕模式下的目标变体映射表
app: 笔记
kind: app-variant-map
sourceOfTruth: manual
status: draft
---

# 笔记 App Variant Map

## 查询契约

- 输入：`appName + device + screenMode + resolvedUiElement`
- 输出：`resultType + variantId`
- 若未命中：返回 `undefined`，调用方必须中止，不允许猜测

---

## §0. 应用规则要点（必读，先于映射表）

> 本节是 笔记 / 待办 适配的**强制规则**，落位前必须全部内化。映射表只回答「用哪个 variant」，本节回答「怎么放」。Phase 6 通用 `verifyChecklist` 之外另需验证本节项目。

### §0.0 framework 分支 + mapping SoT

**笔记 app 内各 sub-scene 的 standard framework**:

| sub-scene | standard framework | 备注 |
|-----------|--------------------|-----|
| 笔记 (standard) | **NLC** | Pad NLC（並列/覆盖）/ Fold内 LC drilldown / 手机·Fold外 NLC→C |
| 待办 (Tasks) | **NLC** | 与笔记同一 framework，仅使用 List_Task variant |
| 私密笔记 | **LC** | Pad LC（无 N）/ Fold内 LC / 手机·Fold外 LC→C。§0.1a 的「Pad LC 例外」即此情形 |

**Fold内 device 的全部 framework**：NLC standard 在 Fold内 drilldown 至 LC / NC / C。CSV `结构变化表-Notes.csv` row 的 col 1 sceneCondition (`/ NLC`) 仅表示 standard framework，Fold内 column cell 的实际数据为 colScene drilldown 结果。详细解释规则见 [common-rules §3.13](common-rules.md)。

**Mapping Source of Truth**:

| 类别 | 位置 | 权威 |
|------|------|------|
| Input CSV（designer 编写）| `csv-pipeline/mapping-input/结构变化表-Notes.csv` | **单一权威** — 笔记 + 待办两个 app 均从此文件抽取 |
| 控件变体 spec | `csv-pipeline/mapping-input/控件变体清单.csv` | variant 的 padding / 自然 size 权威 |
| Derived（extract 结果）| `csv-pipeline/mapping-output/app-Notes-mapping.csv` | Phase 4 lookup 使用（read-only，禁止直接编辑）|
| 本文档（`app-variant-map-笔记.md`）| references/ | **上述 CSV 的人类可读镜像 + 落位规则** — CSV 变更时本文档须同步更新 |

CSV vs 本文档冲突时处理：[common-rules §3.11](common-rules.md#§3.11-csv-vs-map-source-of-truth-冲突)。

### §0.1 落位关键规则（速查）

| # | 规则 | 详细 |
|---|------|------|
| 1 | **C 栏 TextInput bottom flush** | `y = mainH − TI.h`，**bottom 贴 frame 底**，与杆子 16dp 重叠（笔记 NoteEditPanel 源稿 convention） |
| 2 | **Detail / DetailTask 位置与高度（Fold + Pad C 栏共通）** | **`y = 62, height = mainH − 62`**。即使 C 栏 NavigationBar = `_00`（不渲染），Detail 仍从 y=62 起始（保留 NavBar 预留区域 6+56=62dp）。笔记 NLC 有 TI 时 Detail 延伸到 TI 下方（TI 通过 z-order + fade overlay）；待办无 TI 时 Detail 直接延伸到 mainH 底部。**禁止** NavBar 不渲染时将 Detail 上提到 `y=0`（破坏统一栏内起始线） |
| 3 | **C 栏 z-order** | `NavBar → Detail → TextInput`（TI 在上层 fade overlay 在 Detail 之上）；杆子在 frame 直接子级 |
| 4 | **L 栏 顺序** | `NavBar(56) → SearchBar(56) → SelectableChip(52) → List → BottomBar(100, 底)`；**与源稿 Chip↔Search 顺序差异时以 spec 为准** |
| 5 | **杆子（home indicator）** | → `component-placement-protocol.md` 通用规则 (frame 直接子级, 最顶 z, fills=[], x=0/w=frameW). 笔记 无独有规则 |
| 6 | **覆盖模式 遮罩 z-order** | → `common-rules §3.7 / §3.7a / §3.7b` 统一. 笔记 无独有项目 (Pad 竖 NLC 覆盖 + L 编辑 同时 等 全部由本文权威) |
| 7 | **栏背景色 token** | **判定 = 容器内 list 的 card-presence**: 卡片 / 套卡 → `surface_low`, flat list (如 `List_Task_03`) → `surface`. **N 栏 (Sidebar) = 跟随 L (无则跟随 C)**. 详细 device × screenMode 矩阵 + 决策树 → §0.3 本文 + 末尾「栏背景色」表权威 |
| 8 | **NL framework L 栏 顶部通则** | 笔记 / 待办 **宫格 NL framework**：N 收起时 N 栏自身消失 + **L 栏 width = frameW**（满幅吸收）。**⚠️ 禁止** device-dim 通用 NL 收起 split（`N=88 + L=1334/861`）。<br>**NL framework L 栏 NavBar 一律 `_00`（不渲染，默认 + 编辑均同）** — 顶部统一使用 `TopBar_X` 单独放置；TopBar 自身为 NavBar + SearchBar 合成变体（NavigationBar set 内「顶部导航」family）。<br>**NL framework N 栏 NavBar 也一律 `_00`（不渲染，默认 + 编辑、展开 + 收起 均同）** — Sidebar (`Sidebar_Component_PAD_NLC_01`) 内部 `NavigationAtoms`（56dp）已承担 N 栏标题栏角色，**禁止** 在 N 栏外额外放置 `NavigationBar_ComponentSet_12 / _18` 等：<br>&nbsp;&nbsp;• **默认 展开** → `TopBar_03`（内含 NavBar_07 + SearchBar_02）<br>&nbsp;&nbsp;• **默认 收起** → `TopBar_07`（内含 NavBar_17 + SearchBar_02，**自带 N 恢复 icon**）<br>&nbsp;&nbsp;• **编辑 展开** → `TopBar_09`（内含 NavBar_18 + SearchBar_02）<br>&nbsp;&nbsp;• **编辑 收起** → `TopBar_08`（内含 NavBar_18 + SearchBar_02，**自带 N 恢复 icon**）<br>NL framework 中 L NavBar 不允许单独放置，TopBar_X 已吸收 NavBar 角色。NLC framework（笔记 / 待办之外的应用）才使用 88dp `Sidebar_Component_PAD_NLC_00`。详见「N 收起 规则」节 + common-rules §0 #19 |
| 9 | **Fold 内 NL→C 单栏 fallback 通则** | Fold 内屏 framework 仅含 `NC / LC / C`，**无 NL**。NL 语义（`N+L`，无 C）在 Fold 内屏渲染时 fallback 为 **C 单栏 + L 内容上提**：list / 顶部模块直接占据 C 栏。CSV 表中 NL 行 `Fold内竖-C` / `Fold内横-C` 列即该 fallback 形态使用的具体 variant，**device-specific**。本规则仅适用 Fold 内屏；Pad 上 NL 是真实 framework 不 fallback。**List 默认 / NL** device-specific 变体（奇数序列）：`手机竖=_05` / `Fold外竖=_07` / `Fold内竖 C 单栏=_09` / `Fold内横 C 单栏=_11` / `Pad竖NL=_13` / `Pad竖NL收起=_15` / `Pad横NL=_17` / `Pad横NL收起=_19`。**编辑 NL** device-specific 变体（偶数序列）：`手机竖=_06` / `Fold外竖=_08` / `Fold内竖=_10` / `Fold内横=_12` / `Pad竖NL=_14` / `Pad竖NL收起=_16` / `Pad横NL=_18` / `Pad横NL收起=_20`。<br>**Fold 内 NL→C fallback 顶部 stack**（2026-05-28 追加）：禁止使用 Pad NL 专用合成变体 `TopBar_03/_07/_08/_09`。与笔记 LC 一致采用独立 stack：NavigationBar `_04`（中标题 56h，无返回，右侧 search Q + menu ⋮）+ SearchBar `_05`（392 满幅，56h）+ Chip + List + BottomBar。错误变体（例如 NavBar `_10`）会导致 title text 显示为空 "小标题" placeholder 且 search Q icon 消失。**Pad NL 展开** 时不渲染 chip（笔记 NLC L 栏 default 的 Chip 顺序不适用 — Pad NL home 直接进入 list）。|
| 10 | **Sidebar_Notes attached form 풀히트 룰**（2026-05-31 정식 채택, MUST）| `Sidebar_Notes_01` 은 笔记 ManageFoldWindow attached form 으로 사용. master 에 `layoutSizingV='Fill'` + 자연 H=589 정의. 매핑표 line 512-515 (Fold 全 device, line 513 Fold外竖 / line 514-515 Fold内 LC) 가 본 component 를 가리키면 다음 룰 **MUST**:<br>① **외각 H 풀히트**: `inst.resize(324, mainH)` (= `frameH − statusBarH`). 자연 589 그대로 사용 금지 (Fold 内횡 mainH=582 시 7dp 杆子 영역 침범; Fold 内竖 mainH=842 시 253dp 빈 공간).<br>② **位置**: `x=0, y=statusBarH` (左侧 attached, 状态栏 아래). 浮窗 居中 룰 적용 금지 (浮窗 ≠ Sidebar attached).<br>③ **inner FILL 적용 범위**: `inst.children[0]` (`近手菜单组件`) 만 `layoutSizingV='FILL'`. 그 자식 (`新版标题栏` 자연 H=56 / `文件夹列表` 자연 H=52 / `列表组/分割线` 자연 H=24) 은 master HUG/FIXED 그대로 유지. **`Sidebar_Component_PAD_NLC` 系 의 3-级 递归 FILL 룰 (BoardMaterialSection / NavigationSizeSection / 内容区域) 적용 절대 금지** — 구조 다름. 잘못 적용 시 「新版标题栏」 H 가 mainH 까지 늘어 (예: 280dp) icon `y=120` 위치 비정상.<br>④ **Pad device 는 다른 매핑** (`Notes_FloatingWindow_01` 浮窗 居中 + 遮罩) 적용 — 본 룰 적용 안 함. line 516-517 행 lookup 별도.<br>⑤ **runtime 자동 적용**: `placeStandardComponent({ inst, w:324, h:mainH, ... })` 호출 시 `placement.ts` step 7c 가 ③ 자동 적용. verifyChecklist `sidebarMainH:true` 옵션이 ①②③ 모두 자동 검사.<br>⑥ **회고**: master 에 `layoutSizingV='Fill'` 가 정의되어 있어도 figma `createInstance()` 는 default `FIXED` 로 시작 → master Fill 가 자동 전파되지 않음. 따라서 명시 호출이 정식 룰로 필요. (2026-05-31 笔记-文件夹 적응 task 에서 Fold 横屏 杆子 침범 / 竖屏 빈 공간 발견 후 정식 채택; 이전 §0.5 历史踩坑 항목에서 승격) |
| 11 | **Notes_FloatingWindow_01 Pad 浮窗 落位 룰**（2026-05-31 정식 채택, MUST）| Pad device (NLC) 浮窗 落位: `inst.resize(546, H)` 居中 (H: Pad竖=636 / Pad横=round(frameH×0.8)=759, device-dim 「浮窗 FloatingWindow」 spec). 浮窗 z 아래 `RECTANGLE 遮罩-浮窗-ManageFold` (frameW×frameH, fill `遮罩色/mask` 0.2). z-order: `... → Sidebar (있다면) → 遮罩-浮窗 → Notes_FloatingWindow → 杆子`. NCovering 遮罩 위에 stacking 허용 (双层 mask). Fold device 는 §0.1 #10 (`Sidebar_Notes` attached form). cross-file master cascade FIXED chain 통칙 = `common-rules §3.6 #9a` 참조 |

### §0.1-AI 特殊子场景 framework 规则（AI提问 / 录音 等 C栏直接使用子场景）

> 以下子场景的 framework **按 CSV `结构变化表-Notes.csv` 该行 device 列 header 判定**，不从源 frame 外观推断。

| 子场景 | 手机 | Fold内 | Pad |
|--------|------|--------|-----|
| AI提问（AI对话） | DrawerWindow（全屏） | C（通栏） | NC（N+C） |

**强制约束**：

1. **浮窗 FloatingWindow 行不适用**：「抽屉窗口 / 浮窗 FloatingWindow」映射行（§浮层 Overlay）定义的是通用 Overlay 容器转换；AI提问 C栏内容**直接落位于 C 栏 frame**，不套 FloatingWindow 容器。
2. **DrawerWindow 仅限手机**：DrawerWindow_ComponentSet 是手机（392dp）专用容器。Fold / Pad 上 CSV "容器" 列值为「竖屏背景」时 → 用 frame fill（`背景色/surface_low`）替代，**禁止 resize DrawerWindow 到大屏尺寸**。
3. **AIWindow_Options variant 必须 device-specific swap**：`_01`→手机 / `_03`→Fold内竖 / `_04`→Fold内横 / `_05`→Pad竖 / `_06`→Pad横。**禁止**将手机 variant 直接 resize 到目标设备宽度（内部结构会崩溃）。先 swap 到目标 variant，再按该 variant 自然宽度放置。
4. **TextInput padding 同步规则**：AI提问场景中 TextInput_ComponentSet_Notes 以**栏满宽**（`x=0, w=栏W`）放置，**内部 paddingLeft / paddingRight** 与 AIWindow_Options 对应 variant 的有效内容 paddingLeft 一致（保持「气泡 ↔ 输入框」视觉左边缘对齐）。
   - **规则公式**：`TextInput.x = 0`, `TextInput.w = 栏W`, `TextInput.paddingLeft = TextInput.paddingRight = X`
   - **X 的测量方法**：AIWindow_Options instance 左边缘 → 内部首个胶囊（`TabMaterial-Showcase`）左边缘的水平距离。即：`X = bubble.absoluteX − aiWindow.absoluteX`（递归查找首个 name 含 `TabMaterial` 的节点）
   - **当前参考值**（2026-05-22 实测，库更新后须重新验证）：

     | variant | X (dp) | 来源层级 |
     |---------|--------|---------|
     | `_01`（手机） | 24 | firstChild `.标题栏` paddingLeft=24 |
     | `_03`（Fold内竖） | 24 | firstChild `.标题栏` paddingLeft=24 |
     | `_04`（Fold内横） | 124 | firstChild `.标题栏` paddingLeft=124 |
     | `_05`（Pad竖） | 28 | topLevel paddingLeft=28 |
     | `_06`（Pad横） | 56 | topLevel paddingLeft=56 |

   - **禁止**：① 使用 device-dimensions 断点表 padding 替代本规则 ② 仅凭 AIWindow 顶层 `paddingLeft`（Fold 系 variant 全部为 0）判定 —— 必须按测量方法实测或查参考表 ③ 旧公式 `TextInput.x=X, w=栏W−2X`（已废弃，改为栏风满+内部 padding）
5. **栏背景色**：AI提问 C 栏 frame fill = `背景色/surface_low`（与 AIWindow 灰色对话背景一致）。frame 外壳也同色（StatusBar 透明后底色一致）。
5a. **AIWindow_Options 位置（C 栏内 left-attached, 2026-05-31 정식 채택, MUST）**：自然 폭 그대로 + **`x = 0`**（C 栏 좌측 起点 attached），中央정렬 금지. 源稿 (手机 DrawerWindow 内 x=0) 와 시각 一致 보장. `y = statusBarH + 6 + 56`（NavBar 아래 stack 시작）. 본 룰의 root cause: AI对话 자연 폭 < 栏 폭이라 中央정렬 시 좌측 여백 발생, 源稿 좌측 attached pattern 일치 안 함. **회고**: 2026-05-31 适配 시 `aiX = (栏W − 自然W)/2` 직관 적용 → user 가 「위치 부정확」 지적 → 본 룰로 정식화. (Pad横 NC 의 `_06` 1150×263 = 栏폭 1150 우연 일치라 중앙=좌측 동일했지만, Fold內横 `_04` / Fold內竖 `_03` / Pad竖 `_05` 의 자연폭 < 栏폭 때문에 좌측 여백 발생).
6. **NavigationBar variant（CSV 权威）**：

     | device | C栏 NavigationBar | N栏 NavigationBar |
     |--------|-------------------|-------------------|
     | 手机 | `_10` | — |
     | Fold外竖 | `_13` | — |
     | Fold内竖 C | `_13` | — |
     | Fold内横 C | `_13` | — |
     | Pad竖 NC 展开 | `_10` | `_00`（不渲染，Sidebar 内部 NavigationAtoms 代替） |
     | Pad横 NC 展开 | `_10` | `_00` |
     | Pad竖 NC 收起 | `_12` | `_00` |
     | Pad横 NC 收起 | `_12` | `_00` |

   - **N栏 NavigationBar 永远 `_00`**：Sidebar_Component_PAD_NLC_01/00 内部 NavigationAtoms（56dp）已承担标题栏角色，禁止在 N 栏外部另放 NavigationBar
   - **禁止**：将 Fold C 通栏的 `_13` 套用到 Pad C栏（Pad C栏必须 `_10`/`_12`）
9. **Sidebar variant（AI对话 NC 专用行）**：

     | device | N栏 Sidebar |
     |--------|-------------|
     | Pad NC 展开 | `Sidebar_Component_PAD_NLC_01`（272dp） |
     | Pad NC 收起 | `_00`（不渲染，**N栏自身消失 + C栏 width=frameW 满幅吸收**，同宫格NL收起逻辑） |
     | 手机 / Fold | —（C 通栏，无 N 栏） |

   - `_00` = 不渲染 / 不占位，与 `NavigationBar_00`、`BottomBar_00` 同理。NC收起时 N栏仅保留 88dp 空白背景列。
7. **StatusBar variant**：手机 / Fold = `StatusBar_01`（h=46）；Pad = `StatusBar_03`（h=34）。AI提问场景 StatusBar **fills=[]（透明）**，底色由 frame fill 提供。
8. **SwipeIndicator / 杆子 variant**：

     | device | variant |
     |--------|---------|
     | 手机 | `SwipeIndicator_01` |
     | Fold外竖 | `SwipeIndicator_03` |
     | Fold内竖 | `SwipeIndicator_05` |
     | Fold内横 | `SwipeIndicator_06` |
     | Pad竖 | `SwipeIndicator_07`（杆子 Pad竖 variant） |
     | Pad横 | `SwipeIndicator_08`（杆子 Pad横 variant） |

### §0.1a 各设备默认 layoutType（强制 lookup，禁止跨设备共用）

> **本表是 Phase 2 `targetVariantPlan` 的 layoutType 决定权威**。每个适配 frame 的 layoutType 必须按本表 device 列查询，**不得**因「源稿塌缩为单一画面」而把所有 frame 统一为同一 layoutType。

| device | default layoutType | 子模式 / 说明 |
|---|---|---|
| 手机 / Fold 外屏 | C（单一画面）| — |
| Fold 内屏 横屏 | **LC** | 0.4:0.6（笔记常规）；0.5:0.5 仅电话 |
| Fold 内屏 竖屏 | **LC** | — |
| Pad 横屏 | **NLC（并列）** | N 272 + L 428 + C 722；NLC 横屏无覆盖形态 |
| Pad 竖屏 | **NLC（覆盖）** | N 272 覆盖 L 428 + C 521；含 `遮罩-N覆盖` |

**例外（必须 user 显式指定才允许偏离）**：

| 偏离场景 | 触发条件 |
|---|---|
| Pad 用 LC（无 N 栏） | 仅秘密笔记 / 用户明确「Pad 不要 N 栏」|
| Pad 用 NL / NC | 用户明确「无 C 栏 / 无 L 栏」 |
| Fold 内用 NC / C | 用户明确指定 |

**Phase 2 强制流程**：

1. step A：钻取塌缩（drilldown collapse）→ 决定 frame 数（device × 方向）
2. step B：每个 frame 查本表 → 决定该 frame 的 layoutType（**device 别**，不共用）
3. step C：AskUserQuestion 时 **device 别**列示 layoutType（如 `Fold→LC, Pad→NLC`），禁止「全部 LC」「全部 NLC」单选项作为默认

**Phase 6 校验**：`frame.name` 中的 layoutType ↔ 本表 device default 一致。偏离 → user 明示记录在「妥协项」中。

### §0.1b scenarioFlags 导出信号表（笔记 / 待办）

> **作用**：SKILL Phase 4 step 7 输出 `scenarioFlags` JSON 时，唯一权威 lookup source。**禁止从直觉推测 flag 值**，必须按本表信号匹配。

| flag | 激活信号（任一 ✅ 即激活）| 关联触发 |
|------|--------------------------|---------|
| `LEditMode` | source frame 名含 `已选` / `选择` / `编辑模式` • L 栏 `List_Notes` variant ∈ `{_02, _04, _06}`（编辑系列）• L 栏出现 `ToolBar_ComponentSet_01` / `_02`（编辑工具栏）• L 栏 NavigationBar variant ∈ `{_03, _06, _09, _18}`（编辑系列） | **`§3.7a` `遮罩-编辑`（C 列）** |
| `NEditMode` | Sidebar variant = `Sidebar_Component_PAD_NLC_03`（编辑态）• N 栏 NavigationBar variant ∈ `{_13}`（编辑） | **`§3.7a` 整 frame 遮罩，Sidebar 除外** |
| `CEditMode` | C 栏 NoteEditPanel 变体 ∈ `{_01, _02, _03}` 出现 • C 栏 NavigationBar variant ∈ `{_03, _06, _09}` | **`§3.7a` 末 → 无 mask** |
| `NCovering` | layoutType = `NLC覆盖`（per §0.1a 由 device 决定：Pad 竖 NLC default = 覆盖） | **`§3.7` `遮罩-N覆盖`（全 frame）** |

**填写规则**：

1. **每 flag 独立判定**，互不互斥；多 flag 同时 `true` 时按 `§3.7b` 多 mask z-order 处理
2. **信号 缺失 → flag 默认 `false`**，不可推测
3. 笔记 / 待办 共用本表（同 app 子场景）；其他应用各自独立信号集
4. **新增 flag**（如 search active）→ 本表 + `common-rules §3.7*` 同步增行

#### NL framework + LEditMode 处理

笔记 / 待办 NL framework（宫格编辑场景，含 Fold 内 NL→C 单栏 fallback、Pad NL 展开、Pad NL 收起 全形态）在 `LEditMode = true` 时 **一律 mask 不渲染**。L 栏不 promote，z-order 沿用一般 NL 通则。

详见 `common-rules §3.7a-NL`。

### §0.2 padding 应用规则（device-dim 断点表 우선, 2026-06-01 修订）

> **核心原则 (修订)**：A / B 类 모두 `device-dimensions.md` 断点 padding 表 우선. 落位 公식: `outer = max(0, spec − internal)`, `inst.x = outer, inst.width = 栏W − 2 × outer`. 详见 common-rules §3.4a.1 + §3.4a.3.

#### 笔记 / 待办 标准组件落位规则（覆盖所有 frame / 栏 / framework）

| 组件类别 | 处理 |
|---------|------|
| **A 类（全部自带 internal padding 的标准组件）**：`StatusBar_*` / `NavigationBar*`（含 `_Notes`）/ `TopBar_*` / `SearchBar_ComponentSet` / `SelectableChip_ComponentSet_Notes` / `List_Notes` / `Detail_Notes` / `BottomBar_*`（含 `_Showcase_*` / `_NoteEditPanel_*` / `_Notes_Outline_*`）/ `ToolBar_*` / `Sidebar_Component_*` / `TextInput_ComponentSet_Notes` / `Fab_*` | **device-dim spec 우선 outer 합산**: `outer = max(0, spec − internal)`. internal ≥ spec 시 outer=0 (风满 + over 受 け 入 れ). 예: Pad 横 L 栏 spec=20, NavBar internal=12 → outer=8. 旧 「永远 x=0 风满」 룰 폐기 (2026-06-01 笔记 多端적응 task user 시각 검증 시 padding mismatch 발견).<br>⚠️ **本规则约束 instance 外壳; instance 内部 자식 (inner 胶囊 / TopBar root child / Sidebar BoardMaterialSection 等) 의 sizing 由 `device-dimensions.md` 各组件 専 章 규정**:<br>&nbsp;&nbsp;• **ToolBar / BottomBar_Showcase 系 inner 胶囊** (`工具个数举例` / `TabMaterial-Showcase`): **master HUG 자연 width 그대로 유지** (笔记 `BottomBar_Showcase_Notes_02` capsule = 220, 待办 ToolBar 등 master 별 다름). instance level 강제 변경 금지 (button icon stretch 발생). BB instance 외각 = lane W 풍만, master default `counterAxisAlignItems='CENTER'` 로 capsule 가운데 정렬 자동. 旧 「栏 W ≤ 440 风满 / > 440 定宽 344」 룰 폐기 (2026-06-01, user 지적 「icon 찌그러짐」). placement.ts step 9 폐기, verifyChecklist ⑭ 폐기.<br>&nbsp;&nbsp;• **TopBar_03/_07 root child** (`Pad-TopBar_01`)：`inst.children[0].layoutSizingHorizontal = 'FILL'`（참 §0.5 末行）<br>&nbsp;&nbsp;• **Sidebar_Component 内部 BoardMaterialSection / NavigationSizeSection / 内容区域**：3 级 递归 FILL override (참 §0.5) |
| **B 类**：裸 frame / 自定义业务容器 | 按 §3.4a.3 통일 公식 (internal=0 가정 → outer = spec) |

#### 笔记 NL framework 各 frame L 栏 width（**收起态特殊覆盖 device-dim 通用规则**）

| frame | L 栏 width | 备注 |
|-------|-----------|------|
| Fold 内 横 NL→C fallback | **888**（= frameW，单栏 fallback） | NL 语义在 Fold 内屏 fallback 为 C 单栏 |
| Fold 内 竖 NL→C fallback | **628**（= frameW，单栏 fallback） | 同上 |
| Pad 横 NL 展开 | **1150**（= frameW − 272，N 可见） | N + L 并列 |
| Pad 横 NL 收起 | **1422**（= frameW，N 自体 消失）| 笔记 / 待办 special；**禁止** device-dim 通用 `N=88 + L=1334` |
| Pad 竖 NL 展开 | **677**（= frameW − 272，N 可见） | N + L 并列 |
| Pad 竖 NL 收起 | **949**（= frameW，N 自体 消失）| 同上，**禁止** `N=88 + L=861` |

#### 笔记 NLC framework 各 frame 栏 width（保持原 device-dim spec 不变，仅落位规则改为风满）

| frame | N 栏 | L 栏 | C 栏 |
|-------|------|------|------|
| Fold 内 横 LC | — | 353 | 535 |
| Fold 内 竖 LC | — | 282 | 346 |
| Pad 横 NLC 展开（并列）| 272 | 428 | 722 |
| Pad 横 NLC 收起 | — | 428 | 994（N 88 收起占位） |
| Pad 竖 NLC 展开（覆盖）| 272 覆盖 | 428 | 521 |
| Pad 竖 NLC 收起 | — | 428 | 521 |

> **示范对照**（旧 vs 新）：
> - 旧：Pad 横 NLC L=428 spec=20 → SearchBar `outer=8 / x=8 / w=412`
> - 新：Pad 横 NLC L=428 → SearchBar `x=0 / w=428` 风满（视觉 padding = internal 12dp）
> - 旧：Pad 横 NL 收起 L=1334 → List `outer=173 / w=988` 居中
> - 新：Pad 横 NL 收起 **L=1422** → List `x=0 / w=1422` 风满

#### 组件自身 padding 与 device-dimensions.md 冲突处理 (TextInput_ComponentSet_Notes 系)

`TextInput_ComponentSet_Notes_01 ~ _04` 的 components.csv `Note` 标注 `Q18 内屏：左20 / 右20`、`Q18 横屏：左116 / 右116` 等，与 **device-dimensions.md 栏断点规则**（Q18 w≤640 默认 12dp）冲突。**以 `device-dimensions.md` 栏 padding 为准**（Fold 内屏 LC = 12dp）。组件本身修复后 components.csv 将同步更新。`_05 ~ _07` 适用 `定宽 / 屏中对齐` 独立规则，不受影响。

### §0.3 必用 token 引用

> **Raw token data**（name / libraryKey / fallbackRGB / defaultOpacity）= [`csv-pipeline/data/tokens.json`](../csv-pipeline/data/tokens.json) 单一权威。Phase 4 `buildTokenCache(names)` 직접 read. 본 §0.3 = 笔记 / 待办 specific 적용 logic 만.

> **背景 token 选择规则（核心 + 普遍）**：
> - **判定标准 = 该容器内的列表组件是否带卡片，不是 app 名 / framework / 设备**：
>   - 容器上有卡片 / 套卡 list / Sidebar 菜单 / 浮起 floating 内容 → 容器 fill = **`背景色/surface_low`**（灰底，让卡片浮起）
>   - 容器是单一全幅 panel / **不带卡片的 flat list**（如 `List_Task_03`）→ 容器 fill = **`背景色/surface`**（白底）
>   - 卡片自身永远 `背景色/surface`（白），由组件自带 binding 提供
>   - ⚠️ **同一 app 内不同子场景 / 不同设备 / 不同 variant 可能不同**：判定按变种 instance 的实际结构（卡片 stacked vs flat list + divider），**禁止以 app 名 / framework 一律下定**。具体分支：
>     - **笔记 `List_Notes_01`**（手机 / Fold外）= 卡片 gap-stacked（item 사이 12dp gap, cornerRadius=20）→ `surface_low`
>     - **笔记 `List_Notes_03 / _04`**（Fold内 / Pad，default + 编辑모드）= flat list + internal `套卡列表/分割线` instance → `surface`
>     - **待办 `List_Task_01`**（手机 / Fold外）= 套卡 → `surface_low`
>     - **待办 `List_Task_03`**（Fold内 / Pad）= flat list 无卡片 → `surface`
>     - 변종 별 분기 회고: 2026-06-01 笔记多端적응 시 「笔记 List_Notes 全设备带卡片」 stale claim 으로 4 frame L 栏 fill 잘못 적용 → 본 분기 도입.
> - **笔记 / 待办 各栏归属（具体应用）**：
>   - **L 栏 笔记 手机 / Fold 外屏**（`List_Notes_01` 卡片 gap-stacked）→ `surface_low`
>   - **L 栏 笔记 Fold 内屏 / Pad**（`List_Notes_03` / `_04` flat list + internal divider）→ `surface`
>   - **L 栏 待办 手机 / Fold 外屏**（`List_Task_01` 套卡样式）→ `surface_low`
>   - **L 栏 待办 Fold 内屏 / Pad**（`List_Task_03` flat list 无卡片）→ `surface`
>   - **N 栏（Sidebar）→ 跟随 LC 背景色**（与相邻 L 栏一致；L 不存在时跟随 C）。Sidebar 卡片浮起效果由组件内部 260dp 卡片 + 12dp 透明 gap 提供；N 栏外壳与 L 视觉连续，不再独立维持 `surface_low` 灰底。具体取值取决于该 frame 的 L 栏 List variant 卡片性（默认 `_05` 卡片 → `surface_low`；编辑 `_04` flat → `surface`）|
>   - **C 栏 笔记 Detail**（单一全幅 note 内容 panel）→ `surface`
>   - **C 栏 NL→C fallback 笔记**（list 上提到 C 栏 单一画面，仍是 list 卡片）→ `surface_low`
>   - **C 栏 NL→C fallback 待办**（`List_Task_01` 套卡上提，Fold 内屏 C 单栏）→ `surface_low`
>   - **frame 笔记**（外框层）→ `surface_low`（保持卡片浮起视觉一致）
>   - **frame 待办 手机 / Fold 外屏**（List_Task_01 套卡）→ `surface_low`
>   - **frame 待办 Fold 内屏 / Pad**（List_Task_03 无卡片）→ `surface`
> - **强制规则**：每个 frame 的 `bindFill` 调用前，必须重新 trace 该 device 的 List variant → card-presence → token 决定链，禁止跨 device 复用上一 frame 的 token 选择。

#### device × screenMode 的 fill 矩阵 (笔记 + 待办)

> 「不存在」= 该 device 未使用该 screenMode。「待定」= 设计师尚未提供。

**手机 / Fold外屏**（单一画面 = `C` only）

| device | frame 背景色 |
|--------|------------|
| 手机竖 | `surface_low` |
| 手机横 | 待定 |
| Fold外竖 | `surface_low` |
| Fold外横 | 待定 |

**Fold 内屏**（NC / LC / NL→C fallback / C — 不使用 NLC）

| device | screenMode | frame | N 栏 | L 栏 | C 栏 |
|--------|-----------|------|------|------|------|
| Fold内竖 | NC | `surface_low` | `surface_low` | 不存在 | `surface` |
| Fold内竖 | LC | `surface_low` | 不存在 | `surface` (笔记 List_Notes_03 flat) | `surface` (笔记 Detail) |
| Fold内竖 | NL→C fallback | `surface_low` | 不存在 | 不存在 | `surface_low` (list 上提) |
| Fold内竖 | C | `surface_low` | 不存在 | 不存在 | `surface` (Detail full bleed) |
| Fold内横 | NC | `surface_low` | `surface_low` | 不存在 | `surface` |
| Fold内横 | LC | `surface_low` | 不存在 | `surface` (笔记 List_Notes_03 flat) | `surface` (笔记 Detail) |
| Fold内横 | NL→C fallback | `surface_low` | 不存在 | 不存在 | `surface_low` (list 上提) |
| Fold内横 | C | `surface_low` | 不存在 | 不存在 | `surface` (Detail full bleed) |

**Pad** (NLC / NLC收起 / NL / NL收起 / NC / NC收起 / LC / C)

| device | screenMode | frame | N 栏 | L 栏 | C 栏 |
|--------|-----------|------|------|------|------|
| Pad竖 | NLC | `surface_low` | `surface` (跟随 L) | `surface` (笔记 List_Notes_03 flat) | `surface` (笔记 Detail) |
| Pad竖 | NLC收起 | `surface_low` | 不存在 (N 消失) | `surface` (笔记 List_Notes_03 flat) | `surface` |
| Pad竖 | NL | `surface_low` | `surface` (跟随 L) | `surface` (笔记 List_Notes flat) | — |
| Pad竖 | NL收起 | `surface_low` | 不存在 (N 消失) | `surface` (笔记 List_Notes flat) | — |
| Pad竖 | NC | `surface_low` | `surface` (跟随 C) | — | `surface` |
| Pad竖 | NC收起 | `surface_low` | 不存在 (N 消失) | — | `surface` |
| Pad竖 | LC | `surface_low` | 不存在 | `surface` (笔记 List_Notes_03 flat) | `surface` |
| Pad竖 | C | `surface_low` | 不存在 | 不存在 | `surface_low` |
| Pad横 | NLC | `surface_low` | `surface` (跟随 L) | `surface` (笔记 List_Notes_03 flat) | `surface` (笔记 Detail) |
| Pad横 | NLC收起 | `surface_low` | 不存在 (N 消失) | `surface` (笔记 List_Notes_03 flat) | `surface` |
| Pad横 | NL | `surface_low` | `surface` (跟随 L) | `surface` (笔记 List_Notes flat) | — |
| Pad横 | NL收起 | `surface_low` | 不存在 (N 消失) | `surface` (笔记 List_Notes flat) | — |
| Pad横 | NC | `surface_low` | `surface` (跟随 C) | — | `surface` |
| Pad横 | NC收起 | `surface_low` | 不存在 (N 消失) | — | `surface` |
| Pad横 | LC | 不存在 | 不存在 | 不存在 | — |
| Pad横 | C | 不存在 | 不存在 | 不存在 | `surface_low` |

> **변종 별 분기 (笔记 + 待办 동형 구조, 2026-06-01 정정)**:
>
> - **笔记 L 栏**:
>   - 手机 / Fold外 (`List_Notes_01` 卡片 stacked) → `surface_low` (灰底)
>   - Fold内 / Pad (`List_Notes_03 / _04` flat list) → `surface` (white)
> - **待办 L 栏**:
>   - 手机 / Fold外 (`List_Task_01` 套卡) → `surface_low`
>   - Fold内 / Pad (`List_Task_03` flat) → `surface`
> - **frame 외각**:
>   - 笔记 全 device → `surface_low` (외각 灰底로 卡片浮起 일관성, list 내부 카드성과 무관)
>   - 待办 → `surface` (Fold内 / Pad), `surface_low` (手机 / Fold外, 套卡)
>
> **Pad NL Sub-rows** (List_Notes_13 / _15 / _17 / _19 = flat, per §0.1 #9 NL→C fallback variant): 上表 Pad竖/Pad横 NL 行의 L 栏 셀도 `surface` 가 정답이나 본 수정에서는 상기 NLC 행만 update — Pad NL 변종 검증은 후속.


### §0.4 关键组件 set keys（pointer）

> **권위 source** = [`csv-pipeline/data/setkeys.json`](../csv-pipeline/data/setkeys.json) 단일 권위 (families / authoritativeLibraryKeys / `_known_stale_or_wrong_keys` 포함). Phase 4.5 Gate A / Gate C / Phase 5 import 시 setkeys.json 직접 read. 변경 시 setkeys.json 수정 + git commit (본 .md 보강 不要). 既存 cross-ref 18+개의 「§0.4」 표기 = 의미상 「setkeys.json」.

### §0.5 历史踩坑（笔记 / 待办 应用专用）

> 通用 instance reflow 陷阱见 `common-rules.md §3.6`。本表只列 **笔记 / 待办 变体选择 / 特殊位置** 的应用专属失误。

| 类别 | 失误 | 正确做法 |
|------|------|---------|
| 库选择 | StatusBar 适配时使用 HyperOS v0.8 set（`15e94d49...`）（PM7） | **权威 = Xiaomi Hyper OS4 UI Kit** 的 3 个独立 COMPONENT（`StatusBar_01/_02/_03` 各自独立 key）。file `FBvQ3xM5C62MgIcA1JHWIs` node `127160:4132`。禁止依据 v0.8 ↔ Hyper OS4 名字相似性自行推测（PM8 修订） |
| 变体选择 | L 栏 NavBar 用 `_05`（带返回箭头）| 笔记 LC 列表页 default = `_04`（无返回）|
| 变体选择 | L 栏 SearchBar 用 `_02`（自然 176×44 是 Pad 顶部导航内嵌）| LC 风满 = `_05`（392×56）|
| 变体选择 | C 栏 TextInput 用 `_01` | Fold 内 LC C 栏 = `_08`（CSV2 2026-05-15 新增，Q18 内屏 padding 20）|
| 位置 | Pad 竖 NLC 覆盖 杆子 `x=272`（避 Sidebar）| 杆子风满 `x=0, w=frameW`；z-order 而非位置避让 |
| 位置 | C 栏 TextInput `y=mainH-108`（避 杆子）| `y=mainH-92`（bottom flush，与杆子 16dp 重叠）|
| 位置 | Detail 高度 `mainH-154`（避 TI）| `mainH-62`（延伸到 TI 下方，TI 通过 z-order + fade overlay）|
| 顺序 | L 栏 Chip→Search（源稿顺序）| spec 通例 NavBar→Search→Chip→List |
| Token | frame fill 直接 RGB 灰色 / 白色 | `bindFill('背景色/surface', ...)` 绑定 |
| Token | 分割线 fill RGB | `bindFill('分割线色/outline', ...)` |
| Token | 遮罩 fill RGB | `bindFill('遮罩色/mask', ..., 0.2)` |
| 变体内部 sizing | Sidebar mainH resize 后 inner `BoardMaterialSection` 仍 800/812（HUG）→ 卡片不延伸；Pad 竖 NLC 覆盖时 L 栏 list/ToolBar 从卡片下方 leak；Pad 横 NLC N 栏下方留白 | swap + resize 后 **3 级递归 FILL override 必需**（仅 1 级则 NavigationSizeSection 仍 HUG=800 固定，导致下方留白；实测 Pad 竖 NL 展开 = 576dp 留白）：<br>① `inst.children[0].layoutSizingVertical = 'FILL'`（BoardMaterialSection）<br>② `inst.children[0].children[0].layoutSizingVertical = 'FILL'`（NavigationSizeSection，default HUG=800 固定）<br>③ `inst.children[0].children[0].children.find(c=>c.name==='内容区域').layoutSizingVertical = 'FILL'`<br>校验：`inst.children[0].height === inst.height − 12 (pb)` 且 `navSize.height === BoardMaterialSection.height`（旧组件 default = FILL；2026-05-18 起 default = HUG，必须显式 override）|
| 变体内部 sizing | TopBar_03 / TopBar_07（笔记 宫格 NL Pad 4 frame 顶部 search 变体）`instance.resize(targetW)` 后 root child `Pad-TopBar_01` 仍保持自然 width 1422 + `layoutSizingHorizontal='FIXED'` → 右侧裁切（搜索框 / 编辑 / 菜单 icon 不显示）。实测：Pad 横 NL 展开=272dp 裁切，Pad 竖 NL 展开=745dp 裁切（过半），Pad 竖 NL 收起=473dp 裁切 | common-rules §3.6 强制 6 步序列外，需追加 **`inst.children[0].layoutSizingHorizontal = 'FILL'`** override。校验：`inst.children[0].width === inst.width` |
| 搜索激活态 | Pad NL 搜索激活时 L 栏统一为 `SearchBar_01 + SearchReceiving_00`（新 page 承接）| **仅 Pad NL 在 C 栏承接**：`SearchBar_04`（激活态）+ `SearchReceiving_01`（Dropdown）。对应 `device-dimensions.md` 搜索 spec「Pad 承接 panel」节。其他形态为 `_01 + _00`（新 page 承接模式）|
| 变体未落地 | Fold 内 LC L 栏 ToolBar `_02` 尝试 → 组件库中不存在 | 以 mapping CSV 权威 spec 保留 `_02`。落地前临时 fallback：渲染 `_01`，落地后通过 `swapComponent` 升级 |
| 变体内部 sizing — Sidebar_Notes attached form | (2026-05-31 정식 룰 §0.1 #10 으로 승격) | **§0.1 #10 「Sidebar_Notes attached form 풀히트 룰」 참조**. 历史踩坑 表 의 본 항목은 history pointer 만 유지 — 실제 룰 본문은 §0.1 #10 단일 권위 source |
| 变体内部 sizing — Notes_FloatingWindow cascade FILL | (2026-05-31 정식 룰 §0.1 #11 으로 승격) | **§0.1 #11 「Notes_FloatingWindow_01 Pad cascade FILL 룰」 참조**. 历史踩坑 表 의 본 항목은 history pointer 만 유지 — 실제 룰 본문은 §0.1 #11 단일 권위 source |

---

## 枚举定义

> **2026-05-26 迁移**：`device` / `screenMode` / `resultType` enum 表已移至 [common-rules.md §0.4](common-rules.md) 作为单一权威。本 .md 禁止重述 enum。

## 子场景约定

| 子场景 | 说明 |
| --- | --- |
| 笔记 | 笔记列表浏览与管理 |
| 待办 | 待办事项浏览与管理 |

## N 收起 规则（笔记 / 待办 专用）

Pad NLC / NL / NC 框架在 **N 收起态** 下不使用 `Sidebar_Component_PAD_NLC_02`（88dp 侧边栏收起形态）。改为：

- N 栏直接消失
  - Pad 横屏：L / C 吸收 N 宽度（收起尺寸等同 LC 模式）
  - Pad 竖屏：N 本来以覆盖形式叠加于 LC 上，收起后 LC 回归原尺寸
- N 恢复 icon 位置（按 framework 分支）：
  - **NLC default / 编辑**：L 栏 NavigationBar 最左 = `_17`（default）/ `_18`（编辑）
  - **NL default / 编辑**：L / N 栏 NavBar 均为 `_00`（不渲染）。TopBar_X 变体自带 N 恢复 icon — 精确映射以 §0.1 #8 为单一权威
- 侧边栏组件本体：
  - 展开态: `Sidebar_Component_PAD_NLC_01`
  - 收起态：N 栏自体消失（笔记 NL 宫格特有）。笔记 NLC framework 中使用 `Sidebar_Component_PAD_NLC_00`（空容器变体）。

本规则仅适用于笔记应用（`笔记` + `待办` 子场景）。电话、联系人、文件管理等其他应用仍沿用 `Sidebar_Component_PAD_NLC_02` 的 88dp 收起形态。

## `_00` 变体（Pad 专用 — 笔记 / 待办 功能转移规则）

`_00` 的一般含义（「不渲染」/ 空容器）以 **`common-rules.md §3.4a.5`** 为单一权威。笔记 / 待办 特有的附加规则：

**Pad 全 screenMode 下以下控件转换为 `_00`**（Fold 内 / 手机不适用，保留 `_01`）：

| 源变体（手机 / Fold）| Pad `_00` 处理 | 功能转移位置 |
|---|---|---|
| `BottomBar_Showcase_Notes_01`（L 栏工具栏）| L 栏不渲染 | L 栏 NavigationBar 右侧 icon |
| `TextInput_ComponentSet_Notes_01`（C 栏底部输入框）| C 栏不渲染（`_00` 落地，2026-05-18）| — |
| `SelectableChip_ComponentSet_Notes_01/_02`（L 栏标签栏）| L 栏不渲染 | L 栏 NavigationBar 右侧 icon / 文件夹切换 |

**释放空间处理**：由同栏的主内容（`List_Notes` / `Detail_Notes`）吸收。

**Fold 内 LC C 栏**：使用 `TextInput_ComponentSet_Notes_08`（Q18 padding `左20 / 右20`，参见 components.csv `Note` 列）。

## 映射表

> **2026-05-26 迁移**：笔记 / 待办映射表以 **`csv-pipeline/mapping-output/app-Notes-mapping.csv`（742 行）+ `app-Tasks-mapping.csv`（115 行）** 为单一权威。`控件变体清单.csv` + `结构变化表-Notes.csv` / `结构变化表-Tasks.csv` 为 input source，`npm run extract` 产出 derived。本 .md 禁止手工保留映射表（drift 风险）。Phase 4 lookup 直接查询 mapping-output CSV。
>
> 原映射表中的 prose 规则（`Fold 内 NL→C fallback`、`List 奇/偶序列`、`NL framework TopBar_X` 等）以 §0.1 #8/#9 为单一权威。组件未落地 warning / Pad NL 搜索激活态等变体选择 warning 已合并至 §0.5 历史踩坑。

## 浮层 Overlay

浮层容器（浮窗 / 抽屉 / 弹窗 / 菜单 / 行动操作按钮 / 选择器 / 分段按钮）的尺寸、位置、遮罩、背景色规范统一位于 `layouts/device-dimensions.md` 的「浮层规格」小节。本节只记录 **笔记应用在各设备 / screenMode 下要调用哪个 variant**，不重复规格。

来源：`结构变化表-Notes.csv` (2026-05-25 csv-pipeline Stage 1A 拆分后).

### 文件夹管理窗口 ManageFoldWindow

Fold 内屏上该容器覆盖整屏，不按 NC / LC / C 分栏；Pad 上仍附着于 L 栏（NLC / NL）或 N 栏（NC）。

| | 手机竖 | Fold外竖 | Fold内竖 全模式 | Fold内横 全模式 | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad竖NC | Pad竖NC收起 | Pad横NLC | Pad横NLC收起 | Pad横NC | Pad横NC收起 |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| ManageFoldWindow / NLC | Sidebar_Component_Fold_LC_01（宽度定制 282dp） | Sidebar_Component_Fold_LC_01（宽度定制 282dp） | FloatingWindow_ComponentSet_01 | FloatingWindow_ComponentSet_01 | N栏：Sidebar_Component_PAD_NLC_01 | 不展示 | — | — | — | — | N栏：Sidebar_Component_PAD_NLC_01 | 不展示 | — | — |
| ManageFoldWindow / NL  | Sidebar_Component_Fold_LC_01（宽度定制 282dp） | Sidebar_Component_Fold_LC_01（宽度定制 282dp） | FloatingWindow_ComponentSet_01 | FloatingWindow_ComponentSet_01 | — | — | N栏：Sidebar_Component_PAD_NLC_01 | 不展示 | — | — | — | — | — | — |
| ManageFoldWindow / NC  | Sidebar_Component_Fold_LC_01（宽度定制 282dp） | Sidebar_Component_Fold_LC_01（宽度定制 282dp） | FloatingWindow_ComponentSet_01 | FloatingWindow_ComponentSet_01 | — | — | — | — | N栏：Sidebar_Component_PAD_NLC_01 文件夹列表 | 不展示 | — | — | N栏：Sidebar_Component_PAD_NLC_01 文件夹列表 | 不展示 |

### 抽屉窗口 / 浮窗 FloatingWindow

| | 手机竖 | Fold外竖 | Fold内 全模式 | Pad竖 全模式 | Pad横 全模式 |
|--|--|--|--|--|--|
| variant | DrawerWindow_ComponentSet_high_01 | DrawerWindow_ComponentSet_high_01 | FloatingWindow_ComponentSet_01 | FloatingWindow_ComponentSet_01 | FloatingWindow_ComponentSet_01 |

### 分段按钮 Segmented Controls

仅在浮窗 / 抽屉内部使用（如 录音详情的「总结 / 原文」切换），不作为独立浮层。

| | 手机竖 | Fold外竖 | Fold内 全模式 | Pad竖 全模式 | Pad横 全模式 |
|--|--|--|--|--|--|
| variant | SegmentedControls_ComponentSet_01 | SegmentedControls_ComponentSet_01 | SegmentedControls_ComponentSet_01 | SegmentedControls_ComponentSet_02 | SegmentedControls_ComponentSet_02 |

### 弹窗 Dialog / 行动操作按钮 ActionSheet / 选择器 Picker

| 组件 | 全设备 / 全 screenMode |
|--|--|
| AlertDialog | AlertDialog_ComponentSet_01 |
| ActionSheet | Actionsheet_ComponentSet_01 |
| Picker | WheelPicker_ComponentSet_01 |

### 菜单 Menu

| 场景 | 手机竖 | Fold外竖 | Fold内LC | Fold内横LC | Pad竖NLC | Pad竖NLC收起 | Pad竖NL | Pad竖NL收起 | Pad竖NC | Pad竖NC收起 | Pad竖LC | Pad竖C | Pad横NLC | Pad横NLC收起 | Pad横NL | Pad横NL收起 | Pad横NC | Pad横NC收起 | Pad横LC | Pad横C |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| NLC | Menu_ComponentSet_03 | Menu_ComponentSet_03 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | — | — | — | — | — | — | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | — | — | — | — | — | — |
| NL  | Menu_ComponentSet_03 | Menu_ComponentSet_03 | — | — | — | — | N栏：NavigationBar_ComponentSet_12；L栏：Menu_ComponentSet_03 | N栏：不展示；L栏：Menu_ComponentSet_03 | — | — | — | — | — | — | N栏：NavigationBar_ComponentSet_12；L栏：Menu_ComponentSet_03 | N栏：不展示；L栏：Menu_ComponentSet_03 | — | — | — | — |
| NC  | Menu_ComponentSet_03 | Menu_ComponentSet_03 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | — | — | — | — | N栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | N栏：Menu_ComponentSet_00；C栏：Menu_ComponentSet_01 | — | — | — | — | — | — | N栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | N栏：Menu_ComponentSet_00；C栏：Menu_ComponentSet_01 | — | — |
| LC  | Menu_ComponentSet_03 | Menu_ComponentSet_03 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | L栏：Menu_ComponentSet_03；C栏：Menu_ComponentSet_01 | — | — | — | — | — | — | L栏：Menu_ComponentSet_00；C栏：Menu_ComponentSet_01 | — | — | — | — | — | — | — | L栏：Menu_ComponentSet_00；C栏：Menu_ComponentSet_01 | — |
| C   | Menu_ComponentSet_03 | Menu_ComponentSet_03 | Menu_ComponentSet_01 | Menu_ComponentSet_01 | — | — | — | — | — | — | — | Menu_ComponentSet_03 | — | — | — | — | — | — | — | Menu_ComponentSet_03 |

## Pad 分栏行为覆盖

| 场景 | 行为 |
|------|------|
| Pad 竖屏 NLC 展开 | 采用 **覆盖** 模式：L/C 回归 LC 基准尺寸（L 428 + C 521），Sidebar 覆盖于 L+C 之上；遮罩覆盖整个 frame（含状态栏），Sidebar 位于遮罩之上。详见 `layouts/device-dimensions.md`「覆盖 布局实例示范」。 |
| Pad 横屏 NLC 展开 | **并列**（通则；仅此模式，无覆盖选项） |
| Pad NLC / NL / NC 收起 | N 栏消失（笔记例外规则）；Pad 横屏 L/C 扩展吸收 N 宽度；Pad 竖屏 L/C 回归 LC 尺寸 |

## C 栏图片适配

`Detail_Notes` 内含图片的原始最大宽度为 **395dp**。各设备 / screenMode 下 C 栏（或单栏）实际内容宽度不同，按以下规则适配：

**核心公式**：`图片.width = min(C 栏内容宽, 395)`，`图片.height = 图片.width × (原始H / 原始W)`（**原始比例等比缩放**），**左对齐**，右侧产生空白留白。

| screenMode / 设备 | C 栏内容宽 | 图片宽 | 备注 |
|---|---|---|---|
| 手机竖（单栏） | 392 | 392 | cap 接近原值，近全幅 |
| Fold 外竖（单栏） | 392 | 392 | 同上 |
| Fold 内竖 LC | 346 | **346**（cap 未达，随栏宽缩） | 图片随栏宽等比缩小，高度同比缩 |
| Fold 内横 LC | 535 | **395** | 右侧留白 140 |
| Pad 竖 NLC / NLC 收起 / LC | 521 | **395** | 右侧留白 126 |
| Pad 横 NLC 展开 | 706（内容宽，去 8dp 左 padding） | **395** | 右侧留白 311 |
| Pad 横 NLC 收起 | 922（内容宽，去左右 36dp padding） | **395** | 右侧留白 527 |
| Pad 横 LC | 521 | **395** | 右侧留白 126 |

执行注意：

- 所有端 **必须等比缩放**，禁止固定高度或裁切
- 图片容器在 `Detail_Notes` 内 **左对齐 hug**，右侧空白保留为留白，不拉伸图片
- Fold 内竖（346）是唯一 cap 未达的端，实例 swap / resize 后必须显式 override `width = 346` 并按比例 resize 高度（参见 [[feedback_swap_reset_overrides]] / [[feedback_variant_swap_resize]]）
- 本规则仅适用 **笔记**（含 `笔记` 子场景的 `Detail_Notes` 内媒体），不影响 `待办` / 其他应用

## 遮罩规则

笔记和待办在 NLC / LC 模式下均适用以下遮罩规则。遮罩样式与适用范围参见 `device-dimensions.md`「遮罩定义」及其「适用范围」小节（默认覆盖整个 frame，覆盖组件 / 触发组件自身除外）。

| 触发条件 | 遮罩范围 | z-order 强制 |
|---------|---------|---|
| N 栏进入编辑模式 / NLC 覆盖 | 整个 frame（含 N 列以外的状态栏区段），Sidebar 自身除外 | `遮罩-N覆盖` 在 `状态栏` **之上**（含 status bar dim） |
| L 栏进入编辑模式 | 仅 C 列（含 C 列上方 status bar 区段），L 列豁免 | `遮罩-编辑` 在 `状态栏` **之上**（C 列 status bar 区段 dim） |
| C 栏进入编辑模式（仅 CEditMode）| 无遮罩 | — |

**核心原则**（2026-05-18 修订）：遮罩按 **列归属** 决定覆盖范围。trigger 列以外的全域（含 status bar 该列对应区段）一律 dim。**禁止**用「时间 / 信号可读性」rationale 把状态栏提升到遮罩之上。

收起态下 N 栏已消失（笔记例外规则），不再产生 N 栏遮罩触发。

### 编辑状态 + 浮层遮罩叠加

编辑状态下弹出带遮罩的浮层（模态抽屉 / 弹窗 / ActionSheet / 选择器 等）时，**编辑状态遮罩与浮层遮罩叠加显示**（双层遮罩，透明度按各自定义相乘叠加），不互相替代或取消。

## 组件间距

> **2026-05-26 迁移**：本节 padding 数据由 `csv-pipeline/mapping-output/components.csv` 自动生成（Stage 1B）。`InternalPadL / InternalPadR / TitleLeftPad` 列 + `Note` 列承载全部信息（含 定宽 / 屏中对齐 / 底部位置 等特殊规则）。`控件变体清单.csv` 为单一权威，components.csv 为 derived。本 .md 禁止手工保留同份信息（drift 风险）。
>
> Sidebar_02 deprecation 规则参见「N 收起 规则」§324 + §328。TextInput_Notes_01~04 与 device-dimensions.md 冲突解决规则参见 §0.2 末尾。

