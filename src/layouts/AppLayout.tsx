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
          <header className="h-16 border-b bg-gradient-to-r from-background/95 to-muted/50 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center justify-between px-6 h-full">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">SP</span>
                  </div>
                  <div className="hidden md:block">
                    <h1 className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">
                      Shopopti Pro
                    </h1>
                    <p className="text-xs text-muted-foreground">Tableau de bord professionnel</p>
                  </div>
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