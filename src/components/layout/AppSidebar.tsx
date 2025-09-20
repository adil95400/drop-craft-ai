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
  Building2, Network, Zap, Brain
} from "lucide-react"
import { useAuthOptimized } from "@/shared/hooks/useAuthOptimized"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Produits", url: "/products", icon: Package },
  { title: "Commandes", url: "/orders", icon: ShoppingCart },
  { title: "Centre Commandes", url: "/orders-center", icon: Activity, badge: "Nouveau" },
  { title: "Clients", url: "/customers", icon: Users },
  { title: "Fournisseurs", url: "/suppliers", icon: Truck },
  { title: "Import", url: "/import", icon: Upload },
  { title: "Import Avancé", url: "/import/advanced", icon: Upload, badge: "Pro" },
  { title: "Sync Manager", url: "/sync-manager", icon: Activity, badge: "Nouveau" },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "CRM", url: "/crm", icon: MessageSquare },
  { title: "CRM Calendrier", url: "/crm/calendar", icon: LayoutDashboard, badge: "Nouveau" },
  { title: "Suivi Aujourd'hui", url: "/tracking/today", icon: Activity, badge: "Live" },
  { title: "Marketing", url: "/marketing", icon: Megaphone },
  { title: "Monitoring", url: "/monitoring", icon: Activity },
  { title: "Extensions", url: "/extensions", icon: Puzzle, badge: "Nouveau" },
  { title: "IA Assistant", url: "/ai-assistant", icon: Bot, badge: "AI" },
  { title: "IA Studio", url: "/ai-studio", icon: Brain, badge: "AI" },
  { title: "Automation Studio", url: "/automation-studio", icon: Zap, badge: "Auto" },
  { title: "Analytics Studio", url: "/analytics-studio", icon: BarChart3, badge: "Pro" },
  { title: "Intégrations", url: "/integrations", icon: Network, badge: "Hub" },
  { title: "Marketplace", url: "/marketplace", icon: Store },
  { title: "Stores", url: "/stores", icon: Building2 },
  { title: "Centre d'aide", url: "/help", icon: BookOpen, badge: "Support" },
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

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path)
  const getNavCls = ({ isActive: active }: { isActive: boolean }) =>
    active 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 transition-colors"

  // Combine regular, phase 3, and admin navigation items
  const allNavigationItems = [
    ...navigationItems,
    ...phase3NavigationItems,
    ...(isAdmin ? adminNavigationItems : [])
  ]

  return (
    <Sidebar className="border-r bg-card"
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

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {allNavigationItems.map((item: any) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    <NavLink 
                      to={item.url} 
                      className={({ isActive: navLinkIsActive }) => `
                        ${getNavCls({ isActive: navLinkIsActive || isActive(item.url) })}
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                        ${item.adminOnly ? 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-l-2 border-red-500/30' : ''}
                        ${item.phase === 3 ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-l-2 border-purple-500/30' : ''}
                      `}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <div className="flex items-center justify-between w-full">
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge 
                            variant={
                              item.badge === "AI" ? "default" : 
                              item.badge === "Phase 3" ? "default" :
                              "secondary"
                            }
                            className={`text-xs ${
                              item.badge === "Phase 3" ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white" : ""
                            }`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                        {item.adminOnly && (
                          <Badge 
                            variant="destructive"
                            className="text-xs"
                          >
                            Admin
                          </Badge>
                        )}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}