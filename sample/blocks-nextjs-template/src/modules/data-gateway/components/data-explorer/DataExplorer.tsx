'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search, Edit2, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Column<T> {
  key: keyof T | '_id'
  label: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

interface DataTableProps<T extends { _id?: string }> {
  data: T[]
  columns: Column<T>[]
  totalCount: number
  page: number
  pageSize: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onRefresh?: () => void
}

export function DataTable<T extends { _id?: string }>({
  data,
  columns,
  totalCount,
  page,
  pageSize,
  isLoading,
  onPageChange,
  onEdit,
  onDelete,
  onRefresh,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')

  const totalPages = Math.ceil(totalCount / pageSize)
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, totalCount)

  const filteredData = searchQuery
    ? data.filter((row) =>
        columns.some((col) => {
          const value = row[col.key as keyof T]
          return String(value).toLowerCase().includes(searchQuery.toLowerCase())
        })
      )
    : data

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-neutral-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-neutral-900 border-white/10 text-white placeholder:text-white/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-white hover:bg-white/10"
          >
            <Search className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-white" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/50">
            <p className="text-sm">No data found</p>
          </div>
        ) : (
          <Table className="border border-white/10 rounded-lg m-4">
            <TableHeader>
              <TableRow className="bg-neutral-800 hover:bg-neutral-800">
                {columns.map((col) => (
                  <TableHead
                    key={String(col.key)}
                    className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider"
                  >
                    {col.label}
                  </TableHead>
                ))}
                {(onEdit || onDelete) && (
                  <TableHead className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-white/10">
              {filteredData.map((row, rowIndex) => (
                <TableRow key={row._id || rowIndex} className="hover:bg-white/5">
                  {columns.map((col) => (
                    <TableCell key={String(col.key)} className="px-4 py-3 text-sm text-white">
                      {col.render
                        ? col.render(row[col.key as keyof T], row)
                        : String(row[col.key as keyof T] ?? '')}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete) && (
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(row)}
                            className="text-white hover:bg-white/10"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(row)}
                            className="text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {totalCount > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-neutral-800">
          <p className="text-sm text-white/50">
            Showing {startItem} to {endItem} of {totalCount} results
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="text-white hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 p-0 ${
                      page === pageNum
                        ? 'bg-white text-neutral-950 hover:bg-white/90'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="text-white hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface RecordFormProps<T> {
  schema: { name: string; type: string; isRequired?: boolean }[]
  initialData?: Partial<T>
  onSubmit: (data: T) => void
  onCancel: () => void
  isLoading?: boolean
}

export function RecordForm<T>({
  schema,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: RecordFormProps<T>) {
  const [formData, setFormData] = useState<Record<string, string>>(
    initialData
      ? Object.fromEntries(
          Object.entries(initialData).map(([key, value]) => [key, String(value ?? '')])
        )
      : {}
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData as T)
  }

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {schema.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <label className="text-sm font-medium text-white/70">
            {field.name}
            {field.isRequired && <span className="text-red-400 ml-1">*</span>}
          </label>
          {field.type === 'Boolean' ? (
            <Select value={formData[field.name] || 'false'} onValueChange={(value) => handleChange(field.name, value || '')}>
              <SelectTrigger className="border-white/10 bg-neutral-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-white/10 text-white">
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
          ) : field.type === 'Number' ? (
            <Input
              type="number"
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="border-white/10 bg-neutral-800 text-white"
              required={field.isRequired}
            />
          ) : field.type === 'Date' ? (
            <Input
              type="datetime-local"
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="border-white/10 bg-neutral-800 text-white"
              required={field.isRequired}
            />
          ) : (
            <textarea
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="w-full px-3 py-2 border border-white/10 rounded-md bg-neutral-800 text-white min-h-[80px]"
              required={field.isRequired}
            />
          )}
        </div>
      ))}

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          className="text-white hover:bg-white/10"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-white text-neutral-950 hover:bg-white/90"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

interface DataExplorerProps<T extends { _id?: string }> {
  schemaName: string
  schemaFields: { name: string; type: string; isArray?: boolean; description?: string }[]
  data: T[]
  totalCount: number
  page: number
  pageSize: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onRefresh: () => void
  onCreate: (data: T) => Promise<boolean>
  onUpdate: (id: string, data: Partial<T>) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

export function DataExplorer<T extends { _id?: string }>({
  schemaName,
  schemaFields,
  data,
  totalCount,
  page,
  pageSize,
  isLoading,
  onPageChange,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
}: DataExplorerProps<T>) {
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<T | null>(null)

  const columns: Column<T>[] = schemaFields.map((field) => ({
    key: field.name as keyof T,
    label: field.name,
  }))

  const handleEdit = (record: T) => {
    setEditingRecord(record)
    setShowForm(true)
  }

  const handleDelete = async (record: T) => {
    if (record._id && confirm('Are you sure you want to delete this record?')) {
      await onDelete(record._id)
    }
  }

  const handleSubmit = async (formData: T) => {
    if (editingRecord?._id) {
      await onUpdate(editingRecord._id, formData)
    } else {
      await onCreate(formData)
    }
    setShowForm(false)
    setEditingRecord(null)
    onRefresh()
  }

  return (
    <div className="flex flex-col h-full bg-neutral-900 rounded-lg border border-white/10">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">{schemaName} Data</h2>
        <Button
          onClick={() => {
            setEditingRecord(null)
            setShowForm(true)
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Record
        </Button>
      </div>

      {showForm ? (
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium mb-4">
            {editingRecord ? 'Edit Record' : 'New Record'}
          </h3>
          <RecordForm
            schema={schemaFields}
            initialData={editingRecord || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false)
              setEditingRecord(null)
            }}
          />
        </div>
      ) : (
        <div className="flex-1">
          <DataTable
            data={data}
            columns={columns}
            totalCount={totalCount}
            page={page}
            pageSize={pageSize}
            isLoading={isLoading}
            onPageChange={onPageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={onRefresh}
          />
        </div>
      )}
    </div>
  )
}

export default DataExplorer
