import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, Plus, Import, Export } from 'lucide-react'

export function StoreProducts() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Produits</h2>
          <p className="text-muted-foreground">Gérez vos produits synchronisés</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Export className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm">
            <Import className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau produit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">247</div>
            <div className="text-sm text-muted-foreground">Produits actifs</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">12</div>
            <div className="text-sm text-muted-foreground">Stock faible</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">1,523</div>
            <div className="text-sm text-muted-foreground">Ventes 30j</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">45.67€</div>
            <div className="text-sm text-muted-foreground">Prix moyen</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des produits</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Interface de gestion des produits en cours de développement...</p>
        </CardContent>
      </Card>
    </div>
  )
}