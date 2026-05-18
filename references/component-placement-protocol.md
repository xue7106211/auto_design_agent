# 标准组件落位协议 Component Placement Protocol

本文档为多端适配 Skill 中**所有标准组件落位**的强制协议。Skill / 各 layout reference / app-variant-map 必须按本协议执行，禁止 inline 临时序列。

## 0. 设计动机

历次会话发现的 18+ 项错误中，**有效率最高的根因来自三类**：

1. **自带 auto-layout 实例 swap 后 width / height / position reflow**（涵盖 Sidebar / NavBar / SearchBar / TextInput / Detail / List / Chip / BottomBar 等所有标准组件）
2. **每次 inline 写组件落位代码** → 一处漏一步则 N 处同时漏
3. **token 未绑定** → 直接写 RGB

本协议把这三件事固化为可调用的标准序列。SKILL 与 layout reference 在执行 Phase 5 / Phase B-D 时只调用本协议中的函数模板，禁止重新写序列。

## 1. 适用范围

| 触发场景 | 必须走本协议 |
|---|---|
| `clone` 源稿实例 → swap 到目标 variant | ✅ |
| `importComponentByKeyAsync` 后 `createInstance` 落位 | ✅ |
| 已落地实例的 `swapComponent` 或 variant 切换 | ✅ |
| 已落地实例的 `resize` | ✅ |
| 仅修改 `setProperties`（不改尺寸）| 部分（步骤 6 验证仍执行）|

适用组件家族：`StatusBar` / `NavigationBar`（含 `_Notes`）/ `SearchBar` / `SelectableChip` / `List_*` / `Detail_*` / `BottomBar_*`（含 Showcase / NoteEditPanel / Outline / ToolBar）/ `TextInput_*` / `Sidebar_*` / `Fab` / `杆子` / 任意其它带 auto-layout 的标准组件实例。

## 2. 标准落位序列（Canonical Sequence）

```js
// 单个组件落位 = 以下 6 步，顺序不可调换、不可省略
async function placeStandardComponent({
  inst,             // 已落地或克隆得到的 instance
  targetVariant,    // 目标 variant component（可选；不需切换时传 null）
  x, y, w, h,       // 目标位置 + 尺寸（栏内坐标系）
  parentZ,          // z-order：'top' | 'bottom' | undefined
  parent,           // 目标父节点（如果当前 parent 不对，先 appendChild 到目标 parent）
  resetOverrides = false,  // 默认 OFF（关键决定）
  loadFontFamilies = []    // 涉及文本时的字体白名单
}) {
  // 0. 字体加载（仅在 loadFontFamilies 非空时）
  for (const f of loadFontFamilies) {
    await figma.loadFontAsync(f);
  }

  // 1. 先迁移到目标 parent（如果不一致）。这必须在 swap 之前。
  if (parent && inst.parent !== parent) {
    parent.appendChild(inst);
  }

  // 2. variant 切换（如有）
  if (targetVariant) {
    inst.swapComponent(targetVariant);
  }

  // 3. resetOverrides 默认 OFF —— 仅当上层显式指定 true 时调用。
  //    OFF 是关键决定：reset 会清空 width override，触发 instance 自带 auto-layout
  //    回到 hug content 自然尺寸（392 / 530 / 800 等），导致 reflow。
  if (resetOverrides) {
    inst.resetOverrides();
  }

  // 4. 强制 sizing FIXED（覆盖 instance 自带 auto-layout 的 hug 倾向）
  //    四项一并设置，互不替代。某些 Figma 版本 / instance 上其中一项无效，
  //    其它项作为 fallback 仍能阻断 reflow。
  try { inst.layoutSizingHorizontal = 'FIXED'; } catch {}
  try { inst.layoutSizingVertical   = 'FIXED'; } catch {}
  try { inst.primaryAxisSizingMode  = 'FIXED'; } catch {}
  try { inst.counterAxisSizingMode  = 'FIXED'; } catch {}

  // 5. resize → 位置（顺序不可调换：先 size，再 x/y）
  inst.resize(w, h);
  inst.x = x;
  inst.y = y;

  // 6. z-order 调整（在 parent 内部）
  if (parentZ === 'top' && parent) parent.appendChild(inst);
  if (parentZ === 'bottom' && parent) parent.insertChild(0, inst);

  // 7. 落位后自检（任何异常立即 throw）
  if (Math.abs(inst.width - w) > 0.5 || Math.abs(inst.height - h) > 0.5) {
    throw new Error(`reflow detected: ${inst.name} expected ${w}x${h} got ${inst.width}x${inst.height}`);
  }
  return { id: inst.id, w: inst.width, h: inst.height, x: inst.x, y: inst.y };
}
```

