import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Package, Plus, Search, Filter } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const products = [
    { id: 1, name: 'Produit 1', price: 29.99, stock: 150, status: 'active' },
    { id: 2, name: 'Produit 2', price: 49.99, stock: 75, status: 'active' },
    { id: 3, name: 'Produit 3', price: 19.99, stock: 0, status: 'out_of_stock' },
    { id: 4, name: 'Produit 4', price: 89.99, stock: 25, status: 'low_stock' },
    { id: 5, name: 'Produit 5', price: 59.99, stock: 200, status: 'active' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'out_of_stock': return 'destructive';
      case 'low_stock': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'out_of_stock': return 'Rupture';
      case 'low_stock': return 'Stock faible';
      default: return 'Inconnu';
    }
  };

  return (
    <>
      <Helmet>
        <title>Catalogue Produits - Gestion de l'inventaire | Drop Craft AI</title>
        <meta name="description" content="Gérez votre catalogue produit avec notre interface intuitive. Ajout, modification et suivi de vos produits en temps réel." />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Catalogue Produits</h1>
            <p className="text-muted-foreground">
              Gérez votre inventaire et optimisez vos ventes
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtres
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un produit
            </Button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">
                +2 depuis hier
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {products.filter(p => p.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Produits disponibles
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock faible</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {products.filter(p => p.status === 'low_stock').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Nécessite attention
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ruptures</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {products.filter(p => p.status === 'out_of_stock').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Produits épuisés
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des produits */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mes Produits</CardTitle>
                <CardDescription>
                  Gérez votre catalogue et suivez vos stocks
                </CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products
                .filter(product => 
                  product.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        €{product.price} • Stock: {product.stock}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={getStatusColor(product.status)}>
                      {getStatusText(product.status)}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Modifier
                    </Button>
                  </div>
                </div>
              ))}
              
              {products.filter(product => 
                product.name.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'Essayez un autre terme de recherche' : 'Commencez par ajouter votre premier produit'}
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un produit
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}