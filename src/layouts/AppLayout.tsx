import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { AdminUserDropdown } from "@/components/admin/AdminUserDropdown";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="pl-64 min-h-screen flex flex-col">
          {/* Mobile sidebar trigger */}
          <div className="lg:hidden fixed top-4 left-4 z-50">
            <SidebarTrigger />
          </div>
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="flex items-center justify-between px-6 h-full">
              <div className="flex items-center gap-4">
                
                {/* Search */}
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher produits, commandes..."
                    className="pl-9 bg-muted/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Notifications */}
                <NotificationDropdown />

                {/* User Menu */}
                <AdminUserDropdown />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t bg-muted/30 py-4 px-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>© 2024 Shopopti Pro</span>
                <span>•</span>
                <span>Version 2.1.0</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Status: ✅ Opérationnel</span>
                <span>•</span>
                <span>Uptime: 99.9%</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}