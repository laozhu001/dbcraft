(function attachUtils(globalObj) {
  const root = globalObj.DBDesignerCore || (globalObj.DBDesignerCore = {});
  const { DB_FIELD_TYPES, DEFAULT_DB_TYPE, RELATION_CARDINALITIES } = root;

  function uid(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function isSupportedDbType(dbType) {
    return Object.prototype.hasOwnProperty.call(DB_FIELD_TYPES, dbType);
  }

  function getFieldTypesByDbType(dbType) {
    return DB_FIELD_TYPES[dbType] || DB_FIELD_TYPES[DEFAULT_DB_TYPE];
  }

  function normalizeRelationCardinality(cardinality) {
    if (RELATION_CARDINALITIES.some((item) => item.value === cardinality)) {
      return cardinality;
    }
    return "1:N";
  }

  function isManyToMany(cardinality) {
    return normalizeRelationCardinality(cardinality) === "N:N";
  }

  function buildRelationCardinalityOptions(selectedValue) {
    const normalized = normalizeRelationCardinality(selectedValue);
    return RELATION_CARDINALITIES.map(
      (item) =>
        `<option value="${item.value}" ${item.value === normalized ? "selected" : ""}>${item.label}</option>`,
    ).join("");
  }

  function formatFieldType(field) {
    const baseType = field.dataType || "varchar";
    const precision = (field.precision || "").trim();
    const scale = (field.scale || "").trim();
    const length = (field.length || "").trim();

    if (precision || scale) {
      if (precision && scale) return `${baseType}(${precision},${scale})`;
      if (precision) return `${baseType}(${precision})`;
      return baseType;
    }

    if (length) {
      return `${baseType}(${length})`;
    }

    return baseType;
  }

  function formatFieldFlags(field, dbType) {
    const flags = [];
    if (field.primaryKey) flags.push("PK");
    if (field.notNull) flags.push("NN");
    if (field.autoIncrement) flags.push(dbType === "PostgreSQL 14" ? "IDENTITY" : "AI");
    return flags.join(" ");
  }

  Object.assign(root, {
    uid,
    escapeHtml,
    isSupportedDbType,
    getFieldTypesByDbType,
    normalizeRelationCardinality,
    isManyToMany,
    buildRelationCardinalityOptions,
    formatFieldType,
    formatFieldFlags,
  });
})(window);
