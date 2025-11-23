import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRealSuppliers } from '@/hooks/useRealSuppliers'
import { ImportSuppliersDialog } from '@/components/suppliers/ImportSuppliersDialog'
import { 
  Search, 
  Plus, 
  Building2, 
  Package, 
  TrendingUp, 
  Eye,
  Edit,
  Trash2,
  Star,
  MapPin,
  Globe,
  Filter,
  Download,
  RefreshCw,
  Upload
} from 'lucide-react'

export default function SuppliersPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [showImportDialog, setShowImportDialog] = useState(false)
  
  const { suppliers, stats, isLoading, deleteSupplier } = useRealSuppliers({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    country: countryFilter !== 'all' ? countryFilter : undefined,
    search: searchQuery
  })

  const countries = Array.from(new Set(suppliers.map(s => s.country).filter(Boolean)))

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Helmet>
        <title>Fournisseurs - ShopOpti</title>
        <meta name="description" content="Gérez votre réseau de fournisseurs" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fournisseurs</h1>
            <p className="text-muted-foreground">
              Gérez et optimisez votre réseau de fournisseurs
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importer Fournisseurs
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Synchroniser
            </Button>
            <Button onClick={() => navigate('/suppliers/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Fournisseur
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/suppliers')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-green-600">+{Math.round((stats.total / 100) * 8)}% ce mois</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setStatusFilter('active')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actifs</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((stats.active / stats.total) * 100)}% du total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Note moyenne</p>
                  <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                  <p className="text-xs text-green-600">+0.3 ce mois</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Globe className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pays</p>
                  <p className="text-2xl font-bold">
                    {Object.keys(stats.topCountries).length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Object.keys(stats.topCountries).slice(0, 2).join(', ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Liste des fournisseurs</CardTitle>
                <CardDescription>
                  {filteredSuppliers.length} fournisseur{filteredSuppliers.length > 1 ? 's' : ''} trouvé{filteredSuppliers.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, pays..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[180px]">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country} value={country || ''}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Chargement des fournisseurs...</p>
              </div>
            ) : filteredSuppliers?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Aucun fournisseur trouvé</p>
                <p className="text-sm mb-4">Commencez par ajouter votre premier fournisseur</p>
                <Button onClick={() => navigate('/suppliers/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un fournisseur
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers?.map((supplier) => (
                    <TableRow 
                      key={supplier.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/suppliers/${supplier.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            {supplier.website && (
                              <a 
                                href={supplier.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Globe className="w-3 h-3 inline mr-1" />
                                Site web
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-muted-foreground">
                            {supplier.contact_email_masked || 'Non renseigné'}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {supplier.contact_phone_masked || ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span>{supplier.country || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">
                            {supplier.rating?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={supplier.status === 'active' ? 'default' : 'secondary'}
                        >
                          {supplier.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/suppliers/${supplier.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/suppliers/${supplier.id}/edit`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
                                deleteSupplier(supplier.id)
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <ImportSuppliersDialog 
          open={showImportDialog} 
          onOpenChange={setShowImportDialog}
        />
      </div>
    </>
  )
}
