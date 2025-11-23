import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '@/lib/shopify/storefront';
import { CartDrawer } from '@/components/shopify/CartDrawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Loader2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function ShopifyStore() {
  const addItem = useCartStore(state => state.addItem);

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['shopify-products'],
    queryFn: () => fetchProducts(20),
  });

  const handleAddToCart = (product: any) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) {
      toast.error('Product not available');
      return;
    }

    const cartItem = {
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || []
    };
    
    addItem(cartItem);
    toast.success('Added to cart', {
      description: `${product.node.title} has been added to your cart`,
      position: 'top-center'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load products</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Store</h1>
          </div>
          <CartDrawer />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!products || products.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No products found</h2>
            <p className="text-muted-foreground">
              Create products in your Shopify admin to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <Card key={product.node.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/store/product/${product.node.handle}`}>
                  <CardHeader className="p-0">
                    {product.node.images?.edges?.[0]?.node ? (
                      <img
                        src={product.node.images.edges[0].node.url}
                        alt={product.node.title}
                        className="w-full h-64 object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 bg-muted flex items-center justify-center">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </CardHeader>
                </Link>
                <CardContent className="p-4">
                  <Link to={`/store/product/${product.node.handle}`}>
                    <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
                      {product.node.title}
                    </h3>
                  </Link>
                  <p className="text-2xl font-bold text-primary">
                    {product.node.priceRange.minVariantPrice.currencyCode}{' '}
                    {parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    onClick={() => handleAddToCart(product)} 
                    className="w-full"
                  >
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
