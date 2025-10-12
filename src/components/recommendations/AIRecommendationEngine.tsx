import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Users, Package, DollarSign, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Recommendation {
  id: string;
  category: 'pricing' | 'inventory' | 'marketing' | 'customer';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  confidence: number;
  action: string;
}

export function AIRecommendationEngine() {
  const [loading, setLoading] = useState(false);
  const [recommendations] = useState<Recommendation[]>([
    {
      id: '1',
      category: 'pricing',
      priority: 'high',
      title: 'Ajuster le prix de 3 produits phares',
      description: 'L\'analyse de la concurrence suggère une augmentation de 5-8% pour les produits dans la catégorie "Électronique" sans impact négatif sur les ventes.',
      impact: '+2 340€/mois estimé',
      confidence: 87,
      action: 'Appliquer les nouveaux prix'
    },
    {
      id: '2',
      category: 'inventory',
      priority: 'high',
      title: 'Réapprovisionner 12 produits populaires',
      description: '12 produits avec forte demande risquent la rupture de stock dans les 7 prochains jours.',
      impact: 'Éviter -4 500€ de ventes perdues',
      confidence: 92,
      action: 'Voir les produits concernés'
    },
    {
      id: '3',
      category: 'marketing',
      priority: 'medium',
      title: 'Campagne email ciblée',
      description: '1 234 clients inactifs depuis 60+ jours avec historique d\'achat élevé. Taux de réactivation estimé: 18%.',
      impact: '+890€ de revenus potentiels',
      confidence: 76,
      action: 'Créer la campagne'
    },
    {
      id: '4',
      category: 'customer',
      priority: 'medium',
      title: 'Programme de fidélité personnalisé',
      description: 'Vos 50 meilleurs clients génèrent 35% du CA. Un programme VIP augmenterait la rétention de 23%.',
      impact: '+12% de revenus récurrents',
      confidence: 81,
      action: 'Configurer le programme'
    },
    {
      id: '5',
      category: 'marketing',
      priority: 'low',
      title: 'Optimiser les descriptions produits',
      description: '28 produits ont des descriptions courtes. L\'enrichissement améliore le SEO et les conversions de 12%.',
      impact: '+340 visites/mois',
      confidence: 69,
      action: 'Générer avec l\'IA'
    },
  ]);

  const getCategoryIcon = (category: Recommendation['category']) => {
    switch (category) {
      case 'pricing': return DollarSign;
      case 'inventory': return Package;
      case 'marketing': return TrendingUp;
      case 'customer': return Users;
    }
  };

  const getCategoryColor = (category: Recommendation['category']) => {
    switch (category) {
      case 'pricing': return 'bg-green-500';
      case 'inventory': return 'bg-blue-500';
      case 'marketing': return 'bg-purple-500';
      case 'customer': return 'bg-orange-500';
    }
  };

  const getPriorityColor = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-gray-500';
    }
  };

  const refreshRecommendations = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Recommandations IA
              </CardTitle>
              <CardDescription>
                Suggestions personnalisées basées sur vos données
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshRecommendations}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {recommendations.map((rec) => {
          const Icon = getCategoryIcon(rec.category);
          return (
            <Card key={rec.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(rec.category)}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'} priorité
                        </Badge>
                      </div>
                      <CardDescription>{rec.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Impact estimé</span>
                    <span className="font-semibold text-primary">{rec.impact}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Niveau de confiance</span>
                      <span className="font-semibold">{rec.confidence}%</span>
                    </div>
                    <Progress value={rec.confidence} className="h-2" />
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1">
                      {rec.action}
                    </Button>
                    <Button variant="outline" size="icon">
                      <span className="sr-only">Plus d'infos</span>
                      ℹ️
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {recommendations.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Aucune recommandation pour le moment.<br />
              L'IA analyse vos données en continu.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
