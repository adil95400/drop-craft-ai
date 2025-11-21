import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Plus, Filter, Eye, Edit, Trash2, Package } from 'lucide-react'

export default function ProductCatalog() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', categoryFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })

  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = [...new Set(products?.map((p) => p.category).filter(Boolean))]

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500',
      inactive: 'bg-gray-500/10 text-gray-500',
      archived: 'bg-red-500/10 text-red-500',
    }
    return colors[status] || 'bg-muted text-muted-foreground'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Catalog</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{products?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <Package className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">
                {products?.filter((p) => p.status === 'active').length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Package className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold">
                {products?.filter((p) => (p.stock_quantity || 0) < 10).length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-500/10">
              <Package className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold">
                {products?.filter((p) => (p.stock_quantity || 0) === 0).length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category || ''}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading products...</div>
        ) : filteredProducts?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No products found</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts?.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                {product.image_url && (
                  <div className="h-48 bg-muted flex items-center justify-center">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                    </div>
                    <Badge className={getStatusColor(product.status)}>
                      {product.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">€{product.price.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {product.stock_quantity || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
