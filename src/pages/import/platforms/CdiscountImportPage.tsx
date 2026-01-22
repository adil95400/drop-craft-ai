import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Truck,
  Shield,
  Tag,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';

export default function CdiscountImportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleImport = async () => {
    if (!url) {
      toast.error('Veuillez entrer une URL Cdiscount');
      return;
    }
    setIsImporting(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          toast.success('Produit Cdiscount importé avec succès !');
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const categories = [
    { name: 'High-Tech', count: '500K+' },
    { name: 'Électroménager', count: '200K+' },
    { name: 'Maison', count: '1M+' },
    { name: 'Mode', count: '800K+' },
    { name: 'Sport', count: '300K+' },
    { name: 'Jardin', count: '150K+' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0070BA] to-[#003087] text-white">
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
            <img src="/logos/cdiscount-icon.svg" alt="Cdiscount" className="w-16 h-16 bg-white rounded-xl p-2" />
            <div>
              <h1 className="text-3xl font-bold">Import Cdiscount</h1>
              <p className="text-white/80">Le leader français du e-commerce</p>
            </div>
          </div>
          
          <div className="flex gap-4 mt-6">
            <Badge className="bg-white/20 text-white border-0">
              <Package className="w-3 h-3 mr-1" /> 50M+ Produits
            </Badge>
            <Badge className="bg-white/20 text-white border-0">
              <Shield className="w-3 h-3 mr-1" /> Marketplace FR
            </Badge>
            <Badge className="bg-white/20 text-white border-0">
              <Truck className="w-3 h-3 mr-1" /> Livraison Express
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="url" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="url">Par URL</TabsTrigger>
            <TabsTrigger value="search">Recherche</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5 text-[#0070BA]" />
                  Import par URL Cdiscount
                </CardTitle>
                <CardDescription>
                  Importez des produits depuis Cdiscount, le leader français
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://www.cdiscount.com/product-123456.html"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting}
                    className="bg-[#0070BA] hover:bg-[#005c99]"
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
                    <p className="text-sm text-muted-foreground">Import Cdiscount... {progress}%</p>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-[#0070BA]" />
                    <p className="text-sm font-medium">Spécificités Cdiscount</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['Prix marketplace FR', 'Offres vendeurs', 'Caractéristiques', 'Images produit', 'Avis clients', 'Options livraison', 'Garantie', 'Promotions'].map((item) => (
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
                  <Search className="w-5 h-5 text-[#0070BA]" />
                  Recherche Cdiscount
                </CardTitle>
                <CardDescription>
                  Trouvez des produits sur le marketplace français
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Rechercher des produits..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button className="bg-[#0070BA] hover:bg-[#005c99]">
                    <Search className="w-4 h-4 mr-2" />
                    Rechercher
                  </Button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                    <Tag className="w-3 h-3 mr-1" /> Promos
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                    <Star className="w-3 h-3 mr-1" /> Meilleures ventes
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                    <Truck className="w-3 h-3 mr-1" /> Express
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                    <ShoppingCart className="w-3 h-3 mr-1" /> Marketplace
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#0070BA]" />
                  Catégories Cdiscount
                </CardTitle>
                <CardDescription>
                  Parcourez les catégories populaires
                </CardDescription>
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0070BA]/10 rounded-lg">
                  <Package className="w-5 h-5 text-[#0070BA]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">50M+</p>
                  <p className="text-sm text-muted-foreground">Produits</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">#2</p>
                  <p className="text-sm text-muted-foreground">E-commerce FR</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">10K+</p>
                  <p className="text-sm text-muted-foreground">Vendeurs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Zap className="w-5 h-5 text-orange-500" />
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
