import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Megaphone,
  Settings,
  Bell,
  Search,
  Plus,
  Puzzle,
  Store,
  Terminal,
  Palette,
  Shield
} from 'lucide-react';
import { usePlan } from '@/contexts/PlanContext';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  proOnly?: boolean;
  ultraProOnly?: boolean;
}

const navigationItems: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard
  },
  {
    href: '/orders',
    label: 'Commandes',
    icon: ShoppingCart,
    badge: '3'
  },
  {
    href: '/customers',
    label: 'Clients',
    icon: Users
  },
  {
    href: '/products',
    label: 'Produits',
    icon: Package
  },
  {
    href: '/marketing',
    label: 'Marketing',
    icon: Megaphone,
    proOnly: true
  }
];

const extensionItems: NavItem[] = [
  {
    href: '/extensions',
    label: 'Hub Extensions',
    icon: Puzzle
  },
  {
    href: '/extensions/marketplace',
    label: 'Marketplace',
    icon: Store
  },
  {
    href: '/extensions/cli',
    label: 'Outils CLI',
    icon: Terminal,
    proOnly: true
  },
  {
    href: '/extensions/white-label',
    label: 'White-Label',
    icon: Palette,
    ultraProOnly: true
  },
  {
    href: '/extensions/sso',
    label: 'Enterprise SSO',
    icon: Shield,
    ultraProOnly: true
  }
];

export function AppNavigation() {
  const location = useLocation();
  const { isPro, isUltraPro } = usePlan();

  const canAccessItem = (item: NavItem) => {
    if (item.ultraProOnly && !isUltraPro) return false;
    if (item.proOnly && !isPro) return false;
    return true;
  };

  const renderNavItems = (items: NavItem[], title?: string) => (
    <div className="space-y-1">
      {title && (
        <p className="text-xs font-medium text-muted-foreground px-3 mb-2">
          {title}
        </p>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href || 
          (item.href === '/extensions' && location.pathname.startsWith('/extensions'));
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
            <Icon className="h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            
            {item.badge && canAccess && (
              <Badge variant="secondary" className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                {item.badge}
              </Badge>
            )}
            
            {(item.proOnly || item.ultraProOnly) && !canAccess && (
              <Badge variant="outline" className="ml-auto text-xs">
                {item.ultraProOnly ? 'Ultra Pro' : 'Pro'}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <nav className="flex flex-col space-y-4">
      {renderNavItems(navigationItems)}
      {renderNavItems(extensionItems, "Extensions")}
    </nav>
  );
}

export function QuickActions() {
  const { isPro } = usePlan();

  const actions = [
    {
      label: 'Nouvelle commande',
      href: '/orders/new',
      icon: Plus
    },
    {
      label: 'Ajouter produit', 
      href: '/products/new',
      icon: Package
    },
    {
      label: 'Nouveau client',
      href: '/customers/new', 
      icon: Users
    }
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground px-3">Actions rapides</p>
      {actions.map((action) => {
        const Icon = action.icon;
        
        return (
          <Link key={action.href} to={action.href}>
            <Button variant="ghost" className="w-full justify-start gap-3 h-9">
              <Icon className="h-4 w-4" />
              <span className="text-sm">{action.label}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );
}