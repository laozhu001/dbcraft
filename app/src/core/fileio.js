(function attachFileIO(globalObj) {
  const root = globalObj.DBDesignerCore || (globalObj.DBDesignerCore = {});

  const DB_NAME = "dbdesigner.fsmeta";
  const DB_VERSION = 1;
  const STORE_NAME = "kv";
  const WORKSPACE_KEY = "workspaceDirHandle";
  const WORKSPACE_INFO_KEY = "dbdesigner.workspace.info.v1";

  function supportsWorkspaceFS() {
    return typeof window.showDirectoryPicker === "function" && typeof indexedDB !== "undefined";
  }

  function openMetaDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
    });
  }

  function readStoreValue(db, key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Read workspace failed"));
    });
  }

  function writeStoreValue(db, key, value) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error("Save workspace failed"));
    });
  }

  async function readWorkspaceDirectoryHandle() {
    if (!supportsWorkspaceFS()) return null;
    const db = await openMetaDb();
    return readStoreValue(db, WORKSPACE_KEY);
  }

  async function saveWorkspaceDirectoryHandle(handle) {
    if (!supportsWorkspaceFS()) return;
    const db = await openMetaDb();
    await writeStoreValue(db, WORKSPACE_KEY, handle || null);
    const currentInfo = readWorkspaceInfo();
    if (handle && typeof handle.name === "string") {
      localStorage.setItem(
        WORKSPACE_INFO_KEY,
        JSON.stringify({
          name: handle.name,
          pathHint: typeof currentInfo?.pathHint === "string" ? currentInfo.pathHint : "",
        }),
      );
    } else {
      localStorage.removeItem(WORKSPACE_INFO_KEY);
    }
  }

  function saveWorkspaceInfo(info) {
    const safeInfo = {
      name: typeof info?.name === "string" ? info.name : "",
      pathHint: typeof info?.pathHint === "string" ? info.pathHint : "",
    };
    localStorage.setItem(WORKSPACE_INFO_KEY, JSON.stringify(safeInfo));
  }

  function readWorkspaceInfo() {
    const raw = localStorage.getItem(WORKSPACE_INFO_KEY);
    if (!raw) return { name: "", pathHint: "" };
    try {
      const parsed = JSON.parse(raw);
      return {
        name: typeof parsed?.name === "string" ? parsed.name : "",
        pathHint: typeof parsed?.pathHint === "string" ? parsed.pathHint : "",
      };
    } catch {
      return { name: "", pathHint: "" };
    }
  }

  async function ensureDirectoryPermission(directoryHandle, needWrite = true, requestIfNeeded = true) {
    if (!directoryHandle) return false;
    if (typeof directoryHandle.queryPermission !== "function") return false;

    const mode = needWrite ? "readwrite" : "read";
    let permission = await directoryHandle.queryPermission({ mode });
    if (permission === "granted") return true;

    if (!requestIfNeeded) return false;
    permission = await directoryHandle.requestPermission({ mode });
    return permission === "granted";
  }

  async function pickWorkspaceDirectory() {
    if (!supportsWorkspaceFS()) {
      throw new Error("Workspace directory API is not supported");
    }
    const directoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    await saveWorkspaceDirectoryHandle(directoryHandle);
    return directoryHandle;
  }

  async function listWorkspaceModelFiles(directoryHandle) {
    const names = [];
    for await (const [name, handle] of directoryHandle.entries()) {
      if (handle.kind !== "file") continue;
      if (!name.toLowerCase().endsWith(".dbmodel.json")) continue;
      names.push(name);
    }
    names.sort((a, b) => a.localeCompare(b));
    return names;
  }

  async function writeModelFile(directoryHandle, fileName, contentObject) {
    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(contentObject, null, 2));
    await writable.close();
  }

  async function readModelFile(directoryHandle, fileName) {
    const fileHandle = await directoryHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return file.text();
  }

  async function deleteModelFile(directoryHandle, fileName) {
    await directoryHandle.removeEntry(fileName);
  }

  Object.assign(root, {
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
  });
})(window);
