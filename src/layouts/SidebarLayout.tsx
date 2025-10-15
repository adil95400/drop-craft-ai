import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Search, Bell, User, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationService";
import { ExtensionMenu } from "@/components/navigation/ExtensionMenu";
import { Settings } from "lucide-react";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { user, signOut } = useAuth();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen w-full flex bg-background">
        <AppSidebar />
        
        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              {/* Sidebar Toggle - Always visible */}
              <SidebarTrigger className="h-9 w-9 hover:bg-accent rounded-md transition-colors" />

              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher dans Import Pro..."
                    className="pl-8 bg-muted/50 border-0 focus-visible:ring-1"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <ExtensionMenu />
                <NotificationBell />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/avatars/user-pro.jpg" alt="Avatar" />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
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
                      <NavLink to="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profil
                      </NavLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <NavLink to="/settings" className="flex items-center">
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
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}