import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from 'react-router-dom'
import { useRealSuppliers } from '@/hooks/useRealSuppliers'
import { useSupplierConnection } from '@/hooks/useSupplierConnection'
import { ImportSuppliersDialog } from '@/components/suppliers/ImportSuppliersDialog'
import { SupplierStatsChart } from '@/components/suppliers/SupplierStatsChart'
import { TrendingSuppliers } from '@/components/suppliers/TrendingSuppliers'
import { RecentActivity } from '@/components/suppliers/RecentActivity'
import {
  Store, ShoppingCart, Settings, TrendingUp, Package, Globe, Zap,
  CheckCircle, AlertCircle, Search, Plus, Upload, Download, RefreshCw,
  Eye, Edit, Trash2, Star, MapPin, Filter, BarChart3, Users, Clock, MoreVertical, Link2Off
} from 'lucide-react'

export default function SuppliersHub() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showImportDialog, setShowImportDialog] = useState(false)

  const { suppliers, stats, isLoading, deleteSupplier } = useRealSuppliers({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    country: countryFilter !== 'all' ? countryFilter : undefined,
    search: searchTerm
  })

  const { 
    isSupplierConnected, 
    disconnectSupplier, 
    isDisconnecting 
  } = useSupplierConnection()

  const countries = Array.from(new Set(suppliers.map(s => s.country).filter(Boolean)))
  const recentSuppliers = suppliers.slice(0, 5)

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter
    const matchesCountry = countryFilter === 'all' || supplier.country === countryFilter
    return matchesSearch && matchesStatus && matchesCountry
  })

  const handleDisconnect = async (supplierId: string, supplierName: string) => {
    if (confirm(`Voulez-vous vraiment déconnecter ${supplierName} ?`)) {
      await disconnectSupplier(supplierId)
    }
  }

  return (
    <>
      <Helmet>
        <title>Hub Fournisseurs - ShopOpti</title>
        <meta name="description" content="Centre de gestion complet de vos fournisseurs et catalogues" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Store className="h-10 w-10 text-primary" />
              Hub Fournisseurs
            </h1>
            <p className="text-muted-foreground mt-2">
              Centre de gestion complet de vos fournisseurs et catalogues
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
            <Button variant="outline" onClick={() => {
              const dataStr = JSON.stringify(suppliers, null, 2)
              const dataBlob = new Blob([dataStr], { type: 'application/json' })
              const url = URL.createObjectURL(dataBlob)
              const link = document.createElement('a')
              link.href = url
              link.download = `suppliers-export-${new Date().toISOString().split('T')[0]}.json`
              link.click()
              URL.revokeObjectURL(url)
            }}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button onClick={() => navigate('/products/suppliers/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Fournisseur
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Fournisseurs</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.active} actifs</p>
                </div>
                <Store className="h-12 w-12 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round((stats.active / stats.total) * 100)}% du total
                  </p>
                </div>
                <CheckCircle className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Note Moyenne</p>
                  <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground mt-1">/ 5 étoiles</p>
                </div>
                <TrendingUp className="h-12 w-12 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pays</p>
                  <p className="text-3xl font-bold">{Object.keys(stats.topCountries).length}</p>
                  <p className="text-xs text-muted-foreground mt-1">représentés</p>
                </div>
                <Globe className="h-12 w-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <SupplierStatsChart suppliers={suppliers} />

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
            onClick={() => navigate('/products/suppliers/browse')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-lg bg-primary/10">
                  <ShoppingCart className="h-8 w-8 text-primary" />
                </div>
                <Badge variant="secondary">Marketplace</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-xl font-bold mb-2">Marketplace</h3>
                <p className="text-sm text-muted-foreground">
                  Découvrez et connectez les meilleurs fournisseurs
                </p>
              </div>
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>Milliers de fournisseurs</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span>Connexion en 1 clic</span>
                </div>
              </div>
              <Button className="w-full mt-4">Explorer</Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20"
            onClick={() => navigate('/products/suppliers/manage')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Settings className="h-8 w-8 text-green-600" />
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Gestion</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-xl font-bold mb-2">Gestion Avancée</h3>
                <p className="text-sm text-muted-foreground">
                  Monitoring, analytics et automation
                </p>
              </div>
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span>Analytics temps réel</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span>Règles d'automation</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">Gérer</Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20"
            onClick={() => navigate('/products/suppliers/create')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Plus className="h-8 w-8 text-purple-600" />
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">Nouveau</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-xl font-bold mb-2">Nouveau Fournisseur</h3>
                <p className="text-sm text-muted-foreground">
                  Ajoutez un fournisseur personnalisé
                </p>
              </div>
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span>Import manuel</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span>Analyse automatique</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">Créer</Button>
            </CardContent>
          </Card>
        </div>

        {/* Trending & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendingSuppliers />
          <RecentActivity />
        </div>

        {/* Suppliers List/Grid */}
        <Tabs defaultValue="list" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="list">Liste</TabsTrigger>
              <TabsTrigger value="recent">Récents</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom, pays..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="active">Actifs</SelectItem>
                      <SelectItem value="inactive">Inactifs</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <MapPin className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les pays</SelectItem>
                      {countries.map(country => (
                        <SelectItem key={country} value={country!}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Fournisseurs ({filteredSuppliers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    Chargement...
                  </div>
                ) : filteredSuppliers.length === 0 ? (
                  <div className="text-center py-8">
                    <Store className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground mb-4">Aucun fournisseur</p>
                    <Button onClick={() => navigate('/products/suppliers/browse')}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Explorer le Marketplace
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead>Pays</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuppliers.map((supplier) => (
                        <TableRow 
                          key={supplier.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/products/suppliers/${supplier.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Store className="h-5 w-5 text-primary" />
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
                                    <Globe className="h-3 w-3 inline mr-1" />
                                    Site web
                                  </a>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {supplier.country && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {supplier.country}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {supplier.rating ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span>{supplier.rating.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                              {supplier.status === 'active' ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Actif</>
                              ) : (
                                <><AlertCircle className="h-3 w-3 mr-1" /> Inactif</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => navigate(`/products/suppliers/${supplier.id}`)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigate(`/products/suppliers/${supplier.id}/edit`)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modifier
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
                                    onClick={() => {
                                      if (confirm('Supprimer ce fournisseur ?')) {
                                        deleteSupplier(supplier.id)
                                      }
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Fournisseurs Récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentSuppliers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun fournisseur récent
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentSuppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => navigate(`/products/suppliers/${supplier.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Store className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              <span>{supplier.country || 'Non spécifié'}</span>
                              {supplier.rating && (
                                <>
                                  <span>•</span>
                                  <span>⭐ {supplier.rating}/5</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                          {supplier.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ImportSuppliersDialog open={showImportDialog} onOpenChange={setShowImportDialog} />
      </div>
    </>
  )
}
