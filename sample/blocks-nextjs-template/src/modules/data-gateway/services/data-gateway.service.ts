import https, { UdsResponse } from '@/lib/https'
import type {
  Schema,
  DefineSchemaPayload,
  SaveSchemaFieldsPayload,
  AccessPolicy,
  CreateAccessPolicyPayload,
  UpdateAccessPolicyPayload,
  ValidationRule,
  FieldValidation,
  DmsFile,
  PreSignedUrlResponse,
  DataSource,
  PaginatedResponse,
} from '../types/data-gateway.types'

export const getSchemas = async (params: {
  ProjectKey: string
  PageNo?: number
  PageSize?: number
  Keyword?: string
  SchemaName?: string
  CollectionName?: string
  SchemaType?: number
  SortBy?: string
  SortDescending?: boolean
}): Promise<UdsResponse<PaginatedResponse<Schema>>> => {
  const response = await https.get<UdsResponse<PaginatedResponse<Schema>>>('/schemas', {
    params: {
      ProjectKey: params.ProjectKey,
      PageNo: params.PageNo ?? 1,
      PageSize: params.PageSize ?? 100,
      Keyword: params.Keyword ?? '',
      SortDescending: params.SortDescending ?? true,
      SortBy: params.SortBy ?? 'CreatedDate',
      SchemaType: params.SchemaType ?? '',
    },
  })
  return response.data
}

export const getSchemaById = async (params: {
  id: string
  projectKey: string
}): Promise<UdsResponse<Schema>> => {
  const response = await https.get<UdsResponse<Schema>>('/schemas/get-by-id', { params })
  return response.data
}

export const getSchemasAggregation = async (params: {
  ProjectKey: string
  PageNo?: number
  PageSize?: number
  Keyword?: string
  SchemaName?: string
  CollectionName?: string
  SchemaType?: number
  SortBy?: string
  SortDescending?: boolean
}): Promise<UdsResponse<PaginatedResponse<Schema>>> => {
  const response = await https.get<UdsResponse<PaginatedResponse<Schema>>>('/schemas/aggregation', { params })
  return response.data
}

export const getSchemaCollections = async (params: {
  projectKey: string
}): Promise<UdsResponse<{ collections: { name: string; collectionName: string }[] }>> => {
  const response = await https.get<UdsResponse<{ collections: { name: string; collectionName: string }[] }>>('/schemas/info', { params })
  return response.data
}

export const getSchemaByCollection = async (params: {
  schemaName: string
  projectKey: string
}): Promise<UdsResponse<Schema>> => {
  const response = await https.get<UdsResponse<Schema>>('/schemas/info-by-name', { params })
  return response.data
}

export const defineSchema = async (payload: DefineSchemaPayload): Promise<UdsResponse<{ acknowledged: boolean; itemId: string }>> => {
  const response = await https.post<UdsResponse<{ acknowledged: boolean; itemId: string }>>('/schemas/define', payload)
  return response.data
}

export const createSchema = async (payload: {
  schemaName: string
  collectionName: string
  projectKey: string
  schemaType: number
  description?: string
  projectShortKey?: string
}): Promise<UdsResponse<{ acknowledged: boolean; itemId: string }>> => {
  const response = await https.post<UdsResponse<{ acknowledged: boolean; itemId: string }>>('/schemas/info', payload)
  return response.data
}

export const updateSchema = async (payload: {
  itemId: string
  collectionName: string
  schemaName: string
  projectKey: string
  schemaType: number
  description?: string
  projectShortKey?: string
}): Promise<UdsResponse<{ id: string }>> => {
  const response = await https.put<UdsResponse<{ id: string }>>('/schemas/info', payload)
  return response.data
}

export const saveSchemaFields = async (payload: SaveSchemaFieldsPayload): Promise<UdsResponse<void>> => {
  const response = await https.post<UdsResponse<void>>('/schemas/fields', payload)
  return response.data
}

export const deleteSchema = async (params: { id: string; projectKey: string }): Promise<UdsResponse<void>> => {
  const response = await https.delete<UdsResponse<void>>('/schemas', { params })
  return response.data
}

export const getUnadaptedChanges = async (params: {
  projectKey: string
}): Promise<UdsResponse<{ changes: { schemaName: string; changeType: string; fieldName?: string; timestamp: string }[]; total: number }>> => {
  const response = await https.get<UdsResponse<{ changes: { schemaName: string; changeType: string; fieldName?: string; timestamp: string }[]; total: number }>>('/schemas/unadapted-change-logs', { params })
  return response.data
}

export const reloadConfiguration = async (params?: { projectKey?: string }): Promise<UdsResponse<void>> => {
  const response = await https.post<UdsResponse<void>>('/configurations/reload', undefined, { params })
  return response.data
}

