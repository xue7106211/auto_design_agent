// render-spec.ts — spec JSON → Figma Plugin API JS string for use_figma
//
// Usage:
//   tsx scripts/render-spec.ts <specId>                 # single spec → stdout
//   tsx scripts/render-spec.ts <specId> --out file.js   # write to file
//   tsx scripts/render-spec.ts --all                    # batch all specs
//
// Output: self-contained JS body that, when passed as the `code` arg to
// mcp__plugin_figma_figma__use_figma, creates the target frame on the
// current page applying every propagation rule:
//   - frame fill bound to surface variable (or surface_low for NLC frame fill)
//   - lane fills bound to surface / surface_low variables
//   - StatusBar instance, fills=[] (transparent)
//   - components placed into their lanes at (x,y,w,h)
//   - divider as full-frame-height LINE with stroke bound to outline
//   - mask rectangles with opacity 0.2 + fill bound to mask
//   - SwipeIndicator (杆子) full-frame-width, fills=[]
//   - z-order per spec.zOrder (handles 遮罩-编辑 / 遮罩-N覆盖 / L 栏 lift)
//
// Rules NOT applied here (delegated to upstream csv-to-spec):
//   - lane breakpoint padding (already baked into component x/w)
//   - variant-aware lane fills, frame fill = L+C bg matching
//   - inner componentProperties inheritance (needs source instance, out of scope)

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SPEC_DIR = join(__dirname, '..', 'spec-output', 'spec');

// Token registry — must match csv-to-spec.ts NOTES_TOKENS
const TOKENS: Record<string, { name: string; key: string; fallback: { r: number; g: number; b: number } }> = {
  surface_low: { name: '背景色/surface_low', key: 'e74b063d74a3444a44a4e00bb7417c2dbea305ba', fallback: { r: 0.961, g: 0.961, b: 0.961 } },
  surface:     { name: '背景色/surface',     key: '5804f51e302d6fda00b3a8ce9d509d9b8ee09225', fallback: { r: 1, g: 1, b: 1 } },
  outline:     { name: '分割线色/outline',   key: '96f2cf4d1ce0d56cff2f8e98da6a5e16bd59983e', fallback: { r: 0.9, g: 0.9, b: 0.9 } },
  mask:        { name: '遮罩色/mask',        key: '0ed62540049dd3839b40b63d40f82492c4bac664', fallback: { r: 0, g: 0, b: 0 } },
};

interface Spec {
  id: string;
  source: { device: string; screenMode: string };
  frame: { w: number; h: number; cornerRadius: number | { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number }; fill: { name: string; key: string; fallback: { r: number; g: number; b: number } } };
  statusBar: { variant: string; setKey: string; library: string; x: number; y: number; w: number; h: number };
  layout: { type: string; lanes: Record<string, { x: number; y: number; w: number; h: number; fill: string }> };
  scenarioFlags: { LEditMode: boolean; NEditMode: boolean; CEditMode: boolean; NCovering: boolean; NCollapsed: boolean };
  components: Array<{ element: string; lane: string; variant: string; setKey: string; library: string; category: string; x: number; w: number; y: number; h: number | 'auto'; notes: string }>;
  overlays: Array<{ family: string; lane: string; variant: string; setKey: string; library: string; source: string }>;
  floatingContainer?: {
    family: string; variant: string; setKey: string; library: string;
    x: number; y: number; w: number; h: number;
    cornerRadius: number; headerH: number; modal: boolean;
    contentSlot: {
      x: number; y: number; w: number; h: number;
      paddingTop: number; paddingLR: number;
      fillToken: 'surface' | 'surface_low';
      bottomLeftRadius: number; bottomRightRadius: number;
      clipsContent: boolean;
      innerNode: { type: 'instance'; variant: string; setKey: string; library: string };
    };
  };
  masks: Array<{ name: string; x: number; y: number; w: number; h: number; fill: string; opacity: number }>;
  divider?: { x: number; y: number; w: number; h: number; fill: string };
  swipeIndicator: { variant: string; setKey: string; x: number; y: number | 'bottom'; w: number; fills: never[] };
  zOrder: string[];
}

