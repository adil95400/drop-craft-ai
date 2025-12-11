import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAdSpy } from '@/hooks/useAdSpy'
import { 
  Search, Filter, Play, Heart, ExternalLink, Download,
  Calendar, Eye, ThumbsUp, MessageCircle, Share2, Loader2,
  TrendingUp, Target, Globe, Clock
} from 'lucide-react'

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', color: 'bg-blue-500' },
  { id: 'tiktok', name: 'TikTok', color: 'bg-black' },
  { id: 'instagram', name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'pinterest', name: 'Pinterest', color: 'bg-red-500' },
  { id: 'google', name: 'Google', color: 'bg-green-500' },
  { id: 'snapchat', name: 'Snapchat', color: 'bg-yellow-400' }
]

const COUNTRIES = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸' },
  { code: 'UK', name: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australie', flag: '🇦🇺' }
]

export function AdLibrary() {
  const { ads, searchAds, isLoading } = useAdSpy()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [minEngagement, setMinEngagement] = useState([0])
  const [sortBy, setSortBy] = useState('engagement')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const handleSearch = () => {
    searchAds({
      searchQuery,
      platforms: selectedPlatforms.length ? selectedPlatforms : undefined,
      countries: selectedCountries.length ? selectedCountries : undefined,
      minEngagement: minEngagement[0],
      sortBy: sortBy as any
    })
  }

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev => 
      prev.includes(country) 
        ? prev.filter(c => c !== country)
        : [...prev, country]
    )
  }

  const getPlatformBadgeClass = (platform: string) => {
    const p = PLATFORMS.find(pl => pl.id === platform)
    return p?.color || 'bg-gray-500'
  }

  const getSaturationColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-500 bg-green-500/10'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10'
      case 'high': return 'text-orange-500 bg-orange-500/10'
      case 'saturated': return 'text-red-500 bg-red-500/10'
      default: return 'text-gray-500 bg-gray-500/10'
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par mot-clé, produit, niche, annonceur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>

            {/* Platform Pills */}
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.slice(0, 4).map(platform => (
                <Button
                  key={platform.id}
                  variant={selectedPlatforms.includes(platform.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => togglePlatform(platform.id)}
                  className="h-8"
                >
                  {platform.name}
                </Button>
              ))}
            </div>

            {/* Advanced Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtres Avancés</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  {/* Platforms */}
                  <div className="space-y-3">
                    <Label>Plateformes</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {PLATFORMS.map(platform => (
                        <div key={platform.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={platform.id}
                            checked={selectedPlatforms.includes(platform.id)}
                            onCheckedChange={() => togglePlatform(platform.id)}
                          />
                          <Label htmlFor={platform.id} className="text-sm cursor-pointer">
                            {platform.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Countries */}
                  <div className="space-y-3">
                    <Label>Pays</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {COUNTRIES.map(country => (
                        <div key={country.code} className="flex items-center space-x-2">
                          <Checkbox
                            id={country.code}
                            checked={selectedCountries.includes(country.code)}
                            onCheckedChange={() => toggleCountry(country.code)}
                          />
                          <Label htmlFor={country.code} className="text-sm cursor-pointer">
                            {country.flag} {country.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Engagement */}
                  <div className="space-y-3">
                    <Label>Engagement minimum: {minEngagement}%</Label>
                    <Slider
                      value={minEngagement}
                      onValueChange={setMinEngagement}
                      max={10}
                      step={0.5}
                    />
                  </div>

                  {/* Sort */}
                  <div className="space-y-3">
                    <Label>Trier par</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="score">Score Winner</SelectItem>
                        <SelectItem value="views">Vues</SelectItem>
                        <SelectItem value="likes">Likes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleSearch} className="w-full">
                    Appliquer les filtres
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {ads.length} publicités trouvées
        </p>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="engagement">Engagement</SelectItem>
            <SelectItem value="date">Plus récent</SelectItem>
            <SelectItem value="score">Score</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ads.map(ad => (
          <Card key={ad.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
            {/* Media Preview */}
            <div className="relative aspect-video bg-muted">
              <img 
                src={ad.mediaUrl || ad.thumbnailUrl} 
                alt={ad.title}
                className="w-full h-full object-cover"
              />
              {ad.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="secondary" className="rounded-full">
                    <Play className="h-6 w-6" />
                  </Button>
                </div>
              )}
              
              {/* Platform Badge */}
              <Badge className={`absolute top-2 left-2 ${getPlatformBadgeClass(ad.platform)}`}>
                {ad.platform}
              </Badge>
              
              {/* Winner Score */}
              <Badge 
                className={`absolute top-2 right-2 ${
                  ad.winnerScore >= 85 ? 'bg-green-500' : 
                  ad.winnerScore >= 70 ? 'bg-yellow-500' : 'bg-gray-500'
                }`}
              >
                🏆 {ad.winnerScore}
              </Badge>

              {/* Favorite */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-2 right-2 bg-background/80 hover:bg-background"
                onClick={() => toggleFavorite(ad.id)}
              >
                <Heart className={`h-4 w-4 ${favorites.has(ad.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Advertiser */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{ad.advertiser}</span>
                <Badge variant="outline" className={getSaturationColor(ad.saturationLevel)}>
                  {ad.saturationLevel}
                </Badge>
              </div>

              {/* Title */}
              <h3 className="font-semibold line-clamp-2">{ad.title}</h3>

              {/* Metrics Row */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="flex flex-col items-center p-2 bg-muted/50 rounded">
                  <ThumbsUp className="h-3 w-3 mb-1" />
                  <span className="font-medium">{(ad.likes / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted/50 rounded">
                  <MessageCircle className="h-3 w-3 mb-1" />
                  <span className="font-medium">{(ad.comments / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted/50 rounded">
                  <Share2 className="h-3 w-3 mb-1" />
                  <span className="font-medium">{(ad.shares / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted/50 rounded">
                  <TrendingUp className="h-3 w-3 mb-1" />
                  <span className="font-medium">{ad.engagementRate}%</span>
                </div>
              </div>

              {/* Info Row */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span>{COUNTRIES.find(c => c.code === ad.country)?.flag} {ad.country}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{ad.daysRunning}j actif</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  <span>{ad.competitorCount} concurrents</span>
                </div>
              </div>

              {/* Product Info */}
              {ad.productName && (
                <div className="p-2 bg-primary/5 rounded-lg">
                  <p className="text-sm font-medium">{ad.productName}</p>
                  {ad.productPrice && (
                    <p className="text-xs text-primary font-bold">{ad.productPrice}€</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1">
                  <Download className="h-3 w-3 mr-1" />
                  Importer
                </Button>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
