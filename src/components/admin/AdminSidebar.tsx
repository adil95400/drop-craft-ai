import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Package,
  BookOpen,
  ShoppingCart,
  Upload,
  Users2,
  LineChart,
  Monitor,
  Users,
  MessageSquare,
  Megaphone,
  FileText,
  Search,
  Puzzle,
  Bot,
  Palette,
  Zap,
  TrendingUp,
  Workflow,
  Shield,
  Settings,
  ChevronLeft,
  Crown,
  Trophy,
  Sparkles,
  Truck,
  Globe,
  Database,
  GraduationCap,
  Brain,
  Building2,
  Plug,
  Activity,
  type LucideIcon
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { MODULE_REGISTRY, type ModuleConfig } from '@/config/modules';
import { getAllCategories, type ModuleCategory } from '@/config/module-categories';
import { useUnifiedModules } from '@/hooks/useUnifiedModules';

// Map des icônes pour la résolution dynamique
const iconMap: Record<string, LucideIcon> = {
  BarChart3: LayoutDashboard,
  Package: Package,
  Upload: Upload,
  Trophy: Trophy,
  Sparkles: Sparkles,
  Truck: Truck,
  ShoppingBag: Package,
  Store: Store,
  Globe: Globe,
  Crown: Crown,
  Database: Database,
  GraduationCap: GraduationCap,
  TrendingUp: TrendingUp,
  Zap: Zap,
  PuzzlePiece: Puzzle,
  Users: Users,
  Search: Search,
  Brain: Brain,
  ShoppingCart: ShoppingCart,
  Building2: Building2,
  Settings: Settings,
  Shield: Shield,
  Plug: Plug,
  Activity: Activity,
};

export function AdminSidebar() {
  const { open: sidebarOpen } = useSidebar();
  const location = useLocation();
  const { profile, effectivePlan } = useUnifiedAuth();
  const { canAccess, plan } = useUnifiedModules();
  const currentPath = location.pathname;
  const collapsed = !sidebarOpen;

  // Obtenir tous les modules organisés par catégorie
  const categories = getAllCategories();
  const modulesByCategory = categories.map(category => ({
    category,
    modules: Object.values(MODULE_REGISTRY)
      .filter(module => module.category === category.id && module.enabled)
      .sort((a, b) => a.order - b.order)
  })).filter(group => group.modules.length > 0);

  const isActive = (path: string) => {
    if (path === '/admin') return currentPath === '/admin';
    return currentPath === path || currentPath.startsWith(path + '/');
  };
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? 'bg-primary text-primary-foreground font-medium shadow-sm' 
      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground';

  const getPlanBadge = (minPlan: string) => {
    if (minPlan === 'ultra_pro') return { text: 'ULTRA', variant: 'destructive' as const };
    if (minPlan === 'pro') return { text: 'PRO', variant: 'default' as const };
    return null;
  };

  const renderModuleItem = (module: ModuleConfig) => {
    const Icon = iconMap[module.icon] || Settings;
    const hasAccess = canAccess(module.id);
    const badge = getPlanBadge(module.minPlan);

    return (
      <SidebarMenuItem key={module.id}>
        <SidebarMenuButton asChild className="h-10">
          <NavLink 
            to={module.route}
            end={module.route === '/dashboard'}
            className={({ isActive: navIsActive }) => `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${getNavCls({ isActive: navIsActive || isActive(module.route) })} ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={(e) => {
              if (!hasAccess) {
                e.preventDefault();
              }
            }}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <div className="flex items-center justify-between w-full">
                <span className="truncate">{module.name}</span>
                {badge && !hasAccess && (
                  <Badge variant={badge.variant} className="text-xs h-5">
                    {badge.text}
                  </Badge>
                )}
              </div>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderMenuGroup = (category: ModuleCategory, modules: ModuleConfig[]) => (
    <SidebarGroup key={category.id}>
      <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
        {!collapsed && category.name}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {modules.map(module => renderModuleItem(module))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar
      className={`border-r transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}
      collapsible="icon"
    >
      <div className="flex h-full flex-col">
        {/* Header avec profil utilisateur */}
        {!collapsed && (
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-semibold text-sm truncate">
                  {profile?.full_name || 'Admin'}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Badge variant="outline" className="h-4 text-xs">
                    {effectivePlan}
                  </Badge>
                  {profile?.admin_mode && (
                    <Badge variant="destructive" className="h-4 text-xs">
                      {profile.admin_mode}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toggle button */}
        <div className="flex justify-end p-2">
          <SidebarTrigger className="h-8 w-8 hover:bg-muted/50 rounded-md" />
        </div>

        <SidebarContent className="flex-1 overflow-auto">
          {modulesByCategory.map(({ category, modules }) => 
            renderMenuGroup(category, modules)
          )}
        </SidebarContent>
      </div>
    </Sidebar>
  );
}