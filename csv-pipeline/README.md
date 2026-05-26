# csv-pipeline

> Stage 1A 映射流水线 —— 把设计师维护的 26 列横向映射表转换为 AI 可 lookup 的纵向正规化 CSV。

映射工作相关全部资产（输入/输出/脚本/进度/Node 设置）**都在本文件夹内**。

## 快速上手

```bash
cd csv-pipeline
npm install         # 首次执行
npm run install-hook  # 安装 Git pre-commit hook（首次）
npm run extract     # mapping-input/ → mapping-output/ 重新生成
npm run status      # 当前状态 + 下一步队列
```

## 文件夹结构

```
csv-pipeline/
├── README.md                          ← 本文件（文件夹入口，中文）
├── README-ko.md                       ← 韩文镜像
├── project-status-ko.md / .md         ← 当前进度 + 下一步队列（单一权威）
├── package.json + tsconfig.json       ← Node/TS 设置
├── node_modules/
│
├── mapping-input/                     ← 设计师上游（按团队所有权分文件）
│   ├── 结构变化表-SystemUIKIT.csv     ← 系统组件团队
│   ├── 结构变化表-Notes.csv           ← 笔记团队（含待办 Tasks）
│   ├── 结构变化表-Phone.csv           ← 电话团队（含收起拨号键盘）
│   ├── 结构变化表-Contacts.csv        ← 联系人团队（含 Pad 端）
│   ├── 结构变化表-{App}.csv × N       ← 其他各 app 团队
│   └── 控件变体清单.csv               ← 组件设计师（单一）
│
├── mapping-output/                    ← extract 产物（不要手改）
│   ├── SystemUIKIT-mapping.csv                   ← Tier 1（SystemUIKIT 公共）
│   ├── app-{App}-mapping.csv × 18     ← Tier 2（按 app）
│   ├── components.csv                 ← 变体元数据
│   ├── extract-report.md              ← 警告·统计·diff
│   └── .last-extract                  ← mtime sentinel
│
├── scripts/
│   ├── extract-mapping.ts             ← 主转换脚本
│   ├── show-status.ts                 ← npm run status 实现
│   ├── pre-commit.sh                  ← Git hook 主体
│   └── install-hook.sh                ← Git hook 安装脚本
│
└── legacy/
    └── app-mapping-stage1a.csv        ← 用户手写的旧 CSV（参考用）
```

## 输入输出流

```
[设计师工作流]
  各团队各自维护:
    结构变化表-{App}.csv（每团队 1 份，3-level 表头）
  组件设计师维护:
    控件变体清单.csv
                                     │
                         保存到 mapping-input/ 文件夹
                                     │
                                npm run extract
                                     ▼
                         mapping-output/ 自动生成
                                     │
                                     │ csv-to-spec.ts（Stage 3A 计划）
                                     ▼
                                spec JSON
```

> **团队所有权分割**：每个 app 团队独立维护自己的 `结构变化表-{App}.csv`，避免多人编辑同一文件造成 git 冲突。`extract-mapping.ts` 自动 glob 读取所有 `结构变化表-*.csv` 文件并按 app 输出。

## 相关设计文档（项目外部）

设计与决议在上层工作区的 `Improvement_doc/`：

```
csv-migration/
├── Improvement_doc/                    ← 设计文档（上层）
│   ├── workflow-reform-plan-ko.md / .md
│   ├── csv-authoring-guide-ko.md / .md
│   └── extract-mapping-design-ko.md / .md  ← 6 项决议锁定
└── auto_design_agent_backup/
    └── csv-pipeline/                   ← 本文件夹
```

`project-status.md` 内通过 `../../Improvement_doc/...` 形式引用。

## 已确定决议（变更需用户确认）

详见 `../../Improvement_doc/extract-mapping-design.md` §已确定决议。摘要：

1. ✅ app 命名 = 仅 EN + CamelCase（`Notes`、`FileManager`、`MiMover`、`Phone`）
2. ✅ uiElement 命名 = 仅 EN（`NavigationBar`）
3. ✅ screenMode `""` 含义 = "该 device 无 layout split"
4. ✅ 多组件 cell 自动推断 + 歧义 WARN
5. ✅ 8-device 约定（含 `Fold外竖` / `Fold外横`）
6. ✅ extract-report 包含 legacy diff

补充：
- ✅ CSV 移除 setKey 列 → `references/app-variant-map-{app}.md §0.4` 为单一权威
