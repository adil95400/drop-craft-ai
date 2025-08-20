import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className={cn("flex-1 overflow-auto", className)}>
        {children}
      </main>
    </div>
  );
}