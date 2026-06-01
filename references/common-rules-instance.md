# 通用规则 — 标准组件 instance 闭环

> Phase 4 + Phase 5 매번 로드. 标准组件 import / resize / swap / clone / property fallback / instance 优先级.
> 본 파일 = §3.1~§3.6 (instance 처리) + §3.10 (timestamp + fresh-import) + §3.12 (property 缺) + §4 (写入 优先级).
> mask / z-order → `common-rules-mask-zorder.md`. 원칙 / 메타 룰 → `common-rules-principles.md`. 验证 → `common-rules-verify.md`. 禁止 → `common-rules-prohibit.md`.

## §3.1 基础组件任务清单

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

## §3.1a variantId → ComponentSet 归属确认（Phase 4 强制）

**WHEN**: `app-variant-map` 返回 `variantId`（如 `Fab_01` / `List_Task_04` / `Sidebar_Component_PAD_NLC_01` 等）后执行 import 之前

**MUST**:

1. **先查 `app-variant-map-{app}.md §0.4` 确定该 variantId 归属哪个 ComponentSet**（key 已记录）
2. 以 set key 执行 `importComponentSetByKeyAsync(key)` → `set.children.find(c => c.name.includes(variantId))`
3. **禁止**以 variantId 名称直接 `search_design_system` 然后盲取首个结果 —— 同名 / 近名组件可能分布在多个 set 中，语义不同

**典型错误**：

| variantId | 错误路径 | 正确路径 |
|---|---|---|
| `Fab_01` | `search_design_system('Fab')` → `Fab-Showcase`（内部 icon 子组件）| §0.4 `BottomBar` set (`414cabc8...`) → `children.find(/^variantId=Fab_01,/)` |
| `List_Task_04` | `importComponentSetByKeyAsync(List_Notes key)` → not found | §0.4 或 `search_design_system('List_Task')` → 业务组件库独立 set |
| `Sidebar_Component_PAD_NLC_01` | 新建 search → 多个同名结果 | §0.4 `BottomBar` set → 同一 set 内 variant |

**核心原则**：映射表的 `variantId` 是 ComponentSet 内部的变体标识符，不是独立组件名。**必须先定位 set，再在 set 内查 variant**。set 归属以 §0.4 记录为首要权威；§0.4 未记录时通过源稿 instance 的 `mainComponent.parent` 确定。

**componentTaskList 强制列 `belongsToSet`**：Phase 4 生成 componentTaskList 时，每行必须填写：

| 字段 | 内容 | 来源 |
|------|------|------|
| `belongsToSet.name` | ComponentSet 名称 | §0.4 / source `mainComponent.parent.name` |
| `belongsToSet.key` | ComponentSet key | §0.4 / source `mainComponent.parent.key` |
| `belongsToSet.library` | 库名 | `search_design_system` 结果的 `libraryName` |

该字段为空 = **Phase 5 进入阻断**（SKILL.md Phase 4.5 Gate C）。确保每个 variantId 的 set 归属在进入落位前已明确。

## §3.2 标准组件实例保护

**WHEN**: 任何对标准结构组件（`NavigationBar` / `StatusBar` / `Sidebar` / `BottomBar` 等）的修改
**MUST**: 保持 INSTANCE 状态。只允许 variant 切换 / 属性调整 / 尺寸调整 / 位置调整。
**NEVER**: `detachInstance` (无例外). 实例路径阻塞时, 经 `common-rules-principles.md §3.14`「妥协声明前实证强制」流程在 componentTaskList 标记 `blocked` + 向用户报告. **禁止任何 detach / clone / 自建 frame 替代** (`common-rules-principles.md §1.2 + §1.3`).

## §3.3 ~ §3.4 (原独立小节, 已并入 §3.6)

> §3.3「clone / variant 切换后尺寸同步」+ §3.4「残留 override 清理」已并入 §3.6「自带 auto-layout 实例的 resize / 落位通用陷阱」强制序列. **resize / swap / override 处理以 §3.6 6 步强制序列为单一来源**.

## §3.4a 组件 padding 分类与容器合算规则（通用骨架）

> 应用专用实测应用表已迁出：笔记 / 待办 → `app-variant-map-笔记.md §0.2`。其它应用 → 各自 `app-variant-map-{app}.md`。

### §3.4a.1 组件分类（A/B 二分）

