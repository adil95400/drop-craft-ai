/**
 * Écran de chargement avec animations
 */
import React from 'react'
import { Loader2, Zap, Crown, Star } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
  showLogo?: boolean
}

export function LoadingScreen({ 
  message = "Chargement...", 
  showLogo = true 
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
      <div className="text-center space-y-6 animate-fade-in">
        {showLogo && (
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-md opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-primary to-secondary p-3 rounded-full">
                <Crown className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ShopOpti Pro
              </h1>
              <p className="text-xs text-muted-foreground">
                Plateforme e-commerce nouvelle génération
              </p>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
            </div>
          </div>
          
          <p className="text-muted-foreground animate-pulse">
            {message}
          </p>
          
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          </div>
        </div>
        
        <div className="flex justify-center space-x-6 opacity-60">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Star className="h-3 w-3" />
            <span>IA Avancée</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>Automatisation</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Crown className="h-3 w-3" />
            <span>Enterprise</span>
          </div>
        </div>
      </div>
    </div>
  )
}