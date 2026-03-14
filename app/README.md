# DB Craft App

Language / 语言:

- [English](#english)
- [中文](#中文)

## English

This directory contains the DB Craft application source.

DB Craft is a local visual database modeling app for:

- designing tables and relationships
- generating and exporting SQL
- importing `CREATE TABLE` scripts
- using AI-assisted table generation
- handing model work off to Codex when needed

### Requirements

- Windows
- Node.js available in `PATH`

### Start The App

From this directory:

```powershell
node server.js
```

Default address:

```text
http://127.0.0.1:3000
```

### AI Build

You can use AI-assisted table generation in two ways:

1. Configure the API key in the UI:
   - `Settings -> AI Config`
2. Or use a server-side fallback environment variable:

```powershell
$env:OPENAI_API_KEY="your_api_key"
```

Notes:

- UI-saved AI config is preferred over the server fallback key
- The app supports model presets and compatible base URLs
- If no API key is configured, the app can fall back to `Send to Codex`

### Main Files

- `index.html`: main page shell
- `app.js`: main client logic and UI behavior
- `styles.css`: styling
- `server.js`: local service
- `help-manual.html`: in-app help page
- `src/core`: core model, SQL, storage, and file helpers
- `samples`: reusable demo model and SQL

### Sample Assets

- `samples/sample.dbmodel.json`
- `samples/sample.sql`

Use them for screenshots, demos, and first-run verification.

### License

This app is released under the MIT License. See [LICENSE](./LICENSE).

## 中文

这个目录保存的是 DB Craft 应用源码。

DB Craft 是一个本地化的可视化数据库建模应用，主要用于：

- 设计数据表和关系
- 生成与导出 SQL
- 导入 `CREATE TABLE` 脚本
- 使用 AI 辅助建表
- 在需要时把模型工作交给 Codex 继续处理

### 运行要求

- Windows
- 本机已安装 Node.js，并且在 `PATH` 中可用

### 启动方式

在当前目录执行：

```powershell
node server.js
```

默认访问地址：

```text
http://127.0.0.1:3000
```

### AI 建表

AI 建表有两种配置方式：

1. 在界面里配置 API Key：
   - `设置 -> AI配置`
2. 或者使用服务端环境变量作为兜底：

```powershell
$env:OPENAI_API_KEY="你的_API_Key"
```

说明：

- 优先使用界面中保存的 AI 配置
- 支持模型预设和兼容的 Base URL
- 如果没有可用的 API Key，可以退回到 `交给Codex`

### 主要文件说明

- `index.html`：主页面结构
- `app.js`：主要前端逻辑与交互实现
- `styles.css`：样式
- `server.js`：本地服务
- `help-manual.html`：内置帮助页
- `src/core`：模型、SQL、存储、文件处理等核心模块
- `samples`：示例模型与示例 SQL

### 示例资源

- `samples/sample.dbmodel.json`
- `samples/sample.sql`

这些文件适合用于截图、演示和首次验证。

### 开源协议

本应用采用 MIT License。详见 [LICENSE](./LICENSE)。
