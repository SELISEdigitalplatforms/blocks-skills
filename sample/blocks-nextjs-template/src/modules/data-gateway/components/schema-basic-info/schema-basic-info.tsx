'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Schema } from '../../types/data-gateway.types'
import { useDeleteSchema } from '../../hooks/useDataGateway'

interface SchemaBasicInfoProps {
  schema: Schema
  onDeleteSuccess?: () => void
  isLoading?: boolean
}

export function SchemaBasicInfo({
  schema,
  onDeleteSuccess,
  isLoading,
}: SchemaBasicInfoProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { deleteSchema, isLoading: isDeleting } = useDeleteSchema()

  const schemaTypeDisplay = schema.schemaType === 1 ? 'Entity' : 'Child'
  const isEntity = schema.schemaType === 1

  const handleDelete = async () => {
    const success = await deleteSchema(schema.id)
    if (success) {
      setIsDeleteDialogOpen(false)
      onDeleteSuccess?.()
    }
  }

  if (isLoading) {
    return (
      <Card className="mb-4 shadow-none">
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!schema.schemaName) {
    return (
      <Card className="mb-4 shadow-none">
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          Select a schema from the sidebar to view its details.
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="mb-4 shadow-none">
        <CardContent className="flex flex-col items-start justify-between gap-4 p-4">
          <div className="flex w-full flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-2 text-red-500 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>

          <div className="flex w-full flex-col gap-4 text-muted-foreground xl:flex-row">
            <div className="flex shrink-0 flex-col gap-1 xl:w-1/4">
              <span>Schema Name</span>
              <span className="font-medium text-foreground">{schema.schemaName}</span>
            </div>
            <div className="flex shrink-0 flex-col gap-1 xl:w-1/4">
              <span>Schema Type</span>
              <span className="font-medium text-foreground">
                {schemaTypeDisplay}
              </span>
            </div>
            {isEntity && schema.collectionName && (
              <div className="flex flex-col gap-1 xl:w-1/2">
                <span>Collection Name</span>
                <span className="font-medium text-foreground">{schema.collectionName}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete schema?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schema? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default SchemaBasicInfo
