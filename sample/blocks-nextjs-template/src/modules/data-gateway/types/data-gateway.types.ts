export type SchemaType = 1 | 2
export type FieldType = string
export type AccessLevel = 0 | 1 | 2

export const PRIMITIVE_FIELD_TYPES = ['String', 'Number', 'Boolean', 'DateTime', 'ObjectId', 'Object', 'Array'] as const
export type PolicyOperation = 0 | 1 | 2 | 3 | 4
export type PolicyType = 0 | 1
export type PolicyLogicalOperator = 0 | 1
export type PolicyOperator = 0 | 1 | 2 | 3
export type ConditionSource = 0 | 1 | 2
export type AccessModifier = 'Public' | 'Private'
export type ValidationType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export interface SchemaField {
  id?: string
  name: string
  type: FieldType
  isArray: boolean
  isPIIData?: boolean
  isUniqueData?: boolean
  description?: string
  fields?: SchemaField[]
  readAccess?: IDataAccessRuleSet
  writeAccess?: IDataAccessRuleSet
  deleteAccess?: IDataAccessRuleSet
  totalRoles?: number
  totalUsers?: number
  totalPermissions?: number
  readAccessLevel?: number
  writeAccessLevel?: number
  editAccessLevel?: number
  deleteAccessLevel?: number
  totalValidationRules?: number
  validationRule?: IFieldValidationRule | null
}

export interface IDataAccessRuleSet {
  roles: string[]
  permissions: string[]
  users: string[]
}

export interface IFieldValidationRule {
  validations?: {
    type: number
    value?: unknown
    secondaryValue?: unknown
    errorMessage: string
    isActive: boolean
  }[]
}

export const DEFAULT_SCHEMA_FIELDS: SchemaField[] = [
  { name: 'ItemId', type: 'String', isArray: false },
  { name: 'CreatedDate', type: 'DateTime', isArray: false },
  { name: 'LastUpdatedDate', type: 'DateTime', isArray: false },
  { name: 'Tags', type: 'String', isArray: true },
  { name: 'OrganizationIds', type: 'String', isArray: true },
  { name: 'CreatedBy', type: 'String', isArray: false },
  { name: 'LastUpdatedBy', type: 'String', isArray: false },
  { name: 'Language', type: 'String', isArray: false },
]

export const DEFAULT_NON_EDITABLE_FIELD_NAMES = ['ItemId', 'CreatedDate', 'LastUpdatedDate', 'Tags', 'OrganizationIds', 'CreatedBy', 'LastUpdatedBy', 'Language']

export interface Schema {
  id: string
  schemaName: string
  collectionName: string
  schemaType: SchemaType
  description?: string
  fields?: SchemaField[]
  projectKey: string
  projectShortKey?: string
  createdAt: string
  updatedAt?: string
  accessSummary?: {
    read?: string
    write?: string
    edit?: string
    delete?: string
  }
  isRlsEnabled?: boolean
  isClsEnabled?: boolean
  totalSchemaReferences?: number
  schemaReferences?: string[]
  readAccessLevel?: number
  writeAccessLevel?: number
  editAccessLevel?: number
  deleteAccessLevel?: number
  readAccess?: IDataAccessRuleSet
  writeAccess?: IDataAccessRuleSet
  deleteAccess?: IDataAccessRuleSet
  totalPermissions?: number
  totalRoles?: number
  totalUsers?: number
}

export interface DefineSchemaPayload {
  collectionName: string
  schemaName: string
  projectKey: string
  schemaType: SchemaType
  description?: string
  projectShortKey?: string
  fields: SchemaField[]
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

export interface AccessPolicy {
  itemId: string
  schemaName: string
  policyName: string
  policyDescription?: string
  policyType?: PolicyType
  operation?: PolicyOperation
  fieldNames?: string[]
  projectKey: string
  priority?: number
  isAllowPolicy?: boolean
  ruleGroup?: PolicyRuleGroup
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

export interface UpdateAccessPolicyPayload {
  itemId: string
  policyName?: string
  policyDescription?: string
  fieldNames?: string[]
  projectKey: string
  ruleGroup?: PolicyRuleGroup
  priority?: number
  isAllowPolicy?: boolean
}

export interface ValidationRule {
  type: ValidationType
  value?: unknown
  secondaryValue?: unknown
  errorMessage: string
  isActive: boolean
}

export interface FieldValidation {
  id: string
  projectKey: string
  schemaId: string
  fieldName: string
  validations: ValidationRule[]
}

export interface DmsFile {
  id: string
  name: string
  isFolder: boolean
  parentId?: string
  size?: number
  contentType?: string
  accessModifier: AccessModifier
  createdAt: string
  tags?: string[]
  url?: string
  metadata?: Record<string, string>
}

export interface UploadProgress {
  fileName: string
  progress: number
  status: UploadStatus
  error?: string
}

export interface PreSignedUrlResponse {
  uploadUrl: string
  fileId: string
}

export interface DataSource {
  itemId: string
  databaseName: string
  projectKey: string
  isActive: boolean
  createdAt?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface GraphQLQueryOptions {
  page?: number
  pageSize?: number
  filter?: Record<string, unknown>
  sort?: {
    field: string
    order: 'ASC' | 'DESC'
  }
}
