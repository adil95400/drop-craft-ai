import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Truck, Plus, Search, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function SupplierHub() {
  const [searchTerm, setSearchTerm] = useState('');

  const suppliers = [
    { 
      id: 1, 
      name: 'AliExpress', 
      type: 'Dropshipping', 
      status: 'connected', 
      products: 1247,
      lastSync: '2 min'
    },
    { 
      id: 2, 
      name: 'BigBuy', 
      type: 'Wholesale', 
      status: 'connected', 
      products: 589,
      lastSync: '15 min'
    },
    { 
      id: 3, 
      name: 'Cdiscount Pro', 
      type: 'Marketplace', 
      status: 'error', 
      products: 0,
      lastSync: '2h'
    },
    { 
      id: 4, 
      name: 'Eprolo', 
      type: 'Dropshipping', 
      status: 'pending', 
      products: 0,
      lastSync: 'Jamais'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connecté';
      case 'error': return 'Erreur';
      case 'pending': return 'En attente';
      default: return 'Inconnu';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'error': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <>
      <Helmet>
        <title>Hub Fournisseurs - Gestion Centralisée | Drop Craft AI</title>
        <meta name="description" content="Gérez tous vos fournisseurs depuis une interface unique. Synchronisation automatique, suivi des stocks et optimisation des commandes." />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hub Fournisseurs</h1>
            <p className="text-muted-foreground">
              Centralisez et optimisez vos relations fournisseurs
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Configuration
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un fournisseur
            </Button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fournisseurs Actifs</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {suppliers.filter(s => s.status === 'connected').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Sur {suppliers.length} au total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits Synchronisés</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {suppliers.reduce((sum, s) => sum + s.products, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                +127 depuis hier
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Connexion</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.round((suppliers.filter(s => s.status === 'connected').length / suppliers.length) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Disponibilité système
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dernière Sync</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2 min</div>
              <p className="text-xs text-muted-foreground">
                Synchronisation automatique
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal */}
        <Tabs defaultValue="suppliers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="suppliers">Mes Fournisseurs</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Fournisseurs Connectés</CardTitle>
                    <CardDescription>
                      Gérez vos connexions et synchronisez vos données
                    </CardDescription>
                  </div>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un fournisseur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suppliers
                    .filter(supplier => 
                      supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((supplier) => (
                    <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Truck className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{supplier.name}</h4>
                            {getStatusIcon(supplier.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {supplier.type} • {supplier.products} produits • 
                            Dernière sync: {supplier.lastSync}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={getStatusColor(supplier.status)}>
                          {getStatusText(supplier.status)}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Marketplace des Fournisseurs</CardTitle>
                <CardDescription>
                  Découvrez de nouveaux fournisseurs pour enrichir votre catalogue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Truck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Marketplace en développement</h3>
                  <p className="text-muted-foreground">
                    Bientôt disponible : catalogue complet de fournisseurs vérifiés
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Fournisseurs</CardTitle>
                <CardDescription>
                  Analysez les performances de vos fournisseurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analytics en cours de développement</h3>
                  <p className="text-muted-foreground">
                    Rapports détaillés sur la performance et fiabilité des fournisseurs
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