export const getDataSource = async (): Promise<UdsResponse<DataSource>> => {
  const response = await https.get<UdsResponse<DataSource>>('/data-sources/get')
  return response.data
}

export const addDataSource = async (payload: {
  ItemId: string
  ConnectionString: string
  DatabaseName: string
  ProjectKey: string
}): Promise<UdsResponse<void>> => {
  const response = await https.post<UdsResponse<void>>('/data-sources/add', payload)
  return response.data
}

export const updateDataSource = async (payload: {
  ItemId: string
  ConnectionString: string
  DatabaseName: string
  IsActive: boolean
  ProjectKey: string
}): Promise<UdsResponse<void>> => {
  const response = await https.put<UdsResponse<void>>('/data-sources/update', payload)
  return response.data
}

export const changeSecurity = async (payload: {
  projectKey: string
  schemaId: string
  accessLevel: number
  operation?: number
  policyType?: number
  fieldNames?: string[]
}): Promise<UdsResponse<void>> => {
  const response = await https.post<UdsResponse<void>>('/data-access/security/change', payload)
  return response.data
}

export const createAccessPolicy = async (payload: CreateAccessPolicyPayload): Promise<UdsResponse<{ itemId: string }>> => {
  const response = await https.post<UdsResponse<{ itemId: string }>>('/data-access/policy/create', payload)
  return response.data
}

export const updateAccessPolicy = async (payload: UpdateAccessPolicyPayload): Promise<UdsResponse<void>> => {
  const response = await https.post<UdsResponse<void>>('/data-access/policy/update', payload)
  return response.data
}

export const deleteAccessPolicy = async (params: {
  itemId: string
  projectKey: string
}): Promise<UdsResponse<void>> => {
  const response = await https.delete<UdsResponse<void>>('/data-access/policy/delete', { params })
  return response.data
}

export const getAccessPolicies = async (params: {
  schemaName: string
  projectKey: string
}): Promise<UdsResponse<AccessPolicy[]>> => {
  const response = await https.get<UdsResponse<AccessPolicy[]>>('/data-access/policy/get', { params })
  return response.data
}

export const getValidations = async (params: {
  ProjectKey: string
  PageNo?: number
  PageSize?: number
  SchemaId?: string
  FieldName?: string
  Keyword?: string
  SortBy?: string
  SortDescending?: boolean
}): Promise<UdsResponse<PaginatedResponse<FieldValidation>>> => {
  const response = await https.get<UdsResponse<PaginatedResponse<FieldValidation>>>('/data-validations', { params })
  return response.data
}

export const getValidationById = async (params: {
  validationId: string
  projectKey: string
}): Promise<UdsResponse<FieldValidation>> => {
  const response = await https.get<UdsResponse<FieldValidation>>('/data-validations/get-by-id', { params })
  return response.data
}

export const createValidation = async (payload: {
  projectKey: string
  schemaId: string
  fieldName: string
  validations: ValidationRule[]
}): Promise<UdsResponse<{ id: string }>> => {
  const response = await https.post<UdsResponse<{ id: string }>>('/data-validations', payload)
  return response.data
}

export const updateValidation = async (payload: {
  projectKey: string
  itemId: string
  schemaId: string
  fieldName: string
  validations: ValidationRule[]
}): Promise<UdsResponse<void>> => {
  const response = await https.put<UdsResponse<void>>('/data-validations', payload)
  return response.data
}

export const deleteValidation = async (params: {
  validationId: string
  projectKey: string
}): Promise<UdsResponse<void>> => {
  const response = await https.delete<UdsResponse<void>>('/data-validations', { params })
  return response.data
}

export const getSchemaValidations = async (params: {
  schemaId: string
  projectKey: string
}): Promise<UdsResponse<FieldValidation[]>> => {
  const response = await https.get<UdsResponse<FieldValidation[]>>('/data-validations/by-schema-id', { params })
  return response.data
}

export const getFieldValidation = async (params: {
  schemaId: string
  fieldName: string
  projectKey: string
}): Promise<UdsResponse<FieldValidation>> => {
  const response = await https.get<UdsResponse<FieldValidation>>('/data-validations/by-schema-and-field', { params })
  return response.data
}

export const getPreSignedUploadUrl = async (payload: {
  name: string
  parentDirectoryId?: string
  tags?: string
  accessModifier?: string
  configurationName?: string
  projectKey: string
  moduleName?: number
  metaData?: string
  additionalProperties?: Record<string, string>
}): Promise<UdsResponse<PreSignedUrlResponse>> => {
  const response = await https.post<UdsResponse<PreSignedUrlResponse>>('/Files/GetPreSignedUrlForUpload', payload)
  return response.data
}

