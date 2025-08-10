import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import type { CatalogProduct } from './useCatalogProducts'

// Export the interface for external use
export type { CatalogProduct }

// Données de démonstration réalistes pour l'application
const mockCatalogProducts: CatalogProduct[] = [
  {
    id: "cat_prod_001",
    external_id: "AE_12345",
    name: "Écouteurs Bluetooth Sans Fil Pro Max",
    description: "Écouteurs haute qualité avec réduction de bruit active, autonomie 30h, étanche IPX7",
    price: 89.99,
    cost_price: 25.50,
    original_price: 149.99,
    category: "Électronique",
    subcategory: "Audio",
    brand: "TechPro",
    supplier_id: "supplier_001",
    supplier_name: "AliExpress Partners",
    image_url: "https://images.unsplash.com/photo-1590658165737-15a047b5a6b8?w=500",
    sku: "BT-PRO-MAX-001",
    currency: "EUR",
    stock_quantity: 150,
    rating: 4.7,
    reviews_count: 1250,
    sales_count: 890,
    tags: ["bluetooth", "sans-fil", "audio", "sport"],
    profit_margin: 253.0,
    is_winner: true,
    is_trending: true,
    is_bestseller: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "cat_prod_002",
    external_id: "AMZ_67890",
    name: "Montre Connectée Sport Ultra",
    description: "Smartwatch avec GPS, moniteur cardiaque, étanche 50m, écran AMOLED",
    price: 199.99,
    cost_price: 65.00,
    original_price: 299.99,
    category: "Électronique",
    subcategory: "Wearables",
    brand: "FitTech",
    supplier_id: "supplier_002",
    supplier_name: "Amazon FBA Elite",
    image_url: "https://images.unsplash.com/photo-1544117519-31a4b719223d?w=500",
    sku: "SW-ULTRA-002",
    currency: "EUR",
    stock_quantity: 75,
    rating: 4.6,
    reviews_count: 890,
    sales_count: 567,
    tags: ["smartwatch", "sport", "gps", "santé"],
    profit_margin: 208.0,
    is_winner: true,
    is_trending: true,
    is_bestseller: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "cat_prod_003",
    external_id: "SH_11111",
    name: "Sac à Dos Voyage Premium",
    description: "Sac à dos anti-vol avec port USB, compartiment laptop 17\", imperméable",
    price: 79.99,
    cost_price: 22.00,
    original_price: 129.99,
    category: "Mode & Accessoires",
    subcategory: "Bagagerie",
    brand: "TravelPro",
    supplier_id: "supplier_003",
    supplier_name: "Shopify Direct",
    image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
    sku: "BP-PREM-003",
    currency: "EUR",
    stock_quantity: 200,
    rating: 4.5,
    reviews_count: 678,
    sales_count: 445,
    tags: ["voyage", "anti-vol", "usb", "imperméable"],
    profit_margin: 264.0,
    is_winner: false,
    is_trending: true,
    is_bestseller: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "cat_prod_004",
    external_id: "DH_22222",
    name: "Humidificateur d'Air Intelligent",
    description: "Humidificateur 6L avec contrôle app, diffuseur huiles essentielles, ultra-silencieux",
    price: 129.99,
    cost_price: 35.00,
    original_price: 199.99,
    category: "Maison & Jardin",
    subcategory: "Électroménager",
    brand: "AirPure",
    supplier_id: "supplier_004",
    supplier_name: "DHgate Pro",
    image_url: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500",
    sku: "HUM-SMART-004",
    currency: "EUR",
    stock_quantity: 120,
    rating: 4.4,
    reviews_count: 456,
    sales_count: 289,
    tags: ["humidificateur", "intelligent", "silencieux", "aromathérapie"],
    profit_margin: 271.0,
    is_winner: false,
    is_trending: false,
    is_bestseller: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "cat_prod_005",
    external_id: "EU_33333",
    name: "Bandes de Résistance Fitness Pro",
    description: "Set de 5 bandes élastiques avec poignées, ancrage porte, guide exercices",
    price: 39.99,
    cost_price: 8.50,
    original_price: 69.99,
    category: "Sport & Fitness",
    subcategory: "Équipement",
    brand: "FitBand",
    supplier_id: "supplier_005",
    supplier_name: "European Wholesale",
    image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
    sku: "RB-PRO-005",
    currency: "EUR",
    stock_quantity: 300,
    rating: 4.8,
    reviews_count: 1890,
    sales_count: 1234,
    tags: ["fitness", "résistance", "musculation", "portable"],
    profit_margin: 370.0,
    is_winner: true,
    is_trending: true,
    is_bestseller: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "cat_prod_006",
    external_id: "AE_44444",
    name: "Lampe LED Bureau Architecte",
    description: "Lampe de bureau pliable, 3 modes éclairage, contrôle tactile, économique",
    price: 45.99,
    cost_price: 12.00,
    original_price: 79.99,
    category: "Maison & Jardin",
    subcategory: "Éclairage",
    brand: "LightPro",
    supplier_id: "supplier_001",
    supplier_name: "AliExpress Partners",
    image_url: "https://images.unsplash.com/photo-1524234107056-1c1f48f64ab8?w=500",
    sku: "LED-ARCH-006",
    currency: "EUR",
    stock_quantity: 180,
    rating: 4.3,
    reviews_count: 567,
    sales_count: 378,
    tags: ["led", "bureau", "pliable", "tactile"],
    profit_margin: 283.0,
    is_winner: false,
    is_trending: true,
    is_bestseller: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "cat_prod_007",
    external_id: "AMZ_55555",
    name: "Chargeur Sans Fil Rapide 15W",
    description: "Station de charge Qi compatible iPhone/Samsung, refroidissement actif",
    price: 34.99,
    cost_price: 9.50,
    original_price: 59.99,
    category: "Électronique",
    subcategory: "Accessoires",
    brand: "ChargeTech",
    supplier_id: "supplier_002",
    supplier_name: "Amazon FBA Elite",
    image_url: "https://images.unsplash.com/photo-1609592935234-0b0d5b261c81?w=500",
    sku: "WC-FAST-007",
    currency: "EUR",
    stock_quantity: 250,
    rating: 4.6,
    reviews_count: 789,
    sales_count: 523,
    tags: ["qi", "sans-fil", "rapide", "universel"],
    profit_margin: 268.0,
    is_winner: true,
    is_trending: false,
    is_bestseller: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "cat_prod_008",
    external_id: "SH_66666",
    name: "Organisateur Voiture Premium",
    description: "Organisateur siège arrière, multi-poches, support tablette, cuir PU",
    price: 29.99,
    cost_price: 7.80,
    original_price: 49.99,
    category: "Auto & Moto",
    subcategory: "Accessoires",
    brand: "CarOrganize",
    supplier_id: "supplier_003",
    supplier_name: "Shopify Direct",
    image_url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500",
    sku: "CO-PREM-008",
    currency: "EUR",
    stock_quantity: 150,
    rating: 4.4,
    reviews_count: 345,
    sales_count: 289,
    tags: ["voiture", "organisateur", "cuir", "tablette"],
    profit_margin: 284.0,
    is_winner: false,
    is_trending: false,
    is_bestseller: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "cat_prod_009",
    external_id: "EU_77777",
    name: "Caméra de Sécurité WiFi 4K",
    description: "Caméra surveillance extérieure, vision nocturne, détection mouvement, stockage cloud",
    price: 159.99,
    cost_price: 45.00,
    original_price: 249.99,
    category: "Électronique",
    subcategory: "Sécurité",
    brand: "SecureCam",
    supplier_id: "supplier_005",
    supplier_name: "European Wholesale",
    image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
    sku: "SC-4K-009",
    currency: "EUR",
    stock_quantity: 85,
    rating: 4.5,
    reviews_count: 432,
    sales_count: 267,
    tags: ["sécurité", "4k", "wifi", "extérieur"],
    profit_margin: 256.0,
    is_winner: true,
    is_trending: true,
    is_bestseller: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "cat_prod_010",
    external_id: "DH_88888",
    name: "Kit Outils Bricolage 168 Pièces",
    description: "Mallette outils complète professionnelle, tous travaux maison et bricolage",
    price: 89.99,
    cost_price: 28.00,
    original_price: 149.99,
    category: "Bricolage & Jardinage",
    subcategory: "Outils",
    brand: "ToolMaster",
    supplier_id: "supplier_004",
    supplier_name: "DHgate Pro",
    image_url: "https://images.unsplash.com/photo-1609139003551-ee40f5d7d4fd?w=500",
    sku: "TM-KIT-010",
    currency: "EUR",
    stock_quantity: 95,
    rating: 4.7,
    reviews_count: 623,
    sales_count: 412,
    tags: ["outils", "bricolage", "mallette", "professionnel"],
    profit_margin: 221.0,
    is_winner: false,
    is_trending: true,
    is_bestseller: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  }
]

