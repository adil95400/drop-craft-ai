import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export type UserRole = 'admin' | 'manager' | 'user'
export type AdminMode = 'bypass' | 'preview:standard' | 'preview:pro' | 'preview:ultra_pro' | null

export const useEnhancedAuth = () => {
  const { user, profile } = useAuth()
  const [role, setRole] = useState<UserRole>('user')
  const [adminMode, setAdminMode] = useState<AdminMode>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      setRole(profile.role || 'user')
      setAdminMode(profile.admin_mode || null)
      setLoading(false)
    } else if (!user) {
      setLoading(false)
    }
  }, [user, profile])

  const isAdmin = role === 'admin'
  const isManager = role === 'manager' || role === 'admin'
  const isUser = ['user', 'manager', 'admin'].includes(role)

  const hasRole = (requiredRole: UserRole): boolean => {
    const hierarchy = { user: 1, manager: 2, admin: 3 }
    return hierarchy[role] >= hierarchy[requiredRole]
  }

  const canAccess = (permission: string): boolean => {
    // Define permission mappings
    const permissions: Record<string, UserRole[]> = {
      // Admin only
      'manage_users': ['admin'],
      'manage_system': ['admin'],
      'view_security_events': ['admin'],
      
      // Manager and Admin
      'manage_customers': ['manager', 'admin'],
      'view_analytics': ['manager', 'admin'],
      'manage_products': ['manager', 'admin'],
      
      // All authenticated users
      'view_dashboard': ['user', 'manager', 'admin'],
      'manage_own_data': ['user', 'manager', 'admin']
    }

    const allowedRoles = permissions[permission] || []
    return allowedRoles.includes(role)
  }

  return {
    user,
    profile,
    role,
    adminMode,
    isAdmin,
    isManager,
    isUser,
    hasRole,
    canAccess,
    loading
  }
}