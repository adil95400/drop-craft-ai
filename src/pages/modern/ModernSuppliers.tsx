/**
 * Interface moderne des fournisseurs - Vue marketplace inspirée des concurrents
 * Logo, pays, catégorie, nombre de produits, boutons de connexion
 */
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Globe,
  Package,
  Star,
  TrendingUp,
  Users,
  Activity,
  Plug,
  PlugZap,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useLegacyPlan } from '@/lib/migration-helper'

interface Supplier {
  id: string
  name: string
  logo_url?: string
  country: string
  sector: string
  connection_status: 'connected' | 'disconnected' | 'error' | 'pending'
  product_count: number
  rating: number
  tags: string[]
  description?: string
  website?: string
  created_at: string
  success_rate?: number
}

// Mock data représentative des fournisseurs marketplace modernes
const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'AliExpress Dropshipping',
    logo_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=64&h=64&fit=crop&crop=center',
    country: 'Chine',
    sector: 'Multi-catégories',
    connection_status: 'connected',
    product_count: 2500000,
    rating: 4.2,
    tags: ['API', 'Dropshipping', 'Global'],
    description: 'Plateforme mondiale de dropshipping avec millions de produits',
    website: 'aliexpress.com',
    created_at: '2024-01-15T10:00:00Z',
    success_rate: 95
  },
  {
    id: '2', 
    name: 'Spocket EU',
    logo_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=64&h=64&fit=crop&crop=center',
    country: 'Union Européenne',
    sector: 'Mode & Lifestyle',
    connection_status: 'connected',
    product_count: 150000,
    rating: 4.8,
    tags: ['API', 'EU Shipping', 'Premium'],
    description: 'Fournisseurs européens et américains de qualité premium',
    website: 'spocket.co',
    created_at: '2024-02-01T14:30:00Z',
    success_rate: 98
  },
  {
    id: '3',
    name: 'Printful',
    logo_url: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?w=64&h=64&fit=crop&crop=center',
    country: 'Lettonie',
    sector: 'Print on Demand',
    connection_status: 'pending',
    product_count: 320,
    rating: 4.7,
    tags: ['POD', 'Custom', 'Fulfillment'],
    description: 'Impression à la demande et fulfillment automatique',
    website: 'printful.com',
    created_at: '2024-03-10T09:15:00Z',
    success_rate: 96
  },
  {
    id: '4',
    name: 'Modalyst Fashion',
    logo_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=64&h=64&fit=crop&crop=center',
    country: 'États-Unis',
    sector: 'Mode',
    connection_status: 'connected',
    product_count: 75000,
    rating: 4.5,
    tags: ['Fashion', 'US/EU', 'Curated'],
    description: 'Marques de mode premium sélectionnées avec soin',
    website: 'modalyst.co',
    created_at: '2024-01-20T16:45:00Z',
    success_rate: 94
  },
  {
    id: '5',
    name: 'Doba Wholesale',
    logo_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=64&h=64&fit=crop&crop=center',
    country: 'États-Unis',
    sector: 'Électronique',
    connection_status: 'disconnected',
    product_count: 180000,
    rating: 4.1,
    tags: ['Electronics', 'Wholesale', 'B2B'],
    description: 'Grossiste électronique avec catalogue étendu',
    website: 'doba.com',
    created_at: '2023-12-15T11:20:00Z',
    success_rate: 89
  },
  {
    id: '6',
    name: 'CJDropshipping',
    logo_url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=64&h=64&fit=crop&crop=center',
    country: 'Chine',
    sector: 'Maison & Jardin',
    connection_status: 'error',
    product_count: 400000,
    rating: 4.0,
    tags: ['Home', 'Garden', 'Warehousing'],
    description: 'Solution complète dropshipping avec entrepôts mondiaux',
    website: 'cjdropshipping.com',
    created_at: '2024-02-28T13:00:00Z',
    success_rate: 87
  }
]

