import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Link, Search, Package, Zap, CheckCircle2,
  RefreshCw, Download, Star, TrendingUp, Truck, Shield, Tag, ShoppingCart
} from 'lucide-react';
import { useUrlImport } from '@/hooks/useUrlImport';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function CdiscountImportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { handleImport, isImporting, progress, progressMessage, isSuccess } = useUrlImport('Cdiscount');

  const categories = [
    { name: 'High-Tech', count: '500K+' },
    { name: 'Électroménager', count: '200K+' },
    { name: 'Maison', count: '1M+' },
    { name: 'Mode', count: '800K+' },
    { name: 'Sport', count: '300K+' },
    { name: 'Jardin', count: '150K+' },
  ];

  return (
    <ChannablePageWrapper
      title="Import Cdiscount"
      description="Le leader français du e-commerce — 50M+ produits"
      heroImage="import"
      badge={{ label: 'Cdiscount', icon: ShoppingCart }}
    >
      <Tabs defaultValue="url" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="url">Par URL</TabsTrigger>
          <TabsTrigger value="search">Recherche</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link className="w-5 h-5 text-primary" />Import par URL Cdiscount</CardTitle>
              <CardDescription>Importez des produits depuis Cdiscount, le leader français</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="https://www.cdiscount.com/product-123456.html" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === 'Enter' && handleImport(url)} />
                <Button onClick={() => handleImport(url)} disabled={isImporting}>
                  {isImporting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Importer
                </Button>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground">{progressMessage || `Import Cdiscount... ${progress}%`}</p>
                </div>
              )}

              {isSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Produit importé avec succès !</span>
                  <Button size="sm" variant="outline" className="ml-auto" onClick={() => navigate('/products')}>Voir le catalogue</Button>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-primary" /><p className="text-sm font-medium">Spécificités Cdiscount</p></div>
                <div className="grid grid-cols-2 gap-2">
                  {['Prix marketplace FR', 'Offres vendeurs', 'Caractéristiques', 'Images produit', 'Avis clients', 'Options livraison', 'Garantie', 'Promotions'].map((item) => (
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
              <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-primary" />Recherche Cdiscount</CardTitle>
              <CardDescription>Trouvez des produits sur le marketplace français</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Rechercher des produits..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1" />
                <Button><Search className="w-4 h-4 mr-2" />Rechercher</Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="cursor-pointer hover:bg-accent"><Tag className="w-3 h-3 mr-1" /> Promos</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent"><Star className="w-3 h-3 mr-1" /> Meilleures ventes</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent"><Truck className="w-3 h-3 mr-1" /> Express</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent"><ShoppingCart className="w-3 h-3 mr-1" /> Marketplace</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-primary" />Catégories Cdiscount</CardTitle>
              <CardDescription>Parcourez les catégories populaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <Button key={cat.name} variant="outline" className="h-20 flex-col gap-1 justify-center">
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">{cat.count} produits</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Produits', value: '50M+', icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'E-commerce FR', value: '#2', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Vendeurs', value: '10K+', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Import rapide', value: '<3s', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
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
