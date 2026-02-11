/**
 * MySuppliersPage - Mes Fournisseurs Connectés
 * Style Channable avec Hero Section et Stats
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
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
import { useSuppliersUnified } from '@/hooks/unified'
import { useSupplierConnection } from '@/hooks/useSupplierConnection'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Store, Settings, Eye, RefreshCw, MoreVertical, Unplug, 
  CheckCircle, AlertCircle, Clock, Package, TrendingUp, Search, Plus,
  Star, Zap
} from 'lucide-react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

export default function MySuppliersPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const { suppliers, isLoading } = useSuppliersUnified({ status: 'active' })
  const { disconnectSupplier, isDisconnecting } = useSupplierConnection()

  const connectedSuppliers = suppliers.filter(s => s.status === 'active')

  const filteredSuppliers = connectedSuppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const [disconnectTarget, setDisconnectTarget] = useState<{id: string, name: string} | null>(null)

  const handleDisconnect = async (supplierId: string, supplierName: string) => {
    setDisconnectTarget({ id: supplierId, name: supplierName })
  }

  const confirmDisconnect = async () => {
    if (!disconnectTarget) return
    await disconnectSupplier(disconnectTarget.id)
    setDisconnectTarget(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Connecté</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Erreur</Badge>
      case 'paused':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En pause</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <ChannablePageWrapper
      title="Mes Fournisseurs"
      subtitle="Gérez vos fournisseurs connectés"
      description="Synchronisez, importez et configurez vos fournisseurs en temps réel."
      heroImage="suppliers"
      badge={{ label: "Connectés", icon: Store }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/suppliers/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
          <Button onClick={() => navigate('/suppliers/catalog')}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un fournisseur
          </Button>
        </div>
      }
    >
      {/* Search */}
      <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-white/20">
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
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Chargement des fournisseurs...</p>
          </CardContent>
        </Card>
      ) : filteredSuppliers.length === 0 ? (
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Aucun fournisseur trouvé avec ce nom'
                : 'Aucun fournisseur connecté. Explorez le hub pour en ajouter.'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/suppliers/catalog')}>
                <Plus className="h-4 w-4 mr-2" />
                Explorer le Catalogue
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSuppliers.map((supplier, index) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-all backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
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
                              <Star className="h-3 w-3 text-yellow-500" />
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
                      className="w-full hover:bg-primary/5"
                      onClick={() => navigate(`/suppliers/${supplier.id}/catalog`)}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Catalogue
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full hover:bg-primary/5"
                      onClick={() => navigate(`/suppliers/${supplier.id}/import`)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Importer
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full hover:bg-primary/5"
                      onClick={() => navigate(`/suppliers/${supplier.id}/feeds`)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Feeds
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!disconnectTarget}
        onOpenChange={(open) => { if (!open) setDisconnectTarget(null) }}
        title={`Déconnecter ${disconnectTarget?.name} ?`}
        description="Le fournisseur sera déconnecté de votre compte."
        confirmText="Déconnecter"
        variant="destructive"
        onConfirm={confirmDisconnect}
      />
    </ChannablePageWrapper>
  )
}
