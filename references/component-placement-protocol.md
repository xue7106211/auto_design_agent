# 标准组件落位协议 Component Placement Protocol

本文档为多端适配 Skill 中**所有标准组件落位**的强制协议。Skill / 各 layout reference / app-variant-map 必须按本协议执行，禁止 inline 临时序列。

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

```js
// 单个组件落位 = 以下 6 步，顺序不可调换、不可省略
async function placeStandardComponent({
  inst,             // 已落地或克隆得到的 instance
  targetVariant,    // 目标 variant component（可选；不需切换时传 null）
  x, y, w, h,       // 目标位置 + 尺寸（栏内坐标系）
                    // ⚠️ A 类组件（自带 internal padding 的标准组件，含 SearchBar / Chip /
                    //    List / Detail / NavBar / TopBar / ToolBar / Sidebar / TextInput /
                    //    BottomBar / StatusBar / Fab 等）必须传 `x = 0, w = 栏W` 风满。
                    //    禁止传入 outer 合算值。详见 common-rules §0 #18 + §3.4a.1。
                    //    传入非 0 的 x 或非栏 W 的 w 时本函数不会报错，但 verifyChecklist
                    //    §6.2 #18 会判 fail。
  parentZ,          // z-order：'top' | 'bottom' | undefined
  parent,           // 目标父节点（如果当前 parent 不对，先 appendChild 到目标 parent）
  resetOverrides = false,  // 默认 OFF（关键决定）
  loadFontFamilies = [],   // 涉及文本时的字体白名单
  sourceInst = null,       // 源 instance（来自手机源稿）。传入时自动继承内部子 instance 的 componentProperties
                           // （例：ToolBar 内 .组件状态变化 的 状态=禁用、工具个数举例 的 数量=4个）。详见 §6 ⑯ + 本节末「内部状态继承」
  inheritInnerState = true // 默认 ON。sourceInst 非 null 时按递归同名匹配复制 inner componentProperties
}) {
  // 0. 字体加载（仅在 loadFontFamilies 非空时）
  for (const f of loadFontFamilies) {
    await figma.loadFontAsync(f);
  }

  // 1. 先迁移到目标 parent（如果不一致）。这必须在 swap 之前。
  if (parent && inst.parent !== parent) {
    parent.appendChild(inst);
  }

  // 2. variant 切换（如有）
  if (targetVariant) {
    inst.swapComponent(targetVariant);
  }

  // 3. resetOverrides 默认 OFF —— 仅当上层显式指定 true 时调用。
  //    OFF 是关键决定：reset 会清空 width override，触发 instance 自带 auto-layout
  //    回到 hug content 自然尺寸（392 / 530 / 800 等），导致 reflow。
  if (resetOverrides) {
    inst.resetOverrides();
  }

  // 4. 强制 sizing FIXED（覆盖 instance 自带 auto-layout 的 hug 倾向）
  //    四项一并设置，互不替代。某些 Figma 版本 / instance 上其中一项无效，
  //    其它项作为 fallback 仍能阻断 reflow。
  try { inst.layoutSizingHorizontal = 'FIXED'; } catch {}
  try { inst.layoutSizingVertical   = 'FIXED'; } catch {}
  try { inst.primaryAxisSizingMode  = 'FIXED'; } catch {}
  try { inst.counterAxisSizingMode  = 'FIXED'; } catch {}

  // 5. resize → 位置（顺序不可调换：先 size，再 x/y）
  inst.resize(w, h);
  inst.x = x;
  inst.y = y;

  // 6. z-order 调整（在 parent 内部）
  if (parentZ === 'top' && parent) parent.appendChild(inst);
  if (parentZ === 'bottom' && parent) parent.insertChild(0, inst);

  // 7. 内部状态继承（inheritInnerState=true 且 sourceInst 非 null 时执行）
  //    递归遍历 inst 的 INSTANCE 子节点 + sourceInst 同位置 INSTANCE，复制 componentProperties。
  //    覆盖范围：variant 属性（如 状态/数量/材质）+ boolean / instance-swap 属性。
  //    匹配策略：children 数组同 index + name 相等；不等则跳过该子树（结构差异不强行映射）。
  //    典型用例：源「卡片选择-未选」ToolBar 各按钮 状态=禁用 → 适配 frame 自动同步 禁用。
  if (inheritInnerState && sourceInst) {
    await inheritInnerComponentState(inst, sourceInst);
  }

  // 8. 落位后自检（任何异常立即 throw）
  if (Math.abs(inst.width - w) > 0.5 || Math.abs(inst.height - h) > 0.5) {
    throw new Error(`reflow detected: ${inst.name} expected ${w}x${h} got ${inst.width}x${inst.height}`);
  }

  // 9. ToolBar / BottomBar_Showcase 胶囊后处理（栏W > 440 → 定宽 344 居中）
  //    根因：capsule default layoutSizingHorizontal='FILL'，instance resize 后自动扩展到 栏W-48。
  //    device-dimensions「工具栏规格 / 胶囊尺寸」：栏W > 440 → 定宽 344 居中。
  //    ⚠️ 本步骤适用于所有设备（含 Fold 内屏 888/628 > 440），不仅 Pad。
  //    历史踩坑（2026-05-20）：Fold 内屏 w=888/628 均 > 440，但首次执行时遗漏 Fold 的胶囊处理。
  if (/ToolBar|BottomBar_Showcase/.test(inst.name || inst.mainComponent?.parent?.name || '')) {
    const capsule = inst.children?.find(c => /工具个数举例|TabMaterial/.test(c.name || ''));
    if (capsule && w > 440) {
      try { capsule.layoutSizingHorizontal = 'FIXED'; } catch {}
      capsule.resize(344, capsule.height);
      // 居中由 parent Overlay-Showcase primaryAxisAlignItems='CENTER' 保证
      const overlay = inst.children?.find(c => /Overlay/.test(c.name || ''));
      if (overlay) { try { overlay.primaryAxisAlignItems = 'CENTER'; } catch {} }
    }
  }

  // 10. inner state 二次传递（修复 setProperties 后 children ID 重建导致的 walk 丢失问题）
  //     根因：capsule.setProperties({数量:X}) 即使值不变也会重建 children（全新 ID），
  //     递归 walk 中后续 children 的 setProperties 因 timing 仅传递首项。
  //     修复：对已知 deep-inner 业务态组件，在 inheritInnerState 完成后做 DEDICATED 二次 pass。
  if (inheritInnerState && sourceInst && /ToolBar|BottomBar_Showcase/.test(inst.name || '')) {
    const tCapsule = inst.children?.find(c => /工具个数举例|TabMaterial/.test(c.name || ''));
    const sCapsule = sourceInst.children?.find(c => /工具个数举例|TabMaterial/.test(c.name || ''));
    if (tCapsule?.children && sCapsule?.children) {
      const len = Math.min(tCapsule.children.length, sCapsule.children.length);
      for (let i = 0; i < len; i++) {
        const ti = tCapsule.children[i], si = sCapsule.children[i];
        if (ti?.type === 'INSTANCE' && si?.type === 'INSTANCE' && si.componentProperties) {
          const p2 = {};
          for (const [k, v] of Object.entries(si.componentProperties)) {
            if (['VARIANT','BOOLEAN'].includes(v.type)) p2[k] = v.value;
          }
          if (Object.keys(p2).length > 0) try { ti.setProperties(p2); } catch {}
        }
      }
    }
  }

  return { id: inst.id, w: inst.width, h: inst.height, x: inst.x, y: inst.y };
}

// 内部状态继承辅助函数（递归 同 index + 同 name 匹配，复制 componentProperties）
async function inheritInnerComponentState(targetInst, sourceInst) {
  if (!targetInst.children || !sourceInst.children) return;
  const len = Math.min(targetInst.children.length, sourceInst.children.length);
  for (let i = 0; i < len; i++) {
    const t = targetInst.children[i];
    const s = sourceInst.children[i];
    if (!t || !s || t.name !== s.name) continue;
    if (t.type === 'INSTANCE' && s.type === 'INSTANCE' && s.componentProperties) {
      const propsToSet = {};
      for (const [pname, pval] of Object.entries(s.componentProperties)) {
        // 仅复制可 override 的简单属性（VARIANT / BOOLEAN / TEXT / INSTANCE_SWAP）
        if (['VARIANT', 'BOOLEAN', 'TEXT', 'INSTANCE_SWAP'].includes(pval.type)) {
          propsToSet[pname] = pval.value;
        }
      }
      if (Object.keys(propsToSet).length > 0) {
        try { t.setProperties(propsToSet); } catch {}
      }
    }
    // 递归
    await inheritInnerComponentState(t, s);
  }
}
```

