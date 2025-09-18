import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Clock,
  X,
  Settings,
  Filter
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
  actionUrl?: string
  metadata?: Record<string, any>
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    generateNotifications()
    
    // Simuler des notifications en temps réel
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% de chance d'avoir une nouvelle notification
        addRandomNotification()
      }
    }, 10000) // Toutes les 10 secondes

    return () => clearInterval(interval)
  }, [])

  const generateNotifications = () => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        category: 'order',
        title: 'Commande traitée',
        message: 'Commande #ORD-2024-156 expédiée avec succès',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
        read: false,
        priority: 'medium',
        actionUrl: '/orders/ORD-2024-156'
      },
      {
        id: '2',
        type: 'warning',
        category: 'inventory',
        title: 'Stock faible',
        message: 'Produit "Smartphone XY" - Stock: 3 unités restantes',
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
        read: false,
        priority: 'high',
        actionUrl: '/inventory',
        metadata: { productId: 'prod_123', currentStock: 3 }
      },
      {
        id: '3',
        type: 'info',
        category: 'customer',
        title: 'Nouveau client VIP',
        message: 'Marie Dubois a atteint le statut VIP (5000€ d\'achats)',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        read: true,
        priority: 'medium',
        actionUrl: '/customers/marie-dubois'
      },
      {
        id: '4',
        type: 'error',
        category: 'system',
        title: 'Erreur de synchronisation',
        message: 'Échec de synchronisation avec le fournisseur "TechSupply"',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1h ago
        read: false,
        priority: 'urgent',
        actionUrl: '/integrations/techsupply'
      },
      {
        id: '5',
        type: 'success',
        category: 'marketing',
        title: 'Campagne terminée',
        message: 'Campagne email "Black Friday" - Taux d\'ouverture: 34.2%',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2h ago
        read: true,
        priority: 'low',
        actionUrl: '/marketing/campaigns'
      }
    ]

    setNotifications(mockNotifications)
  }

  const addRandomNotification = () => {
    const types: Notification['type'][] = ['success', 'warning', 'info']
    const categories: Notification['category'][] = ['order', 'customer', 'inventory', 'marketing']
    
    const randomNotifications = [
      {
        type: 'success' as const,
        category: 'order' as const,
        title: 'Nouvelle commande',
        message: `Commande #ORD-${Date.now()} reçue - Montant: ${Math.floor(Math.random() * 500 + 100)}€`,
        priority: 'medium' as const
      },
      {
        type: 'info' as const,
        category: 'customer' as const,
        title: 'Nouveau client',
        message: 'Un nouveau client s\'est inscrit sur votre boutique',
        priority: 'low' as const
      },
      {
        type: 'warning' as const,
        category: 'inventory' as const,
        title: 'Stock en baisse',
        message: `Produit populaire en stock limité`,
        priority: 'medium' as const
      }
    ]

    const randomNotif = randomNotifications[Math.floor(Math.random() * randomNotifications.length)]
    
    const newNotification: Notification = {
      id: Date.now().toString(),
      ...randomNotif,
      timestamp: new Date().toISOString(),
      read: false
    }

    setNotifications(prev => [newNotification, ...prev])
    
    // Toast pour les nouvelles notifications
    toast.success(`📢 ${newNotification.title}`, {
      description: newNotification.message,
      duration: 4000
    })
  }

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getCategoryIcon = (category: Notification['category']) => {
    switch (category) {
      case 'order':
        return <ShoppingCart className="h-4 w-4" />
      case 'customer':
        return <Users className="h-4 w-4" />
      case 'inventory':
        return <Package className="h-4 w-4" />
      case 'marketing':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
  }

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
    toast.success('Toutes les notifications marquées comme lues')
  }

  const filteredNotifications = notifications.filter(notif => {
    switch (filter) {
      case 'unread':
        return !notif.read
      case 'urgent':
        return notif.priority === 'urgent' || notif.priority === 'high'
      default:
        return true
    }
  })

  const unreadCount = notifications.filter(n => !n.read).length
  const urgentCount = notifications.filter(n => n.priority === 'urgent').length

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Centre de Notifications
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Restez informé des événements importants en temps réel
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Tout marquer lu
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Toutes ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Non lues ({unreadCount})
          </Button>
          <Button
            variant={filter === 'urgent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('urgent')}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Urgentes ({urgentCount})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune notification à afficher</p>
              </div>
            ) : (
              filteredNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div 
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
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
                            <Badge 
                              className={`${getPriorityColor(notification.priority)} text-white text-xs`}
                            >
                              {notification.priority}
                            </Badge>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(notification.timestamp).toLocaleString('fr-FR')}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {notification.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeNotification(notification.id)
                        }}
                        className="ml-2"
                      >
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