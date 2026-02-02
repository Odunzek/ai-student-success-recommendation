import { useState } from 'react'
import { Trash2, CheckCircle } from 'lucide-react'
import { Dropzone } from '../components/upload/Dropzone'
import { DatasetInfo } from '../components/upload/DatasetInfo'
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { LoadingState } from '../components/ui/Spinner'
import { useUpload, useUploadStatus, useResetData } from '../api/hooks/useUpload'

export function DataTab() {
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  const { data: status, isLoading: statusLoading, isError: statusError } = useUploadStatus()
  const upload = useUpload()
  const reset = useResetData()

  const handleFileSelect = async (file: File) => {
    setUploadSuccess(null)
    try {
      const result = await upload.mutateAsync(file)
      setUploadSuccess(`Successfully uploaded ${result.rows_processed} records from ${result.filename}`)
    } catch {
      // Error is handled by the mutation
    }
  }

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      setUploadSuccess(null)
      await reset.mutateAsync()
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
              Upload a CSV file with student data to analyze dropout risk
            </CardDescription>
          </CardHeader>

          <div className="space-y-4">
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

            {uploadSuccess && (
              <Alert variant="success" title="Upload Complete">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {uploadSuccess}
                </div>
              </Alert>
            )}

            <div className="text-sm text-gray-500">
              <p className="font-medium mb-2">Expected CSV Format:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Headers: student_id, gender, age, address, family_size, etc.</li>
                <li>Grades: g1, g2, g3 (0-20)</li>
                <li>Boolean fields: yes/no or 1/0</li>
              </ul>
            </div>
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
                  <p className="text-sm text-gray-600">Delete all student data</p>
                  <p className="text-xs text-gray-400">This action cannot be undone</p>
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
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
