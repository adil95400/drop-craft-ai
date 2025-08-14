import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useProductionData } from '@/hooks/useProductionData'
import { RefreshCw, Package, Truck, CheckCircle, Clock, XCircle, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Shipment {
  id: string
  tracking_number: string
  carrier: string
  status: string
  last_sync_at: string
  created_at: string
  orders: {
    id: string
    order_number: string
    total_amount: number
    customers: {
      name: string
      email: string
    }
  }
}

export const ProductionTrackingInterface = () => {
  const { toast } = useToast()
  const { shipmentsData, isLoadingShipments } = useProductionData()
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([])

  useEffect(() => {
    if (shipmentsData) {
      const filtered = shipmentsData.filter(shipment =>
        shipment.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.orders?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.orders?.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredShipments(filtered)
    }
  }, [shipmentsData, searchTerm])

  const handleSyncTracking = async () => {
    setIsUpdating(true)
    
    try {
      const { data, error } = await supabase.functions.invoke('track-sync')

      if (error) throw error

      toast({
        title: "Synchronisation terminée",
        description: `${data.updated} colis mis à jour`
      })

      // Refresh data
      window.location.reload()

    } catch (error) {
      console.error('Sync error:', error)
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de mettre à jour les statuts",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_transit':
        return <Truck className="h-4 w-4 text-blue-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'exception':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Package className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      delivered: "default",
      in_transit: "secondary", 
      pending: "outline",
      exception: "destructive"
    }

    const labels: Record<string, string> = {
      delivered: "Livré",
      in_transit: "En transit",
      pending: "En attente",
      exception: "Problème"
    }

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    )
  }

  const stats = {
    total: shipmentsData?.length || 0,
    delivered: shipmentsData?.filter(s => s.status === 'delivered').length || 0,
    in_transit: shipmentsData?.filter(s => s.status === 'in_transit').length || 0,
    pending: shipmentsData?.filter(s => s.status === 'pending').length || 0,
    exceptions: shipmentsData?.filter(s => s.status === 'exception').length || 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suivi des Colis</h1>
          <p className="text-muted-foreground">
            Suivez vos expéditions en temps réel
          </p>
        </div>
        <Button 
          onClick={handleSyncTracking}
          disabled={isUpdating}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
          Synchroniser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.delivered}</p>
                <p className="text-xs text-muted-foreground">Livrés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.in_transit}</p>
                <p className="text-xs text-muted-foreground">En transit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.exceptions}</p>
                <p className="text-xs text-muted-foreground">Problèmes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro de suivi, commande ou client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expéditions Récentes</CardTitle>
          <CardDescription>
            Liste de vos expéditions avec statut en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingShipments ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Chargement des expéditions...</p>
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune expédition trouvée</p>
              <p className="text-sm">Vos expéditions apparaîtront ici</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro de suivi</TableHead>
                  <TableHead>Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Transporteur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière MàJ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-mono">
                      {shipment.tracking_number || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {shipment.orders?.order_number || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{shipment.orders?.customers?.name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">
                          {shipment.orders?.customers?.email || 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(shipment.orders?.total_amount || 0)}
                    </TableCell>
                    <TableCell>
                      {shipment.carrier || 'Auto'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(shipment.status)}
                        {getStatusBadge(shipment.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {shipment.last_sync_at 
                        ? new Date(shipment.last_sync_at).toLocaleDateString('fr-FR')
                        : 'Jamais'
                      }
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