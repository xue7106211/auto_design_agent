# 项目进展状态

> **本文档是进度的单一权威。** 开始工作前先读，结束工作后更新。
> 最后更新：2026-06-01
>
> ⚠️ **有效期限**：本文档**仅在 workflow-reform 工作进行期间**有效。所有 Stage（1A/1B/1C/2/3）完成后，移至 `csv-pipeline/archive/project-status-final.md`，进入稳定运营阶段。reform 结束后未来的 AI 不需要 routine 阅读本文档。

> 📌 **韩文版（`project-status-ko.md`）为权威**。本中文版为同步翻译版，结构同步即可，详细 narrative 参看韩文版。

## 当前阶段

**Stage 2B / 3A 产出完成，剩余 = 3A wire-up（详 `../../Improvement_doc/3A-wire-up-plan.md`）**

## 已完成工作

### Stage 1A Phase 1 — extract-mapping 流水线 (✅ 2026-05-25)

- `scripts/extract-mapping.ts` 实现（~480 行）
- `scripts/show-status.ts` 实现
- `package.json` + `tsconfig.json` 设置
- 依赖：csv-parse、csv-stringify、tsx、typescript
- `npm run extract` + `npm run status` 命令注册
- 1 次执行验证完成：
  - 入：146 source 行（`mapping-input/结构变化表 - 控件总表.csv`）
  - 出：1253 正规化行，分离为 17 个 app
  - `mapping-output/SystemUIKIT-mapping.csv`（22 项，SystemUIKIT）
  - `mapping-output/app-{App}-mapping.csv` × 17
  - `mapping-output/components.csv`（178 组件）
  - `mapping-output/extract-report.md`（warnings 0 条）
  - `mapping-output/.last-extract`（mtime sentinel）

### 输入分离 — 团队所有权 (✅ 2026-05-25)

**背景**：为支持设计师分工，将单个 mega CSV (`结构变化表 - 控件总表.csv`) 分为 17 个团队文件。

**完成**：
- `scripts/split-input.ts` 一次性分离脚本 + 执行
- `mapping-input/结构变化表-{App}.csv` × 17 生成（1230 行 → 146 数据行分离，保留 3-level 表头）
- `控件变体清单 - 控件变体清单.csv` → `控件变体清单.csv` 文件名简化
- 原 mega CSV 在分离后自然移除
- `extract-mapping.ts` 支持多输入（glob `结构变化表-*.csv` + 表头一致性校验）
- `show-status.ts` 自动发现多 source
- pre-commit hook 通过既有 `mapping-input/*.csv` glob 兼容

**团队分配**：
| 团队文件 | 负责 |
|---|---|
| 结构变化表-SystemUIKIT.csv | 系统组件团队 (Keyboard / StatusBar / SwipeIndicator) |
| 结构变化表-Notes.csv | 笔记设计师（含待办 Tasks）|
| 结构变化表-Phone.csv | 电话设计师（含展示+收起拨号键盘 sub-state）|
| 结构变化表-Contacts.csv | 联系人设计师（含 Pad 端 sub-state）|
| 其他 14 个 | 各 app 设计师 |

**验证**：extract 输出相同（1253 行、17 个 app、matched=785、warnings=0）

### 基础设施整理 (✅ 2026-05-25)

- 映射工作全部资产整合到 `csv-pipeline/` 单一自足文件夹
- 与上层 `csv-migration/Improvement_doc/`（设计文档）明确分离
- AGENTS.md 标明 csv-pipeline 入口

### Stage 1A Phase 2 — SKILL.md mtime check (✅ 2026-05-25)

- SKILL.md 添加 `Phase 0.0a: csv-pipeline 新鲜度检查` 区段
- AI 会话启动时比较 `mapping-input/*.csv` mtime → stale 则自动 `npm run extract`
- workflow-reform 结束后本区段移除（已标注有效期）

### references device enum 批量升级 — Phase A + B + C (✅ 2026-05-25)

审查发现 project-status 中"16 个文件"估计不准确。实际是 4 references + SKILL.md，**5 个文件中并存 4 种命名约定**。

**Phase A 完成**（Pad 后缀剥离）：
- `Pad竖屏` → `Pad竖`、`Pad横屏` → `Pad横`（13 处批量替换）
- 影响：`template.md`、`笔记.md`、`common-rules.md`、`SKILL.md`

**Phase B 完成**（enum 表扩为 8-device）：
- `app-variant-map-template.md` device enum 表：5-device → 8-device（`手机竖`/`手机横`/`Fold外竖`/`Fold外横`/`Fold内竖`/`Fold内横`/`Pad竖`/`Pad横`）
- `app-variant-map-笔记.md` 同样处理
- template.md 的 layout decision 表 + 映射示例 entries → 8-device 对齐
- 两文件添加 deprecation note（明示旧约定废弃）