**关键决定：`resetOverrides` 默认 OFF**。这是与既有 §3.4 / §3.6 的差异点。reset 会清空 width 等数值 override，触发 instance hug content → 落位失败的最常见根因。仅当目标 variant 与源 variant 内部结构差异巨大、且需要清掉旧文本 / 旧 padding override 时，才显式 `resetOverrides: true`。即使打开，也必须 step 4 + step 5 完整跟在后面把尺寸固定回来。

## 3. 父节点结构与 z-order 强制

**栏 frame 的子节点 z-order 模板**（落位前必须先建好骨架）：

| 布局 | 直接子节点（从底到顶） |
|---|---|
| LC（Fold 内屏） | `main` → `状态栏` → `栏间分割线` → `杆子`（最顶 / 透明 / 风满）|
| NLC 并列（Pad 横） | `main`（含 L/C，N 栏空位）→ `状态栏` → `栏间分割线` → `Sidebar`（z-顶其二）→ `杆子`（z-顶其一 / 风满 / 透明）|
| NLC 覆盖（Pad 竖） | `main`（含 L/C）→ `遮罩` → `状态栏` → `栏间分割线` → `Sidebar`（z-顶其二）→ `杆子`（z-顶其一 / 风满 / 透明）|

> 状态栏在覆盖模式下必须**位于遮罩之上**（保证时间 / 信号可读）。Sidebar 在所有模式下必须**位于状态栏之上**（笔记 / 待办 N 收起规则下，Sidebar 标题栏紧贴状态栏下沿）。**杆子在所有模式下必须最顶 z-order + 透明背景 + 风满 frame 宽**（设备 home indicator 标准）。

**栏内组件 stack 顺序模板**（顶部 6dp 间距起始）：

| 顺序 | 控件 | y 起点 | 高度 |
|---|---|---|---|
| 1 | NavigationBar | `6` | 56 |
| 2 | SearchBar | `62` | 44 / 56（按 variant）|
| 3 | SelectableChip | y₂ + h₂ | 52 |
| 4 | List | y₃ + h₃ | mainH - top - 100（如有 BottomBar）/ - 0（如无）|
| 5 | BottomBar / ToolBar / Showcase | mainH - 100 | 100 |

> 顺序遵循 device-dimensions.md「基本对齐方式」：标题栏 → 搜索栏 → 标签栏 → 内容 → 底部对齐控件。**与源稿顺序冲突时以本表为准**。

C 栏 stack 顺序（笔记应用）：

| 顺序 | 控件 | y / h |
|---|---|---|
| 1 | NavigationBar_Notes | y=6, h=56 |
| 2 | Detail_Notes | y=62, h=`mainH - 62`（**延伸到 frame 底部**，TextInput 通过 z-order 覆盖最后 92dp）|
| 3 | TextInput_Notes（z-上）| y=`mainH - h`, h=92, **bottom flush frame bottom**（与杆子 16dp 重叠）|

## 4. Token 解析协议

**Token 检索一次性缓存**。Phase 0 或 Phase 4 开始时调用：

```js
async function buildTokenCache() {
  const cache = { color: {} };
  const cols = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
  for (const col of cols) {
    const vars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(col.key);
    for (const v of vars) {
      if (v.resolvedType === 'COLOR') cache.color[v.name] = v;
    }
  }
  return cache;
}

async function bindFill(node, tokenName, fallbackRGB, opacity = 1) {
  const meta = TOKEN_CACHE.color[tokenName];
  let paint = { type: 'SOLID', color: fallbackRGB, opacity };
  if (meta) {
    const v = await figma.variables.importVariableByKeyAsync(meta.key);
    paint = figma.variables.setBoundVariableForPaint(paint, 'color', v);
  }
  node.fills = [paint];
  return !!meta;  // true = 已绑定 token, false = fallback RGB
}
```

**禁止在 fills 里直接写 RGB SOLID**。必须经 `bindFill(...)` 调用，至少留 token 绑定尝试 + 失败告警。

笔记应用必用 token：

| 用途 | Token 名 |
|---|---|
| frame fill / L 栏 / C 栏 fill | `背景色/surface` |
| 栏间分割线 fill | `分割线色/outline` |
| Pad 竖 NLC 覆盖 遮罩 fill | `遮罩色/mask`（opacity 0.2）|
| Detail 内文字 / NavigationBar 文字 等 | 由组件自身已绑定，无需手动 |

## 5. 变体选择校验

