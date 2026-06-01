# 프로젝트 진행 상황

> **이 문서가 진행 상황의 단일 권위입니다.** 작업 시작 전 읽고, 작업 종료 시 갱신하세요.
> 마지막 갱신: 2026-05-25
>
> ⚠️ **유통 기한 있음**: 이 문서는 **workflow-reform 작업 진행 중**에만 유효. 모든 Stage(1A/1B/1C/2/3) 완료 후에는 `csv-pipeline/archive/project-status-final.md`로 이동하고 안정 운영 단계로 전환. 미래 AI는 reform 종료 후 이 문서를 routinely 읽지 않아도 됨.

## 현재 단계

**workflow-reform-plan 3-Stage 개혁 중 — Stage 1A Phase 1 완료**

## 완료된 작업

### Stage 1A Phase 1 — extract-mapping 파이프라인 (✅ 2026-05-25)

- `scripts/extract-mapping.ts` 구현 (~480 lines)
- `scripts/show-status.ts` 구현
- `package.json` + `tsconfig.json` 셋업
- 의존성: csv-parse, csv-stringify, tsx, typescript
- `npm run extract` + `npm run status` 명령 등록
- 1회 실행 검증 완료:
  - 入: 146 source 행 (`mapping-input/结构变化表 - 控件总表.csv`)
  - 出: 1253 정규화 행, 17개 앱 분리
  - `mapping-output/SystemUIKIT-mapping.csv` (22 항목, SystemUIKIT)
  - `mapping-output/app-{App}-mapping.csv` × 17
  - `mapping-output/components.csv` (178 컴포넌트)
  - `mapping-output/extract-report.md` (warnings 0건)
  - `mapping-output/.last-extract` (mtime sentinel)

### 입력 분리 — 팀별 ownership (✅ 2026-05-25)

**배경**: 디자이너 분업 워크플로를 위해 단일 mega CSV (`结构变化表 - 控件总表.csv`)를 17개 팀별 파일로 분리.

**완료 작업**:
- `scripts/split-input.ts` 1회용 분리 스크립트 작성 + 실행
- `mapping-input/结构变化表-{App}.csv` × 17 생성 (1230행 → 146 데이터 행 분리, 3-level 헤더 보존)
- `控件变体清单 - 控件变体清单.csv` → `控件变体清单.csv` 단순화
- 원본 mega CSV는 split 후 자연 제거됨
- `extract-mapping.ts` 다중 입력 지원 (glob `结构变化表-*.csv` + 헤더 일관성 검증)
- `show-status.ts` 다중 source 자동 감지
- pre-commit hook은 기존 `mapping-input/*.csv` glob으로 호환

**팀 분배**:
| 팀 파일 | 담당 |
|---|---|
| 结构变化表-SystemUIKIT.csv | 시스템팀 (Keyboard / StatusBar / SwipeIndicator) |
| 结构变化表-Notes.csv | 笔记 디자이너 (待办 Tasks 포함) |
| 结构变化表-Phone.csv | 电话 디자이너 (展示+收起拨号键盘 sub-state 포함) |
| 结构变化表-Contacts.csv | 联系人 디자이너 (Pad 端 sub-state 포함) |
| 그 외 14개 | 각 앱 디자이너 |

**검증**: extract 출력 동일 (1253행, 17 앱, matched=785, warnings=0)

### Stage 2A 笔记 정리 — I4 enum 권위 등록 + I2 栏背景色 흡수 (✅ 2026-05-26)

**I4 — 枚举定义 (37행) 제거**:
- `common-rules.md §0.4 共通枚举定义` 신설 — 8-device + screenMode + resultType enum 단일 권위
- 笔记.md `## 枚举定义` (line 264-303) → pointer 1줄로 교체
- 효과: 笔记 외 다른 16개 app reference도 향후 동일 패턴으로 정리 가능 (단일 권위 확보)

**I2 — 栏背景색 (73행) → §0.3 흡수**:
- `## 栏背景色` 섹션 (line 717-789) 통째 제거
- 동일 데이터를 §0.3 안에 `device × screenMode 별 fill 매트릭스` 통합 표로 재정리 (3개 표: 手机/Fold外, Fold内, Pad)
- card-presence rule prose는 §0.3 기존 콘텐츠가 이미 보유 — 중복 제거됨
- 待办 차이점만 footnote 1줄로 처리

