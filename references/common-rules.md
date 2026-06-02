# 通用规则 (索引 hub)

> **2026-06-01 拆分完成**: 本文件是 5 文件拆分后的 **指针 hub**. 正文以 single source of truth 存在于各文件中. 本 hub 用于兼容性维持 + 快速映射.

## 5 文件构成

| 文件 | 包含 section | Phase 加载 |
|---|---|---|
| [`common-rules-principles.md`](common-rules-principles.md) | §0 (28 原则) + §0.4/§0.5 enum + §1 (检索边界) + §2 (内容边界) + §3.11 (CSV vs map) + §3.13 (drilldown) + §3.14 (实证) + §3.15 (规则追加 4 点 review) | Phase 0~2 + 全 phase 元 |
| [`common-rules-instance.md`](common-rules-instance.md) | §3.1 (清单) + §3.1a (set 归属) + §3.2 (instance 保护) + §3.4a (padding A/B) + §3.5 pointer + §3.6 (resize 6 step) + §3.6.A (verify 加强) + §3.10 (timestamp + fresh-import) + §3.12 (property 缺) + §4 (写入优先级) | Phase 4 + Phase 5 |
| [`common-rules-mask-zorder.md`](common-rules-mask-zorder.md) | §3.7 (NLC 覆盖 mask) + §3.7a (L 编辑 mask) + §3.7a-NL + §3.7a-NLC并列 + §3.7b (多 mask z-order) + §3.8 (栏间分割线) + §3.9 pointer | Phase 5 |
| [`common-rules-verify.md`](common-rules-verify.md) | §5 (落位) + §6.0 (节奏) + §6.1 (容器 atomic) + §6.2 (25 项 verifyChecklist) + §6.3 (frame 单位截图) | Phase 5 落位之后 + Phase 6 |
| [`common-rules-prohibit.md`](common-rules-prohibit.md) | §7.1~§7.4 禁止索引 (对其他文件正文的 reverse-index) | Phase 6 |

## Quick lookup (常用 §X.X → 文件)

| § | 文件 |
|---|---|
| §0 / §0.4 / §0.5 | principles |
| §1 / §2 | principles |
| §3.1 / §3.1a / §3.2 / §3.4a / §3.6 / §3.6.A / §3.10 / §3.12 | instance |
| §3.7 / §3.7a / §3.7a-NL / §3.7a-NLC并列 / §3.7b / §3.8 / §3.9 | mask-zorder |
| §3.11 / §3.13 / §3.14 / §3.15 | principles |
| §4 | instance |
| §5 / §6 | verify |
| §7 | prohibit |

> **兼容性**: 通过 `common-rules.md §X.X` 引用的现有文档由本 hub 承接 (增加 1 hop). 计划逐步将下游引用迁移为 per-file.
