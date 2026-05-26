/**
 * extract-mapping.ts — Stage 1A core
 *
 * Inputs (per-team designer ownership):
 *   mapping-input/结构变化表-{App}.csv × N  (3-level header per file)
 *     e.g., 结构变化表-Notes.csv (笔记+待办), 结构变化表-Phone.csv, etc.
 *   mapping-input/控件变体清单.csv (variant metadata)
 *
 * Outputs:
 *   mappings/SystemUIKIT-mapping.csv           — Tier 1 (SystemUIKIT)
 *   mappings/app-{App}-mapping.csv  — Tier 2 (per app)
 *   mappings/components.csv         — variant metadata
 *   mapping-output/extract-report.md      — warnings, stats, diff vs legacy
 *   mappings/.last-extract          — mtime sentinel
 *
 * Decisions: see Improvement_doc/extract-mapping-design-ko.md §已确定决议
 */
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'mapping-input');
// Per-team mapping files: 结构变化表-{App}.csv (e.g., 结构变化表-Notes.csv)
const SRC_PATTERN = /^结构变化表-([A-Za-z0-9_]+)\.csv$/;
const SRC_VARIANTS = path.join(ROOT, 'mapping-input', '控件变体清单.csv');
const LEGACY_CSV = path.join(ROOT, 'legacy', 'app-mapping-stage1a.csv');
const OUT_DIR = path.join(ROOT, 'mapping-output');

// ─────────────────────────────────────────────────────────────────────────────
// 28-column header mapping (decisions §3, §5)
// ─────────────────────────────────────────────────────────────────────────────
type ColSpec = { device: string; screenMode: string };
const COLUMN_MAP: (ColSpec | null)[] = [
  null, // 0: app section
  null, // 1: uiElement
  { device: '手机竖', screenMode: '' }, // 2
  { device: '手机横', screenMode: '' }, // 3
  { device: 'Fold外竖', screenMode: '' }, // 4
  { device: 'Fold外横', screenMode: '' }, // 5
  { device: 'Fold内竖', screenMode: 'NC' }, // 6
  { device: 'Fold内竖', screenMode: 'LC' }, // 7
  { device: 'Fold内竖', screenMode: 'C' }, // 8
  { device: 'Fold内横', screenMode: 'NC' }, // 9
  { device: 'Fold内横', screenMode: 'LC' }, // 10
  { device: 'Fold内横', screenMode: 'C' }, // 11
  { device: 'Pad竖', screenMode: 'NLC' }, // 12
  { device: 'Pad竖', screenMode: 'NLC收起' }, // 13
  { device: 'Pad竖', screenMode: 'NL' }, // 14
  { device: 'Pad竖', screenMode: 'NL收起' }, // 15
  { device: 'Pad竖', screenMode: 'NC' }, // 16
  { device: 'Pad竖', screenMode: 'NC收起' }, // 17
  { device: 'Pad竖', screenMode: 'LC' }, // 18
  { device: 'Pad竖', screenMode: 'C' }, // 19
  { device: 'Pad横', screenMode: 'NLC' }, // 20
  { device: 'Pad横', screenMode: 'NLC收起' }, // 21
  { device: 'Pad横', screenMode: 'NL' }, // 22
  { device: 'Pad横', screenMode: 'NL收起' }, // 23
  { device: 'Pad横', screenMode: 'NC' }, // 24
  { device: 'Pad横', screenMode: 'NC收起' }, // 25
  { device: 'Pad横', screenMode: 'LC' }, // 26
  { device: 'Pad横', screenMode: 'C' }, // 27
];

// ─────────────────────────────────────────────────────────────────────────────
// Decision §1: app naming = EN-only + CamelCase
// ─────────────────────────────────────────────────────────────────────────────
// Known app registry (Decision §1) — CN name → canonical EN app name
const APP_REGISTRY: { cn: string; en: string }[] = [
  { cn: '系统控件', en: 'SystemUIKIT' },
  { cn: '文件管理', en: 'FileManager' },
  { cn: '笔记', en: 'Notes' },
  { cn: '待办', en: 'Tasks' },
  { cn: '录音', en: 'Recorder' },
  { cn: '计算器', en: 'Calculator' },
  { cn: '日历', en: 'Calendar' },
  { cn: '时钟', en: 'Clocks' },
  { cn: '指南针', en: 'Compass' },
  { cn: '设置', en: 'Settings' },
  { cn: '电话', en: 'Phone' },
  { cn: '联系人', en: 'Contacts' },
  { cn: '短信', en: 'Messaging' },
  { cn: '下载管理', en: 'Downloads' },
  { cn: '小米换机', en: 'MiMover' },
  { cn: '天气', en: 'Weather' },
  { cn: '相册', en: 'Gallery' },
  { cn: '手机管家', en: 'Security' },
];

