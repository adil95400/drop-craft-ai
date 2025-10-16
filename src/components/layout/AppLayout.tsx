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
  Bell, 
  Search, 
  Settings, 
  LogOut, 
  User,
  Crown,
  Zap
} from 'lucide-react';
import { AppNavigation, QuickActions } from '@/components/navigation/AppNavigation';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useUnifiedAuth();
  const { currentPlan, isUltraPro, isPro } = useUnifiedPlan();

  const getPlanIcon = () => {
    if (isUltraPro) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (isPro) return <Zap className="h-4 w-4 text-blue-500" />;
    return null;
  };

  const getPlanBadge = () => {
    if (isUltraPro) return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">Ultra Pro</Badge>;
    if (isPro) return <Badge className="bg-blue-500 text-white">Pro</Badge>;
    return <Badge variant="outline">Standard</Badge>;
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          {/* Logo */}
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <img src="/images/logo.svg" alt="Logo" className="h-6 w-6" />
              <span>E-Commerce Pro</span>
            </Link>
            {getPlanIcon()}
          </div>

          {/* Navigation */}
          <div className="flex-1 px-3 py-2">
            <AppNavigation />
          </div>

          {/* Quick Actions */}
          <div className="mt-auto p-3 border-t">
            <QuickActions />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* Mobile Menu */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <div className="flex items-center gap-2 font-semibold mb-4">
                <img src="/images/logo.svg" alt="Logo" className="h-6 w-6" />
                <span>E-Commerce Pro</span>
                {getPlanIcon()}
              </div>
              <AppNavigation />
              <div className="mt-auto">
                <QuickActions />
              </div>
            </SheetContent>
          </Sheet>

          {/* Search */}
          <div className="w-full flex-1">
            <div className="relative max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Rechercher..."
                className="w-full rounded-lg border border-input bg-background pl-8 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Plan Badge */}
            {getPlanBadge()}

            {/* Notifications */}
            <NotificationCenter />

            {/* User Menu */}
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
                    <p className="text-sm font-medium leading-none">
                      {user?.email || 'Utilisateur'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Plan {currentPlan}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Paramètres</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}