import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  Sparkles,
  Bell,
  Search
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

interface MobileNavProps {
  notifications?: number;
}

export function MobileNav({ notifications = 0 }: MobileNavProps) {
  const location = useLocation();
  
  const navItems = [
    {
      icon: Home,
      label: 'Accueil',
      path: '/dashboard',
      color: 'text-blue-600'
    },
    {
      icon: Package,
      label: 'Produits',
      path: '/products',
      color: 'text-green-600'
    },
    {
      icon: ShoppingCart,
      label: 'Commandes',
      path: '/orders',
      color: 'text-orange-600'
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      path: '/analytics',
      color: 'text-purple-600'
    },
    {
      icon: Settings,
      label: 'Paramètres',
      path: '/settings',
      color: 'text-gray-600'
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 pb-safe">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                active 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon 
                  className={`h-5 w-5 ${active ? item.color : ''}`} 
                />
                {item.label === 'Accueil' && notifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                  >
                    {notifications > 9 ? '9+' : notifications}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function MobileHeader() {
  return (
    <div className="bg-white border-b sticky top-0 z-40 pt-safe">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Drop Craft AI</h1>
            <p className="text-xs text-muted-foreground">Dropshipping Intelligent</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MobileQuickActions() {
  const quickActions = [
    {
      icon: Package,
      label: 'Importer',
      description: 'Nouveaux produits',
      color: 'bg-blue-500',
      path: '/import'
    },
    {
      icon: Sparkles,
      label: 'IA Insights',
      description: 'Recommandations',
      color: 'bg-purple-500',
      path: '/dashboard?tab=ai-insights'
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      description: 'Temps réel',
      color: 'bg-green-500',
      path: '/dashboard?tab=analytics'
    },
    {
      icon: Users,
      label: 'Clients',
      description: 'Gestion',
      color: 'bg-orange-500',
      path: '/customers'
    }
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
                      <p className="text-xs text-muted-foreground truncate">
                        {action.description}
                      </p>
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