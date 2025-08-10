import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

export interface Product {
  id: string
  name: string
  price: number
  cost_price?: number
  category?: string
  status: 'active' | 'inactive' | 'draft'
  image_url?: string
  description?: string
  supplier?: string
  sku?: string
  tags?: string[]
  stock_quantity?: number
  created_at: string
  updated_at: string
  profit_margin?: number
}

// Données de démonstration pour les produits
const mockProducts: Product[] = [
  {
    id: "prod_001",
    name: "Écouteurs Bluetooth Sans Fil Pro Max",
    price: 89.99,
    cost_price: 25.50,
    category: "Électronique",
    status: "active",
    image_url: "https://images.unsplash.com/photo-1590658165737-15a047b5a6b8?w=500",
    description: "Écouteurs haute qualité avec réduction de bruit active",
    supplier: "AliExpress Partners",
    sku: "BT-PRO-MAX-001",
    tags: ["bluetooth", "audio"],
    stock_quantity: 150,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    profit_margin: 253.0
  },
  {
    id: "prod_002",
    name: "Montre Connectée Sport Ultra",
    price: 199.99,
    cost_price: 65.00,
    category: "Électronique",
    status: "active",
    image_url: "https://images.unsplash.com/photo-1544117519-31a4b719223d?w=500",
    description: "Smartwatch avec GPS et moniteur cardiaque",
    supplier: "Amazon FBA Elite",
    sku: "SW-ULTRA-002",
    tags: ["smartwatch", "sport"],
    stock_quantity: 75,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    profit_margin: 208.0
  },
  {
    id: "prod_003",
    name: "Sac à Dos Voyage Premium",
    price: 79.99,
    cost_price: 22.00,
    category: "Mode & Accessoires",
    status: "active",
    image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
    description: "Sac à dos anti-vol avec port USB",
    supplier: "Shopify Direct",
    sku: "BP-PREM-003",
    tags: ["voyage", "anti-vol"],
    stock_quantity: 200,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    profit_margin: 264.0
  },
  {
    id: "prod_004",
    name: "Bandes de Résistance Fitness Pro",
    price: 39.99,
    cost_price: 8.50,
    category: "Sport & Fitness",
    status: "active",
    image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
    description: "Set de 5 bandes élastiques pour fitness",
    supplier: "European Wholesale",
    sku: "RB-PRO-005",
    tags: ["fitness", "résistance"],
    stock_quantity: 300,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    profit_margin: 370.0
  },
  {
    id: "prod_005",
    name: "Chargeur Sans Fil Rapide 15W",
    price: 34.99,
    cost_price: 9.50,
    category: "Électronique",
    status: "active",
    image_url: "https://images.unsplash.com/photo-1609592935234-0b0d5b261c81?w=500",
    description: "Station de charge Qi universelle",
    supplier: "Amazon FBA Elite",
    sku: "WC-FAST-007",
    tags: ["chargeur", "sans-fil"],
    stock_quantity: 250,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    profit_margin: 268.0
  }
]

export const useProductsDemo = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: products = mockProducts, isLoading = false } = useQuery({
    queryKey: ['products-demo'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockProducts
    },
    initialData: mockProducts
  })

  const addProduct = useMutation({
    mutationFn: async (productData: Partial<Product>) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const newProduct: Product = {
        id: `prod_${Date.now()}`,
        name: productData.name || '',
        price: productData.price || 0,
        cost_price: productData.cost_price,
        category: productData.category,
        status: 'active',
        image_url: productData.image_url,
        description: productData.description,
        supplier: productData.supplier,
        sku: productData.sku,
        tags: productData.tags,
        stock_quantity: productData.stock_quantity || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profit_margin: productData.cost_price ? ((productData.price || 0) - productData.cost_price) / productData.cost_price * 100 : 0
      }
      
      const currentProducts = queryClient.getQueryData(['products-demo']) as Product[] || []
      queryClient.setQueryData(['products-demo'], [newProduct, ...currentProducts])
      return newProduct
    },
    onSuccess: () => {
      toast({ title: "Produit ajouté", description: "Le produit a été ajouté à votre catalogue avec succès." })
    }
  })

  const updateProduct = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const currentProducts = queryClient.getQueryData(['products-demo']) as Product[] || []
      const updatedProducts = currentProducts.map(product => 
        product.id === id 
          ? { ...product, ...updates, updated_at: new Date().toISOString() }
          : product
      )
      queryClient.setQueryData(['products-demo'], updatedProducts)
      return { id, updates }
    },
    onSuccess: () => {
      toast({ title: "Produit modifié", description: "Le produit a été mis à jour avec succès." })
    }
  })

  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      await new Promise(resolve => setTimeout(resolve, 300))
      const currentProducts = queryClient.getQueryData(['products-demo']) as Product[] || []
      queryClient.setQueryData(['products-demo'], currentProducts.filter(p => p.id !== productId))
      return productId
    },
    onSuccess: () => {
      toast({ title: "Produit supprimé", description: "Le produit a été supprimé de votre catalogue." })
    }
  })

  // Calculer les statistiques
  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    inactive: products.filter(p => p.status === 'inactive').length,
    lowStock: products.filter(p => (p.stock_quantity || 0) < 20).length,
    totalValue: products.reduce((sum, product) => sum + (product.price * (product.stock_quantity || 0)), 0),
    averageMargin: products.length > 0 ? products.reduce((sum, product) => sum + (product.profit_margin || 0), 0) / products.length : 0
  }

  return {
    products,
    stats,
    isLoading,
    addProduct: addProduct.mutate,
    updateProduct: updateProduct.mutate,
    deleteProduct: deleteProduct.mutate,
    isAdding: addProduct.isPending,
    isUpdating: updateProduct.isPending,
    isDeleting: deleteProduct.isPending
  }
}