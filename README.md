# auto_design_agent

面向 **Figma MCP + Agent** 的 Skill 仓库，用于沉淀可执行的设计稿自动化流程。当前仓库已经从早期的"多终端适配 Skill 集合"收敛为 **一个主 Skill + 一组按需加载 reference**：

- **主工作流 Skill**：默认生产主入口，负责整体任务编排
- **Reference 文档**：布局、设备尺寸、组件字典、应用映射表等内部执行依据

默认不要读取 `archive/` 下内容，除非用户明确要求或当前活跃文档缺失必要信息。
已下线或暂不维护的旧版规则文档和工作流日志统一移入 `archive/`。

---

## 当前定位

| 维度 | 说明 |
| --- | --- |
| 目标 | 把 Figma 中高频但易出错的组件调用、属性切换和工作流约束固化为 AI 可执行协议 |
| 形式 | 单文件 = 主 Skill 或单份参考文档；正文优先描述"输入、判定、执行、验证" |
| 边界 | 仓库描述如何让 Agent 稳定执行，不替代设计系统本身 |

---

## 当前结构

```text
auto_design_agent/
├── README.md                              仓库说明与使用入口
├── AGENTS.md                              面向 Agent 的编辑约束与自查清单
├── skill-main-workflow.md                 主工作流 Skill：整页适配编排、组件任务生成、按需读取 reference 并执行
├── figma-component-dictionary.md          组件字典 reference：实例探查、映射查表、执行与验证
├── current-execution-map.md               当前可执行链路与断点状态图
├── workflow-collaboration-contract.md     多人协作接口契约：字段定义与数据流转
├── prompt-skill-consistency.md            新增/重构文档时的一致性 Prompt 模板
├── references/
│   ├── common-rules.md                    通用执行原则、禁止项、clone 降级规则
│   ├── app-variant-map-*.md                各应用 variant 映射表（当前含文管、笔记、录音、设置、日历、天气等）
│   ├── layouts/
│   │   ├── device-dimensions.md           设备尺寸、断点、栏宽、padding
│   │   ├── lc-nc-layout.md                LC / NC 分栏布局执行规则
│   │   ├── nlc-layout.md                  NLC 三栏布局执行规则
│   │   ├── c-layout.md                    C 通栏布局执行规则
│   │   └── foldable-layout.md             折叠屏历史适配参考规则
│   └── component-dictionary/
│       └── navigation-bar.md              NavigationBar 组件族 reference
└── archive/                               已归档的旧版规则和日志
    ├── component-adaptation.md
    ├── component-routing.md
    ├── figma-adapt-verify.md
    ├── figma-navigation-framework-components.md
    ├── layout-c.md
    ├── layout-lc-nc.md
    ├── layout-nlc.md
    ├── layout-notes-nlc.md
    ├── navigation-framework-components.md
    └── workflow-log-foldable-adapt-v1.md
```

---

## 当前可用文件

| 文件 | 作用 |
| --- | --- |
| [skill-main-workflow.md](./skill-main-workflow.md) | 唯一主 Skill。负责读取源稿、判断布局类型、生成页面级组件任务、按需读取 reference、执行与验证 |
| [figma-component-dictionary.md](./figma-component-dictionary.md) | 组件字典 reference。作为主链路内部组件处理协议，负责实例探查、映射查表、执行与验证 |
| [current-execution-map.md](./current-execution-map.md) | 当前可执行链路与断点状态图。描述整页生产主链路、内部组件处理步骤、布局 reference 和关键字段归属 |
| [workflow-collaboration-contract.md](./workflow-collaboration-contract.md) | 多人协作接口契约。定义主流程与应用 variant 映射表之间的数据流转、必要字段和命名约定 |
| [prompt-skill-consistency.md](./prompt-skill-consistency.md) | 新增或重构 Skill / reference 的统一 Prompt 模板，强制保持输出结构、命名和引用关系一致 |
| [references/common-rules.md](./references/common-rules.md) | 通用执行原则、禁止项、clone 降级规则和分步写入规范 |
| [references/layouts/device-dimensions.md](./references/layouts/device-dimensions.md) | 设备尺寸、断点、栏宽、padding、状态栏和导航栏基础参数 |
| [references/layouts/lc-nc-layout.md](./references/layouts/lc-nc-layout.md) | LC / NC 分栏布局 reference，覆盖 Fold 与 Pad 的左右分栏场景 |
| [references/layouts/nlc-layout.md](./references/layouts/nlc-layout.md) | NLC 三栏布局 reference，覆盖 Pad 导航-列表-内容场景 |
| [references/layouts/c-layout.md](./references/layouts/c-layout.md) | C 通栏布局 reference，覆盖单栏拉宽、限宽和边距重算 |
| [references/layouts/foldable-layout.md](./references/layouts/foldable-layout.md) | 折叠屏历史适配 reference，仅按需读取 |
| `references/app-variant-map-*.md` | 应用 variant 映射表集合。当前已覆盖文管、笔记、录音、设置、日历、天气、相册、短信、联系人、电话、计算器、收藏、扫一扫、下载管理、小米换机等应用，统一负责 `device + screenMode + resolvedUiElement -> resultType + variantId` 的查询 |
| [references/component-dictionary/navigation-bar.md](./references/component-dictionary/navigation-bar.md) | `NavigationBar` 组件 reference。记录当前分支基准链接、组件集身份、真实字段、可执行记录和回退规则 |

