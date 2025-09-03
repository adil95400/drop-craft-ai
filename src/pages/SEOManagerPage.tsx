import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search, TrendingUp, Target, Globe, CheckCircle, AlertTriangle, Settings } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function SEOManagerPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const seoMetrics = [
    { title: 'Score SEO Global', value: 78, max: 100, color: 'bg-green-500' },
    { title: 'Mots-clés Trackés', value: 156, max: 200, color: 'bg-blue-500' },
    { title: 'Pages Optimisées', value: 89, max: 120, color: 'bg-yellow-500' },
    { title: 'Backlinks', value: 234, max: 300, color: 'bg-purple-500' }
  ];

  const keywordRankings = [
    { keyword: 'dropshipping produits', position: 3, change: '+2', volume: '12,000' },
    { keyword: 'import produit automatique', position: 7, change: '-1', volume: '8,500' },
    { keyword: 'catalogue produit IA', position: 12, change: '+5', volume: '5,200' },
    { keyword: 'gestion stock dropshipping', position: 5, change: '0', volume: '9,800' },
    { keyword: 'analyse concurrence produit', position: 15, change: '+3', volume: '3,400' }
  ];

  return (
    <>
      <Helmet>
        <title>SEO Manager - Optimisation SEO | Drop Craft AI</title>
        <meta name="description" content="Optimisez votre référencement naturel avec notre suite SEO complète. Suivi des mots-clés, analyse technique et recommandations IA." />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SEO Manager</h1>
            <p className="text-muted-foreground">
              Optimisez votre référencement naturel et améliorez votre visibilité
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Configurer
            </Button>
            <Button>
              <Search className="mr-2 h-4 w-4" />
              Analyser
            </Button>
          </div>
        </div>

        {/* Métriques SEO */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {seoMetrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  <span className="text-sm text-muted-foreground">/{metric.max}</span>
                </div>
                <Progress 
                  value={(metric.value / metric.max) * 100} 
                  className="h-2"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contenu Principal */}
        <Tabs defaultValue="keywords" className="space-y-4">
          <TabsList>
            <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="technical">Technique</TabsTrigger>
            <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          </TabsList>

          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Suivi des Mots-clés</CardTitle>
                    <CardDescription>
                      Suivez les positions de vos mots-clés stratégiques
                    </CardDescription>
                  </div>
                  <Input
                    placeholder="Rechercher un mot-clé..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {keywordRankings.map((keyword, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold">{keyword.keyword}</h4>
                        <p className="text-sm text-muted-foreground">
                          Volume: {keyword.volume} recherches/mois
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">#{keyword.position}</div>
                          <Badge 
                            variant={keyword.change.startsWith('+') ? 'default' : keyword.change.startsWith('-') ? 'destructive' : 'secondary'}
                          >
                            {keyword.change}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analyse des Pages</CardTitle>
                <CardDescription>
                  Optimisation SEO de vos pages principales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { url: '/products', score: 85, issues: 2, status: 'good' },
                    { url: '/suppliers', score: 72, issues: 4, status: 'warning' },
                    { url: '/analytics', score: 91, issues: 1, status: 'good' },
                    { url: '/automation', score: 68, issues: 5, status: 'warning' }
                  ].map((page, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <h4 className="font-semibold">{page.url}</h4>
                          <p className="text-sm text-muted-foreground">
                            {page.issues} problème(s) détecté(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-lg font-bold">{page.score}/100</div>
                          <Badge variant={page.status === 'good' ? 'default' : 'secondary'}>
                            {page.status === 'good' ? 'Bon' : 'À améliorer'}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">Optimiser</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technical" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Technique</CardTitle>
                <CardDescription>
                  Vérification technique de votre site
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { check: 'Vitesse de chargement', status: 'success', details: '2.1s (Bon)' },
                    { check: 'Mobile-friendly', status: 'success', details: 'Compatible' },
                    { check: 'HTTPS', status: 'success', details: 'Sécurisé' },
                    { check: 'Sitemap XML', status: 'warning', details: 'À mettre à jour' },
                    { check: 'Robots.txt', status: 'success', details: 'Configuré' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {item.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                          <h4 className="font-medium">{item.check}</h4>
                          <p className="text-sm text-muted-foreground">{item.details}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Détails</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recommandations IA</CardTitle>
                <CardDescription>
                  Suggestions personnalisées pour améliorer votre SEO
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Recommandations en cours d'analyse</h3>
                  <p className="text-muted-foreground">
                    Notre IA analyse votre site pour vous proposer des optimisations personnalisées
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}