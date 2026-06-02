# csv-pipeline

> Stage 1A 映射管线 — 将 designer 的 26 列横向映射表转换为 AI 可 lookup 的纵向规范化 CSV.

映射工作相关资产 (输入/输出/脚本/进度/Node 配置) **全部在该文件夹内**.

## 快速开始

```bash
cd csv-pipeline
npm install      # 首次执行 1 次
npm run extract  # mapping-input/ → mapping-output/ 重新生成
npm run status   # 输出当前状态 + 下一步任务队列
```

## 文件夹结构

```
csv-pipeline/
├── README.md                          ← 该文件 (文件夹入口)
├── project-status-ko.md / .md         ← 当前进度 + 下一步任务队列 (单一权威)
├── package.json + tsconfig.json       ← Node/TS 配置
├── node_modules/
│
├── mapping-input/                     ← designer 上游 (禁止修改)
│   ├── 结构变化表-{App}.csv × 17    ← 各 app 团队独立文件
│   └── 控件变体清单.csv             ← 组件 designer (单一)
│
├── mapping-output/                    ← extract 产出物 (禁止手动编辑)
│   ├── SystemUIKIT-mapping.csv                   ← Tier 1 (SystemUIKIT 通用)
│   ├── app-{App}-mapping.csv × 18     ← Tier 2 (各 app)
│   ├── components.csv                 ← 变体元数据
│   ├── extract-report.md              ← 告警·统计·diff
│   └── .last-extract                  ← mtime sentinel
│
├── scripts/
│   ├── extract-mapping.ts             ← 主转换脚本
│   └── show-status.ts                 ← npm run status 实现
│
└── legacy/
    └── app-mapping-stage1a.csv        ← 用户手动编写的旧 CSV (参考用)
```

## 输入输出流

```
[designer 工作流]
  各 app 团队各自维护:
    结构变化表-{App}.csv (每个团队 1 个, 3-level 表头)
  组件 designer 维护:
    控件变体清单.csv
                                   │
                       保存至 mapping-input/ 文件夹
                                   │
                              npm run extract
                                   ▼
                       mapping-output/ 自动生成
                                   │
                                   │ csv-to-spec.ts (Stage 3A 预定)
                                   ▼
                              spec JSON
```

> **团队所有权分离**: 各 app 团队仅独立维护各自的 `结构变化表-{App}.csv`. 避免同一文件多人编辑导致的 git 冲突. `extract-mapping.ts` 自动 glob `结构变化表-*.csv` 后按 app 输出.

## 相关设计文档 (项目外部)

设计与决策事项位于上层 workspace 的 `Improvement_doc/`:

```
csv-migration/
├── Improvement_doc/                   ← 设计文档 (上层 workspace)
│   ├── workflow-reform-plan-ko.md / .md
│   ├── csv-authoring-guide-ko.md / .md
│   └── extract-mapping-design-ko.md / .md  ← 6 项决策锁定
└── auto_design_agent_backup/
    └── csv-pipeline/                  ← 该文件夹
```

`project-status-ko.md` 中以 `../../Improvement_doc/...` 形式引用.

## 决策事项 (变更时必须经用户确认)

参考 `../../Improvement_doc/extract-mapping-design-ko.md` §确定决策事项. 摘要:

1. ✅ app 命名 = EN-only + CamelCase (`Notes`, `FileManager`, `MiMover`, `Phone`)
2. ✅ uiElement 命名 = EN-only (`NavigationBar`)
3. ✅ screenMode `""` 含义 = "该 device 无 layout split"
4. ✅ 多组件 cell 自动推断 + 模糊时 WARN
5. ✅ 8-device 约定 (`Fold外竖` / `Fold外横` 包含)
6. ✅ extract-report 包含 legacy diff

补充:
- ✅ 从 CSV 中移除 setKey 列 → `references/app-variant-map-{app}.md §0.4` 为单一权威
