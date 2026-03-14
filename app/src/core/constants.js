(function attachConstants(globalObj) {
  const root = globalObj.DBDesignerCore || (globalObj.DBDesignerCore = {});

  root.STORAGE_KEY = "dbdesigner.v2";
  root.DEFAULT_DB_TYPE = "MySQL 8";

  root.DB_FIELD_TYPES = {
    "MySQL 8": [
      "bigint",
      "int",
      "smallint",
      "tinyint",
      "decimal",
      "double",
      "float",
      "char",
      "varchar",
      "text",
      "longtext",
      "date",
      "datetime",
      "timestamp",
      "json",
      "boolean",
    ],
    "PostgreSQL 14": [
      "bigint",
      "integer",
      "smallint",
      "numeric",
      "real",
      "double precision",
      "char",
      "varchar",
      "text",
      "date",
      "timestamp",
      "timestamptz",
      "json",
      "jsonb",
      "boolean",
      "uuid",
    ],
    SQLite: [
      "integer",
      "real",
      "numeric",
      "text",
      "blob",
      "datetime",
      "date",
      "varchar",
      "char",
      "boolean",
      "json",
    ],
    MSSQL: [
      "bigint",
      "int",
      "smallint",
      "tinyint",
      "decimal",
      "numeric",
      "float",
      "real",
      "char",
      "varchar",
      "nvarchar",
      "text",
      "datetime",
      "date",
      "bit",
      "uniqueidentifier",
      "json",
    ],
  };

  root.RELATION_CARDINALITIES = [
    { value: "1:N", label: "1对多 (1:N)" },
    { value: "N:1", label: "多对1 (N:1)" },
    { value: "N:N", label: "多对多 (N:N, 需中间表)" },
  ];

  root.INSPECTOR_TABS = [
    { key: "basic", label: "基本信息" },
    { key: "fields", label: "字段信息" },
    { key: "indexes", label: "索引" },
    { key: "script", label: "建表脚本预览" },
  ];
})(window);
