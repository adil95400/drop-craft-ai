import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  status: 'active' | 'inactive' | 'suspended'
  total_orders: number
  total_spent: number
  created_at: string
  updated_at: string
  address?: any
  last_order_date?: string
}

// Données de démonstration réalistes
const mockCustomers: Customer[] = [
  {
    id: "cust_001",
    name: "Marie Dubois",
    email: "marie.dubois@gmail.com",
    phone: "+33 6 12 34 56 78",
    status: "active",
    total_orders: 15,
    total_spent: 1249.85,
    created_at: "2023-08-15T00:00:00Z",
    updated_at: "2024-01-15T14:20:00Z",
    address: {
      street: "25 Rue de Rivoli",
      city: "Paris",
      postal_code: "75001",
      country: "France"
    },
    last_order_date: "2024-01-15T14:20:00Z"
  },
  {
    id: "cust_002",
    name: "Jean Martin",
    email: "jean.martin@outlook.fr",
    phone: "+33 6 98 76 54 32",
    status: "active",
    total_orders: 8,
    total_spent: 567.40,
    created_at: "2023-10-20T00:00:00Z",
    updated_at: "2024-01-13T09:45:00Z",
    address: {
      street: "12 Avenue des Champs",
      city: "Lyon",
      postal_code: "69001",
      country: "France"
    },
    last_order_date: "2024-01-13T09:45:00Z"
  },
  {
    id: "cust_003",
    name: "Sophie Leroy",
    email: "sophie.leroy@yahoo.fr",
    phone: "+33 7 11 22 33 44",
    status: "active",
    total_orders: 22,
    total_spent: 2150.30,
    created_at: "2023-06-10T00:00:00Z",
    updated_at: "2024-01-14T16:45:00Z",
    address: {
      street: "8 Boulevard Saint-Michel",
      city: "Marseille",
      postal_code: "13001",
      country: "France"
    },
    last_order_date: "2024-01-14T16:45:00Z"
  },
  {
    id: "cust_004",
    name: "Pierre Moreau",
    email: "pierre.moreau@free.fr",
    phone: "+33 6 55 66 77 88",
    status: "active",
    total_orders: 5,
    total_spent: 289.99,
    created_at: "2024-01-05T00:00:00Z",
    updated_at: "2024-01-15T11:20:00Z",
    address: {
      street: "15 Rue du Commerce",
      city: "Toulouse",
      postal_code: "31000",
      country: "France"
    },
    last_order_date: "2024-01-15T11:20:00Z"
  },
  {
    id: "cust_005",
    name: "Camille Bernard",
    email: "camille.bernard@gmail.com",
    phone: "+33 7 99 88 77 66",
    status: "active",
    total_orders: 12,
    total_spent: 890.45,
    created_at: "2023-09-25T00:00:00Z",
    updated_at: "2024-01-12T15:30:00Z",
    address: {
      street: "7 Place Bellecour",
      city: "Nice",
      postal_code: "06000",
      country: "France"
    },
    last_order_date: "2024-01-12T15:30:00Z"
  },
  {
    id: "cust_006",
    name: "Lucas Petit",
    email: "lucas.petit@gmail.com",
    phone: "+33 6 44 55 66 77",
    status: "active",
    total_orders: 3,
    total_spent: 199.99,
    created_at: "2024-01-10T00:00:00Z",
    updated_at: "2024-01-17T12:15:00Z",
    address: {
      street: "33 Rue de la Paix",
      city: "Bordeaux",
      postal_code: "33000",
      country: "France"
    },
    last_order_date: "2024-01-17T12:15:00Z"
  },
  {
    id: "cust_007",
    name: "Emma Rousseau",
    email: "emma.rousseau@hotmail.fr",
    phone: "+33 7 88 99 11 22",
    status: "active",
    total_orders: 7,
    total_spent: 456.78,
    created_at: "2023-11-12T00:00:00Z",
    updated_at: "2024-01-10T10:30:00Z",
    address: {
      street: "18 Cours Mirabeau",
      city: "Aix-en-Provence",
      postal_code: "13100",
      country: "France"
    },
    last_order_date: "2024-01-10T10:30:00Z"
  },
  {
    id: "cust_008",
    name: "Thomas Leclerc",
    email: "thomas.leclerc@wanadoo.fr",
    phone: "+33 6 33 44 55 66",
    status: "inactive",
    total_orders: 2,
    total_spent: 89.99,
    created_at: "2023-12-01T00:00:00Z",
    updated_at: "2023-12-15T14:20:00Z",
    address: {
      street: "45 Rue Victor Hugo",
      city: "Lille",
      postal_code: "59000",
      country: "France"
    },
    last_order_date: "2023-12-15T14:20:00Z"
  }
]

export const useCustomersDemo = (filters: any = {}) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Filtrer les clients
  const filteredCustomers = mockCustomers.filter(customer => {
    if (filters.status && customer.status !== filters.status) {
      return false
    }
    if (filters.search && !customer.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !customer.email.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    return true
  })

  const { data: customers = filteredCustomers, isLoading = false } = useQuery({
    queryKey: ['customers-demo', filters],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return filteredCustomers
    },
    initialData: filteredCustomers
  })

  const updateCustomerStatus = useMutation({
    mutationFn: async ({ customerId, status }: { customerId: string; status: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const currentCustomers = queryClient.getQueryData(['customers-demo', filters]) as Customer[] || []
      const updatedCustomers = currentCustomers.map(customer => 
        customer.id === customerId 
          ? { ...customer, status: status as Customer['status'], updated_at: new Date().toISOString() }
          : customer
      )
      queryClient.setQueryData(['customers-demo', filters], updatedCustomers)
      return { customerId, status }
    },
    onSuccess: () => {
      toast({ title: "Statut mis à jour", description: "Le statut du client a été modifié." })
    }
  })

  const addCustomer = useMutation({
    mutationFn: async (customerData: Partial<Customer>) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const newCustomer: Customer = {
        id: `cust_${Date.now()}`,
        name: customerData.name || '',
        email: customerData.email || '',
        phone: customerData.phone,
        status: 'active',
        total_orders: 0,
        total_spent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        address: customerData.address
      }
      
      const currentCustomers = queryClient.getQueryData(['customers-demo', filters]) as Customer[] || []
      queryClient.setQueryData(['customers-demo', filters], [newCustomer, ...currentCustomers])
      return newCustomer
    },
    onSuccess: () => {
      toast({ title: "Client ajouté", description: "Le nouveau client a été créé avec succès." })
    }
  })

  // Calculer les statistiques
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
    suspended: customers.filter(c => c.status === 'suspended').length,
    totalRevenue: customers.reduce((sum, customer) => sum + customer.total_spent, 0),
    averageOrderValue: customers.length > 0 ? customers.reduce((sum, customer) => sum + customer.total_spent, 0) / customers.reduce((sum, customer) => sum + customer.total_orders, 0) : 0,
    newThisMonth: customers.filter(c => new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
  }

  return {
    customers,
    stats,
    isLoading,
    updateCustomerStatus: updateCustomerStatus.mutate,
    addCustomer: addCustomer.mutate,
    isUpdating: updateCustomerStatus.isPending,
    isAdding: addCustomer.isPending
  }
}