#!/usr/bin/env tsx
/**
 * validate-csv.ts (Stage 3B)
 *
 * Build-time CSV consistency check. Catches mistakes in mapping-output/*.csv
 * before csv-to-spec.ts runs and silently warns / picks fallback.
 *
 * Validates:
 *   1. device       ∈ 8-device enum (naming-conventions §1.1)
 *   2. screenMode   ∈ {NLC,NL,NC,LC,C,*-收起,(empty for single-screen)}
 *   3. lane         ∈ {N栏,L栏,C栏,全栏} — common-rules §0 #14 (no whitespace)
 *   4. framework    ∈ {NLC,NL,NC,LC,C}
 *   5. (lane × framework) 兼容性 — e.g. NL framework + C栏 is invalid
 *   6. variantId    → setkeys.json families resolvable (csv-to-spec resolveSetKey)
 *   7. (subScene, scene, state, device, screenMode, lane, uiElement) row uniqueness
 *      — pickVariant 对同一 key 内的 multiple variant 拥有 dedup + disambiguation 规则,
 *        但规则未覆盖的地方会 console.warn (silent fallback)。本
 *        validator 在构建时检出这些情况。
 *   8. components.csv 中出现的 family 全部注册在 setkeys.json families 中
 *      ('todo' / 'unresolved' / 'blocker' status 也计数, 仅 'verified' 才 pass)
 *
 * Exit codes:
 *   0 = pass (errors=0, warnings allowed)
 *   1 = errors found (CI-blocking)
 *   2 = setup error (missing files / parse failure)
 *
 * Output: spec-output/validate-csv-report.json (detailed) + stdout summary.
 *
 * Usage:
 *   tsx scripts/validate-csv.ts                    # default — all apps
 *   tsx scripts/validate-csv.ts --app Notes        # single app filter
 *   tsx scripts/validate-csv.ts --strict           # warnings → errors
 *
 * Wire-up: pre-commit hook + npm script (`npm run validate-csv`).
 *
 * Authority cross-ref:
 *   - references/naming-conventions.md §1.1 (device enum)
 *   - csv-pipeline/data/setkeys.json (family registry)
 *   - csv-pipeline/scripts/csv-to-spec.ts:resolveSetKey (variantId → family)
 *   - common-rules-principles.md §0 #14 (lane name no-whitespace rule)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const MAPPING_OUT = path.join(ROOT, 'mapping-output');
const REPORT_PATH = path.join(ROOT, 'spec-output', 'validate-csv-report.json');

// ─────────────────────────────────────────────────────────────────────────────
// Authority enums (single source of truth — naming-conventions.md §1.1)
// ─────────────────────────────────────────────────────────────────────────────

const VALID_DEVICES = new Set([
  '手机竖', '手机横',
  'Fold外竖', 'Fold外横',
  'Fold内竖', 'Fold内横',
  'Pad竖', 'Pad横',
]);

const VALID_FRAMEWORKS = new Set(['NLC', 'NL', 'NC', 'LC', 'C']);

// screenMode permits empty (single-screen device convention) + base + 收起 variants.
// Computed from VALID_FRAMEWORKS + a few NLC subforms used by Pad NLC layouts.
function isValidScreenMode(s: string): boolean {
  if (s === '') return true; // single-screen 手机/Fold外 的标准写法
  if (VALID_FRAMEWORKS.has(s)) return true;
  // NLC 变种: NLC / NLC收起 / NLC覆盖 / NLC并列 (csv-to-spec getLayoutSpec 权威).
  // input CSV 仅 emit NLC, csv-to-spec 按 device 决定 NLC覆盖/并列 — 因此
  // input CSV 的 screenMode 列仅检查 base form + 收起 variant.
  if (/^(NLC|NL|NC|LC|C)收起$/.test(s)) return true;
  return false;
}

const VALID_LANES = new Set(['N栏', 'L栏', 'C栏', '全栏']);

// (lane × framework) 兼容性:
//   NL    : N栏 + L栏    (no C栏)
//   NLC   : N栏 + L栏 + C栏
//   NC    : N栏 + C栏    (no L栏)
//   LC    : L栏 + C栏    (no N栏)
//   C     : 全栏 或 C栏 (single column)
// '全栏' is allowed across frameworks (single-screen device convention).
const LANE_FRAMEWORK_COMPAT: Record<string, Set<string>> = {
  NL:  new Set(['N栏', 'L栏', '全栏']),
  NLC: new Set(['N栏', 'L栏', 'C栏', '全栏']),
  NC:  new Set(['N栏', 'C栏', '全栏']),
  LC:  new Set(['L栏', 'C栏', '全栏']),
  C:   new Set(['C栏', '全栏']),
};

// ─────────────────────────────────────────────────────────────────────────────
// CSV row interfaces (copy of csv-to-spec.ts MappingRow — keep in sync)
// ─────────────────────────────────────────────────────────────────────────────

interface MappingRow {
  app: string;
  subScene: string;
  scene: string;
  state: string;
  uiElement: string;
  device: string;
  screenMode: string;
  lane: string;
  variantId: string;
  notes: string;
  framework: string;
  // file/line metadata for error reporting
  _file: string;
  _line: number;
}

interface ComponentRow {
  ComponentFamily: string;
  VariantId: string;
  VariantName: string;
  LibraryName: string;
  _file: string;
  _line: number;
}

interface Issue {
  level: 'error' | 'warning';
  rule: string;
  message: string;
  file: string;
  line?: number;
  context?: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV loaders
// ─────────────────────────────────────────────────────────────────────────────

function loadMappingCsv(file: string): MappingRow[] {
  const text = fs.readFileSync(file, 'utf8');
  const records = parse(text, { columns: true, skip_empty_lines: true });
  const fileBase = path.basename(file);
  return records.map((r: Record<string, string>, i: number): MappingRow => ({
    app: r.app ?? '',
    subScene: r.subScene ?? '',
    scene: r.scene ?? '',
    state: r.state ?? '',
    uiElement: r.uiElement ?? '',
    device: r.device ?? '',
    screenMode: r.screenMode ?? '',
    lane: r['栏'] ?? '',
    variantId: r.variantId ?? '',
    notes: r.notes ?? '',
    framework: r.framework ?? '',
    _file: fileBase,
    _line: i + 2, // header is line 1
  }));
}

function loadComponentsCsv(): ComponentRow[] {
  const file = path.join(MAPPING_OUT, 'components.csv');
  const text = fs.readFileSync(file, 'utf8');
  const records = parse(text, { columns: true, skip_empty_lines: true });
  return records.map((r: Record<string, string>, i: number): ComponentRow => ({
    ComponentFamily: r.ComponentFamily ?? '',
    VariantId: r.VariantId ?? '',
    VariantName: r.VariantName ?? '',
    LibraryName: r.LibraryName ?? '',
    _file: 'components.csv',
    _line: i + 2,
  }));
}

function loadSetkeys(): { families: Record<string, { setName: string; setKey: string; library: string; status: string }>; familyNames: Set<string>; verifiedFamilies: Set<string> } {
  const setkeysPath = path.join(ROOT, 'data', 'setkeys.json');
  const raw = JSON.parse(fs.readFileSync(setkeysPath, 'utf8'));
  const families = raw.families ?? {};
  const familyNames = new Set(Object.keys(families));
  const verifiedFamilies = new Set(
    Object.entries(families)
      .filter(([, v]: [string, any]) => v.status === 'verified')
      .map(([k]) => k),
  );
  return { families, familyNames, verifiedFamilies };
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant ID → ComponentFamily resolution (mirrors csv-to-spec.ts:resolveSetKey).
// IMPORTANT: keep prefix list synchronized when csv-to-spec.ts changes.
// ─────────────────────────────────────────────────────────────────────────────

const NON_COMPONENT_MARKERS = new Set([
  '竖屏背景', '横屏背景', '_00', '不展示', '',
  '(framework_reuse)', '(placeholder)', '(prose-only)',
]);

const VARIANT_PREFIX_TO_FAMILY: Array<[RegExp, string]> = [
  [/^StatusBar_/, 'StatusBar'],
  [/^SwipeIndicator_/, 'SwipeIndicator'],
  [/^NavigationBar_ComponentSet_Notes/, 'NavigationBar_Notes'],
  [/^NavigationBar_ComponentSet_/, 'NavigationBar'],
  [/^TopBar_/, 'TopBar'],
  [/^SearchBar_ComponentSet/, 'SearchBar'],
  [/^SelectableChip_ComponentSet_Notes/, 'SelectableChip_Notes'],
  [/^SelectableChip_ComponentSet/, 'SelectableChip'],
  [/^List_Notes_/, 'List_Notes'],
  [/^Detail_Notes_|^DetailNotes_/, 'Detail_Notes'],
  [/^BottomBar_Showcase_Notes/, 'BottomBar_Showcase_Notes'],
  [/^BottomBar_NoteEditPanel/, 'BottomBar_NoteEditPanel'],
  [/^BottomBar_Notes_Outline/, 'BottomBar_Notes_Outline'],
  [/^BottomBar_Showcase_|^BottomBar_/, 'BottomBar_Generic'],
  [/^Fab_|^Fab-/, 'BottomBar_Generic'],
  [/^TextInput_ComponentSet_Notes/, 'TextInput_Notes'],
  [/^Sidebar_Notes_/, 'Sidebar_Notes'],
  [/^Notes_FloatingWindow_/, 'Notes_FloatingWindow'],
  [/^Sidebar_Component_PAD_NLC/, 'BottomBar_Sidebar'],
  [/^Sidebar_Component_Fold_LC/, 'Sidebar_Component_Fold_LC'],
  [/^Sidebar_Component_/, 'BottomBar_Sidebar'],
  [/^Sidebar_BG_/, 'BottomBar_Sidebar'],
  [/^Keyboard_/, 'Keyboard'],
  [/^NoticeBar_/, 'NoticeBar'],
  [/^Scrollbar_/, 'Scrollbar'],
  [/^TextFormatPanel_/, 'TextFormatPanel_Notes'],
  [/^Menu_/, 'Menu'],
  [/^AlertDialog_/, 'AlertDialog'],
  [/^Actionsheet_|^ActionSheet_/, 'ActionSheet'],
  [/^WheelPicker_/, 'WheelPicker'],
  [/^FloatingWindow_/, 'FloatingWindow'],
  [/^SegmentedControls_/, 'SegmentedControls'],
  [/^ToolBar_ComponentSet/, 'ToolBar'],
  [/^List_Task_/, 'List_Task'],
  [/^DetailTask_/, 'DetailTask'],
  [/^NewTaskWindow_/, 'NewTaskWindow'],
  [/^RecordNotes_|^Record_Notes_/, 'RecordNotes'],
  [/^List_NoteSetting_/, 'List_Notes'],
  [/^AIWindow_Options_/, 'AIWindow_Notes'],
  [/^DrawerWindow_/, 'DrawerWindow'],
  [/^SearchReceiving_/, 'SearchReceiving'],
  [/^SearchHistory_Receiving/, 'SearchHistory_Receiving'],
  [/^SearchHistory_/, 'SearchHistory'],
];

function resolveFamily(variantId: string): string | null {
  if (NON_COMPONENT_MARKERS.has(variantId)) return null;
  for (const [re, fam] of VARIANT_PREFIX_TO_FAMILY) {
    if (re.test(variantId)) return fam;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Checks
// ─────────────────────────────────────────────────────────────────────────────

function checkMappingRow(r: MappingRow, issues: Issue[], setkeys: ReturnType<typeof loadSetkeys>): void {
  // 1. device enum
  if (r.device && !VALID_DEVICES.has(r.device)) {
    issues.push({
      level: 'error', rule: 'device-enum',
      message: `device='${r.device}' not in 8-device enum (naming-conventions §1.1)`,
      file: r._file, line: r._line, context: { device: r.device },
    });
  }
  // 2. screenMode enum
  if (!isValidScreenMode(r.screenMode)) {
    issues.push({
      level: 'error', rule: 'screenMode-enum',
      message: `screenMode='${r.screenMode}' not recognized (expected NLC/NL/NC/LC/C/*-收起/empty)`,
      file: r._file, line: r._line, context: { screenMode: r.screenMode },
    });
  }
  // 3. lane enum (no whitespace, common-rules §0 #14)
  if (r.lane && !VALID_LANES.has(r.lane)) {
    // helpful hint: did they include whitespace?
    const hint = / /.test(r.lane) ? ' (whitespace detected — strip per §0 #14)' : '';
    issues.push({
      level: 'error', rule: 'lane-enum',
      message: `lane='${r.lane}' not in {N栏,L栏,C栏,全栏}${hint}`,
      file: r._file, line: r._line, context: { lane: r.lane },
    });
  }
  // 4. framework enum
  if (r.framework && !VALID_FRAMEWORKS.has(r.framework)) {
    issues.push({
      level: 'error', rule: 'framework-enum',
      message: `framework='${r.framework}' not in {NLC,NL,NC,LC,C}`,
      file: r._file, line: r._line, context: { framework: r.framework },
    });
  }
  // 5. (lane × framework) 兼容性
  if (VALID_FRAMEWORKS.has(r.framework) && VALID_LANES.has(r.lane)) {
    const compat = LANE_FRAMEWORK_COMPAT[r.framework];
    if (compat && !compat.has(r.lane)) {
      issues.push({
        level: 'error', rule: 'lane-framework-compat',
        message: `lane='${r.lane}' not allowed in framework='${r.framework}' (e.g. NL has no C栏)`,
        file: r._file, line: r._line,
        context: { lane: r.lane, framework: r.framework },
      });
    }
  }
  // 6. variantId → family resolvable + family verified
  if (r.variantId && !NON_COMPONENT_MARKERS.has(r.variantId) && r.variantId !== '不展示') {
    const fam = resolveFamily(r.variantId);
    if (!fam) {
      issues.push({
        level: 'error', rule: 'variantId-unresolved',
        message: `variantId='${r.variantId}' has no prefix → family rule (csv-to-spec.ts:resolveSetKey will fail)`,
        file: r._file, line: r._line,
        context: { variantId: r.variantId },
      });
    } else if (!setkeys.familyNames.has(fam)) {
      issues.push({
        level: 'error', rule: 'family-missing-in-setkeys',
        message: `family='${fam}' (from variantId='${r.variantId}') 缺失 in setkeys.json`,
        file: r._file, line: r._line,
        context: { variantId: r.variantId, family: fam },
      });
    } else if (!setkeys.verifiedFamilies.has(fam)) {
      const status = (setkeys.families[fam] as any)?.status ?? 'unknown';
      issues.push({
        level: 'warning', rule: 'family-not-verified',
        message: `family='${fam}' status='${status}' (not 'verified') — spec emit OK but Figma probe needed`,
        file: r._file, line: r._line,
        context: { family: fam, status },
      });
    }
  }
}

function checkRowUniqueness(rows: MappingRow[], issues: Issue[]): void {
  // (subScene, scene, state, device, screenMode, lane, uiElement) → variant 集合
  // 同一 key 下有多个 variant 是正常的 (csv-to-spec pickVariant 来 disambiguate). 但
  // pickVariant 规则未匹配的 (lane, uiElement) 会 fallback warn → 由本 validator 发出信号.
  // pickVariant 规则可映射 set — 与 csv-to-spec.ts:pickVariant() sync (line 439-535):
  //   1. Pad NLC + C栏 Input               → null (skip)
  //   2. Pad (NLC|NL|NC) + N栏 NavigationBar → null (skip)
  //   3. Fold内 LC + C栏 Input              → _08
  //   4. (single-screen|C-mode) + 全栏 Input → _01
  //   5. Pad NLC + L栏 NavigationBar        → flag-based (_07/_17/_09/_18)
  //   6. Pad NLC + L栏 List 编辑             → _04
  //   7. Pad NLC + N栏 Sidebar              → _01 / null
  //   8. Pad NL + L栏 SearchBar             → TopBar_NN
  //   9. Pad NL + L栏 List                  → flag-based (_13~_20)
  //  10. NewTaskWindow_* (variantId-prefix) → _01
  //  11. Pad NL + N栏 NavigationBar          → null (skip, rule 2 superset)
  // (single-screen-mode = device∈SINGLE_SCREEN_DEVICES OR screenMode='C')
  const SINGLE_SCREEN_DEVICES_RX = /^(手机竖|手机横|Fold外竖|Fold外横)$/;
  const PICKVARIANT_RULES: Array<{
    device?: RegExp; screenMode?: RegExp; lane: string; element?: string;
    variantPrefix?: RegExp;
  }> = [
    // 1, 2, 7, 11 — skip rules (csv-to-spec returns null; multi-variant warning is moot)
    { device: /^Pad/, screenMode: /^NLC/,    lane: 'C栏', element: 'Input' },
    { device: /^Pad/, screenMode: /^(NLC|NL|NC)/, lane: 'N栏', element: 'NavigationBar' },
    { device: /^Pad/, screenMode: /^NLC/,    lane: 'N栏', element: 'Sidebar' },
    // 3 — Fold内 LC + C栏 Input
    { device: /^Fold内/, screenMode: /^LC/,  lane: 'C栏', element: 'Input' },
    // 4 — single-screen + 全栏 Input (device OR screenMode='C')
    { device: SINGLE_SCREEN_DEVICES_RX,      lane: '全栏', element: 'Input' },
    { screenMode: /^C$/,                     lane: '全栏', element: 'Input' },
    // 5, 6 — Pad NLC + L栏 (NavigationBar / List)
    { device: /^Pad/, screenMode: /^NLC/,    lane: 'L栏', element: 'NavigationBar' },
    { device: /^Pad/, screenMode: /^NLC/,    lane: 'L栏', element: 'List' },
    // 8, 9 — Pad NL + L栏 (SearchBar / List)
    { device: /^Pad/, screenMode: /^NL/,     lane: 'L栏', element: 'SearchBar' },
    { device: /^Pad/, screenMode: /^NL/,     lane: 'L栏', element: 'List' },
    // 10 — NewTaskWindow (variantId-prefix rule, all (device, screenMode, lane))
    { lane: '*',                              variantPrefix: /^NewTaskWindow_/ },
  ];
  function ruleMatches(r: MappingRow): boolean {
    return PICKVARIANT_RULES.some(rule => {
      if (rule.device && !rule.device.test(r.device)) return false;
      if (rule.screenMode && !rule.screenMode.test(r.screenMode || '')) return false;
      if (rule.lane !== '*' && rule.lane !== r.lane) return false;
      if (rule.element && rule.element !== r.uiElement) return false;
      if (rule.variantPrefix && !rule.variantPrefix.test(r.variantId)) return false;
      return true;
    });
  }
  const groups = new Map<string, MappingRow[]>();
  for (const r of rows) {
    if (!r.uiElement || r.uiElement === 'Overay') continue;
    const k = [r.subScene, r.scene, r.state, r.device, r.screenMode, r.lane, r.uiElement].join('|');
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }
  for (const [, rs] of groups) {
    const dedup = new Set(rs.map(r => r.variantId));
    if (dedup.size <= 1) continue; // single variant → no ambiguity
    // multi variant + no pickVariant rule → silent fallback (csv-to-spec line 521)
    const sample = rs[0];
    if (!ruleMatches(sample)) {
      issues.push({
        level: 'warning', rule: 'pickVariant-fallback',
        message: `multi-variant 歧义 (${dedup.size} variants: ${[...dedup].join(', ')}) but no pickVariant 规则 — fallback to first`,
        file: sample._file,
        context: {
          subScene: sample.subScene, scene: sample.scene, state: sample.state,
          device: sample.device, screenMode: sample.screenMode,
          lane: sample.lane, uiElement: sample.uiElement,
        },
      });
    }
  }
}

function checkComponentsCsv(comps: ComponentRow[], setkeys: ReturnType<typeof loadSetkeys>, issues: Issue[]): void {
  // 8. components.csv 的 family 全部注册到 setkeys.json
  // ComponentFamily 直接注册 → OK. 未注册时用同一 row 的 VariantId 尝试 resolveFamily
  // (当 components.csv 的 family 命名 ≠ setkeys 注册名时 — 例: Notes_NavigationBar ↔ NavigationBar_Notes).
  // 若用 VariantId 也无法 resolve 则确属 missing → 需要 probe-setkeys.
  const reportedMissing = new Set<string>();
  const familyVariantSamples = new Map<string, string>(); // family → 第一个 sample VariantId
  for (const c of comps) {
    if (!c.ComponentFamily) continue;
    if (setkeys.familyNames.has(c.ComponentFamily)) continue;
    if (!familyVariantSamples.has(c.ComponentFamily)) {
      familyVariantSamples.set(c.ComponentFamily, c.VariantId);
    }
    const resolved = c.VariantId ? resolveFamily(c.VariantId) : null;
    if (resolved && setkeys.familyNames.has(resolved)) continue;
    if (reportedMissing.has(c.ComponentFamily)) continue;
    reportedMissing.add(c.ComponentFamily);
    const sampleVid = familyVariantSamples.get(c.ComponentFamily) ?? '';
    issues.push({
      level: 'error', rule: 'family-missing-in-setkeys',
      message: `components.csv 的 family='${c.ComponentFamily}' (variantId 例='${sampleVid}') 缺失 in setkeys.json (需要 probe-setkeys)`,
      file: 'components.csv',
      context: { family: c.ComponentFamily, sampleVariantId: sampleVid },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

interface CliArgs {
  app?: string;
  strict: boolean;
}

function parseArgs(): CliArgs {
  const out: CliArgs = { strict: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--app') out.app = argv[++i];
    else if (argv[i] === '--strict') out.strict = true;
    else if (argv[i] === '--help' || argv[i] === '-h') {
      console.error('Usage: validate-csv.ts [--app NAME] [--strict]');
      process.exit(0);
    }
  }
  return out;
}

function main(): void {
  const args = parseArgs();
  const issues: Issue[] = [];
  let setkeys: ReturnType<typeof loadSetkeys>;
  try {
    setkeys = loadSetkeys();
  } catch (e) {
    console.error(`! setup error: cannot load setkeys.json (${(e as Error).message})`);
    process.exit(2);
  }

  // Locate mapping CSVs
  const files = fs.readdirSync(MAPPING_OUT)
    .filter(f => /^app-.+-mapping\.csv$/.test(f))
    .map(f => path.join(MAPPING_OUT, f));
  const sysFile = path.join(MAPPING_OUT, 'SystemUIKIT-mapping.csv');
  if (fs.existsSync(sysFile)) files.push(sysFile);

  if (files.length === 0) {
    console.error('! setup error: no mapping CSVs found in mapping-output/');
    process.exit(2);
  }

  // Per-file validation
  let totalRows = 0;
  let allRows: MappingRow[] = [];
  for (const file of files) {
    const fileApp = path.basename(file).replace(/^app-|-mapping\.csv$|^SystemUIKIT-/, '').replace(/^.*-/, '');
    if (args.app && !path.basename(file).includes(args.app)) continue;
    let rows: MappingRow[];
    try {
      rows = loadMappingCsv(file);
    } catch (e) {
      issues.push({
        level: 'error', rule: 'parse-failure',
        message: `cannot parse: ${(e as Error).message}`,
        file: path.basename(file),
      });
      continue;
    }
    totalRows += rows.length;
    allRows.push(...rows);
    for (const r of rows) checkMappingRow(r, issues, setkeys);
    checkRowUniqueness(rows, issues);
    void fileApp;
  }

  // Components.csv check
  try {
    const comps = loadComponentsCsv();
    checkComponentsCsv(comps, setkeys, issues);
  } catch (e) {
    issues.push({
      level: 'error', rule: 'parse-failure',
      message: `components.csv: ${(e as Error).message}`,
      file: 'components.csv',
    });
  }

  // Strict mode: warnings → errors
  if (args.strict) {
    for (const iss of issues) if (iss.level === 'warning') iss.level = 'error';
  }

  // Output
  const errors = issues.filter(i => i.level === 'error');
  const warnings = issues.filter(i => i.level === 'warning');
  const report = {
    generatedAt: new Date().toISOString(),
    args,
    totals: {
      filesScanned: files.length,
      rowsScanned: totalRows,
      errors: errors.length,
      warnings: warnings.length,
    },
    issues,
  };
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log(`validate-csv: ${files.length} file, ${totalRows} rows`);
  console.log(`  errors:   ${errors.length}`);
  console.log(`  warnings: ${warnings.length}`);
  if (errors.length > 0) {
    console.log('\n前 10 errors:');
    for (const e of errors.slice(0, 10)) {
      const where = e.line ? `${e.file}:${e.line}` : e.file;
      console.log(`  ✗ [${e.rule}] ${where}: ${e.message}`);
    }
    if (errors.length > 10) console.log(`  ... ${errors.length - 10} more (see ${path.relative(process.cwd(), REPORT_PATH)})`);
  }
  if (warnings.length > 0 && !args.strict) {
    console.log('\n前 5 warnings:');
    for (const w of warnings.slice(0, 5)) {
      const where = w.line ? `${w.file}:${w.line}` : w.file;
      console.log(`  ⚠ [${w.rule}] ${where}: ${w.message}`);
    }
    if (warnings.length > 5) console.log(`  ... ${warnings.length - 5} more (see ${path.relative(process.cwd(), REPORT_PATH)})`);
  }
  console.log(`\nreport: ${path.relative(process.cwd(), REPORT_PATH)}`);

  if (errors.length > 0) process.exit(1);
  console.log('✓ pass');
  process.exit(0);
}

main();
