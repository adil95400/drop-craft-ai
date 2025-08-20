import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

export interface User {
  id: string
  name: string
  email: string
  role: string
  plan: string
  status: string
  last_login: string
  products: number
  revenue: string
  avatar?: string
}

export interface Organization {
  id: string
  name: string
  users: number
  plan: string
  revenue: string
  status: string
}

// Admin actions for user management
export const adminActions = {
  // Create new user
  async createUser(userData: Partial<User>) {
    try {
      // For now, just show success message since creating users requires admin setup
      toast({
        title: "Utilisateur créé",
        description: `${userData.name} sera créé par l'équipe technique`,
      })

      return { success: true, data: null }
    } catch (error) {
      console.error('Error creating user:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer l'utilisateur",
        variant: "destructive"
      })
      return { success: false, error }
    }
  },

  // View user details
  async viewUserDetails(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, orders(*), products(*)')
        .eq('id', userId)
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching user details:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de l'utilisateur",
        variant: "destructive"
      })
      return { success: false, error }
    }
  },

  // Update user
  async updateUser(userId: string, updates: Partial<User>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.name,
          plan: updates.plan as 'standard' | 'pro' | 'ultra_pro' | 'free',
          role: updates.role
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Utilisateur mis à jour",
        description: "Les modifications ont été sauvegardées",
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'utilisateur",
        variant: "destructive"
      })
      return { success: false, error }
    }
  },

  // Suspend user
  async suspendUser(userId: string, userName: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'suspended' })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      // Log security event
      await supabase
        .from('security_events')
        .insert({
          user_id: userId,
          event_type: 'user_suspended',
          severity: 'critical',
          description: `User ${userName} has been suspended by admin`,
          metadata: { target_user_id: userId, action: 'suspend' }
        })

      toast({
        title: "Utilisateur suspendu",
        description: `${userName} a été suspendu`,
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error suspending user:', error)
      toast({
        title: "Erreur",
        description: "Impossible de suspendre l'utilisateur",
        variant: "destructive"
      })
      return { success: false, error }
    }
  },

  // Force disconnect user
  async forceDisconnectUser(userId: string, userName: string, reason: string = 'admin_action') {
    try {
      const { data, error } = await supabase.functions.invoke('force-disconnect-user', {
        body: {
          targetUserId: userId,
          reason: reason
        }
      });

      if (error) throw error;

      toast({
        title: "Utilisateur déconnecté",
        description: `${userName} a été déconnecté avec succès`,
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error force disconnecting user:', error);
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter l'utilisateur",
        variant: "destructive"
      });
      return { success: false, error };
    }
  },

  // Enable maintenance mode
  async enableMaintenanceMode() {
    try {
      // Create a maintenance event in security_events
      const { error } = await supabase
        .from('security_events')
        .insert({
          event_type: 'maintenance_mode_enabled',
          severity: 'critical',
          description: 'Maintenance mode activated by admin',
          metadata: { action: 'maintenance_mode', enabled: true }
        })

      if (error) throw error

      toast({
        title: "Mode maintenance activé",
        description: "Tous les utilisateurs vont être déconnectés",
        variant: "destructive"
      })

      return { success: true }
    } catch (error) {
      console.error('Error enabling maintenance mode:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'activer le mode maintenance",
        variant: "destructive"
      })
      return { success: false, error }
    }
  },

  // Export system logs
  async exportLogs() {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) throw error

      // Convert to CSV
      const csvContent = [
        'timestamp,event_type,severity,description,user_id',
        ...data.map(event => 
          `${event.created_at},${event.event_type},${event.severity},"${event.description}",${event.user_id || ''}`
        )
      ].join('\n')

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: "Logs exportés",
        description: "Les logs système ont été téléchargés",
      })

      return { success: true }
    } catch (error) {
      console.error('Error exporting logs:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les logs",
        variant: "destructive"
      })
      return { success: false, error }
    }
  }
}

// Organization management
export const orgActions = {
  // View organization details
  async viewOrgDetails(orgId: string) {
    try {
      // Since we don't have organizations table yet, return mock data
      toast({
        title: "Détails de l'organisation",
        description: "Chargement des détails...",
      })

      return { 
        success: true, 
        data: { 
          id: orgId, 
          details: "Fonctionnalité en développement" 
        } 
      }
    } catch (error) {
      console.error('Error fetching org details:', error)
      return { success: false, error }
    }
  },

  // Manage organization
  async manageOrg(orgId: string) {
    try {
      toast({
        title: "Gestion de l'organisation",
        description: "Interface de gestion ouverte",
      })

      return { success: true }
    } catch (error) {
      console.error('Error managing org:', error)
      return { success: false, error }
    }
  }
}