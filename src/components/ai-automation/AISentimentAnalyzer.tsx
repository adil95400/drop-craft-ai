import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare, ThumbsUp, ThumbsDown, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';
import { useAIAutomation } from '@/hooks/useAIAutomation';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function AISentimentAnalyzer() {
  const [reviews, setReviews] = useState('');
  const [productId] = useState('sample-product');

  const { analyzeSentimentAsync, isAnalyzingSentiment, sentimentData } = useAIAutomation();

  const handleAnalyze = async () => {
    if (!reviews.trim()) return;

    // Parse reviews from textarea (one per line)
    const reviewLines = reviews.split('\n').filter(line => line.trim());
    const parsedReviews = reviewLines.map(line => {
      // Try to parse format: "5/5: Great product!"
      const match = line.match(/^(\d)\/5[:\s]+(.+)$/);
      if (match) {
        return {
          rating: parseInt(match[1]),
          text: match[2].trim(),
        };
      }
      // Default to 3 stars if no rating
      return {
        rating: 3,
        text: line.trim(),
      };
    });

    await analyzeSentimentAsync({
      reviews: parsedReviews,
      productId,
      analysisType: 'detailed',
    });
  };

  const analysis = sentimentData?.analysis;
  const sentiment = analysis?.overallSentiment;

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getUrgencyVariant = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Analyse de Sentiment
          </CardTitle>
          <CardDescription>
            Analysez les avis clients pour obtenir des insights actionnables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Avis clients (un par ligne, format: "5/5: Excellent produit!")</Label>
            <Textarea
              value={reviews}
              onChange={(e) => setReviews(e.target.value)}
              placeholder="5/5: Produit excellent, livraison rapide!&#10;4/5: Bon rapport qualité-prix mais emballage à améliorer&#10;1/5: Déçu, ne correspond pas à la description"
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Entrez au moins 3-5 avis pour une analyse pertinente
            </p>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!reviews.trim() || isAnalyzingSentiment}
            className="w-full"
          >
            {isAnalyzingSentiment ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Analyser les avis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Résultats de l'analyse</CardTitle>
          <CardDescription>
            Insights détaillés et recommandations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!analysis ? (
            <div className="text-center py-12 text-muted-foreground">
              Collez des avis clients pour voir l'analyse de sentiment
            </div>
          ) : (
            <>
              {sentiment && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Sentiment global</div>
                        <div className={`text-3xl font-bold ${getSentimentColor(sentiment.label)}`}>
                          {sentiment.label === 'positive' ? 'Positif' : 
                           sentiment.label === 'negative' ? 'Négatif' : 'Neutre'}
                        </div>
                      </div>
                      <div className="text-4xl">
                        {sentiment.label === 'positive' ? '😊' : 
                         sentiment.label === 'negative' ? '😞' : '😐'}
                      </div>
                    </div>
                    
                    {sentiment.distribution && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Positif</span>
                          <span className="text-green-500">{sentiment.distribution.positive}%</span>
                        </div>
                        <Progress value={sentiment.distribution.positive} className="h-2" />
                        
                        <div className="flex justify-between text-xs">
                          <span>Neutre</span>
                          <span className="text-yellow-500">{sentiment.distribution.neutral}%</span>
                        </div>
                        <Progress value={sentiment.distribution.neutral} className="h-2" />
                        
                        <div className="flex justify-between text-xs">
                          <span>Négatif</span>
                          <span className="text-red-500">{sentiment.distribution.negative}%</span>
                        </div>
                        <Progress value={sentiment.distribution.negative} className="h-2" />
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">Score de satisfaction</div>
                      <div className="text-2xl font-bold">{analysis.satisfactionScore}/100</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {analysis.urgency && (
                <Alert variant={getUrgencyVariant(analysis.urgency) as any}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Niveau d'urgence:</strong> {
                      analysis.urgency === 'high' ? 'Élevé - Action immédiate requise' :
                      analysis.urgency === 'medium' ? 'Moyen - À traiter rapidement' :
                      'Faible - Surveillance continue'
                    }
                  </AlertDescription>
                </Alert>
              )}

              {analysis.positiveAspects && analysis.positiveAspects.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                    Points forts ({analysis.positiveAspects.length})
                  </Label>
                  <div className="space-y-1">
                    {analysis.positiveAspects.slice(0, 5).map((aspect: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg text-sm">
                        <span>{aspect.aspect}</span>
                        <Badge variant="secondary">{aspect.mentions} mentions</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.concerns && analysis.concerns.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ThumbsDown className="h-4 w-4 text-red-500" />
                    Préoccupations ({analysis.concerns.length})
                  </Label>
                  <div className="space-y-1">
                    {analysis.concerns.slice(0, 5).map((concern: any, idx: number) => (
                      <div key={idx} className="p-2 bg-red-500/10 rounded-lg text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{concern.issue}</span>
                          <Badge variant={
                            concern.severity === 'high' ? 'destructive' :
                            concern.severity === 'medium' ? 'default' : 'secondary'
                          }>
                            {concern.severity}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {concern.mentions} mentions
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.improvements && analysis.improvements.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Améliorations suggérées
                  </Label>
                  <div className="space-y-2">
                    {analysis.improvements.map((improvement: any, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="pt-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-sm mb-1">{improvement.suggestion}</div>
                              <div className="text-xs text-muted-foreground">
                                Impact: {improvement.expectedImpact}
                              </div>
                            </div>
                            <Badge variant={
                              improvement.priority === 'high' ? 'default' :
                              improvement.priority === 'medium' ? 'secondary' : 'outline'
                            }>
                              {improvement.priority}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {analysis.summary && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Résumé exécutif
                  </Label>
                  <div className="p-4 bg-muted rounded-lg text-sm">
                    {analysis.summary}
                  </div>
                </div>
              )}

              {analysis.responseStrategy && (
                <Alert>
                  <AlertDescription>
                    <strong>Stratégie de réponse:</strong> {analysis.responseStrategy}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
