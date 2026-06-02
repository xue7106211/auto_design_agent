// =============================================================================
// placement.ts — Component placement runtime (multi-端 适配 Phase 4/5 token + 落位)
// =============================================================================
//
// 用途: use_figma 调用前以 Read tool 读本文件, 将内容作为 prefix inject 到
// use_figma code 中. 之后调用 buildTokenCache / bindFill / placeStandardComponent
// 等 global 函数. 避免 AI 每次 inline 重写函数本体导致累积 fix 丢失.
//
// 用法:
//   const placementCode = await Read('csv-pipeline/runtime/placement.ts');
//   await use_figma({ code: `${placementCode}\n\n// my task code...` });
//
// 导出函数 (use_figma 上下文 globals):
//   - buildTokenCache(names) → Promise<Record<string, Variable>>
//   - bindFill(node, tokenName, fallbackRGB, opacity?) → Promise<boolean>
//   - probeListCardness(inst) → 'card' | 'flat' | null  (List variant card-presence 自动 probe)
//   - bindStrokePaint(tokenName, fallbackRGB, opacity?) → Promise<Paint>
//   - placeStandardComponent({ inst, parent, x, y, w, h, sourceInst?, opts?, targetVariant? }) → Promise<string>
//
// 权威 source 一致性:
//   - protocol.md §2 (placeStandardComponent 本体)
//   - protocol.md §4 (token cache / bindFill)
//   - common-rules §0 #18 (A 类 风满) / §3.6 (auto-layout reflow)
//   - common-rules §3.8 (分割线 = strokeLeft, RECTANGLE 废弃 2026-05-28)
//   - protocol.md step 7b (chip-like multi-child 保护, children.length === 1 时才 FILL,
//                           2026-05-28 加入)
//
// 变更规则: 本 .ts 为 single source. protocol.md §2 / §4 代码块为 historical
// reference, 实际执行以本文件为权威. 修改函数本体只在本文件 commit, .md 不再
// 同步更新代码 (避免 drift).

// -----------------------------------------------------------------------------
// 1. Token cache
// -----------------------------------------------------------------------------
async function buildTokenCache(names) {
  const cache = {};
  const cols = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
  for (const col of cols) {
    const vars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(col.key);
    for (const v of vars) {
      if (v.resolvedType === 'COLOR' && (!names || names.includes(v.name))) {
        cache[v.name] = v;
      }
    }
  }
  return cache;
}

// -----------------------------------------------------------------------------
// 2. bindFill — 给 node.fills 绑定 color token (TOKEN_CACHE 全局必须已定义)
// -----------------------------------------------------------------------------
async function bindFill(node, tokenName, fallbackRGB, opacity) {
  if (opacity === undefined) opacity = 1;
  let paint = { type: 'SOLID', color: fallbackRGB, opacity };
  const meta = (typeof TOKEN_CACHE !== 'undefined') ? TOKEN_CACHE[tokenName] : null;
  if (meta) {
    try {
      const v = await figma.variables.importVariableByKeyAsync(meta.key);
      paint = figma.variables.setBoundVariableForPaint(paint, 'color', v);
    } catch {}
  }
  node.fills = [paint];
  return !!meta;
}