**关键决定：`resetOverrides` 默认 OFF**。这是与既有 §3.4 / §3.6 的差异点。reset 会清空 width 等数值 override，触发 instance hug content → 落位失败的最常见根因。仅当目标 variant 与源 variant 内部结构差异巨大、且需要清掉旧文本 / 旧 padding override 时，才显式 `resetOverrides: true`。即使打开，也必须 step 4 + step 5 完整跟在后面把尺寸固定回来。

**关键决定：`inheritInnerState` 默认 ON**。手机源稿 instance 的 inner componentProperties（状态 / 数量 / 材质 / 文本 / instance-swap 等）反映业务态（如「未选」编辑模式 → ToolBar 按钮 `状态=禁用`），适配 frame 必须同步。**禁止** 仅 swap 顶层 variant 而忽略 inner state — 适配后视觉 与 源稿 业务态 不一致是常见 bug。源稿 instance 必须通过 `sourceInst` 显式传入；未传则跳过继承（适合「从空 frame 新建组件」场景）。

## 3. 父节点结构与 z-order 强制

**栏 frame 的子节点 z-order 模板**（落位前必须先建好骨架）：

| 布局 | 直接子节点（从底到顶） |
|---|---|
| LC（Fold 内屏） | `main` → `状态栏` → `栏间分割线` → `杆子`（最顶 / 透明 / 风满）|
| NLC 并列（Pad 横） | `main`（含 L/C，N 栏空位）→ `状态栏` → `栏间分割线` → `Sidebar`（z-顶其二）→ `杆子`（z-顶其一 / 风满 / 透明）|
| NLC 覆盖（Pad 竖） | `main`（含 L/C）→ `状态栏` → `遮罩-N覆盖` → `栏间分割线` → `Sidebar`（z-顶其二）→ `杆子`（z-顶其一 / 风满 / 透明）|

