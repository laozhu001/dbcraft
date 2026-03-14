const {
  DEFAULT_DB_TYPE,
  INSPECTOR_TABS,
  buildRelationCardinalityOptions,
  escapeHtml,
  formatFieldFlags,
  formatFieldType,
  getFieldTypesByDbType,
  isManyToMany,
  normalizeRelationCardinality,
  uid,
  createDefaultField,
  normalizeFieldTemplate,
  mapFieldTypeToDbType,
  convertTemplateFieldsToDbType,
  createDefaultIndex,
  createDefaultTable,
  createModel,
  ensureModelRuntimeData,
  ensureTableRuntimeData,
  relationExists,
  syncPrimaryClusteredIndex,
  readState,
  persistState,
  getTableScript,
  supportsWorkspaceFS,
  readWorkspaceDirectoryHandle,
  saveWorkspaceDirectoryHandle,
  saveWorkspaceInfo,
  readWorkspaceInfo,
  ensureDirectoryPermission,
  pickWorkspaceDirectory,
  listWorkspaceModelFiles,
  writeModelFile,
  readModelFile,
  deleteModelFile,
} = window.DBDesignerCore;
const state = readState();
if (typeof state.selectedTableId !== "string") {
  state.selectedTableId = null;
}
if (typeof state.selectedRelationId !== "string") {
  state.selectedRelationId = null;
}
if (!Array.isArray(state.globalTableTemplate) || state.globalTableTemplate.length === 0) {
  state.globalTableTemplate = [normalizeFieldTemplate({}, 1, DEFAULT_DB_TYPE)];
} else {
  state.globalTableTemplate = state.globalTableTemplate.map((field, index) =>
    normalizeFieldTemplate(field, index + 1, DEFAULT_DB_TYPE),
  );
}

const modelForm = document.getElementById("modelForm");
const modelNameInput = document.getElementById("modelNameInput");
const dbTypeSelect = document.getElementById("dbTypeSelect");
const modelList = document.getElementById("modelList");
const activeModelTitle = document.getElementById("activeModelTitle");
const activeModelMeta = document.getElementById("activeModelMeta");
const modelFileMeta = document.getElementById("modelFileMeta");
const workspaceMeta = document.getElementById("workspaceMeta");
const workspacePathMeta = document.getElementById("workspacePathMeta");
const topWorkspaceBtn = document.getElementById("topWorkspaceBtn");
const workspaceGuideBar = document.getElementById("workspaceGuideBar");
const workspaceGuideTitle = document.getElementById("workspaceGuideTitle");
const workspaceGuideText = document.getElementById("workspaceGuideText");
const workspaceGuideDismissBtn = document.getElementById("workspaceGuideDismissBtn");
const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
const setWorkspaceBtn = document.getElementById("setWorkspaceBtn");
const setWorkspacePathBtn = document.getElementById("setWorkspacePathBtn");
const handoffCodexBtn = document.getElementById("handoffCodexBtn");
const openModelBtn = document.getElementById("openModelBtn");
const saveModelBtn = document.getElementById("saveModelBtn");
const syncModelBtn = document.getElementById("syncModelBtn");
const exportSqlBtn = document.getElementById("exportSqlBtn");
const saveAsModelBtn = document.getElementById("saveAsModelBtn");
const closeModelBtn = document.getElementById("closeModelBtn");
const deleteModelBtn = document.getElementById("deleteModelBtn");
const templateTableBtn = document.getElementById("templateTableBtn");
const addTableButton = document.getElementById("addTableButton");
const workspace = document.getElementById("workspace");
const workspaceCanvas = document.getElementById("workspaceCanvas");
const workspaceContent = document.getElementById("workspaceContent");
const tableLayer = document.getElementById("tableLayer");
const relationLayer = document.getElementById("relationLayer");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomResetBtn = document.getElementById("zoomResetBtn");
const zoomFitBtn = document.getElementById("zoomFitBtn");
const zoomLevel = document.getElementById("zoomLevel");
const inspector = document.getElementById("inspector");
const menuBar = document.getElementById("menuBar");
const toolbarQuickActions = document.getElementById("toolbarQuickActions");
const sidebarResizer = document.getElementById("sidebarResizer");
const inspectorResizer = document.getElementById("inspectorResizer");
const toggleInspectorBtn = document.getElementById("toggleInspectorBtn");
const topToggleBtn = document.getElementById("topToggleBtn");
const workspaceShell = document.querySelector(".workspace-shell");
const appShell = document.querySelector(".app");
const languageSelect = document.getElementById("languageSelect");
const brandSubtitle = document.getElementById("brandSubtitle");
const sidebarTitle = document.getElementById("sidebarTitle");
const sidebarDesc = document.getElementById("sidebarDesc");
const createModelBtn = document.getElementById("createModelBtn");

const SIDEBAR_COLLAPSED_KEY = "dbdesigner.ui.sidebarCollapsed";
const SIDEBAR_WIDTH_KEY = "dbdesigner.ui.sidebarWidth";
const SIDEBAR_DEFAULT_WIDTH = 280;
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 560;
const SIDEBAR_HIDE_THRESHOLD = 100;
const INSPECTOR_COLLAPSED_KEY = "dbdesigner.ui.inspectorCollapsed";
const INSPECTOR_WIDTH_KEY = "dbdesigner.ui.inspectorWidth";
const INSPECTOR_DEFAULT_WIDTH = 420;
const INSPECTOR_MIN_WIDTH = 220;
const INSPECTOR_MAX_WIDTH = 720;
const INSPECTOR_HIDE_THRESHOLD = 100;
const TOP_COLLAPSED_KEY = "dbdesigner.ui.topCollapsed";
const EDIT_HISTORY_LIMIT = 120;

let drag = null;
let relationDraft = null;
let relationDropTargetId = null;
let activeInspectorTab = "basic";
let workspaceZoom = 1;
let workspaceViewX = 0;
let workspaceViewY = 0;
const WORKSPACE_BASE_WIDTH = 1800;
const WORKSPACE_BASE_HEIGHT = 1200;
const WORKSPACE_MIN_ZOOM = 0.1;
const WORKSPACE_MAX_ZOOM = 2.5;
let panState = {
  active: false,
  startX: 0,
  startY: 0,
  startViewX: 0,
  startViewY: 0,
};
let inspectorResizeState = {
  resizing: false,
  startX: 0,
  startWidth: 0,
};
let sidebarResizeState = {
  resizing: false,
  startX: 0,
  startWidth: SIDEBAR_DEFAULT_WIDTH,
};
let workspaceDirectoryHandle = null;
let workspaceRememberedName = "";
let workspacePathHint = "";
let workspacePermissionState = "none";
let sidebarLastWidth = SIDEBAR_DEFAULT_WIDTH;
let inspectorLastWidth = INSPECTOR_DEFAULT_WIDTH;
let editHistoryUndo = [];
let editHistoryRedo = [];
let editHistoryLastSnapshot = "";
let editHistoryApplying = false;
let entityClipboard = null;
let fieldClipboard = null;
const selectedFieldIdsByTable = new Map();
let modelAutoSaveTimer = null;
let modelAutoSavePendingId = null;
let modelAutoSaveRunning = false;
let modelAutoRefreshTimer = null;
let modelAutoRefreshRunning = false;
const AI_MODEL_STORAGE_KEY = "dbdesigner.ai.model";
const AI_MODEL_DEFAULT = "gpt-5-codex";
const AI_API_KEY_STORAGE_KEY = "dbdesigner.ai.apiKey";
const LANGUAGE_STORAGE_KEY = "dbdesigner.ui.language";
const TABLE_CARD_VIEW_MODE_KEY = "dbdesigner.ui.tableCardViewMode";
const WORKSPACE_GUIDE_DISMISSED_PREFIX = "dbdesigner.workspaceGuideDismissed";
const DEFAULT_LANGUAGE = "en-US";
const SUPPORTED_LANGUAGES = ["zh-CN", "en-US", "fr-FR"];
const MODEL_AUTO_SAVE_DELAY_MS = 1200;
const MODEL_AUTO_REFRESH_INTERVAL_MS = 2000;
const CODEX_HANDOFF_FILE_NAME = "dbcraft-codex-handoff.md";
const AI_BASE_URL_STORAGE_KEY = "dbdesigner.ai.baseUrl";
const AI_MODEL_PRESET_CUSTOM = "__custom__";
const AI_MODEL_PRESETS = [
  { key: "openai-gpt-5-2", label: "OpenAI · GPT-5.2 · 复杂建模推荐", model: "gpt-5.2", baseUrl: "" },
  { key: "openai-gpt-5", label: "OpenAI · GPT-5 · 稳定通用", model: "gpt-5", baseUrl: "" },
  { key: "openai-gpt-4-1", label: "OpenAI · GPT-4.1 · 成本更稳", model: "gpt-4.1", baseUrl: "" },
  { key: "moonshot-v1-32k", label: "Kimi · moonshot-v1-32k · 结构化提取推荐", model: "moonshot-v1-32k", baseUrl: "https://api.moonshot.cn/v1" },
  { key: "kimi-latest", label: "Kimi · kimi-latest · 聊天体验", model: "kimi-latest", baseUrl: "https://api.moonshot.cn/v1" },
  { key: "kimi-thinking-preview", label: "Kimi · kimi-thinking-preview · 推理型", model: "kimi-thinking-preview", baseUrl: "https://api.moonshot.cn/v1" },
  { key: "deepseek-chat", label: "DeepSeek · deepseek-chat · 非思考", model: "deepseek-chat", baseUrl: "https://api.deepseek.com/v1" },
  { key: "deepseek-reasoner", label: "DeepSeek · deepseek-reasoner · 思考型", model: "deepseek-reasoner", baseUrl: "https://api.deepseek.com/v1" },
  { key: "qwen-max-latest", label: "Qwen · qwen-max-latest · 高质量", model: "qwen-max-latest", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
  { key: "qwen-plus", label: "Qwen · qwen-plus · 均衡", model: "qwen-plus", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
];

const I18N = {
  "zh-CN": {
    "brand.subtitle": "数据库设计工具",
    "ui.language": "语言",
    "menu.main": "主菜单",
    "menu.file": "文件",
    "menu.edit": "编辑",
    "menu.model": "模型",
    "menu.settings": "设置",
    "menu.help": "帮助",
    "action.file-new-mysql8": "新建（MySQL 8）",
    "action.file-new-postgresql14": "新建（PostgreSQL 14）",
    "action.file-new-sqlite": "新建（SQLite）",
    "action.file-new-mssql": "新建（MSSQL）",
    "action.file-open": "打开",
    "action.file-save": "保存",
    "action.file-sync-workspace": "保存并同步到当前工程",
    "action.file-connect-sync": "连接工程并同步",
    "action.file-save-as": "另存为",
    "action.file-close": "关闭",
    "action.edit-undo": "撤销操作",
    "action.edit-redo": "恢复",
    "action.edit-clear-all": "全部清除",
    "action.edit-cut": "剪切",
    "action.edit-copy": "复制",
    "action.edit-paste": "粘贴",
    "action.edit-clone": "克隆",
    "action.edit-delete": "删除",
    "action.model-template": "模板表",
    "action.model-delete": "删除模型",
    "action.model-add-table": "增加表",
    "action.model-ai-table": "AI建表",
    "action.model-script-table": "脚本建表",
    "action.model-syntax-check": "语法检查",
    "action.model-auto-layout": "自动排列表",
    "action.model-fit-view": "适应窗口",
    "action.model-export-image": "保存为图片",
    "action.model-export-sql": "导出SQL",
    "action.model-table": "表",
    "action.settings-workspace": "设置工程目录",
    "action.settings-workspace-switch": "切换工程目录",
    "action.settings-workspace-connect": "连接工程目录",
    "action.settings-workspace-path": "设置工程路径",
    "action.settings-table-view": "表显示模式",
    "action.settings-ai-config": "AI配置",
    "action.help-codex": "交给Codex",
    "action.help-help": "帮助",
    "action.help-about": "关于",
    "toolbar.addTable": "加表",
    "toolbar.template": "模板",
    "toolbar.export": "导出",
    "toolbar.deleteModel": "删模",
    "toolbar.workspace": "目录",
    "toolbar.project": "工程",
    "toolbar.sync": "同步",
    "toolbar.connectSync": "连接并同步",
    "toolbar.pathHint": "路径",
    "toolbar.fit": "适配",
    "toolbar.layoutGroup": "布局",
    "sidebar.title": "模型管理",
    "sidebar.desc": "支持 MySQL 8 / PostgreSQL 14 / SQLite / MSSQL",
    "modelForm.placeholder": "模型名称",
    "modelForm.create": "新建模型",
    "workspace.label": "当前工程",
    "workspace.pathHint": "工程路径",
    "workspace.projectPath": "工程路径",
    "workspace.unset": "未设置",
    "workspace.unfilled": "未填写",
    "workspace.pending": "待连接",
    "workspace.disconnected": "未连接",
    "meta.noModel": "未选择模型",
    "meta.tables": "表",
    "meta.relations": "关系",
    "meta.file": "文件",
    "meta.modelFilePath": "当前模型文件",
    "meta.modelFileUnsaved": "未保存到工程",
    "meta.modelFileWillSave": "保存后将写入",
    "meta.fileUnsaved": "未保存",
    "meta.status": "状态",
    "meta.statusSaved": "已保存",
    "meta.statusUnsaved": "未保存修改",
    "modelList.tablesWord": "表",
    "modelList.close": "关闭",
    "modelList.delete": "删除",
    "modelList.dirty": "有未保存修改",
    "zoom.out": "缩小",
    "zoom.in": "放大",
    "zoom.reset": "重置缩放",
    "zoom.fit": "适应模型",
    "zoom.fitShort": "适配",
    "ai.preset.custom": "自定义模型名称",
    "ai.preset.openai-gpt-5-2": "OpenAI · GPT-5.2 · 复杂建模推荐",
    "ai.preset.openai-gpt-5": "OpenAI · GPT-5 · 稳定通用",
    "ai.preset.openai-gpt-4-1": "OpenAI · GPT-4.1 · 成本更稳",
    "ai.preset.moonshot-v1-32k": "Kimi · moonshot-v1-32k · 结构化提取推荐",
    "ai.preset.kimi-latest": "Kimi · kimi-latest · 聊天体验",
    "ai.preset.kimi-thinking-preview": "Kimi · kimi-thinking-preview · 推理型",
    "ai.preset.deepseek-chat": "DeepSeek · deepseek-chat · 非思考",
    "ai.preset.deepseek-reasoner": "DeepSeek · deepseek-reasoner · 思考型",
    "ai.preset.qwen-max-latest": "Qwen · qwen-max-latest · 高质量",
    "ai.preset.qwen-plus": "Qwen · qwen-plus · 均衡",
    "ai.config.title": "AI配置",
    "ai.config.desc": "可配置默认模型名、API Key 和兼容接口 Base URL。内置了主流大模型预设，适合自动化设计数据库表；未配置 Key 时回退到服务端环境变量。",
    "ai.config.preset": "模型预设",
    "ai.config.modelName": "默认模型名称",
    "ai.config.modelPlaceholder": "例如 gpt-5.2 / moonshot-v1-32k / deepseek-chat",
    "ai.config.baseUrl": "Base URL",
    "ai.config.baseUrlPlaceholder": "留空默认 OpenAI；Kimi 可填 https://api.moonshot.cn/v1",
    "ai.config.apiKey": "API Key",
    "ai.config.apiKeyPlaceholder": "sk-...",
    "ai.config.cancel": "取消",
    "ai.config.clearKey": "清空Key",
    "ai.config.save": "保存",
    "ai.build.title": "AI建表",
    "ai.build.desc": "输入业务描述，AI将按当前模型数据库类型生成表和字段。",
    "ai.build.helper": "没有 API Key 也可以继续，使用“复制给Codex生成”。这一步会把需求整理后交给 Codex，不会在设计器里直接出表。",
    "ai.build.preset": "模型预设",
    "ai.build.modelName": "模型名称",
    "ai.build.modelPlaceholder": "例如 gpt-5.2 / moonshot-v1-32k / deepseek-chat",
    "ai.build.prompt": "需求描述",
    "ai.build.promptPlaceholder": "示例：用户与订单系统，用户表包含id主键自增、手机号、昵称；订单表包含id主键自增、用户id、订单号、金额、状态、创建时间。",
    "ai.build.cancel": "取消",
    "ai.build.codex": "复制给Codex生成",
    "ai.build.submit": "生成并建表",
    "tableView.title": "表显示模式",
    "tableView.message": "请选择工作区表显示方式",
    "tableView.optionFull": "表头 + 字段详情",
    "tableView.optionHeader": "仅显示表头",
    "common.cancel": "取消",
    "guide.workspace.title": "工程同步提示",
    "guide.workspace.text": "本工程的建表、改表都会同步回当前模型图。完成修改后，优先点击“保存并同步到当前工程”。",
    "guide.workspace.dismiss": "知道了",
    "guide.workspace.dismissLabel": "关闭提示",
    "relation.cardinality.1N": "一对多 (1:N)",
    "relation.cardinality.N1": "多对一 (N:1)",
    "relation.cardinality.NN": "多对多 (N:N, 需中间表)",
    "inspector.panelTitle": "属性面板",
    "inspector.panelHint": "选择一个表后可编辑名称、code、字段、索引和建表脚本。",
    "inspector.tableProperty": "表属性",
    "inspector.tab.basic": "基本信息",
    "inspector.tab.fields": "字段信息",
    "inspector.tab.indexes": "索引",
    "inspector.tab.script": "建表脚本预览",
    "basic.tableName": "表名称",
    "basic.tableCode": "表 Code",
    "basic.tableComment": "表注释",
    "basic.relationMgmt": "关系管理",
    "basic.relationTarget": "关联到表",
    "basic.relationTargetSelect": "请选择目标表",
    "basic.relationType": "关系类型",
    "basic.addRelation": "新增关系",
    "basic.relationList": "关系列表",
    "basic.relationHint": "多对多请通过中间表拆成两条一对多关系。",
    "basic.noRelation": "当前表暂无关系。",
    "basic.deleteCurrentTable": "删除当前表",
    "basic.relationName": "关系名称",
    "basic.deleteRelation": "删除关系",
    "fields.addField": "新增字段",
    "fields.copySelected": "复制选中",
    "fields.pasteFields": "粘贴字段",
    "fields.col.name": "名称",
    "fields.col.select": "选择",
    "fields.col.order": "顺序",
    "fields.col.code": "Code",
    "fields.col.type": "类型",
    "fields.col.length": "长度",
    "fields.col.precision": "精度",
    "fields.col.scale": "小数位",
    "fields.col.default": "默认值",
    "fields.col.comment": "注释",
    "fields.col.action": "操作",
    "fields.delete": "删除",
    "fields.moveUp": "上移",
    "fields.moveDown": "下移",
    "fields.moveUpTitle": "上移字段",
    "fields.moveDownTitle": "下移字段",
    "fields.keepOne": "至少保留一个字段",
    "fields.copyNone": "请先选择要复制的字段。",
    "fields.copyDone": "已复制 {count} 个字段。",
    "fields.clipboardEmpty": "字段剪贴板为空，请先复制字段。",
    "fields.pasteDone": "已粘贴 {count} 个字段。",
    "indexes.pkHelper": "主键索引由主键字段自动生成，无需额外新增。",
    "indexes.addIndex": "新增普通索引",
    "indexes.pkTitle": "主键索引（系统自动维护）",
    "indexes.name": "名称",
    "indexes.type": "类型",
    "indexes.columns": "字段",
    "indexes.noIndex": "当前表暂无索引。",
    "indexes.title": "索引",
    "indexes.delete": "删除索引",
    "indexes.indexName": "索引名称",
    "indexes.indexMethod": "索引方法",
    "indexes.unique": "唯一索引",
    "indexes.clustered": "聚簇索引",
    "indexes.indexFields": "索引字段（可多选）",
    "indexes.needOneField": "索引至少需要一个字段",
    "indexes.needFieldBeforeCreate": "请先创建字段，再新增索引",
    "script.copy": "复制脚本",
    "script.copied": "已复制到剪贴板",
    "script.copyFailed": "复制失败，请手动复制",
    "sync.preview.title": "同步完成",
    "sync.preview.message": "模型和 SQL 已同步到当前工程，可直接在这里查看 SQL。",
    "sync.preview.modelPath": "模型文件",
    "sync.preview.sqlPath": "SQL文件",
    "sync.preview.copy": "复制SQL",
    "sync.preview.close": "关闭",
    "toggle.showSidebar": "显示侧边栏",
    "toggle.hideSidebar": "隐藏侧边栏",
    "toggle.showInspector": "显示属性栏",
    "toggle.hideInspector": "隐藏属性栏",
    "toggle.expandTop": "展开顶栏",
    "toggle.collapseTop": "收起顶栏",
    "layout.sidebarResize": "拖动调整模型栏宽度",
    "layout.inspectorResize": "拖动调整属性栏宽度",
    "common.ok": "确定",
    "common.close": "关闭",
    "common.confirm": "确定",
    "dialog.help.openFailedTitle": "帮助",
    "dialog.help.openFailedMessage": "未能自动打开手册，请手动访问：{url}",
    "dialog.modelPicker.title": "打开模型",
    "dialog.modelPicker.desc": "请选择当前工程目录中的模型名称",
    "dialog.modelPicker.opened": "已打开",
    "dialog.tablePicker.title": "表列表",
    "dialog.tablePicker.desc": "请选择要查看的表",
    "dialog.tablePicker.meta": "{code} · 字段: {fields} · 索引: {indexes}",
    "dialog.workspaceReconnect.title": "工程目录未连接",
    "dialog.workspaceReconnect.message": "当前工程目录已记录，但浏览器目录连接不可用。是否现在连接工程目录？",
    "dialog.workspaceReconnect.titleUnavailable": "工程目录连接不可用",
    "dialog.workspaceReconnect.messageUnavailable": "当前工程目录连接不可用。是否现在重新连接工程目录？",
    "workspace.unsupported": "当前浏览器环境不支持目录工作区功能，请使用最新版 Chrome/Edge 并通过 http(s) 或 localhost 打开。",
    "workspace.reconnectHint": "当前工程目录已记录，但浏览器目录连接不可用。请点击“连接工程目录”重新连接一次。",
    "workspace.setupFirst": "请先设置工程目录。",
    "workspace.reconnectUnavailable": "工程目录连接不可用，请点击“连接工程目录”重新连接一次。",
    "workspace.reconnectExpired": "当前工程目录连接已失效，请重新点击一次“同步”或“连接工程目录”。",
    "workspace.switchPrompt": "请输入工程目录绝对路径",
    "workspace.switchPlaceholder": "D:\\项目目录",
    "workspace.switchEmpty": "工程目录不能为空。",
    "workspace.switchDone": "已切换工程目录：{path}",
    "workspace.switchFailed": "切换工程目录失败：{message}",
    "workspace.switchHttpFailed": "切换工程目录失败（HTTP {status}）",
    "dialog.aiBuild.modelRequired": "请输入模型名称。",
    "dialog.aiBuild.promptRequired": "请输入建表需求描述。",
    "dialog.scriptBuild.title": "脚本建表",
    "dialog.scriptBuild.desc": "粘贴 CREATE TABLE 脚本，系统会按当前模型数据库类型（{dbType}）解析并创建表。",
    "dialog.scriptBuild.label": "建表脚本",
    "dialog.scriptBuild.placeholder": "示例：\nCREATE TABLE users (\n  id bigint PRIMARY KEY AUTO_INCREMENT,\n  username varchar(100) NOT NULL,\n  created_at datetime\n);",
    "dialog.scriptBuild.emptyHint": "输入 SQL 后将自动进行语法检查。",
    "dialog.scriptBuild.passed": "语法检查通过。",
    "dialog.scriptBuild.lineCol": "第{line}行第{column}列",
    "dialog.scriptBuild.moreIssues": "还有 {count} 处问题未展开。",
    "dialog.scriptBuild.inputRequired": "请输入建表脚本。",
    "dialog.template.title": "全局模板字段",
    "dialog.template.desc": "此模板在全系统通用。当前按 {dbType} 类型规则编辑，创建表时会自动转换到目标模型数据库类型。",
    "dialog.template.addField": "新增字段",
    "dialog.template.save": "保存模板",
    "dialog.template.keepOne": "模板至少保留一个字段",
    "dialog.template.delete": "删除",
    "dialog.codex.title": "交给 Codex",
    "dialog.codex.lead": "把设计结果整理成 Codex 最容易继续处理的格式。每次操作都会把交接内容写入当前工程里的 dbcraft-codex-handoff.md。",
    "dialog.codex.modelTitle": "保存模型文件",
    "dialog.codex.modelDesc": "把当前模型保存成 .dbmodel.json，并复制一段可直接发给 Codex 的说明。",
    "dialog.codex.sqlTitle": "导出 SQL",
    "dialog.codex.sqlDesc": "导出当前模型 SQL，并复制“按 SQL 继续”的说明。",
    "dialog.codex.summaryTitle": "复制结构摘要",
    "dialog.codex.summaryDesc": "把当前模型整理成文本摘要，适合直接粘贴到对话里。",
    "dialog.codex.screenshotTitle": "复制截图说明",
    "dialog.codex.screenshotDesc": "适合你准备发设计器截图时，顺手附上一句标准说明。",
    "dialog.codex.speechTitle": "复制口述模板",
    "dialog.codex.speechDesc": "自动带上当前模型摘要，适合你口述结构给 Codex。",
    "dialog.codex.tipOrder": "推荐顺序：模型文件 > SQL > 结构摘要 > 截图/口述。",
    "dialog.codex.tipContinue": "写入交接文件后，你可以直接对 Codex 说“按交接文件继续”。",
    "dialog.codex.tipFile": "如果模型只停留在当前浏览器页面里，没有保存成文件，Codex 无法稳定读取。",
    "dialog.codex.statusIdle": "选择一种方式开始。",
    "dialog.codex.statusSavingModel": "正在保存模型文件...",
    "dialog.codex.statusModelUnsaved": "模型文件未保存。",
    "dialog.codex.statusModelSavedCopied": "模型已保存：{modelPath}；交接文件已写入：{handoffPath}；说明也已复制。",
    "dialog.codex.statusModelSaved": "模型已保存：{modelPath}；交接文件已写入：{handoffPath}。",
    "dialog.codex.statusExportingSql": "正在导出 SQL...",
    "dialog.codex.statusSqlNotExported": "SQL 未导出。",
    "dialog.codex.statusSqlExportedCopied": "SQL 已导出：{sqlPath}；交接文件已写入：{handoffPath}；说明也已复制。",
    "dialog.codex.statusSqlExported": "SQL 已导出：{sqlPath}；交接文件已写入：{handoffPath}。",
    "dialog.codex.statusSummaryCopied": "结构摘要已写入交接文件：{handoffPath}，并已复制。",
    "dialog.codex.statusSummary": "结构摘要已写入交接文件：{handoffPath}。",
    "dialog.codex.statusScreenshotCopied": "截图说明已写入交接文件：{handoffPath}，并已复制。",
    "dialog.codex.statusScreenshot": "截图说明已写入交接文件：{handoffPath}。",
    "dialog.codex.statusSpeechCopied": "口述模板已写入交接文件：{handoffPath}，并已复制。",
    "dialog.codex.statusSpeech": "口述模板已写入交接文件：{handoffPath}。",
    "dialog.about.title": "关于 DB Craft",
    "dialog.about.lead": "本地数据库设计工具，支持可视化建模、脚本建表、AI 建表、语法检查和 SQL 导出。",
    "dialog.about.product": "产品名称",
    "dialog.about.version": "版本信息",
    "dialog.about.supportedDb": "支持数据库",
    "dialog.about.contact": "个人联系方式",
    "dialog.about.license": "开源协议",
    "dialog.about.copyright": "版权说明",
    "dialog.closeModel.title": "关闭模型",
    "dialog.closeModel.message": "模型“{name}”有未保存修改。",
    "dialog.closeModel.save": "保存并关闭",
    "dialog.closeModel.discard": "不保存关闭",
    "alert.selectModelFirst": "请先选择模型。",
    "alert.noTableInModel": "当前模型没有表。",
    "alert.noTableForFit": "当前模型没有可适配的表。",
    "alert.undoNone": "没有可撤销的操作。",
    "alert.undoFailed": "撤销失败。",
    "alert.redoNone": "没有可恢复的操作。",
    "alert.redoFailed": "恢复失败。",
    "alert.copyEntityRequired": "请先选择要复制的表或关系。",
    "alert.deleteEntityRequired": "请先选择要删除的表或关系。",
    "alert.clipboardEmpty": "剪贴板为空。",
    "alert.relationPasteMissingTable": "当前模型缺少关系对应的表，无法粘贴关系。",
    "alert.relationPasteFailed": "粘贴关系失败。",
    "alert.clipboardUnsupported": "当前剪贴板内容不支持粘贴。",
    "dialog.clearAll.title": "全部清除",
    "dialog.clearAll.message": "确认清空模型“{name}”中的全部表和关系？",
    "dialog.clearAll.confirm": "清空",
    "alert.workspacePermissionMissing": "没有获得目录读写权限，无法设置工程目录。",
    "alert.workspacePickAborted": "未完成工程目录选择。若没有看到目录选择窗口，请检查它是否被浏览器或系统放到了后台，然后再试一次。",
    "alert.workspaceSetFailed": "设置工程目录失败：{message}",
    "prompt.workspacePath": "请输入工程目录绝对路径（例如 C:\\Projects\\DBCraftDemo）",
    "prompt.modelName": "请输入模型名称",
    "prompt.modelNameFirstSave": "首次保存请输入模型名称",
    "prompt.modelRename": "请输入新的模型名称",
    "prompt.modelSaveAs": "另存为请输入新模型名称",
    "alert.modelNameRequired": "模型名称不能为空。",
    "dialog.saveModel.title": "保存模型",
    "dialog.saveModel.sameName": "工作区中已存在同名模型“{name}”。",
    "dialog.saveModel.overwrite": "覆盖保存",
    "dialog.saveModel.rename": "修改名称",
    "dialog.saveModel.fileExists": "文件“{fileName}”已存在，是否覆盖？",
    "alert.modelSaveFailed": "保存模型失败：{message}",
    "log.modelAutoSaveFailed": "模型自动保存失败：",
    "dialog.saveAs.title": "模型另存为",
    "dialog.saveAs.sameName": "工作区中已存在同名模型“{name}”。",
    "alert.modelOpenConflict": "目标模型文件已在当前应用中打开。请先关闭该模型，或改用其他名称另存为。",
    "alert.modelSaveAsFailed": "模型另存为失败：{message}",
    "alert.deleteModelFileFailed": "删除模型文件失败：{message}",
    "dialog.deleteModel.title": "删除模型",
    "dialog.deleteModel.dirty": "模型“{name}”有未保存修改。删除后模型会从列表移除，且已保存文件会被删除。",
    "dialog.deleteModel.saveDelete": "保存后删除",
    "dialog.deleteModel.deleteDirect": "直接删除",
    "dialog.deleteModel.confirm": "确认删除模型“{name}”？已保存文件将一起删除。",
    "dialog.deleteModel.delete": "删除",
    "alert.openModelNone": "当前工程目录下没有可打开的模型文件（*.dbmodel.json）。",
    "alert.openModelAllOpened": "当前工程目录中的模型都已打开，无需重复打开。",
    "dialog.openModel.openedTitle": "模型已打开",
    "dialog.openModel.openedMessage": "模型“{name}”已经在当前页面打开。是否用工程目录里的最新内容重新载入？",
    "dialog.openModel.reload": "重新载入",
    "alert.openModelFailed": "打开模型失败：{message}",
    "alert.syntaxNoTable": "当前模型没有表可检查。",
    "alert.syntaxIssues": "模型语法检查发现 {issueCount} 处问题（涉及 {tableCount} 张表）。\n{summary}",
    "alert.syntaxPassed": "模型语法检查通过：共检查 {tableCount} 张表。",
    "alert.aiSavedConfig": "AI配置已保存。",
    "alert.aiKeyCleared": "API Key 已清空。",
    "alert.aiNoTables": "AI没有返回可导入的表定义。",
    "alert.aiInvalidResponse": "AI返回格式无效，缺少 tables。",
    "alert.requestFailedHttp": "请求失败（HTTP {status}）",
    "alert.aiHandoffWrittenCopied": "已写入交接文件：{path}，并已复制给 Codex 的建表说明。下一步你可以直接说“按交接文件继续”，或把复制内容发给 Codex。",
    "alert.aiHandoffWritten": "已写入交接文件：{path}。如需立即继续，请说“按交接文件继续”。",
    "alert.aiBuildDoneWarning": "AI建表完成：新增 {count} 张表。\n提示：{warning}",
    "alert.aiBuildDone": "AI建表完成：新增 {count} 张表。",
    "dialog.aiMissingKey.title": "未配置 API Key",
    "dialog.aiMissingKey.message": "当前 AI 建表需要 API Key。是否改为复制给 Codex 的建表说明？这一步不会在设计器里直接生成表。",
    "dialog.aiMissingKey.toCodex": "复制给Codex生成",
    "alert.aiBuildFailed": "AI建表失败：{message}",
    "alert.scriptBuildDone": "脚本建表完成：新增 {count} 张表。",
    "alert.scriptBuildFailed": "脚本建表失败：{message}",
    "dialog.exportSql.title": "导出SQL",
    "dialog.exportSql.withFk": "是否创建外键约束？",
    "dialog.exportSql.withoutFk": "否（默认）",
    "dialog.exportSql.yes": "是",
    "prompt.exportSqlFile": "请输入导出的SQL文件名称",
    "alert.fileNameRequired": "文件名称不能为空。",
    "prompt.exportSqlFileRetry": "文件名称不能为空，请重新输入SQL文件名称",
    "dialog.exportSql.overwriteMessage": "文件“{fileName}”已存在，是否覆盖？",
    "dialog.exportSql.overwrite": "覆盖导出",
    "prompt.exportSqlRename": "请输入新的SQL文件名称",
    "alert.exportSqlSuccess": "导出成功：{path}",
    "alert.exportSqlFailed": "导出SQL失败：{message}",
    "alert.syncSkippedBySyntax": "模型已保存：{path}\n但语法检查未通过，暂未同步 SQL。",
    "alert.syncSqlFailed": "模型已保存：{path}\n但同步 SQL 失败：{message}",
    "prompt.exportImageFile": "请输入导出的图片文件名称",
    "prompt.exportImageFileRetry": "文件名称不能为空，请重新输入图片文件名称",
    "dialog.exportImage.title": "保存为图片",
    "prompt.exportImageRename": "请输入新的图片文件名称",
    "alert.exportImageSuccess": "图片导出成功：{path}",
    "alert.exportImageFailed": "导出图片失败：{message}",
    "alert.exportImageNoBounds": "当前模型没有可导出的表范围。",
    "alert.exportDirUnsupported": "当前浏览器环境不支持目录导出，请使用最新版 Chrome/Edge 并通过 http(s) 或 localhost 打开。",
    "alert.exportDirPermissionDenied": "未获得目录读写权限，无法导出 SQL。",
    "alert.exportDirPickFailed": "选择导出目录失败：{message}",
    "error.modelFileNameRequired": "模型文件名称不能为空。",
    "error.workspacePermissionDenied": "未获得目录读写权限。",
    "error.canvasUnsupported": "浏览器不支持 Canvas 导出。",
    "error.sqlSyntax": "SQL 语法错误。",
    "error.sqlNoCreateTable": "未识别到可用的 CREATE TABLE 语句。",
    "alert.noModelClosable": "当前没有可关闭的模型。",
    "alert.noModelDeletable": "当前没有可删除的模型。",
    "relation.createWarning": "关系已创建，但未自动建立外键：{message}",
    "relation.updateWarning": "关系类型已更新，但未自动建立外键：{message}",
    "relation.manyToManyHint": "多对多关系必须通过中间表实现，请拆分为两条一对多关系。",
    "relation.dragHint": "拖动创建关系",
    "relation.error.invalidType": "关系类型无效，无法建立外键关系。",
    "relation.error.missingPk": "关系两端的表都未设置主键，无法建立外键关系。",
    "relation.error.missingFieldMapping": "表“{table}”缺少字段映射“{field}”，无法建立外键关系。",
    "relation.error.bridgeRequired": "多对多关系必须通过中间表实现，请先创建中间表并建立两条一对多关系。",
    "relation.error.duplicate": "该关系已存在",
    "relation.error.targetMissing": "关系创建失败，未找到目标表。",
  },
  "en-US": {
    "brand.subtitle": "Database Design Tool",
    "ui.language": "Language",
    "menu.main": "Main Menu",
    "menu.file": "File",
    "menu.edit": "Edit",
    "menu.model": "Model",
    "menu.settings": "Settings",
    "menu.help": "Help",
    "action.file-new-mysql8": "New (MySQL 8)",
    "action.file-new-postgresql14": "New (PostgreSQL 14)",
    "action.file-new-sqlite": "New (SQLite)",
    "action.file-new-mssql": "New (MSSQL)",
    "action.file-open": "Open",
    "action.file-save": "Save",
    "action.file-sync-workspace": "Save + Sync",
    "action.file-connect-sync": "Connect Workspace + Sync",
    "action.file-save-as": "Save As",
    "action.file-close": "Close",
    "action.edit-undo": "Undo",
    "action.edit-redo": "Redo",
    "action.edit-clear-all": "Clear All",
    "action.edit-cut": "Cut",
    "action.edit-copy": "Copy",
    "action.edit-paste": "Paste",
    "action.edit-clone": "Clone",
    "action.edit-delete": "Delete",
    "action.model-template": "Template Table",
    "action.model-delete": "Delete Model",
    "action.model-add-table": "Add Table",
    "action.model-ai-table": "AI Build",
    "action.model-script-table": "SQL Build",
    "action.model-syntax-check": "Syntax Check",
    "action.model-auto-layout": "Auto Layout",
    "action.model-fit-view": "Fit View",
    "action.model-export-image": "Save as Image",
    "action.model-export-sql": "Export SQL",
    "action.model-table": "Tables",
    "action.settings-workspace": "Set Project Workspace",
    "action.settings-workspace-switch": "Switch Project Workspace",
    "action.settings-workspace-connect": "Connect Project Workspace",
    "action.settings-workspace-path": "Set Project Path",
    "action.settings-table-view": "Table Display Mode",
    "action.settings-ai-config": "AI Config",
    "action.help-codex": "Send to Codex",
    "action.help-help": "Help",
    "action.help-about": "About",
    "toolbar.addTable": "Add",
    "toolbar.template": "Template",
    "toolbar.export": "Export",
    "toolbar.deleteModel": "Del",
    "toolbar.workspace": "Workspace",
    "toolbar.project": "Project",
    "toolbar.sync": "Sync",
    "toolbar.connectSync": "Connect + Sync",
    "toolbar.pathHint": "Path",
    "toolbar.fit": "Fit",
    "toolbar.layoutGroup": "Layout",
    "sidebar.title": "Model Manager",
    "sidebar.desc": "Supports MySQL 8 / PostgreSQL 14 / SQLite / MSSQL",
    "modelForm.placeholder": "Model Name",
    "modelForm.create": "New Model",
    "workspace.label": "Current Project",
    "workspace.pathHint": "Project Path",
    "workspace.projectPath": "Project Path",
    "workspace.unset": "Not Set",
    "workspace.unfilled": "Not Filled",
    "workspace.pending": "Pending Connection",
    "workspace.disconnected": "Disconnected",
    "meta.noModel": "No Model Selected",
    "meta.tables": "Tables",
    "meta.relations": "Relations",
    "meta.file": "File",
    "meta.modelFilePath": "Current Model File",
    "meta.modelFileUnsaved": "Not yet saved to workspace",
    "meta.modelFileWillSave": "Will save to",
    "meta.fileUnsaved": "Unsaved",
    "meta.status": "Status",
    "meta.statusSaved": "Saved",
    "meta.statusUnsaved": "Unsaved Changes",
    "modelList.tablesWord": "tables",
    "modelList.close": "Close",
    "modelList.delete": "Delete",
    "modelList.dirty": "Unsaved changes",
    "zoom.out": "Zoom Out",
    "zoom.in": "Zoom In",
    "zoom.reset": "Reset Zoom",
    "zoom.fit": "Fit Model",
    "zoom.fitShort": "Fit",
    "ai.preset.custom": "Custom model name",
    "ai.preset.openai-gpt-5-2": "OpenAI · GPT-5.2 · Best for complex schema design",
    "ai.preset.openai-gpt-5": "OpenAI · GPT-5 · Stable general choice",
    "ai.preset.openai-gpt-4-1": "OpenAI · GPT-4.1 · Lower-cost stable choice",
    "ai.preset.moonshot-v1-32k": "Kimi · moonshot-v1-32k · Recommended for structured extraction",
    "ai.preset.kimi-latest": "Kimi · kimi-latest · Chat-style experience",
    "ai.preset.kimi-thinking-preview": "Kimi · kimi-thinking-preview · Reasoning model",
    "ai.preset.deepseek-chat": "DeepSeek · deepseek-chat · Non-thinking",
    "ai.preset.deepseek-reasoner": "DeepSeek · deepseek-reasoner · Reasoning",
    "ai.preset.qwen-max-latest": "Qwen · qwen-max-latest · Higher quality",
    "ai.preset.qwen-plus": "Qwen · qwen-plus · Balanced",
    "ai.config.title": "AI Config",
    "ai.config.desc": "Configure the default model, API key, and compatible Base URL. Built-in mainstream model presets are provided for database schema automation. If no key is saved here, the app falls back to the server environment variable.",
    "ai.config.preset": "Model Preset",
    "ai.config.modelName": "Default Model Name",
    "ai.config.modelPlaceholder": "For example: gpt-5.2 / moonshot-v1-32k / deepseek-chat",
    "ai.config.baseUrl": "Base URL",
    "ai.config.baseUrlPlaceholder": "Leave empty for OpenAI; for Kimi use https://api.moonshot.cn/v1",
    "ai.config.apiKey": "API Key",
    "ai.config.apiKeyPlaceholder": "sk-...",
    "ai.config.cancel": "Cancel",
    "ai.config.clearKey": "Clear Key",
    "ai.config.save": "Save",
    "ai.build.title": "AI Build Tables",
    "ai.build.desc": "Describe the business requirement and AI will generate tables and fields for the current database type.",
    "ai.build.helper": "You can still continue without an API key by using “Send to Codex”. This will prepare the requirement for Codex instead of generating tables directly inside the designer.",
    "ai.build.preset": "Model Preset",
    "ai.build.modelName": "Model Name",
    "ai.build.modelPlaceholder": "For example: gpt-5.2 / moonshot-v1-32k / deepseek-chat",
    "ai.build.prompt": "Requirement",
    "ai.build.promptPlaceholder": "Example: A user and order system. The user table contains auto-increment id, mobile number, nickname; the order table contains auto-increment id, user id, order number, amount, status, and created_at.",
    "ai.build.cancel": "Cancel",
    "ai.build.codex": "Send to Codex",
    "ai.build.submit": "Generate Tables",
    "tableView.title": "Table Display Mode",
    "tableView.message": "Choose how tables are shown in workspace",
    "tableView.optionFull": "Header + Field Details",
    "tableView.optionHeader": "Header Only",
    "common.cancel": "Cancel",
    "guide.workspace.title": "Workspace Sync Tip",
    "guide.workspace.text": "Table creation and table edits in this workspace should stay reflected in the current diagram. After changes, use Save + Sync.",
    "guide.workspace.dismiss": "Got it",
    "guide.workspace.dismissLabel": "Dismiss tip",
    "relation.cardinality.1N": "One to Many (1:N)",
    "relation.cardinality.N1": "Many to One (N:1)",
    "relation.cardinality.NN": "Many to Many (N:N, via bridge table)",
    "inspector.panelTitle": "Property Panel",
    "inspector.panelHint": "Select a table to edit name, code, fields, indexes and create-table script.",
    "inspector.tableProperty": "Table Properties",
    "inspector.tab.basic": "Basic",
    "inspector.tab.fields": "Fields",
    "inspector.tab.indexes": "Indexes",
    "inspector.tab.script": "DDL Preview",
    "basic.tableName": "Table Name",
    "basic.tableCode": "Table Code",
    "basic.tableComment": "Table Comment",
    "basic.relationMgmt": "Relation Management",
    "basic.relationTarget": "Relate To",
    "basic.relationTargetSelect": "Select target table",
    "basic.relationType": "Relation Type",
    "basic.addRelation": "Add Relation",
    "basic.relationList": "Relation List",
    "basic.relationHint": "For many-to-many, use a bridge table and split into two one-to-many relations.",
    "basic.noRelation": "No relations for this table.",
    "basic.deleteCurrentTable": "Delete Current Table",
    "basic.relationName": "Relation Name",
    "basic.deleteRelation": "Delete Relation",
    "fields.addField": "Add Field",
    "fields.copySelected": "Copy Selected",
    "fields.pasteFields": "Paste Fields",
    "fields.col.name": "Name",
    "fields.col.select": "Select",
    "fields.col.order": "Order",
    "fields.col.code": "Code",
    "fields.col.type": "Type",
    "fields.col.length": "Length",
    "fields.col.precision": "Precision",
    "fields.col.scale": "Scale",
    "fields.col.default": "Default",
    "fields.col.comment": "Comment",
    "fields.col.action": "Action",
    "fields.delete": "Delete",
    "fields.moveUp": "Up",
    "fields.moveDown": "Down",
    "fields.moveUpTitle": "Move field up",
    "fields.moveDownTitle": "Move field down",
    "fields.keepOne": "Keep at least one field",
    "fields.copyNone": "Select at least one field to copy.",
    "fields.copyDone": "Copied {count} fields.",
    "fields.clipboardEmpty": "Field clipboard is empty, copy fields first.",
    "fields.pasteDone": "Pasted {count} fields.",
    "indexes.pkHelper": "Primary index is generated automatically from PK fields.",
    "indexes.addIndex": "Add Index",
    "indexes.pkTitle": "Primary Index (System Managed)",
    "indexes.name": "Name",
    "indexes.type": "Type",
    "indexes.columns": "Columns",
    "indexes.noIndex": "No index in this table.",
    "indexes.title": "Index",
    "indexes.delete": "Delete Index",
    "indexes.indexName": "Index Name",
    "indexes.indexMethod": "Index Method",
    "indexes.unique": "Unique",
    "indexes.clustered": "Clustered",
    "indexes.indexFields": "Index Columns (multi-select)",
    "indexes.needOneField": "Index requires at least one column",
    "indexes.needFieldBeforeCreate": "Create fields before adding an index",
    "script.copy": "Copy Script",
    "script.copied": "Copied to clipboard",
    "script.copyFailed": "Copy failed, please copy manually",
    "sync.preview.title": "Sync Complete",
    "sync.preview.message": "The model and SQL have been synced to the workspace. You can review the SQL here.",
    "sync.preview.modelPath": "Model File",
    "sync.preview.sqlPath": "SQL File",
    "sync.preview.copy": "Copy SQL",
    "sync.preview.close": "Close",
    "toggle.showSidebar": "Show Sidebar",
    "toggle.hideSidebar": "Hide Sidebar",
    "toggle.showInspector": "Show Inspector",
    "toggle.hideInspector": "Hide Inspector",
    "toggle.expandTop": "Expand Top",
    "toggle.collapseTop": "Collapse Top",
    "layout.sidebarResize": "Drag to resize the model sidebar",
    "layout.inspectorResize": "Drag to resize the inspector panel",
    "common.ok": "OK",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "dialog.help.openFailedTitle": "Help",
    "dialog.help.openFailedMessage": "The manual could not be opened automatically. Please open it manually: {url}",
    "dialog.modelPicker.title": "Open Model",
    "dialog.modelPicker.desc": "Choose a model from the current project directory",
    "dialog.modelPicker.opened": "Opened",
    "dialog.tablePicker.title": "Table List",
    "dialog.tablePicker.desc": "Choose a table to inspect",
    "dialog.tablePicker.meta": "{code} · Fields: {fields} · Indexes: {indexes}",
    "dialog.workspaceReconnect.title": "Project Directory Disconnected",
    "dialog.workspaceReconnect.message": "The project directory is recorded, but the browser connection is unavailable. Connect it now?",
    "dialog.workspaceReconnect.titleUnavailable": "Project Directory Unavailable",
    "dialog.workspaceReconnect.messageUnavailable": "The project directory connection is unavailable. Reconnect now?",
    "workspace.unsupported": "This browser does not support directory workspace features. Please use the latest Chrome or Edge over http(s) or localhost.",
    "workspace.reconnectHint": "The project directory is recorded, but the browser connection is unavailable. Click Connect Project Directory to reconnect it.",
    "workspace.setupFirst": "Please set the project directory first.",
    "workspace.reconnectUnavailable": "The project directory connection is unavailable. Click Connect Project Directory to reconnect it.",
    "workspace.reconnectExpired": "The project directory connection expired. Click Sync or Connect Project Directory again.",
    "workspace.switchPrompt": "Enter the absolute project directory path",
    "workspace.switchPlaceholder": "D:\\Project",
    "workspace.switchEmpty": "Project directory cannot be empty.",
    "workspace.switchDone": "Project directory switched: {path}",
    "workspace.switchFailed": "Failed to switch project directory: {message}",
    "workspace.switchHttpFailed": "Failed to switch project directory (HTTP {status})",
    "dialog.aiBuild.modelRequired": "Please enter a model name.",
    "dialog.aiBuild.promptRequired": "Please enter a schema request.",
    "dialog.scriptBuild.title": "Build from SQL",
    "dialog.scriptBuild.desc": "Paste CREATE TABLE SQL. It will be parsed using the current model database type ({dbType}).",
    "dialog.scriptBuild.label": "DDL Script",
    "dialog.scriptBuild.placeholder": "Example:\nCREATE TABLE users (\n  id bigint PRIMARY KEY AUTO_INCREMENT,\n  username varchar(100) NOT NULL,\n  created_at datetime\n);",
    "dialog.scriptBuild.emptyHint": "Syntax validation runs automatically after you enter SQL.",
    "dialog.scriptBuild.passed": "Syntax check passed.",
    "dialog.scriptBuild.lineCol": "Line {line}, Col {column}",
    "dialog.scriptBuild.moreIssues": "{count} more issues are hidden.",
    "dialog.scriptBuild.inputRequired": "Please enter a CREATE TABLE script.",
    "dialog.template.title": "Global Template Fields",
    "dialog.template.desc": "This template is shared across the whole app. It is edited using {dbType} rules and converted automatically for the target model database.",
    "dialog.template.addField": "Add Field",
    "dialog.template.save": "Save Template",
    "dialog.template.keepOne": "Keep at least one template field",
    "dialog.template.delete": "Delete",
    "dialog.codex.title": "Send to Codex",
    "dialog.codex.lead": "Prepare the current design in the format Codex can continue most smoothly. Each action writes a handoff file named dbcraft-codex-handoff.md into the current project.",
    "dialog.codex.modelTitle": "Save Model File",
    "dialog.codex.modelDesc": "Save the current model as .dbmodel.json and copy a ready-to-send instruction for Codex.",
    "dialog.codex.sqlTitle": "Export SQL",
    "dialog.codex.sqlDesc": "Export the current model SQL and copy a 'continue from SQL' instruction.",
    "dialog.codex.summaryTitle": "Copy Structure Summary",
    "dialog.codex.summaryDesc": "Turn the current model into a text summary suitable for direct chat use.",
    "dialog.codex.screenshotTitle": "Copy Screenshot Prompt",
    "dialog.codex.screenshotDesc": "Useful when you plan to send a DB Craft screenshot with one standard sentence.",
    "dialog.codex.speechTitle": "Copy Spoken Template",
    "dialog.codex.speechDesc": "Includes the current model summary, suitable for describing the structure in words.",
    "dialog.codex.tipOrder": "Recommended order: model file > SQL > structure summary > screenshot / spoken summary.",
    "dialog.codex.tipContinue": "After the handoff file is written, you can tell Codex 'continue from the handoff file'.",
    "dialog.codex.tipFile": "If the model only exists in the browser and has not been saved, Codex cannot read it reliably.",
    "dialog.codex.statusIdle": "Choose one way to begin.",
    "dialog.codex.statusSavingModel": "Saving model file...",
    "dialog.codex.statusModelUnsaved": "The model file was not saved.",
    "dialog.codex.statusModelSavedCopied": "Model saved: {modelPath}; handoff file written: {handoffPath}; the instruction was also copied.",
    "dialog.codex.statusModelSaved": "Model saved: {modelPath}; handoff file written: {handoffPath}.",
    "dialog.codex.statusExportingSql": "Exporting SQL...",
    "dialog.codex.statusSqlNotExported": "SQL was not exported.",
    "dialog.codex.statusSqlExportedCopied": "SQL exported: {sqlPath}; handoff file written: {handoffPath}; the instruction was also copied.",
    "dialog.codex.statusSqlExported": "SQL exported: {sqlPath}; handoff file written: {handoffPath}.",
    "dialog.codex.statusSummaryCopied": "The structure summary was written to: {handoffPath}, and copied.",
    "dialog.codex.statusSummary": "The structure summary was written to: {handoffPath}.",
    "dialog.codex.statusScreenshotCopied": "The screenshot prompt was written to: {handoffPath}, and copied.",
    "dialog.codex.statusScreenshot": "The screenshot prompt was written to: {handoffPath}.",
    "dialog.codex.statusSpeechCopied": "The spoken template was written to: {handoffPath}, and copied.",
    "dialog.codex.statusSpeech": "The spoken template was written to: {handoffPath}.",
    "dialog.about.title": "About DB Craft",
    "dialog.about.lead": "A local database design tool for visual modeling, SQL-based table creation, AI-assisted schema generation, syntax checks, and SQL export.",
    "dialog.about.product": "Product",
    "dialog.about.version": "Version",
    "dialog.about.supportedDb": "Supported Databases",
    "dialog.about.contact": "Contact",
    "dialog.about.license": "License",
    "dialog.about.copyright": "Copyright",
    "dialog.closeModel.title": "Close Model",
    "dialog.closeModel.message": "Model \"{name}\" has unsaved changes.",
    "dialog.closeModel.save": "Save and Close",
    "dialog.closeModel.discard": "Close Without Saving",
    "alert.selectModelFirst": "Please select a model first.",
    "alert.noTableInModel": "The current model has no tables.",
    "alert.noTableForFit": "The current model has no tables that can be fitted.",
    "alert.undoNone": "There is nothing to undo.",
    "alert.undoFailed": "Undo failed.",
    "alert.redoNone": "There is nothing to redo.",
    "alert.redoFailed": "Redo failed.",
    "alert.copyEntityRequired": "Select a table or relation to copy first.",
    "alert.deleteEntityRequired": "Select a table or relation to delete first.",
    "alert.clipboardEmpty": "The clipboard is empty.",
    "alert.relationPasteMissingTable": "The related tables for this relation are missing in the current model, so it cannot be pasted.",
    "alert.relationPasteFailed": "Failed to paste the relation.",
    "alert.clipboardUnsupported": "The current clipboard content cannot be pasted here.",
    "dialog.clearAll.title": "Clear All",
    "dialog.clearAll.message": "Clear all tables and relations from model \"{name}\"?",
    "dialog.clearAll.confirm": "Clear",
    "alert.workspacePermissionMissing": "Directory read/write permission was not granted, so the project directory could not be set.",
    "alert.workspacePickAborted": "Project directory selection was not completed. If you did not see the chooser window, check whether it was sent behind the browser or system window and try again.",
    "alert.workspaceSetFailed": "Failed to set the project directory: {message}",
    "prompt.workspacePath": "Enter the absolute project directory path (for example C:\\Projects\\DBCraftDemo)",
    "prompt.modelName": "Enter a model name",
    "prompt.modelNameFirstSave": "Enter a model name for the first save",
    "prompt.modelRename": "Enter a new model name",
    "prompt.modelSaveAs": "Enter a new model name for Save As",
    "alert.modelNameRequired": "Model name cannot be empty.",
    "dialog.saveModel.title": "Save Model",
    "dialog.saveModel.sameName": "A model named \"{name}\" already exists in the workspace.",
    "dialog.saveModel.overwrite": "Overwrite",
    "dialog.saveModel.rename": "Rename",
    "dialog.saveModel.fileExists": "The file \"{fileName}\" already exists. Overwrite it?",
    "alert.modelSaveFailed": "Failed to save the model: {message}",
    "log.modelAutoSaveFailed": "Model auto-save failed:",
    "dialog.saveAs.title": "Save Model As",
    "dialog.saveAs.sameName": "A model named \"{name}\" already exists in the workspace.",
    "alert.modelOpenConflict": "The target model file is already open in this app. Close it first or use another name for Save As.",
    "alert.modelSaveAsFailed": "Failed to save the model as: {message}",
    "alert.deleteModelFileFailed": "Failed to delete the model file: {message}",
    "dialog.deleteModel.title": "Delete Model",
    "dialog.deleteModel.dirty": "Model \"{name}\" has unsaved changes. Deleting it will remove it from the list and also delete the saved file.",
    "dialog.deleteModel.saveDelete": "Save Then Delete",
    "dialog.deleteModel.deleteDirect": "Delete Directly",
    "dialog.deleteModel.confirm": "Delete model \"{name}\"? Its saved file will be deleted as well.",
    "dialog.deleteModel.delete": "Delete",
    "alert.openModelNone": "There are no model files (*.dbmodel.json) to open in the current project directory.",
    "alert.openModelAllOpened": "All model files in the current project are already open.",
    "dialog.openModel.openedTitle": "Model Already Open",
    "dialog.openModel.openedMessage": "Model \"{name}\" is already open on this page. Reload it from the latest project file?",
    "dialog.openModel.reload": "Reload",
    "alert.openModelFailed": "Failed to open the model: {message}",
    "alert.syntaxNoTable": "There are no tables to check in the current model.",
    "alert.syntaxIssues": "Model syntax check found {issueCount} issues across {tableCount} tables.\n{summary}",
    "alert.syntaxPassed": "Model syntax check passed. Checked {tableCount} tables.",
    "alert.aiSavedConfig": "AI configuration saved.",
    "alert.aiKeyCleared": "The API key has been cleared.",
    "alert.aiNoTables": "The AI response did not contain any importable table definitions.",
    "alert.aiInvalidResponse": "The AI response format is invalid because tables are missing.",
    "alert.requestFailedHttp": "Request failed (HTTP {status})",
    "alert.aiHandoffWrittenCopied": "The handoff file was written to: {path}, and the Codex prompt was copied. Next you can say 'continue from the handoff file' or paste the copied prompt to Codex.",
    "alert.aiHandoffWritten": "The handoff file was written to: {path}. To continue immediately, say 'continue from the handoff file'.",
    "alert.aiBuildDoneWarning": "AI build finished: {count} tables were added.\nNote: {warning}",
    "alert.aiBuildDone": "AI build finished: {count} tables were added.",
    "dialog.aiMissingKey.title": "API Key Not Configured",
    "dialog.aiMissingKey.message": "AI table generation currently requires an API key. Switch to a Codex handoff prompt instead? This will not create tables directly inside the designer.",
    "dialog.aiMissingKey.toCodex": "Send to Codex",
    "alert.aiBuildFailed": "AI build failed: {message}",
    "alert.scriptBuildDone": "SQL build finished: {count} tables were added.",
    "alert.scriptBuildFailed": "SQL build failed: {message}",
    "dialog.exportSql.title": "Export SQL",
    "dialog.exportSql.withFk": "Create foreign key constraints?",
    "dialog.exportSql.withoutFk": "No (Default)",
    "dialog.exportSql.yes": "Yes",
    "prompt.exportSqlFile": "Enter the SQL file name to export",
    "alert.fileNameRequired": "File name cannot be empty.",
    "prompt.exportSqlFileRetry": "File name cannot be empty. Enter a new SQL file name",
    "dialog.exportSql.overwriteMessage": "The file \"{fileName}\" already exists. Overwrite it?",
    "dialog.exportSql.overwrite": "Overwrite Export",
    "prompt.exportSqlRename": "Enter a new SQL file name",
    "alert.exportSqlSuccess": "Export completed: {path}",
    "alert.exportSqlFailed": "Failed to export SQL: {message}",
    "alert.syncSkippedBySyntax": "Model saved to: {path}\nBut the syntax check did not pass, so SQL was not synced.",
    "alert.syncSqlFailed": "Model saved to: {path}\nBut syncing SQL failed: {message}",
    "prompt.exportImageFile": "Enter the image file name to export",
    "prompt.exportImageFileRetry": "File name cannot be empty. Enter a new image file name",
    "dialog.exportImage.title": "Save as Image",
    "prompt.exportImageRename": "Enter a new image file name",
    "alert.exportImageSuccess": "Image exported: {path}",
    "alert.exportImageFailed": "Failed to export the image: {message}",
    "alert.exportImageNoBounds": "The current model has no exportable table bounds.",
    "alert.exportDirUnsupported": "This browser does not support directory export. Please use the latest Chrome or Edge over http(s) or localhost.",
    "alert.exportDirPermissionDenied": "Directory read/write permission was not granted, so SQL could not be exported.",
    "alert.exportDirPickFailed": "Failed to choose the export directory: {message}",
    "error.modelFileNameRequired": "Model file name cannot be empty.",
    "error.workspacePermissionDenied": "Directory read/write permission was not granted.",
    "error.canvasUnsupported": "Canvas export is not supported by this browser.",
    "error.sqlSyntax": "SQL syntax error.",
    "error.sqlNoCreateTable": "No usable CREATE TABLE statement was detected.",
    "alert.noModelClosable": "There is no model to close right now.",
    "alert.noModelDeletable": "There is no model to delete right now.",
    "relation.createWarning": "The relation was created, but the foreign key was not added automatically: {message}",
    "relation.updateWarning": "The relation type was updated, but the foreign key was not added automatically: {message}",
    "relation.manyToManyHint": "Many-to-many relations must be implemented through a bridge table. Split it into two one-to-many relations.",
    "relation.dragHint": "Drag to create a relation",
    "relation.error.invalidType": "The relation type is invalid, so a foreign key cannot be created.",
    "relation.error.missingPk": "Neither side of the relation has a primary key, so a foreign key cannot be created.",
    "relation.error.missingFieldMapping": "Table \"{table}\" is missing the mapped field \"{field}\", so a foreign key cannot be created.",
    "relation.error.bridgeRequired": "A many-to-many relation must be implemented through a bridge table. Create the bridge table first and then define two one-to-many relations.",
    "relation.error.duplicate": "This relation already exists.",
    "relation.error.targetMissing": "Failed to create the relation because the target table could not be found.",
  },
  "fr-FR": {
    "brand.subtitle": "Outil de conception de base de donnees",
    "ui.language": "Langue",
    "menu.main": "Menu principal",
    "menu.file": "Fichier",
    "menu.edit": "Edition",
    "menu.model": "Modele",
    "menu.settings": "Parametres",
    "menu.help": "Aide",
    "action.file-new-mysql8": "Nouveau (MySQL 8)",
    "action.file-new-postgresql14": "Nouveau (PostgreSQL 14)",
    "action.file-new-sqlite": "Nouveau (SQLite)",
    "action.file-new-mssql": "Nouveau (MSSQL)",
    "action.file-open": "Ouvrir",
    "action.file-save": "Enregistrer",
    "action.file-sync-workspace": "Enregistrer + synchroniser",
    "action.file-connect-sync": "Connecter le repertoire + synchroniser",
    "action.file-save-as": "Enregistrer sous",
    "action.file-close": "Fermer",
    "action.edit-undo": "Annuler",
    "action.edit-redo": "Retablir",
    "action.edit-clear-all": "Tout effacer",
    "action.edit-cut": "Couper",
    "action.edit-copy": "Copier",
    "action.edit-paste": "Coller",
    "action.edit-clone": "Cloner",
    "action.edit-delete": "Supprimer",
    "action.model-template": "Table modele",
    "action.model-delete": "Supprimer modele",
    "action.model-add-table": "Ajouter table",
    "action.model-ai-table": "Creation IA",
    "action.model-script-table": "Creation SQL",
    "action.model-syntax-check": "Verification syntaxe",
    "action.model-auto-layout": "Mise en page auto",
    "action.model-fit-view": "Adapter a la fenetre",
    "action.model-export-image": "Enregistrer en image",
    "action.model-export-sql": "Exporter SQL",
    "action.model-table": "Tables",
    "action.settings-workspace": "Definir repertoire projet",
    "action.settings-workspace-switch": "Changer de repertoire projet",
    "action.settings-workspace-connect": "Connecter le repertoire projet",
    "action.settings-workspace-path": "Definir le chemin du projet",
    "action.settings-table-view": "Mode d'affichage des tables",
    "action.settings-ai-config": "Config IA",
    "action.help-codex": "Envoyer a Codex",
    "action.help-help": "Aide",
    "action.help-about": "A propos",
    "toolbar.addTable": "Ajouter",
    "toolbar.template": "Modele",
    "toolbar.export": "Export",
    "toolbar.deleteModel": "Suppr",
    "toolbar.workspace": "Dossier",
    "toolbar.project": "Projet",
    "toolbar.sync": "Sync",
    "toolbar.connectSync": "Connecter + sync",
    "toolbar.pathHint": "Chemin",
    "toolbar.fit": "Adapter",
    "toolbar.layoutGroup": "Disposition",
    "sidebar.title": "Gestion des modeles",
    "sidebar.desc": "Prend en charge MySQL 8 / PostgreSQL 14 / SQLite / MSSQL",
    "modelForm.placeholder": "Nom du modele",
    "modelForm.create": "Nouveau modele",
    "workspace.label": "Projet courant",
    "workspace.pathHint": "Chemin du projet",
    "workspace.projectPath": "Chemin du projet",
    "workspace.unset": "Non defini",
    "workspace.unfilled": "Vide",
    "workspace.pending": "Connexion en attente",
    "workspace.disconnected": "Deconnecte",
    "meta.noModel": "Aucun modele selectionne",
    "meta.tables": "Tables",
    "meta.relations": "Relations",
    "meta.file": "Fichier",
    "meta.modelFilePath": "Fichier modele courant",
    "meta.modelFileUnsaved": "Pas encore enregistre dans le repertoire",
    "meta.modelFileWillSave": "Sera enregistre dans",
    "meta.fileUnsaved": "Non enregistre",
    "meta.status": "Etat",
    "meta.statusSaved": "Enregistre",
    "meta.statusUnsaved": "Modifications non enregistrees",
    "modelList.tablesWord": "tables",
    "modelList.close": "Fermer",
    "modelList.delete": "Supprimer",
    "modelList.dirty": "Modifications non enregistrees",
    "zoom.out": "Zoom arriere",
    "zoom.in": "Zoom avant",
    "zoom.reset": "Reinitialiser zoom",
    "zoom.fit": "Adapter le modele",
    "zoom.fitShort": "Adapter",
    "ai.preset.custom": "Nom de modele personnalise",
    "ai.preset.openai-gpt-5-2": "OpenAI · GPT-5.2 · Recommande pour modeles complexes",
    "ai.preset.openai-gpt-5": "OpenAI · GPT-5 · Choix general stable",
    "ai.preset.openai-gpt-4-1": "OpenAI · GPT-4.1 · Choix stable a cout reduit",
    "ai.preset.moonshot-v1-32k": "Kimi · moonshot-v1-32k · Recommande pour extraction structuree",
    "ai.preset.kimi-latest": "Kimi · kimi-latest · Experience conversationnelle",
    "ai.preset.kimi-thinking-preview": "Kimi · kimi-thinking-preview · Modele de raisonnement",
    "ai.preset.deepseek-chat": "DeepSeek · deepseek-chat · Sans raisonnement",
    "ai.preset.deepseek-reasoner": "DeepSeek · deepseek-reasoner · Raisonnement",
    "ai.preset.qwen-max-latest": "Qwen · qwen-max-latest · Haute qualite",
    "ai.preset.qwen-plus": "Qwen · qwen-plus · Equilibre",
    "ai.config.title": "Configuration IA",
    "ai.config.desc": "Configurez le modele par defaut, la cle API et l'URL Base compatible. Des presets de modeles courants sont fournis pour l'automatisation de la conception de tables. Si aucune cle n'est enregistree ici, l'application utilisera la variable d'environnement du serveur.",
    "ai.config.preset": "Preset de modele",
    "ai.config.modelName": "Nom du modele par defaut",
    "ai.config.modelPlaceholder": "Par exemple : gpt-5.2 / moonshot-v1-32k / deepseek-chat",
    "ai.config.baseUrl": "Base URL",
    "ai.config.baseUrlPlaceholder": "Laissez vide pour OpenAI ; pour Kimi utilisez https://api.moonshot.cn/v1",
    "ai.config.apiKey": "Cle API",
    "ai.config.apiKeyPlaceholder": "sk-...",
    "ai.config.cancel": "Annuler",
    "ai.config.clearKey": "Effacer la cle",
    "ai.config.save": "Enregistrer",
    "ai.build.title": "Creation IA de tables",
    "ai.build.desc": "Decrivez le besoin metier et l'IA generera les tables et champs pour le type de base courant.",
    "ai.build.helper": "Vous pouvez continuer sans cle API via « Envoyer a Codex ». Cette option prepare la demande pour Codex au lieu de generer les tables directement dans le concepteur.",
    "ai.build.preset": "Preset de modele",
    "ai.build.modelName": "Nom du modele",
    "ai.build.modelPlaceholder": "Par exemple : gpt-5.2 / moonshot-v1-32k / deepseek-chat",
    "ai.build.prompt": "Description du besoin",
    "ai.build.promptPlaceholder": "Exemple : systeme utilisateurs/commandes. La table utilisateur contient id auto-incremente, mobile, pseudo ; la table commande contient id auto-incremente, user_id, numero de commande, montant, statut et date de creation.",
    "ai.build.cancel": "Annuler",
    "ai.build.codex": "Envoyer a Codex",
    "ai.build.submit": "Generer les tables",
    "tableView.title": "Mode d'affichage des tables",
    "tableView.message": "Choisissez la presentation des tables dans l'espace de travail",
    "tableView.optionFull": "En-tete + details des champs",
    "tableView.optionHeader": "En-tete uniquement",
    "common.cancel": "Annuler",
    "guide.workspace.title": "Conseil de synchronisation",
    "guide.workspace.text": "Les creations et modifications de tables de ce repertoire doivent rester visibles dans le diagramme courant. Apres modification, utilisez Enregistrer + synchroniser.",
    "guide.workspace.dismiss": "Compris",
    "guide.workspace.dismissLabel": "Fermer le conseil",
    "relation.cardinality.1N": "Un a plusieurs (1:N)",
    "relation.cardinality.N1": "Plusieurs a un (N:1)",
    "relation.cardinality.NN": "Plusieurs a plusieurs (N:N, table intermediaire)",
    "inspector.panelTitle": "Panneau de proprietes",
    "inspector.panelHint": "Selectionnez une table pour modifier nom, code, champs, index et script DDL.",
    "inspector.tableProperty": "Proprietes de table",
    "inspector.tab.basic": "Infos de base",
    "inspector.tab.fields": "Champs",
    "inspector.tab.indexes": "Index",
    "inspector.tab.script": "Apercu DDL",
    "basic.tableName": "Nom de table",
    "basic.tableCode": "Code table",
    "basic.tableComment": "Commentaire table",
    "basic.relationMgmt": "Gestion des relations",
    "basic.relationTarget": "Relier a",
    "basic.relationTargetSelect": "Selectionner table cible",
    "basic.relationType": "Type de relation",
    "basic.addRelation": "Ajouter relation",
    "basic.relationList": "Liste des relations",
    "basic.relationHint": "Pour N:N, utilisez une table intermediaire et deux relations 1:N.",
    "basic.noRelation": "Aucune relation pour cette table.",
    "basic.deleteCurrentTable": "Supprimer table courante",
    "basic.relationName": "Nom de relation",
    "basic.deleteRelation": "Supprimer relation",
    "fields.addField": "Ajouter champ",
    "fields.copySelected": "Copier selection",
    "fields.pasteFields": "Coller champs",
    "fields.col.name": "Nom",
    "fields.col.select": "Select",
    "fields.col.order": "Ordre",
    "fields.col.code": "Code",
    "fields.col.type": "Type",
    "fields.col.length": "Longueur",
    "fields.col.precision": "Precision",
    "fields.col.scale": "Echelle",
    "fields.col.default": "Valeur par defaut",
    "fields.col.comment": "Commentaire",
    "fields.col.action": "Action",
    "fields.delete": "Supprimer",
    "fields.moveUp": "Monter",
    "fields.moveDown": "Descendre",
    "fields.moveUpTitle": "Monter le champ",
    "fields.moveDownTitle": "Descendre le champ",
    "fields.keepOne": "Conserver au moins un champ",
    "fields.copyNone": "Selectionnez au moins un champ a copier.",
    "fields.copyDone": "{count} champs copies.",
    "fields.clipboardEmpty": "Presse-papiers des champs vide, copiez d'abord des champs.",
    "fields.pasteDone": "{count} champs colles.",
    "indexes.pkHelper": "L'index primaire est genere automatiquement depuis les champs PK.",
    "indexes.addIndex": "Ajouter index",
    "indexes.pkTitle": "Index primaire (gere par le systeme)",
    "indexes.name": "Nom",
    "indexes.type": "Type",
    "indexes.columns": "Colonnes",
    "indexes.noIndex": "Aucun index dans cette table.",
    "indexes.title": "Index",
    "indexes.delete": "Supprimer index",
    "indexes.indexName": "Nom de l'index",
    "indexes.indexMethod": "Methode d'index",
    "indexes.unique": "Unique",
    "indexes.clustered": "Clusterise",
    "indexes.indexFields": "Colonnes d'index (multi-selection)",
    "indexes.needOneField": "Un index doit contenir au moins une colonne",
    "indexes.needFieldBeforeCreate": "Creez des champs avant d'ajouter un index",
    "script.copy": "Copier script",
    "script.copied": "Copie dans le presse-papiers",
    "script.copyFailed": "Echec de copie, veuillez copier manuellement",
    "sync.preview.title": "Synchronisation terminee",
    "sync.preview.message": "Le modele et le SQL ont ete synchronises dans le repertoire. Vous pouvez consulter le SQL ici.",
    "sync.preview.modelPath": "Fichier modele",
    "sync.preview.sqlPath": "Fichier SQL",
    "sync.preview.copy": "Copier SQL",
    "sync.preview.close": "Fermer",
    "toggle.showSidebar": "Afficher la barre laterale",
    "toggle.hideSidebar": "Masquer la barre laterale",
    "toggle.showInspector": "Afficher le panneau propriete",
    "toggle.hideInspector": "Masquer le panneau propriete",
    "toggle.expandTop": "Developper le haut",
    "toggle.collapseTop": "Replier le haut",
    "layout.sidebarResize": "Faire glisser pour redimensionner la barre laterale des modeles",
    "layout.inspectorResize": "Faire glisser pour redimensionner le panneau des proprietes",
    "common.ok": "OK",
    "common.close": "Fermer",
    "common.confirm": "Confirmer",
    "dialog.help.openFailedTitle": "Aide",
    "dialog.help.openFailedMessage": "Le manuel n'a pas pu etre ouvert automatiquement. Ouvrez-le manuellement : {url}",
    "dialog.modelPicker.title": "Ouvrir un modele",
    "dialog.modelPicker.desc": "Choisissez un modele dans le repertoire du projet courant",
    "dialog.modelPicker.opened": "Ouvert",
    "dialog.tablePicker.title": "Liste des tables",
    "dialog.tablePicker.desc": "Choisissez une table a afficher",
    "dialog.tablePicker.meta": "{code} · Champs : {fields} · Index : {indexes}",
    "dialog.workspaceReconnect.title": "Repertoire du projet deconnecte",
    "dialog.workspaceReconnect.message": "Le repertoire du projet est memorise, mais la connexion du navigateur n'est pas disponible. Le reconnecter maintenant ?",
    "dialog.workspaceReconnect.titleUnavailable": "Repertoire du projet indisponible",
    "dialog.workspaceReconnect.messageUnavailable": "La connexion au repertoire du projet est indisponible. Reconnecter maintenant ?",
    "workspace.unsupported": "Ce navigateur ne prend pas en charge les fonctions de repertoire de travail. Utilisez la derniere version de Chrome ou Edge avec http(s) ou localhost.",
    "workspace.reconnectHint": "Le repertoire du projet est memorise, mais la connexion du navigateur est indisponible. Cliquez sur Connecter le repertoire projet pour le reconnecter.",
    "workspace.setupFirst": "Veuillez d'abord definir le repertoire du projet.",
    "workspace.reconnectUnavailable": "La connexion au repertoire du projet est indisponible. Cliquez sur Connecter le repertoire projet pour le reconnecter.",
    "workspace.reconnectExpired": "La connexion au repertoire du projet a expire. Cliquez a nouveau sur Synchroniser ou Connecter le repertoire projet.",
    "workspace.switchPrompt": "Saisissez le chemin absolu du repertoire projet",
    "workspace.switchPlaceholder": "D:\\Projet",
    "workspace.switchEmpty": "Le repertoire du projet ne peut pas etre vide.",
    "workspace.switchDone": "Repertoire du projet change : {path}",
    "workspace.switchFailed": "Echec du changement de repertoire projet : {message}",
    "workspace.switchHttpFailed": "Echec du changement de repertoire projet (HTTP {status})",
    "dialog.aiBuild.modelRequired": "Veuillez saisir un nom de modele.",
    "dialog.aiBuild.promptRequired": "Veuillez saisir une demande de schema.",
    "dialog.scriptBuild.title": "Creation par SQL",
    "dialog.scriptBuild.desc": "Collez un script CREATE TABLE. Il sera analyse selon le type de base courant ({dbType}).",
    "dialog.scriptBuild.label": "Script DDL",
    "dialog.scriptBuild.placeholder": "Exemple :\nCREATE TABLE users (\n  id bigint PRIMARY KEY AUTO_INCREMENT,\n  username varchar(100) NOT NULL,\n  created_at datetime\n);",
    "dialog.scriptBuild.emptyHint": "La verification syntaxique demarre automatiquement apres saisie du SQL.",
    "dialog.scriptBuild.passed": "Verification syntaxique reussie.",
    "dialog.scriptBuild.lineCol": "Ligne {line}, colonne {column}",
    "dialog.scriptBuild.moreIssues": "{count} problemes supplementaires sont masques.",
    "dialog.scriptBuild.inputRequired": "Veuillez saisir un script CREATE TABLE.",
    "dialog.template.title": "Champs de modele globaux",
    "dialog.template.desc": "Ce modele est partage dans toute l'application. Il est edite selon les regles {dbType} puis converti automatiquement pour la base cible.",
    "dialog.template.addField": "Ajouter un champ",
    "dialog.template.save": "Enregistrer le modele",
    "dialog.template.keepOne": "Conservez au moins un champ dans le modele",
    "dialog.template.delete": "Supprimer",
    "dialog.codex.title": "Envoyer a Codex",
    "dialog.codex.lead": "Preparez le design courant dans le format le plus facile a reprendre pour Codex. Chaque action ecrit un fichier dbcraft-codex-handoff.md dans le projet courant.",
    "dialog.codex.modelTitle": "Enregistrer le fichier modele",
    "dialog.codex.modelDesc": "Enregistrez le modele courant en .dbmodel.json et copiez une instruction prete a envoyer a Codex.",
    "dialog.codex.sqlTitle": "Exporter SQL",
    "dialog.codex.sqlDesc": "Exportez le SQL du modele courant et copiez une instruction pour continuer depuis le SQL.",
    "dialog.codex.summaryTitle": "Copier le resume de structure",
    "dialog.codex.summaryDesc": "Transforme le modele courant en resume texte, ideal pour une conversation directe.",
    "dialog.codex.screenshotTitle": "Copier le texte pour capture",
    "dialog.codex.screenshotDesc": "Pratique si vous voulez envoyer une capture DB Craft avec une phrase standard.",
    "dialog.codex.speechTitle": "Copier le modele oral",
    "dialog.codex.speechDesc": "Inclut le resume du modele courant, pratique pour decrire la structure oralement.",
    "dialog.codex.tipOrder": "Ordre recommande : fichier modele > SQL > resume de structure > capture / resume oral.",
    "dialog.codex.tipContinue": "Apres ecriture du fichier de relais, vous pouvez dire a Codex « continue depuis le fichier de relais ».",
    "dialog.codex.tipFile": "Si le modele n'existe que dans le navigateur et n'est pas enregistre, Codex ne pourra pas le lire de facon fiable.",
    "dialog.codex.statusIdle": "Choisissez une methode pour commencer.",
    "dialog.codex.statusSavingModel": "Enregistrement du fichier modele...",
    "dialog.codex.statusModelUnsaved": "Le fichier modele n'a pas ete enregistre.",
    "dialog.codex.statusModelSavedCopied": "Modele enregistre : {modelPath} ; fichier de relais ecrit : {handoffPath} ; l'instruction a aussi ete copiee.",
    "dialog.codex.statusModelSaved": "Modele enregistre : {modelPath} ; fichier de relais ecrit : {handoffPath}.",
    "dialog.codex.statusExportingSql": "Export du SQL...",
    "dialog.codex.statusSqlNotExported": "Le SQL n'a pas ete exporte.",
    "dialog.codex.statusSqlExportedCopied": "SQL exporte : {sqlPath} ; fichier de relais ecrit : {handoffPath} ; l'instruction a aussi ete copiee.",
    "dialog.codex.statusSqlExported": "SQL exporte : {sqlPath} ; fichier de relais ecrit : {handoffPath}.",
    "dialog.codex.statusSummaryCopied": "Le resume de structure a ete ecrit dans : {handoffPath}, puis copie.",
    "dialog.codex.statusSummary": "Le resume de structure a ete ecrit dans : {handoffPath}.",
    "dialog.codex.statusScreenshotCopied": "Le texte de capture a ete ecrit dans : {handoffPath}, puis copie.",
    "dialog.codex.statusScreenshot": "Le texte de capture a ete ecrit dans : {handoffPath}.",
    "dialog.codex.statusSpeechCopied": "Le modele oral a ete ecrit dans : {handoffPath}, puis copie.",
    "dialog.codex.statusSpeech": "Le modele oral a ete ecrit dans : {handoffPath}.",
    "dialog.about.title": "A propos de DB Craft",
    "dialog.about.lead": "Outil local de conception de base de donnees pour la modelisation visuelle, la creation par script SQL, la generation IA, la verification syntaxique et l'export SQL.",
    "dialog.about.product": "Produit",
    "dialog.about.version": "Version",
    "dialog.about.supportedDb": "Bases supportees",
    "dialog.about.contact": "Contact",
    "dialog.about.license": "Licence",
    "dialog.about.copyright": "Droits d'auteur",
    "dialog.closeModel.title": "Fermer le modele",
    "dialog.closeModel.message": "Le modele « {name} » contient des modifications non enregistrees.",
    "dialog.closeModel.save": "Enregistrer et fermer",
    "dialog.closeModel.discard": "Fermer sans enregistrer",
    "alert.selectModelFirst": "Veuillez d'abord selectionner un modele.",
    "alert.noTableInModel": "Le modele courant ne contient aucune table.",
    "alert.noTableForFit": "Le modele courant ne contient aucune table a ajuster.",
    "alert.undoNone": "Aucune action a annuler.",
    "alert.undoFailed": "L'annulation a echoue.",
    "alert.redoNone": "Aucune action a retablir.",
    "alert.redoFailed": "Le retablissement a echoue.",
    "alert.copyEntityRequired": "Selectionnez d'abord une table ou une relation a copier.",
    "alert.deleteEntityRequired": "Selectionnez d'abord une table ou une relation a supprimer.",
    "alert.clipboardEmpty": "Le presse-papiers est vide.",
    "alert.relationPasteMissingTable": "Les tables necessaires a cette relation sont absentes du modele courant, le collage est impossible.",
    "alert.relationPasteFailed": "Le collage de la relation a echoue.",
    "alert.clipboardUnsupported": "Le contenu actuel du presse-papiers n'est pas pris en charge ici.",
    "dialog.clearAll.title": "Tout effacer",
    "dialog.clearAll.message": "Effacer toutes les tables et relations du modele « {name} » ?",
    "dialog.clearAll.confirm": "Effacer",
    "alert.workspacePermissionMissing": "L'autorisation de lecture/ecriture du repertoire n'a pas ete accordee, le repertoire du projet n'a donc pas pu etre defini.",
    "alert.workspacePickAborted": "La selection du repertoire projet n'a pas ete terminee. Si vous n'avez pas vu la fenetre de selection, verifiez si elle a ete placee derriere le navigateur ou une autre fenetre systeme puis recommencez.",
    "alert.workspaceSetFailed": "Echec de la definition du repertoire projet : {message}",
    "prompt.workspacePath": "Saisissez le chemin absolu du repertoire projet (par exemple C:\\Projects\\DBCraftDemo)",
    "prompt.modelName": "Saisissez un nom de modele",
    "prompt.modelNameFirstSave": "Saisissez un nom de modele pour le premier enregistrement",
    "prompt.modelRename": "Saisissez un nouveau nom de modele",
    "prompt.modelSaveAs": "Saisissez un nouveau nom pour Enregistrer sous",
    "alert.modelNameRequired": "Le nom du modele ne peut pas etre vide.",
    "dialog.saveModel.title": "Enregistrer le modele",
    "dialog.saveModel.sameName": "Un modele nomme « {name} » existe deja dans le repertoire.",
    "dialog.saveModel.overwrite": "Ecraser",
    "dialog.saveModel.rename": "Renommer",
    "dialog.saveModel.fileExists": "Le fichier « {fileName} » existe deja. Voulez-vous l'ecraser ?",
    "alert.modelSaveFailed": "Echec de l'enregistrement du modele : {message}",
    "log.modelAutoSaveFailed": "Echec de la sauvegarde automatique du modele :",
    "dialog.saveAs.title": "Enregistrer le modele sous",
    "dialog.saveAs.sameName": "Un modele nomme « {name} » existe deja dans le repertoire.",
    "alert.modelOpenConflict": "Le fichier modele cible est deja ouvert dans cette application. Fermez-le d'abord ou utilisez un autre nom pour Enregistrer sous.",
    "alert.modelSaveAsFailed": "Echec de l'enregistrement sous : {message}",
    "alert.deleteModelFileFailed": "Echec de la suppression du fichier modele : {message}",
    "dialog.deleteModel.title": "Supprimer le modele",
    "dialog.deleteModel.dirty": "Le modele « {name} » contient des modifications non enregistrees. La suppression le retirera de la liste et supprimera aussi le fichier enregistre.",
    "dialog.deleteModel.saveDelete": "Enregistrer puis supprimer",
    "dialog.deleteModel.deleteDirect": "Supprimer directement",
    "dialog.deleteModel.confirm": "Supprimer le modele « {name} » ? Son fichier enregistre sera egalement supprime.",
    "dialog.deleteModel.delete": "Supprimer",
    "alert.openModelNone": "Aucun fichier modele (*.dbmodel.json) n'est disponible dans le repertoire projet courant.",
    "alert.openModelAllOpened": "Tous les modeles du projet courant sont deja ouverts.",
    "dialog.openModel.openedTitle": "Modele deja ouvert",
    "dialog.openModel.openedMessage": "Le modele « {name} » est deja ouvert sur cette page. Recharger la version la plus recente depuis le projet ?",
    "dialog.openModel.reload": "Recharger",
    "alert.openModelFailed": "Echec de l'ouverture du modele : {message}",
    "alert.syntaxNoTable": "Aucune table a verifier dans le modele courant.",
    "alert.syntaxIssues": "La verification du modele a trouve {issueCount} problemes sur {tableCount} tables.\n{summary}",
    "alert.syntaxPassed": "Verification reussie. {tableCount} tables ont ete controlees.",
    "alert.aiSavedConfig": "La configuration IA a ete enregistree.",
    "alert.aiKeyCleared": "La cle API a ete effacee.",
    "alert.aiNoTables": "La reponse IA ne contient aucune definition de table importable.",
    "alert.aiInvalidResponse": "Le format de la reponse IA est invalide, car la liste tables est absente.",
    "alert.requestFailedHttp": "La requete a echoue (HTTP {status})",
    "alert.aiHandoffWrittenCopied": "Le fichier de relais a ete ecrit dans : {path}, et la consigne pour Codex a ete copiee. Ensuite, vous pouvez dire « continue depuis le fichier de relais » ou coller le texte copie dans Codex.",
    "alert.aiHandoffWritten": "Le fichier de relais a ete ecrit dans : {path}. Pour continuer tout de suite, dites « continue depuis le fichier de relais ».",
    "alert.aiBuildDoneWarning": "Creation IA terminee : {count} tables ajoutees.\nNote : {warning}",
    "alert.aiBuildDone": "Creation IA terminee : {count} tables ajoutees.",
    "dialog.aiMissingKey.title": "Cle API non configuree",
    "dialog.aiMissingKey.message": "La creation IA de tables requiert actuellement une cle API. Voulez-vous plutot preparer un relais vers Codex ? Cela ne generera pas de table directement dans le concepteur.",
    "dialog.aiMissingKey.toCodex": "Envoyer a Codex",
    "alert.aiBuildFailed": "Echec de la creation IA : {message}",
    "alert.scriptBuildDone": "Creation par SQL terminee : {count} tables ajoutees.",
    "alert.scriptBuildFailed": "Echec de la creation par SQL : {message}",
    "dialog.exportSql.title": "Exporter SQL",
    "dialog.exportSql.withFk": "Creer les contraintes de cle etrangere ?",
    "dialog.exportSql.withoutFk": "Non (par defaut)",
    "dialog.exportSql.yes": "Oui",
    "prompt.exportSqlFile": "Saisissez le nom du fichier SQL a exporter",
    "alert.fileNameRequired": "Le nom du fichier ne peut pas etre vide.",
    "prompt.exportSqlFileRetry": "Le nom du fichier ne peut pas etre vide. Saisissez un nouveau nom de fichier SQL",
    "dialog.exportSql.overwriteMessage": "Le fichier « {fileName} » existe deja. Voulez-vous l'ecraser ?",
    "dialog.exportSql.overwrite": "Ecraser l'export",
    "prompt.exportSqlRename": "Saisissez un nouveau nom de fichier SQL",
    "alert.exportSqlSuccess": "Export termine : {path}",
    "alert.exportSqlFailed": "Echec de l'export SQL : {message}",
    "alert.syncSkippedBySyntax": "Modele enregistre dans : {path}\nMais la verification syntaxique a echoue, le SQL n'a donc pas ete synchronise.",
    "alert.syncSqlFailed": "Modele enregistre dans : {path}\nMais la synchronisation SQL a echoue : {message}",
    "prompt.exportImageFile": "Saisissez le nom du fichier image a exporter",
    "prompt.exportImageFileRetry": "Le nom du fichier ne peut pas etre vide. Saisissez un nouveau nom de fichier image",
    "dialog.exportImage.title": "Enregistrer en image",
    "prompt.exportImageRename": "Saisissez un nouveau nom de fichier image",
    "alert.exportImageSuccess": "Image exportee : {path}",
    "alert.exportImageFailed": "Echec de l'export de l'image : {message}",
    "alert.exportImageNoBounds": "Le modele courant ne contient aucune zone de table exportable.",
    "alert.exportDirUnsupported": "Ce navigateur ne prend pas en charge l'export de repertoire. Utilisez la derniere version de Chrome ou Edge avec http(s) ou localhost.",
    "alert.exportDirPermissionDenied": "L'autorisation de lecture/ecriture du repertoire n'a pas ete accordee, le SQL ne peut donc pas etre exporte.",
    "alert.exportDirPickFailed": "Echec du choix du repertoire d'export : {message}",
    "error.modelFileNameRequired": "Le nom du fichier modele ne peut pas etre vide.",
    "error.workspacePermissionDenied": "L'autorisation de lecture/ecriture du repertoire n'a pas ete accordee.",
    "error.canvasUnsupported": "L'export Canvas n'est pas pris en charge par ce navigateur.",
    "error.sqlSyntax": "Erreur de syntaxe SQL.",
    "error.sqlNoCreateTable": "Aucune instruction CREATE TABLE exploitable n'a ete detectee.",
    "alert.noModelClosable": "Aucun modele a fermer pour le moment.",
    "alert.noModelDeletable": "Aucun modele a supprimer pour le moment.",
    "relation.createWarning": "La relation a ete creee, mais la cle etrangere n'a pas ete ajoutee automatiquement : {message}",
    "relation.updateWarning": "Le type de relation a ete mis a jour, mais la cle etrangere n'a pas ete ajoutee automatiquement : {message}",
    "relation.manyToManyHint": "Les relations plusieurs-a-plusieurs doivent passer par une table intermediaire. Scindez-les en deux relations un-a-plusieurs.",
    "relation.dragHint": "Faire glisser pour creer une relation",
    "relation.error.invalidType": "Le type de relation est invalide, la cle etrangere ne peut pas etre creee.",
    "relation.error.missingPk": "Aucun des deux cotes de la relation ne definit de cle primaire, la cle etrangere ne peut donc pas etre creee.",
    "relation.error.missingFieldMapping": "La table « {table} » ne contient pas le champ mappe « {field} », la cle etrangere ne peut donc pas etre creee.",
    "relation.error.bridgeRequired": "Une relation plusieurs-a-plusieurs doit passer par une table intermediaire. Creez d'abord cette table puis definissez deux relations un-a-plusieurs.",
    "relation.error.duplicate": "Cette relation existe deja.",
    "relation.error.targetMissing": "Echec de la creation de la relation : la table cible est introuvable.",
  },
};

const MENU_ACTION_TRANSLATION_KEYS = {
  "file-new-mysql8": "action.file-new-mysql8",
  "file-new-postgresql14": "action.file-new-postgresql14",
  "file-new-sqlite": "action.file-new-sqlite",
  "file-new-mssql": "action.file-new-mssql",
  "file-open": "action.file-open",
  "file-save": "action.file-save",
  "file-sync-workspace": "action.file-sync-workspace",
  "file-save-as": "action.file-save-as",
  "file-close": "action.file-close",
  "edit-undo": "action.edit-undo",
  "edit-redo": "action.edit-redo",
  "edit-clear-all": "action.edit-clear-all",
  "edit-cut": "action.edit-cut",
  "edit-copy": "action.edit-copy",
  "edit-paste": "action.edit-paste",
  "edit-clone": "action.edit-clone",
  "edit-delete": "action.edit-delete",
  "model-template": "action.model-template",
  "model-delete": "action.model-delete",
  "model-add-table": "action.model-add-table",
  "model-ai-table": "action.model-ai-table",
  "model-script-table": "action.model-script-table",
  "model-syntax-check": "action.model-syntax-check",
  "model-auto-layout": "action.model-auto-layout",
  "model-fit-view": "action.model-fit-view",
  "model-export-image": "action.model-export-image",
  "model-export-sql": "action.model-export-sql",
  "model-table": "action.model-table",
  "settings-workspace": "action.settings-workspace",
  "settings-workspace-path": "action.settings-workspace-path",
  "settings-table-view": "action.settings-table-view",
  "settings-ai-config": "action.settings-ai-config",
  "help-codex": "action.help-codex",
  "help-help": "action.help-help",
  "help-about": "action.help-about",
};

const MENU_ACTION_ICONS = {
  "file-new-mysql8": "①",
  "file-new-postgresql14": "②",
  "file-new-sqlite": "③",
  "file-new-mssql": "④",
  "file-open": "📂",
  "file-save": "💾",
  "file-sync-workspace": "⇄",
  "file-save-as": "🗂",
  "file-close": "✖",
  "edit-undo": "↶",
  "edit-redo": "↷",
  "edit-clear-all": "⌧",
  "edit-cut": "✂",
  "edit-copy": "⧉",
  "edit-paste": "📋",
  "edit-clone": "⎘",
  "edit-delete": "🗑",
  "model-template": "▤",
  "model-delete": "🗑",
  "model-add-table": "▦+",
  "model-ai-table": "AI",
  "model-script-table": "SQL",
  "model-syntax-check": "✓",
  "model-auto-layout": "≋",
  "model-fit-view": "⛶",
  "model-export-image": "🖼",
  "model-export-sql": "⤓",
  "model-table": "▦",
  "settings-workspace": "📁",
  "settings-workspace-path": "📍",
  "settings-table-view": "▣",
  "settings-ai-config": "🔑",
  "help-codex": "C",
  "help-help": "?",
  "help-about": "i",
};

let currentLanguage = readLanguagePreference();
let tableCardViewMode = readTableCardViewMode();

function readLanguagePreference() {
  try {
    const raw = String(localStorage.getItem(LANGUAGE_STORAGE_KEY) || "").trim();
    if (SUPPORTED_LANGUAGES.includes(raw)) return raw;
  } catch {
    // Ignore storage failures.
  }
  return DEFAULT_LANGUAGE;
}

function readTableCardViewMode() {
  try {
    const raw = String(localStorage.getItem(TABLE_CARD_VIEW_MODE_KEY) || "").trim().toLowerCase();
    if (raw === "header" || raw === "full") return raw;
  } catch {
    // Ignore storage failures.
  }
  return "full";
}

function persistTableCardViewMode(mode) {
  try {
    localStorage.setItem(TABLE_CARD_VIEW_MODE_KEY, mode);
  } catch {
    // Ignore storage failures.
  }
}

function persistLanguagePreference(language) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Ignore storage failures.
  }
}

function t(key) {
  const dict = I18N[currentLanguage] || I18N[DEFAULT_LANGUAGE];
  if (dict && Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
  const fallback = I18N[DEFAULT_LANGUAGE] || {};
  if (Object.prototype.hasOwnProperty.call(fallback, key)) return fallback[key];
  return key;
}

function tr(key, vars = {}) {
  let text = String(t(key) || "");
  Object.entries(vars || {}).forEach(([name, value]) => {
    text = text.split(`{${name}}`).join(String(value ?? ""));
  });
  return text;
}

function getInspectorTabLabel(tabKey) {
  if (tabKey === "basic") return t("inspector.tab.basic");
  if (tabKey === "fields") return t("inspector.tab.fields");
  if (tabKey === "indexes") return t("inspector.tab.indexes");
  if (tabKey === "script") return t("inspector.tab.script");
  return tabKey;
}

function buildRelationCardinalityOptionsHtml(selectedValue) {
  const safeValue = normalizeRelationCardinality(selectedValue || "1:N");
  const options = [
    { value: "1:N", label: t("relation.cardinality.1N") },
    { value: "N:1", label: t("relation.cardinality.N1") },
    { value: "N:N", label: t("relation.cardinality.NN") },
  ];
  return options
    .map((item) => `<option value="${item.value}" ${item.value === safeValue ? "selected" : ""}>${escapeHtml(item.label)}</option>`)
    .join("");
}

function updateLocalizedActionLabels() {
  Object.entries(MENU_ACTION_TRANSLATION_KEYS).forEach(([action, key]) => {
    const text = action === "settings-workspace" ? getWorkspaceSettingsMenuLabel() : t(key);
    document.querySelectorAll(`[data-menu-action="${action}"]`).forEach((button) => {
      if (button.classList.contains("with-label")) {
        const toolName = button.querySelector(".tool-icon-name");
        if (toolName) toolName.textContent = text;
        return;
      }

      if (button.closest(".menu-panel")) {
        const directSpans = button.querySelectorAll(":scope > span");
        const labelSpan = directSpans.length > 0 ? directSpans[0] : null;
        if (labelSpan) {
          const icon = MENU_ACTION_ICONS[action] || "";
          if (icon) {
            labelSpan.innerHTML = `<span class="menu-item-icon" aria-hidden="true">${escapeHtml(icon)}</span><span class="menu-item-text">${escapeHtml(text)}</span>`;
          } else {
            labelSpan.innerHTML = `<span class="menu-item-text">${escapeHtml(text)}</span>`;
          }
        }
      }
    });
  });

  document.querySelectorAll('[data-menu-action="settings-workspace-path"]').forEach((button) => {
    button.hidden = canUseServerWorkspaceBridge();
  });
}

function setButtonTooltip(button, label, shortcut = "") {
  if (!button) return;
  const fullTitle = shortcut ? `${label} (${shortcut})` : label;
  button.title = fullTitle;
  button.setAttribute("aria-label", label);
}

function applyLanguageToUi() {
  document.documentElement.lang = currentLanguage;
  if (brandSubtitle) brandSubtitle.textContent = t("brand.subtitle");
  const languageLabel = document.querySelector(".language-switch label");
  if (languageLabel) languageLabel.textContent = t("ui.language");
  if (languageSelect) languageSelect.value = currentLanguage;
  if (menuBar) {
    menuBar.setAttribute("aria-label", t("menu.main"));
    const triggerTexts = [t("menu.file"), t("menu.edit"), t("menu.model"), t("menu.settings"), t("menu.help")];
    menuBar.querySelectorAll(".menu-trigger").forEach((button, index) => {
      if (triggerTexts[index]) button.textContent = triggerTexts[index];
    });
  }
  updateLocalizedActionLabels();
  const toolbarGroups = toolbarQuickActions ? Array.from(toolbarQuickActions.querySelectorAll(".toolbar-group")) : [];
  if (toolbarGroups[0]) toolbarGroups[0].title = t("menu.file");
  if (toolbarGroups[1]) toolbarGroups[1].title = t("menu.model");
  if (toolbarGroups[2]) toolbarGroups[2].title = t("action.help-codex");
  if (toolbarGroups[3]) toolbarGroups[3].title = `${t("menu.settings")} / ${t("menu.help")}`;
  if (toolbarGroups[4]) toolbarGroups[4].title = t("toolbar.layoutGroup");

  if (sidebarTitle) sidebarTitle.textContent = t("sidebar.title");
  if (sidebarDesc) sidebarDesc.textContent = t("sidebar.desc");
  if (modelNameInput) modelNameInput.placeholder = t("modelForm.placeholder");
  if (createModelBtn) createModelBtn.textContent = t("modelForm.create");

  if (addTableButton) {
    const node = addTableButton.querySelector(".tool-icon-name");
    if (node) node.textContent = t("toolbar.addTable");
  }
  if (templateTableBtn) {
    const node = templateTableBtn.querySelector(".tool-icon-name");
    if (node) node.textContent = t("toolbar.template");
  }
  if (exportSqlBtn) {
    const node = exportSqlBtn.querySelector(".tool-icon-name");
    if (node) node.textContent = t("toolbar.export");
  }
  if (deleteModelBtn) {
    const node = deleteModelBtn.querySelector(".tool-icon-name");
    if (node) node.textContent = t("toolbar.deleteModel");
  }
  if (setWorkspaceBtn) {
    const node = setWorkspaceBtn.querySelector(".tool-icon-name");
    if (node) node.textContent = getWorkspaceToolbarLabel();
  }
  if (topWorkspaceBtn) {
    topWorkspaceBtn.textContent = getWorkspaceActionLabel();
  }
  if (syncModelBtn) {
    const node = syncModelBtn.querySelector(".tool-icon-name");
    if (node) node.textContent = getSyncToolbarLabel();
    syncModelBtn.classList.toggle("tool-icon-btn-primary", !isWorkspaceConnected());
  }
  if (setWorkspacePathBtn) {
    const node = setWorkspacePathBtn.querySelector(".tool-icon-name");
    if (node) node.textContent = t("toolbar.pathHint");
  }
  const fitToolBtn = toolbarQuickActions?.querySelector('[data-menu-action="model-fit-view"] .tool-icon-name');
  if (fitToolBtn) fitToolBtn.textContent = t("toolbar.fit");
  setButtonTooltip(openModelBtn, t("action.file-open"), "Ctrl+O");
  setButtonTooltip(saveModelBtn, t("action.file-save"), "Ctrl+S");
  setButtonTooltip(syncModelBtn, getSyncActionLabel(), "Ctrl+Alt+S");
  setButtonTooltip(saveAsModelBtn, t("action.file-save-as"), "Ctrl+Shift+S");
  setButtonTooltip(closeModelBtn, t("action.file-close"), "Ctrl+Alt+W");
  setButtonTooltip(templateTableBtn, t("action.model-template"), "Alt+T");
  setButtonTooltip(addTableButton, t("action.model-add-table"), "Alt+A");
  setButtonTooltip(exportSqlBtn, t("action.model-export-sql"), "Ctrl+Alt+E");
  setButtonTooltip(deleteModelBtn, t("action.model-delete"), "Alt+Shift+D");
  setButtonTooltip(setWorkspaceBtn, getWorkspaceSettingsMenuLabel(), "Alt+W");
  setButtonTooltip(topWorkspaceBtn, getWorkspaceActionLabel());
  setButtonTooltip(setWorkspacePathBtn, t("action.settings-workspace-path"), "Alt+P");
  setButtonTooltip(handoffCodexBtn, t("action.help-codex"), "Ctrl+Alt+C");
  setButtonTooltip(toolbarQuickActions?.querySelector('[data-menu-action="model-ai-table"]'), t("action.model-ai-table"), "Alt+L");
  setButtonTooltip(toolbarQuickActions?.querySelector('[data-menu-action="model-script-table"]'), t("action.model-script-table"), "Alt+J");
  setButtonTooltip(toolbarQuickActions?.querySelector('[data-menu-action="model-syntax-check"]'), t("action.model-syntax-check"), "Alt+Q");
  setButtonTooltip(toolbarQuickActions?.querySelector('[data-menu-action="model-auto-layout"]'), t("action.model-auto-layout"), "Alt+R");
  setButtonTooltip(toolbarQuickActions?.querySelector('[data-menu-action="settings-ai-config"]'), t("action.settings-ai-config"), "Alt+K");
  setButtonTooltip(toolbarQuickActions?.querySelector('[data-menu-action="help-help"]'), t("action.help-help"), "F1");
  setButtonTooltip(toolbarQuickActions?.querySelector('[data-menu-action="model-fit-view"]'), t("action.model-fit-view"), "Ctrl+0");
  setButtonTooltip(toggleSidebarBtn, state.sidebarCollapsed ? t("toggle.showSidebar") : t("toggle.hideSidebar"));
  setButtonTooltip(toggleInspectorBtn, state.inspectorCollapsed ? t("toggle.showInspector") : t("toggle.hideInspector"));
  setButtonTooltip(topToggleBtn, state.topCollapsed ? t("toggle.expandTop") : t("toggle.collapseTop"));

  if (zoomOutBtn) setButtonTooltip(zoomOutBtn, t("zoom.out"));
  if (zoomInBtn) setButtonTooltip(zoomInBtn, t("zoom.in"));
  if (zoomResetBtn) setButtonTooltip(zoomResetBtn, t("zoom.reset"));
  if (zoomFitBtn) {
    setButtonTooltip(zoomFitBtn, t("zoom.fit"));
    zoomFitBtn.textContent = t("zoom.fitShort");
  }
  if (workspaceGuideDismissBtn) workspaceGuideDismissBtn.setAttribute("aria-label", t("guide.workspace.dismissLabel"));
  if (sidebarResizer) sidebarResizer.title = t("layout.sidebarResize");
  if (inspectorResizer) inspectorResizer.title = t("layout.inspectorResize");

  updateToolbar();
  renderModelList();
}

function setLanguage(language, persist = true) {
  const safeLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
  currentLanguage = safeLanguage;
  if (persist) {
    persistLanguagePreference(safeLanguage);
  }
  applyLanguageToUi();
}

function shouldSyncCommentWithFieldName(currentComment, previousName) {
  const commentText = typeof currentComment === "string" ? currentComment.trim() : "";
  const previousText = typeof previousName === "string" ? previousName.trim() : "";
  return !commentText || commentText === previousText;
}

function readPreferredAiModel() {
  try {
    const raw = localStorage.getItem(AI_MODEL_STORAGE_KEY) || "";
    return String(raw || "").trim() || AI_MODEL_DEFAULT;
  } catch {
    return AI_MODEL_DEFAULT;
  }
}

function savePreferredAiModel(modelName) {
  try {
    localStorage.setItem(AI_MODEL_STORAGE_KEY, String(modelName || "").trim() || AI_MODEL_DEFAULT);
  } catch {
    // Ignore storage failures.
  }
}

function readStoredAiApiKey() {
  try {
    return String(localStorage.getItem(AI_API_KEY_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

function saveStoredAiApiKey(apiKey) {
  try {
    const safeKey = String(apiKey || "").trim();
    if (!safeKey) {
      localStorage.removeItem(AI_API_KEY_STORAGE_KEY);
      return;
    }
    localStorage.setItem(AI_API_KEY_STORAGE_KEY, safeKey);
  } catch {
    // Ignore storage failures.
  }
}

function readStoredAiBaseUrl() {
  try {
    return String(localStorage.getItem(AI_BASE_URL_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

function saveStoredAiBaseUrl(baseUrl) {
  try {
    const safeUrl = String(baseUrl || "").trim();
    if (!safeUrl) {
      localStorage.removeItem(AI_BASE_URL_STORAGE_KEY);
      return;
    }
    localStorage.setItem(AI_BASE_URL_STORAGE_KEY, safeUrl);
  } catch {
    // Ignore storage failures.
  }
}

function getAiModelPresetByKey(key) {
  const safeKey = String(key || "").trim().toLowerCase();
  return AI_MODEL_PRESETS.find((item) => item.key.toLowerCase() === safeKey) || null;
}

function getAiModelPresetByModelName(modelName) {
  const safeModel = String(modelName || "").trim().toLowerCase();
  return AI_MODEL_PRESETS.find((item) => item.model.toLowerCase() === safeModel) || null;
}

function getAiModelPresetLabel(preset) {
  if (!preset) return "";
  const translated = t(`ai.preset.${preset.key}`);
  return translated && translated !== `ai.preset.${preset.key}` ? translated : preset.label;
}

function buildAiModelPresetOptions(selectedModelName) {
  const matchedPreset = getAiModelPresetByModelName(selectedModelName);
  const selectedKey = matchedPreset ? matchedPreset.key : AI_MODEL_PRESET_CUSTOM;
  const options = [
    `<option value="${AI_MODEL_PRESET_CUSTOM}" ${selectedKey === AI_MODEL_PRESET_CUSTOM ? "selected" : ""}>${escapeHtml(t("ai.preset.custom"))}</option>`,
  ];
  AI_MODEL_PRESETS.forEach((preset) => {
    options.push(
      `<option value="${escapeHtml(preset.key)}" ${selectedKey === preset.key ? "selected" : ""}>${escapeHtml(getAiModelPresetLabel(preset))}</option>`,
    );
  });
  return options.join("");
}

function bindAiModelPresetControl({ selectEl, inputEl, baseUrlInputEl = null }) {
  if (!selectEl || !inputEl) return;

  let lastPresetKey = selectEl.value;
  const syncSelectFromInput = () => {
    const preset = getAiModelPresetByModelName(inputEl.value);
    selectEl.value = preset ? preset.key : AI_MODEL_PRESET_CUSTOM;
    lastPresetKey = selectEl.value;
  };

  selectEl.addEventListener("change", () => {
    const key = String(selectEl.value || "");
    if (key === AI_MODEL_PRESET_CUSTOM) {
      lastPresetKey = key;
      inputEl.focus();
      inputEl.select?.();
      return;
    }

    const preset = getAiModelPresetByKey(key);
    if (!preset) return;
    inputEl.value = preset.model;

    if (baseUrlInputEl) {
      const previousPreset = getAiModelPresetByKey(lastPresetKey);
      const currentBaseUrl = String(baseUrlInputEl.value || "").trim();
      const shouldReplaceBaseUrl =
        !currentBaseUrl ||
        (previousPreset && currentBaseUrl === previousPreset.baseUrl) ||
        currentBaseUrl === resolveAiBaseUrlForModel(inputEl.value);
      if (shouldReplaceBaseUrl) {
        baseUrlInputEl.value = preset.baseUrl || "";
      }
    }

    lastPresetKey = key;
  });

  inputEl.addEventListener("input", syncSelectFromInput);
}

function resolveAiBaseUrlForModel(modelName) {
  const configured = readStoredAiBaseUrl();
  if (configured) return configured;
  const safeModel = String(modelName || "").trim().toLowerCase();
  if (safeModel.startsWith("kimi-") || safeModel.startsWith("moonshot-")) {
    return "https://api.moonshot.cn/v1";
  }
  if (safeModel.startsWith("deepseek-")) {
    return "https://api.deepseek.com/v1";
  }
  if (safeModel.startsWith("qwen")) {
    return "https://dashscope.aliyuncs.com/compatible-mode/v1";
  }
  return "";
}

function toTextOrEmpty(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

async function openAiConfigDialog() {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "app-dialog-backdrop";
    const dialog = document.createElement("div");
    dialog.className = "app-dialog app-dialog-wide ai-builder-dialog";
    dialog.innerHTML = `
      <h3>${escapeHtml(t("ai.config.title"))}</h3>
      <p>${escapeHtml(t("ai.config.desc"))}</p>
      <div class="ai-builder-form">
        <label>
          ${escapeHtml(t("ai.config.preset"))}
          <select id="aiConfigModelPresetSelect">${buildAiModelPresetOptions(readPreferredAiModel())}</select>
        </label>
        <label>
          ${escapeHtml(t("ai.config.modelName"))}
          <input id="aiConfigModelInput" name="dbcraft-ai-model" autocomplete="off" autocapitalize="off" spellcheck="false" value="${escapeHtml(readPreferredAiModel())}" placeholder="${escapeHtml(t("ai.config.modelPlaceholder"))}" />
        </label>
        <label>
          ${escapeHtml(t("ai.config.baseUrl"))}
          <input id="aiConfigBaseUrlInput" name="dbcraft-ai-base-url" autocomplete="off" autocapitalize="off" spellcheck="false" value="${escapeHtml(readStoredAiBaseUrl())}" placeholder="${escapeHtml(t("ai.config.baseUrlPlaceholder"))}" />
        </label>
        <label>
          ${escapeHtml(t("ai.config.apiKey"))}
          <input id="aiConfigKeyInput" name="dbcraft-ai-key" type="password" autocomplete="new-password" data-lpignore="true" data-1p-ignore="true" autocapitalize="off" spellcheck="false" value="${escapeHtml(readStoredAiApiKey())}" placeholder="${escapeHtml(t("ai.config.apiKeyPlaceholder"))}" />
        </label>
      </div>
      <div class="app-dialog-actions">
        <button type="button" class="app-dialog-btn ghost" id="aiConfigCancelBtn">${escapeHtml(t("ai.config.cancel"))}</button>
        <button type="button" class="app-dialog-btn ghost" id="aiConfigClearBtn">${escapeHtml(t("ai.config.clearKey"))}</button>
        <button type="button" class="app-dialog-btn primary" id="aiConfigSaveBtn">${escapeHtml(t("ai.config.save"))}</button>
      </div>
    `;

    const modelPresetSelect = dialog.querySelector("#aiConfigModelPresetSelect");
    const modelInput = dialog.querySelector("#aiConfigModelInput");
    const baseUrlInput = dialog.querySelector("#aiConfigBaseUrlInput");
    const keyInput = dialog.querySelector("#aiConfigKeyInput");
    const cancelBtn = dialog.querySelector("#aiConfigCancelBtn");
    const clearBtn = dialog.querySelector("#aiConfigClearBtn");
    const saveBtn = dialog.querySelector("#aiConfigSaveBtn");
    const storedModelName = readPreferredAiModel();
    const storedBaseUrl = readStoredAiBaseUrl();
    const storedApiKey = readStoredAiApiKey();

    const cleanup = () => {
      document.removeEventListener("keydown", onKeydown);
      backdrop.remove();
    };
    const close = (value) => {
      cleanup();
      resolve(value);
    };
    const saveConfig = () => {
      const modelName = String(modelInput.value || "").trim() || AI_MODEL_DEFAULT;
      const baseUrl = String(baseUrlInput.value || "").trim();
      const apiKey = String(keyInput.value || "").trim();
      savePreferredAiModel(modelName);
      saveStoredAiBaseUrl(baseUrl);
      saveStoredAiApiKey(apiKey);
      close("saved");
    };
    const clearKey = () => {
      baseUrlInput.value = "";
      keyInput.value = "";
      saveStoredAiBaseUrl("");
      saveStoredAiApiKey("");
      close("cleared");
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") {
        close("cancel");
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        saveConfig();
      }
    };

    const normalizeFields = () => {
      modelInput.value = storedModelName || AI_MODEL_DEFAULT;
      baseUrlInput.value = storedBaseUrl;
      keyInput.value = storedApiKey;
    };

    cancelBtn.addEventListener("click", () => close("cancel"));
    clearBtn.addEventListener("click", clearKey);
    saveBtn.addEventListener("click", saveConfig);
    bindAiModelPresetControl({
      selectEl: modelPresetSelect,
      inputEl: modelInput,
      baseUrlInputEl: baseUrlInput,
    });
    requestAnimationFrame(normalizeFields);
    setTimeout(normalizeFields, 120);
    setTimeout(normalizeFields, 400);
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) close("cancel");
    });
    document.addEventListener("keydown", onKeydown);

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
    modelInput.focus();
  });
}

async function configureTableCardViewMode() {
  const choice = await showChoiceDialog({
    title: t("tableView.title"),
    message: t("tableView.message"),
    actions: [
      { value: "full", label: t("tableView.optionFull"), className: tableCardViewMode === "full" ? "primary" : "ghost" },
      { value: "header", label: t("tableView.optionHeader"), className: tableCardViewMode === "header" ? "primary" : "ghost" },
      { value: "cancel", label: t("common.cancel"), className: "ghost", role: "cancel" },
    ],
  });
  if (choice !== "full" && choice !== "header") return false;
  if (choice === tableCardViewMode) return false;
  tableCardViewMode = choice;
  persistTableCardViewMode(choice);
  renderWorkspace();
  return true;
}

function readSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function readSidebarWidth() {
  try {
    const raw = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
    if (!Number.isFinite(raw)) return SIDEBAR_DEFAULT_WIDTH;
    return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, raw));
  } catch {
    return SIDEBAR_DEFAULT_WIDTH;
  }
}

function persistSidebarState(width, collapsed) {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(Math.round(width)));
  } catch {
    // Ignore storage failures.
  }
}

function updateSidebarToggleButton(collapsed) {
  if (!toggleSidebarBtn) return;
  const label = collapsed ? t("toggle.showSidebar") : t("toggle.hideSidebar");
  toggleSidebarBtn.title = label;
  toggleSidebarBtn.setAttribute("aria-label", label);
  toggleSidebarBtn.classList.toggle("active", !collapsed);
}

function applySidebarWidth(width) {
  const safeWidth = Math.max(0, Math.min(SIDEBAR_MAX_WIDTH, Math.round(width)));
  document.documentElement.style.setProperty("--sidebar-width", `${safeWidth}px`);
  const collapsed = safeWidth <= 0;
  if (appShell) {
    appShell.classList.toggle("sidebar-collapsed", collapsed);
  }
  if (safeWidth >= SIDEBAR_MIN_WIDTH) {
    sidebarLastWidth = safeWidth;
  }
  updateSidebarToggleButton(collapsed);
  return { width: safeWidth, collapsed };
}

function getAppliedSidebarWidth() {
  const cssValue = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sidebar-width"));
  if (!Number.isFinite(cssValue)) return SIDEBAR_DEFAULT_WIDTH;
  return cssValue;
}

function setSidebarCollapsed(collapsed, persist = true) {
  const targetWidth = collapsed ? 0 : sidebarLastWidth;
  const result = applySidebarWidth(targetWidth);
  if (persist) {
    persistSidebarState(result.width, result.collapsed);
  }
}

function initializeSidebarLayout() {
  sidebarLastWidth = readSidebarWidth();
  if (readSidebarCollapsed()) {
    applySidebarWidth(0);
    return;
  }
  applySidebarWidth(sidebarLastWidth);
}

function readInspectorCollapsed() {
  try {
    return localStorage.getItem(INSPECTOR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function readInspectorWidth() {
  try {
    const raw = Number(localStorage.getItem(INSPECTOR_WIDTH_KEY));
    if (!Number.isFinite(raw)) return INSPECTOR_DEFAULT_WIDTH;
    return Math.max(INSPECTOR_MIN_WIDTH, Math.min(INSPECTOR_MAX_WIDTH, raw));
  } catch {
    return INSPECTOR_DEFAULT_WIDTH;
  }
}

function persistInspectorState(width, collapsed) {
  try {
    localStorage.setItem(INSPECTOR_COLLAPSED_KEY, collapsed ? "1" : "0");
    localStorage.setItem(INSPECTOR_WIDTH_KEY, String(Math.round(width)));
  } catch {
    // Ignore storage failures.
  }
}

function updateInspectorToggleButton(collapsed) {
  if (!toggleInspectorBtn) return;
  const label = collapsed ? t("toggle.showInspector") : t("toggle.hideInspector");
  toggleInspectorBtn.title = label;
  toggleInspectorBtn.setAttribute("aria-label", label);
  toggleInspectorBtn.classList.toggle("active", !collapsed);
}

function applyInspectorWidth(width) {
  const safeWidth = Math.max(0, Math.min(INSPECTOR_MAX_WIDTH, Math.round(width)));
  document.documentElement.style.setProperty("--inspector-width", `${safeWidth}px`);
  const collapsed = safeWidth <= 0;
  if (workspaceShell) {
    workspaceShell.classList.toggle("inspector-collapsed", collapsed);
  }
  if (safeWidth >= INSPECTOR_MIN_WIDTH) {
    inspectorLastWidth = safeWidth;
  }
  updateInspectorToggleButton(collapsed);
  return { width: safeWidth, collapsed };
}

function getAppliedInspectorWidth() {
  const cssValue = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--inspector-width"));
  if (!Number.isFinite(cssValue)) return INSPECTOR_DEFAULT_WIDTH;
  return cssValue;
}

function setInspectorCollapsed(collapsed, persist = true) {
  const targetWidth = collapsed ? 0 : inspectorLastWidth;
  const result = applyInspectorWidth(targetWidth);
  if (persist) {
    persistInspectorState(result.width, result.collapsed);
  }
}

function initializeInspectorLayout() {
  inspectorLastWidth = readInspectorWidth();
  if (readInspectorCollapsed()) {
    applyInspectorWidth(0);
    return;
  }
  applyInspectorWidth(inspectorLastWidth);
}

function ensureInspectorVisible() {
  setInspectorCollapsed(false, false);
}

function readTopCollapsed() {
  try {
    return localStorage.getItem(TOP_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function persistTopCollapsed(collapsed) {
  try {
    localStorage.setItem(TOP_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    // Ignore storage failures.
  }
}

function updateTopToggleButton(collapsed) {
  if (!topToggleBtn) return;
  const label = collapsed ? t("toggle.expandTop") : t("toggle.collapseTop");
  topToggleBtn.title = label;
  topToggleBtn.setAttribute("aria-label", label);
  topToggleBtn.textContent = collapsed ? "▾" : "▴";
}

function setTopCollapsed(collapsed, persist = true) {
  if (appShell) {
    appShell.classList.toggle("top-collapsed", collapsed);
  }
  updateTopToggleButton(collapsed);
  if (persist) {
    persistTopCollapsed(collapsed);
  }
}

function initializeTopLayout() {
  setTopCollapsed(readTopCollapsed(), false);
}

function syncWorkspaceScale() {
  if (!workspaceCanvas || !workspaceContent || !tableLayer || !workspace) return;
  workspaceContent.style.width = `${WORKSPACE_BASE_WIDTH}px`;
  workspaceContent.style.height = `${WORKSPACE_BASE_HEIGHT}px`;
  tableLayer.style.width = `${WORKSPACE_BASE_WIDTH}px`;
  tableLayer.style.height = `${WORKSPACE_BASE_HEIGHT}px`;
  workspaceCanvas.style.width = "100%";
  workspaceCanvas.style.height = "100%";
  workspaceContent.style.transform = `translate(${-workspaceViewX * workspaceZoom}px, ${-workspaceViewY * workspaceZoom}px) scale(${workspaceZoom})`;
  const gridSize = 24 * workspaceZoom;
  workspace.style.backgroundSize = `${gridSize}px ${gridSize}px`;
  workspace.style.backgroundPosition = `${-workspaceViewX * workspaceZoom}px ${-workspaceViewY * workspaceZoom}px`;
  if (zoomLevel) {
    zoomLevel.textContent = `${Math.round(workspaceZoom * 100)}%`;
  }
}

function applyWorkspaceZoom(nextZoom, anchorClientX, anchorClientY) {
  if (!workspace) return;

  const clamped = Math.max(WORKSPACE_MIN_ZOOM, Math.min(WORKSPACE_MAX_ZOOM, nextZoom));
  if (Math.abs(clamped - workspaceZoom) < 0.0001) return;

  const rect = workspace.getBoundingClientRect();
  const anchorX = anchorClientX ?? rect.left + rect.width / 2;
  const anchorY = anchorClientY ?? rect.top + rect.height / 2;
  const offsetX = anchorX - rect.left;
  const offsetY = anchorY - rect.top;
  const worldX = workspaceViewX + offsetX / workspaceZoom;
  const worldY = workspaceViewY + offsetY / workspaceZoom;

  workspaceZoom = clamped;
  workspaceViewX = worldX - offsetX / workspaceZoom;
  workspaceViewY = worldY - offsetY / workspaceZoom;
  syncWorkspaceScale();
  drawRelations();
}

function getWorkspacePoint(clientX, clientY) {
  if (!workspace) {
    return { x: clientX, y: clientY };
  }
  const rect = workspace.getBoundingClientRect();
  return {
    x: workspaceViewX + (clientX - rect.left) / workspaceZoom,
    y: workspaceViewY + (clientY - rect.top) / workspaceZoom,
  };
}

function getModelTableBounds(model) {
  if (!model || !Array.isArray(model.tables) || model.tables.length === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  model.tables.forEach((table) => {
    ensureTableRuntimeData(table);
    const x = Number.isFinite(Number(table.x)) ? Number(table.x) : 0;
    const y = Number.isFinite(Number(table.y)) ? Number(table.y) : 0;
    const card = getTableCardById(table.id);
    const width = card?.offsetWidth || 220;
    const height = card?.offsetHeight || estimateTableCardHeight(table);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

function fitActiveModelToViewport(padding = 48) {
  const model = getActiveModel();
  if (!model) {
    alert(t("alert.selectModelFirst"));
    return false;
  }
  if (!workspace) return false;
  const bounds = getModelTableBounds(model);
  if (!bounds) {
    alert(t("alert.noTableForFit"));
    return false;
  }

  const viewportWidth = workspace.clientWidth;
  const viewportHeight = workspace.clientHeight;
  if (viewportWidth <= 20 || viewportHeight <= 20) return false;

  const contentWidth = bounds.width + padding * 2;
  const contentHeight = bounds.height + padding * 2;
  const fitZoom = Math.min(viewportWidth / contentWidth, viewportHeight / contentHeight);
  workspaceZoom = Math.max(WORKSPACE_MIN_ZOOM, Math.min(WORKSPACE_MAX_ZOOM, fitZoom));

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  workspaceViewX = centerX - viewportWidth / (2 * workspaceZoom);
  workspaceViewY = centerY - viewportHeight / (2 * workspaceZoom);

  syncWorkspaceScale();
  drawRelations();
  return true;
}

function getGlobalTemplateForDb(dbType) {
  return convertTemplateFieldsToDbType(state.globalTableTemplate, dbType || DEFAULT_DB_TYPE);
}

function buildEditHistoryPayload() {
  return {
    globalTableTemplate: state.globalTableTemplate,
    models: state.models,
    activeModelId: state.activeModelId,
    selectedTableId: state.selectedTableId,
    selectedRelationId: state.selectedRelationId,
    activeInspectorTab,
  };
}

function getEditHistorySnapshot() {
  return JSON.stringify(buildEditHistoryPayload());
}

function applyEditHistorySnapshot(snapshot) {
  let parsed = null;
  try {
    parsed = JSON.parse(snapshot);
  } catch {
    return false;
  }
  if (!parsed || typeof parsed !== "object") return false;

  state.globalTableTemplate = Array.isArray(parsed.globalTableTemplate) && parsed.globalTableTemplate.length > 0
    ? parsed.globalTableTemplate.map((field, index) => normalizeFieldTemplate(field, index + 1, DEFAULT_DB_TYPE))
    : [normalizeFieldTemplate({}, 1, DEFAULT_DB_TYPE)];
  state.models = Array.isArray(parsed.models) ? parsed.models : [];
  state.activeModelId = typeof parsed.activeModelId === "string" ? parsed.activeModelId : null;
  state.selectedTableId = typeof parsed.selectedTableId === "string" ? parsed.selectedTableId : null;
  state.selectedRelationId = typeof parsed.selectedRelationId === "string" ? parsed.selectedRelationId : null;
  activeInspectorTab = typeof parsed.activeInspectorTab === "string" ? parsed.activeInspectorTab : "basic";

  state.models.forEach((model) => ensureModelRuntimeData(model));
  refreshAllModelDirtyStates();
  persistState(state);
  editHistoryLastSnapshot = snapshot;
  render();
  return true;
}

function initializeEditHistory() {
  editHistoryUndo = [];
  editHistoryRedo = [];
  editHistoryLastSnapshot = getEditHistorySnapshot();
}

function pushEditHistoryIfChanged() {
  const currentSnapshot = getEditHistorySnapshot();
  if (!editHistoryLastSnapshot) {
    editHistoryLastSnapshot = currentSnapshot;
    return;
  }
  if (currentSnapshot === editHistoryLastSnapshot) return;
  editHistoryUndo.push(editHistoryLastSnapshot);
  if (editHistoryUndo.length > EDIT_HISTORY_LIMIT) {
    editHistoryUndo.shift();
  }
  editHistoryRedo = [];
  editHistoryLastSnapshot = currentSnapshot;
}

function undoEditHistory() {
  if (editHistoryUndo.length === 0) {
    alert(t("alert.undoNone"));
    return;
  }
  const previousSnapshot = editHistoryUndo.pop();
  const currentSnapshot = getEditHistorySnapshot();
  editHistoryRedo.push(currentSnapshot);
  editHistoryApplying = true;
  const ok = applyEditHistorySnapshot(previousSnapshot);
  editHistoryApplying = false;
  if (!ok) {
    alert(t("alert.undoFailed"));
  }
}

function redoEditHistory() {
  if (editHistoryRedo.length === 0) {
    alert(t("alert.redoNone"));
    return;
  }
  const nextSnapshot = editHistoryRedo.pop();
  const currentSnapshot = getEditHistorySnapshot();
  editHistoryUndo.push(currentSnapshot);
  if (editHistoryUndo.length > EDIT_HISTORY_LIMIT) {
    editHistoryUndo.shift();
  }
  editHistoryApplying = true;
  const ok = applyEditHistorySnapshot(nextSnapshot);
  editHistoryApplying = false;
  if (!ok) {
    alert(t("alert.redoFailed"));
  }
}

function save() {
  refreshAllModelDirtyStates();
  if (!editHistoryApplying) {
    pushEditHistoryIfChanged();
  }
  persistState(state);
  scheduleActiveModelAutoSave();
}

function clearModelAutoSaveTimer() {
  if (!modelAutoSaveTimer) return;
  window.clearTimeout(modelAutoSaveTimer);
  modelAutoSaveTimer = null;
}

function canAutoSaveModel(model) {
  if (!model) return false;
  const hasWorkspaceContext = Boolean(String(workspacePathHint || workspaceDirectoryHandle?.name || workspaceRememberedName || "").trim());
  if (!hasWorkspaceContext) return false;
  if (!canUseServerWorkspaceBridge() && !workspaceDirectoryHandle) return false;
  return true;
}

function scheduleActiveModelAutoSave() {
  const model = getActiveModel();
  if (!model || !model.dirty || !canAutoSaveModel(model)) {
    clearModelAutoSaveTimer();
    modelAutoSavePendingId = null;
    return;
  }
  modelAutoSavePendingId = model.id;
  clearModelAutoSaveTimer();
  modelAutoSaveTimer = window.setTimeout(() => {
    const pendingId = modelAutoSavePendingId;
    modelAutoSaveTimer = null;
    void flushAutoSaveForModel(pendingId);
  }, MODEL_AUTO_SAVE_DELAY_MS);
}

async function flushAutoSaveForModel(modelId) {
  if (modelAutoSaveRunning || !modelId) return false;
  const model = state.models.find((item) => item.id === modelId) || null;
  if (!model || !canAutoSaveModel(model)) return false;
  refreshModelDirtyState(model);
  if (!model.dirty) return true;
  modelAutoSaveRunning = true;
  try {
    return Boolean(await saveModelToWorkspace(model, { silent: true, autoCreate: true }));
  } finally {
    modelAutoSaveRunning = false;
    const latestModel = state.models.find((item) => item.id === modelId) || null;
    if (latestModel) {
      refreshModelDirtyState(latestModel);
      if (latestModel.dirty) {
        scheduleActiveModelAutoSave();
      }
    }
  }
}

function getWorkspaceDisplayName() {
  const baseName = workspaceDirectoryHandle?.name || workspaceRememberedName || "";
  if (!baseName) return t("workspace.unset");
  if (canUseServerWorkspaceBridge()) return baseName;
  if (workspacePermissionState === "granted") return baseName;
  if (workspacePermissionState === "pending") return `${baseName} (${t("workspace.pending")})`;
  return `${baseName} (${t("workspace.disconnected")})`;
}

function getWorkspaceActionLabel() {
  const hasWorkspaceContext = Boolean(workspaceDirectoryHandle || workspaceRememberedName || workspacePathHint);
  if (!hasWorkspaceContext || canUseServerWorkspaceBridge()) return t("action.settings-workspace");
  if (workspacePermissionState === "granted") return t("action.settings-workspace");
  return t("action.settings-workspace-connect");
}

function getWorkspaceSettingsMenuLabel() {
  return canUseServerWorkspaceBridge() ? t("action.settings-workspace-switch") : t("action.settings-workspace");
}

function getWorkspacePathMetaLabel() {
  return canUseServerWorkspaceBridge() ? t("workspace.projectPath") : t("workspace.pathHint");
}

function getWorkspaceToolbarLabel() {
  return canUseServerWorkspaceBridge() ? t("toolbar.project") : t("toolbar.workspace");
}

function canUseServerWorkspaceBridge() {
  const hasPath = Boolean(String(workspacePathHint || "").trim());
  const host = String(window.location.hostname || "").trim().toLowerCase();
  return hasPath && (host === "127.0.0.1" || host === "localhost");
}

function isWorkspaceConnected() {
  return canUseServerWorkspaceBridge() || (Boolean(workspaceDirectoryHandle) && workspacePermissionState === "granted");
}

function getSyncActionLabel() {
  return isWorkspaceConnected() ? t("action.file-sync-workspace") : t("action.file-connect-sync");
}

function getSyncToolbarLabel() {
  return isWorkspaceConnected() ? t("toolbar.sync") : t("toolbar.connectSync");
}

function getWorkspacePathHintDisplay() {
  return workspacePathHint || t("workspace.unfilled");
}

function persistWorkspaceInfo() {
  const workspaceName = workspaceDirectoryHandle?.name || workspaceRememberedName || "";
  saveWorkspaceInfo({
    name: workspaceName,
    pathHint: workspacePathHint || "",
  });
}

function deriveWorkspaceNameFromPath(pathValue) {
  const raw = String(pathValue || "").trim().replace(/[\\\/]+$/, "");
  if (!raw) return "";
  const segments = raw.split(/[\\\/]+/).filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : "";
}

function normalizeWorkspacePathKey(pathValue) {
  return String(pathValue || "")
    .trim()
    .replace(/\//g, "\\")
    .replace(/[\\]+$/, "")
    .toLocaleLowerCase();
}

function getWorkspaceGuideStorageKey() {
  const workspaceKey = normalizeWorkspacePathKey(workspacePathHint || workspaceDirectoryHandle?.name || workspaceRememberedName || "");
  return workspaceKey ? `${WORKSPACE_GUIDE_DISMISSED_PREFIX}.${encodeURIComponent(workspaceKey)}` : "";
}

function isWorkspaceGuideDismissed() {
  const storageKey = getWorkspaceGuideStorageKey();
  if (!storageKey) return false;
  try {
    return localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

function dismissWorkspaceGuide() {
  const storageKey = getWorkspaceGuideStorageKey();
  if (!storageKey) return;
  try {
    localStorage.setItem(storageKey, "1");
  } catch {
    // Ignore storage failures.
  }
}

function readLaunchWorkspaceContext() {
  try {
    const url = new URL(window.location.href);
    const workspacePath = (url.searchParams.get("workspacePath") || "").trim();
    const workspaceName = (url.searchParams.get("workspaceName") || "").trim();
    return {
      workspacePath,
      workspaceName: workspaceName || deriveWorkspaceNameFromPath(workspacePath),
      hasParams: url.searchParams.has("workspacePath") || url.searchParams.has("workspaceName"),
      url,
    };
  } catch {
    return {
      workspacePath: "",
      workspaceName: "",
      hasParams: false,
      url: null,
    };
  }
}

async function applyLaunchWorkspaceContext() {
  const context = readLaunchWorkspaceContext();
  if (!context.hasParams) return;

  const nextPath = context.workspacePath || workspacePathHint || "";
  const nextName = context.workspaceName || workspaceRememberedName || "";
  const currentHandleNameKey = String(workspaceDirectoryHandle?.name || "")
    .trim()
    .toLocaleLowerCase();
  const nextNameKey = String(nextName || "").trim().toLocaleLowerCase();

  // Keep an existing granted/pending handle whenever the incoming launch context
  // still points to the same directory name. The browser handle is the real source
  // of access; the path hint is only display metadata and should not disconnect
  // the workspace on every launch.
  const shouldResetHandle =
    Boolean(workspaceDirectoryHandle) &&
    Boolean(nextNameKey) &&
    Boolean(currentHandleNameKey) &&
    nextNameKey !== currentHandleNameKey;

  if (shouldResetHandle) {
    workspaceDirectoryHandle = null;
    workspacePermissionState = "none";
    await saveWorkspaceDirectoryHandle(null);
  }

  workspaceRememberedName = nextName || workspaceRememberedName;
  workspacePathHint = nextPath || workspacePathHint;
  persistWorkspaceInfo();

  if (context.url && window.history?.replaceState) {
    context.url.searchParams.delete("workspacePath");
    context.url.searchParams.delete("workspaceName");
    window.history.replaceState(null, "", context.url.toString());
  }
}

function normalizeModelFileName(input, fallback) {
  const raw = (input || fallback || "").trim();
  if (!raw) return "";
  const safe = raw.replace(/[\\/:*?"<>|]/g, "_");
  if (!safe) return "";
  if (safe.toLowerCase().endsWith(".dbmodel.json")) return safe;
  if (safe.toLowerCase().endsWith(".json")) {
    return `${safe.slice(0, -5)}.dbmodel.json`;
  }
  return `${safe}.dbmodel.json`;
}

function normalizeSqlFileName(input, fallback) {
  const raw = (input || fallback || "").trim();
  if (!raw) return "";
  const safe = raw.replace(/[\\/:*?"<>|]/g, "_");
  if (!safe) return "";
  if (safe.toLowerCase().endsWith(".sql")) return safe;
  return `${safe}.sql`;
}

function normalizeImageFileName(input, fallback) {
  const raw = (input || fallback || "").trim();
  if (!raw) return "";
  const safe = raw.replace(/[\\/:*?"<>|]/g, "_");
  if (!safe) return "";
  if (safe.toLowerCase().endsWith(".png")) return safe;
  return `${safe}.png`;
}

function buildWorkspaceDisplayPath(fileName = "") {
  const base = String(workspacePathHint || workspaceDirectoryHandle?.name || workspaceRememberedName || "").trim();
  if (!base) return fileName;
  const normalizedBase = base.replace(/[\\\/]+$/, "");
  return fileName ? `${normalizedBase}\\${fileName}` : normalizedBase;
}

function getModelWorkspaceFileName(model) {
  if (!model) return "";
  if (typeof model.fileName === "string" && model.fileName.trim()) {
    return model.fileName.trim();
  }
  if (typeof model.name === "string" && model.name.trim()) {
    return normalizeModelFileName(model.name, "Model.dbmodel.json");
  }
  return "";
}

function getModelWorkspaceDisplayPath(model) {
  const fileName = getModelWorkspaceFileName(model);
  if (!fileName) return "";
  return buildWorkspaceDisplayPath(fileName);
}

function getSuggestedSqlFileNameForModel(model) {
  const modelFileName = getModelWorkspaceFileName(model);
  if (modelFileName) {
    return normalizeSqlFileName(modelFileName.replace(/\.dbmodel\.json$/i, ".sql"), "model.sql");
  }
  return normalizeSqlFileName(model?.name || "model", "model.sql");
}

async function copyTextToClipboard(text) {
  const value = String(text || "");
  if (!value) return false;

  const fallbackCopy = () => {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    textarea.remove();
    return copied;
  };

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall back to execCommand.
  }
  return fallbackCopy();
}

function buildRelationSummaryLines(model) {
  const relations = Array.isArray(model?.relations) ? model.relations : [];
  const tables = Array.isArray(model?.tables) ? model.tables : [];
  return relations
    .map((relation) => {
      const sourceTable = tables.find((item) => item.id === relation.sourceTableId);
      const targetTable = tables.find((item) => item.id === relation.targetTableId);
      if (!sourceTable || !targetTable) return "";
      const relationName = String(relation?.name || "").trim();
      const cardinality = String(relation?.cardinality || "1:N").trim();
      const suffix = relationName ? `，名称：${relationName}` : "";
      return `- ${sourceTable.name} -> ${targetTable.name} (${cardinality}${suffix})`;
    })
    .filter(Boolean);
}

function buildModelSummaryText(model) {
  if (!model) return "";
  const lines = [
    `模型名称：${model.name || "未命名模型"}`,
    `数据库类型：${model.dbType || DEFAULT_DB_TYPE}`,
    `表数量：${Array.isArray(model.tables) ? model.tables.length : 0}`,
  ];

  const tables = Array.isArray(model.tables) ? model.tables : [];
  tables.forEach((table, tableIndex) => {
    lines.push("");
    lines.push(`表 ${tableIndex + 1}：${table.name || table.code || "未命名表"}${table.comment ? `（注释：${table.comment}）` : ""}`);
    const fields = Array.isArray(table.fields) ? table.fields : [];
    fields.forEach((field) => {
      const typeText = formatFieldType(field);
      const flags = formatFieldFlags(field);
      const flagText = flags ? `，约束：${flags}` : "";
      const commentText = field?.comment ? `，注释：${field.comment}` : "";
      lines.push(`- ${field.name || field.code} / ${field.code || field.name} / ${typeText}${flagText}${commentText}`);
    });
    if (Array.isArray(table.indexes) && table.indexes.length > 0) {
      lines.push(`- 索引数：${table.indexes.length}`);
    }
  });

  const relationLines = buildRelationSummaryLines(model);
  if (relationLines.length > 0) {
    lines.push("");
    lines.push("关系：");
    lines.push(...relationLines);
  }

  return lines.join("\n").trim();
}

function buildCodexPromptFromMode(mode, model, extra = {}) {
  const modelPath = extra.modelPath || "";
  const sqlPath = extra.sqlPath || "";
  const summary = extra.summary || buildModelSummaryText(model);
  const aiPromptText = String(extra.aiPromptText || "").trim();
  const dbType = String(extra.dbType || model?.dbType || DEFAULT_DB_TYPE).trim() || DEFAULT_DB_TYPE;
  if (mode === "model") {
    return `我把设计器模型文件准备好了，请按这个文件继续：\n${modelPath || (model?.fileName || "未命名模型文件")}`;
  }
  if (mode === "sql") {
    return `我把设计器导出的 SQL 准备好了，请按这个 SQL 文件继续：\n${sqlPath || "未命名 SQL 文件"}`;
  }
  if (mode === "summary") {
    return `下面是我从设计器整理出的结构摘要，请按这个结构继续：\n\n${summary}`;
  }
  if (mode === "screenshot") {
    return "我准备给你发设计器截图，请按截图里的表结构继续；如果截图信息不够，我再补模型文件或 SQL。";
  }
  if (mode === "speech") {
    return `我先口述一下当前设计，请按这个结构继续：\n\n${summary}`;
  }
  if (mode === "ai-build") {
    const existingSummary = summary ? `\n\n当前模型摘要：\n${summary}` : "";
    return `我正在使用 DB Craft，请按下面的需求直接帮我生成并继续完善表结构，数据库类型是 ${dbType}。如果当前工程里已经有表，请把新表或改表需求合并到现有模型思路里。\n\n建表需求：\n${aiPromptText || "请按当前业务需求生成表结构。"}${existingSummary}`;
  }
  return summary;
}

function buildCodexHandoffFileContent(mode, model, promptText, extra = {}) {
  const lines = [
    "# DB Craft -> Codex Handoff",
    "",
    `- Generated At: ${new Date().toISOString()}`,
    `- Mode: ${mode || "summary"}`,
    `- Project Path: ${buildWorkspaceDisplayPath() || "-"}`,
    `- Model Name: ${model?.name || "未命名模型"}`,
    `- Database Type: ${model?.dbType || DEFAULT_DB_TYPE}`,
    `- Model File: ${extra.modelPath || getModelWorkspaceDisplayPath(model) || "-"}`,
    `- SQL File: ${extra.sqlPath || "-"}`,
    "",
    "## Prompt",
    "",
    promptText || "",
  ];
  return lines.join("\n").trim();
}

async function writeCodexHandoffFile({ mode, model, promptText, modelPath = "", sqlPath = "" }) {
  if (!(await ensureWorkspaceReady())) return false;
  const content = buildCodexHandoffFileContent(mode, model, promptText, { modelPath, sqlPath });
  await writeWorkspaceTextFile(workspaceDirectoryHandle, CODEX_HANDOFF_FILE_NAME, content);
  return {
    fileName: CODEX_HANDOFF_FILE_NAME,
    displayPath: buildWorkspaceDisplayPath(CODEX_HANDOFF_FILE_NAME),
    content,
  };
}

const LENGTH_AWARE_TYPE_SUFFIX_NONE = "__no_param";
const LENGTH_AWARE_TYPE_SUFFIX_PARAM1 = "__param1";
const LENGTH_AWARE_TYPE_SUFFIX_PARAM2 = "__param2";
const LENGTH_OPTIONAL_SINGLE_PARAM_BASE_TYPES = new Set(["char", "varchar"]);
const LENGTH_OPTIONAL_DOUBLE_PARAM_BASE_TYPES = new Set(["decimal", "numeric"]);

function normalizeTypeKey(baseType) {
  return String(baseType || "").trim().toLowerCase();
}

function getLengthAwareTypeValue(baseType, mode) {
  return `${baseType}${mode === "param2" ? LENGTH_AWARE_TYPE_SUFFIX_PARAM2 : mode === "param1" ? LENGTH_AWARE_TYPE_SUFFIX_PARAM1 : LENGTH_AWARE_TYPE_SUFFIX_NONE}`;
}

function parseLengthAwareTypeValue(optionValue) {
  const value = String(optionValue || "");
  if (value.endsWith(LENGTH_AWARE_TYPE_SUFFIX_PARAM2)) {
    return {
      baseType: value.slice(0, -LENGTH_AWARE_TYPE_SUFFIX_PARAM2.length),
      mode: "param2",
    };
  }
  if (value.endsWith(LENGTH_AWARE_TYPE_SUFFIX_PARAM1)) {
    return {
      baseType: value.slice(0, -LENGTH_AWARE_TYPE_SUFFIX_PARAM1.length),
      mode: "param1",
    };
  }
  if (value.endsWith(LENGTH_AWARE_TYPE_SUFFIX_NONE)) {
    return {
      baseType: value.slice(0, -LENGTH_AWARE_TYPE_SUFFIX_NONE.length),
      mode: "none",
    };
  }
  return {
    baseType: value,
    mode: "none",
  };
}

function getLengthOptionalTypeMode(baseType) {
  const key = normalizeTypeKey(baseType);
  if (LENGTH_OPTIONAL_SINGLE_PARAM_BASE_TYPES.has(key)) return "single";
  if (LENGTH_OPTIONAL_DOUBLE_PARAM_BASE_TYPES.has(key)) return "double";
  return "none";
}

function isLengthOptionalType(baseType) {
  return getLengthOptionalTypeMode(baseType) !== "none";
}

function getDefaultLengthForType(baseType) {
  const type = normalizeTypeKey(baseType);
  if (type === "char") return "1";
  if (type === "varchar") return "50";
  return "";
}

function getDefaultPrecisionForType(baseType) {
  const type = normalizeTypeKey(baseType);
  if (type === "decimal" || type === "numeric") return "10";
  return "";
}

function getDefaultScaleForType(baseType) {
  const type = normalizeTypeKey(baseType);
  if (type === "decimal" || type === "numeric") return "2";
  return "";
}

function getCurrentTypeMode(baseType, lengthValue, precisionValue, scaleValue) {
  const typeMode = getLengthOptionalTypeMode(baseType);
  if (typeMode === "single") {
    return String(lengthValue || "").trim() ? "param1" : "none";
  }
  if (typeMode === "double") {
    const precision = String(precisionValue || "").trim();
    const scale = String(scaleValue || "").trim();
    if (precision && scale) return "param2";
    if (precision) return "param1";
    if (scale) return "param2";
    return "none";
  }
  return "none";
}

function getDataTypeOptionsHtml(dbType, currentType, currentLength, currentPrecision = "", currentScale = "") {
  const rawTypes = getFieldTypesByDbType(dbType);
  const mergedTypes = rawTypes.includes(currentType) ? rawTypes : [currentType, ...rawTypes];
  const uniqueTypes = [];
  const seen = new Set();
  mergedTypes.forEach((type) => {
    const key = String(type || "").trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    uniqueTypes.push(type);
  });

  const currentMode = getCurrentTypeMode(currentType, currentLength, currentPrecision, currentScale);
  return uniqueTypes
    .flatMap((type) => {
      const typeMode = getLengthOptionalTypeMode(type);
      if (typeMode === "none") {
        return [
          `<option value="${escapeHtml(type)}" ${type === currentType ? "selected" : ""}>${escapeHtml(type)}</option>`,
        ];
      }
      if (typeMode === "single") {
        const noneValue = getLengthAwareTypeValue(type, "none");
        const param1Value = getLengthAwareTypeValue(type, "param1");
        return [
          `<option value="${escapeHtml(noneValue)}" ${type === currentType && currentMode === "none" ? "selected" : ""}>${escapeHtml(type)}</option>`,
          `<option value="${escapeHtml(param1Value)}" ${type === currentType && currentMode === "param1" ? "selected" : ""}>${escapeHtml(type)}（%）</option>`,
        ];
      }
      const noneValue = getLengthAwareTypeValue(type, "none");
      const param1Value = getLengthAwareTypeValue(type, "param1");
      const param2Value = getLengthAwareTypeValue(type, "param2");
      return [
        `<option value="${escapeHtml(noneValue)}" ${type === currentType && currentMode === "none" ? "selected" : ""}>${escapeHtml(type)}</option>`,
        `<option value="${escapeHtml(param1Value)}" ${type === currentType && currentMode === "param1" ? "selected" : ""}>${escapeHtml(type)}（%）</option>`,
        `<option value="${escapeHtml(param2Value)}" ${type === currentType && currentMode === "param2" ? "selected" : ""}>${escapeHtml(type)}（%，%）</option>`,
      ];
    })
    .join("");
}

function syncTypeSelectByLength(selectElement, baseType, lengthValue, precisionValue = "", scaleValue = "") {
  if (!selectElement || !isLengthOptionalType(baseType)) return;
  const nextMode = getCurrentTypeMode(baseType, lengthValue, precisionValue, scaleValue);
  const nextValue = getLengthAwareTypeValue(baseType, nextMode);
  if (selectElement.value !== nextValue) {
    selectElement.value = nextValue;
  }
}

function getModelNameFromPayload(raw, fallbackName) {
  const rawModel = raw && typeof raw === "object" && raw.model ? raw.model : raw;
  if (typeof rawModel?.name === "string" && rawModel.name.trim()) {
    return rawModel.name.trim();
  }
  return fallbackName;
}

function normalizeModelNameKey(name) {
  return String(name || "").trim().toLocaleLowerCase();
}

function getModelContentSignature(model) {
  const payload = {
    name: model?.name || "",
    dbType: model?.dbType || "",
    tables: Array.isArray(model?.tables) ? model.tables : [],
    relations: Array.isArray(model?.relations) ? model.relations : [],
  };
  return JSON.stringify(payload);
}

function markModelSaved(model) {
  model.savedSignature = getModelContentSignature(model);
  model.dirty = false;
}

function refreshModelDirtyState(model) {
  ensureModelRuntimeData(model);
  if (typeof model.savedSignature !== "string") {
    model.savedSignature = "";
  }
  if (!model.fileName) {
    model.dirty = true;
    return;
  }
  const currentSignature = getModelContentSignature(model);
  if (!model.savedSignature) {
    // Compatibility for historical data with no baseline signature.
    model.savedSignature = currentSignature;
    model.dirty = false;
    return;
  }
  model.dirty = currentSignature !== model.savedSignature;
}

function refreshAllModelDirtyStates() {
  state.models.forEach((model) => {
    refreshModelDirtyState(model);
  });
}

function serializeModelForFile(model) {
  return JSON.parse(
    JSON.stringify({
      name: model.name,
      dbType: model.dbType,
      tables: model.tables || [],
      relations: model.relations || [],
    }),
  );
}

function buildSavePayload(model) {
  return {
    format: "dbdesigner-model",
    version: 1,
    savedAt: new Date().toISOString(),
    model: serializeModelForFile(model),
  };
}

function buildLoadedModel(raw, fileName) {
  const rawModel = raw && typeof raw === "object" && raw.model ? raw.model : raw;
  const baseName = fileName.replace(/\.dbmodel\.json$/i, "").replace(/\.json$/i, "");
  const name = typeof rawModel?.name === "string" && rawModel.name.trim() ? rawModel.name : baseName || "ImportedModel";
  const dbType = typeof rawModel?.dbType === "string" ? rawModel.dbType : undefined;
  const model = createModel(name, dbType);

  if (Array.isArray(rawModel?.tables)) {
    model.tables = rawModel.tables.map((table) => ({
      ...table,
      id: table?.id || uid("table"),
    }));
  } else {
    model.tables = [];
  }
  if (Array.isArray(rawModel?.relations)) {
    model.relations = rawModel.relations.map((relation) => ({
      ...relation,
      id: relation?.id || uid("rel"),
    }));
  } else {
    model.relations = [];
  }
  model.fileName = fileName;
  ensureModelRuntimeData(model);
  markModelSaved(model);
  return model;
}

async function ensureWorkspaceReady(options = {}) {
  const { autoReconnect = false } = options;
  if (canUseServerWorkspaceBridge()) {
    workspacePermissionState = "granted";
    updateToolbar();
    return true;
  }
  if (!supportsWorkspaceFS()) {
    alert(t("workspace.unsupported"));
    return false;
  }
  if (!workspaceDirectoryHandle) {
    if (autoReconnect) {
      const connected = await setWorkspaceDirectory({ silentAbort: true });
      if (connected) return true;
      const reconnectChoice = await showWorkspaceReconnectDialog({
        title: t("dialog.workspaceReconnect.title"),
        message: t("dialog.workspaceReconnect.message"),
      });
      if (reconnectChoice) return true;
      updateToolbar();
      return false;
    }
    if (workspaceRememberedName || workspacePathHint) {
      alert(t("workspace.reconnectHint"));
    } else {
      alert(t("workspace.setupFirst"));
    }
    updateToolbar();
    return false;
  }
  const granted = await ensureDirectoryPermission(workspaceDirectoryHandle, true);
  workspacePermissionState = granted ? "granted" : "pending";
  if (granted) {
    updateToolbar();
    return true;
  }
  if (autoReconnect) {
    const reconnected = await setWorkspaceDirectory({ silentAbort: true });
    if (reconnected) return true;
    const reconnectChoice = await showWorkspaceReconnectDialog({
      title: t("dialog.workspaceReconnect.titleUnavailable"),
      message: t("dialog.workspaceReconnect.messageUnavailable"),
    });
    if (reconnectChoice) return true;
    updateToolbar();
    return false;
  }
  alert(t("workspace.reconnectUnavailable"));
  updateToolbar();
  return false;
}

async function setWorkspaceDirectory(options = {}) {
  const { silentAbort = false } = options;
  if (!supportsWorkspaceFS()) {
    alert(t("workspace.unsupported"));
    return false;
  }
  try {
    const handle = await pickWorkspaceDirectory();
    const granted = await ensureDirectoryPermission(handle, true);
    if (!granted) {
      alert(t("alert.workspacePermissionMissing"));
      workspacePermissionState = "pending";
      updateToolbar();
      return false;
    }
    workspaceDirectoryHandle = handle;
    workspaceRememberedName = handle.name || workspaceRememberedName;
    workspacePermissionState = "granted";
    persistWorkspaceInfo();
    updateToolbar();
    return true;
  } catch (error) {
    if (error && error.name === "AbortError") {
      if (!silentAbort) {
        updateToolbar();
        alert(t("alert.workspacePickAborted"));
      }
      return false;
    }
    alert(tr("alert.workspaceSetFailed", { message: error?.message || error }));
    updateToolbar();
    return false;
  }
}

async function ensureWorkspaceConnectedFromUserAction() {
  if (canUseServerWorkspaceBridge()) {
    workspacePermissionState = "granted";
    updateToolbar();
    return true;
  }
  if (!supportsWorkspaceFS()) {
    alert(t("workspace.unsupported"));
    return false;
  }

  if (!workspaceDirectoryHandle || workspacePermissionState !== "granted") {
    return setWorkspaceDirectory({ silentAbort: false });
  }

  const granted = await ensureDirectoryPermission(workspaceDirectoryHandle, true);
  workspacePermissionState = granted ? "granted" : "pending";
  updateToolbar();
  if (granted) return true;
  alert(t("workspace.reconnectExpired"));
  return false;
}

async function switchProjectWorkspace() {
  const currentPath = String(workspacePathHint || "").trim();
  const userInput = prompt(t("workspace.switchPrompt"), currentPath || t("workspace.switchPlaceholder"));
  if (userInput === null) return false;

  const nextPath = userInput.trim();
  if (!nextPath) {
    alert(t("workspace.switchEmpty"));
    return false;
  }

  try {
    const response = await fetch("/api/workspace/list-models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspacePath: nextPath }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || tr("workspace.switchHttpFailed", { status: response.status }));
    }

    workspacePathHint = nextPath;
    workspaceRememberedName = deriveWorkspaceNameFromPath(nextPath) || workspaceRememberedName;
    workspacePermissionState = "granted";
    persistWorkspaceInfo();
    updateToolbar();
    renderModelList();
    alert(tr("workspace.switchDone", { path: nextPath }));
    return true;
  } catch (error) {
    alert(tr("workspace.switchFailed", { message: error?.message || error }));
    return false;
  }
}

function editWorkspacePathHint() {
  const workspaceName = workspaceDirectoryHandle?.name || workspaceRememberedName;
  if (!workspaceName) {
    alert(t("workspace.setupFirst"));
    return;
  }
  const input = prompt(t("prompt.workspacePath"), workspacePathHint || "");
  if (input === null) return;
  workspacePathHint = input.trim();
  persistWorkspaceInfo();
  updateToolbar();
}

async function saveModelToWorkspace(model, options = {}) {
  const silent = Boolean(options?.silent);
  const autoCreate = Boolean(options?.autoCreate);
  if (!model) {
    if (!silent) {
      alert(t("alert.selectModelFirst"));
    }
    return false;
  }
  if (!(await ensureWorkspaceReady())) return false;

  if (!String(model.name || "").trim()) {
    if (silent && autoCreate) {
      model.name = "Model";
    } else {
      const userInput = prompt(t("prompt.modelName"), "Model");
      if (userInput === null) return false;
      const modelName = userInput.trim();
      if (!modelName) {
        alert(t("alert.modelNameRequired"));
        return false;
      }
      model.name = modelName;
    }
  }

  if (!model.fileName) {
    if (silent && autoCreate) {
      model.fileName = normalizeModelFileName(model.name, "Model.dbmodel.json");
    } else {
      const userInput = prompt(t("prompt.modelNameFirstSave"), model.name || "Model");
      if (userInput === null) return false;
      const modelName = userInput.trim();
      if (!modelName) {
        alert(t("alert.modelNameRequired"));
        return false;
      }
      model.name = modelName;
    }
  }

  const entries = await buildWorkspaceModelEntries();
  const currentFileName = model.fileName || "";
  let fileName = currentFileName || normalizeModelFileName(model.name, "Model.dbmodel.json");
  while (true) {
    const sameNameEntry = entries.find(
      (entry) =>
        normalizeModelNameKey(entry.modelName) === normalizeModelNameKey(model.name) &&
        entry.fileName !== currentFileName,
    );
    if (!sameNameEntry) break;

    if (silent) return false;
    const overwriteChoice = await showChoiceDialog({
      title: t("dialog.saveModel.title"),
      message: tr("dialog.saveModel.sameName", { name: sameNameEntry.modelName }),
      actions: [
        { value: "overwrite", label: t("dialog.saveModel.overwrite"), className: "danger" },
        { value: "rename", label: t("dialog.saveModel.rename"), className: "primary" },
        { value: "cancel", label: t("common.cancel"), className: "ghost", role: "cancel" },
      ],
    });
    if (overwriteChoice === "overwrite") {
      fileName = sameNameEntry.fileName;
      break;
    }
    if (overwriteChoice === "rename") {
      const renamed = prompt(t("prompt.modelRename"), `${model.name}_new`);
      if (renamed === null) return false;
      const nextName = renamed.trim();
      if (!nextName) {
        alert(t("alert.modelNameRequired"));
        continue;
      }
      model.name = nextName;
      fileName = currentFileName || normalizeModelFileName(model.name, "Model.dbmodel.json");
      continue;
    }
    return false;
  }

  if (!currentFileName) {
    const sameFileEntry = entries.find((entry) => entry.fileName === fileName);
    if (sameFileEntry) {
      if (silent) return false;
      const overwriteChoice = await showChoiceDialog({
        title: t("dialog.saveModel.title"),
        message: tr("dialog.saveModel.fileExists", { fileName }),
        actions: [
          { value: "overwrite", label: t("dialog.saveModel.overwrite"), className: "danger" },
          { value: "cancel", label: t("common.cancel"), className: "ghost", role: "cancel" },
        ],
      });
      if (overwriteChoice !== "overwrite") {
        return false;
      }
    }
  }

  try {
    const payload = buildSavePayload(model);
    if (!workspaceDirectoryHandle && canUseServerWorkspaceBridge()) {
      const response = await fetch("/api/workspace/write-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspacePath: workspacePathHint,
          fileName,
          payload,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.ok !== true) {
        throw new Error(result?.error || tr("alert.requestFailedHttp", { status: response.status }));
      }
    } else {
      await writeModelFile(workspaceDirectoryHandle, fileName, payload);
    }
    model.fileName = fileName;
    markModelSaved(model);
    save();
    updateToolbar();
    renderModelList();
    return {
      ok: true,
      fileName,
      displayPath: buildWorkspaceDisplayPath(fileName),
      modelName: model.name || "",
    };
  } catch (error) {
    if (!silent) {
      alert(tr("alert.modelSaveFailed", { message: error?.message || error }));
    } else {
      console.warn(t("log.modelAutoSaveFailed"), error);
    }
    return false;
  }
}

async function saveActiveModelToWorkspace() {
  const model = getActiveModel();
  if (!model) {
    alert(t("alert.selectModelFirst"));
    return false;
  }
  return saveModelToWorkspace(model);
}

async function saveActiveModelAsNewToWorkspace() {
  const sourceModel = getActiveModel();
  if (!sourceModel) {
    alert(t("alert.selectModelFirst"));
    return false;
  }
  if (!(await ensureWorkspaceReady())) return false;

  let targetNameInput = prompt(t("prompt.modelSaveAs"), `${sourceModel.name || "Model"}_copy`);
  if (targetNameInput === null) return false;
  let targetName = targetNameInput.trim();
  if (!targetName) {
    alert(t("alert.modelNameRequired"));
    return false;
  }

  const entries = await buildWorkspaceModelEntries();
  let targetFileName = normalizeModelFileName(targetName, "Model.dbmodel.json");
  while (true) {
    const sameNameEntry = entries.find(
      (entry) => normalizeModelNameKey(entry.modelName) === normalizeModelNameKey(targetName),
    );
    if (!sameNameEntry) break;

    const choice = await showChoiceDialog({
      title: t("dialog.saveAs.title"),
      message: tr("dialog.saveAs.sameName", { name: sameNameEntry.modelName }),
      actions: [
        { value: "rename", label: t("dialog.saveModel.rename"), className: "primary" },
        { value: "overwrite", label: t("dialog.saveModel.overwrite"), className: "danger" },
        { value: "cancel", label: t("common.cancel"), className: "ghost", role: "cancel" },
      ],
    });
    if (choice === "rename") {
      targetNameInput = prompt(t("prompt.modelRename"), `${targetName}_copy`);
      if (targetNameInput === null) return false;
      targetName = targetNameInput.trim();
      if (!targetName) {
        alert(t("alert.modelNameRequired"));
        continue;
      }
      targetFileName = normalizeModelFileName(targetName, "Model.dbmodel.json");
      continue;
    }
    if (choice === "overwrite") {
      targetFileName = sameNameEntry.fileName;
      break;
    }
    return false;
  }

  while (true) {
    const sameFileEntry = entries.find((entry) => entry.fileName === targetFileName);
    if (!sameFileEntry) break;

    const sameFileOpened = state.models.some((model) => model.fileName === targetFileName);
    if (sameFileOpened) {
      alert(t("alert.modelOpenConflict"));
      return false;
    }

    const choice = await showChoiceDialog({
      title: t("dialog.saveAs.title"),
      message: tr("dialog.saveModel.fileExists", { fileName: targetFileName }),
      actions: [
        { value: "overwrite", label: t("dialog.saveModel.overwrite"), className: "danger" },
        { value: "rename", label: t("dialog.saveModel.rename"), className: "primary" },
        { value: "cancel", label: t("common.cancel"), className: "ghost", role: "cancel" },
      ],
    });
    if (choice === "overwrite") break;
    if (choice === "rename") {
      targetNameInput = prompt(t("prompt.modelRename"), `${targetName}_copy`);
      if (targetNameInput === null) return false;
      targetName = targetNameInput.trim();
      if (!targetName) {
        alert(t("alert.modelNameRequired"));
        continue;
      }
      targetFileName = normalizeModelFileName(targetName, "Model.dbmodel.json");
      continue;
    }
    return false;
  }

  try {
    const copiedModelPayload = serializeModelForFile(sourceModel);
    copiedModelPayload.name = targetName;
    const payload = {
      format: "dbdesigner-model",
      version: 1,
      savedAt: new Date().toISOString(),
      model: copiedModelPayload,
    };
    await writeModelFile(workspaceDirectoryHandle, targetFileName, payload);

    const loadedCopy = buildLoadedModel(payload, targetFileName);
    state.models.push(loadedCopy);
    state.activeModelId = loadedCopy.id;
    state.selectedTableId = null;
    state.selectedRelationId = null;
    activeInspectorTab = "basic";
    ensureInspectorVisible();
    save();
    render();
    return true;
  } catch (error) {
    alert(tr("alert.modelSaveAsFailed", { message: error?.message || error }));
    return false;
  }
}

function buildModelCreateTableSql(model, options = {}) {
  const includeForeignKeys = options.includeForeignKeys !== false;
  const tables = Array.isArray(model?.tables) ? model.tables : [];
  const header = [
    `-- Model: ${model?.name || ""}`,
    `-- Database: ${model?.dbType || ""}`,
    `-- Exported At: ${new Date().toISOString()}`,
    `-- Include Foreign Keys: ${includeForeignKeys ? "YES" : "NO"}`,
  ].join("\n");
  if (tables.length === 0) {
    return `${header}\n\n-- No tables in current model.\n`;
  }
  const scripts = tables.map((table) => {
    ensureTableRuntimeData(table);
    return getTableScript(model, table, { includeForeignKeys });
  });
  return `${header}\n\n${scripts.join("\n\n-- --------------------------------------------------\n\n")}\n`;
}

async function workspaceFileExists(directoryHandle, fileName) {
  try {
    await directoryHandle.getFileHandle(fileName);
    return true;
  } catch (error) {
    if (error && error.name === "NotFoundError") return false;
    throw error;
  }
}

async function writeWorkspaceTextFile(directoryHandle, fileName, text) {
  if (!directoryHandle && canUseServerWorkspaceBridge()) {
    const response = await fetch("/api/workspace/write-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspacePath: workspacePathHint,
        fileName,
        text,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok !== true) {
      throw new Error(payload?.error || tr("alert.requestFailedHttp", { status: response.status }));
    }
    return;
  }
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(text);
  await writable.close();
}

async function readWorkspaceModelPayload(fileName) {
  const safeFileName = String(fileName || "").trim();
  if (!safeFileName) {
    throw new Error(t("error.modelFileNameRequired"));
  }
  if (!workspaceDirectoryHandle && canUseServerWorkspaceBridge()) {
    const response = await fetch("/api/workspace/read-model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspacePath: workspacePathHint,
        fileName: safeFileName,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.payload) {
      throw new Error(payload?.error || tr("alert.requestFailedHttp", { status: response.status }));
    }
    return payload.payload;
  }
  const text = await readModelFile(workspaceDirectoryHandle, safeFileName);
  return JSON.parse(text);
}

function upsertLoadedModel(loadedModel, options = {}) {
  const { replaceIfOpen = false, activate = true } = options;
  const existingIndex = state.models.findIndex((model) => model.fileName === loadedModel.fileName);
  if (existingIndex >= 0) {
    if (!replaceIfOpen) {
      return { reused: true, model: state.models[existingIndex] };
    }
    const existingModel = state.models[existingIndex];
    loadedModel.id = existingModel.id;
    state.models.splice(existingIndex, 1, loadedModel);
    if (state.activeModelId === existingModel.id || activate) {
      state.activeModelId = loadedModel.id;
    }
    state.selectedTableId = null;
    state.selectedRelationId = null;
    activeInspectorTab = "basic";
    ensureInspectorVisible();
    save();
    render();
    return { replaced: true, model: loadedModel };
  }
  state.models.push(loadedModel);
  if (activate) {
    state.activeModelId = loadedModel.id;
  }
  state.selectedTableId = null;
  state.selectedRelationId = null;
  activeInspectorTab = "basic";
  ensureInspectorVisible();
  save();
  render();
  return { created: true, model: loadedModel };
}

async function refreshActiveModelFromWorkspaceOnLaunch() {
  const activeModel = getActiveModel();
  if (!activeModel?.fileName) return;
  const hasWorkspaceContext = Boolean(String(workspacePathHint || workspaceDirectoryHandle?.name || workspaceRememberedName || "").trim());
  if (!hasWorkspaceContext) return;
  try {
    const payload = await readWorkspaceModelPayload(activeModel.fileName);
    const loadedModel = buildLoadedModel(payload, activeModel.fileName);
    upsertLoadedModel(loadedModel, { replaceIfOpen: true, activate: true });
  } catch {
    // Ignore startup refresh failures and keep the in-memory model as fallback.
  }
}

async function refreshActiveModelFromWorkspaceIfChanged() {
  if (modelAutoRefreshRunning) return false;
  const activeModel = getActiveModel();
  if (!activeModel?.fileName) return false;
  const hasWorkspaceContext = Boolean(String(workspacePathHint || workspaceDirectoryHandle?.name || workspaceRememberedName || "").trim());
  if (!hasWorkspaceContext) return false;
  refreshModelDirtyState(activeModel);
  if (activeModel.dirty) return false;

  modelAutoRefreshRunning = true;
  try {
    const payload = await readWorkspaceModelPayload(activeModel.fileName);
    const loadedModel = buildLoadedModel(payload, activeModel.fileName);
    const currentSignature = getModelContentSignature(activeModel);
    const nextSignature = getModelContentSignature(loadedModel);
    if (currentSignature === nextSignature) {
      return false;
    }
    upsertLoadedModel(loadedModel, { replaceIfOpen: true, activate: true });
    return true;
  } catch {
    return false;
  } finally {
    modelAutoRefreshRunning = false;
  }
}

function initializeModelAutoRefresh() {
  if (modelAutoRefreshTimer) {
    window.clearInterval(modelAutoRefreshTimer);
  }
  modelAutoRefreshTimer = window.setInterval(() => {
    if (document.hidden) return;
    void refreshActiveModelFromWorkspaceIfChanged();
  }, MODEL_AUTO_REFRESH_INTERVAL_MS);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      void refreshActiveModelFromWorkspaceIfChanged();
    }
  });

  window.addEventListener("focus", () => {
    void refreshActiveModelFromWorkspaceIfChanged();
  });
}

async function writeWorkspaceBinaryFile(directoryHandle, fileName, blob) {
  const granted = await ensureDirectoryPermission(directoryHandle, true);
  if (!granted) {
    throw new Error(t("error.workspacePermissionDenied"));
  }
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    await writable.write(new Uint8Array(arrayBuffer));
  } finally {
    await writable.close();
  }
}

function truncateSvgText(value, maxLength = 28) {
  const text = Array.from(String(value || "").trim());
  if (text.length <= maxLength) return text.join("");
  if (maxLength <= 3) return text.slice(0, maxLength).join("");
  return `${text.slice(0, maxLength - 3).join("")}...`;
}

function getModelTableRectMap(model) {
  const tableRectMap = new Map();
  (model?.tables || []).forEach((table) => {
    ensureTableRuntimeData(table);
    const card = getTableCardById(table.id);
    tableRectMap.set(table.id, {
      x: Number.isFinite(Number(table.x)) ? Number(table.x) : 0,
      y: Number.isFinite(Number(table.y)) ? Number(table.y) : 0,
      width: card?.offsetWidth || 220,
      height: card?.offsetHeight || estimateTableCardHeight(table),
    });
  });
  return tableRectMap;
}

function expandBounds(bounds, x, y, padding = 0) {
  bounds.minX = Math.min(bounds.minX, x - padding);
  bounds.minY = Math.min(bounds.minY, y - padding);
  bounds.maxX = Math.max(bounds.maxX, x + padding);
  bounds.maxY = Math.max(bounds.maxY, y + padding);
}

function getModelExportBounds(model, tableRectMap) {
  const bounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  tableRectMap.forEach((rect) => {
    expandBounds(bounds, rect.x, rect.y);
    expandBounds(bounds, rect.x + rect.width, rect.y + rect.height);
  });

  (model?.relations || []).forEach((relation) => {
    const sourceRect = tableRectMap.get(getRelationArrowSourceTableId(model, relation));
    const targetRect = tableRectMap.get(getRelationArrowTargetTableId(model, relation));
    if (!sourceRect || !targetRect) return;

    let labelX = 0;
    let labelY = 0;
    if (sourceRect === targetRect) {
      const startX = sourceRect.x + sourceRect.width;
      const startY = sourceRect.y + sourceRect.height / 2;
      const endX = sourceRect.x + sourceRect.width / 2;
      const endY = sourceRect.y;
      [
        [startX, startY],
        [startX + 80, startY - 70],
        [endX + 80, endY - 70],
        [endX, endY],
      ].forEach(([x, y]) => expandBounds(bounds, x, y));
      labelX = (startX + endX) / 2 + 24;
      labelY = (startY + endY) / 2 - 40;
    } else {
      const startOnRight = sourceRect.x <= targetRect.x;
      const startX = startOnRight ? sourceRect.x + sourceRect.width : sourceRect.x;
      const startY = sourceRect.y + sourceRect.height / 2;
      const endX = startOnRight ? targetRect.x : targetRect.x + targetRect.width;
      const endY = targetRect.y + targetRect.height / 2;
      const ctrlGap = Math.max(40, Math.abs(endX - startX) / 2);
      [
        [startX, startY],
        [startX + (startOnRight ? ctrlGap : -ctrlGap), startY],
        [endX + (startOnRight ? -ctrlGap : ctrlGap), endY],
        [endX, endY],
      ].forEach(([x, y]) => expandBounds(bounds, x, y));
      labelX = (startX + endX) / 2;
      labelY = (startY + endY) / 2 - 8;
    }
    expandBounds(bounds, labelX, labelY, 72);
  });

  if (!Number.isFinite(bounds.minX) || !Number.isFinite(bounds.minY)) {
    return null;
  }
  return {
    minX: bounds.minX,
    minY: bounds.minY,
    maxX: bounds.maxX,
    maxY: bounds.maxY,
    width: Math.max(1, bounds.maxX - bounds.minX),
    height: Math.max(1, bounds.maxY - bounds.minY),
  };
}

function buildTableExportSvg(model, table, rect, syntaxIssues, offsetX, offsetY) {
  const x = Math.round(rect.x + offsetX);
  const y = Math.round(rect.y + offsetY);
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  const headerOnly = tableCardViewMode === "header";
  const headerHeight = headerOnly ? height : Math.min(height, 52);
  const isSelected = state.selectedTableId === table.id;
  const hasSyntaxError = Array.isArray(syntaxIssues) && syntaxIssues.length > 0;
  const strokeColor = hasSyntaxError ? "#d92d20" : isSelected ? "#1c69db" : "#223458";
  const headerColor = hasSyntaxError ? "#7e231d" : "#1f2d4d";
  const headerTextColor = hasSyntaxError ? "#ffe0da" : "#c9d5f0";
  const shadowOpacity = hasSyntaxError ? "0.18" : isSelected ? "0.2" : "0.12";
  const parts = [];

  parts.push(`<g transform="translate(${x} ${y})">`);
  parts.push(
    `<rect x="0" y="4" width="${width}" height="${height}" rx="14" ry="14" fill="#1c3159" opacity="${shadowOpacity}"/>`,
  );
  parts.push(
    `<rect x="0" y="0" width="${width}" height="${height}" rx="14" ry="14" fill="#ffffff" stroke="${strokeColor}" stroke-width="${isSelected ? 2 : 1.2}"/>`,
  );
  if (headerOnly) {
    parts.push(
      `<rect x="0" y="0" width="${width}" height="${height}" rx="14" ry="14" fill="${headerColor}"/>`,
    );
  } else {
    parts.push(
      `<path d="M 14 0 H ${width - 14} A 14 14 0 0 1 ${width} 14 V ${headerHeight} H 0 V 14 A 14 14 0 0 1 14 0 Z" fill="${headerColor}"/>`,
    );
  }

  const titleText = truncateSvgText(table.name || table.code || "Unnamed", 22);
  const codeText = truncateSvgText(table.code || table.name || "", 24);
  parts.push(
    `<text x="12" y="22" font-size="14" font-weight="700" fill="#ffffff" font-family="Segoe UI, Microsoft YaHei, sans-serif">${escapeHtml(titleText)}</text>`,
  );
  parts.push(
    `<text x="12" y="40" font-size="12" fill="${headerTextColor}" font-family="Segoe UI, Microsoft YaHei, sans-serif">${escapeHtml(codeText)}</text>`,
  );
  if (hasSyntaxError) {
    parts.push(
      `<circle cx="${width - 16}" cy="18" r="8" fill="#ffffff" opacity="0.18"/><text x="${width - 16}" y="22" text-anchor="middle" font-size="10" font-weight="700" fill="#ffffff" font-family="Segoe UI, Microsoft YaHei, sans-serif">!</text>`,
    );
  }

  if (!headerOnly) {
    const fieldRows = Array.isArray(table.fields) ? table.fields : [];
    const rowHeight = 34;
    const listPadding = 8;
    const availableListHeight = Math.max(0, height - headerHeight - 8);
    const visibleCount = Math.min(
      fieldRows.length,
      Math.max(0, Math.floor((Math.max(0, availableListHeight - listPadding * 2) + 4) / rowHeight)),
    );
    fieldRows.slice(0, visibleCount).forEach((field, index) => {
      const rowY = headerHeight + listPadding + index * rowHeight;
      if (index % 2 === 0) {
        parts.push(
          `<rect x="8" y="${rowY}" width="${width - 16}" height="${rowHeight}" rx="8" ry="8" fill="#f5f8ff"/>`,
        );
      }
      const fieldName = truncateSvgText(field.name || field.code || "", 13);
      const fieldCode = truncateSvgText(field.code || "", 12);
      const typeText = formatFieldType(field);
      const flagsText = formatFieldFlags(field, model.dbType);
      const metaText = truncateSvgText(
        `${typeText}${flagsText ? ` · ${flagsText}` : ""}`,
        30,
      );
      parts.push(
        `<text x="16" y="${rowY + 14}" font-size="12" fill="#1f2d4d" font-family="Segoe UI, Microsoft YaHei, sans-serif">${escapeHtml(fieldName)}</text>`,
      );
      parts.push(
        `<text x="${width - 16}" y="${rowY + 14}" text-anchor="end" font-size="12" fill="#5a6782" font-family="Segoe UI, Microsoft YaHei, sans-serif">${escapeHtml(fieldCode)}</text>`,
      );
      parts.push(
        `<text x="16" y="${rowY + 28}" font-size="11" fill="#556688" font-family="Segoe UI, Microsoft YaHei, sans-serif">${escapeHtml(metaText)}</text>`,
      );
    });
  }

  parts.push("</g>");
  return parts.join("");
}

function buildRelationExportSvg(model, relation, tableRectMap, offsetX, offsetY) {
  const sourceRect = tableRectMap.get(getRelationArrowSourceTableId(model, relation));
  const targetRect = tableRectMap.get(getRelationArrowTargetTableId(model, relation));
  if (!sourceRect || !targetRect) return "";

  const normalizedCardinality = normalizeRelationCardinality(relation.cardinality);
  const isDirectionReversed =
    getRelationArrowSourceTableId(model, relation) !== relation.sourceTableId ||
    getRelationArrowTargetTableId(model, relation) !== relation.targetTableId;
  const renderedCardinality = isDirectionReversed
    ? invertRelationCardinality(normalizedCardinality)
    : normalizedCardinality;
  const isSelected = relation.id === state.selectedRelationId;
  const strokeColor = isSelected ? "#0f78ff" : "#2a65c9";
  const strokeWidth = isSelected ? 2.8 : 2;

  let pathData = "";
  let labelX = 0;
  let labelY = 0;
  if (sourceRect === targetRect) {
    const startX = sourceRect.x + sourceRect.width + offsetX;
    const startY = sourceRect.y + sourceRect.height / 2 + offsetY;
    const endX = sourceRect.x + sourceRect.width / 2 + offsetX;
    const endY = sourceRect.y + offsetY;
    pathData = `M ${startX} ${startY} C ${startX + 80} ${startY - 70}, ${endX + 80} ${endY - 70}, ${endX} ${endY}`;
    labelX = (startX + endX) / 2 + 24;
    labelY = (startY + endY) / 2 - 40;
  } else {
    const startOnRight = sourceRect.x <= targetRect.x;
    const startX = (startOnRight ? sourceRect.x + sourceRect.width : sourceRect.x) + offsetX;
    const startY = sourceRect.y + sourceRect.height / 2 + offsetY;
    const endX = (startOnRight ? targetRect.x : targetRect.x + targetRect.width) + offsetX;
    const endY = targetRect.y + targetRect.height / 2 + offsetY;
    pathData = buildCurvePath(startX, startY, endX, endY);
    labelX = (startX + endX) / 2;
    labelY = (startY + endY) / 2 - 8;
  }

  const labelText = truncateSvgText(
    `${relation.name || "relation"} [${renderedCardinality}]`,
    30,
  );
  return [
    `<path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="0.9" marker-end="url(#exportRelationArrow)"/>`,
    `<text x="${Math.round(labelX)}" y="${Math.round(labelY)}" text-anchor="middle" font-size="11" font-weight="${isSelected ? 700 : 500}" fill="${isSelected ? "#0a5fd1" : "#244e95"}" font-family="Segoe UI, Microsoft YaHei, sans-serif">${escapeHtml(labelText)}</text>`,
  ].join("");
}

async function buildActiveModelImageBlob() {
  const model = getActiveModel();
  if (!model) {
    throw new Error(t("alert.selectModelFirst"));
  }
  if (!Array.isArray(model.tables) || model.tables.length === 0) {
    throw new Error(t("alert.noTableInModel"));
  }
  const tableRectMap = getModelTableRectMap(model);
  const bounds = getModelExportBounds(model, tableRectMap);
  if (!bounds) {
    throw new Error(t("alert.exportImageNoBounds"));
  }
  const padding = 40;
  const width = Math.max(320, Math.ceil(bounds.width + padding * 2));
  const height = Math.max(240, Math.ceil(bounds.height + padding * 2));
  const offsetX = Math.round(padding - bounds.minX);
  const offsetY = Math.round(padding - bounds.minY);
  const syntaxDiagnostics = collectModelSqlSyntaxDiagnostics(model);
  const relationMarkup = (model.relations || [])
    .map((relation) => buildRelationExportSvg(model, relation, tableRectMap, offsetX, offsetY))
    .join("");
  const tableMarkup = model.tables
    .map((table) =>
      buildTableExportSvg(
        model,
        table,
        tableRectMap.get(table.id),
        syntaxDiagnostics.tableIssueMap.get(table.id) || [],
        offsetX,
        offsetY,
      ),
    )
    .join("");
  const svgMarkup = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <pattern id="exportGrid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1f3f7a" stroke-opacity="0.08" stroke-width="1"/>
    </pattern>
    <marker id="exportRelationArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 8 4 L 0 8 z" fill="#2a65c9"/>
    </marker>
  </defs>
  <rect width="${width}" height="${height}" fill="#f6f9ff"/>
  <rect width="${width}" height="${height}" fill="url(#exportGrid)"/>
  <g>${relationMarkup}</g>
  <g>${tableMarkup}</g>
</svg>`;

  const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "sync";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("图片渲染失败。"));
      img.src = svgUrl;
    });

    const scale = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error(t("error.canvasUnsupported"));
    }
    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);
    const pngBlob = await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("PNG 生成失败。"));
      }, "image/png");
    });
    return pngBlob;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

async function pickExportDirectoryHandle() {
  if (!supportsWorkspaceFS() || typeof window.showDirectoryPicker !== "function") {
    alert(t("alert.exportDirUnsupported"));
    return null;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    const granted = await ensureDirectoryPermission(handle, true);
    if (!granted) {
      alert(t("alert.exportDirPermissionDenied"));
      return null;
    }
    return handle;
  } catch (error) {
    if (error && error.name === "AbortError") return null;
    alert(tr("alert.exportDirPickFailed", { message: error?.message || error }));
    return null;
  }
}

async function askIncludeForeignKeysOnExport() {
  const choice = await showChoiceDialog({
    title: t("dialog.exportSql.title"),
    message: t("dialog.exportSql.withFk"),
    actions: [
      { value: "without-fk", label: t("dialog.exportSql.withoutFk"), className: "primary" },
      { value: "with-fk", label: t("dialog.exportSql.yes"), className: "ghost" },
      { value: "cancel", label: t("common.cancel"), className: "ghost", role: "cancel" },
    ],
  });
  if (!choice || choice === "cancel") return null;
  return choice === "with-fk";
}

async function exportActiveModelSqlToWorkspace() {
  const model = getActiveModel();
  if (!model) {
    alert(t("alert.selectModelFirst"));
    return false;
  }
  if (!Array.isArray(model.tables) || model.tables.length === 0) {
    alert(t("alert.noTableInModel"));
    return false;
  }
  const checkResult = runActiveModelSyntaxCheck({
    showSuccessAlert: false,
    focusOnError: true,
  });
  if (!checkResult.ok) {
    return false;
  }

  const includeForeignKeys = await askIncludeForeignKeysOnExport();
  if (includeForeignKeys === null) return false;

  const exportDirectoryHandle = await pickExportDirectoryHandle();
  if (!exportDirectoryHandle) return false;

  let fileInput = prompt(t("prompt.exportSqlFile"), normalizeSqlFileName(model.name || "model", "model.sql"));
  if (fileInput === null) return false;
  let fileName = normalizeSqlFileName(fileInput, "model.sql");
  if (!fileName) {
    alert(t("alert.fileNameRequired"));
    return false;
  }

  while (true) {
    if (!fileName) {
      const renamedInput = prompt(t("prompt.exportSqlFileRetry"), "model.sql");
      if (renamedInput === null) return false;
      fileName = normalizeSqlFileName(renamedInput, "model.sql");
      continue;
    }
    const exists = await workspaceFileExists(exportDirectoryHandle, fileName);
    if (!exists) break;

    const choice = await showChoiceDialog({
      title: t("dialog.exportSql.title"),
      message: tr("dialog.exportSql.overwriteMessage", { fileName }),
      actions: [
        { value: "overwrite", label: t("dialog.exportSql.overwrite"), className: "danger" },
        { value: "rename", label: t("dialog.saveModel.rename"), className: "primary" },
        { value: "cancel", label: t("common.cancel"), className: "ghost", role: "cancel" },
      ],
    });
    if (choice === "overwrite") break;
    if (choice === "rename") {
      fileInput = prompt(t("prompt.exportSqlRename"), fileName.replace(/\.sql$/i, "_new.sql"));
      if (fileInput === null) return false;
      fileName = normalizeSqlFileName(fileInput, "model.sql");
      continue;
    }
    return false;
  }

  try {
    const sql = buildModelCreateTableSql(model, { includeForeignKeys });
    await writeWorkspaceTextFile(exportDirectoryHandle, fileName, sql);
    alert(tr("alert.exportSqlSuccess", { path: `${exportDirectoryHandle.name}\\${fileName}` }));
    return {
      ok: true,
      fileName,
      displayPath: `${String(exportDirectoryHandle.name || "导出目录").replace(/[\\\/]+$/, "")}\\${fileName}`,
      directoryName: exportDirectoryHandle.name || "",
      sql,
    };
  } catch (error) {
    alert(tr("alert.exportSqlFailed", { message: error?.message || error }));
    return false;
  }
}

async function syncActiveModelToWorkspace() {
  const model = getActiveModel();
  if (!model) {
    alert(t("alert.selectModelFirst"));
    return false;
  }

  if (!(await ensureWorkspaceReady({ autoReconnect: true }))) {
    return false;
  }

  const saveResult = await saveModelToWorkspace(model);
  if (!saveResult || !saveResult.ok) return false;

  const checkResult = runActiveModelSyntaxCheck({
    showSuccessAlert: false,
    focusOnError: true,
  });
  if (!checkResult.ok) {
    alert(tr("alert.syncSkippedBySyntax", { path: saveResult.displayPath }));
    return {
      ok: false,
      partial: true,
      modelPath: saveResult.displayPath,
    };
  }

  const sqlFileName = getSuggestedSqlFileNameForModel(model);
  try {
    const sql = buildModelCreateTableSql(model, { includeForeignKeys: false });
    await writeWorkspaceTextFile(workspaceDirectoryHandle, sqlFileName, sql);
    const sqlDisplayPath = buildWorkspaceDisplayPath(sqlFileName);
    await showSqlPreviewDialog({
      sql,
      modelPath: saveResult.displayPath,
      sqlPath: sqlDisplayPath,
    });
    return {
      ok: true,
      modelPath: saveResult.displayPath,
      sqlPath: sqlDisplayPath,
      fileName: saveResult.fileName,
      sqlFileName,
    };
  } catch (error) {
    alert(tr("alert.syncSqlFailed", { path: saveResult.displayPath, message: error?.message || error }));
    return {
      ok: false,
      partial: true,
      modelPath: saveResult.displayPath,
      error,
    };
  }
}

async function exportActiveModelImageToWorkspace() {
  const model = getActiveModel();
  if (!model) {
    alert(t("alert.selectModelFirst"));
    return false;
  }
  if (!Array.isArray(model.tables) || model.tables.length === 0) {
    alert(t("alert.noTableInModel"));
    return false;
  }

  const exportDirectoryHandle = await pickExportDirectoryHandle();
  if (!exportDirectoryHandle) return false;

  let fileInput = prompt(t("prompt.exportImageFile"), normalizeImageFileName(model.name || "model", "model.png"));
  if (fileInput === null) return false;
  let fileName = normalizeImageFileName(fileInput, "model.png");
  if (!fileName) {
    alert(t("alert.fileNameRequired"));
    return false;
  }

  while (true) {
    if (!fileName) {
      const renamedInput = prompt(t("prompt.exportImageFileRetry"), "model.png");
      if (renamedInput === null) return false;
      fileName = normalizeImageFileName(renamedInput, "model.png");
      continue;
    }
    const exists = await workspaceFileExists(exportDirectoryHandle, fileName);
    if (!exists) break;

    const choice = await showChoiceDialog({
      title: t("dialog.exportImage.title"),
      message: tr("dialog.exportSql.overwriteMessage", { fileName }),
      actions: [
        { value: "overwrite", label: t("dialog.exportSql.overwrite"), className: "danger" },
        { value: "rename", label: t("dialog.saveModel.rename"), className: "primary" },
        { value: "cancel", label: t("common.cancel"), className: "ghost", role: "cancel" },
      ],
    });
    if (choice === "overwrite") break;
    if (choice === "rename") {
      fileInput = prompt(t("prompt.exportImageRename"), fileName.replace(/\.png$/i, "_new.png"));
      if (fileInput === null) return false;
      fileName = normalizeImageFileName(fileInput, "model.png");
      continue;
    }
    return false;
  }

  try {
    const imageBlob = await buildActiveModelImageBlob();
    await writeWorkspaceBinaryFile(exportDirectoryHandle, fileName, imageBlob);
    alert(tr("alert.exportImageSuccess", { path: `${exportDirectoryHandle.name}\\${fileName}` }));
    return {
      ok: true,
      fileName,
      displayPath: `${String(exportDirectoryHandle.name || "导出目录").replace(/[\\\/]+$/, "")}\\${fileName}`,
    };
  } catch (error) {
    alert(tr("alert.exportImageFailed", { message: error?.message || error }));
    return false;
  }
}

async function buildWorkspaceModelEntries() {
  if (!workspaceDirectoryHandle && canUseServerWorkspaceBridge()) {
    const response = await fetch("/api/workspace/list-models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspacePath: workspacePathHint }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || tr("alert.requestFailedHttp", { status: response.status }));
    }
    const openedFileSet = new Set(
      state.models.map((model) => model.fileName).filter((fileName) => typeof fileName === "string" && fileName.trim()),
    );
    return (Array.isArray(payload?.entries) ? payload.entries : [])
      .map((entry) => ({
        fileName: entry.fileName,
        modelName: entry.modelName || entry.fileName,
        dbType: entry.dbType || "",
        isOpen: openedFileSet.has(entry.fileName),
      }))
      .sort((a, b) => a.modelName.localeCompare(b.modelName, "zh-CN"));
  }
  const fileNames = await listWorkspaceModelFiles(workspaceDirectoryHandle);
  const openedFileSet = new Set(
    state.models.map((model) => model.fileName).filter((fileName) => typeof fileName === "string" && fileName.trim()),
  );
  const entries = [];
  for (const fileName of fileNames) {
    let modelName = fileName.replace(/\.dbmodel\.json$/i, "").replace(/\.json$/i, "");
    let dbType = "";
    try {
      const text = await readModelFile(workspaceDirectoryHandle, fileName);
      const parsed = JSON.parse(text);
      modelName = getModelNameFromPayload(parsed, modelName);
      const rawModel = parsed && typeof parsed === "object" && parsed.model ? parsed.model : parsed;
      dbType = typeof rawModel?.dbType === "string" ? rawModel.dbType : "";
    } catch {
      // Skip metadata parse failures and keep filename fallback.
    }
    entries.push({ fileName, modelName, dbType, isOpen: openedFileSet.has(fileName) });
  }
  entries.sort((a, b) => a.modelName.localeCompare(b.modelName, "zh-CN"));
  return entries;
}

function showModelPickerDialog(entries) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "app-dialog-backdrop";
    const dialog = document.createElement("div");
    dialog.className = "app-dialog app-dialog-wide";
    dialog.innerHTML = `
      <h3>${escapeHtml(t("dialog.modelPicker.title"))}</h3>
      <p>${escapeHtml(t("dialog.modelPicker.desc"))}</p>
      <div class="model-picker-list" id="modelPickerList"></div>
      <div class="app-dialog-actions">
        <button type="button" class="app-dialog-btn ghost" id="modelPickerCancelBtn">${escapeHtml(t("common.cancel"))}</button>
      </div>
    `;

    const list = dialog.querySelector("#modelPickerList");
    const cancelBtn = dialog.querySelector("#modelPickerCancelBtn");

    const cleanup = () => {
      document.removeEventListener("keydown", onKeydown);
      backdrop.remove();
    };
    const close = (value) => {
      cleanup();
      resolve(value);
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") close(null);
    };

    entries.forEach((entry) => {
      const itemBtn = document.createElement("button");
      itemBtn.type = "button";
      itemBtn.className = `model-picker-item ${entry.isOpen ? "disabled" : ""}`;
      itemBtn.disabled = Boolean(entry.isOpen);

      const nameEl = document.createElement("span");
      nameEl.className = "model-picker-name";
      nameEl.textContent = entry.modelName;
      if (entry.isOpen) {
        const openBadge = document.createElement("span");
        openBadge.className = "model-picker-badge";
        openBadge.textContent = t("dialog.modelPicker.opened");
        nameEl.appendChild(openBadge);
      }

      const metaEl = document.createElement("span");
      metaEl.className = "model-picker-meta";
      metaEl.textContent = entry.dbType ? `${entry.dbType} · ${entry.fileName}` : entry.fileName;

      itemBtn.appendChild(nameEl);
      itemBtn.appendChild(metaEl);
      if (!entry.isOpen) {
        itemBtn.addEventListener("click", () => close(entry.fileName));
      }
      list.appendChild(itemBtn);
    });

    cancelBtn.addEventListener("click", () => close(null));
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) close(null);
    });
    document.addEventListener("keydown", onKeydown);

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
  });
}

function showTableListDialog(model) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "app-dialog-backdrop";
    const dialog = document.createElement("div");
    dialog.className = "app-dialog app-dialog-wide";
    dialog.innerHTML = `
      <h3>${escapeHtml(t("dialog.tablePicker.title"))}</h3>
      <p>${escapeHtml(t("dialog.tablePicker.desc"))}</p>
      <div class="model-picker-list" id="tablePickerList"></div>
      <div class="app-dialog-actions">
        <button type="button" class="app-dialog-btn ghost" id="tablePickerCancelBtn">${escapeHtml(t("common.close"))}</button>
      </div>
    `;

    const list = dialog.querySelector("#tablePickerList");
    const cancelBtn = dialog.querySelector("#tablePickerCancelBtn");

    const cleanup = () => {
      document.removeEventListener("keydown", onKeydown);
      backdrop.remove();
    };
    const close = (value) => {
      cleanup();
      resolve(value);
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") close(null);
    };

    (model.tables || []).forEach((table) => {
      ensureTableRuntimeData(table);
      const itemBtn = document.createElement("button");
      itemBtn.type = "button";
      itemBtn.className = "model-picker-item";

      const nameEl = document.createElement("span");
      nameEl.className = "model-picker-name";
      nameEl.textContent = table.name || table.code || table.id;

      const metaEl = document.createElement("span");
      metaEl.className = "model-picker-meta";
      metaEl.textContent = tr("dialog.tablePicker.meta", {
        code: table.code || "-",
        fields: (table.fields || []).length,
        indexes: (table.indexes || []).length,
      });

      itemBtn.appendChild(nameEl);
      itemBtn.appendChild(metaEl);
      itemBtn.addEventListener("click", () => close(table.id));
      list.appendChild(itemBtn);
    });

    cancelBtn.addEventListener("click", () => close(null));
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) close(null);
    });
    document.addEventListener("keydown", onKeydown);

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
  });
}

function showChoiceDialog({ title, message, actions }) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "app-dialog-backdrop";

    const dialog = document.createElement("div");
    dialog.className = "app-dialog";
    dialog.innerHTML = `
      <h3>${escapeHtml(title || "")}</h3>
      <p>${escapeHtml(message || "")}</p>
      <div class="app-dialog-actions"></div>
    `;
    const actionWrap = dialog.querySelector(".app-dialog-actions");

    const cleanup = () => {
      document.removeEventListener("keydown", onKeydown);
      backdrop.remove();
    };

    const close = (value) => {
      cleanup();
      resolve(value);
    };

    const onKeydown = (event) => {
      if (event.key === "Escape") {
        const cancelAction = actions.find((item) => item.role === "cancel") || actions[actions.length - 1];
        close(cancelAction?.value ?? null);
      }
    };

    actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `app-dialog-btn ${action.className || ""}`.trim();
      btn.textContent = action.label;
      btn.addEventListener("click", () => close(action.value));
      actionWrap.appendChild(btn);
    });

    backdrop.addEventListener("click", (event) => {
      if (event.target !== backdrop) return;
      const cancelAction = actions.find((item) => item.role === "cancel");
      if (cancelAction) close(cancelAction.value);
    });

    document.addEventListener("keydown", onKeydown);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
  });
}

function showWorkspaceReconnectDialog({ title, message }) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "app-dialog-backdrop";

    const dialog = document.createElement("div");
    dialog.className = "app-dialog";
    dialog.innerHTML = `
      <h3>${escapeHtml(title || t("dialog.workspaceReconnect.title"))}</h3>
      <p>${escapeHtml(message || t("dialog.workspaceReconnect.message"))}</p>
      <div class="app-dialog-actions">
        <button type="button" class="app-dialog-btn ghost" id="workspaceReconnectCancelBtn">${escapeHtml(t("common.cancel"))}</button>
        <button type="button" class="app-dialog-btn primary" id="workspaceReconnectConfirmBtn">${escapeHtml(getWorkspaceActionLabel())}</button>
      </div>
    `;

    const cancelBtn = dialog.querySelector("#workspaceReconnectCancelBtn");
    const confirmBtn = dialog.querySelector("#workspaceReconnectConfirmBtn");

    const cleanup = () => {
      document.removeEventListener("keydown", onKeydown);
      backdrop.remove();
    };

    const close = (value) => {
      cleanup();
      resolve(value);
    };

    const onKeydown = (event) => {
      if (event.key === "Escape") close(false);
    };

    cancelBtn.addEventListener("click", () => close(false));
    confirmBtn.addEventListener("click", async () => {
      confirmBtn.disabled = true;
      const connected = await setWorkspaceDirectory({ silentAbort: true });
      confirmBtn.disabled = false;
      if (connected) {
        close(true);
      }
    });

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) close(false);
    });

    document.addEventListener("keydown", onKeydown);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
  });
}

function showSqlPreviewDialog({ title, message, sql, modelPath, sqlPath }) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "app-dialog-backdrop";

    const dialog = document.createElement("div");
    dialog.className = "app-dialog app-dialog-wide sql-preview-dialog";
    dialog.innerHTML = `
      <h3>${escapeHtml(title || t("sync.preview.title"))}</h3>
      <p>${escapeHtml(message || t("sync.preview.message"))}</p>
      <div class="sql-preview-meta">
        <div class="sql-preview-meta-item">
          <span>${escapeHtml(t("sync.preview.modelPath"))}</span>
          <code>${escapeHtml(modelPath || "-")}</code>
        </div>
        <div class="sql-preview-meta-item">
          <span>${escapeHtml(t("sync.preview.sqlPath"))}</span>
          <code>${escapeHtml(sqlPath || "-")}</code>
        </div>
      </div>
      <div class="script-actions">
        <button type="button" id="copySqlPreviewBtn">${escapeHtml(t("sync.preview.copy"))}</button>
        <span class="helper" id="copySqlPreviewHint"></span>
      </div>
      <pre class="sql-preview">${escapeHtml(sql || "")}</pre>
      <div class="app-dialog-actions">
        <button type="button" class="app-dialog-btn primary" id="closeSqlPreviewBtn">${escapeHtml(t("sync.preview.close"))}</button>
      </div>
    `;

    const copyBtn = dialog.querySelector("#copySqlPreviewBtn");
    const copyHint = dialog.querySelector("#copySqlPreviewHint");
    const closeBtn = dialog.querySelector("#closeSqlPreviewBtn");

    const cleanup = () => {
      document.removeEventListener("keydown", onKeydown);
      backdrop.remove();
    };

    const close = () => {
      cleanup();
      resolve(true);
    };

    const onKeydown = (event) => {
      if (event.key === "Escape") close();
    };

    copyBtn.addEventListener("click", async () => {
      const copied = await copyTextToClipboard(sql || "");
      copyHint.textContent = copied ? t("script.copied") : t("script.copyFailed");
    });
    closeBtn.addEventListener("click", close);

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) close();
    });

    document.addEventListener("keydown", onKeydown);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
  });
}

function showAiBuildDialog(dbType) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "app-dialog-backdrop";

    const dialog = document.createElement("div");
    dialog.className = "app-dialog app-dialog-wide ai-builder-dialog";
    dialog.innerHTML = `
      <h3>${escapeHtml(t("ai.build.title"))}</h3>
      <p>${escapeHtml(t("ai.build.desc"))}（${escapeHtml(dbType)}）</p>
      <p class="helper">${escapeHtml(t("ai.build.helper"))}</p>
      <div class="ai-builder-form">
        <label>
          ${escapeHtml(t("ai.build.preset"))}
          <select id="aiModelPresetSelect">${buildAiModelPresetOptions(readPreferredAiModel())}</select>
        </label>
        <label>
          ${escapeHtml(t("ai.build.modelName"))}
          <input id="aiModelInput" value="${escapeHtml(readPreferredAiModel())}" placeholder="${escapeHtml(t("ai.build.modelPlaceholder"))}" />
        </label>
        <label>
          ${escapeHtml(t("ai.build.prompt"))}
          <textarea id="aiPromptInput" placeholder="${escapeHtml(t("ai.build.promptPlaceholder"))}"></textarea>
        </label>
      </div>
      <div class="app-dialog-actions">
        <button type="button" class="app-dialog-btn ghost" id="aiBuildCancelBtn">${escapeHtml(t("ai.build.cancel"))}</button>
        <button type="button" class="app-dialog-btn ghost" id="aiBuildCodexBtn">${escapeHtml(t("ai.build.codex"))}</button>
        <button type="button" class="app-dialog-btn primary" id="aiBuildSubmitBtn">${escapeHtml(t("ai.build.submit"))}</button>
      </div>
    `;

    const modelPresetSelect = dialog.querySelector("#aiModelPresetSelect");
    const modelInput = dialog.querySelector("#aiModelInput");
    const promptInput = dialog.querySelector("#aiPromptInput");
    const cancelBtn = dialog.querySelector("#aiBuildCancelBtn");
    const codexBtn = dialog.querySelector("#aiBuildCodexBtn");
    const submitBtn = dialog.querySelector("#aiBuildSubmitBtn");

    const cleanup = () => {
      document.removeEventListener("keydown", onKeydown);
      backdrop.remove();
    };
    const close = (value) => {
      cleanup();
      resolve(value);
    };
    const submit = () => {
      const modelName = String(modelInput.value || "").trim();
      const promptText = String(promptInput.value || "").trim();
      if (!modelName) {
        alert(t("dialog.aiBuild.modelRequired"));
        modelInput.focus();
        return;
      }
      if (!promptText) {
        alert(t("dialog.aiBuild.promptRequired"));
        promptInput.focus();
        return;
      }
      savePreferredAiModel(modelName);
      close({ mode: "api", modelName, promptText });
    };
    const submitToCodex = () => {
      const modelName = String(modelInput.value || "").trim();
      const promptText = String(promptInput.value || "").trim();
      if (!modelName) {
        alert(t("dialog.aiBuild.modelRequired"));
        modelInput.focus();
        return;
      }
      if (!promptText) {
        alert(t("dialog.aiBuild.promptRequired"));
        promptInput.focus();
        return;
      }
      savePreferredAiModel(modelName);
      close({ mode: "codex", modelName, promptText });
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") {
        close(null);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    };

    cancelBtn.addEventListener("click", () => close(null));
    codexBtn.addEventListener("click", submitToCodex);
    submitBtn.addEventListener("click", submit);
    bindAiModelPresetControl({
      selectEl: modelPresetSelect,
      inputEl: modelInput,
    });
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) close(null);
    });
    document.addEventListener("keydown", onKeydown);

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
    promptInput.focus();
  });
}

function showScriptBuildDialog(dbType) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "app-dialog-backdrop";

    const dialog = document.createElement("div");
    dialog.className = "app-dialog app-dialog-wide ai-builder-dialog";
    dialog.innerHTML = `
      <h3>${escapeHtml(t("dialog.scriptBuild.title"))}</h3>
      <p>${escapeHtml(tr("dialog.scriptBuild.desc", { dbType }))}</p>
      <div class="ai-builder-form">
        <label>
          ${escapeHtml(t("dialog.scriptBuild.label"))}
          <textarea id="scriptBuildInput" placeholder="${escapeHtml(t("dialog.scriptBuild.placeholder"))}"></textarea>
        </label>
        <div id="scriptBuildSyntaxPanel" class="script-build-check empty">${escapeHtml(t("dialog.scriptBuild.emptyHint"))}</div>
      </div>
      <div class="app-dialog-actions">
        <button type="button" class="app-dialog-btn ghost" id="scriptBuildCancelBtn">${escapeHtml(t("common.cancel"))}</button>
        <button type="button" class="app-dialog-btn primary" id="scriptBuildSubmitBtn">${escapeHtml(t("common.confirm"))}</button>
      </div>
    `;

    const scriptInput = dialog.querySelector("#scriptBuildInput");
    const syntaxPanel = dialog.querySelector("#scriptBuildSyntaxPanel");
    const cancelBtn = dialog.querySelector("#scriptBuildCancelBtn");
    const submitBtn = dialog.querySelector("#scriptBuildSubmitBtn");

    const renderSyntaxIssues = (issues) => {
      const list = Array.isArray(issues) ? issues : [];
      if (list.length === 0) {
        syntaxPanel.className = "script-build-check ok";
        syntaxPanel.innerHTML = `<div class="script-build-status-ok">${escapeHtml(t("dialog.scriptBuild.passed"))}</div>`;
        scriptInput.classList.remove("sql-invalid");
        return;
      }

      const items = list.slice(0, 20).map((item) => {
        const location = tr("dialog.scriptBuild.lineCol", { line: item.line, column: item.column });
        const excerpt = item.excerpt ? `<div class="script-build-error-line">${escapeHtml(item.excerpt)}</div>` : "";
        return `
          <div class="script-build-error-item">
            <span class="script-build-error-mark">❌</span>
            <div class="script-build-error-main">
              <div class="script-build-error-msg">${escapeHtml(location)}：${escapeHtml(item.message)}</div>
              ${excerpt}
            </div>
          </div>
        `;
      }).join("");
      const more = list.length > 20
        ? `<div class="script-build-error-more">${escapeHtml(tr("dialog.scriptBuild.moreIssues", { count: list.length - 20 }))}</div>`
        : "";
      syntaxPanel.className = "script-build-check has-error";
      syntaxPanel.innerHTML = `${items}${more}`;
      scriptInput.classList.add("sql-invalid");
    };

    const runSyntaxCheck = () => {
      const raw = String(scriptInput.value || "");
      const trimmed = raw.trim();
      if (!trimmed) {
        syntaxPanel.className = "script-build-check empty";
        syntaxPanel.textContent = t("dialog.scriptBuild.emptyHint");
        scriptInput.classList.remove("sql-invalid");
        return [];
      }
      const issues = collectCreateTableSqlSyntaxIssues(raw, { dbType });
      renderSyntaxIssues(issues);
      return issues;
    };

    const cleanup = () => {
      document.removeEventListener("keydown", onKeydown);
      backdrop.remove();
    };
    const close = (value) => {
      cleanup();
      resolve(value);
    };
    const submit = () => {
      const scriptText = String(scriptInput.value || "").trim();
      if (!scriptText) {
        alert(t("dialog.scriptBuild.inputRequired"));
        scriptInput.focus();
        return;
      }
      const issues = runSyntaxCheck();
      if (issues.length > 0) {
        scriptInput.focus();
        return;
      }
      close(scriptText);
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") {
        close(null);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    };

    cancelBtn.addEventListener("click", () => close(null));
    submitBtn.addEventListener("click", submit);
    scriptInput.addEventListener("input", runSyntaxCheck);
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) close(null);
    });
    document.addEventListener("keydown", onKeydown);

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
    runSyntaxCheck();
    scriptInput.focus();
  });
}

function skipSqlSpaces(text, startIndex = 0) {
  let index = Number.isFinite(startIndex) ? startIndex : 0;
  while (index < text.length && /\s/.test(text[index])) {
    index += 1;
  }
  return index;
}

function isSqlWordChar(char) {
  return /[a-z0-9_$]/i.test(char || "");
}

function normalizeSqlNameKey(name) {
  return String(name || "").trim().toLocaleLowerCase();
}

function readSqlIdentifierToken(text, startIndex = 0) {
  const length = text.length;
  let index = skipSqlSpaces(text, startIndex);
  if (index >= length) return null;

  const first = text[index];
  if (first === "`") {
    index += 1;
    let value = "";
    while (index < length) {
      const ch = text[index];
      if (ch === "`") {
        if (text[index + 1] === "`") {
          value += "`";
          index += 2;
          continue;
        }
        index += 1;
        return { value, nextIndex: index };
      }
      value += ch;
      index += 1;
    }
    return { value, nextIndex: index };
  }

  if (first === "\"") {
    index += 1;
    let value = "";
    while (index < length) {
      const ch = text[index];
      if (ch === "\"") {
        if (text[index + 1] === "\"") {
          value += "\"";
          index += 2;
          continue;
        }
        index += 1;
        return { value, nextIndex: index };
      }
      value += ch;
      index += 1;
    }
    return { value, nextIndex: index };
  }

  if (first === "[") {
    index += 1;
    let value = "";
    while (index < length) {
      const ch = text[index];
      if (ch === "]") {
        index += 1;
        return { value, nextIndex: index };
      }
      value += ch;
      index += 1;
    }
    return { value, nextIndex: index };
  }

  let value = "";
  while (index < length) {
    const ch = text[index];
    if (/\s/.test(ch) || ch === "." || ch === "," || ch === "(" || ch === ")" || ch === ";" || ch === "'") {
      break;
    }
    value += ch;
    index += 1;
  }
  if (!value) return null;
  return { value, nextIndex: index };
}

function readSqlQualifiedIdentifier(text, startIndex = 0) {
  const parts = [];
  let index = skipSqlSpaces(text, startIndex);
  const first = readSqlIdentifierToken(text, index);
  if (!first || !first.value) return null;
  parts.push(first.value.trim());
  index = first.nextIndex;

  while (true) {
    index = skipSqlSpaces(text, index);
    if (text[index] !== ".") break;
    index += 1;
    const next = readSqlIdentifierToken(text, index);
    if (!next || !next.value) break;
    parts.push(next.value.trim());
    index = next.nextIndex;
  }

  return {
    parts,
    nextIndex: index,
  };
}

function findMatchingSqlParen(text, openIndex) {
  if (openIndex < 0 || text[openIndex] !== "(") return -1;
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inBracket = false;

  for (let index = openIndex; index < text.length; index += 1) {
    const ch = text[index];
    const next = text[index + 1];

    if (inSingle) {
      if (ch === "'" && next === "'") {
        index += 1;
      } else if (ch === "'") {
        inSingle = false;
      }
      continue;
    }
    if (inDouble) {
      if (ch === "\"" && next === "\"") {
        index += 1;
      } else if (ch === "\"") {
        inDouble = false;
      }
      continue;
    }
    if (inBacktick) {
      if (ch === "`" && next === "`") {
        index += 1;
      } else if (ch === "`") {
        inBacktick = false;
      }
      continue;
    }
    if (inBracket) {
      if (ch === "]") {
        inBracket = false;
      }
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === "\"") {
      inDouble = true;
      continue;
    }
    if (ch === "`") {
      inBacktick = true;
      continue;
    }
    if (ch === "[") {
      inBracket = true;
      continue;
    }
    if (ch === "(") {
      depth += 1;
      continue;
    }
    if (ch === ")") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function splitSqlByTopLevelCommaWithRanges(text) {
  const segments = [];
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inBracket = false;
  let segmentStart = 0;

  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index];
    const next = text[index + 1];

    if (inSingle) {
      if (ch === "'" && next === "'") {
        index += 1;
      } else if (ch === "'") {
        inSingle = false;
      }
      continue;
    }
    if (inDouble) {
      if (ch === "\"" && next === "\"") {
        index += 1;
      } else if (ch === "\"") {
        inDouble = false;
      }
      continue;
    }
    if (inBacktick) {
      if (ch === "`" && next === "`") {
        index += 1;
      } else if (ch === "`") {
        inBacktick = false;
      }
      continue;
    }
    if (inBracket) {
      if (ch === "]") {
        inBracket = false;
      }
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === "\"") {
      inDouble = true;
      continue;
    }
    if (ch === "`") {
      inBacktick = true;
      continue;
    }
    if (ch === "[") {
      inBracket = true;
      continue;
    }
    if (ch === "(") {
      depth += 1;
      continue;
    }
    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (ch === "," && depth === 0) {
      segments.push({
        text: text.slice(segmentStart, index),
        start: segmentStart,
        end: index,
      });
      segmentStart = index + 1;
    }
  }

  segments.push({
    text: text.slice(segmentStart),
    start: segmentStart,
    end: text.length,
  });
  return segments.map((item) => ({
    ...item,
    text: item.text.trim(),
  })).filter((item) => Boolean(item.text));
}

function splitSqlByTopLevelComma(text) {
  return splitSqlByTopLevelCommaWithRanges(text).map((item) => item.text);
}

function stripSqlComments(sqlText) {
  const text = String(sqlText || "");
  let result = "";
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inBracket = false;

  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index];
    const next = text[index + 1];

    if (inSingle) {
      result += ch;
      if (ch === "'" && next === "'") {
        result += next;
        index += 1;
      } else if (ch === "'") {
        inSingle = false;
      }
      continue;
    }
    if (inDouble) {
      result += ch;
      if (ch === "\"" && next === "\"") {
        result += next;
        index += 1;
      } else if (ch === "\"") {
        inDouble = false;
      }
      continue;
    }
    if (inBacktick) {
      result += ch;
      if (ch === "`" && next === "`") {
        result += next;
        index += 1;
      } else if (ch === "`") {
        inBacktick = false;
      }
      continue;
    }
    if (inBracket) {
      result += ch;
      if (ch === "]") {
        inBracket = false;
      }
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      result += ch;
      continue;
    }
    if (ch === "\"") {
      inDouble = true;
      result += ch;
      continue;
    }
    if (ch === "`") {
      inBacktick = true;
      result += ch;
      continue;
    }
    if (ch === "[") {
      inBracket = true;
      result += ch;
      continue;
    }

    if (ch === "/" && next === "*") {
      result += "  ";
      index += 2;
      while (index < text.length) {
        const blockChar = text[index];
        const blockNext = text[index + 1];
        if (blockChar === "*" && blockNext === "/") {
          result += "  ";
          index += 1;
          break;
        }
        result += blockChar === "\n" ? "\n" : " ";
        index += 1;
      }
      continue;
    }

    if ((ch === "-" && next === "-") || ch === "#") {
      while (index < text.length && text[index] !== "\n") {
        result += " ";
        index += 1;
      }
      if (index < text.length) {
        result += "\n";
      }
      continue;
    }

    result += ch;
  }

  return result;
}

function splitSqlStatementsWithRanges(sqlText) {
  const text = String(sqlText || "");
  const statements = [];
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inBracket = false;
  let start = 0;

  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index];
    const next = text[index + 1];

    if (inSingle) {
      if (ch === "'" && next === "'") {
        index += 1;
      } else if (ch === "'") {
        inSingle = false;
      }
      continue;
    }
    if (inDouble) {
      if (ch === "\"" && next === "\"") {
        index += 1;
      } else if (ch === "\"") {
        inDouble = false;
      }
      continue;
    }
    if (inBacktick) {
      if (ch === "`" && next === "`") {
        index += 1;
      } else if (ch === "`") {
        inBacktick = false;
      }
      continue;
    }
    if (inBracket) {
      if (ch === "]") {
        inBracket = false;
      }
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === "\"") {
      inDouble = true;
      continue;
    }
    if (ch === "`") {
      inBacktick = true;
      continue;
    }
    if (ch === "[") {
      inBracket = true;
      continue;
    }
    if (ch === "(") {
      depth += 1;
      continue;
    }
    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (ch === ";" && depth === 0) {
      const raw = text.slice(start, index);
      const left = raw.search(/\S/);
      if (left >= 0) {
        const right = raw.length - 1;
        let trimRight = right;
        while (trimRight >= left && /\s/.test(raw[trimRight])) {
          trimRight -= 1;
        }
        statements.push({
          text: raw.slice(left, trimRight + 1),
          start: start + left,
          end: start + trimRight + 1,
        });
      }
      start = index + 1;
    }
  }

  const tailRaw = text.slice(start);
  const tailLeft = tailRaw.search(/\S/);
  if (tailLeft >= 0) {
    let tailRight = tailRaw.length - 1;
    while (tailRight >= tailLeft && /\s/.test(tailRaw[tailRight])) {
      tailRight -= 1;
    }
    statements.push({
      text: tailRaw.slice(tailLeft, tailRight + 1),
      start: start + tailLeft,
      end: start + tailRight + 1,
    });
  }
  return statements;
}

function splitSqlStatements(sqlText) {
  return splitSqlStatementsWithRanges(sqlText).map((item) => item.text);
}

function locateSqlTextIndex(text, rawIndex) {
  const safeText = String(text || "");
  const maxIndex = safeText.length;
  const index = Math.max(0, Math.min(Number.isFinite(rawIndex) ? rawIndex : 0, maxIndex));
  let line = 1;
  let column = 1;
  for (let i = 0; i < index; i += 1) {
    if (safeText[i] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { index, line, column };
}

function readSqlLineByIndex(text, rawIndex) {
  const safeText = String(text || "");
  const index = Math.max(0, Math.min(Number.isFinite(rawIndex) ? rawIndex : 0, safeText.length));
  const lineStart = safeText.lastIndexOf("\n", Math.max(0, index - 1));
  const lineEnd = safeText.indexOf("\n", index);
  const start = lineStart < 0 ? 0 : lineStart + 1;
  const end = lineEnd < 0 ? safeText.length : lineEnd;
  return safeText.slice(start, end);
}

function makeSqlSyntaxIssue(text, rawIndex, message) {
  const pos = locateSqlTextIndex(text, rawIndex);
  return {
    message: String(message || t("error.sqlSyntax")),
    index: pos.index,
    line: pos.line,
    column: pos.column,
    excerpt: readSqlLineByIndex(text, pos.index),
  };
}

function createSqlParseError(message, rawIndex) {
  const error = new Error(String(message || t("error.sqlSyntax")));
  error.sqlErrorIndex = Number.isFinite(rawIndex) ? Math.max(0, rawIndex) : 0;
  return error;
}

function uniqueSqlIssues(issues) {
  const seen = new Set();
  const result = [];
  issues.forEach((item) => {
    if (!item || !item.message) return;
    const key = `${item.index}|${item.message}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });
  return result;
}

function collectSqlDelimiterIssues(sqlText) {
  const text = String(sqlText || "");
  const issues = [];
  const parenStack = [];
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inBracket = false;
  let singleStart = -1;
  let doubleStart = -1;
  let backtickStart = -1;
  let bracketStart = -1;

  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index];
    const next = text[index + 1];

    if (inSingle) {
      if (ch === "'" && next === "'") {
        index += 1;
      } else if (ch === "'") {
        inSingle = false;
      }
      continue;
    }
    if (inDouble) {
      if (ch === "\"" && next === "\"") {
        index += 1;
      } else if (ch === "\"") {
        inDouble = false;
      }
      continue;
    }
    if (inBacktick) {
      if (ch === "`" && next === "`") {
        index += 1;
      } else if (ch === "`") {
        inBacktick = false;
      }
      continue;
    }
    if (inBracket) {
      if (ch === "]") {
        inBracket = false;
      }
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      singleStart = index;
      continue;
    }
    if (ch === "\"") {
      inDouble = true;
      doubleStart = index;
      continue;
    }
    if (ch === "`") {
      inBacktick = true;
      backtickStart = index;
      continue;
    }
    if (ch === "[") {
      inBracket = true;
      bracketStart = index;
      continue;
    }
    if (ch === "(") {
      parenStack.push(index);
      continue;
    }
    if (ch === ")") {
      if (parenStack.length === 0) {
        issues.push(makeSqlSyntaxIssue(text, index, "存在未匹配的右括号 `)`。"));
      } else {
        parenStack.pop();
      }
    }
  }

  if (inSingle) {
    issues.push(makeSqlSyntaxIssue(text, singleStart, "单引号字符串未闭合。"));
  }
  if (inDouble) {
    issues.push(makeSqlSyntaxIssue(text, doubleStart, "双引号标识符未闭合。"));
  }
  if (inBacktick) {
    issues.push(makeSqlSyntaxIssue(text, backtickStart, "反引号标识符未闭合。"));
  }
  if (inBracket) {
    issues.push(makeSqlSyntaxIssue(text, bracketStart, "方括号标识符未闭合。"));
  }
  if (parenStack.length > 0) {
    const first = parenStack[parenStack.length - 1];
    issues.push(makeSqlSyntaxIssue(text, first, "左括号 `(` 未找到匹配的右括号。"));
  }

  return uniqueSqlIssues(issues).sort((a, b) => a.index - b.index);
}

function formatSqlSyntaxIssueSummary(issues) {
  const list = Array.isArray(issues) ? issues : [];
  if (list.length === 0) return "SQL 语法检查失败。";
  const top = list.slice(0, 3).map((item) => `第${item.line}行第${item.column}列：${item.message}`);
  const suffix = list.length > 3 ? `（其余 ${list.length - 3} 处请在错误列表查看）` : "";
  return `SQL 语法检查失败：${top.join("；")} ${suffix}`.trim();
}

function collectCreateTableSqlSyntaxIssues(scriptText, options = {}) {
  const dbType = String(options?.dbType || "").trim();
  const cleanedScript = stripSqlComments(scriptText);
  const issues = collectSqlDelimiterIssues(cleanedScript);
  if (issues.length > 0) return issues;

  const statements = splitSqlStatementsWithRanges(cleanedScript);
  const createStatements = statements.filter((item) => /^\s*create\s+table\b/i.test(item.text));
  if (createStatements.length === 0) {
    return [makeSqlSyntaxIssue(cleanedScript, 0, "未识别到可用的 CREATE TABLE 语句。")];
  }

  createStatements.forEach((item) => {
    try {
      parseCreateTableStatement(item.text, {
        strict: true,
        statementOffset: item.start,
        dbType,
      });
    } catch (error) {
      const fallbackIndex = item.start;
      const issueIndex = Number.isFinite(error?.sqlErrorIndex) ? error.sqlErrorIndex : fallbackIndex;
      issues.push(makeSqlSyntaxIssue(cleanedScript, issueIndex, error?.message || "CREATE TABLE 语法错误。"));
    }
  });

  return uniqueSqlIssues(issues).sort((a, b) => a.index - b.index);
}

function hasSqlKeywordAt(textLower, index, keyword) {
  if (!textLower.startsWith(keyword, index)) return false;
  const prev = index > 0 ? textLower[index - 1] : " ";
  const next = index + keyword.length < textLower.length ? textLower[index + keyword.length] : " ";
  return !isSqlWordChar(prev) && !isSqlWordChar(next);
}

function findTopLevelSqlKeywordIndex(text, keywords, startIndex = 0) {
  const lower = String(text || "").toLowerCase();
  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inBracket = false;

  for (let index = Math.max(0, startIndex); index < lower.length; index += 1) {
    const ch = lower[index];
    const next = lower[index + 1];

    if (inSingle) {
      if (ch === "'" && next === "'") {
        index += 1;
      } else if (ch === "'") {
        inSingle = false;
      }
      continue;
    }
    if (inDouble) {
      if (ch === "\"" && next === "\"") {
        index += 1;
      } else if (ch === "\"") {
        inDouble = false;
      }
      continue;
    }
    if (inBacktick) {
      if (ch === "`" && next === "`") {
        index += 1;
      } else if (ch === "`") {
        inBacktick = false;
      }
      continue;
    }
    if (inBracket) {
      if (ch === "]") {
        inBracket = false;
      }
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === "\"") {
      inDouble = true;
      continue;
    }
    if (ch === "`") {
      inBacktick = true;
      continue;
    }
    if (ch === "[") {
      inBracket = true;
      continue;
    }
    if (ch === "(") {
      depth += 1;
      continue;
    }
    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth !== 0) {
      continue;
    }

    for (const keyword of sortedKeywords) {
      if (hasSqlKeywordAt(lower, index, keyword)) return index;
    }
  }

  return -1;
}

function parseSqlLiteralString(rawText) {
  const text = String(rawText || "").trim();
  if (!text) return "";
  if (text.startsWith("'") && text.endsWith("'")) {
    return text.slice(1, -1).replaceAll("''", "'");
  }
  if (text.startsWith("\"") && text.endsWith("\"")) {
    return text.slice(1, -1).replaceAll("\"\"", "\"");
  }
  return text;
}

function normalizeSqlTypeName(baseType) {
  const raw = String(baseType || "").replace(/\s+/g, " ").trim();
  if (!raw) return "varchar";
  const lower = raw.toLowerCase();
  if (lower === "character varying") return "varchar";
  if (lower === "character") return "char";
  if (lower === "timestamp with time zone") return "timestamptz";
  if (lower === "timestamp without time zone") return "timestamp";
  if (lower.endsWith(" unsigned")) return raw.slice(0, -9).trim();
  if (lower === "serial") return "integer";
  if (lower === "bigserial") return "bigint";
  return raw;
}

function parseSqlTypeSpec(rawText) {
  const stopKeywords = [
    "not null",
    "null",
    "default",
    "primary key",
    "auto_increment",
    "comment",
    "constraint",
    "references",
    "unique",
    "check",
    "collate",
    "generated",
    "identity",
  ];
  const firstStopIndex = findTopLevelSqlKeywordIndex(rawText, stopKeywords, 0);
  const typePart = (firstStopIndex < 0 ? rawText : rawText.slice(0, firstStopIndex)).trim();
  const attrPart = firstStopIndex < 0 ? "" : rawText.slice(firstStopIndex).trim();
  const hasTypeName = Boolean(typePart);

  let rawBaseType = typePart;
  let length = "";
  let precision = "";
  let scale = "";
  const typeMatch = typePart.match(/^(.+?)\s*\(([^()]*)\)\s*$/);
  if (typeMatch) {
    rawBaseType = typeMatch[1].trim();
    const params = typeMatch[2].split(",").map((item) => item.trim()).filter(Boolean);
    if (params.length >= 2) {
      precision = params[0] || "";
      scale = params[1] || "";
    } else if (params.length === 1) {
      length = params[0];
    }
  }
  rawBaseType = normalizeSqlTypeName(rawBaseType);
  const lowerType = rawBaseType.toLowerCase();
  if ((lowerType === "decimal" || lowerType === "numeric") && length && !precision) {
    precision = length;
    length = "";
  }

  return {
    hasTypeName,
    rawBaseType,
    dataType: rawBaseType || "varchar",
    length,
    precision,
    scale,
    attrPart,
  };
}

function normalizeSqlTypeKey(typeName) {
  return String(typeName || "").trim().toLowerCase();
}

function normalizeSqlTypeKeyByDb(typeName, dbType) {
  const key = normalizeSqlTypeKey(typeName);
  if (!key) return "";
  if (dbType === "MySQL 8") {
    if (key === "integer") return "int";
    if (key === "bool") return "boolean";
    if (key === "numeric") return "decimal";
    return key;
  }
  if (dbType === "PostgreSQL 14") {
    if (key === "bool") return "boolean";
    if (key === "decimal") return "numeric";
    if (key === "int" || key === "int4") return "integer";
    if (key === "int8") return "bigint";
    return key;
  }
  if (dbType === "MSSQL") {
    if (key === "integer") return "int";
    if (key === "bool") return "bit";
    return key;
  }
  return key;
}

function isPositiveIntegerText(value) {
  return /^[1-9]\d*$/.test(String(value || "").trim());
}

function isNonNegativeIntegerText(value) {
  return /^(0|[1-9]\d*)$/.test(String(value || "").trim());
}

function validateSqlTypeSpecForDb(typeSpec, dbType) {
  const targetDb = String(dbType || "").trim();
  const rawBaseType = normalizeSqlTypeKey(typeSpec?.rawBaseType);
  const baseType = normalizeSqlTypeKeyByDb(rawBaseType, targetDb);
  const rawLength = String(typeSpec?.length || "").trim();
  const rawPrecision = String(typeSpec?.precision || "").trim();
  const rawScale = String(typeSpec?.scale || "").trim();
  const hasLength = rawLength !== "";
  const hasPrecision = rawPrecision !== "";
  const hasScale = rawScale !== "";
  const hasNumericArg = hasLength || hasPrecision || hasScale;

  if (!targetDb || !baseType) return "";

  if (targetDb !== "SQLite") {
    const supportedTypeKeys = new Set(
      getFieldTypesByDbType(targetDb).map((item) => normalizeSqlTypeKey(item)),
    );
    if (supportedTypeKeys.size > 0 && !supportedTypeKeys.has(baseType)) {
      return `数据类型 ${typeSpec?.rawBaseType || baseType} 不受 ${targetDb} 支持。`;
    }
  }

  if (hasLength && (hasPrecision || hasScale)) {
    return "长度与精度/小数位不能同时设置。";
  }
  if (hasPrecision && !isPositiveIntegerText(rawPrecision)) {
    return "精度必须为正整数。";
  }
  if (hasScale && !isNonNegativeIntegerText(rawScale)) {
    return "小数位必须为非负整数。";
  }
  if (hasScale && !hasPrecision) {
    return "设置小数位时必须同时设置精度。";
  }
  if (hasPrecision && hasScale && Number(rawScale) > Number(rawPrecision)) {
    return "小数位不能大于精度。";
  }

  if (targetDb === "MySQL 8") {
    if ((baseType === "varchar" || baseType === "char") && !hasLength) {
      return `MySQL 8 中 ${baseType.toUpperCase()} 必须指定长度，例如 ${baseType.toUpperCase()}(255)。`;
    }
    if ((baseType === "varchar" || baseType === "char" || baseType === "tinyint" || baseType === "smallint" || baseType === "int" || baseType === "bigint")
      && hasLength
      && !isPositiveIntegerText(rawLength)) {
      return "长度必须为正整数。";
    }
    if ((baseType === "json" || baseType === "date" || baseType === "datetime" || baseType === "timestamp" || baseType === "boolean")
      && hasNumericArg) {
      return `${baseType.toUpperCase()} 不接受长度/精度参数。`;
    }
    return "";
  }

  if (targetDb === "PostgreSQL 14") {
    if ((baseType === "varchar" || baseType === "char") && hasLength && !isPositiveIntegerText(rawLength)) {
      return "长度必须为正整数。";
    }
    if (baseType === "numeric") {
      return "";
    }
    if (baseType === "varchar" || baseType === "char") {
      if (hasPrecision || hasScale) {
        return `${baseType.toUpperCase()} 只支持长度，不支持精度/小数位。`;
      }
      return "";
    }
    if (hasNumericArg) {
      return `${typeSpec?.rawBaseType || baseType} 不接受长度/精度参数。`;
    }
    return "";
  }

  if (targetDb === "MSSQL") {
    if (baseType === "varchar" || baseType === "nvarchar") {
      if (!hasLength) {
        return `${baseType.toUpperCase()} 必须指定长度，或使用 MAX。`;
      }
      if (rawLength.toLowerCase() !== "max" && !isPositiveIntegerText(rawLength)) {
        return `${baseType.toUpperCase()} 长度必须为正整数或 MAX。`;
      }
      if (hasPrecision || hasScale) {
        return `${baseType.toUpperCase()} 只支持长度，不支持精度/小数位。`;
      }
      return "";
    }
    if (baseType === "char") {
      if (!hasLength) {
        return "CHAR 必须指定长度。";
      }
      if (!isPositiveIntegerText(rawLength)) {
        return "CHAR 长度必须为正整数。";
      }
      if (hasPrecision || hasScale) {
        return "CHAR 只支持长度，不支持精度/小数位。";
      }
      return "";
    }
    if (baseType === "decimal" || baseType === "numeric") {
      if (hasLength) {
        return `${baseType.toUpperCase()} 使用精度/小数位，不使用长度。`;
      }
      if (hasPrecision) {
        const precision = Number(rawPrecision);
        if (precision < 1 || precision > 38) {
          return `${baseType.toUpperCase()} 精度范围必须在 1 到 38。`;
        }
      }
      if (hasScale) {
        const scale = Number(rawScale);
        if (scale > 38) {
          return `${baseType.toUpperCase()} 小数位范围必须在 0 到 38。`;
        }
      }
      return "";
    }
    if (baseType === "float") {
      if (hasPrecision || hasScale) {
        return "FLOAT 使用长度参数，不使用精度/小数位。";
      }
      if (hasLength) {
        const bits = Number(rawLength);
        if (!isPositiveIntegerText(rawLength) || bits < 1 || bits > 53) {
          return "FLOAT 长度范围必须在 1 到 53。";
        }
      }
      return "";
    }
    if (hasNumericArg) {
      return `${typeSpec?.rawBaseType || baseType} 不接受长度/精度参数。`;
    }
    return "";
  }

  if (targetDb === "SQLite") {
    if (hasLength && !isPositiveIntegerText(rawLength)) {
      return "长度必须为正整数。";
    }
    return "";
  }
  return "";
}

function parseSqlDefaultExpression(attrText) {
  const startIndex = findTopLevelSqlKeywordIndex(attrText, ["default"], 0);
  if (startIndex < 0) return "";
  const valueStart = skipSqlSpaces(attrText, startIndex + "default".length);
  const endKeywords = [
    "not null",
    "null",
    "primary key",
    "auto_increment",
    "comment",
    "constraint",
    "references",
    "unique",
    "check",
    "collate",
    "generated",
    "identity",
  ];
  const valueEnd = findTopLevelSqlKeywordIndex(attrText, endKeywords, valueStart);
  return attrText.slice(valueStart, valueEnd < 0 ? attrText.length : valueEnd).trim();
}

function parseSqlPrimaryKeyColumns(itemText) {
  const lower = itemText.toLowerCase();
  const keywordIndex = lower.indexOf("primary key");
  if (keywordIndex < 0) return [];
  const openIndex = itemText.indexOf("(", keywordIndex);
  if (openIndex < 0) return [];
  const closeIndex = findMatchingSqlParen(itemText, openIndex);
  if (closeIndex < 0) return [];
  const columnsText = itemText.slice(openIndex + 1, closeIndex);
  const parts = splitSqlByTopLevelComma(columnsText);
  return parts
    .map((part) => {
      const token = readSqlQualifiedIdentifier(part, 0);
      if (!token || !Array.isArray(token.parts) || token.parts.length === 0) return "";
      return token.parts[token.parts.length - 1];
    })
    .filter(Boolean);
}

function parseSqlColumnDefinition(definitionText, options = {}) {
  const strict = Boolean(options?.strict);
  const errorIndex = Number.isFinite(options?.errorIndex) ? options.errorIndex : 0;
  const dbType = String(options?.dbType || "").trim();
  const identifier = readSqlIdentifierToken(definitionText, 0);
  if (!identifier || !identifier.value) {
    if (strict) {
      throw createSqlParseError("字段定义缺少字段名。", errorIndex);
    }
    return null;
  }
  const code = identifier.value.trim();
  if (!code) {
    if (strict) {
      throw createSqlParseError("字段定义缺少字段名。", errorIndex);
    }
    return null;
  }

  const rest = definitionText.slice(identifier.nextIndex).trim();
  if (!rest) {
    if (strict) {
      throw createSqlParseError(`字段 ${code} 缺少数据类型。`, errorIndex);
    }
    return null;
  }

  const typeSpec = parseSqlTypeSpec(rest);
  if (strict && !typeSpec.hasTypeName) {
    throw createSqlParseError(`字段 ${code} 缺少数据类型。`, errorIndex);
  }
  if (strict) {
    const typeError = validateSqlTypeSpecForDb(typeSpec, dbType);
    if (typeError) {
      throw createSqlParseError(`字段 ${code} ${typeError}`, errorIndex);
    }
  }
  const attrText = typeSpec.attrPart;
  const lowerAttr = attrText.toLowerCase();
  const isSerialType = typeSpec.rawBaseType.toLowerCase() === "serial" || typeSpec.rawBaseType.toLowerCase() === "bigserial";
  const primaryKey = /\bprimary\s+key\b/i.test(attrText);
  const notNull = /\bnot\s+null\b/i.test(attrText) || primaryKey;
  const autoIncrement =
    isSerialType ||
    /\bauto_increment\b/i.test(attrText) ||
    /\bidentity\b/i.test(attrText) ||
    /\bgenerated\s+by\s+default\s+as\s+identity\b/i.test(lowerAttr) ||
    /\bgenerated\s+always\s+as\s+identity\b/i.test(lowerAttr);
  if (strict) {
    const autoIssue = validateAutoIncrementForDb(
      {
        autoIncrement,
        primaryKey,
        dataType: typeSpec.dataType,
      },
      dbType,
    );
    if (autoIssue) {
      throw createSqlParseError(`字段 ${code} ${autoIssue}`, errorIndex);
    }
  }
  const defaultValue = parseSqlDefaultExpression(attrText);
  const commentMatch = attrText.match(/\bcomment\s*(?:=)?\s*('(?:''|[^'])*'|"(?:\"\"|[^"])*")/i);
  const comment = commentMatch ? parseSqlLiteralString(commentMatch[1]) : "";

  return {
    name: code,
    code,
    dataType: typeSpec.dataType || "varchar",
    length: typeSpec.length,
    precision: typeSpec.precision,
    scale: typeSpec.scale,
    primaryKey,
    notNull,
    autoIncrement,
    defaultValue,
    comment,
  };
}

function parseCreateTableStatement(statementText, options = {}) {
  const strict = Boolean(options?.strict);
  const statementOffset = Number.isFinite(options?.statementOffset) ? options.statementOffset : 0;
  const dbType = String(options?.dbType || "").trim();
  const issueAt = (indexInStatement, message) => {
    if (strict) {
      throw createSqlParseError(message, statementOffset + Math.max(0, indexInStatement));
    }
    return null;
  };
  const createPrefix = /^\s*create\s+table\s+(?:if\s+not\s+exists\s+)?/i;
  const prefixMatch = statementText.match(createPrefix);
  if (!prefixMatch) return issueAt(0, "语句不是有效的 CREATE TABLE。");

  let cursor = prefixMatch[0].length;
  const tableRef = readSqlQualifiedIdentifier(statementText, cursor);
  if (!tableRef || !Array.isArray(tableRef.parts) || tableRef.parts.length === 0) {
    return issueAt(cursor, "CREATE TABLE 缺少表名。");
  }
  cursor = skipSqlSpaces(statementText, tableRef.nextIndex);
  if (statementText[cursor] !== "(") {
    return issueAt(cursor, "CREATE TABLE 表名后缺少 `(`。");
  }
  const closeIndex = findMatchingSqlParen(statementText, cursor);
  if (closeIndex < 0) {
    return issueAt(cursor, "CREATE TABLE 字段列表括号未闭合。");
  }

  const tableCode = tableRef.parts[tableRef.parts.length - 1];
  const body = statementText.slice(cursor + 1, closeIndex);
  const tail = statementText.slice(closeIndex + 1);
  const bodyItems = splitSqlByTopLevelCommaWithRanges(body);
  if (bodyItems.length === 0) {
    return issueAt(cursor + 1, `CREATE TABLE ${tableCode} 未定义任何字段。`);
  }
  const fields = [];
  const primaryKeyCodes = new Set();

  bodyItems.forEach((item) => {
    const text = item.text.trim();
    const itemStart = cursor + 1 + item.start;
    if (!text) return;
    if (/^(?:primary\s+key\b|constraint\b|foreign\s+key\b|unique\b|key\b|index\b)/i.test(text)) {
      parseSqlPrimaryKeyColumns(text).forEach((code) => {
        primaryKeyCodes.add(normalizeSqlNameKey(code));
      });
      return;
    }

    const field = parseSqlColumnDefinition(text, {
      strict,
      errorIndex: statementOffset + itemStart,
      dbType,
    });
    if (!field) return;
    fields.push(field);
    if (field.primaryKey) {
      primaryKeyCodes.add(normalizeSqlNameKey(field.code));
    }
  });

  if (strict && fields.length === 0) {
    return issueAt(cursor + 1, `CREATE TABLE ${tableCode} 未识别到有效字段定义。`);
  }

  fields.forEach((field) => {
    if (primaryKeyCodes.has(normalizeSqlNameKey(field.code))) {
      field.primaryKey = true;
      field.notNull = true;
    }
  });

  const commentMatch = tail.match(/\bcomment\s*=\s*('(?:''|[^'])*'|"(?:\"\"|[^"])*")/i);
  const comment = commentMatch ? parseSqlLiteralString(commentMatch[1]) : "";

  return {
    name: tableCode,
    code: tableCode,
    comment,
    fields,
  };
}

function parseCommentOnTableStatement(statementText) {
  const prefixMatch = statementText.match(/^\s*comment\s+on\s+table\s+/i);
  if (!prefixMatch) return null;
  const tableRef = readSqlQualifiedIdentifier(statementText, prefixMatch[0].length);
  if (!tableRef || !Array.isArray(tableRef.parts) || tableRef.parts.length === 0) return null;
  const tail = statementText.slice(tableRef.nextIndex);
  const isMatch = tail.match(/^\s*is\s+([\s\S]+)$/i);
  if (!isMatch) return null;
  return {
    tableCode: tableRef.parts[tableRef.parts.length - 1],
    comment: parseSqlLiteralString(isMatch[1]),
  };
}

function parseCommentOnColumnStatement(statementText) {
  const prefixMatch = statementText.match(/^\s*comment\s+on\s+column\s+/i);
  if (!prefixMatch) return null;
  const columnRef = readSqlQualifiedIdentifier(statementText, prefixMatch[0].length);
  if (!columnRef || !Array.isArray(columnRef.parts) || columnRef.parts.length < 2) return null;
  const tail = statementText.slice(columnRef.nextIndex);
  const isMatch = tail.match(/^\s*is\s+([\s\S]+)$/i);
  if (!isMatch) return null;
  const tableCode = columnRef.parts[columnRef.parts.length - 2];
  const columnCode = columnRef.parts[columnRef.parts.length - 1];
  return {
    tableCode,
    columnCode,
    comment: parseSqlLiteralString(isMatch[1]),
  };
}

function parseCreateTableSqlScript(scriptText, options = {}) {
  const dbType = String(options?.dbType || "").trim();
  const cleanedScript = stripSqlComments(scriptText);
  const syntaxIssues = collectCreateTableSqlSyntaxIssues(scriptText, { dbType });
  if (syntaxIssues.length > 0) {
    const error = new Error(formatSqlSyntaxIssueSummary(syntaxIssues));
    error.sqlIssues = syntaxIssues;
    throw error;
  }

  const statements = splitSqlStatements(cleanedScript);
  const parsedTables = [];
  const tableMap = new Map();

  statements.forEach((statement) => {
    if (!/^\s*create\s+table\b/i.test(statement)) return;
    const parsed = parseCreateTableStatement(statement, { dbType });
    if (!parsed || !Array.isArray(parsed.fields) || parsed.fields.length === 0) return;
    parsedTables.push(parsed);
    tableMap.set(normalizeSqlNameKey(parsed.code), parsed);
  });

  if (parsedTables.length === 0) {
    throw new Error(t("error.sqlNoCreateTable"));
  }

  statements.forEach((statement) => {
    const tableComment = parseCommentOnTableStatement(statement);
    if (tableComment) {
      const table = tableMap.get(normalizeSqlNameKey(tableComment.tableCode));
      if (table) {
        table.comment = tableComment.comment;
      }
      return;
    }
    const columnComment = parseCommentOnColumnStatement(statement);
    if (!columnComment) return;
    const table = tableMap.get(normalizeSqlNameKey(columnComment.tableCode));
    if (!table) return;
    const field = (table.fields || []).find(
      (item) => normalizeSqlNameKey(item.code) === normalizeSqlNameKey(columnComment.columnCode),
    );
    if (field) {
      field.comment = columnComment.comment;
    }
  });

  return parsedTables;
}

function validateAutoIncrementForDb(field, dbType) {
  if (!field?.autoIncrement) return "";
  const typeKey = normalizeSqlTypeKeyByDb(field?.dataType, dbType);

  if (dbType === "MySQL 8") {
    const allowed = new Set(["tinyint", "smallint", "int", "bigint"]);
    if (!allowed.has(typeKey)) {
      return "MySQL 8 的 AUTO_INCREMENT 仅支持整数类型（tinyint/smallint/int/bigint）。";
    }
    return "";
  }

  if (dbType === "PostgreSQL 14") {
    const allowed = new Set(["smallint", "integer", "bigint"]);
    if (!allowed.has(typeKey)) {
      return "PostgreSQL 14 的 IDENTITY 仅支持 smallint/integer/bigint。";
    }
    return "";
  }

  if (dbType === "SQLite") {
    if (typeKey !== "integer") {
      return "SQLite 的 AUTOINCREMENT 仅支持 INTEGER 类型。";
    }
    if (!field?.primaryKey) {
      return "SQLite 的 AUTOINCREMENT 字段必须是主键字段。";
    }
    return "";
  }

  if (dbType === "MSSQL") {
    const allowed = new Set(["tinyint", "smallint", "int", "bigint", "decimal", "numeric"]);
    if (!allowed.has(typeKey)) {
      return "MSSQL 的 IDENTITY 仅支持整数或 decimal/numeric。";
    }
    return "";
  }

  return "";
}

function collectModelSqlSyntaxDiagnostics(model) {
  const tableIssueMap = new Map();
  const issues = [];
  if (!model || !Array.isArray(model.tables)) {
    return {
      issues,
      issueCount: 0,
      tableIssueMap,
      tableErrorCount: 0,
    };
  }

  const dbType = String(model.dbType || DEFAULT_DB_TYPE).trim() || DEFAULT_DB_TYPE;
  const tableCodeMap = new Map();
  const pushIssue = (table, message) => {
    if (!table || !table.id || !message) return;
    const issue = {
      tableId: table.id,
      tableName: table.name || table.code || table.id,
      tableCode: table.code || "",
      message: String(message),
    };
    issues.push(issue);
    if (!tableIssueMap.has(table.id)) {
      tableIssueMap.set(table.id, []);
    }
    tableIssueMap.get(table.id).push(issue);
  };

  model.tables.forEach((table) => {
    ensureTableRuntimeData(table);

    const codeKey = normalizeSqlNameKey(table.code);
    if (codeKey) {
      if (!tableCodeMap.has(codeKey)) {
        tableCodeMap.set(codeKey, []);
      }
      tableCodeMap.get(codeKey).push(table);
    } else {
      pushIssue(table, "表 Code 不能为空。");
    }

    const fields = Array.isArray(table.fields) ? table.fields : [];
    if (fields.length === 0) {
      pushIssue(table, "表至少需要一个字段。");
      return;
    }

    const fieldCodeMap = new Map();
    fields.forEach((field, fieldIndex) => {
      const fieldCode = String(field?.code || "").trim();
      const fieldName = fieldCode || String(field?.name || `Field${fieldIndex + 1}`).trim() || `Field${fieldIndex + 1}`;

      if (!fieldCode) {
        pushIssue(table, `字段 ${fieldName} 的 Code 不能为空。`);
      } else {
        const fieldCodeKey = normalizeSqlNameKey(fieldCode);
        if (!fieldCodeMap.has(fieldCodeKey)) {
          fieldCodeMap.set(fieldCodeKey, []);
        }
        fieldCodeMap.get(fieldCodeKey).push(fieldName);
      }

      const rawType = String(field?.dataType || "").trim();
      if (!rawType) {
        pushIssue(table, `字段 ${fieldName} 缺少数据类型。`);
        return;
      }

      const typeSpec = {
        rawBaseType: rawType,
        length: String(field?.length || "").trim(),
        precision: String(field?.precision || "").trim(),
        scale: String(field?.scale || "").trim(),
      };
      const typeIssue = validateSqlTypeSpecForDb(typeSpec, dbType);
      if (typeIssue) {
        pushIssue(table, `字段 ${fieldName} ${typeIssue}`);
      }

      const autoIncrementIssue = validateAutoIncrementForDb(field, dbType);
      if (autoIncrementIssue) {
        pushIssue(table, `字段 ${fieldName} ${autoIncrementIssue}`);
      }
    });

    fieldCodeMap.forEach((fieldNames) => {
      if (fieldNames.length > 1) {
        pushIssue(table, `字段 Code 重复：${fieldNames[0]}`);
      }
    });

    if (dbType === "SQLite") {
      const autoFields = fields.filter((field) => Boolean(field?.autoIncrement));
      if (autoFields.length > 1) {
        pushIssue(table, "SQLite 每张表最多只能有一个 AUTOINCREMENT 字段。");
      }
      if (autoFields.length === 1) {
        const primaryKeyCount = fields.filter((field) => Boolean(field?.primaryKey)).length;
        if (primaryKeyCount > 1) {
          pushIssue(table, "SQLite 使用 AUTOINCREMENT 时，主键必须是单列主键。");
        }
      }
    }
  });

  tableCodeMap.forEach((items) => {
    if (items.length <= 1) return;
    items.forEach((table) => {
      pushIssue(table, `表 Code 重复：${table.code}`);
    });
  });

  return {
    issues,
    issueCount: issues.length,
    tableIssueMap,
    tableErrorCount: tableIssueMap.size,
  };
}

function buildModelSyntaxIssueSummary(diagnostics, maxCount = 6) {
  const list = Array.isArray(diagnostics?.issues) ? diagnostics.issues : [];
  if (list.length === 0) return "语法检查通过。";
  const max = Math.max(1, Number.isFinite(maxCount) ? maxCount : 6);
  const lines = list.slice(0, max).map((item) => `- [${item.tableName}] ${item.message}`);
  if (list.length > max) {
    lines.push(`- 其余 ${list.length - max} 处问题请在设计区红色 ❌ 标识的表上查看。`);
  }
  return lines.join("\n");
}

function focusFirstModelSyntaxIssue(diagnostics) {
  const firstIssue = Array.isArray(diagnostics?.issues) ? diagnostics.issues[0] : null;
  if (!firstIssue?.tableId) return;
  state.selectedTableId = firstIssue.tableId;
  state.selectedRelationId = null;
  activeInspectorTab = "fields";
  ensureInspectorVisible();
  render();
}

function runActiveModelSyntaxCheck(options = {}) {
  const showSuccessAlert = Boolean(options?.showSuccessAlert);
  const focusOnError = options?.focusOnError !== false;

  const model = getActiveModel();
  if (!model) {
    alert(t("alert.selectModelFirst"));
    return { ok: false, diagnostics: null, model: null };
  }
  if (!Array.isArray(model.tables) || model.tables.length === 0) {
    alert(t("alert.syntaxNoTable"));
    return { ok: false, diagnostics: null, model };
  }

  const diagnostics = collectModelSqlSyntaxDiagnostics(model);
  if (diagnostics.issueCount > 0) {
    if (focusOnError) {
      focusFirstModelSyntaxIssue(diagnostics);
    }
    alert(tr("alert.syntaxIssues", {
      issueCount: diagnostics.issueCount,
      tableCount: diagnostics.tableErrorCount,
      summary: buildModelSyntaxIssueSummary(diagnostics, 12),
    }));
    return { ok: false, diagnostics, model };
  }

  if (showSuccessAlert) {
    alert(tr("alert.syntaxPassed", { tableCount: model.tables.length }));
  }
  return { ok: true, diagnostics, model };
}

function normalizeAiBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = String(value || "").trim().toLowerCase();
  return text === "true" || text === "1" || text === "yes" || text === "y" || text === "是";
}

function normalizeAiFieldDraft(rawField, index, dbType, usedFieldNames, usedFieldCodes) {
  const fallback = createDefaultField(index, dbType);
  const preferredName = toTextOrEmpty(rawField?.name || rawField?.code).trim() || fallback.name;
  const preferredCode = toTextOrEmpty(rawField?.code || preferredName).trim() || preferredName;
  const name = makeUniqueText(usedFieldNames, preferredName);
  usedFieldNames.push(name);
  const code = makeUniqueText(usedFieldCodes, preferredCode);
  usedFieldCodes.push(code);

  const normalized = normalizeFieldTemplate(
    {
      name,
      code,
      dataType: mapFieldTypeToDbType(toTextOrEmpty(rawField?.dataType).trim() || fallback.dataType, dbType),
      length: toTextOrEmpty(rawField?.length),
      precision: toTextOrEmpty(rawField?.precision),
      scale: toTextOrEmpty(rawField?.scale),
      primaryKey: normalizeAiBoolean(rawField?.primaryKey),
      notNull: normalizeAiBoolean(rawField?.notNull),
      autoIncrement: normalizeAiBoolean(rawField?.autoIncrement),
      defaultValue: toTextOrEmpty(rawField?.defaultValue),
      comment: toTextOrEmpty(rawField?.comment).trim() || name,
    },
    index,
    dbType,
  );

  return {
    id: uid("field"),
    ...normalized,
  };
}

function importAiTablesToModel(model, schema, options = {}) {
  const includeTemplateFields = Boolean(options?.includeTemplateFields);
  const templateFields = includeTemplateFields ? getGlobalTemplateForDb(model.dbType) : [];
  const rawTables = Array.isArray(schema?.tables) ? schema.tables : [];
  if (rawTables.length === 0) {
    throw new Error(t("alert.aiNoTables"));
  }

  const existingTableNames = model.tables.map((item) => item.name);
  const existingTableCodes = model.tables.map((item) => item.code);
  const createdTables = [];

  rawTables.forEach((rawTable) => {
    const tableIndex = model.tables.length + createdTables.length + 1;
    const table = createDefaultTable(tableIndex, model.dbType, null);
    const preferredName = toTextOrEmpty(rawTable?.name || rawTable?.code).trim() || `Table${tableIndex}`;
    const name = makeUniqueText(existingTableNames, preferredName);
    existingTableNames.push(name);
    const preferredCode = toTextOrEmpty(rawTable?.code || name).trim() || name;
    const code = makeUniqueText(existingTableCodes, preferredCode);
    existingTableCodes.push(code);

    table.name = name;
    table.code = code;
    table.comment = toTextOrEmpty(rawTable?.comment).trim() || name;

    const usedFieldNames = [];
    const usedFieldCodes = [];
    const rawFields = Array.isArray(rawTable?.fields) ? rawTable.fields : [];
    const fields = rawFields.map((rawField, fieldIndex) =>
      normalizeAiFieldDraft(rawField, fieldIndex + 1, model.dbType, usedFieldNames, usedFieldCodes),
    );

    if (templateFields.length > 0) {
      const existingCodeSet = new Set(fields.map((field) => normalizeCodeKey(field.code)));
      templateFields.forEach((templateField) => {
        const preferredName = toTextOrEmpty(templateField?.name || templateField?.code).trim();
        const preferredCode = toTextOrEmpty(templateField?.code || preferredName).trim();
        if (!preferredCode) return;
        if (existingCodeSet.has(normalizeCodeKey(preferredCode))) return;
        const nextField = normalizeAiFieldDraft(
          {
            ...templateField,
            name: preferredName || preferredCode,
            code: preferredCode,
          },
          fields.length + 1,
          model.dbType,
          usedFieldNames,
          usedFieldCodes,
        );
        fields.push(nextField);
        existingCodeSet.add(normalizeCodeKey(nextField.code));
      });
    }

    if (fields.length === 0) {
      fields.push(normalizeAiFieldDraft({}, 1, model.dbType, usedFieldNames, usedFieldCodes));
    }

    table.fields = fields;
    table.indexes = [];
    syncPrimaryClusteredIndex(table);
    ensureTableRuntimeData(table);
    createdTables.push(table);
  });

  model.tables.push(...createdTables);
  return createdTables;
}

async function requestAiSchemaFromServer({ modelName, dbType, promptText }) {
  const apiKey = readStoredAiApiKey();
  const baseUrl = resolveAiBaseUrlForModel(modelName);
  const headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["x-openai-api-key"] = apiKey;
  }
  if (baseUrl) {
    headers["x-openai-base-url"] = baseUrl;
  }
  const response = await fetch("/api/ai/schema-from-text", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: modelName,
      dbType,
      prompt: promptText,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.error === "string" && payload.error.trim()
      ? payload.error
      : `请求失败（HTTP ${response.status}）`;
    throw new Error(message);
  }
  if (!payload || !Array.isArray(payload.tables)) {
    throw new Error(t("alert.aiInvalidResponse"));
  }
  return payload;
}

async function buildTablesByAi() {
  const model = getActiveModel();
  if (!model) {
    alert(t("alert.selectModelFirst"));
    return false;
  }

  const dialogResult = await showAiBuildDialog(model.dbType);
  if (!dialogResult) return false;

  const copyCodexAiPrompt = async () => {
    const prompt = buildCodexPromptFromMode("ai-build", model, {
      aiPromptText: dialogResult.promptText,
      dbType: model.dbType,
    });
    const handoff = await writeCodexHandoffFile({
      mode: "ai-build",
      model,
      promptText: prompt,
      modelPath: getModelWorkspaceDisplayPath(model),
    });
    const copied = await copyTextToClipboard(prompt);
    alert(
      copied
        ? tr("alert.aiHandoffWrittenCopied", { path: handoff.displayPath })
        : tr("alert.aiHandoffWritten", { path: handoff.displayPath }),
    );
    return copied;
  };

  if (dialogResult.mode === "codex") {
    await copyCodexAiPrompt();
    return true;
  }

  document.body.style.cursor = "progress";
  try {
    const schemaPayload = await requestAiSchemaFromServer({
      modelName: dialogResult.modelName,
      dbType: model.dbType,
      promptText: dialogResult.promptText,
    });
    const createdTables = importAiTablesToModel(model, schemaPayload, { includeTemplateFields: true });
    if (createdTables.length > 0) {
      state.selectedTableId = createdTables[0].id;
      state.selectedRelationId = null;
      activeInspectorTab = "basic";
      ensureInspectorVisible();
    }
    save();
    render();

    if (schemaPayload.warning) {
      alert(tr("alert.aiBuildDoneWarning", { count: createdTables.length, warning: schemaPayload.warning }));
    } else {
      alert(tr("alert.aiBuildDone", { count: createdTables.length }));
    }
    return true;
  } catch (error) {
    const message = String(error?.message || error || "");
    if (message.includes("未配置API Key")) {
      const choice = await showChoiceDialog({
        title: t("dialog.aiMissingKey.title"),
        message: t("dialog.aiMissingKey.message"),
        actions: [
          { value: "codex", label: t("dialog.aiMissingKey.toCodex"), className: "primary" },
          { value: "cancel", label: t("common.cancel"), className: "ghost", role: "cancel" },
        ],
      });
      if (choice === "codex") {
        await copyCodexAiPrompt();
      }
      return false;
    }
    alert(tr("alert.aiBuildFailed", { message }));
    return false;
  } finally {
    document.body.style.cursor = "";
  }
}

async function buildTablesByScript() {
  const model = getActiveModel();
  if (!model) {
    alert(t("alert.selectModelFirst"));
    return false;
  }

  const scriptText = await showScriptBuildDialog(model.dbType);
  if (!scriptText) return false;

  try {
    const tables = parseCreateTableSqlScript(scriptText, { dbType: model.dbType });
    const createdTables = importAiTablesToModel(model, { tables }, { includeTemplateFields: true });
    if (createdTables.length > 0) {
      state.selectedTableId = createdTables[0].id;
      state.selectedRelationId = null;
      activeInspectorTab = "basic";
      ensureInspectorVisible();
    }
    save();
    render();
    alert(tr("alert.scriptBuildDone", { count: createdTables.length }));
    return true;
  } catch (error) {
    alert(tr("alert.scriptBuildFailed", { message: error?.message || error }));
    return false;
  }
}

function showTemplateEditorDialog(dbType, initialTemplate) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "app-dialog-backdrop";
    const dialog = document.createElement("div");
    dialog.className = "app-dialog app-dialog-template";
    dialog.innerHTML = `
      <h3>${escapeHtml(t("dialog.template.title"))}</h3>
      <p>${escapeHtml(tr("dialog.template.desc", { dbType }))}</p>
      <div class="field-grid-wrap template-grid-wrap">
        <table class="field-grid">
          <thead>
            <tr>
              <th>#</th>
              <th>${escapeHtml(t("fields.col.name"))}</th>
              <th>${escapeHtml(t("fields.col.code"))}</th>
              <th>${escapeHtml(t("fields.col.type"))}</th>
              <th>${escapeHtml(t("fields.col.length"))}</th>
              <th>${escapeHtml(t("fields.col.precision"))}</th>
              <th>${escapeHtml(t("fields.col.scale"))}</th>
              <th>PK</th>
              <th>NN</th>
              <th>AI</th>
              <th>${escapeHtml(t("fields.col.default"))}</th>
              <th>${escapeHtml(t("fields.col.comment"))}</th>
              <th>${escapeHtml(t("fields.col.action"))}</th>
            </tr>
          </thead>
          <tbody id="templateGridBody"></tbody>
        </table>
      </div>
      <div class="app-dialog-actions template-editor-actions">
        <button type="button" class="app-dialog-btn primary" id="templateAddFieldBtn">${escapeHtml(t("dialog.template.addField"))}</button>
        <button type="button" class="app-dialog-btn ghost" id="templateCancelBtn">${escapeHtml(t("common.cancel"))}</button>
        <button type="button" class="app-dialog-btn primary" id="templateSaveBtn">${escapeHtml(t("dialog.template.save"))}</button>
      </div>
    `;

    let templateFields = (Array.isArray(initialTemplate) && initialTemplate.length > 0
      ? initialTemplate
      : [normalizeFieldTemplate({}, 1, dbType)]).map((field, index) =>
      normalizeFieldTemplate(field, index + 1, dbType),
    );

    const body = dialog.querySelector("#templateGridBody");
    const addBtn = dialog.querySelector("#templateAddFieldBtn");
    const cancelBtn = dialog.querySelector("#templateCancelBtn");
    const saveBtn = dialog.querySelector("#templateSaveBtn");

    const cleanup = () => {
      document.removeEventListener("keydown", onKeydown);
      backdrop.remove();
    };
    const close = (value) => {
      cleanup();
      resolve(value);
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") close(null);
    };

    const renderTemplateRows = () => {
      body.innerHTML = "";
      templateFields.forEach((field, index) => {
        const row = document.createElement("tr");
        const options = getDataTypeOptionsHtml(
          dbType,
          field.dataType,
          field.length,
          field.precision,
          field.scale,
        );
        row.innerHTML = `
          <td class="field-col-index">${index + 1}</td>
          <td><input data-role="name" value="${escapeHtml(field.name)}" /></td>
          <td><input data-role="code" value="${escapeHtml(field.code)}" /></td>
          <td><select data-role="type">${options}</select></td>
          <td><input data-role="length" value="${escapeHtml(field.length)}" /></td>
          <td><input data-role="precision" value="${escapeHtml(field.precision)}" /></td>
          <td><input data-role="scale" value="${escapeHtml(field.scale)}" /></td>
          <td class="field-col-check"><input type="checkbox" data-role="pk" ${field.primaryKey ? "checked" : ""} /></td>
          <td class="field-col-check"><input type="checkbox" data-role="nn" ${field.notNull ? "checked" : ""} ${field.primaryKey ? "disabled" : ""} /></td>
          <td class="field-col-check"><input type="checkbox" data-role="ai" ${field.autoIncrement ? "checked" : ""} /></td>
          <td><input data-role="default" value="${escapeHtml(field.defaultValue)}" /></td>
          <td><input data-role="comment" value="${escapeHtml(field.comment)}" /></td>
          <td class="field-col-actions"><button type="button" class="danger ghost" data-role="delete">${escapeHtml(t("dialog.template.delete"))}</button></td>
        `;

        const nameInput = row.querySelector('[data-role="name"]');
        const codeInput = row.querySelector('[data-role="code"]');
        const typeSelect = row.querySelector('[data-role="type"]');
        const lengthInput = row.querySelector('[data-role="length"]');
        const precisionInput = row.querySelector('[data-role="precision"]');
        const scaleInput = row.querySelector('[data-role="scale"]');
        const pkCheckbox = row.querySelector('[data-role="pk"]');
        const nnCheckbox = row.querySelector('[data-role="nn"]');
        const aiCheckbox = row.querySelector('[data-role="ai"]');
        const defaultInput = row.querySelector('[data-role="default"]');
        const commentInput = row.querySelector('[data-role="comment"]');
        const deleteBtn = row.querySelector('[data-role="delete"]');

        nameInput.addEventListener("input", () => {
          const previousName = field.name;
          const nextName = nameInput.value;
          const syncComment = shouldSyncCommentWithFieldName(field.comment, previousName);
          field.name = nextName;
          if (syncComment) {
            field.comment = nextName;
            commentInput.value = nextName;
          }
        });
        codeInput.addEventListener("input", () => {
          field.code = codeInput.value;
        });
        typeSelect.addEventListener("change", () => {
          const parsedType = parseLengthAwareTypeValue(typeSelect.value);
          field.dataType = parsedType.baseType;
          const optionalTypeMode = getLengthOptionalTypeMode(field.dataType);

          if (optionalTypeMode === "single") {
            field.precision = "";
            field.scale = "";
            precisionInput.value = "";
            scaleInput.value = "";
            if (parsedType.mode === "none") {
              field.length = "";
              lengthInput.value = "";
            } else if (!String(field.length || "").trim()) {
              field.length = getDefaultLengthForType(field.dataType);
              lengthInput.value = field.length;
            }
            syncTypeSelectByLength(typeSelect, field.dataType, field.length, field.precision, field.scale);
            return;
          }

          if (optionalTypeMode === "double") {
            field.length = "";
            lengthInput.value = "";
            if (parsedType.mode === "none") {
              field.precision = "";
              field.scale = "";
            } else if (parsedType.mode === "param1") {
              if (!String(field.precision || "").trim()) {
                field.precision = getDefaultPrecisionForType(field.dataType);
              }
              field.scale = "";
            } else {
              if (!String(field.precision || "").trim()) {
                field.precision = getDefaultPrecisionForType(field.dataType);
              }
              if (!String(field.scale || "").trim()) {
                field.scale = getDefaultScaleForType(field.dataType);
              }
            }
            precisionInput.value = field.precision;
            scaleInput.value = field.scale;
            syncTypeSelectByLength(typeSelect, field.dataType, field.length, field.precision, field.scale);
            return;
          }

          field.length = "";
          field.precision = "";
          field.scale = "";
          lengthInput.value = "";
          precisionInput.value = "";
          scaleInput.value = "";
        });
        lengthInput.addEventListener("input", () => {
          field.length = lengthInput.value;
          syncTypeSelectByLength(typeSelect, field.dataType, field.length, field.precision, field.scale);
        });
        precisionInput.addEventListener("input", () => {
          field.precision = precisionInput.value;
          if (
            getLengthOptionalTypeMode(field.dataType) === "double" &&
            !String(field.precision || "").trim() &&
            String(field.scale || "").trim()
          ) {
            field.precision = getDefaultPrecisionForType(field.dataType);
            precisionInput.value = field.precision;
          }
          syncTypeSelectByLength(typeSelect, field.dataType, field.length, field.precision, field.scale);
        });
        scaleInput.addEventListener("input", () => {
          field.scale = scaleInput.value;
          if (
            getLengthOptionalTypeMode(field.dataType) === "double" &&
            String(field.scale || "").trim() &&
            !String(field.precision || "").trim()
          ) {
            field.precision = getDefaultPrecisionForType(field.dataType);
            precisionInput.value = field.precision;
          }
          syncTypeSelectByLength(typeSelect, field.dataType, field.length, field.precision, field.scale);
        });
        pkCheckbox.addEventListener("change", () => {
          field.primaryKey = pkCheckbox.checked;
          if (field.primaryKey) {
            field.notNull = true;
          }
          nnCheckbox.checked = field.notNull;
          nnCheckbox.disabled = field.primaryKey;
        });
        nnCheckbox.addEventListener("change", () => {
          if (field.primaryKey) {
            nnCheckbox.checked = true;
            return;
          }
          field.notNull = nnCheckbox.checked;
        });
        aiCheckbox.addEventListener("change", () => {
          field.autoIncrement = aiCheckbox.checked;
          if (field.autoIncrement) {
            field.notNull = true;
            nnCheckbox.checked = true;
          }
        });
        defaultInput.addEventListener("input", () => {
          field.defaultValue = defaultInput.value;
        });
        commentInput.addEventListener("input", () => {
          field.comment = commentInput.value;
        });
        deleteBtn.addEventListener("click", () => {
          if (templateFields.length === 1) {
            alert(t("dialog.template.keepOne"));
            return;
          }
          templateFields = templateFields.filter((_, itemIndex) => itemIndex !== index);
          renderTemplateRows();
        });

        body.appendChild(row);
      });
    };

    addBtn.addEventListener("click", () => {
      templateFields.push(normalizeFieldTemplate({}, templateFields.length + 1, dbType));
      renderTemplateRows();
    });
    cancelBtn.addEventListener("click", () => close(null));
    saveBtn.addEventListener("click", () => {
      if (templateFields.length === 0) {
        alert(t("dialog.template.keepOne"));
        return;
      }
      const normalized = templateFields.map((field, index) =>
        normalizeFieldTemplate(field, index + 1, dbType),
      );
      close(normalized);
    });
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) close(null);
    });

    document.addEventListener("keydown", onKeydown);
    renderTemplateRows();
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
  });
}

async function editModelTableTemplate() {
  const model = getActiveModel();
  const dbType = model?.dbType || DEFAULT_DB_TYPE;
  const result = await showTemplateEditorDialog(dbType, getGlobalTemplateForDb(dbType));
  if (!result) return;
  state.globalTableTemplate = result.map((field, index) => normalizeFieldTemplate(field, index + 1, dbType));
  save();
  updateToolbar();
}

async function confirmCloseModel(model) {
  if (!model) return false;
  refreshModelDirtyState(model);
  if (!model.dirty) return true;

  const choice = await showChoiceDialog({
    title: t("dialog.closeModel.title"),
    message: tr("dialog.closeModel.message", { name: model.name }),
    actions: [
      { value: "save", label: t("dialog.closeModel.save"), className: "primary" },
      { value: "discard", label: t("dialog.closeModel.discard"), className: "danger" },
      { value: "cancel", label: t("common.cancel"), className: "ghost", role: "cancel" },
    ],
  });

  if (choice === "save") {
    return saveModelToWorkspace(model);
  }
  if (choice === "discard") {
    return true;
  }
  return false;
}

async function closeModelById(modelId) {
  const model = state.models.find((item) => item.id === modelId);
  if (!model) return;
  const canClose = await confirmCloseModel(model);
  if (!canClose) return;

  state.models = state.models.filter((item) => item.id !== modelId);
  if (state.activeModelId === modelId) {
    state.activeModelId = state.models.length > 0 ? state.models[0].id : null;
    state.selectedTableId = null;
    state.selectedRelationId = null;
  }
  save();
  render();
}

async function removeModelFileIfNeeded(model) {
  if (!model?.fileName) return true;
  if (!(await ensureWorkspaceReady())) return false;
  try {
    await deleteModelFile(workspaceDirectoryHandle, model.fileName);
    return true;
  } catch (error) {
    if (error && error.name === "NotFoundError") {
      return true;
    }
    alert(tr("alert.deleteModelFileFailed", { message: error?.message || error }));
    return false;
  }
}

async function confirmDeleteModel(model) {
  if (!model) return false;
  refreshModelDirtyState(model);

  if (model.dirty) {
    const choice = await showChoiceDialog({
      title: t("dialog.deleteModel.title"),
      message: tr("dialog.deleteModel.dirty", { name: model.name }),
      actions: [
        { value: "save_delete", label: t("dialog.deleteModel.saveDelete"), className: "primary" },
        { value: "delete_direct", label: t("dialog.deleteModel.deleteDirect"), className: "danger" },
        { value: "cancel", label: t("common.cancel"), className: "ghost", role: "cancel" },
      ],
    });
    if (choice === "save_delete") {
      const saved = await saveModelToWorkspace(model);
      if (!saved) return false;
      return true;
    }
    if (choice === "delete_direct") {
      return true;
    }
    return false;
  }

  const choice = await showChoiceDialog({
    title: t("dialog.deleteModel.title"),
    message: tr("dialog.deleteModel.confirm", { name: model.name }),
    actions: [
      { value: "delete", label: t("dialog.deleteModel.delete"), className: "danger" },
      { value: "cancel", label: t("common.cancel"), className: "ghost", role: "cancel" },
    ],
  });
  return choice === "delete";
}

async function deleteModelById(modelId) {
  const model = state.models.find((item) => item.id === modelId);
  if (!model) return;

  const canDelete = await confirmDeleteModel(model);
  if (!canDelete) return;

  const fileRemoved = await removeModelFileIfNeeded(model);
  if (!fileRemoved) return;

  state.models = state.models.filter((item) => item.id !== modelId);
  if (state.activeModelId === modelId) {
    state.activeModelId = state.models.length > 0 ? state.models[0].id : null;
    state.selectedTableId = null;
    state.selectedRelationId = null;
  }
  save();
  render();
}

async function openModelFromWorkspace() {
  if (!(await ensureWorkspaceReady())) return;
  try {
    const entries = await buildWorkspaceModelEntries();
    if (entries.length === 0) {
      alert(t("alert.openModelNone"));
      return;
    }
    const availableEntries = entries.filter((entry) => !entry.isOpen);
    if (availableEntries.length === 0) {
      alert(t("alert.openModelAllOpened"));
      return;
    }

    const fileName = await showModelPickerDialog(entries);
    if (!fileName) return;
    if (state.models.some((model) => model.fileName === fileName)) {
      const reopenChoice = await showChoiceDialog({
        title: t("dialog.openModel.openedTitle"),
        message: tr("dialog.openModel.openedMessage", { name: fileName }),
        actions: [
          { value: "reload", label: t("dialog.openModel.reload"), className: "primary" },
          { value: "cancel", label: t("common.cancel"), className: "ghost", role: "cancel" },
        ],
      });
      if (reopenChoice !== "reload") {
        return;
      }
      const parsed = await readWorkspaceModelPayload(fileName);
      const loadedModel = buildLoadedModel(parsed, fileName);
      upsertLoadedModel(loadedModel, { replaceIfOpen: true, activate: true });
      return;
    }

    const parsed = await readWorkspaceModelPayload(fileName);
    const loadedModel = buildLoadedModel(parsed, fileName);
    upsertLoadedModel(loadedModel, { replaceIfOpen: false, activate: true });
  } catch (error) {
    alert(tr("alert.openModelFailed", { message: error?.message || error }));
  }
}

async function restoreWorkspaceDirectory() {
  const workspaceInfo = readWorkspaceInfo();
  workspaceRememberedName = workspaceInfo?.name || "";
  workspacePathHint = workspaceInfo?.pathHint || "";
  if (!supportsWorkspaceFS()) return;
  try {
    const handle = await readWorkspaceDirectoryHandle();
    if (!handle) {
      workspacePermissionState = "none";
      return;
    }
    workspaceDirectoryHandle = handle;
    workspaceRememberedName = handle.name || workspaceRememberedName;
    const granted = await ensureDirectoryPermission(handle, false, false);
    workspacePermissionState = granted ? "granted" : "pending";
  } catch {
    workspaceDirectoryHandle = null;
    workspacePermissionState = "none";
  }
}

function getActiveModel() {
  let model = state.models.find((m) => m.id === state.activeModelId) || null;
  if (!model && state.models.length > 0) {
    state.activeModelId = state.models[0].id;
    model = state.models[0];
  }
  if (model) {
    ensureModelRuntimeData(model);
    refreshModelDirtyState(model);
  }
  return model;
}

function getSelectedTable() {
  const model = getActiveModel();
  if (!model || !state.selectedTableId) return null;
  const table = model.tables.find((t) => t.id === state.selectedTableId) || null;
  if (table) {
    ensureTableRuntimeData(table);
  }
  return table;
}

function updateWorkspaceGuide() {
  if (workspaceGuideTitle) workspaceGuideTitle.textContent = t("guide.workspace.title");
  if (workspaceGuideText) workspaceGuideText.textContent = t("guide.workspace.text");
  if (workspaceGuideDismissBtn) workspaceGuideDismissBtn.textContent = t("guide.workspace.dismiss");
  if (workspaceGuideDismissBtn) workspaceGuideDismissBtn.setAttribute("aria-label", t("guide.workspace.dismissLabel"));
  if (!workspaceGuideBar) return;

  const hasWorkspaceContext = Boolean(String(workspacePathHint || workspaceDirectoryHandle?.name || workspaceRememberedName || "").trim());
  const hasModel = Boolean(getActiveModel());
  const shouldShow = hasWorkspaceContext && hasModel && !isWorkspaceGuideDismissed();
  workspaceGuideBar.hidden = !shouldShow;
}

function updateToolbar() {
  const model = getActiveModel();
  if (workspaceMeta) {
    workspaceMeta.textContent = `${t("workspace.label")}：${getWorkspaceDisplayName()}`;
  }
  if (topWorkspaceBtn) {
    const actionLabel = getWorkspaceActionLabel();
    topWorkspaceBtn.textContent = actionLabel;
    topWorkspaceBtn.title = actionLabel;
    topWorkspaceBtn.setAttribute("aria-label", actionLabel);
  }
  if (syncModelBtn) {
    const actionLabel = getSyncActionLabel();
    const labelNode = syncModelBtn.querySelector(".tool-icon-name");
    if (labelNode) labelNode.textContent = getSyncToolbarLabel();
    syncModelBtn.title = actionLabel;
    syncModelBtn.setAttribute("aria-label", actionLabel);
    syncModelBtn.classList.toggle("tool-icon-btn-primary", !isWorkspaceConnected());
  }
  if (workspacePathMeta) {
    workspacePathMeta.textContent = `${getWorkspacePathMetaLabel()}：${getWorkspacePathHintDisplay()}`;
  }
  if (!model) {
    activeModelTitle.textContent = t("meta.noModel");
    activeModelMeta.textContent = "-";
    if (modelFileMeta) modelFileMeta.textContent = `${t("meta.modelFilePath")}：${t("meta.modelFileUnsaved")}`;
    updateWorkspaceGuide();
    return;
  }
  activeModelTitle.textContent = model.name;
  const fileText = model.fileName
    ? ` · ${t("meta.file")}: ${model.fileName}`
    : ` · ${t("meta.file")}: ${t("meta.fileUnsaved")}`;
  const dirtyText = model.dirty
    ? ` · ${t("meta.status")}: ${t("meta.statusUnsaved")}`
    : ` · ${t("meta.status")}: ${t("meta.statusSaved")}`;
  activeModelMeta.textContent = `${model.dbType} · ${t("meta.tables")}: ${model.tables.length} · ${t("meta.relations")}: ${model.relations.length}${fileText}${dirtyText}`;
  if (modelFileMeta) {
    const savedPath = getModelWorkspaceDisplayPath(model);
    if (savedPath && model.fileName) {
      modelFileMeta.textContent = `${t("meta.modelFilePath")}：${savedPath}`;
    } else if (savedPath) {
      modelFileMeta.textContent = `${t("meta.modelFileWillSave")}：${savedPath}`;
    } else {
      modelFileMeta.textContent = `${t("meta.modelFilePath")}：${t("meta.modelFileUnsaved")}`;
    }
  }
  updateWorkspaceGuide();
}

function refreshAfterTableMetaEdit() {
  updateToolbar();
  renderModelList();
  renderWorkspace();
}

function renderModelList() {
  const model = getActiveModel();
  modelList.innerHTML = "";

  state.models.forEach((item) => {
    ensureModelRuntimeData(item);
    refreshModelDirtyState(item);
    const li = document.createElement("li");
    li.className = `model-item ${model && item.id === model.id ? "active" : ""}`;

    const head = document.createElement("div");
    head.className = "model-item-head";

    const title = document.createElement("p");
    title.className = "model-item-title";
    const titleWrap = document.createElement("span");
    titleWrap.className = "model-title-wrap";
    titleWrap.textContent = item.name;
    if (item.dirty) {
      const dirtyIcon = document.createElement("span");
      dirtyIcon.className = "model-dirty-icon";
      dirtyIcon.textContent = "●";
      dirtyIcon.title = t("modelList.dirty");
      titleWrap.appendChild(dirtyIcon);
    }
    title.appendChild(titleWrap);

    const actionWrap = document.createElement("div");
    actionWrap.className = "model-item-actions";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "model-close-btn";
    closeBtn.textContent = t("modelList.close");
    closeBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      await closeModelById(item.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "model-delete-btn";
    deleteBtn.textContent = t("modelList.delete");
    deleteBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      await deleteModelById(item.id);
    });

    const meta = document.createElement("p");
    meta.className = "model-item-meta";
    meta.textContent = `${item.dbType} · ${item.tables.length} ${t("modelList.tablesWord")}${item.fileName ? ` · ${item.fileName}` : ""}`;

    actionWrap.appendChild(closeBtn);
    actionWrap.appendChild(deleteBtn);
    head.appendChild(title);
    head.appendChild(actionWrap);
    li.appendChild(head);
    li.appendChild(meta);
    li.addEventListener("click", () => {
      state.activeModelId = item.id;
      state.selectedTableId = null;
      state.selectedRelationId = null;
      save();
      render();
    });

    modelList.appendChild(li);
  });
}

function syncRelationLayerSize() {
  const width = WORKSPACE_BASE_WIDTH;
  const height = WORKSPACE_BASE_HEIGHT;
  relationLayer.style.width = `${width}px`;
  relationLayer.style.height = `${height}px`;
  relationLayer.setAttribute("width", String(width));
  relationLayer.setAttribute("height", String(height));
  relationLayer.setAttribute("viewBox", `0 0 ${width} ${height}`);
}

function getTableCardById(tableId) {
  return tableLayer.querySelector(`[data-table-id="${tableId}"]`);
}

function getCardAnchorPoint(card, side) {
  const left = card.offsetLeft;
  const top = card.offsetTop;
  const width = card.offsetWidth;
  const height = card.offsetHeight;
  if (side === "top") return { x: left + width / 2, y: top };
  if (side === "right") return { x: left + width, y: top + height / 2 };
  if (side === "bottom") return { x: left + width / 2, y: top + height };
  return { x: left, y: top + height / 2 };
}

function getSnapPointOnTable(card, fromX, fromY) {
  const left = card.offsetLeft;
  const top = card.offsetTop;
  const width = card.offsetWidth;
  const height = card.offsetHeight;
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  const dx = fromX - centerX;
  const dy = fromY - centerY;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return {
      x: dx < 0 ? left : left + width,
      y: centerY,
    };
  }
  return {
    x: centerX,
    y: dy < 0 ? top : top + height,
  };
}

function buildCurvePath(startX, startY, endX, endY) {
  const startOnRight = startX <= endX;
  const ctrlGap = Math.max(40, Math.abs(endX - startX) / 2);
  return `M ${startX} ${startY} C ${startX + (startOnRight ? ctrlGap : -ctrlGap)} ${startY}, ${endX + (startOnRight ? -ctrlGap : ctrlGap)} ${endY}, ${endX} ${endY}`;
}

function invertRelationCardinality(cardinality) {
  const normalized = normalizeRelationCardinality(cardinality);
  if (normalized === "1:N") return "N:1";
  if (normalized === "N:1") return "1:N";
  return normalized;
}

function setRelationDropTarget(tableId) {
  if (relationDropTargetId === tableId) return;
  if (relationDropTargetId) {
    const oldCard = getTableCardById(relationDropTargetId);
    if (oldCard) oldCard.classList.remove("relation-drop-target");
  }
  relationDropTargetId = tableId || null;
  if (relationDropTargetId) {
    const nextCard = getTableCardById(relationDropTargetId);
    if (nextCard) nextCard.classList.add("relation-drop-target");
  }
}

function normalizeCodeKey(code) {
  return String(code || "").trim().toLocaleLowerCase();
}

function getRelationRoleTables(model, relation) {
  if (!model || !relation) return null;
  const sourceTable = model.tables.find((item) => item.id === relation.sourceTableId);
  const targetTable = model.tables.find((item) => item.id === relation.targetTableId);
  if (!sourceTable || !targetTable) return null;
  const cardinality = normalizeRelationCardinality(relation.cardinality || "1:N");
  if (cardinality === "1:N") {
    return { parentTable: sourceTable, childTable: targetTable };
  }
  if (cardinality === "N:1") {
    return { parentTable: targetTable, childTable: sourceTable };
  }
  return null;
}

function getRelationArrowTargetTableId(model, relation) {
  const roleTables = getRelationRoleTables(model, relation);
  if (roleTables?.parentTable?.id) return roleTables.parentTable.id;
  return relation?.targetTableId || null;
}

function getRelationArrowSourceTableId(model, relation) {
  const roleTables = getRelationRoleTables(model, relation);
  if (roleTables?.childTable?.id) return roleTables.childTable.id;
  return relation?.sourceTableId || null;
}

function buildForeignKeyName(childTable, parentTable) {
  const childCode = (childTable.code || childTable.name || "child").replace(/\s+/g, "_");
  const parentCode = (parentTable.code || parentTable.name || "parent").replace(/\s+/g, "_");
  return `fk_${childCode}_${parentCode}`;
}

function ensureUniqueFieldCode(table, baseCode) {
  const safeBase = String(baseCode || "fk_id").trim() || "fk_id";
  const usedCodes = new Set((table.fields || []).map((field) => normalizeCodeKey(field.code)));
  if (!usedCodes.has(normalizeCodeKey(safeBase))) return safeBase;
  let index = 1;
  while (usedCodes.has(normalizeCodeKey(`${safeBase}_${index}`))) {
    index += 1;
  }
  return `${safeBase}_${index}`;
}

function createForeignKeyField(model, childTable, parentTable, parentField) {
  const parentFieldCode = parentField.code || parentField.name || "id";
  const parentTableCode = parentTable.code || parentTable.name || "parent";
  const suggestedCode = `${parentTableCode}_${parentFieldCode}`;
  const fieldCode = ensureUniqueFieldCode(childTable, suggestedCode);
  return {
    id: uid("field"),
    name: `${parentTable.name || parentTable.code || "Parent"}${parentField.name || parentFieldCode}`,
    code: fieldCode,
    dataType: parentField.dataType || getFieldTypesByDbType(model.dbType)[8] || "varchar",
    length: typeof parentField.length === "string" ? parentField.length : "",
    precision: typeof parentField.precision === "string" ? parentField.precision : "",
    scale: typeof parentField.scale === "string" ? parentField.scale : "",
    primaryKey: false,
    notNull: true,
    autoIncrement: false,
    defaultValue: "",
    comment: `FK -> ${(parentTable.code || parentTable.name)}.${parentFieldCode}`,
  };
}

function findChildFieldForForeignKey(relation, childTable, parentTable, parentField) {
  const fk = relation.foreignKey;
  if (fk && Array.isArray(fk.fromFieldIds) && Array.isArray(fk.toFieldIds)) {
    const index = fk.toFieldIds.findIndex((fieldId) => fieldId === parentField.id);
    if (index >= 0) {
      const field = (childTable.fields || []).find((item) => item.id === fk.fromFieldIds[index]);
      if (field) return field;
    }
  }

  const parentFieldCode = parentField.code || parentField.name || "id";
  const parentTableCode = parentTable.code || parentTable.name || "parent";
  const candidates = [];
  candidates.push(`${parentTableCode}_${parentFieldCode}`);
  // Backward compatibility with historical naming.
  candidates.push(`${parentTableCode}${parentFieldCode}`);
  candidates.push(`parent_${parentFieldCode}`);
  const candidateSet = new Set(candidates.map((value) => normalizeCodeKey(value)));
  return (childTable.fields || []).find((field) => candidateSet.has(normalizeCodeKey(field.code))) || null;
}

function syncRelationForeignKey(model, relation, createMissingChildField = true) {
  const tables = getRelationRoleTables(model, relation);
  if (!tables) {
    relation.foreignKey = null;
    return { ok: false, message: t("relation.error.invalidType") };
  }
  let { parentTable, childTable } = tables;
  let parentPkFields = (parentTable.fields || []).filter((field) => field.primaryKey);
  if (parentPkFields.length === 0) {
    const fallbackPkFields = (childTable.fields || []).filter((field) => field.primaryKey);
    if (fallbackPkFields.length > 0) {
      const originalParentTable = parentTable;
      parentTable = childTable;
      childTable = originalParentTable;
      parentPkFields = fallbackPkFields;
    }
  }
  if (parentPkFields.length === 0) {
    relation.foreignKey = null;
    return {
      ok: false,
      message: t("relation.error.missingPk"),
    };
  }

  const fromFieldIds = [];
  const toFieldIds = [];
  for (const parentField of parentPkFields) {
    let childField = findChildFieldForForeignKey(relation, childTable, parentTable, parentField);
    if (!childField && createMissingChildField) {
      childField = createForeignKeyField(model, childTable, parentTable, parentField);
      childTable.fields.push(childField);
    }
    if (!childField) {
      relation.foreignKey = null;
      return {
        ok: false,
        message: tr("relation.error.missingFieldMapping", { table: childTable.name, field: parentField.code }),
      };
    }
    childField.notNull = true;
    if (childField.autoIncrement) {
      childField.autoIncrement = false;
    }
    fromFieldIds.push(childField.id);
    toFieldIds.push(parentField.id);
  }

  relation.foreignKey = {
    name: buildForeignKeyName(childTable, parentTable),
    fromTableId: childTable.id,
    toTableId: parentTable.id,
    fromFieldIds,
    toFieldIds,
  };
  return { ok: true };
}

function syncTableRelationsForeignKeys(model, tableId, createMissingChildField = true) {
  if (!model || !tableId) return;
  model.relations.forEach((relation) => {
    if (relation.sourceTableId !== tableId && relation.targetTableId !== tableId) return;
    syncRelationForeignKey(model, relation, createMissingChildField);
  });
}

function addRelation(model, sourceTableId, targetTableId, relationCardinality = "1:N") {
  const cardinality = normalizeRelationCardinality(relationCardinality);
  if (isManyToMany(cardinality)) {
    return {
      ok: false,
      message: t("relation.error.bridgeRequired"),
    };
  }
  if (relationExists(model, sourceTableId, targetTableId)) {
    return { ok: false, message: t("relation.error.duplicate") };
  }

  const source = model.tables.find((item) => item.id === sourceTableId);
  const target = model.tables.find((item) => item.id === targetTableId);
  if (!source || !target) {
    return { ok: false, message: t("relation.error.targetMissing") };
  }

  const relation = {
    id: uid("rel"),
    name: `${source.code || source.name}_${target.code || target.name}`,
    cardinality,
    sourceTableId: source.id,
    targetTableId: target.id,
    foreignKey: null,
  };
  model.relations.push(relation);
  const fkResult = syncRelationForeignKey(model, relation, true);
  if (!fkResult.ok) {
    return { ok: true, warning: fkResult.message, relationId: relation.id };
  }
  return { ok: true, relationId: relation.id };
}

function selectRelationById(relationId) {
  const model = getActiveModel();
  if (!model) return;
  const relation = model.relations.find((item) => item.id === relationId);
  if (!relation) return;
  state.selectedRelationId = relation.id;
  const arrowTargetTableId = getRelationArrowTargetTableId(model, relation);
  if (arrowTargetTableId) {
    state.selectedTableId = arrowTargetTableId;
  }
  activeInspectorTab = "basic";
  ensureInspectorVisible();
  save();
  render();
}

function startRelationDraft(sourceTableId, side) {
  const sourceCard = getTableCardById(sourceTableId);
  if (!sourceCard) return;
  const startPoint = getCardAnchorPoint(sourceCard, side);
  relationDraft = {
    sourceTableId,
    side,
    startX: startPoint.x,
    startY: startPoint.y,
    currentX: startPoint.x,
    currentY: startPoint.y,
    targetTableId: null,
    moved: false,
  };
  document.body.classList.add("no-select");
  drawRelations();
}

function updateRelationDraft(clientX, clientY) {
  if (!relationDraft) return;

  const point = getWorkspacePoint(clientX, clientY);
  relationDraft.currentX = point.x;
  relationDraft.currentY = point.y;
  if (!relationDraft.moved && Math.hypot(point.x - relationDraft.startX, point.y - relationDraft.startY) > 4) {
    relationDraft.moved = true;
  }

  const hoverElement = document.elementFromPoint(clientX, clientY);
  const targetCard = hoverElement ? hoverElement.closest(".table-card") : null;
  const targetTableId = targetCard ? targetCard.dataset.tableId : null;
  relationDraft.targetTableId = targetTableId || null;
  setRelationDropTarget(relationDraft.targetTableId);
  drawRelations();
}

function finishRelationDraft() {
  if (!relationDraft) return false;

  const draft = relationDraft;
  relationDraft = null;
  setRelationDropTarget(null);
  document.body.classList.remove("no-select");

  if (!draft.moved || !draft.targetTableId) {
    drawRelations();
    return true;
  }

  const model = getActiveModel();
  if (!model) {
    drawRelations();
    return true;
  }
  const result = addRelation(model, draft.sourceTableId, draft.targetTableId, "1:N");
  if (!result.ok) {
    alert(result.message);
    drawRelations();
    return true;
  }
  if (result.warning) {
    alert(tr("relation.createWarning", { message: result.warning }));
  }

  save();
  render();
  return true;
}

function drawRelations() {
  const model = getActiveModel();
  relationLayer.innerHTML = "";

  if (!model) return;
  const relationIdSet = new Set(model.relations.map((relation) => relation.id));
  if (state.selectedRelationId && !relationIdSet.has(state.selectedRelationId)) {
    state.selectedRelationId = null;
  }
  syncRelationLayerSize();

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const createArrowMarker = (id, fill) => {
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", id);
    marker.setAttribute("viewBox", "0 0 8 8");
    marker.setAttribute("refX", "7");
    marker.setAttribute("refY", "4");
    marker.setAttribute("markerWidth", "8");
    marker.setAttribute("markerHeight", "8");
    marker.setAttribute("orient", "auto-start-reverse");

    const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrowPath.setAttribute("d", "M 0 0 L 8 4 L 0 8 z");
    arrowPath.setAttribute("fill", fill);
    marker.appendChild(arrowPath);
    return marker;
  };
  defs.appendChild(createArrowMarker("relationArrow", "#2a65c9"));
  defs.appendChild(createArrowMarker("relationArrowSelected", "#0f78ff"));
  relationLayer.appendChild(defs);

  model.relations.forEach((rel) => {
    const arrowSourceTableId = getRelationArrowSourceTableId(model, rel);
    const arrowTargetTableId = getRelationArrowTargetTableId(model, rel);
    const source = document.querySelector(`[data-table-id="${arrowSourceTableId}"]`);
    const target = document.querySelector(`[data-table-id="${arrowTargetTableId}"]`);
    if (!source || !target) return;
    const normalizedCardinality = normalizeRelationCardinality(rel.cardinality);
    const isDirectionReversed =
      arrowSourceTableId !== rel.sourceTableId || arrowTargetTableId !== rel.targetTableId;
    const renderedCardinality = isDirectionReversed
      ? invertRelationCardinality(normalizedCardinality)
      : normalizedCardinality;

    const sourceX = source.offsetLeft;
    const sourceY = source.offsetTop;
    const targetX = target.offsetLeft;
    const targetY = target.offsetTop;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let startX;
    let startY;
    let endX;
    let endY;
    if (arrowSourceTableId === arrowTargetTableId) {
      const width = source.offsetWidth;
      const height = source.offsetHeight;
      startX = sourceX + width;
      startY = sourceY + height / 2;
      endX = sourceX + width / 2;
      endY = sourceY;
      path.setAttribute(
        "d",
        `M ${startX} ${startY} C ${startX + 80} ${startY - 70}, ${endX + 80} ${endY - 70}, ${endX} ${endY}`,
      );
    } else {
      const startOnRight = sourceX <= targetX;
      startX = startOnRight ? sourceX + source.offsetWidth : sourceX;
      startY = sourceY + source.offsetHeight / 2;
      endX = startOnRight ? targetX : targetX + target.offsetWidth;
      endY = targetY + target.offsetHeight / 2;
      path.setAttribute("d", buildCurvePath(startX, startY, endX, endY));
    }
    const isSelected = rel.id === state.selectedRelationId;
    const hitPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hitPath.setAttribute("d", path.getAttribute("d") || "");
    hitPath.setAttribute("class", "relation-hitbox");
    hitPath.dataset.relationId = rel.id;
    hitPath.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    hitPath.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectRelationById(rel.id);
    });

    path.setAttribute("class", `relation-path ${isSelected ? "selected" : ""}`.trim());
    path.setAttribute("marker-end", isSelected ? "url(#relationArrowSelected)" : "url(#relationArrow)");
    path.dataset.relationId = rel.id;
    path.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    path.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectRelationById(rel.id);
    });

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const relationTypeText = renderedCardinality;
    label.textContent = `${rel.name} [${relationTypeText}]`;
    label.setAttribute("x", String((startX + endX) / 2));
    label.setAttribute("y", String((startY + endY) / 2 - 8));
    label.setAttribute("class", `relation-label ${isSelected ? "selected" : ""}`.trim());
    label.dataset.relationId = rel.id;
    label.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    label.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectRelationById(rel.id);
    });

    relationLayer.appendChild(hitPath);
    relationLayer.appendChild(path);
    relationLayer.appendChild(label);
  });

  if (relationDraft) {
    let endX = relationDraft.currentX;
    let endY = relationDraft.currentY;
    if (relationDraft.targetTableId === relationDraft.sourceTableId) {
      const sourceCard = getTableCardById(relationDraft.sourceTableId);
      if (sourceCard) {
        const loopPoint = getCardAnchorPoint(sourceCard, "top");
        endX = loopPoint.x;
        endY = loopPoint.y;
      }
    } else if (relationDraft.targetTableId) {
      const targetCard = getTableCardById(relationDraft.targetTableId);
      if (targetCard) {
        const snapPoint = getSnapPointOnTable(targetCard, relationDraft.startX, relationDraft.startY);
        endX = snapPoint.x;
        endY = snapPoint.y;
      }
    }

    const draftPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    draftPath.setAttribute("d", buildCurvePath(relationDraft.startX, relationDraft.startY, endX, endY));
    draftPath.setAttribute("class", "relation-path relation-draft-path");
    draftPath.setAttribute("marker-end", "url(#relationArrow)");
    relationLayer.appendChild(draftPath);
  }
}

function renderWorkspace() {
  const model = getActiveModel();
  tableLayer.innerHTML = "";
  relationLayer.innerHTML = "";

  if (!model) return;
  syncRelationLayerSize();
  const syntaxDiagnostics = collectModelSqlSyntaxDiagnostics(model);

  model.tables.forEach((table) => {
    ensureTableRuntimeData(table);
    const isSelected = state.selectedTableId === table.id;
    const tableSyntaxIssues = syntaxDiagnostics.tableIssueMap.get(table.id) || [];
    const hasSyntaxError = tableSyntaxIssues.length > 0;
    const card = document.createElement("article");
    card.className = `table-card ${isSelected ? "selected" : ""} ${hasSyntaxError ? "syntax-error" : ""}`.trim();
    card.style.left = `${table.x}px`;
    card.style.top = `${table.y}px`;
    card.dataset.tableId = table.id;

    const header = document.createElement("div");
    header.className = `table-header ${hasSyntaxError ? "table-header-syntax-error" : ""}`.trim();
    const titleRow = document.createElement("div");
    titleRow.className = "table-header-title-row";
    const titleNode = document.createElement("h3");
    titleNode.textContent = table.name;
    titleRow.appendChild(titleNode);
    if (hasSyntaxError) {
      const marker = document.createElement("span");
      marker.className = "table-syntax-badge";
      marker.textContent = "❌";
      marker.title = buildModelSyntaxIssueSummary({ issues: tableSyntaxIssues }, 3);
      titleRow.appendChild(marker);
      card.title = buildModelSyntaxIssueSummary({ issues: tableSyntaxIssues }, 3);
    } else {
      card.title = "";
    }
    const codeNode = document.createElement("p");
    codeNode.textContent = table.code;
    header.appendChild(titleRow);
    header.appendChild(codeNode);

    card.appendChild(header);
    if (tableCardViewMode !== "header") {
      const list = document.createElement("ul");
      list.className = "field-list";
      table.fields.forEach((field) => {
        const li = document.createElement("li");
        const typeText = formatFieldType(field);
        const flagsText = formatFieldFlags(field, model.dbType);
        li.innerHTML = `
          <div class="field-main">
            <span>${escapeHtml(field.name)}</span>
            <span class="field-code">${escapeHtml(field.code)}</span>
          </div>
          <div class="field-meta">${escapeHtml(typeText)}${flagsText ? ` · ${escapeHtml(flagsText)}` : ""}</div>
        `;
        list.appendChild(li);
      });
      card.appendChild(list);
    } else {
      card.classList.add("table-card-header-only");
    }

    if (isSelected) {
      const anchorLayer = document.createElement("div");
      anchorLayer.className = "table-anchor-layer";
      ["top", "right", "bottom", "left"].forEach((side) => {
        const anchor = document.createElement("button");
        anchor.type = "button";
        anchor.className = `table-anchor table-anchor-${side}`;
        anchor.title = t("relation.dragHint");
        anchor.addEventListener("mousedown", (event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.stopPropagation();
          startRelationDraft(table.id, side);
        });
        anchor.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
        });
        anchorLayer.appendChild(anchor);
      });
      card.appendChild(anchorLayer);
    }

    card.addEventListener("click", (event) => {
      if (event.target instanceof HTMLInputElement) return;
      state.selectedTableId = table.id;
      state.selectedRelationId = null;
      activeInspectorTab = "basic";
      ensureInspectorVisible();
      save();
      render();
    });

    card.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return;

      if (state.selectedTableId !== table.id) {
        state.selectedTableId = table.id;
        state.selectedRelationId = null;
        activeInspectorTab = "basic";
        ensureInspectorVisible();
        save();
        tableLayer.querySelectorAll(".table-card.selected").forEach((node) => {
          node.classList.remove("selected");
        });
        card.classList.add("selected");
        renderInspector();
      }

      const point = getWorkspacePoint(event.clientX, event.clientY);

      drag = {
        tableId: table.id,
        offsetX: point.x - table.x,
        offsetY: point.y - table.y,
      };
      card.style.cursor = "grabbing";
    });

    tableLayer.appendChild(card);
  });

  drawRelations();
}

function removeTable(tableId) {
  const model = getActiveModel();
  if (!model) return;

  model.tables = model.tables.filter((t) => t.id !== tableId);
  model.relations = model.relations.filter((r) => r.sourceTableId !== tableId && r.targetTableId !== tableId);

  if (state.selectedTableId === tableId) {
    state.selectedTableId = null;
  }
  if (state.selectedRelationId) {
    const exists = model.relations.some((relation) => relation.id === state.selectedRelationId);
    if (!exists) {
      state.selectedRelationId = null;
    }
  }

  save();
  render();
}

function removeRelation(relationId) {
  const model = getActiveModel();
  if (!model) return;
  model.relations = model.relations.filter((relation) => relation.id !== relationId);
  if (state.selectedRelationId === relationId) {
    state.selectedRelationId = null;
  }
  save();
  render();
}

function addTableToActiveModel() {
  const model = getActiveModel();
  if (!model) return false;

  const index = model.tables.length + 1;
  const table = createDefaultTable(index, model.dbType, getGlobalTemplateForDb(model.dbType));
  model.tables.push(table);
  state.selectedTableId = table.id;
  state.selectedRelationId = null;
  activeInspectorTab = "basic";
  ensureInspectorVisible();

  save();
  render();
  return true;
}

function estimateTableCardHeight(table) {
  if (tableCardViewMode === "header") {
    return 66;
  }
  const fieldCount = Array.isArray(table?.fields) ? table.fields.length : 0;
  const headerHeight = 52;
  const rowHeight = 34;
  const listPadding = 16;
  const maxListHeight = 220;
  const listHeight = Math.min(maxListHeight, fieldCount * rowHeight + listPadding);
  return headerHeight + listHeight + 8;
}

function autoLayoutActiveModel() {
  const model = getActiveModel();
  if (!model) {
    alert(t("alert.selectModelFirst"));
    return false;
  }
  if (!Array.isArray(model.tables) || model.tables.length === 0) {
    alert(t("alert.noTableInModel"));
    return false;
  }

  model.tables.forEach((table) => ensureTableRuntimeData(table));
  if (model.tables.length === 1) {
    const onlyTable = model.tables[0];
    onlyTable.x = 80;
    onlyTable.y = 80;
    workspaceViewX = onlyTable.x - 50;
    workspaceViewY = onlyTable.y - 50;
    save();
    render();
    return true;
  }

  const tableById = new Map(model.tables.map((table) => [table.id, table]));
  const outgoing = new Map(model.tables.map((table) => [table.id, new Set()]));
  const incoming = new Map(model.tables.map((table) => [table.id, new Set()]));

  model.relations.forEach((relation) => {
    const roleTables = getRelationRoleTables(model, relation);
    const fromId = roleTables?.parentTable?.id || relation.sourceTableId;
    const toId = roleTables?.childTable?.id || relation.targetTableId;
    if (!fromId || !toId || fromId === toId) return;
    if (!tableById.has(fromId) || !tableById.has(toId)) return;
    if (outgoing.get(fromId).has(toId)) return;
    outgoing.get(fromId).add(toId);
    incoming.get(toId).add(fromId);
  });

  const indegree = new Map(model.tables.map((table) => [table.id, incoming.get(table.id).size]));
  const levelById = new Map();
  const processed = new Set();
  const queue = model.tables
    .map((table) => table.id)
    .filter((tableId) => (indegree.get(tableId) || 0) === 0)
    .sort((a, b) => {
      const outDiff = outgoing.get(b).size - outgoing.get(a).size;
      if (outDiff !== 0) return outDiff;
      const nameA = tableById.get(a).name || tableById.get(a).code || a;
      const nameB = tableById.get(b).name || tableById.get(b).code || b;
      return nameA.localeCompare(nameB, "zh-CN");
    });

  queue.forEach((tableId) => levelById.set(tableId, 0));
  while (queue.length > 0) {
    const currentId = queue.shift();
    processed.add(currentId);
    const currentLevel = levelById.get(currentId) || 0;
    const children = Array.from(outgoing.get(currentId))
      .sort((a, b) => {
        const outDiff = outgoing.get(b).size - outgoing.get(a).size;
        if (outDiff !== 0) return outDiff;
        const nameA = tableById.get(a).name || tableById.get(a).code || a;
        const nameB = tableById.get(b).name || tableById.get(b).code || b;
        return nameA.localeCompare(nameB, "zh-CN");
      });
    children.forEach((childId) => {
      const nextLevel = currentLevel + 1;
      if (!levelById.has(childId) || nextLevel > levelById.get(childId)) {
        levelById.set(childId, nextLevel);
      }
      indegree.set(childId, (indegree.get(childId) || 0) - 1);
      if ((indegree.get(childId) || 0) <= 0) {
        queue.push(childId);
      }
    });
  }

  model.tables.forEach((table) => {
    if (processed.has(table.id)) return;
    if (levelById.has(table.id)) return;
    const parentLevels = Array.from(incoming.get(table.id))
      .map((parentId) => levelById.get(parentId))
      .filter((level) => Number.isFinite(level));
    if (parentLevels.length > 0) {
      levelById.set(table.id, Math.max(...parentLevels) + 1);
    } else {
      levelById.set(table.id, 0);
    }
  });

  const levels = new Map();
  model.tables.forEach((table) => {
    const level = levelById.get(table.id) || 0;
    if (!levels.has(level)) levels.set(level, []);
    levels.get(level).push(table.id);
  });

  const sortedLevelKeys = Array.from(levels.keys()).sort((a, b) => a - b);
  sortedLevelKeys.forEach((level) => {
    levels.get(level).sort((a, b) => {
      const nameA = tableById.get(a).name || tableById.get(a).code || a;
      const nameB = tableById.get(b).name || tableById.get(b).code || b;
      return nameA.localeCompare(nameB, "zh-CN");
    });
  });

  const orderIndex = new Map();
  const refreshOrderIndex = () => {
    orderIndex.clear();
    let index = 0;
    sortedLevelKeys.forEach((level) => {
      levels.get(level).forEach((tableId) => {
        orderIndex.set(tableId, index);
        index += 1;
      });
    });
  };
  refreshOrderIndex();

  const sortByNeighborBarycenter = (ids, neighborSelector) => {
    ids.sort((idA, idB) => {
      const neighborsA = neighborSelector(idA);
      const neighborsB = neighborSelector(idB);
      const baryA = neighborsA.length > 0
        ? neighborsA.reduce((sum, item) => sum + (orderIndex.get(item) || 0), 0) / neighborsA.length
        : Number.POSITIVE_INFINITY;
      const baryB = neighborsB.length > 0
        ? neighborsB.reduce((sum, item) => sum + (orderIndex.get(item) || 0), 0) / neighborsB.length
        : Number.POSITIVE_INFINITY;
      if (baryA !== baryB) return baryA - baryB;
      return (orderIndex.get(idA) || 0) - (orderIndex.get(idB) || 0);
    });
  };

  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 1; i < sortedLevelKeys.length; i += 1) {
      const level = sortedLevelKeys[i];
      const ids = levels.get(level);
      sortByNeighborBarycenter(ids, (tableId) =>
        Array.from(incoming.get(tableId)).filter((sourceId) => (levelById.get(sourceId) || 0) < level),
      );
      refreshOrderIndex();
    }

    for (let i = sortedLevelKeys.length - 2; i >= 0; i -= 1) {
      const level = sortedLevelKeys[i];
      const ids = levels.get(level);
      sortByNeighborBarycenter(ids, (tableId) =>
        Array.from(outgoing.get(tableId)).filter((targetId) => (levelById.get(targetId) || 0) > level),
      );
      refreshOrderIndex();
    }
  }

  const TABLE_WIDTH = 220;
  const ROW_GAP = 44;
  const SUB_COLUMN_GAP = 68;
  const LEVEL_GAP = 130;
  const START_X = 80;
  const START_Y = 70;
  const TARGET_COLUMN_HEIGHT = Math.max(760, WORKSPACE_BASE_HEIGHT - 160);
  let cursorX = START_X;

  sortedLevelKeys.forEach((level) => {
    const tableIds = levels.get(level);
    if (!tableIds || tableIds.length === 0) return;

    const estimatedHeights = tableIds.map((tableId) => estimateTableCardHeight(tableById.get(tableId)));
    let requiredSubColumns = 1;
    let runningHeight = 0;
    estimatedHeights.forEach((height) => {
      const nextHeight = runningHeight + height + ROW_GAP;
      if (runningHeight > 0 && nextHeight > TARGET_COLUMN_HEIGHT) {
        requiredSubColumns += 1;
        runningHeight = height + ROW_GAP;
      } else {
        runningHeight = nextHeight;
      }
    });
    const subColumnCount = Math.max(1, Math.min(requiredSubColumns, tableIds.length));
    const laneHeights = Array(subColumnCount).fill(0);

    tableIds.forEach((tableId) => {
      const table = tableById.get(tableId);
      const estimatedHeight = estimateTableCardHeight(table);
      let laneIndex = 0;
      for (let i = 1; i < laneHeights.length; i += 1) {
        if (laneHeights[i] < laneHeights[laneIndex]) laneIndex = i;
      }

      table.x = cursorX + laneIndex * (TABLE_WIDTH + SUB_COLUMN_GAP);
      table.y = START_Y + laneHeights[laneIndex];
      laneHeights[laneIndex] += estimatedHeight + ROW_GAP;
    });

    const levelBandWidth = subColumnCount * TABLE_WIDTH + (subColumnCount - 1) * SUB_COLUMN_GAP;
    cursorX += levelBandWidth + LEVEL_GAP;
  });

  const allX = model.tables.map((table) => Number(table.x) || 0);
  const allY = model.tables.map((table) => Number(table.y) || 0);
  const minX = allX.length > 0 ? Math.min(...allX) : 0;
  const minY = allY.length > 0 ? Math.min(...allY) : 0;
  workspaceViewX = minX - 50;
  workspaceViewY = minY - 50;

  save();
  render();
  return true;
}

function createNewModelWithDbType(dbType, name) {
  const defaultName = `Model${state.models.length + 1}`;
  const safeName = String(name || "").trim() || defaultName;
  const model = createModel(safeName, dbType);
  state.models.push(model);
  state.activeModelId = model.id;
  state.selectedTableId = null;
  state.selectedRelationId = null;
  activeInspectorTab = "basic";
  save();
  render();
}

function makeUniqueText(existingValues, preferredText) {
  const safeBase = String(preferredText || "").trim() || "Copy";
  const used = new Set(
    (Array.isArray(existingValues) ? existingValues : [])
      .map((value) => String(value || "").trim().toLocaleLowerCase())
      .filter(Boolean),
  );
  if (!used.has(safeBase.toLocaleLowerCase())) return safeBase;
  let index = 2;
  while (used.has(`${safeBase}_${index}`.toLocaleLowerCase())) {
    index += 1;
  }
  return `${safeBase}_${index}`;
}

function makeUniqueTextWithNumber(existingValues, preferredText) {
  const safeBase = String(preferredText || "").trim() || "Field";
  const used = new Set(
    (Array.isArray(existingValues) ? existingValues : [])
      .map((value) => String(value || "").trim().toLocaleLowerCase())
      .filter(Boolean),
  );
  const normalizedBase = safeBase.toLocaleLowerCase();
  if (!used.has(normalizedBase)) return safeBase;
  let index = 2;
  while (used.has(`${safeBase}${index}`.toLocaleLowerCase())) {
    index += 1;
  }
  return `${safeBase}${index}`;
}

function getSelectedFieldIdSet(tableId) {
  if (!tableId) return new Set();
  if (!selectedFieldIdsByTable.has(tableId)) {
    selectedFieldIdsByTable.set(tableId, new Set());
  }
  return selectedFieldIdsByTable.get(tableId);
}

function normalizeSelectedFieldIdSet(table) {
  const selectedSet = getSelectedFieldIdSet(table?.id);
  const validIds = new Set((table?.fields || []).map((field) => field.id));
  Array.from(selectedSet).forEach((fieldId) => {
    if (!validIds.has(fieldId)) {
      selectedSet.delete(fieldId);
    }
  });
  return selectedSet;
}

function copySelectedFieldsFromTable(table) {
  if (!table) return false;
  const selectedSet = normalizeSelectedFieldIdSet(table);
  if (selectedSet.size === 0) {
    alert(t("fields.copyNone"));
    return false;
  }
  const selectedFieldList = (table.fields || []).filter((field) => selectedSet.has(field.id));
  if (selectedFieldList.length === 0) {
    alert(t("fields.copyNone"));
    return false;
  }
  const copiedFields = selectedFieldList.map((field) => ({
    name: field.name,
    code: field.code,
    dataType: field.dataType,
    length: field.length,
    precision: field.precision,
    scale: field.scale,
    primaryKey: field.primaryKey,
    notNull: field.notNull,
    autoIncrement: field.autoIncrement,
    defaultValue: field.defaultValue,
    comment: field.comment,
  }));
  fieldClipboard = {
    sourceTableId: table.id,
    fields: copiedFields,
  };
  alert(t("fields.copyDone").replace("{count}", String(copiedFields.length)));
  return true;
}

function pasteCopiedFieldsToTable(model, table) {
  if (!model || !table) return false;
  const copiedFields = Array.isArray(fieldClipboard?.fields) ? fieldClipboard.fields : [];
  if (copiedFields.length === 0) {
    alert(t("fields.clipboardEmpty"));
    return false;
  }

  const existingNames = (table.fields || []).map((field) => field.name);
  const existingCodes = (table.fields || []).map((field) => field.code);
  const selectedSet = getSelectedFieldIdSet(table.id);
  selectedSet.clear();

  let pastedCount = 0;
  copiedFields.forEach((copiedField) => {
    const baseName = toTextOrEmpty(copiedField?.name || copiedField?.code).trim() || `Field${table.fields.length + 1}`;
    const baseCode = toTextOrEmpty(copiedField?.code || baseName).trim() || baseName;
    const uniqueName = makeUniqueTextWithNumber(existingNames, baseName);
    const uniqueCode = makeUniqueTextWithNumber(existingCodes, baseCode);
    existingNames.push(uniqueName);
    existingCodes.push(uniqueCode);

    const normalized = normalizeFieldTemplate(
      {
        ...copiedField,
        name: uniqueName,
        code: uniqueCode,
      },
      table.fields.length + 1,
      model.dbType,
    );
    const createdField = {
      id: uid("field"),
      ...normalized,
    };
    table.fields.push(createdField);
    selectedSet.add(createdField.id);
    pastedCount += 1;
  });

  if (pastedCount <= 0) {
    alert(t("fields.clipboardEmpty"));
    return false;
  }

  syncPrimaryClusteredIndex(table);
  syncTableRelationsForeignKeys(model, table.id, false);
  save();
  renderInspector();
  renderWorkspace();
  alert(t("fields.pasteDone").replace("{count}", String(pastedCount)));
  return true;
}

function cloneTableForPaste(model, sourceTable) {
  const table = JSON.parse(JSON.stringify(sourceTable));
  const fieldIdMap = new Map();

  table.id = uid("table");
  table.x = Number.isFinite(Number(table.x)) ? Number(table.x) + 40 : 120;
  table.y = Number.isFinite(Number(table.y)) ? Number(table.y) + 40 : 120;
  table.name = makeUniqueText(
    model.tables.map((item) => item.name),
    `${sourceTable.name || sourceTable.code || "Table"}_copy`,
  );
  table.code = makeUniqueText(
    model.tables.map((item) => item.code),
    `${sourceTable.code || sourceTable.name || "Table"}_copy`,
  );

  table.fields = (Array.isArray(table.fields) ? table.fields : []).map((field) => {
    const nextId = uid("field");
    fieldIdMap.set(field.id, nextId);
    return {
      ...field,
      id: nextId,
    };
  });
  table.indexes = (Array.isArray(table.indexes) ? table.indexes : []).map((indexItem) => ({
    ...indexItem,
    id: uid("idx"),
    columns: (indexItem.columns || []).map((fieldId) => fieldIdMap.get(fieldId)).filter(Boolean),
  }));
  ensureTableRuntimeData(table);
  return table;
}

function getSelectedRelation() {
  const model = getActiveModel();
  if (!model || !state.selectedRelationId) return null;
  return model.relations.find((relation) => relation.id === state.selectedRelationId) || null;
}

function copySelectedEntity() {
  const model = getActiveModel();
  if (!model) {
    alert(t("alert.selectModelFirst"));
    return false;
  }
  const relation = getSelectedRelation();
  if (relation) {
    entityClipboard = {
      type: "relation",
      payload: JSON.parse(JSON.stringify(relation)),
    };
    return true;
  }
  const table = getSelectedTable();
  if (table) {
    entityClipboard = {
      type: "table",
      payload: JSON.parse(JSON.stringify(table)),
    };
    return true;
  }
  alert(t("alert.copyEntityRequired"));
  return false;
}

function deleteSelectedEntity(showWhenNone = true) {
  const relation = getSelectedRelation();
  if (relation) {
    removeRelation(relation.id);
    return true;
  }
  const table = getSelectedTable();
  if (table) {
    removeTable(table.id);
    return true;
  }
  if (showWhenNone) {
    alert(t("alert.deleteEntityRequired"));
  }
  return false;
}

function cutSelectedEntity() {
  if (!copySelectedEntity()) return false;
  return deleteSelectedEntity(false);
}

function pasteClipboardEntity() {
  const model = getActiveModel();
  if (!model) {
    alert(t("alert.selectModelFirst"));
    return false;
  }
  if (!entityClipboard || !entityClipboard.type) {
    alert(t("alert.clipboardEmpty"));
    return false;
  }

  if (entityClipboard.type === "table") {
    const table = cloneTableForPaste(model, entityClipboard.payload);
    model.tables.push(table);
    state.selectedTableId = table.id;
    state.selectedRelationId = null;
    activeInspectorTab = "basic";
    ensureInspectorVisible();
    save();
    render();
    return true;
  }

  if (entityClipboard.type === "relation") {
    const sourceId = entityClipboard.payload.sourceTableId;
    const targetId = entityClipboard.payload.targetTableId;
    const sourceExists = model.tables.some((table) => table.id === sourceId);
    const targetExists = model.tables.some((table) => table.id === targetId);
    if (!sourceExists || !targetExists) {
      alert(t("alert.relationPasteMissingTable"));
      return false;
    }
    const result = addRelation(
      model,
      sourceId,
      targetId,
      normalizeRelationCardinality(entityClipboard.payload.cardinality),
    );
    if (!result.ok) {
      alert(result.message || t("alert.relationPasteFailed"));
      return false;
    }
    const pastedRelation = model.relations.find((relation) => relation.id === result.relationId);
    if (pastedRelation) {
      pastedRelation.name = makeUniqueText(
        model.relations.filter((relation) => relation.id !== pastedRelation.id).map((relation) => relation.name),
        entityClipboard.payload.name || pastedRelation.name || "relation_copy",
      );
      state.selectedRelationId = pastedRelation.id;
      state.selectedTableId = getRelationArrowTargetTableId(model, pastedRelation);
    }
    save();
    render();
    return true;
  }

  alert(t("alert.clipboardUnsupported"));
  return false;
}

function cloneSelectedEntity() {
  if (!copySelectedEntity()) return false;
  return pasteClipboardEntity();
}

async function clearActiveModelAll() {
  const model = getActiveModel();
  if (!model) {
    alert(t("alert.selectModelFirst"));
    return false;
  }
  const choice = await showChoiceDialog({
    title: t("dialog.clearAll.title"),
    message: tr("dialog.clearAll.message", { name: model.name }),
    actions: [
      { value: "clear", label: t("dialog.clearAll.confirm"), className: "danger" },
      { value: "cancel", label: t("common.cancel"), className: "ghost", role: "cancel" },
    ],
  });
  if (choice !== "clear") return false;

  model.tables = [];
  model.relations = [];
  state.selectedTableId = null;
  state.selectedRelationId = null;
  save();
  render();
  return true;
}

async function openHelpDialog() {
  const helpUrlObject = new URL("help-manual.html", window.location.href);
  helpUrlObject.searchParams.set("lang", currentLanguage);
  const helpUrl = helpUrlObject.toString();
  const manualWindow = window.open(helpUrl, "_blank");
  if (manualWindow) {
    try {
      manualWindow.opener = null;
    } catch {
      // Ignore opener protection failures.
    }
    manualWindow.focus?.();
    return;
  }
  await showChoiceDialog({
    title: t("dialog.help.openFailedTitle"),
    message: tr("dialog.help.openFailedMessage", { url: helpUrl }),
    actions: [{ value: "ok", label: t("common.ok"), className: "primary", role: "cancel" }],
  });
}

async function openCodexHandoffDialog() {
  const model = getActiveModel();
  if (!model) {
    alert(t("alert.selectModelFirst"));
    return;
  }

  await new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "app-dialog-backdrop";

    const dialog = document.createElement("div");
    dialog.className = "app-dialog app-dialog-wide codex-dialog";
    dialog.innerHTML = `
      <h3>${escapeHtml(t("dialog.codex.title"))}</h3>
      <div class="codex-dialog-lead">${escapeHtml(t("dialog.codex.lead"))}</div>
      <div class="codex-dialog-grid">
        <button type="button" class="codex-option-card" id="codexSaveModelBtn">
          <strong>${escapeHtml(t("dialog.codex.modelTitle"))}</strong>
          <span>${escapeHtml(t("dialog.codex.modelDesc"))}</span>
        </button>
        <button type="button" class="codex-option-card" id="codexExportSqlBtn">
          <strong>${escapeHtml(t("dialog.codex.sqlTitle"))}</strong>
          <span>${escapeHtml(t("dialog.codex.sqlDesc"))}</span>
        </button>
        <button type="button" class="codex-option-card" id="codexCopySummaryBtn">
          <strong>${escapeHtml(t("dialog.codex.summaryTitle"))}</strong>
          <span>${escapeHtml(t("dialog.codex.summaryDesc"))}</span>
        </button>
        <button type="button" class="codex-option-card" id="codexCopyScreenshotBtn">
          <strong>${escapeHtml(t("dialog.codex.screenshotTitle"))}</strong>
          <span>${escapeHtml(t("dialog.codex.screenshotDesc"))}</span>
        </button>
        <button type="button" class="codex-option-card" id="codexCopySpeechBtn">
          <strong>${escapeHtml(t("dialog.codex.speechTitle"))}</strong>
          <span>${escapeHtml(t("dialog.codex.speechDesc"))}</span>
        </button>
      </div>
      <div class="codex-dialog-tips">
        <div>${escapeHtml(t("dialog.codex.tipOrder"))}</div>
        <div>${escapeHtml(t("dialog.codex.tipContinue"))}</div>
        <div>${escapeHtml(t("dialog.codex.tipFile"))}</div>
      </div>
      <div class="codex-dialog-status" id="codexDialogStatus">${escapeHtml(t("dialog.codex.statusIdle"))}</div>
      <div class="app-dialog-actions">
        <button type="button" class="app-dialog-btn ghost" id="codexDialogCloseBtn">${escapeHtml(t("common.close"))}</button>
      </div>
    `;

    const saveModelActionBtn = dialog.querySelector("#codexSaveModelBtn");
    const exportSqlActionBtn = dialog.querySelector("#codexExportSqlBtn");
    const copySummaryActionBtn = dialog.querySelector("#codexCopySummaryBtn");
    const copyScreenshotActionBtn = dialog.querySelector("#codexCopyScreenshotBtn");
    const copySpeechActionBtn = dialog.querySelector("#codexCopySpeechBtn");
    const closeBtn = dialog.querySelector("#codexDialogCloseBtn");
    const statusNode = dialog.querySelector("#codexDialogStatus");
    const actionButtons = [
      saveModelActionBtn,
      exportSqlActionBtn,
      copySummaryActionBtn,
      copyScreenshotActionBtn,
      copySpeechActionBtn,
      closeBtn,
    ].filter(Boolean);

    const setBusy = (busy) => {
      actionButtons.forEach((button) => {
        button.disabled = busy;
      });
    };

    const setStatus = (message, tone = "") => {
      if (!statusNode) return;
      statusNode.textContent = message;
      statusNode.className = `codex-dialog-status${tone ? ` ${tone}` : ""}`;
    };

    const cleanup = () => {
      document.removeEventListener("keydown", onKeydown);
      backdrop.remove();
    };

    const close = () => {
      cleanup();
      resolve();
    };

    const onKeydown = (event) => {
      if (event.key === "Escape") {
        close();
      }
    };

    const runAction = async (handler) => {
      setBusy(true);
      try {
        await handler();
      } finally {
        setBusy(false);
      }
    };

    saveModelActionBtn?.addEventListener("click", () =>
      runAction(async () => {
        setStatus(t("dialog.codex.statusSavingModel"), "pending");
        const saved = await saveActiveModelToWorkspace();
        if (!saved) {
          setStatus(t("dialog.codex.statusModelUnsaved"), "warn");
          return;
        }
        const prompt = buildCodexPromptFromMode("model", getActiveModel(), {
          modelPath: saved.displayPath || saved.fileName || "",
        });
        const handoff = await writeCodexHandoffFile({
          mode: "model",
          model: getActiveModel(),
          promptText: prompt,
          modelPath: saved.displayPath || saved.fileName || "",
        });
        const copied = await copyTextToClipboard(prompt);
        setStatus(
          copied
            ? tr("dialog.codex.statusModelSavedCopied", {
              modelPath: saved.displayPath || saved.fileName,
              handoffPath: handoff.displayPath,
            })
            : tr("dialog.codex.statusModelSaved", {
              modelPath: saved.displayPath || saved.fileName,
              handoffPath: handoff.displayPath,
            }),
          copied ? "ok" : "warn",
        );
      }),
    );

    exportSqlActionBtn?.addEventListener("click", () =>
      runAction(async () => {
        setStatus(t("dialog.codex.statusExportingSql"), "pending");
        const exported = await exportActiveModelSqlToWorkspace();
        if (!exported) {
          setStatus(t("dialog.codex.statusSqlNotExported"), "warn");
          return;
        }
        const prompt = buildCodexPromptFromMode("sql", getActiveModel(), {
          sqlPath: exported.displayPath || exported.fileName || "",
        });
        const handoff = await writeCodexHandoffFile({
          mode: "sql",
          model: getActiveModel(),
          promptText: prompt,
          modelPath: getModelWorkspaceDisplayPath(getActiveModel()),
          sqlPath: exported.displayPath || exported.fileName || "",
        });
        const copied = await copyTextToClipboard(prompt);
        setStatus(
          copied
            ? tr("dialog.codex.statusSqlExportedCopied", {
              sqlPath: exported.displayPath || exported.fileName,
              handoffPath: handoff.displayPath,
            })
            : tr("dialog.codex.statusSqlExported", {
              sqlPath: exported.displayPath || exported.fileName,
              handoffPath: handoff.displayPath,
            }),
          copied ? "ok" : "warn",
        );
      }),
    );

    copySummaryActionBtn?.addEventListener("click", () =>
      runAction(async () => {
        const prompt = buildCodexPromptFromMode("summary", getActiveModel(), {
          summary: buildModelSummaryText(getActiveModel()),
        });
        const handoff = await writeCodexHandoffFile({
          mode: "summary",
          model: getActiveModel(),
          promptText: prompt,
          modelPath: getModelWorkspaceDisplayPath(getActiveModel()),
        });
        const copied = await copyTextToClipboard(prompt);
        setStatus(
          copied
            ? tr("dialog.codex.statusSummaryCopied", { handoffPath: handoff.displayPath })
            : tr("dialog.codex.statusSummary", { handoffPath: handoff.displayPath }),
          copied ? "ok" : "warn",
        );
      }),
    );

    copyScreenshotActionBtn?.addEventListener("click", () =>
      runAction(async () => {
        const prompt = buildCodexPromptFromMode("screenshot", getActiveModel());
        const handoff = await writeCodexHandoffFile({
          mode: "screenshot",
          model: getActiveModel(),
          promptText: prompt,
          modelPath: getModelWorkspaceDisplayPath(getActiveModel()),
        });
        const copied = await copyTextToClipboard(prompt);
        setStatus(
          copied
            ? tr("dialog.codex.statusScreenshotCopied", { handoffPath: handoff.displayPath })
            : tr("dialog.codex.statusScreenshot", { handoffPath: handoff.displayPath }),
          copied ? "ok" : "warn",
        );
      }),
    );

    copySpeechActionBtn?.addEventListener("click", () =>
      runAction(async () => {
        const prompt = buildCodexPromptFromMode("speech", getActiveModel(), {
          summary: buildModelSummaryText(getActiveModel()),
        });
        const handoff = await writeCodexHandoffFile({
          mode: "speech",
          model: getActiveModel(),
          promptText: prompt,
          modelPath: getModelWorkspaceDisplayPath(getActiveModel()),
        });
        const copied = await copyTextToClipboard(prompt);
        setStatus(
          copied
            ? tr("dialog.codex.statusSpeechCopied", { handoffPath: handoff.displayPath })
            : tr("dialog.codex.statusSpeech", { handoffPath: handoff.displayPath }),
          copied ? "ok" : "warn",
        );
      }),
    );

    closeBtn?.addEventListener("click", close);
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) close();
    });

    document.addEventListener("keydown", onKeydown);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
  });
}

async function openAboutDialog() {
  await new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "app-dialog-backdrop";

    const dialog = document.createElement("div");
    dialog.className = "app-dialog about-dialog";
    dialog.innerHTML = `
      <h3>${escapeHtml(t("dialog.about.title"))}</h3>
      <div class="about-dialog-lead">${escapeHtml(t("dialog.about.lead"))}</div>
      <div class="about-dialog-grid">
        <div class="about-dialog-item">
          <span class="about-dialog-label">${escapeHtml(t("dialog.about.product"))}</span>
          <div class="about-dialog-value">DB Craft</div>
        </div>
        <div class="about-dialog-item">
          <span class="about-dialog-label">${escapeHtml(t("dialog.about.version"))}</span>
          <div class="about-dialog-value">V1.0</div>
        </div>
        <div class="about-dialog-item">
          <span class="about-dialog-label">${escapeHtml(t("dialog.about.supportedDb"))}</span>
          <div class="about-dialog-value">MySQL 8 / PostgreSQL 14 / SQLite / MSSQL</div>
        </div>
        <div class="about-dialog-item">
          <span class="about-dialog-label">${escapeHtml(t("dialog.about.contact"))}</span>
          <div class="about-dialog-value"><a href="mailto:5552811@qq.com">5552811@qq.com</a></div>
          </div>
        <div class="about-dialog-item">
          <span class="about-dialog-label">${escapeHtml(t("dialog.about.license"))}</span>
          <div class="about-dialog-value">MIT License</div>
          </div>
        <div class="about-dialog-item">
          <span class="about-dialog-label">${escapeHtml(t("dialog.about.copyright"))}</span>
          <div class="about-dialog-value">Copyright © 2026 DB Craft</div>
        </div>
      </div>
      <div class="app-dialog-actions">
        <button type="button" class="app-dialog-btn primary" id="aboutDialogOkBtn">${escapeHtml(t("common.ok"))}</button>
      </div>
    `;

    const okBtn = dialog.querySelector("#aboutDialogOkBtn");

    const cleanup = () => {
      document.removeEventListener("keydown", onKeydown);
      backdrop.remove();
    };

    const close = () => {
      cleanup();
      resolve();
    };

    const onKeydown = (event) => {
      if (event.key === "Escape") {
        close();
      }
    };

    okBtn?.addEventListener("click", close);
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) close();
    });

    document.addEventListener("keydown", onKeydown);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
  });
}

async function openTableListDialog() {
  const model = getActiveModel();
  if (!model) {
    alert(t("alert.selectModelFirst"));
    return false;
  }
  if (!Array.isArray(model.tables) || model.tables.length === 0) {
    alert(t("alert.noTableInModel"));
    return false;
  }

  const tableId = await showTableListDialog(model);
  if (!tableId) return false;
  const exists = model.tables.some((table) => table.id === tableId);
  if (!exists) return false;

  state.selectedTableId = tableId;
  state.selectedRelationId = null;
  activeInspectorTab = "basic";
  ensureInspectorVisible();
  save();
  render();
  return true;
}



function renderRelationList(container, model, table) {
  const relatedRelations = model.relations.filter(
    (relation) => relation.sourceTableId === table.id || relation.targetTableId === table.id,
  );
  if (relatedRelations.length === 0) {
    container.innerHTML = `<p class="helper">${escapeHtml(t("basic.noRelation"))}</p>`;
    return;
  }

  relatedRelations.forEach((relation) => {
    const sourceTable = model.tables.find((item) => item.id === relation.sourceTableId);
    const targetTable = model.tables.find((item) => item.id === relation.targetTableId);
    const sourceName = sourceTable ? sourceTable.name : relation.sourceTableId;
    const targetName = targetTable ? targetTable.name : relation.targetTableId;
    const relationCard = document.createElement("div");
    relationCard.className = "relation-editor";
    relationCard.innerHTML = `
      <div class="relation-editor-head">
        <h4>${escapeHtml(sourceName)} -> ${escapeHtml(targetName)}</h4>
      </div>
      <div class="field-row">
        <label>
          ${escapeHtml(t("basic.relationName"))}
          <input data-role="relation-name" />
        </label>
        <label>
          ${escapeHtml(t("basic.relationType"))}
          <select data-role="relation-cardinality">${buildRelationCardinalityOptionsHtml(relation.cardinality)}</select>
        </label>
      </div>
      <button type="button" class="danger ghost" data-role="delete-relation">${escapeHtml(t("basic.deleteRelation"))}</button>
    `;

    const relationNameInput = relationCard.querySelector('[data-role="relation-name"]');
    const relationCardinalityInput = relationCard.querySelector('[data-role="relation-cardinality"]');
    const deleteRelationBtn = relationCard.querySelector('[data-role="delete-relation"]');

    relationNameInput.value = relation.name || "";
    relationCardinalityInput.value = normalizeRelationCardinality(relation.cardinality);

    relationNameInput.addEventListener("input", () => {
      relation.name = relationNameInput.value;
      save();
      drawRelations();
    });
    relationCardinalityInput.addEventListener("change", () => {
      const nextValue = relationCardinalityInput.value;
      if (isManyToMany(nextValue)) {
        alert(t("relation.manyToManyHint"));
        relationCardinalityInput.value = normalizeRelationCardinality(relation.cardinality);
        return;
      }
      relation.cardinality = normalizeRelationCardinality(nextValue);
      const fkResult = syncRelationForeignKey(model, relation, true);
      if (!fkResult.ok) {
        relation.foreignKey = null;
        alert(tr("relation.updateWarning", { message: fkResult.message }));
      }
      save();
      render();
    });
    deleteRelationBtn.addEventListener("click", () => {
      model.relations = model.relations.filter((item) => item.id !== relation.id);
      if (state.selectedRelationId === relation.id) {
        state.selectedRelationId = null;
      }
      save();
      render();
    });

    container.appendChild(relationCard);
  });
}

function renderBasicTab(panel, model, table) {
  const relationOptions = model.tables
    .filter((item) => item.id !== table.id)
    .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`)
    .join("");

  panel.innerHTML = `
    <label>
      ${escapeHtml(t("basic.tableName"))}
      <input id="tableNameInput" value="${escapeHtml(table.name)}" />
    </label>
    <label>
      ${escapeHtml(t("basic.tableCode"))}
      <input id="tableCodeInput" value="${escapeHtml(table.code)}" />
    </label>
    <label>
      ${escapeHtml(t("basic.tableComment"))}
      <input id="tableCommentInput" value="${escapeHtml(table.comment || "")}" />
    </label>

    <h3 class="section-title">${escapeHtml(t("basic.relationMgmt"))}</h3>
    <label>
      ${escapeHtml(t("basic.relationTarget"))}
      <select id="relationTargetSelect">
        <option value="">${escapeHtml(t("basic.relationTargetSelect"))}</option>
        ${relationOptions}
      </select>
    </label>
    <label>
      ${escapeHtml(t("basic.relationType"))}
      <select id="relationCardinalitySelect">
        ${buildRelationCardinalityOptionsHtml("1:N")}
      </select>
    </label>
    <button type="button" id="addRelationBtn">${escapeHtml(t("basic.addRelation"))}</button>

    <h3 class="section-title">${escapeHtml(t("basic.relationList"))}</h3>
    <p class="helper">${escapeHtml(t("basic.relationHint"))}</p>
    <div id="relationEditors"></div>

    <button type="button" class="danger" id="deleteTableBtn">${escapeHtml(t("basic.deleteCurrentTable"))}</button>
  `;

  const tableNameInput = panel.querySelector("#tableNameInput");
  const tableCodeInput = panel.querySelector("#tableCodeInput");
  const tableCommentInput = panel.querySelector("#tableCommentInput");
  const relationTargetSelect = panel.querySelector("#relationTargetSelect");
  const relationCardinalitySelect = panel.querySelector("#relationCardinalitySelect");
  const addRelationBtn = panel.querySelector("#addRelationBtn");
  const relationEditors = panel.querySelector("#relationEditors");
  const deleteTableBtn = panel.querySelector("#deleteTableBtn");

  tableNameInput.addEventListener("input", () => {
    const previousName = table.name;
    const nextName = tableNameInput.value;
    const syncComment = shouldSyncCommentWithFieldName(table.comment, previousName);
    table.name = nextName;
    if (syncComment) {
      table.comment = nextName;
      tableCommentInput.value = nextName;
    }
    save();
    refreshAfterTableMetaEdit();
  });
  tableCodeInput.addEventListener("input", () => {
    table.code = tableCodeInput.value;
    syncPrimaryClusteredIndex(table);
    syncTableRelationsForeignKeys(model, table.id, false);
    save();
    refreshAfterTableMetaEdit();
  });
  tableCommentInput.addEventListener("input", () => {
    table.comment = tableCommentInput.value;
    save();
  });

  renderRelationList(relationEditors, model, table);

  addRelationBtn.addEventListener("click", () => {
    const targetId = relationTargetSelect.value;
    const relationCardinality = normalizeRelationCardinality(relationCardinalitySelect.value);
    if (!targetId) return;
    const result = addRelation(model, table.id, targetId, relationCardinality);
    if (!result.ok) {
      alert(result.message);
      return;
    }
    if (result.warning) {
      alert(tr("relation.createWarning", { message: result.warning }));
    }

    save();
    render();
  });

  deleteTableBtn.addEventListener("click", () => {
    removeTable(table.id);
  });
}

function renderFieldsTab(panel, model, table) {
  const selectedSet = normalizeSelectedFieldIdSet(table);
  panel.innerHTML = `
    <div class="field-actions">
      <button type="button" id="addFieldBtn">${escapeHtml(t("fields.addField"))}</button>
      <button type="button" id="copySelectedFieldsBtn">${escapeHtml(t("fields.copySelected"))}</button>
      <button type="button" id="pasteFieldsBtn">${escapeHtml(t("fields.pasteFields"))}</button>
      <span class="helper" id="fieldSelectionHint"></span>
    </div>
    <div class="field-grid-wrap">
      <table class="field-grid">
        <thead>
          <tr>
            <th class="field-col-check"><input type="checkbox" id="selectAllFieldsCheckbox" aria-label="${escapeHtml(t("fields.col.select"))}" /></th>
            <th>#</th>
            <th>${escapeHtml(t("fields.col.order"))}</th>
            <th>${escapeHtml(t("fields.col.name"))}</th>
            <th>${escapeHtml(t("fields.col.code"))}</th>
            <th>${escapeHtml(t("fields.col.type"))}</th>
            <th>${escapeHtml(t("fields.col.length"))}</th>
            <th>${escapeHtml(t("fields.col.precision"))}</th>
            <th>${escapeHtml(t("fields.col.scale"))}</th>
            <th>PK</th>
            <th>NN</th>
            <th>AI</th>
            <th>${escapeHtml(t("fields.col.default"))}</th>
            <th>${escapeHtml(t("fields.col.comment"))}</th>
            <th>${escapeHtml(t("fields.col.action"))}</th>
          </tr>
        </thead>
        <tbody id="fieldGridBody"></tbody>
      </table>
    </div>
  `;

  const addFieldBtn = panel.querySelector("#addFieldBtn");
  const copySelectedFieldsBtn = panel.querySelector("#copySelectedFieldsBtn");
  const pasteFieldsBtn = panel.querySelector("#pasteFieldsBtn");
  const fieldSelectionHint = panel.querySelector("#fieldSelectionHint");
  const selectAllFieldsCheckbox = panel.querySelector("#selectAllFieldsCheckbox");
  const fieldGridBody = panel.querySelector("#fieldGridBody");

  const updateFieldSelectionUi = () => {
    const total = (table.fields || []).length;
    const selectedCount = selectedSet.size;
    if (fieldSelectionHint) {
      fieldSelectionHint.textContent = selectedCount > 0 ? `${selectedCount}/${total}` : "";
    }
    if (selectAllFieldsCheckbox) {
      selectAllFieldsCheckbox.checked = total > 0 && selectedCount === total;
      selectAllFieldsCheckbox.indeterminate = selectedCount > 0 && selectedCount < total;
    }
    if (copySelectedFieldsBtn) {
      copySelectedFieldsBtn.disabled = selectedCount === 0;
    }
  };

  addFieldBtn.addEventListener("click", () => {
    const nextIndex = table.fields.length + 1;
    table.fields.push(createDefaultField(nextIndex, model.dbType));
    save();
    renderInspector();
    renderWorkspace();
  });
  if (copySelectedFieldsBtn) {
    copySelectedFieldsBtn.addEventListener("click", () => {
      copySelectedFieldsFromTable(table);
    });
  }
  if (pasteFieldsBtn) {
    pasteFieldsBtn.addEventListener("click", () => {
      pasteCopiedFieldsToTable(model, table);
    });
  }
  if (selectAllFieldsCheckbox) {
    selectAllFieldsCheckbox.addEventListener("change", () => {
      selectedSet.clear();
      if (selectAllFieldsCheckbox.checked) {
        (table.fields || []).forEach((field) => selectedSet.add(field.id));
      }
      renderInspector();
    });
  }

  const moveField = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= table.fields.length) return;
    if (toIndex < 0 || toIndex >= table.fields.length) return;
    const [moved] = table.fields.splice(fromIndex, 1);
    table.fields.splice(toIndex, 0, moved);
    syncPrimaryClusteredIndex(table);
    save();
    renderInspector();
    renderWorkspace();
  };

  table.fields.forEach((field, index) => {
    const row = document.createElement("tr");

    const dataTypeOptions = getDataTypeOptionsHtml(
      model.dbType,
      field.dataType,
      field.length,
      field.precision,
      field.scale,
    );

    row.innerHTML = `
      <td class="field-col-check"><input type="checkbox" data-role="field-select" aria-label="${escapeHtml(t("fields.col.select"))}" /></td>
      <td class="field-col-index">${index + 1}</td>
      <td class="field-col-order">
        <button type="button" class="ghost" data-role="move-up-field" title="${escapeHtml(t("fields.moveUpTitle"))}" aria-label="${escapeHtml(t("fields.moveUpTitle"))}">↑</button>
        <button type="button" class="ghost" data-role="move-down-field" title="${escapeHtml(t("fields.moveDownTitle"))}" aria-label="${escapeHtml(t("fields.moveDownTitle"))}">↓</button>
      </td>
      <td><input data-role="field-name" /></td>
      <td><input data-role="field-code" /></td>
      <td><select data-role="field-data-type">${dataTypeOptions}</select></td>
      <td><input data-role="field-length" /></td>
      <td><input data-role="field-precision" /></td>
      <td><input data-role="field-scale" /></td>
      <td class="field-col-check"><input type="checkbox" data-role="field-pk" /></td>
      <td class="field-col-check"><input type="checkbox" data-role="field-nn" /></td>
      <td class="field-col-check"><input type="checkbox" data-role="field-ai" /></td>
      <td><input data-role="field-default" /></td>
      <td><input data-role="field-comment" /></td>
      <td class="field-col-actions">
        <button type="button" class="danger ghost" data-role="delete-field">${escapeHtml(t("fields.delete"))}</button>
      </td>
    `;

    const fieldSelectCheckbox = row.querySelector('[data-role="field-select"]');
    const nameInput = row.querySelector('[data-role="field-name"]');
    const codeInput = row.querySelector('[data-role="field-code"]');
    const dataTypeSelect = row.querySelector('[data-role="field-data-type"]');
    const lengthInput = row.querySelector('[data-role="field-length"]');
    const precisionInput = row.querySelector('[data-role="field-precision"]');
    const scaleInput = row.querySelector('[data-role="field-scale"]');
    const pkCheckbox = row.querySelector('[data-role="field-pk"]');
    const nnCheckbox = row.querySelector('[data-role="field-nn"]');
    const aiCheckbox = row.querySelector('[data-role="field-ai"]');
    const defaultInput = row.querySelector('[data-role="field-default"]');
    const commentInput = row.querySelector('[data-role="field-comment"]');
    const moveUpFieldBtn = row.querySelector('[data-role="move-up-field"]');
    const moveDownFieldBtn = row.querySelector('[data-role="move-down-field"]');
    const deleteFieldBtn = row.querySelector('[data-role="delete-field"]');

    if (fieldSelectCheckbox) {
      fieldSelectCheckbox.checked = selectedSet.has(field.id);
    }
    nameInput.value = field.name;
    codeInput.value = field.code;
    lengthInput.value = field.length;
    precisionInput.value = field.precision;
    scaleInput.value = field.scale;
    pkCheckbox.checked = field.primaryKey;
    nnCheckbox.checked = field.notNull;
    nnCheckbox.disabled = field.primaryKey;
    aiCheckbox.checked = field.autoIncrement;
    defaultInput.value = field.defaultValue;
    commentInput.value = field.comment;
    if (moveUpFieldBtn) moveUpFieldBtn.disabled = index === 0;
    if (moveDownFieldBtn) moveDownFieldBtn.disabled = index === table.fields.length - 1;

    const refreshFieldOnCard = () => {
      syncPrimaryClusteredIndex(table);
      syncTableRelationsForeignKeys(model, table.id, false);
      save();
      renderWorkspace();
    };

    if (fieldSelectCheckbox) {
      fieldSelectCheckbox.addEventListener("change", () => {
        if (fieldSelectCheckbox.checked) {
          selectedSet.add(field.id);
        } else {
          selectedSet.delete(field.id);
        }
        updateFieldSelectionUi();
      });
    }

    nameInput.addEventListener("input", () => {
      const previousName = field.name;
      const nextName = nameInput.value;
      const syncComment = shouldSyncCommentWithFieldName(field.comment, previousName);
      field.name = nextName;
      if (syncComment) {
        field.comment = nextName;
        commentInput.value = nextName;
      }
      refreshFieldOnCard();
    });
    codeInput.addEventListener("input", () => {
      field.code = codeInput.value;
      refreshFieldOnCard();
    });
    dataTypeSelect.addEventListener("change", () => {
      const parsedType = parseLengthAwareTypeValue(dataTypeSelect.value);
      field.dataType = parsedType.baseType;
      const optionalTypeMode = getLengthOptionalTypeMode(field.dataType);

      if (optionalTypeMode === "single") {
        field.precision = "";
        field.scale = "";
        precisionInput.value = "";
        scaleInput.value = "";
        if (parsedType.mode === "none") {
          field.length = "";
          lengthInput.value = "";
        } else if (!String(field.length || "").trim()) {
          field.length = getDefaultLengthForType(field.dataType);
          lengthInput.value = field.length;
        }
        syncTypeSelectByLength(dataTypeSelect, field.dataType, field.length, field.precision, field.scale);
        refreshFieldOnCard();
        return;
      }

      if (optionalTypeMode === "double") {
        field.length = "";
        lengthInput.value = "";
        if (parsedType.mode === "none") {
          field.precision = "";
          field.scale = "";
        } else if (parsedType.mode === "param1") {
          if (!String(field.precision || "").trim()) {
            field.precision = getDefaultPrecisionForType(field.dataType);
          }
          field.scale = "";
        } else {
          if (!String(field.precision || "").trim()) {
            field.precision = getDefaultPrecisionForType(field.dataType);
          }
          if (!String(field.scale || "").trim()) {
            field.scale = getDefaultScaleForType(field.dataType);
          }
        }
        precisionInput.value = field.precision;
        scaleInput.value = field.scale;
        syncTypeSelectByLength(dataTypeSelect, field.dataType, field.length, field.precision, field.scale);
        refreshFieldOnCard();
        return;
      }

      field.length = "";
      field.precision = "";
      field.scale = "";
      lengthInput.value = "";
      precisionInput.value = "";
      scaleInput.value = "";
      refreshFieldOnCard();
    });
    lengthInput.addEventListener("input", () => {
      field.length = lengthInput.value;
      syncTypeSelectByLength(dataTypeSelect, field.dataType, field.length, field.precision, field.scale);
      refreshFieldOnCard();
    });
    precisionInput.addEventListener("input", () => {
      field.precision = precisionInput.value;
      if (
        getLengthOptionalTypeMode(field.dataType) === "double" &&
        !String(field.precision || "").trim() &&
        String(field.scale || "").trim()
      ) {
        field.precision = getDefaultPrecisionForType(field.dataType);
        precisionInput.value = field.precision;
      }
      syncTypeSelectByLength(dataTypeSelect, field.dataType, field.length, field.precision, field.scale);
      refreshFieldOnCard();
    });
    scaleInput.addEventListener("input", () => {
      field.scale = scaleInput.value;
      if (
        getLengthOptionalTypeMode(field.dataType) === "double" &&
        String(field.scale || "").trim() &&
        !String(field.precision || "").trim()
      ) {
        field.precision = getDefaultPrecisionForType(field.dataType);
        precisionInput.value = field.precision;
      }
      syncTypeSelectByLength(dataTypeSelect, field.dataType, field.length, field.precision, field.scale);
      refreshFieldOnCard();
    });
    pkCheckbox.addEventListener("change", () => {
      field.primaryKey = pkCheckbox.checked;
      if (field.primaryKey) field.notNull = true;
      nnCheckbox.checked = field.notNull;
      nnCheckbox.disabled = field.primaryKey;
      refreshFieldOnCard();
    });
    nnCheckbox.addEventListener("change", () => {
      if (field.primaryKey) {
        nnCheckbox.checked = true;
        return;
      }
      field.notNull = nnCheckbox.checked;
      refreshFieldOnCard();
    });
    aiCheckbox.addEventListener("change", () => {
      field.autoIncrement = aiCheckbox.checked;
      if (field.autoIncrement) field.notNull = true;
      nnCheckbox.checked = field.notNull;
      refreshFieldOnCard();
    });
    defaultInput.addEventListener("input", () => {
      field.defaultValue = defaultInput.value;
      save();
    });
    commentInput.addEventListener("input", () => {
      field.comment = commentInput.value;
      save();
    });
    if (moveUpFieldBtn) {
      moveUpFieldBtn.addEventListener("click", () => {
        moveField(index, index - 1);
      });
    }
    if (moveDownFieldBtn) {
      moveDownFieldBtn.addEventListener("click", () => {
        moveField(index, index + 1);
      });
    }
    deleteFieldBtn.addEventListener("click", () => {
      if (table.fields.length === 1) {
        alert(t("fields.keepOne"));
        return;
      }
      selectedSet.delete(field.id);
      table.fields = table.fields.filter((item) => item.id !== field.id);
      table.indexes = table.indexes
        .map((indexItem) => ({
          ...indexItem,
          columns: (indexItem.columns || []).filter((fieldId) => fieldId !== field.id),
        }))
        .filter((indexItem) => (indexItem.columns || []).length > 0);
      syncPrimaryClusteredIndex(table);
      syncTableRelationsForeignKeys(model, table.id, false);
      save();
      renderInspector();
      renderWorkspace();
    });

    fieldGridBody.appendChild(row);
  });
  updateFieldSelectionUi();
}

function renderIndexesTab(panel, table) {
  const snapshot = JSON.stringify(table.indexes || []);
  syncPrimaryClusteredIndex(table);
  if (snapshot !== JSON.stringify(table.indexes || [])) {
    save();
  }
  const primaryIndex = (table.indexes || []).find((indexItem) => indexItem.isPrimary);
  const editableIndexes = (table.indexes || []).filter((indexItem) => !indexItem.isPrimary);

  panel.innerHTML = `
    <p class="helper">${escapeHtml(t("indexes.pkHelper"))}</p>
    <button type="button" id="addIndexBtn">${escapeHtml(t("indexes.addIndex"))}</button>
    <div id="primaryIndexEditor"></div>
    <div id="indexEditors"></div>
  `;

  const addIndexBtn = panel.querySelector("#addIndexBtn");
  const primaryIndexEditor = panel.querySelector("#primaryIndexEditor");
  const indexEditors = panel.querySelector("#indexEditors");

  if (primaryIndex) {
    const primaryColumns = (primaryIndex.columns || [])
      .map((fieldId) => table.fields.find((field) => field.id === fieldId))
      .filter(Boolean)
      .map((field) => `${field.code} (${field.name})`)
      .join(", ");
    primaryIndexEditor.innerHTML = `
      <div class="index-editor index-editor-system">
        <div class="field-editor-head compact">
          <h4>${escapeHtml(t("indexes.pkTitle"))}</h4>
        </div>
        <div class="index-system-kv"><strong>${escapeHtml(t("indexes.name"))}</strong><span>${escapeHtml(primaryIndex.name)}</span></div>
        <div class="index-system-kv"><strong>${escapeHtml(t("indexes.type"))}</strong><span>PRIMARY / UNIQUE / CLUSTERED</span></div>
        <div class="index-system-kv"><strong>${escapeHtml(t("indexes.columns"))}</strong><span>${escapeHtml(primaryColumns || "-")}</span></div>
      </div>
    `;
  }

  if (editableIndexes.length === 0) {
    indexEditors.innerHTML = `<p class="helper">${escapeHtml(t("indexes.noIndex"))}</p>`;
  }

  editableIndexes.forEach((indexItem) => {
    const options = table.fields
      .map((field) => {
        const selected = (indexItem.columns || []).includes(field.id) ? "selected" : "";
        return `<option value="${escapeHtml(field.id)}" ${selected}>${escapeHtml(field.code)} (${escapeHtml(field.name)})</option>`;
      })
      .join("");

    const card = document.createElement("div");
    card.className = "index-editor";
    card.innerHTML = `
      <div class="field-editor-head">
        <h4>${escapeHtml(t("indexes.title"))}</h4>
        <button type="button" class="danger ghost" data-role="delete-index">${escapeHtml(t("indexes.delete"))}</button>
      </div>
      <div class="field-row">
        <label>
          ${escapeHtml(t("indexes.indexName"))}
          <input data-role="index-name" />
        </label>
        <label>
          ${escapeHtml(t("indexes.indexMethod"))}
          <select data-role="index-method">
            <option value="btree">btree</option>
            <option value="hash">hash</option>
          </select>
        </label>
      </div>
      <div class="field-flags">
        <label class="inline-check"><input type="checkbox" data-role="index-unique" /> ${escapeHtml(t("indexes.unique"))}</label>
        <label class="inline-check"><input type="checkbox" data-role="index-clustered" /> ${escapeHtml(t("indexes.clustered"))}</label>
      </div>
      <label>
        ${escapeHtml(t("indexes.indexFields"))}
        <select data-role="index-columns" multiple size="6">${options}</select>
      </label>
    `;

    const indexNameInput = card.querySelector('[data-role="index-name"]');
    const indexMethodSelect = card.querySelector('[data-role="index-method"]');
    const indexUniqueCheckbox = card.querySelector('[data-role="index-unique"]');
    const indexClusteredCheckbox = card.querySelector('[data-role="index-clustered"]');
    const indexColumnsSelect = card.querySelector('[data-role="index-columns"]');
    const deleteIndexBtn = card.querySelector('[data-role="delete-index"]');

    indexNameInput.value = indexItem.name || "";
    indexMethodSelect.value = (indexItem.method || "btree").toLowerCase();
    indexUniqueCheckbox.checked = Boolean(indexItem.unique);
    indexClusteredCheckbox.checked = Boolean(indexItem.clustered);

    indexNameInput.addEventListener("input", () => {
      indexItem.name = indexNameInput.value;
      save();
    });
    indexMethodSelect.addEventListener("change", () => {
      indexItem.method = indexMethodSelect.value;
      save();
    });
    indexUniqueCheckbox.addEventListener("change", () => {
      indexItem.unique = indexUniqueCheckbox.checked;
      save();
    });
    indexClusteredCheckbox.addEventListener("change", () => {
      indexItem.clustered = indexClusteredCheckbox.checked;
      save();
    });
    indexColumnsSelect.addEventListener("change", () => {
      const selected = Array.from(indexColumnsSelect.selectedOptions).map((option) => option.value);
      if (selected.length === 0) {
        alert(t("indexes.needOneField"));
        Array.from(indexColumnsSelect.options).forEach((option) => {
          option.selected = (indexItem.columns || []).includes(option.value);
        });
        return;
      }
      indexItem.columns = selected;
      save();
    });
    deleteIndexBtn.addEventListener("click", () => {
      table.indexes = table.indexes.filter((item) => item.id !== indexItem.id);
      save();
      renderInspector();
    });

    indexEditors.appendChild(card);
  });

  addIndexBtn.addEventListener("click", () => {
    if (table.fields.length === 0) {
      alert(t("indexes.needFieldBeforeCreate"));
      return;
    }
    const nextIndexNumber = table.indexes.filter((indexItem) => !indexItem.isPrimary).length + 1;
    table.indexes.push(createDefaultIndex(table, nextIndexNumber));
    save();
    renderInspector();
  });
}

function renderScriptTab(panel, model, table) {
  const sql = getTableScript(model, table);
  panel.innerHTML = `
    <div class="script-actions">
      <button type="button" id="copyScriptBtn">${escapeHtml(t("script.copy"))}</button>
      <span class="helper" id="copyScriptHint"></span>
    </div>
    <pre class="sql-preview">${escapeHtml(sql)}</pre>
  `;

  const copyScriptBtn = panel.querySelector("#copyScriptBtn");
  const copyScriptHint = panel.querySelector("#copyScriptHint");

  const fallbackCopy = () => {
    const textarea = document.createElement("textarea");
    textarea.value = sql;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    textarea.remove();
    return copied;
  };

  copyScriptBtn.addEventListener("click", async () => {
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(sql);
        copied = true;
      } else {
        copied = fallbackCopy();
      }
    } catch {
      copied = fallbackCopy();
    }

    if (copyScriptHint) {
      copyScriptHint.textContent = copied ? t("script.copied") : t("script.copyFailed");
    }
  });
}

function renderInspector() {
  const model = getActiveModel();
  let table = getSelectedTable();

  if (model && !table && Array.isArray(model.tables) && model.tables.length > 0) {
    state.selectedTableId = model.tables[0].id;
    table = model.tables[0];
    ensureTableRuntimeData(table);
    save();
  }

  if (!model || !table) {
    inspector.innerHTML = `<h2>${escapeHtml(t("inspector.panelTitle"))}</h2><p class="helper">${escapeHtml(t("inspector.panelHint"))}</p>`;
    return;
  }

  ensureTableRuntimeData(table);
  const validTabs = new Set(INSPECTOR_TABS.map((item) => item.key));
  if (!validTabs.has(activeInspectorTab)) {
    activeInspectorTab = "basic";
  }

  const tabButtons = INSPECTOR_TABS.map(
    (item) =>
      `<button type="button" class="inspector-tab ${activeInspectorTab === item.key ? "active" : ""}" data-tab="${item.key}">${escapeHtml(getInspectorTabLabel(item.key))}</button>`,
  ).join("");

  inspector.innerHTML = `
    <h2>${escapeHtml(t("inspector.tableProperty"))}</h2>
    <div class="inspector-tabs">${tabButtons}</div>
    <div id="inspectorTabPanel"></div>
  `;

  const tabPanel = inspector.querySelector("#inspectorTabPanel");
  inspector.querySelectorAll(".inspector-tab").forEach((button) => {
    button.addEventListener("click", () => {
      activeInspectorTab = button.dataset.tab || "basic";
      renderInspector();
    });
  });

  if (activeInspectorTab === "basic") {
    renderBasicTab(tabPanel, model, table);
    return;
  }
  if (activeInspectorTab === "fields") {
    renderFieldsTab(tabPanel, model, table);
    return;
  }
  if (activeInspectorTab === "indexes") {
    renderIndexesTab(tabPanel, table);
    return;
  }
  renderScriptTab(tabPanel, model, table);
}

function render() {
  renderModelList();
  updateToolbar();
  renderWorkspace();
  renderInspector();
}

async function handleMenuAction(action) {
  if (!action) return;
  if (action === "file-new-mysql8") {
    createNewModelWithDbType("MySQL 8");
    return;
  }
  if (action === "file-new-postgresql14") {
    createNewModelWithDbType("PostgreSQL 14");
    return;
  }
  if (action === "file-new-sqlite") {
    createNewModelWithDbType("SQLite");
    return;
  }
  if (action === "file-new-mssql") {
    createNewModelWithDbType("MSSQL");
    return;
  }
  if (action === "file-open") {
    await openModelFromWorkspace();
    return;
  }
  if (action === "file-save") {
    await saveActiveModelToWorkspace();
    return;
  }
  if (action === "file-sync-workspace") {
    const ready = await ensureWorkspaceConnectedFromUserAction();
    if (!ready) return;
    await syncActiveModelToWorkspace();
    return;
  }
  if (action === "file-save-as") {
    await saveActiveModelAsNewToWorkspace();
    return;
  }
  if (action === "file-close") {
    const model = getActiveModel();
    if (!model) {
      alert(t("alert.noModelClosable"));
      return;
    }
    await closeModelById(model.id);
    return;
  }
  if (action === "edit-undo") {
    undoEditHistory();
    return;
  }
  if (action === "edit-redo") {
    redoEditHistory();
    return;
  }
  if (action === "edit-clear-all") {
    await clearActiveModelAll();
    return;
  }
  if (action === "edit-cut") {
    cutSelectedEntity();
    return;
  }
  if (action === "edit-copy") {
    copySelectedEntity();
    return;
  }
  if (action === "edit-paste") {
    pasteClipboardEntity();
    return;
  }
  if (action === "edit-clone") {
    cloneSelectedEntity();
    return;
  }
  if (action === "edit-delete") {
    deleteSelectedEntity(true);
    return;
  }
  if (action === "model-template") {
    await editModelTableTemplate();
    return;
  }
  if (action === "model-delete") {
    const model = getActiveModel();
    if (!model) {
      alert(t("alert.noModelDeletable"));
      return;
    }
    await deleteModelById(model.id);
    return;
  }
  if (action === "model-add-table") {
    addTableToActiveModel();
    return;
  }
  if (action === "model-ai-table") {
    await buildTablesByAi();
    return;
  }
  if (action === "model-script-table") {
    await buildTablesByScript();
    return;
  }
  if (action === "model-syntax-check") {
    runActiveModelSyntaxCheck({
      showSuccessAlert: true,
      focusOnError: true,
    });
    return;
  }
  if (action === "model-auto-layout") {
    autoLayoutActiveModel();
    return;
  }
  if (action === "model-fit-view") {
    fitActiveModelToViewport();
    return;
  }
  if (action === "model-export-image") {
    await exportActiveModelImageToWorkspace();
    return;
  }
  if (action === "model-table") {
    await openTableListDialog();
    return;
  }
  if (action === "model-export-sql") {
    await exportActiveModelSqlToWorkspace();
    return;
  }
  if (action === "settings-workspace") {
    if (canUseServerWorkspaceBridge()) {
      await switchProjectWorkspace();
    } else {
      await setWorkspaceDirectory();
    }
    return;
  }
  if (action === "settings-workspace-path") {
    if (canUseServerWorkspaceBridge()) {
      await switchProjectWorkspace();
      return;
    }
    editWorkspacePathHint();
    return;
  }
  if (action === "settings-table-view") {
    await configureTableCardViewMode();
    return;
  }
  if (action === "settings-ai-config") {
    const result = await openAiConfigDialog();
    if (result === "saved") {
      alert(t("alert.aiSavedConfig"));
    } else if (result === "cleared") {
      alert(t("alert.aiKeyCleared"));
    }
    return;
  }
  if (action === "help-codex") {
    await openCodexHandoffDialog();
    return;
  }
  if (action === "help-help") {
    await openHelpDialog();
    return;
  }
  if (action === "help-about") {
    await openAboutDialog();
  }
}

function closeAllMenus() {
  document.querySelectorAll(".menu-item.open").forEach((item) => {
    item.classList.remove("open");
  });
}

function toggleMenuItem(item) {
  if (!item) return;
  const willOpen = !item.classList.contains("open");
  closeAllMenus();
  if (willOpen) {
    item.classList.add("open");
  }
}

const MENU_SHORTCUTS = [
  { action: "file-new-mysql8", key: "1", ctrlOrMeta: true, alt: true, shift: false },
  { action: "file-new-postgresql14", key: "2", ctrlOrMeta: true, alt: true, shift: false },
  { action: "file-new-sqlite", key: "3", ctrlOrMeta: true, alt: true, shift: false },
  { action: "file-new-mssql", key: "4", ctrlOrMeta: true, alt: true, shift: false },
  { action: "file-open", key: "o", ctrlOrMeta: true, alt: false, shift: false },
  { action: "file-save", key: "s", ctrlOrMeta: true, alt: false, shift: false },
  { action: "file-sync-workspace", key: "s", ctrlOrMeta: true, alt: true, shift: false },
  { action: "file-save-as", key: "s", ctrlOrMeta: true, alt: false, shift: true },
  { action: "file-close", key: "w", ctrlOrMeta: true, alt: true, shift: false },
  { action: "edit-undo", key: "z", ctrlOrMeta: true, alt: false, shift: false },
  { action: "edit-redo", key: "y", ctrlOrMeta: true, alt: false, shift: false },
  { action: "edit-redo", key: "z", ctrlOrMeta: true, alt: false, shift: true },
  { action: "edit-clear-all", key: "delete", ctrlOrMeta: true, alt: false, shift: true },
  { action: "edit-cut", key: "x", ctrlOrMeta: true, alt: false, shift: false },
  { action: "edit-copy", key: "c", ctrlOrMeta: true, alt: false, shift: false },
  { action: "edit-paste", key: "v", ctrlOrMeta: true, alt: false, shift: false },
  { action: "edit-clone", key: "d", ctrlOrMeta: true, alt: false, shift: false },
  { action: "edit-delete", key: "delete", ctrlOrMeta: false, alt: false, shift: false },
  { action: "model-template", key: "t", ctrlOrMeta: false, alt: true, shift: false },
  { action: "model-delete", key: "d", ctrlOrMeta: false, alt: true, shift: true },
  { action: "model-add-table", key: "a", ctrlOrMeta: false, alt: true, shift: false },
  { action: "model-ai-table", key: "l", ctrlOrMeta: false, alt: true, shift: false },
  { action: "model-script-table", key: "j", ctrlOrMeta: false, alt: true, shift: false },
  { action: "model-syntax-check", key: "q", ctrlOrMeta: false, alt: true, shift: false },
  { action: "model-auto-layout", key: "r", ctrlOrMeta: false, alt: true, shift: false },
  { action: "model-fit-view", key: "0", ctrlOrMeta: true, alt: false, shift: false },
  { action: "model-export-image", key: "p", ctrlOrMeta: true, alt: true, shift: false },
  { action: "model-export-sql", key: "e", ctrlOrMeta: true, alt: true, shift: false },
  { action: "model-table", key: "b", ctrlOrMeta: false, alt: true, shift: false },
  { action: "settings-workspace", key: "w", ctrlOrMeta: false, alt: true, shift: false },
  { action: "settings-table-view", key: "h", ctrlOrMeta: false, alt: true, shift: false },
  { action: "settings-ai-config", key: "k", ctrlOrMeta: false, alt: true, shift: false },
  { action: "help-codex", key: "c", ctrlOrMeta: true, alt: true, shift: false },
  { action: "help-help", key: "f1", ctrlOrMeta: false, alt: false, shift: false },
  { action: "help-about", key: "f1", ctrlOrMeta: false, alt: false, shift: true },
];

const SHORTCUT_ALLOWED_WHEN_EDITING = new Set(["file-save", "file-sync-workspace", "file-save-as"]);

function isEditableShortcutTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));
}

function findShortcutAction(event) {
  const key = String(event.key || "").toLowerCase();
  const ctrlOrMeta = Boolean(event.ctrlKey || event.metaKey);
  return (
    MENU_SHORTCUTS.find(
      (item) =>
        item.key === key &&
        Boolean(item.ctrlOrMeta) === ctrlOrMeta &&
        Boolean(item.alt) === Boolean(event.altKey) &&
        Boolean(item.shift) === Boolean(event.shiftKey),
    ) || null
  );
}

if (menuBar) {
  menuBar.addEventListener("click", async (event) => {
    const triggerBtn = event.target.closest(".menu-trigger");
    if (triggerBtn && menuBar.contains(triggerBtn)) {
      event.preventDefault();
      event.stopPropagation();
      const menuItem = triggerBtn.closest(".menu-item");
      toggleMenuItem(menuItem);
      return;
    }

    const actionBtn = event.target.closest("[data-menu-action]");
    if (!actionBtn || !menuBar.contains(actionBtn)) return;
    event.preventDefault();
    event.stopPropagation();
    closeAllMenus();
    const action = actionBtn.getAttribute("data-menu-action");
    await handleMenuAction(action || "");
  });

  document.addEventListener("click", (event) => {
    if (!menuBar.contains(event.target) && !(toolbarQuickActions && toolbarQuickActions.contains(event.target))) {
      closeAllMenus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllMenus();
    }
  });
}

if (toolbarQuickActions) {
  toolbarQuickActions.addEventListener("click", async (event) => {
    const triggerBtn = event.target.closest(".menu-trigger");
    if (triggerBtn && toolbarQuickActions.contains(triggerBtn)) {
      event.preventDefault();
      event.stopPropagation();
      const menuItem = triggerBtn.closest(".menu-item");
      toggleMenuItem(menuItem);
      return;
    }

    const actionBtn = event.target.closest("[data-menu-action]");
    if (!actionBtn || !toolbarQuickActions.contains(actionBtn)) return;
    event.preventDefault();
    event.stopPropagation();
    closeAllMenus();
    await handleMenuAction(actionBtn.getAttribute("data-menu-action") || "");
  });
}

document.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if (document.querySelector(".app-dialog-backdrop")) return;
  const shortcut = findShortcutAction(event);
  if (!shortcut) return;
  if (
    isEditableShortcutTarget(event.target) &&
    !SHORTCUT_ALLOWED_WHEN_EDITING.has(shortcut.action)
  ) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  closeAllMenus();
  handleMenuAction(shortcut.action);
});

modelForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = modelNameInput.value.trim() || `Model${state.models.length + 1}`;
  const dbType = dbTypeSelect.value;
  createNewModelWithDbType(dbType, name);
  modelNameInput.value = "";
});

if (setWorkspaceBtn) {
  setWorkspaceBtn.addEventListener("click", async () => {
    if (canUseServerWorkspaceBridge()) {
      await switchProjectWorkspace();
    } else {
      await setWorkspaceDirectory();
    }
  });
}

if (topWorkspaceBtn) {
  topWorkspaceBtn.addEventListener("click", async () => {
    await setWorkspaceDirectory();
  });
}

if (saveModelBtn) {
  saveModelBtn.addEventListener("click", async () => {
    await saveActiveModelToWorkspace();
  });
}

if (syncModelBtn) {
  syncModelBtn.addEventListener("click", async () => {
    const ready = await ensureWorkspaceConnectedFromUserAction();
    if (!ready) return;
    await syncActiveModelToWorkspace();
  });
}

if (exportSqlBtn) {
  exportSqlBtn.addEventListener("click", async () => {
    await exportActiveModelSqlToWorkspace();
  });
}

if (openModelBtn) {
  openModelBtn.addEventListener("click", async () => {
    await openModelFromWorkspace();
  });
}

if (languageSelect) {
  languageSelect.addEventListener("change", () => {
    setLanguage(languageSelect.value, true);
    render();
  });
}

if (workspaceGuideDismissBtn) {
  workspaceGuideDismissBtn.addEventListener("click", () => {
    dismissWorkspaceGuide();
    updateWorkspaceGuide();
  });
}

addTableButton.addEventListener("click", () => {
  addTableToActiveModel();
});

if (workspace) {
  workspace.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    if (event.target.closest(".table-card")) return;
    if (event.target.closest(".zoom-controls")) return;
    if (state.selectedRelationId) {
      state.selectedRelationId = null;
      save();
      drawRelations();
    }

    panState.active = true;
    panState.startX = event.clientX;
    panState.startY = event.clientY;
    panState.startViewX = workspaceViewX;
    panState.startViewY = workspaceViewY;

    workspace.classList.add("panning");
    document.body.classList.add("no-select");
    event.preventDefault();
  });

  workspace.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const delta = event.deltaY < 0 ? 0.1 : -0.1;
      applyWorkspaceZoom(workspaceZoom + delta, event.clientX, event.clientY);
    },
    { passive: false },
  );
}

if (zoomOutBtn) {
  zoomOutBtn.addEventListener("click", () => {
    applyWorkspaceZoom(workspaceZoom - 0.1);
  });
}
if (zoomInBtn) {
  zoomInBtn.addEventListener("click", () => {
    applyWorkspaceZoom(workspaceZoom + 0.1);
  });
}
if (zoomResetBtn) {
  zoomResetBtn.addEventListener("click", () => {
    applyWorkspaceZoom(1);
  });
}
if (zoomFitBtn) {
  zoomFitBtn.addEventListener("click", () => {
    fitActiveModelToViewport();
  });
}

document.addEventListener("mousemove", (event) => {
  if (relationDraft) {
    updateRelationDraft(event.clientX, event.clientY);
    return;
  }

  if (drag) {
    const model = getActiveModel();
    if (!model) return;

    const table = model.tables.find((t) => t.id === drag.tableId);
    if (!table) return;

    const point = getWorkspacePoint(event.clientX, event.clientY);
    table.x = point.x - drag.offsetX;
    table.y = point.y - drag.offsetY;

    const card = document.querySelector(`[data-table-id="${table.id}"]`);
    if (card) {
      card.style.left = `${table.x}px`;
      card.style.top = `${table.y}px`;
    }
    drawRelations();
    return;
  }

  if (!panState.active || !workspace) return;
  const dx = event.clientX - panState.startX;
  const dy = event.clientY - panState.startY;
  workspaceViewX = panState.startViewX - dx / workspaceZoom;
  workspaceViewY = panState.startViewY - dy / workspaceZoom;
  syncWorkspaceScale();
});

document.addEventListener("mouseup", () => {
  if (finishRelationDraft()) {
    return;
  }

  if (drag) {
    drag = null;
    save();
  }

  if (panState.active) {
    panState.active = false;
    if (workspace) {
      workspace.classList.remove("panning");
    }
    document.body.classList.remove("no-select");
  }
});

window.addEventListener("resize", () => {
  syncWorkspaceScale();
  drawRelations();
});

if (sidebarResizer) {
  sidebarResizer.addEventListener("mousedown", (event) => {
    event.preventDefault();
    sidebarResizeState.resizing = true;
    sidebarResizeState.startX = event.clientX;
    sidebarResizeState.startWidth = getAppliedSidebarWidth();
    document.body.style.cursor = "ew-resize";
    document.body.classList.add("no-select");
  });

  document.addEventListener("mousemove", (event) => {
    if (!sidebarResizeState.resizing) return;
    const delta = event.clientX - sidebarResizeState.startX;
    const maxWidth = Math.max(SIDEBAR_MIN_WIDTH, window.innerWidth - 420);
    const rawWidth = sidebarResizeState.startWidth + delta;
    let nextWidth = Math.max(0, Math.min(maxWidth, rawWidth));
    if (nextWidth <= SIDEBAR_HIDE_THRESHOLD) {
      nextWidth = 0;
    } else {
      nextWidth = Math.max(SIDEBAR_MIN_WIDTH, nextWidth);
    }
    applySidebarWidth(nextWidth);
  });

  document.addEventListener("mouseup", () => {
    if (!sidebarResizeState.resizing) return;
    sidebarResizeState.resizing = false;
    document.body.style.cursor = "";
    document.body.classList.remove("no-select");
    const width = getAppliedSidebarWidth();
    persistSidebarState(width, width <= 0);
    drawRelations();
  });

  sidebarResizer.addEventListener("dblclick", () => {
    const collapsed = Boolean(appShell && appShell.classList.contains("sidebar-collapsed"));
    setSidebarCollapsed(!collapsed, true);
    drawRelations();
  });
}

// Resizer: 拖拽调整右侧 inspector 宽度
if (inspectorResizer) {
  inspectorResizer.addEventListener("mousedown", (event) => {
    event.preventDefault();
    inspectorResizeState.resizing = true;
    inspectorResizeState.startX = event.clientX;
    inspectorResizeState.startWidth = getAppliedInspectorWidth();
    document.body.style.cursor = "ew-resize";
    document.body.classList.add("no-select");
  });

  document.addEventListener("mousemove", (event) => {
    if (!inspectorResizeState.resizing) return;
    const delta = event.clientX - inspectorResizeState.startX;
    const maxWidth = Math.max(INSPECTOR_MIN_WIDTH, window.innerWidth - 320);
    const rawWidth = inspectorResizeState.startWidth - delta;
    let nextWidth = Math.max(0, Math.min(maxWidth, rawWidth));
    if (nextWidth <= INSPECTOR_HIDE_THRESHOLD) {
      nextWidth = 0;
    } else {
      nextWidth = Math.max(INSPECTOR_MIN_WIDTH, nextWidth);
    }
    applyInspectorWidth(nextWidth);
  });

  document.addEventListener("mouseup", () => {
    if (!inspectorResizeState.resizing) return;
    inspectorResizeState.resizing = false;
    document.body.style.cursor = "";
    document.body.classList.remove("no-select");
    const width = getAppliedInspectorWidth();
    persistInspectorState(width, width <= 0);
    drawRelations();
  });

  // 双击收缩/恢复
  inspectorResizer.addEventListener("dblclick", () => {
    const collapsed = Boolean(workspaceShell && workspaceShell.classList.contains("inspector-collapsed"));
    setInspectorCollapsed(!collapsed, true);
    drawRelations();
  });
}

// 隐藏/显示按钮
if (toggleInspectorBtn) {
  toggleInspectorBtn.addEventListener("click", () => {
    const collapsed = Boolean(workspaceShell && workspaceShell.classList.contains("inspector-collapsed"));
    setInspectorCollapsed(!collapsed, true);
    drawRelations();
    closeAllMenus();
  });
}

if (toggleSidebarBtn) {
  toggleSidebarBtn.addEventListener("click", () => {
    const collapsed = Boolean(appShell && appShell.classList.contains("sidebar-collapsed"));
    setSidebarCollapsed(!collapsed, true);
    drawRelations();
    closeAllMenus();
  });
}

if (topToggleBtn) {
  topToggleBtn.addEventListener("click", () => {
    const collapsed = Boolean(appShell && appShell.classList.contains("top-collapsed"));
    setTopCollapsed(!collapsed, true);
    syncWorkspaceScale();
    drawRelations();
    requestAnimationFrame(() => {
      syncWorkspaceScale();
      drawRelations();
    });
  });
}

initializeTopLayout();
initializeSidebarLayout();
initializeInspectorLayout();
initializeModelAutoRefresh();
setLanguage(currentLanguage, false);
syncWorkspaceScale();
(async () => {
  await restoreWorkspaceDirectory();
  await applyLaunchWorkspaceContext();
  await refreshActiveModelFromWorkspaceOnLaunch();
  render();
  initializeEditHistory();
})();


