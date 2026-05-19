# SegmentedControls 组件字典参考

本文档是 `figma-component-dictionary` 的组件族 reference，只服务 `componentFamily = SegmentedControls`（分段按钮）。

## 适用记录

- `SegmentedControls_ComponentSet_00`（待入库）
- `SegmentedControls_ComponentSet_01`（默认 / 手机 / Fold）
- `SegmentedControls_ComponentSet_02`（Pad）
- `SegmentedControls_01`（容器内嵌套；与 `NavigationBar_ComponentSet_13` 联用）

## 真实属性键

| 字段 | 说明 | 已验证值 |
| --- | --- | --- |
| `variantid` | 主变体 | `_00` / `_01` / `_02` |

## 内部 padding（按 CSV2）

| 变体 | padding |
| --- | --- |
| `_01`（默认） | 左 12；右 12 |
| `_02`（Pad） | 最小 左 16；右 16 |
| `SegmentedControls_01`（容器嵌套） | 左 16；右 16 |

## 落位规则

- 通常嵌入浮窗 / 抽屉内部（如 录音详情 「总结 / 原文」 切换）
- 不作为独立浮层
- 容器内嵌时（如 `NavigationBar_ComponentSet_13`）按容器规则 hug

## 缺口

- 各 variant 的 `nodeId` / `componentKey` / `componentSetId` 待补

> CSV1 / CSV2 同步日期：2026-05-18。
