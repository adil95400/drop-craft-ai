import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Ad } from '@/types/adspy'
import {
  Search, Filter, Play, Heart, MessageCircle, Share2, Eye,
  Calendar, Globe, DollarSign, TrendingUp, ExternalLink, Bookmark,
  Video, Image, Layers, Facebook, Instagram, Youtube
} from 'lucide-react'

interface AdLibraryProps {
  onAdSelect?: (ad: Ad) => void
}

// Mock ads data - Minea style
const mockAds: Ad[] = [
  {
    id: '1',
    platform: 'facebook',
    type: 'video',
    advertiser: 'TechGadgets Store',
    advertiserUrl: 'https://techgadgets.com',
    title: 'Revolutionary LED Strip Lights - Transform Your Room!',
    description: 'Smart RGB LED lights with app control. 16M colors, music sync.',
    mediaUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
    cta: 'Shop Now',
    landingPageUrl: 'https://example.com/led-lights',
    likes: 12500,
    comments: 890,
    shares: 2340,
    views: 456000,
    engagementRate: 4.2,
    firstSeen: '2024-11-01',
    lastSeen: '2024-12-10',
    daysRunning: 40,
    country: 'US',
    countries: ['US', 'CA', 'UK', 'AU'],
    winnerScore: 92,
    saturationLevel: 'medium',
    estimatedBudget: 15000,
    competitorCount: 45,
    productCategory: 'Home Decor',
    tags: ['led', 'lights', 'home decor', 'smart home']
  },
  {
    id: '2',
    platform: 'tiktok',
    type: 'video',
    advertiser: 'BeautyBox Pro',
    title: 'Ice Roller Face Massager - Get That Glow!',
    description: 'Reduce puffiness, tighten pores. 100% natural skincare.',
    mediaUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
    likes: 89000,
    comments: 5600,
    shares: 12000,
    views: 2100000,
    engagementRate: 5.8,
    firstSeen: '2024-10-15',
    lastSeen: '2024-12-12',
    daysRunning: 58,
    country: 'US',
    winnerScore: 96,
    saturationLevel: 'low',
    estimatedBudget: 45000,
    competitorCount: 23,
    tags: ['beauty', 'skincare', 'viral', 'tiktok made me buy it']
  },
  {
    id: '3',
    platform: 'instagram',
    type: 'carousel',
    advertiser: 'FitLife Essentials',
    title: 'Portable Blender - Smoothies Anywhere!',
    description: 'USB rechargeable, 6 blades, 380ml. Perfect for gym & travel.',
    mediaUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400',
    likes: 34000,
    comments: 1200,
    shares: 4500,
    views: 890000,
    engagementRate: 4.5,
    firstSeen: '2024-11-20',
    lastSeen: '2024-12-11',
    daysRunning: 21,
    country: 'UK',
    winnerScore: 88,
    saturationLevel: 'medium',
    estimatedBudget: 8000,
    competitorCount: 67,
    tags: ['fitness', 'health', 'kitchen', 'portable']
  }
]

