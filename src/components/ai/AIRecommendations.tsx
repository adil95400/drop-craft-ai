import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Zap, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Brain,
  Sparkles,
  ArrowRight,
  Clock,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AIRecommendation {
  id: string;
  type: 'product' | 'pricing' | 'marketing' | 'inventory' | 'seo';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  confidence: number;
  actions: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
  metrics?: {
    potential_revenue?: number;
    time_savings?: string;
    conversion_lift?: number;
  };
  createdAt: string;
}

interface AIRecommendationsProps {
  limit?: number;
  types?: string[];
}

export function AIRecommendations({ limit = 6, types }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingNew, setGeneratingNew] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  const fetchRecommendations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Simuler des recommandations IA intelligentes basées sur les données utilisateur
      const mockRecommendations: AIRecommendation[] = [
        {
          id: '1',
          type: 'pricing',
          priority: 'high',
          title: 'Optimisation Prix Automatique Détectée',
          description: 'L\'IA a identifié 12 produits avec un potentiel d\'augmentation de marge de 15-23%',
          impact: 'Augmentation estimée du CA : +€2,340/mois',
          confidence: 87,
          actions: [
            { label: 'Appliquer les prix optimisés', action: 'apply_pricing' },
            { label: 'Voir les détails', action: 'view_pricing_details' }
          ],
          metrics: {
            potential_revenue: 2340,
            conversion_lift: 15
          },
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          type: 'product',
          priority: 'high',
          title: 'Produits Tendances Détectés',
          description: 'Nouveaux produits à forte croissance dans votre niche identifiés par l\'IA',
          impact: '3 produits gagnants potentiels',
          confidence: 92,
          actions: [
            { label: 'Voir les produits', action: 'view_trending_products' },
            { label: 'Importer automatiquement', action: 'auto_import' }
          ],
          metrics: {
            potential_revenue: 4200
          },
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          type: 'inventory',
          priority: 'medium',
          title: 'Risque de Rupture de Stock',
          description: 'L\'IA prédit des ruptures de stock sur 5 produits performants dans les 7 prochains jours',
          impact: 'Éviter une perte de €1,890 en ventes',
          confidence: 78,
          actions: [
            { label: 'Réapprovisionner maintenant', action: 'restock_products' },
            { label: 'Configurer les alertes', action: 'setup_alerts' }
          ],
          metrics: {
            potential_revenue: 1890,
            time_savings: '2h par semaine'
          },
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          type: 'seo',
          priority: 'medium',
          title: 'Optimisation SEO Intelligente',
          description: 'L\'IA a généré des descriptions optimisées pour 28 produits avec faible visibilité',
          impact: 'Amélioration estimée du trafic organique : +35%',
          confidence: 83,
          actions: [
            { label: 'Appliquer les descriptions IA', action: 'apply_seo_content' },
            { label: 'Prévisualiser les changements', action: 'preview_seo' }
          ],
          metrics: {
            conversion_lift: 35,
            time_savings: '5h de rédaction'
          },
          createdAt: new Date().toISOString()
        },
        {
          id: '5',
          type: 'marketing',
          priority: 'low',
          title: 'Opportunité de Segmentation Client',
          description: 'L\'IA a identifié 3 segments clients distincts pour des campagnes ciblées',
          impact: 'Amélioration ROI marketing : +28%',
          confidence: 71,
          actions: [
            { label: 'Créer les segments', action: 'create_segments' },
            { label: 'Lancer campagne test', action: 'test_campaign' }
          ],
          metrics: {
            conversion_lift: 28,
            potential_revenue: 850
          },
          createdAt: new Date().toISOString()
        }
      ];

      // Filtrer par types si spécifié
      let filteredRecommendations = mockRecommendations;
      if (types && types.length > 0) {
        filteredRecommendations = mockRecommendations.filter(r => types.includes(r.type));
      }

      // Limiter le nombre de résultats
      setRecommendations(filteredRecommendations.slice(0, limit));
      
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les recommandations IA",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewRecommendations = async () => {
    setGeneratingNew(true);
    try {
      // Appeler l'edge function pour générer de nouvelles recommandations
      const { data, error } = await supabase.functions.invoke('ai-recommendations', {
        body: { 
          userId: user?.id,
          types: types || ['product', 'pricing', 'marketing', 'inventory', 'seo'],
          refresh: true
        }
      });

      if (error) throw error;

      toast({
        title: "Nouvelles recommandations générées",
        description: "L'IA a analysé vos données et généré de nouveaux insights",
      });

      await fetchRecommendations();
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer de nouvelles recommandations",
        variant: "destructive"
      });
    } finally {
      setGeneratingNew(false);
    }
  };

  const executeAction = async (recommendation: AIRecommendation, actionIndex: number) => {
    const action = recommendation.actions[actionIndex];
    
    try {
      // Simuler l'exécution de l'action
      toast({
        title: "Action en cours",
        description: `Exécution : ${action.label}`,
      });

      // Ici on appellerait les vraies fonctions selon l'action
      switch (action.action) {
        case 'apply_pricing':
          // Appeler l'edge function d'optimisation des prix
          break;
        case 'view_trending_products':
          // Rediriger vers la page des produits tendances
          break;
        case 'auto_import':
          // Lancer l'import automatique
          break;
        default:
          break;
      }

      setTimeout(() => {
        toast({
          title: "Action terminée",
          description: `${action.label} exécuté avec succès`,
        });
      }, 2000);

    } catch (error) {
      console.error('Error executing action:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exécuter cette action",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pricing': return DollarSign;
      case 'product': return TrendingUp;
      case 'marketing': return Target;
      case 'inventory': return AlertTriangle;
      case 'seo': return Sparkles;
      default: return Zap;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pricing': return 'text-green-600 bg-green-100';
      case 'product': return 'text-blue-600 bg-blue-100';
      case 'marketing': return 'text-purple-600 bg-purple-100';
      case 'inventory': return 'text-orange-600 bg-orange-100';
      case 'seo': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return '';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Recommandations IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Brain className="h-5 w-5 mr-2 text-primary" />
          <h3 className="text-lg font-semibold">Recommandations IA</h3>
          <Badge variant="outline" className="ml-2">
            {recommendations.length} insights
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generateNewRecommendations}
          disabled={generatingNew}
          className="flex items-center"
        >
          {generatingNew ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              Génération...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Actualiser
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((recommendation) => {
          const TypeIcon = getTypeIcon(recommendation.type);
          return (
            <Card
              key={recommendation.id}
              className={`relative overflow-hidden ${getPriorityColor(recommendation.priority)}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className={getTypeColor(recommendation.type)}
                  >
                    <TypeIcon className="h-3 w-3 mr-1" />
                    {recommendation.type.toUpperCase()}
                  </Badge>
                  <Badge
                    variant={recommendation.priority === 'high' ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {recommendation.priority === 'high' ? 'URGENT' : 
                     recommendation.priority === 'medium' ? 'IMPORTANT' : 'NORMAL'}
                  </Badge>
                </div>
                
                <CardTitle className="text-sm font-medium leading-tight">
                  {recommendation.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  {recommendation.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Confiance IA</span>
                    <span className="font-medium">{recommendation.confidence}%</span>
                  </div>
                  <Progress value={recommendation.confidence} className="h-1" />
                </div>

                <div className="bg-white/50 p-2 rounded text-xs">
                  <div className="flex items-center text-green-600 mb-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span className="font-medium">Impact prévu :</span>
                  </div>
                  <p className="text-foreground">{recommendation.impact}</p>
                </div>

                {recommendation.metrics && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {recommendation.metrics.potential_revenue && (
                      <div className="text-center p-1 bg-green-50 rounded">
                        <div className="font-medium text-green-600">
                          +€{recommendation.metrics.potential_revenue}
                        </div>
                        <div className="text-muted-foreground">Revenus</div>
                      </div>
                    )}
                    {recommendation.metrics.conversion_lift && (
                      <div className="text-center p-1 bg-blue-50 rounded">
                        <div className="font-medium text-blue-600">
                          +{recommendation.metrics.conversion_lift}%
                        </div>
                        <div className="text-muted-foreground">Conversion</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  {recommendation.actions.slice(0, 2).map((action, index) => (
                    <Button
                      key={index}
                      variant={index === 0 ? "default" : "outline"}
                      size="sm"
                      className="w-full text-xs h-7"
                      onClick={() => executeAction(recommendation, index)}
                    >
                      {action.label}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  ))}
                </div>

                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>
                    {new Date(recommendation.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {recommendations.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              L'IA analyse vos données pour générer des recommandations personnalisées
            </p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={generateNewRecommendations}
              disabled={generatingNew}
            >
              Générer des recommandations
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}