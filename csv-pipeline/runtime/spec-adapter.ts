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

  const flat = {
    frameW: spec.frame?.w,
    frameH: spec.frame?.h,
    cornerRadius: spec.frame?.cornerRadius,
    statusBarH: spec.statusBar?.h,
    cols,
    frameFillToken,
    frameTransparent: false,
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
//   Strategy: lane parent 이름 ('L栏') 로 lane frame 찾고, 그 안에서 variant 이름
//   prefix 매칭. variant exact name 은 figma 가 instance 에 다르게 표기 (예:
//   'NavigationBar_ComponentSet_07' → 'NavigationBar_ComponentSet_07' or
//   'Property 1=NavigationBar_ComponentSet_07'). prefix 매칭 으로 충분.
// -----------------------------------------------------------------------------
function findInstanceInFrame(frame, comp) {
  const laneName = comp.lane; // 'L栏' / 'C栏' / 'N栏' / '全栏'
  const variant = comp.variant;
  // single-screen / promoted Sidebar — frame 직접 children
  const candidates = [];
  const pushFromParent = (parent) => {
    if (!parent || !parent.children) return;
    for (const c of parent.children) {
      if (c.type === 'INSTANCE' && (c.name === variant || c.name.includes(variant))) {
        candidates.push(c);
      }
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
  return candidates[0] ?? null;
}
