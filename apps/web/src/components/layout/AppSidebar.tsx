import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Upload, 
  Settings, 
  Zap, 
  Palette,
  Shield,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Products",
    href: "/catalogue",
    icon: Package,
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Import",
    href: "/import",
    icon: Upload,
  },
  {
    title: "Integrations",
    href: "/integrations",
    icon: Zap,
  },
  {
    title: "Canva Designs",
    href: "/canva-designs",
    icon: Palette,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

const adminItems = [
  {
    title: "Admin Panel",
    href: "/admin",
    icon: Shield,
  },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const location = useLocation();
  const { user, profile } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const isAdmin = profile?.role === 'admin';

  return (
    <div className={cn(
      "flex flex-col h-full bg-card border-r border-border",
      isCollapsed ? "w-16" : "w-64",
      "transition-all duration-300 ease-in-out",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-foreground">
            Drop Craft AI
          </h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-2">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start h-10",
                  isCollapsed && "justify-center px-2",
                  isActive && "bg-primary text-primary-foreground"
                )}
                asChild
              >
                <Link to={item.href}>
                  <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                  {!isCollapsed && (
                    <span className="truncate">{item.title}</span>
                  )}
                </Link>
              </Button>
            );
          })}
          
          {/* Admin Section */}
          {isAdmin && (
            <>
              <Separator className="my-4" />
              {!isCollapsed && (
                <div className="px-2 py-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Admin
                  </p>
                </div>
              )}
              {adminItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-10",
                      isCollapsed && "justify-center px-2",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                    asChild
                  >
                    <Link to={item.href}>
                      <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                      {!isCollapsed && (
                        <span className="truncate">{item.title}</span>
                      )}
                    </Link>
                  </Button>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-medium text-primary-foreground">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.full_name || user.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile?.plan || 'Standard'} Plan
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}