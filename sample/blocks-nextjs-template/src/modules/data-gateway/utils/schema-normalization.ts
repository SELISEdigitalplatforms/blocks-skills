import type { SchemaField } from "../types/data-gateway.types"

const filterNonEmptyStrings = (values: (string | null | undefined)[] = []) =>
  Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim()),
    ),
  );

export const createEmptyAccessRuleSet = () => ({
  roles: [],
  permissions: [],
  users: [],
});

export const normalizeAccessRuleSet = (
  access?: { roles?: (string | null)[]; permissions?: (string | null)[]; users?: (string | null)[] } | null,
) => ({
  roles: filterNonEmptyStrings(access?.roles ?? []),
  permissions: filterNonEmptyStrings(access?.permissions ?? []),
  users: filterNonEmptyStrings(access?.users ?? []),
});

export const normalizeSchemaFields = (fields: SchemaField[] = []): SchemaField[] =>
  fields.map((field) => ({
    name: field.name,
    type: field.type,
    isArray: field.isArray,
    isPIIData: field.isPIIData ?? false,
    isUniqueData: field.isUniqueData ?? false,
    description: field.description ?? "",
    readAccess: normalizeAccessRuleSet(field.readAccess),
    writeAccess: normalizeAccessRuleSet(field.writeAccess),
    deleteAccess: normalizeAccessRuleSet(field.deleteAccess),
    totalRoles: field.totalRoles ?? 0,
    totalUsers: field.totalUsers ?? 0,
    totalPermissions: field.totalPermissions ?? 0,
    writeAccessLevel: field.writeAccessLevel,
    readAccessLevel: field.readAccessLevel,
    deleteAccessLevel: field.deleteAccessLevel,
    editAccessLevel: field.editAccessLevel,
    totalValidationRules: field.totalValidationRules ?? 0,
    validationRule: field.validationRule ?? null,
    fields: field.fields?.length ? normalizeSchemaFields(field.fields) : undefined,
  }));

export const getTotalValidationRulesIncludingNested = (field: SchemaField | undefined): number => {
  if (!field) return 0;
  const own = field.totalValidationRules ?? 0;
  const nested = (field.fields ?? []).reduce(
    (sum, f) => sum + getTotalValidationRulesIncludingNested(f),
    0,
  );
  return own + nested;
};

export const hasActiveValidationIncludingNested = (field: SchemaField | undefined): boolean => {
  if (!field) return false;
  const ownActive = field.validationRule?.validations?.some((v) => v.isActive) ?? false;
  const nestedActive = (field.fields ?? []).some(hasActiveValidationIncludingNested);
  return ownActive || nestedActive;
};

export const getValidationDisplayInfo = (
  field: SchemaField | undefined,
): { total: number; hasActive: boolean } => ({
  total: getTotalValidationRulesIncludingNested(field),
  hasActive: hasActiveValidationIncludingNested(field),
});

export const buildValidationFieldName = (
  ancestorPath: string[],
  fieldName: string,
): string =>
  ancestorPath.length ? `${ancestorPath.join(".")}.${fieldName}` : fieldName;

type ParentNestedField = {
  name: string;
  type?: string;
  isArray?: boolean;
  validationRule?: unknown;
  totalValidationRules?: number;
  readAccessLevel?: number;
  writeAccessLevel?: number;
  editAccessLevel?: number;
  deleteAccessLevel?: number;
  fields?: ParentNestedField[];
};

const parentToField = (p: ParentNestedField): SchemaField => ({
  name: p.name,
  type: p.type ?? "String",
  isArray: p.isArray ?? false,
  validationRule: (p.validationRule as SchemaField["validationRule"]) ?? null,
  totalValidationRules: p.totalValidationRules ?? 0,
  readAccessLevel: p.readAccessLevel,
  writeAccessLevel: p.writeAccessLevel,
  editAccessLevel: p.editAccessLevel,
  deleteAccessLevel: p.deleteAccessLevel,
  fields: p.fields?.length ? mergeFieldsWithParentData([], p.fields) : undefined,
});

export const mergeFieldsWithParentData = (
  childFields: SchemaField[],
  parentNestedFields?: ParentNestedField[],
): SchemaField[] => {
  if (!parentNestedFields?.length) return childFields;
  if (!childFields.length) {
    return parentNestedFields.map(parentToField);
  }
  return childFields.map((f) => {
    const parentField = parentNestedFields.find(
      (nf) => nf.name.toLowerCase() === f.name.toLowerCase(),
    );
    if (!parentField) return f;
    const mergedNested =
      parentField.fields?.length || f.fields?.length
        ? mergeFieldsWithParentData(f.fields ?? [], parentField.fields ?? [])
        : f.fields;
    return {
      ...f,
      validationRule: (parentField.validationRule as SchemaField["validationRule"]) ?? f.validationRule,
      totalValidationRules: parentField.totalValidationRules ?? f.totalValidationRules,
      readAccessLevel: parentField.readAccessLevel ?? f.readAccessLevel,
      writeAccessLevel: parentField.writeAccessLevel ?? f.writeAccessLevel,
      editAccessLevel: parentField.editAccessLevel ?? f.editAccessLevel,
      deleteAccessLevel: parentField.deleteAccessLevel ?? f.deleteAccessLevel,
      fields: mergedNested,
    };
  });
};
