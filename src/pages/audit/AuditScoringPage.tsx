/**
 * Page de scoring qualité des produits
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Star, TrendingUp, AlertCircle, CheckCircle2, RefreshCw, Download } from 'lucide-react';

export default function AuditScoringPage() {
  const scoreCategories = [
    { name: 'Titres', score: 78, total: 100, issues: 12 },
    { name: 'Descriptions', score: 65, total: 100, issues: 28 },
    { name: 'Images', score: 92, total: 100, issues: 5 },
    { name: 'Prix', score: 88, total: 100, issues: 8 },
    { name: 'Attributs', score: 71, total: 100, issues: 18 },
    { name: 'SEO', score: 59, total: 100, issues: 32 },
  ];

  const overallScore = Math.round(scoreCategories.reduce((acc, c) => acc + c.score, 0) / scoreCategories.length);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <ChannablePageWrapper
      title="Score Qualité"
      description="Évaluez la qualité globale de votre catalogue produits"
      heroImage="analytics"
      badge={{ label: "Scoring", icon: Star }}
      actions={
        <div className="flex gap-2">
          <Button size="lg" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Recalculer
          </Button>
          <Button size="lg" variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      }
    >
      {/* Score global */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-muted-foreground">Score Global</h2>
              <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">+5% vs mois dernier</span>
              </div>
            </div>
            <div className="w-48">
              <Progress value={overallScore} className="h-4" />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'À améliorer' : 'Critique'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scores par catégorie */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scoreCategories.map((category) => (
          <Card key={category.name} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{category.name}</CardTitle>
                <Badge 
                  variant={category.score >= 80 ? 'default' : category.score >= 60 ? 'secondary' : 'destructive'}
                >
                  {category.issues} problèmes
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-bold ${getScoreColor(category.score)}`}>
                  {category.score}
                </div>
                <div className="flex-1">
                  <Progress 
                    value={category.score} 
                    className="h-2"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {category.score >= 80 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-sm text-muted-foreground">
                  {category.score >= 80 ? 'Bon niveau' : `${category.issues} éléments à corriger`}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommandations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommandations Prioritaires</CardTitle>
          <CardDescription>Actions suggérées pour améliorer votre score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-red-50 dark:bg-red-900/10">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Améliorer les descriptions SEO</h4>
                <p className="text-sm text-muted-foreground">
                  32 produits ont des descriptions trop courtes ou manquent de mots-clés
                </p>
              </div>
              <Button size="sm" variant="destructive">Corriger</Button>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Compléter les attributs</h4>
                <p className="text-sm text-muted-foreground">
                  18 produits ont des attributs obligatoires manquants
                </p>
              </div>
              <Button size="sm" variant="outline">Corriger</Button>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Optimiser les titres</h4>
                <p className="text-sm text-muted-foreground">
                  12 titres sont trop courts ou ne respectent pas le format recommandé
                </p>
              </div>
              <Button size="sm" variant="outline">Corriger</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  );
}
