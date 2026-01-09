import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdCard } from './AdCard';
import { useTrendingAds, useAnalyzeAd, type CompetitorAd } from '@/hooks/useAdsSpy';
import { Trophy, Flame, Calendar, TrendingUp, Loader2, RefreshCw, Crown } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function TopWinnersSection() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const { data, isLoading, refetch } = useTrendingAds(undefined, 10);
  const analyzeAd = useAnalyzeAd();

  // Simulated data for different periods
  const getMockWinners = (periodType: string): CompetitorAd[] => {
    const baseAds: CompetitorAd[] = data?.ads || [];
    return baseAds.map((ad, index) => ({
      ...ad,
      engagement_score: Math.floor(Math.random() * 30) + 70,
      running_days: periodType === 'day' ? 1 : periodType === 'week' ? Math.floor(Math.random() * 7) + 1 : Math.floor(Math.random() * 30) + 1,
    }));
  };

  const periodLabels = {
    day: "Top 10 du jour",
    week: "Top 10 de la semaine", 
    month: "Top 10 du mois"
  };

  const periodIcons = {
    day: Flame,
    week: Trophy,
    month: Calendar
  };

  const PeriodIcon = periodIcons[period];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Produits Gagnants</CardTitle>
                <CardDescription>
                  Sélection automatique des meilleures publicités selon l'engagement
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as 'day' | 'week' | 'month')}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="day" className="flex items-center gap-2">
                <Flame className="w-4 h-4" />
                Aujourd'hui
              </TabsTrigger>
              <TabsTrigger value="week" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Cette semaine
              </TabsTrigger>
              <TabsTrigger value="month" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Ce mois
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Winners Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <PeriodIcon className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold">{periodLabels[period]}</h2>
          <Badge variant="secondary" className="bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-600 border-orange-500/30">
            Mise à jour toutes les heures
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : data?.ads && data.ads.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {data.ads.slice(0, 10).map((ad, index) => (
              <div key={ad.id} className="relative">
                {/* Ranking Badge */}
                <div 
                  className={`absolute -top-3 -left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                    'bg-gradient-to-br from-primary/80 to-primary'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 3 && (
                  <Badge 
                    className="absolute -top-2 left-6 z-10 text-[10px] bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 px-2"
                  >
                    🔥 Winner
                  </Badge>
                )}
                <AdCard
                  ad={ad}
                  onAnalyze={() => analyzeAd.mutate(ad.id)}
                  isAnalyzing={analyzeAd.isPending}
                  showAnalysis={!!ad.ai_analysis}
                />
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucun produit gagnant pour cette période.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Lancez une recherche pour découvrir des produits gagnants.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Saved Winners */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Vos produits sauvegardés
          </CardTitle>
          <CardDescription>
            Les produits que vous avez ajoutés à vos favoris
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucun produit sauvegardé pour le moment.</p>
            <p className="text-sm mt-1">Cliquez sur le bouton "Sauvegarder" sur une publicité pour l'ajouter ici.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
