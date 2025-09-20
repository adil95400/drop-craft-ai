import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, CheckCircle, AlertTriangle, Info, X, Clock } from 'lucide-react'
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'Import CSV terminé',
      message: '45 produits ont été importés avec succès',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      read: false
    },
    {
      id: '2',
      type: 'info',
      title: 'Synchronisation en cours',
      message: 'Sync bidirectionnelle avec BigBuy en cours...',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      read: false
    },
    {
      id: '3',
      type: 'warning',
      title: 'Stock faible détecté',
      message: '12 produits ont un stock inférieur à 5 unités',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      read: true
    }
  ])

  // Real-time updates for notifications
  useRealTimeUpdates({
    table: 'activity_logs',
    onUpdate: (payload) => {
      if (payload.new) {
        const newNotification: Notification = {
          id: payload.new.id,
          type: payload.new.severity === 'error' ? 'error' : 'info',
          title: 'Nouvelle activité',
          message: payload.new.description,
          timestamp: payload.new.created_at,
          read: false
        }
        setNotifications(prev => [newNotification, ...prev.slice(0, 19)])
      }
    }
  })

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return AlertTriangle
      case 'info': return Info
      default: return Bell
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-success'
      case 'warning': return 'text-warning'
      case 'error': return 'text-destructive'
      case 'info': return 'text-primary'
      default: return 'text-muted-foreground'
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </CardTitle>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {notifications.map((notification) => {
              const IconComponent = getIcon(notification.type)
              
              return (
                <div 
                  key={notification.id} 
                  className={`p-3 border rounded-lg transition-colors ${
                    !notification.read ? 'bg-muted/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full bg-background ${getTypeColor(notification.type)}`}>
                      <IconComponent className="w-3 h-3" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium">
                          {notification.title}
                        </h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => removeNotification(notification.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(notification.timestamp).toLocaleString()}
                        </div>
                        
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs px-2"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Marquer lu
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {notifications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucune notification</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}