function normalizeAppName(raw: string): { app: string; subState: string } {
  // Match by registry: find which known CN or EN app name appears in the string.
  const trimmed = raw.trim().replace(/[\r\n]+/g, ' ');
  let matched: typeof APP_REGISTRY[0] | undefined;
  for (const entry of APP_REGISTRY) {
    if (trimmed.includes(entry.cn) || new RegExp(`\\b${entry.en}\\b`).test(trimmed)) {
      matched = entry;
      break;
    }
  }
  if (!matched) {
    // Unknown app — fallback to trailing English
    const fallback = trimmed.match(/[A-Z][A-Za-z0-9 ]*$/);
    const app = fallback ? fallback[0].trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') : trimmed.replace(/\s+/g, '');
    return { app, subState: '' };
  }
  // Strip the app's CN and EN names from the string; remainder is sub-state
  let remainder = trimmed
    .replace(new RegExp(matched.cn, 'g'), '')
    .replace(new RegExp(`\\b${matched.en}\\b`, 'gi'), '')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/^\s*\/\s*|\s*\/\s*$/g, '')
    .trim();
  // Collapse multiple slashes
  remainder = remainder.split(/\s*\/\s*/).map(s => s.trim()).filter(Boolean).join(' / ');
  return { app: matched.en, subState: remainder };
}

// ─────────────────────────────────────────────────────────────────────────────
// Decision §2: uiElement naming = EN-only
// ─────────────────────────────────────────────────────────────────────────────
function extractEnglishName(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/[A-Za-z][A-Za-z0-9_ ]*$/);
  if (!match) return trimmed.replace(/\s+/g, '');
  return match[0].trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// uiElement parse (Step 2): col 1 patterns
// ─────────────────────────────────────────────────────────────────────────────
const SCENE_KEYWORDS = new Set(['NLC', 'NL', 'NC', 'LC', 'C']);
const STATE_KEYWORDS: Record<string, string> = {
  '编辑模式': '编辑模式',
  'Edit Mode': '编辑模式',
  '详情': '详情',
  'NoteDetail': '详情',
  'DetailNotes': '详情',
  '录音': '录音',
  '思维导图': '思维导图',
  '思维导图编辑': '思维导图编辑',
  'MindMap_Edit': '思维导图编辑',
  '秘密笔记': '秘密笔记',
  '秘密笔记宫格': '秘密笔记宫格',
  '搜索激活': '搜索激活',
  '文字格式': '文字格式',
  'Notes_Outline': 'Notes_Outline',
  'NoteEditPanel': 'NoteEditPanel',
};

interface UiElementParse {
  uiElement: string;
  state: string;
  sceneCondition: string; // restrict to specific scene; "" = all scenes
  multiCandidates: string[]; // when row has multi-element header (Step 3 will pick)
  rawNotes: string[];
}

