# AGENTS.md

本文件面向在本仓库内工作的 Agent。目标不是解释产品功能，而是约束如何安全、稳定地维护这些 Skill 文档。

## 仓库定位

- 这是一个 Figma 多终端适配的 Agent Skill 仓库，不是应用代码仓库。
- 主要产物是 Markdown Skill 和共享规则文档，供 Cursor、Claude Code 等支持 Skill 协议的 Agent 加载。
- 核心链路：入口 Skill 判断设备和布局类型，委托子 Skill 执行，再由验证 Skill 校验结果。
- 默认不要读取 `archive/` 下内容，除非用户明确要求或当前活跃文档缺失必要信息。

## 文件树与职责

```text
auto_design_agent/
├── AGENTS.md
│   当前文件。面向后续 Agent，说明仓库定位、编辑约束、自查清单和已知风险。
├── README.md
│   仓库对外说明，包含技能一览、目录结构、使用方式和 Reference 文档说明。
├── CLAUDE.md
│   项目级协作规范，定义命名、frontmatter、上下文加载策略和修改原则。
├── PULL_REQUEST.md
│   PR 描述模板和历史变更示例，用于整理变更范围、验收点和影响面。
├── figma-multi-terminal-adapt.md
│   主 Skill 入口。负责读取源设计稿、判断目标设备与布局类型，并委托子 Skill。
├── figma-adapt-lc-nc-layout.md
│   子 Skill。处理 LC / NC 分栏布局适配，覆盖 Fold 与 Pad 的左右分栏场景。
├── figma-adapt-nlc-layout.md
│   子 Skill。处理 NLC 三栏布局适配，仅用于 Pad 的导航-列表-内容场景。
├── figma-adapt-c-layout.md
│   子 Skill。处理 C 通栏布局，主要做单栏页面拉宽、限宽和边距重算。
├── figma-adapt-verify.md
│   验证 Skill。对适配结果做结构和视觉校验，只检查不改稿。
├── figma-navigation-framework-components.md
│   组件调用 Skill。处理导航框架类组件的获取、替换和属性切换，不负责整页布局重组。
├── figma-adapt-foldable-layout.md
│   归档 Skill。早期折叠屏适配版本，保留作参考，不应作为当前主规范继续扩写。
├── references/
│   共享规则文档目录。Skill 按需引用，不应一次性全部加载。
│   ├── common-rules.md
│   │   通用执行原则、禁止项、clone 降级规则和分步写入规范。
│   ├── device-dimensions.md
│   │   设备尺寸、断点、栏宽、padding、状态栏和导航栏等基础参数。
│   ├── layout-lc-nc.md
│   │   LC / NC 布局规则正文，定义分栏宽度、各栏职责和适配逻辑。
│   ├── layout-nlc.md
│   │   NLC 三栏布局规则，定义 N/L/C 三栏结构和底部 Tab 转侧边导航规则。
│   ├── layout-c.md
│   │   当前内容显示为 LC / NC 规则的镜像/重写版本，使用时要以实际引用关系为准并谨慎核对。
│   ├── component-routing.md
│   │   高频组件的 componentKey 路由表，供搜索不准时精确定位 Figma 组件。
│   ├── component-adaptation.md
│   │   手机端组件到目标设备组件的适配映射表。
│   ├── navigation-framework-components.md
│   │   导航框架组件的 Figma 锚点、推荐搜索词和已知属性切换规则。
│   └── plugin-api-patterns.md
│       Figma Plugin API 常用写入模式，供 use_figma 脚本参考。
└── References/
    当前工作区实际显示的大写目录名。Git 跟踪路径仍是小写 `references/`，在大小写敏感环境有风险。
```

## 文件类型约束

### Skill 文件

- 文件名采用 `figma-adapt-{功能}.md` 或已有同类命名，使用 kebab-case。
- 文件头必须包含 YAML frontmatter：

```yaml
---
name: figma-adapt-xxx
description: 一句话描述触发场景和能力边界
disable-model-invocation: false
---
```

- frontmatter 中的 `name` 必须与文件名去掉 `.md` 后一致。
- 正文默认用中文；Figma API、组件名、属性名保留英文或原始命名。
- 正文结构应稳定保持为：适用场景、前置条件、核心原则、强制工作流、输出或校验标准。

### Reference 文档

- 放在 `references/` 下，采用 `references/{类别}.md` 命名。
- 用表格承载尺寸、栏宽、padding、componentKey 等结构化信息。
- 用明确数值，不写“较宽”“适中”这类模糊描述。
- 组件名、图层名、区域名要与 Figma 实际命名一致。

## 修改原则

- 改规则先改 `references/`，再改引用这些规则的 Skill。
- 新增 Skill 时，至少同步更新 `README.md` 的技能一览和目录结构。
- 重命名 Skill 时，检查所有被引用路径、frontmatter `name`、README 清单是否同步。
- 修改布局规则时，检查入口 Skill、对应子 Skill、验证 Skill 三处是否仍然一致。
- 不要一次性把详细规则塞回 Skill 正文；能沉到 `references/` 的规则，优先放到 `references/`。
- 不要把归档文件 `figma-adapt-foldable-layout.md` 当成当前规范来源覆盖现行流程。

## 上下文加载策略

- 这是文档仓库中最重要的执行约束之一：不要一次性加载全部 reference 文档。
- 主 Skill 只应依赖通用规则和设备尺寸。
- 子 Skill 只加载对应布局规则，以及必要的组件映射、组件路由、Plugin API 模式。
- 验证 Skill 只加载通用规则和对应布局规则。
- 如果你在补文档，也应保持这种“按需引用”的组织方式，不要把所有 reference 复制进单个 Skill。

## 一致性检查清单

编辑后至少自查以下项目：

- frontmatter 是否完整，`name` 与文件名是否一致。
- 文中引用的 `references/*.md` 路径是否存在。
- `README.md` 的技能清单、目录结构、说明文字是否仍然匹配现状。
- `CLAUDE.md` 中的项目规范是否需要同步更新。
- 布局类型命名是否统一使用 `NLC / NC / LC / C`。
- 单位是否统一为 `dp`，不要混入 `pt`、`px` 的规则表述，除非明确描述分割线等特殊值。
- 设备范围是否准确：NLC 仅 Pad，LC / NC 同时覆盖 Fold 与 Pad，C 为通栏。

## 已知仓库细节

- Git 跟踪路径使用小写 `references/`，但当前工作区目录显示为 `References/`，且仓库配置 `core.ignorecase=true`。
- 在 macOS 默认大小写不敏感文件系统下这不会立刻报错，但在大小写敏感环境中可能出问题。
- 新增引用、路径修正、文档说明时，统一写成小写 `references/...`，不要继续扩散大写目录写法。
- 工作区里当前存在未跟踪文件 `.DS_Store` 和 `References/workflow-log-foldable-adapt-v1.md`。除非用户明确要求，不要顺手清理或纳入本次变更。

## 建议命令

- 列出全部文件：`rg --files`
- 查 frontmatter：`rg -n '^name:|^description:|^disable-model-invocation:'`
- 查 reference 引用：`rg -n 'references/'`
- 查布局类型或设备范围是否一致：`rg -n 'NLC|NC|LC|C|Fold|Pad'`

## 交付标准

- 优先提交小而准的文档修改，不做无关格式化。
- 最终产出的文档应当“可执行、可验收”，而不是泛泛的设计说明。
- 如果无法确认规范来源，先以 `README.md` + `CLAUDE.md` + 当前 Skill 正文的交集为准，再最小化补充。

