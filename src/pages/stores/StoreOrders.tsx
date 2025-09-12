import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Download, CheckCircle, Package } from 'lucide-react'

export function StoreOrders() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Commandes</h2>
          <p className="text-muted-foreground">Historique et gestion des commandes</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exporter commandes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ShoppingCart className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">1,523</div>
            <div className="text-sm text-muted-foreground">Commandes totales</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold">1,387</div>
            <div className="text-sm text-muted-foreground">Livrées</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold">89</div>
            <div className="text-sm text-muted-foreground">En cours</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">85.50€</div>
            <div className="text-sm text-muted-foreground">Panier moyen</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Interface de gestion des commandes en cours de développement...</p>
        </CardContent>
      </Card>
    </div>
  )
}