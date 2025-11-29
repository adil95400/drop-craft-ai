/**
 * Page de gestion des règles catalogue
 * Permet de créer des règles automatiques type Channable
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Play, Pause, Settings, ListFilter, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function ProductRulesPage() {
  const [activeTab, setActiveTab] = useState('active');

  return (
    <>
      <Helmet>
        <title>Règles Catalogue - Automatisation Produits</title>
        <meta name="description" content="Créez des règles automatiques pour gérer votre catalogue produits" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Règles Catalogue</h1>
            <p className="text-muted-foreground mt-2">
              Automatisez la gestion de vos produits avec des règles intelligentes
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle règle
          </Button>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Règles actives</p>
                  <p className="text-3xl font-bold">12</p>
                </div>
                <Play className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Règles pausées</p>
                  <p className="text-3xl font-bold">3</p>
                </div>
                <Pause className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produits affectés</p>
                  <p className="text-3xl font-bold">1,247</p>
                </div>
                <ListFilter className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">IA actives</p>
                  <p className="text-3xl font-bold">5</p>
                </div>
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets des règles */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">Actives (12)</TabsTrigger>
            <TabsTrigger value="paused">Pausées (3)</TabsTrigger>
            <TabsTrigger value="templates">Modèles</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Règles actives</CardTitle>
                <CardDescription>
                  Règles en cours d'exécution sur votre catalogue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-12">
                  Interface de gestion des règles en cours de développement
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paused" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Règles pausées</CardTitle>
                <CardDescription>
                  Règles temporairement désactivées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-12">
                  Aucune règle pausée
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Modèles de règles */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Raccourcir les titres longs</CardTitle>
                  <CardDescription>
                    Si titre &gt; 140 caractères ALORS raccourcir avec IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Utiliser ce modèle
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Alerte stock faible</CardTitle>
                  <CardDescription>
                    Si stock &lt; 5 ALORS ajouter tag "low_stock"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Utiliser ce modèle
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Compléter les descriptions</CardTitle>
                  <CardDescription>
                    Si description &lt; 100 caractères ALORS générer avec IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Utiliser ce modèle
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
