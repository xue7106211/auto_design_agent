#!/usr/bin/env tsx
/**
 * spec-check.ts
 *
 * Byte-level diff between `npm run spec` output (spec-output/spec/) and frozen
 * reference (spec-output/__ref__/). On change, review intent and run
 * `npm run spec:freeze` to update the reference.
 *
 * Regression safety net introduced at end of Phase 2 (prevents silent failures).
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SPEC_DIR = path.join(ROOT, 'spec-output', 'spec');
const REF_DIR = path.join(ROOT, 'spec-output', '__ref__');

function listJson(dir: string): Set<string> {
  if (!fs.existsSync(dir)) return new Set();
  return new Set(fs.readdirSync(dir).filter(f => f.endsWith('.json')));
}

const specFiles = listJson(SPEC_DIR);
const refFiles = listJson(REF_DIR);

const onlySpec = [...specFiles].filter(f => !refFiles.has(f));
const onlyRef = [...refFiles].filter(f => !specFiles.has(f));
const common = [...specFiles].filter(f => refFiles.has(f));

let diffCount = 0;
const diffs: string[] = [];

for (const f of common) {
  const a = fs.readFileSync(path.join(SPEC_DIR, f), 'utf8');
  const b = fs.readFileSync(path.join(REF_DIR, f), 'utf8');
  if (a !== b) {
    diffCount++;
    diffs.push(f);
  }
}

console.log(`spec-check: ${specFiles.size} current vs ${refFiles.size} ref`);
console.log(`  unchanged: ${common.length - diffCount}`);
if (diffCount > 0)  console.log(`  CHANGED:   ${diffCount}  → ${diffs.join(', ')}`);
if (onlySpec.length) console.log(`  NEW:       ${onlySpec.length}  → ${onlySpec.join(', ')}`);
if (onlyRef.length)  console.log(`  REMOVED:   ${onlyRef.length}  → ${onlyRef.join(', ')}`);

if (diffCount + onlySpec.length + onlyRef.length === 0) {
  console.log('✓ all specs match reference');
  process.exit(0);
}

console.log('\n→ if intended: npm run spec:freeze (update ref)');
console.log('→ if regression: fix spec rules');
process.exit(1);
