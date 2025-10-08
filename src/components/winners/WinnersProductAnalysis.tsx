import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, DollarSign, Users, Target, AlertTriangle, ShoppingCart, Heart, Star } from 'lucide-react';
import { WinnerProduct } from '@/domains/winners/types';

interface WinnersProductAnalysisProps {
  product: WinnerProduct;
}

export const WinnersProductAnalysis = ({ product }: WinnersProductAnalysisProps) => {
  // Calculs d'analyse avancée
  const competitionLevel = product.final_score && product.final_score > 80 ? 'Faible' : 
                          product.final_score && product.final_score > 60 ? 'Moyenne' : 'Élevée';
  
  const profitPotential = product.price * 0.3; // 30% marge estimée
  const monthlyRevenuePotential = (product.sales || 100) * profitPotential;
  
  const viralScore = Math.min(100, (product.trending_score * 0.5) + (product.market_demand * 0.3) + ((product.reviews || 0) / 100 * 0.2));
  
  const marketSaturation = product.final_score && product.final_score < 50 ? 'Saturé' :
                           product.final_score && product.final_score < 75 ? 'Modéré' : 'Peu saturé';
  
  const seasonality = 'Toute l\'année'; // Simulé
  const adCostEstimate = product.price * 0.15; // 15% du prix pour la pub
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Analyse Complète - {product.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="market">Marché</TabsTrigger>
              <TabsTrigger value="profit">Rentabilité</TabsTrigger>
              <TabsTrigger value="competition">Concurrence</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
            </TabsList>

            {/* Vue d'ensemble */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Score Global</div>
                  <div className="text-2xl font-bold">{product.final_score?.toFixed(1) || 'N/A'}</div>
                  <Progress value={product.final_score || 0} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Score Viral</div>
                  <div className="text-2xl font-bold text-primary">{viralScore.toFixed(0)}</div>
                  <Progress value={viralScore} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Demande Marché</div>
                  <div className="text-2xl font-bold text-green-600">{product.market_demand?.toFixed(0) || 'N/A'}</div>
                  <Progress value={product.market_demand || 0} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Note Moyenne</div>
                  <div className="text-2xl font-bold flex items-center gap-1">
                    {product.rating?.toFixed(1) || 'N/A'}
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="text-sm text-muted-foreground">{product.reviews || 0} avis</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Indicateurs Clés</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Niveau de concurrence</span>
                      <Badge variant={competitionLevel === 'Faible' ? 'default' : 'secondary'}>
                        {competitionLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Saturation du marché</span>
                      <Badge variant="outline">{marketSaturation}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Saisonnalité</span>
                      <Badge variant="outline">{seasonality}</Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Social Proof</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      <span className="text-sm">{product.sales || 0} ventes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{product.reviews || 0} avis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">Tendance: {product.trending_score?.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Analyse Marché */}
            <TabsContent value="market" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Analyse de la Demande</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Volume de recherche estimé</span>
                      <span className="font-semibold">{Math.floor(product.market_demand || 0 * 100)}/mois</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Croissance tendance</span>
                      <span className="font-semibold text-green-600">+{product.trending_score?.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Intérêt géographique</span>
                      <span className="font-semibold">Mondial</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Potentiel de Niche</h4>
                  <Progress value={75} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Cette niche présente un excellent potentiel avec une demande croissante et une concurrence modérée.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Catégorie</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{product.category || 'Non catégorisé'}</Badge>
                    {product.tags?.map((tag, i) => (
                      <Badge key={i} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Analyse Rentabilité */}
            <TabsContent value="profit" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Prix de vente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{product.price.toFixed(2)} {product.currency}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Profit potentiel/vente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{profitPotential.toFixed(2)} {product.currency}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Revenu mensuel estimé</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{monthlyRevenuePotential.toFixed(0)} {product.currency}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Coût pub estimé</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{adCostEstimate.toFixed(2)} {product.currency}</div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Structure de Coûts Estimée</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Coût produit (30%)</span>
                    <span className="font-semibold">{(product.price * 0.3).toFixed(2)} {product.currency}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Frais plateforme (15%)</span>
                    <span className="font-semibold">{(product.price * 0.15).toFixed(2)} {product.currency}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Shipping (10%)</span>
                    <span className="font-semibold">{(product.price * 0.1).toFixed(2)} {product.currency}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Marketing (15%)</span>
                    <span className="font-semibold">{(product.price * 0.15).toFixed(2)} {product.currency}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t font-semibold">
                    <span className="text-sm">Marge nette (30%)</span>
                    <span className="text-green-600">{profitPotential.toFixed(2)} {product.currency}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Analyse Concurrence */}
            <TabsContent value="competition" className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Niveau de Concurrence</h4>
                <div className="flex items-center gap-4 mb-2">
                  <Progress value={product.final_score ? 100 - product.final_score : 50} className="flex-1 h-3" />
                  <Badge variant={competitionLevel === 'Faible' ? 'default' : 'destructive'}>
                    {competitionLevel}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {competitionLevel === 'Faible' 
                    ? "Excellente opportunité ! La concurrence est faible, ce qui facilite l'entrée sur le marché."
                    : "Attention : marché compétitif. Une stratégie de différenciation sera nécessaire."}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Points Forts Concurrentiels</h4>
                <ul className="space-y-2">
                  {product.rating && product.rating > 4 && (
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <span className="text-sm">Excellentes évaluations ({product.rating}/5)</span>
                    </li>
                  )}
                  {product.reviews && product.reviews > 100 && (
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <span className="text-sm">Fort social proof ({product.reviews} avis)</span>
                    </li>
                  )}
                  {product.trending_score && product.trending_score > 70 && (
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <span className="text-sm">Forte tendance actuelle</span>
                    </li>
                  )}
                  {product.price < 50 && (
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <span className="text-sm">Prix accessible favorisant les achats impulsifs</span>
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Points d'Attention
                </h4>
                <ul className="space-y-2">
                  {(!product.rating || product.rating < 3.5) && (
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5" />
                      <span className="text-sm">Notes faibles - Opportunité d'amélioration</span>
                    </li>
                  )}
                  {marketSaturation === 'Saturé' && (
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5" />
                      <span className="text-sm">Marché saturé - Différenciation nécessaire</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                    <span className="text-sm">Analyser les stratégies des top vendeurs</span>
                  </li>
                </ul>
              </div>
            </TabsContent>

            {/* Stratégie Marketing */}
            <TabsContent value="marketing" className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Budget Publicitaire Recommandé</h4>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{(adCostEstimate * 0.5).toFixed(2)} {product.currency}</div>
                        <div className="text-sm text-muted-foreground">Budget test</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{adCostEstimate.toFixed(2)} {product.currency}</div>
                        <div className="text-sm text-muted-foreground">Budget recommandé</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{(adCostEstimate * 2).toFixed(2)} {product.currency}</div>
                        <div className="text-sm text-muted-foreground">Budget scale</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Canaux Marketing Recommandés</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Facebook Ads</div>
                      <div className="text-sm text-muted-foreground">Idéal pour le ciblage démographique</div>
                    </div>
                    <Badge>Prioritaire</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">TikTok Ads</div>
                      <div className="text-sm text-muted-foreground">Fort potentiel viral</div>
                    </div>
                    <Badge>Recommandé</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Google Shopping</div>
                      <div className="text-sm text-muted-foreground">Capture d'intention d'achat</div>
                    </div>
                    <Badge variant="outline">Secondaire</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Score de Viralité</h4>
                <Progress value={viralScore} className="h-3 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Score: {viralScore.toFixed(0)}/100 - 
                  {viralScore > 70 ? " Excellent potentiel viral !" : 
                   viralScore > 50 ? " Bon potentiel de partage" : 
                   " Nécessite une stratégie créative forte"}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
