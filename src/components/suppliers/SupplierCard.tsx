import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Building2,
  Globe,
  MoreVertical,
  RefreshCw,
  Edit,
  Trash2,
  ExternalLink,
  Package,
  TrendingUp,
  Calendar
} from 'lucide-react'
import { Supplier } from '@/hooks/useSuppliers'
import { useTranslation } from 'react-i18next'

interface SupplierCardProps {
  supplier: Supplier
  onEdit: (supplier: Supplier) => void
  onDelete: (id: string) => void
  onSync: (id: string) => void
}

export const SupplierCard = ({ supplier, onEdit, onDelete, onSync }: SupplierCardProps) => {
  const { t } = useTranslation(['common', 'navigation'])

  const getStatusBadge = (status: string) => {
    const statusColors = {
      connected: 'bg-green-100 text-green-800 border-green-200',
      disconnected: 'bg-gray-100 text-gray-800 border-gray-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }

    const statusLabels = {
      connected: 'Connecté',
      disconnected: 'Déconnecté',
      error: 'Erreur',
      pending: 'En attente'
    }

    return (
      <Badge className={statusColors[status as keyof typeof statusColors]}>
        {statusLabels[status as keyof typeof statusLabels]}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeColors = {
      api: 'bg-blue-100 text-blue-800',
      csv: 'bg-purple-100 text-purple-800',
      xml: 'bg-orange-100 text-orange-800',
      ftp: 'bg-indigo-100 text-indigo-800',
      email: 'bg-pink-100 text-pink-800'
    }

    return (
      <Badge className={typeColors[type as keyof typeof typeColors]}>
        {type.toUpperCase()}
      </Badge>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center space-x-3">
          {supplier.logo_url ? (
            <img 
              src={supplier.logo_url} 
              alt={supplier.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <CardTitle className="text-lg">{supplier.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(supplier.connection_status)}
              {getTypeBadge(supplier.supplier_type)}
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(supplier)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSync(supplier.id)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Synchroniser
            </DropdownMenuItem>
            {supplier.website && (
              <DropdownMenuItem asChild>
                <a href={supplier.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visiter le site
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => onDelete(supplier.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-4">
        {supplier.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {supplier.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">{supplier.product_count}</span> produits
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">{supplier.success_rate}%</span> succès
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Dernière sync: {formatDate(supplier.last_sync_at)}
          </div>
          {supplier.country && (
            <Badge variant="outline" className="text-xs">
              {supplier.country}
            </Badge>
          )}
        </div>

        {supplier.tags && supplier.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {supplier.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {supplier.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{supplier.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}