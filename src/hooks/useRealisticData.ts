import { useState } from 'react'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface UseRealisticDataReturn {
  generateRealisticData: () => Promise<void>
  loading: boolean
}

export const useRealisticData = (): UseRealisticDataReturn => {
  const [loading, setLoading] = useState(false)
  const { user } = useUnifiedAuth()
  const { toast } = useToast()

  const generateRealisticData = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour générer des données",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-realistic-data', {
        body: { user_id: user.id }
      })

      if (error) {
        throw error
      }

      toast({
        title: "Données générées",
        description: `${data.data.suppliers} fournisseurs, ${data.data.customers} clients, ${data.data.orders} commandes créées`,
      })
      
      // Refresh the page to show new data
      setTimeout(() => window.location.reload(), 1000)
    } catch (error: any) {
      console.error('Error generating realistic data:', error)
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la génération des données",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    generateRealisticData,
    loading
  }
}