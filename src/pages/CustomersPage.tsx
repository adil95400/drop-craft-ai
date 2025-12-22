import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card } from '@/components/ui/card'
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
import { Users, Search, UserPlus, Eye, Mail } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function CustomersPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: customers, isLoading } = useQuery({
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

  // Helper pour obtenir le nom complet
  const getCustomerName = (customer: any) => 
    `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email

  const filteredCustomers = customers?.filter(
    (customer) =>
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCustomerName(customer).toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Clients</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Gérez votre base clients</p>
        </div>
        <Button size="sm" className="w-full xs:w-auto">
          <UserPlus className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Ajouter Client</span>
          <span className="xs:hidden">Ajouter</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-primary/10 flex-shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Total Clients</p>
              <p className="text-lg sm:text-2xl font-bold">{customers?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-green-500/10 flex-shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Actifs</p>
              <p className="text-lg sm:text-2xl font-bold">
                {customers?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10 flex-shrink-0">
              <Mail className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Revenus Total</p>
              <p className="text-lg sm:text-2xl font-bold">
                €{customers?.reduce((sum, c) => sum + (c.total_spent || 0), 0).toFixed(2) || '0.00'}
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

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Chargement...
          </div>
        ) : filteredCustomers?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
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
                  {filteredCustomers?.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{getCustomerName(customer)}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.total_orders}</TableCell>
                      <TableCell>€{customer.total_spent?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="default">
                          Actif
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(customer.created_at || new Date()), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
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
              {filteredCustomers?.map((customer) => (
                <Card key={customer.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{getCustomerName(customer)}</p>
                      <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                    </div>
                    <Badge 
                      variant="default"
                      className="text-[10px] flex-shrink-0"
                    >
                      Actif
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex gap-3">
                      <span>{customer.total_orders} cmd</span>
                      <span>€{customer.total_spent?.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
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
