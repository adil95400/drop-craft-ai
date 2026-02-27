/**
 * ChannelOrdersPanel - Channable-style orders view
 * Compact data table with status indicators
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ShoppingCart, Package, Truck, CheckCircle2, Clock, 
  AlertCircle, ExternalLink, RefreshCw, Eye
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

interface ChannelOrdersPanelProps {
  channelId: string
  onRefresh?: () => void
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'En attente', color: 'text-amber-700 bg-amber-500/10 border-amber-500/30', icon: Clock },
  processing: { label: 'En cours', color: 'text-blue-700 bg-blue-500/10 border-blue-500/30', icon: Package },
  shipped: { label: 'Expédié', color: 'text-purple-700 bg-purple-500/10 border-purple-500/30', icon: Truck },
  delivered: { label: 'Livré', color: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 },
  cancelled: { label: 'Annulé', color: 'text-destructive bg-destructive/10 border-destructive/30', icon: AlertCircle },
}

export function ChannelOrdersPanel({ channelId, onRefresh }: ChannelOrdersPanelProps) {
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['channel-orders', channelId],
    queryFn: async () => {
      const { data: integration } = await supabase
        .from('integrations')
        .select('user_id')
        .eq('id', channelId)
        .single()
      
      if (!integration?.user_id) return []
      
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, currency, status, created_at, customer_name, customer_email')
        .eq('user_id', integration.user_id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      return data || []
    },
    enabled: !!channelId
  })

  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter(o => o.status === 'pending').length || 0,
    processing: orders?.filter(o => o.status === 'processing').length || 0,
    revenue: orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
  }

  return (
    <Card className="shadow-none border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="h-4 w-4 text-emerald-500" />
            <div>
              <CardTitle className="text-sm font-semibold">Commandes récentes</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                {stats.total} commande{stats.total !== 1 ? 's' : ''} • {stats.pending} en attente
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { refetch(); onRefresh?.() }}
            disabled={isLoading}
            className="gap-1.5 h-8 text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Actualiser
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: 'En attente', value: stats.pending },
            { label: 'En cours', value: stats.processing },
            { label: 'Revenus', value: `€${stats.revenue.toFixed(0)}` },
          ].map((s) => (
            <div key={s.label} className="p-2.5 rounded-lg bg-muted/50 border border-border text-center">
              <p className="text-lg font-bold tabular-nums">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-1.5">
            {orders.map((order) => {
              const sc = statusConfig[order.status as string] || statusConfig.pending
              const StatusIcon = sc.icon
              
              return (
                <div
                  key={order.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors group"
                >
                  <div className={cn("p-1.5 rounded-md", sc.color)}>
                    <StatusIcon className="h-3.5 w-3.5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-xs">#{order.order_number || order.id.slice(0, 8)}</p>
                      <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", sc.color)}>
                        {sc.label}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {order.customer_name || order.customer_email || 'Client anonyme'}
                    </p>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm tabular-nums">€{(order.total_amount || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      {order.created_at && format(new Date(order.created_at), 'dd MMM HH:mm', { locale: getDateFnsLocale() })}
                    </p>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <ShoppingCart className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs font-medium">Aucune commande</p>
            <p className="text-[11px] text-muted-foreground">Les commandes apparaîtront ici</p>
          </div>
        )}
        
        {orders && orders.length > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            className="w-full mt-3 gap-2 text-xs"
            onClick={() => window.location.href = '/orders'}
          >
            Voir toutes les commandes
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
