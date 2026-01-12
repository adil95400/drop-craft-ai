import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  MoreHorizontal,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const bottomNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/orders', label: 'Commandes', icon: ShoppingCart },
  { href: '/analytics', label: 'Stats', icon: BarChart3 },
];

interface MobileBottomNavProps {
  onOpenDrawer: () => void;
}

export function MobileBottomNav({ onOpenDrawer }: MobileBottomNavProps) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full px-1 py-2 transition-all touch-target relative",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-colors",
                isActive && "bg-primary/10"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium mt-0.5 truncate max-w-full",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
        
        {/* Bouton Plus pour ouvrir le drawer complet */}
        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center flex-1 h-full px-1 py-2 text-muted-foreground active:text-foreground transition-colors touch-target"
        >
          <div className="p-2 rounded-xl hover:bg-accent transition-colors">
            <MoreHorizontal className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium mt-0.5">Plus</span>
        </button>
      </div>
    </nav>
  );
}
