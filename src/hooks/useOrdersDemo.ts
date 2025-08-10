import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

export interface Order {
  id: string
  order_number: string
  customer_id?: string
  customer_name?: string
  customer_email?: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  currency: string
  created_at: string
  updated_at: string
  tracking_number?: string
  notes?: string
  items?: OrderItem[]
  shipping_address?: any
  billing_address?: any
}

export interface OrderItem {
  id: string
  product_name: string
  product_sku?: string
  quantity: number
  unit_price: number
  total_price: number
}

// Données de démonstration réalistes
const mockOrders: Order[] = [
  {
    id: "order_001",
    order_number: "CMD-2024-001",
    customer_id: "cust_001",
    customer_name: "Marie Dubois",
    customer_email: "marie.dubois@gmail.com",
    status: "delivered",
    total_amount: 179.98,
    currency: "EUR",
    created_at: "2024-01-10T10:30:00Z",
    updated_at: "2024-01-15T14:20:00Z",
    tracking_number: "FR123456789",
    notes: "Livraison express demandée",
    items: [
      {
        id: "item_001",
        product_name: "Écouteurs Bluetooth Sans Fil Pro Max",
        product_sku: "BT-PRO-MAX-001",
        quantity: 2,
        unit_price: 89.99,
        total_price: 179.98
      }
    ]
  },
  {
    id: "order_002",
    order_number: "CMD-2024-002",
    customer_id: "cust_002",
    customer_name: "Jean Martin",
    customer_email: "jean.martin@outlook.fr",
    status: "shipped",
    total_amount: 89.99,
    currency: "EUR",
    created_at: "2024-01-12T14:15:00Z",
    updated_at: "2024-01-13T09:45:00Z",
    tracking_number: "FR987654321",
    notes: "Emballage cadeau",
    items: [
      {
        id: "item_002",
        product_name: "Écouteurs Bluetooth Sans Fil Pro Max",
        product_sku: "BT-PRO-MAX-001",
        quantity: 1,
        unit_price: 89.99,
        total_price: 89.99
      }
    ]
  },
  {
    id: "order_003",
    order_number: "CMD-2024-003",
    customer_id: "cust_003",
    customer_name: "Sophie Leroy",
    customer_email: "sophie.leroy@yahoo.fr",
    status: "processing",
    total_amount: 259.97,
    currency: "EUR",
    created_at: "2024-01-14T16:45:00Z",
    updated_at: "2024-01-14T16:45:00Z",
    notes: "Commande prioritaire",
    items: [
      {
        id: "item_003",
        product_name: "Montre Connectée Sport Ultra",
        product_sku: "SW-ULTRA-002",
        quantity: 1,
        unit_price: 199.99,
        total_price: 199.99
      },
      {
        id: "item_004",
        product_name: "Sac à Dos Voyage Premium",
        product_sku: "BP-PREM-003",
        quantity: 1,
        unit_price: 79.99,
        total_price: 79.99
      }
    ]
  },
  {
    id: "order_004",
    order_number: "CMD-2024-004",
    customer_id: "cust_004",
    customer_name: "Pierre Moreau",
    customer_email: "pierre.moreau@free.fr",
    status: "pending",
    total_amount: 129.99,
    currency: "EUR",
    created_at: "2024-01-15T11:20:00Z",
    updated_at: "2024-01-15T11:20:00Z",
    notes: "Première commande",
    items: [
      {
        id: "item_005",
        product_name: "Humidificateur d'Air Intelligent",
        product_sku: "HUM-SMART-004",
        quantity: 1,
        unit_price: 129.99,
        total_price: 129.99
      }
    ]
  },
  {
    id: "order_005",
    order_number: "CMD-2024-005",
    customer_id: "cust_005",
    customer_name: "Camille Bernard",
    customer_email: "camille.bernard@gmail.com",
    status: "delivered",
    total_amount: 74.98,
    currency: "EUR",
    created_at: "2024-01-08T09:10:00Z",
    updated_at: "2024-01-12T15:30:00Z",
    tracking_number: "FR555666777",
    notes: "Client fidèle",
    items: [
      {
        id: "item_006",
        product_name: "Bandes de Résistance Fitness Pro",
        product_sku: "RB-PRO-005",
        quantity: 1,
        unit_price: 39.99,
        total_price: 39.99
      },
      {
        id: "item_007",
        product_name: "Chargeur Sans Fil Rapide 15W",
        product_sku: "WC-FAST-007",
        quantity: 1,
        unit_price: 34.99,
        total_price: 34.99
      }
    ]
  },
  {
    id: "order_006",
    order_number: "CMD-2024-006",
    customer_id: "cust_006",
    customer_name: "Lucas Petit",
    customer_email: "lucas.petit@gmail.com",
    status: "shipped",
    total_amount: 199.99,
    currency: "EUR",
    created_at: "2024-01-16T08:30:00Z",
    updated_at: "2024-01-17T12:15:00Z",
    tracking_number: "FR999888777",
    notes: "Commande urgente",
    items: [
      {
        id: "item_008",
        product_name: "Caméra de Sécurité WiFi 4K",
        product_sku: "SC-4K-009",
        quantity: 1,
        unit_price: 159.99,
        total_price: 159.99
      },
      {
        id: "item_009",
        product_name: "Lampe LED Bureau Architecte",
        product_sku: "LED-ARCH-006",
        quantity: 1,
        unit_price: 45.99,
        total_price: 45.99
      }
    ]
  }
]

export const useOrdersDemo = (filters: any = {}) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Filtrer les commandes
  const filteredOrders = mockOrders.filter(order => {
    if (filters.status && order.status !== filters.status) {
      return false
    }
    if (filters.search && !order.order_number.toLowerCase().includes(filters.search.toLowerCase()) &&
        !order.customer_name?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    return true
  })

  const { data: orders = filteredOrders, isLoading = false } = useQuery({
    queryKey: ['orders-demo', filters],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return filteredOrders
    },
    initialData: filteredOrders
  })

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const currentOrders = queryClient.getQueryData(['orders-demo', filters]) as Order[] || []
      const updatedOrders = currentOrders.map(order => 
        order.id === orderId 
          ? { ...order, status: status as Order['status'], updated_at: new Date().toISOString() }
          : order
      )
      queryClient.setQueryData(['orders-demo', filters], updatedOrders)
      return { orderId, status }
    },
    onSuccess: () => {
      toast({ title: "Statut mis à jour", description: "Le statut de la commande a été modifié." })
    }
  })

  const addTrackingNumber = useMutation({
    mutationFn: async ({ orderId, trackingNumber }: { orderId: string; trackingNumber: string }) => {
      await new Promise(resolve => setTimeout(resolve, 300))
      const currentOrders = queryClient.getQueryData(['orders-demo', filters]) as Order[] || []
      const updatedOrders = currentOrders.map(order => 
        order.id === orderId 
          ? { ...order, tracking_number: trackingNumber, updated_at: new Date().toISOString() }
          : order
      )
      queryClient.setQueryData(['orders-demo', filters], updatedOrders)
      return { orderId, trackingNumber }
    },
    onSuccess: () => {
      toast({ title: "Numéro de suivi ajouté", description: "Le numéro de tracking a été enregistré." })
    }
  })

  // Calculer les statistiques
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders.reduce((sum, order) => sum + order.total_amount, 0),
    averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length : 0
  }

  return {
    orders,
    stats,
    isLoading,
    updateOrderStatus: updateOrderStatus.mutate,
    addTrackingNumber: addTrackingNumber.mutate,
    isUpdating: updateOrderStatus.isPending,
    isAddingTracking: addTrackingNumber.isPending
  }
}