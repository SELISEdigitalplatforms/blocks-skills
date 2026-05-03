'use client'

import React, { useEffect, useState } from 'react'
import { useGetSchemaById } from '../../hooks/useDataGateway'
import type { Schema, SchemaField } from '../../types/data-gateway.types'
import { DEFAULT_NON_EDITABLE_FIELD_NAMES } from '../../types/data-gateway.types'
import { SchemaDesktopRow } from './schema-desktop-row'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { findChildSchemaByType, isChildType } from '../../utils/schema.utils'

interface ChildSchemaExpandableContentProps {
  schemaId: string
  projectKey: string
  rootSchemaId?: string
  parentSchemaId?: string
  parentPropertyName?: string
  ancestorPath?: string[]
  parentFieldWithNested?: SchemaField | null
  hideAccessValidation?: boolean
  policyEntitySchemaName?: string
  onOpenStandaloneSchemaEditor?: (schemaId: string) => void
}

export function ChildSchemaExpandableContent({
  schemaId,
  projectKey,
  rootSchemaId,
  parentSchemaId,
  parentPropertyName,
  ancestorPath = [],
  parentFieldWithNested,
  hideAccessValidation = false,
  policyEntitySchemaName,
  onOpenStandaloneSchemaEditor,
}: ChildSchemaExpandableContentProps) {
  const [schemaDetails, setSchemaDetails] = useState<Schema | null>(null)
  const { data: schemaData, isLoading } = useGetSchemaById(schemaId)
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null)
  const [openTypePopoverIndex, setOpenTypePopoverIndex] = useState<number | null>(null)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    if (schemaData) {
      setSchemaDetails(schemaData)
    }
  }, [schemaData])

  const handleToggleExpand = (index: number) => {
    setExpandedRowIndex((prev) => (prev === index ? null : index))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    )
  }

  if (!schemaDetails || !schemaDetails.fields) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        No fields available
      </div>
    )
  }

  const totalFieldLength = schemaDetails.fields?.length || 0
  const readonlyFieldsCount = schemaDetails.schemaType === 1
    ? schemaDetails.fields.filter((p) => DEFAULT_NON_EDITABLE_FIELD_NAMES.includes(p.name)).length
    : 0
  const customFieldsCount = schemaDetails.schemaType === 1 ? totalFieldLength - readonlyFieldsCount : 0
  const shouldHideAccessValidation = hideAccessValidation
  const visibleColumnCount = 7 + (shouldHideAccessValidation ? 0 : 1)

  return (
    <div className="min-w-0 max-w-full rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {parentPropertyName ? `${parentPropertyName} - ` : ''}{schemaDetails.schemaName}
          </span>
          {ancestorPath && ancestorPath.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {ancestorPath.join('.')}
            </span>
          )}
        </div>
      </div>
      <div className="overflow-auto max-h-[400px]">
        <Table className="w-full table-fixed text-sm">
          {!shouldHideAccessValidation && (
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "5%" }} />
            </colgroup>
          )}
          <TableHeader>
            <TableRow>
              <TableHead>Property name</TableHead>
              <TableHead>Property type</TableHead>
              <TableHead className="text-center">IsArray</TableHead>
              <TableHead className="text-center">IsPII</TableHead>
              <TableHead className="text-center">IsUnique</TableHead>
              <TableHead className="text-left">Description</TableHead>
              {!shouldHideAccessValidation && <TableHead>Access | Validation</TableHead>}
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schemaDetails.fields.map((field, index) => {
              const childSchema = findChildSchemaByType([], field.type)
              const isChild = isChildType([], field.type)
              const isExpanded = expandedRowIndex === index
              const fieldKey = `${schemaId}-${field.name || index}`

              return (
                <React.Fragment key={fieldKey}>
                  <SchemaDesktopRow
                    field={{ ...field, id: field.name }}
                    index={index}
                    isEditMode={false}
                    isReadOnly={true}
                    isNewField={false}
                    selectedRows={{}}
                    onRowSelect={() => {}}
                    onNameChange={() => {}}
                    onTypeChange={() => {}}
                    onArrayChange={() => {}}
                    onPiiChange={() => {}}
                    onUniqueChange={() => {}}
                    onDescriptionChange={() => {}}
                    onDuplicate={() => {}}
                    onDelete={() => {}}
                    schemaId={schemaId}
                    schemaName={schemaDetails.schemaName}
                    schemaType={schemaDetails.schemaType}
                    openTypePopoverIndex={openTypePopoverIndex}
                    setOpenTypePopoverIndex={setOpenTypePopoverIndex}
                    schemaItems={[]}
                    onTypeSearchChange={setSearchText}
                    searchText={searchText}
                    isExpanded={isExpanded}
                    onToggleExpand={isChild ? handleToggleExpand : undefined}
                    childSchema={childSchema}
                    totalFields={schemaDetails.fields?.length || 0}
                    totalFieldsLength={totalFieldLength}
                    readonlyFieldsCount={readonlyFieldsCount}
                    customFieldsCount={customFieldsCount}
                    showAccessColumn={false}
                    showAccessValidationColumn={!shouldHideAccessValidation}
                    visibleColumnCount={visibleColumnCount}
                    originalFieldFromSchema={parentFieldWithNested}
                  />
                  {isExpanded && childSchema && (
                    <TableRow>
                      <TableCell
                        colSpan={visibleColumnCount}
                        className="bg-muted/30 p-4 align-top dark:bg-muted/25"
                      >
                        <ChildSchemaExpandableContent
                          schemaId={childSchema.id}
                          projectKey={projectKey}
                          rootSchemaId={rootSchemaId}
                          parentSchemaId={schemaId}
                          parentPropertyName={field.name}
                          ancestorPath={[...ancestorPath, field.name]}
                          parentFieldWithNested={parentFieldWithNested}
                          hideAccessValidation={shouldHideAccessValidation}
                          policyEntitySchemaName={policyEntitySchemaName}
                          onOpenStandaloneSchemaEditor={onOpenStandaloneSchemaEditor}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ChildSchemaExpandableContent
