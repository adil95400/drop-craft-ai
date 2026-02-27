import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  Sparkles,
  Bell,
  Search,
  Menu,
  Megaphone,
  Truck,
  Brain,
  Plug,
  GraduationCap,
  HelpCircle,
  Crown,
  Upload,
  Zap,
  Boxes,
  Store,
  CreditCard,
  LifeBuoy,
  ChevronDown,
  Bot,
  X,
  Lock,
  Rss,
  Trophy,
  Star,
  CheckCircle,
  Calculator,
  Globe,
  TrendingUp,
  Tag,
  Workflow,
  Shield,
  LayoutDashboard,
  AlertCircle,
  Layers,
  Image,
  FolderTree,
  HeartPulse,
  DollarSign,
  Eye,
  Puzzle,
  FileText,
  Clock
} from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { NAV_GROUPS, MODULE_REGISTRY, type ModuleConfig, type NavGroupId } from '@/config/modules';

// Map des icônes - enrichie pour tous les modules
const iconMap: Record<string, React.ComponentType<any>> = {
  'Home': Home,
  'BarChart3': BarChart3,
  'Package': Package,
  'Truck': Truck,
  'Upload': Upload,
  'ShoppingCart': ShoppingCart,
  'Users': Users,
  'Megaphone': Megaphone,
  'Bot': Bot,
  'Brain': Brain,
  'Zap': Zap,
  'Boxes': Boxes,
  'Store': Store,
  'CreditCard': CreditCard,
  'Settings': Settings,
  'LifeBuoy': LifeBuoy,
  'Plug': Plug,
  'GraduationCap': GraduationCap,
  'HelpCircle': HelpCircle,
  'Crown': Crown,
  'Trophy': Trophy,
  'Star': Star,
  'CheckCircle': CheckCircle,
  'Calculator': Calculator,
  'Globe': Globe,
  'TrendingUp': TrendingUp,
  'Tag': Tag,
  'Workflow': Workflow,
  'Rss': Rss,
  'Search': Search,
  'Shield': Shield,
  'Sparkles': Sparkles,
  'LayoutDashboard': LayoutDashboard,
  'Bell': Bell,
  'AlertCircle': AlertCircle,
  'Layers': Layers,
  'Image': Image,
  'FolderTree': FolderTree,
  'HeartPulse': HeartPulse,
  'DollarSign': DollarSign,
  'Eye': Eye,
  'Puzzle': Puzzle,
  'FileText': FileText,
  'Clock': Clock,
};

interface MobileNavProps {
  notifications?: number;
}

/**
 * Génère les groupes de navigation mobile à partir de NAV_GROUPS et MODULE_REGISTRY
 * Architecture alignée avec les 6 pôles de navigation
 */
function useMobileNavGroups() {
  return useMemo(() => {
    // Grouper les modules par groupId
    const modulesByGroup: Record<NavGroupId, ModuleConfig[]> = {
      dashboard: [],
      catalog: [],
      orders: [],
      customers: [],
      marketing: [],
      automation: [],
      integrations: [],
      reports: [],
      settings: [],
      help: [],
    };

    // Remplir les groupes avec les modules
    Object.values(MODULE_REGISTRY).forEach(module => {
      if (module.enabled && modulesByGroup[module.groupId]) {
        modulesByGroup[module.groupId].push(module);
      }
    });

    // Trier les modules par order dans chaque groupe
    Object.keys(modulesByGroup).forEach(groupId => {
      modulesByGroup[groupId as NavGroupId].sort((a, b) => a.order - b.order);
    });

    // Construire la structure de navigation
    return NAV_GROUPS.map(group => ({
      id: group.id,
      label: group.label,
      icon: group.icon,
      items: modulesByGroup[group.id].map(module => ({
        id: module.id,
        name: module.name,
        route: module.route,
        icon: module.icon,
        minPlan: module.minPlan,
        badge: module.badge,
        comingSoon: module.comingSoon,
      }))
    })).filter(group => group.items.length > 0);
  }, []);
}

