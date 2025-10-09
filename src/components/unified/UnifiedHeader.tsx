import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { Bell, Settings, User, LogOut, Shield, Crown, AlertTriangle } from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useNavigate } from 'react-router-dom';

export const UnifiedHeader: React.FC = () => {
  const { user, profile, isAdmin, effectivePlan, signOut } = useUnifiedAuth();
  const navigate = useNavigate();

  // Raccourci clavier Alt+A pour accès admin rapide
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'a' && isAdmin) {
        event.preventDefault();
        navigate('/admin-panel');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'ultra_pro': return 'default';
      case 'pro': return 'secondary';
      default: return 'outline';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'ultra_pro': return Crown;
      case 'pro': return Shield;
      default: return User;
    }
  };

  if (!user || !profile) return null;

  const PlanIcon = getPlanIcon(effectivePlan);

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Commerce Hub</h1>
          {profile.admin_mode && (
            <Badge variant="destructive" className="text-xs">
              Admin Mode: {profile.admin_mode}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {isAdmin && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => navigate('/admin-panel')}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <Shield className="h-4 w-4" />
              ADMIN
              <span className="text-xs opacity-75">Alt+A</span>
            </Button>
          )}
          
          <Badge variant={getPlanBadgeVariant(effectivePlan)} className="flex items-center gap-1 capitalize">
            <PlanIcon className="h-3 w-3" />
            {effectivePlan.replace('_', ' ')}
          </Badge>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {isAdmin && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} alt={profile.full_name || 'User'} />
                  <AvatarFallback className="text-xs">
                    {profile.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile.full_name || 'Utilisateur'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs capitalize">
                      {isAdmin ? 'Admin' : 'Utilisateur'}
                    </Badge>
                    {isAdmin && (
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate('/admin-panel')}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Administration</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};