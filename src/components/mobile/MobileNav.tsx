import React, { useState } from 'react';
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
  Shield
} from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useUnifiedPlan } from '@/lib/unified-plan-system';

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
};

// Navigation groups simplifiée et toujours visible
const mobileNavGroups = [
  {
    id: 'overview',
    label: 'Vue d\'ensemble',
    icon: 'Home',
    items: [
      { id: 'dashboard', name: 'Dashboard', route: '/dashboard', icon: 'BarChart3', minPlan: 'standard' },
      { id: 'stores', name: 'Mes Boutiques', route: '/stores-channels', icon: 'Store', minPlan: 'standard' },
    ]
  },
  {
    id: 'products',
    label: 'Produits',
    icon: 'Package',
    items: [
      { id: 'products', name: 'Catalogue', route: '/products', icon: 'Package', minPlan: 'standard' },
      { id: 'winners', name: 'Winning Products', route: '/products/winners', icon: 'Trophy', minPlan: 'standard' },
      { id: 'audit', name: 'Audit Qualité', route: '/audit', icon: 'CheckCircle', minPlan: 'pro' },
      { id: 'marketplace', name: 'Marketplace IA', route: '/products/global-marketplace', icon: 'Sparkles', minPlan: 'standard' },
    ]
  },
  {
    id: 'suppliers',
    label: 'Fournisseurs',
    icon: 'Truck',
    items: [
      { id: 'suppliers', name: 'Fournisseurs', route: '/suppliers', icon: 'Truck', minPlan: 'standard' },
      { id: 'connectors', name: 'Connecteurs API', route: '/suppliers/connectors', icon: 'Plug', minPlan: 'standard' },
      { id: 'engine', name: 'Moteur Avancé', route: '/suppliers/engine', icon: 'Zap', minPlan: 'pro' },
      { id: 'premium-suppliers', name: 'Premium', route: '/suppliers/premium', icon: 'Crown', minPlan: 'pro' },
    ]
  },
  {
    id: 'import',
    label: 'Import & Flux',
    icon: 'Upload',
    items: [
      { id: 'import', name: 'Hub Import', route: '/import', icon: 'Upload', minPlan: 'standard' },
      { id: 'import-quick', name: 'Import Rapide', route: '/import/quick', icon: 'Zap', minPlan: 'standard' },
      { id: 'feeds', name: 'Feeds', route: '/feeds', icon: 'Rss', minPlan: 'pro' },
    ]
  },
  {
    id: 'orders',
    label: 'Commandes',
    icon: 'ShoppingCart',
    items: [
      { id: 'orders', name: 'Commandes', route: '/orders', icon: 'ShoppingCart', minPlan: 'standard' },
      { id: 'orders-center', name: 'Centre Commandes', route: '/orders-center', icon: 'BarChart3', minPlan: 'standard' },
      { id: 'fulfillment', name: 'Fulfillment', route: '/fulfillment', icon: 'Truck', minPlan: 'pro' },
    ]
  },
  {
    id: 'customers',
    label: 'Clients',
    icon: 'Users',
    items: [
      { id: 'customers', name: 'Clients', route: '/customers', icon: 'Users', minPlan: 'standard' },
      { id: 'reviews', name: 'Avis Clients', route: '/reviews', icon: 'Star', minPlan: 'standard' },
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: 'Megaphone',
    items: [
      { id: 'marketing', name: 'Marketing', route: '/marketing', icon: 'Megaphone', minPlan: 'standard' },
      { id: 'coupons', name: 'Coupons', route: '/coupons', icon: 'Tag', minPlan: 'standard' },
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'BarChart3',
    items: [
      { id: 'analytics', name: 'Analytics', route: '/analytics', icon: 'BarChart3', minPlan: 'standard' },
      { id: 'monitoring', name: 'Monitoring', route: '/monitoring', icon: 'TrendingUp', minPlan: 'pro' },
    ]
  },
  {
    id: 'ai',
    label: 'Intelligence IA',
    icon: 'Bot',
    items: [
      { id: 'ai-assistant', name: 'Assistant IA', route: '/ai-assistant', icon: 'Bot', minPlan: 'standard' },
      { id: 'ai-studio', name: 'Studio IA', route: '/ai-studio', icon: 'Brain', minPlan: 'pro' },
    ]
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: 'Zap',
    items: [
      { id: 'automation', name: 'Automations', route: '/automation', icon: 'Workflow', minPlan: 'standard' },
      { id: 'stock', name: 'Stock', route: '/stock', icon: 'Boxes', minPlan: 'standard' },
    ]
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: 'Settings',
    items: [
      { id: 'settings', name: 'Paramètres', route: '/settings', icon: 'Settings', minPlan: 'standard' },
      { id: 'integrations', name: 'Intégrations', route: '/integrations', icon: 'Plug', minPlan: 'standard' },
      { id: 'extensions', name: 'Extensions', route: '/extensions', icon: 'Plug', minPlan: 'pro' },
    ]
  },
  {
    id: 'support',
    label: 'Support',
    icon: 'LifeBuoy',
    items: [
      { id: 'support', name: 'Support', route: '/support', icon: 'LifeBuoy', minPlan: 'standard' },
      { id: 'academy', name: 'Academy', route: '/academy', icon: 'GraduationCap', minPlan: 'standard' },
    ]
  }
];

interface MobileNavProps {
  notifications?: number;
}

export function MobileNav({ notifications = 0 }: MobileNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['overview', 'products']);
  const { effectivePlan, hasPlan } = useUnifiedPlan();

  const bottomNavItems = [
    { icon: Home, label: 'Accueil', path: '/dashboard', color: 'text-blue-500' },
    { icon: Package, label: 'Produits', path: '/products', color: 'text-green-500' },
    { icon: ShoppingCart, label: 'Commandes', path: '/orders', color: 'text-orange-500' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics', color: 'text-purple-500' }
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

  const handleNavigate = (path: string, minPlan: string) => {
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
                        <h1 className="font-bold text-lg">ShopOpti</h1>
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-primary" />
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

                {/* Navigation Groups */}
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

                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => handleNavigate(item.route, item.minPlan)}
                                    disabled={!hasAccess}
                                    className={cn(
                                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                                      active 
                                        ? "bg-primary text-primary-foreground shadow-md" 
                                        : hasAccess
                                          ? "hover:bg-accent active:scale-[0.98]"
                                          : "opacity-50"
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
                                    {!hasAccess && (
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
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base">ShopOpti</h1>
            <p className="text-xs text-muted-foreground">Dropshipping Pro</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
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
            className="relative h-9 w-9"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="h-4 w-4" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></div>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function MobileQuickActions() {
  const quickActions = [
    { icon: Upload, label: 'Importer', description: 'Nouveaux produits', color: 'bg-blue-500', path: '/import' },
    { icon: Bot, label: 'IA Insights', description: 'Recommandations', color: 'bg-purple-500', path: '/ai-assistant' },
    { icon: BarChart3, label: 'Analytics', description: 'Temps réel', color: 'bg-green-500', path: '/analytics' },
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
              <div className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-card">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{action.label}</h4>
                    <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
