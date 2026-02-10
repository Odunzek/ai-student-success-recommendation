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
        <Database className="h-12 w-12 mx-auto text-surface-400 dark:text-surface-500 mb-4" />
        <p className="text-surface-600 dark:text-surface-300">No dataset loaded</p>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Upload a CSV file to get started
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-surface-900 dark:text-white">Current Dataset</h3>
        <Badge variant="success">Active</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-sm text-surface-500 dark:text-surface-400">Total Records</p>
            <p className="text-lg font-semibold text-surface-900 dark:text-white">{rowCount.toLocaleString()}</p>
          </div>
        </div>

        {lastUpload && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800">
              <Calendar className="h-5 w-5 text-surface-600 dark:text-surface-400" />
            </div>
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Last Updated</p>
              <p className="text-lg font-semibold text-surface-900 dark:text-white">{formatDate(lastUpload)}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
