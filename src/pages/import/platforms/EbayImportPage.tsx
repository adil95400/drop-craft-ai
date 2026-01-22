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
  ArrowLeft, 
  Link, 
  Search, 
  Package, 
  Zap, 
  CheckCircle2,
  RefreshCw,
  Download,
  Star,
  TrendingUp,
  Globe,
  Gavel,
  Clock,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

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
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleImport = async () => {
    if (!url) {
      toast.error('Veuillez entrer une URL eBay');
      return;
    }
    setIsImporting(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          toast.success('Produit eBay importé avec succès !');
          return 100;
        }
        return prev + 8;
      });
    }, 150);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E53238] via-[#F5AF02] to-[#0064D2] text-white">
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/20 mb-4"
            onClick={() => navigate('/import')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au Hub
          </Button>
          
          <div className="flex items-center gap-4">
            <img src="/logos/ebay-icon.svg" alt="eBay" className="w-16 h-16 bg-white rounded-xl p-2" />
            <div>
              <h1 className="text-3xl font-bold">Import eBay</h1>
              <p className="text-white/80">Importez depuis la plus grande marketplace mondiale</p>
            </div>
          </div>
          
          <div className="flex gap-4 mt-6">
            <Badge className="bg-white/20 text-white border-0">
              <Globe className="w-3 h-3 mr-1" /> 190 Pays
            </Badge>
            <Badge className="bg-white/20 text-white border-0">
              <Package className="w-3 h-3 mr-1" /> 1.9B+ Produits
            </Badge>
            <Badge className="bg-white/20 text-white border-0">
              <Users className="w-3 h-3 mr-1" /> 135M+ Acheteurs
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="url" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="url">Par URL</TabsTrigger>
            <TabsTrigger value="search">Recherche</TabsTrigger>
            <TabsTrigger value="seller">Par Vendeur</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5 text-[#E53238]" />
                  Import par URL eBay
                </CardTitle>
                <CardDescription>
                  Importez n'importe quel produit eBay avec ses détails complets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={marketplace} onValueChange={setMarketplace}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ebayMarketplaces.map((mp) => (
                        <SelectItem key={mp.code} value={mp.code}>
                          <span className="flex items-center gap-2">
                            <span>{mp.flag}</span>
                            <span>{mp.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="https://www.ebay.fr/itm/123456789"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting}
                    className="bg-[#0064D2] hover:bg-[#004a9e]"
                  >
                    {isImporting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Importer
                  </Button>
                </div>
                
                {isImporting && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">Import eBay en cours... {progress}%</p>
                  </div>
                )}

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">Données extraites :</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Titre & description', 'Images haute qualité', 'Prix & enchères', 'État du produit', 'Frais de port', 'Caractéristiques', 'Info vendeur', 'Historique ventes'].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span>{item}</span>
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
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-[#0064D2]" />
                  Recherche eBay
                </CardTitle>
                <CardDescription>
                  Recherchez et importez des produits depuis eBay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={marketplace} onValueChange={setMarketplace}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ebayMarketplaces.map((mp) => (
                        <SelectItem key={mp.code} value={mp.code}>
                          <span className="flex items-center gap-2">
                            <span>{mp.flag}</span>
                            <span>{mp.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Rechercher des produits..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button className="bg-[#0064D2] hover:bg-[#004a9e]">
                    <Search className="w-4 h-4 mr-2" />
                    Rechercher
                  </Button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">Achat immédiat</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">Enchères</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">Neuf</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">Occasion</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">Livraison gratuite</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seller" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0064D2]" />
                  Import par Vendeur
                </CardTitle>
                <CardDescription>
                  Importez tous les produits d'un vendeur eBay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nom du vendeur eBay"
                    className="flex-1"
                  />
                  <Button className="bg-[#0064D2] hover:bg-[#004a9e]">
                    <Search className="w-4 h-4 mr-2" />
                    Trouver
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Entrez le nom d'un vendeur pour voir et importer ses produits en masse.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#E53238]/10 rounded-lg">
                  <Package className="w-5 h-5 text-[#E53238]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1.9B+</p>
                  <p className="text-sm text-muted-foreground">Produits</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0064D2]/10 rounded-lg">
                  <Globe className="w-5 h-5 text-[#0064D2]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">190</p>
                  <p className="text-sm text-muted-foreground">Pays</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#F5AF02]/10 rounded-lg">
                  <Gavel className="w-5 h-5 text-[#F5AF02]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">100%</p>
                  <p className="text-sm text-muted-foreground">Enchères supportées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Zap className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">&lt;3s</p>
                  <p className="text-sm text-muted-foreground">Import rapide</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
