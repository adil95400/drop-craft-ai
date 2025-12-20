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
import { useMutation, useQueryClient } from '@tanstack/react-query'
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

// Mock variant type since product_variants table doesn't exist
interface MockVariant {
  id: string
  name: string
  sku: string
  price: number
  stock_quantity: number
}

export function ProductDetailsModal({ product, open, onOpenChange }: ProductDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [editedProduct, setEditedProduct] = useState(product)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Mock variants data since product_variants table doesn't exist
  const variants: MockVariant[] = []
  const refetchVariants = () => {}

  // Fetch sync history - placeholder for future implementation
  const syncHistory: any[] = []

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', product.id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
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
                  product.name || product.title
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
                          alt={`${product.name || product.title} - Image ${currentImageIndex + 1}`}
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
                    Tags & Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {product.tags?.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{tag}</Badge>
                    )) || <p className="text-muted-foreground">No tags</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated:</span>
                    <span>{new Date(product.updated_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Sync History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {syncHistory.length > 0 ? (
                    <div className="space-y-2">
                      {syncHistory.map((entry: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded border">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{entry.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={entry.status === 'success' ? 'default' : 'destructive'}>
                            {entry.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
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
