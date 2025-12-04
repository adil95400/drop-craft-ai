import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Megaphone,
  Settings,
  Plus,
  Puzzle,
  Store,
  Terminal,
  Palette,
  Shield,
  Truck,
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
  Lock,
  Crown,
  TrendingUp,
} from 'lucide-react';
import { usePlan } from '@/hooks/usePlan';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  proOnly?: boolean;
  ultraProOnly?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: 'main',
    label: 'Principal',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    ]
  },
  {
    id: 'commerce',
    label: 'Commerce',
    items: [
      { href: '/products', label: 'Produits', icon: Package },
      { href: '/orders', label: 'Commandes', icon: ShoppingCart, badge: '3' },
      { href: '/customers', label: 'Clients', icon: Users },
    ]
  },
  {
    id: 'sourcing',
    label: 'Sourcing',
    items: [
      { href: '/suppliers', label: 'Fournisseurs', icon: Truck },
      { href: '/products/import', label: 'Import', icon: Import },
    ]
  },
  {
    id: 'channels',
    label: 'Canaux',
    items: [
      { href: '/stores', label: 'Boutiques', icon: Store },
      { href: '/feeds', label: 'Feeds', icon: Globe, proOnly: true },
      { href: '/integrations', label: 'Intégrations', icon: Puzzle },
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [
      { href: '/marketing', label: 'Campagnes', icon: Megaphone, proOnly: true },
      { href: '/marketing/seo', label: 'SEO', icon: TrendingUp, proOnly: true },
    ]
  },
  {
    id: 'automation',
    label: 'Automatisation',
    items: [
      { href: '/automation', label: 'Workflows', icon: Workflow, proOnly: true },
      { href: '/ai', label: 'IA', icon: Bot, ultraProOnly: true },
    ]
  },
  {
    id: 'extensions',
    label: 'Extensions',
    items: [
      { href: '/extensions', label: 'Hub', icon: Puzzle },
      { href: '/extensions/marketplace', label: 'Marketplace', icon: Store },
      { href: '/extensions/white-label', label: 'White-Label', icon: Palette, ultraProOnly: true },
    ]
  },
];

export function AppNavigation() {
  const location = useLocation();
  const { isPro, isUltraPro } = usePlan();

  const canAccessItem = (item: NavItem) => {
    if (item.ultraProOnly && !isUltraPro) return false;
    if (item.proOnly && !isPro && !isUltraPro) return false;
    return true;
  };

  return (
    <ScrollArea className="h-full">
      <nav className="flex flex-col space-y-4 py-2">
        {navGroups.map((group) => (
          <div key={group.id} className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground px-3 mb-1 uppercase tracking-wider">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || 
                (item.href !== '/' && location.pathname.startsWith(item.href));
              const canAccess = canAccessItem(item);

              return (
                <Link
                  key={item.href}
                  to={canAccess ? item.href : '#'}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted/50",
                    !canAccess && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={(e) => {
                    if (!canAccess) {
                      e.preventDefault();
                    }
                  }}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  
                  {item.badge && canAccess && (
                    <Badge variant="secondary" className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  
                  {!canAccess && (
                    <Lock className="h-3 w-3 ml-auto flex-shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </ScrollArea>
  );
}

export function QuickActions() {
  const { isPro } = usePlan();

  const actions = [
    { label: 'Nouvelle commande', href: '/orders/new', icon: ShoppingCart },
    { label: 'Ajouter produit', href: '/products/new', icon: Package },
    { label: 'Nouveau client', href: '/customers/new', icon: Users },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground px-3">Actions rapides</p>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.href} to={action.href}>
            <Button variant="ghost" className="w-full justify-start gap-3 h-9 text-sm">
              <Icon className="h-4 w-4" />
              <span className="truncate">{action.label}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );
}
