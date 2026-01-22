/**
 * Page d'authentification
 */
import React, { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate, useSearchParams } from 'react-router-dom'
import { AuthInterface } from '@/components/auth/AuthInterface'
import { Helmet } from 'react-helmet-async'
import { useToast } from '@/hooks/use-toast'
import { preloadAnimationStyles } from '@/hooks/useAnimationStyles'

export default function AuthPage() {
  const { user, loading } = useAuth()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const force = searchParams.get('force') === 'true'

  // Preload animation CSS for loading state animation
  useEffect(() => {
    preloadAnimationStyles();
  }, []);

  // Show welcome message if redirected after signup confirmation
  useEffect(() => {
    const confirmed = searchParams.get('confirmed') === 'true'
    if (confirmed && !user) {
      toast({
        title: "Compte confirmé !",
        description: "Votre email a été confirmé. Vous pouvez maintenant vous connecter.",
      })
    }
  }, [searchParams, toast, user])

  // Redirect authenticated users to dashboard or return URL
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center space-y-4 animate-scale-in">
          <div className="relative">
            <div className="absolute inset-0 blur-xl opacity-30">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto relative"></div>
          </div>
          <p className="text-muted-foreground font-medium animate-pulse-subtle">
            Vérification de votre session...
          </p>
        </div>
      </div>
    )
  }

  if (user && !force) {
    const redirectUrl = searchParams.get('redirect')
    return <Navigate to={redirectUrl || '/dashboard'} replace />
  }

  return (
    <>
      <Helmet>
        <title>Connexion - ShopOpti Pro</title>
        <meta name="description" content="Connectez-vous à votre compte ShopOpti Pro ou créez un nouveau compte pour gérer votre e-commerce." />
        <meta name="keywords" content="connexion, inscription, login, e-commerce, gestion" />
        <meta name="robots" content="noindex" />
      </Helmet>
      
      <AuthInterface />
    </>
  )
}