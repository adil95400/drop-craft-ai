import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

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
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updateProfile: (updates: any) => Promise<{ error: any }>
  refreshSubscription: () => Promise<void>
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

  const refreshSubscription = async () => {
    if (user) {
      try {
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        })
        
        if (error) {
          console.warn('Failed to refresh subscription:', error)
          return
        }
        
        if (data) {
          setSubscription({
            subscribed: data.subscribed || false,
            subscription_tier: data.subscription_tier || null,
            subscription_end: data.subscription_end || null
          })
        }
      } catch (error) {
        console.warn('Failed to refresh subscription:', error)
      }
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // If user is logged in, check subscription after a delay (seulement une fois)
      if (session?.user) {
        setTimeout(() => {
          refreshSubscription()
        }, 1000)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'SIGNED_IN' && session?.user) {
        // Defer subscription check to prevent deadlocks (avec délai plus long)
        setTimeout(() => {
          refreshSubscription()
        }, 2000)
      } else if (event === 'SIGNED_OUT') {
        setSubscription(null)
      }
    })

    return () => subscription?.unsubscribe()
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
      // Clean up existing state first
      cleanupAuthState()
      
      // Attempt global sign out first to ensure clean state
      try {
        await supabase.auth.signOut({ scope: 'global' })
      } catch (err) {
        // Continue even if this fails
      }
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        let errorMessage = error.message
        
        // Provide more user-friendly error messages
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
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur Shopopti Pro!",
        })
        
        // Force page refresh for clean state
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 500)
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

  const signOut = async () => {
    try {
      // Clean up auth state first
      cleanupAuthState()
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' })
      } catch (err) {
        console.warn('Global sign out failed:', err)
      }
      
      // Clear subscription state
      setSubscription(null)
      
      // Force page reload for clean state
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

  const value = {
    user,
    session,
    loading,
    profile,
    subscription,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshSubscription
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
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