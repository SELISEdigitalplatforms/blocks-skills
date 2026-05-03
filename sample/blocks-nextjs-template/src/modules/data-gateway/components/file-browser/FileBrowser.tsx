'use client'

import { useState, useCallback } from 'react'
import { Folder, FolderOpen, File, ChevronRight, MoreHorizontal, Upload, FolderPlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileUpload } from '../file-upload/FileUpload'
import type { DmsFile } from '../../types/data-gateway.types'

interface FileBrowserProps {
  files: DmsFile[]
  isLoading: boolean
  onNavigate: (folderId: string | null) => void
  onRefresh: () => void
  onUpload: (file: File) => Promise<boolean>
  onDelete: (file: DmsFile) => Promise<boolean>
  onCreateFolder: (name: string) => Promise<boolean>
}

export const FileBrowser = ({
  files,
  isLoading,
  onNavigate,
  onRefresh,
  onUpload,
  onDelete,
  onCreateFolder,
}: FileBrowserProps) => {
  const [showUpload, setShowUpload] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const folders = files.filter((f) => f.isFolder)
  const regularFiles = files.filter((f) => !f.isFolder)

  const handleCreateFolder = useCallback(async () => {
    if (newFolderName.trim()) {
      const success = await onCreateFolder(newFolderName.trim())
      if (success) {
        setNewFolderName('')
        setShowNewFolder(false)
        onRefresh()
      }
    }
  }, [newFolderName, onCreateFolder, onRefresh])

  const handleDelete = useCallback(
    async (file: DmsFile) => {
      if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
        const success = await onDelete(file)
        if (success) {
          onRefresh()
        }
      }
      setActiveMenu(null)
    },
    [onDelete, onRefresh]
  )

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-neutral-800">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate(null)}
            className="text-white hover:bg-white/10"
            title="Go to root"
          >
            <FolderOpen className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-white hover:bg-white/10"
            title="Refresh"
          >
            <ChevronRight className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setShowNewFolder(!showNewFolder)}
            className="gap-2 text-white hover:bg-white/10"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </Button>
          <Button
            onClick={() => setShowUpload(!showUpload)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
          </Button>
        </div>
      </div>

      {showNewFolder && (
        <div className="p-4 border-b border-white/10 bg-neutral-800/50">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              className="flex-1 border-white/10 bg-neutral-900 text-white placeholder:text-white/30"
              autoFocus
            />
            <Button onClick={handleCreateFolder}>
              Create
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowNewFolder(false)
                setNewFolderName('')
              }}
              className="text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {showUpload && (
        <div className="p-4 border-b border-white/10 bg-neutral-800/50">
          <FileUpload onUpload={onUpload} />
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-white" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/50">
            <Folder className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">This folder is empty</p>
          </div>
        ) : (
          <div className="p-4">
            {folders.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium text-white/50 uppercase mb-2">
                  Folders
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="group relative flex items-center gap-2 p-3 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => onNavigate(folder.id)}
                    >
                      <Folder className="w-5 h-5 text-white" />
                      <span className="text-sm truncate flex-1 text-white">{folder.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenu(activeMenu === folder.id ? null : folder.id)
                        }}
                        className="h-6 w-6 p-0 text-white/50 hover:bg-white/10"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                      {activeMenu === folder.id && (
                        <div className="absolute right-0 top-full mt-1 z-10 bg-neutral-900 border border-white/10 rounded-md shadow-md">
                          <Button
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(folder)
                            }}
                            className="flex items-center gap-2 w-full justify-start text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {regularFiles.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-white/50 uppercase mb-2">
                  Files
                </h3>
                <Table className="border border-white/10 rounded-lg">
                  <TableHeader>
                    <TableRow className="bg-neutral-800 hover:bg-neutral-800">
                      <TableHead className="px-4 py-2 font-medium">Name</TableHead>
                      <TableHead className="px-4 py-2 font-medium">Size</TableHead>
                      <TableHead className="px-4 py-2 font-medium">Modified</TableHead>
                      <TableHead className="px-4 py-2 font-medium w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-white/10">
                    {regularFiles.map((file) => (
                      <TableRow key={file.id} className="hover:bg-white/5">
                        <TableCell className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <File className="w-4 h-4 text-white/50" />
                            <span className="text-sm text-white truncate">{file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2 text-sm text-white/50">
                          {formatFileSize(file.size)}
                        </TableCell>
                        <TableCell className="px-4 py-2 text-sm text-white/50">
                          {formatDate(file.createdAt)}
                        </TableCell>
                        <TableCell className="px-4 py-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(file)}
                            className="text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FileBrowser
