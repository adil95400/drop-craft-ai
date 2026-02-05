import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { productionLogger } from '@/utils/productionLogger';
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
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { signInWithGoogle } = useAuth()

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
        productionLogger.warn('Cleanup sign out failed', undefined, 'EnhancedAuthForm')
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
          // Navigate to dashboard
          navigate('/dashboard', { replace: true })
        }
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (result.error) throw result.error
        
        if (result.data.user) {
          // Navigate to dashboard
          navigate('/dashboard', { replace: true })
        }
      }
    } catch (error: any) {
      productionLogger.error('Authentication failed', error as Error, 'EnhancedAuthForm');
      setMessage(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setMessage('')
    
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setMessage(error.message)
      }
    } catch (error: any) {
      setMessage('Erreur lors de la connexion Google')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Google OAuth Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
        className="w-full flex items-center gap-3"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {googleLoading ? 'Connexion...' : `${mode === 'signup' ? 'S\'inscrire' : 'Se connecter'} avec Google`}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continuer avec
          </span>
        </div>
      </div>

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
    </div>
  )
}