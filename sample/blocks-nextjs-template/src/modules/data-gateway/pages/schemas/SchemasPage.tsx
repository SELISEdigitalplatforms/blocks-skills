'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Database } from 'lucide-react'
import { useGetSchemas, useDefineSchema } from '../../hooks/useDataGateway'
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
import { SchemasSidebar } from '../../components/schema-sidebar/schemas-sidebar'
import type { SchemaType } from '../../types/data-gateway.types'

interface NewSchemaDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const NewSchemaDialog = ({ isOpen, onClose, onSuccess }: NewSchemaDialogProps) => {
  const router = useRouter()
  const [schemaName, setSchemaName] = useState('')
  const [schemaType, setSchemaType] = useState<'Entity' | 'DTO'>('Entity')
  const { defineSchema, isLoading, error } = useDefineSchema()

  const generateEntityName = (name: string): string => {
    const formattedName = name
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
    return `sb_${formattedName}s`
  }

  const collectionName = schemaType === 'Entity' ? generateEntityName(schemaName) : ''
  const schemaTypeToNumber = (type: 'Entity' | 'DTO'): 1 | 2 => type === 'Entity' ? 1 : 2

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const schemaId = await defineSchema({
      schemaName,
      collectionName: schemaType === 'Entity' ? collectionName : '',
      schemaType: schemaTypeToNumber(schemaType),
    })

    if (schemaId) {
      setSchemaName('')
      setSchemaType('Entity')
      onClose()
      // Force navigation after modal closes
      setTimeout(() => {
        router.push(`/data/data-gateway/schemas/${schemaId}`)
      }, 150)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-neutral-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Schema</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Schema Name</label>
            <Input
              type="text"
              value={schemaName}
              onChange={(e) => setSchemaName(e.target.value)}
              placeholder="e.g., Product"
              className="w-full border-white/10 bg-neutral-800 text-white placeholder:text-white/30"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Schema Type</label>
            <Select value={schemaType} onValueChange={(value) => setSchemaType(value as 'Entity' | 'DTO')}>
              <SelectTrigger className="w-full border-white/10 bg-neutral-800 text-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-white/10 text-white">
                <SelectItem value="Entity">Entity</SelectItem>
                <SelectItem value="DTO">DTO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {schemaType === 'Entity' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Entity Name</label>
              <Input
                type="text"
                value={collectionName}
                disabled
                className="w-full border-white/10 bg-neutral-800 text-white cursor-not-allowed"
              />
              <p className="text-xs text-white/40">Auto-generated from schema name</p>
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-500/10 rounded-md">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={onClose} className="text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !schemaName || (schemaType === 'Entity' && !collectionName)}
              className="bg-white text-neutral-950 hover:bg-white/90"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const SchemasPage = () => {
  const router = useRouter()
  const [showNewSchema, setShowNewSchema] = useState(false)
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null)

  const { data: schemasData, isLoading, error, refetch } = useGetSchemas({ PageSize: 100 })

  const schemas = schemasData?.items || []

  const handleSchemaSelect = (schemaId: string | null) => {
    setSelectedSchemaId(schemaId)
    if (schemaId) {
      router.push(`/data/data-gateway/schemas/${schemaId}`)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 dark">
      <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full min-w-0 items-center justify-between gap-3 xl:w-auto xl:justify-start">
            <h3 className="min-w-0 text-white text-xl font-bold tracking-tight max-xl:truncate md:text-2xl">
              Data Gateway
            </h3>
          </div>
          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNewSchema(true)}
              className="flex items-center gap-2 text-white hover:text-white/60"
            >
              <Plus className="h-4 w-4" />
              Add Schema
            </Button>
          </div>
        </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className={`shrink-0 ${selectedSchemaId ? 'hidden lg:block' : 'block'}`}>
          <SchemasSidebar
            schemas={schemas}
            selectedSchemaId={selectedSchemaId}
            onSchemaSelect={handleSchemaSelect}
            isLoading={isLoading}
          />
        </div>

        <div className={`flex-1 ${!selectedSchemaId ? 'hidden lg:flex' : 'flex'} flex-col items-center justify-center min-h-[400px]`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-red-400 mb-2">{error}</p>
              <Button variant="link" onClick={refetch} className="text-white">
                Try again
              </Button>
            </div>
          ) : schemas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Database className="w-12 h-12 text-white/40 mb-4" />
              <p className="text-white/50 mb-4">No schemas found</p>
              <Button onClick={() => setShowNewSchema(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create your first schema
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Database className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/50 mb-2">Select a schema from the sidebar</p>
              <p className="text-sm text-white/30">or create a new one to get started</p>
            </div>
          )}
        </div>
      </div>

      <NewSchemaDialog
        isOpen={showNewSchema}
        onClose={() => setShowNewSchema(false)}
        onSuccess={refetch}
      />
    </div>
  )
}

export default SchemasPage
