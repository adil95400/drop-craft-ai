/**
 * Hook unifié qui remplace tous les hooks de plan/module dispersés
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { unifiedSystem } from '@/lib/unified-system'

export function useUnifiedSystem() {
  const { user, profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [dashboardStats, setDashboardStats] = useState({
    totalSuppliers: 0,
    totalProducts: 0,
    totalJobs: 0,
    recentJobs: [],
    publishedProducts: 0
  })

  // Vérification du rôle admin
  useEffect(() => {
    async function checkAdminStatus() {
      if (!user?.id) {
        setIsAdmin(false)
        return
      }

      const adminStatus = await unifiedSystem.isAdmin(user.id)
      setIsAdmin(adminStatus)
    }

    checkAdminStatus()
  }, [user?.id])

  // Chargement des statistiques du dashboard
  useEffect(() => {
    async function loadDashboardStats() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const stats = await unifiedSystem.getDashboardStats(user.id)
        setDashboardStats(stats)
      } catch (error) {
        console.error('Error loading dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadDashboardStats()
    }
  }, [user?.id, authLoading])

  // Fonction pour vérifier les features
  const hasFeature = async (feature: string): Promise<boolean> => {
    if (!user?.id) return false
    return await unifiedSystem.hasFeature(user.id, feature)
  }

  // Fonctions pour les fournisseurs
  const getSuppliers = async () => {
    if (!user?.id) return []
    return await unifiedSystem.getSuppliers(user.id)
  }

  // Fonctions pour les produits
  const getProducts = async () => {
    if (!user?.id) return []
    return await unifiedSystem.getImportedProducts(user.id)
  }

  // Fonctions pour les jobs d'import
  const getImportJobs = async () => {
    if (!user?.id) return []
    return await unifiedSystem.getImportJobs(user.id)
  }

  // Vérifications de plan simplifiées
  const isPro = profile?.plan === 'pro' || profile?.plan === 'ultra_pro' || isAdmin
  const isUltraPro = profile?.plan === 'ultra_pro' || isAdmin
  const plan = profile?.plan || 'standard'

  return {
    // État général
    user,
    profile,
    loading: authLoading || loading,
    isAdmin,
    
    // Plan et features
    plan,
    isPro,
    isUltraPro,
    hasFeature,
    
    // Données
    dashboardStats,
    getSuppliers,
    getProducts,
    getImportJobs,
    
    // Refresh function
    refresh: () => {
      if (user?.id) {
        unifiedSystem.getDashboardStats(user.id).then(setDashboardStats)
      }
    }
  }
}