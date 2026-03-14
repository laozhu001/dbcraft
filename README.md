# DB Craft

Language / 语言:

- [English](#english)
- [中文](#中文)

## English

DB Craft is a local visual database modeling workspace for designing tables and relationships, generating SQL, and preparing handoff-ready artifacts for Codex or downstream migration workflows.

It is built for people who want a faster path from idea to schema without bouncing between notes, spreadsheets, and raw SQL drafts.

### Highlights

- Visual schema design for MySQL 8, PostgreSQL 14, SQLite, and MSSQL
- Manual table creation, AI-assisted table drafting, and SQL-based table import
- Syntax checking and SQL export
- Project-aware model persistence
- Send-to-Codex handoff flow
- Marketplace-ready docs and release assets

### Installation

Current public package is designed for Windows and requires local Node.js.

Option 1: Run from source

```powershell
cd app
node server.js
```

Then open:

```text
http://127.0.0.1:3000
```

Option 2: Launch through the bundled PowerShell script

```powershell
.\skill\scripts\launch-dbdesigner.ps1
```

The launcher checks whether DB Craft is already running, starts it if needed, and opens the app in the browser.

### Repository Layout

Application source:

- [app](./app)
- [app/index.html](./app/index.html)
- [app/app.js](./app/app.js)
- [app/styles.css](./app/styles.css)
- [app/server.js](./app/server.js)
- [app/src/core](./app/src/core)
- [app/samples](./app/samples)

Skill definition:

- [skill](./skill)
- [skill/SKILL.md](./skill/SKILL.md)
- [skill/agents/openai.yaml](./skill/agents/openai.yaml)
- [skill/scripts/launch-dbdesigner.ps1](./skill/scripts/launch-dbdesigner.ps1)
- [skill/references](./skill/references)

Marketplace docs:

- [marketplace-docs](./marketplace-docs)
- [Marketplace Copy](./marketplace-docs/marketplace-copy.md)
- [Marketplace Submission Fields](./marketplace-docs/marketplace-submission-fields.md)
- [Install Prerequisites](./marketplace-docs/install-prerequisites.md)
- [Data Security](./marketplace-docs/data-security.md)
- [Marketplace Submission Checklist](./marketplace-docs/marketplace-submission-checklist.md)
- [Clean Environment Self-Test](./marketplace-docs/clean-environment-self-test.md)
- [Clean Environment Self-Test Report](./marketplace-docs/clean-environment-self-test-report.md)

Marketplace assets:

- [marketplace-assets/brand](./marketplace-assets/brand)
- [marketplace-assets/screenshots](./marketplace-assets/screenshots)
- [marketplace-assets/demo](./marketplace-assets/demo)

### Suggested Release Flow

1. Review the [submission checklist](./marketplace-docs/marketplace-submission-checklist.md)
2. Prepare marketplace form values from [marketplace-submission-fields.md](./marketplace-docs/marketplace-submission-fields.md)
3. Finalize the listing copy from [marketplace-copy.md](./marketplace-docs/marketplace-copy.md)
4. Choose icon and screenshots from [marketplace-assets](./marketplace-assets)
5. Run the clean-environment test one more time
6. Package and submit the release candidate

### License

This repository is distributed under the MIT License. See [LICENSE](./LICENSE).

## 中文

DB Craft 是一个本地化的可视化数据库建模工作台，用来设计数据表与关系、生成 SQL，并为 Codex 或后续迁移流程准备交接产物。

它适合那些不想在笔记、表格、零散 SQL 草稿之间来回切换，而是希望更快把需求落成模型的人。

### 功能特点

- 支持 MySQL 8、PostgreSQL 14、SQLite、MSSQL 的可视化建模
- 支持手工建表、AI 建表、基于 SQL 导入建表
- 支持语法检查与 SQL 导出
- 支持按工程持续保存模型
- 支持交给 Codex 继续处理
- 已整理好技能市场文档与发布素材

### 安装方法

当前公开版本面向 Windows，运行依赖为本地 Node.js。

方式一：从源码启动

```powershell
cd app
node server.js
```

然后在浏览器打开：

```text
http://127.0.0.1:3000
```

方式二：通过自带 PowerShell 启动脚本运行

```powershell
.\skill\scripts\launch-dbdesigner.ps1
```

这个脚本会先检查 DB Craft 是否已经启动；如果没启动，会自动拉起服务并打开页面。

### 仓库结构

应用源码：

- [app](./app)
- [app/index.html](./app/index.html)
- [app/app.js](./app/app.js)
- [app/styles.css](./app/styles.css)
- [app/server.js](./app/server.js)
- [app/src/core](./app/src/core)
- [app/samples](./app/samples)

技能定义：

- [skill](./skill)
- [skill/SKILL.md](./skill/SKILL.md)
- [skill/agents/openai.yaml](./skill/agents/openai.yaml)
- [skill/scripts/launch-dbdesigner.ps1](./skill/scripts/launch-dbdesigner.ps1)
- [skill/references](./skill/references)

市场文档：

- [marketplace-docs](./marketplace-docs)
- [市场提交字段（中文）](./marketplace-docs/marketplace-submission-fields.zh-CN.md)
- [Marketplace Submission Fields](./marketplace-docs/marketplace-submission-fields.md)
- [Marketplace Copy](./marketplace-docs/marketplace-copy.md)
- [Install Prerequisites](./marketplace-docs/install-prerequisites.md)
- [Data Security](./marketplace-docs/data-security.md)
- [Marketplace Submission Checklist](./marketplace-docs/marketplace-submission-checklist.md)

市场素材：

- [marketplace-assets/brand](./marketplace-assets/brand)
- [marketplace-assets/screenshots](./marketplace-assets/screenshots)
- [marketplace-assets/demo](./marketplace-assets/demo)

### 推荐发布流程

1. 先看 [marketplace-submission-checklist.md](./marketplace-docs/marketplace-submission-checklist.md)
2. 再用 [marketplace-submission-fields.zh-CN.md](./marketplace-docs/marketplace-submission-fields.zh-CN.md) 准备中文提交字段
3. 用 [marketplace-copy.md](./marketplace-docs/marketplace-copy.md) 完善对外文案
4. 从 [marketplace-assets](./marketplace-assets) 选择图标、截图和 demo 素材
5. 再跑一遍干净环境自测
6. 最后打包并提交发布

### 开源协议

本仓库采用 MIT License。详见 [LICENSE](./LICENSE)。
