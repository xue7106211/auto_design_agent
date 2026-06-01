// =============================================================================
// spec-adapter.ts — bridge csv-to-spec spec.json shape → runtime verify.ts shape
// =============================================================================
//
// 用途: csv-to-spec.ts 가 emit 하는 nested spec.json 을 verify.ts 가 read 하는
// flat shape 으로 변환. AI 가 매 frame 마다 손으로 하던 변환 (`spec.frame.w` →
// `spec.frameW`, `spec.layout.lanes.L.w` → `spec.cols['L栏']` 등) 을 코드화.
//
// 用法 (Phase 6):
//   const placementCode = await Read('csv-pipeline/runtime/placement.ts');
//   const adapterCode   = await Read('csv-pipeline/runtime/spec-adapter.ts');
//   const verifyCode    = await Read('csv-pipeline/runtime/verify.ts');
//   const specJson      = await Read(`csv-pipeline/spec-output/spec/${specId}.json`);
//
//   await use_figma({ code: `
//     ${placementCode}
//     ${adapterCode}
//     ${verifyCode}
//     const SPEC = ${specJson};
//     const verifySpec = specToVerifyShape(SPEC, frame);
//     const errors = await verifyChecklist(frame, verifySpec, SPEC.scenarioFlags);
//     return { errors };
//   `});
//
// 导出函数 (use_figma 上下文 globals):
//   - specToVerifyShape(spec, frame?) → flatSpec    # frame 提供 시 componentChecks ID 자동 매칭
//
// 변환 매핑 (verify.ts 가 read 하는 field × csv-to-spec spec.json 위치):
//   spec.frameW              ← spec.frame.w
//   spec.frameH              ← spec.frame.h
//   spec.cornerRadius        ← spec.frame.cornerRadius
//   spec.statusBarH          ← spec.statusBar.h
//   spec.cols                ← { 'L栏': layout.lanes.L.w, 'C栏': ..., 'N栏': ... }   # 공백 없음 (§0 #14)
//   spec.frameFillToken      ← spec.frame.fill.name 의 / 뒤 alias (e.g. surface_low)
//   spec.frameTransparent    ← (csv-to-spec emit 안 함, 默认 false. spec.frame.fill 결정 = 透明 不可)
//   spec.framework           ← spec.layout.type 의 NLC 변종은 'NLC' 정규화, 그 외 그대로
//   spec.componentChecks     ← spec.components 中 verify-relevant component 자동 emit
//                               (frame 提供 시 frame.findOne 로 instance ID 매칭)
//   spec.sidebar             ← spec.components 中 element=Sidebar 의 h
//   spec.sidebarMainH        ← spec.components 中 Sidebar_Notes attached form 자동 detect
//   spec.sidebarPromote      ← spec.zOrder 中 'Sidebar' top-level 포함 시 true
//   spec.mask                ← (deprecated, scenarioFlags.NCovering 대체. helper 본 field emit 안 함)
//
// 변경 규칙: 본 helper 는 single source of truth. csv-to-spec spec.json shape 변경 시
// 본 file 만 update. verify.ts 는 그대로 (18+ incident 누적 코드, 건드림 위험).
//
// 권위 source 일관성:
//   - Stage 3A wire-up plan = `Improvement_doc/3A-wire-up-plan.md`
//   - common-rules §0 #14 = lane 이름 공백 不可 (`L栏` not `L 栏`)
//   - csv-to-spec.ts FrameSpec interface = nested shape source

