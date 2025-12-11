import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import type { Ad, TrendingProduct, Competitor, Influencer, AdSpyFilters, AdSpyStats } from '@/types/adspy'

// Demo data for development - will be replaced with real API calls
const DEMO_ADS: Ad[] = [
  {
    id: '1',
    platform: 'facebook',
    type: 'video',
    advertiser: 'TrendyShop FR',
    advertiserUrl: 'https://facebook.com/trendyshop',
    title: 'Ce gadget révolutionne votre sommeil 😴',
    description: 'Découvrez le masque LED anti-rides qui fait fureur sur TikTok...',
    mediaUrl: '/placeholder.svg',
    thumbnailUrl: '/placeholder.svg',
    cta: 'Shop Now',
    landingPageUrl: 'https://trendyshop.com/led-mask',
    likes: 45230,
    comments: 3420,
    shares: 8950,
    views: 1250000,
    engagementRate: 4.6,
    firstSeen: '2024-01-15',
    lastSeen: '2024-01-20',
    daysRunning: 35,
    country: 'FR',
    countries: ['FR', 'BE', 'CH'],
    winnerScore: 92,
    saturationLevel: 'medium',
    estimatedBudget: 15000,
    competitorCount: 23,
    productName: 'LED Face Mask Pro',
    productPrice: 49.99,
    productCategory: 'Beauté',
    aliexpressUrl: 'https://aliexpress.com/item/...',
    tags: ['beauty', 'skincare', 'led', 'viral'],
    niche: 'Skincare'
  },
  {
    id: '2',
    platform: 'tiktok',
    type: 'video',
    advertiser: 'GadgetWorld',
    title: 'POV: Tu découvres ce chargeur magnétique 🧲',
    mediaUrl: '/placeholder.svg',
    likes: 125000,
    comments: 8500,
    shares: 22000,
    views: 3500000,
    engagementRate: 4.4,
    firstSeen: '2024-01-10',
    lastSeen: '2024-01-22',
    daysRunning: 42,
    country: 'US',
    countries: ['US', 'CA', 'UK', 'AU'],
    winnerScore: 95,
    saturationLevel: 'low',
    estimatedBudget: 25000,
    competitorCount: 12,
    productName: 'MagSafe Charger 3-in-1',
    productPrice: 34.99,
    productCategory: 'Électronique',
    tags: ['tech', 'charger', 'gadget', 'iphone'],
    niche: 'Tech Accessories'
  },
  {
    id: '3',
    platform: 'instagram',
    type: 'carousel',
    advertiser: 'HomeVibes',
    title: 'Transform your space in seconds ✨',
    mediaUrl: '/placeholder.svg',
    likes: 67890,
    comments: 2340,
    shares: 5670,
    engagementRate: 3.8,
    firstSeen: '2024-01-18',
    lastSeen: '2024-01-22',
    daysRunning: 12,
    country: 'UK',
    winnerScore: 78,
    saturationLevel: 'high',
    competitorCount: 45,
    productName: 'Galaxy Projector Light',
    productPrice: 29.99,
    productCategory: 'Décoration',
    tags: ['home', 'decor', 'led', 'aesthetic'],
    niche: 'Home Decor'
  },
  {
    id: '4',
    platform: 'pinterest',
    type: 'image',
    advertiser: 'StyleCraft',
    title: 'The bag everyone is talking about',
    mediaUrl: '/placeholder.svg',
    likes: 34500,
    comments: 890,
    shares: 12300,
    engagementRate: 5.2,
    firstSeen: '2024-01-05',
    lastSeen: '2024-01-22',
    daysRunning: 47,
    country: 'FR',
    winnerScore: 88,
    saturationLevel: 'medium',
    competitorCount: 34,
    productName: 'Minimalist Crossbody Bag',
    productPrice: 24.99,
    productCategory: 'Mode',
    tags: ['fashion', 'bag', 'minimalist', 'trendy'],
    niche: 'Fashion Accessories'
  },
  {
    id: '5',
    platform: 'facebook',
    type: 'video',
    advertiser: 'FitLife Pro',
    title: 'Perdez du poids sans effort avec cet appareil',
    mediaUrl: '/placeholder.svg',
    likes: 89000,
    comments: 5600,
    shares: 15000,
    views: 2100000,
    engagementRate: 5.2,
    firstSeen: '2024-01-12',
    lastSeen: '2024-01-22',
    daysRunning: 28,
    country: 'FR',
    winnerScore: 91,
    saturationLevel: 'low',
    estimatedBudget: 18000,
    competitorCount: 8,
    productName: 'EMS Muscle Stimulator',
    productPrice: 39.99,
    productCategory: 'Sport',
    tags: ['fitness', 'weight-loss', 'ems', 'health'],
    niche: 'Fitness'
  }
]

