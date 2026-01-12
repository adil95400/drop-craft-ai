import { useState } from 'react';
import { useUnifiedStores, Store } from '@/hooks/useUnifiedStores';
import { StoreCard } from './StoreCard';
import { StoreStats } from './StoreStats';
import { StoreQuickActions } from './StoreQuickActions';
import { StoreSyncStatus } from './StoreSyncStatus';
import { Button } from '@/components/ui/button';
import { Plus, Grid3x3, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function UnifiedStoreDashboard() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const {
    stores,
    stats,
    isLoading,
    isLoadingStats,
    deleteStore,
    toggleStoreActive,
  } = useUnifiedStores();

  const handleEdit = (store: Store) => {
    navigate(`/stores-channels/${store.id}/settings`);
  };

  const handleDelete = (storeId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette boutique ?')) {
      deleteStore(storeId);
    }
  };

  const handleToggleActive = (storeId: string, isActive: boolean) => {
    toggleStoreActive({ id: storeId, is_active: isActive });
  };

  const handleSyncAll = async () => {
    const activeStores = stores?.filter(s => s.is_active) || [];
    if (activeStores.length === 0) {
      toast.warning('Aucune boutique active à synchroniser');
      return;
    }
    
    toast.info(`Synchronisation de ${activeStores.length} boutique(s)...`);
    
    for (const store of activeStores) {
      await supabase.functions.invoke('advanced-sync', {
        body: { integration_id: store.id, sync_type: 'products' }
      });
    }
    
    toast.success('Synchronisation terminée');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mes Boutiques</h1>
          <p className="text-muted-foreground mt-1">
            Gérez toutes vos boutiques depuis un seul endroit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-accent' : ''}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-accent' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button onClick={() => navigate('/stores-channels/connect')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Boutique
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <StoreStats stats={stats} isLoading={isLoadingStats} />

      {/* Quick Actions */}
      <StoreQuickActions onSync={handleSyncAll} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store Cards */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Vos Boutiques ({stores.length})
          </h2>
          
          {stores.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">Aucune boutique connectée</p>
              <Button onClick={() => navigate('/stores-channels/connect')}>
                <Plus className="h-4 w-4 mr-2" />
                Connecter une boutique
              </Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
              {stores.map((store) => {
                const storeStat = stats.find(s => s.store_id === store.id);
                return (
                  <StoreCard
                    key={store.id}
                    store={store}
                    stats={storeStat}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Sync Status Sidebar */}
        <div className="lg:col-span-1">
          <StoreSyncStatus stats={stats} isLoading={isLoadingStats} />
        </div>
      </div>
    </div>
  );
}
