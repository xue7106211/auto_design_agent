# 명명 규범 — Source Frame + Section + Spec ID

> Stage 1C + 1D 결과. 본 file 이 단일 권위.
>
> 적용 범위: Figma 작업 중 만들거나 만나는 frame / section 이름 + csv-pipeline spec.json id 의 일관성. 여기 정의한 명명을 따르면 SKILL Phase 0.1 의 app/scene/state 식별이 자동화 (현재 강제 user 확인) + spec.json 자동 lookup + verifyChecklist §6.2 #1 자동 통과.
>
> cross-ref:
> - SKILL.md Phase 0.1 (APP + 画面识别 hard gate)
> - common-rules-verify.md §6.2 #1 (Section 命名)
> - csv-pipeline/spec-output/spec/*.json (id 컨벤션 권위)

## 1. Source Frame 이름 (디자이너 → AI 入)

### 1.1 형식

```
{App}_{Scene}_{State}_{Device}
```

| 토큰 | 권위 enum | 예 |
|---|---|---|
| `{App}` | `csv-pipeline/mapping-input/结构变化表-{App}.csv` 의 `{App}` | `Notes`, `Phone`, `FileManager`, `Calendar`, `Settings`, `Weather`, `Recorder`, `MiMover`, `Compass`, `Calculator`, `Contacts`, `Photos`, `Messages`, `Clock`, `Downloads`, `MobileGuard` |
| `{Scene}` | sub-scene 별 framework 결정 (예: 笔记 = NLC, 待办 = NLC) | `NLC`, `NL`, `LC`, `NC`, `C` |
| `{State}` | mapping CSV `state` 컬럼 enum | `默认`, `编辑模式`, `搜索激活`, `详情`, `录音`, `AI对话`, `NoteEditPanel`, `Notes_Outline`, `思维导图`, `思维导图编辑`, `一级`, `二级` |
| `{Device}` | 8-device convention | `手机竖`, `手机横`, `Fold外竖`, `Fold外横`, `Fold内竖`, `Fold内横`, `Pad竖`, `Pad横` |

### 1.2 예

```
Notes_NLC_默认_手机竖
Notes_LC_编辑模式_Fold内横
Notes_C_思维导图_Pad竖
```

### 1.3 sub-scene 구분 (笔记 vs 待办 같은 다중 sub-scene app)

笔记 / 待办은 같은 app `Notes` 안에 들어있음. source frame 만으로 sub-scene 식별이 모호하면 frame 名에 sub-scene 토큰 추가 가능 (선택):

```
{App}_{SubScene}_{Scene}_{State}_{Device}
예: Notes_笔记_NLC_默认_Pad竖
    Notes_待办_LC_编辑模式_Fold内横
```

sub-scene 형식이 권위. spec.json id 와 1:1 매칭됨.

### 1.4 strict 規則

1. **언더스코어 separator** — 다른 구분자 (-, /, space) 不可
2. **token enum 만 허용** — 위 표 외의 값은 unknown 으로 取급, AI 가 user 확인 강제
3. **Device suffix 必须** — Device 없으면 (e.g. `Notes_NLC_默认`) AI 가 framework 만 추정 가능, target device 不명. extract-mapping CSV 의 device 컬럼과 cross-check 不能 → user 확인
4. **state token = mapping CSV 정확히 일치** — `编辑` 와 `编辑模式` 다른 frame, AI 가 임의 fuzzy 매칭 不可

### 1.5 frame 이름이 위 형식과 다를 경우

- Phase 0.1 이 user 에게 명시적으로 「APP + scene + state + device」 묻고 답변을 권위로 사용 (현 동작)
- 답변 후 AI 가 본 형식의 spec.json id 自动 derive 시도

## 2. Section 이름 (적응 작업 결과 묶음)

### 2.1 형식

```
TEST_{App}_{Scene}_{State}_{YYYY-MM-DD}_{Operator}
```

| 토큰 | 의미 |
|---|---|
| `TEST` | 적응 작업 prefix (production publish 와 구분) |
| `{App}_{Scene}_{State}` | source frame name 3 토큰 동일 |
| `{YYYY-MM-DD}` | 작업 일자 (해당 session 시작일) |
| `{Operator}` | 디자이너 / AI agent 이니셜 (KIM / CLAUDE / etc) |

### 2.2 예

```
TEST_Notes_LC_默认_2026-05-31_KIM
TEST_Notes_NLC_编辑모드_2026-06-01_CLAUDE
```

### 2.3 적응 frame 4 개 (Fold 내横/竖 + Pad 横/竖) 의 Section 内 배치

```
TEST_Notes_LC_默认_2026-05-31_KIM
├── Notes_LC_默认_Fold内横       ← target frame
├── Notes_LC_默认_Fold内竖
├── Notes_LC_默认_Pad横
├── Notes_LC_默认_Pad竖
└── Notes_LC_默认_手机竖         ← source (동일 section 내, 비교용)
```

순서 (왼→오) = `Fold내横 → Fold内竖 → Pad横 → Pad竖`. SKILL Phase 5 약속과 일치.

### 2.4 verifyChecklist §6.2 #1 자동 통과 조건

Section 名이 위 정규식 `^TEST_[A-Za-z]+_[A-Z]+_[^_]+_\d{4}-\d{2}-\d{2}_[A-Z]+$` 매칭 시 manual gate 없이 통과.

## 3. spec.json id 컨벤션 (csv-pipeline 권위)

### 3.1 형식

```
{App}_{SubScene}_{Scene}_{State}_{Device}_{ScreenMode}.json
```

| 토큰 | 비고 |
|---|---|
| `{App}` | 본 doc §1.1 동일 |
| `{SubScene}` | 笔记 / 待办 / 등. 단일 sub-scene app 도 자기 이름 반복 (e.g. `Calendar_Calendar_*`) — 컨벤션 일관성 |
| `{Scene}` | 본 doc §1.1 동일 |
| `{State}` | 본 doc §1.1 동일 |
| `{Device}` | 본 doc §1.1 동일 |
| `{ScreenMode}` | layoutType (NLC覆盖 / NLC并列 / NLC收起 / NL / NL收起 / NC / NC收起 / LC / C). 일부 device + scene 조합에서 collapsed variant 존재 |

### 3.2 예

```
Notes_笔记_NLC_默认_Pad竖_NLC覆盖.json
Notes_笔记_NLC_默认_Pad横_NLC并列.json
Notes_笔记_NLC_默认_Pad竖_NLC收起.json   ← N 收起 variant
Notes_待办_LC_编辑模式_Fold内横_LC.json
```

### 3.3 source frame name → spec.json id 매핑 (점진 자동화 가능)

```
source: Notes_笔记_NLC_默认_Pad竖
        ↓ ScreenMode = (Scene + Device) lookup (csv-to-spec.ts getLayoutSpec)
        ↓ Pad竖 + NLC = NLC覆盖 (default), NLC收起 (collapsed variant)
spec.json: Notes_笔记_NLC_默认_Pad竖_NLC覆盖.json
            (+ Notes_笔记_NLC_默认_Pad竖_NLC收起.json 별도 spec)
```

본 derivation 은 `csv-pipeline/scripts/csv-to-spec.ts:getLayoutSpec` 참조 (단일 권위). source frame 명만으로 자동 lookup 시 collapsed variant 모호 → 명시적 SubScene + ScreenMode 표기 추천.

## 4. 잠금된 결정

- ✅ source frame separator = `_` (다른 separator 不可)
- ✅ Device token enum = 8-device (`手机竖` 외 7 종, 본 doc §1.1)
- ✅ Section prefix = `TEST_` (production publish 명명과 분리)
- ✅ spec.json id = sub-scene 토큰 必수 (본 doc §3.1 형식)
- ✅ 4 frame 적응 순서 = `Fold内横 → Fold内竖 → Pad横 → Pad竖` (SKILL Phase 5 와 일치)

## 5. 자동화 hooks (점진 진입)

| hook | 효과 | 진입 step |
|---|---|---|
| Phase 0.1 frame 名 정규 매칭 → app/scene/state 자동 채움 | 현 user 확인 step 단축 | 본 doc 도입 후 즉시 가능 |
| spec.json id 자동 lookup → spec-output/ 직접 read | 매 turn .md lookup 폐기 (Step 3) | Improvement_doc/3A-wire-up-plan.md Step 3 |
| Section 名 정규 매칭 → §6.2 #1 자동 통과 | manual gate 1 항 제거 | 본 doc 도입 후 즉시 가능 |