**결과**: 笔记.md 758 → **702행** (-56행, 누적 -94행 from 796)

### Stage 2A 笔记 정리 — I3 组件间距 섹션 제거 (✅ 2026-05-26)

**범위**: `app-variant-map-笔记.md` 단독. 다른 16개 app은 미시작 상태로 그대로 둠 (笔记 시범 검증 우선).

**작업**:
- `## 组件间距` 섹션 (line 669-715, 48행) 삭제 → components.csv pointer 5행으로 교체
- 정보 보존 검증: components.csv (Stage 1B output)가 InternalPadL/R + TitleLeftPad + Note 컬럼으로 모든 padding 정보 (定宽 / 屏中对齐 / 底部位置 / 특수 룰 포함) 보유
- TextInput_Notes_01~04 의 device-dimensions.md 충돌 해결 룰은 §0.2 末尾 (line 193-195)로 이송
- Sidebar_02 deprecation 룰은 이미 N 收起 규칙(line 324, 328)에 완전 — 별도 작업 불필요
- 결과: 笔记.md 796 → 758 행 (-38행)

**다음 단계**: I4 (枚举定义 제거) → I2 (栏背景色 §0.3 흡수) → I1 (映射表 제거, 가장 큰 영향)



**시도**: `app-variant-map-笔记.md` (796행) 시범 분리 — `-tokens.md` (§0.3) + `-keys.md` (§0.4) 신규 파일 생성.

**문제 발견 후 되돌림**:
- workflow-reform-plan §2A의 "Phase 5는 -tokens.md 단독 / Phase 4.5는 -keys.md 단독" 가정이 실제 SKILL.md 구조와 안 맞음. SKILL.md는 `app-variant-map-{app}.md §0` 통째로 로드 지시 (line 187, 320 등).
- 분리해도 AI 컨텍스트 절약 0. 라인 수는 오히려 증가 (frontmatter + pointer 오버헤드).
- csv-to-spec.ts (Stage 3A) 용도는 §0.4 표를 본문 안에서도 동일하게 파싱 가능 — 분리 불필요.

**되돌림**: 
- 두 분리 파일 삭제 + 본문 §0.3 / §0.4 인라인 복원
- `references/app-variant-map-笔记.md` 796행으로 환원

**교훈**: 
- 분리는 "AI가 부분 로드 가능할 때만" 의미 있음. 현 SKILL.md는 reference 통째로 로드 → 분리 가치 없음
- 진짜 컨텍스트 절약하려면 SKILL.md 자체 슬림화 (Stage 2C) 또는 Phase별 부분 로드 메커니즘 도입이 선행되어야

### Stage 1B Phase 1 — components.csv LibraryName 컬럼 추가 (✅ 2026-05-25)

**배경**: 원래 Stage 1B 계획은 `LibraryName / Category(A/B류) / DeviceScope / HasInternalPad` 4개 컬럼 추가. 그러나 분석 결과:
- `Category(A/B류)` 자동 판정 룰 (`InternalPad >0 이면 A류`)이 데이터와 모순 (StatusBar `0,0`이지만 A류)
- A/B 이분법은 178행 41 family 중 28 family를 미커버 (Overlay/Decorative 그룹 별도 분류 필요)
- A/B는 family 단위 정보라 variant 행마다 같은 값 반복 — CSV 컬럼 부적합. `csv-to-spec.ts` 코드 lookup이 더 깔끔
- `DeviceScope` 자동 추론 커버리지 9% (16/178), 91%는 `控件变体清单.csv`에 디자이너 입력 필요 — 즉시 가치 낮음

**결정**: Stage 1B를 `LibraryName` 추가 + `PaddingL/R → InternalPadL/R` rename으로 단순화. Category/HasInternalPad/DeviceScope는 Stage 3A `csv-to-spec.ts`에서 코드 lookup으로 처리.

