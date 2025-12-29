import { ColumnDef } from '@tanstack/react-table'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  ArrowUpDown,
  Package,
  TrendingUp,
  TrendingDown,
  History,
  Star,
  Copy,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Zap,
  Image as ImageIcon
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface ProductsTableColumnsProps {
  onEdit: (product: UnifiedProduct) => void
  onDelete: (id: string) => void
  onView: (product: UnifiedProduct) => void
  onShowHistory?: (product: UnifiedProduct) => void
  onDuplicate?: (product: UnifiedProduct) => void
  onEnrich?: (product: UnifiedProduct) => void
}

// Score de qualité calculé
const calculateQualityScore = (product: UnifiedProduct): number => {
  let score = 0
  if (product.name && product.name.length > 10) score += 20
  if (product.description && product.description.length > 50) score += 25
  if (product.image_url) score += 20
  if (product.category) score += 15
  if (product.sku) score += 10
  if (product.price > 0) score += 10
  return Math.min(score, 100)
}

export const createProductsColumns = ({
  onEdit,
  onDelete,
  onView,
  onShowHistory,
  onDuplicate,
  onEnrich,
}: ProductsTableColumnsProps): ColumnDef<UnifiedProduct>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Tout sélectionner"
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
    size: 40,
  },
  {
    accessorKey: 'image_url',
    header: 'Image',
    cell: ({ row }) => (
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted group">
        {row.original.image_url ? (
          <>
            <img
              src={row.original.image_url}
              alt={row.original.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg'
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Eye className="h-4 w-4 text-white" />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>
    ),
    enableSorting: false,
    size: 80,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="hover:bg-transparent p-0"
      >
        Produit
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const qualityScore = calculateQualityScore(row.original)
      return (
        <div className="space-y-1.5 max-w-[280px]">
          <div className="font-medium truncate" title={row.original.name}>
            {row.original.name}
          </div>
          <div className="flex items-center gap-2">
            {row.original.sku && (
              <span className="text-xs text-muted-foreground font-mono">
                {row.original.sku}
              </span>
            )}
            {row.original.category && (
              <Badge variant="outline" className="text-[10px] px-1.5">
                {row.original.category}
              </Badge>
            )}
          </div>
          {/* Barre de qualité */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={qualityScore} 
                    className={cn(
                      "h-1.5 w-16",
                      qualityScore >= 70 ? "[&>div]:bg-green-500" :
                      qualityScore >= 40 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
                    )}
                  />
                  <span className="text-[10px] text-muted-foreground">{qualityScore}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Score qualité: {qualityScore}%</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    size: 300,
  },
  {
    accessorKey: 'price',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="hover:bg-transparent p-0"
      >
        Prix
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const price = row.original.price
      const costPrice = row.original.cost_price
      const margin = row.original.profit_margin
      
      return (
        <div className="space-y-1">
          <span className="font-bold text-lg">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
            }).format(price)}
          </span>
          {costPrice && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Coût: {costPrice.toFixed(2)}€</span>
            </div>
          )}
          {margin !== undefined && margin > 0 && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              margin >= 30 ? "text-green-600" : margin >= 15 ? "text-yellow-600" : "text-red-600"
            )}>
              {margin >= 30 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {margin.toFixed(1)}% marge
            </div>
          )}
        </div>
      )
    },
    size: 140,
  },
  {
    accessorKey: 'stock_quantity',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="hover:bg-transparent p-0"
      >
        Stock
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const stock = row.original.stock_quantity || 0
      const isOutOfStock = stock === 0
      const isLowStock = stock > 0 && stock < 10
      
      return (
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium",
            isOutOfStock 
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : isLowStock 
                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          )}>
            {isOutOfStock ? (
              <AlertTriangle className="h-3.5 w-3.5" />
            ) : isLowStock ? (
              <AlertTriangle className="h-3.5 w-3.5" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5" />
            )}
            <span>{stock}</span>
          </div>
        </div>
      )
    },
    size: 110,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="hover:bg-transparent p-0"
      >
        Statut
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge
          variant={status === 'active' ? 'default' : 'secondary'}
          className={cn(
            "font-medium",
            status === 'active' 
              ? "bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30" 
              : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
          )}
        >
          <span className={cn(
            "w-1.5 h-1.5 rounded-full mr-1.5",
            status === 'active' ? "bg-green-500" : "bg-gray-500"
          )} />
          {status === 'active' ? 'Actif' : 'Inactif'}
        </Badge>
      )
    },
    size: 100,
  },
  {
    accessorKey: 'source',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="hover:bg-transparent p-0"
      >
        Source
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const sourceConfig: Record<string, { label: string; color: string; icon?: React.ReactNode }> = {
        products: { label: 'Manuel', color: 'bg-blue-500/20 text-blue-700' },
        imported: { label: 'Importé', color: 'bg-purple-500/20 text-purple-700' },
        catalog: { label: 'Catalogue', color: 'bg-cyan-500/20 text-cyan-700' },
        premium: { label: 'Premium', color: 'bg-amber-500/20 text-amber-700', icon: <Star className="h-3 w-3" /> },
        shopify: { label: 'Shopify', color: 'bg-green-500/20 text-green-700' },
        feed: { label: 'Feed', color: 'bg-indigo-500/20 text-indigo-700' },
      }
      const config = sourceConfig[row.original.source] || { label: row.original.source, color: 'bg-gray-500/20 text-gray-700' }
      
      return (
        <Badge variant="outline" className={cn("text-xs gap-1", config.color)}>
          {config.icon}
          {config.label}
        </Badge>
      )
    },
    size: 110,
  },
  {
    accessorKey: 'updated_at',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="hover:bg-transparent p-0"
      >
        Modifié
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.original.updated_at ? new Date(row.original.updated_at) : null
      if (!date) return <span className="text-muted-foreground">-</span>
      
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      
      let label = ''
      if (diffDays === 0) label = "Aujourd'hui"
      else if (diffDays === 1) label = 'Hier'
      else if (diffDays < 7) label = `Il y a ${diffDays}j`
      else label = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      
      return (
        <span className={cn(
          "text-sm",
          diffDays > 30 ? "text-muted-foreground" : "text-foreground"
        )}>
          {label}
        </span>
      )
    },
    size: 100,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const product = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(product)}>
              <Eye className="mr-2 h-4 w-4" />
              Voir détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(product)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(product)}>
                <Copy className="mr-2 h-4 w-4" />
                Dupliquer
              </DropdownMenuItem>
            )}
            {onEnrich && (
              <DropdownMenuItem onClick={() => onEnrich(product)}>
                <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                Enrichir IA
              </DropdownMenuItem>
            )}
            {onShowHistory && (
              <DropdownMenuItem onClick={() => onShowHistory(product)}>
                <History className="mr-2 h-4 w-4" />
                Historique
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(product.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
    size: 60,
  },
]