// -----------------------------------------------------------------------------
// 2b. probeListCardness — 自动 probe List_*_NN variant 的卡片 stacked vs flat list.
//
//     用途: 容器 fill 决定时 (caller / layout reference 内) 调用, 不把 stale §0.X
//     矩阵作为单一权威 source 信任, 而是基于实际 instance 结构自动判定.
//     返回: 'card' | 'flat' | null (无法判定, caller 回退到矩阵).
//
//     判定规则:
//     - flat 信号: item 之间的 child 含「套卡列表」或「分割线」instance + height < 5
//                  (e.g. List_Notes_03 / List_Task_03 = item — divider — item — divider ...)
//     - card 信号: 首个 item cornerRadius=20 + 有 fills + item 之间 gap > 5dp
//                  (e.g. List_Notes_01 / List_Task_01 = gap-stacked rounded cards)
//
//     回顾: 2026-06-01 笔记多端适配 task 中, §0.3 矩阵的「笔记 List_Notes
//     全设备带卡片」stale claim 导致 4 frame L 栏 fill (surface_low) 误用.
//     实际 List_Notes_03 = flat list. 本 helper 引入后 caller 可将矩阵
//     lookup 结果与 instance 结构 cross-check → 防止 stale 矩阵再发.
//
//     调用示例 (layout reference / caller 站点):
//       const cardness = probeListCardness(listInst);
//       const tokenName = (cardness === 'flat')
//         ? '背景色/surface'        // flat → 维持 device default
//         : '背景色/surface_low';   // card → 卡片浮起
//       await bindFill(Lcol, tokenName, fallback);
// -----------------------------------------------------------------------------
function probeListCardness(inst) {
  if (!inst) return null;
  const instName = inst.name || '';
  const setName = (inst.mainComponent && inst.mainComponent.parent && inst.mainComponent.parent.name) || '';
  if (!/^List_/.test(instName) && !/^List_/.test(setName)) return null;
  const ch = inst.children || [];
  if (ch.length < 2) return null;
  // flat 信号: child 中存在「套卡列表」或「分割线」instance + height < 5
  const hasDividerBetween = ch.some(c => /套卡列表|分割线/.test(c.name || '') && (c.height || 0) < 5);
  if (hasDividerBetween) return 'flat';
  // card 信号: 首个 item cornerRadius=20 + fills 非空 + item 之间 gap > 5
  const item0 = ch[0], item1 = ch[1];
  if (item0 && item1
      && item0.cornerRadius === 20
      && Array.isArray(item0.fills) && item0.fills.length > 0
      && (item1.y - (item0.y + item0.height)) > 5) {
    return 'card';
  }
  return null;
}

// -----------------------------------------------------------------------------
// 3. bindStrokePaint — 创建带 token 绑定的 stroke paint (caller 自己赋值给 strokes)
//    common-rules §3.8: 栏间分割线 = C 栏 strokeLeftWeight=1 + strokes 绑定
// -----------------------------------------------------------------------------
async function bindStrokePaint(tokenName, fallbackRGB, opacity) {
  if (opacity === undefined) opacity = 1;
  let paint = { type: 'SOLID', color: fallbackRGB, opacity };
  const meta = (typeof TOKEN_CACHE !== 'undefined') ? TOKEN_CACHE[tokenName] : null;
  if (meta) {
    try {
      const v = await figma.variables.importVariableByKeyAsync(meta.key);
      paint = figma.variables.setBoundVariableForPaint(paint, 'color', v);
    } catch {}
  }
  return paint;
}

// -----------------------------------------------------------------------------
// 4. placeStandardComponent — protocol.md §2 标准落位序列
//    args:
//      inst           — 已 createInstance 的 instance (caller 负责创建)
//      parent         — 落位 target parent
//      x, y, w, h     — 栏内坐标系 + 大小 (raw values; 提供 laneW 时自动应用 outer padding — 参见下文)
//      laneW          — (推荐) 该 component 所在 栏 width (Lw / Cw / Nw / frameW). 提供时:
//                       device-dim 断点 padding 表 + 笔记 INTERNAL 表 lookup → 自动计算 outer.
//                       result: instance.x = outer, instance.width = laneW − 2×outer.
//                       (不 override caller-pass x/w; 优先)
//      isQ18          — (与 laneW 一同提供时) 是否 Q18 (Fold 内屏). 为 true 时 w ≤ 640 → 统一 12dp.
//      sourceInst     — (可选) source inst, 用于 inner componentProperties 继承
//      targetVariant  — (可选) 目标 variant component, 提供时执行 swapComponent
//      statusBarH     — (可选, 推荐) frame status bar 高度 (Pad=34, Fold=46). 提供时 lane
//                       y=0 h=frameH 满高度模式自动检测 → caller-pass y 自动加 SBH.
//                       caller 只需传 lane-relative y (例: NavBar y=6).
//      bottomAligned  — (可选) true = 底部对齐 control (BottomBar / TextInput / Fab 等),
//                       SBH 自动补正 skip. caller 直接使用 frame-relative y (例: H-100).
//      opts           — { fillFirstChild?, resetOverrides?, inheritInnerState? }
//                       fillFirstChild 默认 true, multi-child component 自动 skip
//                       resetOverrides 默认 OFF (protocol §2 关键决定)
//                       inheritInnerState 默认 true (sourceInst 提供时执行)
//
//    回顾 (2026-06-02 笔记多端适配 task): 不应用 laneW 时, inline caller 一律
//    使用 `x=0, w=laneW` 简单模式 → 遗漏 device-dim outer padding 规则 (`outer = max(0, spec-internal)`).
//    同一规则只写在 .md 而 runtime 未强制, 6 个月内再发 7 次. 本选项在
//    placement.ts level 自动处理 caller-side lookup 遗漏.
// -----------------------------------------------------------------------------

