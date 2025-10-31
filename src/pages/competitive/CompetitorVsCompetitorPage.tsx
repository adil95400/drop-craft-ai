import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCompetitiveAnalysis } from '@/hooks/useCompetitiveAnalysis';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

export default function CompetitorVsCompetitorPage() {
  const { id1, id2 } = useParams<{ id1: string; id2: string }>();
  const navigate = useNavigate();
  const { analyses } = useCompetitiveAnalysis();

  const competitor1 = analyses?.find(a => a.id === id1);
  const competitor2 = analyses?.find(a => a.id === id2);

  if (!competitor1 || !competitor2) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Comparaison impossible</h3>
                <p className="text-muted-foreground">
                  Les analyses sélectionnées n'ont pas été trouvées
                </p>
              </div>
              <Button onClick={() => navigate('/competitive-comparison')}>
                Retour à la comparaison
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract scores
  const getScore = (analysis: any, key: string, defaultValue: number = 70) => {
    return analysis?.competitive_data?.[key] || analysis?.price_analysis?.[key] || defaultValue;
  };

  const comp1Scores = {
    quality: competitor1.competitive_data?.quality_score || 75,
    seo: getScore(competitor1, 'seo_score', 70),
    ux: getScore(competitor1, 'ux_score', 80),
    service: getScore(competitor1, 'service_score', 75),
    price: competitor1.price_analysis?.user_avg_price || 50,
  };

  const comp2Scores = {
    quality: competitor2.competitive_data?.quality_score || 75,
    seo: getScore(competitor2, 'seo_score', 70),
    ux: getScore(competitor2, 'ux_score', 80),
    service: getScore(competitor2, 'service_score', 75),
    price: competitor2.price_analysis?.user_avg_price || 50,
  };

  const radarData = [
    { metric: 'Qualité', [competitor1.competitor_name]: comp1Scores.quality, [competitor2.competitor_name]: comp2Scores.quality },
    { metric: 'SEO', [competitor1.competitor_name]: comp1Scores.seo, [competitor2.competitor_name]: comp2Scores.seo },
    { metric: 'UX', [competitor1.competitor_name]: comp1Scores.ux, [competitor2.competitor_name]: comp2Scores.ux },
    { metric: 'Service', [competitor1.competitor_name]: comp1Scores.service, [competitor2.competitor_name]: comp2Scores.service },
  ];

  const priceData = [
    { name: competitor1.competitor_name, price: comp1Scores.price },
    { name: competitor2.competitor_name, price: comp2Scores.price },
  ];

  const getWinner = (score1: number, score2: number) => {
    if (score1 > score2) return competitor1.competitor_name;
    if (score2 > score1) return competitor2.competitor_name;
    return 'Égalité';
  };

  const getTrendIcon = (score1: number, score2: number, name: string) => {
    if (name === competitor1.competitor_name) {
      if (score1 > score2) return <TrendingUp className="w-4 h-4 text-green-500" />;
      if (score1 < score2) return <TrendingDown className="w-4 h-4 text-red-500" />;
    } else {
      if (score2 > score1) return <TrendingUp className="w-4 h-4 text-green-500" />;
      if (score2 < score1) return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <>
      <Helmet>
        <title>Comparaison 1 vs 1 | Drop Craft AI</title>
        <meta name="description" content="Comparaison détaillée entre deux concurrents" />
      </Helmet>

      <div className="container mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/competitive-comparison')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Comparaison Directe</h1>
            <p className="text-xl text-muted-foreground">
              {competitor1.competitor_name} vs {competitor2.competitor_name}
            </p>
          </div>
        </div>

        {/* Head to Head Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{competitor1.competitor_name}</CardTitle>
              <CardDescription>
                Position: {competitor1.competitive_data?.market_position || 'N/A'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Niveau de menace</span>
                <Badge variant={competitor1.threat_level === 'high' ? 'destructive' : 'secondary'}>
                  {competitor1.threat_level}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Score Qualité</span>
                <span className="font-bold">{comp1Scores.quality}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Prix Moyen</span>
                <span className="font-bold">{comp1Scores.price}€</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{competitor2.competitor_name}</CardTitle>
              <CardDescription>
                Position: {competitor2.competitive_data?.market_position || 'N/A'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Niveau de menace</span>
                <Badge variant={competitor2.threat_level === 'high' ? 'destructive' : 'secondary'}>
                  {competitor2.threat_level}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Score Qualité</span>
                <span className="font-bold">{comp2Scores.quality}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Prix Moyen</span>
                <span className="font-bold">{comp2Scores.price}€</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Comparaison Détaillée des Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Score Qualité', score1: comp1Scores.quality, score2: comp2Scores.quality },
                { label: 'Score SEO', score1: comp1Scores.seo, score2: comp2Scores.seo },
                { label: 'Score UX', score1: comp1Scores.ux, score2: comp2Scores.ux },
                { label: 'Score Service', score1: comp1Scores.service, score2: comp2Scores.service },
              ].map((item, idx) => {
                const winner = getWinner(item.score1, item.score2);
                return (
                  <div key={idx} className="grid grid-cols-7 gap-4 items-center p-3 border rounded-lg">
                    <div className="col-span-2 flex items-center gap-2">
                      {getTrendIcon(item.score1, item.score2, competitor1.competitor_name)}
                      <span className="font-bold">{item.score1}</span>
                    </div>
                    <div className="col-span-3 text-center">
                      <p className="font-medium">{item.label}</p>
                      {winner !== 'Égalité' && (
                        <p className="text-xs text-muted-foreground">
                          Gagnant: {winner}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <span className="font-bold">{item.score2}</span>
                      {getTrendIcon(item.score2, item.score1, competitor2.competitor_name)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Comparaison des Prix</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="price" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analyse Multi-Critères</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name={competitor1.competitor_name}
                    dataKey={competitor1.competitor_name}
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name={competitor2.competitor_name}
                    dataKey={competitor2.competitor_name}
                    stroke="hsl(180, 70%, 50%)"
                    fill="hsl(180, 70%, 50%)"
                    fillOpacity={0.3}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Strategic Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommandations Stratégiques</CardTitle>
            <CardDescription>
              Actions pour se différencier de ces deux concurrents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 border rounded-lg">
                <p className="font-medium mb-2">Positionnement Prix</p>
                <p className="text-sm text-muted-foreground">
                  {comp1Scores.price < comp2Scores.price
                    ? `${competitor1.competitor_name} propose des prix plus compétitifs. Considérez ajuster votre stratégie tarifaire.`
                    : `${competitor2.competitor_name} propose des prix plus compétitifs. Considérez ajuster votre stratégie tarifaire.`}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="font-medium mb-2">Qualité et Expérience</p>
                <p className="text-sm text-muted-foreground">
                  Investissez dans les domaines où les deux concurrents sont faibles pour créer un avantage distinctif.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="font-medium mb-2">Différenciation</p>
                <p className="text-sm text-muted-foreground">
                  Identifiez les features uniques que ni l'un ni l'autre n'offrent pour vous positionner comme l'alternative innovante.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
