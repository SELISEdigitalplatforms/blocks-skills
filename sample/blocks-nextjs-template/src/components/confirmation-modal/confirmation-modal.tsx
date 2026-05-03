"use client"

import { Button } from '@/components/ui/button'
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

interface ConfirmationModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onCancel: () => void
  onConfirm: () => void
  data: {
    dialogTitle: string
    dialogSubtitle: string
    confirmButton: string
    cancelButton: string
  }
  buttonState?: {
    confirm?: { disable?: boolean }
    cancel?: { disable?: boolean }
  }
  trigger?: React.ReactNode
}

const ConfirmationModal = ({
  onCancel,
  onConfirm,
  data,
  buttonState,
}: ConfirmationModalProps) => {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{data.dialogTitle}</AlertDialogTitle>
        <AlertDialogDescription>
          {data.dialogSubtitle}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={buttonState?.cancel?.disable}>
          {data.cancelButton}
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          disabled={buttonState?.confirm?.disable}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {data.confirmButton}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}

export default ConfirmationModal
