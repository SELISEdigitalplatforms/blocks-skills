'use server'

import { revalidatePath } from 'next/cache'
import {
  defineSchema,
  saveSchemaFields,
  changeSecurity,
  createAccessPolicy,
  reloadConfiguration,
} from '@/lib/services/data-management.service'

const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY ?? ''
import type {
  SchemaField,
  DefineSchemaPayload,
  SaveSchemaFieldsPayload,
  ChangeSecurityPayload,
  CreateAccessPolicyPayload,
  PolicyRuleGroup,
  AccessLevel,
  PolicyOperation,
} from '@/lib/types/data-management.types'

const OPERATION_MAP: Record<string, PolicyOperation> = {
  Read: 0,
  Create: 1,
  Update: 2,
  Delete: 3,
  All: 4,
}

const ACCESS_LEVEL_MAP: Record<string, AccessLevel> = {
  Public: 0,
  Private: 1,
  RoleBased: 2,
  Custom: 2,
}

function buildRuleGroup(roles: string[]): PolicyRuleGroup {
  return {
    logicalOperator: 1,
    rules: roles.map((role) => ({
      leftSource: 1,
      leftOperand: 'role',
      operator: 0,
      rightSource: 0,
      rightOperand: role,
    })),
    nestedGroups: [],
  }
}

interface DefineSchemaInput {
  collectionName: string
  schemaName: string
  schemaType: 1 | 2
  description?: string
  fields: SchemaField[]
  securityType?: 'Public' | 'Private' | 'RoleBased' | 'Custom'
  accessPolicies?: {
    policyName: string
    allowedRoles: string[]
    operations: ('Read' | 'Create' | 'Update' | 'Delete' | 'All')[]
    priority?: number
    isAllowPolicy?: boolean
  }[]
  validations?: {
    fieldName: string
    rules: { type: number; value?: unknown; secondaryValue?: unknown; errorMessage: string; isActive: boolean }[]
  }[]
}

export async function defineSchemaAction(input: DefineSchemaInput) {
  if (input.fields.length === 0) {
    return { success: false, error: 'At least one field is required to create a schema' }
  }

  const definePayload: DefineSchemaPayload = {
    collectionName: input.collectionName,
    schemaName: input.schemaName,
    projectKey: X_BLOCKS_KEY,
    schemaType: input.schemaType,
    description: input.description,
    fields: input.fields,
  }

  const schemaRes = await defineSchema(definePayload)

  if (!schemaRes.isSuccess || !schemaRes.data?.id) {
    return { success: false, error: schemaRes.message }
  }

  const schemaId = schemaRes.data.id

  const fieldsPayload: SaveSchemaFieldsPayload = {
    schemaDefinitionItemId: schemaId,
    projectKey: X_BLOCKS_KEY,
    fields: input.fields,
  }

  const fieldsRes = await saveSchemaFields(fieldsPayload)

  if (!fieldsRes.isSuccess) {
    return { success: false, error: fieldsRes.message }
  }

  if (input.securityType) {
    const changeSecurityPayload: ChangeSecurityPayload = {
      projectKey: X_BLOCKS_KEY,
      schemaId,
      accessLevel: ACCESS_LEVEL_MAP[input.securityType] ?? 0,
    }

    await changeSecurity(changeSecurityPayload)

    if (
      (input.securityType === 'RoleBased' || input.securityType === 'Custom') &&
      input.accessPolicies
    ) {
      for (const policy of input.accessPolicies) {
        const operations = policy.operations.map((op) => OPERATION_MAP[op] ?? 0)
        const primaryOperation = operations.length === 1 ? operations[0] : 4

        const accessPolicyPayload: CreateAccessPolicyPayload = {
          policyName: policy.policyName,
          policyType: 0,
          operation: primaryOperation,
          schemaName: input.schemaName,
          schemaId,
          fieldNames: [],
          projectKey: X_BLOCKS_KEY,
          ruleGroup: buildRuleGroup(policy.allowedRoles),
          priority: policy.priority ?? 1,
          isAllowPolicy: policy.isAllowPolicy ?? true,
        }

        await createAccessPolicy(accessPolicyPayload)
      }
    }
  }

  await reloadConfiguration(X_BLOCKS_KEY)
  revalidatePath('/data-management/schemas')

  return {
    success: true,
    schemaId,
    collectionName: input.collectionName,
    schemaName: input.schemaName,
  }
}
