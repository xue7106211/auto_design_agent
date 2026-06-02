// =============================================================================
// verify.ts — verifyChecklist runtime (Phase 6 强制验证函数)
// =============================================================================
//
// 用途: use_figma 调用前以 Read tool 读本文件, prefix inject 到 use_figma code 中.
// 之后调用 verifyChecklist(frame, spec, scenarioFlags?) 获取 errors 数组.
//
// 用法 (Phase 6, 每个 frame 落位完成后):
//   const verifyCode = await Read('csv-pipeline/runtime/verify.ts');
//   await use_figma({ code: `${placementCode}\n${verifyCode}\n
//     const errors = await verifyChecklist(frame, spec, scenarioFlags);
//     return { errors };
//   `});
//
// 导出函数:
//   - verifyChecklist(frame, spec, scenarioFlags?) → Promise<string[]>
//
// 权威 source 一致性:
//   - protocol.md §6 (verifyChecklist 本体)
//   - common-rules §6.2 (24 项强制清单)
//   - common-rules §3.7 / §3.7a / §3.7b (mask z-order)
//   - common-rules §3.8 (分割线 = strokeLeft, 2026-05-28)
//
// 检查项映射:
//   ①  #4-#6  StatusBar
//   ②  #3     cornerRadius
//   ③  #17    frame fill token
//   ④  #7     栏宽
//   ⑤  #11    杆子 z-order
//   ⑥  #9     Sidebar 高度
//   ⑦  #8     componentChecks reflow + inner clipping (§3.6.A)
//   ⑧  #10    NLC 覆盖遮罩
//   ⑨  #12    分割线 token (strokeLeft + legacy RECTANGLE compat)
//   ⑩  #21    L 编辑遮罩 (§3.7a)
//   ⑩b #22b   遮罩-N覆盖 z-order
//   ⑪  #22    多 mask z-order (§3.7b)
//   ⑫  #24    C 编辑无 mask
//   ⑬  #23    scenarioFlags 一致性
//   ⑭  -      ToolBar 胶囊 width
//   ⑮  -      Pad N 栏 z-order (NavBar 在 Sidebar 之上)
//   ⑯  -      inner componentProperties 与源稿同步
//   ⑰  §3.9   Pad横 NLC 并列 Sidebar promote (frame 直接子级 last z, 阴影 可见)
//   ⑱  -      clipsContent default 强制 (frame/main/L/C=true; Pad横 NLC并列 时 N+main 仅 false)
//   ⑲  -      lane content top y >= SBH + 6 (栏 y=0 h=frameH 满高度模式时 device-dim「基本对齐方式」)
//   ⑥d -      N 栏 外壳 fill 跟随 L (禁止透明, §0.3; N 栏 存在时 AUTO-fire)

