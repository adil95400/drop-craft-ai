/**
 * ActiveJobsBanner - Bannière compacte des jobs actifs
 * Affichée en haut de la page catalogue pour informer des opérations en cours
 */
import { useApiJobs } from '@/hooks/api/useApiJobs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Loader2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ActiveJobsBanner() {
  const { activeJobs } = useApiJobs({ limit: 5 })

  if (activeJobs.length === 0) return null

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 text-primary animate-spin" />
        <span className="text-sm font-medium">
          {activeJobs.length} opération{activeJobs.length > 1 ? 's' : ''} en cours
        </span>
      </div>
      <div className="space-y-1.5">
        {activeJobs.slice(0, 3).map((job) => (
          <div key={job.id} className="flex items-center gap-2">
            <Badge variant="outline" className="h-5 text-[10px] px-1.5 capitalize shrink-0">
              {job.job_type?.replace(/_/g, ' ')}
            </Badge>
            <Progress value={job.progress_percent || 0} className="h-1.5 flex-1" />
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              {job.processed_items}/{job.total_items}
            </span>
          </div>
        ))}
        {activeJobs.length > 3 && (
          <span className="text-[10px] text-muted-foreground">
            +{activeJobs.length - 3} autre{activeJobs.length - 3 > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
