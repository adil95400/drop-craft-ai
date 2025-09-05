/**
 * Interface moderne des clients inspirée des concurrents
 * Table avec colonnes, recherche, filtres et segments
 */
import React, { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Users,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  UserPlus,
  Download,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Activity
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useLegacyPlan } from '@/lib/migration-helper'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  status: string
  total_spent: number
  total_orders: number
  address?: any
  created_at: string
  updated_at: string
}

export default function ModernCustomers() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { isPro, isUltraPro } = useLegacyPlan(user)
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomers()
  }, [user])

  const fetchCustomers = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, label: 'Actif', color: 'bg-green-100 text-green-800' },
      inactive: { variant: 'secondary' as const, label: 'Inactif', color: 'bg-gray-100 text-gray-800' },
      vip: { variant: 'outline' as const, label: 'VIP', color: 'bg-purple-100 text-purple-800' }
    }
    
    const config = variants[status as keyof typeof variants] || variants.active
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      header: "Client",
      cell: ({ row }) => {
        const customer = row.original
        return (
          <div className="flex items-center space-x-3 min-w-[200px]">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.name}`} />
              <AvatarFallback>
                <Users className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="font-medium text-sm leading-none">{customer.name}</div>
              <div className="text-xs text-muted-foreground flex items-center">
                <Mail className="h-3 w-3 mr-1" />
                {customer.email}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "Contact",
      cell: ({ row }) => {
        const customer = row.original
        return customer.phone ? (
          <div className="flex items-center text-sm">
            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
            {customer.phone}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      },
    },
    {
      accessorKey: "total_orders",
      header: "Commandes",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <ShoppingBag className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">{row.getValue("total_orders")}</span>
        </div>
      ),
    },
    {
      accessorKey: "total_spent",
      header: "Dépensé",
      cell: ({ row }) => {
        const amount = row.getValue("total_spent") as number
        return (
          <div className="text-right font-medium">
            {formatCurrency(amount)}
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Inscription",
      cell: ({ row }) => (
        <div className="text-sm">{formatDate(row.getValue("created_at"))}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const customer = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Ouvrir menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Envoyer email
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Voir commandes
              </DropdownMenuItem>
              {isUltraPro && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Analytics client
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // Stats
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    totalRevenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
    avgOrderValue: customers.length > 0 ? customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.reduce((sum, c) => sum + c.total_orders, 1) : 0
  }

  const filters = (
    <>
      <Select defaultValue="all">
        <SelectTrigger className="h-8 w-[150px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="active">Actif</SelectItem>
          <SelectItem value="inactive">Inactif</SelectItem>
          <SelectItem value="vip">VIP</SelectItem>
        </SelectContent>
      </Select>
      
      <Select defaultValue="all">
        <SelectTrigger className="h-8 w-[150px]">
          <SelectValue placeholder="Segment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous segments</SelectItem>
          <SelectItem value="new">Nouveaux</SelectItem>
          <SelectItem value="returning">Récurrents</SelectItem>
          <SelectItem value="high_value">Forte valeur</SelectItem>
        </SelectContent>
      </Select>
    </>
  )

  const toolbar = (
    <>
      <Button variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        Exporter
      </Button>
      <Button size="sm">
        <UserPlus className="mr-2 h-4 w-4" />
        Ajouter client
      </Button>
    </>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header moderne */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Gérez vos {stats.total} clients et leurs segments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isUltraPro && (
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              Segmentation IA
            </Button>
          )}
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Nouveau client
          </Button>
        </div>
      </div>

      {/* KPIs modernes */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +15% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              +8% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rétention</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">
              Clients récurrents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table moderne avec DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>Base clients</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={customers}
            searchKey="name"
            searchPlaceholder="Rechercher un client..."
            filters={filters}
            toolbar={toolbar}
          />
        </CardContent>
      </Card>
    </div>
  )
}