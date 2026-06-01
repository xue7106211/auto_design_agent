# LC / NC 分栏布局适配

本文档由 `SKILL.md` 在判断 `layoutType = LC / NC` 后按需读取。
本文档不是独立 Skill，不直接触发执行；它只提供 LC / NC 分栏布局的骨架、栏位、组件放置和验收规则。

在目标 frame 内完成 LC（列表-内容）或 NC（导航-内容）分栏布局适配。LC：左栏放列表，右栏放详情内容。NC：左栏放侧边导航（底部 Tab 转换），右栏放内容。不新建并行页面，直接执行。

## 适用场景

- "把列表页和详情页重组为左右分栏"（LC）
- "底部 Tab 转侧边导航 + 内容分栏"（NC）
- "在这个 frame 里做折叠屏/Pad 分栏布局"
- "左列表右详情" / "左导航右内容"

## 前置条件

执行前需确认以下信息已就绪（由主 Skill 传入或自行获取）：

- 源设计稿节点 ID 和结构摘要
- 目标设备类型（Fold / Pad）
- 布局类型（LC 或 NC）
- 目标画布尺寸和栏宽（参考 `references/layouts/device-dimensions.md`）
- 目标 frame 已存在且有编辑权限
- NC 时：已识别源页面的底部 Tab 导航组件

## 核心原则

1. 先探查，后修改
2. 优先复用已有组件、变体、画布节点（详见 `references/common-rules.md`）
3. 能 clone 已落地节点时，不优先 create
4. 所有写入分步执行，不要一次性大脚本
5. 每一步写入后做截图校验和结构校验
6. 实例化失败时立即切换 clone 策略
7. 只保留目标设备当前视口语义，不保留移动端长滚动页语义
8. 只做局部修正，不整页推翻重做

## 栏宽与 Auto Layout 约束

LC / NC 适配时，栏宽约束必须贯穿到栏内第一层语义容器，不能只让外层 viewport 正确、内部继续保留旧固定宽度。

必须遵守：

1. `L / C / N` 栏 viewport 的宽度命中设备规格后，栏内第一层语义容器也必须同步收敛到该栏宽
2. 列表栏、标题栏、搜索栏、标签栏、正文栏等栏级主容器默认必须使用 Auto Layout
3. 上述栏级主容器在父栏内默认应使用 `Fill Container` 跟随父栏宽度；只有图标、缩略图、按钮等天然定宽元素才允许保持固定宽度或 Hug
4. 禁止把较宽场景下的 `440dp / 428dp / 353dp` 列表栏直接塞进较窄栏位后依赖 `clipsContent`、viewport 裁切或遮罩来”伪装适配完成”

Fold 内屏竖屏 `LC` 是本约束的重点场景：

1. `L` 栏目标宽度为 `282dp`
2. `L` 栏内部第一层列表容器必须跟随到 `282dp`
3. `NavigationBar`、搜索区、标签区、列表区根容器都必须跟随 `L` 栏宽度，而不是继续保留 `428dp`

## 强制工作流

### Phase A：搭目标骨架

读取布局规则：当前文档 `references/layouts/lc-nc-layout.md`
读取对齐与分栏排版规则：`references/layouts/device-dimensions.md` 中的「基本对齐方式」和「分栏布局排版方式」章节