// 笔记 / 待办 standard component family internal padding (左+右 一半)
const NOTES_INTERNAL_PAD = {
  NavigationBar: 12,
  NavigationBar_ComponentSet: 12,
  SearchBar_ComponentSet: 12,
  SelectableChip_ComponentSet_Notes: 12,
  List_Notes: 12,
  Detail_Notes: 20,
  TextInput_ComponentSet_Notes: 12,  // _05/_06/_07 的不同规则在 device-dim 处理
  ToolBar_ComponentSet: 0,           // 外缘风满 + capsule 内处 (master HUG)
  BottomBar_Showcase: 0,
  BottomBar_NoteEditPanel: 0,
};

// device-dim 断点 padding (左·右 各自).
// Q18 (Fold 内屏) device-dim §34: 一律 12dp. 仅 **真 C栏通栏 (Detail full-bleed) 且
// 800≤w≤1100** 时为 56dp. NL→C fallback 非真 C通栏 (list 上提) → cFullBleed=false
// → 12dp (= app-variant-map §0.1 #9「Fold内 NL→C = 笔记 LC 同等」= 12dp 一致).
// 旧 bug: `isQ18 && w<=640` 仅 12 → Q18 w>640 (例: Fold内横 888) 落入一般 断点 56.
function laneBpPadding(laneW, isQ18, cFullBleed) {
  if (isQ18) return (cFullBleed === true && laneW >= 800 && laneW <= 1100) ? 56 : 12;
  if (laneW <= 420) return 12;
  if (laneW <= 640) return 20;
  if (laneW <= 800) return 28;
  return 56; // ≤1100 + 超过 1100 (此处相同, 超过 1100 由 caller 单独处理 fill margin)
}

function lookupInternalPad(name) {
  if (!name) return 0;
  for (const [key, val] of Object.entries(NOTES_INTERNAL_PAD)) {
    if (name === key || name.startsWith(key)) return val;
  }
  return 0;
}

