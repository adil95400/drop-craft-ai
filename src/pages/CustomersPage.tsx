/**
 * Page Clients - Style Channable
 * Gérez votre base clients avec le design moderne Channable
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, Search, UserPlus, Eye, Mail, TrendingUp, DollarSign, ShoppingCart, RefreshCw, Download } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  ChannablePageLayout,
  ChannableHeroSection,
  ChannableStatsGrid,
  ChannableQuickActions
} from '@/components/channable'
import { ChannableStat, ChannableQuickAction } from '@/components/channable/types'
import { useQueryClient } from '@tanstack/react-query'

export default function CustomersPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')

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

  // Channable Stats
  const stats: ChannableStat[] = [
    {
      label: 'Total Clients',
      value: totalCustomers.toLocaleString(),
      icon: Users,
      color: 'primary',
      change: 12,
      trend: 'up',
      changeLabel: 'ce mois'
    },
    {
      label: 'Clients Actifs',
      value: activeCustomers.toLocaleString(),
      icon: TrendingUp,
      color: 'success',
      change: 8,
      trend: 'up',
      changeLabel: 'avec commandes'
    },
    {
      label: 'Revenus Total',
      value: `${totalRevenue.toFixed(0)} €`,
      icon: DollarSign,
      color: 'info',
      changeLabel: 'lifetime value'
    },
    {
      label: 'Panier Moyen',
      value: `${avgOrderValue.toFixed(0)} €`,
      icon: ShoppingCart,
      color: 'warning',
      changeLabel: 'par client actif'
    }
  ]

  // Quick Actions
  const quickActions: ChannableQuickAction[] = [
    {
      id: 'add-customer',
      label: 'Nouveau client',
      icon: UserPlus,
      onClick: () => toast({ title: 'Ajouter un client', description: 'Fonctionnalité à venir' }),
      variant: 'primary'
    },
    {
      id: 'refresh',
      label: 'Actualiser',
      icon: RefreshCw,
      onClick: () => {
        refetch()
        queryClient.invalidateQueries({ queryKey: ['customers'] })
        toast({ title: 'Liste actualisée' })
      },
      description: 'Sync data'
    },
    {
      id: 'export',
      label: 'Exporter',
      icon: Download,
      onClick: () => {
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
      },
      description: 'CSV'
    },
    {
      id: 'email',
      label: 'Campagne Email',
      icon: Mail,
      onClick: () => toast({ title: 'Email Marketing', description: 'Redirection vers Email Marketing' }),
      description: 'Newsletter'
    }
  ]

  const handleRefresh = () => {
    refetch()
    queryClient.invalidateQueries({ queryKey: ['customers'] })
    toast({ title: 'Clients actualisés' })
  }

  return (
    <ChannablePageLayout 
      title="Clients" 
      metaTitle="Gestion des Clients"
      metaDescription="Gérez votre base clients et analysez leur comportement"
    >
      {/* Hero Section */}
      <ChannableHeroSection
        title="Gestion Clients"
        subtitle="CRM Intégré"
        description="Gérez votre base clients, analysez leur comportement d'achat et optimisez leur fidélisation avec des outils IA."
        badge={{
          label: `${totalCustomers} clients`,
          icon: Users
        }}
        primaryAction={{
          label: 'Nouveau client',
          onClick: () => toast({ title: 'Ajouter un client', description: 'Fonctionnalité à venir' }),
          icon: UserPlus
        }}
        secondaryAction={{
          label: 'Actualiser',
          onClick: handleRefresh
        }}
        variant="compact"
      />

      {/* Stats Grid */}
      <ChannableStatsGrid stats={stats} columns={4} compact />

      {/* Quick Actions */}
      <ChannableQuickActions actions={quickActions} variant="compact" />

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Customers Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {filteredCustomers.length} client(s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Aucun client trouvé</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Vos clients apparaîtront ici une fois ajoutés
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Commandes</TableHead>
                      <TableHead>Dépensé</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Inscrit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{getCustomerName(customer)}</TableCell>
                        <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{customer.total_orders || 0}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{customer.total_spent?.toFixed(2) || '0.00'} €</TableCell>
                        <TableCell>
                          <Badge variant={customer.total_orders > 0 ? 'default' : 'secondary'}>
                            {customer.total_orders > 0 ? 'Actif' : 'Nouveau'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(customer.created_at), { addSuffix: true, locale: fr })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Mail className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredCustomers.map((customer) => (
                  <Card key={customer.id} className="p-4 border-border/50 bg-background/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{getCustomerName(customer)}</p>
                        <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                      </div>
                      <Badge variant={customer.total_orders > 0 ? 'default' : 'secondary'}>
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
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </ChannablePageLayout>
  )
}
