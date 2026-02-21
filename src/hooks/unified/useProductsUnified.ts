/**
 * useProductsUnified — Pure API V1 hook
 * Single source of truth: all product operations go through /v1/products
 * No direct Supabase table queries.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { productsApi, type ProductRecord, type ProductStats as ApiProductStats } from '@/services/api/client'

// ============= Types =============
export interface UnifiedProduct {
  id: string
  name: string
  title?: string
  description?: string
  price: number
  cost_price?: number
  stock_quantity?: number
  status: 'active' | 'inactive' | 'draft' | 'archived'
  category?: string
  sku?: string
  image_url?: string
  image_urls?: string[]
  images?: string[]
  supplier?: string
  supplier_name?: string
  profit_margin?: number
  tags?: string[]
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  source?: string
  user_id: string
  brand?: string
  barcode?: string
  weight?: number
  weight_unit?: string
  vendor?: string
  product_type?: string
  is_published?: boolean
  view_count?: number
  compare_at_price?: number
  created_at: string
  updated_at: string
}

export interface ProductFilters {
  status?: 'active' | 'inactive' | 'draft' | 'archived'
  category?: string
  search?: string
  low_stock?: boolean
  page?: number
  pageSize?: number
}

export interface ProductStats {
  total: number
  active: number
  inactive: number
  draft: number
  archived: number
  lowStock: number
  totalValue: number
  avgPrice: number
  totalMargin: number
  totalCount: number
}

export interface UseProductsUnifiedOptions {
  filters?: ProductFilters
  // Legacy flags — ignored, all data comes from unified /v1/products
  includeCatalog?: boolean
  includeImported?: boolean
  paginationEnabled?: boolean
}

// ── Map API record → UnifiedProduct ─────────────────────────────────────────
function mapRecord(r: ProductRecord): UnifiedProduct {
  return {
    id: r.id,
    name: r.name || r.title || 'Produit sans nom',
    title: r.title ?? undefined,
    description: r.description ?? undefined,
    price: r.price ?? 0,
    cost_price: r.cost_price || undefined,
    stock_quantity: r.stock_quantity,
    status: (['active', 'inactive', 'draft', 'archived'].includes(r.status) ? r.status : 'draft') as UnifiedProduct['status'],
    category: r.category ?? undefined,
    sku: r.sku ?? undefined,
    image_url: r.images?.length > 0 ? r.images[0] : undefined,
    image_urls: r.images ?? [],
    images: r.images ?? [],
    profit_margin: r.profit_margin ?? (r.cost_price && r.price > 0 ? ((r.price - r.cost_price) / r.price) * 100 : undefined),
    tags: r.tags ?? [],
    seo_title: r.seo_title ?? undefined,
    seo_description: r.seo_description ?? undefined,
    brand: r.brand ?? undefined,
    barcode: r.barcode ?? undefined,
    weight: r.weight ?? undefined,
    weight_unit: r.weight_unit ?? undefined,
    vendor: r.vendor ?? undefined,
    product_type: r.product_type ?? undefined,
    is_published: r.is_published,
    view_count: r.view_count,
    compare_at_price: r.compare_at_price ?? undefined,
    source: 'products',
    user_id: '', // Not exposed by API
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

// ============= Main Hook =============
export function useProductsUnified(options: UseProductsUnifiedOptions = {}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { filters } = options
  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 100

  // ── Fetch products via API V1 ─────────────────────────────────────────────
  const { data: productsData, isLoading, error, refetch } = useQuery({
    queryKey: ['products-unified', user?.id, filters],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        page,
        per_page: pageSize,
      }
      if (filters?.search) params.q = filters.search
      if (filters?.category) params.category = filters.category
      if (filters?.status) params.status = filters.status
      if (filters?.low_stock) params.low_stock = 'true'

      const resp = await productsApi.list(params as any)
      return {
        items: (resp.items ?? []).map(mapRecord),
        total: resp.meta?.total ?? 0,
      }
    },
    enabled: !!user,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
  })

  const products = productsData?.items ?? []
  const totalFromServer = productsData?.total ?? 0

  // ── Stats via API V1 ──────────────────────────────────────────────────────
  const { data: apiStats } = useQuery({
    queryKey: ['product-stats', user?.id],
    queryFn: () => productsApi.stats(),
    enabled: !!user,
    staleTime: 60_000,
  })

  const stats: ProductStats = {
    total: apiStats?.total ?? totalFromServer,
    active: apiStats?.active ?? 0,
    inactive: apiStats?.inactive ?? 0,
    draft: apiStats?.draft ?? 0,
    archived: 0,
    lowStock: apiStats?.low_stock ?? 0,
    totalValue: apiStats?.total_value ?? 0,
    avgPrice: apiStats?.avg_price ?? 0,
    totalMargin: apiStats?.total_profit ?? 0,
    totalCount: apiStats?.total ?? totalFromServer,
  }

  // ── Mutations (all via API V1) ────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: async (newProduct: Partial<UnifiedProduct>) => {
      return productsApi.create({
        name: newProduct.name || newProduct.title || 'Nouveau produit',
        title: newProduct.name || newProduct.title || 'Nouveau produit',
        description: newProduct.description,
        price: newProduct.price ?? 0,
        cost_price: newProduct.cost_price ?? 0,
        stock_quantity: newProduct.stock_quantity ?? 0,
        status: newProduct.status || 'draft',
        category: newProduct.category,
        sku: newProduct.sku,
        tags: newProduct.tags ?? [],
        images: newProduct.image_url ? [newProduct.image_url] : [],
      } as any)
    },
    onSuccess: () => {
      invalidateAll()
      toast({ title: 'Succès', description: 'Produit ajouté avec succès' })
    },
    onError: () => toast({ title: 'Erreur', description: "Impossible d'ajouter le produit", variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UnifiedProduct> }) => {
      const body: any = {}
      if (updates.name || updates.title) body.name = updates.name || updates.title
      if (updates.name || updates.title) body.title = updates.name || updates.title
      if (updates.description !== undefined) body.description = updates.description
      if (updates.price !== undefined) body.price = updates.price
      if (updates.cost_price !== undefined) body.cost_price = updates.cost_price
      if (updates.stock_quantity !== undefined) body.stock_quantity = updates.stock_quantity
      if (updates.status) body.status = updates.status
      if (updates.category !== undefined) body.category = updates.category
      if (updates.sku !== undefined) body.sku = updates.sku
      if (updates.tags !== undefined) body.tags = updates.tags
      if (updates.seo_title !== undefined) body.seo_title = updates.seo_title
      if (updates.seo_description !== undefined) body.seo_description = updates.seo_description
      return productsApi.update(id, body)
    },
    onSuccess: () => {
      invalidateAll()
      toast({ title: 'Succès', description: 'Produit mis à jour' })
    },
    onError: () => toast({ title: 'Erreur', description: 'Impossible de mettre à jour le produit', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      invalidateAll()
      toast({ title: 'Succès', description: 'Produit supprimé' })
    },
    onError: () => toast({ title: 'Erreur', description: 'Impossible de supprimer le produit', variant: 'destructive' }),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => productsApi.bulkUpdate(ids, { status: 'archived' } as any),
    onSuccess: () => {
      invalidateAll()
      toast({ title: 'Succès', description: 'Produits supprimés' })
    },
    onError: () => toast({ title: 'Erreur', description: 'Impossible de supprimer les produits', variant: 'destructive' }),
  })

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      productsApi.bulkUpdate(ids, { status } as any),
    onSuccess: () => {
      invalidateAll()
      toast({ title: 'Succès', description: 'Statuts mis à jour' })
    },
    onError: () => toast({ title: 'Erreur', description: 'Impossible de mettre à jour les statuts', variant: 'destructive' }),
  })

  const optimizeMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: connect to /v1/ai/enrichments when ready
      toast({ title: 'Optimisation IA', description: 'Fonctionnalité en cours de connexion au backend.' })
      return { id }
    },
  })

  // ── Helpers ───────────────────────────────────────────────────────────────
  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['products-unified'] })
    queryClient.invalidateQueries({ queryKey: ['unified-products'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['product-stats'] })
  }

  return {
    products,
    data: products,
    stats,
    isLoading,
    error,
    add: addMutation.mutate,
    addAsync: addMutation.mutateAsync,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    addProduct: addMutation.mutate,
    updateProduct: updateMutation.mutate,
    deleteProduct: deleteMutation.mutate,
    createProduct: addMutation.mutate,
    bulkDelete: bulkDeleteMutation.mutate,
    bulkUpdateStatus: bulkUpdateStatusMutation.mutate,
    optimize: optimizeMutation.mutate,
    optimizeProduct: optimizeMutation.mutate,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isCreating: addMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
    isBulkUpdating: bulkUpdateStatusMutation.isPending,
    isOptimizing: optimizeMutation.isPending,
    refetch,
    invalidate: invalidateAll,
  }
}

// ============= Single product hook =============
export function useProductUnified(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['product-unified', id],
    queryFn: async () => {
      if (!id) return null
      const r = await productsApi.get(id)
      return mapRecord(r)
    },
    enabled: !!user && !!id,
  })
}
