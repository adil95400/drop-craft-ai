import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, FileText, Link, Image, Globe, BarChart3 } from 'lucide-react';

export default function SEOPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">SEO Manager</h1>
            <Badge className="bg-purple-500 text-white">PRO</Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            Optimisez votre référencement naturel et améliorez votre visibilité
          </p>
        </div>
        <Button className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Analyser le site
        </Button>
      </div>

      {/* SEO Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Score SEO Global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">87/100</div>
            <p className="text-xs text-muted-foreground mt-1">Excellent</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pages Indexées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,247</div>
            <p className="text-xs text-green-600 mt-1">+12% ce mois</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Backlinks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3,589</div>
            <p className="text-xs text-green-600 mt-1">+28 cette semaine</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mots-clés Classés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">456</div>
            <p className="text-xs text-green-600 mt-1">Top 10: 89</p>
          </CardContent>
        </Card>
      </div>

      {/* SEO Tools */}
      <Tabs defaultValue="keywords" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="meta">Meta Tags</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Recherche de Mots-clés
              </CardTitle>
              <CardDescription>
                Trouvez les meilleurs mots-clés pour votre contenu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Entrez un mot-clé..." className="flex-1" />
                <Button>Rechercher</Button>
              </div>
              
              <div className="space-y-2">
                {['dropshipping france', 'produits gagnants 2024', 'fournisseurs dropshipping'].map((keyword, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
                    <div className="flex-1">
                      <div className="font-medium">{keyword}</div>
                      <div className="text-sm text-muted-foreground">Volume: 8,500/mois • Difficulté: Moyenne</div>
                    </div>
                    <Button size="sm" variant="outline">Ajouter</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit des Pages
              </CardTitle>
              <CardDescription>
                Analysez et optimisez vos pages individuelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { url: '/products', score: 92, issues: 2 },
                  { url: '/categories/electronics', score: 85, issues: 5 },
                  { url: '/blog/winning-products', score: 78, issues: 8 },
                ].map((page, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{page.url}</div>
                      <div className="text-sm text-muted-foreground">
                        Score: {page.score}/100 • {page.issues} problèmes détectés
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Analyser</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Optimisation Meta Tags
              </CardTitle>
              <CardDescription>
                Gérez vos balises meta pour un meilleur référencement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Meta Title</label>
                  <Input 
                    placeholder="Titre de la page (50-60 caractères)" 
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">0/60 caractères</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Meta Description</label>
                  <Input 
                    placeholder="Description de la page (150-160 caractères)" 
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">0/160 caractères</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Optimisation Images
              </CardTitle>
              <CardDescription>
                Optimisez vos images pour le SEO
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Analysez vos images pour détecter les problèmes</p>
                <Button className="mt-4">Lancer l'analyse</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance & Vitesse
              </CardTitle>
              <CardDescription>
                Améliorez la vitesse de chargement de votre site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Page Speed Score</div>
                    <div className="text-sm text-muted-foreground">Desktop</div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">94/100</div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Page Speed Score</div>
                    <div className="text-sm text-muted-foreground">Mobile</div>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">76/100</div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Temps de chargement</div>
                    <div className="text-sm text-muted-foreground">Moyenne</div>
                  </div>
                  <div className="text-2xl font-bold">1.8s</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
