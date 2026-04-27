# AGENTS.md

本文件面向在本仓库内工作的 Agent。目标不是解释产品功能，而是约束如何安全、稳定地维护这些 Skill 文档。

## 仓库定位

- 这是一个 Figma 多终端适配的 Agent Skill 仓库，不是应用代码仓库。
- 主要产物是 Markdown Skill 和共享规则文档，供 Cursor、Claude Code 等支持 Skill 协议的 Agent 加载。
- 核心链路：主工作流 Skill 负责整页适配编排，内部复用组件字典 Skill 处理组件级任务。
- 默认不要读取 `Archive/` 下内容，除非用户明确要求或当前活跃文档缺失必要信息。

## 文件树与职责

```text
auto_design_agent/
├── AGENTS.md
│   当前文件。面向后续 Agent，说明仓库定位、编辑约束、自查清单和已知风险。
├── README.md
│   仓库对外说明，包含技能一览、目录结构、使用方式和 Reference 文档说明。
├── skill-main-workflow.md
│   主工作流 Skill。默认且唯一的生产主入口，负责读取源稿、判断布局类型、
│   生成页面级组件任务、委托执行与验证。
├── figma-component-dictionary.md
│   组件字典 Skill。作为主链路内部复用的组件处理能力，负责实例探查、
│   映射查表、执行与验证。
├── current-execution-map.md
│   当前可执行链路与断点状态图。描述整页生产主链路、内部组件处理步骤和
│   当前断点，以及关键字段归属。
├── workflow-collaboration-contract.md
│   多人协作接口契约。定义主流程与应用 variant 映射表之间的数据流转、
│   必要字段和命名约定。
├── prompt-skill-consistency.md
│   新增或重构 Skill / reference 的统一 Prompt 模板，强制保持输出结构、
│   命名和引用关系一致。
├── references/
│   共享规则文档目录。Skill 按需引用，不应一次性全部加载。
│   ├── common-rules.md
│   │   通用执行原则、禁止项、clone 降级规则和分步写入规范。
│   ├── device-dimensions.md
│   │   设备尺寸、断点、栏宽、padding、状态栏和导航栏等基础参数。
│   ├── layout-c.md
│   │   C 通栏布局规则。
│   ├── layout-lc-nc.md
│   │   LC / NC 布局规则正文，定义分栏宽度、各栏职责和适配逻辑。
│   ├── layout-nlc.md
│   │   NLC 三栏布局规则，定义 N/L/C 三栏结构和底部 Tab 转侧边导航规则。
│   ├── app-variant-map-下载管理.md
│   ├── app-variant-map-天气.md
│   ├── app-variant-map-小米换机.md
│   ├── app-variant-map-录音.md
│   ├── app-variant-map-手机管家.md
│   ├── app-variant-map-扫一扫.md
│   ├── app-variant-map-收藏.md
│   ├── app-variant-map-文管.md
│   ├── app-variant-map-日历.md
│   ├── app-variant-map-电话.md
│   ├── app-variant-map-相册.md
│   ├── app-variant-map-短信.md
│   ├── app-variant-map-笔记.md
│   ├── app-variant-map-联系人.md
│   ├── app-variant-map-计算器.md
│   ├── app-variant-map-设置.md
│   │   以上为各应用的 variant 映射表，负责
│   │   device + screenMode + resolvedUiElement -> resultType + variantId 的查询。
│   └── component-dictionary/
│       └── navigation-bar.md
│           NavigationBar 组件族 reference。记录当前分支基准链接、组件集身份、
│           真实字段、可执行记录和回退规则。
└── Archive/
    已归档的旧版 Skill、规则文档和工作流日志，仅供参考。
    ├── common-rules.md
    ├── component-adaptation.md
    ├── component-routing.md
    ├── device-dimensions.md
    ├── figma-adapt-c-layout.md
    ├── figma-adapt-foldable-layout.md
    ├── figma-adapt-lc-nc-layout.md
    ├── figma-adapt-nlc-layout.md
    ├── figma-adapt-verify.md
    ├── figma-navigation-framework-components.md
    ├── layout-c.md
    ├── layout-lc-nc.md
    ├── layout-nlc.md
    ├── layout-notes-nlc.md
    ├── navigation-framework-components.md
    └── workflow-log-foldable-adapt-v1.md
```

