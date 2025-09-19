import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Search, Plus, Eye, Edit, Trash2, 
  Truck, Star, Globe, Phone, Mail,
  Package, DollarSign, TrendingUp,
  AlertTriangle, CheckCircle, Clock,
  Crown, Zap, Shield
} from 'lucide-react'

interface Supplier {
  id: string
  name: string
  country: string
  email: string
  phone?: string
  website?: string
  status: 'active' | 'inactive' | 'pending'
  tier: 'standard' | 'premium' | 'pro'
  productsCount: number
  averageRating: number
  responseTime: string
  reliabilityScore: number
  shippingMethods: string[]
  paymentTerms: string
  lastOrder: string
  totalOrders: number
  averageDeliveryTime: number
}

export function SupplierManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')

  // Mock data - replace with real data
  const suppliers: Supplier[] = [
    {
      id: '1',
      name: 'Global Electronics Ltd',
      country: 'Chine',
      email: 'contact@globalelectronics.com',
      phone: '+86 123 456 789',
      website: 'https://globalelectronics.com',
      status: 'active',
      tier: 'pro',
      productsCount: 1250,
      averageRating: 4.8,
      responseTime: '2h',
      reliabilityScore: 98,
      shippingMethods: ['Express', 'Standard', 'Economy'],
      paymentTerms: '30 jours',
      lastOrder: '2024-01-15',
      totalOrders: 45,
      averageDeliveryTime: 7
    },
    {
      id: '2',
      name: 'Fashion Forward Co',
      country: 'Italie',
      email: 'orders@fashionforward.it',
      status: 'active',
      tier: 'premium',
      productsCount: 850,
      averageRating: 4.6,
      responseTime: '4h',
      reliabilityScore: 94,
      shippingMethods: ['Express', 'Standard'],
      paymentTerms: '15 jours',
      lastOrder: '2024-01-12',
      totalOrders: 32,
      averageDeliveryTime: 5
    },
    {
      id: '3',
      name: 'Home & Garden Supplies',
      country: 'Allemagne',
      email: 'info@homegardens.de',
      status: 'active',
      tier: 'standard',
      productsCount: 420,
      averageRating: 4.2,
      responseTime: '8h',
      reliabilityScore: 87,
      shippingMethods: ['Standard'],
      paymentTerms: '45 jours',
      lastOrder: '2024-01-10',
      totalOrders: 18,
      averageDeliveryTime: 10
    }
  ]

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCountry = countryFilter === 'all' || supplier.country === countryFilter
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter
    const matchesTier = tierFilter === 'all' || supplier.tier === tierFilter
    
    return matchesSearch && matchesCountry && matchesStatus && matchesTier
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Actif</Badge>
      case 'inactive':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Inactif</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'pro':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Crown className="h-3 w-3 mr-1" />Pro</Badge>
      case 'premium':
        return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"><Zap className="h-3 w-3 mr-1" />Premium</Badge>
      case 'standard':
        return <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Standard</Badge>
      default:
        return <Badge variant="outline">{tier}</Badge>
    }
  }

  const supplierStats = [
    {
      title: 'Fournisseurs actifs',
      value: suppliers.filter(s => s.status === 'active').length.toString(),
      icon: Truck,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Fournisseurs Pro',
      value: suppliers.filter(s => s.tier === 'pro').length.toString(),
      icon: Crown,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    },
    {
      title: 'Note moyenne',
      value: (suppliers.reduce((sum, s) => sum + s.averageRating, 0) / suppliers.length).toFixed(1),
      icon: Star,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100'
    },
    {
      title: 'Délai moyen',
      value: Math.round(suppliers.reduce((sum, s) => sum + s.averageDeliveryTime, 0) / suppliers.length) + 'j',
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    }
  ]

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Fournisseurs</h1>
          <p className="text-muted-foreground">
            Gérez vos partenaires et sources d'approvisionnement
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau fournisseur
        </Button>
      </div>

      <Tabs defaultValue="suppliers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="pro-features">Fonctionnalités Pro</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="integration">Intégrations</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {supplierStats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="flex items-center p-6">
                  <div className={`p-3 rounded-full ${stat.bg} mr-4`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher des fournisseurs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les pays</SelectItem>
                    <SelectItem value="Chine">Chine</SelectItem>
                    <SelectItem value="Italie">Italie</SelectItem>
                    <SelectItem value="Allemagne">Allemagne</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous niveaux</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Suppliers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Fournisseurs ({filteredSuppliers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Produits</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Fiabilité</TableHead>
                    <TableHead>Délai réponse</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            {supplier.country}
                            {supplier.website && (
                              <>
                                <span>•</span>
                                <a href={supplier.website} className="hover:underline">
                                  Site web
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTierBadge(supplier.tier)}</TableCell>
                      <TableCell>{supplier.productsCount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {supplier.averageRating}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${supplier.reliabilityScore}%` }}
                            />
                          </div>
                          <span className="text-sm">{supplier.reliabilityScore}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{supplier.responseTime}</TableCell>
                      <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pro-features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Fonctionnalités Pro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                  <CardContent className="p-4">
                    <Zap className="h-8 w-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold mb-2">Synchronisation automatique</h3>
                    <p className="text-sm text-muted-foreground">
                      Synchronisation en temps réel des stocks et prix
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <CardContent className="p-4">
                    <TrendingUp className="h-8 w-8 text-amber-600 mb-2" />
                    <h3 className="font-semibold mb-2">Analytics avancées</h3>
                    <p className="text-sm text-muted-foreground">
                      Rapports détaillés de performance
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-4">
                    <Shield className="h-8 w-8 text-green-600 mb-2" />
                    <h3 className="font-semibold mb-2">Support prioritaire</h3>
                    <p className="text-sm text-muted-foreground">
                      Assistance dédiée 24/7
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance des Fournisseurs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Analyses de performance et métriques de qualité
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration">
          <Card>
            <CardHeader>
              <CardTitle>Intégrations API</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Connectez vos fournisseurs via API
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}