// -----------------------------------------------------------------------------
// 1. specToVerifyShape — main converter
// -----------------------------------------------------------------------------
function specToVerifyShape(spec, frame) {
  const lanes = spec.layout?.lanes ?? {};
  const cols = {};
  for (const k of ['N', 'L', 'C']) {
    if (lanes[k]) cols[`${k}栏`] = lanes[k].w;
  }

  // frame fill token alias (背景色/surface_low → surface_low)
  let frameFillToken;
  if (spec.frame?.fill?.name) {
    const slash = spec.frame.fill.name.indexOf('/');
    frameFillToken = slash >= 0 ? spec.frame.fill.name.slice(slash + 1) : spec.frame.fill.name;
  }

  // framework normalization: 'NLC覆盖' / 'NLC并列' / 'NLC收起' → 'NLC' (verify.ts §3.7a-NL gate 가 'NL' 만 보면 됨)
  const layoutType = spec.layout?.type ?? '';
  let framework = layoutType;
  if (/^NLC/.test(layoutType)) framework = 'NLC';
  else if (/^NL(收起)?$/.test(layoutType)) framework = 'NL';
  else if (/^NC(收起)?$/.test(layoutType)) framework = 'NC';
  else if (/^LC$/.test(layoutType)) framework = 'LC';
  else if (/^C$/.test(layoutType)) framework = 'C';

  // sidebar info from components
  let sidebar;
  let sidebarMainH = false;
  for (const c of spec.components ?? []) {
    if (c.element === 'Sidebar') {
      sidebar = { h: c.h };
      // Sidebar_Notes attached form: master H=Fill, instance must run mainH (frameH - statusBarH)
      if (/Sidebar_Notes/.test(c.variant ?? '')) sidebarMainH = true;
    }
  }
  const sidebarPromote = Array.isArray(spec.zOrder) && spec.zOrder.includes('Sidebar');

  // componentChecks — emit verify-relevant components. ID 매칭은 frame 제공시.
  // verify.ts ⑦ chk.id 가 figma.getNodeByIdAsync 로 lookup 되므로 string 必수.
  // frame 제공 시 frame.findOne(c => c.name === expectedName && c.parent.name === lane)
  // 로 인스턴스 ID 자동 채움. miss 시 placeholder 'MISSING_${variant}' (verify.ts ⑦ no-id error 로 출력).
  const componentChecks = [];
  if (Array.isArray(spec.components)) {
    for (const c of spec.components) {
      if (c.category === 'out-of-flow') continue;
      // skip auto-height components (Detail / Input 等) — h 不定, reflow check 不能
      if (c.h === 'auto') continue;
      const label = `${c.lane.replace('栏', '')} ${c.element}_${c.variant.split('_').pop()}`;
      const chk = {
        id: 'MISSING_' + c.variant,
        label,
        x: c.x,
        y: c.y,
        w: c.w,
        h: c.h,
      };
      if (frame) {
        const matched = findInstanceInFrame(frame, c);
        if (matched) chk.id = matched.id;
      }
      componentChecks.push(chk);
    }
  }

  // §0 #26 (核心): multi-栏 적응 frame 의 frame.fills=[] 透明 (各栏 자체 fill).
  // spec.json 의 frame.fill 은 spec output reference 값일 뿐 — runtime frame 자체
  // 에 fill 적용 不要. lanes 가 N/L/C 中 2 이상 존재 = multi-栏 → frameTransparent.
  // 단일 lane (C 单栏) 또는 lanes 부재 → frame fill = spec.frame.fill token 적용.
  // 회고: 2026-06-01 spec-adapter Step 2 첫 검증 시 笔记 LC frame (lanes L+C) 에서
  // verifyChecklist 가 'frame.fill not bound' 오류 출력 → §0 #26 위반.
  const laneCount = ['N','L','C'].filter(k => lanes[k]).length;
  const frameTransparent = laneCount >= 2;
  const flat = {
    frameW: spec.frame?.w,
    frameH: spec.frame?.h,
    cornerRadius: spec.frame?.cornerRadius,
    statusBarH: spec.statusBar?.h,
    cols,
    frameFillToken: frameTransparent ? undefined : frameFillToken,
    frameTransparent,
    framework,
    componentChecks,
  };
  if (sidebar) flat.sidebar = sidebar;
  if (sidebarMainH) flat.sidebarMainH = true;
  if (sidebarPromote) flat.sidebarPromote = true;
  // device pass-through (verify.ts ⑰ Pad横 NLC并列 sidebarPromote 게이트가 spec.device 비교)
  if (spec.source?.device) flat.device = spec.source.device;
  return flat;
}

// -----------------------------------------------------------------------------
// 2. findInstanceInFrame — best-effort component → frame node lookup
//
//   Strategy: lane parent 이름 ('L栏') 로 lane frame 찾고, 그 안에서 instance 매칭.
//
//   매칭 우선순위 (figma 의 instance.name 패턴 다양성 대응):
//   1) instance.componentProperties[*].value 가 variant 와 정확 일치 (most reliable —
//      variant property 값에 直接 박힘)
//   2) instance.mainComponent.name 이 variant 또는 'name=variant' 형식과 일치
//   3) instance.name === variant
//   4) instance.name.includes(variant)
//   5) lane 내 동일 element family (NavigationBar / SearchBar 등) 의 唯一 instance
//      → fallback (variant 정보 부재 시)
//
//   회고: 2026-06-01 spec-adapter Step 2 첫 검증 시 figma instance.name = shortName
//   (예: 'NavigationBar') 만 들어가서 includes('NavigationBar_ComponentSet_04') fail
//   → 8/8 componentChecks MISSING. 매칭 룰 강화.
// -----------------------------------------------------------------------------
function findInstanceInFrame(frame, comp) {
  const laneName = comp.lane; // 'L栏' / 'C栏' / 'N栏' / '全栏'
  const variant = comp.variant;
  const candidates = [];

  // family prefix from variant name — e.g. 'NavigationBar_ComponentSet_04' → 'NavigationBar'
  const familyPrefix = variant.split('_')[0];

  const matches = (inst) => {
    if (!inst || inst.type !== 'INSTANCE') return 0;
    // (1) componentProperties value 매칭 (most reliable)
    if (inst.componentProperties) {
      for (const v of Object.values(inst.componentProperties)) {
        if (v && v.value === variant) return 5;
      }
    }
    // (2) mainComponent.name 매칭
    if (inst.mainComponent) {
      const mc = inst.mainComponent.name || '';
      if (mc === variant) return 4;
      if (mc.endsWith('=' + variant)) return 4; // 'name=NavigationBar_ComponentSet_04'
      if (mc.includes(variant)) return 3;
    }
    // (3) instance.name === variant
    if (inst.name === variant) return 3;
    // (4) instance.name includes
    if (inst.name && inst.name.includes(variant)) return 2;
    // (5) family fallback — name starts with familyPrefix
    if (inst.name && (inst.name === familyPrefix || inst.name.startsWith(familyPrefix + '_') || inst.name === familyPrefix + '_ComponentSet')) return 1;
    return 0;
  };

  const pushFromParent = (parent) => {
    if (!parent || !parent.children) return;
    for (const c of parent.children) {
      const score = matches(c);
      if (score > 0) candidates.push({ c, score });
    }
  };
  // 1) main 内 lane
  const main = frame.children?.find(c => c.name === 'main');
  if (main) {
    const lane = main.children?.find(c => c.name === laneName || c.name === laneName.replace('栏', ' 栏'));
    pushFromParent(lane);
  }
  // 2) frame 직접 (promoted lane / Sidebar / overlays)
  pushFromParent(frame);

  if (candidates.length === 0) return null;
  // best score, then first occurrence
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].c ?? null;
}
