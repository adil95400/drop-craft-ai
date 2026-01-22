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
  Truck,
  Globe,
  Shield,
  Warehouse,
  Timer,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

export default function CJDropshippingImportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [sku, setSku] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleImport = async () => {
    if (!url && !sku) {
      toast.error('Veuillez entrer une URL ou un SKU');
      return;
    }
    setIsImporting(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          toast.success('Produit CJ Dropshipping importé !');
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const advantages = [
    { icon: Warehouse, title: 'Entrepôts mondiaux', desc: 'USA, EU, Chine' },
    { icon: Truck, title: 'Livraison rapide', desc: '3-7 jours EU/US' },
    { icon: Shield, title: 'Qualité vérifiée', desc: 'Contrôle QC' },
    { icon: DollarSign, title: 'Prix compétitifs', desc: 'Jusqu\'à -40%' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1890FF] to-[#096DD9] text-white">
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
            <img src="/logos/cj-logo.svg" alt="CJ Dropshipping" className="w-16 h-16 bg-white rounded-xl p-2" />
            <div>
              <h1 className="text-3xl font-bold">CJ Dropshipping</h1>
              <p className="text-white/80">Fournisseur dropshipping professionnel</p>
            </div>
          </div>
          
          <div className="flex gap-4 mt-6">
            <Badge className="bg-white/20 text-white border-0">
              <Warehouse className="w-3 h-3 mr-1" /> Entrepôts EU/US
            </Badge>
            <Badge className="bg-white/20 text-white border-0">
              <Package className="w-3 h-3 mr-1" /> 400K+ Produits
            </Badge>
            <Badge className="bg-white/20 text-white border-0">
              <Truck className="w-3 h-3 mr-1" /> Livraison Express
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Advantages */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {advantages.map((adv) => (
            <Card key={adv.title}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#1890FF]/10 rounded-lg">
                    <adv.icon className="w-5 h-5 text-[#1890FF]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{adv.title}</p>
                    <p className="text-xs text-muted-foreground">{adv.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="url" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="url">Par URL</TabsTrigger>
            <TabsTrigger value="sku">Par SKU</TabsTrigger>
            <TabsTrigger value="search">Recherche</TabsTrigger>
            <TabsTrigger value="catalog">Catalogue</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5 text-[#1890FF]" />
                  Import par URL
                </CardTitle>
                <CardDescription>
                  Importez directement depuis le site CJ Dropshipping
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://cjdropshipping.com/product-p-123456.html"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting}
                    className="bg-[#1890FF] hover:bg-[#096DD9]"
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
                    <p className="text-sm text-muted-foreground">Import CJ... {progress}%</p>
                  </div>
                )}

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">Données CJ incluses :</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Prix fournisseur', 'Stock temps réel', 'Délais livraison', 'Coûts shipping', 'Images HD', 'Variantes', 'Poids & dimensions', 'SKU CJ'].map((item) => (
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

          <TabsContent value="sku" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#1890FF]" />
                  Import par SKU CJ
                </CardTitle>
                <CardDescription>
                  Entrez le SKU du produit CJ Dropshipping
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="CJ123456789"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting}
                    className="bg-[#1890FF] hover:bg-[#096DD9]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Importer
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Import multiple :</p>
                  <textarea 
                    className="w-full h-32 p-3 text-sm border rounded-lg resize-none"
                    placeholder="Entrez un SKU par ligne :&#10;CJ123456789&#10;CJ987654321&#10;CJ456789123"
                  />
                  <Button variant="outline" className="mt-2">
                    Importer tous les SKUs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-[#1890FF]" />
                  Recherche CJ
                </CardTitle>
                <CardDescription>
                  Trouvez des produits dans le catalogue CJ
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
                  <Button className="bg-[#1890FF] hover:bg-[#096DD9]">
                    <Search className="w-4 h-4 mr-2" />
                    Rechercher
                  </Button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                    <Truck className="w-3 h-3 mr-1" /> Entrepôt EU
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                    <Truck className="w-3 h-3 mr-1" /> Entrepôt US
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                    <Timer className="w-3 h-3 mr-1" /> Livraison 3-7j
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                    <Star className="w-3 h-3 mr-1" /> Best Sellers
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="catalog" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#1890FF]" />
                  Catalogue CJ
                </CardTitle>
                <CardDescription>
                  Parcourez le catalogue complet CJ Dropshipping
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Électronique', 'Mode', 'Maison', 'Beauté', 'Sport', 'Jouets', 'Auto', 'Bijoux'].map((cat) => (
                    <Button key={cat} variant="outline" className="h-20 flex-col gap-2">
                      <Package className="w-6 h-6 text-[#1890FF]" />
                      {cat}
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
                <div className="p-2 bg-[#1890FF]/10 rounded-lg">
                  <Package className="w-5 h-5 text-[#1890FF]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">400K+</p>
                  <p className="text-sm text-muted-foreground">Produits</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Warehouse className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">200+</p>
                  <p className="text-sm text-muted-foreground">Entrepôts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Truck className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">3-7j</p>
                  <p className="text-sm text-muted-foreground">Livraison EU</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Globe className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">200+</p>
                  <p className="text-sm text-muted-foreground">Pays livrés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
