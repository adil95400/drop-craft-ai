import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebarPlanGated";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { RealTimeNotifications } from "@/components/notifications/RealTimeNotifications";
import { IntegratedChatSupport } from "@/components/support/IntegratedChatSupport";
import { AdminUserDropdown } from "@/components/admin/AdminUserDropdown";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
}

// Composant Header unifié
const AppHeader = ({ showTrigger = false }: { showTrigger?: boolean }) => (
  <header className="sticky top-0 z-30 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="flex items-center justify-end px-6 h-full">
      {showTrigger && <SidebarTrigger className="mr-auto" aria-label="Toggle navigation menu" />}
      <div className="flex items-center gap-3">
        <RealTimeNotifications />
        <AdminUserDropdown />
      </div>
    </div>
  </header>
);

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen w-full bg-background">
        {/* Desktop Grid Layout */}
        <div className="hidden md:grid md:grid-cols-[280px_1fr] min-h-screen">
          {/* Desktop Sidebar - Fixed position */}
          <div className="z-20">
            <AppSidebar />
          </div>
          
          {/* Desktop Content */}
          <div className="flex flex-col min-w-0">
            <AppHeader />

            {/* Main Content */}
            <main className="flex-1 overflow-auto min-w-0 p-4 lg:p-6 bg-background">
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

        {/* Mobile Layout with Off-canvas Sidebar */}
        <div className="md:hidden min-h-screen">
          <AppSidebar />
          
          <SidebarInset className="flex flex-col min-h-screen">
            <AppHeader showTrigger />

            {/* Mobile Content */}
            <main className="flex-1 overflow-auto min-w-0 p-4 bg-background">
              {children}
            </main>

            {/* Mobile Footer */}
            <footer className="border-t bg-muted/30 py-3 px-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>© 2024 Shopopti Pro</span>
                  <span>•</span>
                  <span>v2.1.0</span>
                </div>
                <div className="flex items-center gap-2 mt-1 sm:mt-0">
                  <span>✅ Opérationnel</span>
                </div>
              </div>
            </footer>
          </SidebarInset>
        </div>
      </div>
      
      {/* Integrated Chat Support - Available on all pages */}
      <IntegratedChatSupport />
    </SidebarProvider>
  );
}