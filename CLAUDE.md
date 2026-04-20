# Auto Design Agent 项目规范

## 项目定位

面向多终端（Fold / Pad）界面适配的 AI Agent Skill 集合。通过 Figma MCP 读取手机端设计稿，自动生成折叠屏和平板端的适配设计稿。

## 架构概览

```
主 Skill（入口）→ 判断设备 + 布局类型 → 委托子 Skill 执行 → 验证 Skill 检查结果
```

- 主 Skill：`figma-multi-terminal-adapt.md`
- 子 Skill：按布局类型拆分（LC / NC / NLC / C）
- 验证 Skill：`figma-adapt-verify.md`，独立调用
- 规则文档：`references/` 目录，按需加载

## 文件命名

- Skill 文件：`figma-adapt-{功能}.md`，kebab-case，与 frontmatter `name` 字段一致
- Reference 文件：`references/{类别}.md`，kebab-case
- 语言：正文中文，Figma API 术语保留英文（如 `createInstance`、`appendChild`、`clipsContent`）

## Skill 文件格式

```yaml
---
name: figma-adapt-xxx
description: 一句话描述触发场景和能力边界
disable-model-invocation: false
---
```

正文结构：适用场景 → 核心原则 → 强制工作流（Phase 分步）→ 输出要求 → 验收标准

正文控制在 1500-2000 字，详细规则放 references/。

## Reference 文档格式

- 单文档 ≤ 300 行
- 所有尺寸用 dp 标注，不用模糊描述（"较宽" ✗ → "356dp" ✓）
- 组件名、图层名、区域名与 Figma 中的实际命名严格一致
- 用表格呈现数值型规则，用列表呈现流程型规则

## 上下文加载策略

禁止一次性加载所有 reference。每个 Skill 只引用自己需要的文档：

- 主 Skill：`common-rules.md` + `device-dimensions.md`
- 子 Skill：对应的 `layout-*.md` + `component-routing.md` + `component-adaptation.md`
- 验证 Skill：`common-rules.md` + 对应的 `layout-*.md`

## 分工

| 负责人 | 负责内容 |
|--------|----------|
| 一飞 | 主 Skill 流程、子 Skill 工作流、component-routing.md、plugin-api-patterns.md |
| 老唐 | layout-lc-nc.md、layout-nlc.md、layout-c.md、component-adaptation.md |
| 共同 | common-rules.md、device-dimensions.md |

## 修改原则

- 改规范先改文档，再改 Skill，不要反过来
- 新增 Skill 必须在 README 技能一览表中登记
- Reference 文档修改后，检查引用该文档的所有 Skill 是否仍然兼容
- 以「可执行、可验收」为先，不写泛泛的设计散文
