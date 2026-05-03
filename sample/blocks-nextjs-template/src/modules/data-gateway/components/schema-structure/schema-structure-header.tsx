'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Edit3, Save, X, Copy } from 'lucide-react'

interface SchemaStructureHeaderProps {
  isEditMode: boolean
  isDirty: boolean
  isValid: boolean
  hasSelectedRows: boolean
  selectedFieldEntriesLength: number
  fieldsLength: number
  schemaName: string
  schemaType: number
  onEditToggle: () => void
  onSave?: () => void
  onCancel?: () => void
  onBulkDuplicate?: () => void
  onBulkDelete?: () => void
  onSelectAll?: (checked: boolean) => void
}

export function SchemaStructureHeader({
  isEditMode,
  isDirty,
  isValid,
  hasSelectedRows,
  selectedFieldEntriesLength,
  fieldsLength,
  schemaName,
  schemaType,
  onEditToggle,
  onSave,
  onCancel,
  onBulkDuplicate,
  onBulkDelete,
}: SchemaStructureHeaderProps) {
  const customFieldsCount = schemaType === 1 ? fieldsLength - 8 : fieldsLength

  return (
    <div className="flex flex-col gap-4 border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-foreground">Schema Structure</h3>
          {schemaType === 1 && (
            <span className="text-sm text-muted-foreground">
              {customFieldsCount} custom properties
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasSelectedRows && isEditMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkDuplicate}
                className="gap-1"
              >
                <Copy className="h-4 w-4" />
                Duplicate ({selectedFieldEntriesLength})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkDelete}
                className="gap-1 text-destructive hover:text-destructive"
              >
                Delete ({selectedFieldEntriesLength})
              </Button>
            </>
          )}

          {!isEditMode ? (
            <Button
              variant="default"
              size="sm"
              onClick={onEditToggle}
              className="gap-1"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel || onEditToggle}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onSave}
                disabled={!isDirty || !isValid}
                className="gap-1"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SchemaStructureHeader
