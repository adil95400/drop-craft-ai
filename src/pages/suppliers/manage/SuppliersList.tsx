import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Store,
  Search,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Globe,
  Star,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react'
import { useRealSuppliers } from '@/hooks/useRealSuppliers'

export function SuppliersList() {
  const {
    suppliers,
    isLoading,
    updateSupplier,
    deleteSupplier,
    isUpdating,
    isDeleting
  } = useRealSuppliers()

  const [searchTerm, setSearchTerm] = useState('')

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.country?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Liste des Fournisseurs</h1>
          <p className="text-muted-foreground mt-2">
            {filteredSuppliers.length} fournisseur(s)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                Aucun fournisseur trouvé
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Site web</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(supplier.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {supplier.country && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {supplier.country}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant={supplier.status === 'active' ? 'default' : 'secondary'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {supplier.status === 'active' ? (
                          <><CheckCircle className="h-3 w-3" /> Actif</>
                        ) : (
                          <><AlertCircle className="h-3 w-3" /> Inactif</>
                        )}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {supplier.rating ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {renderStars(supplier.rating)}
                          </div>
                          <span className="text-sm">{supplier.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {supplier.website ? (
                        <a 
                          href={supplier.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <LinkIcon className="h-3 w-3" />
                          Visiter
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateSupplier({ 
                              id: supplier.id, 
                              updates: { status: supplier.status === 'active' ? 'inactive' : 'active' }
                            })}
                            disabled={isUpdating}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {supplier.status === 'active' ? 'Désactiver' : 'Activer'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              if (confirm(`Supprimer ${supplier.name} ?`)) {
                                deleteSupplier(supplier.id)
                              }
                            }}
                            disabled={isDeleting}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
