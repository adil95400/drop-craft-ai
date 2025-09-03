import { MODULE_REGISTRY } from '@/config/modules';
import type { PlanType } from '@/hooks/usePlan';
import { 
  BarChart3, Package, Truck, TrendingUp, Zap, Users, Search, 
  Brain, Shield, Plug, Settings, Crown, Sparkles 
} from 'lucide-react';

export interface SidebarItem {
  id: string;
  title: string;
  url: string;
  icon: any;
  isActive: boolean;
  badge: string | null;
  requiredPlan?: PlanType;
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

// Génération dynamique des éléments de sidebar basée sur la configuration des modules
export function getSidebarItems(currentPlan: PlanType): SidebarItem[] {
  const planBadgeMap: Record<PlanType, string> = {
    'standard': '',
    'pro': 'PRO',
    'ultra_pro': 'ULTRA'
  };

  // Map des icônes pour éviter les erreurs de référence
  const iconMap: Record<string, any> = {
    'BarChart3': BarChart3,
    'Package': Package,
    'Truck': Truck,
    'TrendingUp': TrendingUp,
    'Zap': Zap,
    'Users': Users,
    'Search': Search,
    'Brain': Brain,
    'Shield': Shield,
    'Plug': Plug,
    'ShoppingCart': Package, // Fallback
    'Settings': Settings
  };

  return Object.values(MODULE_REGISTRY).map(module => ({
    id: module.id,
    title: module.name,
    url: module.route,
    icon: iconMap[module.icon] || Settings,
    isActive: false,
    badge: module.minPlan !== 'standard' ? planBadgeMap[module.minPlan] : null,
    requiredPlan: module.minPlan
  }));
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