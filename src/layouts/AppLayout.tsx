import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebarUltraPro } from "@/components/AppSidebarUltraProNew";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { AdminUserDropdown } from "@/components/admin/AdminUserDropdown";
interface AppLayoutProps {
  children: ReactNode;
}
export function AppLayout({
  children
}: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen w-full bg-background flex">
        <AppSidebarUltraPro />
        
        <SidebarInset className="flex-1 flex flex-col min-w-0 transition-[margin] duration-200 ease-linear md:ml-[--sidebar-width] md:peer-data-[state=collapsed]:ml-[--sidebar-width-icon]">
          {/* Header with responsive sidebar trigger */}
          <header className="sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between px-4 h-full">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
              </div>

              <div className="flex items-center gap-4">
                <NotificationDropdown />
                <AdminUserDropdown />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-0">
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}