### 归档文件

`archive/` 中保留的是历史多终端适配方案、旧版规则文档和工作流日志，仅供参考，不应再作为当前主规范继续扩写。

---

## 推荐使用方式

### 1. 多终端适配生产主链路

当任务是"把手机稿适配到 Fold / Pad"时，优先使用 [skill-main-workflow.md](./skill-main-workflow.md)：

1. 读取源设计稿上下文
2. 判断目标设备和布局类型
3. 盘点关键组件并生成 `componentTaskList`
4. 基于 `layoutType` 和组件所在栏位或子场景推导 `screenMode`
5. 批量查询 `app-variant-map`
6. 按布局类型读取 `references/layouts/*.md`
7. 在主链路内按组件字典 reference 处理组件
8. 按对应布局 reference 的验收项做结果验证

### 2. 主链路中的组件处理步骤

当整页适配中的某个任务已经收敛为组件级切换时，内部读取 [figma-component-dictionary.md](./figma-component-dictionary.md)：

1. 先探查当前实例的真实结构，并识别 `resolvedUiElement`
2. 再按 `appName` 加载应用 variant 映射表
3. 用 `device + screenMode + resolvedUiElement` 查出目标记录，并在需要时获取 `variantId`
4. 命中字典层记录并加载对应 `referenceDoc`
5. 决定动作：`setProperties(...)` 或 `swapComponent(...)`
6. 执行并验证

### 3. 参考文档加载

参考文档采用**按需加载**：

- 主 Skill 默认只读取自身
- 所有适配必须先读取 `references/common-rules.md` 和 `references/layouts/device-dimensions.md`
- 命中布局类型后，再读取对应 `references/layouts/*.md`
- 命中字典层记录后，再加载对应 `referenceDoc`
- 参考文档只补充该组件族的细节，不重复通用执行协议

当前已沉淀的参考文档：

- [references/common-rules.md](./references/common-rules.md)
- [references/layouts/device-dimensions.md](./references/layouts/device-dimensions.md)
- [references/layouts/lc-nc-layout.md](./references/layouts/lc-nc-layout.md)
- [references/layouts/nlc-layout.md](./references/layouts/nlc-layout.md)
- [references/layouts/c-layout.md](./references/layouts/c-layout.md)
- [references/layouts/foldable-layout.md](./references/layouts/foldable-layout.md)
- `references/app-variant-map-*.md`（当前共 15 份活跃应用映射表）
- [references/component-dictionary/navigation-bar.md](./references/component-dictionary/navigation-bar.md)

其中已建立的应用映射表包括：

- 文管、笔记、录音、设置、日历、天气、相册、短信
- 联系人、电话、计算器、收藏、扫一扫、下载管理、小米换机

后续若继续拆分组件参考，建议统一放在：

- 应用 variant 映射表：`references/app-variant-map-{appName}.md`
- 组件族 reference：`references/component-dictionary/{component-family}.md`

---

## 与 Figma MCP 的关系

当前 Skill 主要依赖以下能力：

- 读取：`get_metadata`、`get_context_for_code_connect`、`get_design_context`、`get_screenshot`
- 定位：`search_design_system`
- 写入：`use_figma`

执行前请确认：

- 已配置可用的 Figma MCP
- 拥有目标文件编辑权限
- Agent 能读取到本仓库中的主 Skill 和 reference 文件

---

## 维护约定

- 新增或移动活跃 reference 时，同步更新本 README 的"当前结构"和"当前可用文件"
- 历史方案不要继续堆回根目录，统一放入 `archive/`
- 参考文档保持按需加载，不把细节重新堆回主 Skill
- 应用 variant 映射表和组件 reference 都属于活跃输入文档，路径变化时要同步更新 README
- `skill-main-workflow.md` 是默认且唯一的生产主入口；不要再维护独立的测试 Case 流程
- 组件字典只保留索引和协议；组件字段、值域和锚点下沉到各自 reference
- 非主入口文档不要保留 Skill frontmatter；统一写成普通 reference 文档

---

## 相关说明

- 仓库协作约束见 [AGENTS.md](./AGENTS.md)
- 多人协作接口契约见 [workflow-collaboration-contract.md](./workflow-collaboration-contract.md)
- 新增或重构 Skill / reference 的统一 Prompt 见 [prompt-skill-consistency.md](./prompt-skill-consistency.md)
- 当前可执行链路与断点状态见 [current-execution-map.md](./current-execution-map.md)
- 历史适配方案和旧规则文档见 `archive/`
