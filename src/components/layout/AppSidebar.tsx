import React from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { 
  LayoutDashboard, Store, Package, BookOpen, ShoppingCart, 
  Upload, Truck, BarChart3, Activity, Users, MessageSquare,
  Megaphone, FileText, Search, Puzzle, Bot, Crown, Shield,
  Building2, Network, Zap, Brain, ChevronDown, ChevronRight,
  Settings, Globe, Database, Cloud, Smartphone, Code, 
  TrendingUp, Target, Mail, Calendar, Clock, Eye, Layers,
  GitBranch, Lock, Workflow, PieChart, LineChart, BarChart,
  Download, Filter, Bell, Star, Heart, ThumbsUp, Share,
  PlayCircle, PauseCircle, RefreshCw, AlertCircle, CheckCircle,
  Sparkles, History
} from "lucide-react"
import { useAuthOptimized } from "@/shared/hooks/useAuthOptimized"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"

// Navigation avec sous-menus
const navigationGroups = [
  {
    title: "Tableau de bord",
    items: [
      { title: "Dashboard Principal", url: "/dashboard", icon: LayoutDashboard },
      { title: "Dashboard Super", url: "/dashboard-super", icon: Crown, badge: "Pro" },
      { title: "Dashboard Classic", url: "/dashboard-classic", icon: Activity },
    ]
  },
  {
    title: "E-Commerce",
    items: [
      { title: "Produits", url: "/products", icon: Package },
      { title: "Commandes", url: "/orders", icon: ShoppingCart },
      { title: "Centre Commandes", url: "/orders-center", icon: Activity, badge: "Nouveau" },
      { title: "Clients", url: "/customers", icon: Users },
      { title: "Fournisseurs", url: "/suppliers", icon: Truck },
    ]
  },
  {
    title: "Import & Synchronisation",
    items: [
      { title: "Hub Import", url: "/import-management", icon: Upload, badge: "Hub" },
      { title: "Import Standard", url: "/import", icon: Upload },
      { title: "Import Avancé", url: "/import/advanced", icon: Upload, badge: "Pro" },
      { title: "Import CSV", url: "/import/csv", icon: FileText },
      { title: "Import API", url: "/import/api", icon: Code },
      { title: "Import Database", url: "/import/database", icon: Database },
      { title: "Web Scraping", url: "/import/url", icon: Globe },
      { title: "IA Generation", url: "/import/ai-generation", icon: Brain, badge: "AI" },
      { title: "Extension Navigator", url: "/import/extension-navigator", icon: Puzzle, badge: "Premium" },
      { title: "Imports Programmés", url: "/import/scheduled", icon: Clock },
      { title: "Historique", url: "/import/history", icon: History },
      { title: "Configuration Import", url: "/import/configuration", icon: Settings },
      { title: "Sync Manager", url: "/sync-manager", icon: Activity, badge: "Nouveau" },
    ]
  },
  {
    title: "Intelligence Artificielle",
    items: [
      { title: "IA Assistant", url: "/ai-assistant", icon: Bot, badge: "AI" },
      { title: "IA Studio", url: "/ai-studio", icon: Brain, badge: "AI" },
      { title: "IA Automation", url: "/ai-automation", icon: Workflow, badge: "Ultra Pro" },
      { title: "Creative Studio", url: "/creative-studio", icon: Sparkles },
    ]
  },
  {
    title: "Analytics & Rapports",
    items: [
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
      { title: "Analytics Studio", url: "/analytics-studio", icon: TrendingUp, badge: "Pro" },
      { title: "Business Intelligence", url: "/business-intelligence", icon: PieChart, badge: "Phase 3" },
      { title: "Suivi Aujourd'hui", url: "/tracking/today", icon: Eye, badge: "Live" },
      { title: "Monitoring", url: "/monitoring", icon: Activity },
    ]
  },
  {
    title: "CRM & Marketing",
    items: [
      { title: "CRM", url: "/crm", icon: MessageSquare },
      { title: "CRM Calendrier", url: "/crm/calendar", icon: Calendar, badge: "Nouveau" },
      { title: "Marketing", url: "/marketing", icon: Megaphone },
      { title: "Marketing Ads", url: "/ads-marketing", icon: Target, badge: "Ultra Pro" },
      { title: "Affiliation", url: "/affiliation", icon: Share, badge: "Ultra Pro" },
    ]
  },
  {
    title: "Intégrations & Stores",
    items: [
      { title: "Intégrations Hub", url: "/integrations", icon: Network, badge: "Hub" },
      { title: "Stores", url: "/stores", icon: Building2 },
      { title: "Connecter Store", url: "/stores/connect", icon: Globe },
      { title: "Marketplace", url: "/marketplace", icon: Store },
    ]
  },
  {
    title: "Automation & Outils",
    items: [
      { title: "Automation Studio", url: "/automation-studio", icon: Zap, badge: "Auto" },
      { title: "Automation", url: "/automation", icon: Workflow },
      { title: "Stock Management", url: "/stock-management", icon: Package },
      { title: "Stock Avancé", url: "/stock", icon: Database, badge: "Pro" },
      { title: "Returns", url: "/returns", icon: RefreshCw, badge: "Ultra Pro" },
    ]
  },
  {
    title: "Extensions & Développement",
    items: [
      { title: "Extensions", url: "/extensions", icon: Puzzle, badge: "Nouveau" },
      { title: "Extensions Hub", url: "/extensions/hub", icon: Layers },
      { title: "Extensions Marketplace", url: "/extensions-marketplace", icon: Store, badge: "Phase 3" },
      { title: "Extension API", url: "/extensions-api", icon: Code, badge: "Pro" },
      { title: "Developer", url: "/extensions/developer", icon: Code },
    ]
  },
  {
    title: "Entreprise & Avancé",
    items: [
      { title: "Multi-Tenant", url: "/multi-tenant", icon: Building2, badge: "Phase 3" },
      { title: "Enterprise API", url: "/enterprise-api", icon: Network, badge: "Phase 3" },
      { title: "White Label", url: "/white-label", icon: Crown, badge: "Ultra Pro" },
      { title: "Team Collaboration", url: "/team-collaboration", icon: Users },
      { title: "Observability", url: "/observability", icon: Eye, badge: "Phase 3" },
    ]
  },
  {
    title: "Mobile & Applications",
    items: [
      { title: "Mobile Dashboard", url: "/mobile-dashboard", icon: Smartphone },
      { title: "Mobile Apps", url: "/mobile-apps", icon: Smartphone },
      { title: "PWA Install", url: "/pwa-install", icon: Download },
      { title: "Flutter Mobile", url: "/flutter-mobile", icon: Smartphone },
    ]
  },
  {
    title: "Support & Configuration",
    items: [
      { title: "Centre d'aide", url: "/help", icon: BookOpen, badge: "Support" },
      { title: "Support", url: "/support", icon: MessageSquare },
      { title: "Settings", url: "/settings", icon: Settings },
      { title: "Profile", url: "/profile", icon: Users },
      { title: "Status Application", url: "/app-status", icon: CheckCircle },
    ]
  }
]

