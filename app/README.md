# DB Craft

Licensed under the MIT License. See [LICENSE](LICENSE).

## 接入 OpenAI（AI建表）

### 1. 配置环境变量
PowerShell:

```powershell
$env:OPENAI_API_KEY="你的OpenAI_API_Key"
```

### 2. 启动本地服务

```powershell
node server.js
```

默认地址：`http://127.0.0.1:3000`

### 3. 在页面中使用

1. 打开模型。
2. 可先在 `设置 -> AI配置`（快捷键 `Alt+K`）里保存默认模型名和 API Key。
3. 菜单 `模型 -> AI建表`（快捷键 `Alt+L`）。
4. 输入模型名称（默认 `gpt-5-codex`）和业务描述。
5. 点击“生成并建表”。

说明：
- API Key 支持两种来源：
  - 前端 `设置 -> AI配置` 保存（优先使用）
  - 服务端环境变量 `OPENAI_API_KEY`（兜底）
- 如果模型名不可用，页面会提示 OpenAI 返回的错误信息。
