/**
 * Reusable Empty State component
 * Supports presets for common empty states across the app
 */
import { Button } from "@/components/ui/button";
import { Package, Plus, Search, AlertCircle, ShoppingCart, Users, BarChart3, Inbox, Zap, FileText, type LucideIcon } from "lucide-react";
import { memo, type ReactNode } from "react";

type EmptyPreset = 'products' | 'orders' | 'customers' | 'analytics' | 'search' | 'inbox' | 'automation' | 'documents';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  type?: "default" | "search" | "error" | "create";
  /** Use a preset for quick empty states */
  preset?: EmptyPreset;
  children?: ReactNode;
}

const PRESETS: Record<EmptyPreset, { icon: LucideIcon; title: string; desc: string }> = {
  products: { icon: Package, title: 'Aucun produit', desc: 'Commencez par importer vos premiers produits.' },
  orders: { icon: ShoppingCart, title: 'Aucune commande', desc: 'Les commandes apparaîtront ici.' },
  customers: { icon: Users, title: 'Aucun client', desc: 'Vos clients apparaîtront ici.' },
  analytics: { icon: BarChart3, title: 'Pas encore de données', desc: 'Les analytics s\'afficheront après vos premières ventes.' },
  search: { icon: Search, title: 'Aucun résultat', desc: 'Essayez de modifier vos filtres ou votre recherche.' },
  inbox: { icon: Inbox, title: 'Boîte vide', desc: 'Rien à traiter pour le moment.' },
  automation: { icon: Zap, title: 'Aucun workflow', desc: 'Créez votre premier workflow automatisé.' },
  documents: { icon: FileText, title: 'Aucun document', desc: 'Vos documents apparaîtront ici.' },
};

export const EmptyState = memo(function EmptyState({
  icon,
  title,
  description,
  action,
  type = "default",
  preset,
  children
}: EmptyStateProps) {
  const presetData = preset ? PRESETS[preset] : null;

  const getDefaultIcon = () => {
    if (presetData) {
      const PresetIcon = presetData.icon;
      return <PresetIcon className="h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />;
    }
    switch (type) {
      case "search": return <Search className="h-12 w-12 text-muted-foreground" />;
      case "error": return <AlertCircle className="h-12 w-12 text-destructive" />;
      case "create": return <Plus className="h-12 w-12 text-muted-foreground" />;
      default: return <Package className="h-12 w-12 text-muted-foreground" />;
    }
  };

  const displayTitle = title || presetData?.title || 'Rien ici';
  const displayDesc = description || presetData?.desc || '';

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 animate-fade-in">
      {/* Decorative glow */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl scale-150" />
        <div className="relative p-5 rounded-full bg-muted/50 border border-border/50">
          {icon || getDefaultIcon()}
        </div>
      </div>
      
      <h3 className="text-lg font-semibold mb-2">{displayTitle}</h3>
      
      {displayDesc && (
        <p className="text-muted-foreground mb-6 max-w-md text-sm">{displayDesc}</p>
      )}
      
      {action && (
        <Button variant={action.variant || 'default'} onClick={action.onClick}>
          {action.label}
        </Button>
      )}

      {children}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';