> **核心原则**：分类标准 = 「**是否自带 internal padding**」。所有自带 padding 的标准组件统一为 A 类风满，禁止合算；裸控件 / 自定义业务 frame 为 B 类，按 device-dim 断点表合算。

| 类别 | 判定标准 | 组件 | padding 处理 |
|------|---------|------|----------|
| **A 类：自带 internal padding 的标准组件** | `instance.children[0].x > 0` 即自带（典型值 12dp） | `StatusBar_*` / `NavigationBar*`（含 `_Notes`）/ `TopBar_*` / `SearchBar_ComponentSet` / `SelectableChip_ComponentSet_*` / `List_*` / `Detail_*` / `BottomBar_*`（含 `_Showcase_*` / `_NoteEditPanel_*` / `_Notes_Outline_*`）/ `ToolBar_*` / `Sidebar_Component_*` / `TextInput_ComponentSet_Notes` / `Fab_*` 等 | **永远 `x = 0, width = 栏W` 风满**。视觉左右 padding = 组件 internal（默认 12dp）。**禁止任何 outer 合算**，禁止把 device-dim 断点表 spec 应用到 A 类组件 |
| **B 类：裸控件 / 业务自定义 frame** | 无 internal padding 的纯 Frame / 分组卡片外框 / 用户自建容器 | 自定义 frame / 业务容器 | 按 `device-dimensions.md` 断点间距表取 spec：`x = spec, width = 栏W − 2 × spec`。1100 < 栏W 时改 `x = (栏W − 988)/2, width = 988` 居中 |

判定要诀：**「有自带 padding ⇒ A 类风满；没有 ⇒ B 类合算」**。Figma 实测 `instance.children[0].x` > 0 即 A 类；查不到 internal padding 才是 B 类。**未列出的标准组件默认按 A 类处理**（风满），如确认是 B 类（裸 frame）才走合算。

**Detail_Notes 例外**：自带 internal=20（封面图距 Detail 左缘 20dp）仍属 A 类风满，internal=20 仅描述视觉左 padding，不参与合算。

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

### §3.4a.3 合算公式（仅适用 B 类）

> ⚠️ **适用范围**：本节合算公式**仅适用 §3.4a.1 B 类（裸控件 / 业务自定义 frame）**。A 类标准组件（含 `SearchBar` / `Chip` / `List` / `Detail` 等所有自带 padding 的组件）**禁止**调用本公式 —— 一律 `x=0, w=栏W` 风满。

| 关系（仅 B 类）| x | 写入 width | visible 总 padding |
|------|---|-----------|-------------------|
| `internal ≥ spec` | 0 | 栏W | internal（自动 ≥ spec）|
| `internal < spec` | `spec − internal` | `栏W − 2 × outer` | `outer + internal = spec` |

简言之（仅 B 类）：`outer = max(0, spec − internal)`。1100 < 栏W 时进一步用 `x = (栏W − 988)/2, w = 988` 居中。

### §3.4a.4 执行准则

| # | 规则 |
|---|------|
| 1 | 通用内容容器：实测 `direct.x` 作 internal pl；`Chip` 的 `pl=0` 易误判，**以 CSV 为准** |
| 2 | `Detail_Notes`：直接 `internal=20`，不测量外层 frame |
| 3 | spec 来自 `device-dimensions.md` 栏 padding 表 + 断点表 |
| 4 | 写入：`inst.x = outer; inst.width = 栏W − 2 × outer` |
| 5 | **特殊组件不参与合算**：永远 `x=0, width=栏W` 风满 |
| 6 | 远程组件 internal 不可在 instance 中改写；`internal > spec` 时风满 + 接受 over |

### §3.4a.5 `_00` 变体语义一致性表

**WHEN**: variant lookup 结果为 `*_00` 时
**MUST**: 按下表确定语义 (family 不同含义不同)：

| family | `_00` 含义 | 适配处理 |
|---|---|---|
| `NavigationBar_ComponentSet_00` | 无 NavBar (空变体) | **不创建 instance** (skip) |
| `Sidebar_Component_PAD_NLC_00` | 笔记 / 待办 NLC framework **收起态**: N 栏直接消失（笔记 N 收起规则） | **不创建 instance**（N 消失，L/C 吸收宽度） |
| `Sidebar_Component_PAD_NLC_00` | 笔记 / 待办 **NL framework**: N 栏自身消失 | **不创建 instance** |
| `Sidebar_Component_PAD_NLC_00` | 其他应用 NLC 收起态: 88dp 图标侧边栏 | 创建 instance, 撑 88dp |
| `BottomBar_Showcase_Notes_00` / `_Showcase_00` | 不渲染 | 不创建 instance |
| `SelectableChip_ComponentSet_Notes_00` | 不渲染 | 不创建 instance |
| `ToolBar_ComponentSet_00` | Pad NL framework 工具栏占位 | 仅 Pad NL, 创建 instance |
| `Fab_00` | 无 Fab | 不创建 instance |
| `TextInput_ComponentSet_Notes_00` | 不渲染占位 | 不创建 instance |

