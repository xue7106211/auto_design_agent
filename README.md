# auto_design_agent

面向 **Figma MCP + Agent** 的 Skill 仓库，用于沉淀可执行的设计稿自动化流程。当前仓库已经从早期的“多终端适配 Skill 集合”收敛为两类核心内容：

- **主工作流 Skill**：负责整体任务编排
- **组件字典 Skill**：负责按编号定位组件并执行属性切换或组件替换

已下线或暂不维护的旧版适配 Skill、规则文档和工作流日志统一移入 `archive/`。

---

## 当前定位

| 维度 | 说明 |
| --- | --- |
| 目标 | 把 Figma 中高频但易出错的组件调用、属性切换和工作流约束固化为 AI 可执行协议 |
| 形式 | 单文件 = 单 Skill 或单份参考文档；正文优先描述“输入、判定、执行、验证” |
| 边界 | 仓库描述如何让 Agent 稳定执行，不替代设计系统本身 |

---

## 当前结构

```text
auto_design_agent/
├── README.md
├── AGENTS.md
├── skill-main-workflow.md
├── figma-component-dictionary.md
├── references/
│   └── navigation-framework-components.md
└── archive/
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
    └── workflow-log-foldable-adapt-v1.md
```

---

## 当前可用文件

| 文件 | `name` | 作用 |
| --- | --- | --- |
| [skill-main-workflow.md](./skill-main-workflow.md) | `figma-multi-terminal-adapt` | 主工作流 Skill。面向多终端适配任务，负责读取源稿、判断布局类型、委托执行与验证 |
| [figma-component-dictionary.md](./figma-component-dictionary.md) | `figma-component-dictionary` | 组件字典 Skill。面向 AI 执行，按 `variantId` 查字典层与执行层，决定 `setProperties(...)` 或 `swapComponent(...)` |
| [references/navigation-framework-components.md](./references/navigation-framework-components.md) | - | 导航框架组件参考文档。提供锚点、推荐搜索词和已知切换规则，供 Skill 按需加载 |

### 归档文件

`archive/` 中保留的是历史多终端适配方案、旧版规则文档和工作流日志，仅供参考，不应再作为当前主规范继续扩写。

---

## 推荐使用方式

### 1. 多终端适配主链路

当任务是“把手机稿适配到 Fold / Pad”时，优先使用 [skill-main-workflow.md](./skill-main-workflow.md)：

1. 读取源设计稿上下文
2. 判断目标设备和布局类型
3. 调用对应执行链路
4. 做结果验证

### 2. 组件级调用与属性切换

当任务是“按编号调用组件”或“稳定切换组件属性”时，优先使用 [figma-component-dictionary.md](./figma-component-dictionary.md)：

1. 探查当前实例的真实结构
2. 用 `variantId` 命中字典层记录
3. 读取执行层记录
4. 决定动作：`setProperties(...)` 或 `swapComponent(...)`
5. 执行并验证

### 3. 参考文档加载

参考文档采用**按需加载**：

- 主 Skill 默认只读取自身
- 命中某个组件族后，再加载对应参考文档
- 参考文档只补充该组件族的细节，不重复通用执行协议

当前已沉淀的参考文档：

- [references/navigation-framework-components.md](./references/navigation-framework-components.md)

后续若继续拆分组件参考，建议统一放在：

- `references/component-dictionary/{component-family}.md`

---

## 与 Figma MCP 的关系

当前 Skill 主要依赖以下能力：

- 读取：`get_metadata`、`get_context_for_code_connect`、`get_design_context`、`get_screenshot`
- 定位：`search_design_system`
- 写入：`use_figma`

执行前请确认：

- 已配置可用的 Figma MCP
- 拥有目标文件编辑权限
- Agent 能读取到本仓库中的 Skill 文件

---

## 维护约定

- 新增活跃 Skill 时，同步更新本 README 的“当前结构”和“当前可用文件”
- 历史方案不要继续堆回根目录，统一放入 `archive/`
- 参考文档保持按需加载，不把细节重新堆回主 Skill
- 组件字典类 Skill 优先写成面向 AI 的线性协议：`输入 -> 探查 -> 查表 -> 执行 -> 验证 -> 输出`

---

## 相关说明

- 仓库协作约束见 [AGENTS.md](./AGENTS.md)
- 历史适配方案和旧规则文档见 `archive/`
