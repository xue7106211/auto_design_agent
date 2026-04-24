# AGENTS.md

本文件面向在本仓库内工作的 Agent。目标不是解释产品功能，而是约束如何安全、稳定地维护这些 Skill 文档。

## 仓库定位

- 这是一个 Figma 多终端适配的 Agent Skill 仓库，不是应用代码仓库。
- 主要产物是一个主 Skill 和一组共享 reference 文档，供 Cursor、Claude Code 等支持 Skill 协议的 Agent 加载。
- 核心链路：`skill-main-workflow.md` 判断设备和布局类型，按需读取布局、组件、应用映射等 reference，然后由主流程执行和验证。
- 默认不要读取 `archive/` 下内容，除非用户明确要求或当前活跃文档缺失必要信息。

## 文件树与职责

```text
auto_design_agent/
├── AGENTS.md
│   当前文件。面向后续 Agent，说明仓库定位、编辑约束、自查清单和已知风险。
├── README.md
│   仓库对外说明，包含主 Skill、目录结构、使用方式和 Reference 文档说明。
├── skill-main-workflow.md
│   唯一主 Skill。负责读取源设计稿、判断目标设备与布局类型、按需读取 reference、执行和验证。
├── figma-component-dictionary.md
│   组件字典 reference。供主流程内部读取，处理实例探查、映射查表、执行与验证协议。
├── current-execution-map.md
│   当前可执行链路与断点状态图。
├── workflow-collaboration-contract.md
│   多人协作接口契约，定义字段归属和数据流转。
├── prompt-skill-consistency.md
│   新增或重构文档时的一致性 Prompt 模板。
├── references/
│   共享 reference 文档目录。主 Skill 按需引用，不应一次性全部加载。
│   ├── common-rules.md
│   │   通用执行原则、禁止项、clone 降级规则和分步写入规范。
│   ├── app-variant-map-文管.md
│   │   文管应用 variant 映射表。
│   ├── app-variant-map-录音.md
│   │   录音应用 variant 映射表。
│   ├── app-variant-map-笔记.md
│   │   笔记应用 variant 映射表。
│   ├── layouts/
│   │   ├── device-dimensions.md
│   │   │   设备尺寸、断点、栏宽、padding、状态栏和导航栏等基础参数。
│   │   ├── lc-nc-layout.md
│   │   │   LC / NC 分栏布局 reference，覆盖 Fold 与 Pad 的左右分栏场景。
│   │   ├── nlc-layout.md
│   │   │   NLC 三栏布局 reference，仅用于 Pad 的导航-列表-内容场景。
│   │   ├── c-layout.md
│   │   │   C 通栏布局 reference，主要做单栏页面拉宽、限宽和边距重算。
│   │   └── foldable-layout.md
│   │       早期折叠屏适配 reference，仅按需参考。
│   └── component-dictionary/
│       └── navigation-bar.md
│           NavigationBar 组件族 reference。
└── archive/
    已归档的旧版规则和日志，仅供参考。
```

## 文件类型约束

### 主 Skill 文件

- 当前只允许 `skill-main-workflow.md` 作为主 Skill 入口。
- 文件头必须包含 YAML frontmatter：

```yaml
---
name: skill-main-workflow
description: 一句话描述触发场景和能力边界
disable-model-invocation: false
---
```

- frontmatter 中的 `name` 必须与文件名去掉 `.md` 后一致。
- 正文默认用中文；Figma API、组件名、属性名保留英文或原始命名。
- 正文结构应稳定保持为：适用场景、前置条件、核心原则、强制工作流、输出或校验标准。

### Reference 文档

- 放在 `references/` 下，采用 `references/{类别}.md` 或子目录命名。
- 除应用 variant 映射表可保留数据型 frontmatter 外，普通 reference 不写 Skill frontmatter，不写 `disable-model-invocation`。
- 用表格承载尺寸、栏宽、padding、componentKey 等结构化信息。
- 用明确数值，不写“较宽”“适中”这类模糊描述。
- 组件名、图层名、区域名要与 Figma 实际命名一致。

## 修改原则

- 改规则先改 `references/`，再改引用这些规则的 Skill。
- 不新增并列 Skill；新增能力优先沉到 reference，并由 `skill-main-workflow.md` 按需读取。
- 重命名 reference 时，检查所有被引用路径、README 清单是否同步。
- 修改布局规则时，检查主 Skill、对应布局 reference、验证标准是否仍然一致。
- 不要一次性把详细规则塞回 Skill 正文；能沉到 `references/` 的规则，优先放到 `references/`。
- 不要把归档文件当成当前规范来源覆盖现行流程。

## 上下文加载策略

- 这是文档仓库中最重要的执行约束之一：不要一次性加载全部 reference 文档。
- 主 Skill 默认只读自身；进入适配后必须先读取通用规则和设备尺寸。
- 命中布局类型后，只加载对应 `references/layouts/*.md`，以及必要的组件字典、应用映射表和组件族 reference。
- 验证阶段优先使用对应布局 reference 中的验收标准。
- 如果你在补文档，也应保持这种“按需引用”的组织方式，不要把所有 reference 复制进单个 Skill。

## 一致性检查清单

编辑后至少自查以下项目：

- 主 Skill frontmatter 是否完整，`name` 与文件名是否一致。
- 非主 reference 是否没有残留 Skill frontmatter。
- 文中引用的 `references/*.md` 路径是否存在。
- `README.md` 的技能清单、目录结构、说明文字是否仍然匹配现状。
- 如果仓库存在 `CLAUDE.md`，其中的项目规范是否需要同步更新。
- 布局类型命名是否统一使用 `NLC / NC / LC / C`。
- 单位是否统一为 `dp`，不要混入 `pt`、`px` 的规则表述，除非明确描述分割线等特殊值。
- 设备范围是否准确：NLC 仅 Pad，LC / NC 同时覆盖 Fold 与 Pad，C 为通栏。

## 已知仓库细节

- 路径统一使用小写 `references/...` 和 `archive/...`，不要扩散 `References/` 或 `Archive/` 写法。

## 建议命令

- 列出全部文件：`rg --files`
- 查 frontmatter：`rg -n '^name:|^description:|^disable-model-invocation:'`
- 查 reference 引用：`rg -n 'references/'`
- 查布局类型或设备范围是否一致：`rg -n 'NLC|NC|LC|C|Fold|Pad'`

## 交付标准

- 优先提交小而准的文档修改，不做无关格式化。
- 最终产出的文档应当“可执行、可验收”，而不是泛泛的设计说明。
- 如果无法确认规范来源，先以 `README.md`、当前 Skill 正文，以及仓库内实际存在的协作规范文件的交集为准，再最小化补充。
