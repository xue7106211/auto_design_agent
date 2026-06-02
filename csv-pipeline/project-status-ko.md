# 项目进展状况

> **本文档为进度的单一权威.** 开始工作前阅读, 工作结束时更新.
> 最后更新: 2026-06-01
>
> ⚠️ **有有效期**: 本文档**仅在 workflow-reform 进行期间**有效. 所有 Stage(1A/1B/1C/2/3) 完成后, 应迁移至 `csv-pipeline/archive/project-status-final.md` 并切换至稳定运营阶段. reform 结束后, 未来 AI 不需要例行阅读本文档.

## 当前阶段

**Stage 2B / 3A 产出完成. 剩余 = 3A wire-up (参考 Improvement_doc/3A-wire-up-plan.md)**

摘要:
- **Stage 1A / 1B / 2A / 2B / 3A 核心产出 + 3B** = ✅ 完成 (参考下方 "已完成工作")
- **Stage 2C (SKILL 精简)** = ❌ 废弃 (2026-06-01, ROI 较低决策 — user 直接指示)
- **Stage 3A wire-up** = 🟡 进行中 (Step 2 sample 1 errors=0 验证完, 追加 sample 累积后 verify.ts rewrite 决定. SKILL Phase 5 spec consume 未完)
- **Stage 3B baseline** = ✅ 完成 (errors=0 / warnings=103 外部 dependency)

## 已完成工作

### Stage 1A Phase 1 — extract-mapping 管线 (✅ 2026-05-25)

- 实现 `scripts/extract-mapping.ts` (~480 lines)
- 实现 `scripts/show-status.ts`
- `package.json` + `tsconfig.json` 配置
- 依赖: csv-parse, csv-stringify, tsx, typescript
- 注册 `npm run extract` + `npm run status` 命令
- 单次执行验证完成:
  - 入: 146 source 行 (`mapping-input/结构变化表 - 控件总表.csv`)
  - 出: 1253 规范化行, 17 个 app 拆分
  - `mapping-output/SystemUIKIT-mapping.csv` (22 项, SystemUIKIT)
  - `mapping-output/app-{App}-mapping.csv` × 17
  - `mapping-output/components.csv` (178 组件)
  - `mapping-output/extract-report.md` (warnings 0 件)
  - `mapping-output/.last-extract` (mtime sentinel)

### 输入拆分 — 团队 ownership (✅ 2026-05-25)

**背景**: 为支持 designer 分工 workflow, 将单一 mega CSV (`结构变化表 - 控件总表.csv`) 拆分为 17 个团队独立文件.

**完成工作**:
- 编写并执行一次性拆分脚本 `scripts/split-input.ts`
- 生成 `mapping-input/结构变化表-{App}.csv` × 17 (1230 行 → 146 数据行拆分, 保留 3-level 表头)
- `控件变体清单 - 控件变体清单.csv` → `控件变体清单.csv` 简化命名
- 拆分后原 mega CSV 自然移除
- `extract-mapping.ts` 支持多输入 (glob `结构变化表-*.csv` + 表头一致性验证)
- `show-status.ts` 自动检测多 source
- pre-commit hook 沿用现有 `mapping-input/*.csv` glob, 兼容

**团队分配**:
| 团队文件 | 负责 |
|---|---|
| 结构变化表-SystemUIKIT.csv | 系统团队 (Keyboard / StatusBar / SwipeIndicator) |
| 结构变化表-Notes.csv | 笔记 designer (含 待办 Tasks) |
| 结构变化表-Phone.csv | 电话 designer (含 展示+收起拨号键盘 sub-state) |
| 结构变化表-Contacts.csv | 联系人 designer (含 Pad 端 sub-state) |
| 其余 14 个 | 各 app designer |

**验证**: extract 输出一致 (1253 行, 17 app, matched=785, warnings=0)

### Stage 2A 笔记 整理 — I4 enum 权威登记 + I2 栏背景色 吸收 (✅ 2026-05-26)

**I4 — 枚举定义 (37 行) 移除**:
- 新增 `common-rules.md §0.4 共通枚举定义` — 8-device + screenMode + resultType enum 单一权威
- 笔记.md `## 枚举定义` (line 264-303) → 替换为 1 行 pointer
- 效果: 笔记 之外的其它 16 个 app reference 也可后续按相同模式整理 (确立单一权威)

