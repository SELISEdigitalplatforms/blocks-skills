export const PERMISSION_ACTIONS = [
  { id: "view", label: "View", value: "view" },
  { id: "create", label: "Create", value: "create" },
  { id: "edit", label: "Edit", value: "edit" },
  { id: "delete", label: "Delete", value: "delete" },
];

export const ACCESS_TYPES = {
  LOGGED_IN: "logged-in",
  PUBLIC: "public",
  CUSTOM: "custom",
  INHERITED: "inherited",
};

export const ACCESS_STYLES = {
  [ACCESS_TYPES.LOGGED_IN]:
    "mt-4 rounded-[4px] border border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-200 dark:bg-neutral-200/20",
  [ACCESS_TYPES.PUBLIC]:
    "mt-4 rounded-md border border-base-warning bg-warning-100 p-4 dark:border-icon-warning dark:bg-warning-800/20",
  [ACCESS_TYPES.CUSTOM]:
    "mt-4 rounded-[4px] border border-success bg-success/10 p-4 dark:bg-success/20",
  [ACCESS_TYPES.INHERITED]:
    "mt-4 rounded-[4px] border border-blue-300 bg-blue-50 p-4 dark:border-blue-500 dark:bg-blue-900/20",
};

export const ACCESS_LABELS = {
  [ACCESS_TYPES.LOGGED_IN]: "All logged in users have access",
  [ACCESS_TYPES.PUBLIC]: "API is public",
  [ACCESS_TYPES.CUSTOM]: "Custom Permissions",
  [ACCESS_TYPES.INHERITED]: "Inherited from schema",
};

export const ACCESS_DESCRIPTIONS = {
  [ACCESS_TYPES.LOGGED_IN]:
    "All authenticated users can view records from this collection with no restrictions.",
  [ACCESS_TYPES.PUBLIC]: "Anyone can view this API with no restrictions.",
  [ACCESS_TYPES.CUSTOM]:
    "This API is accessible based on rules set below. Ensure you have the rules configured properly.",
  [ACCESS_TYPES.INHERITED]: "This field inherits the access policy from the schema level.",
};

export const RULE_SOURCE_TYPES = {
  AUTH: "auth",
  SCHEMA_FIELD: "schema-field",
  STATIC_VALUE: "static-value",
} as const;

export const RULE_SOURCE_OPTIONS = [
  { label: "Auth", value: RULE_SOURCE_TYPES.AUTH },
  { label: "Schema Fields", value: RULE_SOURCE_TYPES.SCHEMA_FIELD },
];

export const COMPARE_SOURCE_OPTIONS = [
  { label: "Auth", value: RULE_SOURCE_TYPES.AUTH },
  { label: "Schema Fields", value: RULE_SOURCE_TYPES.SCHEMA_FIELD },
  { label: "Static Value", value: RULE_SOURCE_TYPES.STATIC_VALUE },
];

export const FIELD_TYPE_CATEGORY = {
  STRING: "string",
  ARRAY: "array",
  NUMERIC: "numeric",
} as const;

export type FieldTypeCategory = (typeof FIELD_TYPE_CATEGORY)[keyof typeof FIELD_TYPE_CATEGORY];

export const AUTH_FIELD_OPTIONS = [
  { label: "UserId", value: "userId", category: FIELD_TYPE_CATEGORY.STRING },
  { label: "Email", value: "email", category: FIELD_TYPE_CATEGORY.STRING },
  { label: "Roles", value: "roles", category: FIELD_TYPE_CATEGORY.ARRAY },
  { label: "Permissions", value: "permissions", category: FIELD_TYPE_CATEGORY.ARRAY },
];

export const RULE_OPERATORS = [
  { label: "Equal", value: "EQUAL" },
  { label: "Not Equal", value: "NOT_EQUAL" },
  { label: "Greater Than", value: "GREATER_THAN" },
  { label: "Greater Than or Equal", value: "GREATER_THAN_OR_EQUAL" },
  { label: "Less Than", value: "LESS_THAN" },
  { label: "Less Than or Equal", value: "LESS_THAN_OR_EQUAL" },
  { label: "Contain", value: "CONTAIN" },
  { label: "Not Contain", value: "NOT_CONTAIN" },
  { label: "In", value: "IN" },
  { label: "Not In", value: "NOT_IN" },
  { label: "Start With", value: "START_WITH" },
  { label: "End With", value: "END_WITH" },
  { label: "Is Null", value: "IS_NULL" },
  { label: "Is Not Null", value: "IS_NOT_NULL" },
];

export const SOURCE_TYPE_TO_NUMBER: Record<string, number> = {
  [RULE_SOURCE_TYPES.AUTH]: 0,
  [RULE_SOURCE_TYPES.SCHEMA_FIELD]: 1,
  [RULE_SOURCE_TYPES.STATIC_VALUE]: 2,
};

