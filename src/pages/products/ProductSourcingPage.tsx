/**
 * Page de sourcing produits
 * Fusion de ProductSourcingHub + ProductSourcingAssistant
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Search, TrendingUp, Zap, Globe, ShoppingCart } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function ProductSourcingPage() {
  return (
    <ChannablePageWrapper
      title="Sourcing Produits"
      description="Trouvez et importez les meilleurs produits depuis nos fournisseurs"
      heroImage="suppliers"
      badge={{ label: "Sourcing", icon: Package }}
      actions={
        <Button className="gap-2">
          <Search className="h-4 w-4" />
          Rechercher un fournisseur
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fournisseurs</p>
                  <p className="text-3xl font-bold">24</p>
                </div>
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produits disponibles</p>
                  <p className="text-3xl font-bold">145K+</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Winners détectés</p>
                  <p className="text-3xl font-bold">2,347</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Importations</p>
                  <p className="text-3xl font-bold">1,234</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse">Parcourir</TabsTrigger>
            <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
            <TabsTrigger value="assistant" className="gap-2">
              <Zap className="h-4 w-4" />
              Assistant IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Catalogue fournisseurs</CardTitle>
                <CardDescription>
                  Parcourez les produits disponibles chez nos partenaires
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-12">
                  Catalogue en cours de chargement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Nos fournisseurs partenaires</CardTitle>
                <CardDescription>
                  Liste complète des fournisseurs connectés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-12">
                  Redirigez vers /suppliers pour gérer vos fournisseurs
                </p>
                <div className="flex justify-center mt-4">
                  <Button onClick={() => window.location.href = '/suppliers'}>
                    Accéder aux fournisseurs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assistant" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assistant Sourcing IA</CardTitle>
                <CardDescription>
                  Laissez l'IA vous recommander les meilleurs produits à sourcer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-12">
                  Assistant IA en cours de développement
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </ChannablePageWrapper>
  );
}
