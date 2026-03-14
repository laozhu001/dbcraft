(function attachModel(globalObj) {
  const root = globalObj.DBDesignerCore || (globalObj.DBDesignerCore = {});
  const { DEFAULT_DB_TYPE } = root;
  const { getFieldTypesByDbType, isSupportedDbType, uid } = root;
  const LENGTH_COMPATIBLE_TYPES = new Set(["char", "varchar", "nvarchar"]);
  const PRECISION_COMPATIBLE_TYPES = new Set(["decimal", "numeric"]);

  const TYPE_CANONICAL_BY_ALIAS = {
    bigint: "int64",
    int: "int32",
    integer: "int32",
    smallint: "int16",
    tinyint: "int8",
    decimal: "decimal",
    numeric: "decimal",
    double: "double",
    "double precision": "double",
    float: "float",
    real: "float",
    char: "char",
    varchar: "varchar",
    nvarchar: "varchar",
    text: "text",
    longtext: "text",
    blob: "blob",
    date: "date",
    datetime: "datetime",
    timestamp: "datetime",
    timestamptz: "datetime",
    json: "json",
    jsonb: "json",
    boolean: "boolean",
    bit: "boolean",
    bool: "boolean",
    uuid: "uuid",
    uniqueidentifier: "uuid",
  };

  const DB_CANONICAL_TO_TYPE = {
    "MySQL 8": {
      int64: "bigint",
      int32: "int",
      int16: "smallint",
      int8: "tinyint",
      decimal: "decimal",
      double: "double",
      float: "float",
      char: "char",
      varchar: "varchar",
      text: "text",
      blob: "longtext",
      date: "date",
      datetime: "datetime",
      json: "json",
      boolean: "boolean",
      uuid: "varchar",
    },
    "PostgreSQL 14": {
      int64: "bigint",
      int32: "integer",
      int16: "smallint",
      int8: "smallint",
      decimal: "numeric",
      double: "double precision",
      float: "real",
      char: "char",
      varchar: "varchar",
      text: "text",
      blob: "text",
      date: "date",
      datetime: "timestamp",
      json: "jsonb",
      boolean: "boolean",
      uuid: "uuid",
    },
    SQLite: {
      int64: "integer",
      int32: "integer",
      int16: "integer",
      int8: "integer",
      decimal: "numeric",
      double: "real",
      float: "real",
      char: "char",
      varchar: "varchar",
      text: "text",
      blob: "blob",
      date: "date",
      datetime: "datetime",
      json: "json",
      boolean: "boolean",
      uuid: "text",
    },
    MSSQL: {
      int64: "bigint",
      int32: "int",
      int16: "smallint",
      int8: "tinyint",
      decimal: "decimal",
      double: "float",
      float: "real",
      char: "char",
      varchar: "varchar",
      text: "text",
      blob: "text",
      date: "date",
      datetime: "datetime",
      json: "json",
      boolean: "bit",
      uuid: "uniqueidentifier",
    },
  };

  function normalizeTypeKey(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getTypeOptionByKey(dbType, typeKey) {
    const options = getFieldTypesByDbType(dbType);
    return options.find((item) => normalizeTypeKey(item) === typeKey) || "";
  }

  function mapFieldTypeToDbType(fieldType, dbType) {
    const safeDbType = isSupportedDbType(dbType) ? dbType : DEFAULT_DB_TYPE;
    const typeKey = normalizeTypeKey(fieldType);
    if (typeKey) {
      const exact = getTypeOptionByKey(safeDbType, typeKey);
      if (exact) return exact;
    }

    const canonical = TYPE_CANONICAL_BY_ALIAS[typeKey] || "varchar";
    const mapped = DB_CANONICAL_TO_TYPE[safeDbType]?.[canonical];
    if (mapped) {
      const option = getTypeOptionByKey(safeDbType, normalizeTypeKey(mapped));
      if (option) return option;
    }

    return getFieldTypesByDbType(safeDbType)[8] || "varchar";
  }

  function createDefaultField(index, dbType = DEFAULT_DB_TYPE) {
    const name = `Field${index}`;
    return {
      id: uid("field"),
      name,
      code: name,
      dataType: getFieldTypesByDbType(dbType)[8] || "varchar",
      length: "50",
      precision: "",
      scale: "",
      primaryKey: false,
      notNull: false,
      autoIncrement: false,
      defaultValue: "",
      comment: name,
    };
  }

  function normalizeFieldTemplate(template, index, dbType = DEFAULT_DB_TYPE) {
    const fallback = createDefaultField(index, dbType);
    const dataType = mapFieldTypeToDbType(template?.dataType || fallback.dataType, dbType);
    const normalized = {
      name: typeof template?.name === "string" && template.name.trim() ? template.name : fallback.name,
      code: typeof template?.code === "string" && template.code.trim() ? template.code : fallback.code,
      dataType,
      length: typeof template?.length === "string" ? template.length : fallback.length,
      precision: typeof template?.precision === "string" ? template.precision : fallback.precision,
      scale: typeof template?.scale === "string" ? template.scale : fallback.scale,
      primaryKey: Boolean(template?.primaryKey),
      notNull: Boolean(template?.notNull),
      autoIncrement: Boolean(template?.autoIncrement),
      defaultValue: typeof template?.defaultValue === "string" ? template.defaultValue : fallback.defaultValue,
      comment: typeof template?.comment === "string" ? template.comment : fallback.comment,
    };
    if (normalized.primaryKey) {
      normalized.notNull = true;
    }
    const typeKey = normalizeTypeKey(normalized.dataType);
    if (PRECISION_COMPATIBLE_TYPES.has(typeKey)) {
      normalized.length = "";
      return normalized;
    }
    if (LENGTH_COMPATIBLE_TYPES.has(typeKey)) {
      normalized.precision = "";
      normalized.scale = "";
      return normalized;
    }
    normalized.length = "";
    normalized.precision = "";
    normalized.scale = "";
    return normalized;
  }

  function convertTemplateFieldsToDbType(tableTemplate, dbType = DEFAULT_DB_TYPE) {
    const safeDbType = isSupportedDbType(dbType) ? dbType : DEFAULT_DB_TYPE;
    const templates = Array.isArray(tableTemplate) && tableTemplate.length > 0
      ? tableTemplate
      : [normalizeFieldTemplate({}, 1, safeDbType)];
    return templates.map((template, index) => normalizeFieldTemplate(template, index + 1, safeDbType));
  }

  function createFieldsFromTemplate(tableTemplate, dbType = DEFAULT_DB_TYPE) {
    const templates = Array.isArray(tableTemplate) && tableTemplate.length > 0
      ? convertTemplateFieldsToDbType(tableTemplate, dbType)
      : [normalizeFieldTemplate({}, 1, dbType)];
    return templates.map((template, index) => ({
      id: uid("field"),
      ...normalizeFieldTemplate(template, index + 1, dbType),
    }));
  }

  function createDefaultIndex(table, index) {
    return {
      id: uid("idx"),
      name: `idx_${table.code || table.name}_${index}`,
      unique: false,
      method: "btree",
      columns: table.fields.length > 0 ? [table.fields[0].id] : [],
      clustered: false,
      isPrimary: false,
    };
  }

  function createDefaultTable(index, dbType = DEFAULT_DB_TYPE, tableTemplate = null) {
    const name = `Table${index}`;
    return {
      id: uid("table"),
      name,
      code: name,
      comment: "",
      x: 80 + (index % 4) * 260,
      y: 80 + Math.floor((index - 1) / 4) * 220,
      fields: createFieldsFromTemplate(tableTemplate, dbType),
      indexes: [],
    };
  }

  function createModel(name, dbType) {
    const normalizedDbType = isSupportedDbType(dbType) ? dbType : DEFAULT_DB_TYPE;
    return {
      id: uid("model"),
      name,
      dbType: normalizedDbType,
      fileName: "",
      tableTemplate: [normalizeFieldTemplate({}, 1, normalizedDbType)],
      tables: [],
      relations: [],
    };
  }

  function getPrimaryIndexName(table) {
    return `pk_${table.code || table.name}`;
  }

  function syncPrimaryClusteredIndex(table) {
    const pkFieldIds = (table.fields || []).filter((field) => field.primaryKey).map((field) => field.id);
    const indexes = Array.isArray(table.indexes) ? table.indexes : [];
    const existingPrimary = indexes.find((indexItem) => indexItem.isPrimary);

    if (pkFieldIds.length === 0) {
      table.indexes = indexes.filter((indexItem) => !indexItem.isPrimary);
      return;
    }

    if (existingPrimary) {
      existingPrimary.name = getPrimaryIndexName(table);
      existingPrimary.unique = true;
      existingPrimary.method = "btree";
      existingPrimary.clustered = true;
      existingPrimary.columns = [...pkFieldIds];
      return;
    }

    table.indexes = [
      {
        id: uid("idx"),
        name: getPrimaryIndexName(table),
        unique: true,
        method: "btree",
        columns: [...pkFieldIds],
        clustered: true,
        isPrimary: true,
      },
      ...indexes,
    ];
  }

  function ensureTableRuntimeData(table) {
    if (!Array.isArray(table.fields) || table.fields.length === 0) {
      table.fields = [createDefaultField(1)];
    }
    if (!Array.isArray(table.indexes)) {
      table.indexes = [];
    }
    const validFieldIdSet = new Set(table.fields.map((field) => field.id));
    table.indexes = table.indexes
      .map((indexItem, index) => ({
        id: indexItem?.id || uid("idx"),
        name: indexItem?.name || `idx_${table.code || table.name}_${index + 1}`,
        unique: Boolean(indexItem?.unique),
        method: (indexItem?.method || "btree").toLowerCase(),
        columns: Array.isArray(indexItem?.columns)
          ? indexItem.columns.filter((fieldId) => validFieldIdSet.has(fieldId))
          : [],
        clustered: Boolean(indexItem?.clustered),
        isPrimary: Boolean(indexItem?.isPrimary),
      }))
      .filter((indexItem) => indexItem.isPrimary || indexItem.columns.length > 0);
    if (typeof table.comment !== "string") {
      table.comment = "";
    }
    syncPrimaryClusteredIndex(table);
  }

  function ensureModelRuntimeData(model) {
    if (!model || typeof model !== "object") return;
    if (!isSupportedDbType(model.dbType)) {
      model.dbType = DEFAULT_DB_TYPE;
    }
    if (!Array.isArray(model.tables)) {
      model.tables = [];
    }
    if (!Array.isArray(model.relations)) {
      model.relations = [];
    }
    if (typeof model.fileName !== "string") {
      model.fileName = "";
    }
    if (!Array.isArray(model.tableTemplate) || model.tableTemplate.length === 0) {
      model.tableTemplate = [normalizeFieldTemplate({}, 1, model.dbType)];
    } else {
      model.tableTemplate = model.tableTemplate.map((field, index) =>
        normalizeFieldTemplate(field, index + 1, model.dbType),
      );
    }

    model.tables.forEach((table, index) => {
      if (!table.id) table.id = uid("table");
      if (typeof table.name !== "string" || !table.name.trim()) {
        table.name = `Table${index + 1}`;
      }
      if (typeof table.code !== "string" || !table.code.trim()) {
        table.code = table.name;
      }
      if (!Number.isFinite(table.x)) {
        table.x = 80 + (index % 4) * 260;
      }
      if (!Number.isFinite(table.y)) {
        table.y = 80 + Math.floor(index / 4) * 220;
      }
      ensureTableRuntimeData(table);
    });

    const tableIdSet = new Set(model.tables.map((table) => table.id));
    const tableFieldIdSetMap = new Map(
      model.tables.map((table) => [table.id, new Set((table.fields || []).map((field) => field.id))]),
    );
    model.relations = model.relations
      .map((relation) => ({
        id: relation?.id || uid("rel"),
        name: typeof relation?.name === "string" ? relation.name : "",
        cardinality: relation?.cardinality || "1:N",
        sourceTableId: relation?.sourceTableId,
        targetTableId: relation?.targetTableId,
        foreignKey:
          relation?.foreignKey && typeof relation.foreignKey === "object"
            ? {
                name: typeof relation.foreignKey.name === "string" ? relation.foreignKey.name : "",
                fromTableId: relation.foreignKey.fromTableId,
                toTableId: relation.foreignKey.toTableId,
                fromFieldIds: Array.isArray(relation.foreignKey.fromFieldIds)
                  ? relation.foreignKey.fromFieldIds.filter((fieldId) => typeof fieldId === "string")
                  : [],
                toFieldIds: Array.isArray(relation.foreignKey.toFieldIds)
                  ? relation.foreignKey.toFieldIds.filter((fieldId) => typeof fieldId === "string")
                  : [],
              }
            : null,
      }))
      .filter((relation) => tableIdSet.has(relation.sourceTableId) && tableIdSet.has(relation.targetTableId))
      .map((relation) => {
        const fk = relation.foreignKey;
        if (!fk) return relation;
        if (!tableIdSet.has(fk.fromTableId) || !tableIdSet.has(fk.toTableId)) {
          relation.foreignKey = null;
          return relation;
        }
        const fromFieldSet = tableFieldIdSetMap.get(fk.fromTableId) || new Set();
        const toFieldSet = tableFieldIdSetMap.get(fk.toTableId) || new Set();
        const fromFieldIds = fk.fromFieldIds.filter((fieldId) => fromFieldSet.has(fieldId));
        const toFieldIds = fk.toFieldIds.filter((fieldId) => toFieldSet.has(fieldId));
        if (fromFieldIds.length === 0 || toFieldIds.length === 0 || fromFieldIds.length !== toFieldIds.length) {
          relation.foreignKey = null;
          return relation;
        }
        relation.foreignKey = {
          ...fk,
          fromFieldIds,
          toFieldIds,
        };
        return relation;
      });
  }

  function relationExists(model, sourceId, targetId) {
    return model.relations.some((relation) => relation.sourceTableId === sourceId && relation.targetTableId === targetId);
  }

  Object.assign(root, {
    createDefaultField,
    normalizeFieldTemplate,
    mapFieldTypeToDbType,
    convertTemplateFieldsToDbType,
    createFieldsFromTemplate,
    createDefaultIndex,
    createDefaultTable,
    createModel,
    getPrimaryIndexName,
    syncPrimaryClusteredIndex,
    ensureTableRuntimeData,
    ensureModelRuntimeData,
    relationExists,
  });
})(window);
