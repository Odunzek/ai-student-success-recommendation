import { Database, Calendar, FileText } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { formatDate } from '../../lib/utils'

interface DatasetInfoProps {
  hasData: boolean
  rowCount: number
  lastUpload?: string
}

export function DatasetInfo({ hasData, rowCount, lastUpload }: DatasetInfoProps) {
  if (!hasData) {
    return (
      <Card className="text-center py-8">
        <Database className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">No dataset loaded</p>
        <p className="text-sm text-gray-400 mt-1">
          Upload a CSV file to get started
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Current Dataset</h3>
        <Badge variant="success">Active</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-light">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Records</p>
            <p className="text-lg font-semibold text-gray-900">{rowCount.toLocaleString()}</p>
          </div>
        </div>

        {lastUpload && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(lastUpload)}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
