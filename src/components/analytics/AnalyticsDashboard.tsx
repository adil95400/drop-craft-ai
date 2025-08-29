import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Package } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

export function AnalyticsDashboard() {
  const { metrics, salesData, loading } = useAnalytics();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metricCards = [
    { title: 'Total Revenue', value: metrics?.totalRevenue || 0, icon: DollarSign, change: '+12.5%' },
    { title: 'Orders', value: metrics?.totalOrders || 0, icon: ShoppingCart, change: '+8.2%' },
    { title: 'Products', value: metrics?.totalProducts || 0, icon: Package, change: '+23.1%' },
    { title: 'Customers', value: metrics?.totalCustomers || 0, icon: Users, change: '+5.4%' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics Overview</h2>
        <p className="text-muted-foreground">Monitor your dropshipping performance and growth metrics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.title === 'Total Revenue' ? `€${metric.value.toLocaleString()}` : metric.value.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {metric.change.startsWith('+') ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                {metric.change} from last month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales Conversion</CardTitle>
                <CardDescription>Your conversion rate this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Visitors to Customers</span>
                    <span className="text-sm font-medium">3.2%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Add to Cart Rate</span>
                    <span className="text-sm font-medium">12.8%</span>
                  </div>
                  <Progress value={64} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
                <CardDescription>Best performing product categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Electronics', 'Fashion', 'Home & Garden', 'Sports'].map((category, index) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm">{category}</span>
                      <Badge variant="secondary">
                        €{(5000 - index * 800).toLocaleString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Track your best and worst performing products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm font-medium">Top Performers</div>
                {['Wireless Headphones', 'Smart Watch', 'Laptop Stand'].map((product, index) => (
                  <div key={product} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{product}</div>
                      <div className="text-sm text-muted-foreground">{150 - index * 20} sales</div>
                    </div>
                    <Badge variant="default">€{(2500 - index * 300).toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Segmentation</CardTitle>
                <CardDescription>Understand your customer base</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New Customers</span>
                    <Badge variant="outline">65%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Returning Customers</span>
                    <Badge variant="outline">35%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">VIP Customers</span>
                    <Badge variant="outline">8%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Lifetime Value</CardTitle>
                <CardDescription>Average value per customer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">€287.50</div>
                <div className="text-sm text-muted-foreground">
                  +15.3% from last quarter
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Performance</CardTitle>
              <CardDescription>Monitor supplier reliability and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['AliExpress Premium', 'BigBuy Wholesale', 'DHgate Select'].map((supplier, index) => (
                  <div key={supplier} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{supplier}</div>
                      <div className="text-sm text-muted-foreground">
                        {95 - index * 2}% fulfillment rate
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">€{(15000 - index * 3000).toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">monthly volume</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}