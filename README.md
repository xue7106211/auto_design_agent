# auto_design_agent

面向 **设计稿自动化 / AI 辅助改稿** 的 **Agent 技能（Skill）** 集合仓库。每个技能以独立的 Markdown 文件维护，通过文件头 **YAML Frontmatter** 声明元数据，供 Cursor、Claude Code 等支持 Skill 协议的 Agent 加载与触发。

本仓库由 **小米前端 AI Native（frontend-ai-native）** 组织托管，用于沉淀可在 Figma 等场景下复用的 **可执行工作流**，而不是泛泛的设计说明文档。

---

## 仓库定位

| 维度 | 说明 |
|------|------|
| **目标** | 把「折叠屏适配」「分栏重组」等高频、易翻车的改稿流程，固化为可重复的 Agent 指令 |
| **形式** | 单文件 = 单技能；正文为分步流程、验收标准与约束，便于模型按步骤执行 |
| **边界** | 技能描述 **如何改**（探查、复用、校验）；不替代设计系统 Token 与组件规范本身 |

---

## 目录结构

```
auto_design_agent/
├── README.md                         # 本说明
└── figma-adapt-foldable-layout.md    # Skill：Figma 折叠屏 / 大屏分栏布局适配
```

后续新增技能时，建议在本 README 的 [技能一览](#技能一览) 中同步登记，并保持命名风格一致（见 [命名与文件约定](#命名与文件约定)）。

---

## 技能一览

| 文件 | `name`（标识） | 一句话说明 |
|------|------------------|------------|
| [figma-adapt-foldable-layout.md](./figma-adapt-foldable-layout.md) | `figma-adapt-foldable-layout` | 在**已有目标 Frame** 内完成折叠屏 / 大屏分栏适配：优先复用组件与画布节点，分步写入，每步后做截图与结构校验 |

### figma-adapt-foldable-layout 适用场景（摘要）

- 将两个移动端页面重组为 **左右分栏**（如首页 + 详情）
- 在 **指定 Frame 内直接覆盖** 制作，不另开「V2 / 副本」页面
- 复用现有 **状态栏 / 列表** 等变体做设备适配，而非整页重画

更完整的阶段划分（Phase A/B/C）、clone 与 `createInstance` 的取舍、以及默认验收标准，均以技能正文为准。

---

## 如何使用这些技能

### 在 Cursor 中使用

1. 将本仓库克隆到本地，或把单个 `.md` 技能文件复制到你的 **Skill 目录**（例如 Cursor 规则中配置的 `skills` / `.cursor` 所引用的路径，以你当前环境为准）。
2. 确保 Agent 能读取到该 Markdown（工作区包含该文件，或 Skill 已注册到对应插件）。
3. 在对话中描述与技能 `description` 一致的需求（例如「在这个 Frame 里做折叠屏左右分栏，左列表右详情」），模型应按技能内的 **强制工作流** 执行。

### 与 Figma / MCP 的配合

本仓库技能假定执行侧能通过 **Figma Dev Mode MCP**、**Figma Plugin API** 或团队约定的 `use_figma` 等能力完成画布读写。使用前请确认：

- 已具备目标文件与 Frame 的访问权限；
- 执行环境已按组织规范接入 Figma 相关 MCP（若有）。

技能正文会要求 **截图校验** 与 **结构校验**；未接通 Figma 时，应由执行者用等价方式（导出图 + 节点树）完成校验，否则不要宣称已按技能完整执行。

---

## 技能文件格式（Frontmatter）

每个技能文件顶部为 YAML，常用字段如下（以现有文件为准，后续可扩展）：

| 字段 | 类型 | 含义 |
|------|------|------|
| `name` | string | 技能唯一标识，建议与文件名（去掉 `.md`）一致 |
| `description` | string | 触发与检索用的一句话描述，建议写清场景与约束 |
| `disable-model-invocation` | boolean | 是否禁止模型主动调用；`false` 表示允许按需加载 |

正文使用 Markdown 标题划分：**适用场景、核心原则、强制工作流、输出要求、验收标准** 等，便于人和模型共同遵守。

---

## 命名与文件约定

- **文件名**：使用 **kebab-case**，与 `name` 字段对齐，例如 `figma-adapt-foldable-layout.md`。
- **语言**：当前技能正文为 **中文** 为主，必要时可保留 Figma API 英文术语（如 `createInstance`、`appendChild`、`clipsContent`）。
- **修改原则**：以「可执行、可验收」为先；避免冗长设计散文；**输出要求** 一节应明确模型最终应对用户汇报什么、不汇报什么。

---

## 本地开发克隆

```bash
git clone git@git.n.xiaomi.com:frontend-ai-native/auto_design_agent.git
cd auto_design_agent
```

若远程为新项目，Owner 需先在 GitLab **网页上创建首个提交**（例如添加本 README），以完成默认分支初始化，再与本地分支对齐（`pull` / `rebase` 后 `push`）。详见团队 GitLab 说明。

---

## 贡献与评审

1. **新增技能**：新增 `*.md`，补全 Frontmatter，并在本 README [技能一览](#技能一览) 中登记。
2. **修改技能**：尽量小步提交；若变更验收标准或工作流顺序，建议在 MR 描述中写明「行为变化」，便于使用方同步。
3. **合并请求**：通过 `git.n.xiaomi.com` 发起 Merge Request，指定审阅人（建议至少一名熟悉 Figma 与 Agent 执行的同事）。

---

## 许可证与归属

版权与开源策略以组织 **frontend-ai-native** 及小米内部规范为准；若需对外开源或脱敏发布，请先走内部流程，勿擅自公开未脱敏的设计文件链接或内网地址。

---

## 相关链接

- **GitLab 项目**：`https://git.n.xiaomi.com/frontend-ai-native/auto_design_agent`
- **组织**：frontend-ai-native（设计系统 / AI Native 相关协作）

如有问题或希望扩展新技能（例如「从代码同步到 Figma」「组件变体批量检查」），可在项目 Issue 或团队频道中提出，便于排期与拆文件维护。
