import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { Package, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { products } = useProducts();
  const { orders } = useOrders();

  const stats = [
    {
      title: 'Total Products',
      value: products?.length || 0,
      icon: Package,
      description: 'Products in catalog',
      link: '/catalogue'
    },
    {
      title: 'Total Orders',
      value: orders?.length || 0,
      icon: ShoppingCart,
      description: 'Orders received',
      link: '/orders'
    },
    {
      title: 'Revenue',
      value: `€${orders?.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      description: 'Total revenue',
      link: '/orders'
    },
    {
      title: 'Active Integrations',
      value: '3',
      icon: Users,
      description: 'Connected platforms',
      link: '/integrations'
    }
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your e-commerce business.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-card transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <Button variant="link" size="sm" asChild className="mt-2 p-0 h-auto">
                <Link to={stat.link}>View details →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Import Products</CardTitle>
            <CardDescription>
              Add new products from suppliers or upload CSV files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/import">Start Import</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Orders</CardTitle>
            <CardDescription>
              View and process your recent orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/orders">View Orders</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Integrations</CardTitle>
            <CardDescription>
              Connect with Shopify, BigBuy, and other platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/integrations">Manage Integrations</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}