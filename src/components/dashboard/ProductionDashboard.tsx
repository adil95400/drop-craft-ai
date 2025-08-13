import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useProductionData } from "@/hooks/useProductionData"
import { Package, ShoppingCart, Users, TrendingUp, Database } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export const ProductionDashboard = () => {
  const { dashboardStats, isLoadingStats, seedDatabase, isSeeding } = useProductionData()

  if (isLoadingStats) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-1"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Live inventory data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              From real Shopify data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (7d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardStats?.revenue7d || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seed Database Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Development Database
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Populate your database with realistic test data for development and testing
              </p>
              <div className="flex gap-2">
                <Badge variant="outline">50 Products</Badge>
                <Badge variant="outline">20 Customers</Badge>
                <Badge variant="outline">30 Orders</Badge>
                <Badge variant="outline">Real Tracking</Badge>
              </div>
            </div>
            <Button 
              onClick={() => seedDatabase()}
              disabled={isSeeding}
              size="lg"
            >
              {isSeeding ? 'Seeding...' : 'Seed Database'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardStats?.recentOrders?.slice(0, 5).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.customers?.name || 'Guest Customer'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(order.total)}</p>
                  <Badge variant={
                    order.status === 'delivered' ? 'default' :
                    order.status === 'shipped' ? 'secondary' :
                    order.status === 'processing' ? 'outline' : 'destructive'
                  }>
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
            {(!dashboardStats?.recentOrders || dashboardStats.recentOrders.length === 0) && (
              <p className="text-center text-muted-foreground py-4">
                No recent orders. Seed the database to see data.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardStats?.topProducts?.slice(0, 5).map((product: any) => (
              <div key={product.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{product.title}</p>
                  <p className="text-sm text-muted-foreground">{product.sku}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(product.price)}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.order_items?.reduce((sum: number, item: any) => sum + item.qty, 0) || 0} sold
                  </p>
                </div>
              </div>
            ))}
            {(!dashboardStats?.topProducts || dashboardStats.topProducts.length === 0) && (
              <p className="text-center text-muted-foreground py-4">
                No products found. Import products to see data.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}