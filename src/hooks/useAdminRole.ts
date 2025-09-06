import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface AdminUser {
  id: string
  full_name: string | null
  role: string
  is_admin: boolean
  created_at: string
  last_login_at: string | null
  login_count: number
  plan: string | null
  subscription_status: string | null
}

export const useAdminRole = () => {
  const { user, profile, refetchProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      setIsAdmin(profile.role === 'admin' || profile.is_admin === true)
      setLoading(false)
    }
  }, [profile])

  const fetchAllUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('admin_get_all_users')
      
      if (error) throw error
      
      setUsers(data || [])
      return { success: true, data }
    } catch (error: any) {
      console.error('Error fetching users:', error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer la liste des utilisateurs",
        variant: "destructive",
      })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const changeUserRole = async (targetUserId: string, newRole: 'admin' | 'user') => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('admin_change_user_role', {
        target_user_id: targetUserId,
        new_role: newRole
      })
      
      if (error) throw error
      
      toast({
        title: "Succès",
        description: `Rôle mis à jour vers ${newRole}`,
      })
      
      // Refresh the users list
      await fetchAllUsers()
      
      return { success: true, data }
    } catch (error: any) {
      console.error('Error changing user role:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de changer le rôle",
        variant: "destructive",
      })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const checkAdminAccess = async () => {
    try {
      const { data, error } = await supabase.rpc('is_current_user_admin')
      if (error) throw error
      return Boolean(data)
    } catch (error) {
      console.error('Error checking admin access:', error)
      return false
    }
  }

  return {
    isAdmin,
    loading,
    users,
    fetchAllUsers,
    changeUserRole,
    checkAdminAccess,
    refetchProfile
  }
}