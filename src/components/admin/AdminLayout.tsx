import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { useUnifiedSystem } from '@/hooks/useUnifiedSystem';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Upload, 
  Users, 
  BarChart3,
  UserPlus,
  Mail,
  PenTool,
  Search,
  Bot,
  Zap,
  Shield,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bell,
  RefreshCcw
} from 'lucide-react';

interface AdminSidebarItem {
  title: string;
  href: string;
  icon: any;
  badge?: string;
  planRequired?: 'standard' | 'pro' | 'ultra_pro';
}

const adminSidebarItems: AdminSidebarItem[] = [
  { title: 'Dashboard', href: '/admin', icon: Home },
  { title: 'Produits', href: '/admin/products', icon: Package },
  { title: 'Commandes', href: '/admin/orders', icon: ShoppingCart },
  { title: 'Import', href: '/admin/import', icon: Upload },
  { title: 'Fournisseurs', href: '/admin/suppliers', icon: Users },
  { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { title: 'Clients', href: '/admin/customers', icon: UserPlus },
  { title: 'CRM', href: '/admin/crm', icon: Mail, badge: 'PRO', planRequired: 'pro' },
  { title: 'Marketing', href: '/admin/marketing', icon: PenTool, badge: 'PRO', planRequired: 'pro' },
  { title: 'Blog', href: '/admin/blog', icon: PenTool, badge: 'PRO', planRequired: 'pro' },
  { title: 'SEO', href: '/admin/seo', icon: Search, badge: 'PRO', planRequired: 'pro' },
  { title: 'IA Assistant', href: '/admin/ai', icon: Bot, badge: 'ULTRA', planRequired: 'ultra_pro' },
  { title: 'Automation', href: '/admin/automation', icon: Zap, badge: 'ULTRA', planRequired: 'ultra_pro' },
  { title: 'Sécurité', href: '/admin/security', icon: Shield, badge: 'ULTRA', planRequired: 'ultra_pro' },
  { title: 'Intégrations', href: '/admin/integrations', icon: Settings },
  { title: 'Abonnements', href: '/admin/subscriptions', icon: CreditCard },
];

export const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, profile } = useEnhancedAuth();
  const { isPro, isUltraPro } = useUnifiedSystem();

  const canAccessItem = (item: AdminSidebarItem) => {
    if (!item.planRequired) return true;
    if (isAdmin) return true; // Admin can access everything
    if (item.planRequired === 'pro') return isPro;
    if (item.planRequired === 'ultra_pro') return isUltraPro;
    return true;
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <Package className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Shopopti+</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          ${collapsed ? 'w-16' : 'w-64'} 
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:static inset-y-0 left-0 z-50 
          bg-card border-r transition-all duration-300 ease-in-out
          flex flex-col
        `}>
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              {!collapsed && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                    <Package className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg">Shopopti+</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex"
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Admin Badge */}
          {!collapsed && (
            <div className="p-4">
              <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    Tableau de Bord Admin
                  </span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                  Vue d'ensemble complète de la plateforme et gestion système
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {adminSidebarItems.map((item, index) => {
              const Icon = item.icon;
              const accessible = canAccessItem(item);
              const active = isActive(item.href);
              
              return (
                <div key={index} className="relative">
                  <Button
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    className={`
                      w-full justify-start gap-3 h-10
                      ${!accessible ? 'opacity-50 cursor-not-allowed' : ''}
                      ${collapsed ? 'px-2' : 'px-3'}
                    `}
                    onClick={() => {
                      if (accessible) {
                        navigate(item.href);
                        setMobileOpen(false);
                      }
                    }}
                    disabled={!accessible}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.title}</span>
                        {item.badge && (
                          <Badge 
                            variant={accessible ? "secondary" : "outline"} 
                            className="ml-auto text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Button>
                  {collapsed && item.badge && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-1 -right-1 text-xs px-1 py-0 h-5"
                    >
                      {item.badge.charAt(0)}
                    </Badge>
                  )}
                </div>
              );
            })}
          </nav>

          {/* System Status */}
          {!collapsed && (
            <div className="p-4 border-t">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Système</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">Opérationnel</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plan actuel</span>
                  <Badge variant="outline" className="text-xs">
                    {(profile?.plan || 'STANDARD').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Overlay */}
        {mobileOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          {/* Top Bar */}
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-lg font-semibold">Administration Système</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm">
                  <RefreshCcw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                >
                  Retour App
                </Button>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};