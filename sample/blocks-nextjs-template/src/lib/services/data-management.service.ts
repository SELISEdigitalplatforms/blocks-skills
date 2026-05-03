import { blocksFetch, refreshTokens } from '@/lib/blocks-client'
import type {
  UdsResponse,
  DefineSchemaPayload,
  SaveSchemaFieldsPayload,
  ChangeSecurityPayload,
  CreateAccessPolicyPayload,
  CreateValidationPayload,
  PreSignedUrlResponse,
} from '@/lib/types/data-management.types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.seliseblocks.com'
const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY ?? ''

const UDS_BASE = '/uds/v1'

async function udsEndpoint<T>(
  path: string,
  method: string,
  body?: unknown,
  isFormData = false
): Promise<UdsResponse<T>> {
  const { data, error } = await blocksFetch<UdsResponse<T>>(
    `${UDS_BASE}${path}`,
    { method, body, isFormData }
  )

  if (error) {
    return {
      isSuccess: false,
      message: error,
      httpStatusCode: 500,
      data: null,
      errors: {},
    }
  }

  return data!
}

export async function getDataSource() {
  return udsEndpoint<Record<string, unknown>>('/data-sources/get', 'GET')
}

export async function addDataSource(payload: {
  ItemId: string
  ConnectionString: string
  DatabaseName: string
  ProjectKey: string
}) {
  return udsEndpoint('/data-sources/add', 'POST', payload)
}

export async function reloadConfiguration(projectKey?: string) {
  const qs = projectKey ? `?projectKey=${encodeURIComponent(projectKey)}` : ''
  return udsEndpoint(`/configurations/reload${qs}`, 'POST')
}

export async function defineSchema(payload: DefineSchemaPayload) {
  return udsEndpoint<{ id: string; schemaName: string; collectionName: string }>(
    '/schemas/define',
    'POST',
    payload
  )
}

export async function saveSchemaFields(payload: SaveSchemaFieldsPayload) {
  return udsEndpoint('/schemas/fields', 'POST', payload)
}

export async function getSchema(schemaId: string) {
  return udsEndpoint<Record<string, unknown>>(`/schemas/${schemaId}`, 'GET')
}

export async function getSchemas(params?: {
  PageNo?: number
  PageSize?: number
  Keyword?: string
  SchemaName?: string
  CollectionName?: string
  SchemaType?: number
  SortBy?: string
  SortDescending?: boolean
  ProjectKey: string
}) {
  const qs = new URLSearchParams()
  if (params) {
    if (params.PageNo) qs.set('PageNo', String(params.PageNo))
    if (params.PageSize) qs.set('PageSize', String(params.PageSize))
    if (params.Keyword) qs.set('Keyword', params.Keyword)
    if (params.SchemaName) qs.set('SchemaName', params.SchemaName)
    if (params.CollectionName) qs.set('CollectionName', params.CollectionName)
    if (params.SchemaType) qs.set('SchemaType', String(params.SchemaType))
    if (params.SortBy) qs.set('SortBy', params.SortBy)
    if (params.SortDescending) qs.set('SortDescending', String(params.SortDescending))
    qs.set('ProjectKey', params.ProjectKey)
  }
  const query = qs.toString() ? `?${qs.toString()}` : ''
  return udsEndpoint<{ items: Record<string, unknown>[]; total: number; page: number; pageSize: number }>(
    `/schemas${query}`,
    'GET'
  )
}

export async function changeSecurity(payload: ChangeSecurityPayload) {
  return udsEndpoint('/data-access/security/change', 'POST', payload)
}

export async function createAccessPolicy(payload: CreateAccessPolicyPayload) {
  return udsEndpoint<{ itemId: string }>('/data-access/policy/create', 'POST', payload)
}

export async function getAccessPolicies(schemaName: string) {
  return udsEndpoint<Record<string, unknown>[]>(
    `/data-access/policy/get?schemaName=${encodeURIComponent(schemaName)}`,
    'GET'
  )
}

export async function createValidation(payload: CreateValidationPayload) {
  return udsEndpoint<{ id: string }>('/data-validations', 'POST', payload)
}

export async function getSchemaValidations(schemaId: string) {
  return udsEndpoint<Record<string, unknown>[]>(`/data-validations/by-schema-id?schemaId=${encodeURIComponent(schemaId)}`, 'GET')
}

export async function deleteSchema(schemaId: string) {
  return udsEndpoint(`/schemas/${schemaId}`, 'DELETE')
}

export async function uploadFile(file: File, name: string, accessModifier = 'Private') {
  const formData = new FormData()
  formData.append('File', file)
  formData.append('Name', name)
  formData.append('AccessModifier', accessModifier)
  formData.append('ProjectKey', X_BLOCKS_KEY)

  return udsEndpoint<{ id: string }>(
    '/Files/UploadFile',
    'POST',
    formData,
    true
  )
}

export async function getPreSignedUploadUrl(payload: {
  name: string
  parentDirectoryId?: string
  tags?: string
  accessModifier?: string
  configurationName?: string
  projectKey: string
  moduleName?: number
  metaData?: string
  additionalProperties?: Record<string, string>
}): Promise<UdsResponse<PreSignedUrlResponse>> {
  return udsEndpoint<PreSignedUrlResponse>('/Files/GetPreSignedUrlForUpload', 'POST', payload)
}

export async function updateFileInfo(payload: {
  itemId: string
  additionalProperties?: Record<string, string>
  projectKey: string
}) {
  return udsEndpoint('/Files/updateFileAdditionalInfo', 'POST', payload)
}

export async function graphqlQuery<T = Record<string, unknown>>(
  query: string,
  variables?: Record<string, unknown>
): Promise<{ data: T | null; errors: string[] }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-blocks-key': X_BLOCKS_KEY,
    accept: 'application/json',
  }

  let res = await fetch(`${API_BASE_URL}${UDS_BASE}/${X_BLOCKS_KEY}/gateway`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ query, variables }),
  })

  if (res.status === 401) {
    const refreshed = await refreshTokens()
    if (refreshed) {
      res = await fetch(`${API_BASE_URL}${UDS_BASE}/${X_BLOCKS_KEY}/gateway`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ query, variables }),
      })
    }
  }

  const json = await res.json()
  return {
    data: (json.data as T) ?? null,
    errors: json.errors?.map((e: { message: string }) => e.message) ?? [],
  }
}