执行：
- 清空目标 frame 子节点
- 设置目标 frame 尺寸（从 `references/layouts/device-dimensions.md` 获取）
- 如果目标设备为 Fold 内屏 Q18，设置目标 frame 四角圆角为 `50dp`
- 如果目标设备为 Pad，设置目标 frame 四角圆角为 `34dp`
- 建立全局状态栏（通过 `search_design_system` 搜索目标设备变体，或 clone 源页面状态栏）；状态栏高度按 `device-dimensions.md`（Fold 46dp / Pad 34dp）**显式 resize**，不沿用克隆时的自然高度
- 建立主内容区 frame（水平布局），`main.y = statusBarHeight`
- 建立左栏 frame（列表栏，宽度按当前文档定义）
- 建立右栏 frame（内容区，宽度按当前文档定义）
- 为视口容器设置 `clipsContent = true`
- 对 `L / C / N` 栏内部第一层语义容器立即建立 Auto Layout 约束：默认 `layoutMode` 正确、主内容容器使用 `Fill Container`
- **栏顶 6dp 间距**：`L / C` 栏内顶部对齐控件（NavigationBar / SearchBar / Chip / List / Detail 等）第一项从 `y = 6` 开始；详见 `device-dimensions.md` 「基本对齐方式」。`Sidebar_Component_*` 外壳例外，直接贴紧状态栏下沿（`y = 0`）
- **栏 padding**：按 `device-dimensions.md` 「断点间距」表由各栏宽度自动决定，与模式无关；栏内顶部对齐控件 `x = 栏padding`，宽度 = `栏W - 2 * 栏padding`
- **★ scenarioFlags 驱动的遮罩处理（必读）**：消费 SKILL Phase 4 step 7 输出的 `scenarioFlags` JSON，按以下条件分别处理：
  - `flags.LEditMode === true`（LC 最常见 trigger）→ 调用 `common-rules-mask-zorder.md §3.7a`：① L 栏从 main 提升至 frame 直接子级 ② 添加 `遮罩-编辑`（Cw × frameH，仅 C 列）③ z-order 按 `protocol.md §3` 编辑模式扩展模板（LC 行）
  - `flags.CEditMode` only → 不渲染任何 mask（§3.7a 末）
  - LC 模式不存在 `NCovering`（无 N 栏）；如 user 切换为 NC，参考 `nlc-layout.md` 的 scenarioFlags 处理逻辑

写入模式参考：`references/common-rules-instance.md` (§4 写入 优先级) + `references/common-rules-verify.md` (§6 校验).

> **★ protocol.md 函数调用强制（必读）**：本 layout reference 中的所有组件落位 / variant 切换 / resize / fill 写入 必须通过 `references/component-placement-protocol.md` 的标准函数：
> - 组件落位 / swap / resize → `placeStandardComponent({...})` (§2)
> - 任何 fill 写入 → `bindFill(node, tokenName, fallbackRGB, opacity?)` (§4)
> - frame 完成后强制验证 → `verifyChecklist(frame, spec, scenarioFlags)` (§6)
>
> 禁止 inline 临时序列。

完成后校验：截图 + 确认骨架尺寸正确。

### Phase B：填充左栏

组件处理按主链路已生成的 `componentTaskList` 执行；映射查询使用 `references/app-variant-map-{appName}.md`，组件定位、切换和验证使用 `figma-component-dictionary.md`。

**LC 模式（左栏为 L 栏）**：
- 放入源页面顶部模块（搜索栏、标题栏等）
- 替换或放入目标列表变体（优先 `search_design_system` 搜索，其次 clone）
- 按 `componentTaskList` 中的映射结果替换目标组件（如标题栏 → `NavigationBar` 目标变体）
- 删除不需要的移动端底部元素
- 让列表填充顶部模块以下的剩余视口
- `L` 栏是列表栏，不是导航栏。LC 模式下不得因为目标设备为 Fold 或候选组件名包含 `Fold_LC` 就放置 `Sidebar`
- Fold 内屏 `LC` 的左栏默认承载列表 / 列表骨架 / 源内容低密度占位；如果应用映射表目标列表骨架变体不可访问，应退化为无新增导航语义的空列表容器，并记录缺口，不得改用 `Sidebar`
- 只有当应用映射表对当前应用、`Fold内屏 + LC + resolvedUiElement` 明确返回 `Sidebar_*`，且说明该场景为侧边导航承载时，Fold LC 才允许出现 `Sidebar`
- 如果目标场景为 Fold 内屏竖屏 `LC`，必须显式检查 `L` 栏第一层容器、`NavigationBar`、搜索栏、标签栏、列表区根容器是否都已跟随到 `282dp`；不得保留更宽场景的固定宽度

