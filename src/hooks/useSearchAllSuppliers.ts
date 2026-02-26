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
  moq?: number
  totalCost: number
  margin?: number
  score: number
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

// Extract price from text using regex
function extractPrice(text: string): number | null {
  // Match patterns like $12.99, €15,50, 12.99$, 15,50€, US $12.99
  const patterns = [
    /(?:US\s*)?\$\s*([\d,]+\.?\d*)/i,
    /€\s*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*(?:\$|€|USD|EUR)/i,
    /(?:price|prix)[:\s]*([\d,]+\.?\d*)/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return parseFloat(match[1].replace(',', '.'))
    }
  }
  return null
}

// Extract rating from text
function extractRating(text: string): number {
  const match = text.match(/([\d.]+)\s*(?:\/\s*5|out of 5|stars?|étoiles?|⭐)/i)
  if (match) {
    const val = parseFloat(match[1])
    if (val > 0 && val <= 5) return val
  }
  return 4.0
}

// Extract review count
function extractReviews(text: string): number {
  const match = text.match(/([\d,]+)\s*(?:reviews?|avis|évaluations?|ratings?|commentaires?)/i)
  if (match) return parseInt(match[1].replace(/,/g, ''))
  return 0
}

// Detect platform from URL
function detectPlatform(url: string): { name: string; icon: string } | null {
  const urlLower = url.toLowerCase()
  for (const p of SUPPORTED_PLATFORMS) {
    if (urlLower.includes(p.id) || urlLower.includes(p.name.toLowerCase())) {
      return { name: p.name, icon: p.icon }
    }
  }
  return null
}

// Extract image from metadata or markdown
function extractImage(item: any): string {
  if (item.metadata?.ogImage) return item.metadata.ogImage
  if (item.metadata?.image) return item.metadata.image
  // Try to find image in markdown
  const imgMatch = item.markdown?.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/)
  if (imgMatch) return imgMatch[1]
  return ''
}

function parseFirecrawlResult(item: any, query: string): SupplierResult | null {
  const url = item.url || ''
  const title = item.title || item.metadata?.title || query
  const description = item.description || item.metadata?.description || ''
  const markdown = item.markdown || ''
  const fullText = `${title} ${description} ${markdown}`

  const platform = detectPlatform(url)
  if (!platform) return null // Skip non-marketplace results

  const price = extractPrice(fullText)
  if (!price || price <= 0) return null // Skip results without a price

  const rating = extractRating(fullText)
  const reviews = extractReviews(fullText)
  const imageUrl = extractImage(item)
  const shipping = 0
  const totalCost = price + shipping
  const suggestedPrice = totalCost * 2.5
  const margin = ((suggestedPrice - totalCost) / suggestedPrice) * 100

  // Score: rating + reviews + price competitiveness
  const ratingScore = rating * 20
  const reviewScore = Math.min(20, reviews / 500)
  const priceScore = Math.max(0, 100 - price * 2)
  const score = (ratingScore + reviewScore + priceScore) / 3

  return {
    platform: platform.name,
    platformIcon: platform.icon,
    productTitle: title.slice(0, 120),
    price: parseFloat(price.toFixed(2)),
    currency: url.includes('cdiscount') || url.includes('fnac') ? 'EUR' : 'USD',
    shipping,
    shippingTime: 'Voir sur le site',
    availability: 'in_stock',
    rating: parseFloat(rating.toFixed(1)),
    reviews,
    seller: platform.name,
    productUrl: url,
    imageUrl,
    totalCost: parseFloat(totalCost.toFixed(2)),
    margin: parseFloat(margin.toFixed(1)),
    score: parseFloat(score.toFixed(1)),
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

    // Build platform-specific search queries
    const platformsToSearch = filters?.platforms?.length
      ? SUPPORTED_PLATFORMS.filter(p => filters.platforms?.includes(p.id))
      : SUPPORTED_PLATFORMS.filter(p => p.searchable)

    const allResults: SupplierResult[] = []

    try {
      // Search in batches of platforms using Firecrawl web search
      const batchSize = 4
      for (let i = 0; i < platformsToSearch.length; i += batchSize) {
        const batch = platformsToSearch.slice(i, i + batchSize)

        const batchPromises = batch.map(async (platform) => {
          try {
            const searchQuery = `${query} site:${platform.id === '1688' ? '1688.com' : platform.id === 'cj' ? 'cjdropshipping.com' : `${platform.id}.com`}`

            const { data, error: fnError } = await supabase.functions.invoke('firecrawl-search', {
              body: {
                query: searchQuery,
                options: {
                  limit: 5,
                  lang: 'fr',
                  country: 'fr',
                  scrapeOptions: { formats: ['markdown'] },
                },
              },
            })

            setPlatformsSearched(prev => [...prev, platform.name])

            if (fnError || !data?.success) {
              console.warn(`Search failed for ${platform.name}:`, fnError || data?.error)
              return []
            }

            const items = data?.data || []
            const parsed = items
              .map((item: any) => parseFirecrawlResult(item, query))
              .filter((r: SupplierResult | null): r is SupplierResult => r !== null)

            // Force correct platform if detection was wrong
            return parsed.map((r: SupplierResult) => ({
              ...r,
              platform: platform.name,
              platformIcon: platform.icon,
            }))
          } catch (err) {
            console.warn(`Error searching ${platform.name}:`, err)
            setPlatformsSearched(prev => [...prev, platform.name])
            return []
          }
        })

        const batchResults = await Promise.all(batchPromises)
        const flatResults = batchResults.flat()

        // Apply filters
        const filteredResults = flatResults.filter(r => {
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
        description: `${allResults.length} résultats réels trouvés sur ${platformsToSearch.length} plateformes`
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