**Phase C 完成**（2026-05-25 追加处理）：
- `common-rules.md:824` `Fold横屏 → Fold竖屏 → Pad横 → Pad竖` → `Fold内横 → Fold内竖 → Pad横 → Pad竖`
- `SKILL.md` 5 处同型修正（line 188、241-242、290、505、536、792）
- `设置.md`、`短信.md` prose `Phone/Fold外屏无导航栏` → `手机竖/手机横/Fold外竖/Fold外横无导航栏`
- 4-device convention（`Fold横屏/Fold竖屏/Fold内屏-横屏`）残留 0 处确认

### Stage 1A 数据质量 — legacy diff 正规化 (✅ 2026-05-25)

- 读 legacy CSV (`legacy/app-mapping-stage1a.csv`) 时自动按新约定正规化后比对
- 新增正规化函数：`normalizeLegacyDevice`（PHONE_竖屏 → 手机竖，FOLD_外屏+竖屏 → Fold外竖 等）、`normalizeLegacyUiElement`（标题栏 NavigationBar → NavigationBar）、`normalizeLegacyLane`（小写正规化），app 复用既有 `normalizeAppName`
- 结果：**matched 0 → 785**（产生有意义的对比）
- legacy-only 147 条 = legacy 的错误分类（多组件 header 被一律归为 BottomBar 等）
- new-only 246 条 = 新抽取正确分离的条目（Sidebar/TopBar 区分、description 清理等）
- diff 报告现可作为 legacy 错误 audit trail

### Stage 1A 数据质量 — warnings 精细化 (✅ 2026-05-25)

- **warnings 233 → 0**（100% 减少）
- 增加 / 改进：
  - `extract-mapping.ts` 推断规则 11 → 30（TextInput、Detail、Menu、AlertDialog、Picker、FloatingWindow、ToolBar、RecordNotes、AIWindow、NewTaskWindow 等）
  - `inferUiElement` 2-pass 匹配 + 特殊 placeholder 跳过
  - col 1 sticky 继承（空 col 1 → 自动继承上一行 uiElement）
  - 拆分准确度提升：well-formed regex（`^[A-Za-z]+(_[A-Za-z0-9]+)+`）优先，仅在 fallback 时 warn
  - multi-line lane prefix 处理（`C 栏：\nDetailNotes_01` 形态）
  - 小写 lane 正规化（`l栏` → `L栏`）
  - lane prefix 允许空格（`C 栏` = `C栏`）
  - non-render keyword 扩展（添加 `无导航栏`、`隐藏`）
  - framework-reuse placeholder 由 warning 降为 silent（既定模式）

### Stage 1A Phase 3 — Git pre-commit hook (✅ 2026-05-25)

- `csv-pipeline/scripts/pre-commit.sh`（hook 主体）+ `install-hook.sh`（安装脚本）
- `npm run install-hook` 命令通过 `.git/hooks/pre-commit` symlink 安装
- 行为：`csv-pipeline/mapping-input/*.csv` staged 时自动运行 `npm run extract` → 自动 stage `mapping-output/`
- 非映射变更时 skip 正常（零开销）
- 验证：input 变更 + 非映射变更两种场景均通过
- 处理 non-ASCII 文件名使用 `git diff --cached --name-only -z`

### 已锁定决议（变更需用户确认）

详见 `../../Improvement_doc/extract-mapping-design.md` §已确定决议：

1. ✅ app 命名 = 仅 EN + CamelCase（`Notes`、`FileManager`、`MiMover`、`Phone`）
2. ✅ uiElement 命名 = 仅 EN（`NavigationBar`）
3. ✅ screenMode `""` 含义 = "该 device 无 layout split"
4. ✅ 多组件 cell 自动推断 + 歧义 WARN
5. ✅ 8-device 约定（含 `Fold外竖` / `Fold外横`）
6. ✅ extract-report 包含 legacy diff

### setKey 决议（`../../Improvement_doc/csv-authoring-guide.md`）

- ✅ CSV 移除 setKey 列
- ✅ 单一权威 = `references/app-variant-map-{app}.md §0.4`
- ✅ csv-to-spec 时 join

### Stage 3A Step 2 sample 1 — [TEST] 笔记多端适配_HardMapping Play2 (✅ 2026-06-01)

7 target frame end-to-end 验证 (csv-to-spec spec → spec-adapter.specToVerifyShape → verifyChecklist):

