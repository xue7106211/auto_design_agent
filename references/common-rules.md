# 通用规则 (索引 hub)

> **2026-06-01 분할 完了**: 본 파일은 5 파일 분할 후의 **포인터 hub** 입니다. 본문은 각 파일 안에 single source of truth 로 존재. 본 hub 는 호환성 유지 + 빠른 매핑용.

## 5 파일 구성

| 파일 | 包含 section | Phase 로드 |
|---|---|---|
| [`common-rules-principles.md`](common-rules-principles.md) | §0 (28원칙) + §0.4/§0.5 enum + §1 (검색 边界) + §2 (内容 边界) + §3.11 (CSV vs map) + §3.13 (drilldown) + §3.14 (实证) + §3.15 (룰 추가 4점 review) | Phase 0~2 + 全 phase 메타 |
| [`common-rules-instance.md`](common-rules-instance.md) | §3.1 (清单) + §3.1a (set 归属) + §3.2 (instance 보호) + §3.4a (padding A/B) + §3.5 pointer + §3.6 (resize 6 step) + §3.6.A (verify 보강) + §3.10 (timestamp + fresh-import) + §3.12 (property 缺) + §4 (写入 优先级) | Phase 4 + Phase 5 |
| [`common-rules-mask-zorder.md`](common-rules-mask-zorder.md) | §3.7 (NLC 覆盖 mask) + §3.7a (L 编辑 mask) + §3.7a-NL + §3.7a-NLC并列 + §3.7b (多 mask z-order) + §3.8 (栏间 분할선) + §3.9 pointer | Phase 5 |
| [`common-rules-verify.md`](common-rules-verify.md) | §5 (落位) + §6.0 (节奏) + §6.1 (容器 atomic) + §6.2 (25항 verifyChecklist) + §6.3 (frame 단위 截图) | Phase 5 落位 후 + Phase 6 |
| [`common-rules-prohibit.md`](common-rules-prohibit.md) | §7.1~§7.4 禁止 索引 (다른 파일 본문에 대한 reverse-index) | Phase 6 |

## Quick lookup (常用 §X.X → 파일)

| § | 파일 |
|---|---|
| §0 / §0.4 / §0.5 | principles |
| §1 / §2 | principles |
| §3.1 / §3.1a / §3.2 / §3.4a / §3.6 / §3.6.A / §3.10 / §3.12 | instance |
| §3.7 / §3.7a / §3.7a-NL / §3.7a-NLC并列 / §3.7b / §3.8 / §3.9 | mask-zorder |
| §3.11 / §3.13 / §3.14 / §3.15 | principles |
| §4 | instance |
| §5 / §6 | verify |
| §7 | prohibit |

> **호환성**: `common-rules.md §X.X` 로 참조하는 기존 문서는 본 hub 가 동작 (1 hop 추가). 점진적으로 다운스트림 참조를 per-file 로 전환 예정.