**NC 模式（左栏为 N 栏）**：
- 搜索侧边导航栏组件（优先使用 `componentTaskList` 命中的标准实例或标准变体，其次按 `figma-component-dictionary.md` 的回退规则处理）
- 从源页面底部 Tab 提取导航项信息（图标、文字、数量），构建侧边导航
- 确保导航项数量和顺序与源页面底部 Tab 一致
- 设置当前选中态（与右栏内容对应的导航项）
- 删除源页面的悬浮底部导航栏

完成后校验：截图 + 确认左栏宽度和内容正确。

### Phase C：填充右栏

执行：
- 放入详情导航栏
- 建立正文视口 frame
- 放入正文内容（clone 源详情页内容区）
- 固定底部操作区（如 AI 输入区）
- 删除移动端状态栏、底部手势条、键盘弹层等不需要的元素
- 通过视口裁切表达当前可见区域，不保留完整长页

完成后校验：截图 + 确认右栏宽度和内容正确。

### Phase D：整体调整

- 检查左右栏间距 / 分割线
- 检查边距是否符合当前文档定义
- 确认全局状态栏只有一套
- 确认左栏选中项与右栏内容语义一致

完成后校验：全页截图 + 完整结构校验。

## 每步校验标准

### 截图校验

每次关键写入后调用 screenshot，检查：
- 是否有重叠
- 是否有裁切错误
- 是否有异常留白
- 左右栏宽度是否视觉正确
- 顶部状态栏是否只有一套

### 结构校验

每次关键写入后读取结构，检查：
- 目标 frame 尺寸
- Fold 内屏 Q18 目标 frame 圆角是否为 `50dp`
- Pad 目标 frame 圆角是否为 `34dp`
- 状态栏尺寸
- 左右栏尺寸
- 栏内第一层语义容器尺寸是否跟随栏宽，而不是保留旧固定宽度
- 栏级主容器是否使用了正确的 Auto Layout / `Fill Container` 语义
- 顶层节点数量和位置
- 关键节点是否位于正确层级

## 修正原则

结果不符合预期时：
1. 先修尺寸
2. 再修位置
3. 最后修文本或局部视觉

不要整页重做，只做局部修正。

## 输出要求

最终只输出：
- 已完成的结构变化
- 实际尺寸结果（左栏宽度、右栏宽度、总宽度）
- 是否满足验收项
- 是否存在妥协项（如图片占位、字体降级、clone 降级）

不要输出长篇方案说明或设计建议。

## 默认验收标准

- 目标页面尺寸精确匹配设备规格
- Fold 内屏 Q18 目标 frame 四角圆角精确为 `50dp`
- Pad 目标 frame 四角圆角精确为 `34dp`
- 左右栏宽度精确匹配当前文档定义
- 不能出现“viewport 是目标栏宽，但栏内第一层语义容器仍保留旧固定宽度”的情况
- Fold 内屏竖屏 `LC` 下，`L` 栏 viewport 为 `282dp` 时，`L` 栏根容器、`NavigationBar`、搜索栏、标签栏、列表区根容器都必须收敛到 `282dp` 语义
- 对需要随栏宽变化的栏级主容器，必须通过 Auto Layout / `Fill Container` 实现自适应，而不是依赖裁切隐藏超宽部分
- 顶部全局状态栏只有一套
- LC：左栏不保留移动端底部导航语义
- LC：Fold 内屏左栏不得出现 `Sidebar`，除非应用映射表显式命中 `Sidebar_*` 且 notes 指明侧边导航承载
- NC：导航栏项数和顺序与源页面底部 Tab 一致，导航选中态正确
- 右栏保留正文与操作区，但不保留键盘弹层
- 左栏选中项与右栏内容语义一致
- 整体视觉无明显裁切、重叠、异常空白

## 推荐映射方式

- 顶部区域：复用目标设备状态栏变体
- 左栏：源首页顶部模块 + 目标列表变体
- 右栏：源详情导航 + 源详情正文 + 底部操作区
- 正文区域：通过视口裁切表达当前可见区域，不保留完整长页
