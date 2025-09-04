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
  Plus,
  FileDown,
  Upload
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
    href: '/dashboard',
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
    href: '/import',
    label: 'Imports',
    icon: Upload
  },
  {
    href: '/marketing',
    label: 'Marketing',
    icon: Megaphone,
    proOnly: true
  }
];

export function Sidebar() {
  const location = useLocation();
  const { isPro, isUltraPro } = usePlan();

  const canAccessItem = (item: NavItem) => {
    if (item.ultraProOnly && !isUltraPro) return false;
    if (item.proOnly && !isPro) return false;
    return true;
  };

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <img src="/images/logo.svg" alt="Logo" className="h-6 w-6" />
            <span>E-Commerce Pro</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-2">
          <nav className="grid items-start text-sm font-medium">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || 
                             (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              const canAccess = canAccessItem(item);

              return (
                <Link
                  key={item.href}
                  to={canAccess ? item.href : '#'}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
                    isActive 
                      ? "bg-primary text-primary-foreground font-medium" 
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
          </nav>
        </div>

        {/* Quick Actions */}
        <div className="mt-auto p-3 border-t">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-3">Actions rapides</p>
            <Button variant="ghost" className="w-full justify-start gap-3 h-9" asChild>
              <Link to="/orders">
                <Plus className="h-4 w-4" />
                <span className="text-sm">Nouvelle commande</span>
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-9" asChild>
              <Link to="/import">
                <FileDown className="h-4 w-4" />
                <span className="text-sm">Importer produits</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}