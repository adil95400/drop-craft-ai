import { Store, StoreStats } from '@/hooks/useUnifiedStores';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Store as StoreIcon, Globe, CheckCircle2, XCircle, Settings, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface StoreCardProps {
  store: Store;
  stats?: StoreStats;
  onEdit: (store: Store) => void;
  onDelete: (storeId: string) => void;
  onToggleActive: (storeId: string, isActive: boolean) => void;
}

export function StoreCard({ store, stats, onEdit, onDelete, onToggleActive }: StoreCardProps) {
  const platformName = store.settings?.platform || 'Store';
  
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={store.logo_url || undefined} alt={store.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <StoreIcon className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{store.name}</h3>
              {store.is_main && (
                <Badge variant="secondary" className="text-xs">Principal</Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Globe className="h-3 w-3" />
              <span>{store.domain || 'Aucun domaine'}</span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(store)}>
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleActive(store.id, !store.is_active)}>
              {store.is_active ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Désactiver
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Activer
                </>
              )}
            </DropdownMenuItem>
            {!store.is_main && (
              <DropdownMenuItem 
                onClick={() => onDelete(store.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Statut</span>
          {store.is_active ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Actif
            </Badge>
          ) : (
            <Badge variant="secondary">
              <XCircle className="h-3 w-3 mr-1" />
              Inactif
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Plateforme</span>
          <Badge variant="outline">{platformName}</Badge>
        </div>

        {stats && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Intégrations</span>
              <span className="font-medium text-foreground">
                {stats.active_integrations}/{stats.total_integrations}
              </span>
            </div>

            {stats.integrations_summary.length > 0 && (
              <div className="pt-2 border-t">
                <div className="flex flex-wrap gap-1">
                  {stats.integrations_summary.map((int, idx) => (
                    <Badge 
                      key={idx} 
                      variant={int.status === 'connected' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {int.platform}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <span className="text-muted-foreground">Localisation</span>
          <span className="text-foreground">{store.country} • {store.currency}</span>
        </div>
      </div>
    </Card>
  );
}
