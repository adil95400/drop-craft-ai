import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  Zap, 
  TrendingUp, 
  DollarSign, 
  Package,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export function AutoReorderManager() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(false);
  const { toast } = useToast();

  const checkReorderNeeds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-stock-reorder');

      if (error) throw error;

      setRecommendations(data.reorder_recommendations || []);
      toast({
        title: "Analyse terminée",
        description: `${data.count} produit(s) nécessitent un réapprovisionnement`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const totalEstimatedCost = recommendations.reduce((sum, rec) => sum + rec.estimated_cost, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Réapprovisionnement Automatique
              </CardTitle>
              <CardDescription>
                Analyse intelligente des besoins en réapprovisionnement
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  id="auto-reorder" 
                  checked={autoReorderEnabled}
                  onCheckedChange={setAutoReorderEnabled}
                />
                <Label htmlFor="auto-reorder" className="text-sm">
                  Auto-commande
                </Label>
              </div>
              <Button onClick={checkReorderNeeds} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyse...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Analyser
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {recommendations.length > 0 && (
          <CardContent>
            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Produits à Commander</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{recommendations.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Coût Estimé Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totalEstimatedCost.toFixed(2)} €</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Commandes Critiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-500">
                    {recommendations.filter(r => r.urgency === 'critical').length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations List */}
            <div className="space-y-3">
              <h3 className="font-semibold mb-3">Recommandations de Commande</h3>
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getUrgencyColor(rec.urgency)}>
                          {rec.urgency}
                        </Badge>
                        {rec.ai_prediction && (
                          <Badge variant="outline" className="bg-blue-50">
                            IA: {Math.round(rec.ai_prediction.confidence * 100)}% confiance
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Stock Actuel</p>
                          <p className="font-semibold">{rec.current_stock} unités</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Point de Réappro</p>
                          <p className="font-semibold">{rec.reorder_point} unités</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Quantité Recommandée</p>
                          <p className="font-semibold text-green-600">
                            {rec.recommended_quantity} unités
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Coût Estimé</p>
                          <p className="font-semibold">
                            {rec.estimated_cost.toFixed(2)} €
                          </p>
                        </div>
                      </div>

                      {rec.ai_prediction?.predicted_stockout_date && (
                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-sm">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-blue-500" />
                            <span>
                              Rupture prévue: {' '}
                              {new Date(rec.ai_prediction.predicted_stockout_date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Package className="h-4 w-4 mr-2" />
                      Voir Produit
                    </Button>
                    <Button size="sm" disabled={!autoReorderEnabled}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Commander
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Mode Automatique</p>
                  <p className="text-sm text-muted-foreground">
                    Activez le mode automatique pour que les commandes soient passées automatiquement 
                    lorsque les niveaux de stock atteignent les seuils critiques.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        )}

        {!loading && recommendations.length === 0 && (
          <CardContent>
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Tous les stocks sont OK</p>
              <p className="text-sm text-muted-foreground">
                Aucun réapprovisionnement nécessaire pour le moment
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
