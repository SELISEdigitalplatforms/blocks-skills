'use server'

import { uploadFile } from '@/lib/services/data-management.service'


interface UploadResult {
  success: boolean
  data?: {
    id: string
    name: string
    size?: number
    contentType?: string
    accessModifier?: string
  }
  error?: string
}

export async function uploadFileAction(
  file: File,
  name?: string,
  accessModifier = 'Private'
): Promise<UploadResult> {
  try {
    const result = await uploadFile(file, name ?? file.name, accessModifier)

    if (!result.isSuccess || !result.data) {
      return { success: false, error: result.message }
    }

    return {
      success: true,
      data: {
        id: result.data.id,
        name: name ?? file.name,
      },
    }
  } catch (err) {
    console.error('[uploadFileAction]', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    }
  }
}
