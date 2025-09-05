import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { DisconnectNotification } from '@/components/auth/DisconnectNotification'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  profile: any | null
  subscription: {
    subscribed: boolean
    subscription_tier: string | null
    subscription_end: string | null
  } | null
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updateProfile: (updates: any) => Promise<{ error: any }>
  refreshSubscription: () => Promise<void>
  refetchProfile: () => Promise<void>
  revokeUserSessions: (targetUserId?: string, sessionIds?: string[]) => Promise<{ error: any }>
  getUserSessions: () => Promise<{ data: any[], error: any }>
  hasPermission: (permission: string, resource?: string, action?: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Cleanup function for auth state
const cleanupAuthState = () => {
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key)
    }
  })
  
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key)
    }
  })
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any | null>(null)
  const [subscription, setSubscription] = useState<{
    subscribed: boolean
    subscription_tier: string | null
    subscription_end: string | null
  } | null>(null)
  const { toast } = useToast()

  // Prevent multiple subscription refreshes
  const [refreshingSubscription, setRefreshingSubscription] = useState(false)

  const refreshSubscription = async () => {
    if (!user || refreshingSubscription) return
    
    setRefreshingSubscription(true)
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription')
      
      if (error) {
        console.error('Error refreshing subscription:', error)
        return
      }
      
      setSubscription(data)
    } catch (error) {
      console.error('Error refreshing subscription:', error)
    } finally {
      setRefreshingSubscription(false)
    }
  }

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        // Set empty profile to avoid infinite loading
        setProfile({ id: user.id, role: 'user' })
        return
      }
      
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Set empty profile to avoid infinite loading
      setProfile({ id: user.id, role: 'user' })
    }
  }

  const refetchProfile = fetchProfile

  useEffect(() => {
    let mounted = true

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // If user is logged in, fetch profile data 
      if (session?.user) {
        fetchProfile()
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      console.log('Auth state change:', event, session?.user?.email)
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'SIGNED_IN' && session?.user) {
        await fetchProfile()
        // Refresh subscription on login
        setTimeout(refreshSubscription, 1000)
      } else if (event === 'SIGNED_OUT') {
        setSubscription(null)
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      })

      if (error) {
        toast({
          title: "Erreur d'inscription",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Inscription réussie",
          description: "Vérifiez votre email pour confirmer votre compte.",
        })
      }

      return { error }
    } catch (error: any) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      cleanupAuthState()
      
      try {
        await supabase.auth.signOut({ scope: 'global' })
      } catch (err) {
        // Continue even if this fails
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        let errorMessage = error.message
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Email ou mot de passe incorrect. Vérifiez vos identifiants."
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Veuillez confirmer votre email avant de vous connecter."
        } else if (error.message.includes('Too many requests')) {
          errorMessage = "Trop de tentatives. Veuillez réessayer dans quelques minutes."
        }
        
        toast({
          title: "Erreur de connexion",
          description: errorMessage,
          variant: "destructive",
        })
      } else if (data.user) {
        // Track login activity
        await trackLoginActivity()
        
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur Shopopti Pro!",
        })
        
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      }

      return { error }
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
        variant: "destructive",
      })
      return { error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      cleanupAuthState()
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        toast({
          title: "Erreur OAuth Google",
          description: error.message,
          variant: "destructive",
        })
      }

      return { error }
    } catch (error: any) {
      toast({
        title: "Erreur OAuth Google",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      })
      return { error }
    }
  }

  const trackLoginActivity = async () => {
    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }

      // Insert session record manually since the RPC doesn't exist yet
      await supabase
        .from('user_sessions')
        .insert({
          user_id: user?.id,
          session_token: crypto.getRandomValues(new Uint8Array(16)).join(''),
          device_info: deviceInfo,
          user_agent: navigator.userAgent,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
    } catch (error) {
      console.warn('Failed to track login activity:', error)
    }
  }

  const signOut = async () => {
    try {
      cleanupAuthState()
      
      try {
        await supabase.auth.signOut({ scope: 'global' })
      } catch (err) {
        console.warn('Global sign out failed:', err)
      }
      
      setSubscription(null)
      
      window.location.href = '/auth'
    } catch (error: any) {
      console.error('Error signing out:', error)
      toast({
        title: "Erreur de déconnexion",
        description: "Une erreur est survenue lors de la déconnexion",
        variant: "destructive"
      })
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      })

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Email envoyé",
          description: "Vérifiez votre email pour réinitialiser votre mot de passe.",
        })
      }

      return { error }
    } catch (error: any) {
      return { error }
    }
  }

  const updateProfile = async (updates: any) => {
    try {
      const { error } = await supabase.auth.updateUser(updates)
      
      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Profil mis à jour",
          description: "Vos informations ont été mises à jour avec succès.",
        })
      }

      return { error }
    } catch (error: any) {
      return { error }
    }
  }

  const revokeUserSessions = async (targetUserId?: string, sessionIds?: string[]) => {
    try {
      const userId = targetUserId || user?.id
      if (!userId) {
        return { error: new Error('No user ID provided') }
      }

      const { data, error } = await supabase.rpc('revoke_user_sessions', {
        target_user_id: userId,
        session_ids: sessionIds || null
      })

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Sessions révoquées",
          description: `${(data as any)?.revoked_count || 0} sessions ont été révoquées.`,
        })
      }

      return { error }
    } catch (error: any) {
      return { error }
    }
  }

  const getUserSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('last_activity_at', { ascending: false })

      return { data: data || [], error }
    } catch (error: any) {
      return { data: [], error }
    }
  }

  const hasPermission = async (permission: string, resource?: string, action = 'read') => {
    try {
      const { data, error } = await supabase.rpc('has_permission', {
        permission_name_param: permission,
        resource_type_param: resource,
        action_param: action
      })

      return !error && data === true
    } catch (error) {
      return false
    }
  }

  const value = {
    user,
    session,
    loading,
    profile,
    subscription,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    refreshSubscription,
    refetchProfile,
    revokeUserSessions,
    getUserSessions,
    hasPermission
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <DisconnectNotification />
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