> **遮罩覆盖范围按列归属决定**：N 覆盖 trigger = Sidebar 列；遮罩覆盖 = 全 frame − Sidebar 列（含状态栏的 N 列以外区段）。因此 `遮罩-N覆盖` 必须**在状态栏之上** —— 状态栏被 dim 是正答，旧版「保证时间 / 信号可读」rationale 已弃用（用户 2026-05-18 显式确认）。Sidebar 必须在 `遮罩-N覆盖` 之上（trigger 列豁免）。**杆子在所有模式下必须最顶 z-order + 透明背景 + 风满 frame 宽**（设备 home indicator 标准）。

### 编辑模式（L 栏 触发遮罩）扩展模板

**触发**：`app-variant-map-{app}.md`「遮罩规则」声明 L 栏编辑触发遮罩（笔记 / 待办：L 栏编辑 → 仅 C 栏覆盖遮罩）。详见 `common-rules.md §3.7a`。

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

**Token 检索一次性缓存**。Phase 0 或 Phase 4 开始时调用：

```js
async function buildTokenCache() {
  const cache = { color: {} };
  const cols = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
  for (const col of cols) {
    const vars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(col.key);
    for (const v of vars) {
      if (v.resolvedType === 'COLOR') cache.color[v.name] = v;
    }
  }
  return cache;
}

async function bindFill(node, tokenName, fallbackRGB, opacity = 1) {
  const meta = TOKEN_CACHE.color[tokenName];
  let paint = { type: 'SOLID', color: fallbackRGB, opacity };
  if (meta) {
    const v = await figma.variables.importVariableByKeyAsync(meta.key);
    paint = figma.variables.setBoundVariableForPaint(paint, 'color', v);
  }
  node.fills = [paint];
  return !!meta;  // true = 已绑定 token, false = fallback RGB
}
```

