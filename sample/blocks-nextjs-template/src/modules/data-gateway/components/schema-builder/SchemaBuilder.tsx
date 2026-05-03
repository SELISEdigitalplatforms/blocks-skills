'use client'

import { useState } from 'react'
import { Plus, Trash2, Lock, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Schema, SchemaField } from '../../types/data-gateway.types'
import { PRIMITIVE_FIELD_TYPES } from '../../types/data-gateway.types'
import { findChildSchemaByType, isChildType } from '../../utils/schema.utils'

interface FieldRowProps {
  index: number
  field: SchemaField
  onChange: (index: number, field: SchemaField) => void
  onRemove: (index: number) => void
  canRemove?: boolean
  isDefaultField?: boolean
  dtoSchemas?: Schema[]
  isChildType?: boolean
  childSchema?: Schema
  onToggleExpand?: (index: number) => void
  isExpanded?: boolean
}

export const FieldRow = ({
  index,
  field,
  onChange,
  onRemove,
  canRemove = true,
  isDefaultField = false,
  dtoSchemas = [],
  isChildType: isChild = false,
  childSchema,
  onToggleExpand,
  isExpanded = false,
}: FieldRowProps) => {
  const childTypes = dtoSchemas.filter(s => s.schemaType === 2)

  const handleTypeSelect = (value: string | null) => {
    if (!value) return
    const selectedSchema = dtoSchemas.find(s => s.id === value || s.schemaName === value)
    const newFields = selectedSchema?.fields || []

    onChange(index, {
      ...field,
      type: value,
      fields: newFields,
    })
  }

  return (
    <div className={cn(
      'border rounded-lg bg-neutral-800',
      isDefaultField ? 'border-blue-500/30' : 'border-white/10'
    )}>
      <div className="flex items-center gap-3 p-3">
        <div className="relative flex-1 flex items-center gap-2">
          {isChild && onToggleExpand && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onToggleExpand(index)}
              className="h-6 w-6 p-0 text-purple-400 hover:bg-white/10"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          )}

          <Input
            type="text"
            placeholder="Field name"
            value={field.name}
            onChange={(e) => onChange(index, { ...field, name: e.target.value })}
            disabled={isDefaultField}
            className={cn(
              'flex-1',
              isDefaultField
                ? 'border-blue-500/30 text-blue-400/70 bg-blue-500/10'
                : 'border-white/10'
            )}
          />
        </div>

        <Select value={field.type} onValueChange={handleTypeSelect} disabled={isDefaultField}>
          <SelectTrigger className={cn(
            'min-w-[140px] h-10',
            isDefaultField
              ? 'border-blue-500/30 bg-blue-500/10 text-blue-400/70'
              : isChild
              ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
              : 'border-white/10'
          )}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-neutral-800 border-white/10 text-white">
            <div className="px-2 py-1.5 text-xs font-medium text-white/50">Primitive Types</div>
            {PRIMITIVE_FIELD_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
            {childTypes.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-white/50">Child Types (DTO)</div>
                {childTypes.map((schema) => (
                  <SelectItem key={schema.id} value={schema.schemaName || ''}>
                    {schema.schemaName}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-1.5 text-sm text-white/70 whitespace-nowrap">
          <Checkbox
            checked={field.isArray}
            onCheckedChange={(checked) => onChange(index, { ...field, isArray: checked === true })}
            disabled={isDefaultField}
            className={cn('border-white/20', isDefaultField ? 'opacity-50' : '')}
          />
          Array
        </label>

        {isDefaultField ? (
          <div className="flex items-center justify-center w-8 h-8 text-blue-400" title="Default field - cannot be removed">
            <Lock className="w-4 h-4" />
          </div>
        ) : canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            className="text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        ) : null}
      </div>

      {isChild && isExpanded && field.fields && field.fields.length > 0 && (
        <div className="px-4 pb-3 pt-2 border-t border-white/10">
          <p className="text-xs text-purple-400 mb-2">Nested Fields from {childSchema?.schemaName || 'DTO'}:</p>
          <div className="space-y-2 bg-neutral-900/50 rounded-lg p-3">
            {field.fields.map((nestedField, nestedIndex) => (
              <div key={nestedIndex} className="flex items-center gap-3 text-sm">
                <span className="text-white/70 w-1/3 truncate">{nestedField.name || '(unnamed)'}</span>
                <span className="text-white/50 w-1/3 truncate">{nestedField.type}</span>
                <span className="text-white/30 w-1/3">
                  {nestedField.isArray ? 'Array' : 'Single'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface SchemaBuilderProps {
  fields: SchemaField[]
  onChange: (fields: SchemaField[]) => void
  isLoading?: boolean
  nonEditableFields?: SchemaField[]
  dtoSchemas?: Schema[]
  schemaType?: number
}

export const SchemaBuilder = ({
  fields,
  onChange,
  isLoading,
  nonEditableFields = [],
  dtoSchemas = [],
  schemaType,
}: SchemaBuilderProps) => {
  const [expandedFields, setExpandedFields] = useState<Set<number>>(new Set())

  const handleFieldChange = (index: number, updatedField: SchemaField) => {
    const newFields = [...fields]
    newFields[index] = updatedField
    onChange(newFields)
  }

  const handleRemoveField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index))
  }

  const handleAddField = () => {
    onChange([
      ...fields,
      {
        name: '',
        type: 'String',
        isArray: false,
      },
    ])
  }

  const handleToggleExpand = (index: number) => {
    setExpandedFields(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const hasAnyFields = nonEditableFields.length > 0 || fields.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-white/70">Fields</h3>
          {nonEditableFields.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
              {nonEditableFields.length} system field{nonEditableFields.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Button
          type="button"
          onClick={handleAddField}
          disabled={isLoading}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Field
        </Button>
      </div>

      {!hasAnyFields ? (
        <div className="border border-dashed border-white/10 rounded-lg p-8 text-center">
          <p className="text-sm text-white/50">No fields defined yet</p>
          <Button
            type="button"
            variant="link"
            onClick={handleAddField}
            disabled={isLoading}
            className="mt-2 text-white"
          >
            Add your first field
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {nonEditableFields.length > 0 && (
            <Accordion multiple className="border border-blue-500/30 rounded-lg bg-blue-500/5">
              <AccordionItem value="non-editable-fields" className="border-b-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline text-white">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">
                      System Fields ({nonEditableFields.length})
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-0">
                  <div className="space-y-2">
                    {nonEditableFields.map((field, index) => (
                      <FieldRow
                        key={`non-editable-${index}`}
                        index={index}
                        field={field}
                        onChange={() => {}}
                        onRemove={() => {}}
                        canRemove={false}
                        isDefaultField={true}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {fields.map((field, index) => {
            const childSchema = findChildSchemaByType(dtoSchemas, field.type)
            const isChild = isChildType(dtoSchemas, field.type)
            const isExpanded = expandedFields.has(index)

            return (
              <FieldRow
                key={`editable-${index}`}
                index={index}
                field={field}
                onChange={handleFieldChange}
                onRemove={handleRemoveField}
                canRemove={true}
                isDefaultField={false}
                dtoSchemas={dtoSchemas}
                isChildType={isChild}
                childSchema={childSchema}
                onToggleExpand={isChild ? handleToggleExpand : undefined}
                isExpanded={isExpanded}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SchemaBuilder