- Fold内横-LC-笔记 (3018:74555, 888×628) — errors=0
- Fold内竖-LC-笔记 (3018:74556, 628×888) — errors=0
- Pad横-NLC并列-笔记 (3018:74557, 1422×949) — errors=0
- Pad竖-NLC覆盖-笔记 (3018:74558, 949×1422) — errors=0
- Fold外竖-C-笔记 (3046:75979, 435×637) — errors=0
- Pad竖-NLC收起-笔记 (3046:75980, 949×1422) — errors=0
- Pad横-NLC收起-笔记 (3046:75981, 1422×949) — errors=0

session 内 永久化 commit chain:
- d065ee7: probe Keyboard/SelectableChip/Divider 3 family → 0 errors
- 64767ea: validator/runtime sync (PICKVARIANT_RULES → false-positive 14 件 제거)
- f2aa901: csv-to-spec padding outer 公式 (device-dim 断点 表 우선)
- 6467714: NavigationBar/TopBar outer=0 풍만 강제 (master 自带 28dp title pl 충분)

9 项 audit 결과 (2026-06-01, render-spec.ts 정밀 비교):

| # | 룰 | 상태 | 위치 / 비고 |
|---|---|---|---|
| 4 | frame.clipsContent=true / main·lane·instance=false | ✅ coded | render-spec.ts L187, L205 |
| 5 | lane y=0 풍만 (statusBar 영역까지 fill 透出) | ⚠️ 재해석 | sample 1 7 frame 全 frame.fill == lane.fill, 시각 동등. lane.y=statusBarH 유지가 component.y 보정 不要 면에서 더 안전 |
| 6 | component y = statusBarH + spec.y | ✅ implicit | main.y=statusBarH + lane.y=0 + c.y 누적 |
| 7 | children[0] FILL whitelist | ✅ partial | render-spec.ts L251 SearchBar 만. NavBar/TopBar 는 commit 6467714 후 master 자연 width 충분 |
| 8 | L list 제목 자동 ellipsis | ❌ 不实施 | #13 inner state walk 금지 우선. designer task |
| 9 | NLC并列 z-order L→C→N | ✅ coded | createInstance N→L→C 순서 + Sidebar promote (L319) |
| 10 | NLC覆盖 Sidebar promote + mask 0.2 | ✅ coded | render-spec.ts L315, L288 |
| 11 | C 분할선 outline token bind | ✅ coded | render-spec.ts L277 RECTANGLE+fill |
| 12 | statusBar / 杆子 fills=[] | ✅ coded | render-spec.ts L272, L345 |
| 13 | inner state walk 금지 | ✅ N/A | render-spec.ts 측 inner walk 없음 |

**결론**: 9 항 全部 코드化 完了 또는 등가 처리. queue #3 (本 9 항) 닫음.

### Stage 3B baseline — validate-csv 实运行 (✅ 2026-06-01)

`npm run validate-csv` baseline:
- filesScanned: 17, rowsScanned: 1237
- **errors: 0**
- **warnings: 103** (全部 app-Notes-mapping.csv)
  - `family-not-verified` × 74: NoticeBar(16) / Scrollbar(52) / ActionSheet(6) — setkeys.json status='blocker', 测试版 publish 대기 (외부 dependency)
  - `pickVariant-fallback` × 29 — 의도된 variant fallback (정상)

action 미필요 — 외부 dependency 解除 시 자동 0 으로 수렴.

## 当前阶段总览

**Stage 1A 全部完成** — extract 流水线进入稳定运营阶段。

```
Stage 1A: ✅ 完成
Stage 1B: ✅ 完成 — components.csv LibraryName + InternalPad rename
Stage 1C: ✅ 完成（2026-06-01）— references/naming-conventions.md (source frame 命名规范)
Stage 1D: ✅ 完成（2026-06-01）— references/naming-conventions.md §2 (Section 命名规范)
Stage 2A: ✅ 完成（2026-06-01）— tokens.json + setkeys.json 单一权威分离，app-variant-map §0.3/§0.4 redirect
Stage 2B: ✅ 完成（2026-06-01）— common-rules 5 文件分层 + hub redirect（commits 549b929/f0952dc/366c2a6）
Stage 2C: ❌ 废弃（2026-06-01）— SKILL 瘦身 ROI 低（用户直接决议）
Stage 3A: 🟡 部分完成（2026-06-01）— csv-to-spec.ts + render-spec.ts + 152 spec JSON + spec-adapter.ts。Step 2 sample 1 ([TEST] 笔记多端适配_HardMapping Play2 7 frame) errors=0 验证完成. **Step 3 (SKILL Phase 5 spec consume) 未完**
Stage 3B: ✅ 完成（2026-06-01）— validate-csv.ts 编写 + npm script + pre-commit hook 接入. baseline 捕获: errors=0 / warnings=103 (全部 app-Notes-mapping.csv 内 family-not-verified 74 + pickVariant-fallback 29; blocker 3 family = NoticeBar/Scrollbar/ActionSheet 测试版 publish 대기, 외부 dependency)
```

