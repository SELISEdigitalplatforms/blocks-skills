'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Database, Plus, Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import type { Schema } from '../../types/data-gateway.types'

interface SchemasSidebarProps {
  schemas: Schema[]
  selectedSchemaId: string | null
  onSchemaSelect: (schemaId: string | null) => void
  isLoading?: boolean
}

export function SchemasSidebar({
  schemas,
  selectedSchemaId,
  onSchemaSelect,
  isLoading,
}: SchemasSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'entity' | 'child'>('all')

  const filteredSchemas = useMemo(() => {
    return schemas.filter((schema) => {
      const matchesSearch = schema.schemaName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesType =
        activeTab === 'all' ||
        (activeTab === 'entity' && schema.schemaType === 1) ||
        (activeTab === 'child' && schema.schemaType === 2)
      return matchesSearch && matchesType
    })
  }, [schemas, searchQuery, activeTab])

  const entityCount = schemas.filter((s) => s.schemaType === 1).length
  const childCount = schemas.filter((s) => s.schemaType === 2).length

  return (
    <div className="flex h-full w-72 flex-col border-r border-white/10 bg-neutral-900">
      <div className="flex flex-col gap-3 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <Input
            type="text"
            placeholder="Search schemas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-1">
          <Button
            size="sm"
            variant={activeTab === 'all' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('all')}
            className={cn(
              'flex-1 text-xs',
              activeTab === 'all'
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white',
            )}
          >
            All ({schemas.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'entity' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('entity')}
            className={cn(
              'flex-1 text-xs',
              activeTab === 'entity'
                ? 'bg-blue-500 text-white hover:bg-blue-500/90'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white',
            )}
          >
            Entity ({entityCount})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'child' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('child')}
            className={cn(
              'flex-1 text-xs',
              activeTab === 'child'
                ? 'bg-purple-500 text-white hover:bg-purple-500/90'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white',
            )}
          >
            Child ({childCount})
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : filteredSchemas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <Database className="h-8 w-8 text-white/50 mb-2" />
            <p className="text-sm text-white/50">No schemas found</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredSchemas.map((schema) => (
              <Button
                key={schema.id}
                variant="ghost"
                onClick={() => onSchemaSelect(schema.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm h-auto justify-start',
                  selectedSchemaId === schema.id
                    ? 'bg-white/10 text-white hover:bg-white/10'
                    : 'text-white/70 hover:bg-white/5 hover:text-white',
                )}
              >
                <Database className="h-4 w-4 shrink-0" />
                <span className="truncate">{schema.schemaName}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'ml-auto shrink-0 text-[10px] py-0 px-1.5',
                    schema.schemaType === 1
                      ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                      : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/20',
                  )}
                >
                  {schema.schemaType === 1 ? 'Entity' : 'Child'}
                </Badge>
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

export default SchemasSidebar
