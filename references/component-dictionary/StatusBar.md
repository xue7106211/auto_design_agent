# StatusBar 组件字典参考

本文档是 `figma-component-dictionary` 的组件 family reference，专用于 `componentFamily = StatusBar`。common-rules.md §3.5（cross-device variant 切换 + 强制高度）已迁入本文件（2026-05-26）。

## 适用范围

- `StatusBar_01`（手机 + Fold）
- `StatusBar_03`（Pad）
- `StatusBar_02` — **deprecated 已移除**

## 权威库

**Xiaomi Hyper OS4 UI Kit AI 测试版**（file `FBvQ3xM5C62MgIcA1JHWIs`）。

2026-05-21 起整合为 **ComponentSet**：
- set key = `1047f2112a230a27d3888d27b34a5857815216e3`
- 含 `_01` + `_03` 两个 variant（已移除 `_02`）

## cross-device variant 切换 + 强制高度

**症状**：原稿 StatusBar = 手机 variant，clone 至 Fold/Pad 时 **不会自动切换**。必须显式 `swapComponent` + `resize`。

**⚠️ 禁止直接 import 单个 component key**（单个 key 在 library republish 时会失效）。唯一安全路径：

```javascript
const sbSet = await figma.importComponentSetByKeyAsync('1047f2112a230a27d3888d27b34a5857815216e3');
const sb01 = sbSet.children.find(c => c.name.includes('01')); // Fold / 手机
const sb03 = sbSet.children.find(c => c.name.includes('03')); // Pad
```

| CSV VariantId | 获取方式 | 自然尺寸 | 适用 device |
|---|---|---|---|
| `StatusBar_01` | set import → `children.find(/01/)` | 392×46 | **手机 + Fold（外+内）通用** |
| `StatusBar_03` | set import → `children.find(/03/)` | 1422×38 → **强制 34** | **Pad 专用** |

**核心**：Fold 内/外屏一律使用 `StatusBar_01`；Pad 一律使用 `StatusBar_03`。

## 各 device spec

| device | Component | spec 高度 | 自然高度 | 备注 |
|------|-----------|----------|---------|------|
| 手机 | `StatusBar_01` | 46 | 46 | 自然一致 |
| Fold 外 / 内 | `StatusBar_01` | 46 | 46 | 自然 W=392，target W 不同时（888/628 等）需 `inst.children[0].layoutSizingHorizontal = 'FILL'` + resize |
| Pad 横/竖 | `StatusBar_03` | **34** | **38** | swap 后强制 resize 至 34；**38 易 reflow** |

## MUST

1. **禁止直接 `importComponentByKeyAsync`**。必须使用 set key + `children.find()` 路径（单个 component key 在 library republish 时失效，set key 稳定）
2. Fold 适配时使用 `StatusBar_01`（set import 后 `children.find(/01/)`）
3. Pad 适配时使用 `StatusBar_03`（set import 后 `children.find(/03/)`）
4. swap 后立即 `resize(frameW, specH) → x=0, y=0`
5. **resize 后强制 inner child FILL**：`inst.children[0].layoutSizingHorizontal = 'FILL'`（组件 default 为 FILL，但已创建 instance 的 override 可能残留为 FIXED，新旧 instance 均需显式设置）
6. **所有变更完成后二次验证**：`inst.children[0].width === inst.width`，不一致则重复 step 5
7. Phase 6 必检：`(width === frameW, height ∈ {46, 34}, children[0].width === inst.width)`

## NEVER

- 原稿 deprecated set（旧 key `599a7d4b...` 等）原样使用（必须 swap 为 canonical）
- 使用 HyperOS v0.8（`15e94d49...`）（非 file 订阅库 — PM7 尝试失败，PM8 修正）
- 使用 `StatusBar_02`（deprecated，已从 set 移除）
- 未确认 file 订阅库即凭推测选择 set / component（违反 common-rules §0 #13）

## cross-reference

- common-rules.md §3.6 — auto-layout 实例 resize 通用陷阱（StatusBar 的 inner child FILL 强制规则的泛化）
- common-rules.md §3.10.B — Set key stale 检测 + §0.4 即时更新
- common-rules.md §3.4a.5 — `_00` variant 含义（StatusBar 无 `_00`，仅参考）
- `csv-pipeline/data/setkeys.json` — set key registry (单一权威 since 2026-05-31; 各 app `app-variant-map-{app}.md §0.4` 는 본 file 의 pointer)
