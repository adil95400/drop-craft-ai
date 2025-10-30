import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { 
  Search, 
  Bot, 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck,
  Settings, 
  Megaphone, 
  Shield, 
  FileText, 
  Heart, 
  Star, 
  Zap, 
  ChevronDown, 
  ChevronRight,
  Home,
  Smartphone,
  Headphones,
  Monitor,
  Gamepad2,
  Camera,
  Watch,
  Plus,
  Crown,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  Mail,
  Calendar,
  Phone,
  MessageSquare,
  Globe,
  Puzzle,
  Palette,
  LogOut,
  User,
  Moon,
  Sun,
  Bell,
  HelpCircle,
  Activity,
  PlusCircle,
  RefreshCw,
  Link as LinkIcon
} from "lucide-react"
import { logError } from "@/utils/consoleCleanup"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from "next-themes"
import { toast } from "sonner"

// Performance optimizations with memoized data
const SEARCH_DELAY = 300 // Debounce search
const ANIMATION_DURATION = 200

// Navigation structure with enhanced data
const navigationItems = [
  {
    title: "Tableaux de Bord",
    icon: BarChart3,
    badge: { text: "Pro", variant: "default" as const },
    items: [
      { title: "Vue d'ensemble", url: "/dashboard", icon: Home, badge: { text: "Live", variant: "success" as const } },
      { title: "Analytics", url: "/analytics", icon: TrendingUp, badge: { text: "Hot", variant: "destructive" as const } },
      { title: "Analytics Ultra Pro", url: "/analytics-ultra-pro", icon: Bot, badge: { text: "AI", variant: "secondary" as const } },
    ]
  },
  {
    title: "E-commerce",
    icon: ShoppingCart,
    badge: { text: "847", variant: "outline" as const },
    items: [
      {
        title: "Catalogue Ultra Pro",
        url: "/catalogue-ultra-pro",
        icon: Package,
        badge: { text: "847", variant: "outline" as const }
      },
      {
        title: "Commandes",
        url: "/orders",
        icon: ShoppingCart,
        badge: { text: "24", variant: "destructive" as const },
        status: "active"
      },
      {
        title: "Inventaire Pro",
        url: "/inventory-ultra-pro",
        icon: Package,
        badge: { text: "Sync", variant: "secondary" as const },
        status: "syncing"
      },
      {
        title: "Stock Ultra",
        url: "/stock-ultra-pro",
        icon: Activity,
        badge: { text: "Low", variant: "destructive" as const },
        status: "warning"
      },
      {
        title: "Fournisseurs Pro",
        url: "/suppliers-ultra-pro",
        icon: Truck,
        badge: { text: "API", variant: "outline" as const },
        status: "connected"
      },
      {
        title: "Gestion Plateformes",
        url: "/platform-management",
        icon: Globe,
        badge: { text: "Auto", variant: "default" as const },
        status: "active"
      }
    ]
  },
  {
    title: "CRM & Marketing Ultra",
    icon: Users,
    badge: { text: "Hot", variant: "destructive" as const },
    items: [
      {
        title: "CRM Ultra Pro",
        url: "/crm-ultra-pro",
        icon: Users,
        badge: { text: "156", variant: "outline" as const }
      },
      {
        title: "Prospects Ultra Pro",
        url: "/crm-prospects-ultra-pro",
        icon: Target,
        badge: { text: "AI", variant: "secondary" as const }
      },
      {
        title: "Marketing Ultra",
        url: "/marketing-ultra-pro",
        icon: Megaphone,
        badge: { text: "Auto", variant: "default" as const }
      }
    ]
  },
  {
    title: "IA & Automatisation",
    icon: Bot,
    badge: { text: "Ultra", variant: "default" as const },
    items: [
      { title: "Assistant IA", url: "/ai", icon: Bot, badge: { text: "New", variant: "default" as const } },
      { title: "Automatisation", url: "/automation-ultra-pro", icon: Zap, badge: { text: "Pro", variant: "secondary" as const } },
    ]
  },
  {
    title: "Extensions & Mobile",
    icon: Smartphone,
    items: [
      { title: "Extension Pro", url: "/extension-ultra-pro", icon: Puzzle },
      { title: "Mobile Pro", url: "/mobile-ultra-pro", icon: Smartphone },
      { title: "Plugins Pro", url: "/plugins-ultra-pro", icon: Puzzle },
      { title: "Intégrations", url: "/integrations", icon: LinkIcon, badge: { text: "API", variant: "secondary" as const } }
    ]
  },
  {
    title: "Support & Outils",
    icon: HelpCircle,
    items: [
      { title: "Support Pro", url: "/support-ultra-pro", icon: HelpCircle },
      { title: "SEO Ultra Pro", url: "/seo-ultra-pro", icon: Globe },
      { title: "Blog Ultra Pro", url: "/blog-ultra-pro", icon: FileText },
      { title: "Sécurité", url: "/security-ultra-pro", icon: Shield }
    ]
  }
]