**I2 — 栏背景色 (73 行) → §0.3 吸收**:
- 整体移除 `## 栏背景色` 章节 (line 717-789)
- 同样数据在 §0.3 内重新整理为 `device × screenMode 的 fill 矩阵` 整合表 (3 张表: 手机/Fold外, Fold内, Pad)
- card-presence rule prose 已由 §0.3 既有内容覆盖 — 移除重复
- 待办 差异点仅以 1 行 footnote 处理

**结果**: 笔记.md 758 → **702 行** (-56 行, 累计 -94 行 from 796)

### Stage 2A 笔记 整理 — I3 组件间距 章节移除 (✅ 2026-05-26)

**范围**: `app-variant-map-笔记.md` 单独. 其余 16 个 app 保持未开始状态 (笔记 试点验证优先).

**工作**:
- 删除 `## 组件间距` 章节 (line 669-715, 48 行) → 替换为 components.csv pointer 5 行
- 信息保留验证: components.csv (Stage 1B output) 的 InternalPadL/R + TitleLeftPad + Note 列覆盖所有 padding 信息 (定宽 / 屏中对齐 / 底部位置 / 含特殊规则)
- TextInput_Notes_01~04 的 device-dimensions.md 冲突解决规则迁移至 §0.2 末尾 (line 193-195)
- Sidebar_02 deprecation 规则已经被 N 收起 规则(line 324, 328) 完全覆盖 — 不需要单独工作
- 结果: 笔记.md 796 → 758 行 (-38 行)

**下一步**: I4 (枚举定义 移除) → I2 (栏背景色 §0.3 吸收) → I1 (映射表 移除, 影响最大)



**尝试**: `app-variant-map-笔记.md` (796 行) 试点拆分 — 新建 `-tokens.md` (§0.3) + `-keys.md` (§0.4) 文件.

**问题发现后回滚**:
- workflow-reform-plan §2A 中 "Phase 5 仅 -tokens.md / Phase 4.5 仅 -keys.md" 假设与实际 SKILL.md 结构不符. SKILL.md 指示整体加载 `app-variant-map-{app}.md §0` (line 187, 320 等).
- 拆分对 AI context 节省为 0. 行数反而增加 (frontmatter + pointer overhead).
- csv-to-spec.ts (Stage 3A) 用途上, §0.4 表在正文中也可同样 parse — 无需拆分.

**回滚**:
- 删除两个拆分文件 + 正文 §0.3 / §0.4 inline 复原
- `references/app-variant-map-笔记.md` 还原为 796 行

**教训**:
- 拆分仅在 "AI 可部分加载时" 才有意义. 当前 SKILL.md 整体加载 reference → 无拆分价值
- 真正节省 context 需先做 SKILL.md 自身精简 (Stage 2C) 或引入 Phase 级别的部分加载机制

### Stage 1B Phase 1 — components.csv LibraryName 列添加 (✅ 2026-05-25)

**背景**: 原 Stage 1B 计划添加 `LibraryName / Category(A/B类) / DeviceScope / HasInternalPad` 4 列. 然而分析后发现:
- `Category(A/B类)` 自动判定规则 (`InternalPad >0 即为 A 类`) 与数据矛盾 (StatusBar `0,0` 但属 A 类)
- A/B 二分覆盖不到 178 行 41 family 中的 28 family (Overlay/Decorative 组需另外分类)
- A/B 是 family 维度信息, 在每个 variant 行重复 — 不适合 CSV 列. 由 `csv-to-spec.ts` 代码 lookup 更清晰
- `DeviceScope` 自动推断覆盖率 9% (16/178), 91% 需 designer 在 `控件变体清单.csv` 输入 — 即时价值低

**决策**: 将 Stage 1B 简化为添加 `LibraryName` + `PaddingL/R → InternalPadL/R` rename. Category/HasInternalPad/DeviceScope 在 Stage 3A `csv-to-spec.ts` 中通过代码 lookup 处理.

**完成**:
- `extract-mapping.ts` 添加 `ComponentMeta` interface + `resolveLibrary()` 规则
- `APP_PREFIX_RE = /^(Notes|Calendar|Settings|Weather|Recorder)_/` → `业务组件库`, 其余 → `OS4 UI Kit` (基于 common-rules §0.5.1)
- `components.csv` 列: 添加 `LibraryName`, `PaddingL/R` → `InternalPadL/R` rename
- 验证: 178 行全部映射 (业务组件库 68, OS4 UI Kit 110), warnings=0, legacy diff 无变化