**禁止在 fills 里直接写 RGB SOLID**。必须经 `bindFill(...)` 调用，至少留 token 绑定尝试 + 失败告警。

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

```js
async function verifyChecklist(frame, spec, scenarioFlags = null) {
  const errors = [];
  const flags = scenarioFlags || {};
  
  // ① 状态栏
  const sb = frame.children.find(c => c.name.includes('状态栏'));
  if (sb) {
    if (Math.abs(sb.width - spec.frameW) > 1) errors.push(`statusBar.width ${sb.width} != ${spec.frameW}`);
    if (Math.abs(sb.height - spec.statusBarH) > 1) errors.push(`statusBar.height ${sb.height} != ${spec.statusBarH}`);
    if (sb.y !== 0) errors.push(`statusBar.y != 0`);
  }
  
  // ② frame cornerRadius
  if (frame.cornerRadius !== spec.cornerRadius) {
    errors.push(`frame.cornerRadius ${frame.cornerRadius} != ${spec.cornerRadius}`);
  }
  
  // ③ frame fill 已绑定 token
  if (!frame.fills?.[0]?.boundVariables?.color) {
    errors.push(`frame.fill not bound to token`);
  }
  
  // ④ 栏宽
  const main = frame.children.find(c => c.name === 'main');
  if (main && spec.cols) {
    for (const [colName, expectW] of Object.entries(spec.cols)) {
      const col = main.children.find(c => c.name === colName);
      if (col && Math.abs(col.width - expectW) > 1) {
        errors.push(`${colName}.width ${col.width} != ${expectW}`);
      }
    }
  }
  
  // ⑤ 杆子风满 + 透明 + z-顶
  const gz = frame.children.find(c => c.name?.startsWith('杆子'));
  if (gz) {
    if (gz.width !== spec.frameW) errors.push(`杆子.width != frameW`);
    if (gz.fills?.length > 0) errors.push(`杆子.fills should be empty (transparent)`);
    if (frame.children.indexOf(gz) !== frame.children.length - 1) {
      errors.push(`杆子 not at top z-order`);
    }
  }
  
  // ⑥ Sidebar 高度（仅 Pad NLC）
  if (spec.sidebar) {
    const sd = frame.children.find(c => c.name?.includes('Sidebar'));
    if (sd) {
      if (Math.abs(sd.height - spec.sidebar.h) > 1) {
        errors.push(`Sidebar.height ${sd.height} != ${spec.sidebar.h}（reflow？）`);
      }
    }
  }
  
  // ⑦ spec.componentChecks 遍历 —— 标准组件 reflow 自动检测
  if (Array.isArray(spec.componentChecks)) {
    for (const chk of spec.componentChecks) {
      const node = await figma.getNodeByIdAsync(chk.id);
      if (!node) {
        errors.push(`componentCheck[${chk.label}] node not found (id=${chk.id})`);
        continue;
      }
      if (chk.w !== undefined && Math.abs(node.width - chk.w) > 0.5) {
        errors.push(`${chk.label}.width ${node.width} != ${chk.w} (reflow)`);
      }
      if (chk.h !== undefined && Math.abs(node.height - chk.h) > 0.5) {
        errors.push(`${chk.label}.height ${node.height} != ${chk.h} (reflow)`);
      }
      if (chk.x !== undefined && Math.abs(node.x - chk.x) > 0.5) {
        errors.push(`${chk.label}.x ${node.x} != ${chk.x}`);
      }
      if (chk.y !== undefined && Math.abs(node.y - chk.y) > 0.5) {
        errors.push(`${chk.label}.y ${node.y} != ${chk.y}`);
      }
      // ⑦b inner first child clipping (common-rules §3.6.A) — TopBar_03/_07 等含固定宽 root child 必查
      if (node.children?.[0]) {
        const c0 = node.children[0];
        if (Math.abs(c0.width - node.width) > 0.5) {
          errors.push(`${chk.label} INNER CLIPPING: instance ${node.width} vs child[0] '${c0.name}' ${c0.width} (need child[0].layoutSizingHorizontal='FILL')`);
        }
      }
    }
  }
  
  // ⑧ NLC 覆盖遮罩 fill 已绑定 token（spec.mask 或 flags.NCovering）
  if (spec.mask || flags.NCovering) {
    const mask = frame.children.find(c => c.name === '遮罩-N覆盖');
    if (!mask) {
      errors.push(`遮罩-N覆盖 missing (NCovering trigger)`);
    } else if (!mask.fills?.[0]?.boundVariables?.color) {
      errors.push(`mask.fill not bound to token`);
    }
  }
  
  // ⑨ 分割线 token 绑定
  const div = frame.children.find(c => c.name === '栏间分割线');
  if (div && !div.fills?.[0]?.boundVariables?.color) {
    errors.push(`分割线.fill not bound to token`);
  }
  
  // ⑩ L 编辑遮罩 (§3.7a) —— flags.LEditMode trigger
  // NL framework 时整体跳过 ⑩~⑫（NL 一律 mask 不渲染，详见 common-rules §3.7a-NL）
  if (flags.LEditMode && spec.framework !== 'NL') {
    const editMask = frame.children.find(c => c.name === '遮罩-编辑');
    if (!editMask) {
      errors.push(`遮罩-编辑 missing (LEditMode trigger §3.7a)`);
    } else {
      if (Math.abs(editMask.height - spec.frameH) > 1) {
        errors.push(`遮罩-编辑.h ${editMask.height} != frameH ${spec.frameH}`);
      }
      if (!editMask.fills?.[0]?.boundVariables?.color) {
        errors.push(`遮罩-编辑.fill not bound to '遮罩色/mask' token`);
      }
      // 遮罩-编辑 必须在 状态栏 之上 z-order（C 列 status bar 区段 dim 必需）—— 2026-05-18 修订
      const sbIdx = frame.children.findIndex(c => c.name.includes('状态栏'));
      const emIdx = frame.children.indexOf(editMask);
      if (sbIdx >= 0 && emIdx <= sbIdx) {
        errors.push(`遮罩-编辑 must be ABOVE 状态栏 in z-order (§3.7a, sbIdx=${sbIdx}, emIdx=${emIdx})`);
      }
      // L 栏 是否已 promote 到 frame 直接子级
      const L = frame.children.find(c => c.name === 'L 栏');
      if (!L) {
        errors.push(`L 栏 not promoted to frame direct child (§3.7a requires promote)`);
      }
    }
  }
  
  // ⑩b 遮罩-N覆盖 必须在 状态栏 之上 z-order（§3.7 修订 2026-05-18）
  if (flags.NCovering || spec.mask) {
    const ncMask = frame.children.find(c => c.name === '遮罩-N覆盖');
    const sbIdx = frame.children.findIndex(c => c.name.includes('状态栏'));
    if (ncMask && sbIdx >= 0) {
      const ncIdx = frame.children.indexOf(ncMask);
      if (ncIdx <= sbIdx) {
        errors.push(`遮罩-N覆盖 must be ABOVE 状态栏 in z-order (§3.7 revised, sbIdx=${sbIdx}, ncIdx=${ncIdx})`);
      }
    }
  }
  
  // ⑪ 多 mask z-order (§3.7b) —— LEditMode + NCovering 同时（NL framework 跳过）
  if (flags.LEditMode && flags.NCovering && spec.framework !== 'NL') {
    const expected = ['main', '状态栏', '遮罩-编辑', '栏间分割线', 'L 栏', '遮罩-N覆盖', 'Sidebar', '杆子'];
    const actual = frame.children.map(c => {
      const name = c.name || '';
      if (name === 'main') return 'main';
      if (name.includes('遮罩-编辑')) return '遮罩-编辑';
      if (name.includes('状态栏')) return '状态栏';
      if (name.includes('栏间分割线')) return '栏间分割线';
      if (name === 'L 栏') return 'L 栏';
      if (name.includes('遮罩-N覆盖')) return '遮罩-N覆盖';
      if (name.includes('Sidebar')) return 'Sidebar';
      if (name.startsWith('杆子')) return '杆子';
      return name;
    });
    for (let i = 0; i < expected.length; i++) {
      if (actual[i] !== expected[i]) {
        errors.push(`多 mask z-order [${i}] expected '${expected[i]}' got '${actual[i]}' (§3.7b)`);
      }
    }
  }
  
  // ⑫ C 编辑时无 mask (§3.7a 末) — NL framework 无 C 列, 跳过
  if (flags.CEditMode && !flags.LEditMode && !flags.NEditMode && spec.framework !== 'NL') {
    const editMask = frame.children.find(c => c.name === '遮罩-编辑');
    if (editMask) {
      errors.push(`遮罩-编辑 should NOT exist when only CEditMode active`);
    }
  }
  
  // ⑬ scenarioFlags 一致性 —— flags === null 时 §6.2 #21~#24 检查跳过提示
  if (scenarioFlags === null && (spec.editMask || spec.NCoverMask)) {
    errors.push(`scenarioFlags not provided but spec contains mask spec — §6.2 #23 violation`);
  }
  
  // ⑭ ToolBar 胶囊宽度（device-dim「工具栏规格 / 胶囊尺寸」line 657~663）
  // §0.2 「A 类一律风满」仅约束 instance 外壳；inner 胶囊（工具个数举例 / TabMaterial-Showcase）
  //   有独立 spec：栏 W ≤ 440 → 风满（栏W − 48）；栏 W > 440 → 定宽 344 居中。
  //   反例：把外壳风满递归到 inner（FILL）→ 胶囊横跨整栏，违反 device-dim 规格。
  if (Array.isArray(spec.componentChecks)) {
    for (const chk of spec.componentChecks) {
      if (!/ToolBar|BottomBar_Showcase/.test(chk.label || '')) continue;
      const node = await figma.getNodeByIdAsync(chk.id);
      if (!node || !node.children) continue;
      // inner 胶囊 = 第一层 child 中名称含「工具个数举例」或「TabMaterial-Showcase」的节点
      let capsule = null;
      const findCapsule = (n, depth = 0) => {
        if (depth > 3 || capsule) return;
        if (/工具个数举例|TabMaterial-Showcase/.test(n.name || '')) { capsule = n; return; }
        if (n.children) for (const c of n.children) findCapsule(c, depth + 1);
      };
      findCapsule(node);
      if (!capsule) continue;
      const colW = chk.w || node.width;
      if (colW <= 440) {
        const expectW = colW - 48;
        if (Math.abs(capsule.width - expectW) > 0.5) {
          errors.push(`${chk.label} 胶囊.width ${capsule.width} != ${expectW} (栏 W ${colW} ≤ 440 → 风满)`);
        }
      } else {
        if (Math.abs(capsule.width - 344) > 0.5) {
          errors.push(`${chk.label} 胶囊.width ${capsule.width} != 344 (栏 W ${colW} > 440 → 定宽 344, device-dim line 657~663)`);
        }
        // 胶囊居中：相对 instance 居中（容差 1dp）
        const expectX = (node.width - 344) / 2;
        if (Math.abs(capsule.x - expectX) > 1) {
          errors.push(`${chk.label} 胶囊.x ${capsule.x} != ${expectX} (栏 W > 440 时居中)`);
        }
      }
    }
  }
  
  // ⑯ inner componentProperties 与源稿同步检查（仅当 spec.componentChecks[i].sourceInstId 提供时）
  //    递归比对 adapt instance 与 source instance 的 inner INSTANCE 子节点 componentProperties。
  //    覆盖：变体属性（状态 / 数量 / 材质 / 编辑态 等）+ boolean / instance-swap。
  //    根因：placeStandardComponent inheritInnerState 默认 ON，但若上层未传 sourceInst 则
  //         inner state 仍停留在 mainComponent default（如 ToolBar 按钮 状态=默认 而非源「禁用」）。
  if (Array.isArray(spec.componentChecks)) {
    for (const chk of spec.componentChecks) {
      if (!chk.sourceInstId) continue;
      const t = await figma.getNodeByIdAsync(chk.id);
      const s = await figma.getNodeByIdAsync(chk.sourceInstId);
      if (!t || !s) continue;
      const diffs = [];
      const walk = (a, b, path) => {
        if (!a?.children || !b?.children) return;
        const len = Math.min(a.children.length, b.children.length);
        for (let i = 0; i < len; i++) {
          const ai = a.children[i], bi = b.children[i];
          if (!ai || !bi || ai.name !== bi.name) continue;
          if (ai.type === 'INSTANCE' && bi.type === 'INSTANCE' && bi.componentProperties) {
            for (const [pname, pval] of Object.entries(bi.componentProperties)) {
              if (!['VARIANT','BOOLEAN','TEXT','INSTANCE_SWAP'].includes(pval.type)) continue;
              const av = ai.componentProperties?.[pname]?.value;
              if (av !== pval.value) diffs.push(`${path}/${ai.name}.${pname}: adapt='${av}' source='${pval.value}'`);
            }
          }
          walk(ai, bi, `${path}/${ai.name}`);
        }
      };
      walk(t, s, chk.label || t.name);
      for (const d of diffs) errors.push(`inner state mismatch: ${d}`);
    }
  }

  // ⑮ Pad N 栏 z-order（NavBar 必须在 Sidebar 之上）
  // NLC / NL framework Pad N 栏内含 NavigationBar_12 + Sidebar_01 两实例。
  //   Figma children index 大者 z 上 → Sidebar 若 idx 大则盖住 NavBar。
  //   权威：N 栏 NavBar 应在 Sidebar 之上 z（NavBar 在 N 栏顶部 56dp 提供操作 icon，
  //   Sidebar 在底层 + 自身上方留 padding）。
  const main = frame.children.find(c => c.name === 'main');
  if (main) {
    const nCol = main.children?.find(c => c.name === 'N 栏');
    if (nCol && nCol.children) {
      const navIdx = nCol.children.findIndex(c => /NavigationBar/i.test(c.name || '') && !/Sidebar/i.test(c.name || ''));
      const sbIdx = nCol.children.findIndex(c => /Sidebar|BottomBar/i.test(c.name || ''));
      if (navIdx >= 0 && sbIdx >= 0 && navIdx < sbIdx) {
        errors.push(`N 栏 z-order: NavBar (idx ${navIdx}) below Sidebar (idx ${sbIdx}) — NavBar must be ABOVE Sidebar`);
      }
    }
  }
  
  return errors;
}
```

错误清单 > 0 时禁止汇报「适配完成」。先修后再 verify。

**检查项映射** (`common-rules.md §6.2`)：

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
| `references/common-rules.md` | 通用原则（检索边界 / 内容边界 / z-order 模式 / 落位放置）|
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
