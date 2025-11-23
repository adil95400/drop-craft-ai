import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Store,
  Package,
  BookOpen,
  ShoppingCart,
  Upload,
  Users2,
  LineChart,
  Monitor,
  Users,
  MessageSquare,
  Megaphone,
  FileText,
  Search,
  Puzzle,
  Bot,
  Palette,
  Zap,
  TrendingUp,
  Workflow,
  Shield,
  Settings,
  ChevronLeft,
  Crown,
  Trophy,
  Sparkles,
  Truck,
  Globe,
  Database,
  GraduationCap,
  Brain,
  Building2,
  Plug,
  Activity,
  Video,
  type LucideIcon
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { MODULE_REGISTRY, type ModuleConfig } from '@/config/modules';
import { getAllCategories, type ModuleCategory } from '@/config/module-categories';
import { useUnifiedModules } from '@/hooks/useUnifiedModules';

// Map des icônes pour la résolution dynamique
const iconMap: Record<string, LucideIcon> = {
  BarChart3: LayoutDashboard,
  Package: Package,
  Upload: Upload,
  Trophy: Trophy,
  Sparkles: Sparkles,
  Truck: Truck,
  ShoppingBag: Package,
  Store: Store,
  Globe: Globe,
  Crown: Crown,
  Database: Database,
  GraduationCap: GraduationCap,
  TrendingUp: TrendingUp,
  Zap: Zap,
  PuzzlePiece: Puzzle,
  Users: Users,
  Search: Search,
  Brain: Brain,
  ShoppingCart: ShoppingCart,
  Building2: Building2,
  Settings: Settings,
  Shield: Shield,
  Plug: Plug,
  Activity: Activity,
  Video: Video,
};

export function AdminSidebar() {
  const { open: sidebarOpen } = useSidebar();
  const location = useLocation();
  const { profile, effectivePlan } = useUnifiedAuth();
  const { canAccess, plan } = useUnifiedModules();
  const currentPath = location.pathname;
  const collapsed = !sidebarOpen;

  // Fonction pour déterminer si une route est active
  const isActive = (path: string) => {
    if (path === '/admin') return currentPath === '/admin';
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  // Obtenir tous les modules organisés par catégorie
  const categories = getAllCategories();
  const modulesByCategory = categories.map(category => ({
    category,
    modules: Object.values(MODULE_REGISTRY)
      .filter(module => module.category === category.id && module.enabled)
      .sort((a, b) => a.order - b.order)
  })).filter(group => group.modules.length > 0);

  // Détecter le groupe actif pour le garder ouvert
  const activeCategory = modulesByCategory.find(({ modules }) =>
    modules.some(m => isActive(m.route))
  )?.category.id;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? 'bg-primary text-primary-foreground font-medium shadow-sm' 
      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground';

  const getPlanBadge = (minPlan: string) => {
    if (minPlan === 'ultra_pro') return { text: 'ULTRA', variant: 'destructive' as const };
    if (minPlan === 'pro') return { text: 'PRO', variant: 'default' as const };
    return null;
  };

  const renderModuleItem = (module: ModuleConfig, index: number) => {
    const Icon = iconMap[module.icon] || Settings;
    const hasAccess = canAccess(module.id);
    const badge = getPlanBadge(module.minPlan);
    const active = isActive(module.route);

    return (
      <motion.div
        key={module.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{
          duration: 0.2,
          delay: index * 0.03,
          ease: [0.4, 0, 0.2, 1]
        }}
        whileHover={{ scale: hasAccess ? 1.02 : 1 }}
        whileTap={{ scale: hasAccess ? 0.98 : 1 }}
      >
        <SidebarMenuItem>
          <SidebarMenuButton asChild className="h-9">
            <NavLink 
              to={module.route}
              end={module.route === '/admin'}
              className={({ isActive: navIsActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                ${getNavCls({ isActive: navIsActive || active })} 
                ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}
                ${collapsed ? 'justify-center' : ''}
              `}
              onClick={(e) => {
                if (!hasAccess) {
                  e.preventDefault();
                }
              }}
              title={collapsed ? module.name : undefined}
            >
              <motion.div
                initial={false}
                animate={{ rotate: active ? [0, -10, 10, 0] : 0 }}
                transition={{ duration: 0.4 }}
              >
                <Icon className="h-4 w-4 shrink-0" />
              </motion.div>
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.div 
                    className="flex items-center justify-between w-full min-w-0"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="truncate text-sm">{module.name}</span>
                    {badge && !hasAccess && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Badge variant={badge.variant} className="text-[10px] h-4 px-1 shrink-0 ml-2">
                          {badge.text}
                        </Badge>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </motion.div>
    );
  };

  const renderMenuGroup = (category: ModuleCategory, modules: ModuleConfig[], groupIndex: number) => {
    const isGroupActive = category.id === activeCategory;
    
    return (
      <motion.div
        key={category.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: groupIndex * 0.1,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        <SidebarGroup className="transition-all">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-muted-foreground px-2">
                  {category.name}
                </SidebarGroupLabel>
              </motion.div>
            )}
          </AnimatePresence>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <AnimatePresence mode="popLayout">
                {modules.map((module, idx) => renderModuleItem(module, idx))}
              </AnimatePresence>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={false}
      animate={{
        width: collapsed ? 64 : 256
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      <Sidebar
        className="border-r"
        collapsible="icon"
      >
        <div className="flex h-full flex-col">
          {/* Header avec profil utilisateur - responsive */}
          <motion.div 
            className="border-b p-4"
            layout
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {collapsed ? (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-center"
                >
                  <motion.div 
                    className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Crown className="h-5 w-5 text-primary" />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <motion.div 
                    className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Crown className="h-5 w-5 text-primary" />
                  </motion.div>
                  <motion.div 
                    className="flex-1 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="font-semibold text-sm truncate">
                      {profile?.full_name || 'Admin'}
                    </div>
                    <motion.div 
                      className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Badge variant="outline" className="h-4 text-xs">
                        {effectivePlan}
                      </Badge>
                      {profile?.admin_mode && (
                        <Badge variant="destructive" className="h-4 text-xs">
                          {profile.admin_mode}
                        </Badge>
                      )}
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Navigation content */}
          <SidebarContent className="flex-1 overflow-auto py-2">
            <AnimatePresence mode="wait">
              {modulesByCategory.map(({ category, modules }, idx) => 
                renderMenuGroup(category, modules, idx)
              )}
            </AnimatePresence>
          </SidebarContent>

          {/* Footer hint en mode collapsed */}
          <AnimatePresence>
            {collapsed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="border-t p-2 flex justify-center"
              >
                <motion.div 
                  className="text-xs text-muted-foreground"
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <Settings className="h-4 w-4" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Sidebar>
    </motion.div>
  );
}