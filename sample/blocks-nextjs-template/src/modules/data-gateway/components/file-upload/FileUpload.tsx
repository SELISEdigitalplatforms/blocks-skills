'use client'

import { useCallback, useState } from 'react'
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { UploadProgress } from '../../types/data-gateway.types'

interface FileUploadProps {
  onUpload: (file: File) => Promise<boolean>
  accept?: string
  maxSize?: number
}

export const FileUpload = ({
  onUpload,
  accept = '*/*',
  maxSize = 10 * 1024 * 1024,
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStates, setUploadStates] = useState<UploadProgress[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      for (const file of files) {
        if (file.size > maxSize) {
          setUploadStates((prev) => [
            ...prev,
            {
              fileName: file.name,
              progress: 0,
              status: 'error',
              error: `File too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`,
            },
          ])
          continue
        }

        setUploadStates((prev) => [
          ...prev,
          { fileName: file.name, progress: 0, status: 'uploading' },
        ])

        try {
          const success = await onUpload(file)
          setUploadStates((prev) =>
            prev.map((state) =>
              state.fileName === file.name && state.status === 'uploading'
                ? { ...state, progress: 100, status: success ? 'success' : 'error' }
                : state
            )
          )
        } catch {
          setUploadStates((prev) =>
            prev.map((state) =>
              state.fileName === file.name && state.status === 'uploading'
                ? { ...state, status: 'error', error: 'Upload failed' }
                : state
            )
          )
        }
      }
    },
    [onUpload, maxSize]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      for (const file of files) {
        if (file.size > maxSize) {
          setUploadStates((prev) => [
            ...prev,
            {
              fileName: file.name,
              progress: 0,
              status: 'error',
              error: `File too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`,
            },
          ])
          continue
        }

        setUploadStates((prev) => [
          ...prev,
          { fileName: file.name, progress: 0, status: 'uploading' },
        ])

        try {
          const success = await onUpload(file)
          setUploadStates((prev) =>
            prev.map((state) =>
              state.fileName === file.name && state.status === 'uploading'
                ? { ...state, progress: 100, status: success ? 'success' : 'error' }
                : state
            )
          )
        } catch {
          setUploadStates((prev) =>
            prev.map((state) =>
              state.fileName === file.name && state.status === 'uploading'
                ? { ...state, status: 'error', error: 'Upload failed' }
                : state
            )
          )
        }
      }
      e.target.value = ''
    },
    [onUpload, maxSize]
  )

  const removeUploadState = (fileName: string) => {
    setUploadStates((prev) => prev.filter((state) => state.fileName !== fileName))
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-white bg-white/5'
            : 'border-white/20 hover:border-white/40'
        }`}
      >
        <Upload className="w-10 h-10 mx-auto mb-4 text-white/50" />
        <p className="text-sm text-white/50 mb-2">
          Drag and drop files here, or click to select
        </p>
        <label className="cursor-pointer">
          <span className="inline-flex items-center px-4 py-2 text-sm rounded-md bg-white text-neutral-950 hover:bg-white/90 transition-colors">
            Select Files
          </span>
          <input
            type="file"
            accept={accept}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
        <p className="mt-2 text-xs text-white/40">
          Max file size: {Math.round(maxSize / 1024 / 1024)}MB
        </p>
      </div>

      {uploadStates.length > 0 && (
        <div className="space-y-2">
          {uploadStates.map((state) => (
            <div
              key={state.fileName}
              className="flex items-center gap-3 p-3 border border-white/10 rounded-lg bg-neutral-800"
            >
              {state.status === 'uploading' && (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              )}
              {state.status === 'success' && (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )}
              {state.status === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              {state.status === 'idle' && (
                <Upload className="w-5 h-5 text-white/50" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{state.fileName}</p>
                {state.status === 'uploading' && (
                  <div className="mt-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${state.progress}%` }}
                    />
                  </div>
                )}
                {state.status === 'error' && state.error && (
                  <p className="mt-1 text-xs text-red-400">{state.error}</p>
                )}
              </div>

              <button
                onClick={() => removeUploadState(state.fileName)}
                className="flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 transition-colors text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload
