/**
 * Navigation Constants - Externalized static constants for optimal performance
 * These constants are defined outside components to prevent recreation on every render
 */
import { 
  Home, Package, Store, ShoppingCart, BarChart3, Settings, Upload,
  Truck, Zap, Sparkles, Users, Brain, Shield, Plug, Rss,
  TrendingUp, Megaphone, Tag, CheckCircle, GitCompare, Workflow,
  Calculator, HelpCircle, GraduationCap, Video, Layers, RefreshCw,
  Clock, Activity, Database, Target, Mail, Bot, Globe, Wrench,
  LayoutDashboard, PackageCheck, Bell, Eye, Trophy, FileEdit, Search,
  Star, Lock, Crown, User, CreditCard, Receipt, Key, FlaskConical,
  BookmarkCheck, AlertCircle, Image, FolderTree, HeartPulse, Contact,
  Code, Stethoscope
} from "lucide-react"
import type { NavGroupId } from "@/config/modules"

// Static icon map - externalized to prevent recreation on every render
export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'Home': Home, 
  'LayoutDashboard': LayoutDashboard, 
  'Store': Store, 
  'Package': Package,
  'Upload': Upload, 
  'Truck': Truck, 
  'ShoppingCart': ShoppingCart, 
  'BarChart3': BarChart3,
  'Settings': Settings, 
  'Zap': Zap, 
  'Sparkles': Sparkles, 
  'Search': Search,
  'Link': Database, 
  'History': Clock, 
  'RefreshCw': RefreshCw, 
  'Layers': Layers,
  'Users': Users, 
  'Boxes': Package, 
  'Star': Star, 
  'Eye': Eye, 
  'GitBranch': GitCompare,
  'CheckCircle': CheckCircle, 
  'Bell': Bell, 
  'TrendingUp': TrendingUp,
  'Megaphone': Megaphone, 
  'Tag': Tag, 
  'Mail': Mail, 
  'FileText': FileEdit,
  'Rss': Rss, 
  'PackageCheck': PackageCheck, 
  'Plug': Plug, 
  'Puzzle': Plug,
  'PuzzlePiece': Plug, 
  'GraduationCap': GraduationCap, 
  'HelpCircle': HelpCircle,
  'Video': Video, 
  'Shield': Shield, 
  'Crown': Crown, 
  'Brain': Brain, 
  'Lock': Lock,
  'Workflow': Workflow, 
  'Bot': Bot, 
  'Calculator': Calculator, 
  'Globe': Globe,
  'Database': Database, 
  'Activity': Activity, 
  'Target': Target, 
  'Clock': Clock,
  'Trophy': Trophy, 
  'Wrench': Wrench, 
  'FileEdit': FileEdit, 
  'Plus': Zap, 
  'Wand2': Sparkles,
  'DollarSign': TrendingUp, 
  'Book': GraduationCap, 
  'RotateCcw': RefreshCw,
  'User': User,
  'CreditCard': CreditCard,
  'Receipt': Receipt,
  'Key': Key,
  'FlaskConical': FlaskConical,
  'BookmarkCheck': BookmarkCheck,
  'AlertCircle': AlertCircle,
  'Image': Image,
  'FolderTree': FolderTree,
  'HeartPulse': HeartPulse,
  'Contact': Contact,
  'Code': Code,
  'Stethoscope': Stethoscope,
} as const

