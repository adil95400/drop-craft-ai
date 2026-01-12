/**
 * ChannableHeader - Header navigation avec design Channable Premium
 * Navigation horizontale complète avec tabs, recherche, actions globales
 */
import { memo, useState, useCallback, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, Bell, Settings, ChevronRight, Home, Command, 
  User, LogOut, HelpCircle, Sparkles, Menu, Plus, Star,
  Package, ShoppingCart, BarChart3, Store, Zap, Crown,
  MessageSquare, Filter, RefreshCw, Download, Upload
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

// Quick navigation tabs - Navigation rapide horizontale
const quickTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, route: '/dashboard', color: 'from-blue-500 to-cyan-500' },
  { id: 'products', label: 'Produits', icon: Package, route: '/products', color: 'from-emerald-500 to-teal-500' },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart, route: '/orders', color: 'from-amber-500 to-orange-500' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, route: '/analytics', color: 'from-violet-500 to-purple-500' },
  { id: 'stores', label: 'Boutiques', icon: Store, route: '/stores-channels', color: 'from-rose-500 to-pink-500' },
]

// Breadcrumbs Channable améliorés
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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline font-medium">Accueil</span>
      </motion.button>
      
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
          <motion.button
            onClick={() => !crumb.isLast && navigate(crumb.path)}
            className={cn(
              "px-2.5 py-1.5 rounded-lg transition-all duration-200",
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

// Navigation horizontale avec onglets
const HorizontalNavTabs = memo(() => {
  const location = useLocation()
  const navigate = useNavigate()
  
  const isActive = (route: string) => {
    return location.pathname === route || location.pathname.startsWith(route + '/')
  }
  
  return (
    <div className="hidden lg:flex items-center gap-1 px-1">
      {quickTabs.map((tab) => {
        const Icon = tab.icon
        const active = isActive(tab.route)
        
        return (
          <TooltipProvider key={tab.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => navigate(tab.route)}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    active 
                      ? "text-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className={cn("h-4 w-4", active && "text-primary")} />
                  <span className="hidden xl:inline">{tab.label}</span>
                  
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className={cn(
                        "absolute inset-0 rounded-xl bg-gradient-to-r opacity-10",
                        tab.color
                      )}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  {active && (
                    <motion.div
                      layoutId="activeTabBorder"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
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

// Recherche globale Command Palette améliorée
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
          className="hidden sm:flex items-center gap-2 h-9 px-4 bg-muted/40 border-border/50 hover:bg-muted/60 hover:border-primary/30 rounded-xl shadow-sm transition-all duration-200"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Rechercher...</span>
          <kbd className="ml-3 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-md border border-border/50 bg-background/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-sm">
            <Command className="h-3 w-3" />K
          </kbd>
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
        <CommandInput placeholder="Rechercher un module, une action..." className="h-12" />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>
            <div className="flex flex-col items-center py-6 text-muted-foreground">
              <Search className="h-10 w-10 mb-2 opacity-50" />
              <p>Aucun résultat trouvé.</p>
            </div>
          </CommandEmpty>
          
          {/* Quick Actions */}
          <CommandGroup heading="Actions rapides">
            <CommandItem onSelect={() => handleSelect('/products/new')} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4 text-emerald-500" />
              <span>Nouveau produit</span>
              <kbd className="ml-auto text-[10px] text-muted-foreground">⌘N</kbd>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/import')} className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4 text-blue-500" />
              <span>Importer des données</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/analytics')} className="cursor-pointer">
              <BarChart3 className="mr-2 h-4 w-4 text-violet-500" />
              <span>Voir les analytics</span>
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
                    className="cursor-pointer"
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-primary" />
                    <span>{module.name}</span>
                    {module.badge && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "ml-auto text-[10px]",
                          module.badge === 'pro' && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                          module.badge === 'new' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                          module.badge === 'beta' && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                          module.badge === 'ultra' && "bg-violet-500/10 text-violet-600 border-violet-500/20"
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

// Quick Actions Button
const QuickActionsButton = memo(() => {
  const navigate = useNavigate()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            size="icon" 
            className="h-9 w-9 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Actions rapides
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate('/products/new')} className="cursor-pointer">
            <Package className="mr-2 h-4 w-4 text-emerald-500" />
            <span>Nouveau produit</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/orders/new')} className="cursor-pointer">
            <ShoppingCart className="mr-2 h-4 w-4 text-amber-500" />
            <span>Nouvelle commande</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/import')} className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4 text-blue-500" />
            <span>Importer</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/feeds/new')} className="cursor-pointer">
            <Zap className="mr-2 h-4 w-4 text-violet-500" />
            <span>Nouveau feed</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
QuickActionsButton.displayName = 'QuickActionsButton'

// Notifications Dropdown amélioré
const NotificationsDropdown = memo(() => {
  const [hasNew, setHasNew] = useState(true)
  const notifications = [
    { title: "Import terminé", desc: "245 produits importés avec succès", time: "Il y a 5 min", type: "success" },
    { title: "Alerte stock", desc: "15 produits en rupture de stock", time: "Il y a 1h", type: "warning" },
    { title: "Nouveau message", desc: "Support client - Réponse requise", time: "Il y a 3h", type: "info" },
  ]
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl hover:bg-muted/50">
            <Bell className="h-4 w-4" />
            {hasNew && (
              <motion.span
                className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-background"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <span className="font-semibold">Notifications</span>
          <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px]">
            3 nouvelles
          </Badge>
        </div>
        <div className="py-2 max-h-[300px] overflow-auto">
          {notifications.map((notif, i) => (
            <motion.div
              key={i}
              className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
              whileHover={{ x: 2 }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                  notif.type === 'success' && "bg-emerald-500",
                  notif.type === 'warning' && "bg-amber-500",
                  notif.type === 'info' && "bg-blue-500"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{notif.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{notif.desc}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{notif.time}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center py-3 text-primary cursor-pointer font-medium">
          <MessageSquare className="mr-2 h-4 w-4" />
          Voir toutes les notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
NotificationsDropdown.displayName = 'NotificationsDropdown'

// User Menu Dropdown amélioré
const UserMenuDropdown = memo(() => {
  const { profile, user, signOut } = useUnifiedAuth()
  const navigate = useNavigate()
  
  const planColors: Record<string, string> = {
    'ultra_pro': 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    'pro': 'bg-gradient-to-r from-violet-500 to-purple-500 text-white',
    'standard': 'bg-muted text-muted-foreground',
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button variant="ghost" size="sm" className="h-9 gap-2 px-2 rounded-xl hover:bg-muted/50">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20">
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium max-w-[100px] truncate leading-tight">
                {profile?.full_name || 'Utilisateur'}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {profile?.plan || 'Standard'}
              </span>
            </div>
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-4 py-3 border-b bg-gradient-to-r from-muted/50 to-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-lg">
              {profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{profile?.full_name || 'Utilisateur'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
            </div>
          </div>
          <div className="mt-3">
            <Badge className={cn(
              "text-[10px] font-medium",
              planColors[profile?.plan || 'standard'] || planColors.standard
            )}>
              <Crown className="mr-1 h-3 w-3" />
              {profile?.plan?.replace('_', ' ').toUpperCase() || 'STANDARD'} PLAN
            </Badge>
          </div>
        </div>
        
        <DropdownMenuGroup className="py-2">
          <DropdownMenuItem onClick={() => navigate('/settings/profile')} className="cursor-pointer py-2.5">
            <User className="mr-3 h-4 w-4 text-muted-foreground" />
            <span>Mon profil</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer py-2.5">
            <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
            <span>Paramètres</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/help')} className="cursor-pointer py-2.5">
            <HelpCircle className="mr-3 h-4 w-4 text-muted-foreground" />
            <span>Aide & Support</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => signOut()} 
          className="text-destructive cursor-pointer py-2.5 focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
UserMenuDropdown.displayName = 'UserMenuDropdown'

// Header principal Channable
export const ChannableHeader = memo(({ className }: { className?: string }) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "sticky top-0 z-50 w-full",
        "border-b border-border/40",
        "bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80",
        className
      )}
    >
      {/* Main Navigation Row */}
      <div className="flex h-14 items-center justify-between px-4 gap-4">
        {/* Left: Sidebar trigger + Logo indicator */}
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-9 w-9 rounded-xl hover:bg-muted/50 transition-colors" />
          
          {/* Brand indicator (mobile) */}
          <div className="flex md:hidden items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Commerce Hub</span>
          </div>
        </div>
        
        {/* Center: Horizontal Navigation Tabs */}
        <HorizontalNavTabs />
        
        {/* Right: Search + Actions */}
        <div className="flex items-center gap-2">
          <GlobalSearch />
          <QuickActionsButton />
          
          <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
          
          <NotificationsDropdown />
          <UserMenuDropdown />
        </div>
      </div>
      
      {/* Breadcrumbs Row (desktop only) */}
      <div className="hidden md:flex h-10 items-center px-4 border-t border-border/20 bg-muted/20">
        <ChannableBreadcrumbs />
        
        {/* Quick filters / actions */}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
            <Filter className="h-3 w-3" />
            Filtres
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-3 w-3" />
            Actualiser
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
            <Download className="h-3 w-3" />
            Exporter
          </Button>
        </div>
      </div>
    </motion.header>
  )
})
ChannableHeader.displayName = 'ChannableHeader'
