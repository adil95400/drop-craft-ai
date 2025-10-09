import { useState, useEffect } from 'react'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'user'
  is_admin: boolean
  created_at: string
  last_sign_in_at: string | null
  role_updated_at: string | null
  plan?: string | null
  subscription_status?: string | null
  last_login_at?: string | null
  login_count?: number
}

export const useAdminRole = () => {
  const { user, profile, refetchProfile } = useUnifiedAuth()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      setIsAdmin(profile.is_admin === true)
      setLoading(false)
    }
  }, [profile])

  const fetchAllUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('admin_get_all_users')
      
      if (error) {
        console.error('RPC Error details:', error)
        throw error
      }
      
      console.log('Fetched users data:', data)
      
      const formattedUsers = data?.map((user: any) => ({
        id: user.id,
        email: user.email || `user-${user.id}@domain.com`,
        full_name: user.full_name || 'Unknown User',
        role: user.role || 'user',
        is_admin: user.is_admin || false,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        role_updated_at: user.role_updated_at,
        plan: user.plan || 'free',
        subscription_status: user.subscription_status || 'inactive',
        last_login_at: user.last_login_at || user.last_sign_in_at,
        login_count: user.login_count || 0
      })) || []
      
      console.log('Formatted users:', formattedUsers)
      setUsers(formattedUsers)
      return { success: true, data: formattedUsers }
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
      const { data, error } = await supabase.rpc('admin_update_user_role', {
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