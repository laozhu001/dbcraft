const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const MAX_BODY_BYTES = 1024 * 1024;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(text);
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = String(value || "").trim().toLowerCase();
  return text === "true" || text === "1" || text === "yes" || text === "y" || text === "是";
}

function readOptionalHeaderString(headerValue) {
  if (Array.isArray(headerValue)) {
    return String(headerValue[0] || "").trim();
  }
  return String(headerValue || "").trim();
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    let receivedBytes = 0;
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      receivedBytes += Buffer.byteLength(chunk);
      if (receivedBytes > MAX_BODY_BYTES) {
        reject(new Error("请求体过大，最大 1MB。"));
        req.destroy();
        return;
      }
      raw += chunk;
    });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

function getOutputTextFromResponse(responseData) {
  if (typeof responseData?.output_text === "string" && responseData.output_text.trim()) {
    return responseData.output_text.trim();
  }

  const outputItems = Array.isArray(responseData?.output) ? responseData.output : [];
  const chunks = [];
  outputItems.forEach((item) => {
    const contentItems = Array.isArray(item?.content) ? item.content : [];
    contentItems.forEach((content) => {
      if (typeof content?.text === "string" && content.text.trim()) {
        chunks.push(content.text.trim());
      }
    });
  });
  return chunks.join("\n").trim();
}

function getOutputTextFromChatCompletions(responseData) {
  const choices = Array.isArray(responseData?.choices) ? responseData.choices : [];
  const first = choices[0];
  const content = first?.message?.content;
  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }
  if (Array.isArray(content)) {
    const chunks = content
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (typeof item?.text === "string") return item.text.trim();
        return "";
      })
      .filter(Boolean);
    return chunks.join("\n").trim();
  }
  return "";
}

function normalizeAiBaseUrl(rawBaseUrl) {
  const trimmed = String(rawBaseUrl || "").trim();
  if (!trimmed) {
    return {
      baseUrl: "https://api.openai.com/v1",
      provider: "openai",
    };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Base URL 无效，请填写完整地址，例如 https://api.moonshot.cn/v1");
  }

  let pathname = parsed.pathname.replace(/\/+$/, "");
  if (!pathname) pathname = "/v1";
  if (!/\/v\d+$/i.test(pathname)) {
    pathname = `${pathname}/v1`.replace(/\/{2,}/g, "/");
  }
  parsed.pathname = pathname;
  parsed.search = "";
  parsed.hash = "";

  const normalized = parsed.toString().replace(/\/+$/, "");
  const hostname = parsed.hostname.toLowerCase();
  const provider = hostname.includes("api.openai.com") ? "openai" : "compatible";
  return {
    baseUrl: normalized,
    provider,
  };
}

function extractJsonObject(rawText) {
  const text = String(rawText || "").trim();
  if (!text) {
    throw new Error("模型未返回有效文本。");
  }

  try {
    return JSON.parse(text);
  } catch {
    // Continue with fallback extraction.
  }

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch && fencedMatch[1]) {
    const fencedBody = fencedMatch[1].trim();
    try {
      return JSON.parse(fencedBody);
    } catch {
      // Continue with fallback extraction.
    }
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const body = text.slice(start, end + 1);
    try {
      return JSON.parse(body);
    } catch {
      // Continue to final failure.
    }
  }

  throw new Error("模型返回内容无法解析为JSON。");
}

function normalizeSchemaPayload(rawPayload) {
  const tables = Array.isArray(rawPayload?.tables) ? rawPayload.tables : [];
  const normalizedTables = tables
    .map((table, tableIndex) => {
      const name = String(table?.name || table?.code || `Table${tableIndex + 1}`).trim();
      const code = String(table?.code || name).trim();
      const comment = String(table?.comment || name).trim();
      const fields = Array.isArray(table?.fields) ? table.fields : [];
      const normalizedFields = fields
        .map((field, fieldIndex) => {
          const fieldName = String(field?.name || field?.code || `Field${fieldIndex + 1}`).trim();
          const fieldCode = String(field?.code || fieldName).trim();
          return {
            name: fieldName,
            code: fieldCode,
            dataType: String(field?.dataType || "").trim(),
            length: field?.length === null || field?.length === undefined ? "" : String(field.length),
            precision: field?.precision === null || field?.precision === undefined ? "" : String(field.precision),
            scale: field?.scale === null || field?.scale === undefined ? "" : String(field.scale),
            primaryKey: normalizeBoolean(field?.primaryKey),
            notNull: normalizeBoolean(field?.notNull),
            autoIncrement: normalizeBoolean(field?.autoIncrement),
            defaultValue: field?.defaultValue === null || field?.defaultValue === undefined ? "" : String(field.defaultValue),
            comment: String(field?.comment || fieldName).trim(),
          };
        })
        .filter((field) => field.name && field.code);

      return {
        name,
        code,
        comment,
        fields: normalizedFields,
      };
    })
    .filter((table) => table.name && table.code);

  if (normalizedTables.length === 0) {
    throw new Error("模型未返回可用的表定义。");
  }
  return {
    tables: normalizedTables,
    warning: typeof rawPayload?.warning === "string" ? rawPayload.warning : "",
  };
}

