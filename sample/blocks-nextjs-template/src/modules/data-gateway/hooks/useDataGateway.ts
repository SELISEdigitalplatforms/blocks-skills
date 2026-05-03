'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { graphqlQuery, graphqlMutation } from '@/lib/graphql'
import dataGatewayService from '../services/data-gateway.service'
import type {
  Schema,
  SaveSchemaFieldsPayload,
  AccessPolicy,
  CreateAccessPolicyPayload,
  ValidationRule,
  FieldValidation,
  DmsFile,
  UploadProgress,
  PaginatedResponse,
} from '../types/data-gateway.types'

const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY ?? ''

interface UseDataGatewayState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

interface UseDataGatewayResult<T> extends UseDataGatewayState<T> {
  refetch: () => Promise<void>
}

function useAsyncState<T>() {
  const [state, setState] = useState<UseDataGatewayState<T>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const setLoading = useCallback(() => setState((prev) => ({ ...prev, isLoading: true, error: null })), [])
  const setSuccess = useCallback((data: T) => setState({ data, isLoading: false, error: null }), [])
  const setError = useCallback((error: string) => setState((prev) => ({ ...prev, isLoading: false, error })), [])

  return useMemo(() => ({ state, setLoading, setSuccess, setError }), [state, setLoading, setSuccess, setError])
}

