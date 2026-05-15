# SearchBar 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = SearchBar`。

## 适用记录

命中以下 `variantId` 时加载本文档：

- `SearchBar_ComponentSet_00`
- `SearchBar_ComponentSet_01`
- `SearchBar_ComponentSet_02`
- `SearchBar_ComponentSet_03`（待入库）
- `SearchBar_ComponentSet_04`（待入库）
- `SearchBar_ComponentSet_05`（待入库）

## 核心结论

### 已验证可执行的组件集

- `componentFamily = SearchBar`
- `componentName = SearchBar_ComponentSet`
- `componentSetId = 536:15107`
- `componentSetKey = 2316a63eb824ab38f388c3127101e535b7668398`
- 主属性体系：`状态`（VariantId）

## 定位与识别

### 已验证组件身份

| 字段 | 值 |
| --- | --- |
| `componentFamily` | `SearchBar` |
| `componentName` | `SearchBar_ComponentSet` |
| `componentSetId` | `536:15107` |
| `componentSetKey` | `2316a63eb824ab38f388c3127101e535b7668398` |
| 主属性键 | `状态` |

## 已验证字段与值域

### 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `状态` | 主变体 | `SearchBar_ComponentSet_00` / `_01` / `_02` / `激活-未输入` |

### 当前组件集未暴露的旧变体

以下 `variantId` 在 CSV1 / app-variant-map 中出现，但当前组件集 `536:15107` 内**未落地**，命中时不能 `setProperties(...)`，需上游映射表回退或记录为 `blocked`：

- `SearchBar_ComponentSet_03`（sug 词 直）
- `SearchBar_ComponentSet_04`（Pad 顶部导航 / 激活）
- `SearchBar_ComponentSet_05`（NLC 默认，需 check）

## 执行记录

### 可执行记录（本地组件集 `536:15107`）

| variantId | nodeId | size | componentKey | sourceOfTruth |
| --- | --- | --- | --- | --- |
| `SearchBar_ComponentSet_00` | `536:15112` | `392x56` | `457b998555ffaad53586372859d4d4875ca18f8a` | `probed` |
| `SearchBar_ComponentSet_01` | `536:15113` | `392x56` | `af7a90f4b6f4bff940783b53356e9653ddeb7afd` | `probed` |
| `SearchBar_ComponentSet_02` | `536:15108` | `392x56` | `6d43f93d77f8cae484a6558f29930d095e354fb2` | `probed` |
| `激活-未输入` | `536:15126` | `392x56` | `3b641bd8d1a82a18770e036221a4031553baaef8` | `probed` |

### 内部 padding（按变体清单 CSV2）

| 变体 | 内置左 / 右 padding |
| --- | --- |
| `_00` / `_01` / `_02` / `_05` / `激活-未输入` | 左 12，右 12 |
| `_03`（sug 词 直） | 左 12，右 12 |
| `_04`（Pad 顶部导航 / 激活态） | **左 8，右 8** |

合算规则：见 `common-rules.md §3.4a`。SearchBar 属于「内容容器」，按所在栏 spec padding 与 internal pl 合算决定 outer。

### 统一执行写法

```js
instance.setProperties({
  状态: "SearchBar_ComponentSet_02"
});
```

## 已知陷阱

| 风险 | 处理方式 |
| --- | --- |
| `_05` 是 NLC 默认 spec，但本地组件集未落地 | 临时降级至 `_02`，记录为 `fallback`；library 补齐后通过 `swapComponent` 升级 |
| `_04` 在 `TopBar_03` 复合体内出现 | TopBar_03 是 NavigationBar 组件集的复合变体，不要从 SearchBar 集独立 swap |

## 缺口（待落地）

- 本地组件集 `_03` / `_04` / `_05` 缺失，需设计系统补齐后回填本文档。
- `SearchBar_ComponentSet_05` 的内部结构（占位提示文本、icon 位置）未实测。
