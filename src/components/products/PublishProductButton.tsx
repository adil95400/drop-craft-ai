import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePublishProducts } from '@/hooks/usePublishProducts';
import {
  Upload,
  RefreshCw,
  Archive,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PublishProductButtonProps {
  productId: string;
  isPublished: boolean;
  syncStatus?: 'pending' | 'synced' | 'error' | 'outdated' | null;
  compact?: boolean;
}

const syncStatusConfig = {
  pending: {
    label: 'En attente',
    icon: Clock,
    variant: 'secondary' as const,
  },
  synced: {
    label: 'Synchronisé',
    icon: CheckCircle2,
    variant: 'default' as const,
  },
  error: {
    label: 'Erreur',
    icon: AlertCircle,
    variant: 'destructive' as const,
  },
  outdated: {
    label: 'Obsolète',
    icon: AlertCircle,
    variant: 'outline' as const,
  },
};

export function PublishProductButton({
  productId,
  isPublished,
  syncStatus,
  compact = false,
}: PublishProductButtonProps) {
  const {
    publishProduct,
    syncStock,
    unpublishProduct,
    isPublishing,
    isSyncing,
    isUnpublishing,
  } = usePublishProducts();

  const isLoading = isPublishing || isSyncing || isUnpublishing;

  if (compact) {
    return (
      <Button
        size="sm"
        variant={isPublished ? 'outline' : 'default'}
        onClick={() => publishProduct(productId)}
        disabled={isLoading}
      >
        {isPublished ? (
          <>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Publié
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-1" />
            Publier
          </>
        )}
      </Button>
    );
  }

  if (!isPublished) {
    return (
      <Button
        onClick={() => publishProduct(productId)}
        disabled={isLoading}
        size="sm"
      >
        <Upload className="h-4 w-4 mr-2" />
        Publier au catalogue
      </Button>
    );
  }

  const statusInfo = syncStatus ? syncStatusConfig[syncStatus] : null;
  const StatusIcon = statusInfo?.icon || CheckCircle2;

  return (
    <div className="flex items-center gap-2">
      {statusInfo && (
        <Badge variant={statusInfo.variant}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusInfo.label}
        </Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isLoading}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Publié
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => syncStock(productId, 0)}
            disabled={isSyncing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Synchroniser le stock
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => publishProduct(productId)}
            disabled={isPublishing}
          >
            <Upload className="h-4 w-4 mr-2" />
            Republier (mise à jour)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => unpublishProduct(productId)}
            disabled={isUnpublishing}
            className="text-destructive"
          >
            <Archive className="h-4 w-4 mr-2" />
            Dépublier
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
