#!/usr/bin/env tsx
/**
 * csv-to-spec.ts (Stage 3A)
 *
 * mapping-output/*.csv + components.csv + app-variant-map-{app}.md §0.4
 * → per-frame spec JSON (spec-output/spec/{App}_{Scene}_{State}_{Device}.json)
 *
 * Migrates Phase 5 (adaptation) decisions to data lookup. layoutType /
 * variantId / setKey / x,y,w,h / mask / zOrder previously decided per
 * frame by AI are derived automatically here.
 *
 * POC scope: 笔记 NLC 默认 Pad竖 1 frame end-to-end.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const MAPPING_OUT = path.join(ROOT, 'mapping-output');
const SPEC_OUT = path.join(ROOT, 'spec-output', 'spec');
const REFERENCES = path.resolve(ROOT, '..', 'references');

// ─────────────────────────────────────────────────────────────────────────────
// Static reference data (device-dimensions.md, common-rules §0.5.1)
// ─────────────────────────────────────────────────────────────────────────────

interface DeviceDim {
  frameW: number;
  frameH: number;
  // cornerRadius: number scalar = symmetric corners; object form = asymmetric (Fold 外屏 only).
  // render-spec.ts applies topLeft/topRight/bottomLeft/bottomRight when object form is detected.
  cornerRadius: number | { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number };
  statusBarH: number;
}

const DEVICE_DIMENSIONS: Record<string, DeviceDim> = {
  '手机竖':   { frameW: 392, frameH: 851, cornerRadius: 34, statusBarH: 46 },
  '手机横':   { frameW: 851, frameH: 392, cornerRadius: 34, statusBarH: 46 },
  // Fold 外屏 (Q18 折叠态): canvas 435×637 (vertical) / 637×435 (horizontal).
  //   asymmetric corner radius per device-dimensions.md:
  //   - 竖: 右 56 (TR + BR), 左 10 (TL + BL)
  //   - 横: hinge 위치 추정 — 上 56 + 下 10 (검증 필요. 현재는 vertical 거울 적용)
  'Fold外竖': { frameW: 435, frameH: 637, cornerRadius: { topLeft: 10, topRight: 56, bottomLeft: 10, bottomRight: 56 }, statusBarH: 46 },
  'Fold外横': { frameW: 637, frameH: 435, cornerRadius: { topLeft: 56, topRight: 56, bottomLeft: 10, bottomRight: 10 }, statusBarH: 46 },
  'Fold内竖': { frameW: 628, frameH: 888, cornerRadius: 50, statusBarH: 46 },  // device-dim §Fold 内屏 竖屏 (was 851, stale)
  'Fold内横': { frameW: 888, frameH: 628, cornerRadius: 50, statusBarH: 46 },
  'Pad竖':    { frameW: 949, frameH: 1422, cornerRadius: 34, statusBarH: 34 },
  'Pad横':    { frameW: 1422, frameH: 949, cornerRadius: 34, statusBarH: 34 },
};

// Lane widths per (device + screenMode). Sourced from device-dimensions.md.
// POC: only Pad竖 NLC 覆盖. Will expand in Phase 3.
interface LaneSpec {
  type: 'NLC覆盖' | 'NLC并列' | 'NLC收起' | 'NL' | 'NL收起' | 'NC' | 'NC收起' | 'LC' | 'C';
  N?: number;  // covered → laid out at frame level z-promoted
  L?: number;
  C?: number;
  NCovering?: boolean;
}

// single-screen devices: mapping CSV uses empty screenMode + lane='全栏'.
// All scenes resolve to layoutType='C' (single). §0.1a: 手机/Fold外 = C (single canvas).
const SINGLE_SCREEN_DEVICES = new Set(['手机竖', '手机横', 'Fold外竖', 'Fold外横']);

function getLayoutSpec(device: string, screenMode: string, collapsed: boolean): LaneSpec {
  // single-screen devices: every scene → C single framework
  if (SINGLE_SCREEN_DEVICES.has(device)) {
    const dim = DEVICE_DIMENSIONS[device];
    return { type: 'C', C: dim.frameW };
  }
  // 笔记 §0.1a + §0.2 lane width tables + N收起 rule
  if (device === 'Pad竖' && screenMode === 'NLC') {
    if (collapsed) return { type: 'NLC收起', L: 428, C: 521 }; // §0.2 line 185: N gone, L+C retained
    return { type: 'NLC覆盖', N: 272, L: 428, C: 521, NCovering: true };
  }
  if (device === 'Pad横' && screenMode === 'NLC') {
    if (collapsed) return { type: 'NLC收起', L: 428, C: 994 }; // §0.2 line 183: N 88 collapsed-occupant absorbed (L unchanged, C+88)
    return { type: 'NLC并列', N: 272, L: 428, C: 722 };
  }
  if (device === 'Pad竖' && screenMode === 'NL') {
    if (collapsed) return { type: 'NL收起', L: 949 }; // §0.2 line 174: L=frameW (N gone, 笔记 special)
    return { type: 'NL', N: 272, L: 677 };
  }
  if (device === 'Pad横' && screenMode === 'NL') {
    if (collapsed) return { type: 'NL收起', L: 1422 };
    return { type: 'NL', N: 272, L: 1150 };
  }
  // Fold内 LC framework (笔记 LC default device, §0.2 line 180-181)
  if (device === 'Fold内竖' && screenMode === 'LC') return { type: 'LC', L: 282, C: 346 };
  if (device === 'Fold内横' && screenMode === 'LC') return { type: 'LC', L: 353, C: 535 };
  // Fold内 C single-screen (NL→C fallback §0.1 #9 + sub-scene 思维导图/Notes_Outline)
  if (device.startsWith('Fold内') && screenMode === 'C') {
    const dim = DEVICE_DIMENSIONS[device];
    return { type: 'C', C: dim.frameW };
  }
  // Pad NC framework (N+C, no L). When collapsed: N gone + C=frameW (§0.1-AI line 86).
  if (device === 'Pad竖' && screenMode === 'NC') {
    if (collapsed) return { type: 'NC收起', C: 949 };
    return { type: 'NC', N: 272, C: 677 };
  }
  if (device === 'Pad横' && screenMode === 'NC') {
    if (collapsed) return { type: 'NC收起', C: 1422 };
    return { type: 'NC', N: 272, C: 1150 };
  }
  // Fold内 NC framework (device-dimensions.md line 74, 97)
  if (device === 'Fold内竖' && screenMode === 'NC') return { type: 'NC', N: 282, C: 346 };
  if (device === 'Fold内横' && screenMode === 'NC') return { type: 'NC', N: 353, C: 535 };
  // Pad LC framework (秘密笔记 paradigm, device-dimensions.md line 143, 184)
  if (device === 'Pad竖' && screenMode === 'LC') return { type: 'LC', L: 428, C: 521 };
  if (device === 'Pad横' && screenMode === 'LC') return { type: 'LC', L: 428, C: 994 };
  // Pad C framework (single column, frameW)
  if (device === 'Pad竖' && screenMode === 'C') {
    return { type: 'C', C: DEVICE_DIMENSIONS[device].frameW };
  }
  if (device === 'Pad横' && screenMode === 'C') {
    return { type: 'C', C: DEVICE_DIMENSIONS[device].frameW };
  }
  throw new Error(`getLayoutSpec: unsupported (${device}, ${screenMode}, collapsed=${collapsed})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 断点 padding 表 (device-dimensions.md, 2026-06-01 修订)
// 각 (device, screenMode, lane) → spec padding (dp).
// 적용 공식: outer = max(0, spec - internal). instance.x = outer, w = laneW - 2*outer.
// ─────────────────────────────────────────────────────────────────────────────

interface LanePaddingSpec {
  N?: number; L?: number; C?: number;
}

function getLanePaddingSpec(device: string, screenMode: string, collapsed: boolean): LanePaddingSpec {
  // 手机 / Fold外 = 12dp 통칙
  if (device === '手机竖' || device === '手机横') return { C: 12 };
  if (device === 'Fold外竖' || device === 'Fold外横') return { C: 12 };

  // Fold内 (Q18 特例: 容器 ≤ 640dp = 12dp 통일, common-rules-instance.md §3.4a + device-dim §)
  if (device === 'Fold内竖' && screenMode === 'LC') return { L: 12, C: 12 };
  if (device === 'Fold内横' && screenMode === 'LC') return { L: 12, C: 12 };
  if (device === 'Fold内竖' && screenMode === 'NC') return { N: 12, C: 12 };
  if (device === 'Fold内横' && screenMode === 'NC') return { N: 12, C: 12 };
  if (device.startsWith('Fold内') && screenMode === 'C') {
    // C 通栏: device-dim Q18 특례 — 横屏 800<w≤1100 = 56, 그 외 12
    const dim = DEVICE_DIMENSIONS[device];
    if (device === 'Fold内横' && dim.frameW > 800 && dim.frameW <= 1100) return { C: 56 };
    return { C: 12 };
  }

  // Pad横
  if (device === 'Pad横' && screenMode === 'NLC') {
    if (collapsed) return { N: 12, L: 20, C: 56 }; // L=428 → 20, C=994>800 → 56
    return { N: 12, L: 20, C: 28 }; // L=428 → 20, C=722>640<=800 → 28
  }
  if (device === 'Pad横' && screenMode === 'NL') {
    return { N: 12, L: 56 }; // L 1150/1334 > 1100 → 988 居中 (외측 fill)
  }
  if (device === 'Pad横' && screenMode === 'NC') {
    return { N: 12, C: 56 }; // C 1150/1334 > 1100 → 988 居中
  }
  if (device === 'Pad横' && screenMode === 'LC') return { L: 20, C: 56 };
  if (device === 'Pad横' && screenMode === 'C') return { C: 56 };

  // Pad竖 (断点표 권위 — 본 표 우선)
  if (device === 'Pad竖' && screenMode === 'NLC') {
    if (collapsed) return { N: 12, L: 20, C: 12 }; // C=474<=640 → 12
    return { N: 12, L: 20, C: 12 }; // 覆盖: L=428→20, C=521→12. 并列: L=304→12, C=373→12
  }
  if (device === 'Pad竖' && screenMode === 'NL') {
    if (collapsed) return { N: 12, L: 56 }; // L=861>800<=1100 → 56
    return { N: 12, L: 28 }; // L=677>640<=800 → 28
  }
  if (device === 'Pad竖' && screenMode === 'NC') {
    if (collapsed) return { N: 12, C: 56 };
    return { N: 12, C: 28 };
  }
  if (device === 'Pad竖' && screenMode === 'LC') return { L: 20, C: 20 }; // L=428→20, C=521→12. 표는 20/20 — 표 권위
  if (device === 'Pad竖' && screenMode === 'C') return { C: 56 };

  return {};
}

// component family → internal padding (dp) (자带 internal padding, common-rules §3.4a.2)
// instance.children[0].x measurement reference. Detail_Notes 특례 = 20.
// NavigationBar_Notes_01 (业务组件库): internal=0 — 외부 padding 전부 outer 부담.
function getInternalPadding(family: string, variant: string): number {
  // Detail_Notes 특례: 封面图 距 Detail 좌측 20dp (common-rules-instance.md §3.4a.2)
  if (family === 'DetailNotes' || family === 'Detail_Notes') return 20;
  // NavigationBar_Notes_01: 业务组件库 측, internal=0
  if (/^NavigationBar_ComponentSet_Notes/.test(variant)) return 0;
  // ToolBar / BottomBar_Showcase: 외각 풍만 (capsule master HUG 처리)
  if (/^BottomBar_Showcase|^ToolBar_/.test(variant)) return 0;
  // A 류 자연 internal: NavigationBar / SearchBar / SelectableChip / List / TextInput / Sidebar
  return 12;
}

// element → family alias (csv-to-spec uiElement → 控件清单 family)
function elementToFamily(element: string): string {
  if (element === 'List') return 'List';
  if (element === 'Detail') return 'DetailNotes';
  return element;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notes app §0.4 setKey registry (parsed from app-variant-map-笔记.md §0.4)
// POC: hardcode subset. Phase 4 will parse .md table.
// ─────────────────────────────────────────────────────────────────────────────

interface SetKeyEntry {
  setName: string;
  setKey: string;
  library: 'OS4 UI Kit' | '业务组件库';
}

// NOTES_SET_KEYS loaded from data/setkeys.json (data/code separation).
//   Refresh via `npm run probe-setkeys` — agent calls Figma MCP and updates JSON.
const SETKEYS_PATH = path.resolve(__dirname, '..', 'data', 'setkeys.json');
const SETKEYS_RAW = JSON.parse(fs.readFileSync(SETKEYS_PATH, 'utf8'));
const NOTES_SET_KEYS: Record<string, SetKeyEntry> = Object.fromEntries(
  Object.entries(SETKEYS_RAW.families as Record<string, { setName: string; setKey: string; library: string }>)
    .map(([k, v]) => [k, { setName: v.setName, setKey: v.setKey, library: v.library as 'OS4 UI Kit' | '业务组件库' }]),
);

// CSV authoring markers that are NOT Figma components — emit silently as no-setKey.
//   竖屏背景 = portrait wallpaper anchor (background plate, not a ComponentSet).
//   (framework_reuse) = extract-mapping emits this when a cell reads "<framework>栏" alone
//     (designer abbreviation for "use the same variant as the named framework's row").
//   (placeholder) = extract-mapping emits this for Phase 4.5 search markers (TBD / 查询 etc.).
//   (prose-only) = extract-mapping emits this for cells that hold designer notes without variantId
//     (e.g. "标题栏 新建图标" = "place a new icon in the title bar slot").
const NON_COMPONENT_MARKERS = new Set([
  '竖屏背景', '横屏背景', '_00',
  '(framework_reuse)', '(placeholder)', '(prose-only)',
]);

// Designer aliases — mapping CSV uses semantic names that differ from actual library
// ComponentSet variant names. When emitting spec, rewrite variant + lookup with real name.
// Audit source: Improvement_doc/audit-stale-setkeys-2026-05-28.md Category A.
//   key = mapping CSV prefix (alias),  value = actual library prefix
const VARIANT_ALIAS_PREFIX: Array<[string, string]> = [
  ['AIWindow_Options_',  'AIWindow_Notes_'],   // set 02750d51 actual variants are AIWindow_Notes_NN
  ['NewTaskWindow_',     'AlertDialog_NewTask_'], // set 0f741e08 actual variants are AlertDialog_NewTask_NN
];

function resolveVariantAlias(variantId: string): string {
  for (const [from, to] of VARIANT_ALIAS_PREFIX) {
    if (variantId.startsWith(from)) return to + variantId.slice(from.length);
  }
  return variantId;
}

// Designer variantId → library property tuple (for property-driven ComponentSets).
// Source: data/variant-property-map.json. Audit: Improvement_doc/audit-stale-setkeys-2026-05-28.md Category B.
const PROPERTY_MAP_PATH = path.resolve(__dirname, '..', 'data', 'variant-property-map.json');
const PROPERTY_MAP_RAW = fs.existsSync(PROPERTY_MAP_PATH)
  ? JSON.parse(fs.readFileSync(PROPERTY_MAP_PATH, 'utf8'))
  : { mappings: {}, blockers: {} };
const VARIANT_PROPERTY_MAP: Record<string, string> = PROPERTY_MAP_RAW.mappings ?? {};
const VARIANT_PROPERTY_BLOCKERS: Record<string, string> = PROPERTY_MAP_RAW.blockers ?? {};

function resolveVariantProperty(variantId: string): string {
  return VARIANT_PROPERTY_MAP[variantId] ?? variantId;
}

// Combined: alias prefix rewrite + property tuple mapping. Use this at all spec emit points.
function resolveVariant(variantId: string): string {
  return resolveVariantProperty(resolveVariantAlias(variantId));
}

// variantId → set key registry name
function resolveSetKey(variantId: string): SetKeyEntry | null {
  if (NON_COMPONENT_MARKERS.has(variantId)) {
    return { setName: '(non-component marker)', setKey: '', library: 'OS4 UI Kit' };
  }
  if (variantId.startsWith('StatusBar_')) return NOTES_SET_KEYS.StatusBar;
  if (variantId.startsWith('SwipeIndicator_')) return NOTES_SET_KEYS.SwipeIndicator;
  if (variantId.startsWith('NavigationBar_ComponentSet_Notes')) return NOTES_SET_KEYS.NavigationBar_Notes;
  if (variantId.startsWith('NavigationBar_ComponentSet_')) return NOTES_SET_KEYS.NavigationBar;
  // Republish 2026-05-27 후 TopBar 가 NavigationBar set 에서 분리됨. 별도 family 사용.
  // 이전 코멘트 (TopBar_X = NavigationBar set 내 顶部导航 variant) 은 outdated.
  if (variantId.startsWith('TopBar_')) return NOTES_SET_KEYS.TopBar;
  if (variantId.startsWith('SearchBar_ComponentSet')) return NOTES_SET_KEYS.SearchBar;
  if (variantId.startsWith('SelectableChip_ComponentSet_Notes')) return NOTES_SET_KEYS.SelectableChip_Notes;
  // SelectableChip_ComponentSet_NN (Notes-less base form) — separate library set.
  // Family 'SelectableChip' must be probed and registered in setkeys.json before resolution.
  // Returns null until then so validate-csv reports family-missing rather than silent wrong setKey.
  if (variantId.startsWith('List_Notes_')) return NOTES_SET_KEYS.List_Notes;
  if (variantId.startsWith('Detail_Notes_') || variantId.startsWith('DetailNotes_')) return NOTES_SET_KEYS.Detail_Notes;
  if (variantId.startsWith('BottomBar_Showcase_Notes')) return NOTES_SET_KEYS.BottomBar_Showcase_Notes;
  // 笔记 specific BottomBar variants — 业务组件库 separate sets (TODO setKey probe)
  if (variantId.startsWith('BottomBar_NoteEditPanel')) return NOTES_SET_KEYS.BottomBar_NoteEditPanel;
  if (variantId.startsWith('BottomBar_Notes_Outline')) return NOTES_SET_KEYS.BottomBar_Notes_Outline;
  // generic BottomBar_Showcase / BottomBar / Fab — OS4 republish 2026-05-27 후 별도 set 으로 분리됨.
  // 이전 단일 set (414cabc8...) 이 Sidebar 전용으로 축소되어 BottomBar/Fab variants 더 이상 없음.
  // 새 set: f971e992... (BottomBar_Showcase_00/01/02, BottomBar_Showcase_Fab_01/02, Fab_00/01/02 모두 포함).
  if (variantId.startsWith('BottomBar_Showcase_') || variantId.startsWith('BottomBar_')) return NOTES_SET_KEYS.BottomBar_Generic;
  if (variantId.startsWith('Fab_') || variantId.startsWith('Fab-')) return NOTES_SET_KEYS.BottomBar_Generic;
  if (variantId.startsWith('TextInput_ComponentSet_Notes')) return NOTES_SET_KEYS.TextInput_Notes;
  // 笔记 ManageFoldWindow attached form (Fold device) + Pad 浮窗 form. app-variant-map §0.1 #10/#11.
  // MUST precede Sidebar_Component_ branch (Sidebar_Notes_ is more specific).
  if (variantId.startsWith('Sidebar_Notes_')) return NOTES_SET_KEYS.Sidebar_Notes;
  if (variantId.startsWith('Notes_FloatingWindow_')) return NOTES_SET_KEYS.Notes_FloatingWindow;
  // Sidebar 전용 (414cabc8...): Sidebar_Component_PAD_LC_* / PAD_NLC_* (with Fab=有/无 inner property).
  if (variantId.startsWith('Sidebar_Component_PAD_NLC')) return NOTES_SET_KEYS.BottomBar_Sidebar;
  // Sidebar_Component_NC / Sidebar_Component_PAD_LC_Fab — same library set, different variant-property values.
  if (variantId.startsWith('Sidebar_Component_')) return NOTES_SET_KEYS.BottomBar_Sidebar;
  if (variantId.startsWith('NoticeBar_')) return NOTES_SET_KEYS.NoticeBar;
  if (variantId.startsWith('Scrollbar_')) return NOTES_SET_KEYS.Scrollbar;
  if (variantId.startsWith('TextFormatPanel_')) return NOTES_SET_KEYS.TextFormatPanel_Notes;
  if (variantId.startsWith('Menu_')) return NOTES_SET_KEYS.Menu;
  if (variantId.startsWith('AlertDialog_')) return NOTES_SET_KEYS.AlertDialog;
  if (variantId.startsWith('Actionsheet_') || variantId.startsWith('ActionSheet_')) return NOTES_SET_KEYS.ActionSheet;
  if (variantId.startsWith('WheelPicker_')) return NOTES_SET_KEYS.WheelPicker;
  if (variantId.startsWith('FloatingWindow_')) return NOTES_SET_KEYS.FloatingWindow;
  if (variantId.startsWith('SegmentedControls_')) return NOTES_SET_KEYS.SegmentedControls;
  if (variantId.startsWith('ToolBar_ComponentSet')) return NOTES_SET_KEYS.ToolBar;
  // Tasks (待办)
  if (variantId.startsWith('List_Task_')) return NOTES_SET_KEYS.List_Task;
  if (variantId.startsWith('DetailTask_')) return NOTES_SET_KEYS.DetailTask;
  if (variantId.startsWith('NewTaskWindow_')) return NOTES_SET_KEYS.NewTaskWindow;
  // #2 sub-state split: full-screen sub-scene anchors
  if (variantId.startsWith('RecordNotes_')) return NOTES_SET_KEYS.RecordNotes;
  if (variantId.startsWith('AIWindow_Options_')) return NOTES_SET_KEYS.AIWindow_Notes;
  if (variantId.startsWith('DrawerWindow_')) return NOTES_SET_KEYS.DrawerWindow;
  if (variantId.startsWith('SearchReceiving_')) return NOTES_SET_KEYS.SearchReceiving;
  if (variantId.startsWith('Sidebar_Component_Fold_LC')) return NOTES_SET_KEYS.Sidebar_Component_Fold_LC;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Token registry — loaded from data/tokens.json (single authority since 2026-05-31).
// app-variant-map-笔记.md §0.3 의 raw data 가 본 file 에서 권위 source 로 이주됨.
// ─────────────────────────────────────────────────────────────────────────────

interface TokenEntry {
  name: string;
  key: string;
  fallback: { r: number; g: number; b: number };
  opacity?: number;
}

const TOKENS_PATH = path.resolve(__dirname, '..', 'data', 'tokens.json');
const TOKENS_RAW = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));

// short alias (surface_low / surface / outline / mask) → TokenEntry. token name 全文에서 short key 추출.
function tokensFromJson(raw: any): Record<string, TokenEntry> {
  const out: Record<string, TokenEntry> = {};
  for (const [fullName, def] of Object.entries(raw.tokens as Record<string, any>)) {
    // fullName 예: "背景色/surface_low" → short alias "surface_low"
    const slashIdx = fullName.indexOf('/');
    const alias = slashIdx >= 0 ? fullName.slice(slashIdx + 1) : fullName;
    out[alias] = {
      name: fullName,
      key: def.libraryKey,
      fallback: def.fallbackRGB,
      ...(def.defaultOpacity !== undefined ? { opacity: def.defaultOpacity } : {}),
    };
  }
  return out;
}

const NOTES_TOKENS: Record<string, TokenEntry> = tokensFromJson(TOKENS_RAW);

// ─────────────────────────────────────────────────────────────────────────────
// Component family → Category lookup (common-rules §3.4a.1)
// ─────────────────────────────────────────────────────────────────────────────

const APP_PREFIX_RE = /^(Notes|Calendar|Settings|Weather|Recorder)_/;

function resolveLibrary(componentFamily: string): string {
  return APP_PREFIX_RE.test(componentFamily) ? '业务组件库' : 'OS4 UI Kit';
}

const CATEGORY_OUT_OF_FLOW = new Set([
  'AlertDialog', 'ActionSheet', 'Menu', 'DrawerWindow', 'FloatingWindow',
  'WheelPicker', 'NoticeBar', 'SearchReceiving',
  'Notes_AIWindow_Notes', 'Notes_TaskWindow', 'Notes_TextFormatPanel',
  'Notes_Menu', 'Notes_List_NoteSetting',
  'Divider', 'Scrollbar', 'SwipeIndicator', 'SegmentedControls',
]);

function resolveCategory(componentFamily: string): 'flow-A' | 'flow-B' | 'out-of-flow' {
  if (CATEGORY_OUT_OF_FLOW.has(componentFamily)) return 'out-of-flow';
  return 'flow-A'; // default per common-rules §3.4a.1 (未列出标准组件默认 A 类)
}

// ─────────────────────────────────────────────────────────────────────────────
// pageClass derivation (mapping CSV's lane column is ground truth)
//
// 笔记/待办 paradigm: an element's page is determined by which lane it
// occupies on multi-pane devices (Pad/Fold内).
//   L 栏 only → list (List, Search, Chip, ToolBar)
//   C 栏 only → detail (Detail, Input, TextFormat)
//   N 栏 only → n-side (Sidebar)
//   2+ lanes (N/L/C) → both (frame-shared: NavBar, Scrollbar, ...)
//
// For single-screen (手机/Fold外) frames, state selects the active page subset:
//   state=默认 → list + both
//   state=详情 → detail + both
//   state=编辑模式 → list + both (edit list)
// ─────────────────────────────────────────────────────────────────────────────

type PageClass = 'list' | 'detail' | 'n-side' | 'both' | 'unknown';

function derivePageClass(mapping: MappingRow[], app: string, subScene: string): Map<string, PageClass> {
  // multi-pane devices only (single-screen's 全栏 carries no lane info)
  const MULTI_PANE_DEVICES = new Set(['Pad竖', 'Pad横', 'Fold内竖', 'Fold内横']);
  const elementLanes = new Map<string, Set<string>>();
  for (const r of mapping) {
    if (r.app !== app) continue;
    if ((r.subScene ?? '') !== subScene) continue;  // isolate paradigm per sub-scene
    if (!MULTI_PANE_DEVICES.has(r.device)) continue;
    if (r.state !== '默认') continue;
    if (r.uiElement === 'Overay') continue;
    const lane = r.lane.replace('栏', '').trim();
    if (lane !== 'N' && lane !== 'L' && lane !== 'C') continue;
    if (!elementLanes.has(r.uiElement)) elementLanes.set(r.uiElement, new Set());
    elementLanes.get(r.uiElement)!.add(lane);
  }
  const result = new Map<string, PageClass>();
  for (const [elem, lanes] of elementLanes) {
    if (lanes.size >= 2) result.set(elem, 'both');
    else if (lanes.has('L')) result.set(elem, 'list');
    else if (lanes.has('C')) result.set(elem, 'detail');
    else if (lanes.has('N')) result.set(elem, 'n-side');
  }
  return result;
}

function activePageClassesForState(scene: string, state: string): Set<PageClass> {
  // 笔记 paradigm:
  //   scene='C' / scene='NC' = detail-side framework (detail page on single-screen)
  //   state='详情' = drilldown to detail page
  //   state='Notes_Outline'/'思维导图'/'思维导图编辑' = detail-side sub-scene
  //   otherwise (NLC/NL/LC × 默认/编辑模式/NoteEditPanel ...) = list page
  const detailScenes = scene === 'C' || scene === 'NC';
  const detailStates = state === '详情' || state === 'Notes_Outline' || state === '思维导图' || state === '思维导图编辑';
  if (detailScenes || detailStates) return new Set<PageClass>(['detail', 'both']);
  return new Set<PageClass>(['list', 'both']);
}

// ─────────────────────────────────────────────────────────────────────────────
// Suffix utility + scenarioFlags + variant disambiguation
// (rules: app-variant-map-笔记.md §0.1b / §0.2 / N收起规则;  common-rules §3.4a.5)
// ─────────────────────────────────────────────────────────────────────────────

interface ScenarioFlags {
  LEditMode: boolean;
  NEditMode: boolean;
  CEditMode: boolean;
  NCovering: boolean;
  NCollapsed: boolean;  // N 收起 (Sidebar 不展开). default 默认 = false (展开).
}

function variantSuffix(variantId: string): string {
  const m = variantId.match(/_(\d{2,})$/);
  return m ? `_${m[1]}` : '';
}

const SUFFIX_00_SKIP_FAMILIES = new Set([
  // common-rules §3.4a.5: `_00` = 不渲染 / 空容器 → skip (no instance, no y-slot reservation)
  'NavigationBar', 'BottomBar_Showcase_Notes', 'Sidebar_Component_PAD_NLC',
  'TextInput_ComponentSet_Notes',
  // §0.5 line 351 笔记/待办 Pad rule: BottomBar_Showcase_00 (generic) = Pad 不渲染
  'BottomBar_Showcase',
  // 待办 paradigm: Fab_00 = 不渲染
  'Fab',
  // 待办 paradigm: DetailTask_00 = 不展示
  'DetailTask',
  // §3.4a.5: SelectableChip_ComponentSet_Notes_00 = 无标签栏 → 不创建 instance.
  // Without this, _00 reserved 52dp y-slot between SearchBar and List, leaving visible empty gap.
  'SelectableChip_ComponentSet_Notes',
]);

function suffixIsSkip(variantId: string): boolean {
  if (variantSuffix(variantId) !== '_00') return false;
  for (const fam of SUFFIX_00_SKIP_FAMILIES) {
    if (variantId.startsWith(fam)) return true;
  }
  return false;
}

function deriveScenarioFlags(state: string, layoutType: string): ScenarioFlags {
  // §0.1b: state-name signals (frame name contains 已选/选择/编辑模式 → LEditMode)
  const isEdit = /(已选|选择|编辑模式)/.test(state);
  // POC: NEditMode / CEditMode derived later via chosen-variant inspection — currently false
  return {
    LEditMode: isEdit,
    NEditMode: false,
    CEditMode: false,
    NCovering: layoutType === 'NLC覆盖',
    NCollapsed: /收起/.test(state),
  };
}

// Variant disambiguation: when (lane, uiElement) has multiple rows, pick one.
// Rules sourced from: app-variant-map-笔记.md §0.1#8 / §0.2 / N收起规则 + Notes_TextInput.md
function pickVariant(
  candidates: MappingRow[],
  ctx: { device: string; screenMode: string; flags: ScenarioFlags },
): MappingRow | null {
  if (candidates.length === 0) return null;
  // Dedup by variantId
  const seen = new Set<string>();
  const dedup = candidates.filter(r => {
    if (seen.has(r.variantId)) return false;
    seen.add(r.variantId);
    return true;
  });
  // Drop _00-skip variants up front
  const live = dedup.filter(r => !suffixIsSkip(r.variantId));
  if (live.length === 0) return null;

  const elem = dedup[0].uiElement;
  const lane = dedup[0].lane;
  const { device, screenMode, flags } = ctx;

  // Pad NLC shared element/lane skip rules (apply before single-candidate early return)
  const isPadNLC = device.startsWith('Pad') && screenMode === 'NLC';
  const isPadNL = device.startsWith('Pad') && screenMode === 'NL';
  if (isPadNLC) {
    // C栏 Input (TextInput): Pad NLC = `_00` 不渲染 (Notes_TextInput.md, both Pad竖+横)
    if (elem === 'Input' && lane === 'C栏') return null;
  }
  const isPadNC = device.startsWith('Pad') && screenMode === 'NC';
  if (isPadNLC || isPadNL || isPadNC) {
    // N栏 NavigationBar: Sidebar's internal NavigationAtoms acts as 标题栏 → never render
    // (§0.1 #8 + §0.1-AI line 79, shared across Pad NLC/NL/NC)
    if (elem === 'NavigationBar' && lane === 'N栏') return null;
  }
  // Fold内 LC framework (§0.5 + Notes_TextInput.md)
  const isFoldLC = device.startsWith('Fold内') && screenMode === 'LC';
  if (isFoldLC) {
    // C 栏 Input default = `_08` (Q18 内屏 padding 20). Pick `_08` from candidates _02..._08.
    if (elem === 'Input' && lane === 'C栏') {
      const hit = live.find(r => r.variantId.endsWith('_08'));
      if (hit) return hit;
    }
  }
  // single-screen device (手机/Fold外) + Fold内 C single-screen mode: Input/NavBar single column
  if (SINGLE_SCREEN_DEVICES.has(device) || screenMode === 'C') {
    if (elem === 'Input' && lane === '全栏') {
      const hit = live.find(r => r.variantId.endsWith('_01'));
      if (hit) return hit;
    }
    // (Previously: single-screen NavBar heuristic with _05/_02 fallback — removed.
    //  Data-driven disambiguation now uses baseFilter's notes-column rule plus the
    //  remaining picker rules. On no match, the generic fallback emits a warning —
    //  no more silent picks.)
  }

  if (live.length === 1) return live[0];

  // Pad NLC framework: multi-variant disambiguation (shared by Pad竖 覆盖 and Pad横 并列)
  if (isPadNLC) {
    // L栏 NavigationBar: 默认 N展开=_07, N收起=_17; 编辑 N展开=_09, N收起=_18
    // (§0.1 #8 + N收起 rule line 339; mapping CSV is authoritative)
    if (elem === 'NavigationBar' && lane === 'L栏') {
      const target = flags.LEditMode
        ? (flags.NCollapsed ? '_18' : '_09')
        : (flags.NCollapsed ? '_17' : '_07');
      const hit = live.find(r => r.variantId.endsWith(target));
      if (hit) return hit;
    }
    // L栏 List (NLC framework): 编辑 = _04 (shared Pad竖/横, mapping CSV); 默认 = _03 (single-row → auto)
    if (elem === 'List' && lane === 'L栏' && flags.LEditMode) {
      const hit = live.find(r => r.variantId.endsWith('_04'));
      if (hit) return hit;
    }
    // N栏 NavigationBar: 永远 _00 → already removed above by suffixIsSkip; otherwise first candidate.
    // Sidebar: 展开 → _01; N收起 → null (N自体消失, 笔记 special)
    if (elem === 'Sidebar' && lane === 'N栏') {
      if (flags.NCollapsed) return null;
      const hit = live.find(r => r.variantId.endsWith('_01'));
      if (hit) return hit;
    }
  }

  // Pad NL framework: TopBar / List odd-even rules (§0.1 #8 + §0.1 #9)
  if (isPadNL) {
    // L栏 SearchBar slot = TopBar_X (NL framework: NavBar+SearchBar fused). §0.1 #8:
    //   默认 展开=_03 / 默认 收起=_07 / 编辑 展开=_09 / 编辑 收起=_08
    if (elem === 'SearchBar' && lane === 'L栏') {
      const target = flags.LEditMode
        ? (flags.NCollapsed ? '_08' : '_09')
        : (flags.NCollapsed ? '_07' : '_03');
      const hit = live.find(r => r.variantId === `TopBar${target}`);
      if (hit) return hit;
    }
    // L栏 List odd/even device-specific (§0.1 #9):
    //   默认 (odd): Pad竖NL=_13, Pad竖NL收起=_15, Pad横NL=_17, Pad横NL收起=_19
    //   编辑 (even): Pad竖NL=_14, Pad竖NL收起=_16, Pad横NL=_18, Pad横NL收起=_20
    if (elem === 'List' && lane === 'L栏') {
      const map: Record<string, [string, string]> = {
        'Pad竖|展开':   ['_13', '_14'],
        'Pad竖|收起':   ['_15', '_16'],
        'Pad横|展开':   ['_17', '_18'],
        'Pad横|收起':   ['_19', '_20'],
      };
      const k = `${device}|${flags.NCollapsed ? '收起' : '展开'}`;
      const pair = map[k];
      if (pair) {
        const target = flags.LEditMode ? pair[1] : pair[0];
        const hit = live.find(r => r.variantId.endsWith(target));
        if (hit) return hit;
      }
    }
  }

  // 待办 NewTaskWindow: default = `_01` (designer rule unspecified — first candidate convention)
  if (live[0].variantId.startsWith('NewTaskWindow_')) {
    const hit = live.find(r => r.variantId.endsWith('_01'));
    if (hit) return hit;
  }

  // Fallback: first row + warning
  console.warn(`! pickVariant: no rule matched ${elem}/${lane} (${device}/${screenMode}) — candidates: ${live.map(r => r.variantId).join(', ')} → ${live[0].variantId}`);
  return live[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapping CSV loader
// ─────────────────────────────────────────────────────────────────────────────

interface MappingRow {
  app: string; subScene: string; scene: string; state: string;
  uiElement: string; device: string; screenMode: string;
  lane: string; variantId: string; notes: string;
  // framework = sceneCondition (col 1 의 `/ NLC|NL|LC|NC|C` 마커). Fold내 drilldown 분리용.
  framework: string;
}

interface ComponentMeta {
  componentFamily: string; variantId: string; variantName: string;
  libraryName: string;
  internalPadL: string; internalPadR: string; titleLeftPad: string;
  naturalW: string; naturalH: string; note: string;
}

function loadMapping(app: string): MappingRow[] {
  const csvPath = path.join(MAPPING_OUT, `app-${app}-mapping.csv`);
  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true }) as Array<Record<string, string>>;
  // CSV header: app,scene,state,uiElement,device,screenMode,栏,variantId,notes
  return rows.map(r => ({
    app: r.app, subScene: r.subScene ?? '', scene: r.scene, state: r.state,
    uiElement: r.uiElement, device: r.device, screenMode: r.screenMode,
    lane: r['栏'] ?? '', variantId: r.variantId, notes: r.notes ?? '',
    framework: r.framework ?? '',
  }));
}

function loadSystemMapping(): MappingRow[] {
  const csvPath = path.join(MAPPING_OUT, 'SystemUIKIT-mapping.csv');
  const raw = fs.readFileSync(csvPath, 'utf8');
  // SystemUIKIT.csv header: uiElement,device,screenMode,栏,variantId,notes (no app/scene/state)
  const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true }) as Array<Record<string, string>>;
  return rows.map(r => ({
    app: 'SystemUIKIT', subScene: '', scene: '*', state: '*',
    uiElement: r.uiElement, device: r.device, screenMode: r.screenMode,
    lane: r['栏'], variantId: r.variantId, notes: r.notes ?? '',
    framework: '',
  }));
}

function loadComponents(): Map<string, ComponentMeta> {
  const csvPath = path.join(MAPPING_OUT, 'components.csv');
  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true }) as Array<Record<string, string>>;
  const map = new Map<string, ComponentMeta>();
  for (const r of rows) {
    map.set(r.VariantId, {
      componentFamily: r.ComponentFamily, variantId: r.VariantId, variantName: r.VariantName,
      libraryName: r.LibraryName,
      internalPadL: r.InternalPadL, internalPadR: r.InternalPadR, titleLeftPad: r.TitleLeftPad,
      naturalW: r.NaturalW, naturalH: r.NaturalH, note: r.Note,
    });
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Spec builder
// ─────────────────────────────────────────────────────────────────────────────

interface ComponentSpec {
  element: string; lane: string; variant: string;
  setKey: string; library: string; category: string;
  x: number; y: number;
  w: number | string; h: number | string;
  notes?: string;
}

interface OverlaySpec {
  trigger: string;
  family: string;
  lane: string;
  variant: string;
  setKey: string;
  library: string;
  source: 'Overay-row' | 'out-of-flow';
}

// Stage 3A.x: 浮层 container with content slot + modal mask (gap-audit-overlay-container-spec.md).
interface FloatingContainerSpec {
  family: string;        // FloatingWindow / DrawerWindow
  variant: string;       // FloatingWindow_ComponentSet_01 etc
  setKey: string;
  library: string;
  x: number; y: number; w: number; h: number;
  cornerRadius: number;  // FW component natural cornerRadius (e.g. FW_01 = 36)
  headerH: number;       // FW header natural height (e.g. 56)
  modal: boolean;        // true → emit 遮罩-全幅 automatically
  contentSlot: {
    x: number; y: number; w: number; h: number;       // FW-relative coordinates
    paddingTop: number; paddingLR: number;
    fillToken: 'surface' | 'surface_low';
    bottomLeftRadius: number; bottomRightRadius: number;
    clipsContent: boolean;
    innerNode: { type: 'instance'; variant: string; setKey: string; library: string };
  };
}

interface FloatingRow {
  family: string; device: string;
  state: string;     // '*' wildcard or matches spec.state (e.g. '默认', '一级')
  subScene: string;  // '*' wildcard or matches spec.subScene (e.g. '笔记', 'AppSettings')
  setKey: string; library: string;  // FW container set authoritative source (overrides §0.4 if present)
  widthExpr: string; heightExpr: string;
  posXExpr: string; posYExpr: string;
  headerH: number;
  modal: boolean;
  attached: boolean;       // true = attached form (e.g. Sidebar_Notes), no modal mask, side-anchored
  attachedSide: string;    // 'left' | 'right' (only meaningful when attached=true)
  fillVertical: boolean;   // attached form: instance H = frameH - statusBarH (mainH fill)
  contentPaddingTop: number; contentPaddingLR: number;
  bottomCornerMatchFW: boolean;
  innerVariant: string; innerSetKey: string; innerLibrary: string;
}

function loadFloatingSpec(): FloatingRow[] {
  const fp = path.join(ROOT, 'mapping-input', 'floating-spec.csv');
  if (!fs.existsSync(fp)) return [];
  const records: any[] = parse(fs.readFileSync(fp, 'utf8'), {
    columns: true, skip_empty_lines: true, trim: true,
  });
  return records.map((r: any) => ({
    family: r.family, device: r.device,
    state: r.state ?? '*',
    subScene: r.subScene ?? '*',
    setKey: r.setKey ?? '', library: r.library ?? '',
    widthExpr: r.widthExpr, heightExpr: r.heightExpr,
    posXExpr: r.posXExpr, posYExpr: r.posYExpr,
    headerH: Number(r.headerH),
    modal: r.modal === 'true' || r.modal === true,
    attached: r.attached === 'true' || r.attached === true,
    attachedSide: r.attachedSide ?? '',
    fillVertical: r.fillVertical === 'true' || r.fillVertical === true,
    contentPaddingTop: Number(r.contentPaddingTop) || 0,
    contentPaddingLR: Number(r.contentPaddingLR) || 0,
    bottomCornerMatchFW: r.bottomCornerMatchFW === 'true' || r.bottomCornerMatchFW === true,
    innerVariant: r.innerVariant ?? '', innerSetKey: r.innerSetKey ?? '', innerLibrary: r.innerLibrary ?? '',
  }));
}

// Safe expr eval for floating-spec (frameW/frameH/w/h available; pure arithmetic).
function evalFloatingExpr(expr: string, vars: Record<string, number>): number {
  // eslint-disable-next-line no-new-func
  const fn = new Function(...Object.keys(vars), `return (${expr});`);
  const v = fn(...Object.values(vars));
  if (typeof v !== 'number' || !isFinite(v)) {
    throw new Error(`floating-spec expr '${expr}' produced ${v}`);
  }
  return Math.round(v);
}

// FW component natural cornerRadius. POC: hardcoded by family. Migrate to components.csv read later.
// Notes_FloatingWindow master self-radius = 0 (inner panel renders the visible 36dp radius).
// Spec cornerRadius is applied to the floatingContainer wrapper for visual parity with the panel.
const FLOATING_CR: Record<string, number> = {
  FloatingWindow_ComponentSet_01: 36,
  FloatingWindow_ComponentSet_02: 36,
  Notes_FloatingWindow_01: 36,
};

interface FrameSpec {
  id: string;
  source: { app: string; scene: string; state: string; device: string; screenMode: string };
  frame: { w: number; h: number; cornerRadius: number | { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number }; fill: TokenEntry };
  statusBar: { variant: string; setKey: string; library: string; x: number; y: number; w: number; h: number };
  layout: {
    type: string;
    lanes: Record<string, { x: number; y: number; w: number; h: number; fill: string }>;
  };
  scenarioFlags: { LEditMode: boolean; NEditMode: boolean; CEditMode: boolean; NCovering: boolean };
  components: ComponentSpec[];
  overlays: OverlaySpec[];
  floatingContainer?: FloatingContainerSpec;  // Stage 3A.x
  masks: Array<{ name: string; x: number; y: number; w: number; h: number; cornerRadius?: number | { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number }; fill: string; opacity: number }>;
  divider?: { x: number; y: number; w: number; h: number; fill: string };
  swipeIndicator: { variant: string; setKey: string; x: number; y: string | number; w: number; fills: never[] };
  zOrder: string[];
}

function buildSpec(opts: {
  app: string; subScene?: string; scene: string; state: string; device: string; screenMode: string;
  collapsed?: boolean;
  mapping: MappingRow[]; systemMapping: MappingRow[]; components: Map<string, ComponentMeta>;
}): FrameSpec {
  const { app, scene, state, device, screenMode } = opts;
  const subScene = opts.subScene ?? '';
  const collapsed = !!opts.collapsed;
  const dim = DEVICE_DIMENSIONS[device];
  if (!dim) throw new Error(`unknown device ${device}`);
  const layout = getLayoutSpec(device, screenMode, collapsed);
  const mainH = dim.frameH - dim.statusBarH;

  // lane geometry — POC NLC覆盖 only
  // Lane fills follow card-presence rule (§0.3 line 207-216): 套卡/卡片列表/Sidebar 浮起 → surface_low; 列表 通栏/Detail panel → surface.
  // Defaults are placeholders; computeLaneFills() below mutates per actual L/C variants in pickedRows.
  const laneFills: Record<string, string> = { N: 'surface_low', L: 'surface', C: 'surface' };
  const lanes: FrameSpec['layout']['lanes'] = {};
  if (layout.type === 'NLC覆盖') {
    lanes.N = { x: 0, y: dim.statusBarH, w: layout.N!, h: mainH, fill: laneFills.N };
    lanes.L = { x: 0, y: dim.statusBarH, w: layout.L!, h: mainH, fill: laneFills.L };
    lanes.C = { x: layout.L!, y: dim.statusBarH, w: layout.C!, h: mainH, fill: laneFills.C };
  } else if (layout.type === 'NLC并列') {
    lanes.N = { x: 0, y: dim.statusBarH, w: layout.N!, h: mainH, fill: laneFills.N };
    lanes.L = { x: layout.N!, y: dim.statusBarH, w: layout.L!, h: mainH, fill: laneFills.L };
    lanes.C = { x: layout.N! + layout.L!, y: dim.statusBarH, w: layout.C!, h: mainH, fill: laneFills.C };
  } else if (layout.type === 'NL') {
    // NL 展开: N(272) + L(frameW-272). No C. 笔记: L栏 = surface_low (List 卡片).
    lanes.N = { x: 0, y: dim.statusBarH, w: layout.N!, h: mainH, fill: laneFills.N };
    lanes.L = { x: layout.N!, y: dim.statusBarH, w: layout.L!, h: mainH, fill: laneFills.L };
  } else if (layout.type === 'NL收起') {
    // NL 收起 (笔记 special): N gone, L=frameW absorbs full width
    lanes.L = { x: 0, y: dim.statusBarH, w: layout.L!, h: mainH, fill: laneFills.L };
  } else if (layout.type === 'NLC收起') {
    // NLC 收起: N gone. Pad竖 keeps L+C (覆盖 base reverted), Pad横 keeps L unchanged + C absorbs 88
    lanes.L = { x: 0, y: dim.statusBarH, w: layout.L!, h: mainH, fill: laneFills.L };
    lanes.C = { x: layout.L!, y: dim.statusBarH, w: layout.C!, h: mainH, fill: laneFills.C };
  } else if (layout.type === 'LC') {
    // LC framework: no N. L+C side-by-side
    lanes.L = { x: 0, y: dim.statusBarH, w: layout.L!, h: mainH, fill: laneFills.L };
    lanes.C = { x: layout.L!, y: dim.statusBarH, w: layout.C!, h: mainH, fill: laneFills.C };
  } else if (layout.type === 'NC') {
    // NC framework: N+C, no L.
    lanes.N = { x: 0, y: dim.statusBarH, w: layout.N!, h: mainH, fill: laneFills.N };
    lanes.C = { x: layout.N!, y: dim.statusBarH, w: layout.C!, h: mainH, fill: laneFills.C };
  } else if (layout.type === 'NC收起') {
    // NC 收起: N gone + C=frameW full width (§0.1-AI line 86)
    lanes.C = { x: 0, y: dim.statusBarH, w: layout.C!, h: mainH, fill: laneFills.C };
  } else if (layout.type === 'C') {
    // C single framework: 手机/Fold外 single-screen. 全 lane = frameW.
    lanes.C = { x: 0, y: dim.statusBarH, w: layout.C!, h: mainH, fill: 'surface_low' };
  } else {
    throw new Error(`buildSpec: unsupported layout ${layout.type}`);
  }

  // statusBar (system mapping)
  const sb = opts.systemMapping.find(r => r.uiElement === 'StatusBar' && r.device === device);
  if (!sb) throw new Error(`StatusBar mapping missing for ${device}`);
  const sbKey = resolveSetKey(sb.variantId)!;

  // swipeIndicator (system mapping, frame-level)
  const sw = opts.systemMapping.find(r => r.uiElement === 'SwipeIndicator' && r.device === device);
  if (!sw) throw new Error(`SwipeIndicator mapping missing for ${device}`);
  const swKey = resolveSetKey(sw.variantId)!;

  // Derive scenarioFlags (§0.1b). The collapsed argument overrides NCollapsed.
  const scenarioFlags = deriveScenarioFlags(state, layout.type);
  if (collapsed) scenarioFlags.NCollapsed = true;

  // mapping CSV's screenMode column is split as 'NL' vs 'NL收起' → translate when collapsed
  // single-screen devices use empty screenMode in mapping (笔记 手机/Fold外 convention)
  const queryScreenMode = SINGLE_SCREEN_DEVICES.has(device)
    ? ''
    : (collapsed ? `${screenMode}收起` : screenMode);

  // mapping rows for this scene/state — drop sub-scene and 不展示 rows
  const SUB_SCENE_ELEMENTS = new Set(['AppSettings', 'RecordNotes', '搜索页面', 'AIWindow_Notes']);
  // P10 follow-up + #2 sub-state split: when state matches a sub-scene element's
  //   promoted state, that element IS the subject chrome of this frame — include it.
  const isPageHierarchyState = state === '一级' || state === '二级';
  const STATE_TO_SUB_SCENE_ELEMENT: Record<string, string> = {
    '录音': 'RecordNotes',
    'AI对话': 'AIWindow_Notes',
    '搜索激活': '搜索页面',
  };
  const subSceneAnchor = STATE_TO_SUB_SCENE_ELEMENT[state];
  const baseFilter = (r: MappingRow, st: string) =>
    r.app === app && (r.subScene ?? '') === subScene &&
    r.scene === scene && r.state === st &&
    r.device === device && r.screenMode === queryScreenMode &&
    r.uiElement !== 'Overay' &&
    (!SUB_SCENE_ELEMENTS.has(r.uiElement)
      || (isPageHierarchyState && r.uiElement === 'AppSettings')
      || (subSceneAnchor !== undefined && r.uiElement === subSceneAnchor)) &&
    r.variantId !== '不展示' && r.variantId.trim() !== '';
  let rows = opts.mapping.filter(r => baseFilter(r, state));
  // non-default state: missing (lane, uiElement) inherits from 默认 row
  // (mapping CSV convention: 编辑模式 rows enumerate only the elements that changed from default)
  // P10 fix: page-hierarchy ('一级'/'二级') = AppSettings IS a separate page (full-page nav on phone /
  //   floating window on Pad/Fold内 modal that replaces the page) → do NOT inherit.
  // Sub-scene anchor states (录音/AI对话/搜索激活) DO inherit — RecordNotes/AIWindow/搜索 are overlays
  //   on top of the underlying 默认 笔记 page (drawer on phone/Fold外, floating on Fold内/Pad).
  //   The frame must show 默认 chrome (Sidebar/List/Detail) plus the overlay.
  if (state !== '默认' && !isPageHierarchyState) {
    const presentKeys = new Set(rows.map(r => `${r.lane}|${r.uiElement}`));
    const defaultRows = opts.mapping.filter(r => baseFilter(r, '默认'));
    for (const br of defaultRows) {
      if (!presentKeys.has(`${br.lane}|${br.uiElement}`)) rows.push(br);
    }
  }
  // single-screen devices: apply pageClass filter (list page vs detail page split).
  // multi-pane devices don't need this — the lane column already separates them.
  if (SINGLE_SCREEN_DEVICES.has(device)) {
    const pageClassMap = derivePageClass(opts.mapping, app, subScene);
    const active = activePageClassesForState(scene, state);
    rows = rows.filter(r => {
      const pc = pageClassMap.get(r.uiElement);
      if (!pc) return true; // unclassifiable (system etc.) → keep
      return active.has(pc);
    });
  }

  // Group by (lane, uiElement) → variant disambiguation.
  //   For sub-scene anchors (AIWindow_Notes / RecordNotes / 搜索页面 / AppSettings) where one
  //   CSV uiElement spans multiple sub-component rows with different variantId families
  //   (e.g. AIWindow_Notes has NavigationBar / AIWindow_Options / DrawerWindow / TextInput rows),
  //   include variantFamily in the key so each sub-component is its own group. Default rows
  //   keep the legacy `lane|uiElement` key so sub-state notes filtering still works.
  // notes column carries sub-state hints (e.g. "私密笔记") → exclude from default frame.
  // (within a group, if any row has notes='', keep only those.)
  const variantFamily = (vid: string) => {
    const meta = opts.components.get(vid);
    return meta?.componentFamily ?? vid.split('_')[0];
  };
  const groupKey = (r: MappingRow) => {
    if (SUB_SCENE_ELEMENTS.has(r.uiElement)) {
      return `${r.lane}|${r.uiElement}|${variantFamily(r.variantId)}`;
    }
    return `${r.lane}|${r.uiElement}`;
  };
  const groups = new Map<string, MappingRow[]>();
  for (const r of rows) {
    if (!groups.has(groupKey(r))) groups.set(groupKey(r), []);
    groups.get(groupKey(r))!.push(r);
  }
  // sub-state notes filter: when a group has any notes='' row, drop sub-state-tagged rows
  for (const [key, candidates] of groups) {
    const hasDefault = candidates.some(r => !r.notes || r.notes.trim() === '');
    if (hasDefault) {
      const filtered = candidates.filter(r => !r.notes || r.notes.trim() === '');
      groups.set(key, filtered);
    }
  }
  // PM-2026-05-27 framework-priority filter: 같은 (lane, uiElement) key 에 여러 framework 행이
  //   존재할 때 (笔记 standard NLC drilldown vs LC framework 직접 행 등), subScene 의
  //   standard framework 를 우선 선택. 笔记/待办 standard = NLC.
  //   Fold内 device 의 LC layout 시: NLC framework 의 drilldown row 가 정답 (per app-variant-map §0.1a).
  const STANDARD_FRAMEWORK_BY_SUBSCENE: Record<string, string> = {
    '笔记': 'NLC',
    '待办': 'NLC',
  };
  const standardFw = STANDARD_FRAMEWORK_BY_SUBSCENE[subScene];
  if (standardFw) {
    for (const [key, candidates] of groups) {
      if (candidates.length <= 1) continue;
      const standardRows = candidates.filter(r => r.framework === standardFw);
      if (standardRows.length > 0 && standardRows.length < candidates.length) {
        groups.set(key, standardRows);
      }
    }
  }
  const pickedRows: MappingRow[] = [];
  for (const candidates of groups.values()) {
    const chosen = pickVariant(candidates, { device, screenMode, flags: scenarioFlags });
    if (chosen) pickedRows.push(chosen);
  }

  // Compute variant-aware lane fills based on actual content (§0.3 card-presence rule).
  //   L 栏: List_Notes_01/02 (套卡), List_Notes_05+ (卡片列表) → surface_low; List_Notes_03/04 (列表 通栏) → surface.
  //   待办 List_Task_01 (套卡), List_Task_03 (flat) — analogous.
  //   N 栏: Sidebar always surface_low (浮起 menu).
  //   C 栏: DetailNotes / single panel → surface; ToolBar_*/胶囊 only (思维导图编辑 등) → surface_low; default surface.
  {
    const byLane: Record<string, MappingRow[]> = {};
    for (const r of pickedRows) {
      const k = r.lane.replace('栏', '').trim();
      if (!byLane[k]) byLane[k] = [];
      byLane[k].push(r);
    }
    // '全栏' rows (single-screen frames) materialize into the visible single lane (C, or L for NL收起).
    const allRows = byLane['全'] ?? [];

    // Card-presence rule (per user 2026-05-27):
    //   Lane bg = `surface_low` (gray) if lane content has floating white items (cards / bubbles / 胶囊 形 contents).
    //   Lane bg = `surface` (white) if lane content is a single full-bleed white panel (Detail / Record).
    //   Chrome elements (ToolBar / NavigationBar / Sidebar / SearchBar / SelectableChip) are ignored — only "main content" deciders.
    const FLOATING_WHITE_RE = /^(AIWindow_Options_|SearchReceiving_(?!00))/;            // bubbles / floating panel (00 = no overlay)
    const FULL_BLEED_PANEL_RE = /^(DetailNotes_|Detail_Notes_|RecordNotes_)/;            // single white panel
    const CARD_KEY_RE = /(套卡|卡片)/;                                                   // List_Notes_01/02 套卡, _05+ 卡片列表
    const FLAT_LIST_RE = /^(List_Notes_03|List_Notes_04|List_Task_03)/;                  // 通栏 list

    const decideContentFill = (rs: MappingRow[]): string | null => {
      let sawPanel = false;
      for (const r of rs) {
        const vid = r.variantId;
        if (FLOATING_WHITE_RE.test(vid)) return 'surface_low';
        const meta = opts.components.get(vid);
        const vn = meta?.variantName ?? '';
        if (vn && CARD_KEY_RE.test(vn) && /^List_/.test(vid)) return 'surface_low';
        if (FULL_BLEED_PANEL_RE.test(vid) || FLAT_LIST_RE.test(vid)) sawPanel = true;
      }
      return sawPanel ? 'surface' : null;
    };

    if (laneFills.L !== undefined) {
      const lRows = [...(byLane.L ?? []), ...(lanes.C ? [] : allRows)];
      const fromL = decideContentFill(lRows);
      if (fromL) laneFills.L = fromL;
    }
    if (laneFills.C !== undefined) {
      const cRows = [...(byLane.C ?? []), ...allRows];
      const fromC = decideContentFill(cRows);
      if (fromC) laneFills.C = fromC;
    }
    // §0.3 (user clarification 2026-05-27): Sidebar (N 栏) bg follows LC bg color.
    // Rationale: N 栏 visual continuity with adjacent L lane (Sidebar internal card structure
    // 浮起 effect is component-internal, not lane-level). Take L's fill if L exists, else C.
    if (lanes.N) {
      laneFills.N = (lanes.L ? laneFills.L : laneFills.C) ?? laneFills.N;
    }
    for (const k of ['N', 'L', 'C'] as const) {
      if (lanes[k]) lanes[k]!.fill = laneFills[k] ?? lanes[k]!.fill;
    }
  }

  // build components + overlays
  const components: ComponentSpec[] = [];
  const overlays: OverlaySpec[] = [];

  // Overay row catalog (uiElement === 'Overay')
  const overayRows = opts.mapping.filter(r =>
    r.app === app && (r.subScene ?? '') === subScene &&
    r.scene === scene && r.state === state &&
    r.device === device && r.screenMode === queryScreenMode &&
    r.uiElement === 'Overay' &&
    r.variantId !== '不展示' && r.variantId.trim() !== ''
  );
  const overaySeen = new Set<string>();
  for (const r of overayRows) {
    const dedupKey = `${r.lane}|${r.variantId}`;
    if (overaySeen.has(dedupKey)) continue;
    overaySeen.add(dedupKey);
    const meta = opts.components.get(r.variantId);
    const setKey = resolveSetKey(r.variantId);
    const family = meta?.componentFamily ?? r.variantId.split('_')[0];
    overlays.push({
      trigger: r.notes ?? '',
      family, lane: r.lane, variant: resolveVariant(r.variantId),
      setKey: setKey?.setKey ?? '',
      library: meta?.libraryName ?? resolveLibrary(family),
      source: 'Overay-row',
    });
  }

  for (const r of pickedRows) {
    let laneKey: 'N' | 'L' | 'C' | '全' = r.lane.replace('栏', '').trim() as any;
    // single-screen or layoutType='C' single column: '全栏' = full frame width = C lane
    if (laneKey === '全') {
      if (SINGLE_SCREEN_DEVICES.has(device) || layout.type === 'C') {
        laneKey = 'C';
      } else {
        // P10 follow-up: multi-pane 全栏 = floating overlay across entire frame.
        //   AppSettings 一级/二级 (FloatingWindow_*) on Pad/Fold内 takes this path.
        const meta = opts.components.get(r.variantId);
        const setKey = resolveSetKey(r.variantId);
        const family = meta?.componentFamily ?? r.variantId.split('_')[0];
        overlays.push({
          trigger: r.notes ?? '',
          family, lane: r.lane, variant: resolveVariant(r.variantId),
          setKey: setKey?.setKey ?? '',
          library: meta?.libraryName ?? resolveLibrary(family),
          source: 'out-of-flow',
        });
        continue;
      }
    }
    const lane = lanes[laneKey];
    if (!lane) continue;
    const meta = opts.components.get(r.variantId);
    const setKey = resolveSetKey(r.variantId);
    if (!setKey) {
      console.warn(`! resolveSetKey: ${r.variantId}`);
      continue;
    }
    const family = meta?.componentFamily ?? '';
    const category = resolveCategory(family);
    const lib = meta?.libraryName ?? resolveLibrary(family);

    // category=flow-A → x=0, w=lane.w (栏 风满, common-rules §3.4a.1)
    // out-of-flow → moved to overlays catalog (Phase 3+: per-scenario visible decided later)
    if (category === 'out-of-flow') {
      overlays.push({
        trigger: r.notes ?? '',
        family, lane: r.lane, variant: resolveVariant(r.variantId),
        setKey: setKey.setKey, library: lib,
        source: 'out-of-flow',
      });
      continue;
    }

    // §3.4a (2026-06-01 修订): outer = max(0, spec - internal). instance.x=outer, w=laneW-2*outer.
    //   spec = device-dim 断点 padding 표 lookup, internal = component family 자带 (§3.4a.2).
    //   旧 룰 (一律 风满, x=0 w=lane.w) 폐기 — Pad L spec 20 vs internal 12 = 8dp 부족 등 발생.
    void meta;
    const normLane = (laneKey === 'C' && r.lane === '全栏') ? 'C栏' : r.lane;
    const variant = resolveVariant(r.variantId);
    const familyForPad = elementToFamily(r.uiElement);
    // ToolBar / BottomBar_Showcase: 외각 풍만 (capsule master HUG)
    const isToolBarLike = /^BottomBar_Showcase|^ToolBar_/.test(variant);
    let outerX: number, compW: number;
    if (isToolBarLike) {
      outerX = 0; compW = lane.w;
    } else {
      const padSpec = getLanePaddingSpec(device, screenMode, collapsed);
      const laneKeyFromName = normLane === 'N栏' ? 'N' : normLane === 'L栏' ? 'L' : normLane === 'C栏' ? 'C' : 'C';
      const specPad = (padSpec as any)[laneKeyFromName] ?? 12;
      const internal = getInternalPadding(familyForPad, variant);
      outerX = Math.max(0, specPad - internal);
      compW = lane.w - 2 * outerX;
    }
    components.push({
      element: r.uiElement,
      lane: normLane,
      variant,
      setKey: setKey.setKey, library: lib, category,
      x: outerX, w: compW,
      y: 0, h: 'auto',
      notes: r.notes,
    });
  }

  // POC simplified vertical stacking inside lane (default L 栏 ordering: NavBar→SearchBar→Chip→List→ToolBar)
  // Special: TextInput in C 栏 bottom flush (per §0.1 #1)
  // Special: Detail in C 栏 y=62 h=mainH-62 (per §0.1 #2)
  const orderInLane: Record<string, string[]> = {
    N: ['NavigationBar', 'Sidebar'],
    L: ['NavigationBar', 'SearchBar', 'NoticeBar', 'SelectableChip', 'List', 'ToolBar'],
    // C lane: unified order for detail frame + single-screen list page.
    // single-screen NLC enumerates list+detail in one frame (catalog) — Phase 3-B splits them.
    C: ['NavigationBar', 'SearchBar', 'NoticeBar', 'SelectableChip', 'List', 'DetailNotes', 'TextInput', 'Input', 'ToolBar'],
  };
  // Sort + assign y/h
  const heightByElement: Record<string, number> = {
    NavigationBar: 56, SearchBar: 56, NoticeBar: 56, SelectableChip: 52, ToolBar: 100,
    Sidebar: mainH, // outer shell, full lane height
  };
  for (const lk of ['N', 'L', 'C'] as const) {
    const order = orderInLane[lk] ?? [];
    const inLane = components.filter(c => c.lane === `${lk}栏`);
    inLane.sort((a, b) => order.indexOf(a.element) - order.indexOf(b.element));

    let y = 0;
    for (const c of inLane) {
      // Sidebar (NLC覆盖): direct child of frame, separated from in-lane stacking. y=0 (lane-relative), h=mainH full height.
      // §3.7 zOrder treats 'Sidebar' as its own layer — only coordinates need absolute placement.
      if (c.element === 'Sidebar') {
        c.y = 0;
        c.h = mainH;
        continue;
      }
      // C 栏 DetailNotes (笔记 paradigm): y=62, h=mainH-62 (full panel, TI 아래까지 연장)
      if (lk === 'C' && (c.element === 'DetailNotes')) {
        c.y = 62;
        c.h = mainH - 62;
        continue;
      }
      // C 栏 DetailTask (待办 paradigm): y=56 (NavBar 아래, gap 없음).
      // width = lane.w (uniform A 류 lane 风满, 우측은 빈 공간으로 노출).
      // height = 'auto' — 카드 자연 height (항목 갯수 따라 동적, Phase 5 render 시 instance 자연 사용).
      if (lk === 'C' && c.element === 'DetailTask') {
        c.y = 56;
        c.h = 'auto';
        continue;
      }
      // C 栏 Input bottom flush
      if (lk === 'C' && c.element === 'Input') {
        const inputH = 92; // TextInput_Notes natural height
        c.y = mainH - inputH;
        c.h = inputH;
        continue;
      }
      // ToolBar bottom-attached (lane-agnostic: applies to L 栏 multi-pane and C 栏 single-screen)
      if (c.element === 'ToolBar') {
        c.y = mainH - 100;
        c.h = 100;
        continue;
      }
      // TopBar_X (NL framework SearchBar slot) fuses NavBar+SearchBar → 112dp
      const h = c.variant.startsWith('TopBar_') ? 112 : (heightByElement[c.element] ?? 56);
      c.y = y;
      c.h = h;
      y += h;
    }
  }

  // Sort components in reading order: lane (N → L → C → 全), then y ascending.
  const laneOrder: Record<string, number> = { 'N栏': 0, 'L栏': 1, 'C栏': 2, '全栏': 3 };
  components.sort((a, b) => {
    const la = laneOrder[a.lane] ?? 99;
    const lb = laneOrder[b.lane] ?? 99;
    if (la !== lb) return la - lb;
    return (typeof a.y === 'number' ? a.y : 0) - (typeof b.y === 'number' ? b.y : 0);
  });

  // Stage 3A.x: floatingContainer first-class entity (gap-audit-overlay-container-spec.md).
  // Scan overlays[] for FloatingWindow_*/DrawerWindow_* matching floating-spec.csv
  // by (family + device + state + subScene). state/subScene support '*' wildcard for
  // back-compat with rows authored before the schema bump.
  // Bug A fix (2026-06-01): previous matcher ignored state/subScene → 默认 frames received
  // AppSettings 一级 inner (List_NoteSetting_01). New filter scopes the match to the
  // designer-authored row matching the frame's actual sub-scene + state.
  // attached form (e.g. Sidebar_Notes_01): row.attached=true → no modal mask, side-anchored
  // instance with H = frameH - statusBarH (mainH fill). app-variant-map §0.1 #10.
  let floatingContainer: FloatingContainerSpec | undefined;
  const floatingRows = loadFloatingSpec();
  for (let i = 0; i < overlays.length; i++) {
    const ov = overlays[i];
    const row = floatingRows.find(r =>
      r.family === ov.variant
      && r.device === device
      && (r.state === '*' || r.state === state)
      && (r.subScene === '*' || r.subScene === subScene),
    );
    if (!row) continue;
    const ctx: Record<string, number> = {
      frameW: dim.frameW, frameH: dim.frameH, statusBarH: dim.statusBarH, w: 0, h: 0,
    };
    ctx.w = evalFloatingExpr(row.widthExpr, ctx);
    ctx.h = evalFloatingExpr(row.heightExpr, ctx);
    const fwX = evalFloatingExpr(row.posXExpr, ctx);
    const fwY = evalFloatingExpr(row.posYExpr, ctx);
    // attached form: no header, no inner content slot — instance occupies the whole rect.
    // modal form: header + content slot below header.
    if (row.attached) {
      floatingContainer = {
        family: ov.family, variant: ov.variant,
        setKey: row.setKey || ov.setKey, library: row.library || ov.library,
        x: fwX, y: fwY, w: ctx.w, h: ctx.h,
        cornerRadius: 0,
        headerH: 0,
        modal: false,
        contentSlot: {
          x: 0, y: 0, w: ctx.w, h: ctx.h,
          paddingTop: 0, paddingLR: 0,
          fillToken: 'surface',
          bottomLeftRadius: 0, bottomRightRadius: 0,
          clipsContent: false,
          // attached form: inner content sourced from designer's source frame instance,
          // not from a separate inner library variant. Renderer uses the instance natural inner.
          innerNode: { type: 'instance', variant: ov.variant, setKey: row.setKey || ov.setKey, library: row.library || ov.library },
        },
      };
      overlays.splice(i, 1);
      break;
    }
    const fwCR = FLOATING_CR[ov.variant];
    if (fwCR === undefined) {
      console.warn(`! floating-spec match but FLOATING_CR missing for ${ov.variant}`);
      continue;
    }
    const slotH = ctx.h - row.headerH;
    // has-cards trace: List_* assumed cards-true; refine via components.csv hasCards column later.
    const hasCards = /^List_/.test(row.innerVariant);
    const fillToken: 'surface' | 'surface_low' = hasCards ? 'surface_low' : 'surface';
    floatingContainer = {
      family: ov.family, variant: ov.variant,
      setKey: row.setKey || ov.setKey, library: row.library || ov.library,
      x: fwX, y: fwY, w: ctx.w, h: ctx.h,
      cornerRadius: fwCR,
      headerH: row.headerH,
      modal: row.modal,
      contentSlot: {
        x: 0, y: row.headerH, w: ctx.w, h: slotH,
        paddingTop: row.contentPaddingTop,
        paddingLR: row.contentPaddingLR,
        fillToken,
        bottomLeftRadius: row.bottomCornerMatchFW ? fwCR : 0,
        bottomRightRadius: row.bottomCornerMatchFW ? fwCR : 0,
        clipsContent: true,
        innerNode: {
          type: 'instance',
          variant: row.innerVariant,
          setKey: row.innerSetKey,
          library: row.innerLibrary,
        },
      },
    };
    overlays.splice(i, 1); // remove the upgraded overlay
    break;
  }

  // masks (common-rules §3.7 / §3.7a / §3.7a-NL)
  const masks: FrameSpec['masks'] = [];
  // Stage 3A.x: modal floatingContainer → 遮罩-全幅 (full frame, opacity 0.2).
  if (floatingContainer?.modal) {
    masks.push({
      name: '遮罩-全幅',
      x: 0, y: 0, w: dim.frameW, h: dim.frameH,
      cornerRadius: dim.cornerRadius,
      fill: 'mask', opacity: 0.2,
    });
  }
  const isNLC = layout.type.startsWith('NLC'); // NLC覆盖 / NLC并列 / NLC收起 all retain C 栏
  // §3.7a: LEditMode + (NLC OR LC) framework → 遮罩-编辑 (C 栏 dim, full frameH, above 状态栏)
  // §3.7a-NL: NL framework + LEditMode → mask 不渲染 (skip — no C lane → gated out automatically)
  // Gate: presence of both L and C lanes (NL has no C, NC has no L, single C has no L → all skipped).
  const editMaskApplies = scenarioFlags.LEditMode && !!lanes.C && !!lanes.L;
  if (editMaskApplies) {
    // §3.7a: 编辑遮罩 covers C lane only. left edge = inner (no radius), right edge = frame's right corner radius.
    // device-dimensions.md cornerR can be scalar (Pad/Fold内) or object form (Fold外 asymmetric).
    const fcr = dim.cornerRadius;
    const tr = typeof fcr === 'number' ? fcr : fcr.topRight;
    const br = typeof fcr === 'number' ? fcr : fcr.bottomRight;
    masks.push({
      name: '遮罩-编辑',
      x: lanes.C!.x, y: 0, w: lanes.C!.w, h: dim.frameH,
      cornerRadius: { topLeft: 0, topRight: tr, bottomLeft: 0, bottomRight: br },
      fill: 'mask', opacity: 0.2,
    });
  }
  // §3.7: NCovering → 遮罩-N覆盖 (full frame)
  if (layout.NCovering) {
    masks.push({
      name: '遮罩-N覆盖',
      x: 0, y: 0, w: dim.frameW, h: dim.frameH,
      cornerRadius: dim.cornerRadius,
      fill: 'mask', opacity: 0.2,
    });
  }

  // divider — common-rules §6.2 #12: LC 1 条 / NLC 并列 1 条 (L|C). NC / C 통栏 0 条.
  // Both NLC and LC frameworks render an L|C divider; emit at C lane's x boundary.
  const hasLCDivider = (isNLC || layout.type === 'LC') && lanes.C;
  const divider = hasLCDivider
    ? { x: lanes.C!.x, y: 0, w: 1, h: dim.frameH, fill: 'outline' }
    : undefined;

  // zOrder per common-rules §3.7 / §3.7a / §3.7b + Stage 3A.x floatingContainer.
  // Rule: 分割线 sits below all masks (gets dimmed alongside the status bar).
  let zOrder: string[];
  if (floatingContainer) {
    if (floatingContainer.modal) {
      // modal overlay: FW (header) + 内容裁剪区 (slot above FW with source content).
      zOrder = ['main', '状态栏', '遮罩-全幅', 'floatingContainer', '内容裁剪区', '杆子'];
    } else if (lanes.C) {
      // non-modal attached form (e.g. Sidebar_Notes_01) over an LC/NLC layout.
      // Divider stays below attached panel; attached sits above 状态栏 to extend over its column.
      zOrder = ['main', '状态栏', '分割线', 'floatingContainer', '杆子'];
    } else {
      // non-modal attached form over a single-pane layout (no divider).
      zOrder = ['main', '状态栏', 'floatingContainer', '杆子'];
    }
  } else if (editMaskApplies && scenarioFlags.NCovering) {
    // §3.7b: multi-mask stack (LEditMode + NCovering — only NLC覆盖 reaches this branch since LC has no NCovering)
    zOrder = ['main', '状态栏', '分割线', '遮罩-编辑', 'L栏', '遮罩-N覆盖', 'Sidebar', '杆子'];
  } else if (scenarioFlags.NCovering) {
    // §3.7
    zOrder = ['main', '状态栏', '分割线', '遮罩-N覆盖', 'Sidebar', '杆子'];
  } else if (editMaskApplies) {
    // §3.7a: promote L 栏 to frame's direct child (NLC并列 / LC frameworks).
    // §3.9: when N lane exists (NLC并列), Sidebar must sit above L so its shadow extends past N|L
    // boundary. main + N栏 must have clipsContent=false (handled in render-spec). Sidebar follows
    // L in z-order so shadow covers L's left edge.
    zOrder = lanes.N
      ? ['main', '状态栏', '分割线', '遮罩-编辑', 'L栏', 'Sidebar', '杆子']
      : ['main', '状态栏', '分割线', '遮罩-编辑', 'L栏', '杆子'];
  } else {
    // 'Sidebar' layer is included only when an N lane exists.
    // Drops Sidebar from: LC framework, single C, NL/NLC/NC 收起 (NCollapsed), and any layout without N lane.
    zOrder = lanes.N
      ? ['main', '状态栏', '分割线', 'Sidebar', '杆子']
      : ['main', '状态栏', '分割线', '杆子'];
  }

  // ───────────────────────────────────────────────────────────────────────
  // POST-PROCESSING: search-active state — device-별 overlay/component 분기
  //   권위: device-dimensions.md §搜索规格 형태선택 표 (2026-05-31 보강).
  //   회고: 2026-05-31 笔记搜索+详情 task 에서 user 가 5 차 fix 지적 후 정형화.
  //   csv mapping 表 의 default row 만으로 device-별 분기 표현 不可 → spec post-processing 化.
  //   포함 fix:
  //     ① Pad N/L 栏 active overlay = SearchHistory_Receiving_01 (Phone 樣式 panel)
  //     ② Pad C 栏 active overlay = SearchReceiving (Dropdown) — 이미 default emit 정확
  //     ③ Fold 内 L 栏 active = inline SearchHistory_02 component (panel 不要, SearchBar 아래 直接)
  //     ④ search-active 시 L 栏 NavBar = `_00` (不渲染, SearchBar 자체가 상단 점유)
  if (state === '搜索激活') {
    if (device.startsWith('Pad')) {
      // ① Pad N/L 栏 active 시 SearchReceiving_00 → SearchHistory_Receiving_01 swap
      const shrKey = NOTES_SET_KEYS.SearchHistory_Receiving;
      if (shrKey) {
        for (const ov of overlays) {
          if (ov.family === 'SearchReceiving' && (ov.lane === 'L栏' || ov.lane === '全栏')) {
            ov.family = 'SearchHistory_Receiving';
            ov.variant = 'SearchHistory_Receiving_01';
            ov.setKey = shrKey.setKey;
            ov.library = shrKey.library;
            // device-dim 「Pad 承接 panel」 spec: y=SearchBar.bottom+6, padding 16, 圆角 24 (component 자체 spec 内장)
            if (ov.lane === '全栏') ov.lane = 'L栏';
          }
        }
      }
    } else if (device.startsWith('Fold内')) {
      // ③ Fold 内 L 栏 active 시 SearchReceiving 제거 (inline SearchHistory_02 사용)
      for (let i = overlays.length - 1; i >= 0; i--) {
        const ov = overlays[i];
        if (ov.family === 'SearchReceiving' && (ov.lane === 'L栏' || ov.lane === '全栏')) {
          overlays.splice(i, 1);
        }
      }
      // Fold 内 L 栏에 inline SearchHistory_02 component 추가 (SearchBar 바로 아래 stack)
      const shKey = NOTES_SET_KEYS.SearchHistory;
      if (shKey && lanes.L) {
        // existing L 栏 SearchBar 위치 찾기 (y + h 가 SearchHistory 시작 지점)
        const sbar = components.find(c => c.lane === 'L栏' && /SearchBar/.test(c.element));
        const sbarBottom = sbar && typeof sbar.y === 'number' && typeof sbar.h === 'number'
          ? sbar.y + sbar.h
          : 108; // fallback: statusBarH 46 + 6 + NavBar(0 if not rendered) + SearchBar 56 = 108
        components.push({
          element: 'SearchHistory',
          lane: 'L栏',
          variant: 'SearchHistory_ComponentSet_02',
          setKey: shKey.setKey,
          library: shKey.library,
          category: 'flow-A',
          x: 0,
          y: sbarBottom,
          w: lanes.L.w,
          h: 186, // 자연 높이 유지 (variant _02 = 392x186, 폭 만 reflow)
          notes: 'Fold 内 L 栏 search-active inline panel (post-processing 추가, device-dim §搜索规格)',
        });
      }
    }
    // ④ Pad / Fold 内 모두 — search-active L 栏 NavBar 不渲染 (variant 强制 _00 swap)
    //    user 명시: 「SearchBar 자체가 상단 점유, NavBar 不渲染」 (笔记搜索 source 樣式 일치)
    if (device.startsWith('Pad') || device.startsWith('Fold内')) {
      for (const c of components) {
        if (c.lane === 'L栏' && /^NavigationBar$/.test(c.element) && /^NavigationBar_ComponentSet_(?!00)/.test(c.variant)) {
          c.variant = 'NavigationBar_ComponentSet_00';
          c.notes = (c.notes ? c.notes + '; ' : '') + 'search-active L 栏 NavBar 不渲染 (post-processing)';
        }
      }
    }
  }
  // ───────────────────────────────────────────────────────────────────────

  return {
    id: subScene
      ? `${app}_${subScene}_${scene}_${state}_${device}_${layout.type}`
      : `${app}_${scene}_${state}_${device}_${layout.type}`,
    source: { app, ...(subScene ? { subScene } : {}), scene, state, device, screenMode } as any,
    frame: {
      w: dim.frameW, h: dim.frameH, cornerRadius: dim.cornerRadius,
      // Frame fill matches L+C lane bg (per user 2026-05-27).
      //   When L and C both same → that token; when only one lane (single-screen) → that lane's fill;
      //   when L+C differ → fall back to L (rare; document if surfaces).
      fill: (() => {
        const f = (lanes.L?.fill ?? lanes.C?.fill ?? 'surface_low') as 'surface' | 'surface_low';
        return NOTES_TOKENS[f] ?? NOTES_TOKENS.surface_low;
      })(),
    },
    statusBar: {
      variant: sb.variantId, setKey: sbKey.setKey, library: sbKey.library,
      x: 0, y: 0, w: dim.frameW,
      h: device.startsWith('Pad') ? 34 : 46,
    },
    layout: { type: layout.type, lanes },
    scenarioFlags,
    components,
    overlays,
    ...(floatingContainer ? { floatingContainer } : {}),
    masks,
    divider,
    swipeIndicator: {
      variant: sw.variantId, setKey: swKey.setKey,
      x: 0, y: 'bottom', w: dim.frameW, fills: [],
    },
    zOrder,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main (POC: 笔记 NLC 默认 Pad竖)
// ─────────────────────────────────────────────────────────────────────────────

interface Target {
  subScene: string; scene: string; state: string; device: string; screenMode: string; collapsed: boolean;
}

function enumerateTargets(mapping: MappingRow[], app: string): Target[] {
  const seen = new Map<string, Target>();
  for (const r of mapping) {
    if (r.app !== app) continue;
    if (r.uiElement === 'Overay') continue;
    if (!r.scene || !r.state || !r.device) continue;
    let logicalScreenMode: string;
    let collapsed: boolean;
    if (SINGLE_SCREEN_DEVICES.has(r.device)) {
      logicalScreenMode = r.scene;
      collapsed = false;
    } else {
      const csv = r.screenMode;
      if (csv.endsWith('收起')) {
        logicalScreenMode = csv.replace(/收起$/, '');
        collapsed = true;
      } else {
        logicalScreenMode = csv;
        collapsed = false;
      }
    }
    const key = `${r.subScene}|${r.scene}|${r.state}|${r.device}|${logicalScreenMode}|${collapsed}`;
    if (seen.has(key)) continue;
    seen.set(key, {
      subScene: r.subScene, scene: r.scene, state: r.state, device: r.device,
      screenMode: logicalScreenMode, collapsed,
    });
  }
  return [...seen.values()].sort((a, b) =>
    `${a.subScene}|${a.device}|${a.scene}|${a.state}|${a.collapsed}`.localeCompare(
      `${b.subScene}|${b.device}|${b.scene}|${b.state}|${b.collapsed}`,
    ),
  );
}

function main() {
  console.log('csv-to-spec.ts (Stage 3A POC) — 笔记 NLC 默认');

  const mapping = loadMapping('Notes');  // 笔记 + 待办 unified (extract-mapping outputs both under app='Notes' with subScene)
  const systemMapping = loadSystemMapping();
  const components = loadComponents();

  console.log(`  loaded: app-Notes-mapping.csv ${mapping.length} rows`);
  console.log(`  loaded: SystemUIKIT-mapping.csv ${systemMapping.length} rows`);
  console.log(`  loaded: components.csv ${components.size} variants`);

  fs.mkdirSync(SPEC_OUT, { recursive: true });

  // Phase 3-D: full auto-enumerate (covers both 笔记 and 待办 sub-scenes of Notes app)
  const targets = enumerateTargets(mapping, 'Notes');
  console.log(`  enumerated ${targets.length} target frames (笔记 + 待办)`);
  let okCount = 0, skipCount = 0;
  const skipReasons = new Map<string, number>();
  for (const t of targets) {
    try {
      const spec = buildSpec({
        app: 'Notes', subScene: t.subScene,
        scene: t.scene, state: t.state, device: t.device,
        screenMode: t.screenMode, collapsed: t.collapsed,
        mapping, systemMapping, components,
      });
      const outPath = path.join(SPEC_OUT, `${spec.id}.json`);
      fs.writeFileSync(outPath, JSON.stringify(spec, null, 2), 'utf8');
      okCount++;
    } catch (e: any) {
      skipCount++;
      const reason = `${t.subScene || '-'}|${t.device}|${t.screenMode}|collapsed=${t.collapsed}`;
      skipReasons.set(reason, (skipReasons.get(reason) ?? 0) + 1);
    }
  }
  console.log(`✓ generated ${okCount} specs, skipped ${skipCount}`);
  for (const [reason, n] of skipReasons) console.log(`  skip ${n}× : ${reason}`);

  // Stage 3A.x: auto-run pair collection for downstream online probe.
  // npm run validate-keys → spec-output/validation-todo.json
  // npm run validate-keys-online (agent) → use_figma probe → spec-output/validation-report.json
  console.log(`  next: npm run validate-keys → online probe via agent (see Improvement_doc/audit-stale-setkeys-*.md)`);
}

main();
