/**
 * File d'attente de validation automatique
 * Traite les produits importés avec validation AI
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { 
  Bot, 
  PlayCircle, 
  PauseCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Settings,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface QueueItem {
  id: string
  product_id: string
  product_name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  validation_score?: number
  validation_issues?: string[]
  created_at: string
  processed_at?: string
}

interface AutoValidationQueueProps {
  integrationId?: string
}

export function AutoValidationQueue({ integrationId }: AutoValidationQueueProps) {
  const queryClient = useQueryClient()
  const [isAutoMode, setIsAutoMode] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  // Fetch pending imports needing validation
  const { data: pendingItems = [], isLoading, refetch } = useQuery({
    queryKey: ['validation-queue', integrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imported_products')
        .select('id, name, status, review_status, created_at')
        .eq('review_status', 'pending')
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error
      return (data || []).map(item => ({
        id: item.id,
        product_id: item.id,
        product_name: item.name || 'Sans nom',
        status: 'pending' as const,
        created_at: item.created_at
      }))
    },
    refetchInterval: isAutoMode ? 10000 : false
  })

  // Validation mutation
  const validateMutation = useMutation({
    mutationFn: async (productId: string) => {
      // Call AI validation edge function
      const { data, error } = await supabase.functions.invoke('audit-product', {
        body: { productId }
      })

      if (error) throw error

      // Update product status
      await supabase
        .from('imported_products')
        .update({ 
          review_status: 'reviewed',
          metadata: { validation: data }
        })
        .eq('id', productId)

      return data
    }
  })

  // Process queue
  const processQueue = async () => {
    if (pendingItems.length === 0) return

    setIsProcessing(true)
    setTotalCount(pendingItems.length)
    setProcessedCount(0)

    for (const item of pendingItems) {
      try {
        await validateMutation.mutateAsync(item.product_id)
        setProcessedCount(prev => prev + 1)
      } catch (error) {
        console.error('Validation failed for:', item.product_id, error)
      }
    }

    setIsProcessing(false)
    queryClient.invalidateQueries({ queryKey: ['validation-queue'] })
    toast.success(`${processedCount} produits validés`)
  }

  // Auto-process when in auto mode
  useEffect(() => {
    if (isAutoMode && pendingItems.length > 0 && !isProcessing) {
      const timer = setTimeout(() => {
        processQueue()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isAutoMode, pendingItems.length, isProcessing])

  const stats = {
    pending: pendingItems.length,
    processing: isProcessing ? 1 : 0,
    completed: processedCount,
    failed: 0
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Validation Automatique
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {pendingItems.length} produits en attente de validation
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch 
                id="auto-mode"
                checked={isAutoMode}
                onCheckedChange={setIsAutoMode}
              />
              <Label htmlFor="auto-mode" className="text-sm">
                Mode auto
              </Label>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <Badge className="bg-blue-500/20 text-blue-700 gap-1 animate-pulse">
              <Zap className="h-3 w-3" />
              Traitement en cours
            </Badge>
          ) : isAutoMode ? (
            <Badge className="bg-green-500/20 text-green-700 gap-1">
              <PlayCircle className="h-3 w-3" />
              Mode automatique actif
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <PauseCircle className="h-3 w-3" />
              En pause
            </Badge>
          )}
        </div>

        {/* Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <Progress 
              value={totalCount > 0 ? (processedCount / totalCount) * 100 : 0} 
              className="h-2" 
            />
            <p className="text-xs text-muted-foreground text-center">
              {processedCount} / {totalCount} produits traités
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">En attente</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-center">
            <Zap className="h-4 w-4 mx-auto text-blue-600 mb-1" />
            <p className="text-lg font-bold text-blue-600">{stats.processing}</p>
            <p className="text-xs text-muted-foreground">En cours</p>
          </div>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-center">
            <CheckCircle2 className="h-4 w-4 mx-auto text-green-600 mb-1" />
            <p className="text-lg font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Validés</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-center">
            <AlertCircle className="h-4 w-4 mx-auto text-red-600 mb-1" />
            <p className="text-lg font-bold text-red-600">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">Échoués</p>
          </div>
        </div>

        {/* Actions */}
        {!isAutoMode && pendingItems.length > 0 && (
          <Button 
            onClick={processQueue}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-pulse" />
                Traitement en cours...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Lancer la validation ({pendingItems.length} produits)
              </>
            )}
          </Button>
        )}

        {/* Recent Items */}
        {pendingItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Produits en attente</h4>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {pendingItems.slice(0, 10).map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded border bg-card text-sm"
                >
                  <span className="truncate flex-1">{item.product_name}</span>
                  <Badge variant="outline" className="text-xs ml-2">
                    {item.status}
                  </Badge>
                </div>
              ))}
              {pendingItems.length > 10 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  +{pendingItems.length - 10} autres produits
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
