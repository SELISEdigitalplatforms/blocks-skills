'use client'

import { useState } from 'react'
import { Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGetDmsFiles, useUploadFile } from '../../hooks/useDataGateway'
import { FileBrowser } from '../../components/file-browser/FileBrowser'
import dataGatewayService from '../../services/data-gateway.service'

const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY ?? ''

export const FilesPage = () => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folderHistory, setFolderHistory] = useState<(string | null)[]>([null])

  const { data, isLoading, refetch } = useGetDmsFiles(currentFolderId)
  const { uploadToDms, createFolder } = useUploadFile()

  const files = data?.items || []

  const handleNavigate = (folderId: string | null) => {
    setCurrentFolderId(folderId)
    setFolderHistory((prev) => [...prev, folderId])
  }

  const handleBack = () => {
    if (folderHistory.length > 1) {
      const newHistory = [...folderHistory]
      newHistory.pop()
      setFolderHistory(newHistory)
      setCurrentFolderId(newHistory[newHistory.length - 1])
    }
  }

  const handleUpload = async (file: File): Promise<boolean> => {
    return uploadToDms(file)
  }

  const handleDelete = async (file: { id: string; isFolder: boolean }): Promise<boolean> => {
    try {
      if (file.isFolder) {
        const response = await dataGatewayService.files.deleteFolder({
          folderId: file.id,
          projectKey: X_BLOCKS_KEY,
        })
        return response.isSuccess
      } else {
        const response = await dataGatewayService.files.deleteFile({
          FileId: file.id,
          ProjectKey: X_BLOCKS_KEY,
        })
        return response.isSuccess
      }
    } catch {
      return false
    }
  }

  const handleCreateFolder = async (name: string): Promise<boolean> => {
    const success = await createFolder(name, currentFolderId || undefined)
    if (success) {
      refetch()
    }
    return success
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-neutral-900">
        <div>
          <h1 className="text-2xl font-bold text-white">File Manager</h1>
          <p className="text-sm text-white/50 mt-1">
            Manage your files and folders
          </p>
        </div>
        {folderHistory.length > 1 && (
          <Button
            variant="ghost"
            onClick={handleBack}
            className="gap-2 text-white hover:bg-white/10"
          >
            <Folder className="w-4 h-4" />
            Back
          </Button>
        )}
      </div>

      <div className="flex-1 bg-neutral-900 rounded-lg border border-white/10 m-6 overflow-hidden">
        <FileBrowser
          files={files}
          isLoading={isLoading}
          onNavigate={handleNavigate}
          onRefresh={refetch}
          onUpload={handleUpload}
          onDelete={handleDelete}
          onCreateFolder={handleCreateFolder}
        />
      </div>
    </div>
  )
}

export default FilesPage
