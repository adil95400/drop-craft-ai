import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, Home, Package, ShoppingCart, Users, BarChart3, 
  Upload, Truck, Bot, Settings, Crown, Megaphone,
  Puzzle, Store, Workflow, Brain, ChevronRight,
  MessageSquare, Target, Database, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const mobileNavGroups = [
  {
    title: "Principal",
    items: [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
      { icon: Crown, label: 'Dashboard Pro', path: '/dashboard-super', badge: 'Pro' },
    ]
  },
  {
    title: "E-Commerce",
    items: [
      { icon: Package, label: 'Produits', path: '/products' },
      { icon: ShoppingCart, label: 'Commandes', path: '/dashboard/orders' },
      { icon: Users, label: 'Clients', path: '/dashboard/customers' },
      { icon: Truck, label: 'Fournisseurs', path: '/suppliers' },
    ]
  },
  {
    title: "Import & Sync",
    items: [
      { icon: Upload, label: 'Import Hub', path: '/import', badge: 'Hub' },
      { icon: Store, label: 'Shopify Import', path: '/import/shopify' },
    ]
  },
  {
    title: "Intelligence Artificielle",
    items: [
      { icon: Bot, label: 'Assistant IA', path: '/ai-assistant', badge: 'AI' },
      { icon: Brain, label: 'IA Studio', path: '/ai-studio', badge: 'AI' },
    ]
  },
  {
    title: "Analytics & Marketing",
    items: [
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
      { icon: Megaphone, label: 'Marketing', path: '/marketing' },
      { icon: Target, label: 'Ads Manager', path: '/marketing/ads', badge: 'Pro' },
    ]
  },
  {
    title: "Outils",
    items: [
      { icon: Workflow, label: 'Automation', path: '/automation' },
      { icon: Database, label: 'Stock', path: '/stock' },
      { icon: Zap, label: 'Rules', path: '/rules' },
      { icon: Puzzle, label: 'Extensions', path: '/extensions' },
    ]
  },
  {
    title: "Support",
    items: [
      { icon: MessageSquare, label: 'Support', path: '/support' },
      { icon: Settings, label: 'Paramètres', path: '/dashboard/settings' },
    ]
  }
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => 
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="touch-target">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <SheetTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Drop Craft AI
                </div>
                <div className="text-xs text-muted-foreground font-normal">
                  Dropshipping Platform
                </div>
              </div>
            </SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="p-4 space-y-6">
              {mobileNavGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                    {group.title}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all touch-target",
                            active 
                              ? "bg-primary/10 text-primary font-medium border-l-4 border-primary" 
                              : "hover:bg-accent text-foreground"
                          )}
                        >
                          <Icon className={cn(
                            "h-5 w-5 flex-shrink-0",
                            active && "text-primary"
                          )} />
                          <span className="flex-1 font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge 
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                item.badge === "AI" && "bg-gradient-to-r from-blue-600 to-purple-600 text-white",
                                item.badge === "Pro" && "bg-gradient-to-r from-orange-500 to-red-500 text-white",
                                item.badge === "Hub" && "bg-gradient-to-r from-green-500 to-teal-500 text-white"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