// Static group colors - 6 groupes consolidés
export const GROUP_COLORS: Partial<Record<NavGroupId, { 
  bg: string
  text: string
  accent: string
  border: string
  icon: string
  gradient: string 
}>> = {
  home: { 
    bg: 'bg-blue-500/8', 
    text: 'text-blue-600 dark:text-blue-400', 
    accent: 'hover:bg-blue-500/12', 
    border: 'border-blue-500/20',
    icon: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-500'
  },
  catalog: { 
    bg: 'bg-emerald-500/8', 
    text: 'text-emerald-600 dark:text-emerald-400', 
    accent: 'hover:bg-emerald-500/12', 
    border: 'border-emerald-500/20',
    icon: 'text-emerald-500',
    gradient: 'from-emerald-500 to-teal-500'
  },
  sourcing: { 
    bg: 'bg-violet-500/8', 
    text: 'text-violet-600 dark:text-violet-400', 
    accent: 'hover:bg-violet-500/12', 
    border: 'border-violet-500/20',
    icon: 'text-violet-500',
    gradient: 'from-violet-500 to-purple-500'
  },
  sales: { 
    bg: 'bg-orange-500/8', 
    text: 'text-orange-600 dark:text-orange-400', 
    accent: 'hover:bg-orange-500/12', 
    border: 'border-orange-500/20',
    icon: 'text-orange-500',
    gradient: 'from-orange-500 to-amber-500'
  },
  performance: { 
    bg: 'bg-cyan-500/8', 
    text: 'text-cyan-600 dark:text-cyan-400', 
    accent: 'hover:bg-cyan-500/12', 
    border: 'border-cyan-500/20',
    icon: 'text-cyan-500',
    gradient: 'from-cyan-500 to-blue-500'
  },
  config: { 
    bg: 'bg-slate-500/8', 
    text: 'text-slate-600 dark:text-slate-400', 
    accent: 'hover:bg-slate-500/12', 
    border: 'border-slate-500/20',
    icon: 'text-slate-500',
    gradient: 'from-slate-500 to-zinc-500'
  },
} as const

// Route labels for breadcrumbs
export const ROUTE_LABELS: Record<string, string> = {
  'dashboard': 'Dashboard',
  'products': 'Produits',
  'orders': 'Commandes',
  'stores-channels': 'Boutiques',
  'analytics': 'Analytics',
  'settings': 'Paramètres',
  'import': 'Import',
  'autods': 'Import Rapide',
  'feeds': 'Feeds',
  'ai': 'Intelligence IA',
  'pricing': 'Tarification',
  'pricing/rules': 'Règles de Prix',
  'pricing/repricing': 'Repricing Auto',
  'pricing/monitoring': 'Veille Prix',
  'pricing/optimization': 'Optimisation IA',
  'fulfillment': 'Fulfillment',
  'suppliers': 'Fournisseurs',
  'audit': 'Qualité & Audit',
  'research': 'Veille',
  'crm': 'CRM',
  'integrations': 'Intégrations',
  'marketing': 'Marketing',
} as const

// Quick navigation tabs
export const QUICK_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, route: '/dashboard', gradient: 'from-blue-500 to-cyan-500', iconColor: 'text-blue-500' },
  { id: 'products', label: 'Produits', icon: Package, route: '/products', gradient: 'from-emerald-500 to-teal-500', iconColor: 'text-emerald-500' },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart, route: '/orders', gradient: 'from-amber-500 to-orange-500', iconColor: 'text-amber-500' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, route: '/analytics', gradient: 'from-violet-500 to-purple-500', iconColor: 'text-violet-500' },
  { id: 'stores', label: 'Boutiques', icon: Store, route: '/stores-channels', gradient: 'from-rose-500 to-pink-500', iconColor: 'text-rose-500' },
] as const

// Badge styles for modules
export const BADGE_STYLES = {
  pro: "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border-amber-500/30",
  new: "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 border-emerald-500/30",
  beta: "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 border-blue-500/30",
  ultra: "bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 border-violet-500/30",
} as const

// Notification type styles
export const NOTIFICATION_STYLES = {
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500' },
  info: { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500' },
} as const

// Plan styles for user menu
export const PLAN_STYLES: Record<string, { gradient: string; badge: string }> = {
  'ultra_pro': { 
    gradient: 'from-amber-500 to-orange-500', 
    badge: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border-amber-500/30' 
  },
  'pro': { 
    gradient: 'from-violet-500 to-purple-500', 
    badge: 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 border-violet-500/30' 
  },
  'standard': { 
    gradient: 'from-slate-500 to-zinc-500', 
    badge: 'bg-muted text-muted-foreground' 
  },
} as const
