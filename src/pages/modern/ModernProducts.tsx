/**
 * Interface moderne des produits inspirée des concurrents (AutoDS, Spocket, Channable)
 * Table avec colonnes, recherche, filtres et actions rapides
 */
import React, { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Package,
  Star,
  Eye,
  Edit,
  MoreVertical,
  Plus,
  Download,
  Upload,
  Filter,
  TrendingUp,
  DollarSign,
  Activity,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useLegacyPlan } from '@/lib/migration-helper'

interface Product {
  id: string
  title: string
  sku?: string
  category?: string
  sale_price: number
  cost_price?: number
  stock_quantity?: number
  status: string
  supplier_name?: string
  images?: string[]
  created_at: string
  updated_at: string
  ai_optimized?: boolean
  // Autres champs Supabase
  [key: string]: any
}

export default function ModernProducts() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { isPro, isUltraPro } = useLegacyPlan(user)
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [bulkActions, setBulkActions] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [user])

  const fetchProducts = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, label: 'Actif', color: 'bg-green-100 text-green-800' },
      draft: { variant: 'secondary' as const, label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
      archived: { variant: 'destructive' as const, label: 'Archivé', color: 'bg-red-100 text-red-800' }
    }
    
    const config = variants[status as keyof typeof variants] || variants.draft
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const columns: ColumnDef<Product>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Sélectionner tout"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Sélectionner la ligne"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Produit",
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex items-center space-x-3 min-w-[250px]">
            <Avatar className="h-10 w-10 rounded-md">
              <AvatarImage 
                src={product.images?.[0]} 
                alt={product.title}
                className="object-cover"
              />
              <AvatarFallback className="rounded-md">
                <Package className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="font-medium text-sm leading-none">{product.title}</div>
              <div className="text-xs text-muted-foreground">
                SKU: {product.sku || 'N/A'}
              </div>
              {product.ai_optimized && (
                <Badge variant="outline" className="text-xs h-4 px-1">
                  <Star className="h-2 w-2 mr-1" />
                  IA
                </Badge>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "category",
      header: "Catégorie",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("category") || "Non catégorisé"}</Badge>
      ),
    },
    {
      accessorKey: "supplier_name",
      header: "Fournisseur",
      cell: ({ row }) => {
        const supplier = row.original.supplier_name
        return supplier ? (
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${supplier}`} />
              <AvatarFallback className="text-xs">{supplier.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{supplier}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      },
    },
    {
      accessorKey: "stock_quantity",
      header: "Stock",
      cell: ({ row }) => {
        const stock = row.getValue("stock_quantity") as number || 0
        return (
          <div className="flex items-center space-x-2">
            <span className="font-medium">{stock}</span>
            {stock === 0 && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "price",
      header: "Prix",
      cell: ({ row }) => {
        const price = (row.getValue("sale_price") || row.getValue("price")) as number
        const costPrice = row.original.cost_price
        const margin = costPrice ? ((price - costPrice) / costPrice * 100) : 0
        
        return (
          <div className="text-right space-y-1">
            <div className="font-medium">{formatCurrency(price)}</div>
            {isPro && costPrice && (
              <div className="text-xs text-muted-foreground">
                Marge: +{margin.toFixed(0)}%
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Ouvrir menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSelectedProduct(product)}>
                <Eye className="mr-2 h-4 w-4" />
                Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              {isUltraPro && (
                <DropdownMenuItem>
                  <Star className="mr-2 h-4 w-4" />
                  Optimiser avec IA
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Archiver
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // Stats
  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    totalValue: products.reduce((sum, p) => sum + p.price, 0),
    lowStock: products.filter(p => p.stock_quantity < 10).length
  }

  const filters = (
    <>
      <Select defaultValue="all">
        <SelectTrigger className="h-8 w-[150px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="active">Actif</SelectItem>
          <SelectItem value="draft">Brouillon</SelectItem>
          <SelectItem value="archived">Archivé</SelectItem>
        </SelectContent>
      </Select>
      
      <Select defaultValue="all">
        <SelectTrigger className="h-8 w-[150px]">
          <SelectValue placeholder="Catégorie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes catégories</SelectItem>
          {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(category => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )

  const toolbar = (
    <>
      <Button variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        Exporter
      </Button>
      <Button size="sm" asChild>
        <a href="/import">
          <Plus className="mr-2 h-4 w-4" />
          Importer
        </a>
      </Button>
    </>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header moderne */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
          <p className="text-muted-foreground">
            Gérez votre catalogue de {stats.total} produits
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isUltraPro && (
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          )}
          <Button size="sm" asChild>
            <a href="/import">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau produit
            </a>
          </Button>
        </div>
      </div>

      {/* KPIs modernes */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              +12% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux Optimisé</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((products.filter(p => p.ai_optimized).length / Math.max(products.length, 1)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              IA optimisés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table moderne avec DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>Catalogue</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={products}
            searchKey="title"
            searchPlaceholder="Rechercher un produit..."
            filters={filters}
            toolbar={toolbar}
          />
        </CardContent>
      </Card>

      {/* Dialog de détails produit */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Avatar className="h-8 w-8 rounded-md">
                  <AvatarImage src={selectedProduct.images?.[0]} />
                  <AvatarFallback><Package className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                {selectedProduct.title}
              </DialogTitle>
              <DialogDescription>
                Détails complets du produit
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Informations</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>SKU:</span>
                      <span className="font-mono">{selectedProduct.sku || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prix:</span>
                      <span className="font-medium">{formatCurrency(selectedProduct.price)}</span>
                    </div>
                    {isPro && selectedProduct.cost_price && (
                      <div className="flex justify-between">
                        <span>Prix de revient:</span>
                        <span>{formatCurrency(selectedProduct.cost_price)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Stock:</span>
                      <span>{selectedProduct.stock_quantity}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Statut</h4>
                  <div className="space-y-2">
                    {getStatusBadge(selectedProduct.status)}
                    {selectedProduct.ai_optimized && (
                      <Badge variant="outline" className="ml-2">
                        <Star className="h-3 w-3 mr-1" />
                        Optimisé IA
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}