**Library 源锁定 (3 个)**:
- `Xiaomi-Hyper-OS4-UI-Kit` (FBvQ3xM5C62MgIcA1JHWIs)
- `Xiaomi-HyperOS-业务组件库` (mrvMGwkbZ7qZML7iOfQsvI)
- `HyperOS4-Design-Token-Lib` (5gZYD8i6JqBvsaS7yvnO9c) — token-only, 不出现在 components.csv

### 基础设施整理 (✅ 2026-05-25)

- 将映射工作整体集中在 `csv-pipeline/` 单一自足文件夹
- 与上层 `csv-migration/Improvement_doc/`(设计文档) 明确分离
- AGENTS.md 中明确 csv-pipeline 入口

### Stage 1A Phase 2 — SKILL.md mtime check (✅ 2026-05-25)

- SKILL.md 添加 `Phase 0.0a: csv-pipeline 新鲜度检查` 章节
- AI session 启动时比较 `mapping-input/*.csv` mtime → 若 stale 则自动 `npm run extract`
- 计划在 workflow-reform 结束后移除该章节 (已注明有效期)

### references device enum 批量更新 — Phase A + B (✅ 2026-05-25)

复查后发现 project-status 中 "16 个文件" 估计不准确. 实际为 4 references + SKILL.md, **5 个文件中并存 4 种命名约定**.

**Phase A 完成** (移除 Pad 后缀):
- `Pad竖屏` → `Pad竖`, `Pad横屏` → `Pad横` (13 处批量替换)
- 影响: `template.md`, `笔记.md`, `common-rules.md`, `SKILL.md`

**Phase B 完成** (enum 表扩展为 8-device):
- `app-variant-map-template.md` device enum 表: 5-device → 8-device (`手机竖`/`手机横`/`Fold外竖`/`Fold外横`/`Fold内竖`/`Fold内横`/`Pad竖`/`Pad横`)
- `app-variant-map-笔记.md` 同样处理
- template.md 的 layout decision 表 + 映射示例 entries → 对齐至 8-device
- 两个文件添加 deprecation note (明确旧约定废弃)

**Phase C 完成** (2026-05-25 追加处理):
- `common-rules.md:824` `Fold横屏 → Fold竖屏 → Pad横 → Pad竖` → `Fold内横 → Fold内竖 → Pad横 → Pad竖`
- `SKILL.md` 5 处同样模式修正 (line 188, 241-242, 290, 505, 536, 792)
- `设置.md`, `短信.md` prose `Phone/Fold外屏无导航栏` → `手机竖/手机横/Fold外竖/Fold外横无导航栏`
- 确认 4-device convention (`Fold横屏/Fold竖屏/Fold内屏-横屏`) 残留 0 件

### Stage 1A 数据质量 — legacy diff 规范化 (✅ 2026-05-25)

- 将 legacy CSV (`legacy/app-mapping-stage1a.csv`) 按新约定自动规范化后再对比
- 添加规范化函数: `normalizeLegacyDevice` (PHONE_竖屏 → 手机竖, FOLD_外屏+竖屏 → Fold外竖 等), `normalizeLegacyUiElement` (标题栏 NavigationBar → NavigationBar), `normalizeLegacyLane` (小写规范化), app 复用现有 `normalizeAppName`
- 结果: **matched 0 → 785** (得到有意义的对比)
- legacy-only 147 件 = legacy 错误分类 (例如将多组件 header 一律归为 BottomBar)
- new-only 246 件 = 新提取正确分离的情况 (Sidebar/TopBar 区分, description 整理 等)
- diff 报告现可作为 legacy 错误的 audit trail

### Stage 1A 数据质量 — warnings 精细化 (✅ 2026-05-25)

- **warnings 233 → 0** (减少 100%)
- 添加/改进:
  - `extract-mapping.ts` 推断规则 11 个 → 30 个 (TextInput, Detail, Menu, AlertDialog, Picker, FloatingWindow, ToolBar, RecordNotes, AIWindow, NewTaskWindow 等)
  - `inferUiElement` 2-pass 匹配 + special placeholder skip
  - col 1 sticky 继承 (空 col 1 → 自动 inherit 上一行 uiElement)
  - 提升拆分准确度: 优先使用 well-formed regex (`^[A-Za-z]+(_[A-Za-z0-9]+)+`), 仅在 fallback 中 warn
  - multi-line lane prefix 处理 (`C 栏：\nDetailNotes_01` 形式)
  - lane 大小写规范化 (`l栏` → `L栏`)
  - 允许 lane prefix 中的空格 (`C 栏` = `C栏`)
  - non-render keyword 扩展 (添加 `无导航栏`, `隐藏`)
  - framework-reuse placeholder 在 warnings 中降级为 silent (有意为之的模式)

