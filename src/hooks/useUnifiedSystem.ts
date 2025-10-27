/**
 * Hook unifié optimisé avec memoization et performance améliorée
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { unifiedSystem } from '@/lib/unified-system'

interface DashboardStats {
  totalSuppliers: number
  totalProducts: number
  totalJobs: number
  recentJobs: any[]
  publishedProducts: number
}

export function useUnifiedSystem() {
  const { user, profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalSuppliers: 0,
    totalProducts: 0,
    totalJobs: 0,
    recentJobs: [],
    publishedProducts: 0
  })

  // Memoized admin check
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsAdmin(false)
        return
      }

      try {
        const adminStatus = await unifiedSystem.isAdmin(user.id)
        setIsAdmin(adminStatus)
      } catch (error) {
        console.error('Admin status check failed:', error)
        setIsAdmin(false)
      }
    }

    checkAdminStatus()
  }, [user?.id])

  // Load dashboard stats with error handling
  useEffect(() => {
    const loadDashboardStats = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const stats = await unifiedSystem.getDashboardStats(user.id)
        setDashboardStats(stats)
      } catch (error) {
        console.error('Dashboard stats loading failed:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadDashboardStats()
    }
  }, [user?.id, authLoading])

  // Memoized feature check
  const hasFeature = useCallback(
    async (feature: string): Promise<boolean> => {
      if (!user?.id) return false
      if (isAdmin) return true
      
      try {
        return await unifiedSystem.hasFeature(user.id, feature)
      } catch (error) {
        console.error('Feature check failed:', error)
        return false
      }
    },
    [user?.id, isAdmin]
  )

  // Memoized data fetchers
  const getSuppliers = useCallback(async () => {
    if (!user?.id) return []
    return await unifiedSystem.getSuppliers(user.id)
  }, [user?.id])

  const getProducts = useCallback(async () => {
    if (!user?.id) return []
    return await unifiedSystem.getImportedProducts(user.id)
  }, [user?.id])

  const getImportJobs = useCallback(async () => {
    if (!user?.id) return []
    return await unifiedSystem.getImportJobs(user.id)
  }, [user?.id])

  const getOrders = useCallback(() => 
    unifiedSystem.getOrders(user?.id || ''), [user?.id]
  )

  const getCustomers = useCallback(() => 
    unifiedSystem.getCustomers(user?.id || ''), [user?.id]
  )

  // Memoized CRUD actions
  const createProduct = useCallback(
    (productData: any) => unifiedSystem.createProduct(user?.id || '', productData),
    [user?.id]
  )

  const updateProduct = useCallback(
    (productId: string, productData: any) => 
      unifiedSystem.updateProduct(productId, productData),
    []
  )

  const deleteProduct = useCallback(
    (productId: string) => unifiedSystem.deleteProduct(productId),
    []
  )

  const createImportJob = useCallback(
    (jobData: any) => unifiedSystem.createImportJob(user?.id || '', jobData),
    [user?.id]
  )

  // Memoized refresh function
  const refresh = useCallback(() => {
    if (user?.id) {
      unifiedSystem.getDashboardStats(user.id).then(setDashboardStats)
    }
  }, [user?.id])

  // Memoized plan calculations
  const isPro = useMemo(() => 
    profile?.plan === 'pro' || profile?.plan === 'ultra_pro' || isAdmin,
    [profile?.plan, isAdmin]
  )

  const isUltraPro = useMemo(() => 
    profile?.plan === 'ultra_pro' || isAdmin,
    [profile?.plan, isAdmin]
  )

  const plan = useMemo(() => 
    isAdmin ? 'ultra_pro' : (profile?.plan || 'standard'),
    [isAdmin, profile?.plan]
  )

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
    getOrders,
    getCustomers,
    
    // Actions CRUD
    createProduct,
    updateProduct,
    deleteProduct,
    createImportJob,
    
    // Refresh function
    refresh
  }
}