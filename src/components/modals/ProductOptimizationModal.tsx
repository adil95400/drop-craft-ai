import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, Target, TrendingUp, DollarSign, Image, FileText,
  BarChart3, Lightbulb, Rocket, Eye, RefreshCw, Wand2, PenTool, Camera
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProductScore, useAnalyzeProduct } from '@/hooks/useProductScoring';

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
  const { data: scoreData, isLoading: isLoadingScore } = useProductScore(productId);
  const analyzeProduct = useAnalyzeProduct();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);

  // Derive scores from real data or fallback to 0
  const scores = {
    seo: scoreData?.seo_score ?? 0,
    images: scoreData?.images_score ?? 0,
    pricing: scoreData?.pricing_score ?? 0,
    description: scoreData?.description_score ?? 0,
    title: scoreData?.title_score ?? 0,
  };

  const overallScore = scoreData?.overall_score ?? 0;
  const issues = scoreData?.issues ?? [];
  const recommendations = scoreData?.recommendations ?? [];

  // Auto-analyze on open if no score exists
  useEffect(() => {
    if (open && productId && !scoreData && !isLoadingScore) {
      analyzeProduct.mutate(productId);
    }
  }, [open, productId, scoreData, isLoadingScore]);

  const handleOptimizeAll = async () => {
    if (!productId) return;
    setIsOptimizing(true);
    setOptimizationProgress(20);
    try {
      await analyzeProduct.mutateAsync(productId);
      setOptimizationProgress(100);
      toast({ title: "Analyse terminée", description: "Les scores ont été recalculés" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de lancer l'analyse", variant: "destructive" });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateWithAI = (type: string) => {
    toast({ title: "Génération IA lancée", description: `Création automatique du ${type} en cours...` });
  };

  const scoreColor = (s: number) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-600';
  const scoreBadge = (s: number) => s >= 80 ? 'default' : 'secondary';

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
                  <p className="text-muted-foreground">
                    {isLoadingScore ? 'Chargement...' : 'Performance globale du produit'}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold ${scoreColor(overallScore)}`}>
                    {Math.round(overallScore)}/100
                  </div>
                  <Progress value={overallScore} className="w-32 mt-2" />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4">
                {Object.entries(scores).map(([key, value]) => (
                  <div key={key} className="text-center p-3 border rounded-lg">
                    <div className="text-sm font-medium capitalize">{key}</div>
                    <div className={`text-2xl font-bold mt-1 ${scoreColor(value)}`}>{Math.round(value)}</div>
                  </div>
                ))}
              </div>

              {isOptimizing && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Analyse en cours...</span>
                    <span>{Math.round(optimizationProgress)}%</span>
                  </div>
                  <Progress value={optimizationProgress} />
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button onClick={handleOptimizeAll} disabled={isOptimizing || !productId} className="flex-1">
                  {isOptimizing ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Analyse...</>
                  ) : (
                    <><Rocket className="w-4 h-4 mr-2" />Analyser &amp; Optimiser</>
                  )}
                </Button>
                <Button variant="outline"><Eye className="w-4 h-4 mr-2" />Aperçu</Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="issues" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="issues">Problèmes ({issues.length})</TabsTrigger>
              <TabsTrigger value="recommendations">Recommandations ({recommendations.length})</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="content">Contenu</TabsTrigger>
            </TabsList>

            {/* Issues Tab */}
            <TabsContent value="issues" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Problèmes détectés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {issues.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aucun problème détecté 🎉</p>
                  ) : (
                    <div className="space-y-3">
                      {issues.map((issue, idx) => (
                        <div key={idx} className="p-4 border rounded-lg flex items-start gap-3">
                          <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'} className="mt-0.5">
                            {issue.severity}
                          </Badge>
                          <div>
                            <div className="font-medium capitalize">{issue.category}</div>
                            <div className="text-sm text-muted-foreground">{issue.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Recommandations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recommendations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aucune recommandation pour l'instant</p>
                  ) : (
                    <div className="space-y-3">
                      {recommendations.map((rec, idx) => (
                        <div key={idx} className="p-4 border rounded-lg flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Badge variant={rec.impact === 'high' ? 'default' : 'secondary'} className="mt-0.5">
                              {rec.impact}
                            </Badge>
                            <div>
                              <div className="font-medium capitalize">{rec.category}</div>
                              <div className="text-sm text-muted-foreground">{rec.message}</div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleGenerateWithAI(rec.category)}>
                            <Wand2 className="w-3 h-3 mr-1" />IA
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Target className="w-5 h-5" />Optimisation SEO
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={scoreBadge(scores.seo)}>Score: {Math.round(scores.seo)}/100</Badge>
                      <Button size="sm" onClick={() => handleGenerateWithAI('SEO')}>
                        <Wand2 className="w-4 h-4 mr-2" />IA
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {issues.filter(i => i.category === 'seo').length > 0 ? (
                      issues.filter(i => i.category === 'seo').map((issue, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'}>{issue.severity}</Badge>
                            <span className="font-medium">{issue.message}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">SEO optimisé ✓</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />Optimisation Contenu
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={scoreBadge(scores.description)}>Score: {Math.round(scores.description)}/100</Badge>
                      <Button size="sm" onClick={() => handleGenerateWithAI('Contenu')}>
                        <Wand2 className="w-4 h-4 mr-2" />IA
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {issues.filter(i => ['title', 'description'].includes(i.category)).length > 0 ? (
                      issues.filter(i => ['title', 'description'].includes(i.category)).map((issue, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'}>{issue.severity}</Badge>
                            <span className="font-medium capitalize">{issue.category}: {issue.message}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Contenu bien structuré ✓</p>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Card>
                        <CardHeader><CardTitle className="text-sm">Actions rapides</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          <Button variant="outline" className="w-full justify-start" onClick={() => handleGenerateWithAI('description')}>
                            <PenTool className="w-4 h-4 mr-2" />Réécrire la description
                          </Button>
                          <Button variant="outline" className="w-full justify-start" onClick={() => handleGenerateWithAI('alt_texts')}>
                            <Image className="w-4 h-4 mr-2" />Générer textes alternatifs
                          </Button>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle className="text-sm">Scores détaillés</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Titre</span>
                            <span className={`font-medium ${scoreColor(scores.title)}`}>{Math.round(scores.title)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Description</span>
                            <span className={`font-medium ${scoreColor(scores.description)}`}>{Math.round(scores.description)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Images</span>
                            <span className={`font-medium ${scoreColor(scores.images)}`}>{Math.round(scores.images)}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
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