export const OPERATOR_TO_NUMBER: Record<string, number> = {
  EQUAL: 0,
  NOT_EQUAL: 1,
  GREATER_THAN: 2,
  GREATER_THAN_OR_EQUAL: 3,
  LESS_THAN: 4,
  LESS_THAN_OR_EQUAL: 5,
  CONTAIN: 6,
  NOT_CONTAIN: 7,
  IN: 8,
  NOT_IN: 9,
  START_WITH: 10,
  END_WITH: 11,
  IS_NULL: 12,
  IS_NOT_NULL: 13,
  REGEX: 14,
};

export const NUMBER_TO_SOURCE_TYPE: Record<number, string> = {
  0: RULE_SOURCE_TYPES.AUTH,
  1: RULE_SOURCE_TYPES.SCHEMA_FIELD,
  2: RULE_SOURCE_TYPES.STATIC_VALUE,
};

export const NUMBER_TO_OPERATOR: Record<number, string> = {
  0: "EQUAL",
  1: "NOT_EQUAL",
  2: "GREATER_THAN",
  3: "GREATER_THAN_OR_EQUAL",
  4: "LESS_THAN",
  5: "LESS_THAN_OR_EQUAL",
  6: "CONTAIN",
  7: "NOT_CONTAIN",
  8: "IN",
  9: "NOT_IN",
  10: "START_WITH",
  11: "END_WITH",
  12: "IS_NULL",
  13: "IS_NOT_NULL",
  14: "REGEX",
};

export const LOGICAL_OPERATOR = {
  AND: 0,
  OR: 1,
} as const;

export const POLICY_TYPE = {
  ROW: 0,
  COLUMN: 1,
} as const;

export const POLICY_OPERATION = {
  READ: 0,
  CREATE: 1,
  UPDATE: 2,
  DELETE: 3,
  ALL: 4,
} as const;

