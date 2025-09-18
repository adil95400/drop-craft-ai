import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Zap,
  Target,
  TrendingUp,
  DollarSign,
  Image,
  FileText,
  Star,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Rocket,
  Eye,
  RefreshCw,
  Wand2,
  PenTool,
  Camera
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductOptimizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  productName?: string;
}

export const ProductOptimizationModal: React.FC<ProductOptimizationModalProps> = ({
  open,
  onOpenChange,
  productId,
  productName
}) => {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizations, setOptimizations] = useState({
    seo: { score: 65, suggestions: 5, applied: 0 },
    images: { score: 72, suggestions: 3, applied: 0 },
    pricing: { score: 78, suggestions: 2, applied: 0 },
    description: { score: 60, suggestions: 4, applied: 0 },
    categories: { score: 85, suggestions: 1, applied: 0 }
  });

  const seoSuggestions = [
    {
      id: 'title',
      priority: 'high',
      type: 'SEO Title',
      current: 'Produit basique',
      suggested: 'Smartphone Pro Max 128GB - Dernière Génération 2024',
      impact: '+15% visibilité',
      effort: 'Faible'
    },
    {
      id: 'meta',
      priority: 'medium',
      type: 'Meta Description',
      current: 'Description courte',
      suggested: 'Découvrez le Smartphone Pro Max avec 128GB de stockage, appareil photo 50MP et écran OLED 6.7". Livraison gratuite et garantie 2 ans.',
      impact: '+8% CTR',
      effort: 'Faible'
    },
    {
      id: 'keywords',
      priority: 'high',
      type: 'Mots-clés',
      current: '2 mots-clés',
      suggested: '15 mots-clés ciblés: smartphone, pro max, 128gb, appareil photo...',
      impact: '+25% trafic',
      effort: 'Moyen'
    }
  ];

  const pricingSuggestions = [
    {
      id: 'competitive',
      type: 'Prix compétitif',
      current: '€899',
      suggested: '€849',
      reasoning: 'Concurrents 6% moins chers',
      impact: '+12% conversions',
      confidence: 85
    },
    {
      id: 'psychology',
      type: 'Prix psychologique',
      current: '€849',
      suggested: '€847',
      reasoning: 'Effet de prix psychologique',
      impact: '+3% conversions',
      confidence: 92
    }
  ];

  const imageSuggestions = [
    {
      id: 'main',
      type: 'Image principale',
      issue: 'Qualité insuffisante (720p)',
      suggestion: 'Remplacer par image HD (1080p+)',
      impact: '+8% engagement'
    },
    {
      id: 'lifestyle',
      type: 'Images lifestyle',
      issue: '1 seule image produit',
      suggestion: 'Ajouter 3-4 images d\'usage',
      impact: '+15% conversions'
    },
    {
      id: 'alt-text',
      type: 'Texte alternatif',
      issue: 'Alt text manquant',
      suggestion: 'Ajouter descriptions d\'images',
      impact: '+5% SEO'
    }
  ];

  const contentSuggestions = [
    {
      id: 'description',
      type: 'Description enrichie',
      current: '50 mots',
      suggested: '200+ mots avec caractéristiques détaillées',
      impact: '+20% temps sur page',
      sample: 'Découvrez le Smartphone Pro Max, conçu pour les utilisateurs exigeants...'
    },
    {
      id: 'features',
      type: 'Liste des fonctionnalités',
      current: 'Texte simple',
      suggested: 'Puces avec icônes et bénéfices',
      impact: '+12% compréhension',
      sample: '✓ Écran OLED 6.7" ultra-net\n✓ Batterie 24h d\'autonomie\n✓ Appareil photo pro 50MP'
    },
    {
      id: 'specs',
      type: 'Spécifications techniques',
      current: 'Manquantes',
      suggested: 'Tableau détaillé complet',
      impact: '+18% confiance',
      sample: 'Dimensions, poids, connectivité, garantie...'
    }
  ];

  const handleOptimizeAll = async () => {
    setIsOptimizing(true);
    setOptimizationProgress(0);
    
    const steps = ['SEO', 'Images', 'Prix', 'Contenu', 'Finalisation'];
    
    for (let i = 0; i < steps.length; i++) {
      setTimeout(() => {
        setOptimizationProgress(((i + 1) / steps.length) * 100);
        
        if (i === steps.length - 1) {
          setIsOptimizing(false);
          setOptimizations(prev => ({
            seo: { ...prev.seo, score: 92, applied: prev.seo.suggestions },
            images: { ...prev.images, score: 88, applied: prev.images.suggestions },
            pricing: { ...prev.pricing, score: 95, applied: prev.pricing.suggestions },
            description: { ...prev.description, score: 90, applied: prev.description.suggestions },
            categories: { ...prev.categories, score: 95, applied: prev.categories.suggestions }
          }));
          
          toast({
            title: "Optimisation terminée",
            description: "Toutes les améliorations ont été appliquées avec succès",
          });
        }
      }, (i + 1) * 1000);
    }
  };

  const handleApplySuggestion = (type: string, id: string) => {
    toast({
      title: "Suggestion appliquée",
      description: `Optimisation ${type} mise en place`,
    });
    
    // Mettre à jour les scores
    setOptimizations(prev => ({
      ...prev,
      [type]: {
        ...prev[type as keyof typeof prev],
        applied: prev[type as keyof typeof prev].applied + 1,
        score: Math.min(95, prev[type as keyof typeof prev].score + 5)
      }
    }));
  };

  const handleGenerateWithAI = (type: string) => {
    toast({
      title: "Génération IA lancée",
      description: `Création automatique du ${type} en cours...`,
    });
  };

  const overallScore = Math.round(
    (optimizations.seo.score + optimizations.images.score + optimizations.pricing.score + 
     optimizations.description.score + optimizations.categories.score) / 5
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Optimisation Produit IA
          </DialogTitle>
          <DialogDescription>
            {productName ? `Optimisation de "${productName}"` : 'Optimisation automatique avec intelligence artificielle'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score global */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">Score d'optimisation</h3>
                  <p className="text-muted-foreground">Performance globale du produit</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-primary">{overallScore}/100</div>
                  <Progress value={overallScore} className="w-32 mt-2" />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4">
                {Object.entries(optimizations).map(([key, data]) => (
                  <div key={key} className="text-center p-3 border rounded-lg">
                    <div className="text-sm font-medium capitalize">{key}</div>
                    <div className="text-2xl font-bold mt-1">{data.score}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {data.applied}/{data.suggestions} appliquées
                    </div>
                  </div>
                ))}
              </div>

              {isOptimizing && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Optimisation en cours...</span>
                    <span>{Math.round(optimizationProgress)}%</span>
                  </div>
                  <Progress value={optimizationProgress} />
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button onClick={handleOptimizeAll} disabled={isOptimizing} className="flex-1">
                  {isOptimizing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Optimisation...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Optimiser tout automatiquement
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Onglets d'optimisation */}
          <Tabs defaultValue="seo" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="pricing">Prix</TabsTrigger>
              <TabsTrigger value="content">Contenu</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Optimisation SEO
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={optimizations.seo.score >= 80 ? 'default' : 'secondary'}>
                        Score: {optimizations.seo.score}/100
                      </Badge>
                      <Button size="sm" onClick={() => handleGenerateWithAI('SEO')}>
                        <Wand2 className="w-4 h-4 mr-2" />
                        IA
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {seoSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{suggestion.type}</h4>
                              <Badge variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}>
                                {suggestion.priority === 'high' ? 'Priorité haute' : 'Priorité moyenne'}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Impact: {suggestion.impact} • Effort: {suggestion.effort}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleApplySuggestion('seo', suggestion.id)}
                          >
                            Appliquer
                          </Button>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-red-600">Actuel: </span>
                            <span className="text-muted-foreground">{suggestion.current}</span>
                          </div>
                          <div>
                            <span className="font-medium text-green-600">Suggéré: </span>
                            <span>{suggestion.suggested}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value="images" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Optimisation Images
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={optimizations.images.score >= 80 ? 'default' : 'secondary'}>
                        Score: {optimizations.images.score}/100
                      </Badge>
                      <Button size="sm" onClick={() => handleGenerateWithAI('Images')}>
                        <Wand2 className="w-4 h-4 mr-2" />
                        IA
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {imageSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{suggestion.type}</h4>
                            <div className="text-sm text-muted-foreground mt-1">
                              Impact: {suggestion.impact}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleApplySuggestion('images', suggestion.id)}
                          >
                            Optimiser
                          </Button>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-red-600">Problème: </span>
                            <span className="text-muted-foreground">{suggestion.issue}</span>
                          </div>
                          <div>
                            <span className="font-medium text-green-600">Solution: </span>
                            <span>{suggestion.suggestion}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Actions rapides</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          <Image className="w-4 h-4 mr-2" />
                          Compresser toutes les images
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <PenTool className="w-4 h-4 mr-2" />
                          Générer textes alternatifs
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Suggestions IA d'images
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Statistiques</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Images actuelles</span>
                          <span className="font-medium">3</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Qualité moyenne</span>
                          <span className="font-medium">72%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Taille moyenne</span>
                          <span className="font-medium">245 KB</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Optimisation Prix
                    </span>
                    <Badge variant={optimizations.pricing.score >= 80 ? 'default' : 'secondary'}>
                      Score: {optimizations.pricing.score}/100
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pricingSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{suggestion.type}</h4>
                            <div className="text-sm text-muted-foreground mt-1">
                              Confiance IA: {suggestion.confidence}%
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleApplySuggestion('pricing', suggestion.id)}
                          >
                            Appliquer
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Prix actuel: </span>
                            <span className="text-lg font-bold">{suggestion.current}</span>
                          </div>
                          <div>
                            <span className="font-medium">Prix suggéré: </span>
                            <span className="text-lg font-bold text-green-600">{suggestion.suggested}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-3 bg-muted rounded">
                          <div className="text-sm">
                            <div className="font-medium">Analyse:</div>
                            <div className="text-muted-foreground">{suggestion.reasoning}</div>
                            <div className="text-green-600 mt-1">{suggestion.impact}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Analyse concurrentielle */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-sm">Analyse concurrentielle</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Prix moyen marché</span>
                          <span className="font-medium">€825</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Votre position</span>
                          <Badge variant="secondary">+3% au-dessus</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Élasticité prix</span>
                          <span className="font-medium">Moyenne</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Marge optimale</span>
                          <span className="font-medium text-green-600">35-40%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Optimisation Contenu
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={optimizations.description.score >= 80 ? 'default' : 'secondary'}>
                        Score: {optimizations.description.score}/100
                      </Badge>
                      <Button size="sm" onClick={() => handleGenerateWithAI('Contenu')}>
                        <Wand2 className="w-4 h-4 mr-2" />
                        IA
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contentSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{suggestion.type}</h4>
                            <div className="text-sm text-muted-foreground mt-1">
                              {suggestion.impact}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleApplySuggestion('description', suggestion.id)}
                          >
                            Générer
                          </Button>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-red-600">Actuel: </span>
                            <span className="text-muted-foreground">{suggestion.current}</span>
                          </div>
                          <div>
                            <span className="font-medium text-green-600">Suggéré: </span>
                            <span>{suggestion.suggested}</span>
                          </div>
                          {suggestion.sample && (
                            <div className="p-2 bg-muted rounded text-xs">
                              <strong>Exemple:</strong> {suggestion.sample}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Performance Actuelle
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Vues (30j)</span>
                        <span className="font-medium">2,847</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Conversions</span>
                        <span className="font-medium">3.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Temps sur page</span>
                        <span className="font-medium">1m 34s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Taux de rebond</span>
                        <span className="font-medium">68%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Prévisions Post-Optimisation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Vues estimées</span>
                        <span className="font-medium text-green-600">+35% (3,843)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Conversions</span>
                        <span className="font-medium text-green-600">+28% (4.1%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Engagement</span>
                        <span className="font-medium text-green-600">+22% (1m 56s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">SEO Ranking</span>
                        <span className="font-medium text-green-600">+15 positions</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Impact Financier Estimé</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">+€2,340</div>
                      <div className="text-sm text-muted-foreground">Revenus mensuels</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">+47</div>
                      <div className="text-sm text-muted-foreground">Ventes supplémentaires</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">ROI 340%</div>
                      <div className="text-sm text-muted-foreground">Retour sur investissement</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    * Estimations basées sur l'analyse de produits similaires et l'historique de performance
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};