**완료**:
- `extract-mapping.ts` `ComponentMeta` 인터페이스 + `resolveLibrary()` 룰 추가
- `APP_PREFIX_RE = /^(Notes|Calendar|Settings|Weather|Recorder)_/` → `业务组件库`, 그 외 → `OS4 UI Kit` (common-rules §0.5.1 기반)
- `components.csv` 컬럼: `LibraryName` 추가, `PaddingL/R` → `InternalPadL/R` rename
- 검증: 178행 모두 매핑 (业务组件库 68, OS4 UI Kit 110), warnings=0, legacy diff 변동 없음

**Library 소스 잠금 (3개)**: 
- `Xiaomi-Hyper-OS4-UI-Kit` (FBvQ3xM5C62MgIcA1JHWIs)
- `Xiaomi-HyperOS-业务组件库` (mrvMGwkbZ7qZML7iOfQsvI)
- `HyperOS4-Design-Token-Lib` (5gZYD8i6JqBvsaS7yvnO9c) — token-only, components.csv 등장 안 함

### 인프라 정리 (✅ 2026-05-25)

- 매핑 작업 전체를 `csv-pipeline/` 단일 자족 폴더로 통합
- 상위 `csv-migration/Improvement_doc/`(설계 문서)과 명확히 분리
- AGENTS.md에 csv-pipeline 진입점 명시

### Stage 1A Phase 2 — SKILL.md mtime check (✅ 2026-05-25)

- SKILL.md에 `Phase 0.0a: csv-pipeline 신선도 체크` 섹션 추가
- AI 세션 시작 시 `mapping-input/*.csv` mtime 비교 → stale이면 자동 `npm run extract`
- workflow-reform 종료 후 본 섹션 제거 예정 (유통 기한 명시됨)

### references device enum 일괄 업데이트 — Phase A + B (✅ 2026-05-25)

검토 결과 project-status의 "16개 파일" 추정은 부정확. 실제는 4 references + SKILL.md, **5개 파일에서 4가지 명명 컨벤션 공존** 발견.

**Phase A 완료** (Pad 어미 제거):
- `Pad竖屏` → `Pad竖`, `Pad横屏` → `Pad横` (13건 일괄 치환)
- 영향: `template.md`, `笔记.md`, `common-rules.md`, `SKILL.md`

**Phase B 완료** (enum 표 8-device 확장):
- `app-variant-map-template.md` device enum 표: 5-device → 8-device (`手机竖`/`手机横`/`Fold外竖`/`Fold外横`/`Fold内竖`/`Fold内横`/`Pad竖`/`Pad横`)
- `app-variant-map-笔记.md` 동일 처리
- template.md의 layout decision 표 + 매핑 예시 entries → 8-device로 정렬
- 두 파일에 deprecation note 추가 (구 컨벤션 폐기 명시)

**Phase C 완료** (2026-05-25 추가 처리):
- `common-rules.md:824` `Fold横屏 → Fold竖屏 → Pad横 → Pad竖` → `Fold内横 → Fold内竖 → Pad横 → Pad竖`
- `SKILL.md` 5곳 동일 패턴 정정 (line 188, 241-242, 290, 505, 536, 792)
- `设置.md`, `短信.md` prose `Phone/Fold外屏无导航栏` → `手机竖/手机横/Fold外竖/Fold外横无导航栏`
- 4-device convention (`Fold横屏/Fold竖屏/Fold内屏-横屏`) 잔재 0건 확인

### Stage 1A 데이터 품질 — legacy diff 정규화 (✅ 2026-05-25)

- legacy CSV (`legacy/app-mapping-stage1a.csv`)를 새 컨벤션으로 자동 정규화 후 비교
- 정규화 함수 추가: `normalizeLegacyDevice` (PHONE_竖屏 → 手机竖, FOLD_外屏+竖屏 → Fold外竖 등), `normalizeLegacyUiElement` (标题栏 NavigationBar → NavigationBar), `normalizeLegacyLane` (소문자 정규화), app은 기존 `normalizeAppName` 재사용
- 결과: **matched 0 → 785** (의미 있는 비교 가능)
- legacy-only 147건 = legacy의 잘못된 분류 (다중 컴포넌트 header를 BottomBar로 일괄 분류한 케이스 등)
- new-only 246건 = 새 추출이 정확히 분리한 케이스 (Sidebar/TopBar 구분, description 정리 등)
- diff 보고서가 이제 legacy 오류 audit trail로 동작

