import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface SecureCredentialsResult {
  success: boolean
  error?: string
}

export const useSecureCredentials = () => {
  const { toast } = useToast()

  const storeCredentials = async (
    integrationId: string, 
    credentials: Record<string, string>
  ): Promise<SecureCredentialsResult> => {
    try {
      const { error } = await supabase.rpc('log_credential_access', {
        integration_id: integrationId,
        access_type: 'store'
      })
      
      if (error) console.error('Failed to log credential access:', error)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  const retrieveCredentials = async (integrationId: string): Promise<SecureCredentialsResult & { credentials?: Record<string, string> }> => {
    try {
      const { error } = await supabase.rpc('log_credential_access', {
        integration_id: integrationId,
        access_type: 'retrieve'
      })
      
      if (error) console.error('Failed to log credential access:', error)
      return { success: true, credentials: {} }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  const deleteCredentials = async (integrationId: string): Promise<SecureCredentialsResult> => {
    try {
      const { error } = await supabase.rpc('log_credential_access', {
        integration_id: integrationId,
        access_type: 'delete'
      })
      
      if (error) console.error('Failed to log credential access:', error)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  return {
    storeCredentials,
    retrieveCredentials,
    deleteCredentials
  }
}