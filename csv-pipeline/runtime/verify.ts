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
//   ⑰  §3.9   Pad横 NLC 并列 Sidebar promote (frame 직접子级 last z, 阴影 가시)

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

  // ⑤ 杆子 (SwipeIndicator)
  const gz = frame.children.find(c => c.name && (/SwipeIndicator/.test(c.name) || c.name.startsWith('杆子')));
  if (gz) {
    if (Math.abs(gz.width - spec.frameW) > 1) errors.push(`杆子.width ${gz.width} != ${spec.frameW}`);
    if (gz.fills && gz.fills.length > 0) errors.push(`杆子.fills should be empty (transparent)`);
    if (frame.children.indexOf(gz) !== frame.children.length - 1) {
      errors.push(`杆子 not at top z-order`);
    }
  }

  // ⑥ Sidebar 高度
  if (spec.sidebar) {
    const sd = frame.children.find(c => c.name && /Sidebar/.test(c.name));
    if (sd && Math.abs(sd.height - spec.sidebar.h) > 1) {
      errors.push(`Sidebar.height ${sd.height} != ${spec.sidebar.h} (reflow?)`);
    }
  }

  // ⑥b Sidebar_Notes attached form: H = mainH 풀히트, y = statusBarH (2026-05-31 추가)
  //     app-variant-map-笔记.md §0.5 「Sidebar_Notes attached form」 룰 적용 검증.
  //     trigger: spec.sidebarMainH === true.
  //     master 가 H=Fill 정의이지만 createInstance default FIXED → 명시 호출 필요.
  //     verifyChecklist 가 자동 검출.
  if (spec.sidebarMainH) {
    const sd = frame.children.find(c => c.name && /Sidebar_Notes/.test(c.name));
    if (sd) {
      const expectH = spec.frameH - spec.statusBarH;
      if (Math.abs(sd.height - expectH) > 1) {
        errors.push(`Sidebar_Notes.h ${sd.height} != mainH ${expectH} (frameH ${spec.frameH} - statusBarH ${spec.statusBarH}); §0.5 attached form 풀히트 누락`);
      }
      if (sd.y !== spec.statusBarH) {
        errors.push(`Sidebar_Notes.y ${sd.y} != statusBarH ${spec.statusBarH}`);
      }
      // 「新版标题栏」 (children[0].children[0]) H=56 자연 검증 (FILL 잘못 적용 detect)
      if (sd.children?.[0]?.children?.[0]) {
        const titleBar = sd.children[0].children[0];
        if (/标题栏|新版标题栏/.test(titleBar.name || '') && titleBar.height > 100) {
          errors.push(`Sidebar_Notes.「新版标题栏」 h=${titleBar.height} (자연 56 초과); 3-level FILL 잘못 적용 의심`);
        }
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

  // ⑭ ToolBar 胶囊 width — 2026-06-01 룰 폐기
  //
  //    旧 룰: 栏 W ≤ 440 → capW = 栏W−48 / > 440 → 344 居中.
  //    이 룰이 capsule 의 master 자연 width (220 / 344) 와 inner button 자연
  //    width (28×28 icon) 를 무시하고 강제 변경 → button icon stretch.
  //    user 지적: 「캡슐의 넓이는 왜 마음대로 줄이냐. 아이콘 찌그러지는 건
  //    아니다」.
  //
  //    新 룰: capsule = master HUG default 그대로 유지가 정답. instance level
  //    자동 검사 不要 (master 가 단일 자연 width 보장). 본 항목 폐기.
  // (구 ⑭ 검사 폐기)

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

  // ⑰ Pad横 NLC 并列 时 Sidebar 必须 frame 直接子级 (§3.9 阴影 가시)
  //    trigger: spec.framework === 'NLC并列' && spec.device === 'Pad横' (또는 explicit spec.sidebarPromote === true)
  //    common-rules §3.9 「N 栏 Sidebar 阴影 z-order」 강제 — Sidebar 가 main 内 N 栏 child 로 깊이 들어가면
  //    L/C surface fill 이 Sidebar 阴影 위에 그려짐 → 阴影 가려짐. frame 直接子级 last z 必要.
  //    회고: 2026-05-31 笔记搜索+详情 task 에서 Pad横 NLC并列 첫 build 시 Sidebar in main.N (깊이 2) →
  //    阴影 invisible → user 「N의 Z 위치 문제」 지적 → frame.appendChild(sd) promote 후 정상화.
  //    runtime guard 化 → §3.9 룰 read 누락해도 verifyChecklist errors > 0 보고.
  if ((spec.framework === 'NLC并列' && spec.device === 'Pad横') || spec.sidebarPromote === true) {
    const sd = frame.findOne(c => /Sidebar/.test(c.name || ''));
    if (sd) {
      const directChild = frame.children.indexOf(sd);
      if (directChild < 0) {
        errors.push(`§3.9 violation: Sidebar must be frame 직접子级 (current: nested in '${sd.parent?.name || 'unknown'}'). 阴影 가려짐 위험. frame.appendChild(sd) promote 必要.`);
      } else {
        // Sidebar must be near top z (below 杆子 only)
        const zCount = frame.children.length;
        const swIdx = frame.children.findIndex(c => /SwipeIndicator/.test(c.name || ''));
        const expectIdx = swIdx >= 0 ? swIdx - 1 : zCount - 1;
        if (directChild < expectIdx) {
          errors.push(`§3.9 violation: Sidebar z-idx ${directChild} too low (expected ${expectIdx}, just below 杆子). 阴影 가려짐 위험.`);
        }
      }
    }
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
