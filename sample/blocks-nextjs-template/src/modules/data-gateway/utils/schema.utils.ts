import type { Schema, SchemaField } from '../types/data-gateway.types'
import { PRIMITIVE_FIELD_TYPES } from '../types/data-gateway.types'

export const findChildSchemaByType = (
  schemaItems: Schema[],
  type: string | undefined
): Schema | undefined =>
  schemaItems.find(
    (s) => s.schemaName?.trim().toLowerCase() === type?.trim().toLowerCase()
  )

export const isPrimitiveType = (type: string): boolean =>
  PRIMITIVE_FIELD_TYPES.includes(type as typeof PRIMITIVE_FIELD_TYPES[number])

export const isChildType = (
  schemaItems: Schema[],
  type: string | undefined
): boolean => {
  if (!type) return false
  return !isPrimitiveType(type) && !!findChildSchemaByType(schemaItems, type)
}

export const normalizeSchemaFields = (fields: SchemaField[] = []): SchemaField[] =>
  fields.map((field) => ({
    ...field,
    fields: field.fields?.length ? normalizeSchemaFields(field.fields) : undefined,
  }))

export const getDefaultProperty = (): SchemaField => ({
  name: '',
  type: 'String',
  isArray: false,
})
