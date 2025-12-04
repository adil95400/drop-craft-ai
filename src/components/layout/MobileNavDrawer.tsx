import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePlan } from '@/hooks/usePlan';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Megaphone,
  TrendingUp,
  Settings,
  Truck,
  Store,
  Globe,
  Zap,
  Bot,
  FileText,
  CreditCard,
  HelpCircle,
  Import,
  Boxes,
  BarChart3,
  Workflow,
  Puzzle,
  Shield,
  Palette,
  Terminal,
  Crown,
  Lock,
} from 'lucide-react';

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  proOnly?: boolean;
  ultraProOnly?: boolean;
}

const navGroups: NavGroup[] = [
  {
    id: 'overview',
    label: 'Vue d\'ensemble',
    icon: LayoutDashboard,
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    ]
  },
  {
    id: 'products',
    label: 'Produits',
    icon: Package,
    items: [
      { href: '/products', label: 'Catalogue', icon: Package },
      { href: '/products/import', label: 'Importer', icon: Import },
      { href: '/products/rules', label: 'Règles', icon: FileText, proOnly: true },
      { href: '/products/audit', label: 'Audit qualité', icon: Shield, proOnly: true },
    ]
  },
  {
    id: 'suppliers',
    label: 'Fournisseurs',
    icon: Truck,
    items: [
      { href: '/suppliers', label: 'Hub Fournisseurs', icon: Truck },
      { href: '/suppliers/marketplace', label: 'Marketplace', icon: Store },
      { href: '/suppliers/my', label: 'Mes Fournisseurs', icon: Boxes },
    ]
  },
  {
    id: 'orders',
    label: 'Commandes',
    icon: ShoppingCart,
    items: [
      { href: '/orders', label: 'Toutes les commandes', icon: ShoppingCart },
      { href: '/orders/fulfillment', label: 'Fulfillment', icon: Truck, proOnly: true },
    ]
  },
  {
    id: 'customers',
    label: 'Clients',
    icon: Users,
    items: [
      { href: '/customers', label: 'Liste clients', icon: Users },
      { href: '/customers/segments', label: 'Segments', icon: TrendingUp, proOnly: true },
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    items: [
      { href: '/marketing', label: 'Campagnes', icon: Megaphone, proOnly: true },
      { href: '/marketing/seo', label: 'SEO Manager', icon: Globe, proOnly: true },
      { href: '/marketing/email', label: 'Email Marketing', icon: FileText, proOnly: true },
    ]
  },
  {
    id: 'channels',
    label: 'Canaux de vente',
    icon: Globe,
    items: [
      { href: '/stores', label: 'Boutiques', icon: Store },
      { href: '/feeds', label: 'Feeds Marketplace', icon: Globe, proOnly: true },
      { href: '/integrations', label: 'Intégrations', icon: Puzzle },
    ]
  },
  {
    id: 'automation',
    label: 'Automatisation',
    icon: Zap,
    items: [
      { href: '/automation', label: 'Workflows', icon: Workflow, proOnly: true },
      { href: '/automation/rules', label: 'Règles auto', icon: Zap, proOnly: true },
      { href: '/ai', label: 'IA Assistant', icon: Bot, ultraProOnly: true },
    ]
  },
  {
    id: 'extensions',
    label: 'Extensions',
    icon: Puzzle,
    items: [
      { href: '/extensions', label: 'Hub Extensions', icon: Puzzle },
      { href: '/extensions/marketplace', label: 'Marketplace', icon: Store },
      { href: '/extensions/cli', label: 'Outils CLI', icon: Terminal, proOnly: true },
      { href: '/extensions/white-label', label: 'White-Label', icon: Palette, ultraProOnly: true },
    ]
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: Settings,
    items: [
      { href: '/settings', label: 'Paramètres', icon: Settings },
      { href: '/billing', label: 'Facturation', icon: CreditCard },
      { href: '/help', label: 'Aide', icon: HelpCircle },
    ]
  },
];

interface MobileNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNavDrawer({ open, onOpenChange }: MobileNavDrawerProps) {
  const location = useLocation();
  const { isPro, isUltraPro } = usePlan();

  const canAccessItem = (item: NavItem) => {
    if (item.ultraProOnly && !isUltraPro) return false;
    if (item.proOnly && !isPro && !isUltraPro) return false;
    return true;
  };

  const handleNavClick = (canAccess: boolean) => {
    if (canAccess) {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <img src="/images/logo.svg" alt="ShopOpti" className="h-6 w-6" />
            <span>ShopOpti</span>
            {isUltraPro && <Crown className="h-4 w-4 text-yellow-500" />}
            {isPro && !isUltraPro && <Zap className="h-4 w-4 text-blue-500" />}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-2 space-y-4">
            {navGroups.map((group) => {
              const GroupIcon = group.icon;
              
              return (
                <div key={group.id} className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <GroupIcon className="h-3.5 w-3.5" />
                    {group.label}
                  </div>
                  
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href ||
                      (item.href !== '/' && location.pathname.startsWith(item.href));
                    const canAccess = canAccessItem(item);

                    return (
                      <Link
                        key={item.href}
                        to={canAccess ? item.href : '#'}
                        onClick={(e) => {
                          if (!canAccess) {
                            e.preventDefault();
                          } else {
                            handleNavClick(canAccess);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all touch-target",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-muted/50",
                          !canAccess && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        
                        {item.badge && canAccess && (
                          <Badge variant="secondary" className="h-5 min-w-[20px] flex items-center justify-center text-xs">
                            {item.badge}
                          </Badge>
                        )}
                        
                        {!canAccess && (
                          <div className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {item.ultraProOnly ? 'Ultra' : 'Pro'}
                            </Badge>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
