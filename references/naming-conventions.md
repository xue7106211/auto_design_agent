# 命名规范 — Source Frame + Section + Spec ID

> Stage 1C + 1D 结果。本 file 为单一权威。
>
> 适用范围: Figma 作业中创建或遇到的 frame / section 名称 + csv-pipeline spec.json id 的一致性。遵循此处定义的命名,则 SKILL Phase 0.1 的 app/scene/state 识别可自动化 (当前强制 user 确认) + spec.json 自动 lookup + verifyChecklist §6.2 #1 自动通过。
>
> cross-ref:
> - SKILL.md Phase 0.1 (APP + 画面识别 hard gate)
> - common-rules-verify.md §6.2 #1 (Section 命名)
> - csv-pipeline/spec-output/spec/*.json (id 约定权威)

## 1. Source Frame 名称 (设计师 → AI 输入)

### 1.1 格式

```
{App}_{Scene}_{State}_{Device}
```

| token | 权威 enum | 例 |
|---|---|---|
| `{App}` | `csv-pipeline/mapping-input/结构变化表-{App}.csv` 的 `{App}` | `Notes`, `Phone`, `FileManager`, `Calendar`, `Settings`, `Weather`, `Recorder`, `MiMover`, `Compass`, `Calculator`, `Contacts`, `Photos`, `Messages`, `Clock`, `Downloads`, `MobileGuard` |
| `{Scene}` | sub-scene 决定 framework (例: 笔记 = NLC, 待办 = NLC) | `NLC`, `NL`, `LC`, `NC`, `C` |
| `{State}` | mapping CSV `state` 列 enum | `默认`, `编辑模式`, `搜索激活`, `详情`, `录音`, `AI对话`, `NoteEditPanel`, `Notes_Outline`, `思维导图`, `思维导图编辑`, `一级`, `二级` |
| `{Device}` | 8-device convention | `手机竖`, `手机横`, `Fold外竖`, `Fold外横`, `Fold内竖`, `Fold内横`, `Pad竖`, `Pad横` |

### 1.2 例

```
Notes_NLC_默认_手机竖
Notes_LC_编辑模式_Fold内横
Notes_C_思维导图_Pad竖
```

### 1.3 sub-scene 区分 (笔记 vs 待办 等多 sub-scene app)

笔记 / 待办在同一 app `Notes` 内。仅凭 source frame 无法区分 sub-scene 时,可在 frame 名中添加 sub-scene token (可选):

```
{App}_{SubScene}_{Scene}_{State}_{Device}
例: Notes_笔记_NLC_默认_Pad竖
    Notes_待办_LC_编辑模式_Fold内横
```

sub-scene 格式为权威。与 spec.json id 1:1 匹配。

### 1.4 strict 规则

1. **下划线 separator** — 其他分隔符 (-, /, space) 不可
2. **仅允许 token enum** — 上表外的值视为 unknown,AI 强制 user 确认
3. **Device suffix 必须** — 无 Device (e.g. `Notes_NLC_默认`) 时,AI 仅能推断 framework, target device 不明。无法与 extract-mapping CSV 的 device 列 cross-check → user 确认
4. **state token = mapping CSV 完全一致** — `编辑` 与 `编辑模式` 为不同 frame,AI 不可任意 fuzzy 匹配

### 1.5 frame 名称与上述格式不符时

- Phase 0.1 显式向 user 询问「APP + scene + state + device」并以回答为权威 (当前行为)
- 回答后 AI 尝试自动 derive 本格式的 spec.json id

## 2. Section 名称 (适配作业结果集合)

### 2.1 格式

```
TEST_{App}_{Scene}_{State}_{YYYY-MM-DD}_{Operator}
```

| token | 含义 |
|---|---|
| `TEST` | 适配作业 prefix (与 production publish 区分) |
| `{App}_{Scene}_{State}` | 与 source frame name 3 个 token 相同 |
| `{YYYY-MM-DD}` | 作业日期 (该 session 起始日) |
| `{Operator}` | 设计师 / AI agent 缩写 (KIM / CLAUDE / etc) |

### 2.2 例

```
TEST_Notes_LC_默认_2026-05-31_KIM
TEST_Notes_NLC_编辑模式_2026-06-01_CLAUDE
```

### 2.3 适配 frame 4 个 (Fold 内横/竖 + Pad 横/竖) 在 Section 内的布置

```
TEST_Notes_LC_默认_2026-05-31_KIM
├── Notes_LC_默认_Fold内横       ← target frame
├── Notes_LC_默认_Fold内竖
├── Notes_LC_默认_Pad横
├── Notes_LC_默认_Pad竖
└── Notes_LC_默认_手机竖         ← source (同一 section 内,供对比)
```

顺序 (左→右) = `Fold内横 → Fold内竖 → Pad横 → Pad竖`。与 SKILL Phase 5 约定一致。

### 2.4 verifyChecklist §6.2 #1 自动通过条件

Section 名匹配上述正则 `^TEST_[A-Za-z]+_[A-Z]+_[^_]+_\d{4}-\d{2}-\d{2}_[A-Z]+$` 时,无 manual gate 直接通过。

## 3. spec.json id 约定 (csv-pipeline 权威)

### 3.1 格式

```
{App}_{SubScene}_{Scene}_{State}_{Device}_{ScreenMode}.json
```

| token | 备注 |
|---|---|
| `{App}` | 同本 doc §1.1 |
| `{SubScene}` | 笔记 / 待办 / 等。单 sub-scene app 也重复自身名称 (e.g. `Calendar_Calendar_*`) — 约定一致性 |
| `{Scene}` | 同本 doc §1.1 |
| `{State}` | 同本 doc §1.1 |
| `{Device}` | 同本 doc §1.1 |
| `{ScreenMode}` | layoutType (NLC覆盖 / NLC并列 / NLC收起 / NL / NL收起 / NC / NC收起 / LC / C). 部分 device + scene 组合存在 collapsed variant |

### 3.2 例

```
Notes_笔记_NLC_默认_Pad竖_NLC覆盖.json
Notes_笔记_NLC_默认_Pad横_NLC并列.json
Notes_笔记_NLC_默认_Pad竖_NLC收起.json   ← N 收起 variant
Notes_待办_LC_编辑模式_Fold内横_LC.json
```

### 3.3 source frame name → spec.json id 映射 (可渐进自动化)

```
source: Notes_笔记_NLC_默认_Pad竖
        ↓ ScreenMode = (Scene + Device) lookup (csv-to-spec.ts getLayoutSpec)
        ↓ Pad竖 + NLC = NLC覆盖 (default), NLC收起 (collapsed variant)
spec.json: Notes_笔记_NLC_默认_Pad竖_NLC覆盖.json
            (+ Notes_笔记_NLC_默认_Pad竖_NLC收起.json 单独 spec)
```

本 derivation 参见 `csv-pipeline/scripts/csv-to-spec.ts:getLayoutSpec` (单一权威)。仅凭 source frame 名自动 lookup 时 collapsed variant 模糊 → 推荐显式标注 SubScene + ScreenMode。

## 4. 锁定的决策

- ✅ source frame separator = `_` (其他 separator 不可)
- ✅ Device token enum = 8-device (`手机竖` 外 7 种,本 doc §1.1)
- ✅ Section prefix = `TEST_` (与 production publish 命名分离)
- ✅ spec.json id = sub-scene token 必须 (本 doc §3.1 格式)
- ✅ 4 frame 适配顺序 = `Fold内横 → Fold内竖 → Pad横 → Pad竖` (与 SKILL Phase 5 一致)

## 5. 自动化 hooks (渐进引入)

| hook | 效果 | 引入 step |
|---|---|---|
| Phase 0.1 frame 名正则匹配 → app/scene/state 自动填充 | 缩短当前 user 确认 step | 本 doc 引入后即可 |
| spec.json id 自动 lookup → spec-output/ 直接 read | 废弃每 turn .md lookup (Step 3) | Improvement_doc/3A-wire-up-plan.md Step 3 |
| Section 名正则匹配 → §6.2 #1 自动通过 | 移除 manual gate 1 项 | 本 doc 引入后即可 |