## 文件类型约束

### Skill 文件

- 文件名采用 `skill-{功能}.md`、`figma-{功能}.md` 或已有同类命名，使用 kebab-case。
- 文件头必须包含 YAML frontmatter：

```yaml
---
name: skill-xxx
description: 一句话描述触发场景和能力边界
disable-model-invocation: false
---
```

- frontmatter 中的 `name` 必须与文件名去掉 `.md` 后一致。
- 正文默认用中文；Figma API、组件名、属性名保留英文或原始命名。
- 正文结构应稳定保持为：适用场景、前置条件、核心原则、强制工作流、输出或校验标准。

### Reference 文档

- 放在 `references/` 下，采用对应命名规范：
  - 应用 variant 映射表：`references/app-variant-map-{appName}.md`
  - 组件族 reference：`references/component-dictionary/{component-family}.md`
- 用表格承载尺寸、栏宽、padding、componentKey、variant 映射等结构化信息。
- 用明确数值，不写"较宽""适中"这类模糊描述。
- 组件名、图层名、区域名要与 Figma 实际命名一致。

## 修改原则

- 改规则先改 `references/`，再改引用这些规则的 Skill。
- 新增 Skill 时，至少同步更新 `README.md` 的"当前结构"和"当前可用文件"。
- 重命名 Skill 时，检查所有被引用路径、frontmatter `name`、README 清单是否同步。
- 不要一次性把详细规则塞回 Skill 正文；能沉到 `references/` 的规则，优先放到 `references/`。
- 不要把归档文件当成当前规范来源覆盖现行流程。
- `skill-main-workflow.md` 是默认且唯一的生产主入口；不要再维护独立的测试 Case 流程。
- 主组件字典只保留索引和协议；组件字段、值域和锚点下沉到各自 reference。

## 上下文加载策略

- 这是文档仓库中最重要的执行约束之一：不要一次性加载全部 reference 文档。
- 主工作流 Skill 默认只读取自身。
- 命中字典层记录后，再按 `appName` 加载对应的 `app-variant-map-{appName}.md`。
- 命中组件族记录后，再加载对应的 `references/component-dictionary/{component-family}.md`。
- 参考文档只补充该组件族的细节，不重复通用执行协议。
- 如果你在补文档，也应保持这种"按需引用"的组织方式，不要把所有 reference 复制进单个 Skill。

## 一致性检查清单

编辑后至少自查以下项目：

- frontmatter 是否完整，`name` 与文件名是否一致。
- 文中引用的 `references/*.md` 路径是否存在。
- `README.md` 的"当前结构"、"当前可用文件"、说明文字是否仍然匹配现状。
- 应用 variant 映射表和组件 reference 的路径变化是否已同步更新 README。
- 单位是否统一为 `dp`，不要混入 `pt`、`px` 的规则表述，除非明确描述分割线等特殊值。

## 已知仓库细节

- Git 跟踪路径使用小写 `references/`，但归档目录当前工作区显示为大写 `Archive/`。
- 在 macOS 默认大小写不敏感文件系统下这不会立刻报错，但在大小写敏感环境中可能出问题。
- 新增引用、路径修正、文档说明时，`references/` 统一写成小写。
- 工作区里当前存在未跟踪文件 `.DS_Store`。除非用户明确要求，不要顺手清理或纳入本次变更。

## 建议命令

- 列出全部文件：`rg --files`
- 查 frontmatter：`rg -n '^name:|^description:|^disable-model-invocation:'`
- 查 reference 引用：`rg -n 'references/'`
- 查应用 variant 映射表：`rg --files | rg 'app-variant-map'`

## 交付标准

- 优先提交小而准的文档修改，不做无关格式化。
- 最终产出的文档应当"可执行、可验收"，而不是泛泛的设计说明。
- 如果无法确认规范来源，先以 `README.md` + 当前 Skill 正文的交集为准，再最小化补充。
