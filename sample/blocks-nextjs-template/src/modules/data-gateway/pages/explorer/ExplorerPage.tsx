'use client'

import { useState, useCallback, useRef } from 'react'
import { Database } from 'lucide-react'
import { graphqlQuery, graphqlMutation } from '@/lib/graphql'
import { useGetSchemas } from '../../hooks/useDataGateway'
import { DataExplorer } from '../../components/data-explorer/DataExplorer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface RecordData {
  _id?: string
  [key: string]: unknown
}

export const ExplorerPage = () => {
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<RecordData[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const { data: schemasData } = useGetSchemas({ PageSize: 100 })
  const schemas = schemasData?.items || []

  const fetchData = useCallback(async () => {
    if (!selectedSchema) return

    setIsLoading(true)
    setError(null)

    try {
      const queryName = `get${selectedSchema}s`
      const query = `query { ${queryName}(page: ${page}, pageSize: 20) { data { _id } totalCount } }`
      const result = await graphqlQuery<Record<string, { data: RecordData[]; totalCount: number }>>(query)

      if (isMountedRef.current) {
        const schemaData = result[queryName]
        if (schemaData) {
          setData(schemaData.data)
          setTotalCount(schemaData.totalCount)
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [selectedSchema, page])

  const handleSchemaChange = useCallback(async (schema: string | null) => {
    setSelectedSchema(schema)
    setPage(1)
    setData([])
    setTotalCount(0)
    if (schema) {
      isMountedRef.current = true
      await fetchData()
    }
  }, [fetchData])

  const handleRefresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async (recordData: RecordData): Promise<boolean> => {
    if (!selectedSchema) return false

    try {
      const mutationName = `create${selectedSchema}`
      const inputFields = Object.entries(recordData)
        .filter(([key]) => key !== '_id')
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ')

      const mutation = `mutation { ${mutationName}(input: { ${inputFields} }) { _id } }`
      await graphqlMutation(mutation)
      return true
    } catch {
      return false
    }
  }

  const handleUpdate = async (id: string, recordData: Partial<RecordData>): Promise<boolean> => {
    if (!selectedSchema) return false

    try {
      const mutationName = `update${selectedSchema}`
      const inputFields = Object.entries(recordData)
        .filter(([key]) => key !== '_id')
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ')

      const mutation = `mutation { ${mutationName}(id: "${id}", input: { ${inputFields} }) { _id } }`
      await graphqlMutation(mutation)
      return true
    } catch {
      return false
    }
  }

  const handleDelete = async (id: string): Promise<boolean> => {
    if (!selectedSchema) return false

    try {
      const mutationName = `delete${selectedSchema}`
      const mutation = `mutation { ${mutationName}(id: "${id}") { _id } }`
      await graphqlMutation(mutation)
      return true
    } catch {
      return false
    }
  }

  const selectedSchemaData = schemas.find((s) => s.schemaName === selectedSchema)
  const schemaFields = selectedSchemaData?.fields?.map((f) => ({
    name: f.name,
    type: f.type,
    isArray: f.isArray,
    description: f.description,
  })) || []

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-neutral-900">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Explorer</h1>
          <p className="text-sm text-white/50 mt-1">
            Browse and manage your data
          </p>
        </div>
        <Select value={selectedSchema || ''} onValueChange={async (value) => {
          await handleSchemaChange(value || null)
        }}>
          <SelectTrigger className="min-w-[200px] border-white/10 bg-neutral-800 text-white">
            <SelectValue placeholder="Select a schema..." />
          </SelectTrigger>
          <SelectContent className="bg-neutral-800 border-white/10 text-white">
            {schemas.map((schema) => (
              <SelectItem key={schema.id} value={schema.schemaName || ''}>
                {schema.schemaName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 p-6">
        {!selectedSchema ? (
          <div className="flex flex-col items-center justify-center h-full border border-white/10 rounded-lg bg-neutral-900/50">
            <Database className="w-12 h-12 text-white/40 mb-4" />
            <p className="text-white/50">Select a schema to view its data</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full border border-white/10 rounded-lg bg-red-500/10">
            <p className="text-red-400 mb-2">{error}</p>
            <Button
              variant="link"
              onClick={fetchData}
              className="text-white"
            >
              Try again
            </Button>
          </div>
        ) : (
          <DataExplorer
            schemaName={selectedSchema}
            schemaFields={schemaFields}
            data={data}
            totalCount={totalCount}
            page={page}
            pageSize={20}
            isLoading={isLoading}
            onPageChange={setPage}
            onRefresh={handleRefresh}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}

export default ExplorerPage
