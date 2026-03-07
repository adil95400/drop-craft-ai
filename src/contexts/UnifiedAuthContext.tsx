import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js'

interface UnifiedAuthContextValue {
  supabase: SupabaseClient | null
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const UnifiedAuthContext = createContext<UnifiedAuthContextValue | undefined>(undefined)

interface UnifiedAuthProviderProps {
  children: ReactNode
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const UnifiedAuthProvider = ({ children }: UnifiedAuthProviderProps) => {
  const [supabase] = useState(() => createClient(SUPABASE_URL, SUPABASE_ANON_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentSession = supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) throw error
  }

  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    setLoading(false)
    if (error) throw error
  }

  return (
    <UnifiedAuthContext.Provider value={{ supabase, user, session, loading, signIn, signOut }}>
      {children}
    </UnifiedAuthContext.Provider>
  )
}

export const useUnifiedAuth = (): UnifiedAuthContextValue => {
  const context = useContext(UnifiedAuthContext)
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider')
  }
  return context
}
