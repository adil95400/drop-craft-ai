import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Settings, Shield, CreditCard, HelpCircle, LogOut, Crown, Bell, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
export function AdminUserDropdown() {
  const navigate = useNavigate();
  const { signOut } = useUnifiedAuth();
  const [darkMode, setDarkMode] = useState(false);
  const userInfo = {
    name: "Admin User",
    email: "admin@shopopti.com",
    role: "Super Admin",
    plan: "Plan Enterprise",
    avatar: "/lovable-uploads/d3b4944e-d4d8-48dc-9869-b28719260acf.png"
  };
  const handleProfileClick = () => {
    navigate('/settings');
  };
  const handleLogout = async () => {
    await signOut();
  };
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };
  return <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 h-auto">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium flex items-center gap-2">
              {userInfo.name}
              <Crown className="h-3 w-3 text-yellow-500" />
            </div>
            <div className="text-xs text-muted-foreground">{userInfo.plan}</div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{userInfo.name}</span>
              <Badge variant="secondary" className="text-xs">
                <Crown className="h-3 w-3 mr-1" />
                {userInfo.role}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{userInfo.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {userInfo.plan}
              </Badge>
              <Badge variant="default" className="text-xs bg-green-500">
                Actif
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          
          
          <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
            <Shield className="mr-2 h-4 w-4" />
            <span>Administration</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Facturation</span>
            <Badge className="ml-auto text-xs">Pro</Badge>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={toggleDarkMode} className="cursor-pointer">
            {darkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            <span>Mode {darkMode ? 'Clair' : 'Sombre'}</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer">
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
            <Badge className="ml-auto text-xs bg-red-500">3</Badge>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer">
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Support & Aide</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>;
}