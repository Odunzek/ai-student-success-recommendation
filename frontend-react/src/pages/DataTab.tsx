import { useState } from 'react'
import { Trash2, CheckCircle, FileSpreadsheet, FolderOpen } from 'lucide-react'
import { Dropzone } from '../components/upload/Dropzone'
import { OuladUploader } from '../components/upload/OuladUploader'
import { DatasetInfo } from '../components/upload/DatasetInfo'
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { LoadingState } from '../components/ui/Spinner'
import { useUpload, useUploadOulad, useUploadStatus, useResetData } from '../api/hooks/useUpload'
import { cn } from '../lib/utils'

type UploadMode = 'single' | 'oulad'

export function DataTab() {
  const [uploadMode, setUploadMode] = useState<UploadMode>('single')
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState(false)

  const { data: status, isLoading: statusLoading, isError: statusError } = useUploadStatus()
  const upload = useUpload()
  const uploadOulad = useUploadOulad()
  const reset = useResetData()

  const isUploading = upload.isPending || uploadOulad.isPending

  const handleFileSelect = async (file: File) => {
    setUploadSuccess(null)
    try {
      const result = await upload.mutateAsync(file)
      setUploadSuccess(`Successfully uploaded ${result.rows_processed} records from ${result.filename}`)
    } catch {
      // Error is handled by the mutation
    }
  }

  const handleOuladUpload = async (files: { [key: string]: File }) => {
    setUploadSuccess(null)
    try {
      const result = await uploadOulad.mutateAsync({
        studentInfo: files.studentInfo,
        studentAssessment: files.studentAssessment,
        studentVle: files.studentVle,
        assessments: files.assessments,
      })
      setUploadSuccess(`Successfully processed ${result.rows_processed} records from OULAD files`)
    } catch {
      // Error is handled by the mutation
    }
  }

  const handleReset = async () => {
    const confirmed = window.confirm('Are you sure you want to delete all data? This cannot be undone.')
    if (confirmed) {
      setUploadSuccess(null)
      setResetSuccess(false)
      try {
        await reset.mutateAsync()
        setResetSuccess(true)
      } catch (error) {
        console.error('Reset failed:', error)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Dataset</CardTitle>
            <CardDescription>
              Upload student data to analyze dropout risk
            </CardDescription>
          </CardHeader>

          <div className="space-y-4">
            {/* Upload Mode Toggle */}
            <div className="flex rounded-lg bg-surface-100 dark:bg-surface-800 p-1">
              <button
                onClick={() => setUploadMode('single')}
                disabled={isUploading}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  uploadMode === 'single'
                    ? 'bg-white dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm'
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white',
                  isUploading && 'opacity-50 cursor-not-allowed'
                )}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Single File
              </button>
              <button
                onClick={() => setUploadMode('oulad')}
                disabled={isUploading}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  uploadMode === 'oulad'
                    ? 'bg-white dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm'
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white',
                  isUploading && 'opacity-50 cursor-not-allowed'
                )}
              >
                <FolderOpen className="h-4 w-4" />
                OULAD Files
              </button>
            </div>

            {/* Single File Upload */}
            {uploadMode === 'single' && (
              <>
                <Dropzone
                  onFileSelect={handleFileSelect}
                  disabled={upload.isPending}
                />

                {upload.isPending && (
                  <LoadingState message="Processing file..." />
                )}

                {upload.isError && (
                  <Alert variant="error" title="Upload Failed">
                    {upload.error?.message || 'Failed to upload file. Please check the format and try again.'}
                  </Alert>
                )}

                <div className="text-sm text-surface-500 dark:text-surface-400">
                  <p className="font-medium mb-2">Accepted Formats:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Pre-processed CSV:</strong> With model features (avg_score, completion_rate, etc.)</li>
                    <li><strong>Combined OULAD CSV:</strong> Raw data with id_student, score, sum_click columns</li>
                    <li><strong>ZIP file:</strong> Contains OULAD CSVs (studentInfo, studentAssessment, etc.)</li>
                  </ul>
                </div>
              </>
            )}

            {/* OULAD Multi-File Upload */}
            {uploadMode === 'oulad' && (
              <>
                <OuladUploader
                  onUpload={handleOuladUpload}
                  disabled={uploadOulad.isPending}
                  isLoading={uploadOulad.isPending}
                />

                {uploadOulad.isError && (
                  <Alert variant="error" title="Upload Failed">
                    {uploadOulad.error?.message || 'Failed to process OULAD files. Please check the format and try again.'}
                  </Alert>
                )}
              </>
            )}

            {/* Success Message (shared) */}
            {uploadSuccess && (
              <Alert variant="success" title="Upload Complete">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {uploadSuccess}
                </div>
              </Alert>
            )}
          </div>
        </Card>

        {/* Status Section */}
        <div className="space-y-4">
          {statusLoading ? (
            <LoadingState message="Loading dataset info..." />
          ) : statusError ? (
            <Alert variant="warning" title="Service Offline">
              Unable to connect to the data service. Make sure the backend server is running.
            </Alert>
          ) : (
            <DatasetInfo
              hasData={status?.has_data ?? false}
              rowCount={status?.row_count ?? 0}
              lastUpload={status?.last_upload}
            />
          )}

          {status?.has_data && (
            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
              </CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-surface-600 dark:text-surface-400">Delete all student data</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">This action cannot be undone</p>
                </div>
                <Button
                  variant="danger"
                  onClick={handleReset}
                  isLoading={reset.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Reset Data
                </Button>
              </div>

              {reset.isError && (
                <Alert variant="error" className="mt-4">
                  Failed to reset data. Please try again.
                </Alert>
              )}
              {resetSuccess && (
                <Alert variant="success" className="mt-4">
                  All data cleared. Upload a new dataset to continue.
                </Alert>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