### Stage 1A 데이터 품질 — warnings 정교화 (✅ 2026-05-25)

- **warnings 233 → 0** (100% 감소)
- 추가/개선:
  - `extract-mapping.ts` 추론 룰 11개 → 30개 (TextInput, Detail, Menu, AlertDialog, Picker, FloatingWindow, ToolBar, RecordNotes, AIWindow, NewTaskWindow 등)
  - `inferUiElement` 2-pass 매칭 + special placeholder skip
  - col 1 sticky 상속 (빈 col 1 → 직전 행 uiElement 자동 inherit)
  - 분리 정확도 향상: well-formed regex (`^[A-Za-z]+(_[A-Za-z0-9]+)+`) 우선, fallback에서만 warn
  - multi-line lane prefix 처리 (`C 栏：\nDetailNotes_01` 형태)
  - 소문자 lane 정규화 (`l栏` → `L栏`)
  - lane prefix 공백 허용 (`C 栏` = `C栏`)
  - non-render keyword 확장 (`无导航栏`, `隐藏` 추가)
  - framework-reuse placeholder는 워닝에서 silent로 강등 (의도된 패턴)

### Stage 1A Phase 3 — Git pre-commit hook (✅ 2026-05-25)

- `csv-pipeline/scripts/pre-commit.sh` (hook 본체) + `install-hook.sh` (설치 스크립트)
- `npm run install-hook` 명령으로 `.git/hooks/pre-commit` symlink 생성
- 동작: `csv-pipeline/mapping-input/*.csv` staged 감지 → `npm run extract` 자동 실행 → `mapping-output/` 자동 stage
- 비매핑 변경 시 skip 정상 (오버헤드 0)
- 검증: input 변경 케이스 + 비매핑 변경 케이스 둘 다 통과
- non-ASCII 파일명 처리 위해 `git diff --cached --name-only -z` 사용

### 결정 잠금 (변경 시 사용자 확인 필수)

`../../Improvement_doc/extract-mapping-design-ko.md` §확정 결정 사항 참조:

1. ✅ app 명명 = EN-only + CamelCase (`Notes`, `FileManager`, `MiMover`, `Phone`)
2. ✅ uiElement 명명 = EN-only (`NavigationBar`)
3. ✅ screenMode `""` 의미 = "이 device는 layout split 없음"
4. ✅ 다중 컴포넌트 cell 자동 추론 + 모호 시 WARN
5. ✅ 8-device 컨벤션 (`Fold外竖` / `Fold外横` 포함)
6. ✅ extract-report에 legacy diff 포함

### setKey 결정 잠금 (`../../Improvement_doc/csv-authoring-guide-ko.md`)

- ✅ CSV에서 setKey 컬럼 제거
- ✅ 단일 권위 = `references/app-variant-map-{app}.md §0.4`
- ✅ csv-to-spec 변환 시 join

## 현재 단계 요약

**Stage 1A 완전 완료** — extract 파이프라인 안정 운영 단계.

```
Stage 1A: ✅ 완료 (이 세션 누적)
Stage 1B: ✅ 완료 (단순화 — LibraryName 추가 + InternalPad rename. 나머지 metadata는 Stage 3A에서 코드 lookup)
Stage 2A: ❌ 무효화 (2026-05-26, SKILL.md가 reference 통째 로드 → 분리 가치 없음. Stage 2C 선행 필요)
Stage 1C: ⬜ 미시작 — Figma source frame 네이밍 규범
Stage 1D: ⬜ 미시작 — Section 네이밍 규범
Stage 2A: ⬜ 미시작 — app-variant-map 분리 (.md / .csv / -keys.md / -tokens.md)
Stage 2B: ⬜ 미시작 — common-rules 계층화 (principles/instance/mask-zorder/verify/prohibit)
Stage 2C: ⬜ 미시작 — SKILL.md 슬림화 (770행 → ~300행)
Stage 3A: ⬜ 미시작 — CSV → Frame Spec JSON 자동 생성
Stage 3B: ⬜ 미시작 — csv-to-spec.ts / validate-csv.ts / spec-to-checklist.ts
```