// Enhanced quick actions with keyboard shortcuts and modern features
const quickActions = [
  { 
    title: "IA Assistant", 
    icon: Bot, 
    action: "ai-assistant",
    variant: "default" as const,
    shortcut: "Ctrl+I",
    badge: "AI"
  },
  { 
    title: "Nouveau Produit", 
    icon: PlusCircle, 
    action: "catalogue-ultra-pro?action=add",
    variant: "secondary" as const,
    shortcut: "Ctrl+N"
  },
  { 
    title: "Analytics Live", 
    icon: TrendingUp, 
    action: "analytics-ultra-pro",
    variant: "outline" as const,
    shortcut: "Ctrl+A",
    badge: "Live"
  },
  { 
    title: "Support Rapide", 
    icon: HelpCircle, 
    action: "support-ultra-pro",
    variant: "ghost" as const,
    shortcut: "Ctrl+?"
  },
  { 
    title: "Synchroniser", 
    icon: RefreshCw, 
    action: "sync",
    variant: "outline" as const,
    shortcut: "Ctrl+R"
  },
]

// Enhanced user activity with real-time data
const userActivity = {
  status: "online",
  notifications: 8,
  plan: "Ultra Pro",
  lastSync: "Il y a 2 min",
  activeConnections: 3,
  todayRevenue: "€2,847",
  pendingTasks: 12
}

