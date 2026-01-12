import { useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
import { Users, UserPlus, Mail, Phone, TrendingUp, Search, Target, Activity, Calendar, PhoneCall, MessageSquare, Star, BarChart3, Crown, Zap, Bell, Filter, Download, Eye, Edit, Trash2, MoreHorizontal, ArrowUp, ArrowDown, CheckCircle2, XCircle, Clock, DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

import { useCustomersUnified } from '@/hooks/unified'
import { LeadsManager } from '@/components/crm/LeadsManager'
import { SalesPipeline } from '@/components/crm/SalesPipeline'
import { Link } from 'react-router-dom'

export default function CRM() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [segmentFilter, setSegmentFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const { customers, stats, add: addCustomer, isLoading } = useCustomersUnified()

  const filteredCustomers = customers.filter(customer => {
    const customerName = customer.name
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
    
    let matchesSegment = true
    if (segmentFilter !== 'all') {
      const totalSpent = customer.total_spent || 0
      switch (segmentFilter) {
        case 'vip':
          matchesSegment = totalSpent > 5000
          break
        case 'premium':
          matchesSegment = totalSpent > 1000 && totalSpent <= 5000
          break
        case 'regular':
          matchesSegment = totalSpent > 100 && totalSpent <= 1000
          break
        case 'new':
          matchesSegment = totalSpent <= 100
          break
      }
    }
    
    return matchesSearch && matchesStatus && matchesSegment
  }).sort((a, b) => {
    const aValue = sortField === 'name' ? a.name : a[sortField as keyof typeof a]
    const bValue = sortField === 'name' ? b.name : b[sortField as keyof typeof b]
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleAddCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const customerData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || '',
      status: 'active' as const,
      total_orders: 0,
      total_spent: 0,
      address: {
        street: formData.get('street') as string,
        city: formData.get('city') as string,
        postalCode: formData.get('postal_code') as string,
        country: formData.get('country') as string,
      },
      user_id: 'current-user-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    addCustomer(customerData)
    setIsAddDialogOpen(false)
    e.currentTarget.reset()
  }

  const getCustomerSegment = (totalSpent: number) => {
    if (totalSpent > 5000) return { label: 'VIP', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' }
    if (totalSpent > 1000) return { label: 'Premium', color: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' }
    if (totalSpent > 100) return { label: 'Régulier', color: 'bg-green-500 text-white' }
    return { label: 'Nouveau', color: 'bg-gray-500 text-white' }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const toggleAllCustomers = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement des données CRM...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            CRM - Gestion Clients
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos relations clients avec intelligence artificielle et analyses avancées
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            toast({
              title: "Analytics Avancées",
              description: "Ouverture du module d'analytics avancées...",
            });
          }}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics Avancées
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            toast({
              title: "Segmentation IA",
              description: "Ouverture de l'outil de segmentation IA...",
            });
          }}>
            <Target className="w-4 h-4 mr-2" />
            Segmentation IA
          </Button>
          <Link to="/crm-ultra-pro">
            <Button 
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              CRM Ultra Pro
            </Button>
          </Link>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <UserPlus className="w-4 h-4 mr-2" />
                Nouveau Client
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter un Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" name="phone" type="tel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street">Adresse</Label>
                <Input id="street" name="street" placeholder="Rue" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input id="city" name="city" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input id="postal_code" name="postal_code" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input id="country" name="country" defaultValue="France" />
              </div>
              <Button type="submit" className="w-full">
                Ajouter le Client
              </Button>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue?.toLocaleString('fr-FR') || 0}€</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgOrderValue?.toFixed(0) || 0}€</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Clients</CardTitle>
          <CardDescription>
            {filteredCustomers.length} clients trouvés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Commandes</TableHead>
                <TableHead>Total Dépensé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière Activité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {customer.name?.charAt(0).toUpperCase() || customer.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{customer.name || customer.email}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {customer.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        <span>{customer.email}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{customer.total_orders || 0}</div>
                      <div className="text-xs text-muted-foreground">commandes</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {customer.total_spent?.toLocaleString('fr-FR') || 0}€
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={customer.status === 'active' ? 'default' : 'secondary'}
                    >
                      {customer.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(customer.created_at || '').toLocaleDateString('fr-FR')}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucun client trouvé avec ces filtres'
                  : 'Aucun client pour le moment'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}