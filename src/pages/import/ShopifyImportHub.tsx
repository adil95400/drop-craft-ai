import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useShopifyImport } from '@/hooks/useShopifyImport';
import { 
  ShoppingCart, Package, Upload, RefreshCw, CheckCircle, XCircle, Clock, Link2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function ShopifyImportHub() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const {
    mappings, isLoadingMappings, importJobs, isLoadingJobs, importHistory,
    importSingle, isImportingSingle, importBulk, isImportingBulk, syncMapping, isSyncing
  } = useShopifyImport();

  const handleImportSelected = () => {
    if (selectedProducts.length === 0) return;
    if (selectedProducts.length === 1) {
      importSingle(selectedProducts[0]);
    } else {
      importBulk({ productIds: selectedProducts, settings: { skip_existing: true } });
    }
    setSelectedProducts([]);
  };

  const stats = {
    totalMapped: mappings?.length || 0,
    activeJobs: importJobs?.filter(j => j.status === 'processing').length || 0,
    successToday: importHistory?.filter((h: any) => 
      h.status === 'success' && new Date(h.created_at).toDateString() === new Date().toDateString()
    ).length || 0
  };

  return (
    <>
      <Helmet>
        <title>Import vers Shopify - ShopOpti</title>
        <meta name="description" content="Importez vos produits fournisseurs vers Shopify en 1 clic avec synchronisation automatique" />
      </Helmet>

      <ChannablePageWrapper
        title="Import vers Shopify"
        description={`${stats.totalMapped} produits mappés • ${stats.activeJobs} jobs actifs • ${stats.successToday} imports aujourd'hui`}
        heroImage="import"
        badge={{ label: 'Shopify', icon: ShoppingCart }}
      >
        <Tabs defaultValue="mappings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mappings"><Link2 className="w-4 h-4 mr-2" />Mappings</TabsTrigger>
            <TabsTrigger value="jobs"><Upload className="w-4 h-4 mr-2" />Jobs d'import</TabsTrigger>
            <TabsTrigger value="history"><Package className="w-4 h-4 mr-2" />Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="mappings" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Produits mappés</h2>
                {selectedProducts.length > 0 && (
                  <Button onClick={handleImportSelected} disabled={isImportingSingle || isImportingBulk}>
                    <Upload className="w-4 h-4 mr-2" />Importer ({selectedProducts.length})
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {isLoadingMappings ? (
                    <p className="text-center text-muted-foreground">Chargement...</p>
                  ) : mappings && mappings.length > 0 ? (
                    mappings.map((mapping: any) => (
                      <Card key={mapping.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{mapping.supplier_products?.name || 'Produit inconnu'}</h3>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant={mapping.mapping_status === 'mapped' ? 'default' : mapping.mapping_status === 'failed' ? 'destructive' : 'outline'}>
                                {mapping.mapping_status}
                              </Badge>
                              {mapping.shopify_product_id && <span className="text-xs text-muted-foreground">Shopify ID: {mapping.shopify_product_id}</span>}
                              {mapping.last_synced_at && <span className="text-xs text-muted-foreground">Sync: {new Date(mapping.last_synced_at).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => syncMapping(mapping.id)} disabled={isSyncing}>
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucun produit mappé</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Jobs d'import en cours</h2>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {isLoadingJobs ? (
                    <p className="text-center text-muted-foreground">Chargement...</p>
                  ) : importJobs && importJobs.length > 0 ? (
                    importJobs.map((job) => (
                      <Card key={job.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{job.job_type === 'bulk' ? 'Import groupé' : 'Import unique'}</h3>
                              <p className="text-sm text-muted-foreground">{new Date(job.created_at).toLocaleString()}</p>
                            </div>
                            <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'outline'}>{job.status}</Badge>
                          </div>
                          {job.status === 'processing' && (
                            <div className="space-y-2">
                              <Progress value={((job.successful_imports || 0) / Math.max(job.total_products || 1, 1)) * 100} />
                              <p className="text-sm text-muted-foreground">{job.successful_imports || 0} / {job.total_products || 0} produits</p>
                            </div>
                          )}
                          {job.status === 'completed' && (
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" />{job.successful_imports} réussis</span>
                              {job.failed_imports > 0 && <span className="flex items-center gap-1 text-destructive"><XCircle className="w-4 h-4" />{job.failed_imports} échecs</span>}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Upload className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucun job d'import</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Historique des imports</h2>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {importHistory && importHistory.length > 0 ? (
                    importHistory.map((entry: any) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {entry.status === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : entry.status === 'failed' ? <XCircle className="w-5 h-5 text-destructive" /> : <Clock className="w-5 h-5 text-muted-foreground" />}
                          <div>
                            <p className="font-medium">{entry.supplier_products?.name || 'Produit inconnu'}</p>
                            <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <Badge variant={entry.action_type === 'create' ? 'default' : entry.action_type === 'update' ? 'secondary' : 'outline'}>{entry.action_type}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucun historique</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