export function AppSidebarUltraPro() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = useSidebar()
  const { theme, setTheme } = useTheme()
  const collapsed = state === "collapsed"
  
  // Enhanced state management
  const [searchQuery, setSearchQuery] = useState("")
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Tableaux de Bord": true,
    "E-commerce": true,
    "CRM & Marketing Ultra": false,
    "IA & Automatisation": false,
    "Extensions & Mobile": false,
    "Support & Outils": false
  })
  const [isSearching, setIsSearching] = useState(false)
  const [recentItems, setRecentItems] = useState<string[]>([])
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')

  // Optimized active route detection with memoization
  const isActive = useCallback((url?: string) => {
    if (!url) return false
    return location.pathname === url || location.pathname.startsWith(url + '/')
  }, [location.pathname])

  // Enhanced group toggle with persistence
  const toggleGroup = useCallback((title: string) => {
    setOpenGroups(prev => {
      const newState = { ...prev, [title]: !prev[title] }
      // Persist to localStorage for better UX
      localStorage.setItem('sidebar-groups', JSON.stringify(newState))
      return newState
    })
  }, [])

  // Advanced search with fuzzy matching
  const filteredNavigationItems = useMemo(() => {
    if (!searchQuery.trim()) return navigationItems
    
    const query = searchQuery.toLowerCase()
    return navigationItems.map(group => ({
      ...group,
      items: group.items?.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.url.toLowerCase().includes(query) ||
        group.title.toLowerCase().includes(query)
      )
    })).filter(group => group.items && group.items.length > 0)
  }, [searchQuery])

  // Enhanced quick action handler
  const handleQuickAction = useCallback((action: string) => {
    if (action === 'sync') {
      setSyncStatus('syncing')
      toast.loading("Synchronisation en cours...", { id: 'sync' })
      // Simulate sync process
      setTimeout(() => {
        setSyncStatus('success')
        toast.success("✓ Synchronisation terminée", { id: 'sync' })
        setTimeout(() => setSyncStatus('idle'), 2000)
      }, 1500)
    } else {
      navigate(`/${action}`)
    }
    
    // Track recent actions
    setRecentItems(prev => [action, ...prev.filter(item => item !== action)].slice(0, 5))
  }, [navigate])

  // Enhanced keyboard shortcuts with modern features
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
          case 'K':
            e.preventDefault()
            document.getElementById('sidebar-search')?.focus()
            break
          case 'i':
          case 'I':
            e.preventDefault()
            handleQuickAction('ai-assistant')
            break
          case 'n':
          case 'N':
            e.preventDefault()
            handleQuickAction('catalogue-ultra-pro?action=add')
            break
          case 'r':
          case 'R':
            e.preventDefault()
            handleQuickAction('sync')
            break
        }
      }
      
      // Escape to clear search
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('')
        document.getElementById('sidebar-search')?.blur()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchQuery, handleQuickAction])

  // Load persisted group states
  useEffect(() => {
    const savedGroups = localStorage.getItem('sidebar-groups')
    if (savedGroups) {
      try {
        setOpenGroups(JSON.parse(savedGroups))
      } catch (error) {
        logError(error, 'Failed to load sidebar groups')
      }
    }
  }, [])

  // Get status indicator
  const getStatusIndicator = (status?: string) => {
    if (!status) return null
    
    const indicators = {
      active: <div className="w-2 h-2 bg-success rounded-full animate-pulse" />,
      warning: <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />,
      syncing: <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />,
      connected: <div className="w-2 h-2 bg-success rounded-full" />,
    }
    
    return indicators[status as keyof typeof indicators]
  }

  // Sidebar item component with enhanced features
  const SidebarItem = ({ item, level = 0 }: { item: any; level?: number }) => {
    const isActiveItem = isActive(item.url)
    const hasSubItems = item.items && item.items.length > 0
    const isGroupOpen = openGroups[item.title]

    if (hasSubItems) {
      return (
        <Collapsible open={isGroupOpen} onOpenChange={() => toggleGroup(item.title)}>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className={cn(
                  "w-full justify-between transition-all duration-200",
                  isGroupOpen && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {!collapsed && (
                    <>
                      <span className="font-medium">{item.title}</span>
                      {item.badge && (
                        <Badge 
                          variant={item.badge.variant}
                          className="ml-auto text-xs animate-in fade-in-0 duration-200"
                        >
                          {item.badge.text}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                {!collapsed && (
                  <ChevronRight 
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isGroupOpen && "rotate-90"
                    )} 
                  />
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            
            {!collapsed && (
              <CollapsibleContent className="animate-in slide-in-from-top-1 duration-200">
                <SidebarMenuSub>
                  {item.items?.map((subItem: any) => (
                    <SidebarMenuSubItem key={subItem.url}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={isActive(subItem.url)}
                      >
                        <Link 
                          to={subItem.url} 
                          className="flex items-center gap-3 w-full transition-all duration-200 hover:bg-sidebar-accent/50"
                        >
                          <subItem.icon className="h-4 w-4" />
                          <span className="flex-1">{subItem.title}</span>
                          <div className="flex items-center gap-2">
                            {getStatusIndicator(subItem.status)}
                            {subItem.badge && (
                              <Badge 
                                variant={subItem.badge.variant}
                                className="text-xs animate-in fade-in-0 duration-200"
                              >
                                {subItem.badge.text}
                              </Badge>
                            )}
                          </div>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            )}
          </SidebarMenuItem>
        </Collapsible>
      )
    }

    return (
      <SidebarMenuItem>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton asChild isActive={isActiveItem}>
                <Link 
                  to={item.url} 
                  className="flex items-center gap-3 w-full transition-all duration-200"
                >
                  <item.icon className="h-5 w-5" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      <div className="flex items-center gap-2">
                        {getStatusIndicator(item.status)}
                        {item.badge && (
                          <Badge 
                            variant={item.badge.variant}
                            className="text-xs animate-in fade-in-0 duration-200"
                          >
                            {item.badge.text}
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </Link>
              </SidebarMenuButton>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-medium">
                <p>{item.title}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </SidebarMenuItem>
    )
  }

  return (
    <Sidebar className="border-r bg-sidebar transition-all duration-300" variant="inset" collapsible="icon">
      {/* Header with logo and search */}
      <SidebarHeader className="border-b p-4 bg-gradient-to-r from-sidebar/80 to-sidebar">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-lg">
              <Crown className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col animate-in fade-in-0 slide-in-from-left-2 duration-300">
                <span className="font-bold text-lg">Shopopti Pro</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Dropshipping</span>
                  <Badge variant="outline" className="text-xs px-1">Ultra Pro</Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced search bar */}
        {!collapsed && (
          <div className="relative mt-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="sidebar-search"
              placeholder="Recherche intelligente... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsSearching(e.target.value.length > 0)
              }}
              className="pl-10 bg-sidebar-accent border-sidebar-border focus:ring-2 focus:ring-primary/50 transition-all duration-200"
            />
            {isSearching && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => {
                  setSearchQuery('')
                  setIsSearching(false)
                }}
              >
                ×
              </Button>
            )}
          </div>
        )}

        {/* Enhanced quick actions with loading states */}
        {!collapsed && (
          <div className="flex items-center gap-2 mt-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {quickActions.map((action, index) => (
              <TooltipProvider key={action.action}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={action.variant}
                      size="sm"
                      className={cn(
                        "flex-1 relative transition-all duration-200 animate-in fade-in-0 zoom-in-95",
                        action.action === 'sync' && syncStatus === 'syncing' && "animate-pulse",
                        "hover:scale-105"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => handleQuickAction(action.action)}
                      disabled={action.action === 'sync' && syncStatus === 'syncing'}
                    >
                      <action.icon className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        action.action === 'sync' && syncStatus === 'syncing' && "animate-spin"
                      )} />
                      {action.badge && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 text-xs px-1 h-4 animate-bounce">
                          {action.badge}
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-popover border shadow-lg">
                    <p className="font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.shortcut}</p>
                    {syncStatus === 'success' && action.action === 'sync' && (
                      <p className="text-xs text-success">✓ Synchronisé</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </SidebarHeader>

      {/* Main navigation */}
      <SidebarContent className="custom-scrollbar">
        {searchQuery && !collapsed ? (
          // Enhanced search results view
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <Search className="h-4 w-4" />
              Résultats de recherche ({filteredNavigationItems.reduce((acc, group) => acc + (group.items?.length || 0), 0)})
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredNavigationItems.map((group, groupIndex) =>
                  group.items?.map((item, itemIndex) => (
                    <div 
                      key={item.url} 
                      className="animate-in fade-in-0 slide-in-from-left-1 duration-200"
                      style={{ animationDelay: `${(groupIndex * 10 + itemIndex) * 20}ms` }}
                    >
                      <SidebarItem item={item} />
                    </div>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          // Normal navigation view
          <>
            {navigationItems.map((group, groupIndex) => (
              <SidebarGroup 
                key={group.title}
                className="animate-in fade-in-0 slide-in-from-left-1 duration-300"
                style={{ animationDelay: `${groupIndex * 50}ms` }}
              >
                {!collapsed && (
                  <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-muted-foreground transition-all duration-200 hover:text-foreground">
                    {group.title}
                  </SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarItem item={group} />
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}

            {/* Enhanced real-time stats with animations */}
            {!collapsed && !searchQuery && (
              <SidebarGroup className="mt-auto animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                <SidebarGroupLabel className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Statistiques temps réel
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="space-y-3 px-3">
                    {[
                      { label: "Commandes", value: "24", variant: "destructive" as const, animate: "animate-pulse" },
                      { label: "Visiteurs", value: "1,247", variant: "outline" as const },
                      { label: "Revenus", value: userActivity.todayRevenue, color: "text-success" },
                      { label: "Tâches", value: userActivity.pendingTasks, variant: "secondary" as const }
                    ].map((stat, index) => (
                      <div 
                        key={stat.label}
                        className={cn(
                          "flex items-center justify-between text-sm transition-all duration-200 hover:bg-sidebar-accent/30 rounded px-2 py-1 animate-in fade-in-0 slide-in-from-right-1",
                          stat.animate
                        )}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <span className="text-muted-foreground">{stat.label}</span>
                        {stat.variant ? (
                          <Badge variant={stat.variant} className="font-mono">
                            {stat.value}
                          </Badge>
                        ) : (
                          <span className={cn("font-mono font-semibold", stat.color)}>
                            {stat.value}
                          </span>
                        )}
                      </div>
                    ))}
                    <div className="pt-2 border-t text-xs text-muted-foreground flex items-center justify-between animate-in fade-in-0 slide-in-from-bottom-1 duration-300 delay-500">
                      <span>Dernière sync</span>
                      <span className="font-mono">{userActivity.lastSync}</span>
                    </div>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>

      {/* Enhanced footer with user profile */}
      <SidebarFooter className="border-t p-4 bg-gradient-to-r from-sidebar/80 to-sidebar">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20 transition-all duration-200 hover:ring-primary/40">
            <AvatarImage src="/placeholder-avatar.jpg" />
            <AvatarFallback className="bg-gradient-primary text-white font-semibold">
              JD
            </AvatarFallback>
          </Avatar>
          
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-in fade-in-0 slide-in-from-left-2 duration-300">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">John Doe</p>
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">En ligne</Badge>
                <Badge variant="secondary" className="text-xs">{userActivity.plan}</Badge>
              </div>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-sidebar-accent transition-all duration-200">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border shadow-xl">
              <DropdownMenuItem className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                <Badge variant="destructive" className="ml-auto text-xs">
                  {userActivity.notifications}
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 mr-2" />
                ) : (
                  <Moon className="h-4 w-4 mr-2" />
                )}
                {theme === "dark" ? "Mode clair" : "Mode sombre"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Enhanced system status with more info */}
        {!collapsed && (
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-1 duration-500 delay-300">
            <div className="flex items-center justify-between mb-2">
              <span>Système</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-success font-medium">Opérationnel</span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span>Uptime</span>
              <span className="font-mono">99.9%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Connexions</span>
              <span className="font-mono">{userActivity.activeConnections}/5</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}