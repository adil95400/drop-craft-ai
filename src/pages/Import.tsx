import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  Link, 
  Image, 
  Download, 
  Check, 
  X, 
  AlertCircle,
  Loader2,
  ShoppingCart,
  Star,
  Eye,
  Package,
  Zap
} from "lucide-react";

const Import = () => {
  const [selectedTab, setSelectedTab] = useState("csv");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast({
      title: "Fichier sélectionné",
      description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
    });

    simulateImport();
  };

  const simulateImport = () => {
    setIsImporting(true);
    setImportProgress(0);

    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          
          // Simulate import results
          setImportResults([
            {
              id: 1,
              title: "iPhone 15 Pro Max Case",
              price: 24.99,
              originalPrice: 45.99,
              rating: 4.8,
              reviews: 1250,
              status: "success",
              supplier: "AliExpress"
            },
            {
              id: 2,
              title: "Wireless Bluetooth Headphones",
              price: 39.99,
              originalPrice: 89.99,
              rating: 4.6,
              reviews: 890,
              status: "success",
              supplier: "Amazon"
            },
            {
              id: 3,
              title: "Smart Watch Pro",
              price: 79.99,
              originalPrice: 149.99,
              rating: 4.9,
              reviews: 2100,
              status: "warning",
              supplier: "BigBuy"
            }
          ]);

          toast({
            title: "Import terminé !",
            description: "3 produits importés avec succès",
          });
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleUrlImport = (url: string) => {
    if (!url) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une URL valide",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Import démarré",
      description: "Analyse de l'URL en cours...",
    });

    simulateImport();
  };

  const importMethods = [
    {
      id: "csv",
      title: "Import CSV/Excel",
      description: "Importez vos produits depuis un fichier CSV ou Excel",
      icon: FileText,
      color: "text-blue-500"
    },
    {
      id: "url",
      title: "Import par URL",
      description: "Copiez-collez l'URL du produit pour import automatique",
      icon: Link,
      color: "text-green-500"
    },
    {
      id: "image",
      title: "Import par Image",
      description: "Uploadez une image pour créer un produit via IA",
      icon: Image,
      color: "text-purple-500"
    },
    {
      id: "extension",
      title: "Extension Chrome",
      description: "Importez directement depuis votre navigateur",
      icon: Download,
      color: "text-orange-500"
    }
  ];

  const suppliers = [
    { name: "AliExpress", logo: "🇨🇳", status: "active", products: "2.1M+" },
    { name: "Amazon", logo: "📦", status: "active", products: "500K+" },
    { name: "BigBuy", logo: "🏪", status: "active", products: "150K+" },
    { name: "Cdiscount Pro", logo: "🛒", status: "coming", products: "80K+" },
    { name: "Printful", logo: "👕", status: "active", products: "300+" },
    { name: "Spocket", logo: "🚚", status: "active", products: "1M+" }
  ];

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Import de Produits
          </h1>
          <p className="text-muted-foreground mt-1">
            Importez vos produits depuis plusieurs sources avec notre IA
          </p>
        </div>
        <Button variant="outline">
          <Eye className="mr-2 h-4 w-4" />
          Voir les Templates
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Side - Import Methods */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Import Methods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {importMethods.map((method) => (
              <Card 
                key={method.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-glow border-border ${
                  selectedTab === method.id ? 'ring-2 ring-primary shadow-glow' : ''
                }`}
                onClick={() => setSelectedTab(method.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <method.icon className={`h-5 w-5 ${method.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{method.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {method.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Import Interface */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Interface d'Import
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                
                {/* CSV Import */}
                <TabsContent value="csv" className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Glissez votre fichier ici</h3>
                    <p className="text-muted-foreground mb-4">
                      Formats supportés: CSV, Excel (.xlsx), XML
                    </p>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xml"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label htmlFor="file-upload">
                      <Button variant="outline" className="cursor-pointer">
                        Choisir un fichier
                      </Button>
                    </Label>
                  </div>
                </TabsContent>

                {/* URL Import */}
                <TabsContent value="url" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="product-url">URL du produit</Label>
                      <div className="flex space-x-2 mt-2">
                        <Input
                          id="product-url"
                          placeholder="https://www.aliexpress.com/item/..."
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => handleUrlImport("https://example.com")}
                          variant="hero"
                        >
                          <Zap className="mr-2 h-4 w-4" />
                          Importer
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Sites supportés:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">AliExpress</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">Amazon</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">eBay</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">Shopify</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Image Import */}
                <TabsContent value="image" className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Upload une image</h3>
                    <p className="text-muted-foreground mb-4">
                      Notre IA analysera l'image et créera le produit automatiquement
                    </p>
                    <Button variant="gradient">
                      <Upload className="mr-2 h-4 w-4" />
                      Choisir une image
                    </Button>
                  </div>
                </TabsContent>

                {/* Extension */}
                <TabsContent value="extension" className="space-y-4">
                  <div className="text-center py-8">
                    <Download className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">Extension Chrome</h3>
                    <p className="text-muted-foreground mb-6">
                      Installez notre extension pour importer directement depuis votre navigateur
                    </p>
                    <div className="space-y-3">
                      <Button variant="premium" size="lg">
                        <Download className="mr-2 h-4 w-4" />
                        Installer l'Extension
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Compatible avec Chrome, Firefox et Safari
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Import Progress */}
              {isImporting && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Import en cours...</span>
                    <span className="text-sm text-muted-foreground">{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyse et optimisation des produits...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Import Results */}
          {importResults.length > 0 && (
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle>Résultats de l'Import</CardTitle>
                <CardDescription>
                  {importResults.length} produits traités
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {importResults.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{product.title}</h4>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{product.supplier}</span>
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{product.rating}</span>
                              <span>({product.reviews})</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="font-semibold">${product.price}</div>
                          <div className="text-sm text-muted-foreground line-through">
                            ${product.originalPrice}
                          </div>
                        </div>
                        {product.status === "success" ? (
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <Button variant="hero" className="flex-1">
                    Publier Tous les Produits
                  </Button>
                  <Button variant="outline">
                    Réviser
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side - Suppliers & Stats */}
        <div className="space-y-6">
          
          {/* Suppliers */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Fournisseurs</CardTitle>
              <CardDescription>Sources d'import disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suppliers.map((supplier, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{supplier.logo}</span>
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {supplier.products} produits
                        </div>
                      </div>
                    </div>
                    <Badge variant={supplier.status === "active" ? "default" : "secondary"}>
                      {supplier.status === "active" ? "Actif" : "Bientôt"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Imports ce mois</span>
                <span className="font-semibold">1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Taux de succès</span>
                <span className="font-semibold text-green-600">98.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Temps moyen</span>
                <span className="font-semibold">2.3s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Crédits restants</span>
                <span className="font-semibold text-primary">∞</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Import;