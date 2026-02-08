import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Link, Search, Package, Zap, CheckCircle2,
  RefreshCw, Download, Star, TrendingUp, DollarSign,
  Percent, Flame, ShoppingBag
} from 'lucide-react';
import { useUrlImport } from '@/hooks/useUrlImport';

export default function TemuImportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { handleImport, isImporting, progress, progressMessage, isSuccess } = useUrlImport('Temu');

  const hotDeals = [
    { id: 1, name: 'Chargeur sans fil 15W', price: '€4.99', originalPrice: '€19.99', discount: '-75%' },
    { id: 2, name: 'Écouteurs Bluetooth Sport', price: '€8.99', originalPrice: '€39.99', discount: '-78%' },
    { id: 3, name: 'Support téléphone voiture', price: '€2.99', originalPrice: '€14.99', discount: '-80%' },
    { id: 4, name: 'Lampe de bureau LED', price: '€6.99', originalPrice: '€29.99', discount: '-77%' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#FB7701] to-[#FF4D00] text-white">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/import')}>
            <ArrowLeft className="w-4 h-4 mr-2" />Retour au Hub
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-xl p-2 flex items-center justify-center">
              <Flame className="w-8 h-8 text-[#FB7701]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Import Temu</h1>
              <p className="text-white/80">Les meilleurs prix du marché</p>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <Badge className="bg-white/20 text-white border-0"><Percent className="w-3 h-3 mr-1" /> Prix ultra-bas</Badge>
            <Badge className="bg-white/20 text-white border-0"><Package className="w-3 h-3 mr-1" /> 100M+ Produits</Badge>
            <Badge className="bg-white/20 text-white border-0"><Flame className="w-3 h-3 mr-1" /> Tendances</Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="url" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="url">Par URL</TabsTrigger>
            <TabsTrigger value="search">Recherche</TabsTrigger>
            <TabsTrigger value="deals">Hot Deals</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Link className="w-5 h-5 text-[#FB7701]" />Import par URL Temu</CardTitle>
                <CardDescription>Importez des produits Temu aux prix ultra-compétitifs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="https://www.temu.com/product-123456.html" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === 'Enter' && handleImport(url)} />
                  <Button onClick={() => handleImport(url)} disabled={isImporting} className="bg-[#FB7701] hover:bg-[#e06a00]">
                    {isImporting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Importer
                  </Button>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">{progressMessage || `Import Temu... ${progress}%`}</p>
                  </div>
                )}

                {isSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Produit importé avec succès !</span>
                    <Button size="sm" variant="outline" className="ml-auto" onClick={() => navigate('/products')}>Voir le catalogue</Button>
                  </div>
                )}

                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-3"><Flame className="w-5 h-5 text-[#FB7701]" /><p className="text-sm font-medium">Avantages Temu</p></div>
                  <div className="grid grid-cols-2 gap-2">
                    {['Prix les plus bas', 'Promotions quotidiennes', 'Large catalogue', 'Qualité vérifiée', 'Images HD', 'Variantes complètes'].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-3 h-3 text-green-500" /><span>{item}</span></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-[#FB7701]" />Recherche Temu</CardTitle>
                <CardDescription>Trouvez les meilleures affaires sur Temu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Rechercher des produits..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1" />
                  <Button className="bg-[#FB7701] hover:bg-[#e06a00]"><Search className="w-4 h-4 mr-2" />Rechercher</Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent"><Flame className="w-3 h-3 mr-1" /> Tendances</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent"><Percent className="w-3 h-3 mr-1" /> -70% et plus</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent"><Star className="w-3 h-3 mr-1" /> Best sellers</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent"><ShoppingBag className="w-3 h-3 mr-1" /> Nouveautés</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Flame className="w-5 h-5 text-[#FB7701]" />Hot Deals Temu</CardTitle>
                <CardDescription>Les meilleures affaires du moment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hotDeals.map((deal) => (
                    <div key={deal.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-[#FB7701]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{deal.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold text-[#FB7701]">{deal.price}</span>
                          <span className="text-sm text-muted-foreground line-through">{deal.originalPrice}</span>
                          <Badge className="bg-red-500 text-white text-xs">{deal.discount}</Badge>
                        </div>
                      </div>
                      <Button size="sm" className="bg-[#FB7701] hover:bg-[#e06a00]"><Download className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Produits', value: '100M+', icon: Package, color: 'text-[#FB7701]', bg: 'bg-[#FB7701]/10' },
            { label: 'Prix moyen', value: '-70%', icon: Percent, color: 'text-red-500', bg: 'bg-red-500/10' },
            { label: 'App shopping', value: '#1', icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
            { label: 'Import rapide', value: '<3s', icon: Zap, color: 'text-green-500', bg: 'bg-green-500/10' },
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
