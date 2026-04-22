# NavigationBar 组件字典参考

本文档是 `figma-component-dictionary.md` 的组件族 reference，只服务 `componentFamily = NavigationBar`。

## 适用记录

命中以下 `variantId` 时加载本文档：

- `NavigationBar-ComponentSet_01`
- `NavigationBar-ComponentSet_02`
- `NavigationBar-ComponentSet_03`
- `NavigationBar-ComponentSet_04`
- `NavigationBar-ComponentSet_05`
- `NavigationBar-ComponentSet_06`
- `NavigationBar-ComponentSet_07`
- `NavigationBar-ComponentSet_08`
- `NavigationBar-ComponentSet_09`
- `NavigationBar-ComponentSet_10`
- `NavigationBar-ComponentSet_11`
- `Pad-TopBar_01`
- `Pad-TopBar_02`

## 核心结论

### 已验证可执行的组件集

当前已验证可执行的是 OS4 UI Kit 的：

- `componentFamily = NavigationBar`
- `componentName = NavigationBar-ComponentSet`
- `componentSetKey = a439b7cbc33b1c7e3b1611e4b6499d442b3ac7cc`

这套组件在当前分支基准里只允许使用以下属性体系：

- `VariantId`

### 当前禁止混用的旧路径

历史案例中还存在旧的已发布组件集路径：

- `componentSetKey = 818d2f110e386c48bcae60dfef60b5868d052cdd`
- 属性体系里出现过 `标题类型` / `交互状态` / `辅助标题` / `颜色模式`

这条旧路径与当前分支基准不是同一套组件。执行层不得把旧路径的字段体系复用到当前 `a439...` 组件集。

### 当前基准链接

从现在开始，`NavigationBar` 的定位和 reference 基准统一以这条最新链接为准：

`https://www.figma.com/design/7PVSm4yEbknNLFaqauI4EM/branch/9raLvnXeSlQR8jvaidtVQH/Xiaomi-Hyper-OS4-UI-Kit?node-id=123486-63329&t=cSx6F1HaxveQ6onI-11`

说明：

- 这条链接是当前权威锚点
- 本文中的字段体系和可执行记录已经切换为基于该新节点的已验证探查结果
- 若后续基于该节点重新探查出不同字段或值域，应以重新探查结果覆盖本文

## 定位与识别

### 参考锚点

| 类型 | 值 |
| --- | --- |
| 当前基准链接 | `https://www.figma.com/design/7PVSm4yEbknNLFaqauI4EM/branch/9raLvnXeSlQR8jvaidtVQH/Xiaomi-Hyper-OS4-UI-Kit?node-id=123486-63329&t=cSx6F1HaxveQ6onI-11` |
| 已验证探查文件 | `Xiaomi-Hyper-OS4-UI-Kit` 分支 `9raLvnXeSlQR8jvaidtVQH` |
| 已验证探查节点 | `123486:63329` |

### 已验证组件身份

| 字段 | 值 |
| --- | --- |
| `componentFamily` | `NavigationBar` |
| `componentName` | `NavigationBar-ComponentSet` |
| `componentSetKey` | `a439b7cbc33b1c7e3b1611e4b6499d442b3ac7cc` |
| `componentKey` | 每个变体都有独立 `componentKey`，按 `VariantId` 对应 |
| `mainComponent` | 当前节点是组件集本体；常见实例为 `VariantId=NavigationBar-ComponentSet_01` |

### 定位信息

| 目标组件 | `lookupBy` |
| --- | --- |
| `NavigationBar-ComponentSet` | 优先锚点: `node-id=123486:63329`; 组件集 key: `a439b7cbc33b1c7e3b1611e4b6499d442b3ac7cc` |
| `Pad-TopBar_01` | 同组件集内 `VariantId=Pad-TopBar_01` |
| `Pad-TopBar_02` | 同组件集内 `VariantId=Pad-TopBar_02` |

## 已验证字段与值域

### 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `VariantId` | 主变体属性 | `NavigationBar-ComponentSet_01` / `02` / `03` / `04` / `05` / `06` / `07` / `08` / `09` / `10` / `11` / `Pad-TopBar_01` / `Pad-TopBar_02` |

### 当前禁止使用的旧字段

以下字段属于旧组件集路径，不得写入当前基准：

- `标题类型`
- `交互状态`
- `辅助标题`
- `颜色模式`
- `样式`

## 执行记录

### 可执行记录

