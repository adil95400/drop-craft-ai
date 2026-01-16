/**
 * ChannableHeader - Header navigation avec design Premium Professionnel
 * Navigation horizontale élégante, recherche globale, actions rapides
 */
import { memo, useState, useCallback, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, Bell, Settings, ChevronRight, Home, Command, 
  User, LogOut, HelpCircle, Sparkles, Menu, Plus, Star,
  Package, ShoppingCart, BarChart3, Store, Zap, Crown,
  MessageSquare, Filter, RefreshCw, Download, Upload, Check
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
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext"
import { useModules } from "@/hooks/useModules"

// Map des routes vers labels lisibles
const routeLabels: Record<string, string> = {
  'dashboard': 'Dashboard',
  'products': 'Produits',
  'orders': 'Commandes',
  'stores-channels': 'Boutiques',
  'analytics': 'Analytics',
  'settings': 'Paramètres',
  'import': 'Import',
  'autods': 'Import Rapide',
  'feeds': 'Feeds',
  'ai': 'Intelligence IA',
  'pricing': 'Tarification',
  'fulfillment': 'Fulfillment',
  'suppliers': 'Fournisseurs',
  'audit': 'Qualité & Audit',
  'research': 'Veille',
  'crm': 'CRM',
  'integrations': 'Intégrations',
  'marketing': 'Marketing',
}

// Quick navigation tabs - Navigation rapide horizontale avec gradients
const quickTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, route: '/dashboard', gradient: 'from-blue-500 to-cyan-500', iconColor: 'text-blue-500' },
  { id: 'products', label: 'Produits', icon: Package, route: '/products', gradient: 'from-emerald-500 to-teal-500', iconColor: 'text-emerald-500' },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart, route: '/orders', gradient: 'from-amber-500 to-orange-500', iconColor: 'text-amber-500' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, route: '/analytics', gradient: 'from-violet-500 to-purple-500', iconColor: 'text-violet-500' },
  { id: 'stores', label: 'Boutiques', icon: Store, route: '/stores-channels', gradient: 'from-rose-500 to-pink-500', iconColor: 'text-rose-500' },
]

