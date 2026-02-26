/**
 * Page Clients - Design Channable Premium
 * Synchronisation temps réel avec les boutiques connectées
 * Détection automatique des boutiques avec toggle activer/désactiver
 */

import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Users, 
  Search, 
  UserPlus, 
  Eye, 
  Mail, 
  DollarSign, 
  ShoppingCart, 
  RefreshCw, 
  Download, 
  Sparkles, 
  Store, 
  Crown,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ShopifyCustomerImportDialog } from '@/components/customers/import/ShopifyCustomerImportDialog'
import { ConnectedStoresPanel } from '@/components/customers/ConnectedStoresPanel'
import { CustomerStatsCard } from '@/components/customers/CustomerStatsCard'
import { CustomerImportMenu } from '@/components/customers/CustomerImportMenu'
import { AddCustomerModal } from '@/components/customers/AddCustomerModal'
import { useIntegrationsUnified } from '@/hooks/unified/useIntegrationsUnified'

// Segment config
const segmentConfig = {
  vip: { label: 'VIP', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30', icon: Crown },
  regular: { label: 'Régulier', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: UserCheck },
  new: { label: 'Nouveau', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: Sparkles },
  inactive: { label: 'Inactif', color: 'bg-muted text-muted-foreground border-muted-foreground/20', icon: Clock },
}

export default function CustomersPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { connectedIntegrations } = useIntegrationsUnified()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Fetch customers with real data
  const { data: customers, isLoading, refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      
      // Enrich with segments
      return (data || []).map(customer => {
        const totalSpent = customer.total_spent || 0
        const totalOrders = customer.total_orders || 0
        
        let segment: keyof typeof segmentConfig = 'inactive'
        if (totalSpent > 1000) segment = 'vip'
        else if (totalSpent >= 100 && totalSpent <= 1000) segment = 'regular'
        else if (totalOrders > 0 && totalOrders < 3) segment = 'new'
        
        return { ...customer, segment }
      })
    },
  })

  const getCustomerName = (customer: any) => 
    `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email

  // Filter customers
  const filteredCustomers = useMemo(() => {
    let result = customers || []
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (customer) =>
          customer.email?.toLowerCase().includes(query) ||
          getCustomerName(customer).toLowerCase().includes(query) ||
          customer.phone?.toLowerCase().includes(query)
      )
    }
    
    // Apply segment filter
    if (activeTab !== 'all') {
      result = result.filter(customer => customer.segment === activeTab)
    }
    
    return result
  }, [customers, searchQuery, activeTab])

  // Stats calculations
  const stats = useMemo(() => {
    const allCustomers = customers || []
    const totalCustomers = allCustomers.length
    const activeCustomers = allCustomers.filter(c => (c.total_orders || 0) > 0).length
    const vipCustomers = allCustomers.filter(c => c.segment === 'vip').length
    const newCustomers = allCustomers.filter(c => c.segment === 'new').length
    const totalRevenue = allCustomers.reduce((sum, c) => sum + (c.total_spent || 0), 0)
    const avgOrderValue = totalCustomers > 0 ? totalRevenue / Math.max(1, activeCustomers) : 0
    
    // Calculate growth (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentCustomers = allCustomers.filter(c => new Date(c.created_at) >= thirtyDaysAgo)
    const growth = totalCustomers > 0 ? Math.round((recentCustomers.length / totalCustomers) * 100) : 0
    
    return { totalCustomers, activeCustomers, vipCustomers, newCustomers, totalRevenue, avgOrderValue, growth }
  }, [customers])

  const handleRefresh = () => {
    refetch()
    queryClient.invalidateQueries({ queryKey: ['customers'] })
    toast({ title: 'Clients actualisés' })
  }

  const handleExport = () => {
    if (!customers?.length) {
      toast({ title: 'Aucun client à exporter', variant: 'destructive' })
      return
    }
    const csvContent = [
      ['Nom', 'Email', 'Téléphone', 'Commandes', 'Dépensé', 'Segment'].join(','),
      ...customers.map(c => [
        getCustomerName(c), 
        c.email, 
        c.phone || '', 
        c.total_orders || 0, 
        c.total_spent || 0,
        c.segment
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `clients_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast({ title: `${customers.length} clients exportés` })
  }

  const hasConnectedStores = connectedIntegrations.length > 0

  return (
    <ChannablePageWrapper
      title="Gestion Clients"
      subtitle="CRM Intégré"
      description="Gérez votre base clients, analysez leur comportement d'achat et synchronisez avec vos boutiques en temps réel."
      heroImage="marketing"
      badge={{
        label: `${stats.totalCustomers} clients`,
        icon: Users
      }}
      actions={
        <div className="flex flex-wrap gap-2">
          <CustomerImportMenu 
            onImportFromShopify={() => setShowImportDialog(true)}
            onImportFromCSV={() => toast({ title: 'Import CSV', description: 'Fonctionnalité à venir' })}
            onManualImport={() => setShowAddDialog(true)}
          />
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          >
            <UserPlus className="h-4 w-4" />
            Nouveau client
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="gap-2 backdrop-blur-sm bg-background/50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="gap-2 backdrop-blur-sm bg-background/50"
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      }
    >
      {/* Connected Stores Panel - Auto-detection with toggle */}
      <ConnectedStoresPanel onImportComplete={() => refetch()} autoSync />

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <CustomerStatsCard 
          icon={Users} 
          label="Total Clients" 
          value={stats.totalCustomers.toLocaleString()} 
          trend={stats.growth}
          color="primary"
          delay={0}
        />
        <CustomerStatsCard 
          icon={UserCheck} 
          label="Clients Actifs" 
          value={stats.activeCustomers.toLocaleString()} 
          subtitle="avec commandes"
          color="success"
          delay={0.05}
        />
        <CustomerStatsCard 
          icon={Crown} 
          label="Clients VIP" 
          value={stats.vipCustomers.toLocaleString()} 
          subtitle="+1000€ dépensés"
          color="purple"
          delay={0.1}
        />
        <CustomerStatsCard 
          icon={DollarSign} 
          label="Revenus Total" 
          value={`${stats.totalRevenue.toFixed(0)} €`} 
          subtitle="lifetime value"
          color="info"
          delay={0.15}
        />
        <CustomerStatsCard 
          icon={ShoppingCart} 
          label="Panier Moyen" 
          value={`${stats.avgOrderValue.toFixed(0)} €`} 
          subtitle="par client actif"
          color="warning"
          delay={0.2}
        />
      </div>

      {/* Filters & Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative w-full md:w-auto md:min-w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email ou téléphone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-0 bg-muted/50 focus-visible:ring-1"
                />
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                <TabsList className="grid grid-cols-5 w-full md:w-auto">
                  <TabsTrigger value="all" className="gap-1 text-xs">
                    <Users className="h-3.5 w-3.5" />
                    Tous
                  </TabsTrigger>
                  <TabsTrigger value="vip" className="gap-1 text-xs">
                    <Crown className="h-3.5 w-3.5" />
                    VIP
                  </TabsTrigger>
                  <TabsTrigger value="regular" className="gap-1 text-xs">
                    <UserCheck className="h-3.5 w-3.5" />
                    Réguliers
                  </TabsTrigger>
                  <TabsTrigger value="new" className="gap-1 text-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    Nouveaux
                  </TabsTrigger>
                  <TabsTrigger value="inactive" className="gap-1 text-xs">
                    <UserX className="h-3.5 w-3.5" />
                    Inactifs
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Customers Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {filteredCustomers.length} client(s)
                {activeTab !== 'all' && (
                  <Badge variant="secondary" className="ml-2">
                    {segmentConfig[activeTab as keyof typeof segmentConfig]?.label}
                  </Badge>
                )}
              </div>
              {hasConnectedStores && (
                <Badge variant="outline" className="gap-1 font-normal">
                  <Store className="h-3 w-3" />
                  Synchronisé
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                Chargement...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1">Aucun client trouvé</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Essayez une autre recherche'
                    : hasConnectedStores 
                      ? 'Importez vos clients depuis vos boutiques connectées'
                      : 'Vos clients apparaîtront ici une fois ajoutés'
                  }
                </p>
                <div className="flex justify-center gap-2">
                  {hasConnectedStores ? (
                    <Button onClick={() => setShowImportDialog(true)} className="gap-2">
                      <Store className="h-4 w-4" />
                      Importer depuis Shopify
                    </Button>
                  ) : (
                    <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Ajouter un client
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="font-semibold">Client</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Segment</TableHead>
                        <TableHead className="font-semibold">Commandes</TableHead>
                        <TableHead className="font-semibold">Dépensé</TableHead>
                        <TableHead className="font-semibold">Inscrit</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredCustomers.map((customer, index) => {
                          const segment = segmentConfig[customer.segment as keyof typeof segmentConfig]
                          const SegmentIcon = segment?.icon || Users
                          
                          return (
                            <motion.tr 
                              key={customer.id} 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ delay: index * 0.02 }}
                              className="group hover:bg-muted/30"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium",
                                    customer.segment === 'vip' 
                                      ? 'bg-purple-500/10 text-purple-600' 
                                      : 'bg-primary/10 text-primary'
                                  )}>
                                    {getCustomerName(customer).charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium">{getCustomerName(customer)}</p>
                                    {customer.phone && (
                                      <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                              <TableCell>
                                <Badge className={cn("border gap-1", segment?.color)}>
                                  <SegmentIcon className="h-3 w-3" />
                                  {segment?.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="font-medium">
                                  {customer.total_orders || 0}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold tabular-nums">
                                {(customer.total_spent || 0).toFixed(2)} €
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {formatDistanceToNow(new Date(customer.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem className="gap-2 cursor-pointer">
                                      <Eye className="h-4 w-4" />
                                      Voir détails
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="gap-2 cursor-pointer">
                                      <Send className="h-4 w-4" />
                                      Envoyer email
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="gap-2 cursor-pointer">
                                      <Edit className="h-4 w-4" />
                                      Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="gap-2 cursor-pointer text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                      Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </motion.tr>
                          )
                        })}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3 p-4">
                  {filteredCustomers.map((customer, index) => {
                    const segment = segmentConfig[customer.segment as keyof typeof segmentConfig]
                    const SegmentIcon = segment?.icon || Users
                    
                    return (
                      <motion.div
                        key={customer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className="p-4 border-0 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                                customer.segment === 'vip' 
                                  ? 'bg-purple-500/10 text-purple-600' 
                                  : 'bg-primary/10 text-primary'
                              )}>
                                {getCustomerName(customer).charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{getCustomerName(customer)}</p>
                                <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                              </div>
                            </div>
                            <Badge className={cn("border gap-1 shrink-0", segment?.color)}>
                              <SegmentIcon className="h-3 w-3" />
                              {segment?.label}
                            </Badge>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <div className="flex gap-4 text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <ShoppingCart className="h-3.5 w-3.5" />
                                {customer.total_orders || 0}
                              </span>
                              <span className="font-medium text-foreground">
                                {(customer.total_spent || 0).toFixed(2)} €
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Mail className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Shopify Customer Import Dialog */}
      <ShopifyCustomerImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={() => refetch()}
      />

      {/* Add Customer Modal - Premium Channable Design */}
      <AddCustomerModal
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => refetch()}
      />
    </ChannablePageWrapper>
  )
}
