import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface OAuthSupplierResult {
  success: boolean
  auth_url?: string
  state?: string
  connected?: boolean
  message?: string
  error?: string
}

export const useOAuthSupplier = () => {
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  const initiateOAuth = async (supplierId: string): Promise<string | null> => {
    setIsConnecting(true)
    
    try {
      const redirectUri = `${window.location.origin}/oauth-callback`
      
      const { data, error } = await supabase.functions.invoke('oauth-supplier', {
        body: {
          action: 'initiate_oauth',
          supplier_id: supplierId,
          redirect_uri: redirectUri
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      const result = data as OAuthSupplierResult
      
      if (result.success && result.auth_url) {
        // Store state for later verification
        localStorage.setItem('oauth_state', result.state || '')
        localStorage.setItem('oauth_supplier', supplierId)
        
        toast({
          title: "Redirection OAuth",
          description: `Redirection vers ${supplierId} pour l'autorisation...`
        })
        
        // Open OAuth URL in new window
        const popup = window.open(
          result.auth_url,
          'oauth_popup',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        )

        return new Promise((resolve) => {
          const checkClosed = setInterval(() => {
            if (popup?.closed) {
              clearInterval(checkClosed)
              setIsConnecting(false)
              // Check if auth was successful by looking for updated integration
              setTimeout(() => {
                checkAuthStatus(supplierId)
              }, 1000)
              resolve(null)
            }
          }, 1000)
        })
      } else {
        throw new Error(result.error || 'Échec de l\'initialisation OAuth')
      }
    } catch (error: any) {
      console.error('OAuth initiation error:', error)
      toast({
        title: "Erreur OAuth",
        description: error.message || 'Impossible de démarrer l\'authentification',
        variant: "destructive"
      })
      setIsConnecting(false)
      return null
    }
  }

  const checkAuthStatus = async (supplierId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('oauth-supplier', {
        body: {
          action: 'test_connection',
          supplier_id: supplierId
        }
      })

      if (!error && data?.connected) {
        toast({
          title: "Connexion réussie",
          description: `Votre compte ${supplierId} a été connecté avec succès`
        })
        return true
      }
    } catch (error) {
      console.error('Auth status check error:', error)
    }
    return false
  }

  const handleOAuthCallback = async (code: string, state: string, supplierId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('oauth-supplier', {
        body: {
          action: 'handle_callback',
          auth_data: { code, state, supplier_id: supplierId }
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      const result = data as OAuthSupplierResult
      
      if (result.success) {
        toast({
          title: "Authentification réussie",
          description: result.message || `Connexion établie avec ${supplierId}`
        })
        return true
      } else {
        throw new Error(result.error || 'Échec de l\'authentification')
      }
    } catch (error: any) {
      console.error('OAuth callback error:', error)
      toast({
        title: "Erreur d'authentification",
        description: error.message,
        variant: "destructive"
      })
      return false
    }
  }

  return {
    initiateOAuth,
    handleOAuthCallback,
    checkAuthStatus,
    isConnecting
  }
}