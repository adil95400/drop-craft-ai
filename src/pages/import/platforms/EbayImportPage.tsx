import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, Link, Search, Package, Zap, CheckCircle2,
  RefreshCw, Download, Star, Globe, Gavel, Users
} from 'lucide-react';
import { useUrlImport } from '@/hooks/useUrlImport';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

const ebayMarketplaces = [
  { code: 'FR', name: 'eBay France', domain: 'ebay.fr', flag: '🇫🇷' },
  { code: 'US', name: 'eBay USA', domain: 'ebay.com', flag: '🇺🇸' },
  { code: 'UK', name: 'eBay UK', domain: 'ebay.co.uk', flag: '🇬🇧' },
  { code: 'DE', name: 'eBay Germany', domain: 'ebay.de', flag: '🇩🇪' },
  { code: 'ES', name: 'eBay Spain', domain: 'ebay.es', flag: '🇪🇸' },
  { code: 'IT', name: 'eBay Italy', domain: 'ebay.it', flag: '🇮🇹' },
];

export default function EbayImportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [marketplace, setMarketplace] = useState('FR');
  const [searchQuery, setSearchQuery] = useState('');

  const { handleImport, isImporting, progress, progressMessage, isSuccess } = useUrlImport('eBay');

  return (
    <ChannablePageWrapper
      title="Import eBay"
      description="Importez depuis la plus grande marketplace mondiale"
      heroImage="import"
      badge={{ label: 'eBay', icon: Gavel }}
      actions={
        <Button variant="outline" onClick={() => navigate('/import')}>
          <ArrowLeft className="w-4 h-4 mr-2" />Retour au Hub
        </Button>
      }
    >
      <Tabs defaultValue="url" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="url">Par URL</TabsTrigger>
          <TabsTrigger value="search">Recherche</TabsTrigger>
          <TabsTrigger value="seller">Par Vendeur</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link className="w-5 h-5" />Import par URL eBay</CardTitle>
              <CardDescription>Importez n'importe quel produit eBay avec ses détails complets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={marketplace} onValueChange={setMarketplace}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ebayMarketplaces.map((mp) => (
                      <SelectItem key={mp.code} value={mp.code}>
                        <span className="flex items-center gap-2"><span>{mp.flag}</span><span>{mp.name}</span></span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="https://www.ebay.fr/itm/123456789" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === 'Enter' && handleImport(url)} />
                <Button onClick={() => handleImport(url)} disabled={isImporting}>
                  {isImporting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Importer
                </Button>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground">{progressMessage || `Import eBay... ${progress}%`}</p>
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
                <p className="text-sm font-medium">Données extraites :</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Titre & description', 'Images haute qualité', 'Prix & enchères', 'État du produit', 'Frais de port', 'Caractéristiques', 'Info vendeur', 'Historique ventes'].map((item) => (
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
              <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5" />Recherche eBay</CardTitle>
              <CardDescription>Recherchez et importez des produits depuis eBay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Rechercher des produits..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1" />
                <Button><Search className="w-4 h-4 mr-2" />Rechercher</Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['Achat immédiat', 'Enchères', 'Neuf', 'Occasion', 'Livraison gratuite'].map(f => (
                  <Badge key={f} variant="outline" className="cursor-pointer hover:bg-accent">{f}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seller" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Import par Vendeur</CardTitle>
              <CardDescription>Importez tous les produits d'un vendeur eBay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Nom du vendeur eBay" className="flex-1" />
                <Button><Search className="w-4 h-4 mr-2" />Trouver</Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Entrez le nom d'un vendeur pour voir et importer ses produits en masse.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Produits', value: '1.9B+', icon: Package },
          { label: 'Pays', value: '190', icon: Globe },
          { label: 'Enchères supportées', value: '100%', icon: Gavel },
          { label: 'Import rapide', value: '<3s', icon: Zap },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg"><stat.icon className="w-5 h-5 text-primary" /></div>
                <div><p className="text-2xl font-bold">{stat.value}</p><p className="text-sm text-muted-foreground">{stat.label}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ChannablePageWrapper>
  );
}
