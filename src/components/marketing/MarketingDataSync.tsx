import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Zap, CheckCircle2 } from 'lucide-react'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'

export function MarketingDataSync() {
  const { refreshData, isLoading } = useRealTimeMarketing()
  const [lastSync, setLastSync] = useState(new Date())

  const handleSync = async () => {
    await refreshData()
    setLastSync(new Date())
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <Zap className="h-3 w-3 mr-1" />
        Temps Réel
      </Badge>
      <Button 
        onClick={handleSync} 
        variant="ghost" 
        size="sm" 
        disabled={isLoading}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        Synchroniser
      </Button>
    </div>
  )
}