# NoticeBar 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = NoticeBar`（信息提示栏）。

## 适用记录

- `NoticeBar_ComponentSet_01`

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `_01` |

## 内部 padding（按 CSV2）

- 左 12；右 12

属于「内容容器」，按所在栏 spec 与 `internal pl = 12` 合算决定 outer。详见 `common-rules.md §3.4a`。

## 落位规则

- 通常落于 NavigationBar 下方 / List 上方（栏内通知条）
- 内容承载文字 + 可选图标 + 关闭按钮

## 缺口

- `nodeId` / `componentKey` / `componentSetId` 待补

> CSV1 / CSV2 同步日期：2026-05-18。
