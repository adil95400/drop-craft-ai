/**
 * Hook pour gérer l'export de produits vers Shopify
 */
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface ShopifyIntegration {
  id: string
  store_url: string
  platform: string
  is_active: boolean
  config?: Record<string, unknown>
}

interface ExportResult {
  success: boolean
  exported_count?: number
  errors?: string[]
  message?: string
}

export function useShopifyExport() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [integrations, setIntegrations] = useState<ShopifyIntegration[]>([])

  /**
   * Charger les intégrations Shopify actives
   */
  const loadIntegrations = async (): Promise<ShopifyIntegration[]> => {
    if (!user) return []
    
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('id, store_url, platform, is_active, config')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (error) throw error

      const shopifyIntegrations = (data || []).filter(
        i => i.platform === 'shopify' || i.store_url?.includes('myshopify.com')
      ) as ShopifyIntegration[]

      setIntegrations(shopifyIntegrations)
      return shopifyIntegrations
    } catch (error) {
      console.error('Error loading integrations:', error)
      toast.error('Impossible de charger les intégrations Shopify')
      return []
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Exporter des produits vers Shopify
   */
  const exportProducts = async (
    integrationId: string,
    productIds: string[]
  ): Promise<ExportResult> => {
    if (!user) {
      return { success: false, errors: ['Non authentifié'] }
    }

    const integration = integrations.find(i => i.id === integrationId)
    if (!integration) {
      // Recharger les intégrations si pas trouvée
      const loaded = await loadIntegrations()
      const found = loaded.find(i => i.id === integrationId)
      if (!found) {
        return { success: false, errors: ['Intégration non trouvée'] }
      }
    }

    const targetIntegration = integration || integrations.find(i => i.id === integrationId)
    if (!targetIntegration) {
      return { success: false, errors: ['Intégration non trouvée'] }
    }

    // Extraire les credentials
    const config = targetIntegration.config || {}
    const credentials = (config?.credentials as Record<string, string>) || {}
    const shopDomain = credentials?.shop_domain || 
      targetIntegration.store_url?.replace('https://', '').replace('http://', '')
    const accessToken = credentials?.access_token

    if (!shopDomain || !accessToken) {
      return { 
        success: false, 
        errors: ['Credentials Shopify manquants. Veuillez reconfigurer l\'intégration.'] 
      }
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('shopify-operations', {
        body: {
          operation: 'export-products',
          integrationId,
          credentials: {
            shop_domain: shopDomain,
            access_token: accessToken
          },
          operation_data: {
            product_ids: productIds
          }
        }
      })

      if (error) throw error

      const result = data as ExportResult
      
      if (result.success) {
        toast.success(result.message || `${result.exported_count} produit(s) exporté(s)`)
      }

      return result
    } catch (error) {
      console.error('Export error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      toast.error(`Erreur d'export: ${errorMessage}`)
      return { success: false, errors: [errorMessage] }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Vérifier si au moins une intégration Shopify est active
   */
  const hasActiveIntegration = integrations.length > 0

  /**
   * Obtenir la première intégration active (pour export rapide)
   */
  const getDefaultIntegration = (): ShopifyIntegration | undefined => {
    return integrations[0]
  }

  return {
    isLoading,
    integrations,
    hasActiveIntegration,
    loadIntegrations,
    exportProducts,
    getDefaultIntegration
  }
}