| variantId | nodeId | size | 观察到的语义 | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- | --- |
| `NavigationBar-ComponentSet_01` | `123486:63324` | `392x116` | 大标题，右 1 图标 | `bc9641d200a729a4ed05f876c1ca62bd84bd49ec` | `probed` |
| `NavigationBar-ComponentSet_02` | `123486:63328` | `392x116` | 大标题，左返回，右 1 图标 | `1ab4155ad192171e57f49eb4b6c1573815e99fcc` | `inferred` |
| `NavigationBar-ComponentSet_03` | `123486:63322` | `392x116` | 大标题，左关闭，右 1 图标 | `a8439a046c84b5411ede1b86e5e1399daa59ff2f` | `probed` |
| `NavigationBar-ComponentSet_04` | `123486:63317` | `392x56` | 中标题，右 2 图标 | `65096ed6f2c7cf047498d1706d929ca960b6005b` | `probed` |
| `NavigationBar-ComponentSet_05` | `123486:63326` | `392x56` | 中标题，左返回，右 1 图标 | `e9fc3e19cc8411bd599eb80be3aec5723f6f0b05` | `probed` |
| `NavigationBar-ComponentSet_06` | `123486:63321` | `392x56` | 中标题，左关闭，右 1 图标 | `35d756b66ab729e5df9c79e45cd5ce9e1b1d5e48` | `inferred` |
| `NavigationBar-ComponentSet_07` | `123486:63320` | `392x56` | 小标题居中，右 1 图标 | `f711d782e24f0b472eef810c80041313c87b6f44` | `probed` |
| `NavigationBar-ComponentSet_08` | `123486:63323` | `392x56` | 小标题居中，左返回，右 1 图标 | `c834bd7a44879705f3b6e4ab0e8535e8fd393933` | `inferred` |
| `NavigationBar-ComponentSet_09` | `123486:63325` | `392x56` | 小标题居中，左侧图标，右 1 图标 | `090ba6ac7705f006694c36de6252f882203b0ab2` | `inferred` |
| `NavigationBar-ComponentSet_10` | `123486:63318` | `392x56` | 工具栏化，无标题，左右图标 | `eb7f6e99b841da287fe3a894332f3737b130f258` | `inferred` |
| `NavigationBar-ComponentSet_11` | `123486:63319` | `392x56` | 工具栏化，左返回，右 1 图标 | `1a5420426d3b7436acb9d6a6f3aee73b4d895998` | `inferred` |
| `Pad-TopBar_01` | `123486:63316` | `1422x56` | Pad 顶栏，中间导航，右 1 图标 | `5bfd0435149e0351147e15f9dd7af236ad1ace56` | `probed` |
| `Pad-TopBar_02` | `123486:63327` | `1422x56` | Pad 顶栏，返回 + 中间导航 + 右 1 图标 | `96fc620e1786c39e56a00d56c284f55d47a724cc` | `inferred` |

### 统一执行写法

当前组件集所有已验证切换统一使用：

```js
instance.setProperties({
  VariantId: "NavigationBar-ComponentSet_07"
});
```

Pad 顶栏变体也不例外：

```js
instance.setProperties({
  VariantId: "Pad-TopBar_01"
});
```

## 执行规则

### 允许 `setProperties(...)` 的条件

仅当同时满足以下条件时允许执行：

1. 当前实例的 `componentName = NavigationBar-ComponentSet`
2. 当前实例的 `componentSetKey = a439b7cbc33b1c7e3b1611e4b6499d442b3ac7cc`
3. 当前实例真实字段中存在 `VariantId`
4. 目标值属于本文档“可执行记录”中的已验证值

### 当前分支基准下不再使用 `swapComponent(...)` 的情况

在当前组件集里，`Pad-TopBar_01` / `Pad-TopBar_02` 已经被并入同一个 `NavigationBar-ComponentSet`。

因此以下目标都应优先走 `setProperties({ VariantId: ... })`：

- `NavigationBar-ComponentSet_01` ~ `NavigationBar-ComponentSet_11`
- `Pad-TopBar_01`
- `Pad-TopBar_02`

## 已知陷阱

| 风险 | 处理方式 |
| --- | --- |
| 同名搜索结果可能落到旧已发布组件集 | 在当前分支文件内，优先锚点 `123486:63329` 和 `componentSetKey = a439...`，不要直接拿 `search_design_system` 返回的 `818d...` 当作同一组件 |
| 语义名不等于真实字段值 | 先读真实可选值，只允许写 `VariantId` |
| `Pad-TopBar` 已并入同组件集 | 当前基准下不要再把 `Pad-TopBar_01/02` 当独立组件 `swapComponent(...)` |

## 回退规则

默认回退顺序：

1. `componentSetKey`
2. Figma 锚点
3. clone 现有目标实例

特殊规则：

- 在当前基准文件内，不要用 `search_design_system` 返回的已发布 key 覆盖本地分支组件集 key
- 不允许通过回退把旧路径的 `标题类型` / `样式` 体系强行套到当前 `NavigationBar-ComponentSet`

## 最小验收标准

- 能正确识别 `NavigationBar-ComponentSet`
- 只对 `a439b7cbc33b1c7e3b1611e4b6499d442b3ac7cc` 使用 `VariantId` 体系
- `01` / `03` / `04` / `05` / `07` 稳定走 `setProperties(...)`
- `Pad-TopBar_01` / `Pad-TopBar_02` 稳定走 `setProperties(...)`
- 不再把 `Pad-TopBar` 误判成独立组件替换路径
