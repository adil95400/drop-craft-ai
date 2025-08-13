import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useProductionData } from '@/hooks/useProductionData'
import { Users, User, Euro, ShoppingBag, Search, Eye, Calendar, MapPin } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  email: string
  total_spent: number
  total_orders: number
  address: any
  status: string
  created_at: string
}

interface CustomerOrder {
  id: string
  order_number: string
  total_amount: number
  status: string
  created_at: string
}

export const ProductionCRMInterface = () => {
  const { customersData, ordersData, isLoadingCustomers, isLoadingOrders } = useProductionData()
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([])

  useEffect(() => {
    if (customersData) {
      const filtered = customersData.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCustomers(filtered)
    }
  }, [customersData, searchTerm])

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    // Filter orders for this customer
    const orders = ordersData?.filter(order => order.customer_id === customer.id) || []
    setCustomerOrders(orders)
  }

  const stats = {
    total: customersData?.length || 0,
    active: customersData?.filter(c => c.status === 'active').length || 0,
    totalSpent: customersData?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0,
    avgOrderValue: customersData?.length > 0 
      ? (customersData.reduce((sum, c) => sum + (c.total_spent || 0), 0) / customersData.length)
      : 0
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      inactive: "secondary",
      blocked: "destructive"
    }

    return (
      <Badge variant={variants[status] || "outline"}>
        {status === 'active' ? 'Actif' : status === 'inactive' ? 'Inactif' : 'Bloqué'}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM Production</h1>
          <p className="text-muted-foreground">
            Gérez vos clients et leurs commandes
          </p>
        </div>
        <Button className="gap-2">
          <User className="h-4 w-4" />
          Nouveau client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Clients actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</p>
                <p className="text-xs text-muted-foreground">CA total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue)}</p>
                <p className="text-xs text-muted-foreground">Panier moyen</p>
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
              placeholder="Rechercher un client par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Clients</CardTitle>
          <CardDescription>
            Gérez vos clients et consultez leurs informations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCustomers ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 animate-pulse mx-auto mb-4" />
              <p>Chargement des clients...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun client trouvé</p>
              <p className="text-sm">Vos clients apparaîtront ici</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Total dépensé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Membre depuis</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium">{customer.name}</div>
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        {customer.total_orders || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(customer.total_spent || 0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(customer.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(customer.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewCustomer(customer)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Voir
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Détails du client</DialogTitle>
                            <DialogDescription>
                              Informations complètes et historique des commandes
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedCustomer && (
                            <div className="space-y-6">
                              {/* Customer Info */}
                              <div className="grid grid-cols-2 gap-4">
                                <Card>
                                  <CardContent className="p-4">
                                    <h4 className="font-medium mb-2">Informations</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><strong>Nom:</strong> {selectedCustomer.name}</p>
                                      <p><strong>Email:</strong> {selectedCustomer.email}</p>
                                      <p><strong>Statut:</strong> {getStatusBadge(selectedCustomer.status)}</p>
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                <Card>
                                  <CardContent className="p-4">
                                    <h4 className="font-medium mb-2">Statistiques</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><strong>Commandes:</strong> {selectedCustomer.total_orders || 0}</p>
                                      <p><strong>Total dépensé:</strong> {formatCurrency(selectedCustomer.total_spent || 0)}</p>
                                      <p><strong>Panier moyen:</strong> {formatCurrency((selectedCustomer.total_spent || 0) / Math.max(selectedCustomer.total_orders || 1, 1))}</p>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Recent Orders */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Commandes récentes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  {customerOrders.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">
                                      Aucune commande
                                    </p>
                                  ) : (
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Numéro</TableHead>
                                          <TableHead>Montant</TableHead>
                                          <TableHead>Statut</TableHead>
                                          <TableHead>Date</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {customerOrders.slice(0, 5).map((order) => (
                                          <TableRow key={order.id}>
                                            <TableCell className="font-mono">
                                              {order.order_number}
                                            </TableCell>
                                            <TableCell>
                                              {formatCurrency(order.total_amount)}
                                            </TableCell>
                                            <TableCell>
                                              <Badge variant="outline">
                                                {order.status}
                                              </Badge>
                                            </TableCell>
                                            <TableCell>
                                              {new Date(order.created_at).toLocaleDateString('fr-FR')}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
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