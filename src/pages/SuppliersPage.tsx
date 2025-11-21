import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Plus, Building2, Package, TrendingUp, Mail } from 'lucide-react'

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
  })

  const filteredSuppliers = suppliers?.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage your supplier network</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Suppliers</p>
              <p className="text-2xl font-bold">{suppliers?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Suppliers</p>
              <p className="text-2xl font-bold">
                {suppliers?.filter((s) => s.status === 'active').length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Products Supplied</p>
              <p className="text-2xl font-bold">
                {suppliers?.reduce((sum, s) => sum + (s.product_count || 0), 0) || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading suppliers...
          </div>
        ) : filteredSuppliers?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No suppliers found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers?.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{supplier.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {supplier.country}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{supplier.contact_phone}</p>
                      <p className="text-muted-foreground">{supplier.contact_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{supplier.product_count || 0}</TableCell>
                  <TableCell>N/A</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span>{supplier.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        supplier.status === 'active' ? 'default' : 'secondary'
                      }
                    >
                      {supplier.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        View
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
        )}
      </Card>
    </div>
  )
}