### Stage 1A Phase 3 — Git pre-commit hook (✅ 2026-05-25)

- `csv-pipeline/scripts/pre-commit.sh` (hook 主体) + `install-hook.sh` (安装脚本)
- 通过 `npm run install-hook` 命令创建 `.git/hooks/pre-commit` symlink
- 行为: 检测 `csv-pipeline/mapping-input/*.csv` 已 stage → 自动执行 `npm run extract` → 自动 stage `mapping-output/`
- 非映射变更时正常 skip (零开销)
- 验证: input 变更与非映射变更两种情况均通过
- 为处理非 ASCII 文件名, 使用 `git diff --cached --name-only -z`

### 决策锁定 (变更时必须经用户确认)

参考 `../../Improvement_doc/extract-mapping-design-ko.md` §确定决策事项:

1. ✅ app 命名 = EN-only + CamelCase (`Notes`, `FileManager`, `MiMover`, `Phone`)
2. ✅ uiElement 命名 = EN-only (`NavigationBar`)
3. ✅ screenMode `""` 含义 = "该 device 无 layout split"
4. ✅ 多组件 cell 自动推断 + 模糊时 WARN
5. ✅ 8-device 约定 (含 `Fold外竖` / `Fold外横`)
6. ✅ extract-report 包含 legacy diff

### setKey 决策锁定 (`../../Improvement_doc/csv-authoring-guide-ko.md`)

- ✅ 从 CSV 移除 setKey 列
- ✅ 单一权威 = `references/app-variant-map-{app}.md §0.4`
- ✅ csv-to-spec 转换时 join

### Stage 3A Step 2 sample 1 — [TEST] 笔记多端适配_HardMapping Play2 (✅ 2026-06-01)

7 target frame end-to-end 验证 (csv-to-spec spec → spec-adapter.specToVerifyShape → verifyChecklist):

| # | Frame | ID | Spec.json | 尺寸 | errors |
|---|---|---|---|---|---|
| 1 | Fold内横-LC-笔记 | 3018:74555 | Notes_笔记_LC_默认_Fold内横_LC | 888×628 | 0 |
| 2 | Fold内竖-LC-笔记 | 3018:74556 | Notes_笔记_LC_默认_Fold内竖_LC | 628×888 | 0 |
| 3 | Pad横-NLC并列-笔记 | 3018:74557 | Notes_笔记_NLC_默认_Pad横_NLC并列 | 1422×949 | 0 |
| 4 | Pad竖-NLC覆盖-笔记 | 3018:74558 | Notes_笔记_NLC_默认_Pad竖_NLC覆盖 | 949×1422 | 0 |
| 5 | Fold外竖-C-笔记 | 3046:75979 | Notes_笔记_LC_默认_Fold外竖_C | 435×637 | 0 |
| 6 | Pad竖-NLC收起-笔记 | 3046:75980 | Notes_笔记_NLC_默认_Pad竖_NLC收起 | 949×1422 | 0 |
| 7 | Pad横-NLC收起-笔记 | 3046:75981 | Notes_笔记_NLC_默认_Pad横_NLC收起 | 1422×949 | 0 |

session 内永久化 commit chain:
- d065ee7: probe Keyboard / SelectableChip / Divider 3 family → 0 errors
- 64767ea: validator / runtime sync (PICKVARIANT_RULES → 消除 14 件 false-positive)
- f2aa901: csv-to-spec padding outer 公式 (device-dim 断点表优先)
- 6467714: NavigationBar / TopBar outer=0 风满强制 (master 自带 28dp title pl 充足)

9 项 audit 结果 (2026-06-01, render-spec.ts 精密对比):

