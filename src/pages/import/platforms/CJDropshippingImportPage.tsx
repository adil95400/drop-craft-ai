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
  RefreshCw, Download, Star, Truck, Globe, Shield,
  Warehouse, Timer, DollarSign
} from 'lucide-react';
import { useUrlImport } from '@/hooks/useUrlImport';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function CJDropshippingImportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [sku, setSku] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { handleImport, isImporting, progress, progressMessage, isSuccess } = useUrlImport('CJ Dropshipping');

  const advantages = [
    { icon: Warehouse, title: 'Entrepôts mondiaux', desc: 'USA, EU, Chine' },
    { icon: Truck, title: 'Livraison rapide', desc: '3-7 jours EU/US' },
    { icon: Shield, title: 'Qualité vérifiée', desc: 'Contrôle QC' },
    { icon: DollarSign, title: 'Prix compétitifs', desc: "Jusqu'à -40%" },
  ];

  return (
    <ChannablePageWrapper
      title="CJ Dropshipping"
      description="Fournisseur dropshipping professionnel — 400K+ produits"
      heroImage="import"
      badge={{ label: 'CJ', icon: Warehouse }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {advantages.map((adv) => (
          <Card key={adv.title}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg"><adv.icon className="w-5 h-5 text-primary" /></div>
                <div><p className="font-medium text-sm">{adv.title}</p><p className="text-xs text-muted-foreground">{adv.desc}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="url" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="url">Par URL</TabsTrigger>
          <TabsTrigger value="sku">Par SKU</TabsTrigger>
          <TabsTrigger value="search">Recherche</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link className="w-5 h-5 text-primary" />Import par URL</CardTitle>
              <CardDescription>Importez directement depuis le site CJ Dropshipping</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="https://cjdropshipping.com/product-p-123456.html" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === 'Enter' && handleImport(url)} />
                <Button onClick={() => handleImport(url)} disabled={isImporting}>
                  {isImporting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Importer
                </Button>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground">{progressMessage || `Import CJ... ${progress}%`}</p>
                </div>
              )}

              {isSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Produit importé avec succès !</span>
                  <Button size="sm" variant="outline" className="ml-auto" onClick={() => navigate('/products')}>Voir le catalogue</Button>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">Données CJ incluses :</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Prix fournisseur', 'Stock temps réel', 'Délais livraison', 'Coûts shipping', 'Images HD', 'Variantes', 'Poids & dimensions', 'SKU CJ'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-3 h-3 text-green-500" /><span>{item}</span></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sku" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-primary" />Import par SKU CJ</CardTitle>
              <CardDescription>Entrez le SKU du produit CJ Dropshipping</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="CJ123456789" value={sku} onChange={(e) => setSku(e.target.value)} className="flex-1" />
                <Button onClick={() => handleImport(`https://cjdropshipping.com/product-p-${sku}.html`)} disabled={isImporting}>
                  <Download className="w-4 h-4 mr-2" />Importer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-primary" />Recherche CJ</CardTitle>
              <CardDescription>Trouvez des produits dans le catalogue CJ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Rechercher des produits..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1" />
                <Button><Search className="w-4 h-4 mr-2" />Rechercher</Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="cursor-pointer hover:bg-accent"><Truck className="w-3 h-3 mr-1" /> Entrepôt EU</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent"><Truck className="w-3 h-3 mr-1" /> Entrepôt US</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent"><Timer className="w-3 h-3 mr-1" /> Livraison 3-7j</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent"><Star className="w-3 h-3 mr-1" /> Best Sellers</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Produits', value: '400K+', icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Entrepôts', value: '200+', icon: Warehouse, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Livraison EU', value: '3-7j', icon: Truck, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Pays livrés', value: '200+', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-500/10' },
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
