# 通用规则 — 禁止项 索引

> Phase 6 (验证) 每次加载. 4 类 (文件 / 检索 / 实例 / 验证) 禁止项总集.
> 本文件 = §7 禁止索引. 各项是对其他文件正文规则的 reverse-index.
> 原则 → `common-rules-principles.md`. instance → `common-rules-instance.md`. mask-zorder → `common-rules-mask-zorder.md`. verify → `common-rules-verify.md`.

## §7. 禁止项索引

### §7.1 文件 / 写入级

| # | 禁止 | 例外 |
|---|------|------|
| 1 | 新建「V2」/「副本」/「新页面」等并行设计稿 | 用户明确要求 |
| 2 | 一次性写入超过 10 个节点的大脚本（20KB 响应限制）| 无 |
| 3 | 修改组件内部结构；只改属性 / 尺寸 / 位置 | 无 |
| 4 | 使用自定义字体（Figma MCP 不支持）| 无 |
| 5 | 插入图片资源（Figma MCP 不支持）| 无 |

### §7.2 检索 / 复用级

| # | 禁止 | 详见 |
|---|------|------|
| 6 | 把别处整页结果直接 clone (无例外) | `common-rules-principles.md §1.1` |
| 7 | 把"不要整页复用"扩大成"组件级标准实例也不查" | `common-rules-principles.md §1.3` |
| 8 | `app-variant-map` / reference 给出明确实例时跳过优先命中 | `common-rules-principles.md §1.3` |
| 9 | 标准组件 detach (无例外); 阻塞时经 `common-rules-principles.md §3.14` 标 `blocked` | `common-rules-instance.md §3.2` / `common-rules-principles.md §1.2` |
| 10 | 实例失败时自动 clone fallback (降级路径已废止) | `common-rules-instance.md §4.1` / `common-rules-principles.md §1.2` |
| 11 | 跨画布搬运源稿不存在的业务内容 | `common-rules-principles.md §2.2` |
| 12 | 适配结果落到远离源稿位置 | `common-rules-verify.md §5.1` |

### §7.3 实例 / 落位级

| # | 禁止 | 详见 |
|---|------|------|
| 13 | StatusBar 沿用手机 variant 适配 Fold / Pad | `common-rules-instance.md §3.5` (迁出至 `component-dictionary/StatusBar.md`) |
| 14 | 仅 `inst.resize()` 设 Sidebar 高度，缺 sizing FIXED 序列 | `common-rules-instance.md §3.6` |
| 15 | 省略 Pad 竖 NLC 覆盖模式的 `遮罩-N覆盖` 矩形 | `common-rules-mask-zorder.md §3.7` |
| 15b | 把 `状态栏` 提升到 `遮罩-N覆盖` / `遮罩-编辑` 之上 | `common-rules-mask-zorder.md §3.7 / §3.7a / §3.7b` |
| 16 | NLC 模式 N\|L 边界添加分割线 | `common-rules-mask-zorder.md §3.8` |
| 18 | Pad 横 NLC 时 N 栏 / 主内容区 `clipsContent = true` | `common-rules-mask-zorder.md §3.9` (迁出至 `component-dictionary/sidebar.md`) |

### §7.4 验证级

| # | 禁止 | 详见 |
|---|------|------|
| 19 | 4 个目标 frame 写完之后再统一验证（必须每 frame 即时截图）| `common-rules-verify.md §6.3` |
| 20 | `verifyChecklist` 错误项 > 0 时汇报"适配完成" | `common-rules-verify.md §6.2` |
| 21 | fills 直接 RGB SOLID（不经 token lookup）| `common-rules-principles.md §0 #12` |
| 22 | 数据不确定时猜测填补 | `common-rules-principles.md §0 #13` |
| 23 | `scenarioFlags.LEditMode === true` 时省略 `遮罩-编辑` 矩形或不 promote L 栏 | `common-rules-mask-zorder.md §3.7a` / `common-rules-verify.md §6.2 #21` |
| 24 | `LEditMode + NCovering` 同时为 true 时 z-order 错放（如把两遮罩并列于同一 z 层 / L 栏置于 N 覆盖遮罩之上）| `common-rules-mask-zorder.md §3.7b` / `common-rules-verify.md §6.2 #22` |
| 25 | `scenarioFlags` JSON 缺失下汇报"适配完成"（Phase 4 step 7 未执行）| `common-rules-verify.md §6.2 #23` / SKILL Phase 4 step 7 |
| 26 | 实例失败时绕道 「fallback / clone」 后汇报"适配完成"（未通过 `common-rules-principles.md §3.14` 实证）| `common-rules-principles.md §3.14` / `common-rules-instance.md §4.1` |
| 27 | scenarioFlags 信号未在 `app-variant-map-{app}.md §0.1b 导出信号表` 列出时凭直觉填 flag 值 | `common-rules-principles.md §0 #13` / app-variant-map-template §0.X |
| 28 | 将一次性 special case 添加为 §0.1 #N / §3.X 规则 (self-check 「在其他 app 中也会重复？」未通过却添加) | `common-rules-principles.md §0 #28 / §3.15` |
| 29 | 将 runtime 函数即可解决的 fix recipe 强制每次 read 包含到规则文正文 | `common-rules-principles.md §3.15 #2` |

---

> **关联文件**: principles → `common-rules-principles.md` / instance → `common-rules-instance.md` / mask-zorder → `common-rules-mask-zorder.md` / verify → `common-rules-verify.md`.
