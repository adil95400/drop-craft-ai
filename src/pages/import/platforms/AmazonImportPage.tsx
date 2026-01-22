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
  ShoppingCart,
  BarChart3,
  Filter,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

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
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleImport = async () => {
    if (!url && !asin) {
      toast.error('Veuillez entrer une URL ou un ASIN');
      return;
    }
    setIsImporting(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          toast.success('Produit Amazon importé avec succès !');
          return 100;
        }
        return prev + 8;
      });
    }, 150);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF9900] to-[#146EB4] text-white">
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
            <img src="/logos/amazon-logo.svg" alt="Amazon" className="w-16 h-16 bg-white rounded-xl p-2" />
            <div>
              <h1 className="text-3xl font-bold">Import Amazon</h1>
              <p className="text-white/80">Importez des produits depuis tous les marketplaces Amazon</p>
            </div>
          </div>
          
          <div className="flex gap-4 mt-6">
            <Badge className="bg-white/20 text-white border-0">
              <Globe className="w-3 h-3 mr-1" /> 6 Marketplaces
            </Badge>
            <Badge className="bg-white/20 text-white border-0">
              <Star className="w-3 h-3 mr-1" /> Avis Inclus
            </Badge>
            <Badge className="bg-white/20 text-white border-0">
              <Package className="w-3 h-3 mr-1" /> 350M+ Produits
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="url" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="url">Par URL</TabsTrigger>
            <TabsTrigger value="asin">Par ASIN</TabsTrigger>
            <TabsTrigger value="search">Recherche</TabsTrigger>
            <TabsTrigger value="bestsellers">Best Sellers</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5 text-[#FF9900]" />
                  Import par URL Amazon
                </CardTitle>
                <CardDescription>
                  Collez l'URL d'un produit Amazon pour l'importer avec toutes ses données
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={marketplace} onValueChange={setMarketplace}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {amazonMarketplaces.map((mp) => (
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
                    placeholder="https://www.amazon.fr/dp/B08N5WRWNW"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting}
                    className="bg-[#FF9900] hover:bg-[#e88b00]"
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
                    <p className="text-sm text-muted-foreground">Extraction des données Amazon... {progress}%</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Données extraites :</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Titre & description</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Images HD</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Prix & stock</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Variantes</li>
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
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#FF9900]" />
                  Import par ASIN
                </CardTitle>
                <CardDescription>
                  Entrez directement l'ASIN du produit pour un import rapide
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={marketplace} onValueChange={setMarketplace}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {amazonMarketplaces.map((mp) => (
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
                    placeholder="B08N5WRWNW"
                    value={asin}
                    onChange={(e) => setAsin(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting}
                    className="bg-[#FF9900] hover:bg-[#e88b00]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Importer
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Import multiple :</p>
                  <textarea 
                    className="w-full h-32 p-3 text-sm border rounded-lg resize-none"
                    placeholder="Entrez un ASIN par ligne :&#10;B08N5WRWNW&#10;B09XYZ1234&#10;B07ABC5678"
                  />
                  <Button variant="outline" className="mt-2">
                    Importer tous les ASINs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-[#FF9900]" />
                  Recherche Amazon
                </CardTitle>
                <CardDescription>
                  Recherchez des produits directement sur Amazon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={marketplace} onValueChange={setMarketplace}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {amazonMarketplaces.map((mp) => (
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
                  <Button className="bg-[#FF9900] hover:bg-[#e88b00]">
                    <Search className="w-4 h-4 mr-2" />
                    Rechercher
                  </Button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">Électronique</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">Maison</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">Mode</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">Sport</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">Beauté</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">Jouets</Badge>
                </div>

                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Entrez un terme de recherche pour trouver des produits</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bestsellers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#FF9900]" />
                  Best Sellers Amazon
                </CardTitle>
                <CardDescription>
                  Découvrez et importez les produits les plus vendus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6">
                  <Select value={marketplace} onValueChange={setMarketplace}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {amazonMarketplaces.map((mp) => (
                        <SelectItem key={mp.code} value={mp.code}>
                          <span className="flex items-center gap-2">
                            <span>{mp.flag}</span>
                            <span>{mp.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes catégories</SelectItem>
                      <SelectItem value="electronics">Électronique</SelectItem>
                      <SelectItem value="home">Maison & Cuisine</SelectItem>
                      <SelectItem value="fashion">Mode</SelectItem>
                      <SelectItem value="sports">Sports & Loisirs</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtres
                  </Button>
                </div>

                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Sélectionnez un marketplace et une catégorie</p>
                  <Button className="bg-[#FF9900] hover:bg-[#e88b00]">
                    Charger les Best Sellers
                  </Button>
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
                <div className="p-2 bg-[#FF9900]/10 rounded-lg">
                  <Package className="w-5 h-5 text-[#FF9900]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">350M+</p>
                  <p className="text-sm text-muted-foreground">Produits disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">6</p>
                  <p className="text-sm text-muted-foreground">Marketplaces</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">100%</p>
                  <p className="text-sm text-muted-foreground">Avis extraits</p>
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
                  <p className="text-sm text-muted-foreground">Temps d'import</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
