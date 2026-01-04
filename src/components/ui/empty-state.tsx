import { LucideIcon, Package, Users, ShoppingCart, Inbox, Search, Database, FolderOpen, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon: Icon = Inbox, 
  title, 
  description, 
  action, 
  secondaryAction,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-md">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex gap-2">
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Preset empty states for common use cases
export function EmptyProducts({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="Aucun produit"
      description="Commencez par ajouter votre premier produit à votre catalogue"
      action={onAdd ? { label: 'Ajouter un produit', onClick: onAdd } : undefined}
    />
  );
}

export function EmptyCustomers({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="Aucun client"
      description="Vos clients apparaîtront ici une fois qu'ils auront passé une commande"
      action={onAdd ? { label: 'Ajouter un client', onClick: onAdd } : undefined}
    />
  );
}

export function EmptyOrders() {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="Aucune commande"
      description="Les commandes de vos clients apparaîtront ici"
    />
  );
}

export function EmptyReturns({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={RotateCcw}
      title="Aucun retour"
      description="Les demandes de retour apparaîtront ici"
      action={onAdd ? { label: 'Créer un retour', onClick: onAdd } : undefined}
    />
  );
}

export function EmptySearchResults({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="Aucun résultat"
      description={query ? `Aucun résultat pour "${query}"` : 'Essayez de modifier vos critères de recherche'}
      action={onClear ? { label: 'Effacer la recherche', onClick: onClear } : undefined}
    />
  );
}

export function EmptyData({ title = 'Aucune donnée', description }: { title?: string; description?: string }) {
  return (
    <EmptyState
      icon={Database}
      title={title}
      description={description || 'Aucune donnée à afficher pour le moment'}
    />
  );
}

export function EmptyFolder({ title = 'Dossier vide' }: { title?: string }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title={title}
      description="Ce dossier ne contient aucun élément"
    />
  );
}
