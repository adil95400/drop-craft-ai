/**
 * Product Scoring Dashboard
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Star, Play, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Target, BarChart3, Lightbulb, Clock 
} from 'lucide-react';
import { 
  useProductScores, useScoringStats, useRunBatchAnalysis, useScoringBatches, useScoringRules 
} from '@/hooks/useProductScoring';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-500';
  if (score >= 70) return 'text-blue-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

function getScoreBadge(score: number) {
  if (score >= 90) return { label: 'Excellent', variant: 'default' as const };
  if (score >= 70) return { label: 'Bon', variant: 'secondary' as const };
  if (score >= 50) return { label: 'Moyen', variant: 'outline' as const };
  return { label: 'Faible', variant: 'destructive' as const };
}

export function ProductScoringDashboard() {
  const { data: scores = [], isLoading } = useProductScores();
  const { data: stats } = useScoringStats();
  const { data: batches = [] } = useScoringBatches(10);
  const { data: rules = [] } = useScoringRules();
  const runBatch = useRunBatchAnalysis();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Scoring</h1>
          <p className="text-muted-foreground">Évaluez la qualité de vos fiches produits</p>
        </div>
        <Button onClick={() => runBatch.mutate()} disabled={runBatch.isPending}>
          <Play className="h-4 w-4 mr-2" />
          Analyser tous les produits
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg"><Target className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalScored || 0}</p>
                <p className="text-sm text-muted-foreground">Produits analysés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg"><BarChart3 className="h-5 w-5 text-blue-500" /></div>
              <div>
                <p className={`text-2xl font-bold ${getScoreColor(stats?.avgScore || 0)}`}>{(stats?.avgScore || 0).toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Score moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg"><TrendingUp className="h-5 w-5 text-green-500" /></div>
              <div>
                <p className="text-2xl font-bold text-green-500">{stats?.excellentCount || 0}</p>
                <p className="text-sm text-muted-foreground">Excellents (90+)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-500/10 rounded-lg"><TrendingDown className="h-5 w-5 text-red-500" /></div>
              <div>
                <p className="text-2xl font-bold text-red-500">{stats?.poorCount || 0}</p>
                <p className="text-sm text-muted-foreground">Faibles (&lt;60)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="scores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scores">Scores produits</TabsTrigger>
          <TabsTrigger value="rules">Règles ({rules.length})</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="scores">
          {isLoading ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">Chargement...</CardContent></Card>
          ) : scores.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Aucun score</h3>
                <p className="text-muted-foreground mb-4">Lancez une analyse pour scorer vos produits</p>
                <Button onClick={() => runBatch.mutate()}><Play className="h-4 w-4 mr-2" />Analyser</Button>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {scores.slice(0, 50).map((score) => {
                  const badge = getScoreBadge(score.overall_score);
                  return (
                    <Card key={score.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`text-2xl font-bold ${getScoreColor(score.overall_score)}`}>
                              {score.overall_score.toFixed(0)}
                            </div>
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                            <span className="text-sm text-muted-foreground">ID: {score.product_id.slice(0, 8)}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(score.last_analyzed_at), { addSuffix: true, locale: getDateFnsLocale() })}
                          </span>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {[
                            { label: 'Titre', value: score.title_score },
                            { label: 'Description', value: score.description_score },
                            { label: 'Images', value: score.images_score },
                            { label: 'SEO', value: score.seo_score },
                            { label: 'Prix', value: score.pricing_score },
                            { label: 'Attributs', value: score.attributes_score },
                          ].map((item) => (
                            <div key={item.label} className="text-center">
                              <Progress value={item.value} className="h-2 mb-1" />
                              <span className="text-xs text-muted-foreground">{item.label}</span>
                            </div>
                          ))}
                        </div>
                        {score.issues.length > 0 && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-muted-foreground">{score.issues.length} problème(s)</span>
                            {score.recommendations.length > 0 && (
                              <>
                                <Lightbulb className="h-4 w-4 text-blue-500 ml-4" />
                                <span className="text-sm text-muted-foreground">{score.recommendations.length} suggestion(s)</span>
                              </>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Règles de scoring</CardTitle>
              <CardDescription>Critères utilisés pour évaluer les produits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className={`h-5 w-5 ${rule.is_active ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {rule.category} • {rule.rule_type} • Poids: {rule.weight}x • Pénalité: -{rule.penalty}pts
                        </p>
                      </div>
                    </div>
                    {rule.is_global && <Badge variant="outline">Global</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historique des analyses</CardTitle>
            </CardHeader>
            <CardContent>
              {batches.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Aucune analyse</p>
              ) : (
                <div className="space-y-3">
                  {batches.map((batch) => (
                    <div key={batch.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={batch.status === 'completed' ? 'default' : batch.status === 'running' ? 'secondary' : 'destructive'}>
                            {batch.status}
                          </Badge>
                          <span className="font-medium">{batch.products_analyzed} produits</span>
                        </div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDistanceToNow(new Date(batch.started_at), { addSuffix: true, locale: getDateFnsLocale() })}
                        </span>
                      </div>
                      <p className={`text-lg font-bold ${getScoreColor(batch.avg_score)}`}>
                        Score moyen: {batch.avg_score.toFixed(0)}/100
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
