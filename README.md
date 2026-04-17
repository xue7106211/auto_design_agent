# auto_design_agent

面向 **设计稿自动化 / AI 辅助改稿** 的 **Agent 技能（Skill）** 集合仓库。每个技能以独立的 Markdown 文件维护，通过文件头 **YAML Frontmatter** 声明元数据，供 Cursor、Claude Code 等支持 Skill 协议的 Agent 加载与触发。

本仓库由 **小米前端 AI Native（frontend-ai-native）** 组织托管，用于沉淀可在 Figma 等场景下复用的 **可执行工作流**，而不是泛泛的设计说明文档。

---

## 仓库定位

| 维度 | 说明 |
|------|------|
| **目标** | 把「折叠屏适配」「Pad 适配」「分栏重组」等高频、易翻车的改稿流程，固化为可重复的 Agent 指令 |
| **形式** | 单文件 = 单技能；正文为分步流程、验收标准与约束，便于模型按步骤执行 |
| **边界** | 技能描述 **如何改**（探查、复用、校验）；不替代设计系统 Token 与组件规范本身 |

---

## 架构概览

```
主 Skill（入口）→ 判断设备 + 布局类型 → 委托子 Skill 执行 → 验证 Skill 检查结果
```

- **主 Skill**：理解需求、判断布局类型、委托执行
- **子 Skill**：按布局类型（LC / NLC / C）各一个，处理具体适配逻辑
- **验证 Skill**：独立调用，检查生成结果的规则符合性
- **References**：共享规则文档，按需加载

---

## 目录结构

```
auto_design_agent/
├── README.md                              # 本说明
├── CLAUDE.md                              # 项目规范与协作约定
├── figma-multi-terminal-adapt.md          # 主 Skill：多终端适配入口
├── figma-adapt-lc-layout.md               # 子 Skill：LC 双栏适配
├── figma-adapt-nlc-layout.md              # 子 Skill：NLC 三栏适配
├── figma-adapt-c-layout.md                # 子 Skill：C 通栏适配
├── figma-adapt-verify.md                  # 验证 Skill
├── figma-adapt-foldable-layout.md         # [归档] 初版折叠屏适配（已被 LC Skill 替代）
└── references/                            # 共享规则文档
    ├── common-rules.md                    # 通用规则：执行原则、禁止项
    ├── device-dimensions.md               # 设备尺寸表
    ├── layout-lc.md                       # LC 布局规则
    ├── layout-nlc.md                      # NLC 布局规则
    ├── layout-c.md                        # C 布局规则
    ├── component-routing.md               # 组件路由表
    ├── component-adaptation.md            # 组件属性切换规则
    └── plugin-api-patterns.md             # Figma Plugin API 常用模式
```

---

## 技能一览

| 文件 | `name`（标识） | 一句话说明 |
|------|------------------|------------|
| [figma-multi-terminal-adapt.md](./figma-multi-terminal-adapt.md) | `figma-multi-terminal-adapt` | 多终端适配入口：判断设备和布局类型，委托子 Skill 执行，调用验证 Skill 检查结果 |
| [figma-adapt-lc-layout.md](./figma-adapt-lc-layout.md) | `figma-adapt-lc-layout` | LC 双栏适配：左列表 + 右详情，基于现有组件分步写入并校验 |
| [figma-adapt-nlc-layout.md](./figma-adapt-nlc-layout.md) | `figma-adapt-nlc-layout` | NLC 三栏适配：侧边导航 + 列表 + 内容区，底部 Tab 转侧边导航 |
| [figma-adapt-c-layout.md](./figma-adapt-c-layout.md) | `figma-adapt-c-layout` | C 通栏适配：单栏拉宽 + 边距重算，适用于设置页等单一内容页 |
| [figma-adapt-verify.md](./figma-adapt-verify.md) | `figma-adapt-verify` | 验证技能：对生成结果做结构、视觉、语义三层校验，输出通过/不通过报告 |

### 归档技能

| 文件 | 说明 |
|------|------|
| [figma-adapt-foldable-layout.md](./figma-adapt-foldable-layout.md) | 初版折叠屏适配 Skill（一飞），已被 `figma-adapt-lc-layout` 替代，保留供参考 |

---

## 如何使用这些技能

### 在 Cursor / Claude Code 中使用

1. 将本仓库克隆到本地，或把 `.md` 技能文件复制到 Skill 目录。
2. 确保 Agent 能读取到 Markdown 文件。
3. 在对话中描述需求（如「把笔记的手机端设计稿适配到折叠屏」），模型会自动匹配主 Skill 并按工作流执行。

### 与 Figma MCP 的配合

本仓库技能依赖 **Figma MCP** 的读写能力：

- **读取**：`get_metadata`、`get_design_context`、`get_screenshot`、`search_design_system`
- **写入**：`use_figma`（通过 Plugin API 执行 JS）
- reate_new_file`

使用前请确认：
- 已配置远程 Figma MCP 服务器（`use_figma` 仅限远程）
- 拥有目标文件的 Full seat 编辑权限
- 已通过 OAuth 完成 Figma 认证

---

## Reference 文档说明

`references/` 目录存放所有 Skill 共享的规则文档，由 Skill 按需引用加载，不会一次性全部注入上下文。

| 文档 | 负责人 | 说明 |
|------|--------|------|
| common-rules.md | 共同 | 执行原则、禁止项、clone 降级规则 |
| device-dimensions.md | 共同 | 各设备画布尺寸和基础参数 |
| layout-lc.md | 老唐 | LC 双栏布局的栏宽、边距、结构定义 |
| layout-nlc.md | 老唐 | NLC 三栏布局的结构定义 |
| layout-c.md | 老唐 | C 通栏布局的规则 |
| component-routing.md | 一飞 | 高频组件的 Figma 调用路径 |
| component-adaptation.md | 老唐 | 组件在不同终端间的属性切换规则 |
| plugin-api-patterns.md | 一飞 | Figma Plugin API 常用写入模式 |

---

## 技能文件格式（Frontma
| 字段 | 类型 | 含义 |
|------|------|------|
| `name` | string | 技能唯一标识，与文件名（去掉 `.md`）一致 |
| `description` | string | 触发与检索用的描述，写清场景与约束 |
| `disable-model-invocation` | boolean | 是否禁止模型主动调用；`false` 表示允许 |

正文结构：适用场景 → 核心原则 → 强制工作流（Phase 分步）→ 输出要求 → 验收标准

---

## 命名与文件约定

- **文件名**：`figma-adapt-{功能}.md`，kebab-case
- **语言**：正文中文，Figma API 术语保留英文
- **修改原则**：以「可执行、可验收」为先；变更验收标准或工作流时在 MR 描述中写明行为变化

---

## 贡献与评审

1. **新增技能**：新增 `*.md`，补全 Frontmatter，在本 README 技能一览中登记
2. **修改技能**：小步提交；变更工作流或验收标准时说明行为变化
3. **合并请求**：通过 `git.n.xiaomi.com` 发起 Merge Request

---

## 相关链接

- **GitLab 项目：`https://git.n.xiaomi.com/frontend-ai-native/auto_design_agent`
- **组织**：frontend-ai-native（设计系统 / AI Native 相关协作）
