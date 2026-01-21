/**
 * Page Clients - Style Channable Premium
 * Gérez votre base clients avec le design moderne
 */

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, Search, UserPlus, Eye, Mail, TrendingUp, DollarSign, ShoppingCart, RefreshCw, Download, Sparkles, Store } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ShopifyCustomerImportDialog } from '@/components/customers/import/ShopifyCustomerImportDialog'

// Composant carte de stat
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  subtitle,
  color = 'primary' 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  trend?: string;
  subtitle?: string;
  color?: 'primary' | 'success' | 'warning' | 'info';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-green-500/10 text-green-600 border-green-500/20',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className={cn("p-2.5 rounded-xl border", colorClasses[color])}>
              <Icon className="h-5 w-5" />
            </div>
            {trend && (
              <Badge variant="secondary" className="text-xs font-medium bg-green-500/10 text-green-600 border-0">
                {trend}
              </Badge>
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function CustomersPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', email: '', phone: '' })

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
      return data || []
    },
  })

  const getCustomerName = (customer: any) => 
    `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email

  const filteredCustomers = customers?.filter(
    (customer) =>
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCustomerName(customer).toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  // Stats calculations
  const totalCustomers = customers?.length || 0
  const activeCustomers = customers?.filter(c => c.total_orders > 0).length || 0
  const totalRevenue = customers?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0
  const avgOrderValue = totalCustomers > 0 ? totalRevenue / Math.max(1, activeCustomers) : 0

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
      ['Nom', 'Email', 'Commandes', 'Dépensé'].join(','),
      ...customers.map(c => [getCustomerName(c), c.email, c.total_orders, c.total_spent].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `clients_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast({ title: `${customers.length} clients exportés` })
  }

  const handleAddCustomer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({ title: 'Erreur', description: 'Vous devez être connecté', variant: 'destructive' })
        return
      }
      
      if (!newCustomer.email) {
        toast({ title: 'Erreur', description: 'L\'email est requis', variant: 'destructive' })
        return
      }

      const { error } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          first_name: newCustomer.first_name,
          last_name: newCustomer.last_name,
          email: newCustomer.email,
          phone: newCustomer.phone || null,
          total_orders: 0,
          total_spent: 0
        })

      if (error) throw error

      toast({ title: 'Client ajouté avec succès' })
      setNewCustomer({ first_name: '', last_name: '', email: '', phone: '' })
      setShowAddDialog(false)
      refetch()
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <ChannablePageWrapper
      title="Gestion Clients"
      subtitle="CRM Intégré"
      description="Gérez votre base clients, analysez leur comportement d'achat et optimisez leur fidélisation avec des outils IA."
      heroImage="marketing"
      badge={{
        label: `${totalCustomers} clients`,
        icon: Users
      }}
      actions={
        <>
          <Button 
            variant="outline" 
            onClick={() => setShowImportDialog(true)}
            className="gap-2 backdrop-blur-sm bg-background/50 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Store className="h-4 w-4" />
            Importer depuis Shopify
          </Button>
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
        </>
      }
    >
      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={Users} 
          label="Total Clients" 
          value={totalCustomers.toLocaleString()} 
          trend="+12%" 
          color="primary" 
        />
        <StatCard 
          icon={TrendingUp} 
          label="Clients Actifs" 
          value={activeCustomers.toLocaleString()} 
          subtitle="avec commandes"
          color="success" 
        />
        <StatCard 
          icon={DollarSign} 
          label="Revenus Total" 
          value={`${totalRevenue.toFixed(0)} €`} 
          subtitle="lifetime value"
          color="info" 
        />
        <StatCard 
          icon={ShoppingCart} 
          label="Panier Moyen" 
          value={`${avgOrderValue.toFixed(0)} €`} 
          subtitle="par client actif"
          color="warning" 
        />
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-0 bg-muted/50 focus-visible:ring-1"
              />
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
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              {filteredCustomers.length} client(s)
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
                <p className="text-sm text-muted-foreground">
                  Vos clients apparaîtront ici une fois ajoutés
                </p>
                <Button className="mt-4 gap-2">
                  <UserPlus className="h-4 w-4" />
                  Ajouter un client
                </Button>
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
                        <TableHead className="font-semibold">Commandes</TableHead>
                        <TableHead className="font-semibold">Dépensé</TableHead>
                        <TableHead className="font-semibold">Statut</TableHead>
                        <TableHead className="font-semibold">Inscrit</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer, index) => (
                        <motion.tr 
                          key={customer.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="group hover:bg-muted/30"
                        >
                          <TableCell className="font-medium">{getCustomerName(customer)}</TableCell>
                          <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-medium">{customer.total_orders || 0}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{customer.total_spent?.toFixed(2) || '0.00'} €</TableCell>
                          <TableCell>
                            <Badge 
                              className={cn(
                                "border",
                                customer.total_orders > 0 
                                  ? 'bg-green-500/10 text-green-600 border-green-500/30' 
                                  : 'bg-muted text-muted-foreground border-muted-foreground/20'
                              )}
                            >
                              {customer.total_orders > 0 ? 'Actif' : 'Nouveau'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDistanceToNow(new Date(customer.created_at), { addSuffix: true, locale: fr })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                <Mail className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3 p-4">
                  {filteredCustomers.map((customer, index) => (
                    <motion.div
                      key={customer.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-4 border-0 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{getCustomerName(customer)}</p>
                            <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                          </div>
                          <Badge 
                            className={cn(
                              "border shrink-0",
                              customer.total_orders > 0 
                                ? 'bg-green-500/10 text-green-600 border-green-500/30' 
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {customer.total_orders > 0 ? 'Actif' : 'Nouveau'}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <div className="flex gap-4 text-muted-foreground">
                            <span>{customer.total_orders || 0} cmd</span>
                            <span>{customer.total_spent?.toFixed(2) || '0.00'} €</span>
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
                  ))}
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

      {/* Add Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau client</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="first_name">Prénom</Label>
              <Input
                id="first_name"
                value={newCustomer.first_name}
                onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                placeholder="Jean"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">Nom</Label>
              <Input
                id="last_name"
                value={newCustomer.last_name}
                onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                placeholder="Dupont"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="jean.dupont@email.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Annuler</Button>
            <Button onClick={handleAddCustomer}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChannablePageWrapper>
  )
}
