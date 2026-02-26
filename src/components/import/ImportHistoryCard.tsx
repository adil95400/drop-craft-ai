import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImportStatusBadge } from './ImportStatusBadge'
import { formatDistanceToNow } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale'
import { Package, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ImportHistoryCardProps {
  job: {
    id: string
    source_type: string
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
    total_products: number
    successful_imports: number
    failed_imports: number
    created_at: string
    completed_at?: string
  }
}

export function ImportHistoryCard({ job }: ImportHistoryCardProps) {
  const locale = useDateFnsLocale()
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Import {job.source_type}</CardTitle>
            <CardDescription>
              {formatDistanceToNow(new Date(job.created_at), { 
                addSuffix: true, 
                locale 
              })}
            </CardDescription>
          </div>
          <ImportStatusBadge status={job.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{job.total_products}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <div>
              <div className="text-sm font-medium">{job.successful_imports}</div>
              <div className="text-xs text-muted-foreground">Réussis</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <div>
              <div className="text-sm font-medium">{job.failed_imports}</div>
              <div className="text-xs text-muted-foreground">Échecs</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