async function placeStandardComponent(args) {
  const { inst, parent, h } = args;
  let { x, y, w } = args;
  const sourceInst = args.sourceInst || null;
  const opts = args.opts || {};
  const resetOverrides = opts.resetOverrides === true;

  // 0. laneTop / statusBarH 自动补正 (2026-06-02 追加, 防止 rule-doc-only failure)
  //
  //    条件: 父 lane = `y=0, h=frameH` 满高度模式 (per common-rules §0 #26 各栏 自身 fill +
  //    frame 透明). 此时 lane 坐标系 y=0 = frame y=0 = status bar 上沿. caller 即使
  //    意图 'lane-relative y' (如 NavBar y=6), 不补正则与 status bar 区域 overlap.
  //
  //    选项:
  //      args.statusBarH: number — frame status bar 高度 (Pad=34, Fold=46). 提供时
  //        本 step 激活. lane y=0 h=frameH 满高度模式自动检测 → caller-pass y
  //        自动加 SBH. **caller 只需传 lane-relative 坐标 (y=6/62/118…)**.
  //      args.bottomAligned: boolean — true 时 SBH 补正 skip (BottomBar / TextInput 等
  //        底部对齐 control 使用 frame-relative y).
  //
  //    回顾 (2026-06-02 笔记 多端适配 task): 4 frame 全部 lane y=6 inline → status
  //    bar overlap. user 指出后 +SBH 一并补正. .md only rule = 6 个月 7 次再发
  //    (memory `feedback_runtime_enforce_rules`). 升格为 runtime guard.
  //
  //    skip 条件: parent.y !== 0 || parent.h < frameH-1 (lane 自身 SBH offset 模式 →
  //    无需追加补正). args.bottomAligned === true.
  if (typeof args.statusBarH === 'number' && !args.bottomAligned && parent) {
    const isFullHeightLane = parent.y === 0 && parent.parent
      && Math.abs(parent.height - (parent.parent.height || 0)) < 2; // lane h ≈ frameH
    if (isFullHeightLane) {
      y = (y || 0) + args.statusBarH;
    }
  }

  // 1. 迁移到 target parent
  if (parent && inst.parent !== parent) parent.appendChild(inst);

  // 2. variant swap (可选)
  if (args.targetVariant) {
    try { inst.swapComponent(args.targetVariant); } catch {}
  }

  // 3. resetOverrides 默认 OFF (开启会清掉 width override 触发 hug content reflow)
  if (resetOverrides) {
    try { inst.resetOverrides(); } catch {}
  }

  // 3b. laneW provided → 自动应用 outer padding (2026-06-02 追加, 防止 rule-doc-only failure).
  //     ToolBar / BottomBar_Showcase 系 = 保持外缘风满 (lane W), 内部 capsule 由 master HUG
  //     自行处理 → 强制 outer=0. 其他 A 类 = `outer = max(0, spec − internal)`.
  if (typeof args.laneW === 'number') {
    const isQ18 = args.isQ18 === true;
    const internal = lookupInternalPad(inst.name);
    // cFullBleed: 仅真正的 C栏通栏 (Detail full-bleed) 为 true. NL→C fallback / list lane 为 false (default).
    const spec = laneBpPadding(args.laneW, isQ18, args.cFullBleed === true);
    const outer = /ToolBar|BottomBar/.test(inst.name || '') ? 0 : Math.max(0, spec - internal);
    x = outer;
    w = args.laneW - 2 * outer;
  }

  // 4. sizing FIXED (四项全部, 互不替代)
  try { inst.layoutSizingHorizontal = 'FIXED'; } catch {}
  try { inst.layoutSizingVertical   = 'FIXED'; } catch {}
  try { inst.primaryAxisSizingMode  = 'FIXED'; } catch {}
  try { inst.counterAxisSizingMode  = 'FIXED'; } catch {}

  // 5. resize → x/y (顺序不可调换)
  inst.resize(w, h);
  inst.x = x; inst.y = y;

  // 6. inner state 继承 (sourceInst 存在时)
  //
  //    walk 的 property 分类 (2026-06-01 修订):
  //    - Functional state (状态 / 数量 / 交互态): 必须 carry over
  //      (例: ToolBar 按钮 状态=禁用 / 数量=1个, List item 编辑态)
  //    - Visual-context property (使用场景 / 深色模式 / 材质 / 主题 等): source
  //      override 多为 phone-context 附属, multi-device 适配时 master default
  //      才是答案. 从 inherit 中排除 → master default 优先.
  //
  //    回顾: 2026-06-01 笔记 多端适配 task. source phone `BottomBar_Showcase_Notes_02`
  //    的 inner `Overlay-Showcase.使用场景 = "灰色背景"` instance-level override.
  //    master default = "白色背景". 旧 walk 把 "灰色背景" 也 carry over → Fold 内
  //    LC 适配 frame 变灰. user 指出「源选择错误, 白色背景才是答案」.
  //    根因: source phone view 的 visual context (灰色背景) 是 phone-context 附属,
  //    multi-device 适配时 master default 才是答案. Carry over 行为 over-aggressive.
  //
  //    Excluded property 名 (regex 匹配):
  //      - 使用场景 / 场景 (例: Overlay-Showcase 灰色背景 / 白色背景)
  //      - 深色模式 / 模式 (light / dark 一律)
  //      - 材质 / 材质分类 (visual surface variant)
  //      - 主题 / 颜色 / 配色
  //    Functional property (carry over) 例: 状态 / 数量 / 编辑 / active / selected /
  //    disabled / variantid / Property 1 / name 等保持 carry.
  const VISUAL_CONTEXT_PROP_REGEX = /(使用场景|^场景$|深色模式|^模式$|^材质$|材质分类|^主题$|^颜色$|^配色$)/;
  if (sourceInst && opts.inheritInnerState !== false) {
    const walk = (a, b) => {
      if (!a || !b || !('children' in a) || !('children' in b)) return;
      if (!a.children || !b.children) return;
      const len = Math.min(a.children.length, b.children.length);
      for (let i = 0; i < len; i++) {
        const t = a.children[i], s = b.children[i];
        if (!t || !s || t.name !== s.name) continue;
        if (t.type === 'INSTANCE' && s.type === 'INSTANCE') {
          try {
            const props = s.componentProperties;
            if (props) {
              const p2 = {};
              for (const [k, v] of Object.entries(props)) {
                if (!['VARIANT', 'BOOLEAN'].includes(v.type)) continue;
                // Skip visual-context properties — keep master default
                if (VISUAL_CONTEXT_PROP_REGEX.test(k)) continue;
                p2[k] = v.value;
              }
              if (Object.keys(p2).length > 0) {
                try { t.setProperties(p2); } catch {}
              }
            }
          } catch {}
        }
        walk(t, s);
      }
    };
    try { walk(inst, sourceInst); } catch {}
  }

  // 7. children[0] FILL — single wrapper 或 SearchBar 系 multi-child 时应用
  //    protocol.md step 7b (2026-05-28 追加 chip-like 保护):
  //    children.length === 1 时才自动 FILL. multi-child 信任 component intended
  //    layout (children[0] FIXED + children[1+] FILL, 如 SelectableChip 的 folder
  //    icon 84dp FIXED + 自适应内容 FILL).
  //    例外: ToolBar / BottomBar_Showcase 的 inner 胶囊由 §0.2 spec 单独处理 (step 9).
  //    2026-05-31 SearchBar 例外: SearchBar_ComponentSet active variant (_01 等) 的
  //    inner = [InputBackground (FILL 必要), CloseButton (FIXED right-aligned)]
  //    2-child structure. instance 宽 < 自然 392 时 inner 不 reflow,
  //    导致 CloseButton 被裁切. SearchBar 系即使 multi-child 也强制 first child FILL.
  //    auto-layout 处理右侧 stretch → CloseButton 位置自动追踪.
  //    回顾: 2026-05-31 笔记搜索+详情 task 中, Fold/Pad L 的 SearchBar_01 reflow 时
  //    InputBackground hug + CloseButton x=336 (按自然宽) → Fold L 宽 353/282
  //    时 close X 被裁切 → user 指出「宽度问题」. multi-child 保护规则的 over-correction.
  const isSearchBar = /SearchBar/.test(inst.name || '')
    || /SearchBar/.test((inst.mainComponent && inst.mainComponent.parent && inst.mainComponent.parent.name) || '');
  const childMatch = inst.children && (inst.children.length === 1 || isSearchBar);
  if (opts.fillFirstChild !== false
      && childMatch
      && !/ToolBar|BottomBar_Showcase/.test(inst.name || '')) {
    const c0 = inst.children[0];
    if (c0 && Math.abs(c0.width - inst.width) > 0.5) {
      try { c0.layoutSizingHorizontal = 'FILL'; } catch {}
    }
  }

  // 7c. Sidebar_Notes attached form 保护 (2026-05-31 追加)
  //     master 定义为 H=Fill, 但 createInstance() default = FIXED.
  //     在 non-autolayout 父级中, 上面 step 5 inst.resize(w, h) 已应用 mainH.
  //     但仅把 inner「近手菜单组件」(children[0]) 维持为 FILL,
  //     其 children (新版标题栏 / 文件夹列表 / 分割线) 维持自然 HUG.
  //     ※ 与 Sidebar_Component_PAD_NLC 系 (BoardMaterialSection) 的 3-级 递归 FILL 规则
  //       结构不同, 绝不可套用 — 「新版标题栏」H=56 若自然拉伸,
  //       icon 位置会错乱.
  if (/Sidebar_Notes/.test(inst.name || '') && inst.children && inst.children.length === 1) {
    const c0 = inst.children[0]; // 近手菜单组件
    if (c0) {
      try { c0.layoutSizingVertical = 'FILL'; } catch {}
      // 深度 1 inner (新版标题栏 等) 维持 master 的自然 HUG — 不强制设 FIXED/HUG.
    }
  }

  // 8. 落位后 self-check (任何异常立即 throw)
  if (Math.abs(inst.width - w) > 0.5 || Math.abs(inst.height - h) > 0.5) {
    throw new Error(`reflow detected: ${inst.name} expected ${w}x${h} got ${inst.width}x${inst.height}`);
  }

  // 9. ToolBar / BottomBar_Showcase 胶囊后处理 (2026-06-01 规则废弃 + 重新定义)
  //
  //    旧规则 (commit 809d8cb, 已废弃):
  //      - 栏W ≤ 440 → 风满 capW = 栏W − 48
  //      - 栏W > 440 → 定宽 344 居中
  //      - 强制 capsule.layoutAlign = STRETCH
  //      - 9b: button.layoutGrow=1 + FILL → 均匀分配
  //
  //    旧规则错误之处: 无视 capsule 的 master 自然 width (220 / 344) 与 button 自然
  //    width (28×28 icon 等), 在 instance level 强制修改. 结果:
  //    button icon 被 stretch 到指定宽 (102dp 等) 而「挤压变形」.
  //    user 指出 (2026-06-01 笔记多端适配 task):「胶囊的宽度为何随意
  //    缩小. 宽度按内容数量变化, 但图标不该被挤压变形」.
  //
  //    新规则: capsule master 自然值原样保持 (HUG, button FIXED 自然 width).
  //    仅 BB instance 外缘按 lane W 风满, BB 的 master default
  //    `counterAxisAlignItems='CENTER'` (居中对齐) 原样保留 → capsule 自然
  //    220 宽在 lane 中自动居中对齐. 无 icon stretch. 当 master 拥有简单 capsule 之外的
  //    no-stretch 规则时, 本规则为正解.
  //
  //    例外: 若存在 capsule 本身为 STRETCH 的 master (并非完全没有),
  //    则需单独规则. 现 笔记 / 待办 的 BottomBar_Showcase / ToolBar 均为 capsule
  //    HUG default. 新增其他 family 时必须验证 master.
  //
  //    执行: capsule / button / overlay / BB padding 均保持 master default.
  //    无 instance level 强制修改. 仅外缘 lane W 风满.
  //
  //    9a. (2026-06-02 追加) 强制复原 capsule + button master default.
  //    ToolBar inner button 的 layoutGrow / layoutSizingHorizontal 因 stale
  //    instance override 处于 FILL/grow=1 状态时 → button FILL 均匀分配 → button
  //    width 92 (大于自然 66) → 4 button × 92 = 368dp 覆盖 capsule 自然 240,
  //    引发 overflow / 裁切. 每当 ToolBar / BottomBar_Showcase 系 instance
  //    与 laneW 一同 placement 时, 强制将 capsule + button 都复原为 HUG default.
  if (/ToolBar|BottomBar_Showcase/.test(inst.name || '')) {
    const findCap = (n) => {
      if (!n || n.type === 'TEXT' || !('children' in n) || !n.children) return null;
      for (const ch of n.children) {
        if (/工具个数举例|TabMaterial|工具栏胶囊/.test(ch.name || '')) return ch;
        const sub = findCap(ch);
        if (sub) return sub;
      }
      return null;
    };
    const cap = findCap(inst);
    if (cap) {
      try { cap.layoutSizingHorizontal = 'HUG'; } catch {}
      if (cap.children) {
        for (const btn of cap.children) {
          try { btn.layoutGrow = 0; } catch {}
          try { btn.layoutSizingHorizontal = 'HUG'; } catch {}
        }
      }
    }
  }

  return inst.id;
}

