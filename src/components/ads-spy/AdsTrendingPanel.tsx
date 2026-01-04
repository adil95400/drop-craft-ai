import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTrendingAds, useAnalyzeAd } from '@/hooks/useAdsSpy';
import { AdCard } from './AdCard';
import { TrendingUp, Loader2, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AdsTrendingPanel() {
  const [platform, setPlatform] = useState<string | undefined>();
  const { data, isLoading, refetch } = useTrendingAds(platform, 12);
  const analyzeAd = useAnalyzeAd();

  const platforms = [
    { value: 'all', label: 'Toutes plateformes' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'instagram', label: 'Instagram' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Publicités Tendances
              </CardTitle>
              <CardDescription>
                Les publicités avec le meilleur engagement en ce moment
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={platform || 'all'}
                onValueChange={(v) => setPlatform(v === 'all' ? undefined : v)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => refetch()} variant="outline" size="icon">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data?.ads && data.ads.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.ads.map((ad, index) => (
            <div key={ad.id} className="relative">
              {index < 3 && (
                <Badge 
                  className="absolute -top-2 -left-2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0"
                >
                  #{index + 1} Trending
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
            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucune publicité tendance pour le moment.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Lancez une recherche pour découvrir des publicités.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
