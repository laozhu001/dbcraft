# DB Craft 市场提交字段

这份文档把现有发布资料整理成一套适合中文提交页面直接填写的字段口径。

## 基本信息

- 产品名称：`DB Craft`
- 技能名称 / slug：`dbcraft`
- 版本标识：`V1.0`
- 开源协议：`MIT`

## 一句话标语

`可视化数据库建模、SQL 导出，以及面向 Codex 的交接能力。`

## 简短描述

`以可视化方式设计数据库表结构，校验模型，保存可复用模型文件，并为 MySQL、PostgreSQL、SQLite 和 MSSQL 导出 SQL。`

## 完整描述

`DB Craft 是一个本地化的可视化数据库建模工作台，适合那些不想只靠手写表结构说明、而是希望更快把需求转成模型与 SQL 的用户。它支持创建和编辑数据表、配置表关系、导入 CREATE TABLE 脚本、通过 AI 生成初稿、校验结构，并在模型完成后导出 SQL。`

`当团队需要在实现前先梳理数据库结构、持续演进表模型、把模型文件与 SQL 产物一起保存在工程里，或者把结构化结果继续交给 Codex 与后续迁移流程时，DB Craft 会非常顺手。`

## 核心卖点

- 用可视化方式替代表结构笔记和零散草稿
- 支持 MySQL 8、PostgreSQL 14、SQLite、MSSQL
- 支持自然语言 AI 建表
- 支持从 CREATE TABLE SQL 导入
- 支持保存 `.dbmodel.json` 可复用模型
- 支持导出 SQL 供后续开发流程使用
- 支持交给 Codex 继续处理

## 适用人群

- 设计新表结构的后端开发
- 需要同时关注前后端结构的一体化开发者
- 在实现前审核表关系和字段设计的技术负责人
- 更习惯先画图再落库的产品型或分析型技术用户

## 平台与运行方式

- 支持系统：`Windows`
- 运行依赖：`Node.js`
- 启动方式：本地启动服务，并在浏览器中打开

## 数据与安全说明摘要

- DB Craft 是本地工具，不是云端 SaaS
- 模型文件、SQL 导出文件、Codex 交接文件都写入当前本地工作区
- AI 建表可能会把提示词发送到用户自己配置的模型服务商
- API Key 由用户自行配置和管理
- 对外表述时，不应暗示“静默云同步”或“自动执行真实数据库变更”

## 定位边界

- 将 DB Craft 表述为“设计到 SQL”的工具
- 不要将其表述为数据库执行器或迁移执行器
- 将 Codex 交接能力描述为可选延伸流程，而不是唯一使用方式
- 在涉及隐私和存储时，强调其本地优先特性

## 提交素材对应关系

- 图标：
  - `marketplace-assets/brand/dbcraft-icon-1024.png`
- 主截图：
  - `marketplace-assets/screenshots/01-main-workspace.png`
  - `marketplace-assets/screenshots/02-ai-build.png`
  - `marketplace-assets/screenshots/03-sync-sql-preview.png`
- 补充截图：
  - `marketplace-assets/screenshots/04-send-to-codex.png`
  - `marketplace-assets/screenshots/05-help-or-multilanguage.png`

## 建议分类

- Developer Tools
- Database
- Productivity

## 建议关键词

- 数据库设计
- 表结构建模
- SQL 导出
- ERD
- AI 建表
- Codex 交接

## 提交前建议再确认

1. 重新检查 `marketplace-submission-checklist.md`
2. 再跑一遍干净环境自测
3. 确认截图中没有暴露私人本地信息
4. 确认图标、描述、界面品牌保持一致
