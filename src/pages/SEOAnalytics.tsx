import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Users,
  Globe,
  Clock,
  Target,
  Zap,
  RefreshCw,
  Download,
  Plus,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useSEOAnalytics } from "@/hooks/useSEOAnalytics";
import { SEOAuditCard } from "@/components/seo/SEOAuditCard";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const SEOAnalytics = () => {
  const [newURL, setNewURL] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("30d");
  const { 
    metrics, 
    rankings, 
    loading, 
    analyzeURL, 
    trackKeyword, 
    getSEOHealth,
    getRankingTrends 
  } = useSEOAnalytics();
  const { toast } = useToast();

  // Mock data for charts
  const trafficData = [
    { date: '2024-01-01', organic: 4200, paid: 1200, total: 5400 },
    { date: '2024-01-08', organic: 4800, paid: 1100, total: 5900 },
    { date: '2024-01-15', organic: 5200, paid: 1400, total: 6600 },
    { date: '2024-01-22', organic: 5800, paid: 1300, total: 7100 },
    { date: '2024-01-29', organic: 6200, paid: 1500, total: 7700 }
  ];

  const rankingData = [
    { date: '2024-01-01', avgPosition: 12.5 },
    { date: '2024-01-08', avgPosition: 11.8 },
    { date: '2024-01-15', avgPosition: 10.2 },
    { date: '2024-01-22', avgPosition: 9.8 },
    { date: '2024-01-29', avgPosition: 8.5 }
  ];

  const handleAnalyzeURL = async () => {
    if (!newURL.trim()) {
      toast({
        title: "URL requise",
        description: "Veuillez saisir une URL à analyser",
        variant: "destructive"
      });
      return;
    }

    try {
      await analyzeURL(newURL);
      setNewURL("");
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleTrackKeyword = async () => {
    if (!newKeyword.trim()) {
      toast({
        title: "Mot-clé requis",
        description: "Veuillez saisir un mot-clé à suivre",
        variant: "destructive"
      });
      return;
    }

    try {
      await trackKeyword(newKeyword, "https://monsite.com");
      setNewKeyword("");
    } catch (error) {
      // Error already handled in hook
    }
  };

  const seoHealth = getSEOHealth();
  const rankingTrends = getRankingTrends();

  // Mock audit issues
  const mockAuditIssues = [
    {
      type: 'critical' as const,
      title: 'Images sans attribut alt',
      description: '5 images n\'ont pas d\'attribut alt, impactant l\'accessibilité',
      howToFix: 'Ajoutez des descriptions alt pertinentes à toutes vos images',
      impact: 'high' as const
    },
    {
      type: 'warning' as const,
      title: 'Titre trop long',
      description: 'Le titre de la page dépasse 60 caractères',
      howToFix: 'Raccourcissez le titre à moins de 60 caractères',
      impact: 'medium' as const
    },
    {
      type: 'info' as const,
      title: 'Temps de chargement acceptable',
      description: 'La page se charge en 1.2 secondes, c\'est correct',
      howToFix: 'Optimisez les images pour améliorer davantage',
      impact: 'low' as const
    }
  ];

  return (
    <>
      <Helmet>
        <title>SEO Analytics - Tableau de Bord</title>
        <meta name="description" content="Analysez vos performances SEO en temps réel. Suivi des rankings, trafic organique et optimisations." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              SEO Analytics
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Tableau de bord complet de vos performances SEO
            </p>
          </div>

          {/* KPIs principaux */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Score SEO Global</p>
                    <p className="text-3xl font-bold text-primary">{seoHealth.score}</p>
                    <p className="text-sm text-muted-foreground">{seoHealth.status}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <Progress value={seoHealth.score} className="mt-4" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Position Moyenne</p>
                    <p className="text-3xl font-bold text-blue-600">8.5</p>
                    <div className="flex items-center text-sm text-green-600">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      +4.0 positions
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Trafic Organique</p>
                    <p className="text-3xl font-bold text-green-600">6.2K</p>
                    <div className="flex items-center text-sm text-green-600">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      +12% ce mois
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Mots-clés Suivis</p>
                    <p className="text-3xl font-bold text-purple-600">{rankings.length}</p>
                    <p className="text-sm text-muted-foreground">En surveillance</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Analyser une nouvelle URL
                </CardTitle>
                <CardDescription>
                  Obtenez un audit SEO complet d'une page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="url">URL à analyser</Label>
                  <Input
                    id="url"
                    placeholder="https://monsite.com/page"
                    value={newURL}
                    onChange={(e) => setNewURL(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAnalyzeURL()}
                  />
                </div>
                <Button 
                  onClick={handleAnalyzeURL}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyse...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Analyser
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Suivre un nouveau mot-clé
                </CardTitle>
                <CardDescription>
                  Ajoutez un mot-clé au suivi de positions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="keyword">Mot-clé à suivre</Label>
                  <Input
                    id="keyword"
                    placeholder="ex: coque iphone 15"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTrackKeyword()}
                  />
                </div>
                <Button 
                  onClick={handleTrackKeyword}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter au suivi
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques de performance */}
          <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Performance dans le temps</h2>
              <div className="flex items-center gap-2">
                <TabsList>
                  <TabsTrigger value="7d">7 jours</TabsTrigger>
                  <TabsTrigger value="30d">30 jours</TabsTrigger>
                  <TabsTrigger value="90d">90 jours</TabsTrigger>
                </TabsList>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Évolution du Trafic
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trafficData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="organic" 
                          stackId="1" 
                          stroke="#10b981" 
                          fill="#10b981" 
                          fillOpacity={0.6}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="paid" 
                          stackId="1" 
                          stroke="#3b82f6" 
                          fill="#3b82f6" 
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Position Moyenne des Mots-clés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rankingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis reversed domain={[0, 20]} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="avgPosition" 
                          stroke="#8b5cf6" 
                          strokeWidth={3}
                          dot={{ fill: '#8b5cf6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Tabs>

          {/* Audits SEO */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Audits SEO</h2>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {metrics.length} pages analysées
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {metrics.map((metric) => (
                <SEOAuditCard
                  key={metric.id}
                  url={metric.url}
                  score={metric.seoScore}
                  issues={mockAuditIssues}
                  lastAudited={metric.lastAnalyzed}
                  onReaudit={() => analyzeURL(metric.url)}
                  loading={loading}
                />
              ))}
              
              {metrics.length === 0 && (
                <Card className="lg:col-span-2">
                  <CardContent className="text-center py-12">
                    <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune analyse disponible</h3>
                    <p className="text-muted-foreground mb-4">
                      Commencez par analyser vos pages pour obtenir des insights SEO
                    </p>
                    <Button onClick={() => analyzeURL("https://example.com")}>
                      <Zap className="w-4 h-4 mr-2" />
                      Analyser une page d'exemple
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Suivi des positions */}
          {rankings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Suivi des Positions ({rankings.length} mots-clés)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rankingTrends.slice(0, 5).map((ranking) => (
                    <div key={ranking.id} className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge className="bg-blue-100 text-blue-800">
                          #{ranking.position}
                        </Badge>
                        <div>
                          <div className="font-medium">{ranking.keyword}</div>
                          <div className="text-sm text-muted-foreground">
                            {ranking.searchVolume.toLocaleString()} recherches/mois
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">CTR: {ranking.ctr}%</div>
                          <div className="text-sm text-muted-foreground">{ranking.clicks} clics</div>
                        </div>
                        {ranking.trend === 'up' ? (
                          <ArrowUp className="w-5 h-5 text-green-500" />
                        ) : ranking.trend === 'down' ? (
                          <ArrowDown className="w-5 h-5 text-red-500" />
                        ) : (
                          <div className="w-5 h-5 bg-gray-300 rounded-full" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default SEOAnalytics;