| # | 规则 | 状态 | 位置 / 备注 |
|---|---|---|---|
| 4 | frame.clipsContent=true / main·lane·instance=false | ✅ coded | render-spec.ts L187 (frame=true), L205 (main=false), lane clipsContent=true 即 SelectableChip 正常处理 (L216) |
| 5 | lane y=0 风满 (statusBar 区域 fill 透出) | ⚠️ 重解释 | sample 1 全 7 frame 中 frame.fill == lane.fill (二者均 surface 或 surface_low). 视觉等同. spec lane.y=statusBarH 维持在 component.y 校正不需面更安全. 报告文言不正确 |
| 6 | component y = statusBarH + spec.y | ✅ implicit | main.y=statusBarH + lane.y=0 + c.y 累加结果等同 |
| 7 | children[0] FILL whitelist | ✅ partial coded | render-spec.ts L251 仅 SearchBar. NavBar / TopBar 在 commit 6467714 padding outer=0 风满后 master 自然 width 充足 → inner FILL 不需要. SelectableChip 破裂前例 (chip row 的 leftmost pill stretch) → 追加 family 慎重 |
| 8 | L list 标题自动 ellipsis | ❌ 不实施 | #13 inner state walk 禁止规则优先. user 明示请求时仅适用. designer task |
| 9 | NLC并列 main 内 z-order L→C→N | ✅ coded | createInstance 顺序 N→L→C → 末尾 C top + Sidebar promote (L319) 路径仅 N top. sample 1 errors=0 通过 |
| 10 | NLC覆盖 Sidebar = frame 直接子 + mask token 0.2 | ✅ coded | render-spec.ts L315 (sidebar promote) + L288 (mask), opacity from spec.masks[].opacity |
| 11 | C 分割线 outline token bind | ✅ coded | render-spec.ts L277 RECTANGLE+fill (视觉等同, 较 strokeLeftWeight 更安全, common-rules §3.8) |
| 12 | statusBar / 杆子 fills=[] | ✅ coded | render-spec.ts L272 (statusBar), L345 (swipeIndicator) |
| 13 | inner state walk 禁止 | ✅ N/A | render-spec.ts 侧无 inner walk |

