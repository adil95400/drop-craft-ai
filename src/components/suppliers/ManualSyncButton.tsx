import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useSupplierSync } from '@/hooks/useSupplierSync';

interface ManualSyncButtonProps {
  supplierId?: string;
  supplierName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showProgress?: boolean;
}

export function ManualSyncButton({ 
  supplierId, 
  supplierName,
  variant = 'outline', 
  size = 'default',
  showProgress = true 
}: ManualSyncButtonProps) {
  const { syncSupplier, syncAllSuppliers, isSyncing, syncProgress } = useSupplierSync();

  const handleSync = async () => {
    if (supplierId) {
      await syncSupplier(supplierId);
    } else {
      await syncAllSuppliers();
    }
  };

  const isSyncingThis = supplierId ? syncProgress?.supplierId === supplierId : isSyncing;

  return (
    <div className="space-y-2">
      <Button 
        variant={variant}
        size={size}
        className="gap-2"
        onClick={handleSync}
        disabled={isSyncing}
      >
        <RefreshCw className={`h-4 w-4 ${isSyncingThis ? 'animate-spin' : ''}`} />
        {isSyncingThis 
          ? 'Synchronisation...' 
          : supplierId 
          ? `Synchroniser ${supplierName || ''}` 
          : 'Synchroniser tous'
        }
      </Button>
      
      {showProgress && isSyncingThis && syncProgress && (
        <div className="text-xs text-muted-foreground">
          {syncProgress.productsImported} produits importés
        </div>
      )}
    </div>
  );
}
