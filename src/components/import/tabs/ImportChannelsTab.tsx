/**
 * ImportChannelsTab — Extracted from ImportHub for maintainability
 * Displays connected stores and marketplaces with sync controls
 */
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, Globe, Plus, Wifi, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { cn } from '@/lib/utils';

const platformLogos: Record<string, string> = {
  shopify: '🛍️', woocommerce: '🛒', prestashop: '🏪', magento: '🧲',
  amazon: '📦', ebay: '🏷️', etsy: '🎨', google: '🔍',
  facebook: '📘', tiktok: '🎵', cdiscount: '🔴', fnac: '📀', default: '🌐'
};

interface ChannelConnection {
  id: string;
  platform_type: string;
  platform_name: string;
  shop_domain?: string;
  products_synced: number;
  orders_synced: number;
  last_sync_at?: string;
  connection_status: string;
}

interface ImportChannelsTabProps {
  storeConnections: ChannelConnection[];
  marketplaceConnections: ChannelConnection[];
  onSyncChannel: (id: string) => void;
  isSyncing: boolean;
}

function ConnectionCard({ connection, onSync, isSyncing }: { connection: ChannelConnection; onSync: (id: string) => void; isSyncing: boolean }) {
  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">
              {platformLogos[connection.platform_type?.toLowerCase()] || platformLogos.default}
            </div>
            <div>
              <p className="font-semibold">{connection.platform_name}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                {connection.shop_domain || 'Non configuré'}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <Wifi className="w-3 h-3 mr-1" />
            Connecté
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold">{connection.products_synced}</p>
            <p className="text-xs text-muted-foreground">Produits</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold">{connection.orders_synced}</p>
            <p className="text-xs text-muted-foreground">Commandes</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Sync: {connection.last_sync_at ? formatDistanceToNow(new Date(connection.last_sync_at), { addSuffix: true, locale: getDateFnsLocale() }) : 'Jamais'}
          </span>
          <Button variant="ghost" size="sm" onClick={() => onSync(connection.id)} disabled={isSyncing}>
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ type, onAdd }: { type: 'store' | 'marketplace'; onAdd: () => void }) {
  const Icon = type === 'store' ? Store : Globe;
  const label = type === 'store' ? 'boutique' : 'marketplace';
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Aucune {label} connectée</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
          {type === 'store'
            ? 'Connectez votre boutique Shopify, WooCommerce ou PrestaShop pour synchroniser vos produits'
            : 'Connectez Amazon, eBay, Etsy ou d\'autres marketplaces pour élargir votre audience'}
        </p>
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Connecter une {label}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ImportChannelsTab({ storeConnections, marketplaceConnections, onSyncChannel, isSyncing }: ImportChannelsTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Boutiques */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Store className="w-5 h-5" />
              Boutiques connectées
            </h2>
            <p className="text-sm text-muted-foreground">Synchronisez vos produits avec vos boutiques e-commerce</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/stores')}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une boutique
          </Button>
        </div>
        {storeConnections.length === 0 ? (
          <EmptyState type="store" onAdd={() => navigate('/stores')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storeConnections.map((store) => (
              <ConnectionCard key={store.id} connection={store} onSync={onSyncChannel} isSyncing={isSyncing} />
            ))}
          </div>
        )}
      </div>

      {/* Marketplaces */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Marketplaces connectées
            </h2>
            <p className="text-sm text-muted-foreground">Publiez vos produits sur les principales marketplaces</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/stores?tab=marketplaces')}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une marketplace
          </Button>
        </div>
        {marketplaceConnections.length === 0 ? (
          <EmptyState type="marketplace" onAdd={() => navigate('/stores?tab=marketplaces')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketplaceConnections.map((mp) => (
              <ConnectionCard key={mp.id} connection={mp} onSync={onSyncChannel} isSyncing={isSyncing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
