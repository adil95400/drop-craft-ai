import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Store,
  Search,
  Plus,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Globe,
  Star,
  Edit,
  Trash2,
  RefreshCw,
  Link as LinkIcon,
  Eye,
  Link2Off
} from 'lucide-react'
import { useRealSuppliers } from '@/hooks/useRealSuppliers'
import { useSupplierConnection } from '@/hooks/useSupplierConnection'
import { useNavigate } from 'react-router-dom'

export default function MySuppliersPage() {
  const navigate = useNavigate()
  const {
    suppliers,
    stats,
    isLoading,
    updateSupplier,
    deleteSupplier,
    isUpdating,
    isDeleting,
  } = useRealSuppliers()

  const { 
    isSupplierConnected, 
    disconnectSupplier, 
    isDisconnecting 
  } = useSupplierConnection()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.country?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter
    const matchesCountry = countryFilter === 'all' || supplier.country === countryFilter
    
    return matchesSearch && matchesStatus && matchesCountry
  })

  const handleDisconnect = async (supplierId: string, supplierName: string) => {
    if (confirm(`Voulez-vous vraiment déconnecter ${supplierName} ?`)) {
      await disconnectSupplier(supplierId)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  const countries = Array.from(new Set(suppliers.map(s => s.country).filter(Boolean)))

  return (
    <>
      <Helmet>
        <title>Mes Fournisseurs - ShopOpti</title>
        <meta name="description" content="Gérez vos fournisseurs connectés" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Store className="h-8 w-8 text-primary" />
              Mes Fournisseurs
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos {stats.total} fournisseurs connectés
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/suppliers/marketplace')}>
              <Store className="h-4 w-4 mr-2" />
              Marketplace
            </Button>
            <Button onClick={() => navigate('/suppliers/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un fournisseur
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.active} actifs
                  </p>
                </div>
                <Store className="h-10 w-10 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.inactive} inactifs
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Note Moyenne</p>
                  <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</p>
                  <div className="flex items-center gap-1 mt-1">
                    {renderStars(Math.round(stats.averageRating))}
                  </div>
                </div>
                <Star className="h-10 w-10 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pays</p>
                  <p className="text-2xl font-bold">{Object.keys(stats.topCountries).length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    représentés
                  </p>
                </div>
                <Globe className="h-10 w-10 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou pays..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country} value={country!}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Fournisseurs connectés ({filteredSuppliers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-8">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' || countryFilter !== 'all'
                    ? 'Aucun fournisseur ne correspond aux filtres'
                    : 'Aucun fournisseur connecté'}
                </p>
                <Button onClick={() => navigate('/suppliers/marketplace')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Explorer le Marketplace
                </Button>
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
                    <TableRow 
                      key={supplier.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/suppliers/${supplier.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Store className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Créé le {new Date(supplier.created_at).toLocaleDateString('fr-FR')}
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
                          variant="secondary" 
                          className={`${getStatusColor(supplier.status)} flex items-center gap-1 w-fit`}
                        >
                          {getStatusIcon(supplier.status)}
                          {supplier.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {supplier.rating ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {renderStars(supplier.rating)}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {supplier.rating.toFixed(1)}
                            </span>
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
                            onClick={(e) => e.stopPropagation()}
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
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/suppliers/${supplier.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/suppliers/${supplier.id}/catalog`)}>
                              <Store className="h-4 w-4 mr-2" />
                              Voir le catalogue
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                updateSupplier({ 
                                  id: supplier.id, 
                                  updates: { status: supplier.status === 'active' ? 'inactive' : 'active' }
                                })
                              }}
                              disabled={isUpdating}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              {supplier.status === 'active' ? 'Désactiver' : 'Activer'}
                            </DropdownMenuItem>
                            {isSupplierConnected(supplier.id) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDisconnect(supplier.id, supplier.name)}
                                  disabled={isDisconnecting}
                                  className="text-orange-600"
                                >
                                  <Link2Off className="h-4 w-4 mr-2" />
                                  Déconnecter
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
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
    </>
  )
}
