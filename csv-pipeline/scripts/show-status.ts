/**
 * show-status.ts — print project state + next-task queue
 *
 * 用法: npm run status
 *
 * 1. mapping-output/ 文件夹现状 (文件数、最近抽取时间、新鲜度)
 * 2. project-status-ko.md 的 "下一步任务队列" 区段抽取
 * 3. mapping-input/*.csv vs mapping-output/.last-extract mtime 比较
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();
const MAPPINGS = path.join(ROOT, 'mapping-output');
const SENTINEL = path.join(MAPPINGS, '.last-extract');
const INPUT_DIR = path.join(ROOT, 'mapping-input');
function discoverSources(): string[] {
  const files: string[] = [];
  if (fs.existsSync(INPUT_DIR)) {
    for (const name of fs.readdirSync(INPUT_DIR)) {
      if (/^结构变化表-[A-Za-z0-9_]+\.csv$/.test(name) || name === '控件变体清单.csv') {
        files.push(path.join(INPUT_DIR, name));
      }
    }
  }
  return files;
}
const SOURCES = discoverSources();
const STATUS_DOC = path.join(ROOT, 'project-status.md');

function bold(s: string) { return `\x1b[1m${s}\x1b[0m`; }
function dim(s: string) { return `\x1b[2m${s}\x1b[0m`; }
function green(s: string) { return `\x1b[32m${s}\x1b[0m`; }
function yellow(s: string) { return `\x1b[33m${s}\x1b[0m`; }
function red(s: string) { return `\x1b[31m${s}\x1b[0m`; }

console.log('');
console.log(bold('=== 项目状态 ==='));
console.log('');

// 1. mapping-output/ 文件夹状态
console.log(bold('mapping-output/ 产物:'));
if (!fs.existsSync(MAPPINGS)) {
  console.log(red('  ✗ mappings/ 文件夹不存在 — 需要执行 npm run extract'));
} else {
  const files = fs.readdirSync(MAPPINGS).filter(f => f.endsWith('.csv') || f.endsWith('.md'));
  const apps = files.filter(f => f.startsWith('app-')).length;
  const hasSystemUIKIT = files.includes('SystemUIKIT-mapping.csv');
  const hasComponents = files.includes('components.csv');
  const hasReport = files.includes('extract-report.md');
  console.log(`  ${hasSystemUIKIT ? green('✓') : red('✗')} SystemUIKIT-mapping.csv`);
  console.log(`  ${apps > 0 ? green('✓') : red('✗')} app-*.csv (${apps}个)`);
  console.log(`  ${hasComponents ? green('✓') : red('✗')} components.csv`);
  console.log(`  ${hasReport ? green('✓') : red('✗')} extract-report.md`);
}
console.log('');

// 2. 新鲜度检查 (mtime)
console.log(bold('新鲜度 (last-extract vs source mtime):'));
if (!fs.existsSync(SENTINEL)) {
  console.log(yellow('  ⚠ .last-extract sentinel 不存在 — 尚未执行抽取'));
} else {
  const sentinelMtime = fs.statSync(SENTINEL).mtimeMs;
  const lastExtract = fs.readFileSync(SENTINEL, 'utf8').trim();
  console.log(`  最近抽取: ${lastExtract}`);
  let stale = false;
  for (const src of SOURCES) {
    if (!fs.existsSync(src)) {
      console.log(red(`  ✗ ${path.basename(src)} 不存在`));
      continue;
    }
    const srcMtime = fs.statSync(src).mtimeMs;
    if (srcMtime > sentinelMtime) {
      console.log(red(`  ⚠ ${path.basename(src)} 更新 (需要重新抽取)`));
      stale = true;
    } else {
      console.log(green(`  ✓ ${path.basename(src)}`));
    }
  }
  if (stale) {
    console.log('');
    console.log(yellow('  → 建议执行 npm run extract'));
  }
}
console.log('');

// 3. project-status-ko.md 的下一步任务队列抽取
console.log(bold('下一步任务队列 (project-status.md):'));
if (!fs.existsSync(STATUS_DOC)) {
  console.log(red('  ✗ project-status.md 不存在'));
} else {
  const content = fs.readFileSync(STATUS_DOC, 'utf8');
  const m = content.match(/##\s*下一步任务队列[^\n]*\n([\s\S]*?)(?=\n##\s|$)/);
  if (m) {
    // Print first 25 lines of the queue section
    const lines = m[1].split('\n').slice(0, 25);
    for (const line of lines) {
      if (line.trim()) console.log(`  ${line}`);
    }
  } else {
    console.log(yellow('  未找到该区段'));
  }
}
console.log('');

console.log(dim('详情: project-status.md (或 -ko.md)'));
console.log('');
