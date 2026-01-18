/**
 * useNotificationPreferences - Hook pour persister les préférences de notifications
 * Utilise localStorage avec fallback, et synchronise avec le profil quand possible
 */
import { useState, useEffect, useCallback } from 'react'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { toast } from 'sonner'

export interface NotificationPreferences {
  email: boolean
  orders: boolean
  stock: boolean
  products: boolean
  reports: boolean
  marketing: boolean
  system: boolean
  push_enabled: boolean
}

export const defaultPreferences: NotificationPreferences = {
  email: true,
  orders: true,
  stock: true,
  products: false,
  reports: false,
  marketing: false,
  system: true,
  push_enabled: false,
}

export function useNotificationPreferences() {
  const { user } = useUnifiedAuth()
  const storageKey = `notification-preferences-${user?.id || 'guest'}`

  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences
    } catch {
      return defaultPreferences
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Charger les préférences au changement d'utilisateur
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setPreferences({ ...defaultPreferences, ...JSON.parse(stored) })
      } else {
        setPreferences(defaultPreferences)
      }
    } catch {
      setPreferences(defaultPreferences)
    }
  }, [storageKey])

  // Sauvegarder les préférences
  const savePreferences = useCallback((newPrefs: NotificationPreferences) => {
    setIsSaving(true)
    try {
      localStorage.setItem(storageKey, JSON.stringify(newPrefs))
      setPreferences(newPrefs)
      toast.success('Préférences sauvegardées')
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }, [storageKey])

  // Fonction pour mettre à jour une préférence individuelle
  const updatePreference = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...preferences, [key]: value }
    savePreferences(updated)
  }, [preferences, savePreferences])

  // Fonction pour mettre à jour plusieurs préférences
  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...updates }
    savePreferences(updated)
  }, [preferences, savePreferences])

  // Fonction pour réinitialiser aux valeurs par défaut
  const resetToDefaults = useCallback(() => {
    savePreferences(defaultPreferences)
  }, [savePreferences])

  return {
    preferences,
    isLoading,
    isSaving,
    updatePreference,
    updatePreferences,
    resetToDefaults,
  }
}

// Hook pour les catégories de notifications
export interface NotificationCategory {
  id: string
  key: keyof NotificationPreferences
  icon: string
  title: string
  description: string
  color: string
}

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    id: 'orders',
    key: 'orders',
    icon: 'ShoppingCart',
    title: 'Commandes',
    description: 'Nouvelles commandes, mises à jour de statut',
    color: 'emerald',
  },
  {
    id: 'stock',
    key: 'stock',
    icon: 'Package',
    title: 'Stock',
    description: 'Alertes de stock bas, ruptures',
    color: 'amber',
  },
  {
    id: 'marketing',
    key: 'marketing',
    icon: 'Megaphone',
    title: 'Marketing',
    description: 'Campagnes, promotions, newsletters',
    color: 'pink',
  },
  {
    id: 'system',
    key: 'system',
    icon: 'Settings',
    title: 'Système',
    description: 'Mises à jour, maintenance, sécurité',
    color: 'blue',
  },
  {
    id: 'products',
    key: 'products',
    icon: 'Tag',
    title: 'Produits',
    description: 'Modifications, imports, exports',
    color: 'violet',
  },
  {
    id: 'reports',
    key: 'reports',
    icon: 'BarChart3',
    title: 'Rapports',
    description: 'Rapports hebdomadaires, analytics',
    color: 'cyan',
  },
]
