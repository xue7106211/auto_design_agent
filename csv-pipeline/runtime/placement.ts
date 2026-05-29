// =============================================================================
// placement.ts — Component placement runtime (multi-端 适配 Phase 4/5 token + 落位)
// =============================================================================
//
// 用途: use_figma 调用前以 Read tool 读本文件, 将内容作为 prefix inject 到
// use_figma code 中. 之后调用 buildTokenCache / bindFill / placeStandardComponent
// 等 global 函数. 避免 AI 每次 inline 重写函数本体导致累积 fix 丢失.
//
// 用法:
//   const placementCode = await Read('csv-pipeline/runtime/placement.ts');
//   await use_figma({ code: `${placementCode}\n\n// my task code...` });
//
// 导出函数 (use_figma 上下文 globals):
//   - buildTokenCache(names) → Promise<Record<string, Variable>>
//   - bindFill(node, tokenName, fallbackRGB, opacity?) → Promise<boolean>
//   - bindStrokePaint(tokenName, fallbackRGB, opacity?) → Promise<Paint>
//   - placeStandardComponent({ inst, parent, x, y, w, h, sourceInst?, opts?, targetVariant? }) → Promise<string>
//
// 权威 source 一致性:
//   - protocol.md §2 (placeStandardComponent 本体)
//   - protocol.md §4 (token cache / bindFill)
//   - common-rules §0 #18 (A 类 风满) / §3.6 (auto-layout reflow)
//   - common-rules §3.8 (分割线 = strokeLeft, RECTANGLE 废弃 2026-05-28)
//   - protocol.md step 7b (chip-like multi-child 保护, children.length === 1 时才 FILL,
//                           2026-05-28 加入)
//
// 变更规则: 本 .ts 为 single source. protocol.md §2 / §4 代码块为 historical
// reference, 实际执行以本文件为权威. 修改函数本体只在本文件 commit, .md 不再
// 同步更新代码 (避免 drift).

// -----------------------------------------------------------------------------
// 1. Token cache
// -----------------------------------------------------------------------------
async function buildTokenCache(names) {
  const cache = {};
  const cols = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
  for (const col of cols) {
    const vars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(col.key);
    for (const v of vars) {
      if (v.resolvedType === 'COLOR' && (!names || names.includes(v.name))) {
        cache[v.name] = v;
      }
    }
  }
  return cache;
}

// -----------------------------------------------------------------------------
// 2. bindFill — 给 node.fills 绑定 color token (TOKEN_CACHE 全局必须已定义)
// -----------------------------------------------------------------------------
async function bindFill(node, tokenName, fallbackRGB, opacity) {
  if (opacity === undefined) opacity = 1;
  let paint = { type: 'SOLID', color: fallbackRGB, opacity };
  const meta = (typeof TOKEN_CACHE !== 'undefined') ? TOKEN_CACHE[tokenName] : null;
  if (meta) {
    try {
      const v = await figma.variables.importVariableByKeyAsync(meta.key);
      paint = figma.variables.setBoundVariableForPaint(paint, 'color', v);
    } catch {}
  }
  node.fills = [paint];
  return !!meta;
}

// -----------------------------------------------------------------------------
// 3. bindStrokePaint — 创建带 token 绑定的 stroke paint (caller 自己赋值给 strokes)
//    common-rules §3.8: 栏间分割线 = C 栏 strokeLeftWeight=1 + strokes 绑定
// -----------------------------------------------------------------------------
async function bindStrokePaint(tokenName, fallbackRGB, opacity) {
  if (opacity === undefined) opacity = 1;
  let paint = { type: 'SOLID', color: fallbackRGB, opacity };
  const meta = (typeof TOKEN_CACHE !== 'undefined') ? TOKEN_CACHE[tokenName] : null;
  if (meta) {
    try {
      const v = await figma.variables.importVariableByKeyAsync(meta.key);
      paint = figma.variables.setBoundVariableForPaint(paint, 'color', v);
    } catch {}
  }
  return paint;
}

