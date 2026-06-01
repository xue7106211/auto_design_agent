#!/usr/bin/env tsx
/**
 * validate-keys-online.ts (Stage 3A.x build-time guard — gap-audit follow-up)
 *
 * Reads spec-output/validation-todo.json (from `npm run validate-keys`) and
 * verifies every (setKey, variantId) pair against the actual Figma library
 * via REST API. Writes spec-output/validation-report.json. Exits 1 on any
 * stale entry — wire this into CI to gate spec emission.
 *
 * Required: FIGMA_TOKEN env var (Figma personal access token with read access
 * to OS4 UI Kit + 业务组件库 files).
 *
 * Without FIGMA_TOKEN: prints fallback instructions for offline agent probe
 * (use_figma) and exits 2 (distinct from stale-found exit 1).
 *
 * REST endpoints used:
 *   GET /v1/files/{file_key}/component_sets   → all sets in library
 *   GET /v1/files/{file_key}/components       → all components (variants)
 *     Each component carries `containing_frame.componentSetId` linking to set.
 *
 * Total: 4 REST calls (2 library files × 2 endpoints). Cached in-memory per run.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TODO_PATH = path.join(ROOT, 'spec-output', 'validation-todo.json');
const REPORT_PATH = path.join(ROOT, 'spec-output', 'validation-report.json');

// Authoritative library file keys (common-rules §0.5.1).
const FILE_KEYS: Record<string, string> = {
  'OS4 UI Kit': 'FBvQ3xM5C62MgIcA1JHWIs',
  '业务组件库': 'mrvMGwkbZ7qZML7iOfQsvI',
};

interface Pair { setKey: string; variant: string; source: string[] }
interface Todo { generatedAt: string; total: number; pairs: Pair[] }

interface RemoteSet {
  key: string;          // ComponentSet hex key (matches our setKey)
  nodeId: string;       // ComponentSet canvas node_id (e.g. "61:1592"), used to link children
  name: string;
  fileKey: string;
}
interface RemoteComponent {
  key: string;
  name: string;
  componentSetNodeId?: string;  // containing_frame.containingComponentSet.nodeId
  fileKey: string;
}

async function fetchFigma<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, { headers: { 'X-Figma-Token': token } });
  if (!res.ok) {
    throw new Error(`Figma API ${res.status} ${res.statusText} for ${url}`);
  }
  return res.json() as Promise<T>;
}

async function loadLibrary(fileKey: string, token: string): Promise<{ sets: RemoteSet[]; components: RemoteComponent[] }> {
  const setsResp = await fetchFigma<{ meta: { component_sets: Array<{ key: string; node_id: string; name: string }> } }>(
    `https://api.figma.com/v1/files/${fileKey}/component_sets`, token,
  );
  const componentsResp = await fetchFigma<{ meta: { components: Array<{ key: string; name: string; containing_frame?: { containingComponentSet?: { nodeId?: string } } }> } }>(
    `https://api.figma.com/v1/files/${fileKey}/components`, token,
  );
  return {
    sets: setsResp.meta.component_sets.map(s => ({ key: s.key, nodeId: s.node_id, name: s.name, fileKey })),
    components: componentsResp.meta.components.map(c => ({
      key: c.key, name: c.name,
      componentSetNodeId: c.containing_frame?.containingComponentSet?.nodeId,
      fileKey,
    })),
  };
}

// Mirror render-spec.ts findVariant semantics.
function norm(s: string): string { return s.toLowerCase().replace(/[\s_]+/g, ''); }
function variantInSet(variantName: string, setName: string, setComponents: RemoteComponent[]): boolean {
  const t = norm(variantName);
  // 1) exact name
  if (setComponents.some(c => c.name === variantName)) return true;
  // 2) Figma property syntax: "Property=Value, ..."
  for (const c of setComponents) {
    const props = c.name.split(',').map(p => p.trim());
    for (const p of props) {
      const eq = p.indexOf('=');
      if (eq < 0) continue;
      if (norm(p.slice(eq + 1).trim()) === t) return true;
    }
  }
  // 3) normalized substring of full name
  if (setComponents.some(c => norm(c.name).includes(t))) return true;
  return false;
}

interface StaleEntry {
  setKey: string;
  variant: string;
  reason: 'set_not_found' | 'variant_not_found' | 'set_in_unknown_lib';
  setNameInLib?: string;
  setLibFileKey?: string;
  setChildrenCount?: number;
  firstChildName?: string;
  source: string[];
}

async function main() {
  const token = process.env.FIGMA_TOKEN;
  if (!token) {
    console.error('FIGMA_TOKEN env var not set. validate-keys-online requires a Figma personal access token.');
    console.error('');
    console.error('Fallback options:');
    console.error('  1. Set token: export FIGMA_TOKEN=$(figma-cli token), then re-run');
    console.error('  2. Use offline agent probe via use_figma — see Improvement_doc/audit-stale-setkeys-2026-05-28.md');
    console.error('');
    console.error('Get a token: https://www.figma.com/developers/api#access-tokens');
    process.exit(2);
  }

  if (!fs.existsSync(TODO_PATH)) {
    console.error(`${TODO_PATH} not found. Run \`npm run validate-keys\` first.`);
    process.exit(2);
  }

  const todo = JSON.parse(fs.readFileSync(TODO_PATH, 'utf8')) as Todo;
  console.log(`Validating ${todo.pairs.length} (setKey, variantId) pairs against Figma libraries…`);

  // Load both libraries (parallel)
  const libs = await Promise.all(
    Object.entries(FILE_KEYS).map(async ([libName, fileKey]) => {
      const { sets, components } = await loadLibrary(fileKey, token);
      console.log(`  fetched ${libName}: ${sets.length} sets, ${components.length} components`);
      return { libName, fileKey, sets, components };
    }),
  );

  // Build setKey → { libName, setName, components[] } index across all libs
  const setIndex = new Map<string, { libName: string; setName: string; components: RemoteComponent[]; fileKey: string }>();
  for (const lib of libs) {
    for (const s of lib.sets) {
      const childComponents = lib.components.filter(c => c.componentSetNodeId === s.nodeId);
      setIndex.set(s.key, { libName: lib.libName, setName: s.name, components: childComponents, fileKey: s.fileKey });
    }
  }

  // Validate each pair
  const stale: StaleEntry[] = [];
  let ok = 0;
  for (const pair of todo.pairs) {
    const setInfo = setIndex.get(pair.setKey);
    if (!setInfo) {
      stale.push({
        setKey: pair.setKey, variant: pair.variant,
        reason: 'set_not_found',
        source: pair.source,
      });
      continue;
    }
    if (!variantInSet(pair.variant, setInfo.setName, setInfo.components)) {
      stale.push({
        setKey: pair.setKey, variant: pair.variant,
        reason: 'variant_not_found',
        setNameInLib: setInfo.setName,
        setLibFileKey: setInfo.fileKey,
        setChildrenCount: setInfo.components.length,
        firstChildName: setInfo.components[0]?.name,
        source: pair.source,
      });
      continue;
    }
    ok++;
  }

  const report = {
    _doc: 'Generated by validate-keys-online.ts. stale > 0 = build-time fail. Reasons: set_not_found = setKey absent in authoritative libs (likely stale or v0.8); variant_not_found = setKey OK but variantId missing inside the set (cf. category B naming convention or category A wrong-set).',
    probedAt: new Date().toISOString(),
    totalChecked: todo.pairs.length,
    ok,
    stale: stale.length,
    entries: stale,
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log('');
  console.log(`✓ ok: ${ok} / ${todo.pairs.length}`);
  if (stale.length > 0) {
    console.error(`✗ stale: ${stale.length}`);
    for (const s of stale) {
      console.error(`  ${s.reason} | setKey=${s.setKey.slice(0, 8)}… variant=${s.variant} (${s.source.length} spec)`);
    }
    console.error('');
    console.error(`details: ${path.relative(process.cwd(), REPORT_PATH)}`);
    console.error(`see: Improvement_doc/audit-stale-setkeys-2026-05-28.md (Category A vs B fix paths)`);
    process.exit(1);
  }
  console.log(`report: ${path.relative(process.cwd(), REPORT_PATH)}`);
}

main().catch(e => { console.error(String(e)); process.exit(2); });
