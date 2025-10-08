import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  DollarSign, 
  TrendingUp, 
  Search,
  Image as ImageIcon,
  Globe,
  Target,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ImportedProduct } from '@/hooks/useImportUltraPro';

interface ProductOptimizerProps {
  product: ImportedProduct;
  onOptimize?: (optimizedProduct: ImportedProduct) => void;
}

export const ProductOptimizer: React.FC<ProductOptimizerProps> = ({ product, onOptimize }) => {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [optimizations, setOptimizations] = useState({
    seo_score: 0,
    price_competitiveness: 0,
    description_quality: 0,
    image_quality: 0,
    conversion_potential: 0
  });

  const optimizeProduct = async (type: 'seo' | 'price' | 'all') => {
    setIsOptimizing(true);
    setProgress(0);

    try {
      const steps = type === 'all' ? 5 : 1;
      const increment = 100 / steps;

      // Simulation d'optimisation
      for (let i = 0; i < steps; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setProgress((i + 1) * increment);
        
        if (type === 'all' || type === 'seo') {
          setOptimizations(prev => ({
            ...prev,
            seo_score: Math.min(100, prev.seo_score + 20)
          }));
        }
        
        if (type === 'all' || type === 'price') {
          setOptimizations(prev => ({
            ...prev,
            price_competitiveness: Math.min(100, prev.price_competitiveness + 20)
          }));
        }
      }

      toast({
        title: "Optimisation réussie",
        description: `Le produit "${product.name}" a été optimisé avec succès`
      });

    } catch (error) {
      toast({
        title: "Erreur d'optimisation",
        description: "Une erreur est survenue lors de l'optimisation",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
      setProgress(0);
    }
  };

  const calculateMargin = (price: number, cost: number) => {
    if (!cost || cost === 0) return 0;
    return ((price - cost) / price * 100).toFixed(1);
  };

  const suggestPrice = (costPrice: number, targetMargin: number = 40) => {
    return (costPrice / (1 - targetMargin / 100)).toFixed(2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Optimisation IA du Produit
        </CardTitle>
        <CardDescription>
          Optimisez automatiquement votre produit pour maximiser les ventes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="price">Prix</TabsTrigger>
            <TabsTrigger value="content">Contenu</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Scores d'optimisation */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Badge variant={optimizations.seo_score > 70 ? "default" : "secondary"}>
                      {optimizations.seo_score}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">SEO</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <Badge variant={optimizations.price_competitiveness > 70 ? "default" : "secondary"}>
                      {optimizations.price_competitiveness}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Prix</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <Badge variant={optimizations.description_quality > 70 ? "default" : "secondary"}>
                      {optimizations.description_quality}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Description</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    <Badge variant={optimizations.image_quality > 70 ? "default" : "secondary"}>
                      {optimizations.image_quality}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Images</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <Badge variant={optimizations.conversion_potential > 70 ? "default" : "secondary"}>
                      {optimizations.conversion_potential}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Conversion</p>
                </CardContent>
              </Card>
            </div>

            {/* Actions rapides */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => optimizeProduct('seo')}
                disabled={isOptimizing}
                variant="outline"
              >
                <Search className="w-4 h-4 mr-2" />
                Optimiser SEO
              </Button>
              <Button
                onClick={() => optimizeProduct('price')}
                disabled={isOptimizing}
                variant="outline"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Optimiser Prix
              </Button>
              <Button
                onClick={() => optimizeProduct('all')}
                disabled={isOptimizing}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isOptimizing ? 'Optimisation...' : 'Optimiser Tout'}
              </Button>
            </div>

            {isOptimizing && (
              <Progress value={progress} className="w-full" />
            )}

            {/* Recommandations */}
            <Card className="bg-muted">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Recommandations prioritaires
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Badge variant="outline">1</Badge>
                    <span>Améliorer le titre avec des mots-clés pertinents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline">2</Badge>
                    <span>Ajouter 3-5 images haute qualité supplémentaires</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline">3</Badge>
                    <span>Optimiser le prix pour une marge de 40%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline">4</Badge>
                    <span>Enrichir la description avec des bullet points</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre optimisé SEO</Label>
                <Input
                  id="title"
                  value={product.name}
                  placeholder="Titre avec mots-clés..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Longueur recommandée: 50-60 caractères
                </p>
              </div>

              <div>
                <Label htmlFor="meta-description">Meta Description</Label>
                <Textarea
                  id="meta-description"
                  placeholder="Description pour les moteurs de recherche..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Longueur recommandée: 150-160 caractères
                </p>
              </div>

              <div>
                <Label htmlFor="keywords">Mots-clés</Label>
                <Input
                  id="keywords"
                  placeholder="mot-clé1, mot-clé2, mot-clé3..."
                />
              </div>

              <Button className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Générer avec IA
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="price" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prix de coût</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={product.cost_price || 0}
                      readOnly
                    />
                    <span className="text-sm text-muted-foreground">{product.currency}</span>
                  </div>
                </div>
                <div>
                  <Label>Prix de vente</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={product.price}
                      readOnly
                    />
                    <span className="text-sm text-muted-foreground">{product.currency}</span>
                  </div>
                </div>
              </div>

              <Card className="bg-muted">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Marge actuelle</p>
                      <p className="text-2xl font-bold">
                        {calculateMargin(product.price, product.cost_price || 0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Prix suggéré</p>
                      <p className="text-2xl font-bold">
                        {suggestPrice(product.cost_price || 0)} {product.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Profit potentiel</p>
                      <p className="text-2xl font-bold text-green-600">
                        +{((parseFloat(suggestPrice(product.cost_price || 0)) - product.price) * 100).toFixed(0)} {product.currency}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label>Stratégie de prix</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button variant="outline" size="sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Premium
                  </Button>
                  <Button variant="outline" size="sm">
                    <Target className="w-4 h-4 mr-1" />
                    Compétitif
                  </Button>
                  <Button variant="outline" size="sm">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Économique
                  </Button>
                </div>
              </div>

              <Button className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Analyser la concurrence
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <div>
              <Label htmlFor="description">Description enrichie</Label>
              <Textarea
                id="description"
                value={product.description}
                rows={10}
                placeholder="Description détaillée du produit..."
              />
            </div>

            <div>
              <Label>Caractéristiques principales</Label>
              <div className="space-y-2 mt-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Input
                    key={i}
                    placeholder={`Caractéristique ${i}...`}
                  />
                ))}
              </div>
            </div>

            <Button className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Générer contenu avec IA
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
