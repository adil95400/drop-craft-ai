import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: string
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Nouveau produit gagnant détecté',
      message: 'Coque iPhone transparente - 15% d\'augmentation des ventes',
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: '2',
      title: 'Stock faible',
      message: 'Écouteurs Bluetooth - 5 unités restantes',
      type: 'warning',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false
    },
    {
      id: '3',
      title: 'Synchronisation terminée',
      message: '47 nouveaux produits importés depuis AliExpress',
      type: 'info',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true
    }
  ])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
    toast({
      title: "Notifications",
      description: "Toutes les notifications ont été marquées comme lues",
    })
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
    toast({
      title: "Notification supprimée",
      description: "La notification a été supprimée",
    })
  }

  const clearAll = () => {
    setNotifications([])
    toast({
      title: "Notifications effacées",
      description: "Toutes les notifications ont été supprimées",
    })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refetch: () => {}
  }
}