const DEMO_TRENDING: TrendingProduct[] = [
  {
    id: '1',
    name: 'Lampe Sunset Projection LED',
    image: '/placeholder.svg',
    price: 12.99,
    originalPrice: 29.99,
    currency: 'EUR',
    supplier: 'AliExpress',
    supplierUrl: 'https://aliexpress.com/item/...',
    platforms: ['tiktok', 'instagram', 'facebook'],
    primaryPlatform: 'tiktok',
    trendScore: 96,
    viralScore: 92,
    saturationScore: 35,
    profitPotential: 78,
    estimatedSales: 45000,
    salesGrowth: 234,
    revenueEstimate: 584550,
    adCount: 847,
    competitorCount: 23,
    averagePrice: 24.99,
    priceRange: { min: 15.99, max: 39.99 },
    category: 'Décoration',
    niche: 'Aesthetic Home',
    tags: ['viral', 'tiktok', 'aesthetic', 'led', 'room-decor'],
    firstDetected: '2024-01-05',
    lastUpdated: '2024-01-22',
    aiRecommendation: 'import',
    riskLevel: 'low'
  },
  {
    id: '2',
    name: 'Organisateur Cables Magnétique',
    image: '/placeholder.svg',
    price: 8.49,
    currency: 'EUR',
    supplier: 'CJ Dropshipping',
    platforms: ['facebook', 'instagram'],
    primaryPlatform: 'facebook',
    trendScore: 87,
    viralScore: 78,
    saturationScore: 55,
    profitPotential: 65,
    estimatedSales: 28000,
    salesGrowth: 156,
    revenueEstimate: 237720,
    adCount: 412,
    competitorCount: 45,
    averagePrice: 14.99,
    priceRange: { min: 9.99, max: 24.99 },
    category: 'Bureau',
    niche: 'Office Organization',
    tags: ['office', 'organisation', 'tech', 'cable-management'],
    firstDetected: '2024-01-10',
    lastUpdated: '2024-01-22',
    aiRecommendation: 'watch',
    riskLevel: 'medium'
  },
  {
    id: '3',
    name: 'Mini Aspirateur Clavier USB',
    image: '/placeholder.svg',
    price: 15.99,
    originalPrice: 34.99,
    currency: 'EUR',
    supplier: 'BigBuy',
    platforms: ['instagram', 'pinterest'],
    primaryPlatform: 'instagram',
    trendScore: 82,
    viralScore: 75,
    saturationScore: 40,
    profitPotential: 72,
    estimatedSales: 18500,
    salesGrowth: 89,
    revenueEstimate: 295815,
    adCount: 256,
    competitorCount: 67,
    averagePrice: 22.99,
    priceRange: { min: 12.99, max: 39.99 },
    category: 'Électronique',
    niche: 'Tech Gadgets',
    tags: ['gadget', 'clean', 'useful', 'tech'],
    firstDetected: '2024-01-08',
    lastUpdated: '2024-01-22',
    aiRecommendation: 'import',
    riskLevel: 'low'
  }
]

const DEMO_COMPETITORS: Competitor[] = [
  {
    id: '1',
    name: 'TrendyStore FR',
    domain: 'trendystore.fr',
    platform: 'shopify',
    country: 'FR',
    estimatedRevenue: 450000,
    estimatedOrders: 12500,
    productCount: 234,
    averagePrice: 29.99,
    adsRunning: 45,
    totalAdsDetected: 380,
    trafficEstimate: 125000,
    socialFollowers: {
      facebook: 45000,
      instagram: 89000,
      tiktok: 230000
    },
    competitionScore: 85,
    threatLevel: 'high',
    isTracked: true,
    trackedSince: '2024-01-01',
    lastChecked: '2024-01-22'
  },
  {
    id: '2',
    name: 'GadgetWorld EU',
    domain: 'gadgetworld.eu',
    platform: 'woocommerce',
    country: 'DE',
    estimatedRevenue: 280000,
    estimatedOrders: 8900,
    productCount: 567,
    averagePrice: 24.99,
    adsRunning: 23,
    totalAdsDetected: 156,
    competitionScore: 72,
    threatLevel: 'medium',
    isTracked: false,
    lastChecked: '2024-01-22'
  }
]

const DEMO_INFLUENCERS: Influencer[] = [
  {
    id: '1',
    username: '@tiktok_reviews',
    displayName: 'Product Reviews',
    platform: 'tiktok',
    profileUrl: 'https://tiktok.com/@tiktok_reviews',
    avatarUrl: '/placeholder.svg',
    followers: 2400000,
    avgViews: 850000,
    avgEngagement: 6.8,
    productsPromoted: 145,
    estimatedRevenue: 85000,
    niches: ['tech', 'gadgets', 'lifestyle'],
    country: 'US',
    influenceScore: 92,
    authenticity: 87,
    isVerified: true,
    isTracked: true
  },
  {
    id: '2',
    username: '@beauty_finds',
    displayName: 'Beauty Finds Daily',
    platform: 'instagram',
    profileUrl: 'https://instagram.com/beauty_finds',
    avatarUrl: '/placeholder.svg',
    followers: 890000,
    avgViews: 120000,
    avgEngagement: 4.2,
    productsPromoted: 78,
    niches: ['beauty', 'skincare', 'makeup'],
    country: 'UK',
    influenceScore: 78,
    authenticity: 92,
    isVerified: true,
    isTracked: false
  }
]