export default function ModernSuppliers() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { isPro, isUltraPro } = useLegacyPlan()
  
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sectorFilter, setSectorFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.sector.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSector = sectorFilter === 'all' || supplier.sector === sectorFilter
    const matchesStatus = statusFilter === 'all' || supplier.connection_status === statusFilter
    
    return matchesSearch && matchesSector && matchesStatus
  })

  const getStatusConfig = (status: string) => {
    const configs = {
      connected: { 
        icon: <CheckCircle className="h-4 w-4" />, 
        label: 'Connecté', 
        color: 'bg-green-100 text-green-800',
        action: 'Déconnecter'
      },
      disconnected: { 
        icon: <Plug className="h-4 w-4" />, 
        label: 'Déconnecté', 
        color: 'bg-gray-100 text-gray-800',
        action: 'Connecter'
      },
      pending: { 
        icon: <Clock className="h-4 w-4" />, 
        label: 'En cours', 
        color: 'bg-yellow-100 text-yellow-800',
        action: 'Configurer'
      },
      error: { 
        icon: <AlertCircle className="h-4 w-4" />, 
        label: 'Erreur', 
        color: 'bg-red-100 text-red-800',
        action: 'Réparer'
      }
    }
    return configs[status as keyof typeof configs] || configs.disconnected
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  const handleConnect = async (supplier: Supplier) => {
    setLoading(true)
    
    // Simulation d'une connexion
    setTimeout(() => {
      setSuppliers(prev => prev.map(s => 
        s.id === supplier.id 
          ? { ...s, connection_status: s.connection_status === 'connected' ? 'disconnected' : 'connected' as const }
          : s
      ))
      
      toast({
        title: "Succès",
        description: `Fournisseur ${supplier.connection_status === 'connected' ? 'déconnecté' : 'connecté'} avec succès`,
      })
      setLoading(false)
    }, 2000)
  }

  // Statistics
  const stats = {
    total: suppliers.length,
    connected: suppliers.filter(s => s.connection_status === 'connected').length,
    totalProducts: suppliers.filter(s => s.connection_status === 'connected')
                           .reduce((sum, s) => sum + s.product_count, 0),
    avgRating: suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length
  }

  const sectors = Array.from(new Set(suppliers.map(s => s.sector)))

  return (
    <div className="space-y-6 p-6">
      {/* Header moderne */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace Fournisseurs</h1>
          <p className="text-muted-foreground">
            Découvrez et connectez-vous à {stats.total} fournisseurs vérifiés
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isUltraPro && (
            <Button variant="outline" size="sm">
              <Activity className="mr-2 h-4 w-4" />
              Synchroniser tout
            </Button>
          )}
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter fournisseur
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fournisseurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.connected} connectés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Disponibles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Fournisseurs actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
            <div className="flex items-center gap-1">
              {renderStars(stats.avgRating)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Connexion</CardTitle>
            <PlugZap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.connected / stats.total) * 100)}%
            </div>
            <Progress value={(stats.connected / stats.total) * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Secteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous secteurs</SelectItem>
                {sectors.map(sector => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="connected">Connectés</SelectItem>
                <SelectItem value="disconnected">Déconnectés</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid de fournisseurs - Style marketplace moderne */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSuppliers.map((supplier) => {
          const statusConfig = getStatusConfig(supplier.connection_status)
          
          return (
            <Card key={supplier.id} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
              {/* Badge de statut en overlay */}
              <div className="absolute top-4 right-4 z-10">
                <Badge className={`${statusConfig.color} flex items-center gap-1`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </Badge>
              </div>

              <CardHeader className="pb-4">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16 rounded-xl border">
                    <AvatarImage 
                      src={supplier.logo_url} 
                      alt={supplier.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                      {supplier.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div>
                      <CardTitle className="text-lg leading-none">{supplier.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-0.5">
                          {renderStars(supplier.rating)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {supplier.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Informations clés */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier.country}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{supplier.sector}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {supplier.product_count.toLocaleString()} produits
                    </span>
                  </div>
                  
                  {supplier.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-blue-600 hover:underline cursor-pointer">
                        {supplier.website}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {supplier.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Description */}
                {supplier.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {supplier.description}
                  </p>
                )}

                {/* Métriques de performance (Pro/Ultra Pro) */}
                {isPro && supplier.success_rate && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Taux de succès</span>
                      <span className="font-medium">{supplier.success_rate}%</span>
                    </div>
                    <Progress value={supplier.success_rate} className="h-1.5 mt-1" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedSupplier(supplier)}
                      >
                        Détails
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                  
                  <Button 
                    size="sm" 
                    className="flex-1"
                    variant={supplier.connection_status === 'connected' ? 'secondary' : 'default'}
                    onClick={() => handleConnect(supplier)}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      statusConfig.icon
                    )}
                    {statusConfig.action}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dialog détails fournisseur */}
      {selectedSupplier && (
        <Dialog open={!!selectedSupplier} onOpenChange={() => setSelectedSupplier(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-xl">
                  <AvatarImage src={selectedSupplier.logo_url} />
                  <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {selectedSupplier.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div>{selectedSupplier.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(selectedSupplier.rating)}
                    <span className="text-sm text-muted-foreground ml-1">
                      {selectedSupplier.rating.toFixed(1)}/5
                    </span>
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription>
                Informations détaillées du fournisseur
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Informations générales</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Pays:</span>
                      <span className="font-medium">{selectedSupplier.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Secteur:</span>
                      <span className="font-medium">{selectedSupplier.sector}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Produits:</span>
                      <span className="font-medium">{selectedSupplier.product_count.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Site web:</span>
                      <span className="font-medium text-blue-600">{selectedSupplier.website}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Statut:</span>
                      {getStatusConfig(selectedSupplier.connection_status).label}
                    </div>
                    {isPro && selectedSupplier.success_rate && (
                      <div className="flex justify-between">
                        <span>Taux de succès:</span>
                        <span className="font-medium">{selectedSupplier.success_rate}%</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Membre depuis:</span>
                      <span className="font-medium">
                        {new Date(selectedSupplier.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedSupplier.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedSupplier.description}
                  </p>
                </div>
              )}
              
              <div>
                <h4 className="font-medium mb-2">Spécialités</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedSupplier.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {filteredSuppliers.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun fournisseur trouvé</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}