# Settings_NavigationBar 组件字典参考

本文档是 `figma-component-dictionary.md` 的组件族 reference，只服务 `componentFamily = Settings_NavigationBar`（业务_设置 NavigationBar）。

## 适用记录

命中以下 `variantId` 时加载本文档：

- `NavigationBar_ComponentSet_02`（业务_设置 顶部 NavigationBar；**与通用 NavigationBar 共用 variant**）

## 重要说明

> **共通 variant 引用**：本 family 当前没有专属 variant，而是直接引用通用 NavigationBar family 的 `NavigationBar_ComponentSet_02`。共通 spec（属性键 / 已验证字段 / 执行规则 / nodeId / componentKey）请参见 `NavigationBar.md`。

## 内部 padding（按 CSV2）

| 变体 | padding |
| --- | --- |
| `NavigationBar_ComponentSet_02` | 左 12；右 12；标题左侧偏移：28 |

## 落位规则

- 用于「设置」应用顶栏
- 因为复用通用 variant，执行时按通用 NavigationBar 路径定位（`a439b7cbc33b1c7e3b1611e4b6499d442b3ac7cc`）
- family 注册仅用于业务语义区分，**不另外创建独立组件集**

## 缺口

- 标题左侧 28 偏移的具体实现（padding / margin / inner anchor）待 Figma 探查确认

> CSV2 同步日期：2026-05-19。
