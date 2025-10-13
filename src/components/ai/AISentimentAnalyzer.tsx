import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAIServices } from '@/hooks/useAIServices';
import { Loader2, MessageSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export const AISentimentAnalyzer = () => {
  const [texts, setTexts] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);

  const { analyzeSentiment } = useAIServices();

  const handleAnalyze = async () => {
    const textsArray = texts
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);
    
    const result = await analyzeSentiment.mutateAsync({
      texts: textsArray,
      analysisType: 'review'
    });

    setAnalysis(result.analysis);
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.3) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (sentiment < -0.3) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-600 dark:text-green-400';
    if (sentiment < -0.3) return 'text-red-600 dark:text-red-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  const getSentimentProgress = (sentiment: number) => {
    return ((sentiment + 1) / 2) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Analyseur de Sentiment IA
        </CardTitle>
        <CardDescription>
          Analysez les avis clients et les retours pour obtenir des insights actionnables
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="texts">
            Avis Clients (un par ligne)
          </Label>
          <Textarea
            id="texts"
            placeholder="Collez vos avis clients ici, un par ligne...&#10;&#10;Exemple:&#10;Produit excellent, livraison rapide !&#10;Déçu de la qualité, ne correspond pas aux photos&#10;Bon rapport qualité-prix"
            value={texts}
            onChange={(e) => setTexts(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
        </div>

        <Button 
          onClick={handleAnalyze} 
          disabled={analyzeSentiment.isPending || !texts.trim()}
          className="w-full"
        >
          {analyzeSentiment.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              Analyser les Sentiments
            </>
          )}
        </Button>

        {analysis && (
          <div className="space-y-6 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Résumé Global</h3>
              
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Sentiment Moyen</span>
                    <Badge variant="outline" className={getSentimentColor(analysis.summary?.avgSentiment || 0)}>
                      {((analysis.summary?.avgSentiment || 0) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress 
                    value={getSentimentProgress(analysis.summary?.avgSentiment || 0)} 
                    className="h-2"
                  />
                </CardContent>
              </Card>

              {analysis.summary?.commonThemes && analysis.summary.commonThemes.length > 0 && (
                <div className="space-y-2">
                  <Label>Thèmes Récurrents</Label>
                  <div className="flex flex-wrap gap-2">
                    {analysis.summary.commonThemes.map((theme: string, i: number) => (
                      <Badge key={i} variant="secondary">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {analysis.analyses && analysis.analyses.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Analyse Détaillée</h3>
                <div className="space-y-3">
                  {analysis.analyses.map((item: any, i: number) => (
                    <Card key={i} className="border-l-4" style={{
                      borderLeftColor: item.sentiment > 0.3 ? 'rgb(34, 197, 94)' : 
                                      item.sentiment < -0.3 ? 'rgb(239, 68, 68)' : 
                                      'rgb(234, 179, 8)'
                    }}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getSentimentIcon(item.sentiment)}
                            <span className="font-medium">{item.emotion}</span>
                          </div>
                          <Badge variant={item.urgency === 'high' ? 'destructive' : 'outline'}>
                            {item.urgency}
                          </Badge>
                        </div>
                        
                        {item.themes && item.themes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.themes.map((theme: string, j: number) => (
                              <Badge key={j} variant="outline" className="text-xs">
                                {theme}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {item.action && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Action recommandée:</strong> {item.action}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {analysis.summary?.recommendations && analysis.summary.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Recommandations</h3>
                <Card>
                  <CardContent className="pt-4">
                    <ul className="space-y-2">
                      {analysis.summary.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">{i + 1}</Badge>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