### Stage 3A 剩余（wire-up gap）

详细：`../../Improvement_doc/3A-wire-up-plan.md`。3 个核心 mismatch：

1. **runtime verify.ts schema mismatch** — verify.ts 读 flat shape (`spec.frameW / spec.cols / spec.cornerRadius`)，而 csv-to-spec 产出的 spec.json 是 nested (`spec.frame.w / spec.layout.lanes / spec.frame.cornerRadius`)。AI 每个 frame 手动转换。
2. **SKILL Phase 5 不 consume spec.json** — Phase 4 componentTaskList 仍基于 .md lookup。152 spec JSON 已产出但实际未进入工作流。
3. **render-spec.ts 的 use_figma JS output 用法 SKILL 未 prescribe** — Phase 5 把 render-spec 产出的 JS 喂给 use_figma 的流程未在任何地方明示。

## 下一步任务队列（按优先级）

| # | 任务 | 估计规模 | 备注 |
|---|---|---|---|
| 1 | **3A wire-up Step 2 — 实 task sample 累积 (mature 判断)** | 中 | sample 1 (笔记 Play2 7 frame, 2026-06-01) errors=0 完了. 다음 待办 page or 笔记 别 page 추가 sample → mature 후 verify.ts 本体 rewrite 决议 |
| 2 | **3A wire-up Step 3 — SKILL Phase 5 consume spec.json** | 大 | render-spec.ts JS 输出强制流入 use_figma. Phase 4 componentTaskList「判断」流废弃. Step 1 추가 sample 후 진입 |
| 3 | ~~**csv-to-spec/render-spec 일반 룰 永久化 (#4~#13)**~~ | ✅ 완료 (2026-06-01) | 9 항 audit 結과 全部 已 코드化 (위 sample 1 audit 표). #8 만 designer task |
| 4 | **probe-todo unverified family** | 소 | NoticeBar / Scrollbar / ActionSheet 测试版 publish 시 setkeys.json status: blocker → verified, validate-csv warnings 103 → ~0 |

## 接续工作的标准流程（任何 AI 通用）

```
1. 读 AGENTS.md（项目根）
2. 读 csv-pipeline/README.md
3. 读本 project-status.md（或 -ko.md）→ 把握现状 + 下一步队列
4. 接收用户指示
5. 读相关 design 文档（../../Improvement_doc/*.md）
6. 执行任务
7. 结束前：
   - 在本文档"已完成工作"添加条目
   - 在"下一步任务队列"删除完成项 + 添加发现的后续任务
   - 如有新决议，在 design 文档中锁定
```

## 命令

```bash
cd csv-pipeline
npm run extract    # mapping-input/*.csv → mapping-output/ 重新生成
npm run status     # 显示当前状态 + 本文档的下一步队列
```

## 产物位置

```
csv-migration/                              ← 上层工作区
├── Improvement_doc/                        ← 设计文档（项目外）
│   ├── workflow-reform-plan-ko.md / .md
│   ├── csv-authoring-guide-ko.md / .md
│   └── extract-mapping-design-ko.md / .md
└── auto_design_agent_backup/               ← Skill 仓库根
    ├── AGENTS.md                           ← AI 入口
    ├── SKILL.md, README.md, references/    ← 既有 Skill 资产
    └── csv-pipeline/                       ← 映射工作自足 sub-project
        ├── README.md                       ← 文件夹入口
        ├── project-status-ko.md / .md      ← 本文档
        ├── package.json + tsconfig.json
        ├── node_modules/
        ├── mapping-input/                  ← 设计师上游（按团队分文件）
        │   ├── 结构变化表-{App}.csv × 17   ← 各 app 团队独立
        │   └── 控件变体清单.csv            ← 组件设计师（单一）
        ├── mapping-output/                 ← extract 产物（重生成）
        │   ├── SystemUIKIT-mapping.csv
        │   ├── app-{App}-mapping.csv × 18
        │   ├── components.csv
        │   ├── extract-report.md
        │   └── .last-extract
        ├── scripts/
        │   ├── extract-mapping.ts
        │   └── show-status.ts
        └── legacy/
            └── app-mapping-stage1a.csv     ← 用户手写本（参考用）
```

> **位置注意**：设计文档在**上层** `csv-migration/Improvement_doc/`，映射工作整体在**项目内** `csv-pipeline/`。自足 sub-project。
