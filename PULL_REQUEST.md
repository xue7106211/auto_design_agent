# 规则文档全面补充：布局规则重写 + 组件映射表 + 设备尺寸规范

## 概要

对 `references/` 目录下的规则文档进行全面补充和重写，将 TODO 骨架替换为基于 Figma UI Kit 实测的完整规则数据。涵盖设备尺寸规范、布局规则、组件适配映射和组件路由表。

**Branch:** `feat/update-nlc-layout-and-bottom-tab` → `main`

---

## 变更内容

### 1. `references/device-dimensions.md` — 设备尺寸规范大幅补充

- 新增断点定义表（`w<600` / `600≤w<960` / `w≥960`）
- 补充手机端、Fold 内屏各方向标题栏高度（NavigationBar 变形）
- 补充 Pad 横屏/竖屏各栏标题栏高度（N 栏中标题/大标题、L 栏/C 栏小标题）
- 完善 Fold 内屏横屏/竖屏分栏宽度、栏间分割线、各栏 padding
- 新增 Pad 横屏/竖屏完整尺寸（M80Pad 基准）及 NLC/NC/LC 各栏 padding
- 新增横竖屏旋转规则（Pad / Fold 通用）
- 修正状态栏高度为 46dp
- 新增悬浮底部导航栏（Bottom Tab Bar）尺寸、tab 宽度/数量/对齐规则
- 移除 N8 外屏特殊规则（已不适用）

### 2. `references/layout-nlc.md` — NLC 布局规则全面重写

- 重写 NLC 布局文档，补充 N/L/C 各栏适配规则
- 补充导航转换逻辑（底部 Tab → 侧边导航）
- 补充展开/收起规则
- 补充旋转规则
- 统一标题栏描述为 NavigationBar 变形名称

### 3. `references/layout-c.md` — 重写为 LC/NC 布局规则

- 将原 C 通栏布局文档重写为 LC/NC 分栏布局规则
- 补充 Fold 内屏和 Pad 各方向的栏宽与 padding
- 补充 LC 的 L 栏（列表栏）适配规则：顶部模块、列表内容、选中态
- 补充 NC 的 N 栏（导航栏）适配规则：底部导航 → 侧边导航转换
- 补充 C 栏（内容区）通用适配规则：顶部、正文、底部
- 补充栏间分割线和横竖屏旋转规则

### 4. `references/layout-lc-nc.md` — LC/NC 文档同步更新

- 标题从"双栏"改为"分栏"
- 统一标题栏描述为 NavigationBar 变形名称（Pad-TopBar 小标题 56dp）

### 5. `references/component-adaptation.md` — 组件适配映射表全面重写

- 将 TODO 骨架替换为完整的组件适配映射表
- 按设备（Pad / Fold 内屏）和布局类型（NLC / NC / LC / C）分类
- 导航类：悬浮底部导航栏在各布局下的转换规则
- 标题栏类：Fold/Pad 各栏的 NavigationBar 变形映射
- FAB 类：跨设备通用规则
- 横屏/小尺寸屏组件替换规则
- 补充通用规则（搜索优先级：search_design_system → component-routing → clone）

### 6. `references/component-routing.md` — 组件路由表全面重写

- 将 TODO 骨架替换为实测 componentKey
- 导航类：BottomBar / BottomTab / Sidebar 全系列（竖屏/横屏/小尺寸屏）
- 顶部栏：Pad-TopBar
- FAB：Fab-Showcase / Fab-MiniHorizontal-Showcase
- 搜索栏：SearchBar-ComponentSet
- 其他：Overlay 系列
- 所有 Key 来自 Xiaomi Hyper OS4 UI Kit 组件库

### 7. `references/layout-lc.md` — 已删除

- 原 LC 布局规则已合并至 `layout-lc-nc.md`，此文件删除

---

## Commit 历史

| Commit | 说明 |
|--------|------|
| `5af405e` | feat: 补充设备尺寸规范 — 断点定义、分栏宽度、padding 及旋转规则 |
| `7fd9a9a` | fix: 修正 Pad LC 模式各栏 padding 归属 |
| `2117c75` | feat: 补充悬浮底部导航栏规范 & 重写 NLC 布局适配规则 |
| `46a8dde` | feat: C 布局规则补完, LC/NC 文档合并, 设备尺寸 C 栏 padding 补充 |
| `212318e` | feat: 补充组件适配映射表、组件路由表、标题栏高度规范，layout-c 重写为 LC/NC 规则 |

---

## 影响范围

- 引用 `layout-lc.md` 的 Skill 需更新引用路径为 `layout-lc-nc.md`
- 引用 `layout-c.md` 的 Skill 需注意：该文件已从 C 通栏规则重写为 LC/NC 分栏规则
- 引用 `component-adaptation.md` 和 `component-routing.md` 的 Skill 可直接受益于完整数据
- 引用 `device-dimensions.md` 的 Skill 可直接受益于更完整的尺寸数据

---

## 变更统计

- **7 files changed**, 541 insertions(+), 213 deletions(-)

| 文件 | 变更 |
|------|------|
| `references/device-dimensions.md` | +155 / -14 |
| `references/layout-nlc.md` | NLC 全面重写 |
| `references/layout-c.md` | 重写为 LC/NC 规则 |
| `references/layout-lc-nc.md` | 同步更新 |
| `references/component-adaptation.md` | 全面重写 |
| `references/component-routing.md` | 全面重写 |
| `references/layout-lc.md` | 删除（已合并） |

---

## 验收要点

- [ ] `device-dimensions.md` 中所有尺寸均为 dp/pt 标注，无模糊描述
- [ ] `layout-nlc.md` 重写后 N/L/C 各栏规则完整，展开/收起/旋转逻辑清晰
- [ ] `layout-c.md` 重写为 LC/NC 规则后，Fold/Pad 各场景栏宽和 padding 有明确数值
- [ ] `layout-lc-nc.md` 与 `layout-c.md` 内容一致（同步更新）
- [ ] `component-adaptation.md` 覆盖导航类、标题栏类、FAB 类组件的适配映射
- [ ] `component-routing.md` 所有 componentKey 来自 Xiaomi Hyper OS4 UI Kit
- [ ] 引用 `layout-lc.md` 的 Skill 文件已确认需要更新路径（或在后续 MR 处理）
