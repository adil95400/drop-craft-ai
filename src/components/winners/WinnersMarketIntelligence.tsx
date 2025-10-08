import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertCircle, Target, Globe, Calendar } from 'lucide-react';

interface MarketData {
  category: string;
  growthRate: number;
  saturationLevel: number;
  avgPrice: number;
  competition: 'low' | 'medium' | 'high';
  topProducts: number;
  seasonality: string;
  bestMonths: string[];
}

export const WinnersMarketIntelligence = () => {
  // Données simulées - Dans une vraie app, ces données viendraient d'une API
  const marketData: MarketData[] = [
    {
      category: 'Tech & Gadgets',
      growthRate: 45,
      saturationLevel: 35,
      avgPrice: 49.99,
      competition: 'medium',
      topProducts: 156,
      seasonality: 'Toute l\'année',
      bestMonths: ['Nov', 'Déc', 'Jan']
    },
    {
      category: 'Maison & Jardin',
      growthRate: 38,
      saturationLevel: 55,
      avgPrice: 34.99,
      competition: 'high',
      topProducts: 234,
      seasonality: 'Printemps/Été',
      bestMonths: ['Mar', 'Avr', 'Mai']
    },
    {
      category: 'Sport & Fitness',
      growthRate: 52,
      saturationLevel: 28,
      avgPrice: 39.99,
      competition: 'low',
      topProducts: 89,
      seasonality: 'Janvier + Été',
      bestMonths: ['Jan', 'Juin', 'Juil']
    },
    {
      category: 'Beauté & Soins',
      growthRate: 31,
      saturationLevel: 72,
      avgPrice: 24.99,
      competition: 'high',
      topProducts: 312,
      seasonality: 'Toute l\'année',
      bestMonths: ['Fév', 'Nov', 'Déc']
    },
    {
      category: 'Bébé & Enfant',
      growthRate: 41,
      saturationLevel: 48,
      avgPrice: 29.99,
      competition: 'medium',
      topProducts: 178,
      seasonality: 'Toute l\'année',
      bestMonths: ['Sep', 'Oct', 'Nov']
    },
  ];

  const globalTrends = [
    {
      trend: 'Produits écologiques',
      growth: '+67%',
      icon: '🌱',
      description: 'Forte demande pour les produits durables et écoresponsables'
    },
    {
      trend: 'Tech portable',
      growth: '+54%',
      icon: '⌚',
      description: 'Montres connectées et accessoires smart en forte croissance'
    },
    {
      trend: 'Bien-être mental',
      growth: '+48%',
      icon: '🧘',
      description: 'Produits de méditation, stress relief et self-care'
    },
    {
      trend: 'Travail à domicile',
      growth: '+42%',
      icon: '🏠',
      description: 'Équipements et accessoires pour le télétravail'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tendances Globales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Tendances de Marché Globales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {globalTrends.map((trend, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="text-3xl">{trend.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{trend.trend}</h4>
                    <Badge variant="default" className="bg-green-500">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {trend.growth}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{trend.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analyse par Catégorie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Intelligence par Catégorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {marketData.map((category, index) => (
              <div key={index} className="space-y-3 pb-6 border-b last:border-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">{category.category}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      category.competition === 'low' ? 'default' :
                      category.competition === 'medium' ? 'secondary' : 'destructive'
                    }>
                      Concurrence: {category.competition === 'low' ? 'Faible' : category.competition === 'medium' ? 'Moyenne' : 'Élevée'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Croissance</div>
                    <div className="flex items-center gap-1">
                      {category.growthRate > 40 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-orange-500" />
                      )}
                      <span className={`font-semibold ${category.growthRate > 40 ? 'text-green-600' : 'text-orange-600'}`}>
                        +{category.growthRate}%
                      </span>
                    </div>
                    <Progress value={category.growthRate} className="h-1 mt-1" />
                  </div>

                  <div>
                    <div className="text-muted-foreground mb-1">Saturation</div>
                    <div className="font-semibold">{category.saturationLevel}%</div>
                    <Progress value={category.saturationLevel} className="h-1 mt-1" />
                  </div>

                  <div>
                    <div className="text-muted-foreground mb-1">Prix moyen</div>
                    <div className="font-semibold">{category.avgPrice} €</div>
                  </div>

                  <div>
                    <div className="text-muted-foreground mb-1">Top produits</div>
                    <div className="font-semibold">{category.topProducts}</div>
                  </div>

                  <div>
                    <div className="text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Saisonnalité
                    </div>
                    <div className="font-semibold text-xs">{category.seasonality}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <span className="text-xs text-muted-foreground">Meilleurs mois:</span>
                  {category.bestMonths.map((month, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {month}
                    </Badge>
                  ))}
                </div>

                {/* Recommandation */}
                {category.competition === 'low' && category.growthRate > 40 && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-semibold text-green-900 dark:text-green-100">🎯 Opportunité excellente !</span>
                      <p className="text-green-800 dark:text-green-200">
                        Forte croissance avec faible concurrence - Idéal pour démarrer rapidement
                      </p>
                    </div>
                  </div>
                )}

                {category.saturationLevel > 70 && (
                  <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-semibold text-orange-900 dark:text-orange-100">⚠️ Marché saturé</span>
                      <p className="text-orange-800 dark:text-orange-200">
                        Forte concurrence - Nécessite une forte différenciation et un budget marketing conséquent
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights AI */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            🤖 Insights IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Sport & Fitness</strong> présente le meilleur ratio opportunité/concurrence ce mois-ci
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Les produits <strong>écologiques</strong> génèrent 23% plus d'engagement que la moyenne
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Pic de demande prévu pour <strong>Maison & Jardin</strong> dans les 4 prochaines semaines
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
