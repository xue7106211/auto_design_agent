# csv-pipeline

> Stage 1A 매핑 파이프라인 — 디자이너의 26열 가로 매핑표를 AI가 lookup 가능한 종방향 정규화 CSV로 변환.

매핑 작업 관련 자산 (입력/출력/스크립트/진행 상황/Node 셋업) **전부 이 폴더 안**.

## 빠른 시작

```bash
cd csv-pipeline
npm install      # 최초 1회
npm run extract  # mapping-input/ → mapping-output/ 재생성
npm run status   # 현재 상태 + 다음 작업 큐 출력
```

## 폴더 구조

```
csv-pipeline/
├── README.md                          ← 이 파일 (폴더 진입점)
├── project-status-ko.md / .md         ← 현재 진행 상황 + 다음 작업 큐 (단일 권위)
├── package.json + tsconfig.json       ← Node/TS 셋업
├── node_modules/
│
├── mapping-input/                     ← 디자이너 업스트림 (수정 금지)
│   ├── 结构变化表-{App}.csv × 17    ← 앱 팀별 독립 파일
│   └── 控件变体清单.csv             ← 컴포넌트 디자이너 (단일)
│
├── mapping-output/                    ← extract 산출물 (수동 편집 금지)
│   ├── SystemUIKIT-mapping.csv                   ← Tier 1 (SystemUIKIT 공통)
│   ├── app-{App}-mapping.csv × 18     ← Tier 2 (앱별)
│   ├── components.csv                 ← 변체 메타데이터
│   ├── extract-report.md              ← 경고·통계·diff
│   └── .last-extract                  ← mtime sentinel
│
├── scripts/
│   ├── extract-mapping.ts             ← 메인 변환 스크립트
│   └── show-status.ts                 ← npm run status 구현
│
└── legacy/
    └── app-mapping-stage1a.csv        ← 사용자가 수동 작성한 이전 CSV (참고용)
```

## 입출력 흐름

```
[디자이너 워크플로]
  각 앱 팀이 각자 유지:
    结构变化表-{App}.csv (팀당 1개, 3-level 헤더)
  컴포넌트 디자이너 유지:
    控件变体清单.csv
                                   │
                       mapping-input/ 폴더에 저장
                                   │
                              npm run extract
                                   ▼
                       mapping-output/ 자동 생성
                                   │
                                   │ csv-to-spec.ts (Stage 3A 예정)
                                   ▼
                              spec JSON
```

> **팀 소유 분리**: 각 앱 팀은 자신의 `结构变化表-{App}.csv`만 독립 유지. 같은 파일 다중 편집으로 인한 git 충돌 회피. `extract-mapping.ts`가 `结构变化表-*.csv` 자동 glob 후 앱별로 출력.

## 관련 설계 문서 (프로젝트 외부)

설계와 결정 사항은 상위 워크스페이스의 `Improvement_doc/`:

```
csv-migration/
├── Improvement_doc/                   ← 설계 문서 (상위 워크스페이스)
│   ├── workflow-reform-plan-ko.md / .md
│   ├── csv-authoring-guide-ko.md / .md
│   └── extract-mapping-design-ko.md / .md  ← 결정 6건 잠금
└── auto_design_agent_backup/
    └── csv-pipeline/                  ← 이 폴더
```

`project-status-ko.md` 안에서 `../../Improvement_doc/...` 형태로 참조.

## 결정 사항 (변경 시 사용자 확인 필수)

`../../Improvement_doc/extract-mapping-design-ko.md` §확정 결정 사항 참조. 요약:

1. ✅ app 명명 = EN-only + CamelCase (`Notes`, `FileManager`, `MiMover`, `Phone`)
2. ✅ uiElement 명명 = EN-only (`NavigationBar`)
3. ✅ screenMode `""` 의미 = "이 device는 layout split 없음"
4. ✅ 다중 컴포넌트 cell 자동 추론 + 모호 시 WARN
5. ✅ 8-device 컨벤션 (`Fold外竖` / `Fold外横` 포함)
6. ✅ extract-report에 legacy diff 포함

추가:
- ✅ CSV에서 setKey 컬럼 제거 → `references/app-variant-map-{app}.md §0.4`이 단일 권위
