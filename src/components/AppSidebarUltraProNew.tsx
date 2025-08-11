import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Link, useLocation } from "react-router-dom"
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
  Activity
} from "lucide-react"
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
      { title: "Plugins Pro", url: "/plugins-ultra-pro", icon: Puzzle }
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

// Quick actions avec badges dynamiques
const quickActions = [
  { 
    title: "Nouveau produit", 
    icon: Plus, 
    action: "new-product", 
    variant: "default" as const,
    shortcut: "Ctrl+N"
  },
  { 
    title: "Prédictions IA", 
    icon: Bot, 
    action: "ai-predictions", 
    variant: "secondary" as const,
    shortcut: "Ctrl+I"
  },
  { 
    title: "Sync temps réel", 
    icon: Zap, 
    action: "sync", 
    variant: "outline" as const,
    shortcut: "Ctrl+R"
  }
]

// User activity data
const userActivity = {
  status: "online",
  lastActivity: "2 min ago",
  notifications: 3,
  plan: "Enterprise"
}

export function AppSidebarUltraPro() {
  const location = useLocation()
  const { open, setOpen, state } = useSidebar()
  const { theme, setTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Tableaux de Bord": true,
    "E-commerce": true,
    "CRM & Marketing Ultra": false,
    "IA & Automatisation": false,
    "Extensions & Mobile": false,
    "Support & Outils": false
  })

  const collapsed = state === "collapsed"

  // Detect active route
  const isActive = useCallback((url: string) => {
    return location.pathname === url
  }, [location.pathname])

  // Toggle group state
  const toggleGroup = useCallback((groupTitle: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }))
  }, [])

  // Filter navigation items based on search
  const filteredNavigationItems = useMemo(() => {
    if (!searchQuery) return navigationItems
    
    return navigationItems.map(group => ({
      ...group,
      items: group.items?.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) || []
    })).filter(group => group.items.length > 0)
  }, [searchQuery])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault()
            document.getElementById('sidebar-search')?.focus()
            break
          case 'b':
            e.preventDefault()
            setOpen(!open)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, setOpen])

  // Get status indicator
  const getStatusIndicator = (status?: string) => {
    if (!status) return null
    
    const indicators = {
      active: <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />,
      warning: <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />,
      syncing: <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />,
      connected: <div className="w-2 h-2 bg-emerald-500 rounded-full" />,
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
                  "w-full justify-between",
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
                          className="ml-auto text-xs"
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
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem: any) => (
                    <SidebarMenuSubItem key={subItem.url}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={isActive(subItem.url)}
                      >
                        <Link to={subItem.url} className="flex items-center gap-3 w-full">
                          <subItem.icon className="h-4 w-4" />
                          <span className="flex-1">{subItem.title}</span>
                          <div className="flex items-center gap-2">
                            {getStatusIndicator(subItem.status)}
                            {subItem.badge && (
                              <Badge 
                                variant={subItem.badge.variant}
                                className="text-xs"
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
                <Link to={item.url} className="flex items-center gap-3 w-full">
                  <item.icon className="h-5 w-5" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      <div className="flex items-center gap-2">
                        {getStatusIndicator(item.status)}
                        {item.badge && (
                          <Badge 
                            variant={item.badge.variant}
                            className="text-xs"
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
    <Sidebar className="border-r bg-sidebar" collapsible="icon">
      {/* Header with logo and search */}
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Crown className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-lg">Shopopti Pro</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Dropshipping</span>
                  <Badge variant="outline" className="text-xs px-1">Ultra Pro</Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search bar */}
        {!collapsed && (
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="sidebar-search"
              placeholder="Recherche intelligente... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-sidebar-accent border-sidebar-border"
            />
          </div>
        )}

        {/* Quick actions */}
        {!collapsed && (
          <div className="flex items-center gap-2 mt-4">
            {quickActions.map((action) => (
              <TooltipProvider key={action.action}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={action.variant}
                      size="sm"
                      className="flex-1"
                    >
                      <action.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.shortcut}</p>
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
          // Search results view
          <SidebarGroup>
            <SidebarGroupLabel>Résultats de recherche</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredNavigationItems.map((group) =>
                  group.items?.map((item) => (
                    <SidebarItem key={item.url} item={item} />
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          // Normal navigation view
          <>
            {navigationItems.map((group) => (
              <SidebarGroup key={group.title}>
                {!collapsed && (
                  <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
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

            {/* Real-time stats */}
            {!collapsed && !searchQuery && (
              <SidebarGroup className="mt-auto">
                <SidebarGroupLabel>Statistiques temps réel</SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="space-y-3 px-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Commandes</span>
                      <Badge variant="destructive" className="animate-pulse">24</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Visiteurs</span>
                      <Badge variant="outline">1,247</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Revenus</span>
                      <span className="font-mono text-emerald-500">€12,847</span>
                    </div>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>

      {/* Footer with user profile */}
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder-avatar.jpg" />
            <AvatarFallback className="bg-gradient-primary text-white font-semibold">
              JD
            </AvatarFallback>
          </Avatar>
          
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">John Doe</p>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">En ligne</Badge>
                <Badge variant="secondary" className="text-xs">Pro</Badge>
              </div>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                <Badge variant="destructive" className="ml-auto text-xs">
                  {userActivity.notifications}
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 mr-2" />
                ) : (
                  <Moon className="h-4 w-4 mr-2" />
                )}
                {theme === "dark" ? "Mode clair" : "Mode sombre"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* System status */}
        {!collapsed && (
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Système OK</span>
              <span className="text-emerald-500">Uptime: 99.9%</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}