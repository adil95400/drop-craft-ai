import React from 'react';
import { useIsMobile } from '@/hooks/useResponsive';
import { MobileHeader, MobileNav, MobileQuickActions } from '@/components/mobile/MobileNav';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Bell, Search, User, Settings, Menu, Home, Package, 
  ShoppingCart, TrendingUp, Users, FileText, Zap,
  Brain, Shield, Plug, Crown, Upload, BarChart3, Truck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { NotificationBell } from '@/components/notifications/NotificationService';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  title: string;
  url: string;
  icon: any;
  badge?: string;
  requiredPlan?: 'standard' | 'pro' | 'ultra_pro';
}

const navigation: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Produits', url: '/products', icon: Package },
  { title: 'Catalogue', url: '/catalog', icon: Package, requiredPlan: 'pro' },
  { title: 'Commandes', url: '/orders', icon: ShoppingCart },
  { title: 'Import', url: '/import', icon: Upload },
  { title: 'Fournisseurs', url: '/suppliers', icon: Truck },
  { title: 'Analytics', url: '/analytics', icon: BarChart3, requiredPlan: 'pro' },
  { title: 'Monitoring', url: '/monitoring', icon: TrendingUp, requiredPlan: 'ultra_pro' },
  { title: 'Clients', url: '/customers', icon: Users },
  { title: 'CRM', url: '/crm', icon: Users, requiredPlan: 'pro' },
  { title: 'Marketing', url: '/marketing', icon: TrendingUp, requiredPlan: 'pro' },
  { title: 'Blog', url: '/blog', icon: FileText, requiredPlan: 'pro' },
  { title: 'SEO', url: '/seo', icon: Search, requiredPlan: 'pro' },
  { title: 'IA Assistant', url: '/ai', icon: Brain, badge: 'AI', requiredPlan: 'ultra_pro' },
  { title: 'Automation', url: '/automation', icon: Zap, requiredPlan: 'ultra_pro' },
  { title: 'Sécurité', url: '/security', icon: Shield, requiredPlan: 'ultra_pro' },
  { title: 'Intégrations', url: '/integrations', icon: Plug },
  { title: 'Abonnement', url: '/subscription', icon: Crown },
];

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { effectivePlan: plan, hasFeature } = useUnifiedPlan();
  const { isAdmin } = useEnhancedAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Version mobile optimisée
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader />
        <main className="pb-20 pt-4">
          <div className="container max-w-screen-sm mx-auto px-4">
            {children}
          </div>
        </main>
        <MobileNav notifications={2} />
      </div>
    );
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <NavLink to="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">
            <Crown className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl">Shopopti+</span>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          // Vérifier les permissions de plan (Admin a accès à tout)
          if (item.requiredPlan && !isAdmin && !hasFeature('advanced-analytics') && item.requiredPlan !== 'standard') {
            return (
              <div key={item.title} className="relative">
                <div className="flex items-center space-x-3 rounded-lg px-3 py-2 text-muted-foreground cursor-not-allowed opacity-50">
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {item.requiredPlan === 'pro' ? 'PRO' : 'ULTRA'}
                  </Badge>
                </div>
              </div>
            );
          }

          return (
            <NavLink
              key={item.title}
              to={item.url}
              onClick={() => mobile && setSidebarOpen(false)}
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors ${
                isActive(item.url)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {item.badge}
                </Badge>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Plan info */}
      <div className="border-t p-4">
        <div className="rounded-lg bg-muted p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Plan {plan}</p>
              <p className="text-xs text-muted-foreground">
                {plan === 'ultra_pro' ? 'Toutes les fonctionnalités' : 'Fonctionnalités limitées'}
              </p>
            </div>
            {plan !== 'ultra_pro' && (
              <Button size="sm" variant="outline" asChild>
                <NavLink to="/subscription">
                  <Crown className="h-4 w-4" />
                </NavLink>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col border-r bg-card">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center gap-4 px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-8"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/user-pro.jpg" alt="Avatar" />
                      <AvatarFallback>
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.user_metadata?.full_name || 'Utilisateur'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NavLink to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profil
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NavLink to="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Paramètres
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}