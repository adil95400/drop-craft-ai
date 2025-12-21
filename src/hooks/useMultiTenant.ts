import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Tenant {
  id: string
  owner_id: string
  name: string
  slug: string
  domain?: string
  branding: {
    logo_url?: string
    primary_color: string
    secondary_color: string
    custom_css?: string
  }
  features: string[]
  settings: Record<string, any>
  status: 'active' | 'suspended' | 'inactive'
  plan_type: string
  usage_limits: Record<string, any>
  created_at: string
  updated_at: string
}

interface TenantAnalytics {
  tenant_id: string
  users_count: number
  active_users_today: number
  revenue_this_month: number
  api_calls_today: number
  storage_used_mb: number
  features_usage: {
    sso: boolean
    custom_domain: boolean
    white_label: boolean
    api_access: boolean
  }
}

export function useMultiTenant() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<Record<string, TenantAnalytics>>({})
  const { toast } = useToast()

  // Fetch user's tenants via edge function (table doesn't exist yet)
  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('multi-tenant', {
        method: 'GET',
      })

      if (error) throw error

      setTenants(data?.tenants || [])
    } catch (error) {
      console.error('Error fetching tenants:', error)
      // Don't show toast for missing functionality
      setTenants([])
    }
  }

  // Create new tenant
  const createTenant = async (tenantConfig: {
    name: string
    domain?: string
    branding: {
      logo_url?: string
      primary_color: string
      secondary_color: string
      custom_css?: string
    }
    features: string[]
    settings: Record<string, any>
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('multi-tenant', {
        method: 'POST',
        body: {
          ...tenantConfig,
          path: '/create'
        }
      })

      if (error) throw error

      setTenants(prev => [...prev, data.tenant])
      
      toast({
        title: "Succès",
        description: `Tenant "${tenantConfig.name}" créé avec succès`,
      })

      return data.tenant
    } catch (error) {
      console.error('Error creating tenant:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le tenant",
        variant: "destructive"
      })
      throw error
    }
  }

  // Update tenant branding (white-label)
  const updateTenantBranding = async (
    tenantId: string,
    branding?: Partial<Tenant['branding']>,
    settings?: Record<string, any>
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('multi-tenant', {
        method: 'PUT',
        body: {
          tenant_id: tenantId,
          branding,
          settings,
          path: '/branding'
        }
      })

      if (error) throw error

      setTenants(prev => prev.map(tenant =>
        tenant.id === tenantId ? data.tenant : tenant
      ))
      
      toast({
        title: "Succès",
        description: "Branding mis à jour avec succès",
      })

      return data.tenant
    } catch (error) {
      console.error('Error updating tenant branding:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le branding",
        variant: "destructive"
      })
      throw error
    }
  }

  // Fetch tenant analytics
  const fetchTenantAnalytics = async (tenantId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('multi-tenant', {
        method: 'GET',
        body: {
          path: `/analytics?tenant_id=${tenantId}`
        }
      })

      if (error) throw error

      setAnalytics(prev => ({
        ...prev,
        [tenantId]: data.analytics
      }))

      return data.analytics
    } catch (error) {
      console.error('Error fetching tenant analytics:', error)
      return null
    }
  }

  // Delete tenant - use edge function instead of direct DB access
  const deleteTenant = async (tenantId: string) => {
    try {
      const { error } = await supabase.functions.invoke('multi-tenant', {
        method: 'DELETE',
        body: { tenant_id: tenantId }
      })

      if (error) throw error

      setTenants(prev => prev.filter(tenant => tenant.id !== tenantId))
      setAnalytics(prev => {
        const { [tenantId]: deleted, ...rest } = prev
        return rest
      })
      
      toast({
        title: "Succès",
        description: "Tenant supprimé avec succès",
      })
    } catch (error) {
      console.error('Error deleting tenant:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le tenant",
        variant: "destructive"
      })
    }
  }

  // Update tenant status - use edge function
  const updateTenantStatus = async (tenantId: string, status: Tenant['status']) => {
    try {
      const { error } = await supabase.functions.invoke('multi-tenant', {
        method: 'PUT',
        body: { tenant_id: tenantId, status }
      })

      if (error) throw error

      setTenants(prev => prev.map(tenant =>
        tenant.id === tenantId ? { ...tenant, status } : tenant
      ))
      
      toast({
        title: "Succès",
        description: `Tenant ${status === 'active' ? 'activé' : 'suspendu'}`,
      })
    } catch (error) {
      console.error('Error updating tenant status:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le status",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchTenants()
      setLoading(false)
    }

    loadData()
  }, [])

  return {
    tenants,
    loading,
    analytics,
    createTenant,
    updateTenantBranding,
    fetchTenantAnalytics,
    deleteTenant,
    updateTenantStatus,
    refetch: fetchTenants
  }
}
