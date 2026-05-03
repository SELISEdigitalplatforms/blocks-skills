export type SchemaType = 1 | 2
export type FieldType = 'String' | 'Number' | 'Boolean' | 'Date' | 'ObjectId' | 'Object' | 'Array'
export type AccessLevel = 0 | 1 | 2
export type PolicyOperation = 0 | 1 | 2 | 3 | 4
export type PolicyType = 0 | 1
export type PolicyLogicalOperator = 0 | 1
export type PolicyOperator = 0 | 1 | 2 | 3
export type ConditionSource = 0 | 1 | 2
export type ValidationType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

export interface UdsResponse<T> {
  isSuccess: boolean
  message: string
  httpStatusCode: number
  data: T | null
  errors: Record<string, string>
}

export interface SchemaField {
  name: string
  type: FieldType
  isArray: boolean
  isPIIData?: boolean
  isUniqueData?: boolean
  description?: string
}

export const DEFAULT_SCHEMA_FIELDS: SchemaField[] = [
  { name: 'ItemId', type: 'String', isArray: false },
  { name: 'CreatedAt', type: 'Date', isArray: false },
  { name: 'UpdatedAt', type: 'Date', isArray: false },
]

export const DEFAULT_NON_EDITABLE_FIELD_NAMES = ['ItemId', 'CreatedAt', 'UpdatedAt']

export interface DefineSchemaPayload {
  collectionName: string
  schemaName: string
  projectKey: string
  schemaType: SchemaType
  description?: string
  projectShortKey?: string
  fields?: SchemaField[]
}

export interface SaveSchemaFieldsPayload {
  schemaDefinitionItemId: string
  projectKey: string
  fields: SchemaField[]
  deletableFieldNames?: string[]
  projectShortKey?: string
}

export interface PolicyRule {
  leftSource: ConditionSource
  leftOperand: string
  operator: PolicyOperator
  rightSource: ConditionSource
  rightOperand?: string
  staticValue?: unknown
  description?: string
}

export interface PolicyRuleGroup {
  logicalOperator: PolicyLogicalOperator
  rules?: PolicyRule[]
  nestedGroups?: PolicyRuleGroup[]
}

export interface ChangeSecurityPayload {
  projectKey: string
  schemaId: string
  accessLevel: AccessLevel
  operation?: PolicyOperation
  policyType?: PolicyType
  fieldNames?: string[]
}

export interface CreateAccessPolicyPayload {
  policyName: string
  policyDescription?: string
  policyType: PolicyType
  operation: PolicyOperation
  schemaName: string
  schemaId?: string
  fieldNames?: string[]
  projectKey: string
  ruleGroup?: PolicyRuleGroup
  priority?: number
  isAllowPolicy: boolean
}

export interface ValidationRule {
  type: ValidationType
  value?: unknown
  secondaryValue?: unknown
  errorMessage: string
  isActive: boolean
}

export interface CreateValidationPayload {
  projectKey: string
  schemaId: string
  fieldName: string
  validations: ValidationRule[]
}

export interface PreSignedUrlResponse {
  uploadUrl: string
  fileId: string
}