const platforms = [
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-500' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'tiktok', label: 'TikTok', icon: Play, color: 'text-foreground' },
  { id: 'pinterest', label: 'Pinterest', icon: Image, color: 'text-red-500' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600' }
]

const countries = [
  { code: 'US', name: 'États-Unis', flag: '🇺🇸' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'UK', name: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australie', flag: '🇦🇺' }
]

export function AdLibrary({ onAdSelect }: AdLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [engagementRange, setEngagementRange] = useState([0, 100])
  const [daysRange, setDaysRange] = useState([1, 90])
  const [adType, setAdType] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [savedAds, setSavedAds] = useState<string[]>([])

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    )
  }

  const toggleSaveAd = (adId: string) => {
    setSavedAds(prev =>
      prev.includes(adId)
        ? prev.filter(id => id !== adId)
        : [...prev, adId]
    )
  }

  const getWinnerBadge = (score: number) => {
    if (score >= 90) return { label: '🔥 Winner', className: 'bg-gradient-to-r from-orange-500 to-red-500 text-white' }
    if (score >= 75) return { label: '⭐ Top Performer', className: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' }
    if (score >= 60) return { label: '📈 Rising', className: 'bg-blue-500/20 text-blue-500' }
    return { label: '📊 Standard', className: 'bg-muted text-muted-foreground' }
  }

  const getSaturationColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-500 bg-green-500/10'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10'
      case 'high': return 'text-orange-500 bg-orange-500/10'
      case 'saturated': return 'text-red-500 bg-red-500/10'
      default: return 'text-muted-foreground bg-muted'
    }
  }

  const getPlatformIcon = (platform: string) => {
    const p = platforms.find(pl => pl.id === platform)
    if (!p) return null
    const Icon = p.icon
    return <Icon className={`h-4 w-4 ${p.color}`} />
  }

  return (
    <div className="space-y-6">
      {/* Search & Quick Filters */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des pubs... (mot-clé, annonceur, produit)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {platforms.map(platform => {
                const Icon = platform.icon
                return (
                  <Button
                    key={platform.id}
                    variant={selectedPlatforms.includes(platform.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => togglePlatform(platform.id)}
                    className="gap-2"
                  >
                    <Icon className={`h-4 w-4 ${platform.color}`} />
                    <span className="hidden md:inline">{platform.label}</span>
                  </Button>
                )
              })}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtres
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pays</label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les pays</SelectItem>
                    {countries.map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type de pub</label>
                <Select value={adType} onValueChange={setAdType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous types</SelectItem>
                    <SelectItem value="video">Vidéo</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="carousel">Carrousel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Engagement: {engagementRange[0]}% - {engagementRange[1]}%
                </label>
                <Slider
                  value={engagementRange}
                  onValueChange={setEngagementRange}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Durée: {daysRange[0]} - {daysRange[1]} jours
                </label>
                <Slider
                  value={daysRange}
                  onValueChange={setDaysRange}
                  min={1}
                  max={90}
                  step={1}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Stats */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">{mockAds.length}</span> publicités trouvées
        </p>
        <div className="flex gap-2">
          <Select defaultValue="score">
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Score (élevé → bas)</SelectItem>
              <SelectItem value="engagement">Engagement</SelectItem>
              <SelectItem value="recent">Plus récentes</SelectItem>
              <SelectItem value="duration">Durée de diffusion</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockAds.map(ad => {
          const winnerBadge = getWinnerBadge(ad.winnerScore)
          const isSaved = savedAds.includes(ad.id)
          
          return (
            <Card 
              key={ad.id} 
              className="overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
              onClick={() => onAdSelect?.(ad)}
            >
              {/* Media Preview */}
              <div className="relative aspect-video bg-muted">
                <img
                  src={ad.mediaUrl || ad.thumbnailUrl}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {getPlatformIcon(ad.platform)}
                  <Badge variant="secondary" className="text-xs">
                    {ad.type === 'video' ? <Video className="h-3 w-3" /> : 
                     ad.type === 'carousel' ? <Layers className="h-3 w-3" /> : 
                     <Image className="h-3 w-3" />}
                  </Badge>
                </div>
                
                <div className="absolute top-2 right-2">
                  <Badge className={winnerBadge.className}>
                    {winnerBadge.label}
                  </Badge>
                </div>

                {ad.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <div className="p-3 rounded-full bg-white/90">
                      <Play className="h-6 w-6 text-foreground" />
                    </div>
                  </div>
                )}

                {/* Save button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute bottom-2 right-2 ${isSaved ? 'text-primary' : 'text-white'}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSaveAd(ad.id)
                  }}
                >
                  <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                </Button>
              </div>

              <CardContent className="p-4 space-y-3">
                {/* Advertiser */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground truncate">
                    {ad.advertiser}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {ad.country}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-sm line-clamp-2">{ad.title}</h3>

                {/* Engagement Stats */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span>{(ad.likes / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-blue-500" />
                    <span>{(ad.comments / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="h-3 w-3 text-green-500" />
                    <span>{(ad.shares / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-purple-500" />
                    <span>{ad.views ? (ad.views / 1000000).toFixed(1) + 'M' : 'N/A'}</span>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="flex items-center justify-between text-xs pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{ad.daysRunning}j actif</span>
                  </div>
                  <Badge className={getSaturationColor(ad.saturationLevel)}>
                    Saturation: {ad.saturationLevel}
                  </Badge>
                </div>

                {/* Winner Score Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Winner Score</span>
                    <span className="font-bold">{ad.winnerScore}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                      style={{ width: `${ad.winnerScore}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">
                    Analyser
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
