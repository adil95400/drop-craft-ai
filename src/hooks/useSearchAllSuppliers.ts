import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface SupplierResult {
  platform: string
  platformIcon: string
  productTitle: string
  price: number
  originalPrice?: number
  currency: string
  shipping: number
  shippingTime: string
  availability: 'in_stock' | 'low_stock' | 'out_of_stock'
  rating: number
  reviews: number
  seller: string
  sellerRating?: number
  productUrl: string
  imageUrl: string
  variants?: number
  moq?: number // Minimum Order Quantity
  totalCost: number
  margin?: number
  score: number // Calculated score for ranking
}

export interface SearchFilters {
  minPrice?: number
  maxPrice?: number
  maxShipping?: number
  maxShippingDays?: number
  minRating?: number
  inStockOnly?: boolean
  platforms?: string[]
}

const SUPPORTED_PLATFORMS = [
  { id: 'aliexpress', name: 'AliExpress', icon: '🛒', searchable: true },
  { id: 'amazon', name: 'Amazon', icon: '📦', searchable: true },
  { id: 'temu', name: 'Temu', icon: '🎯', searchable: true },
  { id: 'ebay', name: 'eBay', icon: '🏷️', searchable: true },
  { id: '1688', name: '1688', icon: '🏭', searchable: true },
  { id: 'cj', name: 'CJ Dropshipping', icon: '🚚', searchable: true },
  { id: 'dhgate', name: 'DHgate', icon: '🌐', searchable: true },
  { id: 'banggood', name: 'Banggood', icon: '📱', searchable: true },
  { id: 'wish', name: 'Wish', icon: '⭐', searchable: true },
  { id: 'walmart', name: 'Walmart', icon: '🏪', searchable: true },
  { id: 'etsy', name: 'Etsy', icon: '🎨', searchable: true },
  { id: 'taobao', name: 'Taobao', icon: '🇨🇳', searchable: true },
  { id: 'cdiscount', name: 'Cdiscount', icon: '🇫🇷', searchable: true },
  { id: 'fnac', name: 'Fnac', icon: '📚', searchable: true },
  { id: 'rakuten', name: 'Rakuten', icon: '🔴', searchable: true },
]

// Simulated search results for demo (in production, this calls real APIs)
const simulateSearch = async (query: string, platform: typeof SUPPORTED_PLATFORMS[0]): Promise<SupplierResult | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700))
  
  // Random chance of no result
  if (Math.random() < 0.15) return null
  
  const basePrice = 5 + Math.random() * 50
  const shipping = Math.random() < 0.3 ? 0 : 2 + Math.random() * 10
  const rating = 3.5 + Math.random() * 1.5
  const reviews = Math.floor(100 + Math.random() * 10000)
  
  const availabilityOptions: SupplierResult['availability'][] = ['in_stock', 'in_stock', 'in_stock', 'low_stock', 'out_of_stock']
  const shippingTimes = ['3-7 days', '7-15 days', '15-30 days', '1-3 days', '5-10 days']
  
  const totalCost = basePrice + shipping
  const suggestedPrice = totalCost * 2.5
  const margin = ((suggestedPrice - totalCost) / suggestedPrice) * 100
  
  // Calculate score based on price, rating, shipping
  const priceScore = Math.max(0, 100 - basePrice * 2)
  const ratingScore = rating * 20
  const shippingScore = shipping === 0 ? 30 : Math.max(0, 30 - shipping * 2)
  const reviewScore = Math.min(20, reviews / 500)
  const score = (priceScore + ratingScore + shippingScore + reviewScore) / 4
  
  return {
    platform: platform.name,
    platformIcon: platform.icon,
    productTitle: `${query} - ${platform.name} Version`,
    price: parseFloat(basePrice.toFixed(2)),
    originalPrice: Math.random() > 0.5 ? parseFloat((basePrice * 1.3).toFixed(2)) : undefined,
    currency: platform.id === 'cdiscount' || platform.id === 'fnac' ? 'EUR' : 'USD',
    shipping: parseFloat(shipping.toFixed(2)),
    shippingTime: shippingTimes[Math.floor(Math.random() * shippingTimes.length)],
    availability: availabilityOptions[Math.floor(Math.random() * availabilityOptions.length)],
    rating: parseFloat(rating.toFixed(1)),
    reviews,
    seller: `${platform.name} Seller ${Math.floor(Math.random() * 1000)}`,
    sellerRating: parseFloat((85 + Math.random() * 15).toFixed(1)),
    productUrl: `https://${platform.id}.com/product/${Date.now()}`,
    imageUrl: `https://picsum.photos/seed/${platform.id}${Date.now()}/200/200`,
    variants: Math.floor(1 + Math.random() * 10),
    moq: platform.id === '1688' ? Math.floor(10 + Math.random() * 90) : 1,
    totalCost: parseFloat(totalCost.toFixed(2)),
    margin: parseFloat(margin.toFixed(1)),
    score: parseFloat(score.toFixed(1))
  }
}

