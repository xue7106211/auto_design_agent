#!/usr/bin/env tsx
/**
 * csv-to-spec.ts (Stage 3A)
 *
 * mapping-output/*.csv + components.csv + app-variant-map-{app}.md §0.4
 * → frame 단위 spec JSON (spec-output/spec/{App}_{Scene}_{State}_{Device}.json)
 *
 * Phase 5 (적응 실행) 의 모든 「판단」을 「데이터 lookup」으로 이전.
 * AI 매 frame 마다 결정하던 layoutType / variantId / setKey / x,y,w,h /
 * mask / zOrder 등을 자동 산출.
 *
 * POC 범위: 笔记 NLC 默认 Pad竖 1 frame end-to-end.
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
  cornerRadius: number;
  statusBarH: number;
}

const DEVICE_DIMENSIONS: Record<string, DeviceDim> = {
  '手机竖':   { frameW: 392, frameH: 851, cornerRadius: 34, statusBarH: 46 },
  '手机横':   { frameW: 851, frameH: 392, cornerRadius: 34, statusBarH: 46 },
  'Fold外竖': { frameW: 392, frameH: 851, cornerRadius: 34, statusBarH: 46 },
  'Fold外横': { frameW: 851, frameH: 392, cornerRadius: 34, statusBarH: 46 },
  'Fold内竖': { frameW: 628, frameH: 851, cornerRadius: 50, statusBarH: 46 },
  'Fold内横': { frameW: 888, frameH: 628, cornerRadius: 50, statusBarH: 46 },
  'Pad竖':    { frameW: 949, frameH: 1422, cornerRadius: 34, statusBarH: 34 },
  'Pad横':    { frameW: 1422, frameH: 949, cornerRadius: 34, statusBarH: 34 },
};

// Lane widths per (device + screenMode). Sourced from device-dimensions.md.
// POC: only Pad竖 NLC 覆盖. Will expand in Phase 3.
interface LaneSpec {
  type: 'NLC覆盖' | 'NLC并列' | 'NLC收起' | 'NL展开' | 'NL收起' | 'NC展开' | 'NC收起' | 'LC' | 'C';
  N?: number;  // covered → laid out at frame level z-promoted
  L?: number;
  C?: number;
  NCovering?: boolean;
}

function getLayoutSpec(device: string, screenMode: string, collapsed: boolean): LaneSpec {
  // 笔记 §0.1a + §0.2 lane width 표 + N收起 規則
  if (device === 'Pad竖' && screenMode === 'NLC') {
    if (collapsed) return { type: 'NLC收起', L: 428, C: 521 }; // §0.2 line 185: N 消失, L+C 유지
    return { type: 'NLC覆盖', N: 272, L: 428, C: 521, NCovering: true };
  }
  if (device === 'Pad横' && screenMode === 'NLC') {
    if (collapsed) return { type: 'NLC收起', L: 428, C: 994 }; // §0.2 line 183: N 88 收起占位 흡수 (L 不变 + C+88)
    return { type: 'NLC并列', N: 272, L: 428, C: 722 };
  }
  if (device === 'Pad竖' && screenMode === 'NL') {
    if (collapsed) return { type: 'NL收起', L: 949 }; // §0.2 line 174: L=frameW (N自体消失, 笔记 special)
    return { type: 'NL', N: 272, L: 677 };
  }
  if (device === 'Pad横' && screenMode === 'NL') {
    if (collapsed) return { type: 'NL收起', L: 1422 }; // §0.2 line 172: L=frameW
    return { type: 'NL', N: 272, L: 1150 };
  }
  throw new Error(`getLayoutSpec: unsupported (${device}, ${screenMode}, collapsed=${collapsed})`);
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

const NOTES_SET_KEYS: Record<string, SetKeyEntry> = {
  StatusBar:                       { setName: 'StatusBar_ComponentSet',                setKey: '1047f2112a230a27d3888d27b34a5857815216e3', library: 'OS4 UI Kit' },
  NavigationBar:                   { setName: 'NavigationBar',                         setKey: 'a89cd38d06061fcbb5ff7e596b92f8f3cf3888de', library: 'OS4 UI Kit' },
  NavigationBar_Notes:             { setName: 'NavigationBar_ComponentSet_Notes',      setKey: 'ac60af7e28e6491b3520ecaefd71fa7e03832c31', library: '业务组件库' },
  SearchBar:                       { setName: 'SearchBar_ComponentSet',                setKey: '2316a63eb824ab38f388c3127101e535b7668398', library: 'OS4 UI Kit' },
  SelectableChip_Notes:            { setName: 'SelectableChip_ComponentSet_Notes',     setKey: 'af1e1df353e8fb1fe8005b82fed310422f2eae4c', library: '业务组件库' },
  List_Notes:                      { setName: 'List_Notes',                            setKey: '94f9b4085ba12b43511a95282fa84225241f6f9e', library: '业务组件库' },
  Detail_Notes:                    { setName: 'Detail_Notes',                          setKey: '961f0e237edea438d52e6d2ad9b4e38c99bd2c68', library: '业务组件库' },
  BottomBar_Showcase_Notes:        { setName: 'BottomBar_Showcase_Notes',              setKey: '303649c8435835bcbfb5e85e668a0b6562497cad', library: '业务组件库' },
  TextInput_Notes:                 { setName: 'TextInput_ComponentSet_Notes',          setKey: '0dc20401cde070d654725146db336032d2f886a2', library: '业务组件库' },
  BottomBar_Sidebar:               { setName: 'BottomBar (含 Sidebar_Component_PAD_NLC_*)', setKey: '414cabc8e633c33cc6441ff0f936f971dc9babd3', library: 'OS4 UI Kit' },
  SwipeIndicator:                  { setName: 'SwipeIndicator_ComponentSet',           setKey: '8356fb53480febeb853a6c391bcd2dc8f13198f2', library: 'OS4 UI Kit' },
  NoticeBar:                       { setName: 'NoticeBar_ComponentSet',                setKey: '', library: 'OS4 UI Kit' }, // TODO probe
  Scrollbar:                       { setName: 'Scrollbar_ComponentSet',                setKey: '', library: 'OS4 UI Kit' }, // TODO probe
  TextFormatPanel_Notes:           { setName: 'TextFormatPanel_ComponentSet_Notes',    setKey: '', library: '业务组件库' },   // TODO probe (out-of-flow, deferred)
  // Out-of-flow / overlay families (setKey TODO — Phase 4 probe)
  Menu:                            { setName: 'Menu_ComponentSet',                     setKey: '', library: 'OS4 UI Kit' },
  AlertDialog:                     { setName: 'AlertDialog_ComponentSet',              setKey: '', library: 'OS4 UI Kit' },
  ActionSheet:                     { setName: 'Actionsheet_ComponentSet',              setKey: '', library: 'OS4 UI Kit' },
  WheelPicker:                     { setName: 'WheelPicker_ComponentSet',              setKey: '', library: 'OS4 UI Kit' },
  FloatingWindow:                  { setName: 'FloatingWindow_ComponentSet',           setKey: '', library: 'OS4 UI Kit' },
  SegmentedControls:               { setName: 'SegmentedControls_ComponentSet',        setKey: '', library: 'OS4 UI Kit' },
  ToolBar:                         { setName: 'ToolBar_ComponentSet',                  setKey: '', library: 'OS4 UI Kit' },  // TODO probe
};

// variantId → set key registry name
function resolveSetKey(variantId: string): SetKeyEntry | null {
  if (variantId.startsWith('StatusBar_')) return NOTES_SET_KEYS.StatusBar;
  if (variantId.startsWith('SwipeIndicator_')) return NOTES_SET_KEYS.SwipeIndicator;
  if (variantId.startsWith('NavigationBar_ComponentSet_Notes')) return NOTES_SET_KEYS.NavigationBar_Notes;
  if (variantId.startsWith('NavigationBar_ComponentSet_')) return NOTES_SET_KEYS.NavigationBar;
  // TopBar_X 는 NavigationBar set 内 「顶部导航」 변체 (§0.1 #8). 같은 setKey 사용.
  if (variantId.startsWith('TopBar_')) return NOTES_SET_KEYS.NavigationBar;
  if (variantId.startsWith('SearchBar_ComponentSet')) return NOTES_SET_KEYS.SearchBar;
  if (variantId.startsWith('SelectableChip_ComponentSet_Notes')) return NOTES_SET_KEYS.SelectableChip_Notes;
  if (variantId.startsWith('List_Notes_')) return NOTES_SET_KEYS.List_Notes;
  if (variantId.startsWith('Detail_Notes_') || variantId.startsWith('DetailNotes_')) return NOTES_SET_KEYS.Detail_Notes;
  if (variantId.startsWith('BottomBar_Showcase_Notes')) return NOTES_SET_KEYS.BottomBar_Showcase_Notes;
  if (variantId.startsWith('TextInput_ComponentSet_Notes')) return NOTES_SET_KEYS.TextInput_Notes;
  if (variantId.startsWith('Sidebar_Component_PAD_NLC')) return NOTES_SET_KEYS.BottomBar_Sidebar;
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
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Token registry (sourced from app-variant-map-笔记.md §0.3)
// ─────────────────────────────────────────────────────────────────────────────

interface TokenEntry {
  name: string;
  key: string;
  fallback: { r: number; g: number; b: number };
  opacity?: number;
}

const NOTES_TOKENS: Record<string, TokenEntry> = {
  surface_low: {
    name: '背景色/surface_low',
    key: 'e74b063d74a3444a44a4e00bb7417c2dbea305ba',
    fallback: { r: 0.961, g: 0.961, b: 0.961 },
  },
  surface: {
    name: '背景色/surface',
    key: '5804f51e302d6fda00b3a8ce9d509d9b8ee09225',
    fallback: { r: 1, g: 1, b: 1 },
  },
  outline: {
    name: '分割线色/outline',
    key: '96f2cf4d1ce0d56cff2f8e98da6a5e16bd59983e',
    fallback: { r: 0.9, g: 0.9, b: 0.9 },
  },
  mask: {
    name: '遮罩色/mask',
    key: '0ed62540049dd3839b40b63d40f82492c4bac664',
    fallback: { r: 0, g: 0, b: 0 },
    opacity: 0.2,
  },
};

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
  // common-rules §3.4a.5: `_00` = 不渲染 / 空容器 → skip
  'NavigationBar', 'BottomBar_Showcase_Notes', 'Sidebar_Component_PAD_NLC',
  'TextInput_ComponentSet_Notes',
]);

function suffixIsSkip(variantId: string): boolean {
  if (variantSuffix(variantId) !== '_00') return false;
  for (const fam of SUFFIX_00_SKIP_FAMILIES) {
    if (variantId.startsWith(fam)) return true;
  }
  return false;
}

function deriveScenarioFlags(state: string, layoutType: string): ScenarioFlags {
  // §0.1b: state-name signals (frame name 含 已选/选择/编辑模式 → LEditMode)
  const isEdit = /(已选|选择|编辑模式)/.test(state);
  // POC: NEditMode / CEditMode 는 추후 chosen variant inspect 로 도출 — 일단 false
  return {
    LEditMode: isEdit,
    NEditMode: false,
    CEditMode: false,
    NCovering: layoutType === 'NLC覆盖',
    NCollapsed: /收起/.test(state),
  };
}

// Variant disambiguation: 같은 (lane, uiElement) 에 여러 row → 1개 선택
// 룰 출처: app-variant-map-笔记.md §0.1#8 / §0.2 / N收起规则 + Notes_TextInput.md
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

  // Pad NLC 공통 element/lane 별 전체 skip 룰 (single-candidate 보다 우선)
  const isPadNLC = device.startsWith('Pad') && screenMode === 'NLC';
  const isPadNL = device.startsWith('Pad') && screenMode === 'NL';
  if (isPadNLC) {
    // C栏 Input(TextInput): Pad NLC = `_00` 不渲染 (Notes_TextInput.md, Pad竖+横 공통)
    if (elem === 'Input' && lane === 'C栏') return null;
  }
  if (isPadNLC || isPadNL) {
    // N栏 NavigationBar: Sidebar 内部 NavigationAtoms 가 标题栏 担当 → 永远 不渲染
    // (§0.1 #8 NL framework 도 동일, Pad NLC+NL 공통)
    if (elem === 'NavigationBar' && lane === 'N栏') return null;
  }

  if (live.length === 1) return live[0];

  // Pad NLC framework: 멀티-variant disambiguation 룰 (Pad竖 覆盖 + Pad横 并列 공통)
  if (isPadNLC) {
    // L栏 NavigationBar: 默认 N展开=_07, N收起=_17; 编辑 N展开=_09, N收起=_18
    // (§0.1 #8 + N收起 規則 line 339, mapping CSV 권위)
    if (elem === 'NavigationBar' && lane === 'L栏') {
      const target = flags.LEditMode
        ? (flags.NCollapsed ? '_18' : '_09')
        : (flags.NCollapsed ? '_17' : '_07');
      const hit = live.find(r => r.variantId.endsWith(target));
      if (hit) return hit;
    }
    // L栏 List (NLC framework): 编辑 = _04 (Pad竖/横 공통, mapping CSV); 默认 = _03 (single-row → 자동)
    if (elem === 'List' && lane === 'L栏' && flags.LEditMode) {
      const hit = live.find(r => r.variantId.endsWith('_04'));
      if (hit) return hit;
    }
    // N栏 NavigationBar: 永远 _00 → 위 suffixIsSkip 에서 제거됨. 남으면 첫 후보.
    // Sidebar: 展开 → _01; N收起 → null (N自体消失, 笔记 special)
    if (elem === 'Sidebar' && lane === 'N栏') {
      if (flags.NCollapsed) return null;
      const hit = live.find(r => r.variantId.endsWith('_01'));
      if (hit) return hit;
    }
  }

  // Pad NL framework: TopBar / List 奇偶 룰 (§0.1 #8 + §0.1 #9)
  if (isPadNL) {
    // L栏 SearchBar slot = TopBar_X (NL framework 에서는 NavBar+SearchBar 합성). §0.1 #8:
    //   默认 展开=_03 / 默认 收起=_07 / 编辑 展开=_09 / 编辑 收起=_08
    if (elem === 'SearchBar' && lane === 'L栏') {
      const target = flags.LEditMode
        ? (flags.NCollapsed ? '_08' : '_09')
        : (flags.NCollapsed ? '_07' : '_03');
      const hit = live.find(r => r.variantId === `TopBar${target}`);
      if (hit) return hit;
    }
    // L栏 List 奇/偶 device-specific (§0.1 #9):
    //   默认(奇): Pad竖NL=_13, Pad竖NL收起=_15, Pad横NL=_17, Pad横NL收起=_19
    //   编辑(偶): Pad竖NL=_14, Pad竖NL收起=_16, Pad横NL=_18, Pad横NL收起=_20
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

  // Fallback: 첫 row + 워닝
  console.warn(`! pickVariant: 룰 매칭 실패 ${elem}/${lane} (${device}/${screenMode}) — 후보: ${live.map(r => r.variantId).join(', ')} → ${live[0].variantId}`);
  return live[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapping CSV loader
// ─────────────────────────────────────────────────────────────────────────────

interface MappingRow {
  app: string; scene: string; state: string;
  uiElement: string; device: string; screenMode: string;
  lane: string; variantId: string; notes: string;
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
    app: r.app, scene: r.scene, state: r.state,
    uiElement: r.uiElement, device: r.device, screenMode: r.screenMode,
    lane: r['栏'] ?? '', variantId: r.variantId, notes: r.notes ?? '',
  }));
}

function loadSystemMapping(): MappingRow[] {
  const csvPath = path.join(MAPPING_OUT, 'SystemUIKIT-mapping.csv');
  const raw = fs.readFileSync(csvPath, 'utf8');
  // SystemUIKIT.csv 헤더: uiElement,device,screenMode,栏,variantId,notes (no app/scene/state)
  const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true }) as Array<Record<string, string>>;
  return rows.map(r => ({
    app: 'SystemUIKIT', scene: '*', state: '*',
    uiElement: r.uiElement, device: r.device, screenMode: r.screenMode,
    lane: r['栏'], variantId: r.variantId, notes: r.notes ?? '',
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

interface FrameSpec {
  id: string;
  source: { app: string; scene: string; state: string; device: string; screenMode: string };
  frame: { w: number; h: number; cornerRadius: number; fill: TokenEntry };
  statusBar: { variant: string; setKey: string; library: string; x: number; y: number; w: number; h: number };
  layout: {
    type: string;
    lanes: Record<string, { x: number; y: number; w: number; h: number; fill: string }>;
  };
  scenarioFlags: { LEditMode: boolean; NEditMode: boolean; CEditMode: boolean; NCovering: boolean };
  components: ComponentSpec[];
  overlays: OverlaySpec[];
  masks: Array<{ name: string; x: number; y: number; w: number; h: number; cornerRadius?: number; fill: string; opacity: number }>;
  divider?: { x: number; y: number; w: number; h: number; fill: string };
  swipeIndicator: { variant: string; setKey: string; x: number; y: string | number; w: number; fills: never[] };
  zOrder: string[];
}

function buildSpec(opts: {
  app: string; scene: string; state: string; device: string; screenMode: string;
  collapsed?: boolean;
  mapping: MappingRow[]; systemMapping: MappingRow[]; components: Map<string, ComponentMeta>;
}): FrameSpec {
  const { app, scene, state, device, screenMode } = opts;
  const collapsed = !!opts.collapsed;
  const dim = DEVICE_DIMENSIONS[device];
  if (!dim) throw new Error(`unknown device ${device}`);
  const layout = getLayoutSpec(device, screenMode, collapsed);
  const mainH = dim.frameH - dim.statusBarH;

  // lane geometry — POC NLC覆盖 only
  const laneFills: Record<string, string> = { N: 'surface_low', L: 'surface_low', C: 'surface' };
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
    // NL 展开: N(272) + L(frameW-272). C 없음. 笔记: L栏 = surface_low (List 卡片).
    lanes.N = { x: 0, y: dim.statusBarH, w: layout.N!, h: mainH, fill: laneFills.N };
    lanes.L = { x: layout.N!, y: dim.statusBarH, w: layout.L!, h: mainH, fill: laneFills.L };
  } else if (layout.type === 'NL收起') {
    // NL 收起 (笔记 special): N自体消失, L=frameW 풀폭 흡수
    lanes.L = { x: 0, y: dim.statusBarH, w: layout.L!, h: mainH, fill: laneFills.L };
  } else if (layout.type === 'NLC收起') {
    // NLC 收起: N消失. Pad竖=L+C 유지(覆盖 base 회귀), Pad横=L 不变 + C 88 흡수
    lanes.L = { x: 0, y: dim.statusBarH, w: layout.L!, h: mainH, fill: laneFills.L };
    lanes.C = { x: layout.L!, y: dim.statusBarH, w: layout.C!, h: mainH, fill: laneFills.C };
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

  // scenarioFlags 도출 (§0.1b). collapsed 인자가 NCollapsed override.
  const scenarioFlags = deriveScenarioFlags(state, layout.type);
  if (collapsed) scenarioFlags.NCollapsed = true;

  // mapping CSV 의 screenMode 컬럼은 'NL' vs 'NL收起' 분리됨 → collapsed 시 query 변환
  const queryScreenMode = collapsed ? `${screenMode}收起` : screenMode;

  // mapping rows for this scene/state — sub-scene 및 不展示 row 제거
  const SUB_SCENE_ELEMENTS = new Set(['AppSettings', 'RecordNotes', '搜索页面']);
  const baseFilter = (r: MappingRow, st: string) =>
    r.app === app && r.scene === scene && r.state === st &&
    r.device === device && r.screenMode === queryScreenMode &&
    r.uiElement !== 'Overay' &&
    !SUB_SCENE_ELEMENTS.has(r.uiElement) &&
    r.variantId !== '不展示' && r.variantId.trim() !== '';
  const rows = opts.mapping.filter(r => baseFilter(r, state));
  // non-default state: (lane, uiElement) 누락 → 默认 row 에서 inherit
  // (mapping CSV convention: 编辑모드 row 는 default 대비 변경된 element 만 enumerate)
  if (state !== '默认') {
    const presentKeys = new Set(rows.map(r => `${r.lane}|${r.uiElement}`));
    const defaultRows = opts.mapping.filter(r => baseFilter(r, '默认'));
    for (const br of defaultRows) {
      if (!presentKeys.has(`${br.lane}|${br.uiElement}`)) rows.push(br);
    }
  }

  // (lane, uiElement) 단위 그룹 → variant disambiguation
  const groupKey = (r: MappingRow) => `${r.lane}|${r.uiElement}`;
  const groups = new Map<string, MappingRow[]>();
  for (const r of rows) {
    if (!groups.has(groupKey(r))) groups.set(groupKey(r), []);
    groups.get(groupKey(r))!.push(r);
  }
  const pickedRows: MappingRow[] = [];
  for (const candidates of groups.values()) {
    const chosen = pickVariant(candidates, { device, screenMode, flags: scenarioFlags });
    if (chosen) pickedRows.push(chosen);
  }

  // build components + overlays
  const components: ComponentSpec[] = [];
  const overlays: OverlaySpec[] = [];

  // Overay row catalog (uiElement === 'Overay')
  const overayRows = opts.mapping.filter(r =>
    r.app === app && r.scene === scene && r.state === state &&
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
      family, lane: r.lane, variant: r.variantId,
      setKey: setKey?.setKey ?? '',
      library: meta?.libraryName ?? resolveLibrary(family),
      source: 'Overay-row',
    });
  }

  for (const r of pickedRows) {
    const laneKey = r.lane.replace('栏', '').trim() as 'N' | 'L' | 'C' | '全';
    if (laneKey === '全') continue; // overlay/full-frame, separate
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
    // out-of-flow → overlays catalog 으로 이동 (Phase 3 에서 시나리오 별 visible 결정)
    if (category === 'out-of-flow') {
      overlays.push({
        trigger: r.notes ?? '',
        family, lane: r.lane, variant: r.variantId,
        setKey: setKey.setKey, library: lib,
        source: 'out-of-flow',
      });
      continue;
    }

    components.push({
      element: r.uiElement, lane: r.lane, variant: r.variantId,
      setKey: setKey.setKey, library: lib, category,
      x: 0, w: lane.w,
      // y / h need ordering rules per §0.1 #4 — POC simplified: vertical stack inside lane
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
    C: ['NavigationBar', 'DetailNotes', 'TextInput', 'Input'],
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
      // Sidebar (NLC覆盖): frame 직속, lane 내부 stack 에서 분리. y=0 (lane 기준), h=mainH 풀높이.
      // §3.7 zOrder 에서 'Sidebar' 가 별도 레이어로 잡혀 있어 좌표만 absolute 로 정리.
      if (c.element === 'Sidebar') {
        c.y = 0;
        c.h = mainH;
        continue;
      }
      // C 栏 DetailNotes special: y=62, h=mainH-62
      if (lk === 'C' && (c.element === 'DetailNotes')) {
        c.y = 62;
        c.h = mainH - 62;
        continue;
      }
      // C 栏 Input bottom flush
      if (lk === 'C' && c.element === 'Input') {
        const inputH = 92; // TextInput_Notes 자연 H
        c.y = mainH - inputH;
        c.h = inputH;
        continue;
      }
      // L 栏 ToolBar bottom-attached
      if (lk === 'L' && c.element === 'ToolBar') {
        c.y = mainH - 100;
        c.h = 100;
        continue;
      }
      // TopBar_X (NL framework SearchBar slot) 는 NavBar+SearchBar 합성 → 112dp
      const h = c.variant.startsWith('TopBar_') ? 112 : (heightByElement[c.element] ?? 56);
      c.y = y;
      c.h = h;
      y += h;
    }
  }

  // masks (common-rules §3.7 / §3.7a / §3.7a-NL)
  const masks: FrameSpec['masks'] = [];
  const isNLC = layout.type.startsWith('NLC'); // NLC覆盖 / NLC并列 / NLC收起 모두 C 栏 보유
  // §3.7a: LEditMode + NLC framework → 遮罩-编辑 (C 栏 dim, frameH 풀높이, 状态栏 위)
  // §3.7a-NL: NL framework + LEditMode → mask 不渲染 (skip)
  if (scenarioFlags.LEditMode && isNLC && lanes.C) {
    masks.push({
      name: '遮罩-编辑',
      x: lanes.C.x, y: 0, w: lanes.C.w, h: dim.frameH,
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

  // divider (NLC framework: 1 줄 at L|C boundary)
  const divider = isNLC && lanes.C
    ? { x: lanes.C.x, y: 0, w: 1, h: dim.frameH, fill: 'outline' }
    : undefined;

  // zOrder per common-rules §3.7 / §3.7a / §3.7b
  let zOrder: string[];
  if (isNLC && scenarioFlags.NCovering && scenarioFlags.LEditMode) {
    // §3.7b: 多 mask 叠加 (LEditMode + NCovering)
    zOrder = ['main', '状态栏', '遮罩-编辑', '分割线', 'L栏', '遮罩-N覆盖', 'Sidebar', '杆子'];
  } else if (scenarioFlags.NCovering) {
    zOrder = ['main', '状态栏', '遮罩-N覆盖', '分割线', 'Sidebar', '杆子'];
  } else if (isNLC && scenarioFlags.LEditMode) {
    // §3.7a: L 栏 frame 직속 promote
    zOrder = ['main', '状态栏', '遮罩-编辑', '分割线', 'L栏', '杆子'];
  } else {
    zOrder = ['main', '状态栏', '分割线', 'Sidebar', '杆子'];
  }

  return {
    id: `${app}_${scene}_${state}_${device}_${layout.type}`,
    source: { app, scene, state, device, screenMode },
    frame: {
      w: dim.frameW, h: dim.frameH, cornerRadius: dim.cornerRadius,
      fill: NOTES_TOKENS.surface_low,
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

function main() {
  console.log('csv-to-spec.ts (Stage 3A POC) — 笔记 NLC 默认');

  const mapping = loadMapping('Notes');
  const systemMapping = loadSystemMapping();
  const components = loadComponents();

  console.log(`  loaded: app-Notes-mapping.csv ${mapping.length} rows`);
  console.log(`  loaded: SystemUIKIT-mapping.csv ${systemMapping.length} rows`);
  console.log(`  loaded: components.csv ${components.size} variants`);

  fs.mkdirSync(SPEC_OUT, { recursive: true });

  const targets: Array<{ scene: string; device: string; screenMode: string; collapsed?: boolean }> = [
    { scene: 'NLC', device: 'Pad竖', screenMode: 'NLC' },
    { scene: 'NLC', device: 'Pad横', screenMode: 'NLC' },
    { scene: 'NL',  device: 'Pad竖', screenMode: 'NL' },
    { scene: 'NL',  device: 'Pad横', screenMode: 'NL' },
    { scene: 'NL',  device: 'Pad竖', screenMode: 'NL', collapsed: true },
    { scene: 'NL',  device: 'Pad横', screenMode: 'NL', collapsed: true },
  ];
  // 编辑모드 frames (state="编辑模式", LEditMode=true)
  const editTargets: Array<{ scene: string; device: string; screenMode: string; collapsed?: boolean }> = [
    { scene: 'NLC', device: 'Pad竖', screenMode: 'NLC' },
    { scene: 'NLC', device: 'Pad横', screenMode: 'NLC' },
    { scene: 'NL',  device: 'Pad竖', screenMode: 'NL' },
    { scene: 'NL',  device: 'Pad横', screenMode: 'NL' },
  ];

  const allTargets = [
    ...targets.map(t => ({ ...t, state: '默认' })),
    ...editTargets.map(t => ({ ...t, state: '编辑模式' })),
  ];

  for (const { scene, device, screenMode, collapsed, state } of allTargets) {
    const spec = buildSpec({
      app: 'Notes', scene, state, device, screenMode, collapsed,
      mapping, systemMapping, components,
    });
    const outPath = path.join(SPEC_OUT, `${spec.id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(spec, null, 2), 'utf8');
    console.log(`✓ ${outPath}`);
    console.log(`  components: ${spec.components.length}, overlays: ${spec.overlays.length}, masks: ${spec.masks.length}, zOrder: ${spec.zOrder.length} layers`);
  }
}

main();
