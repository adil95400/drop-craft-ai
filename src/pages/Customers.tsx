import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, Search, Plus, Filter, Download, Mail, Phone, 
  MapPin, Calendar, TrendingUp, Eye, Edit, Trash2,
  Star, ShoppingCart, DollarSign, Activity
} from 'lucide-react'
import { CustomerDetailsModal } from '@/components/modals/CustomerDetailsModal'
import { CustomerEditModal } from '@/components/modals/CustomerEditModal'
import { CustomerSegmentationModal } from '@/components/modals/CustomerSegmentationModal'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  status: 'active' | 'inactive' | 'vip' | 'new'
  totalSpent: number
  totalOrders: number
  lastOrder: string
  joinDate: string
  location: string
  segment: string
  tags: string[]
  lifetime_value: number
  avg_order_value: number
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Sophie Martin',
    email: 'sophie.martin@email.com',
    phone: '+33 1 23 45 67 89',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
    status: 'vip',
    totalSpent: 4580.00,
    totalOrders: 12,
    lastOrder: '2024-01-15',
    joinDate: '2023-08-10',
    location: 'Paris, France',
    segment: 'High Value',
    tags: ['VIP', 'Frequent Buyer', 'Premium'],
    lifetime_value: 6200,
    avg_order_value: 381.67
  },
  {
    id: '2',
    name: 'Thomas Dubois',
    email: 'thomas.dubois@email.com',
    phone: '+33 6 98 76 54 32',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    status: 'active',
    totalSpent: 2340.50,
    totalOrders: 8,
    lastOrder: '2024-01-12',
    joinDate: '2023-11-20',
    location: 'Lyon, France',
    segment: 'Regular',
    tags: ['Loyal Customer', 'Tech Enthusiast'],
    lifetime_value: 3100,
    avg_order_value: 292.56
  }
]

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSegmentationModal, setShowSegmentationModal] = useState(false)

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-gradient-to-r from-yellow-400 to-orange-500'
      case 'active': return 'bg-gradient-to-r from-green-400 to-blue-500'
      case 'new': return 'bg-gradient-to-r from-blue-400 to-purple-500'
      case 'inactive': return 'bg-gradient-to-r from-gray-400 to-gray-600'
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background p-6">
      <div className="container mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Gestion des Clients
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos clients, analysez leur comportement et optimisez vos relations
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouveau Client
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold">1,247</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={customer.avatar} alt={customer.name} />
                      <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{customer.name}</h3>
                        <Badge className={`${getStatusColor(customer.status)} text-white border-0`}>
                          {customer.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}