export const updateFileInfo = async (payload: {
  itemId: string
  additionalProperties?: Record<string, string>
  projectKey: string
}): Promise<UdsResponse<void>> => {
  const response = await https.post<UdsResponse<void>>('/Files/updateFileAdditionalInfo', payload)
  return response.data
}

export const getDmsFiles = async (payload: {
  parentId?: string
  projectKey: string
  configurationName?: string
  searchKey?: string
  moduleName?: string
  skip?: number
  take?: number
}): Promise<UdsResponse<PaginatedResponse<DmsFile>>> => {
  const response = await https.post<UdsResponse<PaginatedResponse<DmsFile>>>('/Files/GetDmsFileAndFolder', payload)
  return response.data
}

export const uploadToDms = async (formData: FormData): Promise<UdsResponse<{ id: string }>> => {
  const response = await https.post<UdsResponse<{ id: string }>>('/Files/UploadFile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const uploadToLocalStorage = async (formData: FormData): Promise<UdsResponse<{ id: string }>> => {
  const response = await https.post<UdsResponse<{ id: string }>>('/Files/UploadFileToLocalStorage', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const getFile = async (params: {
  FileId: string
  Version?: number
  ConfigurationName?: string
  ProjectKey: string
}): Promise<UdsResponse<DmsFile>> => {
  const response = await https.get<UdsResponse<DmsFile>>('/Files/GetFile', { params })
  return response.data
}

export const getFiles = async (payload: {
  FileIds: string[]
  ProjectKey: string
}): Promise<UdsResponse<DmsFile[]>> => {
  const response = await https.post<UdsResponse<DmsFile[]>>('/Files/GetFiles', payload)
  return response.data
}

export const getFilesInfo = async (payload: {
  FileIds: string[]
  ProjectKey: string
}): Promise<UdsResponse<DmsFile[]>> => {
  const response = await https.post<UdsResponse<DmsFile[]>>('/Files/GetFilesInfo', payload)
  return response.data
}

export const createFolder = async (payload: {
  Name: string
  ParentDirectoryId?: string
  ProjectKey: string
}): Promise<UdsResponse<{ id: string }>> => {
  const response = await https.post<UdsResponse<{ id: string }>>('/Files/CreateFolder', payload)
  return response.data
}

export const deleteFile = async (payload: {
  FileId: string
  ProjectKey: string
}): Promise<UdsResponse<void>> => {
  const response = await https.post<UdsResponse<void>>('/Files/DeleteFile', payload)
  return response.data
}

export const deleteFolder = async (payload: {
  folderId: string
  configurationName?: string
  projectKey: string
}): Promise<UdsResponse<void>> => {
  const response = await https.post<UdsResponse<void>>('/Files/DeleteFolder', payload)
  return response.data
}

export const getMockData = async (): Promise<UdsResponse<{ schemas: { schemaName: string; records: Record<string, unknown>[] }[] }>> => {
  const response = await https.get<UdsResponse<{ schemas: { schemaName: string; records: Record<string, unknown>[] }[] }>>('/data-manage/mock-data')
  return response.data
}

export const deleteMockData = async (payload: {
  projectKey: string
  schemaNames: string[]
}): Promise<UdsResponse<void>> => {
  const response = await https.post<UdsResponse<void>>('/data-manage/mock-data', payload)
  return response.data
}

export const dataGatewayService = {
  schemas: {
    getAll: getSchemas,
    getById: getSchemaById,
    getAggregation: getSchemasAggregation,
    getCollections: getSchemaCollections,
    getByCollection: getSchemaByCollection,
    define: defineSchema,
    create: createSchema,
    update: updateSchema,
    saveFields: saveSchemaFields,
    delete: deleteSchema,
    getUnadaptedChanges,
  },
  configuration: {
    reload: reloadConfiguration,
  },
  dataSource: {
    get: getDataSource,
    add: addDataSource,
    update: updateDataSource,
  },
  dataAccess: {
    changeSecurity,
    createAccessPolicy,
    updateAccessPolicy,
    deleteAccessPolicy,
    getPolicies: getAccessPolicies,
  },
  validation: {
    getAll: getValidations,
    getById: getValidationById,
    create: createValidation,
    update: updateValidation,
    delete: deleteValidation,
    getSchemaValidations,
    getFieldValidation,
  },
  files: {
    getPreSignedUploadUrl,
    updateFileInfo,
    getDmsFiles,
    uploadToDms,
    uploadToLocalStorage,
    getFile,
    getFiles,
    getFilesInfo,
    createFolder,
    deleteFile,
    deleteFolder,
  },
  dataManage: {
    getMockData,
    deleteMockData,
  },
}

export default dataGatewayService