## 다음 작업 큐 (우선순위순)

| # | 작업 | 추정 규모 | 비고 |
|---|---|---|---|
| 1 | **Stage 2C — SKILL.md 슬림화** | 큼 | 770행 → 300행. 함수 시그니처, 폰트 디그레이드, 규칙 재서술, Token 목록 → 각자 reference로 이동. **이게 끝나야 Stage 2A 재검토 가치가 생김** |
| 2 | **Stage 3A — csv-to-spec.ts (Frame Spec JSON 생성기)** | 큼 | mapping-output + 笔记.md §0.4 + device-dimensions.md → spec JSON. §0.4 본문 인라인이라 파서가 직접 추출. Category/HasInternalPad/DeviceScope family lookup도 여기서 처리 |
| 4 | **Stage 1C — Figma source frame 네이밍 규범** | 작음 | `{App}_{Scene}_{State}_{SourceDevice}` 네이밍 가이드 문서화 |
| 5 | **Stage 2B — common-rules 계층화** | 중간 | 987행 flat → principles/instance/mask-zorder/verify/prohibit. §3.4a A/B 분류 체계 재검토 (3분법 또는 코드 lookup으로 이전) |
| 6 | **Stage 1D — Section 네이밍 규범** | 작음 | `TEST_{App}_{Scene}_{State}_{Date}_{Operator}` |

## 작업 이어가는 표준 절차 (어떤 AI든 동일)

```
1. AGENTS.md 읽기 (프로젝트 루트)
2. csv-pipeline/README.md 읽기
3. 본 project-status-ko.md 읽기 → 현재 상태 + 다음 작업 큐 파악
4. 사용자 지시 받기
5. 해당 design 문서 읽기 (../../Improvement_doc/*.md)
6. 작업 진행
7. 종료 전:
   - 본 문서 "완료된 작업"에 항목 추가
   - "다음 작업 큐"에서 완료된 항목 제거 + 발견된 후속 작업 추가
   - 새 결정 사항이 있으면 design 문서에 잠금
```

## 명령어

```bash
cd csv-pipeline
npm run extract    # mapping-input/*.csv → mapping-output/ 재생성
npm run status     # 현재 상태 + 본 문서의 다음 작업 큐 출력
```

## 산출물 위치

```
csv-migration/                              ← 상위 워크스페이스
├── Improvement_doc/                        ← 설계 문서 (프로젝트 외부)
│   ├── workflow-reform-plan-ko.md / .md
│   ├── csv-authoring-guide-ko.md / .md
│   └── extract-mapping-design-ko.md / .md
└── auto_design_agent_backup/               ← Skill 저장소 루트
    ├── AGENTS.md                           ← AI 진입점
    ├── SKILL.md, README.md, references/    ← 기존 Skill 자산
    └── csv-pipeline/                       ← 매핑 작업 자족 sub-project
        ├── README.md                       ← 폴더 진입점
        ├── project-status-ko.md / .md      ← 본 문서
        ├── package.json + tsconfig.json
        ├── node_modules/
        ├── mapping-input/                  ← 디자이너 업스트림 (팀별 분리 소유)
        │   ├── 结构变化表-{App}.csv × 17   ← 앱 팀별 독립 파일
        │   └── 控件变体清单.csv            ← 컴포넌트 디자이너 (단일)
        ├── mapping-output/                 ← extract 산출물 (재생성됨)
        │   ├── SystemUIKIT-mapping.csv
        │   ├── app-{App}-mapping.csv × 18
        │   ├── components.csv
        │   ├── extract-report.md
        │   └── .last-extract
        ├── scripts/
        │   ├── extract-mapping.ts
        │   └── show-status.ts
        └── legacy/
            └── app-mapping-stage1a.csv     ← 사용자 수동 작성본 (참고용)
```

> **위치 주의**: 설계 문서는 **상위** `csv-migration/Improvement_doc/`, 매핑 작업 전체는 **프로젝트 내부** `csv-pipeline/`. 자족적 sub-project.
