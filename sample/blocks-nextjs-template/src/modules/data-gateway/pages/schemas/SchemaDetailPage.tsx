'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, AlertCircle } from 'lucide-react'
import { useGetSchemaById, useGetSchemas, useDefineSchema, useSaveSchemaFields } from '../../hooks/useDataGateway'
import { SchemaBasicInfo } from '../../components/schema-basic-info/schema-basic-info'
import { SchemasSidebar } from '../../components/schema-sidebar/schemas-sidebar'
import SchemaStructureTable from '../../components/schema-structure/schema-structure-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SchemaType } from '../../types/data-gateway.types'

export const SchemaDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const initialSchemaId = params.id as string | null

  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(initialSchemaId)
  const [showNewSchema, setShowNewSchema] = useState(false)
  const [newSchemaName, setNewSchemaName] = useState('')
  const [newSchemaType, setNewSchemaType] = useState<'Entity' | 'DTO'>('Entity')

  const { data: schemasData, isLoading: schemasLoading, refetch: refetchSchemas } = useGetSchemas({ PageSize: 100 })
  const { data: selectedSchema, isLoading: schemaLoading, refetch: refetchSchema } = useGetSchemaById(selectedSchemaId)
  const { saveSchemaFields, isLoading: saveLoading, error: saveError } = useSaveSchemaFields()
  const { defineSchema, isLoading: isCreating, error: createError } = useDefineSchema()

  const schemas = schemasData?.items || []

  const generateEntityName = (name: string): string => {
    const formattedName = name
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
    return `sb_${formattedName}s`
  }

  const newCollectionName = newSchemaType === 'Entity' ? generateEntityName(newSchemaName) : ''
  const schemaTypeToNumber = (type: 'Entity' | 'DTO'): 1 | 2 => type === 'Entity' ? 1 : 2

  const handleCreateSchema = async (e: React.FormEvent) => {
    e.preventDefault()

    const schemaId = await defineSchema({
      schemaName: newSchemaName,
      collectionName: newSchemaType === 'Entity' ? newCollectionName : '',
      schemaType: schemaTypeToNumber(newSchemaType),
    })

    if (schemaId) {
      setNewSchemaName('')
      setNewSchemaType('Entity')
      setShowNewSchema(false)
      // Force navigation after modal closes
      setTimeout(() => {
        router.push(`/data/data-gateway/schemas/${schemaId}`)
      }, 150)
    }
  }

  useEffect(() => {
    if (initialSchemaId) {
      setSelectedSchemaId(initialSchemaId)
    }
  }, [initialSchemaId])

  const handleSchemaSelect = (schemaId: string | null) => {
    setSelectedSchemaId(schemaId)
    if (schemaId) {
      router.push(`/data/data-gateway/schemas/${schemaId}`)
    }
  }

  const handleDeleteSuccess = () => {
    setSelectedSchemaId(null)
    router.push('/data/data-gateway/schemas')
    refetchSchemas()
  }

  return (
    <div className="flex h-full dark">
      <div className={`shrink-0 ${selectedSchemaId ? 'hidden lg:block' : 'block'}`}>
        <SchemasSidebar
          schemas={schemas}
          selectedSchemaId={selectedSchemaId}
          onSchemaSelect={handleSchemaSelect}
          isLoading={schemasLoading}
        />
      </div>

      <div className={`flex-1 overflow-auto ${!selectedSchemaId ? 'hidden lg:flex' : 'flex'} flex-col`}>
        <div className="flex items-center gap-4 p-6 border-b border-white/10 bg-neutral-900">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              {selectedSchema?.schemaName || 'Schema Details'}
            </h1>
            {selectedSchema?.collectionName && (
              <p className="text-sm text-white/50">{selectedSchema.collectionName}</p>
            )}
          </div>
        </div>

        <div className="flex-1 p-6">
          {schemaLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-white" />
            </div>
          ) : selectedSchema ? (
            <div className="space-y-4">
              {saveError && (
                <div className="p-3 text-sm text-red-400 bg-red-500/10 rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {saveError}
                </div>
              )}
              <SchemaBasicInfo
                schema={selectedSchema}
                onDeleteSuccess={handleDeleteSuccess}
                isLoading={schemaLoading}
              />
              <SchemaStructureTable
                schema={selectedSchema}
                isLoading={schemaLoading}
                onOpenStandaloneSchemaEditor={(schemaId) => {
                  router.push(`/data/data-gateway/schemas/${schemaId}`)
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-white/50 mb-4">Select a schema from the sidebar to view its details.</p>
              <Button onClick={() => setShowNewSchema(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create New Schema
              </Button>
            </div>
          )}
        </div>
      </div>

      {showNewSchema && (
        <Dialog open={showNewSchema} onOpenChange={(open) => setShowNewSchema(open)}>
          <DialogContent
            className="bg-neutral-900 border-white/10 text-white max-w-md"
            onClose={() => setShowNewSchema(false)}
          >
            <DialogHeader>
              <DialogTitle className="text-white">Create New Schema</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateSchema} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Schema Name</label>
                <Input
                  type="text"
                  value={newSchemaName}
                  onChange={(e) => setNewSchemaName(e.target.value)}
                  placeholder="e.g., Product"
                  className="w-full border-white/10 bg-neutral-800 text-white placeholder:text-white/30"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Schema Type</label>
                <Select value={newSchemaType} onValueChange={(value) => setNewSchemaType(value as 'Entity' | 'DTO')}>
                  <SelectTrigger className="w-full border-white/10 bg-neutral-800 text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-white/10 text-white">
                    <SelectItem value="Entity">Entity</SelectItem>
                    <SelectItem value="DTO">DTO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newSchemaType === 'Entity' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/70">Entity Name</label>
                  <Input
                    type="text"
                    value={newCollectionName}
                    disabled
                    className="w-full border-white/10 bg-neutral-800 text-white cursor-not-allowed"
                  />
                  <p className="text-xs text-white/40">Auto-generated from schema name</p>
                </div>
              )}

              {createError && (
                <div className="p-3 text-sm text-red-400 bg-red-500/10 rounded-md">
                  {createError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setShowNewSchema(false)} className="text-white hover:bg-white/10">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || !newSchemaName || (newSchemaType === 'Entity' && !newCollectionName)}
                  className="bg-white text-neutral-950 hover:bg-white/90"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default SchemaDetailPage
