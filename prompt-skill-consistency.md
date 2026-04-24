# Skill Consistency Prompt

下面这段 Prompt 用于在本仓库中新增或重构 Skill / reference 文档时，强制保持输出结构、命名和引用关系一致。

复制后可直接使用；将方括号占位符替换为你的真实任务。

## Prompt

```md
你现在是这个仓库的维护 Agent。请在动手前先阅读并遵守以下文件中的现有规范：

- `README.md`
- `AGENTS.md`
- `skill-main-workflow.md`
- `figma-component-dictionary.md`
- 若任务涉及已有 reference，再按需读取 `references/` 下相关文件

你的任务是：[在这里填写任务，例如“新增一个组件族 reference 文档”“新增一个应用 variant 映射表”“重构某个布局 reference”]

请严格按以下原则执行，不要跳步，不要凭空发挥：

## 1. 先判断目标产物类型

先判断这次应该产出哪一类文件，只能选最贴近职责的一类，不要混写：

- `主 Skill`：仅 `skill-main-workflow.md`，用于描述 AI 的入口执行协议，强调输入、判定、执行、验证、输出
- `布局 reference`：用于 `layoutType + targetDevice -> 画布尺寸、栏位、组件放置、验收项`
- `应用 variant 映射表`：用于 `appName + device + screenMode + uiElement -> resultType + variantId`
- `组件族 reference`：用于记录某个组件族的定位信息、真实字段、可执行记录、回退规则
- `审计/覆盖说明`：用于记录缺口、备注、TODO，不要混入主 Skill 或主 reference

除 `skill-main-workflow.md` 外，不要新增独立 Skill。若现有文件把多种职责混在一起，优先拆分为 reference，而不是继续往里堆内容。

## 2. 命名必须服从职责

命名不要沿用模糊历史词，文件名、frontmatter `name`、标题、README 描述都必须反映真实职责。

使用以下命名约定：

- 主 Skill 文件：
  - 只能是 `skill-main-workflow.md`
  - 必须保留 Skill frontmatter
- 布局 reference：
  - 路径：`references/layouts/{layout}-layout.md`
  - 不写 Skill frontmatter
- 应用 variant 映射表：
  - 路径：`references/app-variant-map-{appName}.md`
  - frontmatter `name: app-variant-map`
- 组件族 reference：
  - 路径：`references/component-dictionary/{component-family}.md`
- 不要再发明和当前仓库语义冲突的新前缀，除非现有命名明显错误且你会同步修正所有引用

## 3. 结构必须稳定

### 如果产物是主 Skill

正文优先写成给 AI 执行的线性协议，结构尽量保持：

1. 主 Skill 目标
2. 输入与输出
3. 执行协议
4. 参考文档
5. 加载时机或文档组织规则
6. 关键约束 / 禁止项

要求：

- 语言简洁，优先写“怎么做”，不要写泛泛背景介绍
- 不把大量 reference 数据直接塞回 Skill
- 能下沉到 `references/` 的细节一律下沉

### 如果产物是布局 reference

正文结构尽量保持：

1. 适用场景
2. 前置条件
3. 核心原则
4. 强制工作流
5. 每步校验标准
6. 默认验收标准

要求：

- 开头明确“由 `skill-main-workflow.md` 按需读取，不是独立 Skill”
- 不写 `name / description / disable-model-invocation` frontmatter
- 明确设备范围：NLC 仅 Pad，LC / NC 覆盖 Fold 与 Pad，C 为通栏
- 明确栏宽、padding、组件所在栏位和禁止项

### 如果产物是应用 variant 映射表

正文结构保持：

1. frontmatter
2. 用途
3. 枚举定义
4. 状态约定
5. 映射表
6. 当前覆盖缺口

要求：

- 使用扁平表，不要写成“每个组件一张矩阵表”
- 明确区分：
  - `variant`
  - `hidden`
  - `absent`
  - `undefined`
- 设备枚举、screenMode 枚举、uiElement 命名必须统一
- 若某设备只支持部分 `screenMode`，要显式写出约束
- 对“明确不存在”的组合，优先显式落表，不要依赖读者猜测

### 如果产物是组件族 reference

正文结构尽量保持：

1. 适用记录
2. 核心结论
3. 定位与识别
4. 已验证字段与值域
5. 执行记录
6. 回退规则 / 已知陷阱

要求：

- 所有字段名、属性名、variantId 与 Figma 实际命名保持一致
- 区分 `probed / manual / inferred`
- 不把主 Skill 的通用协议复制进 reference

## 4. 内容分层必须干净

写文档时强制区分这三层，不要混杂：

- 协议层：AI 应该按什么流程执行
- 数据层：结构化枚举、映射、字段、variantId、componentKey
- 维护层：缺口、备注、TODO、人工观察

规则：

- 协议层放主 Skill
- 数据层放 reference
- 维护层单独成段，必要时单独成文档

不要把“规律总结”“经验备注”“待补项”混进核心查表区，除非它直接参与执行判断。

## 5. 输出时优先做结构化收敛

新增或重构时，优先做下面这些事：

- 统一枚举字面量
- 消除同一概念的多种叫法
- 把隐式语义改成显式字段
- 把矩阵型人工说明改成 AI 更稳定读取的扁平表
- 把路径规则、文件名、README 说明同步对齐

如果发现旧命名会误导后续维护者，应直接修正，不要为了“少改”保留坏名字。

## 6. 修改后必须同步检查

完成编辑后，必须检查并在需要时同步更新：

- `README.md`
- 主 Skill 中引用该文件的路径
- frontmatter `name`（仅主 Skill 和应用 variant 映射表需要）
- 文中的路径示例
- 当前结构树
- 当前可用文件清单

如果重命名了文件，必须全量更新引用，不能留下旧路径。

## 7. 输出标准

你产出的内容必须满足以下标准：

- 能被 AI 直接执行或查询，不是泛泛说明文
- 同一职责只放在一个地方，不重复堆叠
- 命名清晰，能从文件名直接理解职责
- 引用关系完整，没有悬空路径
- 与仓库现有主链路保持一致，不引入平行体系

## 8. 最终交付格式

最终请直接完成修改，不要只给建议。

完成后只汇报：

1. 改了哪些文件
2. 这次新增/重构的职责定位是什么
3. 为了保持一致性，额外同步了哪些引用或命名
4. 是否还存在待补的真实数据缺口

不要输出空泛复盘，不要输出与本次任务无关的扩展建议。
```

## 适用场景

- 调整主 Skill
- 重构一个已有 reference
- 新增一个应用 variant 映射表
- 新增一个组件 reference
- 把混杂文档拆成 Skill + reference + 审计说明

## 使用建议

- 如果任务偏“协议编写”，直接使用整段 Prompt
- 如果任务偏“reference 数据整理”，保留 Prompt 主体，再把任务目标具体写成“新增/重构哪一份 reference”
- 如果任务涉及重命名，务必要求 Agent 同步更新 `README.md` 和所有引用路径
