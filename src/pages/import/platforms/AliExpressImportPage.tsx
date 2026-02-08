import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, Link, Search, Package, Zap, CheckCircle2,
  RefreshCw, Download, Star, TrendingUp, Truck, Video,
  Image, ShoppingBag, Clock, DollarSign, Filter
} from 'lucide-react';
import { useUrlImport } from '@/hooks/useUrlImport';

export default function AliExpressImportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [importVideos, setImportVideos] = useState(true);
  const [importReviews, setImportReviews] = useState(true);

  const { handleImport, isImporting, progress, progressMessage, isSuccess } = useUrlImport('AliExpress');

  const trendingProducts = [
    { id: 1, name: 'Écouteurs Bluetooth TWS', price: '€12.99', orders: '50K+', rating: 4.8 },
    { id: 2, name: 'Coque iPhone Silicone', price: '€2.49', orders: '100K+', rating: 4.9 },
    { id: 3, name: 'Montre Connectée Sport', price: '€19.99', orders: '30K+', rating: 4.7 },
    { id: 4, name: 'Lampe LED USB', price: '€4.99', orders: '80K+', rating: 4.6 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#E43A3F] to-[#FF6A00] text-white">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/import')}>
            <ArrowLeft className="w-4 h-4 mr-2" />Retour au Hub
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-xl p-2 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-[#E43A3F]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Import AliExpress</h1>
              <p className="text-white/80">Le plus grand catalogue dropshipping mondial</p>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <Badge className="bg-white/20 text-white border-0"><Package className="w-3 h-3 mr-1" /> 500M+ Produits</Badge>
            <Badge className="bg-white/20 text-white border-0"><Video className="w-3 h-3 mr-1" /> Vidéos incluses</Badge>
            <Badge className="bg-white/20 text-white border-0"><Truck className="w-3 h-3 mr-1" /> Livraison mondiale</Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="url" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="url">Par URL</TabsTrigger>
            <TabsTrigger value="search">Recherche</TabsTrigger>
            <TabsTrigger value="trending">Tendances</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5 text-[#E43A3F]" />Import par URL AliExpress
                </CardTitle>
                <CardDescription>Importez un produit avec toutes ses données, images, vidéos et avis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://www.aliexpress.com/item/1005001234567890.html"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleImport(url)}
                  />
                  <Button onClick={() => handleImport(url)} disabled={isImporting} className="bg-[#E43A3F] hover:bg-[#c92f33]">
                    {isImporting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Importer
                  </Button>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">{progressMessage || `Import en cours... ${progress}%`}</p>
                  </div>
                )}

                {isSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Produit importé avec succès !</span>
                    <Button size="sm" variant="outline" className="ml-auto" onClick={() => navigate('/products')}>Voir le catalogue</Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2"><Video className="w-4 h-4 text-[#E43A3F]" /><span className="text-sm">Importer les vidéos</span></div>
                    <Switch checked={importVideos} onCheckedChange={setImportVideos} />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /><span className="text-sm">Importer les avis</span></div>
                    <Switch checked={importReviews} onCheckedChange={setImportReviews} />
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-3">Données extraites automatiquement :</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['Titre optimisé', 'Description complète', 'Images HD', 'Vidéos produit', 'Toutes variantes', 'Prix & stock', 'Specs techniques', 'Avis clients', 'Info fournisseur'].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-3 h-3 text-green-500" /><span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-[#E43A3F]" />Recherche AliExpress</CardTitle>
                <CardDescription>Trouvez des produits gagnants directement depuis AliExpress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Rechercher des produits..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1" />
                  <Button className="bg-[#E43A3F] hover:bg-[#c92f33]"><Search className="w-4 h-4 mr-2" />Rechercher</Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['Électronique', 'Mode Femme', 'Mode Homme', 'Maison', 'Sport', 'Beauté', 'Jouets', 'Auto'].map(cat => (
                    <Badge key={cat} variant="outline" className="cursor-pointer hover:bg-accent">{cat}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#E43A3F]" />Produits Tendances</CardTitle>
                <CardDescription>Les produits les plus populaires sur AliExpress cette semaine</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trendingProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold text-[#E43A3F]">{product.price}</span>
                          <Badge variant="secondary" className="text-xs"><ShoppingBag className="w-3 h-3 mr-1" />{product.orders}</Badge>
                          <Badge variant="outline" className="text-xs"><Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />{product.rating}</Badge>
                        </div>
                      </div>
                      <Button size="sm" className="bg-[#E43A3F] hover:bg-[#c92f33]"><Download className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Produits', value: '500M+', icon: Package, color: 'text-[#E43A3F]', bg: 'bg-[#E43A3F]/10' },
            { label: 'Vidéos incluses', value: '100%', icon: Video, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: 'vs retail', value: '-70%', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: 'Import complet', value: '<5s', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
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
      </div>
    </div>
  );
}
