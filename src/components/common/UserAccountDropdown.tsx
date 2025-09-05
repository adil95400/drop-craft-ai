import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Settings,
  LogOut,
  Shield,
  Crown,
  ChevronDown,
  BarChart3,
  Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UserAccountDropdown = () => {
  const { user, profile, signOut } = useAuth();
  const { role, isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || 'U';
  };

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <Badge variant="destructive" className="text-xs">
          <Crown className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        <User className="w-3 h-3 mr-1" />
        Utilisateur
      </Badge>
    );
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-2 h-auto hover:bg-muted/50"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium">
              {profile?.full_name || 'Utilisateur'}
            </span>
            <div className="flex items-center gap-1">
              {getRoleBadge()}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        className="w-64 z-50 bg-background border border-border shadow-lg"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">
                {profile?.full_name || 'Utilisateur'}
              </span>
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <div className="mt-1">
                {getRoleBadge()}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleNavigation('/dashboard')}
          className="cursor-pointer p-3 hover:bg-muted"
        >
          <BarChart3 className="mr-3 h-4 w-4" />
          <span>Tableau de bord</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleNavigation('/profile')}
          className="cursor-pointer p-3 hover:bg-muted"
        >
          <User className="mr-3 h-4 w-4" />
          <span>Profil</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleNavigation('/catalogue')}
          className="cursor-pointer p-3 hover:bg-muted"
        >
          <Package className="mr-3 h-4 w-4" />
          <span>Mon Catalogue</span>
        </DropdownMenuItem>
        
        {isAdmin && (
          <DropdownMenuItem
            onClick={() => handleNavigation('/admin')}
            className="cursor-pointer p-3 hover:bg-muted"
          >
            <Shield className="mr-3 h-4 w-4" />
            <span>Administration</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem
          onClick={() => handleNavigation('/settings')}
          className="cursor-pointer p-3 hover:bg-muted"
        >
          <Settings className="mr-3 h-4 w-4" />
          <span>Paramètres</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer p-3 hover:bg-muted text-destructive focus:text-destructive"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};