**结论**: 9 项中 9 项 coded 完成 (#5 重解释 / #8 不实施). 报告文言 "coded 未完" 是精密 audit 后判定不正确 — queue #4 (本 9 项) 关闭. 仅 #8 残存为 designer task (单独 queue 不必).

### Stage 3A Step 2 sample 2 — [TEST] 笔记多端适配_编辑模式 V3 KIM (✅ 2026-06-02)

7 target frame end-to-end placed (section 3075:78880, page Play2):

| # | Frame | ID | Spec.json | 尺寸 |
|---|---|---|---|---|
| 1 | LC_编辑_Fold内横 | 3107:79477 | Notes_笔记_LC_编辑模式_Fold内横_LC | 888×628 |
| 2 | LC_编辑_Fold内竖 | 3109:80207 | Notes_笔记_LC_编辑模式_Fold内竖_LC | 628×888 |
| 3 | NLC_编辑_Pad横并列 | 3110:80583 | Notes_笔记_NLC_编辑模式_Pad横_NLC并列 | 1422×949 |
| 4 | NLC_编辑_Pad竖覆盖 | 3112:81326 | Notes_笔记_NLC_编辑模式_Pad竖_NLC覆盖 | 949×1422 |
| 5 | LC_编辑_Fold外竖_C | 3114:82067 | Notes_笔记_LC_编辑模式_Fold外竖_C | 435×637 |
| 6 | NLC_编辑_Pad竖收起 | 3116:82698 | Notes_笔记_NLC_编辑模式_Pad竖_NLC收起 | 949×1422 |
| 7 | NLC_编辑_Pad横收起 | 3118:83033 | Notes_笔记_NLC_编辑模式_Pad横_NLC收起 | 1422×949 |

session 内 render-spec.ts 3 bug 修复 (user 视觉指摘 5 件 root cause):

1. **mask cornerRadius 비대칭 무시** — render-spec L294~301 이 `SPEC.frame.cornerRadius` 만 사용, `spec.masks[].cornerRadius` 의 비대칭 정의 (`{topLeft:0, topRight:50, bottomLeft:0, bottomRight:50}` 등) 무시. fix: `m.cornerRadius != null ? m.cornerRadius : SPEC.frame.cornerRadius` 우선.
2. **Sidebar promote zOrder 매칭 실패** — promote 후 instance.name=`Sidebar_Component_PAD_NLC_01`, step-9 zOrder pass 의 `findChildren(c.name === 'Sidebar')` 0 match → Sidebar 가 frame.children[0] 에 머물러 main 아래 가려짐. fix: promote 时 `sidebarInst.name = 'Sidebar'` 강제.
3. **out-of-flow overlay 좌상단 박힘** — render-spec 의 overlays 처리가 `inst.name = o.family; frame.appendChild(inst)` 만 (x/y 미설정), NoticeBar / Scrollbar / TextFormatPanel 등 trigger-only overlay 가 frame (0,0) 에 dump. fix: `o.render === true` opt-in flag 미설정 시 skip.

검증 누락 회고: 첫 7 frame 생성 时 `结构变化表-Notes.csv` (designer 권위) + `device-dimensions.md` (Q18/Q19/Pad 尺寸 권위) lookup 안하고 spec.json 만 보고 작업. user 지적 후 audit:
- ToolBar variant: csv 권위 일치 (NLC/LC = `_01`, NL/C-only = `_02`) ✅
- lane width: csv + device-dim + 笔记 §0.1 #8/#9 special rule (NLC收起 N 88 收起占位) 일치 ✅
- cornerRadius: device-dim Fold 内屏 50 / Fold 外屏 비대칭 / Pad 34 일치 ✅

## 当前阶段摘要

**Stage 1A / 1B / 2A / 2B / 3A 产出** 完成. 剩余 = **Stage 3A wire-up** + 1C/1D (小型指南文档).

```
Stage 1A: ✅ 完成 — extract 管线进入稳定运营阶段
Stage 1B: ✅ 完成 — components.csv LibraryName + InternalPad rename
Stage 1C: ✅ 完成 (2026-06-01) — references/naming-conventions.md (source frame 命名规范)
Stage 1D: ✅ 完成 (2026-06-01) — references/naming-conventions.md §2 (Section 命名规范)
Stage 2A: ✅ 完成 (2026-06-01) — tokens.json + setkeys.json 单一权威分离, app-variant-map §0.3/§0.4 redirect
Stage 2B: ✅ 完成 (2026-06-01) — common-rules 5 文件拆分 + hub redirect (commits 549b929/f0952dc/366c2a6)
Stage 2C: ❌ 废弃 (2026-06-01) — SKILL 精简 ROI 较低 (user 直接决策)
Stage 3A: 🟡 部分完成 (2026-06-01) — csv-to-spec.ts + render-spec.ts + 152 spec JSON + spec-adapter.ts. Step 2 sample 1 ([TEST] 笔记多端适配_HardMapping Play2 7 frame) errors=0 验证完成. **Step 3 (SKILL Phase 5 spec consume) 未完成**
Stage 3B: ✅ 完成 (2026-06-01) — 编写 validate-csv.ts + npm script + pre-commit hook 注册 + **baseline 捕获完成** (errors=0 / warnings=103). spec-to-checklist 由 spec-adapter.ts 的 specToVerifyShape 吸收 → 单独产出不需要. 残余 warnings = 外部 dependency (designer 测试版 publish 等待)
```

### Stage 3B baseline (2026-06-01 更新, errors 129 → 0, warnings 117 → 103)

```
files=17  rows=1237  errors=0  warnings=103  report: spec-output/validate-csv-report.json
```

| code | level | 件数 | 主 file | 修正 ownership |
|---|---|---|---|---|
| `variantId-unresolved` | error | 89 → 0 | Phone / Contacts / Messaging 等 | **修正完成** (前次 session) |
| `family-missing-in-setkeys` | error | 39 → 0 | components.csv (Keyboard 9 / SelectableChip 7 / Divider 1) | **修正完成** (2026-06-01) — (1) validate-csv.ts checkComponentsCsv VariantId fallback resolve + prefix 加强 (2) probe-setkeys (Figma MCP search_design_system) → setkeys.json 中 Keyboard (`f55f11f6...` 测试版) / SelectableChip (`208b0f0f...` 测试版) / Divider (`ee073ac0...` 旧 OS4 — 测试版未 publish, NoticeBar pattern) 3 family 登录 |
| `lane-framework-compat` | error | 14 → 0 | Notes | **修正完成** (2026-06-01) — extract-mapping.ts 中 (1) framework / lane 检验逻辑 + (2) Fold内 drilldown 时 framework reframe + (3) C framework 时 lane → 全栏 collapse |
| `family-not-verified` | warning | 74 | Notes (`NoticeBar` blocker) | designer (`控件变体清单.csv` status verify) |
| `pickVariant-fallback` | warning | 43 → 29 | Notes | **部分修正** (2026-06-01) — validator PICKVARIANT_RULES 与 csv-to-spec.ts:pickVariant() 11 规则 sync (skip rules + variantId-prefix rule 追加). 残 29 = 真正的 designer task (NavBar 11 / AIWindow 10 / 搜索页面 6 / SearchBar 2) |

**下一步 action**: errors 0 达成 → spec:guarded gate 通过. 残余 103 warnings = designer ownership:
- 4 blocker family (`NoticeBar` / `Scrollbar` / `ActionSheet` / `Divider`) 测试版 publish 等待 — 74 件
- pickVariant 29 件 = ① single-screen NavBar / SearchBar 的 default variant (LC L栏=_05, C 全栏=`_11/_05/_02` 分支规则) designer 明示 ② multi-component composition (`AIWindow_Notes` 10 / `搜索页面` 6) — 一 row 中混入多 component 的 variantId. 需 row 细分或 uiElement 分离

### Stage 3A 剩余 (wire-up gap)

详见 `../../Improvement_doc/3A-wire-up-plan.md`. 核心 mismatch 3 个:

1. **runtime verify.ts schema mismatch** — verify.ts 读取 flat shape (`spec.frameW / spec.cols / spec.cornerRadius`), 但 csv-to-spec 产出的 spec.json 为 nested (`spec.frame.w / spec.layout.lanes / spec.frame.cornerRadius`). AI 每个 frame 都在手动转换.
2. **SKILL Phase 5 未消费 spec.json** — Phase 4 组件 task list 基于 .md lookup. 已产出 152 spec JSON, 但仍未实际投入使用.
3. **render-spec.ts 的 use_figma JS output 用法在 SKILL 中未规定** — Phase 5 把 render-spec 产出的 JS 传给 use_figma 的流程在任何地方都未明示.

## 下一步任务队列 (按优先级)

| # | 任务 | 估计规模 | 备注 |
|---|---|---|---|
| 1 | **3A wire-up Step 2 — 实 task sample 累积 (mature 判断)** | 中等 | sample 1 (笔记 Play2 7 frame, 2026-06-01) errors=0 完成. 后续 待办 page 或 笔记 别 page 追加 sample → mature 后 verify.ts 本体 rewrite 决定 |
| 2 | ~~**probe-setkeys family 登记**~~ | ✅ 完成 (2026-06-01) | Keyboard / SelectableChip / Divider 3 family probe → setkeys.json 登录. validate-csv error 39 → 0 |
| 3 | **3A wire-up Step 3 — SKILL Phase 5 消费 spec.json** | 大 | 将 render-spec.ts JS 输出 mandatory 流程化进 use_figma. 废弃 Phase 4 componentTaskList 「判断」流程. Step 1 追加 sample 后进入 |
| 4 | ~~**csv-to-spec / render-spec 通用规则永久化 (#4~#13)**~~ | ✅ 完成 (2026-06-01) | 9 项 audit 结果全部已 coded (#5 重解释 / #8 designer task). 上 sample 1 audit 表参照 |
| 5 | **probe-todo unverified family** | 小 | NoticeBar (16) / Scrollbar (52) / ActionSheet (6) — 测试版 publish 时 setkeys.json status: blocker → verified. validate-csv warnings 74 → 0 自动收敛 |
| 6 | **mapping-input variantId prefix 修正 89 件** | 大 | designer ownership. `1. 未选中L栏list：无标题`, `(framework_reuse)`, `无标题栏` 等 prefix 自由输入 — 检讨在 extract-mapping.ts 侧追加规范化规则的可能性 |
| 7 | **pickVariant 残余 29 designer 明示 task** | 中 | (1) NavBar single-screen LC default L栏 (`_05` vs `_02` 分支规则) — line 101 Notes csv `LC default L栏=_05` 可见, csv-to-spec 的 single-screen NavBar heuristic (前次 line 467 移除) 重定义可能性检讨. (2) `AIWindow_Notes` / `搜索页面` 等 composite uiElement 需 row 细分 (uiElement 分别单独) 或 csv-to-spec 侧 group resolver 追加 |

## 工作衔接的标准流程 (任何 AI 都相同)

```
1. 阅读 AGENTS.md (项目根)
2. 阅读 csv-pipeline/README.md
3. 阅读本 project-status-ko.md → 把握当前状态 + 下一步任务队列
4. 接受用户指示
5. 阅读相应设计文档 (../../Improvement_doc/*.md)
6. 进行工作
   - frame 适配 task → 下方「适配 task 标准流程」节参照
7. 结束前:
   - 在本文档 "已完成工作" 中追加项
   - 从 "下一步任务队列" 中移除已完成项 + 添加发现的后续任务
   - 若有新决策, 在设计文档中锁定
```

## 适配 task 标准流程 (frame 适应时, 2026-06-01 user 决策)

> AI 不做决定 / 不做规则化. designer 对每个 component 选择「跟随基本规则 / explicit override」. 跟随基本规则 → 该规则的所有附属行为自动 cascade.

```
适配 task 进入时:
1. mapping-input → mapping-output 自动生成 (npm run extract)
2. 阅读 references/layouts/device-dimensions.md 全文
   (基本骨架 + padding 断点 + 浮层/工具栏/搜索/遮罩 spec)
3. 阅读 控件变体清单.csv + 通过 setkeys.json 验证 figma source
4. 阅读 结构变化表-{App}.csv 对应 sub-scene + state 行 + cell 内 prose annotation
   阅读 app-variant-map-{App}.md §0 (app-specific 基本规则)

收到 designer figma file 后:
5. source dump: get_metadata + get_design_context + get_screenshot
   font precheck + sourceVisibleInventory 3 分类 (bar / main-content / overlay)

每个 case (target frame) 的 mapping 编写:
6. AI 列出每个 component / overlay / mask / floatingContainer 的「可选项」:
   - 选项 A 「基本规则」: device-dim / app-variant-map §0.X 的适用规则
   - 选项 B 「explicit override」: 该 case 特有的明示值 (variantId / x/y/w/h / fill / inner)
7. designer 对每个项选择 A 或 B
   - A 选中 → 该规则的所有附属行为自动 cascade (padding / position / inner walk / fill / mask / zOrder ...)
   - B 选中 → 该 explicit 值直接 write
8. AI 按照 designer 的选择应用 (placeStandardComponent 既存函数), get_screenshot 视觉验证, verifyChecklist errors=0 后进入下一 case
```

**AI 不做的事**: 推断决定 / 规则化提议 / 自动选择基本规则 / 推测 explicit override.
**「基本规则」的来源**: device-dimensions.md, common-rules-instance.md §3.4a/§3.6, common-rules-mask-zorder.md §3.7~§3.8, component-placement-protocol.md §2~§4, app-variant-map-{App}.md §0, font-degradation.md.

## 命令

```bash
cd csv-pipeline
npm run extract    # mapping-input/*.csv → mapping-output/ 重新生成
npm run status     # 输出当前状态 + 本文档的下一步任务队列
```

## 产出物位置

```
csv-migration/                              ← 上层 workspace
├── Improvement_doc/                        ← 设计文档 (项目外部)
│   ├── workflow-reform-plan-ko.md / .md
│   ├── csv-authoring-guide-ko.md / .md
│   └── extract-mapping-design-ko.md / .md
└── auto_design_agent_backup/               ← Skill 仓库根
    ├── AGENTS.md                           ← AI 入口
    ├── SKILL.md, README.md, references/    ← 现有 Skill 资产
    └── csv-pipeline/                       ← 映射工作自足 sub-project
        ├── README.md                       ← 文件夹入口
        ├── project-status-ko.md / .md      ← 本文档
        ├── package.json + tsconfig.json
        ├── node_modules/
        ├── mapping-input/                  ← designer 上游 (按团队拆分所有权)
        │   ├── 结构变化表-{App}.csv × 17   ← 各 app 团队独立文件
        │   └── 控件变体清单.csv            ← 组件 designer (单一)
        ├── mapping-output/                 ← extract 产出 (重新生成)
        │   ├── SystemUIKIT-mapping.csv
        │   ├── app-{App}-mapping.csv × 18
        │   ├── components.csv
        │   ├── extract-report.md
        │   └── .last-extract
        ├── scripts/
        │   ├── extract-mapping.ts
        │   └── show-status.ts
        └── legacy/
            └── app-mapping-stage1a.csv     ← 用户手动编写版 (参考用)
```

> **位置注意**: 设计文档位于**上层** `csv-migration/Improvement_doc/`, 映射工作整体位于**项目内** `csv-pipeline/`. 自足 sub-project.
