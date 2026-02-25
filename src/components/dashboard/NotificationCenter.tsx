import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/integrations/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Bell, CheckCircle2, AlertTriangle, Info, TrendingUp,
  ShoppingCart, Users, Package, Clock, X, Settings
} from 'lucide-react'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'error'
  category: 'order' | 'customer' | 'inventory' | 'system' | 'marketing'
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export function NotificationCenter() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all')
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-center'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      
      // Fetch from active_alerts table
      const { data: alerts } = await (supabase.from('active_alerts') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

      return (alerts || []).map((a: any) => ({
        id: a.id,
        type: a.severity === 'critical' ? 'error' : a.severity === 'warning' ? 'warning' : a.severity === 'info' ? 'info' : 'success',
        category: (a.alert_type?.includes('order') ? 'order' : a.alert_type?.includes('stock') || a.alert_type?.includes('inventory') ? 'inventory' : a.alert_type?.includes('customer') ? 'customer' : 'system') as any,
        title: a.title,
        message: a.message || '',
        timestamp: a.created_at,
        read: a.acknowledged || false,
        priority: a.severity === 'critical' ? 'urgent' : a.severity === 'warning' ? 'high' : a.severity === 'info' ? 'low' : 'medium',
      })) as Notification[]
    },
    refetchInterval: 30_000,
  })

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'info': return <Info className="h-4 w-4 text-blue-500" />
      default: return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getCategoryIcon = (category: Notification['category']) => {
    switch (category) {
      case 'order': return <ShoppingCart className="h-4 w-4" />
      case 'customer': return <Users className="h-4 w-4" />
      case 'inventory': return <Package className="h-4 w-4" />
      case 'marketing': return <TrendingUp className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const markAsRead = async (notificationId: string) => {
    await (supabase.from('active_alerts') as any)
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq('id', notificationId)
    queryClient.invalidateQueries({ queryKey: ['notifications-center'] })
  }

  const removeNotification = async (notificationId: string) => {
    await (supabase.from('active_alerts') as any)
      .update({ status: 'dismissed' })
      .eq('id', notificationId)
    queryClient.invalidateQueries({ queryKey: ['notifications-center'] })
  }

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await (supabase.from('active_alerts') as any)
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('acknowledged', false)
    queryClient.invalidateQueries({ queryKey: ['notifications-center'] })
    toast.success('Toutes les notifications marquées comme lues')
  }

  const filteredNotifications = notifications.filter((notif: Notification) => {
    switch (filter) {
      case 'unread': return !notif.read
      case 'urgent': return notif.priority === 'urgent' || notif.priority === 'high'
      default: return true
    }
  })

  const unreadCount = notifications.filter((n: Notification) => !n.read).length
  const urgentCount = notifications.filter((n: Notification) => n.priority === 'urgent').length

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Centre de Notifications
              {unreadCount > 0 && <Badge className="bg-red-500 text-white ml-2">{unreadCount}</Badge>}
            </CardTitle>
            <CardDescription>Restez informé des événements importants en temps réel</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>Tout marquer lu</Button>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>Toutes ({notifications.length})</Button>
          <Button variant={filter === 'unread' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('unread')}>Non lues ({unreadCount})</Button>
          <Button variant={filter === 'urgent' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('urgent')}>
            <AlertTriangle className="h-4 w-4 mr-1" />Urgentes ({urgentCount})
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Aucune notification à afficher</p>
              </div>
            ) : (
              filteredNotifications.map((notification: Notification, index: number) => (
                <div key={notification.id}>
                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${!notification.read ? 'bg-primary/5 border-primary/20' : 'bg-background'}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(notification.type)}
                          {getCategoryIcon(notification.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <Badge className={`${getPriorityColor(notification.priority)} text-white text-xs`}>{notification.priority}</Badge>
                            {!notification.read && <div className="w-2 h-2 bg-primary rounded-full" />}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(notification.timestamp).toLocaleString('fr-FR')}
                            </div>
                            <Badge variant="secondary" className="text-xs">{notification.category}</Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeNotification(notification.id) }} className="ml-2">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {index < filteredNotifications.length - 1 && <Separator className="my-2" />}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}