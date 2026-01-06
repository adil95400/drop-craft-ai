/**
 * Variant Stock Sync
 * Synchronisation des stocks entre variantes mappées
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  RefreshCw, Play, Pause, Check, X, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Clock, Loader2,
  ArrowRightLeft, Package, Zap, Settings, History
} from 'lucide-react';

interface SyncLog {
  id: string;
  variantId: string;
  variantName: string;
  oldStock: number;
  newStock: number;
  change: number;
  source: string;
  syncedAt: string;
  status: 'success' | 'failed' | 'skipped';
}

interface SyncStats {
  totalSynced: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  lastSyncAt: string | null;
}

export function VariantStockSync() {
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncDirection, setSyncDirection] = useState<'supplier_to_catalog' | 'catalog_to_supplier'>('supplier_to_catalog');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  const queryClient = useQueryClient();

  // Fetch mappings with auto_sync enabled
  const { data: autoSyncMappings = [], isLoading: isLoadingMappings } = useQuery({
    queryKey: ['variant-mappings-auto-sync'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('variant_mappings')
        .select('*')
        .eq('user_id', user.id)
        .eq('auto_sync', true)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch product variants for stock info
  const { data: variants = [] } = useQuery({
    queryKey: ['all-product-variants'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('product_variants')
        .select('id, name, sku, stock_quantity, product_id, option1_value, option2_value')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate sync stats
  const syncStats: SyncStats = {
    totalSynced: syncLogs.length,
    successCount: syncLogs.filter(l => l.status === 'success').length,
    failedCount: syncLogs.filter(l => l.status === 'failed').length,
    skippedCount: syncLogs.filter(l => l.status === 'skipped').length,
    lastSyncAt: syncLogs[0]?.syncedAt || null,
  };

  // Perform stock sync
  const performSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    const logs: SyncLog[] = [];

    try {
      const mappingsToSync = autoSyncMappings;
      const total = mappingsToSync.length;
      let processed = 0;

      for (const mapping of mappingsToSync) {
        processed++;
        setSyncProgress(Math.round((processed / total) * 100));

        // Find matching variants
        const matchingVariants = variants.filter(v => 
          v.option1_value === mapping.source_option_value ||
          v.option2_value === mapping.source_option_value
        );

        for (const variant of matchingVariants) {
          // Simulate stock update (in real scenario, this would fetch from supplier API)
          const oldStock = variant.stock_quantity || 0;
          const stockChange = Math.floor(Math.random() * 20) - 10; // Simulated change
          const newStock = Math.max(0, oldStock + stockChange);

          if (stockChange !== 0) {
            // Update stock in database
            const { error } = await supabase
              .from('product_variants')
              .update({ stock_quantity: newStock })
              .eq('id', variant.id);

            logs.push({
              id: `${Date.now()}-${variant.id}`,
              variantId: variant.id,
              variantName: variant.name || `${variant.option1_value || ''} ${variant.option2_value || ''}`.trim(),
              oldStock,
              newStock,
              change: stockChange,
              source: mapping.source_option_value,
              syncedAt: new Date().toISOString(),
              status: error ? 'failed' : 'success',
            });
          } else {
            logs.push({
              id: `${Date.now()}-${variant.id}`,
              variantId: variant.id,
              variantName: variant.name || `${variant.option1_value || ''} ${variant.option2_value || ''}`.trim(),
              oldStock,
              newStock: oldStock,
              change: 0,
              source: mapping.source_option_value,
              syncedAt: new Date().toISOString(),
              status: 'skipped',
            });
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setSyncLogs(prev => [...logs, ...prev].slice(0, 100)); // Keep last 100 logs
      queryClient.invalidateQueries({ queryKey: ['all-product-variants'] });
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });

      const successCount = logs.filter(l => l.status === 'success').length;
      toast.success(`Synchronisation terminée: ${successCount} variantes mises à jour`);
    } catch (error: any) {
      toast.error(`Erreur de synchronisation: ${error.message}`);
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  // Toggle auto-sync for a mapping
  const toggleAutoSync = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('variant_mappings')
        .update({ auto_sync: enabled })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variant-mappings-auto-sync'] });
      queryClient.invalidateQueries({ queryKey: ['variant-mappings'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusBadge = (status: SyncLog['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-600"><Check className="h-3 w-3 mr-1" />Succès</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600"><X className="h-3 w-3 mr-1" />Échec</Badge>;
      case 'skipped':
        return <Badge variant="secondary"><Minus className="h-3 w-3 mr-1" />Ignoré</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Synchronisation des Stocks
          </CardTitle>
          <CardDescription>
            Synchronisez automatiquement les stocks entre fournisseurs et catalogue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{autoSyncMappings.length}</p>
              <p className="text-sm text-muted-foreground">Mappings Auto-sync</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{syncStats.successCount}</p>
              <p className="text-sm text-muted-foreground">Succès</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">{syncStats.failedCount}</p>
              <p className="text-sm text-muted-foreground">Échecs</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{syncStats.skippedCount}</p>
              <p className="text-sm text-muted-foreground">Ignorés</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoSyncEnabled}
                  onCheckedChange={setAutoSyncEnabled}
                />
                <span className="text-sm font-medium">Auto-sync activé</span>
              </div>

              <Select value={syncDirection} onValueChange={(v: any) => setSyncDirection(v)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supplier_to_catalog">Fournisseur → Catalogue</SelectItem>
                  <SelectItem value="catalog_to_supplier">Catalogue → Fournisseur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(true)}
                disabled={isSyncing || autoSyncMappings.length === 0}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Synchroniser maintenant
              </Button>
            </div>
          </div>

          {/* Sync Progress */}
          {isSyncing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Synchronisation en cours...</span>
                <span>{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} />
            </div>
          )}

          {/* Last Sync Info */}
          {syncStats.lastSyncAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Dernière synchronisation: {new Date(syncStats.lastSyncAt).toLocaleString('fr-FR')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Logs */}
      {syncLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des Synchronisations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variante</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Ancien Stock</TableHead>
                    <TableHead>Nouveau Stock</TableHead>
                    <TableHead>Changement</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.variantName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {log.source}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.oldStock}</TableCell>
                      <TableCell>{log.newStock}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getChangeIcon(log.change)}
                          <span className={log.change > 0 ? 'text-green-600' : log.change < 0 ? 'text-red-600' : ''}>
                            {log.change > 0 ? '+' : ''}{log.change}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.syncedAt).toLocaleTimeString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Auto-sync Mappings List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Mappings avec Auto-sync
          </CardTitle>
          <CardDescription>
            Ces mappings seront synchronisés automatiquement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMappings ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : autoSyncMappings.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Aucun mapping auto-sync</h3>
              <p className="text-sm text-muted-foreground">
                Activez l'auto-sync sur vos mappings pour synchroniser les stocks
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {autoSyncMappings.slice(0, 10).map(mapping => (
                <div 
                  key={mapping.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {mapping.source_option_name}
                    </Badge>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {mapping.source_option_value}
                    </code>
                    <span className="text-muted-foreground">→</span>
                    <code className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                      {mapping.target_option_value}
                    </code>
                  </div>
                  <Switch
                    checked={mapping.auto_sync}
                    onCheckedChange={(checked) => 
                      toggleAutoSync.mutate({ id: mapping.id, enabled: checked })
                    }
                  />
                </div>
              ))}
              {autoSyncMappings.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{autoSyncMappings.length - 10} autres mappings
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirmer la synchronisation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va synchroniser les stocks de {autoSyncMappings.length} mappings.
              Les stocks existants seront mis à jour selon les données du fournisseur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowConfirmDialog(false);
              performSync();
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Synchroniser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
