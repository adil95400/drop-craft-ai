import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { ProductVariantManager } from './ProductVariantManager'
import {
  Edit2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  Calendar,
  DollarSign,
  Tag,
  Layers,
  ShoppingCart,
  ExternalLink,
  Clock,
  History,
  GitBranch,
} from 'lucide-react'

interface ProductDetailsModalProps {
  product: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductDetailsModal({ product, open, onOpenChange }: ProductDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [editedProduct, setEditedProduct] = useState(product)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch product variants
  const { data: variants = [], refetch: refetchVariants } = useQuery({
    queryKey: ['product-variants', product?.id],
    queryFn: async () => {
      if (!product?.id) return []
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: open && !!product?.id,
  })

  // Fetch sync history - placeholder for future implementation
  const syncHistory: any[] = []

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('imported_products')
        .update(updates)
        .eq('id', product.id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      toast({
        title: 'Product updated',
        description: 'Changes saved successfully',
      })
      setIsEditing(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  if (!product) return null

  const images = product.images || (product.image_url ? [product.image_url] : [])
  const hasMultipleImages = images.length > 1

  const handleSave = () => {
    updateMutation.mutate({
      name: editedProduct.name,
      description: editedProduct.description,
      price: editedProduct.price,
      cost_price: editedProduct.cost_price,
      sku: editedProduct.sku,
      category: editedProduct.category,
      stock_quantity: editedProduct.stock_quantity,
    })
  }

  const handleCancel = () => {
    setEditedProduct(product)
    setIsEditing(false)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'default'
      case 'draft':
        return 'secondary'
      case 'archived':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold">
                {isEditing ? (
                  <Input
                    value={editedProduct.name}
                    onChange={(e) =>
                      setEditedProduct({ ...editedProduct, name: e.target.value })
                    }
                    className="text-2xl font-bold"
                  />
                ) : (
                  product.name
                )}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getStatusColor(product.status)}>
                  {product.status}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Package className="h-3 w-3" />
                  {product.sku || 'No SKU'}
                </Badge>
                {product.platform_name && (
                  <Badge variant="outline">{product.platform_name}</Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="variants">
                <GitBranch className="h-4 w-4 mr-2" />
                Variants
              </TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Price</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editedProduct.price}
                          onChange={(e) =>
                            setEditedProduct({
                              ...editedProduct,
                              price: parseFloat(e.target.value),
                            })
                          }
                        />
                      ) : (
                        <p className="text-2xl font-bold">${product.price?.toFixed(2)}</p>
                      )}
                    </div>
                    <div>
                      <Label>Cost Price</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editedProduct.cost_price || ''}
                          onChange={(e) =>
                            setEditedProduct({
                              ...editedProduct,
                              cost_price: parseFloat(e.target.value),
                            })
                          }
                        />
                      ) : (
                        <p className="font-semibold">
                          ${product.cost_price?.toFixed(2) || 'N/A'}
                        </p>
                      )}
                    </div>
                    {product.cost_price && product.price && (
                      <div>
                        <Label>Profit Margin</Label>
                        <p className="font-semibold text-green-600">
                          {(
                            ((product.price - product.cost_price) / product.price) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Inventory
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Stock Quantity</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editedProduct.stock_quantity || ''}
                          onChange={(e) =>
                            setEditedProduct({
                              ...editedProduct,
                              stock_quantity: parseInt(e.target.value),
                            })
                          }
                        />
                      ) : (
                        <p className="text-2xl font-bold">
                          {product.stock_quantity || 0}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Category</Label>
                      {isEditing ? (
                        <Input
                          value={editedProduct.category || ''}
                          onChange={(e) =>
                            setEditedProduct({
                              ...editedProduct,
                              category: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <p className="font-semibold">{product.category || 'Uncategorized'}</p>
                      )}
                    </div>
                    <div>
                      <Label>SKU</Label>
                      {isEditing ? (
                        <Input
                          value={editedProduct.sku || ''}
                          onChange={(e) =>
                            setEditedProduct({ ...editedProduct, sku: e.target.value })
                          }
                        />
                      ) : (
                        <p className="font-mono text-sm">{product.sku || 'N/A'}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editedProduct.description || ''}
                      onChange={(e) =>
                        setEditedProduct({
                          ...editedProduct,
                          description: e.target.value,
                        })
                      }
                      rows={6}
                      className="resize-none"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {product.description || 'No description available'}
                    </p>
                  )}
                </CardContent>
              </Card>

              {product.platform_url && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Platform Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={product.platform_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      View on {product.platform_name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="variants" className="space-y-4">
              <ProductVariantManager
                productId={product.id}
                variants={variants}
                onRefetch={refetchVariants}
              />
            </TabsContent>

            <TabsContent value="images" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  {images.length > 0 ? (
                    <div className="space-y-4">
                      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                        <img
                          src={images[currentImageIndex]}
                          alt={`${product.name} - Image ${currentImageIndex + 1}`}
                          className="w-full h-full object-contain"
                        />
                        {hasMultipleImages && (
                          <>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute left-2 top-1/2 -translate-y-1/2"
                              onClick={prevImage}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2"
                              onClick={nextImage}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
                              {currentImageIndex + 1} / {images.length}
                            </div>
                          </>
                        )}
                      </div>
                      {hasMultipleImages && (
                        <div className="grid grid-cols-6 gap-2">
                          {images.map((img: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                                idx === currentImageIndex
                                  ? 'border-primary'
                                  : 'border-transparent hover:border-muted-foreground'
                              }`}
                            >
                              <img
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                      <p className="text-muted-foreground">No images available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Product Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Product ID</Label>
                      <p className="font-mono text-sm">{product.id}</p>
                    </div>
                    {product.platform_product_id && (
                      <div>
                        <Label className="text-muted-foreground">Platform ID</Label>
                        <p className="font-mono text-sm">{product.platform_product_id}</p>
                      </div>
                    )}
                    {product.variant_id && (
                      <div>
                        <Label className="text-muted-foreground">Variant ID</Label>
                        <p className="font-mono text-sm">{product.variant_id}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">Created</Label>
                      <p className="text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(product.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Last Updated</Label>
                      <p className="text-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(product.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    {product.last_synced_at && (
                      <div>
                        <Label className="text-muted-foreground">Last Synced</Label>
                        <p className="text-sm flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(product.last_synced_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                  <Separator />
                  {product.raw_data && (
                    <div>
                      <Label className="text-muted-foreground mb-2 block">
                        Raw Platform Data
                      </Label>
                      <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                        <pre className="text-xs font-mono">
                          {JSON.stringify(product.raw_data, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Synchronization History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {syncHistory.length > 0 ? (
                    <div className="space-y-3">
                      {syncHistory.map((entry: any) => (
                        <div
                          key={entry.id}
                          className="flex items-start justify-between border-l-2 border-primary pl-3 py-2"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {entry.sync_type === 'import'
                                ? 'Product Imported'
                                : 'Product Synced'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.synced_at).toLocaleString()}
                            </p>
                            {entry.changes_detected && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Changes: {JSON.stringify(entry.changes_detected)}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {entry.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No sync history available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
