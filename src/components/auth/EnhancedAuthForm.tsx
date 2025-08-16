import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { useState } from 'react'

// Cleanup function for auth state
const cleanupAuthState = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key)
    }
  })
  
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key)
    }
  })
}

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onToggleMode: () => void
}

export const AuthForm = ({ mode, onToggleMode }: AuthFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Clean up existing state before auth operation
      cleanupAuthState()
      
      // Attempt global sign out to ensure clean state
      try {
        await supabase.auth.signOut({ scope: 'global' })
      } catch (err) {
        console.warn('Cleanup sign out failed:', err)
      }

      let result
      if (mode === 'signup') {
        result = await supabase.auth.signUp({
          email,
          password,
        })
        if (result.error) throw result.error
        
        if (result.data.user && !result.data.user.email_confirmed_at) {
          setMessage('Vérifiez votre email pour confirmer votre compte')
        } else if (result.data.user) {
          // Force page reload for clean state
          window.location.href = '/dashboard'
        }
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (result.error) throw result.error
        
        if (result.data.user) {
          // Force page reload for clean state
          window.location.href = '/dashboard'
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      setMessage(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      
      <div>
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {message && (
        <div className={`text-sm p-3 rounded-lg ${
          message.includes('Vérifiez') 
            ? 'bg-blue-50 text-blue-600 border border-blue-200' 
            : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Chargement...' : mode === 'signup' ? 'Créer un compte' : 'Se connecter'}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onToggleMode}
          className="text-primary hover:underline"
        >
          {mode === 'signup' 
            ? 'Déjà un compte ? Se connecter' 
            : 'Pas de compte ? Créer un compte'
          }
        </button>
      </div>
    </form>
  )
}