async function verifyChecklist(frame, spec, scenarioFlags) {
  const errors = [];
  const flags = scenarioFlags || {};

  // ① StatusBar
  const sb = frame.children.find(c => c.name && c.name.includes('状态栏') || /StatusBar/.test(c.name || ''));
  if (sb) {
    if (Math.abs(sb.width - spec.frameW) > 1) errors.push(`statusBar.width ${sb.width} != ${spec.frameW}`);
    if (spec.statusBarH !== undefined && Math.abs(sb.height - spec.statusBarH) > 1) errors.push(`statusBar.height ${sb.height} != ${spec.statusBarH}`);
    if (sb.y !== 0) errors.push(`statusBar.y != 0 (got ${sb.y})`);
  }

  // ② frame cornerRadius
  if (spec.cornerRadius !== undefined) {
    if (typeof spec.cornerRadius === 'number') {
      if (frame.cornerRadius !== spec.cornerRadius) {
        errors.push(`frame.cornerRadius ${frame.cornerRadius} != ${spec.cornerRadius}`);
      }
    } else {
      const r = spec.cornerRadius;
      if (frame.topLeftRadius !== r.topLeft) errors.push(`TL ${frame.topLeftRadius} != ${r.topLeft}`);
      if (frame.topRightRadius !== r.topRight) errors.push(`TR ${frame.topRightRadius} != ${r.topRight}`);
      if (frame.bottomLeftRadius !== r.bottomLeft) errors.push(`BL ${frame.bottomLeftRadius} != ${r.bottomLeft}`);
      if (frame.bottomRightRadius !== r.bottomRight) errors.push(`BR ${frame.bottomRightRadius} != ${r.bottomRight}`);
    }
  }

  // ③ frame fill (transparent OR token-bound; spec.frameTransparent=true 时 fills=[] 期待)
  if (spec.frameTransparent) {
    if (frame.fills && frame.fills.length > 0) errors.push(`frame.fills should be empty (transparent)`);
  } else if (spec.frameFillToken) {
    if (!frame.fills || !frame.fills[0] || !frame.fills[0].boundVariables || !frame.fills[0].boundVariables.color) {
      errors.push(`frame.fill not bound to token '${spec.frameFillToken}'`);
    }
  }

  // ④ 栏宽
  const main = frame.children.find(c => c.name === 'main');
  if (main && spec.cols) {
    for (const [colName, expectW] of Object.entries(spec.cols)) {
      const col = main.children.find(c => c.name === colName);
      if (col && Math.abs(col.width - expectW) > 1) {
        errors.push(`${colName}.width ${col.width} != ${expectW}`);
      }
    }
  }

  // ⑤ 杆子 (SwipeIndicator) + Keyboard 例外 (common-rules-verify.md §6.2 #11)
  //
  //    默认: 杆子 = 最顶 z (透明 + 风满 frame 宽).
  //    例外: 源 frame 含 Keyboard instance 时 → Keyboard = 最顶 z, 杆子 = 次顶 z.
  //    根因: Keyboard 是 OS 级浮层 (system overlay), 物理设备上键盘弹出时永远盖过
  //    home indicator (杆子). 其他 app 适配 Keyboard 时同样适用 (Keyboard
  //    = 所有 app 共通 system overlay).
  //    回顾: 2026-06-02 笔记 弹窗 (Keyboard 单独) 适配 task 中 user 明示
  //    "键盘永远在最上" → 规则化 (.md only 则 next session 再发 risk,
  //    feedback_runtime_enforce_rules per memory).
  const gz = frame.children.find(c => c.name && (/SwipeIndicator/.test(c.name) || c.name.startsWith('杆子')));
  const kbd = frame.children.find(c => c.name && /Keyboard/.test(c.name));
  if (gz) {
    if (Math.abs(gz.width - spec.frameW) > 1) errors.push(`杆子.width ${gz.width} != ${spec.frameW}`);
    if (gz.fills && gz.fills.length > 0) errors.push(`杆子.fills should be empty (transparent)`);
    const lastIdx = frame.children.length - 1;
    const gzIdx = frame.children.indexOf(gz);
    if (kbd) {
      // Keyboard 存在 → Keyboard = last, 杆子 = last-1 期待
      const kbdIdx = frame.children.indexOf(kbd);
      if (kbdIdx !== lastIdx) errors.push(`Keyboard not at top z-order (idx=${kbdIdx}, expected ${lastIdx})`);
      if (gzIdx !== lastIdx - 1) errors.push(`杆子 not at second-top z-order with Keyboard present (idx=${gzIdx}, expected ${lastIdx - 1})`);
    } else {
      // Keyboard 无 → 杆子 = last 期待 (default)
      if (gzIdx !== lastIdx) errors.push(`杆子 not at top z-order`);
    }
  }

  // ⑥ Sidebar 高度
  if (spec.sidebar) {
    const sd = frame.children.find(c => c.name && /Sidebar/.test(c.name));
    if (sd && Math.abs(sd.height - spec.sidebar.h) > 1) {
      errors.push(`Sidebar.height ${sd.height} != ${spec.sidebar.h} (reflow?)`);
    }
  }

  // ⑥b Sidebar_Notes attached form: H = mainH 满高度, y = statusBarH (2026-05-31 添加)
  //     app-variant-map-笔记.md §0.5 「Sidebar_Notes attached form」 规则适用验证.
  //     trigger: spec.sidebarMainH === true.
  //     master 为 H=Fill 定义但 createInstance default FIXED → 须明示调用.
  //     verifyChecklist 自动检出.
  if (spec.sidebarMainH) {
    const sd = frame.children.find(c => c.name && /Sidebar_Notes/.test(c.name));
    if (sd) {
      const expectH = spec.frameH - spec.statusBarH;
      if (Math.abs(sd.height - expectH) > 1) {
        errors.push(`Sidebar_Notes.h ${sd.height} != mainH ${expectH} (frameH ${spec.frameH} - statusBarH ${spec.statusBarH}); §0.5 attached form 满高度缺失`);
      }
      if (sd.y !== spec.statusBarH) {
        errors.push(`Sidebar_Notes.y ${sd.y} != statusBarH ${spec.statusBarH}`);
      }
      // 「新版标题栏」 (children[0].children[0]) H=56 自然验证 (FILL 误用 detect)
      if (sd.children?.[0]?.children?.[0]) {
        const titleBar = sd.children[0].children[0];
        if (/标题栏|新版标题栏/.test(titleBar.name || '') && titleBar.height > 100) {
          errors.push(`Sidebar_Notes.「新版标题栏」 h=${titleBar.height} (自然 56 超出); 3-level FILL 误用 怀疑`);
        }
      }
    }
  }

  // ⑥c lane 内部 outer padding 自动检查 (2026-06-02 添加, rule-doc-only failure 防止).
  //     spec.lanes 提供时 (e.g. { L: { w: 428, internal-table 可适用 components } })
  //     自动检查. caller 在 placement 时不用 laneW 选项而以 inline `x=0, w=laneW`
  //     做简单 fill 则检出.
  //     trigger: spec.checkLanePadding === true.
  //     检查对象: lane 内的 standard A 类 component (NavBar / SearchBar / Chip / List / Detail / TextInput).
  //     期待值: outer = max(0, bp_padding(laneW, isQ18) − component_internal). instance.x === outer.
  if (spec.checkLanePadding === true) {
    const NOTES_INTERNAL = {
      NavigationBar: 12, NavigationBar_ComponentSet: 12,
      SearchBar_ComponentSet: 12,
      SelectableChip_ComponentSet_Notes: 12,
      List_Notes: 12, Detail_Notes: 20,
      TextInput_ComponentSet_Notes: 12,
      ToolBar_ComponentSet: 0, BottomBar_Showcase: 0,
    };
    // Q18: 一律 12dp, 仅 真 C栏通栏 (Detail full-bleed) 且 800≤w≤1100 时为 56.
    // NL→C fallback / list lane = cFullBleed false → 12 (app §0.1 #9「Fold内 NL→C=笔记 LC=12」).
    // 旧 bug: `q18 && w<=640` 仅 12 → Q18 w>640 (Fold内横 888) 落入一般 断点 56 误判.
    const cFullBleed = spec.cFullBleed === true;
    const bpPad = (w, q18) => {
      if (q18) return (cFullBleed && w >= 800 && w <= 1100) ? 56 : 12;
      if (w <= 420) return 12;
      if (w <= 640) return 20;
      if (w <= 800) return 28;
      return 56;
    };
    const lookupInt = (name) => {
      for (const [k, v] of Object.entries(NOTES_INTERNAL)) {
        if (name === k || name.startsWith(k)) return v;
      }
      return -1; // not standard A 类 → skip
    };
    const isQ18 = spec.isQ18 === true;
    // Lane 候选: frame.children 的 L栏 (promoted), main.children 的 N/L/C 栏
    const candidates = [];
    const Lp = frame.children.find(c => c.name === 'L栏' || c.name === 'L 栏');
    if (Lp) candidates.push(Lp);
    const mainNode = frame.children.find(c => c.name === 'main');
    if (mainNode) {
      for (const col of (mainNode.children || [])) {
        if (/^(L|C|N)栏$|^(L|C|N) 栏$/.test(col.name || '')) candidates.push(col);
      }
    }
    for (const col of candidates) {
      const laneW = col.width;
      for (const inst of (col.children || [])) {
        const internal = lookupInt(inst.name || '');
        if (internal < 0) continue; // 非目标子级 (e.g. C 栏的 strokeLeft 自身) skip
        if (/ToolBar|BottomBar/.test(inst.name)) {
          // 外壳 lane 风满期待值
          if (Math.abs(inst.x - 0) > 0.5) errors.push(`padding: ${col.name}/${inst.name} 外壳风满期待 x=0, got ${inst.x}`);
          if (Math.abs(inst.width - laneW) > 0.5) errors.push(`padding: ${col.name}/${inst.name} 外壳风满期待 w=${laneW}, got ${inst.width}`);
          continue;
        }
        const outerExp = Math.max(0, bpPad(laneW, isQ18) - internal);
        if (Math.abs(inst.x - outerExp) > 0.5) errors.push(`padding: ${col.name}/${inst.name} x=${inst.x} != outer ${outerExp} (laneW=${laneW} spec=${bpPad(laneW, isQ18)} internal=${internal})`);
        const wExp = laneW - 2 * outerExp;
        if (Math.abs(inst.width - wExp) > 0.5) errors.push(`padding: ${col.name}/${inst.name} w=${inst.width} != ${wExp}`);
      }
    }
  }

  // ⑥d N 栏 外壳 fill 检查 (2026-06-02 追加, rule-doc-only failure 防止).
  //     app-variant-map-笔记.md §0.3: N 栏 (Sidebar 外壳) 跟随相邻 L 栏 fill
  //     (L 不存在 → 跟随 C). 待办 Pad List_Task_03 flat → L=surface → N 也 surface.
  //     透明 (fills=[]) 时画布灰底 bleed-through → user「Pad N 背景又错了」.
  //     trigger: AUTO — N 栏 frame 存在则无条件检查 (opt-in flag 移除 2026-06-02).
  //              覆盖 模式 N 栏 frame 自身不存在 (Sidebar 浮) → 无误报.
  //              §0.3 上 N 始终跟随 L (或 C) → 透明绝无正解.
  //     期待值: N 栏 frame.fills token-bound (禁止透明), 与相邻 L fill token 一致.
  //     回顾: 2026-06-02 待办 多端适配 task 中 Pad横 N 栏 frame fills=[] → user 指摘.
  //     §0.3 规则仅在 .md, inline caller 用 `Ncol.fills=[]` (透明 default) fallback.
  //     初版修正为 spec.checkNFill opt-in, 但 agent 不给 flag 则再发 →
  //     移除 gate, N 栏存在时 auto-fire 强化 (feedback_runtime_enforce_rules).
  {
    // 两种结构都查: frame 直接子级 lane (§3.8 满高度模式) + main wrapper 内 lane
    const nameIsN = (n) => n === 'N栏' || n === 'N 栏';
    const nameIsL = (n) => n === 'L栏' || n === 'L 栏';
    const mainNode = frame.children.find(c => c.name === 'main');
    const Ncol = frame.children.find(c => nameIsN(c.name))
      || (mainNode && mainNode.children && mainNode.children.find(c => nameIsN(c.name)));
    const Lcol = frame.children.find(c => nameIsL(c.name))
      || (mainNode && mainNode.children && mainNode.children.find(c => nameIsL(c.name)));
    if (Ncol) {
      const hasFill = Ncol.fills && Ncol.fills.length > 0 && Ncol.fills[0].type === 'SOLID';
      const bound = hasFill && Ncol.fills[0].boundVariables && Ncol.fills[0].boundVariables.color;
      if (!hasFill) {
        errors.push(`N 栏 fill 透明 (fills=[]) — §0.3 违反: N 栏 须跟随相邻 L 栏 fill (透明则画布灰底 bleed-through)`);
      } else if (!bound) {
        errors.push(`N 栏 fill 未绑定 token — §0.3 违反: 须跟随 L 栏 token (背景色/surface 等)`);
      } else if (Lcol && Lcol.fills && Lcol.fills[0] && Lcol.fills[0].boundVariables && Lcol.fills[0].boundVariables.color) {
        const nVar = Ncol.fills[0].boundVariables.color.id;
        const lVar = Lcol.fills[0].boundVariables.color.id;
        if (nVar !== lVar) errors.push(`N 栏 fill token != L 栏 fill token (§0.3: N 跟随 L)`);
      }
    }
  }

  // ⑦ componentChecks reflow + inner clipping
  if (Array.isArray(spec.componentChecks)) {
    for (const chk of spec.componentChecks) {
      const node = await figma.getNodeByIdAsync(chk.id);
      if (!node) {
        errors.push(`componentCheck[${chk.label}] node not found (id=${chk.id})`);
        continue;
      }
      if (chk.w !== undefined && Math.abs(node.width - chk.w) > 0.5) errors.push(`${chk.label}.width ${node.width} != ${chk.w} (reflow)`);
      if (chk.h !== undefined && Math.abs(node.height - chk.h) > 0.5) errors.push(`${chk.label}.height ${node.height} != ${chk.h} (reflow)`);
      if (chk.x !== undefined && Math.abs(node.x - chk.x) > 0.5) errors.push(`${chk.label}.x ${node.x} != ${chk.x}`);
      if (chk.y !== undefined && Math.abs(node.y - chk.y) > 0.5) errors.push(`${chk.label}.y ${node.y} != ${chk.y}`);
      // ⑦b inner clipping (multi-child component 不强制 — 信任 intended layout)
      if (node.children && node.children.length === 1 && node.children[0]) {
        const c0 = node.children[0];
        if (Math.abs(c0.width - node.width) > 0.5) {
          errors.push(`${chk.label} INNER CLIPPING: instance ${node.width} vs child[0] '${c0.name}' ${c0.width}`);
        }
      }
    }
  }

  // ⑧ 遮罩-N覆盖 fill token
  if (spec.mask || flags.NCovering) {
    const mask = frame.children.find(c => c.name === '遮罩-N覆盖');
    if (!mask) {
      errors.push(`遮罩-N覆盖 missing (NCovering trigger)`);
    } else if (!mask.fills || !mask.fills[0] || !mask.fills[0].boundVariables || !mask.fills[0].boundVariables.color) {
      errors.push(`mask.fill not bound to token`);
    }
  }

  // ⑨ 分割线 (2026-05-28 修订: C栏 strokeLeftWeight=1 + strokes 绑定)
  if (main) {
    const Ccol = main.children.find(c => c.name === 'C栏' || c.name === 'C 栏');
    if (Ccol && Ccol.strokeLeftWeight === 1) {
      if (!Ccol.strokes || !Ccol.strokes[0] || !Ccol.strokes[0].boundVariables || !Ccol.strokes[0].boundVariables.color) {
        errors.push(`C 栏 strokes not bound to '分割线色/outline' token`);
      }
    }
  }
  // legacy 独立 RECTANGLE check (已适配 frame 兼容)
  const div = frame.children.find(c => c.name === '栏间分割线');
  if (div && (!div.fills || !div.fills[0] || !div.fills[0].boundVariables || !div.fills[0].boundVariables.color)) {
    errors.push(`legacy 栏间分割线 RECTANGLE.fill not bound (consider migrating to strokeLeft)`);
  }

  // ⑩ L 编辑遮罩 (§3.7a) — NL framework 时跳过
  if (flags.LEditMode && spec.framework !== 'NL') {
    const editMask = frame.children.find(c => c.name === '遮罩-编辑');
    if (!editMask) {
      errors.push(`遮罩-编辑 missing (LEditMode trigger §3.7a)`);
    } else {
      if (Math.abs(editMask.height - spec.frameH) > 1) errors.push(`遮罩-编辑.h ${editMask.height} != ${spec.frameH}`);
      if (!editMask.fills || !editMask.fills[0] || !editMask.fills[0].boundVariables || !editMask.fills[0].boundVariables.color) {
        errors.push(`遮罩-编辑.fill not bound to '遮罩色/mask' token`);
      }
      const sbIdx = frame.children.findIndex(c => c.name && c.name.includes('状态栏'));
      const emIdx = frame.children.indexOf(editMask);
      if (sbIdx >= 0 && emIdx <= sbIdx) errors.push(`遮罩-编辑 must be ABOVE 状态栏 (sbIdx=${sbIdx} emIdx=${emIdx}, §3.7a)`);
      const L = frame.children.find(c => c.name === 'L栏' || c.name === 'L 栏');
      if (!L) errors.push(`L栏 not promoted to frame direct child (§3.7a requires promote)`);
    }
  }

  // ⑩b 遮罩-N覆盖 z-order (§3.7 修订 2026-05-18)
  if (flags.NCovering || spec.mask) {
    const ncMask = frame.children.find(c => c.name === '遮罩-N覆盖');
    const sbIdx = frame.children.findIndex(c => c.name && c.name.includes('状态栏'));
    if (ncMask && sbIdx >= 0) {
      const ncIdx = frame.children.indexOf(ncMask);
      if (ncIdx <= sbIdx) errors.push(`遮罩-N覆盖 must be ABOVE 状态栏 (sbIdx=${sbIdx} ncIdx=${ncIdx}, §3.7)`);
    }
  }

  // ⑪ 多 mask z-order (§3.7b)
  if (flags.LEditMode && flags.NCovering && spec.framework !== 'NL') {
    const expected = ['main', '状态栏', '遮罩-编辑', '栏间分割线', 'L栏', '遮罩-N覆盖', 'Sidebar', '杆子'];
    const actual = frame.children.map(c => {
      const n = c.name || '';
      if (n === 'main') return 'main';
      if (n.includes('遮罩-编辑')) return '遮罩-编辑';
      if (n.includes('状态栏') || /StatusBar/.test(n)) return '状态栏';
      if (n.includes('栏间分割线') || /^分割线$/.test(n)) return '栏间分割线';
      if (n === 'L栏' || n === 'L 栏') return 'L栏';
      if (n.includes('遮罩-N覆盖')) return '遮罩-N覆盖';
      if (n.includes('Sidebar')) return 'Sidebar';
      if (n.startsWith('杆子') || /SwipeIndicator/.test(n)) return '杆子';
      return n;
    });
    for (let i = 0; i < expected.length; i++) {
      if (actual[i] !== expected[i]) errors.push(`多 mask z-order [${i}] expected '${expected[i]}' got '${actual[i]}' (§3.7b)`);
    }
  }

  // ⑫ C 编辑时无 mask (§3.7a 末)
  if (flags.CEditMode && !flags.LEditMode && !flags.NEditMode && spec.framework !== 'NL') {
    const editMask = frame.children.find(c => c.name === '遮罩-编辑');
    if (editMask) errors.push(`遮罩-编辑 should NOT exist when only CEditMode active`);
  }

  // ⑬ scenarioFlags 一致性
  if (scenarioFlags === null && (spec.editMask || spec.NCoverMask)) {
    errors.push(`scenarioFlags not provided but spec contains mask spec — §6.2 #23 violation`);
  }

  // ⑭ ToolBar 胶囊 width — 2026-06-01 规则废弃
  //
  //    旧规则: 栏 W ≤ 440 → capW = 栏W−48 / > 440 → 344 居中.
  //    此规则忽略 capsule 的 master 自然 width (220 / 344) 与 inner button 自然
  //    width (28×28 icon) 而强制变更 → button icon stretch.
  //    user 指摘: 「胶囊的宽度为何随意缩小. 不应让图标被压扁」.
  //
  //    新规则: capsule = master HUG default 原样保持才是正解. instance level
  //    自动检查 不要 (master 保证单一自然 width). 本项目废弃.
  // (旧 ⑭ 检查废弃)

  // ⑮ Pad N 栏 z-order (NavBar 在 Sidebar 之上)
  if (main) {
    const nCol = main.children && main.children.find(c => c.name === 'N栏' || c.name === 'N 栏');
    if (nCol && nCol.children) {
      const navIdx = nCol.children.findIndex(c => /NavigationBar/i.test(c.name || '') && !/Sidebar/i.test(c.name || ''));
      const sIdx = nCol.children.findIndex(c => /Sidebar|BottomBar/i.test(c.name || ''));
      if (navIdx >= 0 && sIdx >= 0 && navIdx < sIdx) {
        errors.push(`N 栏 z-order: NavBar (idx ${navIdx}) below Sidebar (idx ${sIdx}) — must be ABOVE`);
      }
    }
  }

  // ⑰ Pad横 NLC 并列 时 Sidebar 必须 frame 直接子级 (§3.9 阴影 可见)
  //    trigger: spec.framework === 'NLC并列' && spec.device === 'Pad横' (或 explicit spec.sidebarPromote === true)
  //    common-rules §3.9 「N 栏 Sidebar 阴影 z-order」 强制 — Sidebar 作为 main 内 N 栏 child 深入嵌套时
  //    L/C surface fill 绘制在 Sidebar 阴影之上 → 阴影被遮挡. frame 直接子级 last z 必要.
  //    回顾: 2026-05-31 笔记搜索+详情 task 中 Pad横 NLC并列 首次 build 时 Sidebar in main.N (深度 2) →
  //    阴影 invisible → user 「N 的 Z 位置问题」 指摘 → frame.appendChild(sd) promote 后正常化.
  //    runtime guard 化 → §3.9 规则 read 遗漏也会 verifyChecklist errors > 0 报告.
  if ((spec.framework === 'NLC并列' && spec.device === 'Pad横') || spec.sidebarPromote === true) {
    const sd = frame.findOne(c => /Sidebar/.test(c.name || ''));
    if (sd) {
      const directChild = frame.children.indexOf(sd);
      if (directChild < 0) {
        errors.push(`§3.9 violation: Sidebar must be frame 直接子级 (current: nested in '${sd.parent?.name || 'unknown'}'). 阴影被遮挡风险. frame.appendChild(sd) promote 必要.`);
      } else {
        // Sidebar must be near top z (below 杆子 only)
        const zCount = frame.children.length;
        const swIdx = frame.children.findIndex(c => /SwipeIndicator/.test(c.name || ''));
        const expectIdx = swIdx >= 0 ? swIdx - 1 : zCount - 1;
        if (directChild < expectIdx) {
          errors.push(`§3.9 violation: Sidebar z-idx ${directChild} too low (expected ${expectIdx}, just below 杆子). 阴影被遮挡风险.`);
        }
      }
    }
  }

  // ⑱ clipsContent default 强制检查 (2026-06-02 添加, frame 圆角 + 栏 overflow 防止)
  //
  //    Default: frame / L栏 / C栏 / N栏 全部 clipsContent === true.
  //    main 为唯一例外 — 见下方「full-height lane」分支.
  //
  //    ★ main.clipsContent 规则 (2026-06-02 二次修订, status bar 背景色 再发防止):
  //      本 skill 标准结构 = 各栏 full-height (`lane.y = -SBH`, lane 向 main 上方溢出 SBH,
  //      用自身 fill 一直涂到 status bar 区域, §0 #26「frame 透明 + 各栏自身 fill」).
  //      lane 向 main 上方 overflow → **main.clipsContent=true 时该 SBH 区段被 clip
  //      → status bar 区域 lane fill 不被绘制, canvas 灰底 bleed-through**. 因此 full-height
  //      lane 结构下 main 必须 **永远 false** (与 Pad横 §3.9 无关). gold-ref _OK frame 全部 main=false.
  //      → 检测到 full-height lane (子 lane.y < 0) 时 expectMain=false, 否则沿用旧 default.
  //
  //    回顾 1 (2026-06-02 笔记 适配): §3.9 错误泛化 → frame/L/C 全 false → cornerRadius 消失 +
  //      chip/text overflow. frame/L/C 永远 true 才正确.
  //    回顾 2 (2026-06-02 待办 适配): 回顾1 反作用使 main 也被强制 true → Fold内横/竖+Pad竖 的
  //      status bar 区域 lane fill 未应用 → canvas 灰底 bleed-through (user 指出状态栏背景色又错).
  //      guard 自身在强制 bug (main=true). → 改为基于 full-height lane 检测的分支. 真正预防 =
  //      placement.ts buildFrameSkeleton() 统一建骨架 (frame 透明 / main clip=false / lane full-height).
  {
    const isPadHengNLCParallel = (spec.framework === 'NLC并列' && spec.device === 'Pad横') || spec.sidebarPromote === true;
    if (frame.clipsContent !== true) {
      errors.push(`clipsContent: frame.clipsContent=${frame.clipsContent} != true (圆角显示 + content clip 必要). §3.9 规则对 frame 自身无影响`);
    }
    const main = frame.children.find(c => c.name === 'main');
    if (main) {
      // full-height lane 检测: main 内有任一 lane 以 y<0 向上方 overflow → 即用 lane fill
      // 绘制 status bar 区域的 §0 #26 结构 → main 必须 clip=false.
      const hasFullHeightLane = (main.children || []).some(c =>
        /^(L|C|N)栏$|^(L|C|N) 栏$/.test(c.name || '') && c.y < 0);
      const expectMain = hasFullHeightLane ? false : (isPadHengNLCParallel ? false : true);
      if (main.clipsContent !== expectMain) {
        errors.push(`clipsContent: main.clipsContent=${main.clipsContent} != ${expectMain} (${hasFullHeightLane ? 'full-height lane 结构(§0 #26): main=false 才能在 status bar 区域绘制 lane fill, true 时 canvas 灰底 bleed-through' : (isPadHengNLCParallel ? 'Pad横 NLC并列 §3.9 Sidebar 阴影须 false' : 'default true')})`);
      }
      for (const col of (main.children || [])) {
        if (!/^(L|C|N)栏$|^(L|C|N) 栏$/.test(col.name || '')) continue;
        const isN = /^N栏$|^N 栏$/.test(col.name || '');
        const expectCol = (isPadHengNLCParallel && isN) ? false : true;
        if (col.clipsContent !== expectCol) {
          errors.push(`clipsContent: ${col.name}.clipsContent=${col.clipsContent} != ${expectCol} (${(isPadHengNLCParallel && isN) ? 'Pad横 NLC并列 N 栏 §3.9' : 'default true'})`);
        }
      }
    }
    // promoted L 栏 (LEditMode 情况) 也 clipsContent=true 强制
    const Lprom = frame.children.find(c => c.name === 'L栏' || c.name === 'L 栏');
    if (Lprom && Lprom.clipsContent !== true) {
      errors.push(`clipsContent: promoted L栏.clipsContent=${Lprom.clipsContent} != true`);
    }
  }

  // ⑲ lane content top y 起点 自动检查 (2026-06-02 追加, rule-doc-only failure 防止)
  //
  //    条件: 各栏 (`L栏 / C栏 / N栏`) = `y=0, h=frameH` 满高度模式 (per common-rules §0 #26
  //    "禁止 frame fill, 各栏自身负责 fill") 时.
  //    此模式下 lane 坐标系 y=0 = frame y=0 = status bar 上沿. 因此 lane 内
  //    第一个 content (NavBar 等) 的 y 坐标必须满足 device-dim「基本对齐方式」per
  //    `各栏内容与状态栏之间需要 6dp 的 padding` → **`y >= SBH + 6`**.
  //
  //    回顾 (2026-06-02 笔记 多端适配 task): 4 frame 全部以 lane y=6 (frame y=6) 配置
  //    NavBar → status bar 区域 (frame y=0~SBH) 与 NavBar overlap.
  //    user 指出「标题栏 位置错了」后 lane-y +SBH 补正. .md only 规则 (device-dim
  //    + §0 #26 交叉) → caller inline 结合遗漏 → 6 个月 7 次再发 (memory
  //    `feedback_runtime_enforce_rules`).
  //
  //    runtime guard 化: spec.statusBarH 提供时自动 trigger. lane.y === 0 + lane.h
  //    >= frameH-1 (满高度模式) 时, lane 内 standard A 类 component 的
  //    最小 y < SBH + 6 → errors.push.
  //    skip: lane 自身为 short height (例: lane.h === mainH = frameH - SBH) 模式时
  //    SBH offset 已应用至 lane.y → lane-internal y=6 正常 → 自动 skip.
  if (spec.statusBarH !== undefined) {
    const SBH = spec.statusBarH;
    const minY = SBH + 6;
    const checkLane = (lane) => {
      if (!lane || lane.y !== 0) return; // lane 自身 SBH offset 模式 → skip
      if (Math.abs(lane.height - spec.frameH) > 1) return; // 仅检查满高度模式
      const STD_RX = /^(NavigationBar|SearchBar|SelectableChip|List_|Detail_|TextInput|Sidebar|TopBar)/;
      const BOTTOM_RX = /^(BottomBar|Fab|TextInput.*_0[1-8]|杆子|SwipeIndicator)/; // 底部对齐 control: SBH 检查除外
      for (const inst of (lane.children || [])) {
        if (!STD_RX.test(inst.name || '')) continue;
        if (BOTTOM_RX.test(inst.name || '')) continue;
        // 底部对齐推测 (y > frameH - 200): skip
        if (inst.y > spec.frameH - 200) continue;
        if (inst.y < minY) {
          errors.push(`lane content top y violation: ${lane.name}/${inst.name} y=${inst.y} < SBH+6=${minY} (栏 y=0 h=frameH 满高度模式 → device-dim「基本对齐方式」 status bar 6dp clear 必要)`);
        }
      }
    };
    const main2 = frame.children.find(c => c.name === 'main');
    if (main2) {
      for (const col of (main2.children || [])) {
        if (/^(L|C|N)栏$|^(L|C|N) 栏$/.test(col.name || '')) checkLane(col);
      }
    }
    const Lprom2 = frame.children.find(c => c.name === 'L栏' || c.name === 'L 栏');
    if (Lprom2) checkLane(Lprom2);
  }

  // ⑯ inner componentProperties 与源稿同步 (chk.sourceInstId 提供时)
  if (Array.isArray(spec.componentChecks)) {
    for (const chk of spec.componentChecks) {
      if (!chk.sourceInstId) continue;
      const t = await figma.getNodeByIdAsync(chk.id);
      const s = await figma.getNodeByIdAsync(chk.sourceInstId);
      if (!t || !s) continue;
      const walk = (a, b, path) => {
        if (!a || !b || !a.children || !b.children) return;
        const len = Math.min(a.children.length, b.children.length);
        for (let i = 0; i < len; i++) {
          const ai = a.children[i], bi = b.children[i];
          if (!ai || !bi || ai.name !== bi.name) continue;
          if (ai.type === 'INSTANCE' && bi.type === 'INSTANCE' && bi.componentProperties) {
            for (const [pname, pval] of Object.entries(bi.componentProperties)) {
              if (!['VARIANT','BOOLEAN','TEXT','INSTANCE_SWAP'].includes(pval.type)) continue;
              const av = ai.componentProperties && ai.componentProperties[pname] && ai.componentProperties[pname].value;
              if (av !== pval.value) errors.push(`inner state mismatch: ${path}/${ai.name}.${pname}: adapt='${av}' source='${pval.value}'`);
            }
          }
          walk(ai, bi, `${path}/${ai.name}`);
        }
      };
      walk(t, s, chk.label || t.name);
    }
  }

  return errors;
}
