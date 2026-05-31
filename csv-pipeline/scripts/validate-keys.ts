#!/usr/bin/env tsx
/**
 * validate-keys.ts (Stage 3A.x — gap-audit-overlay-container-spec.md follow-up)
 *
 * Scans all spec JSON output and collects unique (setKey, variantId) pairs that
 * the render pipeline will import + lookup. Emits `validation-todo.json` with
 * the pair list. The actual Figma import probe runs in a separate use_figma call
 * (see SKILL.md / agent runs `npm run validate-keys-online`).
 *
 * Why: stale setKey detection (see this session's discovery — §0.4 had setKey
 * `7e3238cf...` for FloatingWindow_ComponentSet_01 but that key actually points
 * to `浮窗_面板` background panel set, not the FW container set. Hand-build worked
 * because manual `search_design_system` returned correct key `d586e39f...`,
 * but pipeline trusted §0.4 and failed at variant lookup time. Surface defect:
 *   - resolveSetKey returns wrong key
 *   - render-spec.ts findVariant fails — but only at runtime, not at build time
 *
 * Goal: surface the defect at build time. Even if the import succeeds, verify
 * that the expected variant exists inside the set. Anything missing → fail-loud.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SPEC_DIR = path.join(ROOT, 'spec-output', 'spec');
const OUT_PATH = path.join(ROOT, 'spec-output', 'validation-todo.json');

interface Pair {
  setKey: string;
  variant: string;
  source: string[];  // which spec ids reference this pair
}

function collectPairs(): Pair[] {
  const map = new Map<string, Pair>();
  for (const f of fs.readdirSync(SPEC_DIR)) {
    if (!f.endsWith('.json')) continue;
    const spec = JSON.parse(fs.readFileSync(path.join(SPEC_DIR, f), 'utf8'));
    const sid = spec.id ?? f;
    const add = (setKey: string, variant: string) => {
      if (!setKey || !variant) return;
      const k = `${setKey}|${variant}`;
      if (!map.has(k)) map.set(k, { setKey, variant, source: [] });
      const p = map.get(k)!;
      if (!p.source.includes(sid)) p.source.push(sid);
    };
    add(spec.statusBar?.setKey, spec.statusBar?.variant);
    add(spec.swipeIndicator?.setKey, spec.swipeIndicator?.variant);
    for (const c of spec.components ?? []) add(c.setKey, c.variant);
    for (const o of spec.overlays ?? []) add(o.setKey, o.variant);
    if (spec.floatingContainer) {
      add(spec.floatingContainer.setKey, spec.floatingContainer.variant);
      add(spec.floatingContainer.contentSlot?.innerNode?.setKey, spec.floatingContainer.contentSlot?.innerNode?.variant);
    }
  }
  return [...map.values()].sort((a, b) => `${a.setKey}|${a.variant}`.localeCompare(`${b.setKey}|${b.variant}`));
}

function main() {
  const pairs = collectPairs();
  const out = {
    generatedAt: new Date().toISOString(),
    total: pairs.length,
    pairs,
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8');
  console.log(`✓ wrote ${pairs.length} unique (setKey, variantId) pairs → ${path.relative(process.cwd(), OUT_PATH)}`);
  console.log(`  next: agent runs use_figma probe (see SKILL.md / next session)`);
}

main();
