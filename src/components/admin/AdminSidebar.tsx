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
  Crown
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

const mainItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Boutiques', url: '/stores', icon: Store, badge: 'Stores' },
  { title: 'Produits', url: '/admin/products', icon: Package },
  { title: 'Catalogue', url: '/catalog', icon: BookOpen },
  { title: 'Commandes', url: '/admin/orders', icon: ShoppingCart },
  { title: 'Import', url: '/admin/import', icon: Upload },
  { title: 'Fournisseurs', url: '/admin/suppliers', icon: Users2 },
];

const analyticsItems = [
  { title: 'Analytics', url: '/admin/analytics', icon: LineChart },
  { title: 'Monitoring', url: '/monitoring', icon: Monitor },
];

const crmItems = [
  { title: 'Clients', url: '/admin/customers', icon: Users },
  { title: 'CRM', url: '/admin/crm', icon: MessageSquare },
];

const marketingItems = [
  { title: 'Marketing', url: '/admin/marketing', icon: Megaphone },
  { title: 'Blog', url: '/admin/blog', icon: FileText },
  { title: 'SEO', url: '/admin/seo', icon: Search },
];

const toolsItems = [
  { title: 'Extensions', url: '/extensions', icon: Puzzle, badge: 'Nouveau' },
  { title: 'IA Assistant', url: '/admin/ai', icon: Bot, badge: 'AI' },
  { title: 'AI Studio', url: '/ai-studio', icon: Palette, badge: 'Studio' },
  { title: 'Automation Studio', url: '/automation-studio', icon: Zap, badge: 'Studio' },
  { title: 'Analytics Studio', url: '/analytics-studio', icon: TrendingUp, badge: 'Studio' },
];

const adminItems = [
  { title: 'Automation', url: '/admin/automation', icon: Workflow },
  { title: 'Sécurité', url: '/admin/security', icon: Shield, badge: 'Admin' },
  { title: 'Intégrations', url: '/admin/integrations', icon: Settings },
  { title: 'Abonnements', url: '/admin/subscriptions', icon: Crown, badge: 'Admin' },
];

export function AdminSidebar() {
  const { open: sidebarOpen } = useSidebar();
  const location = useLocation();
  const { profile, effectivePlan } = useUnifiedAuth();
  const currentPath = location.pathname;
  const collapsed = !sidebarOpen;

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary/10 text-primary font-medium border-r-2 border-primary' : 'hover:bg-muted/50';

  const renderMenuGroup = (items: typeof mainItems, groupLabel: string) => (
    <SidebarGroup key={groupLabel}>
      <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
        {!collapsed && groupLabel}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="h-10">
                <NavLink 
                  to={item.url} 
                  end={item.url === '/dashboard'}
                  className={getNavCls}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">{item.title}</span>
                      {item.badge && (
                        <Badge 
                          variant={item.badge === 'Admin' ? 'destructive' : 'secondary'} 
                          className="text-xs h-5"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
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
          {renderMenuGroup(mainItems, 'Principal')}
          {renderMenuGroup(analyticsItems, 'Analytics')}
          {renderMenuGroup(crmItems, 'Relations Client')}
          {renderMenuGroup(marketingItems, 'Marketing')}
          {renderMenuGroup(toolsItems, 'Outils IA')}
          {renderMenuGroup(adminItems, 'Administration')}
        </SidebarContent>
      </div>
    </Sidebar>
  );
}