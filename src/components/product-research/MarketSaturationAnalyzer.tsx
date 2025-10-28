import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProductResearch } from '@/hooks/useProductResearch';
import { Loader2, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export function MarketSaturationAnalyzer() {
  const [niche, setNiche] = useState('');
  const { analyzeSaturation, isAnalyzing, saturationData } = useProductResearch();

  const handleAnalyze = () => {
    if (niche.trim()) {
      analyzeSaturation({ niche });
    }
  };

  const getSaturationColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSaturationIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Analyseur de Saturation Marché
          </CardTitle>
          <CardDescription>
            Évaluez le niveau de compétition dans votre niche
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="niche">Niche ou Catégorie</Label>
            <Input
              id="niche"
              placeholder="Ex: smartwatch, yoga mat, pet toys"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={!niche.trim() || isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-2" />
                Analyser la Saturation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {saturationData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Résultat: {saturationData.niche}</CardTitle>
              <Badge variant={
                saturationData.saturation_level === 'low' ? 'default' : 
                saturationData.saturation_level === 'medium' ? 'secondary' : 
                'destructive'
              }>
                {getSaturationIcon(saturationData.saturation_level)}
                <span className="ml-2">{saturationData.saturation_level.toUpperCase()}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Niveau de Saturation</span>
                <span className={`font-bold ${getSaturationColor(saturationData.saturation_level)}`}>
                  {saturationData.saturation_score}%
                </span>
              </div>
              <Progress value={saturationData.saturation_score} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Concurrents Actifs</p>
                <p className="text-2xl font-bold">{saturationData.competitor_count}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Ads Actives</p>
                <p className="text-2xl font-bold">{saturationData.active_ads}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Demande Recherche</p>
                <p className="text-2xl font-bold">{saturationData.search_demand?.toLocaleString()}</p>
              </div>
            </div>

            {saturationData.recommendation && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  {getSaturationIcon(saturationData.saturation_level)}
                  Recommandation
                </p>
                <p className="text-sm text-muted-foreground">
                  {saturationData.recommendation}
                </p>
              </div>
            )}

            {saturationData.alternative_niches && saturationData.alternative_niches.length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold">Niches Alternatives (Moins saturées):</p>
                <div className="flex flex-wrap gap-2">
                  {saturationData.alternative_niches.map((alt) => (
                    <Badge key={alt} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      {alt}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
