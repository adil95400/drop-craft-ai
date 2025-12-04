import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  Search, 
  Settings, 
  LogOut, 
  User,
  Crown,
  Zap
} from 'lucide-react';
import { AppNavigation, QuickActions } from '@/components/navigation/AppNavigation';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { user, signOut } = useUnifiedAuth();
  const { currentPlan, isUltraPro, isPro } = useUnifiedPlan();

  const getPlanIcon = () => {
    if (isUltraPro) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (isPro) return <Zap className="h-4 w-4 text-blue-500" />;
    return null;
  };

  const getPlanBadge = () => {
    if (isUltraPro) return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">Ultra Pro</Badge>;
    if (isPro) return <Badge className="bg-blue-500 text-white text-xs">Pro</Badge>;
    return <Badge variant="outline" className="text-xs">Standard</Badge>;
  };

  return (
    <div className="min-h-screen w-full">
      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] min-h-screen">
        {/* Desktop Sidebar */}
        <div className="border-r bg-muted/40">
          <div className="flex h-full max-h-screen flex-col gap-2">
            {/* Logo */}
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link to="/" className="flex items-center gap-2 font-semibold">
                <img src="/images/logo.svg" alt="Logo" className="h-6 w-6" />
                <span>ShopOpti</span>
              </Link>
              {getPlanIcon()}
            </div>

            {/* Navigation */}
            <div className="flex-1 px-3 py-2 overflow-y-auto">
              <AppNavigation />
            </div>

            {/* Quick Actions */}
            <div className="mt-auto p-3 border-t">
              <QuickActions />
            </div>
          </div>
        </div>

        {/* Desktop Main Content */}
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <div className="w-full flex-1">
              <div className="relative max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Rechercher..."
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {getPlanBadge()}
              <NotificationCenter />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user?.email || ''} />
                      <AvatarFallback>
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.email || 'Utilisateur'}</p>
                      <p className="text-xs text-muted-foreground">Plan {currentPlan}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive" onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur-lg px-4">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setMobileDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link to="/" className="flex items-center gap-2 font-semibold">
            <img src="/images/logo.svg" alt="Logo" className="h-5 w-5" />
            <span className="text-sm">ShopOpti</span>
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {getPlanBadge()}
            <NotificationCenter />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Content */}
        <main className="flex-1 p-4 pb-20 overflow-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav onOpenDrawer={() => setMobileDrawerOpen(true)} />
        
        {/* Mobile Navigation Drawer */}
        <MobileNavDrawer 
          open={mobileDrawerOpen} 
          onOpenChange={setMobileDrawerOpen} 
        />
      </div>
    </div>
  );
}
