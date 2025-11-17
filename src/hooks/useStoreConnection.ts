import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface StoreConnectionData {
  platform: string
  name: string
  domain: string
  credentials: Record<string, any>
}

export function useStoreConnection() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const connectStore = async (data: StoreConnectionData) => {
    setLoading(true)
    try {
      // Validation des données selon la plateforme
      const validationResult = validateStoreConnection(data)
      if (!validationResult.isValid) {
        throw new Error(validationResult.error)
      }

      // Création de l'intégration dans Supabase
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user) {
        throw new Error("Utilisateur non authentifié")
      }

      const { data: integration, error } = await supabase
        .from('integrations')
        .insert({
          user_id: user.user.id,
          platform_type: 'ecommerce',
          platform_name: data.platform,
          platform_url: data.domain,
          shop_domain: data.domain,
          is_active: true,
          connection_status: 'connected',
          store_config: {
            name: data.name,
            platform: data.platform,
            domain: data.domain
          },
          encrypted_credentials: data.credentials,
          sync_settings: {
            auto_sync: data.credentials.features?.auto_sync || false,
            import_products: data.credentials.features?.import_products || true,
            track_orders: data.credentials.features?.track_orders || true
          }
        })
        .select()
        .single()

      if (error) throw error

      // Test de connexion
      const connectionTest = await testStoreConnection(data)
      if (!connectionTest.success) {
        // Mettre à jour le statut de connexion
        await supabase
          .from('integrations')
          .update({
            connection_status: 'error',
            last_error: connectionTest.error
          })
          .eq('id', integration.id)

        throw new Error(connectionTest.error)
      }

      // Log de l'activité
      await supabase.from('activity_logs').insert({
        user_id: user.user.id,
        action: 'store_connected',
        description: `Boutique ${data.name} connectée avec succès`,
        entity_type: 'integration',
        entity_id: integration.id,
        metadata: {
          platform: data.platform,
          domain: data.domain
        }
      })

      toast({
        title: "Succès",
        description: `Boutique ${data.name} connectée avec succès`
      })

      return integration

    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Impossible de connecter la boutique",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const testStoreConnection = async (data: StoreConnectionData) => {
    try {
      // Get current session to pass auth headers
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("Session expirée, veuillez vous reconnecter")
      }

      // Appel à la fonction Edge pour tester la connexion
      const { data: result, error } = await supabase.functions.invoke('store-connection-test', {
        body: {
          platform: data.platform,
          shopDomain: data.domain,
          ...data.credentials
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (error) throw error

      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const validateStoreConnection = (data: StoreConnectionData) => {
    if (!data.name || !data.domain || !data.platform) {
      return { isValid: false, error: "Tous les champs obligatoires doivent être remplis" }
    }

    // Validation spécifique par plateforme
    switch (data.platform) {
      case 'shopify':
        if (!data.credentials.accessToken) {
          return { isValid: false, error: "Access Token requis pour Shopify" }
        }
        // Validation du format du domaine Shopify
        const shopifyDomain = data.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
        if (!shopifyDomain.includes('.myshopify.com') && !shopifyDomain.includes('.')) {
          return { isValid: false, error: "Domaine Shopify invalide" }
        }
        break

      case 'woocommerce':
        if (!data.credentials.consumer_key || !data.credentials.consumer_secret) {
          return { isValid: false, error: "Consumer Key et Consumer Secret requis pour WooCommerce" }
        }
        break

      case 'prestashop':
        if (!data.credentials.webservice_key) {
          return { isValid: false, error: "Webservice Key requis pour PrestaShop" }
        }
        break

      case 'magento':
        if (!data.credentials.access_token) {
          return { isValid: false, error: "Access Token requis pour Magento" }
        }
        break

      default:
        return { isValid: false, error: "Plateforme non supportée" }
    }

    return { isValid: true }
  }

  return {
    connectStore,
    testStoreConnection,
    loading
  }
}