`app-variant-map-{app}.md` 是首要权威，但**CSV 来源标记 "需要Check" 的 variant 必须二次校验**：

1. 先按 `app-variant-map` 表落位
2. 取出该 variant 的 `mainComponent.width` / `height`
3. 若**自然尺寸与目标栏宽 / 通用 spec 偏差 > 50%**（例：variant 自然 176×44 而目标栏 282 风满）→ 触发警告，向用户确认变体选择，禁止 silently 风满 stretch
4. 若映射表条目带 "需要Check"、"待补"、"待修"、`(／／／)` 等不确定标记 → 必须向用户确认

历史踩坑：
- 笔记 LC SearchBar `_02`（自然 176×44，CSV2 标 "Pad/顶部导航/默认 - 需要Check"）→ 应改为 `_05`（392×56）
- NavigationBar `_05`（带返回 ←）→ 笔记 LC default 列表页应为 `_04`（无返回）

## 6. 组件落位后的强制验证

**每个 frame 写完所有组件后**，调用统一 `verifyChecklist(frame, spec)` 函数。失败任何一项立即修复 + 重检。

```js
async function verifyChecklist(frame, spec) {
  const errors = [];
  
  // ① 状态栏
  const sb = frame.children.find(c => c.name.includes('状态栏'));
  if (sb) {
    if (Math.abs(sb.width - spec.frameW) > 1) errors.push(`statusBar.width ${sb.width} != ${spec.frameW}`);
    if (Math.abs(sb.height - spec.statusBarH) > 1) errors.push(`statusBar.height ${sb.height} != ${spec.statusBarH}`);
    if (sb.y !== 0) errors.push(`statusBar.y != 0`);
  }
  
  // ② frame cornerRadius
  if (frame.cornerRadius !== spec.cornerRadius) {
    errors.push(`frame.cornerRadius ${frame.cornerRadius} != ${spec.cornerRadius}`);
  }
  
  // ③ frame fill 已绑定 token
  if (!frame.fills?.[0]?.boundVariables?.color) {
    errors.push(`frame.fill not bound to token`);
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
  
  // ⑤ 杆子风满 + 透明 + z-顶
  const gz = frame.children.find(c => c.name?.startsWith('杆子'));
  if (gz) {
    if (gz.width !== spec.frameW) errors.push(`杆子.width != frameW`);
    if (gz.fills?.length > 0) errors.push(`杆子.fills should be empty (transparent)`);
    if (frame.children.indexOf(gz) !== frame.children.length - 1) {
      errors.push(`杆子 not at top z-order`);
    }
  }
  
  // ⑥ Sidebar 高度（仅 Pad NLC）
  if (spec.sidebar) {
    const sd = await findSidebar(frame);
    if (sd) {
      if (Math.abs(sd.height - spec.sidebar.h) > 1) {
        errors.push(`Sidebar.height ${sd.height} != ${spec.sidebar.h}（reflow？）`);
      }
    }
  }
  
  // ⑦ NavBar / SearchBar 等关键组件 width === 栏W（reflow 自动检测）
  // ... 按 spec.componentChecks 遍历
  
  // ⑧ 遮罩 fill 已绑定 token（仅 Pad 竖 NLC 覆盖）
  if (spec.mask) {
    const mask = frame.children.find(c => c.name === '遮罩-N覆盖');
    if (!mask?.fills?.[0]?.boundVariables?.color) {
      errors.push(`mask.fill not bound to token`);
    }
  }
  
  return errors;
}
```

错误清单 > 0 时禁止汇报「适配完成」。先修后再 verify。

## 7. 与既有规则文件的关系

| 文件 | 角色 |
|---|---|
| `SKILL.md` | 主入口，调用本协议 |
| `references/common-rules.md` | 通用原则（检索边界 / 内容边界 / z-order 模式 / 落位放置）|
| `references/layouts/{nlc,lc-nc,c}-layout.md` | 各布局骨架与栏宽 |
| `references/layouts/device-dimensions.md` | 设备规格、断点 padding、对齐方式 |
| **本文件 `component-placement-protocol.md`** | **任何组件落位的标准序列 + 验证函数 + token 协议** |
| `references/app-variant-map-{app}.md` | 各应用变体映射 + 应用专用例外 |
| `references/component-dictionary/*.md` | 各组件家族字典 |

调用顺序：

```
SKILL → layout reference 决定骨架 → component-placement-protocol 落位每个组件
    → app-variant-map 给出变体 → component-dictionary 给出 nodeId/key
    → token cache（Phase 4）→ verifyChecklist（Phase 6）
```