function loadSpec(id: string): Spec {
  const path = join(SPEC_DIR, `${id}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function listSpecIds(): string[] {
  return readdirSync(SPEC_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
}

const LANE_KEY: Record<string, 'N' | 'L' | 'C'> = { 'N栏': 'N', 'L栏': 'L', 'C栏': 'C' };

function generateFigmaJs(spec: Spec): string {
  const lanes = spec.layout.lanes;
  const flags = spec.scenarioFlags;
  const hasEditMask = !!spec.masks.find((m) => m.name === '遮罩-编辑');
  const hasNCoverMask = !!spec.masks.find((m) => m.name === '遮罩-N覆盖');
  const liftLLane = flags.LEditMode === true && lanes.L != null;

  const componentsByLane: Record<string, typeof spec.components> = { N: [], L: [], C: [] };
  for (const c of spec.components) {
    const k = LANE_KEY[c.lane];
    if (k && componentsByLane[k]) componentsByLane[k].push(c);
  }

  // setKeys to import (deduplicated)
  const setKeys = new Set<string>();
  setKeys.add(spec.statusBar.setKey);
  setKeys.add(spec.swipeIndicator.setKey);
  for (const c of spec.components) setKeys.add(c.setKey);
  for (const o of spec.overlays) setKeys.add(o.setKey);
  if (spec.floatingContainer) {
    setKeys.add(spec.floatingContainer.setKey);
    setKeys.add(spec.floatingContainer.contentSlot.innerNode.setKey);
  }

  const ctx = {
    spec,
    lanes,
    flags,
    hasEditMask,
    hasNCoverMask,
    liftLLane,
    componentsByLane,
    setKeys: [...setKeys],
  };

  return `// Generated by render-spec.ts for ${spec.id}
const SPEC = ${JSON.stringify(spec, null, 2)};
const TOKENS = ${JSON.stringify(TOKENS)};
const CTX = ${JSON.stringify({ hasEditMask, hasNCoverMask, liftLLane })};

async function getVar(tokenName) {
  const t = TOKENS[tokenName];
  if (!t) return null;
  try { return await figma.variables.importVariableByKeyAsync(t.key); } catch { return null; }
}

function bindFill(node, varObj, fallback, opacity) {
  const fill = { type: 'SOLID', color: fallback };
  if (opacity != null) fill.opacity = opacity;
  if (varObj) {
    const bound = figma.variables.setBoundVariableForPaint(fill, 'color', varObj);
    node.fills = [bound];
  } else {
    node.fills = [fill];
  }
}

function bindStroke(node, varObj, fallback) {
  const stroke = { type: 'SOLID', color: fallback };
  if (varObj) {
    const bound = figma.variables.setBoundVariableForPaint(stroke, 'color', varObj);
    node.strokes = [bound];
  } else {
    node.strokes = [stroke];
  }
}

async function importSet(setKey) {
  return await figma.importComponentSetByKeyAsync(setKey);
}

function findVariant(set, variantName) {
  const norm = (s) => s.toLowerCase().replace(/[\\s_]+/g, '');
  const target = norm(variantName);
  // 1) exact name
  let m = set.children.find((c) => c.name === variantName);
  if (m) return m;
  // 2) Figma property-syntax: extract value after '=' for any property and compare normalized
  for (const c of set.children) {
    // "Property 1=Swipe Indicator_08, foo=bar" — split props, take rhs
    const props = c.name.split(',').map((p) => p.trim());
    for (const p of props) {
      const eq = p.indexOf('=');
      if (eq < 0) continue;
      const rhs = p.slice(eq + 1).trim();
      if (norm(rhs) === target) return c;
    }
  }
  // 3) normalized substring of full name
  m = set.children.find((c) => norm(c.name).includes(target));
  if (m) return m;
  throw new Error('variant not found: ' + variantName + ' (set has ' + set.children.length + ' children)');
}

// ── 0. Frame ─────────────────────────────────────────────
  const frame = figma.createFrame();
  frame.name = SPEC.id;
  frame.resize(SPEC.frame.w, SPEC.frame.h);
  // Apply corner radius — number = symmetric, object = asymmetric (Fold 外屏 device-dimensions.md).
  if (typeof SPEC.frame.cornerRadius === 'number') {
    frame.cornerRadius = SPEC.frame.cornerRadius;
  } else {
    frame.topLeftRadius = SPEC.frame.cornerRadius.topLeft;
    frame.topRightRadius = SPEC.frame.cornerRadius.topRight;
    frame.bottomLeftRadius = SPEC.frame.cornerRadius.bottomLeft;
    frame.bottomRightRadius = SPEC.frame.cornerRadius.bottomRight;
  }
  frame.clipsContent = true;
  const surfaceVar = await getVar('surface');
  const surfaceLowVar = await getVar('surface_low');
  const outlineVar = await getVar('outline');
  const maskVar = await getVar('mask');
  // frame fill
  const frameTokenName = SPEC.frame.fill.name.endsWith('surface_low') ? 'surface_low' : 'surface';
  bindFill(frame, frameTokenName === 'surface_low' ? surfaceLowVar : surfaceVar, SPEC.frame.fill.fallback);

  // place at empty space on the page
  figma.currentPage.appendChild(frame);

  // ── 1. main + lanes ────────────────────────────────────────
  const main = figma.createFrame();
  main.name = 'main';
  main.x = 0; main.y = SPEC.statusBar.h;
  main.resize(SPEC.frame.w, SPEC.frame.h - SPEC.statusBar.h);
  main.fills = [];
  main.clipsContent = false;
  frame.appendChild(main);

  const laneNodes = {};
  for (const [k, lane] of Object.entries(SPEC.layout.lanes)) {
    const ln = figma.createFrame();
    ln.name = k + '栏';
    ln.resize(lane.w, lane.h);
    ln.x = lane.x; ln.y = 0;
    // §3.4a.1 A 类 components are 风满 to lane W; some components (SelectableChip pill row) have natural
    // content width > lane W and visually overflow. clip at lane boundary to keep overflow contained.
    ln.clipsContent = true;
    const tok = lane.fill === 'surface_low' ? surfaceLowVar : surfaceVar;
    const fb = lane.fill === 'surface_low' ? TOKENS.surface_low.fallback : TOKENS.surface.fallback;
    bindFill(ln, tok, fb);
    main.appendChild(ln);
    laneNodes[k] = ln;
  }

  // ── 2. components per lane ───────────────────────────────
  const setCache = {};
  async function getSet(key) { return setCache[key] ??= await importSet(key); }

  for (const c of SPEC.components) {
    const laneKey = c.lane.replace('栏', '');
    const parent = laneNodes[laneKey];
    if (!parent) continue;
    let inst;
    try {
      const set = await getSet(c.setKey);
      const variant = findVariant(set, c.variant);
      inst = variant.createInstance();
    } catch (e) {
      console.warn('import failed', c.element, c.setKey, e);
      continue;
    }
    parent.appendChild(inst);
    try { inst.layoutSizingHorizontal = 'FIXED'; } catch {}
    try { inst.layoutSizingVertical = 'FIXED'; } catch {}
    const h = c.h === 'auto' ? inst.height : c.h;
    inst.resize(c.w, h);
    inst.x = c.x; inst.y = c.y;
    // §3.6 #6: instance resize ≠ inner first child width — apply FILL **selectively**.
    //   Generic apply broke multi-item inner content (e.g. SelectableChip's chip row stretches its leftmost pill).
    //   Whitelist: components with single-inner-content background (SearchBar 의 InputBackground 패턴).
    //   Add more families here only after verifying inner structure has no stretchable items.
    const FILL_INNER_WHITELIST = ['SearchBar'];
    if (FILL_INNER_WHITELIST.includes(c.element)) {
      try {
        const inner = inst.children?.[0];
        if (inner && (inst.layoutMode === 'VERTICAL' || inst.layoutMode === 'HORIZONTAL')) {
          inner.layoutSizingHorizontal = 'FILL';
        }
      } catch {}
    }
  }

  // ── 3. StatusBar (transparent) ───────────────────────────
  const sbSet = await getSet(SPEC.statusBar.setKey);
  const sbVariant = findVariant(sbSet, SPEC.statusBar.variant);
  const sb = sbVariant.createInstance();
  sb.name = '状态栏';
  frame.appendChild(sb);
  try { sb.layoutSizingHorizontal = 'FIXED'; } catch {}
  try { sb.layoutSizingVertical = 'FIXED'; } catch {}
  sb.resize(SPEC.statusBar.w, SPEC.statusBar.h);
  sb.x = SPEC.statusBar.x; sb.y = SPEC.statusBar.y;
  sb.fills = [];

  // ── 4. divider (1×frameH RECTANGLE bound to outline token) ─────
  // RECTANGLE preferred over LINE+rotation: rotation breaks bounding-box origin and
  // yields invisible/misplaced divider. Per common-rules §3.8 + §6.2 #12 +#13.
  if (SPEC.divider) {
    const r = figma.createRectangle();
    r.name = '分割线';
    r.resize(SPEC.divider.w || 1, SPEC.divider.h);
    r.x = SPEC.divider.x; r.y = 0;
    r.strokes = [];
    bindFill(r, outlineVar, TOKENS.outline.fallback);
    frame.appendChild(r);
  }

  // ── 5. masks (after divider, before SwipeIndicator) ──────
  // Each mask carries its own cornerRadius (per spec.masks[].cornerRadius), which may
  // be asymmetric (e.g. 编辑 mask covers C lane only → topLeft/bottomLeft = 0,
  // topRight/bottomRight = frame radius). Falling back to frame.cornerRadius (commit
  // af93530 prior) over-rounds the mask edge that abuts the divider.
  for (const m of SPEC.masks) {
    const r = figma.createRectangle();
    r.name = m.name;
    r.x = m.x; r.y = m.y;
    r.resize(m.w, m.h);
    const cr = m.cornerRadius != null ? m.cornerRadius : SPEC.frame.cornerRadius;
    if (typeof cr === 'number') {
      r.cornerRadius = cr;
    } else if (cr) {
      r.topLeftRadius = cr.topLeft;
      r.topRightRadius = cr.topRight;
      r.bottomLeftRadius = cr.bottomLeft;
      r.bottomRightRadius = cr.bottomRight;
    }
    bindFill(r, maskVar, TOKENS.mask.fallback, m.opacity);
    frame.appendChild(r);
  }

  // ── 6. L lane lift (LEditMode) ───────────────────────────
  if (CTX.liftLLane && laneNodes.L) {
    const L = laneNodes.L;
    const absX = main.x + L.x;
    const absY = main.y + L.y;
    frame.appendChild(L);
    L.x = absX; L.y = absY;
  }

  // ── 6a. Sidebar promote (§3.7 NLC覆盖 / §3.9 NLC并列+LEditMode) ──
  // Per zOrder: when 'Sidebar' is listed in SPEC.zOrder as a top-level entry, the Sidebar
  // instance must live at frame level (not inside main/N栏). Required for shadow visibility
  // (§3.9: N栏 + main clipsContent=false; Sidebar at frame level z-above L).
  // Rename promoted instance to 'Sidebar' so the step-9 zOrder pass (findChildren by name)
  // can reorder it; otherwise instance.name='Sidebar_Component'/'Sidebar_Component_PAD_NLC_01'
  // never matches and Sidebar stays at the bottom of frame.children (z=0), invisible under main.
  if (SPEC.zOrder.includes('Sidebar') && laneNodes.N) {
    const N = laneNodes.N;
    const sidebarInst = N.findChild((c) => /Sidebar/i.test(c.name || ''));
    if (sidebarInst) {
      const absX = main.x + N.x + sidebarInst.x;
      const absY = main.y + N.y + sidebarInst.y;
      // §3.9: clipsContent=false for shadow to extend past N|L boundary
      N.clipsContent = false;
      main.clipsContent = false;
      frame.appendChild(sidebarInst);
      sidebarInst.x = absX;
      sidebarInst.y = absY;
      sidebarInst.name = 'Sidebar';
    }
  }

  // ── 7. SwipeIndicator (full frame width, fills=[]) ───────
  const siSet = await getSet(SPEC.swipeIndicator.setKey);
  const siVariant = findVariant(siSet, SPEC.swipeIndicator.variant);
  const si = siVariant.createInstance();
  si.name = '杆子';
  frame.appendChild(si);
  try { si.layoutSizingHorizontal = 'FIXED'; } catch {}
  try { si.layoutSizingVertical = 'FIXED'; } catch {}
  si.resize(SPEC.frame.w, si.height);
  si.x = 0;
  si.y = SPEC.swipeIndicator.y === 'bottom' ? SPEC.frame.h - si.height : SPEC.swipeIndicator.y;
  si.fills = [];

  // ── 8. overlays (out-of-flow, top z) ─────────────────────
  // out-of-flow overlays (NoticeBar / Scrollbar / TextFormatPanel etc.) appear only on
  // user trigger (notification / scroll / text selection). spec emits them for completeness
  // but they carry no x/y/w/h, so always rendering them dumps each instance at frame (0,0)
  // and produces a visible artifact stack at the top-left corner. Skip rendering by default;
  // an opt-in o.render===true flag re-enables placement once spec carries position data.
  for (const o of SPEC.overlays) {
    if (!o || o.render !== true) continue;
    try {
      const set = await getSet(o.setKey);
      const variant = findVariant(set, o.variant);
      const inst = variant.createInstance();
      inst.name = o.family;
      frame.appendChild(inst);
      if (typeof o.x === 'number') inst.x = o.x;
      if (typeof o.y === 'number') inst.y = o.y;
      if (typeof o.w === 'number' && typeof o.h === 'number') {
        try { inst.layoutSizingHorizontal = 'FIXED'; } catch {}
        try { inst.layoutSizingVertical = 'FIXED'; } catch {}
        inst.resize(o.w, o.h);
      }
    } catch (e) { console.warn('overlay import failed', o.family, e); }
  }

  // ── 8b. floatingContainer (Stage 3A.x — gap-audit-overlay-container-spec.md) ───
  if (SPEC.floatingContainer) {
    const fc = SPEC.floatingContainer;
    // FW instance
    const fwSet = await getSet(fc.setKey);
    const fwV = findVariant(fwSet, fc.variant);
    if (!fwV) throw new Error('floatingContainer: variant not found ' + fc.variant);
    const fwInst = fwV.createInstance();
    fwInst.name = 'floatingContainer';
    frame.appendChild(fwInst);
    try { fwInst.layoutSizingHorizontal = 'FIXED'; } catch (e) {}
    try { fwInst.layoutSizingVertical   = 'FIXED'; } catch (e) {}
    try { fwInst.primaryAxisSizingMode  = 'FIXED'; } catch (e) {}
    try { fwInst.counterAxisSizingMode  = 'FIXED'; } catch (e) {}
    fwInst.resize(fc.w, fc.h);
    fwInst.x = fc.x; fwInst.y = fc.y;

    // contentSlot wrapper
    const cs = fc.contentSlot;
    const slot = figma.createFrame();
    slot.name = '内容裁剪区';
    slot.clipsContent = cs.clipsContent;
    frame.appendChild(slot);
    slot.resize(cs.w, cs.h);
    slot.x = fc.x + cs.x;
    slot.y = fc.y + cs.y;
    slot.topLeftRadius = 0;
    slot.topRightRadius = 0;
    slot.bottomLeftRadius = cs.bottomLeftRadius;
    slot.bottomRightRadius = cs.bottomRightRadius;
    const slotFillVar = await getVar(cs.fillToken);
    bindFill(slot, slotFillVar, TOKENS[cs.fillToken].fallback);

    // innerNode: createInstance + place at (paddingLR, paddingTop)
    const innerSet = await getSet(cs.innerNode.setKey);
    const innerV = findVariant(innerSet, cs.innerNode.variant);
    if (!innerV) throw new Error('floatingContainer.innerNode: variant not found ' + cs.innerNode.variant);
    const innerInst = innerV.createInstance();
    slot.appendChild(innerInst);
    try { innerInst.layoutSizingHorizontal = 'FIXED'; } catch (e) {}
    try { innerInst.layoutSizingVertical   = 'FIXED'; } catch (e) {}
    innerInst.resize(cs.w - 2 * cs.paddingLR, innerInst.height);
    innerInst.x = cs.paddingLR;
    innerInst.y = cs.paddingTop;
  }

  // ── 9. final z-order per SPEC.zOrder ─────────────────────
  // Figma appendChild moves to top; iterate zOrder bottom→top.
  const byName = (n) => frame.findChildren((c) => c.name === n);
  for (const layerName of SPEC.zOrder) {
    for (const node of byName(layerName)) frame.appendChild(node);
  }
  // 杆子 always topmost
  for (const node of byName('杆子')) frame.appendChild(node);

figma.viewport.scrollAndZoomIntoView([frame]);
return { specId: SPEC.id, frameId: frame.id, frameName: frame.name };
`;
}

// ── CLI ───────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: tsx render-spec.ts <specId> [--out file.js]');
    console.error('       tsx render-spec.ts --all [--out-dir dir]');
    process.exit(1);
  }

  if (args[0] === '--all') {
    const outDirIdx = args.indexOf('--out-dir');
    const outDir = outDirIdx >= 0 ? args[outDirIdx + 1] : null;
    for (const id of listSpecIds()) {
      const js = generateFigmaJs(loadSpec(id));
      if (outDir) {
        writeFileSync(join(outDir, `${id}.js`), js);
        console.error('wrote', id);
      } else {
        process.stdout.write(`// ===== ${id} =====\n${js}\n`);
      }
    }
    return;
  }

  const id = args[0];
  const outIdx = args.indexOf('--out');
  const out = outIdx >= 0 ? args[outIdx + 1] : null;
  const js = generateFigmaJs(loadSpec(id));
  if (out) writeFileSync(out, js);
  else process.stdout.write(js);
}

main();
