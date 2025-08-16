import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useStripeSubscription } from '@/hooks/useStripeSubscription'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  subscription: {
    subscribed: boolean
    subscription_tier: string | null
    subscription_end: string | null
  } | null
  signOut: () => Promise<void>
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

interface AuthProviderProps {
  children: ReactNode
}

export const EnhancedAuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<{
    subscribed: boolean
    subscription_tier: string | null
    subscription_end: string | null
  } | null>(null)
  const { toast } = useToast()
  const { checkSubscription } = useStripeSubscription()

  const refreshSubscription = async () => {
    if (user) {
      const subscriptionData = await checkSubscription()
      if (subscriptionData) {
        setSubscription(subscriptionData)
      }
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // If user is logged in, check subscription after a delay
      if (session?.user) {
        setTimeout(() => {
          refreshSubscription()
        }, 0)
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
        // Defer subscription check to prevent deadlocks
        setTimeout(() => {
          refreshSubscription()
        }, 0)
      } else if (event === 'SIGNED_OUT') {
        setSubscription(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

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

  const value = {
    user,
    session,
    loading,
    subscription,
    signOut,
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