// -----------------------------------------------------------------------------
// 5. buildFrameSkeleton — 统一建 frame 骨架 (2026-06-02 添加, status bar 背景色 再发 防止)
//
//    动机: frame 骨架 (frame / main / 各栏 / status bar / 杆子) 一直由 caller 每个 frame
//    inline 手建. placeStandardComponent 强制了 component 落位, 但骨架的 §0 #26 / §3.8 /
//    clipsContent 规则没有 runtime 强制 → 每个 frame 手动重设时漏一项 (例: main.clipsContent
//    应 false 却设 true → status bar 区域 lane fill 被 clip → canvas 灰底 bleed-through).
//    本函数把骨架不变量固化为单一函数, caller 无法漏设.
//
//    强制的不变量 (全部来自既有规则, 非新增):
//      - frame:     fills=[] 透明 (§0 #26) + clipsContent=true (圆角) + cornerRadius
//      - main:      fills=[] + y=SBH + h=frameH-SBH + clipsContent=false
//                   (各栏 full-height 向上 overflow 到 status bar 区域, main clip 会切掉 → §0 #26)
//      - 各 lane:   y=-SBH (lane abs y=0, full-height 到 status bar) + h=frameH + clipsContent=true
//                   + fill 绑定 token (各栏自身负责 fill, §0 #26)
//      - C 栏:      strokeLeftWeight=1 + strokes 绑定 分割线色/outline (§3.8, divider=true 时)
//      - status bar: fills=[] 透明 (lane fill 透到 status bar 区域)
//      - 杆子:       fills=[] 透明 + 风满 frameW + 最顶 z
//
//    args:
//      parent      — section / page (frame 落位目标)
//      name        — frame 名
//      x, y        — frame 在 parent 内坐标
//      frameW/H, cornerRadius, statusBarH
//      lanes       — [{ name:'L栏'|'C栏'|'N栏', x, w, fillToken, divider? }] (左→右; divider=C栏左侧分割线)
//      bindFillFn  — bindFill 函数引用 (TOKEN_CACHE 依赖, caller 传入)
//      bindStrokeFn— bindStrokePaint 函数引用
//      mainClip    — (可选 override) 默认 false (full-height lane). Pad横 §3.9 时也 false. 真无需求才 true.
//
//    返回: { frame, main, lanes: {栏名: laneFrame} }  (status bar / 杆子 由 caller 用 place* 后续添加)
// -----------------------------------------------------------------------------
async function buildFrameSkeleton(args) {
  const { parent, name, x, y, frameW, frameH, cornerRadius, statusBarH, lanes, bindFillFn, bindStrokeFn } = args;
  const mainClip = args.mainClip === true; // 默认 false (full-height lane 标准结构)

  const frame = figma.createFrame();
  frame.name = name;
  frame.resize(frameW, frameH);
  if (typeof cornerRadius === 'number') frame.cornerRadius = cornerRadius;
  else if (cornerRadius) {
    frame.topLeftRadius = cornerRadius.topLeft; frame.topRightRadius = cornerRadius.topRight;
    frame.bottomLeftRadius = cornerRadius.bottomLeft; frame.bottomRightRadius = cornerRadius.bottomRight;
  }
  frame.clipsContent = true;   // 圆角 visible
  frame.fills = [];            // §0 #26 frame 透明
  frame.x = x; frame.y = y;
  if (parent) parent.appendChild(frame);

  const main = figma.createFrame();
  main.name = 'main';
  main.resize(frameW, frameH - statusBarH);
  main.x = 0; main.y = statusBarH;
  main.clipsContent = mainClip; // 默认 false — full-height lane 须不被 clip (§0 #26)
  main.fills = [];
  frame.appendChild(main);

  const laneMap = {};
  for (const lane of (lanes || [])) {
    const lf = figma.createFrame();
    lf.name = lane.name;
    lf.resize(lane.w, frameH);        // full-height
    lf.x = lane.x; lf.y = -statusBarH; // lane abs y=0 (full-height 到 status bar 区域)
    lf.clipsContent = true;           // lane 内容裁切 (chip / text overflow 防止)
    if (lane.fillToken && bindFillFn) {
      await bindFillFn(lf, lane.fillToken, { r: 1, g: 1, b: 1 });
    }
    if (lane.divider && bindStrokeFn) { // C 栏 左侧分割线 (§3.8)
      const sp = await bindStrokeFn('分割线色/outline', { r: 0, g: 0, b: 0 }, 0.1);
      lf.strokes = [sp];
      lf.strokeWeight = 0; lf.strokeTopWeight = 0; lf.strokeRightWeight = 0;
      lf.strokeBottomWeight = 0; lf.strokeLeftWeight = 1; lf.strokeAlign = 'INSIDE';
    }
    main.appendChild(lf);
    laneMap[lane.name] = lf;
  }

  return { frame, main, lanes: laneMap };
}
