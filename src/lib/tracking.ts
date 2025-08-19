import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

export interface TrackingFilters {
  status: string
  search: string
  [key: string]: any
}

export const trackingActions = {
  // Apply filters and save preferences
  async applyFilters(filters: TrackingFilters) {
    try {
      // Save filter preferences to user profile
      const { data, error } = await supabase
        .from('profiles')
        .update({
          // Store preferences in a metadata field if it exists
          // For now, just log the action
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Log the filter application
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          action: 'tracking_filters_applied',
          description: `Filters applied: ${filters.status}, search: ${filters.search}`,
          entity_type: 'tracking',
          metadata: filters as any
        })

      const filterDescription = filters.status === 'all' 
        ? 'Tous les statuts affichés' 
        : `Filtre: ${filters.status}`

      toast({
        title: "Filtres appliqués",
        description: filterDescription,
      })

      return { success: true, filters }
    } catch (error) {
      console.error('Error applying filters:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'appliquer les filtres",
        variant: "destructive"
      })
      return { success: false, error }
    }
  },

  // Enable real-time tracking mode
  async enableRealTimeMode() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Log the activation of real-time mode
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          action: 'realtime_mode_enabled',
          description: 'Real-time tracking mode activated',
          entity_type: 'tracking',
          metadata: {
            update_interval: 30,
            auto_refresh: true
          } as any
        })

      if (error) throw error

      toast({
        title: "Mode temps réel activé",
        description: "Les commandes seront mises à jour automatiquement toutes les 30 secondes",
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error enabling real-time mode:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'activer le mode temps réel",
        variant: "destructive"
      })
      return { success: false, error }
    }
  },

  // View order details
  async viewOrderDetails(orderNumber: string, orderId: string) {
    try {
      // Fetch detailed order information
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*),
          customers(name, email),
          shipments(*)
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Log the access
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          action: 'order_details_viewed',
          description: `Order details viewed: ${orderNumber}`,
          entity_type: 'order',
          entity_id: orderId,
          metadata: {
            order_number: orderNumber,
            order_id: orderId
          } as any
        })

      toast({
        title: "Détails de la commande",
        description: `Commande ${orderNumber} - ${data.status}`,
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching order details:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la commande",
        variant: "destructive"
      })
      return { success: false, error }
    }
  },

  // Track package with external service
  async trackPackage(trackingNumber: string) {
    try {
      if (!trackingNumber) {
        toast({
          title: "Erreur",
          description: "Aucun numéro de suivi disponible",
          variant: "destructive"
        })
        return { success: false }
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Log the tracking access
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          action: 'package_tracking_accessed',
          description: `Package tracking opened: ${trackingNumber}`,
          entity_type: 'tracking',
          metadata: {
            tracking_number: trackingNumber,
            carrier: 'laposte'
          } as any
        })

      // Open La Poste tracking
      const trackingUrl = `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`
      window.open(trackingUrl, '_blank')

      toast({
        title: "Suivi ouvert",
        description: "Le suivi du colis s'ouvre dans un nouvel onglet",
      })

      return { success: true, url: trackingUrl }
    } catch (error) {
      console.error('Error tracking package:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le suivi du colis",
        variant: "destructive"
      })
      return { success: false, error }
    }
  }
}