const phase3NavigationItems = [
  { title: "Marketplace Hub", url: "/marketplace-hub", icon: Store, badge: "Phase 3", phase: 3 },
  { title: "Multi-Tenant", url: "/multi-tenant", icon: Building2, badge: "Phase 3", phase: 3 },
  { title: "Observability", url: "/observability", icon: Network, badge: "Phase 3", phase: 3 },
  { title: "Business Intelligence", url: "/business-intelligence", icon: BarChart3, badge: "Phase 3", phase: 3 },
  { title: "Enterprise API", url: "/enterprise-api", icon: Network, badge: "Phase 3", phase: 3 },
  { title: "Extensions Marketplace", url: "/extensions-marketplace", icon: Store, badge: "Phase 3", phase: 3 },
]

const adminNavigationItems = [
  { title: "Admin Panel", url: "/admin", icon: Shield, adminOnly: true },
  { title: "Gestion Utilisateurs", url: "/admin-panel", icon: Users, adminOnly: true },
]

export function AppSidebar() {
  const location = useLocation()
  const currentPath = location.pathname
  const { user, profile, isAdmin, canAccess } = useAuthOptimized()
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['Tableau de bord', 'E-Commerce']))

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path)
  const getNavCls = ({ isActive: active }: { isActive: boolean }) =>
    active 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 transition-colors"

  const toggleGroup = (groupTitle: string) => {
    const newOpenGroups = new Set(openGroups)
    if (newOpenGroups.has(groupTitle)) {
      newOpenGroups.delete(groupTitle)
    } else {
      newOpenGroups.add(groupTitle)
    }
    setOpenGroups(newOpenGroups)
  }

  // Check if any item in a group is active to keep group open
  const isGroupActive = (items: any[]) => items.some(item => isActive(item.url))

  // Admin navigation items
  const adminItems = isAdmin ? [
    { title: "Admin Panel", url: "/admin", icon: Shield, adminOnly: true },
    { title: "Gestion Utilisateurs", url: "/admin-panel", icon: Users, adminOnly: true },
  ] : []

  return (
    <Sidebar 
      className="border-r bg-card"
      collapsible="icon"
    >
      <SidebarContent className="p-2">
        {/* Logo Section */}
        <div className="p-4 border-b mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Drop Craft AI
              </h1>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {navigationGroups.map((group) => (
              <Collapsible 
                key={group.title}
                open={openGroups.has(group.title) || isGroupActive(group.items)}
                onOpenChange={() => toggleGroup(group.title)}
              >
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between px-4 py-2 h-auto font-medium text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  >
                    <span>{group.title}</span>
                    {openGroups.has(group.title) || isGroupActive(group.items) ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pl-2">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      className={({ isActive: navLinkIsActive }) => `
                        ${getNavCls({ isActive: navLinkIsActive || isActive(item.url) })}
                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                      `}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <div className="flex items-center justify-between w-full">
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge 
                            variant={
                              item.badge === "AI" || item.badge === "Auto" ? "default" : 
                              item.badge === "Phase 3" || item.badge === "Ultra Pro" ? "default" :
                              item.badge === "Live" ? "destructive" :
                              "secondary"
                            }
                            className={`text-xs ${
                              item.badge === "Phase 3" ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white" : 
                              item.badge === "Ultra Pro" ? "bg-gradient-to-r from-orange-500 to-red-500 text-white" :
                              item.badge === "AI" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" :
                              item.badge === "Auto" ? "bg-gradient-to-r from-green-500 to-teal-500 text-white" :
                              ""
                            }`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    </NavLink>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
            
            {/* Admin Section */}
            {isAdmin && adminItems.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between px-4 py-2 h-auto font-medium text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <span>Administration</span>
                    <Shield className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pl-2">
                  {adminItems.map((item) => (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      className={({ isActive: navLinkIsActive }) => `
                        ${getNavCls({ isActive: navLinkIsActive || isActive(item.url) })}
                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                        bg-gradient-to-r from-red-500/10 to-orange-500/10 border-l-2 border-red-500/30
                      `}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <div className="flex items-center justify-between w-full">
                        <span>{item.title}</span>
                        <Badge variant="destructive" className="text-xs">
                          Admin
                        </Badge>
                      </div>
                    </NavLink>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}