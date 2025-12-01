import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, X, CheckCircle, AlertCircle } from 'lucide-react'

interface BulkImportProgressProps {
  isImporting: boolean
  progress: number
  onCancel: () => void
}

export function BulkImportProgress({
  isImporting,
  progress,
  onCancel
}: BulkImportProgressProps) {
  if (!isImporting && progress === 0) return null

  const isComplete = progress === 100
  const isError = progress > 0 && !isImporting && !isComplete

  return (
    <Card className="p-6 border-border bg-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isImporting && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
            {isComplete && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {isError && (
              <AlertCircle className="h-5 w-5 text-destructive" />
            )}
            <div>
              <h3 className="font-semibold text-foreground">
                {isImporting && 'Import en cours...'}
                {isComplete && 'Import terminé'}
                {isError && 'Import avec erreurs'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {progress}% complété
              </p>
            </div>
          </div>

          {isImporting && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          )}
        </div>

        <Progress value={progress} className="w-full" />

        {isComplete && (
          <p className="text-sm text-muted-foreground">
            Tous les produits ont été importés avec succès!
          </p>
        )}
      </div>
    </Card>
  )
}
