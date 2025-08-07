import { useState } from "react";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  Bot, 
  Zap, 
  Users, 
  Star, 
  Search, 
  BarChart3, 
  Warehouse, 
  FileText, 
  Settings,
  Store,
  Crown,
  ChevronDown,
  Upload,
  Bookmark,
  MessageSquare,
  TrendingUp,
  Puzzle,
  Smartphone,
  Chrome,
  HelpCircle,
  Shield,
  Download,
  Megaphone,
  PieChart,
  Camera,
  Globe,
  UserPlus,
  Activity,
  Calendar,
  Mail,
  Phone,
  Target,
  MapPin,
  Clock,
  Package2,
  MessageCircle,
  ThumbsUp,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Pause
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuItems = [
  {
    title: "Vue d'ensemble",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
    ]
  },
  {
    title: "Catalogue & Sourcing",
    items: [
      { title: "Import Produits", url: "/import", icon: Upload },
      { title: "Catalogue", url: "/catalogue", icon: Package },
      { title: "Marketplace", url: "/marketplace", icon: Store },
      { title: "Winners", url: "/winners", icon: Crown },
    ]
  },
  {
    title: "CRM - Gestion Clients",
    icon: Users,
    isPro: true,
    items: [
      { title: "Vue d'ensemble CRM", url: "/crm", icon: Users },
      { title: "Nouveaux Clients", url: "/crm/leads", icon: UserPlus },
      { title: "Activité Client", url: "/crm/activity", icon: Activity },
      { title: "Calendrier RDV", url: "/crm/calendar", icon: Calendar },
      { title: "Email Marketing", url: "/crm/emails", icon: Mail },
      { title: "Appels & Contacts", url: "/crm/calls", icon: Phone },
    ]
  },
  {
    title: "Suivi des Commandes",
    icon: Truck,
    isPro: true,
    items: [
      { title: "Tableau de Bord", url: "/tracking", icon: Truck },
      { title: "En Transit", url: "/tracking/in-transit", icon: MapPin },
      { title: "Livraisons Aujourd'hui", url: "/tracking/today", icon: Clock },
      { title: "Commandes Livrées", url: "/tracking/delivered", icon: CheckCircle2 },
      { title: "Problèmes & Retards", url: "/tracking/issues", icon: AlertTriangle },
      { title: "Retours & SAV", url: "/tracking/returns", icon: XCircle },
    ]
  },
  {
    title: "Gestion des Avis",
    icon: Star,
    isPro: true,
    items: [
      { title: "Tous les Avis", url: "/reviews", icon: Star },
      { title: "Avis Positifs", url: "/reviews/positive", icon: ThumbsUp },
      { title: "Avis à Modérer", url: "/reviews/pending", icon: Pause },
      { title: "Avis Négatifs", url: "/reviews/negative", icon: TrendingDown },
      { title: "Réponses aux Avis", url: "/reviews/responses", icon: MessageCircle },
      { title: "Analytics Avis", url: "/reviews/analytics", icon: PieChart },
    ]
  },
  {
    title: "Commandes & Ventes",
    items: [
      { title: "Commandes", url: "/orders", icon: ShoppingCart },
      { title: "Produits", url: "/inventory", icon: Package2 },
    ]
  },
  {
    title: "Marketing & Contenu",
    items: [
      { title: "SEO & Blog", url: "/seo", icon: Search },
      { title: "Marketing", url: "/marketing", icon: Megaphone },
    ]
  },
  {
    title: "Gestion & Stock",
    items: [
      { title: "Stock & Fournisseurs", url: "/inventory", icon: Warehouse },
      { title: "Automation", url: "/automation", icon: Bot },
    ]
  },
  {
    title: "Outils & Extensions",
    items: [
      { title: "Plugins / App Store", url: "/plugins", icon: Puzzle },
      { title: "Extension Chrome", url: "/extension", icon: Chrome },
      { title: "Mobile App", url: "/mobile", icon: Smartphone },
      { title: "Intégrations", url: "/integrations", icon: Zap },
    ]
  },
  {
    title: "Support & Configuration",
    items: [
      { title: "Support", url: "/support", icon: HelpCircle },
      { title: "Paramètres", url: "/settings", icon: Settings },
      { title: "Admin", url: "/admin", icon: Shield, adminOnly: true },
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [openGroups, setOpenGroups] = useState<string[]>(["Vue d'ensemble"]);

  const isActive = (path: string) => currentPath === path;
  
  const getNavClassName = (isActiveRoute: boolean) =>
    `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
      isActiveRoute 
        ? "bg-primary text-primary-foreground font-medium" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(g => g !== groupTitle)
        : [...prev, groupTitle]
    );
  };

  // Find which group contains the active route to keep it open
  const activeGroup = menuItems.find(group => 
    group.items.some(item => isActive(item.url))
  );

  if (activeGroup && !openGroups.includes(activeGroup.title)) {
    setOpenGroups(prev => [...prev, activeGroup.title]);
  }

  return (
    <Sidebar className={state === "collapsed" ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="pt-4">
        {/* Logo */}
        <div className="px-4 pb-4">
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            {state !== "collapsed" && (
              <div className="flex flex-col">
                <span className="font-bold text-lg text-primary">Shopopti</span>
                <span className="text-xs text-muted-foreground">Pro SaaS</span>
              </div>
            )}
          </NavLink>
        </div>

        {/* Menu Groups */}
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            {state !== "collapsed" && (
              <Collapsible 
                open={openGroups.includes(group.title)}
                onOpenChange={() => toggleGroup(group.title)}
              >
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="group/label cursor-pointer flex items-center justify-between hover:bg-muted/50 rounded px-2">
                    <div className="flex items-center gap-2">
                      {group.icon && <group.icon className="h-4 w-4" />}
                      <span>{group.title}</span>
                      {group.isPro && (
                        <div className="ml-1 px-1.5 py-0.5 text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-md font-medium">
                          PRO
                        </div>
                      )}
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/label:rotate-180" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink 
                              to={item.url} 
                              className={getNavClassName(isActive(item.url))}
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            )}
            
            {/* Collapsed view - show only icons */}
            {state === "collapsed" && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          className={getNavClassName(isActive(item.url))}
                          title={item.title}
                        >
                          <item.icon className="h-4 w-4" />
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        ))}

        {/* Quick Stats in Sidebar */}
        {state !== "collapsed" && (
          <div className="mt-auto p-4 border-t">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Produits actifs</span>
                <span className="font-medium">1,247</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">CA ce mois</span>
                <span className="font-medium text-green-600">€45,231</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Commandes/jour</span>
                <span className="font-medium">89</span>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
