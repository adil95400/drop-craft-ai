/**
 * ChannableHeader - Header navigation avec design Premium Professionnel
 * Navigation horizontale élégante, recherche globale, actions rapides
 * 
 * Optimisations appliquées:
 * - Constantes externalisées dans navigation-constants.ts
 * - Keyboard listener optimisé avec useKeyboardShortcut
 * - Support prefers-reduced-motion
 * - Accessibilité WCAG 2.1 AA améliorée
 */
import { memo, useState, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, Bell, Settings, ChevronRight, Home, Command, 
  User, LogOut, HelpCircle, Sparkles, Plus, Star,
  Package, ShoppingCart, BarChart3, Upload, Check,
  MessageSquare, ArrowLeft
} from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { MODULE_REGISTRY, NAV_GROUPS } from "@/config/modules"
import { 
  ROUTE_LABELS, 
  QUICK_TABS, 
  BADGE_STYLES, 
  NOTIFICATION_STYLES, 
  PLAN_STYLES 
} from "@/config/navigation-constants"
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext"
import { useModules } from "@/hooks/useModules"
import { useSearchShortcut } from "@/hooks/useKeyboardShortcut"
import { useReducedMotion } from "@/hooks/useReducedMotion"

// Breadcrumbs Premium avec animations
const ChannableBreadcrumbs = memo(() => {
  const location = useLocation()
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  
  const pathParts = location.pathname.split('/').filter(Boolean)
  
  const breadcrumbs = pathParts.map((part, index) => {
    const path = '/' + pathParts.slice(0, index + 1).join('/')
    const label = ROUTE_LABELS[part] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ')
    const isLast = index === pathParts.length - 1
    
    return { path, label, isLast }
  })

  const motionProps = prefersReducedMotion 
    ? {} 
    : { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } }

  return (
    <nav 
      className="flex items-center gap-1 text-sm" 
      aria-label="Fil d'Ariane"
    >
      <motion.button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
        aria-label="Retour à l'accueil"
        {...motionProps}
      >
        <Home className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline font-medium text-[13px]">Accueil</span>
      </motion.button>
      
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-muted-foreground/30" aria-hidden="true" />
          <motion.button
            onClick={() => !crumb.isLast && navigate(crumb.path)}
            className={cn(
              "px-2.5 py-1.5 rounded-lg transition-all duration-200 text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
              crumb.isLast 
                ? "font-semibold text-foreground bg-primary/10 border border-primary/20" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            aria-current={crumb.isLast ? "page" : undefined}
            {...(!crumb.isLast ? motionProps : {})}
          >
            {crumb.label}
          </motion.button>
        </div>
      ))}
    </nav>
  )
})
ChannableBreadcrumbs.displayName = 'ChannableBreadcrumbs'

