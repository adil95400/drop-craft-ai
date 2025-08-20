import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

type Notification = {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
  action?: {
    label: string
    url: string
  }
}

export const useNotifications = () => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Nouvelle commande',
      message: 'Vous avez reçu une nouvelle commande #1234',
      type: 'success',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: false,
      action: { label: 'Voir la commande', url: '/orders' }
    },
    {
      id: '2',
      title: 'Stock faible',
      message: '5 produits ont un stock inférieur à 10 unités',
      type: 'warning',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      action: { label: 'Gérer le stock', url: '/inventory' }
    },
    {
      id: '3',
      title: 'Synchronisation terminée',
      message: 'Import de 24 nouveaux produits depuis Shopify',
      type: 'info',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: true,
      action: { label: 'Voir les produits', url: '/catalogue' }
    },
    {
      id: '4',
      title: 'Erreur de synchronisation',
      message: 'Échec de la synchronisation avec Amazon',
      type: 'error',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      read: true,
      action: { label: 'Réessayer', url: '/integrations' }
    }
  ])

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    )
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    )
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    }
    
    setNotifications(prev => [newNotification, ...prev])
    
    // Show toast for new notifications
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default'
    })
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const recentNotifications = notifications.slice(0, 5)

  return {
    notifications,
    recentNotifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification
  }
}