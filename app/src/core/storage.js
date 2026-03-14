(function attachStorage(globalObj) {
  const root = globalObj.DBDesignerCore || (globalObj.DBDesignerCore = {});
  const { DEFAULT_DB_TYPE, STORAGE_KEY, createModel, normalizeFieldTemplate } = root;

  function createInitialState() {
    const initialModel = createModel("Model1", DEFAULT_DB_TYPE);
    return {
      globalTableTemplate: [normalizeFieldTemplate({}, 1, DEFAULT_DB_TYPE)],
      models: [initialModel],
      activeModelId: initialModel.id,
      selectedTableId: null,
      selectedRelationId: null,
    };
  }

  function readState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialState();
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed?.models) || parsed.models.length === 0) {
        return createInitialState();
      }
      if (!Array.isArray(parsed.globalTableTemplate) || parsed.globalTableTemplate.length === 0) {
        parsed.globalTableTemplate = [normalizeFieldTemplate({}, 1, DEFAULT_DB_TYPE)];
      }
      return parsed;
    } catch {
      return createInitialState();
    }
  }

  function persistState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  Object.assign(root, {
    createInitialState,
    readState,
    persistState,
  });
})(window);