export function MobileNav({ notifications = 0 }: MobileNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['home', 'catalog']);
  const { effectivePlan, hasPlan } = useUnifiedPlan();
  
  // Utiliser la configuration dynamique
  const mobileNavGroups = useMobileNavGroups();

  const bottomNavItems = [
    { icon: Home, label: 'Accueil', path: '/dashboard', color: 'text-blue-500' },
    { icon: Package, label: 'Catalogue', path: '/products', color: 'text-green-500' },
    { icon: ShoppingCart, label: 'Ventes', path: '/orders', color: 'text-orange-500' },
    { icon: BarChart3, label: 'Performance', path: '/analytics', color: 'text-purple-500' }
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => 
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    );
  };

  const canAccessPlan = (minPlan: string): boolean => {
    if (minPlan === 'standard') return true;
    if (minPlan === 'pro') return hasPlan('pro') || hasPlan('ultra_pro');
    if (minPlan === 'ultra_pro') return hasPlan('ultra_pro');
    return true;
  };

  const handleNavigate = (path: string, minPlan: string, comingSoon?: boolean) => {
    if (comingSoon) return; // Ne pas naviguer vers les modules coming soon
    if (canAccessPlan(minPlan)) {
      navigate(path);
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Bottom Navigation Bar - Toujours visible sur mobile */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t shadow-lg z-[80]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-5 h-16">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 transition-all duration-200",
                  active 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                )}
              >
                <div className="relative">
                  <Icon className={cn("h-5 w-5", active && item.color)} />
                  {item.label === 'Accueil' && notifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
                    >
                      {notifications > 9 ? '9+' : notifications}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Menu Button - Ouvre le Sheet */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 transition-all duration-200",
                  sidebarOpen 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                )}
                aria-label="Menu principal"
              >
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-medium">Menu</span>
              </button>
            </SheetTrigger>
            
            {/* Full Sidebar Sheet */}
            <SheetContent 
              side="left" 
              className="w-[85vw] max-w-[320px] p-0 bg-background border-r"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b bg-gradient-to-br from-primary/5 to-background">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <ShoppingCart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h1 className="font-bold text-lg bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">ShopOpti+</h1>
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-primary" />
                          <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">Premium Platform</span>
                          <span className="text-xs text-muted-foreground capitalize">{effectivePlan || 'Standard'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThemeToggle collapsed={true} variant="ghost" />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setSidebarOpen(false)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Navigation Groups - Dynamique depuis NAV_GROUPS */}
                <ScrollArea className="flex-1 py-2">
                  <div className="px-2 space-y-1">
                    {mobileNavGroups.map(group => {
                      const GroupIcon = iconMap[group.icon] || Settings;
                      const isGroupOpen = openGroups.includes(group.id);
                      const hasActiveItem = group.items.some(item => isActive(item.route));

                      return (
                        <Collapsible 
                          key={group.id} 
                          open={isGroupOpen || hasActiveItem} 
                          onOpenChange={() => toggleGroup(group.id)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className={cn(
                              "flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all",
                              "hover:bg-accent active:scale-[0.98]",
                              (isGroupOpen || hasActiveItem) && "bg-accent/50"
                            )}>
                              <div className="flex items-center gap-3">
                                <GroupIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{group.label}</span>
                              </div>
                              <ChevronDown className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                (isGroupOpen || hasActiveItem) && "rotate-180"
                              )} />
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <div className="pl-4 pr-2 py-1 space-y-0.5">
                              {group.items.map(item => {
                                const ItemIcon = iconMap[item.icon] || Settings;
                                const active = isActive(item.route);
                                const hasAccess = canAccessPlan(item.minPlan);
                                const isComingSoon = item.comingSoon;

                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => handleNavigate(item.route, item.minPlan, isComingSoon)}
                                    disabled={!hasAccess || isComingSoon}
                                    className={cn(
                                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                                      active 
                                        ? "bg-primary text-primary-foreground shadow-md" 
                                        : hasAccess && !isComingSoon
                                          ? "hover:bg-accent active:scale-[0.98]"
                                          : "opacity-40 cursor-not-allowed"
                                    )}
                                  >
                                    <ItemIcon className={cn(
                                      "h-4 w-4 flex-shrink-0",
                                      active ? "text-primary-foreground" : "text-muted-foreground"
                                    )} />
                                    <div className="flex-1 min-w-0">
                                      <span className={cn(
                                        "text-sm font-medium block truncate",
                                        active && "text-primary-foreground"
                                      )}>
                                        {item.name}
                                      </span>
                                    </div>
                                    
                                    {/* Badges */}
                                    {isComingSoon && (
                                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-muted/50">
                                        Bientôt
                                      </Badge>
                                    )}
                                    {!isComingSoon && item.badge && (
                                      <Badge 
                                        variant={item.badge === 'new' ? 'default' : 'secondary'} 
                                        className="text-[9px] px-1.5 py-0"
                                      >
                                        {item.badge.toUpperCase()}
                                      </Badge>
                                    )}
                                    {!hasAccess && !isComingSoon && (
                                      <div className="flex items-center gap-1">
                                        <Lock className="h-3 w-3 text-muted-foreground" />
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                          {item.minPlan === 'pro' ? 'PRO' : 'ULTRA'}
                                        </Badge>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Footer */}
                <div className="p-3 border-t bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">© 2024 ShopOpti</span>
                    <Badge variant="outline" className="text-[10px]">
                      <Crown className="h-3 w-3 mr-1" />
                      {effectivePlan || 'Standard'}
                    </Badge>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}

export function MobileHeader() {
  const navigate = useNavigate();
  
  return (
    <header 
      className="bg-background/95 backdrop-blur-lg border-b sticky top-0 z-[70]"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <ShoppingCart className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">ShopOpti+</h1>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Premium</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9"
            onClick={() => navigate('/search')}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 relative"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export default MobileNav;