const mockCategories = [
  "Électronique", 
  "Mode & Accessoires", 
  "Maison & Jardin", 
  "Sport & Fitness", 
  "Auto & Moto",
  "Bricolage & Jardinage"
]

const mockSuppliers = [
  { id: "supplier_001", name: "AliExpress Partners" },
  { id: "supplier_002", name: "Amazon FBA Elite" },
  { id: "supplier_003", name: "Shopify Direct" },
  { id: "supplier_004", name: "DHgate Pro" },
  { id: "supplier_005", name: "European Wholesale" }
]

export const useCatalogProductsDemo = (filters: any = {}) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Filtrer les produits selon les critères
  const filteredProducts = mockCatalogProducts.filter(product => {
    if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !product.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.category && product.category !== filters.category) {
      return false
    }
    if (filters.supplier && product.supplier_id !== filters.supplier) {
      return false
    }
    if (filters.isTrending && !product.is_trending) {
      return false
    }
    if (filters.isWinner && !product.is_winner) {
      return false
    }
    if (filters.isBestseller && !product.is_bestseller) {
      return false
    }
    return true
  })

  const { data: products = filteredProducts, isLoading = false } = useQuery({
    queryKey: ['catalog-products-demo', filters],
    queryFn: async () => {
      // Simuler un délai de réseau
      await new Promise(resolve => setTimeout(resolve, 500))
      return filteredProducts
    },
    initialData: filteredProducts
  })

  const { data: categories = mockCategories } = useQuery({
    queryKey: ['catalog-categories-demo'],
    queryFn: async () => mockCategories,
    initialData: mockCategories
  })
  
  const { data: suppliers = mockSuppliers } = useQuery({
    queryKey: ['catalog-suppliers-demo'],
    queryFn: async () => mockSuppliers,
    initialData: mockSuppliers
  })

  // Favoris utilisateur simulés
  const mockUserFavorites = ["cat_prod_001", "cat_prod_005", "cat_prod_007"]
  
  const { data: userFavorites = mockUserFavorites } = useQuery({
    queryKey: ['user-favorites-demo'],
    queryFn: async () => mockUserFavorites,
    initialData: mockUserFavorites
  })

  const addToFavorites = useMutation({
    mutationFn: async (productId: string) => {
      // Simuler l'ajout en base
      await new Promise(resolve => setTimeout(resolve, 300))
      const currentFavorites = queryClient.getQueryData(['user-favorites-demo']) as string[] || []
      if (!currentFavorites.includes(productId)) {
        queryClient.setQueryData(['user-favorites-demo'], [...currentFavorites, productId])
      }
      return productId
    },
    onSuccess: () => {
      toast({ title: "Favori ajouté", description: "Le produit a été ajouté à vos favoris." })
    }
  })

  const removeFromFavorites = useMutation({
    mutationFn: async (productId: string) => {
      // Simuler la suppression en base
      await new Promise(resolve => setTimeout(resolve, 300))
      const currentFavorites = queryClient.getQueryData(['user-favorites-demo']) as string[] || []
      queryClient.setQueryData(['user-favorites-demo'], currentFavorites.filter(id => id !== productId))
      return productId
    },
    onSuccess: () => {
      toast({ title: "Favori retiré", description: "Le produit a été retiré de vos favoris." })
    }
  })

  const addSourcingHistory = useMutation({
    mutationFn: async ({ productId, action, metadata }: { productId: string; action: string; metadata?: any }) => {
      // Simuler l'ajout d'historique
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log(`Sourcing history: ${action} for product ${productId}`, metadata)
      return { productId, action, metadata }
    }
  })

  const stats = {
    total: products.length,
    winners: products.filter(p => p.is_winner).length,
    trending: products.filter(p => p.is_trending).length,
    bestsellers: products.filter(p => p.is_bestseller).length,
    averageRating: products.length > 0 ? products.reduce((sum, p) => sum + p.rating, 0) / products.length : 0,
    totalValue: products.reduce((sum, p) => sum + p.price, 0)
  }

  return {
    products,
    categories,
    suppliers,
    userFavorites,
    stats,
    isLoading,
    addToFavorites: addToFavorites.mutate,
    removeFromFavorites: removeFromFavorites.mutate,
    addSourcingHistory: addSourcingHistory.mutate
  }
}