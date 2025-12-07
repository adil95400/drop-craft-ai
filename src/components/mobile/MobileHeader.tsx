/**
 * Header mobile professionnel avec navigation
 */

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Crown, Bell, Search, ChevronLeft
} from 'lucide-react'
import { MobileDrawerNav } from './MobileDrawerNav'
import { useAuth } from '@/contexts/AuthContext'

// Page titles mapping
const pageTitles: Record<string, string> = {
  '/': 'Accueil',
  '/dashboard': 'Dashboard',
  '/dashboard-super': 'Dashboard Pro',
  '/products': 'Produits',
  '/products/create': 'Nouveau produit',
  '/dashboard/orders': 'Commandes',
  '/dashboard/customers': 'Clients',
  '/suppliers': 'Fournisseurs',
  '/import': 'Import',
  '/analytics': 'Analytics',
  '/ai-assistant': 'Assistant IA',
  '/stores-channels': 'Boutiques & Canaux',
  '/settings': 'Paramètres',
  '/dashboard/settings': 'Paramètres',
}

interface MobileHeaderProps {
  title?: string
  showBack?: boolean
  showSearch?: boolean
  rightActions?: React.ReactNode
}

export function MobileHeaderNew({ 
  title, 
  showBack, 
  showSearch = true,
  rightActions 
}: MobileHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Determine page title
  const pageTitle = title || pageTitles[location.pathname] || 'ShopOpti+'

  // Determine if we should show back button
  const shouldShowBack = showBack !== undefined 
    ? showBack 
    : (location.pathname !== '/' && location.pathname !== '/dashboard')

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b safe-area-top">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left section */}
          <div className="flex items-center gap-2">
            {shouldShowBack ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={handleBack}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => setIsDrawerOpen(true)}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
                  <Crown className="h-4 w-4 text-white" />
                </div>
              </Button>
            )}
          </div>

          {/* Center - Title */}
          <div className="flex-1 text-center">
            <h1 className="font-semibold text-base truncate px-2">
              {pageTitle}
            </h1>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-1">
            {rightActions || (
              <>
                {showSearch && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9"
                    onClick={() => navigate('/products')}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 relative"
                  onClick={() => navigate('/notifications')}
                >
                  <Bell className="h-5 w-5" />
                  {/* Notification badge */}
                  <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Drawer Navigation */}
      <MobileDrawerNav 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </>
  )
}

// Simplified header for public pages
export function PublicMobileHeader() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b">
      <div className="flex items-center justify-between h-14 px-4">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
            <Crown className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            ShopOpti+
          </span>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <Button 
              size="sm" 
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/auth')}
              >
                Connexion
              </Button>
              <Button 
                size="sm"
                onClick={() => navigate('/auth')}
              >
                Essai gratuit
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