export const useGetSchemas = (params?: {
  PageNo?: number
  PageSize?: number
  Keyword?: string
  SchemaName?: string
  CollectionName?: string
}): UseDataGatewayResult<PaginatedResponse<Schema>> => {
  const { state, setLoading, setSuccess, setError } = useAsyncState<PaginatedResponse<Schema>>()

  // Memoize params to prevent infinite loops
  const paramsKey = JSON.stringify(params)

  const fetchSchemas = useCallback(async () => {
    setLoading()
    try {
      const currentParams = JSON.parse(paramsKey)
      const response = await dataGatewayService.schemas.getAll({
        ...currentParams,
        ProjectKey: X_BLOCKS_KEY,
        SortDescending: true,
        SortBy: 'CreatedDate',
      })
      if (response.isSuccess && response.data) {
        setSuccess(response.data)
      } else {
        setError(response.message || 'Failed to fetch schemas')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [paramsKey, setLoading, setSuccess, setError])

  useEffect(() => {
    fetchSchemas()
  }, [fetchSchemas])

  return useMemo(() => ({ ...state, refetch: fetchSchemas }), [state, fetchSchemas])
}

export const useGetSchemaById = (id: string | null): UseDataGatewayResult<Schema> => {
  const { state, setLoading, setSuccess, setError } = useAsyncState<Schema>()

  const refetch = useCallback(async () => {
    if (!id) return
    setLoading()
    try {
      const response = await dataGatewayService.schemas.getById({ id, projectKey: X_BLOCKS_KEY })
      if (response.isSuccess && response.data) {
        setSuccess(response.data)
      } else {
        setError(response.message || 'Failed to fetch schema')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [id, setLoading, setSuccess, setError])

  useEffect(() => {
    refetch()
  }, [refetch])

  return useMemo(() => ({ ...state, refetch }), [state, refetch])
}

export const useDefineSchema = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defineSchema = async (payload: {
    schemaName: string
    collectionName: string
    schemaType: number
    description?: string
  }): Promise<string | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await dataGatewayService.schemas.create({
        schemaName: payload.schemaName,
        collectionName: payload.collectionName,
        projectKey: X_BLOCKS_KEY,
        schemaType: payload.schemaType,
        description: payload.description,
      })
      if (response.isSuccess) {
        return response.data?.itemId || null
      } else {
        setError(response.message || 'Failed to define schema')
        return null
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMsg)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { defineSchema, isLoading, error }
}

export const useSaveSchemaFields = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveSchemaFields = async (payload: Omit<SaveSchemaFieldsPayload, 'projectKey'>): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await dataGatewayService.schemas.saveFields({
        ...payload,
        projectKey: X_BLOCKS_KEY,
      })
      if (response.isSuccess) {
        await dataGatewayService.configuration.reload({ projectKey: X_BLOCKS_KEY })
        return true
      } else {
        setError(response.message || 'Failed to save schema fields')
        return false
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMsg)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { saveSchemaFields, isLoading, error }
}

export const useDeleteSchema = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteSchema = async (schemaId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await dataGatewayService.schemas.delete({ id: schemaId, projectKey: X_BLOCKS_KEY })
      if (response.isSuccess) {
        return true
      } else {
        setError(response.message || 'Failed to delete schema')
        return false
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMsg)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { deleteSchema, isLoading, error }
}

export const useChangeSecurity = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeSecurity = async (
    schemaId: string,
    accessLevel: number
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await dataGatewayService.dataAccess.changeSecurity({
        schemaId,
        accessLevel,
        projectKey: X_BLOCKS_KEY,
      })
      if (response.isSuccess) {
        return true
      } else {
        setError(response.message || 'Failed to change security')
        return false
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMsg)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { changeSecurity, isLoading, error }
}

export const useCreateAccessPolicy = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createAccessPolicy = async (payload: Omit<CreateAccessPolicyPayload, 'projectKey'>): Promise<string | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await dataGatewayService.dataAccess.createAccessPolicy({
        ...payload,
        projectKey: X_BLOCKS_KEY,
      })
      if (response.isSuccess) {
        return response.data?.itemId || null
      } else {
        setError(response.message || 'Failed to create access policy')
        return null
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMsg)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { createAccessPolicy, isLoading, error }
}

export const useUpdateAccessPolicy = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateAccessPolicy = async (payload: { itemId: string; isAllowPolicy?: boolean; priority?: number }): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await dataGatewayService.dataAccess.updateAccessPolicy({
        ...payload,
        projectKey: X_BLOCKS_KEY,
      })
      if (response.isSuccess) {
        return true
      } else {
        setError(response.message || 'Failed to update access policy')
        return false
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMsg)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { updateAccessPolicy, isLoading, error }
}

export const useGetAccessPolicies = (schemaName: string | null): UseDataGatewayResult<AccessPolicy[]> => {
  const { state, setLoading, setSuccess, setError } = useAsyncState<AccessPolicy[]>()

  const refetch = useCallback(async () => {
    if (!schemaName) return
    setLoading()
    try {
      const response = await dataGatewayService.dataAccess.getPolicies({
        schemaName,
        projectKey: X_BLOCKS_KEY,
      })
      if (response.isSuccess && response.data) {
        setSuccess(response.data)
      } else {
        setError(response.message || 'Failed to fetch access policies')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [schemaName, setLoading, setSuccess, setError])

  return useMemo(() => ({ ...state, refetch }), [state, refetch])
}

export const useCreateValidation = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createValidation = async (
    schemaId: string,
    fieldName: string,
    validations: ValidationRule[]
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await dataGatewayService.validation.create({
        projectKey: X_BLOCKS_KEY,
        schemaId,
        fieldName,
        validations,
      })
      if (response.isSuccess) {
        await dataGatewayService.configuration.reload({ projectKey: X_BLOCKS_KEY })
        return true
      } else {
        setError(response.message || 'Failed to create validation')
        return false
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMsg)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { createValidation, isLoading, error }
}

export const useGetSchemaValidations = (schemaId: string | null): UseDataGatewayResult<FieldValidation[]> => {
  const { state, setLoading, setSuccess, setError } = useAsyncState<FieldValidation[]>()

  const refetch = useCallback(async () => {
    if (!schemaId) return
    setLoading()
    try {
      const response = await dataGatewayService.validation.getSchemaValidations({
        schemaId,
        projectKey: X_BLOCKS_KEY,
      })
      if (response.isSuccess && response.data) {
        setSuccess(response.data)
      } else {
        setError(response.message || 'Failed to fetch validations')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [schemaId, setLoading, setSuccess, setError])

  return useMemo(() => ({ ...state, refetch }), [state, refetch])
}

export const useGetDmsFiles = (parentId?: string | null): UseDataGatewayResult<PaginatedResponse<DmsFile>> => {
  const { state, setLoading, setSuccess, setError } = useAsyncState<PaginatedResponse<DmsFile>>()

  const refetch = useCallback(async () => {
    setLoading()
    try {
      const response = await dataGatewayService.files.getDmsFiles({
        parentId: parentId || undefined,
        projectKey: X_BLOCKS_KEY,
        skip: 0,
        take: 50,
      })
      if (response.isSuccess && response.data) {
        setSuccess(response.data)
      } else {
        setError(response.message || 'Failed to fetch files')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [parentId, setLoading, setSuccess, setError])

  return useMemo(() => ({ ...state, refetch }), [state, refetch])
}

export const useUploadFile = () => {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map())

  const uploadFile = async (file: File): Promise<boolean> => {
    const fileId = `${file.name}-${Date.now()}`
    setUploads((prev) => {
      const newMap = new Map(prev)
      newMap.set(fileId, { fileName: file.name, progress: 0, status: 'uploading' })
      return newMap
    })

    try {
      const preSignedResponse = await dataGatewayService.files.getPreSignedUploadUrl({
        name: file.name,
        tags: undefined,
        accessModifier: 'Private',
        projectKey: X_BLOCKS_KEY,
      })

      if (!preSignedResponse.isSuccess || !preSignedResponse.data) {
        setUploads((prev) => {
          const newMap = new Map(prev)
          newMap.set(fileId, {
            fileName: file.name,
            progress: 0,
            status: 'error',
            error: preSignedResponse.message,
          })
          return newMap
        })
        return false
      }

      const { uploadUrl, fileId: s3FileId } = preSignedResponse.data

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setUploads((prev) => {
              const newMap = new Map(prev)
              newMap.set(fileId, { fileName: file.name, progress, status: 'uploading' })
              return newMap
            })
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploads((prev) => {
              const newMap = new Map(prev)
              newMap.set(fileId, { fileName: file.name, progress: 100, status: 'success' })
              return newMap
            })
            resolve()
          } else {
            reject(new Error('Upload failed'))
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', 'application/octet-stream')
        xhr.send(file)
      })

      await dataGatewayService.files.updateFileInfo({
        itemId: s3FileId,
        projectKey: X_BLOCKS_KEY,
      })

      return true
    } catch (err) {
      setUploads((prev) => {
        const newMap = new Map(prev)
        newMap.set(fileId, {
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
        })
        return newMap
      })
      return false
    }
  }

  const uploadToDms = async (file: File): Promise<boolean> => {
    const fileId = `${file.name}-${Date.now()}`
    setUploads((prev) => {
      const newMap = new Map(prev)
      newMap.set(fileId, { fileName: file.name, progress: 0, status: 'uploading' })
      return newMap
    })

    try {
      const formData = new FormData()
      formData.append('File', file)
      formData.append('Name', file.name)
      formData.append('AccessModifier', 'Private')
      formData.append('ProjectKey', X_BLOCKS_KEY)

      const response = await dataGatewayService.files.uploadToDms(formData)

      if (response.isSuccess) {
        setUploads((prev) => {
          const newMap = new Map(prev)
          newMap.set(fileId, { fileName: file.name, progress: 100, status: 'success' })
          return newMap
        })
        return true
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      setUploads((prev) => {
        const newMap = new Map(prev)
        newMap.set(fileId, {
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
        })
        return newMap
      })
      return false
    }
  }

  const createFolder = async (name: string, parentId?: string): Promise<boolean> => {
    try {
      const response = await dataGatewayService.files.createFolder({
        Name: name,
        ParentDirectoryId: parentId,
        ProjectKey: X_BLOCKS_KEY,
      })
      return response.isSuccess
    } catch {
      return false
    }
  }

  return { uploadFile, uploadToDms, createFolder, uploads }
}

export const useGraphQLData = <T>(
  schemaName: string,
  queryType: 'list' | 'single' = 'list'
) => {
  const { state, setLoading, setSuccess, setError } = useAsyncState<T | null>()

  const refetch = useCallback(
    async (variables?: Record<string, unknown>) => {
      setLoading()
      try {
        const queryName = queryType === 'list' ? `get${schemaName}s` : `get${schemaName}`
        const query = queryType === 'list'
          ? `query { ${queryName}(page: 1, pageSize: 20) { data { _id } totalCount } }`
          : `query { ${queryName}(id: $id) { _id } }`

        const result = await graphqlQuery<Record<string, T | { data: T[]; totalCount: number }>>(
          query,
          variables
        )

        const data = result[queryName]
        if (data) {
          setSuccess(data as T)
        } else {
          setSuccess(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'GraphQL error')
      }
    },
    [schemaName, queryType, setLoading, setSuccess, setError]
  )

  return useMemo(() => ({ ...state, refetch }), [state, refetch])
}

export const useGraphQLMutation = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeMutation = async <T>(
    mutation: string,
    variables?: Record<string, unknown>
  ): Promise<T | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await graphqlMutation<T>(mutation, variables)
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Mutation failed'
      setError(errorMsg)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { executeMutation, isLoading, error }
}

export const useDataGateway = () => ({
  useGetSchemas,
  useGetSchemaById,
  useDefineSchema,
  useSaveSchemaFields,
  useChangeSecurity,
  useCreateAccessPolicy,
  useUpdateAccessPolicy,
  useGetAccessPolicies,
  useCreateValidation,
  useGetSchemaValidations,
  useGetDmsFiles,
  useUploadFile,
  useGraphQLData,
  useGraphQLMutation,
})

export default useDataGateway
