import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Users, Search, UserPlus, Eye, Mail, Loader2, MoreHorizontal, Trash2, Edit, RefreshCw, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function CustomersPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { data: customers, isLoading, refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const filteredCustomers = useMemo(() => 
    customers?.filter(
      (customer) =>
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []
  , [customers, searchQuery])

  const stats = useMemo(() => ({
    total: customers?.length || 0,
    active: customers?.filter((c) => c.status === 'active').length || 0,
    totalSpent: customers?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0
  }), [customers])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    toast.loading('Actualisation...', { id: 'refresh' })
    await refetch()
    setIsRefreshing(false)
    toast.success('Données actualisées', { id: 'refresh' })
  }, [refetch])

  const handleViewCustomer = useCallback((id: string, name: string) => {
    setActionLoading(id)
    toast.loading(`Chargement de ${name}...`, { id: 'view-customer' })
    setTimeout(() => {
      navigate(`/customers/${id}`)
      toast.dismiss('view-customer')
      setActionLoading(null)
    }, 200)
  }, [navigate])

  const handleEmailCustomer = useCallback((email: string, name: string) => {
    toast.success(`Email ouvert pour ${name}`)
    window.open(`mailto:${email}`, '_blank')
  }, [])

  const handleDeleteCustomer = useCallback(async (id: string, name: string) => {
    toast.loading(`Suppression de ${name}...`, { id: 'delete' })
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
      toast.success(`Client ${name} supprimé`, { id: 'delete' })
      refetch()
    } catch {
      toast.error('Erreur lors de la suppression', { id: 'delete' })
    }
  }, [refetch])

  const handleStatClick = useCallback((type: 'total' | 'active' | 'spent') => {
    const messages = {
      total: `${stats.total} clients au total`,
      active: `${stats.active} clients actifs`,
      spent: `€${stats.totalSpent.toFixed(2)} de revenus totaux`
    }
    toast.info(messages[type])
  }, [stats])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="p-3 sm:p-6">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Clients</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Gérez votre base clients</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>
          <Button size="sm" className="w-full xs:w-auto" onClick={() => navigate('/customers/create')}>
            <UserPlus className="w-4 h-4 mr-2" />
            <span className="hidden xs:inline">Ajouter Client</span>
            <span className="xs:hidden">Ajouter</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards - Clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        <Card 
          className="p-3 sm:p-6 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
          onClick={() => handleStatClick('total')}
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-primary/10 flex-shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Total Clients</p>
              <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-3 sm:p-6 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
          onClick={() => handleStatClick('active')}
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-green-500/10 flex-shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Actifs</p>
              <p className="text-lg sm:text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-3 sm:p-6 col-span-2 lg:col-span-1 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
          onClick={() => handleStatClick('spent')}
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10 flex-shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Revenus Total</p>
              <p className="text-lg sm:text-2xl font-bold">
                €{stats.totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Table */}
      <Card className="p-3 sm:p-6">
        <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            Aucun client trouvé
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
                    <TableHead>Dernière cmd</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow 
                      key={customer.id} 
                      className={cn(
                        "cursor-pointer hover:bg-muted/50 transition-colors",
                        actionLoading === customer.id && "opacity-50"
                      )}
                      onClick={() => handleViewCustomer(customer.id, customer.name)}
                    >
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.total_orders}</TableCell>
                      <TableCell>€{customer.total_spent?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(customer.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleViewCustomer(customer.id, customer.name)}
                          >
                            {actionLoading === customer.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEmailCustomer(customer.email, customer.name)}>
                                <Mail className="w-4 h-4 mr-2" />
                                Envoyer email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/customers/${customer.id}/edit`)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                <Card 
                  key={customer.id} 
                  className={cn(
                    "p-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]",
                    actionLoading === customer.id && "opacity-50"
                  )}
                  onClick={() => handleViewCustomer(customer.id, customer.name)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{customer.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                    </div>
                    <Badge 
                      variant={customer.status === 'active' ? 'default' : 'secondary'}
                      className="text-[10px] flex-shrink-0"
                    >
                      {customer.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex gap-3">
                      <span>{customer.total_orders} cmd</span>
                      <span>€{customer.total_spent?.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => handleViewCustomer(customer.id, customer.name)}
                      >
                        {actionLoading === customer.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => handleEmailCustomer(customer.email, customer.name)}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
