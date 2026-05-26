/**
 * split-input.ts — one-shot script to split the legacy mega CSV
 * (`结构变化表 - 控件总表.csv`) into per-team files (`结构变化表-{App}.csv`).
 *
 * Designer ownership groupings (per user spec 2026-05-25):
 *   - SystemUIKIT  ← 系统控件
 *   - FileManager  ← 文件管理
 *   - Notes        ← 笔记 + 待办 Tasks (same product team)
 *   - Recorder, Calculator, Calendar, Clocks, Compass, Settings ...
 *   - Phone        ← 电话 default + 收起拨号键盘 sub-state
 *   - Contacts     ← 联系人 default + Pad 端 sub-state
 *   - Messaging, Downloads, MiMover, Weather, Gallery, Security
 *
 * Each output file preserves the 3-level header (rows 0-2) and contains only
 * rows belonging to that team. Sub-states (Phone hide-numpad, Contacts/Pad)
 * stay in the same file as their parent app.
 *
 * Run once: `tsx scripts/split-input.ts`
 * After this, the original mega CSV can be archived.
 */
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'mapping-input', '结构变化表 - 控件总表.csv');
const OUT_DIR = path.join(ROOT, 'mapping-input');

// CN app name (or substring) → canonical file basename
// Order matters: longest CN substring first (avoid 联系人 partial matching Pad 端联系人)
const APP_TO_FILE: { match: string; file: string }[] = [
  { match: '系统控件', file: 'SystemUIKIT' },
  { match: '文件管理', file: 'FileManager' },
  // Notes team owns both 笔记 and 待办
  { match: '笔记', file: 'Notes' },
  { match: '待办', file: 'Notes' },
  { match: '录音', file: 'Recorder' },
  { match: '计算器', file: 'Calculator' },
  { match: '日历', file: 'Calendar' },
  { match: '时钟', file: 'Clocks' },
  { match: '指南针', file: 'Compass' },
  { match: '设置', file: 'Settings' },
  // Phone owns default + hide-numberpad sub-state
  { match: '电话', file: 'Phone' },
  // Contacts owns default + Pad 端 sub-state. Use longer match first.
  { match: 'Pad 端联系人', file: 'Contacts' },
  { match: '联系人', file: 'Contacts' },
  { match: '短信', file: 'Messaging' },
  { match: '下载管理', file: 'Downloads' },
  { match: '小米换机', file: 'MiMover' },
  { match: '天气', file: 'Weather' },
  { match: '相册', file: 'Gallery' },
  { match: '手机管家', file: 'Security' },
];

function classify(col0: string): string | null {
  const trimmed = col0.trim();
  if (!trimmed) return null;
  for (const entry of APP_TO_FILE) {
    if (trimmed.includes(entry.match)) return entry.file;
  }
  return null;
}

function main(): void {
  if (!fs.existsSync(SRC)) {
    console.error(`ERROR: ${SRC} not found`);
    process.exit(1);
  }
  const raw = fs.readFileSync(SRC, 'utf8');
  const records: string[][] = parse(raw, { relax_quotes: true, relax_column_count: true, skip_empty_lines: false });

  if (records.length < 4) {
    console.error('ERROR: source CSV too short (expected ≥4 rows incl. 3 header rows)');
    process.exit(1);
  }

  const headers = records.slice(0, 3);
  const dataRows = records.slice(3);

  // Group rows by team file. col0 is sticky (empty col0 → carry previous team).
  const groups: Record<string, string[][]> = {};
  let currentFile = '';
  let unclassifiedCount = 0;

  for (const row of dataRows) {
    if (!row || row.every(c => !c?.trim())) continue;
    const col0 = (row[0] ?? '').trim();
    if (col0) {
      const cls = classify(col0);
      if (cls) {
        currentFile = cls;
      } else {
        console.warn(`⚠ unclassified app row: "${col0}"`);
        unclassifiedCount++;
        currentFile = '';
      }
    }
    if (!currentFile) continue;
    (groups[currentFile] ??= []).push(row);
  }

  // Write each group
  let totalRows = 0;
  for (const [file, rows] of Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))) {
    const out = path.join(OUT_DIR, `结构变化表-${file}.csv`);
    const csv = stringify([...headers, ...rows]);
    fs.writeFileSync(out, csv);
    console.log(`✓ 结构变化表-${file}.csv (${rows.length} 行)`);
    totalRows += rows.length;
  }
  console.log('');
  console.log(`전체 ${Object.keys(groups).length}개 파일, ${totalRows}행 분리됨`);
  if (unclassifiedCount > 0) {
    console.warn(`⚠ ${unclassifiedCount}개 행이 분류되지 않음 (위 경고 참조)`);
  }
}

main();
