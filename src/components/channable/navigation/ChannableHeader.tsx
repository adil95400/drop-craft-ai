/**
 * ChannableHeader - Header navigation avec design Channable
 * Breadcrumbs, recherche rapide, actions globales
 */
import { memo, useState, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, Bell, Settings, ChevronRight, Home, Command, 
  User, LogOut, HelpCircle, Sparkles, Menu
} from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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

// Breadcrumbs Channable
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
        className="flex items-center gap-1 px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Accueil</span>
      </motion.button>
      
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          <motion.button
            onClick={() => !crumb.isLast && navigate(crumb.path)}
            className={cn(
              "px-2 py-1 rounded-md transition-colors",
              crumb.isLast 
                ? "font-medium text-foreground bg-muted/50" 
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

// Recherche globale Command Palette
const GlobalSearch = memo(() => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { availableModules, canAccess } = useModules()

  const handleSelect = useCallback((route: string) => {
    navigate(route)
    setOpen(false)
  }, [navigate])

  // Keyboard shortcut
  useState(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(open => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  })

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 h-9 px-3 bg-muted/30 border-muted hover:bg-muted/50 rounded-xl"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Rechercher...</span>
        <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <Command className="h-3 w-3" />K
        </kbd>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="sm:hidden h-9 w-9"
      >
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Rechercher un module, une action..." />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
          
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
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>{module.name}</span>
                    {module.badge && (
                      <Badge variant="secondary" className="ml-auto text-[10px]">
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

// Notifications Dropdown
const NotificationsDropdown = memo(() => {
  const [hasNew, setHasNew] = useState(true)
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl">
          <Bell className="h-4 w-4" />
          {hasNew && (
            <motion.span
              className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-semibold">Notifications</span>
          <Badge variant="secondary" className="text-[10px]">3 nouvelles</Badge>
        </div>
        <div className="py-2 space-y-1">
          {[
            { title: "Import terminé", desc: "245 produits importés avec succès", time: "Il y a 5 min" },
            { title: "Alerte stock", desc: "15 produits en rupture de stock", time: "Il y a 1h" },
            { title: "Nouveau message", desc: "Support client - Réponse requise", time: "Il y a 3h" },
          ].map((notif, i) => (
            <motion.div
              key={i}
              className="px-3 py-2 hover:bg-muted/50 cursor-pointer rounded-lg mx-1"
              whileHover={{ x: 2 }}
            >
              <p className="text-sm font-medium">{notif.title}</p>
              <p className="text-xs text-muted-foreground">{notif.desc}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">{notif.time}</p>
            </motion.div>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-primary cursor-pointer">
          Voir toutes les notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
NotificationsDropdown.displayName = 'NotificationsDropdown'

// User Menu Dropdown
const UserMenuDropdown = memo(() => {
  const { profile, user, signOut } = useUnifiedAuth()
  const navigate = useNavigate()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-2 px-2 rounded-xl">
          <motion.div 
            className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-xs"
            whileHover={{ scale: 1.05 }}
          >
            {profile?.full_name?.[0]?.toUpperCase() || 'U'}
          </motion.div>
          <span className="hidden md:inline text-sm font-medium max-w-[100px] truncate">
            {profile?.full_name || 'Utilisateur'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 border-b">
          <p className="font-medium">{profile?.full_name || 'Utilisateur'}</p>
          <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
          <Badge variant="secondary" className="mt-1 text-[10px]">
            {profile?.plan || 'Standard'} Plan
          </Badge>
        </div>
        <DropdownMenuItem onClick={() => navigate('/settings/profile')} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          Mon profil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          Paramètres
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/help')} className="cursor-pointer">
          <HelpCircle className="mr-2 h-4 w-4" />
          Aide & Support
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
UserMenuDropdown.displayName = 'UserMenuDropdown'

// Header principal
export const ChannableHeader = memo(({ className }: { className?: string }) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "sticky top-0 z-50 w-full h-14",
        "border-b border-border/50",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex h-14 items-center justify-between px-4 gap-4">
        {/* Left: Sidebar trigger + Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <SidebarTrigger className="h-9 w-9 rounded-xl flex-shrink-0" />
          <div className="hidden md:block min-w-0">
            <ChannableBreadcrumbs />
          </div>
        </div>
        
        {/* Right: Search + Actions */}
        <div className="flex items-center gap-2">
          <GlobalSearch />
          <NotificationsDropdown />
          <UserMenuDropdown />
        </div>
      </div>
    </motion.header>
  )
})
ChannableHeader.displayName = 'ChannableHeader'