function buildSystemPrompt(dbType) {
  return [
    "你是数据库建模助手。",
    `目标数据库类型: ${dbType}。`,
    "根据用户输入的业务描述，输出建表草稿JSON。",
    "必须只输出JSON对象，不允许Markdown或额外解释。",
    "JSON结构必须为:",
    "{",
    '  "tables": [',
    "    {",
    '      "name": "表名称",',
    '      "code": "表code",',
    '      "comment": "表注释",',
    '      "fields": [',
    "        {",
    '          "name": "字段名称",',
    '          "code": "字段code",',
    '          "dataType": "数据类型",',
    '          "length": "长度字符串或空",',
    '          "precision": "精度字符串或空",',
    '          "scale": "小数位字符串或空",',
    '          "primaryKey": true/false,',
    '          "notNull": true/false,',
    '          "autoIncrement": true/false,',
    '          "defaultValue": "默认值字符串或空",',
    '          "comment": "字段注释"',
    "        }",
    "      ]",
    "    }",
    "  ],",
    '  "warning": "可选提示信息，字符串，可为空"',
    "}",
    "要求:",
    "1. 每张表至少一个字段。",
    "2. 字段注释默认等于字段名称。",
    "3. 仅输出JSON对象。",
  ].join("\n");
}

async function callOpenAiForSchema({ model, dbType, prompt, apiKeyOverride, baseUrlOverride }) {
  if (typeof fetch !== "function") {
    throw new Error("当前Node版本不支持fetch，请使用Node 18+。");
  }
  const headerKey = String(apiKeyOverride || "").trim();
  const apiKey = headerKey || String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("未配置API Key。请在设置中填写，或在服务端配置 OPENAI_API_KEY。");
  }
  const { baseUrl, provider } = normalizeAiBaseUrl(baseUrlOverride);

  const safeModel = String(model || "").trim() || "gpt-5-codex";
  const safeDbType = String(dbType || "").trim() || "MySQL 8";
  const safePrompt = String(prompt || "").trim();
  if (!safePrompt) {
    throw new Error("prompt不能为空。");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    const isOpenAiResponses = provider === "openai";
    const endpoint = isOpenAiResponses
      ? `${baseUrl}/responses`
      : `${baseUrl}/chat/completions`;
    const requestBody = isOpenAiResponses
      ? {
          model: safeModel,
          input: [
            {
              role: "system",
              content: [{ type: "input_text", text: buildSystemPrompt(safeDbType) }],
            },
            {
              role: "user",
              content: [{ type: "input_text", text: safePrompt }],
            },
          ],
        }
      : {
          model: safeModel,
          messages: [
            { role: "system", content: buildSystemPrompt(safeDbType) },
            { role: "user", content: safePrompt },
          ],
          temperature: 0.2,
        };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof payload?.error?.message === "string"
        ? payload.error.message
        : `AI API请求失败（HTTP ${response.status}）`;
      throw new Error(message);
    }

    const outputText = isOpenAiResponses
      ? getOutputTextFromResponse(payload)
      : getOutputTextFromChatCompletions(payload);
    const schema = extractJsonObject(outputText);
    return normalizeSchemaPayload(schema);
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw new Error("请求超时，请缩短描述或稍后重试。");
    }
    if (String(error?.message || "").includes("fetch failed")) {
      throw new Error(`网络请求失败，请检查 Base URL 和网络连通性。当前地址：${baseUrl}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function resolveStaticPath(urlPathname) {
  const cleaned = decodeURIComponent(urlPathname || "/");
  const normalized = cleaned === "/" ? "/index.html" : cleaned;
  const fullPath = path.normalize(path.join(ROOT_DIR, normalized));
  const relative = path.relative(ROOT_DIR, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  return fullPath;
}

function resolveWorkspaceDir(workspacePath) {
  const raw = String(workspacePath || "").trim();
  if (!raw) {
    throw new Error("workspacePath不能为空。");
  }
  const fullPath = path.resolve(raw);
  return fullPath;
}

function resolveWorkspaceFilePath(workspacePath, fileName) {
  const dirPath = resolveWorkspaceDir(workspacePath);
  const safeFileName = String(fileName || "").trim();
  if (!safeFileName) {
    throw new Error("fileName不能为空。");
  }
  if (safeFileName !== path.basename(safeFileName)) {
    throw new Error("fileName不能包含目录路径。");
  }
  const fullPath = path.resolve(dirPath, safeFileName);
  const relative = path.relative(dirPath, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("文件路径超出工作目录范围。");
  }
  return { dirPath, fullPath, fileName: safeFileName };
}

async function ensureWorkspaceDirExists(workspacePath) {
  const dirPath = resolveWorkspaceDir(workspacePath);
  const stat = await fs.stat(dirPath).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    throw new Error("工作目录不存在。");
  }
  return dirPath;
}

async function serveStaticFile(req, res) {
  const reqUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const filePath = resolveStaticPath(reqUrl.pathname);
  if (!filePath) {
    sendText(res, 403, "Forbidden");
    return;
  }
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      sendText(res, 404, "Not Found");
      return;
    }
    const body = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      sendText(res, 404, "Not Found");
      return;
    }
    sendText(res, 500, `Static file error: ${error?.message || error}`);
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "POST" && reqUrl.pathname === "/api/ai/schema-from-text") {
      const rawBody = await readRequestBody(req);
      let body = {};
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        sendJson(res, 400, { error: "请求体必须是JSON。" });
        return;
      }

      try {
        const schema = await callOpenAiForSchema({
          model: body.model,
          dbType: body.dbType,
          prompt: body.prompt,
          apiKeyOverride: readOptionalHeaderString(req.headers["x-openai-api-key"]),
          baseUrlOverride: readOptionalHeaderString(req.headers["x-openai-base-url"]),
        });
        sendJson(res, 200, schema);
      } catch (error) {
        sendJson(res, 400, { error: error?.message || String(error) });
      }
      return;
    }

    if (req.method === "POST" && reqUrl.pathname === "/api/workspace/list-models") {
      const rawBody = await readRequestBody(req);
      let body = {};
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        sendJson(res, 400, { error: "请求体必须是JSON。" });
        return;
      }

      try {
        const dirPath = await ensureWorkspaceDirExists(body.workspacePath);
        const names = await fs.readdir(dirPath);
        const entries = [];
        for (const fileName of names.filter((name) => name.toLowerCase().endsWith(".dbmodel.json")).sort()) {
          const { fullPath } = resolveWorkspaceFilePath(dirPath, fileName);
          let modelName = fileName.replace(/\.dbmodel\.json$/i, "").replace(/\.json$/i, "");
          let dbType = "";
          try {
            const text = await fs.readFile(fullPath, "utf8");
            const parsed = JSON.parse(text);
            const rawModel = parsed && typeof parsed === "object" && parsed.model ? parsed.model : parsed;
            if (typeof rawModel?.name === "string" && rawModel.name.trim()) {
              modelName = rawModel.name.trim();
            }
            if (typeof rawModel?.dbType === "string" && rawModel.dbType.trim()) {
              dbType = rawModel.dbType.trim();
            }
          } catch {
            // Keep filename fallback when metadata parse fails.
          }
          entries.push({ fileName, modelName, dbType });
        }
        sendJson(res, 200, { entries });
      } catch (error) {
        sendJson(res, 400, { error: error?.message || String(error) });
      }
      return;
    }

    if (req.method === "POST" && reqUrl.pathname === "/api/workspace/read-model") {
      const rawBody = await readRequestBody(req);
      let body = {};
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        sendJson(res, 400, { error: "请求体必须是JSON。" });
        return;
      }

      try {
        const { fullPath, fileName } = resolveWorkspaceFilePath(body.workspacePath, body.fileName);
        const text = await fs.readFile(fullPath, "utf8");
        const payload = JSON.parse(text);
        sendJson(res, 200, { ok: true, fileName, fullPath, payload });
      } catch (error) {
        sendJson(res, 400, { error: error?.message || String(error) });
      }
      return;
    }

    if (req.method === "POST" && reqUrl.pathname === "/api/workspace/write-model") {
      const rawBody = await readRequestBody(req);
      let body = {};
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        sendJson(res, 400, { error: "请求体必须是JSON。" });
        return;
      }

      try {
        const { fullPath, fileName } = resolveWorkspaceFilePath(body.workspacePath, body.fileName);
        await ensureWorkspaceDirExists(body.workspacePath);
        await fs.writeFile(fullPath, JSON.stringify(body.payload || {}, null, 2), "utf8");
        sendJson(res, 200, { ok: true, fileName, fullPath });
      } catch (error) {
        sendJson(res, 400, { error: error?.message || String(error) });
      }
      return;
    }

    if (req.method === "POST" && reqUrl.pathname === "/api/workspace/write-text") {
      const rawBody = await readRequestBody(req);
      let body = {};
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        sendJson(res, 400, { error: "请求体必须是JSON。" });
        return;
      }

      try {
        const { fullPath, fileName } = resolveWorkspaceFilePath(body.workspacePath, body.fileName);
        await ensureWorkspaceDirExists(body.workspacePath);
        await fs.writeFile(fullPath, String(body.text || ""), "utf8");
        sendJson(res, 200, { ok: true, fileName, fullPath });
      } catch (error) {
        sendJson(res, 400, { error: error?.message || String(error) });
      }
      return;
    }

    if (req.method === "GET" && reqUrl.pathname === "/api/health") {
      sendJson(res, 200, {
        ok: true,
        hasOpenAiKey: Boolean(String(process.env.OPENAI_API_KEY || "").trim()),
      });
      return;
    }

    await serveStaticFile(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error?.message || String(error) });
  }
});

server.on("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    console.error(`[DBDesigner] Port ${PORT} is already in use on ${HOST}. Reuse the existing DB Craft service instead of starting another one.`);
    return;
  }
  console.error(`[DBDesigner] Server failed: ${error?.message || error}`);
});

server.listen(PORT, HOST, () => {
  console.log(`[DBDesigner] http://${HOST}:${PORT}`);
});