**原则**: `_00` 默认含义 = **「不渲染」或「空容器」**. family 未列出时**默认不创建 instance**. 应用层例外 (如「保留 88dp 容器」) 须在 `app-variant-map-{app}.md §0` 显式声明.

## §3.5 状态栏 (已迁出)

> **2026-05-26 迁出**: cross-device variant 切换 + 强制高度 规则迁至 [`component-dictionary/StatusBar.md`](component-dictionary/StatusBar.md) 单一来源. set key, variant 映射, MUST/NEVER, code, device 别 spec 全部参见该文件.

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
| 1a | **resize 前必须读取 `mainComponent.width` / `mainComponent.height`（自然尺寸）**，与 `device-dimensions.md` spec 比对后决定 targetH。**禁止从源稿高度推测目标高度**（例：源稿手机端 NavBar 大标题 116dp ≠ Fold/Pad 中标题 56dp；TopBar_09 自然 56dp ≠ NavBar+SearchBar 算术和 100dp）。公式：`targetH = min(自然高度, device-dim spec)`；两者冲突时以 device-dim 为准 |
| 2 | **`resetOverrides` 默认 OFF**（2026-05-15 修订）—— reset 清掉 width override 几乎必然 reflow |
| 3 | Phase 6 调用 `verifyChecklist(...)` 自动检测 width/height/x/y 偏差 > 0.5dp 即不合格 |
| 4 | Sidebar 额外校验：Pad 横 NLC `height === N 栏 mainH`；Pad 竖 NLC 覆盖 `height === frame.height − statusBarH` |
| 5 | 视觉异常（卡片多余留白 / 内容错位）→ 先怀疑 component 库版本（参见 §3.10），后查 instance 写错 |
| **6** | **`inst.children[0]` FILL 自动适配** → `placement.ts` step 7 自动执行 (single wrapper 或 SearchBar 系 multi-child). 失败时报告「component limitation」妥协项 + design-team 专项. |
| **7** | **Sidebar / Pad-TopBar 等含多层 auto-layout 组件需 3 级递归 FILL override**: `inst.children[0].layoutSizingVertical = 'FILL'` + `inst.children[0].children[0].layoutSizingVertical = 'FILL'` + `(.children[0].children[0]).children.find(c=>c.name==='内容区域'相似).layoutSizingVertical = 'FILL'`. 单一层 override 不足 (PM3 验证). |
| **8** | **ToolBar / BottomBar_Showcase inner state 2nd pass 必须在 `placeStandardComponent` 函数体内执行**（protocol.md step 10），禁止依赖调用方 inline 补充。capsule `setProperties({数量:X})` 会 rebuild children（全新 ID），首次 walk 只传递首项，后续 `.组件状态变化` 等 deep-inner 节点 miss。修复 = 统一走 protocol.md 完整函数，禁止 simplified inline helper |
| **9** | **master Fill ↔ instance default FIXED 通则** (2026-05-31, MUST): master `layoutSizing*='Fill'` 即使有定义, `createInstance()` default = `FIXED`. 不自动传播 → 必须显式调用 `inst.resize(w, h)` 或 `inst.layoutSizing*='FILL'` (auto-layout slot 父节点). **检验**: 必须直接 dump instance property (禁止仅看 master 推断). app-specific 应用例 → `app-variant-map-{app}.md` (如 笔记 `Sidebar_Notes` attached → §0.1 #10). |
| **9a** | **cross-file master cascade + ABSOLUTE constraints** (2026-05-31): master inner ABSOLUTE child (背景/blur 等) `constraints` **不可 instance level override**. cross-file instance 需 resize 超过 master 自然 H 时: ① master file 侧 ABSOLUTE child `constraints={horizontal/vertical:'STRETCH'}` + AUTO child sizingV='FILL' cascade ② library publish 必要 ③ publish 后 fresh import + createInstance + resize 自动 cascade ④ publish 前 fallback = 自然 H + 居中 (override 不可 layer stuck → 视觉空白). 回顾: 2026-05-31 `Notes_FloatingWindow_01` Pad 横 759 应用时 inner ABSOLUTE 636 stuck → 底部 123dp 空白. publish 后 cascade 正常. |
| **10** | **ToolBar / BottomBar_Showcase 胶囊 inner 버튼 폭 자동 분배** (2026-06-01): capsule 폭이 源 phone (= 344) 보다 줄어들면 inner `.组件状态变化` (master `minWidth=66, FIXED 92`) 좌우 튀어나감. `placement.ts` step 9b 자동 적용: ① capW ≥ N×minWidth → `layoutGrow=1 + layoutSizingH=FILL + itemSpacing=0` 균등 분배 (Fold內横 305 / Pad 380) ② capW < N×minWidth → minWidth instance 변경 不可 → `paddingL=R=0 + itemSpacing 음수` overlap 으로 fit (Fold內竖 234, spacing=-10). instance level 만 변경, master detach 없음 (§3.2 위반 아님). 회고: 2026-06-01 笔记 编辑 task 에서 Fold L (353/282) 의 capsule (305/234) inner 4 버튼 좌측 -16/-52 으로 튀어나옴. step 9 외각 폭 룰만 자동화 했고 inner reflow 부재 → 본 룰 추가. |

### §3.6.A 自动校验函数补强 (verifyChecklist 增项)

**WHEN**: 标准组件 instance 落位后调用 verifyChecklist 时
**MUST**: 除外部 instance W/H 校验外，**inner first child W 比对**（clipping 检测）：

```js
// clipping 检测
for (const chk of spec.componentChecks) {
  const node = await figma.getNodeByIdAsync(chk.id);
  // 外部
  if (Math.abs(node.width - chk.w) > 0.5) errors.push(`${chk.label}.width reflow`);
  // 内部 first child clipping
  if (node.children?.[0] && Math.abs(node.children[0].width - node.width) > 0.5) {
    errors.push(`${chk.label} INNER clipping: instance ${node.width} vs child[0] ${node.children[0].width}`);
  }
}
```

**根因**: `Pad-TopBar_01`（TopBar_03/_07 root child）`layoutSizingHorizontal='FIXED'` 自然 1422. instance.resize(targetW) 仅作用于外层, child 不跟随. PM5 验证 4 frame 中 3 frame 右侧裁切 (272~745dp). verifyChecklist 通过但视觉 fail.

**Phase 6 强制增项**: 全部 `componentChecks` 项必须包含 inner clipping 自动检测. **仅校验外部 W 不足**.

## §3.10 组件库时间戳校验 + fresh-import 强制 + Set key stale 检测

**WHEN**: 以下 3 种情况 — (a) clone 文件内旧 instance 落地前 / 视觉异常调查, (b) `set.children.find(/TargetVariant/)` 结果 `undefined`, (c) `importComponentSetByKeyAsync(key)` 抛出 `not found`.

**核心原则**: §0.4 / `setkeys.json` 的 key 是 **cache** 而非 permanent truth. variant 缺失 / not found 发生时 **禁止立即判定「未落地」** — 必须 fresh import.

**MUST 顺序**:

1. **`search_design_system`** 重新搜索 set 名 → 比对 `updatedAt` (取最大 timestamp 的 componentKey)
2. **`importComponentSetByKeyAsync(key)`** 重新调用 (废弃旧 import 对象) → fresh set.children 内重新查找 target variant
3. **替换流程**: `importComponentSetByKeyAsync(key) → set.children.find(/variant/) → 旧 instance.swapComponent(new variant) → §3.6 强制序列`
4. 仍缺失 / 仍 not found → 才能判定「未落地」或上报 user
5. 视觉异常优先怀疑 component 库版本不一致, **后**查 instance 写错

**自动检查推荐** (variant 缺失时):
```js
const freshSet = await figma.importComponentSetByKeyAsync(setKey);
const freshTarget = freshSet.children.find(c => predicate(c.name));
if (freshTarget) return freshTarget;  // 废弃旧搜索结果, 用 fresh
// 真实缺失 → 上报
```

**Key 更新后 Action (MUST)**:
- 当前 session 内立即更新 `app-variant-map-{app}.md §0.4` (或 `csv-pipeline/data/setkeys.json`) 的 key + git commit
- §0.5 变更日志增项
- 同名 set 在多个库存在时 → 通过 `get_libraries` 的 `libraries_added_to_file` 直接确认权威库 (禁止单凭 search 判定)
- 个别 component key (`StatusBar_01` 等) 独立管理不稳定时 → 统合为 ComponentSet key + 转换为 `children.find()` 模式 (set key 更稳定)

**根因案例**:
- **PM2 (2026-05-21 StatusBar)**: `状态栏-StatusBar` key `599a7d4b...` stale → not found. 当时 search 活跃 set = `15e94d49...` (HyperOS v0.8). **PM8 修订**: v0.8 非订阅库. 权威 = Xiaomi Hyper OS4 UI Kit ComponentSet `1047f2112a230a27d3888d27b34a5857815216e3`. cross-library import 成功 ≠ canonical 库. 决定: 个别 variant key 不再记录于 §0.4, set import 后 `children.find(/01|03/)` 访问.
- **TopBar_07 fresh-import 案例**: 首次搜索时 NavigationBar set 内仅见 TopBar_00~_06 → 判定「未落地」→ 使用 TopBar_03 fallback. 后经用户指出, fresh import 重试 → 找到 TopBar_07 (key=`b95b5b9e2f3d6a1306a0cbd14975164463528cf6`). NavigationBar set updatedAt = 2026-05-19 07:35Z, 旧 import 缓存 stale.

## §3.12 Component property 缺失时 instance-level 调整界限 (PM6 SearchBar 264dp 案例)

**WHEN**: spec (如 device-dimensions §搜索规格) 要求 instance-level 调整 (width 264dp 等), 实测 component 未提供对应 property
**NEVER**:
- 用 detach 绕过 (§3.2 违规)
- 硬编码强制尺寸 (无视 HUG layoutSizingHorizontal)
- 假报告「AI 已按 spec 应用」

**MUST**:
1. dump `node.mainComponent.parent.componentPropertyDefinitions` (set 级 propDefs)
2. 检查 propDefs 中是否含 spec 所需 property (如 `搜索框宽度: 264/176`)
3. propDefs 为空 (`{}`) 或缺失对应 property → **报告「component limitation」妥协项 + 拆分到 design-team 组件修正专项 task**
4. 保持自然尺寸不变 (HUG 结果)

**根因案例**: Pad-TopBar_01 `componentPropertyDefinitions = {}`. 内部 SearchBar `layoutSizingHorizontal='HUG'` + variant `_02` 自然 176×44. AI 尝试 resize 至 264 → 被忽略. 保持自然 176 + 报告「component limitation: SearchBar 264 default 未应用. 库需在 `Pad-TopBar` 增加 `搜索框宽度` 变体 property」妥协项.

## §4. 写入优先级与失败处理

### §4.1 组件 import 优先级

| 顺序 | 方式 |
|---|---|
| 1 | **`importComponentSetByKeyAsync`** (§0.4 权威 set key) → `set.children.find(variantId)` |
| 2 | §0.4 未登记时 **`search_design_system`** (scope = `common-rules-principles.md §0.5.1` 库) → 定位 set 后 import |
| 3 | 上述均失败 → **`common-rules-principles.md §3.14` 实证后 `componentTaskList` 标记 `blocked`** |

依据 `common-rules-principles.md §1.2`「标准实例使用强制」 + §3.14「妥协声明前实证强制」, **自动降级 (clone fallback) 路径已废止**. 实例路径失败时:

1. 收集实证 (error message + 尝试代码)
2. componentTaskList `status = blocked` + 记录原因
3. 向用户报告等待决策
4. **禁止擅自 clone / detach / 自建 frame 绕过** (§3.2)

### §4.2 映射表 hidden / absent 处理 (与 `blocked` 区分)

映射表 / 布局规则明确返回如下状态 → 省略组件 (skip):

| status | 含义 | 处理 |
|---|---|---|
| `hidden` | 语义保留, 视觉不显示 (`_00` 等空变体) | 不创建 instance, 无需用户报告 |
| `absent` | 该场景下要素缺失 (mapping CSV 无此行) | 不创建 instance, 无需用户报告 |
| `blocked` | 实例路径失败 (§4.1 序列未通过) | 实证 + 用户决策等待 |

---

> **연관 파일**: principles → `common-rules-principles.md` / mask-zorder → `common-rules-mask-zorder.md` / verify → `common-rules-verify.md` / prohibit → `common-rules-prohibit.md`.
