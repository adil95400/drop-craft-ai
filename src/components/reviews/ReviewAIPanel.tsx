import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield, Brain, Languages, Loader2, AlertTriangle, CheckCircle,
  ThumbsUp, ThumbsDown, Minus, Eye, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useFakeDetection,
  useSentimentAnalysis,
  useReviewTranslation,
  type FakeDetectionResult,
  type SentimentResult,
  type TranslationResult,
  type AnalysisSummary,
} from '@/hooks/reviews/useReviewAnalysis';

export function ReviewAIPanel() {
  const [activeAnalysis, setActiveAnalysis] = useState<'none' | 'fake' | 'sentiment' | 'translate'>('none');
  const [fakeResults, setFakeResults] = useState<{ reviews: FakeDetectionResult[]; summary: AnalysisSummary } | null>(null);
  const [sentimentResults, setSentimentResults] = useState<{ reviews: SentimentResult[]; summary: AnalysisSummary } | null>(null);
  const [translations, setTranslations] = useState<TranslationResult[] | null>(null);
  const [targetLang, setTargetLang] = useState('en');

  const fakeDetection = useFakeDetection();
  const sentimentAnalysis = useSentimentAnalysis();
  const reviewTranslation = useReviewTranslation();

  const runFakeDetection = async () => {
    setActiveAnalysis('fake');
    const result = await fakeDetection.mutateAsync(undefined);
    setFakeResults(result);
  };

  const runSentiment = async () => {
    setActiveAnalysis('sentiment');
    const result = await sentimentAnalysis.mutateAsync(undefined);
    setSentimentResults(result);
  };

  const runTranslation = async () => {
    setActiveAnalysis('translate');
    const result = await reviewTranslation.mutateAsync({ targetLanguage: targetLang });
    setTranslations(result.reviews || []);
  };

  const isLoading = fakeDetection.isPending || sentimentAnalysis.isPending || reviewTranslation.isPending;

  return (
    <div className="space-y-6">
      {/* Action Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary/20" onClick={runFakeDetection}>
          <CardContent className="p-5 text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold">Détection faux avis</h3>
              <p className="text-sm text-muted-foreground">IA analyse l'authenticité de vos avis</p>
            </div>
            <Button size="sm" variant="outline" className="gap-2" disabled={isLoading}>
              {fakeDetection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Analyser
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary/20" onClick={runSentiment}>
          <CardContent className="p-5 text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto">
              <Brain className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Analyse de sentiment</h3>
              <p className="text-sm text-muted-foreground">Thèmes, émotions et insights</p>
            </div>
            <Button size="sm" variant="outline" className="gap-2" disabled={isLoading}>
              {sentimentAnalysis.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analyser
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary/20">
          <CardContent className="p-5 text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Languages className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold">Traduction en masse</h3>
              <p className="text-sm text-muted-foreground">Traduisez tous vos avis</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇬🇧 EN</SelectItem>
                  <SelectItem value="fr">🇫🇷 FR</SelectItem>
                  <SelectItem value="de">🇩🇪 DE</SelectItem>
                  <SelectItem value="es">🇪🇸 ES</SelectItem>
                  <SelectItem value="it">🇮🇹 IT</SelectItem>
                  <SelectItem value="pt">🇵🇹 PT</SelectItem>
                  <SelectItem value="nl">🇳🇱 NL</SelectItem>
                  <SelectItem value="ja">🇯🇵 JA</SelectItem>
                  <SelectItem value="zh">🇨🇳 ZH</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="gap-1" disabled={isLoading} onClick={runTranslation}>
                {reviewTranslation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                Go
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fake Detection Results */}
      {fakeResults && activeAnalysis === 'fake' && (
        <div className="space-y-4">
          {fakeResults.summary && (
            <Card className="border-destructive/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-destructive" />
                  Rapport d'authenticité
                </CardTitle>
                <CardDescription>{fakeResults.summary.recommendation}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{fakeResults.summary.total_analyzed}</p>
                    <p className="text-xs text-muted-foreground">Analysés</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-destructive">{fakeResults.summary.suspicious_count}</p>
                    <p className="text-xs text-muted-foreground">Suspects</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{Math.round(fakeResults.summary.average_fake_score || 0)}%</p>
                    <p className="text-xs text-muted-foreground">Score moyen</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {fakeResults.reviews
              .sort((a, b) => b.fake_score - a.fake_score)
              .map(r => (
                <Card key={r.id} className={cn(r.fake_score > 60 && 'border-destructive/30 bg-destructive/5')}>
                  <CardContent className="p-3 flex items-center gap-4">
                    <div className="shrink-0 text-center w-16">
                      <p className={cn(
                        'text-lg font-bold',
                        r.fake_score > 60 ? 'text-destructive' : r.fake_score > 30 ? 'text-yellow-600' : 'text-emerald-600'
                      )}>
                        {r.fake_score}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">fake score</p>
                    </div>
                    <Progress
                      value={r.fake_score}
                      className={cn('w-20 h-2', r.fake_score > 60 ? '[&>div]:bg-destructive' : r.fake_score > 30 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-emerald-500')}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{r.summary}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {r.flags.map(flag => (
                          <Badge key={flag} variant="outline" className="text-[10px] h-5">
                            {flag.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {r.fake_score > 60 ? (
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Sentiment Results */}
      {sentimentResults && activeAnalysis === 'sentiment' && (
        <div className="space-y-4">
          {sentimentResults.summary && (
            <Card className="border-blue-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  Analyse de sentiment — {sentimentResults.summary.overall_mood}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">{sentimentResults.summary.positive_pct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">{sentimentResults.summary.neutral_pct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">{sentimentResults.summary.negative_pct}%</span>
                  </div>
                </div>

                {sentimentResults.summary.top_themes && sentimentResults.summary.top_themes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Thèmes principaux</p>
                    <div className="flex flex-wrap gap-2">
                      {sentimentResults.summary.top_themes.map((t, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          {t.theme} ({t.count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {sentimentResults.summary.recommendations && (
                  <div>
                    <p className="text-sm font-medium mb-2">Recommandations</p>
                    <ul className="space-y-1">
                      {sentimentResults.summary.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {sentimentResults.reviews.map(r => {
              const sentimentIcon = r.sentiment === 'positive' ? ThumbsUp : r.sentiment === 'negative' ? ThumbsDown : Minus;
              const sentimentColor = r.sentiment === 'positive' ? 'text-emerald-600' : r.sentiment === 'negative' ? 'text-destructive' : 'text-yellow-600';
              const SIcon = sentimentIcon;
              return (
                <Card key={r.id}>
                  <CardContent className="p-3 flex items-start gap-3">
                    <SIcon className={cn('h-5 w-5 shrink-0 mt-0.5', sentimentColor)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{r.emotion}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.actionable_insight}</p>
                      {r.key_themes.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {r.key_themes.map(t => (
                            <Badge key={t} variant="secondary" className="text-[10px] h-5">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Translation Results */}
      {translations && activeAnalysis === 'translate' && (
        <div className="space-y-2">
          <Card className="border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Languages className="h-5 w-5 text-emerald-500" />
                {translations.length} avis traduits
              </CardTitle>
            </CardHeader>
          </Card>
          {translations.map(t => (
            <Card key={t.id}>
              <CardContent className="p-3 space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{t.original_text}</p>
                <div className="border-t pt-2">
                  <p className="text-sm">{t.translated_text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {activeAnalysis === 'none' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">Sélectionnez une analyse IA ci-dessus pour commencer</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
