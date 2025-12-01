import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
  X
} from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NAV_GROUPS, MODULE_REGISTRY, type NavGroupId } from '@/config/modules';
import { useModules } from '@/hooks/useModules';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

// Map des icônes
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
};

interface MobileNavProps {
  notifications?: number;
}

export function MobileNav({ notifications = 0 }: MobileNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<NavGroupId[]>(['overview', 'products']);
  
  const { availableModules, canAccess, isModuleEnabled } = useModules();

  const navItems = [
    { icon: Home, label: 'Accueil', path: '/dashboard', color: 'text-blue-500' },
    { icon: Package, label: 'Produits', path: '/products', color: 'text-green-500' },
    { icon: ShoppingCart, label: 'Commandes', path: '/orders', color: 'text-orange-500' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics', color: 'text-purple-500' }
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const toggleGroup = (groupId: NavGroupId) => {
    setOpenGroups(prev => 
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    );
  };

  // Grouper les modules par NavGroup
  const modulesByGroup = React.useMemo(() => {
    const grouped: Record<NavGroupId, typeof availableModules> = {} as any;
    
    availableModules.forEach(module => {
      if (!module.groupId || !isModuleEnabled(module.id)) return;
      if (!grouped[module.groupId]) {
        grouped[module.groupId] = [];
      }
      grouped[module.groupId].push(module);
    });

    // Trier les modules dans chaque groupe
    Object.values(grouped).forEach(modules => {
      modules.sort((a, b) => a.order - b.order);
    });

    return grouped;
  }, [availableModules, isModuleEnabled]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t z-50 pb-safe">
        <div className="grid grid-cols-5 h-14 sm:h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center space-y-0.5 sm:space-y-1 transition-all duration-200",
                  active 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                )}
              >
                <div className="relative">
                  <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", active && item.color)} />
                  {item.label === 'Accueil' && notifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 p-0 text-[10px] flex items-center justify-center"
                    >
                      {notifications > 9 ? '9+' : notifications}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Menu Button */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center space-y-0.5 sm:space-y-1 transition-all duration-200",
                  sidebarOpen 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                )}
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs font-medium">Menu</span>
              </button>
            </SheetTrigger>
            
            {/* Full Sidebar Sheet */}
            <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b bg-gradient-to-br from-background via-muted/20 to-background">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <ShoppingCart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h1 className="font-bold text-lg">ShopOpti</h1>
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-primary" />
                          <span className="text-xs text-muted-foreground">Pro Platform</span>
                        </div>
                      </div>
                    </div>
                    <ThemeToggle collapsed={true} variant="ghost" />
                  </div>
                </div>

                {/* Navigation Groups */}
                <ScrollArea className="flex-1 py-2">
                  <div className="px-2 space-y-1">
                    {NAV_GROUPS.map(navGroup => {
                      const groupModules = modulesByGroup[navGroup.id] || [];
                      if (groupModules.length === 0) return null;

                      const GroupIcon = iconMap[navGroup.icon] || Settings;
                      const isGroupOpen = openGroups.includes(navGroup.id);

                      return (
                        <Collapsible 
                          key={navGroup.id} 
                          open={isGroupOpen} 
                          onOpenChange={() => toggleGroup(navGroup.id)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className={cn(
                              "flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all",
                              "hover:bg-accent/80 active:scale-[0.98]",
                              isGroupOpen && "bg-accent/50"
                            )}>
                              <div className="flex items-center gap-3">
                                <GroupIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{navGroup.label}</span>
                              </div>
                              <ChevronDown className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                isGroupOpen && "rotate-180"
                              )} />
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <div className="pl-4 pr-2 py-1 space-y-0.5">
                              {groupModules.map(module => {
                                const ModuleIcon = iconMap[module.icon] || Settings;
                                const active = isActive(module.route);
                                const hasAccess = canAccess(module.id);

                                return (
                                  <button
                                    key={module.id}
                                    onClick={() => hasAccess && handleNavigate(module.route)}
                                    disabled={!hasAccess}
                                    className={cn(
                                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                                      active 
                                        ? "bg-primary text-primary-foreground shadow-md" 
                                        : hasAccess
                                          ? "hover:bg-accent/60 active:scale-[0.98]"
                                          : "opacity-50 cursor-not-allowed"
                                    )}
                                  >
                                    <ModuleIcon className={cn(
                                      "h-4 w-4 flex-shrink-0",
                                      active ? "text-primary-foreground" : "text-muted-foreground"
                                    )} />
                                    <div className="flex-1 min-w-0">
                                      <span className={cn(
                                        "text-sm font-medium block truncate",
                                        active && "text-primary-foreground"
                                      )}>
                                        {module.name}
                                      </span>
                                    </div>
                                    {module.minPlan === 'pro' && !hasAccess && (
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                        PRO
                                      </Badge>
                                    )}
                                    {module.minPlan === 'ultra_pro' && !hasAccess && (
                                      <Badge className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-warning to-destructive text-white border-0">
                                        ULTRA
                                      </Badge>
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
                      Pro
                    </Badge>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}

export function MobileHeader() {
  return (
    <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-40 pt-safe">
      <div className="flex items-center justify-between p-3 sm:p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg">Shopopti+</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Dropshipping Intelligent</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="relative h-8 w-8 sm:h-9 sm:w-9">
            <Bell className="h-4 w-4" />
            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MobileQuickActions() {
  const quickActions = [
    { icon: Package, label: 'Importer', description: 'Nouveaux produits', color: 'bg-blue-500', path: '/import' },
    { icon: Sparkles, label: 'IA Insights', description: 'Recommandations', color: 'bg-purple-500', path: '/dashboard?tab=ai-insights' },
    { icon: BarChart3, label: 'Analytics', description: 'Temps réel', color: 'bg-green-500', path: '/dashboard?tab=analytics' },
    { icon: Users, label: 'Clients', description: 'Gestion', color: 'bg-orange-500', path: '/customers' }
  ];

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Actions rapides</h3>
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.path} to={action.path}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{action.label}</h4>
                      <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
