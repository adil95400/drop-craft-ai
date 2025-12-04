import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MoreHorizontal,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const bottomNavItems: NavItem[] = [
  { href: '/', label: 'Accueil', icon: LayoutDashboard },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/orders', label: 'Commandes', icon: ShoppingCart },
  { href: '/customers', label: 'Clients', icon: Users },
];

interface MobileBottomNavProps {
  onOpenDrawer: () => void;
}

export function MobileBottomNav({ onOpenDrawer }: MobileBottomNavProps) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-lg border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full px-2 py-1 transition-colors touch-target",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1", isActive && "text-primary")} />
              <span className="text-[10px] font-medium truncate max-w-full">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
        
        {/* More button to open full drawer */}
        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center flex-1 h-full px-2 py-1 text-muted-foreground hover:text-foreground transition-colors touch-target"
        >
          <MoreHorizontal className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium">Plus</span>
        </button>
      </div>
    </nav>
  );
}
