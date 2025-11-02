import { MODULE_REGISTRY } from '@/config/modules';
import { MODULE_CATEGORIES, getAllCategories } from '@/config/module-categories';
import { getSubModules } from '@/config/sub-modules';
import type { PlanType } from '@/hooks/usePlan';
import { 
  BarChart3, Package, Truck, TrendingUp, Zap, Users, Search, 
  Brain, Shield, Plug, Settings, Crown, Sparkles, Upload, Trophy,
  Building, Building2, GraduationCap, LucideIcon, HelpCircle
} from 'lucide-react';

export interface SidebarSubItem {
  id: string;
  title: string;
  url: string;
  description?: string;
}

export interface SidebarItem {
  id: string;
  title: string;
  url: string;
  icon: any;
  isActive: boolean;
  badge: string | null;
  requiredPlan?: PlanType;
  category?: string;
  subItems?: SidebarSubItem[];
}

// Interface pour NavItem (pour compatibilité)
export interface NavItem {
  title: string;
  url?: string;
  icon: any;
  badge?: {
    text: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  };
  status?: "active" | "warning" | "syncing" | "connected" | "new";
  items?: NavItem[];
  shortcut?: string;
  description?: string;
  category?: "core" | "advanced" | "tools" | "support";
}

// Configuration de l'activité utilisateur
export const userActivityConfig = {
  status: "online" as "online" | "away" | "offline",
  notifications: 8,
  plan: "Ultra Pro",
  lastSync: "Il y a 2 min",
  activeConnections: 3,
  todayRevenue: "€2,847",
  pendingTasks: 12,
  avatar: "/avatars/user-pro.jpg",
  name: "Utilisateur Pro",
  email: "pro@dropcraft.ai"
};

// Map des icônes pour éviter les erreurs de référence
const iconMap: Record<string, any> = {
  'BarChart3': BarChart3,
  'Package': Package,
  'Truck': Truck,
  'Upload': Upload,
  'Trophy': Trophy,
  'TrendingUp': TrendingUp,
  'Zap': Zap,
  'Users': Users,
  'Search': Search,
  'Brain': Brain,
  'Shield': Shield,
  'Plug': Plug,
  'ShoppingCart': Package,
  'Settings': Settings,
  'Building': Building,
  'Building2': Building2,
  'GraduationCap': GraduationCap,
  'Crown': Crown,
  'Sparkles': Sparkles,
  'HelpCircle': HelpCircle
};

// Génération dynamique des éléments de sidebar basée sur la configuration des modules
export function getSidebarItems(currentPlan: PlanType): SidebarItem[] {
  const planBadgeMap: Record<PlanType, string> = {
    'free': '',
    'standard': '',
    'pro': 'PRO',
    'ultra_pro': 'ULTRA'
  };

  return Object.values(MODULE_REGISTRY)
    .sort((a, b) => a.order - b.order)
    .map(module => {
      const subModules = getSubModules(module.id);
      
      return {
        id: module.id,
        title: module.name,
        url: module.route,
        icon: iconMap[module.icon] || Settings,
        isActive: false,
        badge: module.minPlan !== 'standard' ? planBadgeMap[module.minPlan] : null,
        requiredPlan: module.minPlan,
        category: module.category,
        subItems: subModules.map(sub => ({
          id: sub.id,
          title: sub.name,
          url: sub.route,
          description: sub.description
        }))
      };
    });
}

// Génération des éléments groupés par catégorie
export function getSidebarItemsByCategory(currentPlan: PlanType) {
  const items = getSidebarItems(currentPlan);
  const categories = getAllCategories();
  
  return categories.map(category => ({
    category: category,
    items: items.filter(item => item.category === category.id)
  })).filter(group => group.items.length > 0);
}

// Actions rapides avec raccourcis clavier
export interface QuickAction {
  title: string;
  icon: any;
  action: string;
  variant: "default" | "secondary" | "outline" | "ghost" | "destructive";
  shortcut?: string;
  badge?: string;
  description?: string;
}

export const quickActions: QuickAction[] = [
  { 
    title: "IA Assistant", 
    icon: Brain, 
    action: "ai",
    variant: "default",
    shortcut: "⌘+I",
    badge: "AI",
    description: "Ouvrir l'assistant IA"
  },
  { 
    title: "Nouveau Produit", 
    icon: Package, 
    action: "products?action=add",
    variant: "secondary",
    shortcut: "⌘+N",
    description: "Ajouter un nouveau produit"
  },
  { 
    title: "Analytics", 
    icon: TrendingUp, 
    action: "analytics",
    variant: "outline",
    shortcut: "⌘+A",
    badge: "Live",
    description: "Voir les analytics"
  }
];