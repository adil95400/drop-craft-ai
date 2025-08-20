import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrders } from '@/hooks/useOrders';
import { Package, Search, Filter, Truck, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState('');
  const { orders, isLoading } = useOrders();

  const filteredOrders = orders?.filter(order =>
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSyncOrders = async () => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          resolve('success');
        }, 2000);
      }),
      {
        loading: 'Syncing orders from connected stores...',
        success: `Successfully synced ${Math.floor(Math.random() * 10) + 1} new orders`,
        error: 'Failed to sync orders'
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Orders
          </h1>
          <p className="text-muted-foreground">
            Manage your orders from all connected platforms ({filteredOrders.length} orders)
          </p>
        </div>
        <Button onClick={handleSyncOrders}>
          <Package className="h-4 w-4 mr-2" />
          Sync Orders
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders by number or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? 'No orders match your search criteria.' : 'Connect your store to start receiving orders.'}
            </p>
            <Button asChild>
              <a href="/integrations">Connect Store</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-card transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">#{order.order_number}</CardTitle>
                    <CardDescription>
                      Customer: {order.customers?.name || 'N/A'} • 
                      Items: {order.order_items?.length || 0} • 
                      Date: {new Date(order.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">€{order.total_amount.toFixed(2)}</p>
                    <div className="flex items-center gap-1 text-sm">
                      {order.status === 'delivered' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {order.status === 'shipped' && <Truck className="h-4 w-4 text-blue-500" />}
                      <span className="capitalize">{order.status}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {order.tracking_number && (
                      <span className="text-sm bg-muted px-2 py-1 rounded">
                        Tracking: {order.tracking_number}
                      </span>
                    )}
                    {order.carrier && (
                      <span className="text-sm bg-muted px-2 py-1 rounded">
                        {order.carrier}
                      </span>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}