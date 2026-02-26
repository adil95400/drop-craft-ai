import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { importRateLimiter } from '@/services/importRateLimiter'
import { format } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale'

export const RateLimitStatus = () => {
  const locale = useDateFnsLocale()
  const [status, setStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStatus = async () => {
      const result = await importRateLimiter.getStatus('import_start')
      setStatus(result)
      setIsLoading(false)
    }

    loadStatus()
    
    // Refresh every 60 seconds
    const interval = setInterval(loadStatus, 60000)
    
    return () => clearInterval(interval)
  }, [])

  if (isLoading || !status) {
    return null
  }

  const usagePercent = (status.current_count / status.max_requests) * 100
  const isNearLimit = usagePercent > 80

  return (
    <Card className={isNearLimit ? 'border-yellow-500' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Limite d'imports
          </CardTitle>
          {isNearLimit ? (
            <Badge variant="outline" className="text-yellow-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              Proche de la limite
            </Badge>
          ) : (
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              OK
            </Badge>
          )}
        </div>
        <CardDescription>
          {status.current_count} / {status.max_requests} imports utilisés
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={usagePercent} className="h-2" />
        
        <div className="text-xs text-muted-foreground">
          Réinitialisation: {format(new Date(status.reset_at), 'PPp', { locale })}
        </div>

        {isNearLimit && (
          <div className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded">
            Vous approchez de votre limite d'imports horaire. 
            Attendez la réinitialisation ou contactez le support pour augmenter votre limite.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