export const ACCESS_TYPE_BADGE_STYLES: Record<string, string> = {
  [ACCESS_TYPES.LOGGED_IN]:
    "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300",
  [ACCESS_TYPES.PUBLIC]:
    "bg-warning-100 text-warning-700 dark:bg-warning-800/30 dark:text-yellow-400",
  [ACCESS_TYPES.CUSTOM]: "bg-success/20 text-success",
  [ACCESS_TYPES.INHERITED]: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export const ACCESS_TYPE_SHORT_LABELS: Record<string, string> = {
  [ACCESS_TYPES.LOGGED_IN]: "Logged in users",
  [ACCESS_TYPES.PUBLIC]: "Public",
  [ACCESS_TYPES.CUSTOM]: "Custom",
  [ACCESS_TYPES.INHERITED]: "Inherited",
};

export const ACCESS_LEVEL_TO_TYPE: Record<number, string> = {
  0: ACCESS_TYPES.INHERITED,
  1: ACCESS_TYPES.LOGGED_IN,
  2: ACCESS_TYPES.PUBLIC,
  3: ACCESS_TYPES.CUSTOM,
};

export const ACCESS_TYPE_TO_LEVEL: Record<string, number> = {
  [ACCESS_TYPES.INHERITED]: 0,
  [ACCESS_TYPES.LOGGED_IN]: 1,
  [ACCESS_TYPES.PUBLIC]: 2,
  [ACCESS_TYPES.CUSTOM]: 3,
};

export const NUMBER_TO_SOURCE_LABEL: Record<number, string> = {
  0: "Auth",
  1: "Schema Fields",
  2: "Static Value",
};

export const STRING_OPERATORS = [
  "EQUAL",
  "NOT_EQUAL",
  "IN",
  "NOT_IN",
  "START_WITH",
  "END_WITH",
  "IS_NULL",
  "IS_NOT_NULL",
  "REGEX",
];

export const ARRAY_OPERATORS = ["CONTAIN", "NOT_CONTAIN", "IS_NULL", "IS_NOT_NULL"];

export const NUMERIC_OPERATORS = [
  "EQUAL",
  "NOT_EQUAL",
  "IN",
  "NOT_IN",
  "LESS_THAN",
  "LESS_THAN_OR_EQUAL",
  "GREATER_THAN",
  "GREATER_THAN_OR_EQUAL",
  "IS_NULL",
  "IS_NOT_NULL",
];

export const OPERATORS_BY_CATEGORY: Record<FieldTypeCategory, string[]> = {
  [FIELD_TYPE_CATEGORY.STRING]: STRING_OPERATORS,
  [FIELD_TYPE_CATEGORY.ARRAY]: ARRAY_OPERATORS,
  [FIELD_TYPE_CATEGORY.NUMERIC]: NUMERIC_OPERATORS,
};

export const AUTH_STRING_FIELDS = AUTH_FIELD_OPTIONS.filter(
  (opt) => opt.category === FIELD_TYPE_CATEGORY.STRING,
);

const NUMERIC_FIELD_TYPES = new Set([
  "int",
  "int32",
  "int64",
  "long",
  "float",
  "double",
  "decimal",
  "datetime",
]);

export function getFieldTypeCategory(
  type?: string | null,
  isArray?: boolean | null,
): FieldTypeCategory {
  if (isArray) return FIELD_TYPE_CATEGORY.ARRAY;
  const normalized = (type ?? "").toLowerCase();
  if (NUMERIC_FIELD_TYPES.has(normalized)) return FIELD_TYPE_CATEGORY.NUMERIC;
  return FIELD_TYPE_CATEGORY.STRING;
}

export const NUMBER_TO_OPERATOR_LABEL: Record<number, string> = {
  0: "Equal",
  1: "Not Equal",
  2: "Greater Than",
  3: "Greater Than or Equal",
  4: "Less Than",
  5: "Less Than or Equal",
  6: "Contain",
  7: "Not Contain",
  8: "In",
  9: "Not In",
  10: "Start With",
  11: "End With",
  12: "Is Null",
  13: "Is Not Null",
  14: "Regex",
};

export const READABLE_OPERATORS: Record<number, string> = {
  0: "equals",
  1: "does not equal",
  2: "is greater than",
  3: "is greater than or equal to",
  4: "is less than",
  5: "is less than or equal to",
  6: "contains",
  7: "does not contain",
  8: "is in",
  9: "is not in",
  10: "starts with",
  11: "ends with",
  12: "is null",
  13: "is not null",
  14: "matches regex",
};

export const NULL_OPERATORS: string[] = ["IS_NULL", "IS_NOT_NULL"];

export const IN_OPERATORS: string[] = ["IN", "NOT_IN"];

export const ACCESS_TYPE_LABELS: Record<string, string> = {
  [ACCESS_TYPES.LOGGED_IN]: "All Logged In Users",
  [ACCESS_TYPES.PUBLIC]: "Public",
  [ACCESS_TYPES.CUSTOM]: "Custom Permissions",
  [ACCESS_TYPES.INHERITED]: "Inherited",
};

export const TAB_TO_OPERATION: Record<string, number> = {
  view: POLICY_OPERATION.READ,
  create: POLICY_OPERATION.CREATE,
  edit: POLICY_OPERATION.UPDATE,
  delete: POLICY_OPERATION.DELETE,
};

export const TAB_TO_ACCESS_LEVEL_KEY: Record<
  string,
  "readAccessLevel" | "writeAccessLevel" | "editAccessLevel" | "deleteAccessLevel"
> = {
  view: "readAccessLevel",
  create: "writeAccessLevel",
  edit: "editAccessLevel",
  delete: "deleteAccessLevel",
};

export const INIT_STORAGE_PREFIX = "dg-server-init-";
export const POLL_START_DELAY = 2 * 60 * 1000;
export const POLL_INTERVAL = 60 * 1000;
export const MAX_INIT_DURATION = 10 * 60 * 1000;

export const getStoredInitiatedAt = (key: string): number | null => {
  try {
    const stored = localStorage.getItem(`${INIT_STORAGE_PREFIX}${key}`);
    if (!stored) return null;
    const { initiatedAt } = JSON.parse(stored);
    if (Date.now() - initiatedAt > MAX_INIT_DURATION) {
      localStorage.removeItem(`${INIT_STORAGE_PREFIX}${key}`);
      return null;
    }
    return initiatedAt;
  } catch {
    return null;
  }
};

export const SECURITY_PERFORMANCE_SUMMARY_ITEMS = [
  {
    id: 1,
    label: "Public",
    countKey: "totalPublicPermission" as const,
    className:
      "flex h-[60px] flex-col justify-center gap-[4px] rounded-[4px] border-l-[6px] border-[#FF3333] pl-4",
  },
  {
    id: 2,
    label: "Logged-in users",
    countKey: "totalUserPermission" as const,
    className:
      "flex h-[60px] flex-col justify-center gap-[4px] rounded-[4px] border-l-[6px] border-[#F8BE28] pl-4",
  },
  {
    id: 3,
    label: "Custom",
    countKey: "totalCustomPermission" as const,
    className:
      "flex h-[60px] flex-col justify-center gap-[4px] rounded-[4px] border-l-[6px] border-[#17C964] pl-4",
  },
];

export const ACCESS_LEVEL_BADGE_MAP: Record<string, { label: string; colorClass: string }> = {
  "0": {
    label: "Inherited",
    colorClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  "1": {
    label: "Logged-in users",
    colorClass: "bg-[#FFF7CC] text-[#AB730A]",
  },
  "2": {
    label: "Public",
    colorClass: "bg-[#FFDCD6] text-[#B3121D]",
  },
  "3": {
    label: "Custom",
    colorClass: "bg-[#E8FFEE] text-[#0AA351]",
  },
};