export function useSearchAllSuppliers() {
  const [results, setResults] = useState<SupplierResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchProgress, setSearchProgress] = useState(0)
  const [platformsSearched, setPlatformsSearched] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const searchAllPlatforms = useCallback(async (
    query: string, 
    filters?: SearchFilters
  ) => {
    if (!query.trim()) {
      toast({
        title: "Requête vide",
        description: "Veuillez entrer un terme de recherche",
        variant: "destructive"
      })
      return
    }

    setIsSearching(true)
    setResults([])
    setSearchProgress(0)
    setPlatformsSearched([])
    setError(null)

    const platformsToSearch = filters?.platforms?.length 
      ? SUPPORTED_PLATFORMS.filter(p => filters.platforms?.includes(p.id))
      : SUPPORTED_PLATFORMS.filter(p => p.searchable)

    const allResults: SupplierResult[] = []

    try {
      // Search platforms in parallel batches for performance
      const batchSize = 5
      for (let i = 0; i < platformsToSearch.length; i += batchSize) {
        const batch = platformsToSearch.slice(i, i + batchSize)
        
        const batchResults = await Promise.all(
          batch.map(async (platform) => {
            const result = await simulateSearch(query, platform)
            setPlatformsSearched(prev => [...prev, platform.name])
            return result
          })
        )

        const validResults = batchResults.filter((r): r is SupplierResult => r !== null)
        
        // Apply filters
        const filteredResults = validResults.filter(r => {
          if (filters?.minPrice && r.price < filters.minPrice) return false
          if (filters?.maxPrice && r.price > filters.maxPrice) return false
          if (filters?.maxShipping && r.shipping > filters.maxShipping) return false
          if (filters?.minRating && r.rating < filters.minRating) return false
          if (filters?.inStockOnly && r.availability === 'out_of_stock') return false
          return true
        })

        allResults.push(...filteredResults)
        setResults([...allResults].sort((a, b) => b.score - a.score))
        setSearchProgress(Math.min(100, ((i + batchSize) / platformsToSearch.length) * 100))
      }

      setSearchProgress(100)
      
      toast({
        title: "Recherche terminée",
        description: `${allResults.length} résultats trouvés sur ${platformsToSearch.length} plateformes`
      })

    } catch (err) {
      console.error('Search error:', err)
      setError('Erreur lors de la recherche')
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la recherche",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }, [toast])

  const sortResults = useCallback((
    sortBy: 'price' | 'rating' | 'shipping' | 'score' | 'totalCost',
    order: 'asc' | 'desc' = 'asc'
  ) => {
    setResults(prev => {
      const sorted = [...prev].sort((a, b) => {
        const aVal = a[sortBy]
        const bVal = b[sortBy]
        return order === 'asc' ? aVal - bVal : bVal - aVal
      })
      return sorted
    })
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setSearchProgress(0)
    setPlatformsSearched([])
    setError(null)
  }, [])

  return {
    results,
    isSearching,
    searchProgress,
    platformsSearched,
    error,
    searchAllPlatforms,
    sortResults,
    clearResults,
    supportedPlatforms: SUPPORTED_PLATFORMS
  }
}
