/**
 * ChannelOrdersPanel - Gestion des commandes du canal
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
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

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30', icon: Clock },
  processing: { label: 'En cours', color: 'bg-blue-500/10 text-blue-700 border-blue-500/30', icon: Package },
  shipped: { label: 'Expédié', color: 'bg-purple-500/10 text-purple-700 border-purple-500/30', icon: Truck },
  delivered: { label: 'Livré', color: 'bg-green-500/10 text-green-700 border-green-500/30', icon: CheckCircle2 },
  cancelled: { label: 'Annulé', color: 'bg-red-500/10 text-red-700 border-red-500/30', icon: AlertCircle },
}

export function ChannelOrdersPanel({ channelId, onRefresh }: ChannelOrdersPanelProps) {
  // Fetch recent orders for this channel's user
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['channel-orders', channelId],
    queryFn: async () => {
      // Get user_id from the integration
      const { data: integration } = await supabase
        .from('integrations')
        .select('user_id')
        .eq('id', channelId)
        .single()
      
      if (!integration?.user_id) return []
      
      // Get recent orders
      const { data } = await supabase
        .from('orders')
        .select(`
          id, 
          order_number, 
          total_amount, 
          currency, 
          status, 
          created_at,
          customer_name,
          customer_email
        `)
        .eq('user_id', integration.user_id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      return data || []
    },
    enabled: !!channelId
  })

  // Calculate stats
  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter(o => o.status === 'pending').length || 0,
    processing: orders?.filter(o => o.status === 'processing').length || 0,
    revenue: orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
  }

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-green-500/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-500/10">
              <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Commandes récentes</CardTitle>
              <p className="text-sm text-muted-foreground">
                {stats.total} commande{stats.total !== 1 ? 's' : ''} • {stats.pending} en attente
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { refetch(); onRefresh?.() }}
            disabled={isLoading}
            className="gap-2 rounded-xl"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Actualiser
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">En attente</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <p className="text-2xl font-bold">{stats.processing}</p>
            <p className="text-xs text-muted-foreground">En cours</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <p className="text-2xl font-bold">€{stats.revenue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-2">
            {orders.map((order, index) => {
              const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
              const StatusIcon = status.icon
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-all group"
                >
                  <div className={cn("p-2 rounded-lg", status.color)}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">#{order.order_number || order.id.slice(0, 8)}</p>
                      <Badge variant="outline" className={cn("text-xs", status.color)}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.customer_name || order.customer_email || 'Client anonyme'}
                    </p>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <p className="font-bold">€{(order.total_amount || 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.created_at && format(new Date(order.created_at), 'dd MMM HH:mm', { locale: getDateFnsLocale() })}
                    </p>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Aucune commande</p>
            <p className="text-xs text-muted-foreground mt-1">Les nouvelles commandes apparaîtront ici</p>
          </div>
        )}
        
        {/* View All Button */}
        {orders && orders.length > 0 && (
          <Button 
            variant="outline" 
            className="w-full mt-4 gap-2 rounded-xl"
            onClick={() => window.location.href = '/orders'}
          >
            Voir toutes les commandes
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
