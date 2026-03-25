import { useState, useCallback } from 'react'
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'

interface OuladFile {
  name: string
  label: string
  description: string
  required: boolean
  file: File | null
}

interface OuladUploaderProps {
  onUpload: (files: { [key: string]: File }) => void
  disabled?: boolean
  isLoading?: boolean
}

const OULAD_FILES: Omit<OuladFile, 'file'>[] = [
  {
    name: 'studentInfo',
    label: 'studentInfo.csv',
    description: 'Student demographics and registration info',
    required: true,
  },
  {
    name: 'studentAssessment',
    label: 'studentAssessment.csv',
    description: 'Assessment scores per student',
    required: false,
  },
  {
    name: 'studentVle',
    label: 'studentVle.csv',
    description: 'VLE interaction data (clicks)',
    required: false,
  },
  {
    name: 'assessments',
    label: 'assessments.csv',
    description: 'Assessment metadata',
    required: false,
  },
]

function MiniDropzone({
  file,
  onSelect,
  onClear,
  label,
  description,
  required,
  disabled,
}: {
  file: File | null
  onSelect: (file: File) => void
  onClear: () => void
  label: string
  description: string
  required: boolean
  disabled?: boolean
}) {
  const [isDragging, setIsDragging] = useState(false)
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
      const droppedFile = files[0]
      if (droppedFile.name.toLowerCase().endsWith('.csv')) {
        onSelect(droppedFile)
      } else {
        setError('Please select a CSV file')
      }
    }
  }, [disabled, onSelect])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const files = e.target.files
    if (files && files.length > 0) {
      const selectedFile = files[0]
      if (selectedFile.name.toLowerCase().endsWith('.csv')) {
        onSelect(selectedFile)
      } else {
        setError('Please select a CSV file')
        e.target.value = ''
      }
    }
  }, [onSelect])

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative border-2 border-dashed rounded-lg p-3 transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-surface-300 dark:border-surface-700',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary',
        file ? 'bg-success-50 dark:bg-success-900/20 border-success-300 dark:border-success-700' : ''
      )}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {file ? (
            <CheckCircle className="h-5 w-5 text-success-500 flex-shrink-0" />
          ) : (
            <Upload className="h-5 w-5 text-surface-400 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className={cn(
                'font-medium text-sm truncate',
                file ? 'text-success-700 dark:text-success-400' : 'text-surface-900 dark:text-white'
              )}>
                {file ? file.name : label}
              </p>
              {required && !file && (
                <span className="text-xs px-1.5 py-0.5 bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 rounded">
                  Required
                </span>
              )}
              {!required && !file && (
                <span className="text-xs px-1.5 py-0.5 bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 rounded">
                  Optional
                </span>
              )}
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : description}
            </p>
          </div>
        </div>

        {file && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClear()
            }}
            className="p-1 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4 text-surface-500" />
          </button>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-1 text-xs text-danger-600 dark:text-danger-400">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export function OuladUploader({ onUpload, disabled, isLoading }: OuladUploaderProps) {
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    studentInfo: null,
    studentAssessment: null,
    studentVle: null,
    assessments: null,
  })

  const handleFileSelect = (name: string, file: File) => {
    setFiles((prev) => ({ ...prev, [name]: file }))
  }

  const handleFileClear = (name: string) => {
    setFiles((prev) => ({ ...prev, [name]: null }))
  }

  const hasRequiredFiles = files.studentInfo !== null
  const hasAnyFiles = Object.values(files).some((f) => f !== null)

  const handleUpload = () => {
    const filesToUpload: { [key: string]: File } = {}
    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        filesToUpload[key] = file
      }
    })
    onUpload(filesToUpload)
  }

  const clearAll = () => {
    setFiles({
      studentInfo: null,
      studentAssessment: null,
      studentVle: null,
      assessments: null,
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {OULAD_FILES.map((ouladFile) => (
          <MiniDropzone
            key={ouladFile.name}
            file={files[ouladFile.name]}
            onSelect={(file) => handleFileSelect(ouladFile.name, file)}
            onClear={() => handleFileClear(ouladFile.name)}
            label={ouladFile.label}
            description={ouladFile.description}
            required={ouladFile.required}
            disabled={disabled || isLoading}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleUpload}
          disabled={!hasRequiredFiles || disabled || isLoading}
          isLoading={isLoading}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Process OULAD Files
        </Button>
        {hasAnyFiles && (
          <Button
            variant="outline"
            onClick={clearAll}
            disabled={disabled || isLoading}
          >
            Clear All
          </Button>
        )}
      </div>

      <p className="text-xs text-surface-500 dark:text-surface-400">
        Upload raw OULAD dataset files. Only studentInfo.csv is required -
        optional files will use default values if not provided.
      </p>
    </div>
  )
}
