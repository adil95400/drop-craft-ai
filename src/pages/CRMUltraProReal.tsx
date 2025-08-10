import { useState } from 'react'
import { Users, UserPlus, Mail, Phone, Calendar, TrendingUp, Search, Filter, Download, RefreshCw, Plus, Eye, Edit, MoreHorizontal, AlertCircle, Star } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AppLayout } from '@/layouts/AppLayout'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useRealCustomers } from '@/hooks/useRealCustomers'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { ActionButton } from '@/components/common/ActionButton'
import { useToast } from '@/hooks/use-toast'

export default function CRMUltraProReal() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { 
    customers, 
    stats, 
    isLoading, 
    error,
    addCustomer,
    updateCustomer,
    isAdding,
    isUpdating
  } = useRealCustomers({ 
    search: searchTerm,
    status: statusFilter === 'all' ? undefined : (statusFilter as 'active' | 'inactive')
  })

  if (isLoading) return <LoadingState />
  if (error) return <div>Erreur lors du chargement des clients</div>

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Actif</Badge>
      case 'inactive':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Inactif</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Users className="h-4 w-4 text-emerald-500" />
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleSync = () => {
    toast({
      title: "Synchronisation",
      description: "Synchronisation des clients en cours...",
    })
  }

  const handleExport = () => {
    toast({
      title: "Export",
      description: "Export des données clients en cours...",
    })
  }

  const handleAddCustomer = () => {
    toast({
      title: "Nouveau client",
      description: "Fonctionnalité d'ajout de client à implémenter",
    })
  }

  const handleStatusUpdate = (customerId: string, newStatus: string) => {
    updateCustomer({ id: customerId, updates: { status: newStatus as 'active' | 'inactive' } })
    toast({
      title: "Statut mis à jour",
      description: `Statut du client mis à jour vers ${newStatus}`,
    })
  }

  if (customers.length === 0) {
    return (
      <AppLayout>
        <EmptyState 
          title="Aucun client"
          description="Commencez par ajouter des clients à votre CRM"
          action={{
            label: "Ajouter un client",
            onClick: handleAddCustomer
          }}
        />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">CRM Ultra Pro</h1>
            <p className="text-muted-foreground">Gestion avancée des clients avec données réelles</p>
          </div>
          
          <div className="flex items-center gap-3">
            <ActionButton 
              variant="outline" 
              size="sm"
              onClick={handleSync}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Sync temps réel
            </ActionButton>
            
            <ActionButton 
              variant="outline" 
              size="sm"
              onClick={handleExport}
              icon={<Download className="h-4 w-4" />}
            >
              Export
            </ActionButton>

            <ActionButton 
              size="sm"
              onClick={handleAddCustomer}
              icon={<UserPlus className="h-4 w-4" />}
              loading={isAdding}
            >
              Nouveau client
            </ActionButton>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">{stats.total}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total clients</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-emerald-500" />
                <Badge variant="default">{stats.active}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Clients actifs</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <Badge variant="outline">{formatCurrency(stats.totalRevenue)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Chiffre d'affaires total</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Star className="h-5 w-5 text-yellow-500" />
                <Badge variant="outline">{formatCurrency(stats.averageOrderValue)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue)}</p>
                <p className="text-xs text-muted-foreground">Panier moyen</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des clients */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle>Clients ({customers.length})</CardTitle>
                <CardDescription>Gestion de la base clients</CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher un client..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Commandes</TableHead>
                    <TableHead>Total dépensé</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(customer.status)}
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Client depuis {formatDate(customer.created_at)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{customer.total_orders}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(customer.total_spent)}</TableCell>
                      <TableCell>{getStatusBadge(customer.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <ActionButton 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {}}
                            loading={isUpdating}
                            icon={<Edit className="h-4 w-4" />}
                          >
                            Modifier
                          </ActionButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}