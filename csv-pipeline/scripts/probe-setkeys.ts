// probe-setkeys.ts
//   Lists families in data/setkeys.json that need probing or refresh.
//   Output: probe-todo.md (consumed by the agent which calls Figma MCP).
//
//   Workflow:
//     1. `npm run probe-setkeys` → writes probe-todo.md
//     2. Agent reads probe-todo.md, calls Figma MCP search_design_system per family
//     3. Agent updates data/setkeys.json (setKey + status: 'verified' | 'unresolved')
//     4. `npm run spec` picks up new keys
//
//   Family discovery: also scans components.csv for unique componentFamily that are NOT in
//   setkeys.json — flags them as 'missing' so newly-introduced families surface automatically.

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SETKEYS_PATH = path.join(ROOT, 'data', 'setkeys.json');
const COMPONENTS_PATH = path.join(ROOT, 'mapping-output', 'components.csv');
const TODO_PATH = path.join(ROOT, 'probe-todo.md');

interface FamilyEntry {
  setName: string;
  setKey: string;
  library: string;
  status: 'verified' | 'todo' | 'unresolved';
  lastProbe?: string;
  probeNote?: string;
}

interface SetKeysJson {
  _doc?: string;
  authoritativeLibraryKeys?: Record<string, string>;
  families: Record<string, FamilyEntry>;
}

const FILE_KEYS = {
  'OS4 UI Kit': 'FBvQ3xM5C62MgIcA1JHWIs',
  '业务组件库': 'mrvMGwkbZ7qZML7iOfQsvI',
};

function loadSetKeys(): SetKeysJson {
  return JSON.parse(fs.readFileSync(SETKEYS_PATH, 'utf8'));
}

function loadComponentFamilies(): Set<string> {
  if (!fs.existsSync(COMPONENTS_PATH)) return new Set();
  const raw = fs.readFileSync(COMPONENTS_PATH, 'utf8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true });
  const out = new Set<string>();
  for (const r of rows) {
    if (r.componentFamily) out.add(r.componentFamily);
  }
  return out;
}

function main() {
  const data = loadSetKeys();
  const families = data.families;
  const csvFamilies = loadComponentFamilies();

  const needsProbe: string[] = [];
  const unresolved: string[] = [];
  const verified: string[] = [];
  const missingInJson: string[] = [];

  for (const [name, e] of Object.entries(families)) {
    if (e.status === 'unresolved') unresolved.push(name);
    else if (!e.setKey || e.status === 'todo') needsProbe.push(name);
    else verified.push(name);
  }

  // Discover families used by components.csv but absent from setkeys.json
  for (const fam of csvFamilies) {
    if (!(fam in families)) missingInJson.push(fam);
  }

  const lines: string[] = [];
  lines.push('# Probe TODO — Figma ComponentSet keys');
  lines.push('');
  lines.push(`Generated ${new Date().toISOString().slice(0, 10)} by \`npm run probe-setkeys\`.`);
  lines.push('');
  lines.push('Agent: for each family below, call `mcp__plugin_figma_figma__search_design_system` with the listed query against the listed fileKey, then update `data/setkeys.json` (set `setKey`, set `status: "verified"`, set `lastProbe`).');
  lines.push('');
  lines.push('**MANDATORY (per common-rules §0 #24):** Always pass `includeLibraryKeys` to scope to authoritative libs. Without scoping, search returns community/test/legacy libs (Material 3, iOS, HyperOS v0.8) which are forbidden.');
  lines.push('');
  lines.push(`File keys: OS4 UI Kit = \`${FILE_KEYS['OS4 UI Kit']}\` · 业务组件库 = \`${FILE_KEYS['业务组件库']}\``);
  lines.push('');
  if (data.authoritativeLibraryKeys) {
    lines.push('Authoritative `includeLibraryKeys` (paste into search call):');
    lines.push('```json');
    const keys = Object.entries(data.authoritativeLibraryKeys)
      .filter(([k]) => !k.startsWith('_'))
      .map(([, v]) => v);
    lines.push(JSON.stringify(keys, null, 2));
    lines.push('```');
    lines.push('');
  }

  if (needsProbe.length > 0) {
    lines.push(`## Needs initial probe (${needsProbe.length})`);
    lines.push('');
    for (const name of needsProbe) {
      const e = families[name];
      lines.push(`- **${name}** (${e.library}) — query: \`${e.setName}\``);
    }
    lines.push('');
  }

  if (unresolved.length > 0) {
    lines.push(`## Unresolved (probe failed previously, retry with new alias) (${unresolved.length})`);
    lines.push('');
    for (const name of unresolved) {
      const e = families[name];
      lines.push(`- **${name}** (${e.library}) — last attempt: ${e.lastProbe ?? 'unknown'}`);
      if (e.probeNote) lines.push(`  - Note: ${e.probeNote}`);
    }
    lines.push('');
  }

  if (missingInJson.length > 0) {
    lines.push(`## Newly-discovered families in components.csv but absent from setkeys.json (${missingInJson.length})`);
    lines.push('');
    lines.push('Add these as new entries in data/setkeys.json (status: "todo"), then probe.');
    lines.push('');
    for (const fam of missingInJson) lines.push(`- ${fam}`);
    lines.push('');
  }

  lines.push(`## Verified (${verified.length}) — no action`);
  lines.push('');
  lines.push(verified.map(n => `\`${n}\``).join(', '));
  lines.push('');

  fs.writeFileSync(TODO_PATH, lines.join('\n'));
  console.log(`✓ probe-todo.md written: ${needsProbe.length} todo, ${unresolved.length} unresolved, ${missingInJson.length} missing-in-json, ${verified.length} verified`);
  if (needsProbe.length === 0 && unresolved.length === 0 && missingInJson.length === 0) {
    console.log('  (all families verified — no probe needed)');
  } else {
    console.log(`  → see ${path.relative(process.cwd(), TODO_PATH)}`);
  }
}

main();
