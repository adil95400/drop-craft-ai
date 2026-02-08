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
  RefreshCw, Download, Star, TrendingUp, Globe,
  ShoppingCart, BarChart3, Filter, DollarSign
} from 'lucide-react';
import { useUrlImport } from '@/hooks/useUrlImport';

const amazonMarketplaces = [
  { code: 'FR', name: 'Amazon France', domain: 'amazon.fr', flag: '🇫🇷' },
  { code: 'US', name: 'Amazon USA', domain: 'amazon.com', flag: '🇺🇸' },
  { code: 'UK', name: 'Amazon UK', domain: 'amazon.co.uk', flag: '🇬🇧' },
  { code: 'DE', name: 'Amazon Germany', domain: 'amazon.de', flag: '🇩🇪' },
  { code: 'ES', name: 'Amazon Spain', domain: 'amazon.es', flag: '🇪🇸' },
  { code: 'IT', name: 'Amazon Italy', domain: 'amazon.it', flag: '🇮🇹' },
];

export default function AmazonImportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [asin, setAsin] = useState('');
  const [marketplace, setMarketplace] = useState('FR');
  const [searchQuery, setSearchQuery] = useState('');

  const { handleImport, isImporting, progress, progressMessage, isSuccess } = useUrlImport('Amazon');

  const selectedMp = amazonMarketplaces.find(m => m.code === marketplace);

  const handleAsinImport = () => {
    if (!asin.trim()) return;
    const domain = selectedMp?.domain || 'amazon.com';
    handleImport(`https://www.${domain}/dp/${asin.trim()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#FF9900] to-[#146EB4] text-white">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/import')}>
            <ArrowLeft className="w-4 h-4 mr-2" />Retour au Hub
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-xl p-2 flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-[#FF9900]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Import Amazon</h1>
              <p className="text-white/80">Importez des produits depuis tous les marketplaces Amazon</p>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <Badge className="bg-white/20 text-white border-0"><Globe className="w-3 h-3 mr-1" /> 6 Marketplaces</Badge>
            <Badge className="bg-white/20 text-white border-0"><Star className="w-3 h-3 mr-1" /> Avis Inclus</Badge>
            <Badge className="bg-white/20 text-white border-0"><Package className="w-3 h-3 mr-1" /> 350M+ Produits</Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="url" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="url">Par URL</TabsTrigger>
            <TabsTrigger value="asin">Par ASIN</TabsTrigger>
            <TabsTrigger value="search">Recherche</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Link className="w-5 h-5 text-[#FF9900]" />Import par URL Amazon</CardTitle>
                <CardDescription>Collez l'URL d'un produit Amazon pour l'importer avec toutes ses données</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={marketplace} onValueChange={setMarketplace}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {amazonMarketplaces.map((mp) => (
                        <SelectItem key={mp.code} value={mp.code}>
                          <span className="flex items-center gap-2"><span>{mp.flag}</span><span>{mp.name}</span></span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="https://www.amazon.fr/dp/B08N5WRWNW" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === 'Enter' && handleImport(url)} />
                  <Button onClick={() => handleImport(url)} disabled={isImporting} className="bg-[#FF9900] hover:bg-[#e88b00]">
                    {isImporting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Importer
                  </Button>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">{progressMessage || `Import Amazon... ${progress}%`}</p>
                  </div>
                )}

                {isSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Produit importé avec succès !</span>
                    <Button size="sm" variant="outline" className="ml-auto" onClick={() => navigate('/products')}>Voir le catalogue</Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Données extraites :</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {['Titre & description', 'Images HD', 'Prix & stock', 'Variantes'].map(i => (
                        <li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> {i}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Bonus :</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2"><Star className="w-3 h-3 text-yellow-500" /> Notes & avis</li>
                      <li className="flex items-center gap-2"><BarChart3 className="w-3 h-3 text-blue-500" /> BSR (Best Seller Rank)</li>
                      <li className="flex items-center gap-2"><Package className="w-3 h-3 text-purple-500" /> Dimensions</li>
                      <li className="flex items-center gap-2"><DollarSign className="w-3 h-3 text-green-500" /> Historique prix</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="asin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-[#FF9900]" />Import par ASIN</CardTitle>
                <CardDescription>Entrez directement l'ASIN du produit pour un import rapide</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={marketplace} onValueChange={setMarketplace}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {amazonMarketplaces.map((mp) => (
                        <SelectItem key={mp.code} value={mp.code}>
                          <span className="flex items-center gap-2"><span>{mp.flag}</span><span>{mp.name}</span></span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="B08N5WRWNW" value={asin} onChange={(e) => setAsin(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === 'Enter' && handleAsinImport()} />
                  <Button onClick={handleAsinImport} disabled={isImporting} className="bg-[#FF9900] hover:bg-[#e88b00]">
                    <Download className="w-4 h-4 mr-2" />Importer
                  </Button>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">{progressMessage}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-[#FF9900]" />Recherche Amazon</CardTitle>
                <CardDescription>Recherchez des produits directement sur Amazon</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Rechercher des produits..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1" />
                  <Button className="bg-[#FF9900] hover:bg-[#e88b00]"><Search className="w-4 h-4 mr-2" />Rechercher</Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['Électronique', 'Maison', 'Mode', 'Sport', 'Beauté', 'Jouets'].map(cat => (
                    <Badge key={cat} variant="outline" className="cursor-pointer hover:bg-accent">{cat}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Produits disponibles', value: '350M+', icon: Package, color: 'text-[#FF9900]', bg: 'bg-[#FF9900]/10' },
            { label: 'Marketplaces', value: '6', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Avis extraits', value: '100%', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
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