function parseUiElement(rawCol1: string): UiElementParse {
  const result: UiElementParse = {
    uiElement: '',
    state: '默认',
    sceneCondition: '',
    multiCandidates: [],
    rawNotes: [],
  };
  const trimmed = rawCol1.trim();
  if (!trimmed) return result;

  // Multi-component header: contains newline, no `/`
  if (/[\r\n]/.test(trimmed) && !trimmed.includes('/')) {
    const parts = trimmed.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);
    result.multiCandidates = parts.map(extractEnglishName);
    return result;
  }

  // Has `/` separator → uiElement / [state] / [scene]
  const tokens = trimmed.split('/').map(s => s.trim()).filter(Boolean);
  // First token is always uiElement
  const firstTok = tokens[0].split(/[\r\n]+/).join(' ').trim();
  if (firstTok.includes('\n') || /[\r\n]/.test(tokens[0])) {
    // multi-element with `/` after = unusual; treat first lines as multi
    const lines = tokens[0].split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);
    result.multiCandidates = lines.map(extractEnglishName);
  } else {
    result.uiElement = extractEnglishName(firstTok);
  }

  // Remaining tokens → match scene or state
  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i].trim();
    if (SCENE_KEYWORDS.has(tok)) {
      result.sceneCondition = tok;
    } else {
      // Try state keyword match (longest prefix wins)
      let matched = '';
      for (const key of Object.keys(STATE_KEYWORDS)) {
        if (tok.includes(key) && key.length > matched.length) {
          matched = key;
        }
      }
      if (matched) {
        result.state = STATE_KEYWORDS[matched];
      } else {
        result.rawNotes.push(tok);
      }
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cell explode (Step 3) + Variant clean (Step 4)
// ─────────────────────────────────────────────────────────────────────────────
// Match both upper- and lowercase lane prefix (e.g. "l栏" typo).
// Allows optional whitespace between letter and 栏 (e.g. "C 栏").
const LANE_PREFIX = /^([NnLlCc全]\s*栏|[NnLlCc])\s*[：:]\s*/;
const LANE_NORMALIZE: Record<string, string> = {
  'N': 'N栏', 'L': 'L栏', 'C': 'C栏',
  'n': 'N栏', 'l': 'L栏', 'c': 'C栏',
  'N栏': 'N栏', 'L栏': 'L栏', 'C栏': 'C栏', '全栏': '全栏',
  'n栏': 'N栏', 'l栏': 'L栏', 'c栏': 'C栏',
};

interface CellEntry {
  lane: string; // N栏 / L栏 / C栏 / 全栏
  variantId: string;
  notes: string;
}

const NON_RENDER_KEYWORDS = ['不显示', '不存在', '不渲染', '无导航栏', '隐藏', '不存在'];
const PLACEHOLDER_KEYWORDS = ['via search', '查询', 'TBD'];

function explodeCell(rawCell: string): { entries: CellEntry[]; warnings: string[] } {
  const warnings: string[] = [];
  const entries: CellEntry[] = [];
  const text = rawCell.trim();
  if (!text) return { entries, warnings };

  // Split by blank line first (separates lane groups)
  const blocks = text.split(/\n\s*\n+/).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    // Check if block starts with lane prefix
    let currentLane = '全栏';
    let body = block;

    const laneMatch = block.match(LANE_PREFIX);
    if (laneMatch) {
      // Strip whitespace from "C 栏" → "C栏" before normalization lookup
      const laneKey = laneMatch[1].replace(/\s+/g, '');
      currentLane = LANE_NORMALIZE[laneKey] ?? laneKey;
      body = block.slice(laneMatch[0].length).trim();
    }

    // Within a block, lines are typically:
    //   variant
    //   variant
    //   description (no underscore prefix → notes)
    const lines = body.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // Multi-line lane prefix: first line is bare lane (e.g., "L栏", "C 栏") and second line is variant
    // Pattern: ^[NLC全] (optional space) 栏 $
    const firstLine0 = lines[0];
    if (/^[NnLlCc全]\s*栏$/.test(firstLine0) && lines.length >= 2) {
      const lane = firstLine0.replace(/\s+/g, '');
      currentLane = LANE_NORMALIZE[lane] ?? lane;
      lines.shift(); // consume the lane line
    }

    // First line is variantId (or possibly multi-variant comma-separated)
    const firstLine = lines[0];
    const restLines = lines.slice(1);

    // Framework-reuse placeholder: "LC栏" / "NC栏" / "NLC栏" / "全栏" alone (no colon, no underscore)
    // (Demoted from warning to silent — this is a documented expected pattern)
    if (/^[NLC全]+栏$/.test(firstLine.trim()) && restLines.length === 0) {
      entries.push({
        lane: currentLane,
        variantId: '(framework_reuse)',
        notes: `使用 ${firstLine.trim()} 框架`,
      });
      continue;
    }

    // Variant clean: strip trailing colons, descriptions
    const cleanedFirst = firstLine.replace(/[：:]\s*$/, '').trim();

    // Detect "variantId 描述" patterns
    //   "Fab_01：彩色"            → variantId=Fab_01,                    notes=彩色   (clean)
    //   "TopBar_05 标题栏"        → variantId=TopBar_05,                 notes=标题栏 (clean)
    //   "NavigationBar_ComponentSet_04 搜索图标" → vid=...04, notes=搜索图标   (clean)
    //   "ToolBar_xx 1. desc 2. desc" → suspicious, warn
    const noteParts: string[] = [];
    let variantId = cleanedFirst;
    let cleanExtraction = false;

    // Pattern: well-formed variantId (letters_digits or letters_word_digits) + optional separator + Chinese-or-rest
    // Stricter regex: variantId must end with _<alnum> to be considered well-formed
    const wellFormedMatch = cleanedFirst.match(/^([A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+)\s*[：:]?\s*(.+)$/);
    if (wellFormedMatch && /[一-鿿]/.test(wellFormedMatch[2])) {
      variantId = wellFormedMatch[1];
      noteParts.push(wellFormedMatch[2].trim());
      cleanExtraction = true;
    } else {
      // Fallback: looser regex (catches edge cases but warns)
      const looseMatch = cleanedFirst.match(/^([A-Za-z][A-Za-z0-9_]*)\s*[：:]?\s*(.+)$/);
      if (looseMatch && /[一-鿿]/.test(looseMatch[2])) {
        variantId = looseMatch[1];
        noteParts.push(looseMatch[2].trim());
        warnings.push(`unclean variantId+desc split: "${cleanedFirst}"`);
      }
    }

    // Non-render keywords
    if (NON_RENDER_KEYWORDS.some(k => variantId.includes(k))) {
      entries.push({ lane: currentLane, variantId: '_00', notes: '不渲染' });
      continue;
    }

    // Placeholder
    if (PLACEHOLDER_KEYWORDS.some(k => variantId.includes(k))) {
      noteParts.push('需 Phase 4.5 search');
      warnings.push(`placeholder in cell: "${variantId}"`);
    }

    if (restLines.length > 0) {
      const restJoined = restLines.join(' / ');
      noteParts.push(restJoined);
      // Only warn if rest content looks like another variant (has underscore + digit pattern)
      // Pure-description rest (Chinese only or no _\d pattern) is expected
      if (/[A-Za-z]+_\d/.test(restJoined)) {
        warnings.push(`multi-line cell suspicious extra content: "${restJoined}"`);
      }
    }

    void cleanExtraction; // marker variable, may be useful for future tuning

    if (!variantId) continue;
    entries.push({ lane: currentLane, variantId, notes: noteParts.join('; ') });
  }

  return { entries, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-component disambiguation (Decision §4)
// ─────────────────────────────────────────────────────────────────────────────
// Order matters: more-specific rules first.
const COMPONENT_INFER_RULES: { pattern: RegExp; uiElement: string }[] = [
  { pattern: /^Sidebar/i, uiElement: 'Sidebar' },
  { pattern: /^TopBar/i, uiElement: 'TopBar' },
  { pattern: /^BottomBar/i, uiElement: 'BottomBar' },
  { pattern: /^Fab/i, uiElement: 'Fab' },
  { pattern: /^NavigationBar/i, uiElement: 'NavigationBar' },
  { pattern: /^SearchBar/i, uiElement: 'SearchBar' },
  { pattern: /^SearchReceiving/i, uiElement: 'SearchReceiving' },
  { pattern: /^StatusBar/i, uiElement: 'StatusBar' },
  { pattern: /^SwipeIndicator/i, uiElement: 'SwipeIndicator' },
  { pattern: /^Keyboard/i, uiElement: 'Keyboard' },
  { pattern: /^List_Notes/i, uiElement: 'List_Notes' },
  { pattern: /^List_Task/i, uiElement: 'List_Task' },
  { pattern: /^List_/i, uiElement: 'List' },
  { pattern: /^DetailNotes|^Detail_Notes/i, uiElement: 'DetailNotes' },
  { pattern: /^DetailTask|^Detail_Task/i, uiElement: 'DetailTask' },
  { pattern: /^Detail/i, uiElement: 'Detail' },
  { pattern: /^TextInput/i, uiElement: 'TextInput' },
  { pattern: /^TextFormatPanel/i, uiElement: 'TextFormatPanel' },
  { pattern: /^Menu/i, uiElement: 'Menu' },
  { pattern: /^Actionsheet/i, uiElement: 'Actionsheet' },
  { pattern: /^AlertDialog/i, uiElement: 'AlertDialog' },
  { pattern: /^WheelPicker|^Picker/i, uiElement: 'Picker' },
  { pattern: /^SegmentedControls/i, uiElement: 'SegmentedControls' },
  { pattern: /^FloatingWindow/i, uiElement: 'FloatingWindow' },
  { pattern: /^DrawerWindow/i, uiElement: 'DrawerWindow' },
  { pattern: /^NoticeBar/i, uiElement: 'NoticeBar' },
  { pattern: /^SelectableChip/i, uiElement: 'SelectableChip' },
  { pattern: /^Scrollbar/i, uiElement: 'Scrollbar' },
  { pattern: /^ToolBar/i, uiElement: 'ToolBar' },
  { pattern: /^RecordNotes/i, uiElement: 'RecordNotes' },
  { pattern: /^AIWindow/i, uiElement: 'AIWindow' },
  { pattern: /^NewTaskWindow/i, uiElement: 'NewTaskWindow' },
];

function inferUiElement(variantId: string, candidates: string[]): { ui: string; warn?: string } {
  // Pass 1: rule matches AND uiElement is in candidates list
  for (const rule of COMPONENT_INFER_RULES) {
    if (rule.pattern.test(variantId) && candidates.includes(rule.uiElement)) {
      return { ui: rule.uiElement };
    }
  }
  // Pass 2: rule matches even without candidate confirmation (header may have abbreviated names)
  for (const rule of COMPONENT_INFER_RULES) {
    if (rule.pattern.test(variantId)) {
      return { ui: rule.uiElement };
    }
  }
  // Special placeholders — uiElement is irrelevant since they don't render or are framework references
  if (variantId === '_00' || variantId === '(framework_reuse)' || variantId.startsWith('(')) {
    return { ui: candidates[0] ?? '(unknown)' };
  }
  // Fallback: first candidate (warn)
  return { ui: candidates[0] ?? '', warn: `multi-element header, no rule match for "${variantId}"; defaulted to ${candidates[0]}` };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main processing of 结构变化表-{App}.csv (per-app split files)
// ─────────────────────────────────────────────────────────────────────────────
interface OutRow {
  app: string;
  scene: string;
  state: string;
  uiElement: string;
  device: string;
  screenMode: string;
  lane: string;
  variantId: string;
  notes: string;
  // metadata for diagnostics
  _sourceRow: number;
}

interface Warning {
  row: number;
  message: string;
}

function discoverInputFiles(): { file: string; team: string }[] {
  const files: { file: string; team: string }[] = [];
  for (const name of fs.readdirSync(SRC_DIR)) {
    const m = name.match(SRC_PATTERN);
    if (m) files.push({ file: path.join(SRC_DIR, name), team: m[1] });
  }
  return files.sort((a, b) => a.team.localeCompare(b.team));
}

function processTotal(): { rows: OutRow[]; warnings: Warning[]; stats: Record<string, number>; teamFiles: number } {
  const inputs = discoverInputFiles();
  if (inputs.length === 0) {
    throw new Error(`No 结构变化表-*.csv files in ${SRC_DIR}`);
  }

  const rows: OutRow[] = [];
  const warnings: Warning[] = [];
  const stats = { totalSourceRows: 0, emittedRows: 0, skippedEmptyRows: 0 };
  let canonicalHeader = ''; // detect header drift across files

  for (const input of inputs) {
    const raw = fs.readFileSync(input.file, 'utf8');
    const records: string[][] = parse(raw, { relax_quotes: true, relax_column_count: true, skip_empty_lines: false });
    if (records.length < 4) {
      warnings.push({ row: 0, message: `${path.basename(input.file)}: <4 rows; skipped` });
      continue;
    }
    // Header consistency check (concatenate first 3 rows)
    const headerSig = records.slice(0, 3).map(r => r.join('|')).join('\n');
    if (!canonicalHeader) {
      canonicalHeader = headerSig;
    } else if (canonicalHeader !== headerSig) {
      warnings.push({ row: 0, message: `${path.basename(input.file)}: header差异 vs canonical — 检查 3-level header 是否一致` });
    }

    processRecords(records, rows, warnings, stats, input.file);
  }

  return { rows, warnings, stats, teamFiles: inputs.length };
}

function processRecords(
  records: string[][],
  rows: OutRow[],
  warnings: Warning[],
  stats: Record<string, number>,
  fileLabel: string,
): void {
  const fileBase = path.basename(fileLabel);

  let currentApp = '';
  let currentSubState = '';
  let stickyElemParse: UiElementParse | null = null;
  // Skip 3 header rows (rows 0, 1, 2). Data begins at row 3 (index 3, line 4).
  for (let r = 3; r < records.length; r++) {
    const row = records[r];
    if (!row || row.every(c => !c?.trim())) {
      stats.skippedEmptyRows++;
      continue;
    }
    stats.totalSourceRows++;

    // Step 1: App resolve
    const col0 = (row[0] ?? '').trim();
    if (col0) {
      const parsed = normalizeAppName(col0);
      currentApp = parsed.app;
      currentSubState = parsed.subState;
      stickyElemParse = null; // new app section resets sticky element
    }
    if (!currentApp) {
      warnings.push({ row: r + 1, message: `${fileBase}: No app context; row skipped` });
      continue;
    }

    // Step 2: uiElement parse — empty col1 inherits previous (sticky)
    const col1 = row[1] ?? '';
    let elemParse: UiElementParse;
    if (col1.trim()) {
      elemParse = parseUiElement(col1);
      stickyElemParse = elemParse;
    } else if (stickyElemParse) {
      elemParse = stickyElemParse;
    } else {
      elemParse = parseUiElement('');
    }

    // For each data column 2..27
    for (let c = 2; c < COLUMN_MAP.length; c++) {
      const spec = COLUMN_MAP[c];
      if (!spec) continue;
      const cell = row[c] ?? '';
      const { entries, warnings: cellWarns } = explodeCell(cell);
      for (const w of cellWarns) {
        warnings.push({ row: r + 1, message: `${fileBase} col ${c} (${spec.device}/${spec.screenMode}): ${w}` });
      }
      for (const ent of entries) {
        // Determine uiElement (handle multi-candidate)
        let ui = elemParse.uiElement;
        if (!ui && elemParse.multiCandidates.length > 0) {
          const infer = inferUiElement(ent.variantId, elemParse.multiCandidates);
          ui = infer.ui;
          if (infer.warn) warnings.push({ row: r + 1, message: `${fileBase} col ${c}: ${infer.warn}` });
        }
        if (!ui) {
          warnings.push({ row: r + 1, message: `${fileBase} col ${c}: no uiElement determined for "${ent.variantId}"` });
          ui = '(unknown)';
        }

        // Apply sceneCondition: if uiElement parse said "only for scene X" but current screenMode is X variant or device generic
        // For now, sceneCondition is preserved in scene field if set; otherwise "default" meaning rule applies broadly.
        const scene = elemParse.sceneCondition || inferSceneFromScreenMode(spec.screenMode, spec.device);

        const noteCombined = [ent.notes, ...elemParse.rawNotes].filter(Boolean).join('; ');

        // State priority: col 1 explicit > app subState > 默认
        const finalState = elemParse.state !== '默认' ? elemParse.state : (currentSubState || '默认');
        rows.push({
          app: currentApp,
          scene,
          state: finalState,
          uiElement: ui,
          device: spec.device,
          screenMode: spec.screenMode,
          lane: ent.lane,
          variantId: ent.variantId,
          notes: noteCombined,
          _sourceRow: r + 1,
        });
        stats.emittedRows++;
      }
    }
  }
}

function inferSceneFromScreenMode(sm: string, device: string): string {
  // For Pad/Fold内 with screenMode value, scene equals screenMode base
  if (!sm) {
    // Phone / Fold外: scene defaults to NLC (the "natural" scene framework)
    return 'NLC';
  }
  // Strip 收起 suffix: NLC收起 → NLC
  return sm.replace(/收起$/, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// 控件变体清单.csv → components.csv
// ─────────────────────────────────────────────────────────────────────────────
interface ComponentMeta {
  componentFamily: string;
  variantId: string;
  variantName: string;
  libraryName: string;
  internalPadL: string;
  internalPadR: string;
  titleLeftPad: string;
  naturalW: string;
  naturalH: string;
  note: string;
}

// family → library mapping per common-rules §0.5.1.
// App-prefix families live in 业务组件库; everything else in OS4 UI Kit.
// HyperOS4 Design Token Lib is a token-only library and contains no ComponentSets.
const APP_PREFIX_RE = /^(Notes|Calendar|Settings|Weather|Recorder)_/;
function resolveLibrary(componentFamily: string): string {
  return APP_PREFIX_RE.test(componentFamily) ? '业务组件库' : 'OS4 UI Kit';
}

function processVariants(): ComponentMeta[] {
  const raw = fs.readFileSync(SRC_VARIANTS, 'utf8');
  const records: string[][] = parse(raw, { relax_quotes: true, relax_column_count: true, skip_empty_lines: false });
  const out: ComponentMeta[] = [];

  for (let r = 1; r < records.length; r++) {
    const row = records[r];
    if (!row) continue;
    const variantName = (row[1] ?? '').trim();
    const componentFamily = (row[2] ?? '').trim();
    const variantId = (row[3] ?? '').trim();
    const space = (row[4] ?? '').trim();

    if (!variantId) continue; // skip family-header-only rows

    // Parse Space: "左12，右12\n标题左侧：28"
    const padL = (space.match(/左\s*(\d+)/) ?? [])[1] ?? '';
    const padR = (space.match(/右\s*(\d+)/) ?? [])[1] ?? '';
    const titleLeft = (space.match(/标题左侧[：:]\s*(\d+)/) ?? [])[1] ?? '';

    out.push({
      componentFamily,
      variantId,
      variantName,
      libraryName: resolveLibrary(componentFamily),
      internalPadL: padL,
      internalPadR: padR,
      titleLeftPad: titleLeft,
      naturalW: '',
      naturalH: '',
      note: space.replace(/[\r\n]+/g, ' / '),
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Diff vs legacy app-mapping-stage1a.csv
// ─────────────────────────────────────────────────────────────────────────────
interface DiffReport {
  legacyTotal: number;
  newOnly: number;
  legacyOnly: number;
  matched: number;
  examples: { newOnly: string[]; legacyOnly: string[] };
}

// Normalize legacy device naming → new 8-device convention.
// legacy uses: PHONE_竖屏, FOLD_外屏 + screenMode 竖屏, FOLD_内屏竖屏, PAD_竖屏, ...
function normalizeLegacyDevice(legacyDevice: string, legacyScreenMode: string): { device: string; screenMode: string } {
  const d = legacyDevice.trim();
  let sm = legacyScreenMode.trim();

  // PHONE_竖屏 / PHONE_横屏 → 手机竖 / 手机横
  if (d === 'PHONE_竖屏') return { device: '手机竖', screenMode: '' };
  if (d === 'PHONE_横屏') return { device: '手机横', screenMode: '' };

  // FOLD_外屏 with screenMode 竖屏/横屏 (split form)
  if (d === 'FOLD_外屏') {
    if (sm === '竖屏') return { device: 'Fold外竖', screenMode: '' };
    if (sm === '横屏') return { device: 'Fold外横', screenMode: '' };
    return { device: 'Fold外竖', screenMode: '' }; // fallback
  }

  // FOLD_内屏竖屏 / FOLD_内屏横屏 (combined form)
  if (d === 'FOLD_内屏竖屏') return { device: 'Fold内竖', screenMode: sm };
  if (d === 'FOLD_内屏横屏') return { device: 'Fold内横', screenMode: sm };

  // PAD_竖屏 / PAD_横屏
  if (d === 'PAD_竖屏') return { device: 'Pad竖', screenMode: sm };
  if (d === 'PAD_横屏') return { device: 'Pad横', screenMode: sm };

  // Already in new format or unrecognized — pass through
  return { device: d, screenMode: sm };
}

// Normalize legacy uiElement: "标题栏 NavigationBar" → "NavigationBar"; also strip sub-scene path "/ NLC" etc.
function normalizeLegacyUiElement(raw: string): string {
  // Take first segment before "/"
  const firstSeg = raw.split('/')[0].trim();
  // Extract trailing English word(s)
  const m = firstSeg.match(/[A-Za-z][A-Za-z0-9_]*(?:\s+[A-Za-z][A-Za-z0-9_]*)*\s*$/);
  if (!m) return firstSeg;
  // CamelCase合并
  return m[0].trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

// Normalize legacy lane: "L栏" stays, but lowercase "l栏" → "L栏"
function normalizeLegacyLane(raw: string): string {
  const t = raw.trim();
  return LANE_NORMALIZE[t] ?? LANE_NORMALIZE[t.toUpperCase()] ?? t;
}

function diffVsLegacy(newRows: OutRow[]): DiffReport | null {
  if (!fs.existsSync(LEGACY_CSV)) return null;
  const raw = fs.readFileSync(LEGACY_CSV, 'utf8');
  const records: string[][] = parse(raw, { relax_quotes: true, relax_column_count: true, skip_empty_lines: false, columns: false });
  // legacy header: app,scene,state,uiElement,device,screenMode,栏,variantId,setKey,notes
  const legacyKeys = new Set<string>();
  for (let i = 1; i < records.length; i++) {
    const row = records[i];
    if (!row || row.length < 8) continue;
    const app = normalizeAppName((row[0] ?? '').trim()).app;
    const uiElement = normalizeLegacyUiElement((row[3] ?? '').trim());
    const { device, screenMode } = normalizeLegacyDevice((row[4] ?? '').trim(), (row[5] ?? '').trim());
    const lane = normalizeLegacyLane((row[6] ?? '').trim());
    const variantId = (row[7] ?? '').trim();
    if (!variantId) continue;
    const key = `${app}|${uiElement}|${device}|${screenMode}|${lane}|${variantId}`;
    legacyKeys.add(key);
  }
  const newKeys = new Set<string>();
  for (const r of newRows) {
    newKeys.add(`${r.app}|${r.uiElement}|${r.device}|${r.screenMode}|${r.lane}|${r.variantId}`);
  }

  const newOnly = [...newKeys].filter(k => !legacyKeys.has(k));
  const legacyOnly = [...legacyKeys].filter(k => !newKeys.has(k));
  const matched = [...newKeys].filter(k => legacyKeys.has(k)).length;

  return {
    legacyTotal: legacyKeys.size,
    newOnly: newOnly.length,
    legacyOnly: legacyOnly.length,
    matched,
    examples: {
      newOnly: newOnly.slice(0, 20),
      legacyOnly: legacyOnly.slice(0, 20),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Output writers
// ─────────────────────────────────────────────────────────────────────────────
function writeMappings(rows: OutRow[]): { defaults: number; appCounts: Record<string, number> } {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Clean stale app-*.csv files (apps removed/renamed across extractions leave orphans)
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.startsWith('app-') && f.endsWith('-mapping.csv')) {
      fs.unlinkSync(path.join(OUT_DIR, f));
    }
  }

  const defaultsRows = rows.filter(r => r.app === 'SystemUIKIT');
  const tier2Rows = rows.filter(r => r.app !== 'SystemUIKIT');

  // SystemUIKIT-mapping.csv
  const defaultsCsv = stringify([
    ['uiElement', 'device', 'screenMode', '栏', 'variantId', 'notes'],
    ...defaultsRows.map(r => [r.uiElement, r.device, r.screenMode, r.lane, r.variantId, r.notes]),
  ]);
  fs.writeFileSync(path.join(OUT_DIR, 'SystemUIKIT-mapping.csv'), defaultsCsv);

  // group by app
  const byApp: Record<string, OutRow[]> = {};
  for (const r of tier2Rows) {
    (byApp[r.app] ??= []).push(r);
  }
  const appCounts: Record<string, number> = {};
  for (const [app, items] of Object.entries(byApp)) {
    const csv = stringify([
      ['app', 'scene', 'state', 'uiElement', 'device', 'screenMode', '栏', 'variantId', 'notes'],
      ...items.map(r => [r.app, r.scene, r.state, r.uiElement, r.device, r.screenMode, r.lane, r.variantId, r.notes]),
    ]);
    fs.writeFileSync(path.join(OUT_DIR, `app-${app}-mapping.csv`), csv);
    appCounts[app] = items.length;
  }

  return { defaults: defaultsRows.length, appCounts };
}

function writeComponents(comps: ComponentMeta[]): number {
  const csv = stringify([
    ['ComponentFamily', 'VariantId', 'VariantName', 'LibraryName', 'InternalPadL', 'InternalPadR', 'TitleLeftPad', 'NaturalW', 'NaturalH', 'Note'],
    ...comps.map(c => [c.componentFamily, c.variantId, c.variantName, c.libraryName, c.internalPadL, c.internalPadR, c.titleLeftPad, c.naturalW, c.naturalH, c.note]),
  ]);
  fs.writeFileSync(path.join(OUT_DIR, 'components.csv'), csv);
  return comps.length;
}

function writeReport(
  warnings: Warning[],
  stats: Record<string, number>,
  appCounts: Record<string, number>,
  defaultsCount: number,
  componentsCount: number,
  diff: DiffReport | null,
): void {
  const lines: string[] = [];
  lines.push('# extract-mapping report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Statistics');
  lines.push('');
  lines.push(`- Source data rows: ${stats.totalSourceRows}`);
  lines.push(`- Skipped empty rows: ${stats.skippedEmptyRows}`);
  lines.push(`- Emitted output rows: ${stats.emittedRows}`);
  lines.push(`- SystemUIKIT-mapping.csv entries (SystemUIKIT): ${defaultsCount}`);
  lines.push(`- components.csv entries: ${componentsCount}`);
  lines.push('');
  lines.push('### Per-app counts');
  lines.push('');
  for (const [app, n] of Object.entries(appCounts).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${app}: ${n}`);
  }
  lines.push('');

  if (diff) {
    lines.push('## Diff vs app-mapping-stage1a.csv (legacy)');
    lines.push('');
    lines.push(`- legacy keys: ${diff.legacyTotal}`);
    lines.push(`- matched: ${diff.matched}`);
    lines.push(`- new-only (legacy 缺失或新捕获): ${diff.newOnly}`);
    lines.push(`- legacy-only (新抽取中不存在): ${diff.legacyOnly}`);
    lines.push('');
    lines.push('### New-only examples (first 20)');
    for (const k of diff.examples.newOnly) lines.push(`- ${k}`);
    lines.push('');
    lines.push('### Legacy-only examples (first 20)');
    for (const k of diff.examples.legacyOnly) lines.push(`- ${k}`);
    lines.push('');
  }

  lines.push(`## Warnings (${warnings.length})`);
  lines.push('');
  for (const w of warnings) {
    lines.push(`- row ${w.row}: ${w.message}`);
  }
  lines.push('');

  fs.writeFileSync(path.join(OUT_DIR, 'extract-report.md'), lines.join('\n'));
}

function writeSentinel(): void {
  fs.writeFileSync(path.join(OUT_DIR, '.last-extract'), new Date().toISOString() + '\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
function main(): void {
  console.log('extract-mapping.ts');
  console.log('');
  if (!fs.existsSync(SRC_VARIANTS)) {
    console.error(`ERROR: ${SRC_VARIANTS} not found`);
    process.exit(1);
  }

  const { rows, warnings, stats, teamFiles } = processTotal();
  console.log(`✓ 结构变化表-*.csv 处理完成 (${teamFiles} 个团队文件, ${stats.totalSourceRows} 行 → ${stats.emittedRows} 输出)`);

  const components = processVariants();
  console.log(`✓ 控件变体清单.csv 处理完成 (${components.length} 组件)`);

  const { defaults, appCounts } = writeMappings(rows);
  console.log(`✓ SystemUIKIT-mapping.csv (${defaults} 项, SystemUIKIT)`);
  for (const [app, n] of Object.entries(appCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`✓ app-${app}-mapping.csv (${n} 项)`);
  }

  const componentsCount = writeComponents(components);
  console.log(`✓ components.csv (${componentsCount} 组件)`);

  const diff = diffVsLegacy(rows);
  if (diff) {
    console.log(`✓ legacy diff: matched=${diff.matched}, new-only=${diff.newOnly}, legacy-only=${diff.legacyOnly}`);
  }

  writeReport(warnings, stats, appCounts, defaults, componentsCount, diff);
  console.log(`✓ extract-report.md (warnings: ${warnings.length})`);

  writeSentinel();
  console.log('');
  console.log('完整报告: mapping-output/extract-report.md');
}

main();
