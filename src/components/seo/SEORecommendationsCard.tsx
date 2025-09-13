import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Lightbulb,
  ArrowRight,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'hard';
  category: 'content' | 'technical' | 'structure' | 'performance';
  priority: number;
  estimatedImpact: string;
}

interface SEORecommendationsCardProps {
  recommendations?: Recommendation[];
  loading?: boolean;
}

export const SEORecommendationsCard = ({ 
  recommendations = [], 
  loading = false 
}: SEORecommendationsCardProps) => {
  const { toast } = useToast();

  // Données de démonstration si aucune recommandation n'est fournie
  const defaultRecommendations: Recommendation[] = [
    {
      id: '1',
      title: 'Optimiser les balises title',
      description: 'Améliorer les balises title de vos pages principales pour inclure des mots-clés stratégiques.',
      impact: 'high',
      effort: 'easy',
      category: 'content',
      priority: 95,
      estimatedImpact: '+15% de trafic organique'
    },
    {
      id: '2',
      title: 'Améliorer la vitesse de chargement',
      description: 'Optimiser les images et réduire les scripts JavaScript pour améliorer les Core Web Vitals.',
      impact: 'high',
      effort: 'medium',
      category: 'performance',
      priority: 90,
      estimatedImpact: '+12% de taux de conversion'
    },
    {
      id: '3',
      title: 'Créer du contenu sur les mots-clés longue traîne',
      description: 'Développer des articles de blog ciblant des requêtes spécifiques de votre secteur.',
      impact: 'medium',
      effort: 'hard',
      category: 'content',
      priority: 85,
      estimatedImpact: '+25% de pages indexées'
    },
    {
      id: '4',
      title: 'Implémenter les données structurées',
      description: 'Ajouter le balisage Schema.org pour améliorer l\'affichage dans les résultats de recherche.',
      impact: 'medium',
      effort: 'medium',
      category: 'technical',
      priority: 80,
      estimatedImpact: '+8% de CTR'
    }
  ];

  const displayRecommendations = recommendations.length > 0 ? recommendations : defaultRecommendations;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'content': return <Target className="w-4 h-4" />;
      case 'technical': return <AlertTriangle className="w-4 h-4" />;
      case 'structure': return <CheckCircle className="w-4 h-4" />;
      case 'performance': return <TrendingUp className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const handleApplyRecommendation = async (recommendation: Recommendation) => {
    // Simulation de l'application de la recommandation
    const loadingToast = toast({
      title: "Application en cours...",
      description: `Implémentation de: ${recommendation.title}`,
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate different outcomes based on recommendation type
    const outcomes = {
      'Optimiser les balises title': {
        success: true,
        message: 'Balises title optimisées sur 12 pages',
        impact: '+15% de trafic organique estimé'
      },
      'Améliorer la vitesse de chargement': {
        success: true,
        message: 'Images optimisées et scripts minifiés',
        impact: '+12% de taux de conversion estimé'
      },
      'Créer du contenu sur les mots-clés longue traîne': {
        success: true,
        message: '5 nouveaux articles générés et publiés',
        impact: '+25% de pages indexées estimé'
      },
      'Implémenter les données structurées': {
        success: true,
        message: 'Schema.org ajouté sur les pages produits',
        impact: '+8% de CTR estimé'
      }
    };

    const outcome = outcomes[recommendation.title as keyof typeof outcomes] || {
      success: true,
      message: 'Recommandation appliquée avec succès',
      impact: 'Impact positif attendu'
    };

    toast({
      title: outcome.success ? "✅ Recommandation appliquée" : "❌ Erreur d'application",
      description: `${outcome.message} - ${outcome.impact}`,
      variant: outcome.success ? "default" : "destructive"
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Recommandations IA
          </CardTitle>
          <CardDescription>
            Analyse en cours de vos données SEO...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Recommandations IA
        </CardTitle>
        <CardDescription>
          Optimisations personnalisées basées sur l'analyse de vos données
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayRecommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(recommendation.category)}
                  <h4 className="font-semibold">{recommendation.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    {recommendation.priority}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApplyRecommendation(recommendation)}
                >
                  Appliquer
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {recommendation.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getImpactColor(recommendation.impact)}`}>
                    Impact: {recommendation.impact}
                  </Badge>
                  <Badge className={`text-xs ${getEffortColor(recommendation.effort)}`}>
                    Effort: {recommendation.effort}
                  </Badge>
                </div>
                <div className="text-sm font-medium text-green-600">
                  {recommendation.estimatedImpact}
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Priorité</span>
                  <span className="text-xs font-medium">{recommendation.priority}/100</span>
                </div>
                <Progress value={recommendation.priority} className="h-1" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};