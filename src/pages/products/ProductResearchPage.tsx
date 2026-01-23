/**
 * Page de recherche de produits gagnants
 * Fusion de ProductResearchPage + WinnersResearchPage
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Helmet } from 'react-helmet-async';
import { Search, TrendingUp, Target, Star, Filter, Sparkles } from 'lucide-react';

export default function ProductResearchPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <Helmet>
        <title>Recherche Produits Gagnants - ShopOpti</title>
        <meta name="description" content="Découvrez les produits gagnants avec notre AI de recherche" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">🔍 Recherche Produits Gagnants</h1>
          <p className="text-muted-foreground mt-2">
            Trouvez les produits à fort potentiel avec notre intelligence artificielle
          </p>
        </div>

        {/* Barre de recherche */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des produits, catégories, tendances..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button>
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produits analysés</p>
                  <p className="text-3xl font-bold">12,547</p>
                </div>
                <Search className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produits gagnants</p>
                  <p className="text-3xl font-bold text-green-600">1,234</p>
                </div>
                <Star className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En tendance</p>
                  <p className="text-3xl font-bold text-orange-600">287</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Score moyen</p>
                  <p className="text-3xl font-bold text-purple-600">82/100</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets de recherche */}
        <Tabs defaultValue="winners" className="space-y-6">
          <TabsList>
            <TabsTrigger value="winners" className="gap-2">
              <Star className="h-4 w-4" />
              Winners
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Recommandations IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="winners" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Produits gagnants détectés</CardTitle>
                <CardDescription>
                  Produits à fort potentiel identifiés par notre IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-12">
                  Liste des produits gagnants en cours de chargement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendances actuelles</CardTitle>
                <CardDescription>
                  Produits en forte croissance détectés récemment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-12">
                  Analyse des tendances en cours...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recommandations IA</CardTitle>
                <CardDescription>
                  Suggestions personnalisées basées sur votre catalogue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-12">
                  Génération des recommandations...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
