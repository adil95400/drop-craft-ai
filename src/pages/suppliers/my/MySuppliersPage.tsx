import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { useState } from 'react'
import {
  Store, Settings, Eye, RefreshCw, MoreVertical, Unplug, 
  CheckCircle, AlertCircle, Clock, Package, TrendingUp, Search, Plus, ArrowLeft
} from 'lucide-react'

/**
 * MySuppliersPage - Page listant les fournisseurs connectés de l'utilisateur
 * Unifie SuppliersManage.tsx et ManageSuppliers.tsx
 */
export default function MySuppliersPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const { suppliers, stats, isLoading } = useRealSuppliers({ status: 'active' })
  const { disconnectSupplier, isDisconnecting } = useSupplierConnection()

  const connectedSuppliers = suppliers.filter(s => s.status === 'active')

  const filteredSuppliers = connectedSuppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDisconnect = async (supplierId: string, supplierName: string) => {
    if (confirm(`Voulez-vous vraiment déconnecter ${supplierName} ?`)) {
      await disconnectSupplier(supplierId)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Connecté</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Erreur</Badge>
      case 'paused':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En pause</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <Helmet>
        <title>Mes Fournisseurs - ShopOpti</title>
        <meta name="description" content="Gérez vos fournisseurs connectés" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/suppliers')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <Store className="h-10 w-10 text-primary" />
                Mes Fournisseurs
              </h1>
              <p className="text-muted-foreground mt-2">
                Gérez vos fournisseurs connectés et leur configuration
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/suppliers/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
            <Button onClick={() => navigate('/suppliers/marketplace')}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un fournisseur
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fournisseurs Actifs</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Fournisseurs</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Store className="h-12 w-12 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Note Moyenne</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.averageRating.toFixed(1)}</p>
                </div>
                <TrendingUp className="h-12 w-12 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Produits Total</p>
                  <p className="text-3xl font-bold">~</p>
                </div>
                <Package className="h-12 w-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Suppliers List */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Chargement des fournisseurs...</p>
            </CardContent>
          </Card>
        ) : filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Aucun fournisseur trouvé avec ce nom'
                  : 'Aucun fournisseur connecté. Explorez la marketplace pour en ajouter.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => navigate('/suppliers/marketplace')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Explorer la Marketplace
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Store className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{supplier.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(supplier.status)}
                          {supplier.country && (
                            <Badge variant="outline">{supplier.country}</Badge>
                          )}
                          {supplier.rating && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {supplier.rating}/5
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/suppliers/${supplier.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/suppliers/${supplier.id}/catalog`)}>
                          <Package className="h-4 w-4 mr-2" />
                          Voir catalogue
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/suppliers/${supplier.id}/import`)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Importer produits
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/suppliers/settings')}>
                          <Settings className="h-4 w-4 mr-2" />
                          Configurer connecteur
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDisconnect(supplier.id, supplier.name)}
                          className="text-destructive"
                          disabled={isDisconnecting}
                        >
                          <Unplug className="h-4 w-4 mr-2" />
                          Déconnecter
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/suppliers/${supplier.id}/catalog`)}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Catalogue
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/suppliers/${supplier.id}/import`)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Importer
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/suppliers/${supplier.id}/feeds`)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Feeds
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