// -----------------------------------------------------------------------------
// 4. placeStandardComponent — protocol.md §2 标准落位序列
//    args:
//      inst           — 已 createInstance 的 instance (caller 负责创建)
//      parent         — 落位 target parent
//      x, y, w, h     — 栏内坐标系 + 大小 (A 类 component 必须 x=0 w=栏W 风满 §0 #18)
//      sourceInst     — (可选) source inst, 用于 inner componentProperties 继承
//      targetVariant  — (可选) 目标 variant component, 提供时执行 swapComponent
//      opts           — { fillFirstChild?, resetOverrides?, inheritInnerState? }
//                       fillFirstChild 默认 true, multi-child component 自动 skip
//                       resetOverrides 默认 OFF (protocol §2 关键决定)
//                       inheritInnerState 默认 true (sourceInst 提供时执行)
// -----------------------------------------------------------------------------
async function placeStandardComponent(args) {
  const { inst, parent, x, y, w, h } = args;
  const sourceInst = args.sourceInst || null;
  const opts = args.opts || {};
  const resetOverrides = opts.resetOverrides === true;

  // 1. 迁移到 target parent
  if (parent && inst.parent !== parent) parent.appendChild(inst);

  // 2. variant swap (可选)
  if (args.targetVariant) {
    try { inst.swapComponent(args.targetVariant); } catch {}
  }

  // 3. resetOverrides 默认 OFF (开启会清掉 width override 触发 hug content reflow)
  if (resetOverrides) {
    try { inst.resetOverrides(); } catch {}
  }

  // 4. sizing FIXED (四项全部, 互不替代)
  try { inst.layoutSizingHorizontal = 'FIXED'; } catch {}
  try { inst.layoutSizingVertical   = 'FIXED'; } catch {}
  try { inst.primaryAxisSizingMode  = 'FIXED'; } catch {}
  try { inst.counterAxisSizingMode  = 'FIXED'; } catch {}

  // 5. resize → x/y (顺序不可调换)
  inst.resize(w, h);
  inst.x = x; inst.y = y;

  // 6. inner state 继承 (sourceInst 存在时)
  if (sourceInst && opts.inheritInnerState !== false) {
    const walk = (a, b) => {
      if (!a || !b || !('children' in a) || !('children' in b)) return;
      if (!a.children || !b.children) return;
      const len = Math.min(a.children.length, b.children.length);
      for (let i = 0; i < len; i++) {
        const t = a.children[i], s = b.children[i];
        if (!t || !s || t.name !== s.name) continue;
        if (t.type === 'INSTANCE' && s.type === 'INSTANCE') {
          try {
            const props = s.componentProperties;
            if (props) {
              const p2 = {};
              for (const [k, v] of Object.entries(props)) {
                if (['VARIANT', 'BOOLEAN'].includes(v.type)) p2[k] = v.value;
              }
              if (Object.keys(p2).length > 0) {
                try { t.setProperties(p2); } catch {}
              }
            }
          } catch {}
        }
        walk(t, s);
      }
    };
    try { walk(inst, sourceInst); } catch {}
  }

  // 7. children[0] FILL — 仅 single wrapper 应用 (multi-child component 保护)
  //    protocol.md step 7b (2026-05-28 chip-like 保护追加):
  //    children.length === 1 时才自动 FILL. multi-child 信任 component intended
  //    layout (children[0] FIXED + children[1+] FILL, 如 SelectableChip 的 folder
  //    icon 84dp FIXED + 自适应内容 FILL).
  //    例外: ToolBar / BottomBar_Showcase 的 inner 胶囊由 §0.2 spec 单独处理 (step 9).
  if (opts.fillFirstChild !== false
      && inst.children && inst.children.length === 1
      && !/ToolBar|BottomBar_Showcase/.test(inst.name || '')) {
    const c0 = inst.children[0];
    if (c0 && Math.abs(c0.width - inst.width) > 0.5) {
      try { c0.layoutSizingHorizontal = 'FILL'; } catch {}
    }
  }

  // 8. 落位后 self-check (任何异常立即 throw)
  if (Math.abs(inst.width - w) > 0.5 || Math.abs(inst.height - h) > 0.5) {
    throw new Error(`reflow detected: ${inst.name} expected ${w}x${h} got ${inst.width}x${inst.height}`);
  }

  // 9. ToolBar / BottomBar_Showcase 胶囊后处理 (栏W > 440 → 定宽 344 居中)
  const setName = inst.mainComponent && inst.mainComponent.parent && inst.mainComponent.parent.name || '';
  if (/ToolBar|BottomBar_Showcase/.test(inst.name || setName)) {
    const findCapsule = (n) => {
      if (!n.children) return null;
      for (const c of n.children) {
        if (/工具个数举例|TabMaterial/.test(c.name || '')) return c;
      }
      return null;
    };
    const capsule = findCapsule(inst);
    if (capsule && w > 440) {
      try { capsule.layoutSizingHorizontal = 'FIXED'; } catch {}
      capsule.resize(344, capsule.height);
      const overlay = inst.children && inst.children.find(c => /Overlay/.test(c.name || ''));
      if (overlay) {
        try { overlay.primaryAxisAlignItems = 'CENTER'; } catch {}
      }
    }
  }

  return inst.id;
}
