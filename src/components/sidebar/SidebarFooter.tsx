import React from "react";
import { LogOut, User, Settings, Moon, Sun, Crown, Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SidebarFooter } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";

// Configuration utilisateur par défaut
const userActivityConfig = {
  name: 'Utilisateur',
  email: 'user@example.com',
  avatar: '',
  plan: 'Pro',
  status: 'online' as 'online' | 'away' | 'offline',
  notifications: 0,
  lastSync: 'À l\'instant',
  todayRevenue: '0€',
  pendingTasks: 0,
};

interface SidebarFooterContentProps {
  collapsed: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  onQuickAction: (action: string) => void;
}

export const SidebarFooterContent: React.FC<SidebarFooterContentProps> = ({
  collapsed,
  syncStatus,
  onQuickAction
}) => {
  const { theme, setTheme } = useTheme();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const displayName = user?.email?.split('@')[0] || userActivityConfig.name;
  const displayEmail = user?.email || userActivityConfig.email;

  // Indicateur d'activité en temps réel
  const ActivityIndicator = () => (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-2 h-2 rounded-full transition-colors duration-300",
        {
          'bg-success animate-pulse': userActivityConfig.status === 'online',
          'bg-warning': userActivityConfig.status === 'away',
          'bg-muted': userActivityConfig.status === 'offline',
        }
      )} />
      {!collapsed && (
        <span className="text-xs text-muted-foreground capitalize">
          {userActivityConfig.status}
        </span>
      )}
    </div>
  );

  // Stats rapides (version compacte)
  const QuickStats = () => {
    if (collapsed) return null;
    
    return (
      <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Aujourd'hui</p>
          <p className="text-sm font-bold text-success">{userActivityConfig.todayRevenue}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Tâches</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold">{userActivityConfig.pendingTasks}</p>
            <Badge variant="outline" className="text-xs">
              En cours
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  return (
    <SidebarFooter className="border-t bg-muted/20 backdrop-blur-sm">
      <div className="p-4 space-y-4">
        {/* Stats rapides */}
        <QuickStats />
        
        {/* Status et synchronisation */}
        <div className={cn(
          "flex items-center justify-between p-2 rounded-lg",
          "bg-background/50 border border-border/50"
        )}>
          <ActivityIndicator />
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-1 text-xs",
                {
                  'text-muted-foreground': syncStatus === 'idle',
                  'text-primary': syncStatus === 'syncing',
                  'text-success': syncStatus === 'success',
                  'text-destructive': syncStatus === 'error',
                }
              )}>
                <Activity className={cn(
                  "h-3 w-3",
                  syncStatus === 'syncing' && "animate-pulse"
                )} />
                <span>
                  {syncStatus === 'syncing' && 'Sync...'}
                  {syncStatus === 'success' && 'À jour'}
                  {syncStatus === 'error' && 'Erreur'}
                  {syncStatus === 'idle' && userActivityConfig.lastSync}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Profil utilisateur */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "h-auto p-2 justify-start transition-all duration-200",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed ? "w-full aspect-square justify-center" : "w-full"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={userActivityConfig.avatar} 
                        alt={displayName} 
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Indicateur de plan */}
                    <div className="absolute -top-1 -right-1">
                      <Crown className="h-3 w-3 text-warning" />
                    </div>
                  </div>
                  {!collapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold truncate">
                        {displayName}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {userActivityConfig.plan}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              side={collapsed ? "right" : "top"}
              align="start"
              className="w-56 animate-in fade-in-0 zoom-in-95"
            >
              <div className="p-2">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={userActivityConfig.avatar} 
                      alt={displayName} 
                    />
                    <AvatarFallback>
                      {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{displayEmail}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {userActivityConfig.plan} • {userActivityConfig.notifications} notifications
                </Badge>
              </div>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Mon profil
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Paramètres
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center gap-2"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                Changer le thème
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </SidebarFooter>
  );
};