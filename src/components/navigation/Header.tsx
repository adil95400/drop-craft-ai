import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Zap,
  Shield
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { useLanguage } from '@/hooks/useLanguage';

export function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut, profile } = useAuth();
  const { plan, isPro, isUltraPro } = usePlan();
  const { t } = useLanguage();
  
  // Check admin status directly from profile
  const isAdmin = profile?.role === 'admin' || profile?.is_admin === true;

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
            <span className="sr-only">{t('navigation:menu')}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div className="w-full flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder={t('navigation:search')}
            className="w-full rounded-lg border border-input bg-background pl-8 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Plan Badge */}
        {getPlanBadge()}

        {/* Notifications */}
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
            3
          </Badge>
          <span className="sr-only">{t('navigation:notifications')}</span>
        </Button>

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
                  {profile?.full_name || user?.email || t('common:user', 'Utilisateur')}
                </p>
                <p className="text-xs leading-none text-muted-foreground flex items-center gap-1">
                  {t('common:plan', 'Plan')} {plan} {getPlanIcon()}
                </p>
                {isAdmin && (
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <Crown className="h-3 w-3" />
                    Administrateur
                  </div>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>{t('navigation:profile')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('navigation:settings')}</span>
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link to="/admin-panel" className="cursor-pointer">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Administration</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-red-600"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('navigation:logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}