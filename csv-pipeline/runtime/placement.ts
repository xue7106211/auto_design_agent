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
// 2b. probeListCardness — List_*_NN variant 의 卡片 stacked vs flat list 자동 probe.
//
//     用途: 容器 fill 결정 시 (caller / layout reference 内) 호출하여 stale §0.X
//     매트릭스를 단일 권위 source 로 신뢰하지 않고 실제 instance 구조 기반 자동 판정.
//     반환: 'card' | 'flat' | null (판정 불가, caller 가 매트릭스 fall back).
//
//     판정 룰:
//     - flat 신호: item 사이 child 에 「套卡列表」 또는 「分割线」 instance + height < 5
//                  (e.g. List_Notes_03 / List_Task_03 = item — divider — item — divider ...)
//     - card 신호: 첫 item cornerRadius=20 + fills 있음 + item 사이 gap > 5dp
//                  (e.g. List_Notes_01 / List_Task_01 = gap-stacked rounded cards)
//
//     회고: 2026-06-01 笔记 多端 적응 task 에서 §0.3 매트릭스의 「笔记 List_Notes
//     全设备带卡片」 stale claim 으로 4 frame L 栏 fill (surface_low) 잘못 적용.
//     실제 List_Notes_03 = flat list. 본 helper 도입으로 caller 가 매트릭스
//     lookup 결과를 instance 구조로 cross-check 가능 → stale 매트릭스 재발 방지.
//
//     호출 예 (layout reference / caller 사이트):
//       const cardness = probeListCardness(listInst);
//       const tokenName = (cardness === 'flat')
//         ? '背景色/surface'        // flat → device default 维持
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
  // flat 신호: child 中 「套卡列表」 또는 「分割线」 instance 존재 + height < 5
  const hasDividerBetween = ch.some(c => /套卡列表|分割线/.test(c.name || '') && (c.height || 0) < 5);
  if (hasDividerBetween) return 'flat';
  // card 신호: 첫 item cornerRadius=20 + fills 비어있지 않음 + item 사이 gap > 5
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
//      x, y, w, h     — 栏内坐标系 + 大小 (A 类 component 必须 x=0 w=栏W 风满 §0 #18)
//      sourceInst     — (可选) source inst, 用于 inner componentProperties 继承
//      targetVariant  — (可选) 目标 variant component, 提供时执行 swapComponent
//      opts           — { fillFirstChild?, resetOverrides?, inheritInnerState? }
//                       fillFirstChild 默认 true, multi-child component 自动 skip
//                       resetOverrides 默认 OFF (protocol §2 关键决定)
//                       inheritInnerState 默认 true (sourceInst 提供时执行)
// -----------------------------------------------------------------------------
async function placeStandardComponent(args) {
  const { inst, parent, x, y, w, h } = args;
  const sourceInst = args.sourceInst || null;
  const opts = args.opts || {};
  const resetOverrides = opts.resetOverrides === true;

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

  // 4. sizing FIXED (四项全部, 互不替代)
  try { inst.layoutSizingHorizontal = 'FIXED'; } catch {}
  try { inst.layoutSizingVertical   = 'FIXED'; } catch {}
  try { inst.primaryAxisSizingMode  = 'FIXED'; } catch {}
  try { inst.counterAxisSizingMode  = 'FIXED'; } catch {}

  // 5. resize → x/y (顺序不可调换)
  inst.resize(w, h);
  inst.x = x; inst.y = y;

  // 6. inner state 继承 (sourceInst 存在时)
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
                if (['VARIANT', 'BOOLEAN'].includes(v.type)) p2[k] = v.value;
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

  // 7. children[0] FILL — single wrapper 또는 SearchBar 系 multi-child 时 적용
  //    protocol.md step 7b (2026-05-28 chip-like 保护追加):
  //    children.length === 1 时才自动 FILL. multi-child 信任 component intended
  //    layout (children[0] FIXED + children[1+] FILL, 如 SelectableChip 的 folder
  //    icon 84dp FIXED + 自适应内容 FILL).
  //    例外: ToolBar / BottomBar_Showcase 的 inner 胶囊由 §0.2 spec 单独处理 (step 9).
  //    2026-05-31 SearchBar 例外: SearchBar_ComponentSet active variant (_01 等) 의
  //    inner = [InputBackground (FILL 必要), CloseButton (FIXED right-aligned)]
  //    2-child structure. instance 폭 < 自然 392 时 inner 들이 reflow 안 되어
  //    CloseButton 잘림. SearchBar 系는 multi-child 라도 first child FILL 강제.
  //    auto-layout 이 우측 stretch 处理 → CloseButton 위치 자동 추적.
  //    회고: 2026-05-31 笔记搜索+详情 task 에서 Fold/Pad L 의 SearchBar_01 reflow 시
  //    InputBackground hug + CloseButton x=336 (자연 폭 기준) → 폴드 L 폭 353/282
  //    에서 close X 잘림 → user 「폭 문제」 지적. multi-child 보호룰의 over-correction.
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

  // 7c. Sidebar_Notes attached form 보호 (2026-05-31 추가)
  //     master 가 H=Fill 로 정의되어 있지만 createInstance() default = FIXED.
  //     non-autolayout 부모에서는 위 step 5 inst.resize(w, h) 가 이미 mainH 적용함.
  //     단 inner 「近手菜单组件」 (children[0]) 만 FILL 로 유지하고
  //     그 children (新版标题栏 / 文件夹列表 / 分割线) 는 자연 HUG 유지.
  //     ※ Sidebar_Component_PAD_NLC 系 (BoardMaterialSection) 의 3-级 递归 FILL 룰과
  //       구조가 다르므로 절대 적용하지 말 것 — 「新版标题栏」 H=56 자연이 늘어나면
  //       icon 위치 망가짐.
  if (/Sidebar_Notes/.test(inst.name || '') && inst.children && inst.children.length === 1) {
    const c0 = inst.children[0]; // 近手菜单组件
    if (c0) {
      try { c0.layoutSizingVertical = 'FILL'; } catch {}
      // 깊이 1 inner (新版标题栏 등) 는 master 의 자연 HUG 유지 — 강제로 FIXED/HUG 설정 안 함.
    }
  }

  // 8. 落位后 self-check (任何异常立即 throw)
  if (Math.abs(inst.width - w) > 0.5 || Math.abs(inst.height - h) > 0.5) {
    throw new Error(`reflow detected: ${inst.name} expected ${w}x${h} got ${inst.width}x${inst.height}`);
  }

  // 9. ToolBar / BottomBar_Showcase 胶囊后处理 (栏W > 440 → 定宽 344 居中)
  const setName = inst.mainComponent && inst.mainComponent.parent && inst.mainComponent.parent.name || '';
  if (/ToolBar|BottomBar_Showcase/.test(inst.name || setName)) {
    const findCapsule = (n) => {
      if (!n.children) return null;
      for (const c of n.children) {
        if (/工具个数举例|TabMaterial/.test(c.name || '')) return c;
      }
      return null;
    };
    const capsule = findCapsule(inst);
    if (capsule && w > 440) {
      try { capsule.layoutSizingHorizontal = 'FIXED'; } catch {}
      capsule.resize(344, capsule.height);
      const overlay = inst.children && inst.children.find(c => /Overlay/.test(c.name || ''));
      if (overlay) {
        try { overlay.primaryAxisAlignItems = 'CENTER'; } catch {}
      }
    }

    // 9b. 胶囊 inner 4 버튼 폭 자동 분배 (2026-06-01 추가)
    //     master `.组件状态变化` = `minWidth=66, FIXED 92dp, layoutGrow=0`. capsule 폭이
    //     源 phone 폭 (= 344) 보다 줄어들면 inner 버튼 좌우 튀어나감.
    //     회고: 2026-06-01 笔记 编辑 task 의 Fold內横/竖 (capsule 305/234) 에서 4 버튼이
    //     좌측 -16~-52 으로 튀어나옴. 외각 capsule 폭 룰만 자동화 했고 inner reflow 부재.
    //     두 갈래 fix:
    //       (a) capsule 内 사용 가능 폭 ≥ N×minWidth (= 264 for 4 buttons) →
    //           layoutGrow=1 + FILL + itemSpacing=0 으로 자동 균등 분배
    //           (Fold內横 305 / Pad 380 적용).
    //       (b) capsule 폭 < N×minWidth → minWidth instance level 변경 不可 (figma 거부).
    //           paddingL=R=0 + itemSpacing 음수 (源 phone 같은 overlap) 로 fit
    //           (Fold內竖 234 적용, spacing = (capW − N×minW) / (N−1) = -10).
    //     §3.2 instance 보호 룰 위반 없음 (capsule + button 모두 instance level
    //     property override 만, master detach 안 함).
    if (capsule && capsule.children && capsule.children.length >= 2) {
      const innerButtons = capsule.children.filter(c => c.type === 'INSTANCE');
      if (innerButtons.length >= 2) {
        try { capsule.paddingLeft = 0; } catch {}
        try { capsule.paddingRight = 0; } catch {}
        const minW = innerButtons[0].minWidth || 66;
        const totalMinW = innerButtons.length * minW;
        const capW = capsule.width;
        if (capW >= totalMinW) {
          try { capsule.itemSpacing = 0; } catch {}
          for (const b of innerButtons) {
            try { b.layoutGrow = 1; } catch {}
            try { b.layoutSizingHorizontal = 'FILL'; } catch {}
          }
        } else {
          const negSpacing = Math.floor((capW - totalMinW) / (innerButtons.length - 1));
          try { capsule.itemSpacing = negSpacing; } catch {}
          for (const b of innerButtons) {
            try { b.layoutGrow = 0; } catch {}
            try { b.layoutSizingHorizontal = 'FIXED'; } catch {}
            try { b.resize(minW, b.height); } catch {}
          }
        }
      }
    }
  }

  return inst.id;
}
