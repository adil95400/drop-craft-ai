import { 
  Home, Bot, BarChart3, Package, ShoppingCart, Users, Truck, Settings, 
  Megaphone, Shield, FileText, Zap, ChevronRight, Smartphone, Puzzle, 
  Globe, HelpCircle, Target, TrendingUp, Activity, PlusCircle, RefreshCw, 
  Link as LinkIcon, Crown, Calendar, Mail, MessageSquare, Camera, 
  Phone, Sparkles, Flame
} from "lucide-react";

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

export interface QuickAction {
  title: string;
  icon: any;
  action: string;
  variant: "default" | "secondary" | "outline" | "ghost" | "destructive";
  shortcut?: string;
  badge?: string;
  description?: string;
}

// Configuration centralisée de la navigation
export const navigationConfig: NavItem[] = [
  {
    title: "Tableaux de Bord",
    icon: BarChart3,
    category: "core",
    badge: { text: "Pro", variant: "default" },
    items: [
      { 
        title: "Vue d'ensemble", 
        url: "/dashboard", 
        icon: Home, 
        badge: { text: "Live", variant: "secondary" },
        description: "Dashboard principal avec métriques temps réel"
      },
      { 
        title: "Analytics Pro", 
        url: "/analytics", 
        icon: TrendingUp, 
        badge: { text: "Hot", variant: "destructive" },
        description: "Analytics avancées avec IA"
      },
      { 
        title: "Analytics Ultra Pro", 
        url: "/analytics-ultra-pro", 
        icon: Bot, 
        badge: { text: "AI", variant: "secondary" },
        description: "Intelligence artificielle pour analytics"
      },
    ]
  },
  {
    title: "E-commerce Pro",
    icon: ShoppingCart,
    category: "core",
    badge: { text: "847", variant: "outline" },
    items: [
      {
        title: "Catalogue Ultra Pro",
        url: "/catalogue-ultra-pro",
        icon: Package,
        badge: { text: "847", variant: "outline" },
        description: "Gestion complète du catalogue"
      },
      {
        title: "Commandes",
        url: "/orders",
        icon: ShoppingCart,
        badge: { text: "24", variant: "destructive" },
        status: "active",
        description: "Commandes en temps réel"
      },
      {
        title: "Inventaire Pro",
        url: "/inventory-ultra-pro",
        icon: Package,
        badge: { text: "Sync", variant: "secondary" },
        status: "syncing",
        description: "Synchronisation automatique"
      },
      {
        title: "Stock Ultra",
        url: "/stock-ultra-pro",
        icon: Activity,
        badge: { text: "Low", variant: "destructive" },
        status: "warning",
        description: "Gestion avancée du stock"
      },
      {
        title: "Fournisseurs Pro",
        url: "/suppliers-ultra-pro",
        icon: Truck,
        badge: { text: "API", variant: "outline" },
        status: "connected",
        description: "Hub fournisseurs avec API"
      }
    ]
  },
  {
    title: "CRM & Marketing Ultra",
    icon: Users,
    category: "advanced",
    badge: { text: "Hot", variant: "destructive" },
    items: [
      {
        title: "CRM Ultra Pro",
        url: "/crm-ultra-pro",
        icon: Users,
        badge: { text: "156", variant: "outline" },
        description: "CRM intelligent avec IA"
      },
      {
        title: "Prospects Pro",
        url: "/crm-prospects-ultra-pro",
        icon: Target,
        badge: { text: "AI", variant: "secondary" },
        description: "Génération de leads automatisée"
      },
      {
        title: "Marketing Ultra",
        url: "/marketing-ultra-pro",
        icon: Megaphone,
        badge: { text: "Auto", variant: "default" },
        description: "Campagnes automatisées"
      }
    ]
  },
  {
    title: "IA & Automatisation",
    icon: Bot,
    category: "advanced",
    badge: { text: "Ultra", variant: "default" },
    items: [
      { 
        title: "Assistant IA", 
        url: "/ai", 
        icon: Bot, 
        badge: { text: "New", variant: "default" },
        status: "new",
        description: "Assistant IA personnalisé"
      },
      { 
        title: "Automatisation Pro", 
        url: "/automation-ultra-pro", 
        icon: Zap, 
        badge: { text: "Pro", variant: "secondary" },
        description: "Workflows intelligents"
      },
    ]
  },
  {
    title: "Extensions & Intégrations",
    icon: Smartphone,
    category: "tools",
    items: [
      { 
        title: "Extension Pro", 
        url: "/extension-ultra-pro", 
        icon: Puzzle,
        description: "Extension navigateur pro"
      },
      { 
        title: "Mobile Pro", 
        url: "/mobile-ultra-pro", 
        icon: Smartphone,
        description: "Application mobile"
      },
      { 
        title: "Plugins Pro", 
        url: "/plugins-ultra-pro", 
        icon: Puzzle,
        description: "Plugins personnalisés"
      },
      { 
        title: "Intégrations API", 
        url: "/integrations", 
        icon: LinkIcon, 
        badge: { text: "API", variant: "secondary" },
        description: "Hub d'intégrations"
      }
    ]
  },
  {
    title: "Support & Outils",
    icon: HelpCircle,
    category: "support",
    items: [
      { 
        title: "Support Pro", 
        url: "/support-ultra-pro", 
        icon: HelpCircle,
        description: "Support technique avancé"
      },
      { 
        title: "SEO Ultra Pro", 
        url: "/seo-ultra-pro", 
        icon: Globe,
        description: "Optimisation SEO intelligente"
      },
      { 
        title: "Blog Ultra Pro", 
        url: "/blog-ultra-pro", 
        icon: FileText,
        description: "Création de contenu IA"
      },
      { 
        title: "Sécurité Pro", 
        url: "/security-ultra-pro", 
        icon: Shield,
        description: "Sécurité et conformité"
      }
    ]
  }
];

// Actions rapides avec raccourcis clavier
export const quickActionsConfig: QuickAction[] = [
  { 
    title: "IA Assistant", 
    icon: Bot, 
    action: "ai-assistant",
    variant: "default",
    shortcut: "⌘+I",
    badge: "AI",
    description: "Ouvrir l'assistant IA"
  },
  { 
    title: "Nouveau Produit", 
    icon: PlusCircle, 
    action: "catalogue-ultra-pro?action=add",
    variant: "secondary",
    shortcut: "⌘+N",
    description: "Ajouter un nouveau produit"
  },
  { 
    title: "Analytics Live", 
    icon: TrendingUp, 
    action: "analytics-ultra-pro",
    variant: "outline",
    shortcut: "⌘+A",
    badge: "Live",
    description: "Voir les analytics en temps réel"
  },
  { 
    title: "Support Rapide", 
    icon: HelpCircle, 
    action: "support-ultra-pro",
    variant: "ghost",
    shortcut: "⌘+?",
    description: "Accès rapide au support"
  },
  { 
    title: "Synchroniser", 
    icon: RefreshCw, 
    action: "sync",
    variant: "outline",
    shortcut: "⌘+R",
    description: "Synchroniser les données"
  },
];

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
  email: "pro@shopopti.com"
};

// Configuration des groupes par défaut (ouverts/fermés)
export const defaultGroupStates = {
  "Tableaux de Bord": true,
  "E-commerce Pro": true,
  "CRM & Marketing Ultra": false,
  "IA & Automatisation": false,
  "Extensions & Intégrations": false,
  "Support & Outils": false
};

// Configuration des animations et transitions
export const animationConfig = {
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
  ease: {
    smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    elastic: "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  }
};