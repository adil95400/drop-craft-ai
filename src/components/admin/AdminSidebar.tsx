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
  Video,
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
  Video: Video,
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

  // Détecter le groupe actif pour le garder ouvert
  const activeCategory = modulesByCategory.find(({ modules }) =>
    modules.some(m => isActive(m.route))
  )?.category.id;

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
    const active = isActive(module.route);

    return (
      <SidebarMenuItem key={module.id}>
        <SidebarMenuButton asChild className="h-9">
          <NavLink 
            to={module.route}
            end={module.route === '/admin'}
            className={({ isActive: navIsActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
              ${getNavCls({ isActive: navIsActive || active })} 
              ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}
              ${collapsed ? 'justify-center' : ''}
            `}
            onClick={(e) => {
              if (!hasAccess) {
                e.preventDefault();
              }
            }}
            title={collapsed ? module.name : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <div className="flex items-center justify-between w-full min-w-0">
                <span className="truncate text-sm">{module.name}</span>
                {badge && !hasAccess && (
                  <Badge variant={badge.variant} className="text-[10px] h-4 px-1 shrink-0 ml-2">
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

  const renderMenuGroup = (category: ModuleCategory, modules: ModuleConfig[]) => {
    const isGroupActive = category.id === activeCategory;
    
    return (
      <SidebarGroup 
        key={category.id}
        className="transition-all"
      >
        <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-muted-foreground px-2">
          {!collapsed && category.name}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="space-y-1">
            {modules.map(module => renderModuleItem(module))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar
      className={`border-r transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}
      collapsible="icon"
    >
      <div className="flex h-full flex-col">
        {/* Header avec profil utilisateur - responsive */}
        <div className="border-b p-4">
          {collapsed ? (
            <div className="flex justify-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-primary" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-semibold text-sm truncate">
                  {profile?.full_name || 'Admin'}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
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
          )}
        </div>

        {/* Navigation content */}
        <SidebarContent className="flex-1 overflow-auto py-2">
          {modulesByCategory.map(({ category, modules }) => 
            renderMenuGroup(category, modules)
          )}
        </SidebarContent>

        {/* Footer hint en mode collapsed */}
        {collapsed && (
          <div className="border-t p-2 flex justify-center">
            <div className="text-xs text-muted-foreground">
              <Settings className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}