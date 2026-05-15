---
name: app-settings-layout
description: 应用内「设置」页面的多端承载形态与组件骨架映射
kind: layout
scope: 全 App 通用（个别 App 可在其 app-variant-map-*.md override）
sourceOfTruth: Figma 分析帧 (OS4应用框架类型分析, node 234:34207) + 结构变化表 CSV
status: draft
---

# 应用设置 AppSettings 布局映射

## 适用范围

App 自身的「设置」页面（入口通常在更多菜单 `⋮` / 侧边栏底部 / 首页标题栏右上）。App 层若有差异，在各 `app-variant-map-*.md` 的 `AppSettings` 小节以同构表格只记录 **差异项**。

## 承载形态规则

| 设备 / 屏态 | 承载形态 | 进入动作 | 退出动作 |
|---|---|---|---|
| Phone 竖 / 横 | 全屏 push | 当前页 push 至 settings | 系统返回键 / 标题栏 返回 |
| Fold 外屏 竖 / 横 | 全屏 push | 同上 | 同上 |
| Fold 内屏（所有 screenMode） | **浮窗 overlay** | 当前页不变，居中弹出浮窗 | 浮窗右上 `×` / Esc / 点击遮罩外 |
| Pad 竖 / 横（所有 screenMode） | **浮窗 overlay** | 同 Fold 内屏 | 同 Fold 内屏 |

浮窗浮层规范（容器背景、遮罩 20%、固定宽度 546dp、高度 636dp 竖 / 80% 横 等）参见 `layouts/device-dimensions.md` 的「浮层规格 / 浮窗 FloatingWindow」。

## 页面骨架（slot 分解）

### 1depth — 一级设置页

| slot | Phone 竖/横 | Fold 外 竖/横 | Fold 内（全） / Pad（全） |
|---|---|---|---|
| 承载容器 | — （全屏 frame） | — （全屏 frame） | `FloatingWindow_ComponentSet_01` |
| 标题栏 | `NavigationBar_ComponentSet_02` （大标题 + 返回） | `NavigationBar_ComponentSet_05` （中标题 + 返回） | `NavigationBar_ComponentSet_09` （嵌于浮窗；小标题 + 右上 `×` 关闭） |
| 标题文案 | "设置" | "设置" | "设置" |
| 列表 | 通用列表（各 App 定义 `List_*Setting_*`） | 同左 | 同左（浮窗内部，居中） |
| 背景 | App 自身 frame 背景 | 同左 | **底层 App 画面维持不变**（NLC / LC / C 均照旧）＋ 浮窗遮罩 |

### 2depth — 二级设置页

| slot | Phone 竖/横 | Fold 外 竖/横 | Fold 内（全） / Pad（全） |
|---|---|---|---|
| 承载容器 | — （全屏 push 入栈） | — （全屏 push 入栈） | `FloatingWindow_ComponentSet_02` （**替换一级浮窗的内容**；浮窗 frame 位置/尺寸不重建） |
| 标题栏 | `NavigationBar_ComponentSet_02` （大标题 + 返回） | `NavigationBar_ComponentSet_05` （中标题 + 返回） | `NavigationBar_ComponentSet_08` （小标题 + 返回） |
| 列表 / 表单 | 由 App 自定（通常为列表/设置项详情） | 同左 | 同左 |
| 返回行为 | pop 回一级全屏 | pop 回一级全屏 | 浮窗内 pop（`_02` → `_01` 内容切回），浮窗 frame 保持 |

> 2depth 的 Fold 内 / Pad 具体 Figma 变体未经截图直接交叉验证；依 `device-dimensions.md` 对 `FloatingWindow_02` 的 "二级浮窗：带返回小标题 `NavigationBar_08`" 既定规范填写。

### 3depth 及以上

- Phone / Fold 外：继续使用 `NavigationBar_ComponentSet_02`（Phone） / `_05`（Fold 外） + 返回 push/pop
- Fold 内 / Pad：在 `FloatingWindow_02` 内部继续 push/pop；容器不变，标题栏维持 `NavigationBar_08`

## 交互规则

- **depth 切换**
  - Phone / Fold 外：整页 push/pop
  - Fold 内 / Pad：浮窗内容区 swap（`_01` ↔ `_02`）；浮窗 frame（位置、尺寸、遮罩）不重建
- **退出**
  - 全屏：标题栏左侧 返回 / 系统 back
  - 浮窗：右上 `×`（含于 `NavigationBar_09`） / Esc / 点击浮窗外遮罩
- **多级 stack**
  - Fold 内 / Pad 浮窗内部以 stack 管理 2depth 及以下层级；退出任意中间层逐级 pop
  - 一级浮窗一旦关闭，整个 settings stack 清空

## App 级 override

若某 App 对上述默认规则有差异（例：标题文案、是否使用抽屉替代浮窗、使用非默认列表变体 等），请在该 App 的 `app-variant-map-*.md` 的 `AppSettings` 小节以相同表结构只记录 **差异项**。

示例（虚构）：
```
#### 应用设置 AppSettings (override)

| slot | 差异 |
|---|---|
| 1depth 列表 | `List_NoteSetting_01` |
| 1depth 标题文案 | "笔记设置" |
```

## 交叉验证来源

- Figma 分析帧 `OS4应用框架类型分析` / `node 234:34207` 내 `设置-智能通话笔记禁用` / `设置-智能通话笔记未开启` 프레임들 (2026-05-14 확인)
- 1depth Phone / Fold外 / Fold内 / Pad 承载形태 및 标题栏 variant 이미지로 직접 확인 완료
- 2depth 는 이미지 미포함 — `device-dimensions.md` 의 규정으로 채움. 추후 스크린샷 확보 시 재검증.
