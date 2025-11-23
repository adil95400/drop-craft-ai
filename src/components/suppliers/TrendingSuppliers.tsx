import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Star, Package, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function TrendingSuppliers() {
  const navigate = useNavigate()
  
  const trendingSuppliers = [
    {
      id: '1',
      name: 'Spocket Premium',
      rating: 4.8,
      products: '100K+',
      trend: '+24%',
      category: 'Dropshipping',
      featured: true
    },
    {
      id: '2',
      name: 'BigBuy Wholesale',
      rating: 4.6,
      products: '150K+',
      trend: '+18%',
      category: 'Wholesale',
      featured: true
    },
    {
      id: '3',
      name: 'Printful',
      rating: 4.9,
      products: '50K+',
      trend: '+32%',
      category: 'Print on Demand',
      featured: false
    }
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Fournisseurs Tendance
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/products/suppliers/browse')}>
            Voir tout
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {trendingSuppliers.map((supplier) => (
          <div 
            key={supplier.id}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => navigate('/products/suppliers/browse')}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{supplier.name}</p>
                  {supplier.featured && (
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Top
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span>{supplier.rating}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{supplier.products} produits</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {supplier.trend}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
