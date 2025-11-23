import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchProductByHandle } from '@/lib/shopify/storefront';
import { CartDrawer } from '@/components/shopify/CartDrawer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import { useState } from 'react';

export default function ShopifyProductDetail() {
  const { handle } = useParams<{ handle: string }>();
  const addItem = useCartStore(state => state.addItem);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['shopify-product', handle],
    queryFn: () => fetchProductByHandle(handle!),
    enabled: !!handle,
  });

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    const cartItem = {
      product: { node: product },
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions || []
    };
    
    addItem(cartItem);
    toast.success('Added to cart', {
      description: `${product.title} has been added to your cart`,
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

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Product not found</p>
          <Link to="/store">
            <Button>Back to Store</Button>
          </Link>
        </div>
      </div>
    );
  }

  const defaultVariant = product.variants.edges[0]?.node;
  const currentVariant = selectedVariant || defaultVariant;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/store" className="flex items-center gap-2 hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">Back to Store</span>
          </Link>
          <CartDrawer />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            {product.images?.edges?.[0]?.node ? (
              <Card className="overflow-hidden">
                <img
                  src={product.images.edges[0].node.url}
                  alt={product.title}
                  className="w-full h-auto"
                />
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="w-full aspect-square bg-muted flex items-center justify-center">
                  <ShoppingBag className="h-24 w-24 text-muted-foreground" />
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              <p className="text-3xl font-bold text-primary">
                {currentVariant?.price.currencyCode}{' '}
                {parseFloat(currentVariant?.price.amount || '0').toFixed(2)}
              </p>
            </div>

            {product.description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <div 
                  className="text-muted-foreground prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {product.variants.edges.length > 1 && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Select Variant</h2>
                <div className="flex flex-wrap gap-2">
                  {product.variants.edges.map(({ node: variant }) => (
                    <Button
                      key={variant.id}
                      variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={!variant.availableForSale}
                    >
                      {variant.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={handleAddToCart}
              size="lg"
              className="w-full"
              disabled={!currentVariant?.availableForSale}
            >
              {currentVariant?.availableForSale ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
