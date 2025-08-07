import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Target,
  BarChart3,
  PieChart,
  Star,
  Users,
  ShoppingCart,
  Crown
} from "lucide-react"
import { CatalogProduct } from "@/hooks/useCatalogProducts"

interface CatalogAnalyticsProps {
  products: CatalogProduct[]
  stats: {
    total: number
    winners: number
    trending: number
    bestsellers: number
    averageRating: number
    totalValue: number
  }
}

export const CatalogAnalytics = ({ products, stats }: CatalogAnalyticsProps) => {
  const categories = products.reduce((acc, product) => {
    const category = product.category || 'Non catégorisé'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const suppliers = products.reduce((acc, product) => {
    acc[product.supplier_name] = (acc[product.supplier_name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topCategories = Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  const topSuppliers = Object.entries(suppliers)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  const averageMargin = products.length > 0 
    ? products.reduce((sum, p) => sum + p.profit_margin, 0) / products.length 
    : 0

  const highMarginProducts = products.filter(p => p.profit_margin > 50).length
  const lowStockProducts = products.filter(p => p.stock_quantity < 50).length

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  return (
    <div className="grid gap-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              +12% depuis le mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Winners</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winners}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.winners / stats.total) * 100).toFixed(1)}% du catalogue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Marge moyenne: {averageMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Sur 5 étoiles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories & Suppliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Top Catégories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCategories.map(([category, count]) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{category}</span>
                  <span className="text-sm text-muted-foreground">{count} produits</span>
                </div>
                <Progress 
                  value={(count / stats.total) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Top Fournisseurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topSuppliers.map(([supplier, count]) => (
              <div key={supplier} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{supplier}</span>
                  <span className="text-sm text-muted-foreground">{count} produits</span>
                </div>
                <Progress 
                  value={(count / stats.total) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              Produits Haute Marge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{highMarginProducts}</div>
            <p className="text-sm text-muted-foreground">
              Marge &gt; 50% ({((highMarginProducts / stats.total) * 100).toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Produits Tendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.trending}</div>
            <p className="text-sm text-muted-foreground">
              En croissance ({((stats.trending / stats.total) * 100).toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              Stock Faible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{lowStockProducts}</div>
            <p className="text-sm text-muted-foreground">
              Moins de 50 unités ({((lowStockProducts / stats.total) * 100).toFixed(1)}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Best Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Meilleurs Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {products
              .filter(p => p.is_winner || p.is_bestseller)
              .slice(0, 5)
              .map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.supplier_name}</p>
                    </div>
                  </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500 text-white">
                        {product.profit_margin.toFixed(0)}%
                      </Badge>
                      <span className="font-bold">{formatPrice(product.price)}</span>
                    </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}