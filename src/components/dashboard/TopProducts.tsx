import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Package, Star, TrendingUp } from 'lucide-react'

export const TopProducts: React.FC = () => {
  // Données simulées des produits les plus performants
  const topProducts = [
    {
      id: 1,
      name: "Montre Connectée Sport",
      category: "Électronique",
      sales: 156,
      revenue: 23400,
      trend: "+15%",
      rating: 4.8,
      image: "🏃‍♂️"
    },
    {
      id: 2,
      name: "Casque Audio Sans Fil",
      category: "Audio",
      sales: 124,
      revenue: 18600,
      trend: "+12%",
      rating: 4.6,
      image: "🎧"
    },
    {
      id: 3,
      name: "Support Téléphone Bureau",
      category: "Accessoires",
      sales: 98,
      revenue: 2940,
      trend: "+8%",
      rating: 4.4,
      image: "📱"
    },
    {
      id: 4,
      name: "Chargeur Rapide USB-C",
      category: "Électronique", 
      sales: 87,
      revenue: 2610,
      trend: "+5%",
      rating: 4.7,
      image: "🔌"
    }
  ]

  const maxSales = Math.max(...topProducts.map(p => p.sales))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-purple-600" />
          Top Produits
        </CardTitle>
        <CardDescription>
          Produits les plus performants ce mois
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topProducts.map((product, index) => (
            <div key={product.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              {/* Rang et image */}
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <div className="text-2xl">{product.image}</div>
              </div>

              {/* Informations produit */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{product.name}</h4>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">{product.trend}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs">{product.rating}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-3">
                    <Progress 
                      value={(product.sales / maxSales) * 100} 
                      className="h-2"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{product.sales} ventes</p>
                    <p className="text-xs text-muted-foreground">€{product.revenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Résumé */}
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total des ventes top 4</p>
              <p className="text-xs text-muted-foreground">465 produits vendus</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">€47,550</p>
              <p className="text-xs text-green-600">+10.5% ce mois</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}