// Navigation horizontale Premium avec onglets animés
const HorizontalNavTabs = memo(() => {
  const location = useLocation()
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  
  const isActive = (route: string) => {
    return location.pathname === route || location.pathname.startsWith(route + '/')
  }
  
  return (
    <nav 
      className="hidden lg:flex items-center gap-0.5 p-1 bg-muted/30 dark:bg-muted/20 rounded-xl border border-border/30"
      aria-label="Navigation principale"
      role="tablist"
    >
      {QUICK_TABS.map((tab) => {
        const Icon = tab.icon
        const active = isActive(tab.route)
        
        return (
          <TooltipProvider key={tab.id}>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => navigate(tab.route)}
                  className={cn(
                    "relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
                    active 
                      ? "text-white shadow-md" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  role="tab"
                  aria-selected={active}
                  aria-label={`Naviguer vers ${tab.label}`}
                  whileHover={!prefersReducedMotion && !active ? { scale: 1.02 } : undefined}
                  whileTap={!prefersReducedMotion ? { scale: 0.98 } : undefined}
                >
                  {active && (
                    <motion.div
                      layoutId={prefersReducedMotion ? undefined : "activeNavTab"}
                      className={cn(
                        "absolute inset-0 rounded-lg bg-gradient-to-r shadow-lg",
                        tab.gradient
                      )}
                      transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <Icon className={cn(
                    "relative h-4 w-4 z-10",
                    active ? "text-white" : tab.iconColor
                  )} aria-hidden="true" />
                  <span className={cn(
                    "relative hidden xl:inline z-10",
                    active && "text-white"
                  )}>
                    {tab.label}
                  </span>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="xl:hidden">
                {tab.label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </nav>
  )
})
HorizontalNavTabs.displayName = 'HorizontalNavTabs'

// Recherche globale Premium avec Command Palette
const GlobalSearch = memo(() => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { availableModules, canAccess } = useModules()
  const prefersReducedMotion = useReducedMotion()

  const handleSelect = useCallback((route: string) => {
    navigate(route)
    setOpen(false)
  }, [navigate])

  const toggleOpen = useCallback(() => {
    setOpen(prev => !prev)
  }, [])

  // Optimized keyboard shortcut using dedicated hook
  useSearchShortcut(toggleOpen)

  const motionProps = prefersReducedMotion 
    ? {} 
    : { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } }

  return (
    <>
      <motion.div {...motionProps}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="hidden sm:flex items-center gap-2.5 h-9 px-4 bg-muted/30 dark:bg-muted/20 border-border/40 hover:bg-muted/50 hover:border-primary/30 rounded-xl shadow-sm transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
          aria-label="Ouvrir la recherche (Cmd+K)"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <Search className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden="true" />
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Rechercher...</span>
          <div className="ml-2 flex items-center gap-0.5" aria-hidden="true">
            <kbd className="inline-flex h-5 items-center gap-0.5 rounded-md border border-border/50 bg-background/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70 shadow-sm">
              <Command className="h-3 w-3" />
            </kbd>
            <kbd className="inline-flex h-5 items-center gap-0.5 rounded-md border border-border/50 bg-background/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70 shadow-sm">
              K
            </kbd>
          </div>
        </Button>
      </motion.div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="sm:hidden h-9 w-9 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
        aria-label="Ouvrir la recherche"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Rechercher un module, une action..." 
          className="h-12 text-base" 
          aria-label="Rechercher"
        />
        <CommandList className="max-h-[450px]">
          <CommandEmpty>
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mb-3 opacity-40" aria-hidden="true" />
              <p className="text-sm font-medium">Aucun résultat trouvé</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Essayez avec d'autres termes</p>
            </div>
          </CommandEmpty>
          
          {/* Quick Actions */}
          <CommandGroup heading="Actions rapides">
            <CommandItem onSelect={() => handleSelect('/products/new')} className="cursor-pointer py-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mr-3">
                <Plus className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <span className="font-medium">Nouveau produit</span>
                <p className="text-xs text-muted-foreground mt-0.5">Créer un nouveau produit</p>
              </div>
              <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded" aria-hidden="true">⌘N</kbd>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/import')} className="cursor-pointer py-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mr-3">
                <Upload className="h-4 w-4 text-blue-500" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <span className="font-medium">Importer des données</span>
                <p className="text-xs text-muted-foreground mt-0.5">Import CSV, Excel ou API</p>
              </div>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/analytics')} className="cursor-pointer py-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mr-3">
                <BarChart3 className="h-4 w-4 text-violet-500" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <span className="font-medium">Voir les analytics</span>
                <p className="text-xs text-muted-foreground mt-0.5">Tableaux de bord et rapports</p>
              </div>
            </CommandItem>
          </CommandGroup>
          
          {NAV_GROUPS.map(group => {
            const groupModules = availableModules.filter(m => m.groupId === group.id && canAccess(m.id))
            if (groupModules.length === 0) return null
            
            return (
              <CommandGroup key={group.id} heading={group.label}>
                {groupModules.map(module => (
                  <CommandItem
                    key={module.id}
                    onSelect={() => handleSelect(module.route)}
                    className="cursor-pointer py-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                      <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    </div>
                    <span className="font-medium">{module.name}</span>
                    {module.badge && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "ml-auto text-[9px] font-bold uppercase",
                          BADGE_STYLES[module.badge as keyof typeof BADGE_STYLES]
                        )}
                      >
                        {module.badge}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
        </CommandList>
      </CommandDialog>
    </>
  )
})
GlobalSearch.displayName = 'GlobalSearch'

// Quick Actions Button Premium
const QuickActionsButton = memo(() => {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  
  const motionProps = prefersReducedMotion 
    ? {} 
    : { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div {...motionProps}>
          <Button 
            size="icon" 
            className="h-9 w-9 rounded-xl bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-500 shadow-lg shadow-primary/25 border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
            aria-label="Actions rapides"
          >
            <Plus className="h-4 w-4 text-white" aria-hidden="true" />
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-2">
        <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold px-2 pb-2">
          Actions rapides
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mb-2" />
        <DropdownMenuGroup className="space-y-1">
          <DropdownMenuItem onClick={() => navigate('/products/new')} className="cursor-pointer rounded-lg py-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mr-3">
              <Package className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            </div>
            <div>
              <span className="font-medium">Nouveau produit</span>
              <p className="text-[10px] text-muted-foreground">Ajouter au catalogue</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/orders/new')} className="cursor-pointer rounded-lg py-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mr-3">
              <ShoppingCart className="h-4 w-4 text-amber-500" aria-hidden="true" />
            </div>
            <div>
              <span className="font-medium">Nouvelle commande</span>
              <p className="text-[10px] text-muted-foreground">Créer manuellement</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/import')} className="cursor-pointer rounded-lg py-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mr-3">
              <Upload className="h-4 w-4 text-blue-500" aria-hidden="true" />
            </div>
            <div>
              <span className="font-medium">Importer</span>
              <p className="text-[10px] text-muted-foreground">CSV, Excel, API</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
QuickActionsButton.displayName = 'QuickActionsButton'

// Memoized Badge Content for notifications
const NotificationBadge = memo(({ count }: { count: number }) => (
  <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-semibold">
    {count} nouvelles
  </Badge>
))
NotificationBadge.displayName = 'NotificationBadge'

// Static notifications data - in production, use a store like Zustand
const STATIC_NOTIFICATIONS = [
  { title: "Import terminé", desc: "245 produits importés avec succès", time: "Il y a 5 min", type: "success" as const, icon: Check },
  { title: "Alerte stock", desc: "15 produits en rupture de stock", time: "Il y a 1h", type: "warning" as const, icon: Package },
  { title: "Nouveau message", desc: "Support client - Réponse requise", time: "Il y a 3h", type: "info" as const, icon: MessageSquare },
]

// Notifications Dropdown Premium
const NotificationsDropdown = memo(() => {
  const [hasNew] = useState(true)
  const prefersReducedMotion = useReducedMotion()
  
  const motionProps = prefersReducedMotion 
    ? {} 
    : { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div {...motionProps}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-9 w-9 rounded-xl hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
            aria-label={hasNew ? "Notifications (3 non lues)" : "Notifications"}
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {hasNew && (
              <motion.span
                className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-background"
                animate={prefersReducedMotion ? undefined : { scale: [1, 1.2, 1] }}
                transition={prefersReducedMotion ? undefined : { repeat: Infinity, duration: 2 }}
                aria-hidden="true"
              />
            )}
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
          <span className="font-semibold text-sm">Notifications</span>
          <NotificationBadge count={3} />
        </div>
        <div className="py-1 max-h-[320px] overflow-auto" role="list" aria-label="Liste des notifications">
          {STATIC_NOTIFICATIONS.map((notif, i) => {
            const style = NOTIFICATION_STYLES[notif.type]
            const NotifIcon = notif.icon
            
            return (
              <motion.div
                key={i}
                className="px-3 py-3 hover:bg-muted/30 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
                whileHover={prefersReducedMotion ? undefined : { x: 2 }}
                initial={prefersReducedMotion ? undefined : { opacity: 0, x: -10 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                transition={prefersReducedMotion ? undefined : { delay: i * 0.05 }}
                role="listitem"
                tabIndex={0}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", style.bg)}>
                    <NotifIcon className={cn("h-4 w-4", style.text)} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.desc}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">{notif.time}</p>
                  </div>
                  <div className={cn("w-2 h-2 rounded-full mt-2", style.dot)} aria-hidden="true" />
                </div>
              </motion.div>
            )
          })}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <DropdownMenuItem className="justify-center py-3 text-primary cursor-pointer font-medium text-sm">
          <MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />
          Voir toutes les notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
NotificationsDropdown.displayName = 'NotificationsDropdown'

// User Menu Dropdown Premium
const UserMenuDropdown = memo(() => {
  const { profile, user, signOut } = useUnifiedAuth()
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  
  const currentPlanStyle = PLAN_STYLES[profile?.plan || 'standard'] || PLAN_STYLES.standard
  
  const motionProps = prefersReducedMotion 
    ? {} 
    : { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div {...motionProps}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 gap-2.5 px-2 rounded-xl hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
            aria-label={`Menu utilisateur - ${profile?.full_name || 'Utilisateur'}`}
          >
            <div className="relative">
              <div className={cn(
                "w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-lg",
                currentPlanStyle.gradient
              )} aria-hidden="true">
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" aria-label="En ligne" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold truncate max-w-[100px]">
                {profile?.full_name || 'Utilisateur'}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {profile?.plan || 'Standard'}
              </p>
            </div>
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        {/* User Info Header */}
        <div className="px-3 py-3 mb-2 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-lg",
              currentPlanStyle.gradient
            )} aria-hidden="true">
              {profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.full_name || 'Utilisateur'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <Badge className={cn("mt-1 text-[9px] uppercase", currentPlanStyle.badge)}>
                <Star className="h-2.5 w-2.5 mr-1" aria-hidden="true" />
                {profile?.plan || 'Standard'}
              </Badge>
            </div>
          </div>
        </div>
        
        <DropdownMenuGroup className="space-y-1">
          <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer rounded-lg py-2.5">
            <User className="mr-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium">Mon profil</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer rounded-lg py-2.5">
            <Settings className="mr-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium">Paramètres</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/support')} className="cursor-pointer rounded-lg py-2.5">
            <HelpCircle className="mr-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium">Aide & Support</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="my-2" />
        
        <DropdownMenuItem onClick={() => navigate('/pricing')} className="cursor-pointer rounded-lg py-2.5 bg-gradient-to-r from-primary/5 to-violet-500/5 hover:from-primary/10 hover:to-violet-500/10">
          <Sparkles className="mr-3 h-4 w-4 text-primary" aria-hidden="true" />
          <span className="font-medium text-primary">Passer à Pro</span>
          <Star className="ml-auto h-4 w-4 text-amber-500" aria-hidden="true" />
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="my-2" />
        
        <DropdownMenuItem 
          onClick={() => signOut?.()}
          className="cursor-pointer rounded-lg py-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
        >
          <LogOut className="mr-3 h-4 w-4" aria-hidden="true" />
          <span className="font-medium">Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
UserMenuDropdown.displayName = 'UserMenuDropdown'

// Back Button Component
const BackButton = memo(() => {
  const navigate = useNavigate()
  const location = useLocation()
  const prefersReducedMotion = useReducedMotion()
  
  // Ne pas afficher sur le dashboard (page d'accueil)
  if (location.pathname === '/dashboard' || location.pathname === '/') {
    return null
  }
  
  const motionProps = prefersReducedMotion 
    ? {} 
    : { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } }
  
  return (
    <motion.button
      onClick={() => navigate(-1)}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
      aria-label="Retour à la page précédente"
      {...motionProps}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span className="text-[13px] font-medium">Retour</span>
    </motion.button>
  )
})
BackButton.displayName = 'BackButton'

// Composant principal Header Premium
export const ChannableHeader = memo(() => {
  return (
    <header 
      className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
      role="banner"
    >
      <div className="flex h-14 items-center gap-4 px-4">
        {/* Sidebar Trigger */}
        <SidebarTrigger 
          className="h-9 w-9 rounded-xl hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2" 
          aria-label="Ouvrir/Fermer le menu latéral"
        />
        
        <Separator orientation="vertical" className="h-6 hidden md:block bg-border/40" aria-hidden="true" />
        
        {/* Back Button + Breadcrumbs - côte à côte */}
        <div className="hidden md:flex items-center gap-2">
          <BackButton />
          <ChannableBreadcrumbs />
        </div>
        
        {/* Navigation horizontale - Desktop */}
        <HorizontalNavTabs />
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Actions de droite */}
        <div className="flex items-center gap-2">
          <GlobalSearch />
          <QuickActionsButton />
          <NotificationsDropdown />
          <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block bg-border/40" aria-hidden="true" />
          <UserMenuDropdown />
        </div>
      </div>
    </header>
  )
})
ChannableHeader.displayName = 'ChannableHeader'
