import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Smartphone, Laptop, Shirt, Home, Headphones, AlertTriangle } from 'lucide-react'

export function ProductCategoriesSection() {
  const categories = [
    { name: 'Électronique', count: 245, icon: <Smartphone className="h-4 w-4" />, color: 'primary' },
    { name: 'Mode', count: 189, icon: <Shirt className="h-4 w-4" />, color: 'secondary' },
    { name: 'Maison', count: 156, icon: <Home className="h-4 w-4" />, color: 'success' },
    { name: 'Informatique', count: 98, icon: <Laptop className="h-4 w-4" />, color: 'warning' },
    { name: 'Audio', count: 67, icon: <Headphones className="h-4 w-4" />, color: 'destructive' }
  ]

  const stockAlerts = [
    { product: 'Nike Air Max 270', stock: 3, status: 'Faible' },
    { product: 'Casque Sony WH-1000XM5', stock: 0, status: 'Rupture' },
    { product: 'MacBook Air M3', stock: 5, status: 'Faible' }
  ]

  const performance = [
    { label: 'Ventes ce mois', value: '+23%', status: 'success' },
    { label: 'Taux de conversion', value: '12.4%', status: 'success' },
    { label: 'Panier moyen', value: '89€', status: 'neutral' }
  ]

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Catégories Populaires */}
      <Card>
        <CardHeader>
          <CardTitle>Catégories Populaires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-muted">
                  {category.icon}
                </div>
                <span className="font-medium">{category.name}</span>
              </div>
              <Badge variant="secondary">{category.count} produits</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Alertes Stock */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Alertes Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
            <span className="text-sm font-medium">1000 produits en stock faible</span>
          </div>
          {stockAlerts.map((alert, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{alert.product}</div>
                <div className="text-xs text-muted-foreground">Stock: {alert.stock}</div>
              </div>
              <Badge variant={alert.stock === 0 ? 'destructive' : 'secondary'}>
                {alert.status}
              </Badge>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full">
            Voir les produits
          </Button>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {performance.map((perf, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium">{perf.label}</span>
              <Badge variant={perf.status === 'success' ? 'default' : 'secondary'}>
                {perf.value}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}