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
  Megaphone, FileText, Search, Puzzle, Bot, Crown, Shield
} from "lucide-react"
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth"

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Boutiques", url: "/stores", icon: Store },
  { title: "Produits", url: "/products", icon: Package },
  { title: "Catalogue", url: "/catalog", icon: BookOpen },
  { title: "Commandes", url: "/orders", icon: ShoppingCart },
  { title: "Import", url: "/import", icon: Upload },
  { title: "Fournisseurs", url: "/suppliers", icon: Truck },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Monitoring", url: "/monitoring", icon: Activity },
  { title: "Clients", url: "/customers", icon: Users },
  { title: "CRM", url: "/crm", icon: MessageSquare },
  { title: "Marketing", url: "/marketing", icon: Megaphone },
  { title: "Blog", url: "/blog", icon: FileText },
  { title: "SEO", url: "/seo", icon: Search },
  { title: "Extensions", url: "/extensions", icon: Puzzle, badge: "Nouveau" },
  { title: "IA Assistant", url: "/ai-assistant", icon: Bot, badge: "AI" },
]

const adminNavigationItems = [
  { title: "Admin Panel", url: "/admin", icon: Shield, adminOnly: true },
  { title: "Gestion Utilisateurs", url: "/admin-panel", icon: Users, adminOnly: true },
]

export function AppSidebar() {
  const location = useLocation()
  const currentPath = location.pathname
  const { isAdmin } = useEnhancedAuth()

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/')
  const getNavCls = ({ isActive: active }: { isActive: boolean }) =>
    active 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 transition-colors"

  // Combine regular and admin navigation items
  const allNavigationItems = [
    ...navigationItems,
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
                Shoplopti+
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
                      `}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <div className="flex items-center justify-between w-full">
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge 
                            variant={item.badge === "AI" ? "default" : "secondary"}
                            className="text-xs"
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