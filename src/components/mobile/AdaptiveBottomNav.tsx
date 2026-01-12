/**
 * Navigation inférieure adaptative
 * Barre de navigation optimisée pour mobile avec actions contextuelles
 */

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Home,
  Package,
  ShoppingCart,
  Store,
  BarChart3,
  Menu,
  Plus,
  Search,
  Bell,
  Settings,
  User
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useIsMobile } from '@/hooks/use-mobile'

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  badge?: number
}

const primaryNavItems: NavItem[] = [
  { id: 'home', label: 'Accueil', icon: Home, path: '/' },
  { id: 'products', label: 'Produits', icon: Package, path: '/products' },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart, path: '/orders' },
  { id: 'channels', label: 'Canaux', icon: Store, path: '/stores-channels' },
  { id: 'analytics', label: 'Stats', icon: BarChart3, path: '/analytics' }
]

const moreNavItems: NavItem[] = [
  { id: 'suppliers', label: 'Fournisseurs', icon: Package, path: '/suppliers' },
  { id: 'customers', label: 'Clients', icon: User, path: '/customers' },
  { id: 'settings', label: 'Paramètres', icon: Settings, path: '/settings' }
]

interface AdaptiveBottomNavProps {
  pendingOrders?: number
  notifications?: number
}

export function AdaptiveBottomNav({ 
  pendingOrders = 0,
  notifications = 0 
}: AdaptiveBottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  if (!isMobile) return null

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {primaryNavItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          const showBadge = item.id === 'orders' && pendingOrders > 0

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                "active:scale-95 touch-manipulation",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "h-5 w-5 transition-transform",
                  active && "scale-110"
                )} />
                {showBadge && (
                  <Badge 
                    className="absolute -top-1 -right-2 h-4 min-w-4 px-1 text-[10px]"
                    variant="destructive"
                  >
                    {pendingOrders > 9 ? '9+' : pendingOrders}
                  </Badge>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                active && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}

        {/* More Menu */}
        <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1",
                "text-muted-foreground active:scale-95 touch-manipulation"
              )}
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium">Plus</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-xl">
            <div className="grid grid-cols-4 gap-4 p-4">
              {moreNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path)
                      setIsMoreOpen(false)
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors active:scale-95"
                  >
                    <div className="p-3 rounded-xl bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Quick Actions */}
            <div className="border-t p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-3">
                Actions rapides
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigate('/products/create')
                    setIsMoreOpen(false)
                  }}
                  className="justify-start gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nouveau produit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigate('/products/import')
                    setIsMoreOpen(false)
                  }}
                  className="justify-start gap-2"
                >
                  <Package className="h-4 w-4" />
                  Importer
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

// Floating action button for quick actions
export function FloatingActionButton() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)

  if (!isMobile) return null

  const actions = [
    { icon: Plus, label: 'Nouveau produit', path: '/products/create' },
    { icon: Search, label: 'Rechercher', path: '/products' },
    { icon: Bell, label: 'Notifications', path: '/notifications' }
  ]

  return (
    <div className="fixed right-4 bottom-20 z-40">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            size="icon" 
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto rounded-t-xl">
          <div className="p-4 space-y-2">
            {actions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.path}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    navigate(action.path)
                    setIsOpen(false)
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {action.label}
                </Button>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
