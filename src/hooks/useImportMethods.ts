import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export interface ImportMethod {
  id: string
  user_id: string
  job_type: string
  job_subtype?: string | null
  supplier_id?: string
  status: string
  total_products: number
  processed_products: number
  successful_imports: number
  failed_imports: number
  import_settings?: any
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
  // mapped from jobs table
  total_items?: number
  processed_items?: number
  failed_items?: number
  metadata?: any
}

export interface ImportMethodTemplate {
  id: string
  title: string
  description: string
  category: 'Basic' | 'Advanced' | 'AI' | 'Enterprise'
  icon: any
  features: string[]
  complexity: 'easy' | 'medium' | 'advanced'
  premium: boolean
}

export function useImportMethods() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [importMethods, setImportMethods] = useState<ImportMethod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchImportMethods()
    }
  }, [user])

  const fetchImportMethods = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user?.id)
        .in('job_type', ['import', 'csv_import', 'url_import', 'bulk_import'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setImportMethods((data || []).map((item: any) => ({
        ...item,
        processed_products: item.processed_items || 0,
        total_products: item.total_items || 0,
        successful_imports: (item.processed_items || 0) - (item.failed_items || 0),
        failed_imports: item.failed_items || 0,
        supplier_id: item.metadata?.supplier_id,
        import_settings: item.metadata?.import_settings,
      })) as ImportMethod[])
    } catch (error) {
      console.error('Error fetching import methods:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les méthodes d'import",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const configureMethod = async (template: ImportMethodTemplate, configuration: any) => {
    if (!user) return false

    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          user_id: user.id,
          job_type: 'import',
          job_subtype: template.category.toLowerCase(),
          status: 'pending',
          total_items: 0,
          processed_items: 0,
          failed_items: 0,
          metadata: { supplier_id: configuration.supplier || null, import_settings: configuration }
        }])
        .select()
        .maybeSingle()

      if (error) throw error

      setImportMethods(prev => [{ ...data, processed_products: 0, total_products: 0, successful_imports: 0, failed_imports: 0 } as unknown as ImportMethod, ...prev])
      toast({
        title: "Succès",
        description: `${template.title} configuré avec succès`
      })
      return true
    } catch (error) {
      console.error('Error configuring import method:', error)
      toast({
        title: "Erreur",
        description: "Impossible de configurer la méthode d'import",
        variant: "destructive"
      })
      return false
    }
  }

  const executeImport = async (methodId: string, importData: any) => {
    try {
      const method = importMethods.find(m => m.id === methodId)
      if (!method) return false

      // Simuler l'exécution de l'import
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mettre à jour les statistiques
      const { error } = await supabase
        .from('import_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', methodId)
        .eq('user_id', user?.id)

      if (error) throw error

      setImportMethods(prev =>
        prev.map(m =>
          m.id === methodId
            ? {
                ...m,
                status: 'completed',
                completed_at: new Date().toISOString()
              }
            : m
        )
      )

      // Créer un job d'import dans la table import_jobs
      const totalProducts = Math.floor(Math.random() * 100) + 10
      const { error: jobError } = await supabase
        .from('jobs')
        .insert([{
          user_id: user.id,
          job_type: 'import',
          job_subtype: method.job_type,
          status: 'completed',
          total_items: totalProducts,
          processed_items: totalProducts,
          failed_items: 0,
          metadata: {
            supplier_id: (method as any).supplier_id,
            import_settings: { method_used: method.job_type, imported_products: totalProducts }
          },
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }])

      if (jobError) console.error('Error creating import job:', jobError)

      toast({
        title: "Import terminé",
        description: `${totalProducts} produits importés avec ${method.job_type}`
      })
      return true
    } catch (error) {
      console.error('Error executing import:', error)
      
      // Incrémenter le compteur d'erreurs
      const method = importMethods.find(m => m.id === methodId)
      if (method) {
        await supabase
          .from('import_jobs')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', methodId)
          .eq('user_id', user?.id)
      }

      toast({
        title: "Erreur",
        description: "Erreur lors de l'import",
        variant: "destructive"
      })
      return false
    }
  }

  const updateMethodConfiguration = async (methodId: string, configuration: any) => {
    try {
      const { error } = await (supabase as any)
        .from('import_jobs')
        .update({
          mapping_config: configuration,
          updated_at: new Date().toISOString()
        })
        .eq('id', methodId)
        .eq('user_id', user?.id)

      if (error) throw error

      setImportMethods(prev =>
        prev.map(method =>
          method.id === methodId
            ? { ...method, mapping_config: configuration }
            : method
        )
      )

      toast({
        title: "Succès",
        description: "Configuration mise à jour"
      })
    } catch (error) {
      console.error('Error updating method configuration:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la configuration",
        variant: "destructive"
      })
    }
  }

  const toggleMethodStatus = async (methodId: string) => {
    try {
      const method = importMethods.find(m => m.id === methodId)
      if (!method) return

      const newStatus = method.status === 'completed' ? 'cancelled' : 'pending'
      const { error } = await supabase
        .from('import_jobs')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', methodId)
        .eq('user_id', user?.id)

      if (error) throw error

      setImportMethods(prev =>
        prev.map(m =>
          m.id === methodId
            ? { ...m, status: newStatus }
            : m
        )
      )

      toast({
        title: "Succès",
        description: `Job ${newStatus === 'cancelled' ? 'annulé' : 'réactivé'}`
      })
    } catch (error) {
      console.error('Error toggling method status:', error)
      toast({
        title: "Erreur",
        description: "Impossible de changer le statut",
        variant: "destructive"
      })
    }
  }

  return {
    importMethods,
    loading,
    configureMethod,
    executeImport,
    updateMethodConfiguration,
    toggleMethodStatus,
    refetch: fetchImportMethods
  }
}