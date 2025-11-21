import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { ImportJobStatus } from '@/services/UnifiedImportService'
import { toast } from 'sonner'

/**
 * Hook pour suivre les imports en temps réel via Supabase Realtime
 */
export const useImportRealtime = (userId?: string) => {
  const [activeJobs, setActiveJobs] = useState<ImportJobStatus[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const importFromFile = async (file: File) => {
    toast.info('Import depuis fichier en cours...');
    // Logic will be implemented
  };

  const importFromURL = async (url: string) => {
    toast.info('Import depuis URL en cours...');
    // Logic will be implemented
  };

  const importWithAI = async (prompt: string, count: number) => {
    toast.info('Génération IA en cours...');
    // Logic will be implemented
  };

  const importFromMarketplace = async (productIds: string[]) => {
    toast.info('Import depuis marketplace en cours...');
    // Logic will be implemented
  };

  useEffect(() => {
    if (!userId) return

    // Charger les jobs actifs initiaux
    const loadActiveJobs = async () => {
      const { data } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })

      if (data) {
        setActiveJobs(data.map(mapToJobStatus))
      }
    }

    loadActiveJobs()

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel('import-jobs-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'import_jobs',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[ImportRealtime] Change detected:', payload)

          if (payload.eventType === 'INSERT') {
            const newJob = mapToJobStatus(payload.new)
            setActiveJobs(prev => [newJob, ...prev])
            toast.info('Nouvel import démarré', {
              description: `Import ${newJob.source_type} créé`
            })
          }

          if (payload.eventType === 'UPDATE') {
            const updatedJob = mapToJobStatus(payload.new)
            
            setActiveJobs(prev => {
              const index = prev.findIndex(j => j.id === updatedJob.id)
              if (index === -1) return prev

              const updated = [...prev]
              updated[index] = updatedJob

              // Retirer si terminé ou échoué
              if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
                updated.splice(index, 1)
                
                if (updatedJob.status === 'completed') {
                  toast.success('Import terminé', {
                    description: `${updatedJob.success_rows} produits importés avec succès`
                  })
                } else {
                  toast.error('Import échoué', {
                    description: updatedJob.errors?.[0] || 'Erreur inconnue'
                  })
                }
              }

              return updated
            })
          }

          if (payload.eventType === 'DELETE') {
            setActiveJobs(prev => prev.filter(j => j.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        console.log('[ImportRealtime] Subscription status:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      console.log('[ImportRealtime] Unsubscribing')
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { 
    activeJobs, 
    isConnected,
    importFromFile,
    importFromURL,
    importWithAI,
    importFromMarketplace
  }
}

function mapToJobStatus(data: any): ImportJobStatus {
  const progress = data.total_rows > 0 
    ? Math.round((data.processed_rows / data.total_rows) * 100)
    : 0

  return {
    id: data.id,
    user_id: data.user_id,
    status: data.status,
    source_type: data.source_type,
    source_url: data.source_url,
    progress,
    total_rows: data.total_rows || 0,
    processed_rows: data.processed_rows || 0,
    success_rows: data.success_rows || 0,
    error_rows: data.error_rows || 0,
    errors: data.errors,
    started_at: data.started_at,
    completed_at: data.completed_at,
    created_at: data.created_at,
    updated_at: data.updated_at
  }
}
