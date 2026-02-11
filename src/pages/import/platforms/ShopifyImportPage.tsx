import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Link, Upload, Search, Store, Package, Zap, CheckCircle2,
  RefreshCw, Download, TrendingUp, ShoppingCart
} from 'lucide-react';
import { useUrlImport } from '@/hooks/useUrlImport';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function ShopifyImportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');

  const { handleImport, isImporting, progress, progressMessage, isSuccess } = useUrlImport('Shopify');

  const connectedStores = [
    { id: '1', name: 'Ma Boutique Shopify', url: 'ma-boutique.myshopify.com', products: 245, status: 'connected', lastSync: '2026-01-22' }
  ];

  return (
    <ChannablePageWrapper
      title="Import Shopify"
      description="Importez des produits depuis n'importe quelle boutique Shopify"
      heroImage="import"
      badge={{ label: 'Shopify', icon: Store }}
    >
      <Tabs defaultValue="url" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="url">Par URL</TabsTrigger>
          <TabsTrigger value="store">Boutique</TabsTrigger>
          <TabsTrigger value="bulk">Import en Masse</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link className="w-5 h-5 text-primary" />Import par URL</CardTitle>
              <CardDescription>Collez l'URL d'un produit Shopify pour l'importer instantanément</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="https://store.myshopify.com/products/product-name" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === 'Enter' && handleImport(url)} />
                <Button onClick={() => handleImport(url)} disabled={isImporting}>
                  {isImporting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Importer
                </Button>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground">{progressMessage || `Import Shopify... ${progress}%`}</p>
                </div>
              )}

              {isSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Produit importé avec succès !</span>
                  <Button size="sm" variant="outline" className="ml-auto" onClick={() => navigate('/products')}>Voir le catalogue</Button>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">Formats supportés :</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• https://store.myshopify.com/products/product-name</li>
                  <li>• https://store.com/products/product-name (domaine personnalisé)</li>
                  <li>• https://store.myshopify.com/collections/all</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Store className="w-5 h-5 text-primary" />Boutiques Connectées</CardTitle>
              <CardDescription>Gérez vos connexions Shopify et synchronisez vos produits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button><Store className="w-4 h-4 mr-2" />Connecter une Boutique</Button>
              <div className="space-y-3">
                {connectedStores.map((store) => (
                  <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><Store className="w-5 h-5 text-primary" /></div>
                      <div><p className="font-medium">{store.name}</p><p className="text-sm text-muted-foreground">{store.url}</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right"><p className="font-medium">{store.products} produits</p><p className="text-xs text-muted-foreground">Sync: {store.lastSync}</p></div>
                      <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Connecté</Badge>
                      <Button variant="outline" size="sm"><RefreshCw className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-primary" />Import en Masse</CardTitle>
              <CardDescription>Importez plusieurs produits ou collections entières</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium mb-2">Glissez un fichier CSV ou cliquez pour sélectionner</p>
                <p className="text-sm text-muted-foreground mb-4">Format: URL par ligne ou export Shopify</p>
                <Button variant="outline">Sélectionner un fichier</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Produits importés', value: '1,234', icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Boutiques', value: '12', icon: Store, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Taux de succès', value: '98%', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Temps moyen', value: '<2s', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${stat.bg} rounded-lg`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                <div><p className="text-2xl font-bold">{stat.value}</p><p className="text-sm text-muted-foreground">{stat.label}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ChannablePageWrapper>
  );
}