export function useAdSpy() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [ads, setAds] = useState<Ad[]>(DEMO_ADS)
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>(DEMO_TRENDING)
  const [competitors, setCompetitors] = useState<Competitor[]>(DEMO_COMPETITORS)
  const [influencers, setInfluencers] = useState<Influencer[]>(DEMO_INFLUENCERS)
  const [stats, setStats] = useState<AdSpyStats>({
    totalAdsAnalyzed: 125847,
    totalProducts: 8934,
    totalCompetitors: 2341,
    averageWinnerScore: 76,
    topPlatform: 'TikTok',
    topCategory: 'Décoration',
    trendingNiches: [
      { name: 'Aesthetic Home', count: 3420, growth: 156 },
      { name: 'Tech Gadgets', count: 2890, growth: 89 },
      { name: 'Beauty & Skincare', count: 2340, growth: 124 },
      { name: 'Fitness', count: 1890, growth: 67 },
      { name: 'Pet Products', count: 1560, growth: 234 }
    ],
    recentActivity: [
      { date: '2024-01-22', adsFound: 1234, productsDetected: 89 },
      { date: '2024-01-21', adsFound: 1456, productsDetected: 102 },
      { date: '2024-01-20', adsFound: 987, productsDetected: 67 }
    ]
  })

  const searchAds = useCallback(async (filters: AdSpyFilters) => {
    setIsLoading(true)
    try {
      // TODO: Replace with real API call
      await new Promise(r => setTimeout(r, 1000))
      
      let filtered = [...DEMO_ADS]
      
      if (filters.platforms?.length) {
        filtered = filtered.filter(ad => filters.platforms!.includes(ad.platform))
      }
      if (filters.countries?.length) {
        filtered = filtered.filter(ad => filters.countries!.includes(ad.country))
      }
      if (filters.minEngagement) {
        filtered = filtered.filter(ad => ad.engagementRate >= filters.minEngagement!)
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        filtered = filtered.filter(ad => 
          ad.title.toLowerCase().includes(query) ||
          ad.advertiser.toLowerCase().includes(query) ||
          ad.tags.some(t => t.toLowerCase().includes(query))
        )
      }
      
      setAds(filtered)
      toast({ title: 'Recherche terminée', description: `${filtered.length} publicités trouvées` })
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de rechercher les publicités', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const searchTrendingProducts = useCallback(async (filters: AdSpyFilters) => {
    setIsLoading(true)
    try {
      await new Promise(r => setTimeout(r, 1000))
      setTrendingProducts(DEMO_TRENDING)
      toast({ title: 'Produits tendance chargés' })
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const analyzeCompetitor = useCallback(async (domain: string) => {
    setIsLoading(true)
    try {
      await new Promise(r => setTimeout(r, 2000))
      toast({ title: 'Analyse terminée', description: `Concurrent ${domain} analysé avec succès` })
      return DEMO_COMPETITORS[0]
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const trackCompetitor = useCallback(async (competitorId: string) => {
    try {
      setCompetitors(prev => prev.map(c => 
        c.id === competitorId ? { ...c, isTracked: !c.isTracked } : c
      ))
      toast({ title: 'Suivi mis à jour' })
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }, [toast])

  const importProduct = useCallback(async (product: TrendingProduct) => {
    setIsLoading(true)
    try {
      // TODO: Implement real import to catalog
      await new Promise(r => setTimeout(r, 1500))
      toast({ 
        title: 'Produit importé', 
        description: `${product.name} ajouté à votre catalogue`
      })
    } catch (error) {
      toast({ title: 'Erreur d\'import', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const exportData = useCallback(async (type: 'ads' | 'products' | 'competitors') => {
    try {
      const data = type === 'ads' ? ads : type === 'products' ? trendingProducts : competitors
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `adspy-${type}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      toast({ title: 'Export réussi' })
    } catch (error) {
      toast({ title: 'Erreur d\'export', variant: 'destructive' })
    }
  }, [ads, trendingProducts, competitors, toast])

  return {
    isLoading,
    ads,
    trendingProducts,
    competitors,
    influencers,
    stats,
    searchAds,
    searchTrendingProducts,
    analyzeCompetitor,
    trackCompetitor,
    importProduct,
    exportData
  }
}
