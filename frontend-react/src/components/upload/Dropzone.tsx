import { useCallback, useState } from 'react'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

// Valid MIME types for CSV files (browsers may report different types)
const VALID_CSV_MIME_TYPES = [
  'text/csv',
  'text/plain',
  'application/csv',
  'application/vnd.ms-excel', // Windows Excel may use this for CSV
  'application/octet-stream', // Some systems report this
]

// Valid MIME types for ZIP files
const VALID_ZIP_MIME_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
]

function isValidFile(file: File, accept: string): { valid: boolean; reason?: string } {
  const extension = file.name.toLowerCase().split('.').pop()
  const mimeType = file.type.toLowerCase()

  // Check extension first
  if (accept.includes('.csv') && extension === 'csv') {
    // For CSV, check MIME type (but be lenient since browsers vary)
    if (mimeType && !VALID_CSV_MIME_TYPES.includes(mimeType) && mimeType !== '') {
      // Only reject if MIME type is explicitly wrong (not empty)
      return { valid: false, reason: `Invalid file type: ${mimeType}. Expected a CSV file.` }
    }
    return { valid: true }
  }

  if (accept.includes('.zip') && extension === 'zip') {
    if (mimeType && !VALID_ZIP_MIME_TYPES.includes(mimeType) && mimeType !== '') {
      return { valid: false, reason: `Invalid file type: ${mimeType}. Expected a ZIP file.` }
    }
    return { valid: true }
  }

  return { valid: false, reason: `Invalid file extension. Expected ${accept}` }
}

interface DropzoneProps {
  onFileSelect: (file: File) => void
  accept?: string
  disabled?: boolean
}

export function Dropzone({ onFileSelect, accept = '.csv,.zip', disabled }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setError(null)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      const validation = isValidFile(file, accept)
      if (validation.valid) {
        setSelectedFile(file)
        onFileSelect(file)
      } else {
        setError(validation.reason ?? 'Invalid file type')
      }
    }
  }, [disabled, onFileSelect, accept])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const validation = isValidFile(file, accept)
      if (validation.valid) {
        setSelectedFile(file)
        onFileSelect(file)
      } else {
        setError(validation.reason ?? 'Invalid file type')
        // Clear the input so the same file can be selected again
        e.target.value = ''
      }
    }
  }, [onFileSelect, accept])

  const clearFile = () => {
    setSelectedFile(null)
    setError(null)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative border-2 border-dashed rounded-xl p-8 transition-colors',
        isDragging ? 'border-primary bg-primary-light' : 'border-gray-300',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'
      )}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />

      {selectedFile ? (
        <div className="flex items-center justify-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <p className="font-medium text-gray-900">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault()
              clearFile()
            }}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      ) : (
        <div className="text-center">
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            Drop your CSV or ZIP file here
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            or click to browse
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 px-3 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