// Breadcrumbs Premium avec animations
const ChannableBreadcrumbs = memo(() => {
  const location = useLocation()
  const navigate = useNavigate()
  
  const pathParts = location.pathname.split('/').filter(Boolean)
  
  const breadcrumbs = pathParts.map((part, index) => {
    const path = '/' + pathParts.slice(0, index + 1).join('/')
    const label = routeLabels[part] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ')
    const isLast = index === pathParts.length - 1
    
    return { path, label, isLast }
  })

  return (
    <nav className="flex items-center gap-1 text-sm">
      <motion.button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline font-medium text-[13px]">Accueil</span>
      </motion.button>
      
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
          <motion.button
            onClick={() => !crumb.isLast && navigate(crumb.path)}
            className={cn(
              "px-2.5 py-1.5 rounded-lg transition-all duration-200 text-[13px]",
              crumb.isLast 
                ? "font-semibold text-foreground bg-primary/10 border border-primary/20" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            whileHover={!crumb.isLast ? { scale: 1.02 } : undefined}
            whileTap={!crumb.isLast ? { scale: 0.98 } : undefined}
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
  
  const isActive = (route: string) => {
    return location.pathname === route || location.pathname.startsWith(route + '/')
  }
  
  return (
    <div className="hidden lg:flex items-center gap-0.5 p-1 bg-muted/30 dark:bg-muted/20 rounded-xl border border-border/30">
      {quickTabs.map((tab) => {
        const Icon = tab.icon
        const active = isActive(tab.route)
        
        return (
          <TooltipProvider key={tab.id}>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => navigate(tab.route)}
                  className={cn(
                    "relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    active 
                      ? "text-white shadow-md" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  whileHover={{ scale: active ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {active && (
                    <motion.div
                      layoutId="activeNavTab"
                      className={cn(
                        "absolute inset-0 rounded-lg bg-gradient-to-r shadow-lg",
                        tab.gradient
                      )}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <Icon className={cn(
                    "relative h-4 w-4 z-10",
                    active ? "text-white" : tab.iconColor
                  )} />
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
    </div>
  )
})
HorizontalNavTabs.displayName = 'HorizontalNavTabs'

// Recherche globale Premium avec Command Palette
const GlobalSearch = memo(() => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { availableModules, canAccess } = useModules()

  const handleSelect = useCallback((route: string) => {
    navigate(route)
    setOpen(false)
  }, [navigate])

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(open => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="hidden sm:flex items-center gap-2.5 h-9 px-4 bg-muted/30 dark:bg-muted/20 border-border/40 hover:bg-muted/50 hover:border-primary/30 rounded-xl shadow-sm transition-all duration-200 group"
        >
          <Search className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Rechercher...</span>
          <div className="ml-2 flex items-center gap-0.5">
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
        className="sm:hidden h-9 w-9 rounded-xl"
      >
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Rechercher un module, une action..." className="h-12 text-base" />
        <CommandList className="max-h-[450px]">
          <CommandEmpty>
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">Aucun résultat trouvé</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Essayez avec d'autres termes</p>
            </div>
          </CommandEmpty>
          
          {/* Quick Actions */}
          <CommandGroup heading="Actions rapides">
            <CommandItem onSelect={() => handleSelect('/products/new')} className="cursor-pointer py-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mr-3">
                <Plus className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex-1">
                <span className="font-medium">Nouveau produit</span>
                <p className="text-xs text-muted-foreground mt-0.5">Créer un nouveau produit</p>
              </div>
              <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">⌘N</kbd>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/import')} className="cursor-pointer py-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mr-3">
                <Upload className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <span className="font-medium">Importer des données</span>
                <p className="text-xs text-muted-foreground mt-0.5">Import CSV, Excel ou API</p>
              </div>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/analytics')} className="cursor-pointer py-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mr-3">
                <BarChart3 className="h-4 w-4 text-violet-500" />
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
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="font-medium">{module.name}</span>
                    {module.badge && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "ml-auto text-[9px] font-bold uppercase",
                          module.badge === 'pro' && "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border-amber-500/30",
                          module.badge === 'new' && "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 border-emerald-500/30",
                          module.badge === 'beta' && "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 border-blue-500/30",
                          module.badge === 'ultra' && "bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 border-violet-500/30"
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
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            size="icon" 
            className="h-9 w-9 rounded-xl bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-500 shadow-lg shadow-primary/25 border-0"
          >
            <Plus className="h-4 w-4 text-white" />
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
              <Package className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <span className="font-medium">Nouveau produit</span>
              <p className="text-[10px] text-muted-foreground">Ajouter au catalogue</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/orders/new')} className="cursor-pointer rounded-lg py-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mr-3">
              <ShoppingCart className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <span className="font-medium">Nouvelle commande</span>
              <p className="text-[10px] text-muted-foreground">Créer manuellement</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/import')} className="cursor-pointer rounded-lg py-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mr-3">
              <Upload className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <span className="font-medium">Importer</span>
              <p className="text-[10px] text-muted-foreground">CSV, Excel, API</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/feeds/new')} className="cursor-pointer rounded-lg py-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mr-3">
              <Zap className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <span className="font-medium">Nouveau feed</span>
              <p className="text-[10px] text-muted-foreground">Flux de données</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
QuickActionsButton.displayName = 'QuickActionsButton'

// Notifications Dropdown Premium
const NotificationsDropdown = memo(() => {
  const [hasNew, setHasNew] = useState(true)
  const notifications = [
    { title: "Import terminé", desc: "245 produits importés avec succès", time: "Il y a 5 min", type: "success", icon: Check },
    { title: "Alerte stock", desc: "15 produits en rupture de stock", time: "Il y a 1h", type: "warning", icon: Package },
    { title: "Nouveau message", desc: "Support client - Réponse requise", time: "Il y a 3h", type: "info", icon: MessageSquare },
  ]
  
  const typeStyles = {
    success: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
    warning: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500' },
    info: { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500' },
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl hover:bg-muted/50">
            <Bell className="h-4 w-4" />
            {hasNew && (
              <motion.span
                className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-background"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
          <span className="font-semibold text-sm">Notifications</span>
          <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-semibold">
            3 nouvelles
          </Badge>
        </div>
        <div className="py-1 max-h-[320px] overflow-auto">
          {notifications.map((notif, i) => {
            const style = typeStyles[notif.type as keyof typeof typeStyles]
            const NotifIcon = notif.icon
            
            return (
              <motion.div
                key={i}
                className="px-3 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                whileHover={{ x: 2 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", style.bg)}>
                    <NotifIcon className={cn("h-4 w-4", style.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.desc}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">{notif.time}</p>
                  </div>
                  <div className={cn("w-2 h-2 rounded-full mt-2", style.dot)} />
                </div>
              </motion.div>
            )
          })}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <DropdownMenuItem className="justify-center py-3 text-primary cursor-pointer font-medium text-sm">
          <MessageSquare className="mr-2 h-4 w-4" />
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
  
  const planStyles: Record<string, { gradient: string; badge: string }> = {
    'ultra_pro': { gradient: 'from-amber-500 to-orange-500', badge: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border-amber-500/30' },
    'pro': { gradient: 'from-violet-500 to-purple-500', badge: 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 border-violet-500/30' },
    'standard': { gradient: 'from-slate-500 to-zinc-500', badge: 'bg-muted text-muted-foreground' },
  }
  
  const currentPlanStyle = planStyles[profile?.plan || 'standard'] || planStyles.standard
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button variant="ghost" size="sm" className="h-9 gap-2.5 px-2 rounded-xl hover:bg-muted/50">
            <div className="relative">
              <div className={cn(
                "w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-lg",
                currentPlanStyle.gradient
              )}>
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
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
            )}>
              {profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.full_name || 'Utilisateur'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <Badge className={cn("mt-1 text-[9px] uppercase", currentPlanStyle.badge)}>
                <Crown className="h-2.5 w-2.5 mr-1" />
                {profile?.plan || 'Standard'}
              </Badge>
            </div>
          </div>
        </div>
        
        <DropdownMenuGroup className="space-y-1">
          <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer rounded-lg py-2.5">
            <User className="mr-3 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Mon profil</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer rounded-lg py-2.5">
            <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Paramètres</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/support')} className="cursor-pointer rounded-lg py-2.5">
            <HelpCircle className="mr-3 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Aide & Support</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="my-2" />
        
        <DropdownMenuItem onClick={() => navigate('/pricing')} className="cursor-pointer rounded-lg py-2.5 bg-gradient-to-r from-primary/5 to-violet-500/5 hover:from-primary/10 hover:to-violet-500/10">
          <Sparkles className="mr-3 h-4 w-4 text-primary" />
          <span className="font-medium text-primary">Passer à Pro</span>
          <Crown className="ml-auto h-4 w-4 text-amber-500" />
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="my-2" />
        
        <DropdownMenuItem 
          onClick={() => signOut?.()}
          className="cursor-pointer rounded-lg py-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="font-medium">Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
UserMenuDropdown.displayName = 'UserMenuDropdown'

// Composant principal Header Premium
export const ChannableHeader = memo(() => {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        {/* Sidebar Trigger */}
        <SidebarTrigger className="h-9 w-9 rounded-xl hover:bg-muted/50 transition-colors" />
        
        <Separator orientation="vertical" className="h-6 hidden md:block bg-border/40" />
        
        {/* Breadcrumbs */}
        <div className="hidden md:flex flex-1 items-center">
          <ChannableBreadcrumbs />
        </div>
        
        {/* Navigation horizontale - Desktop */}
        <HorizontalNavTabs />
        
        {/* Spacer */}
        <div className="flex-1 md:hidden" />
        
        {/* Actions de droite */}
        <div className="flex items-center gap-2">
          <GlobalSearch />
          <QuickActionsButton />
          <NotificationsDropdown />
          <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block bg-border/40" />
          <UserMenuDropdown />
        </div>
      </div>
    </header>
  )
})
ChannableHeader.displayName = 'ChannableHeader'
