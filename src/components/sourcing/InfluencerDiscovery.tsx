import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Influencer } from '@/types/adspy'
import {
  Search, Users, Eye, Heart, ShoppingBag, DollarSign, TrendingUp,
  CheckCircle2, Plus, ExternalLink, Play, Instagram, Youtube
} from 'lucide-react'

// Mock influencers data
const mockInfluencers: Influencer[] = [
  {
    id: '1',
    username: '@beautybyjess',
    displayName: 'Jessica Beauty',
    platform: 'tiktok',
    profileUrl: 'https://tiktok.com/@beautybyjess',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    followers: 2340000,
    avgViews: 450000,
    avgEngagement: 8.5,
    productsPromoted: 45,
    estimatedRevenue: 125000,
    conversionRate: 3.2,
    niches: ['Beauty', 'Skincare', 'Lifestyle'],
    country: 'US',
    language: 'en',
    influenceScore: 94,
    authenticity: 92,
    isVerified: true,
    isTracked: false,
    lastPost: '2024-12-10'
  },
  {
    id: '2',
    username: '@techreviewer_mike',
    displayName: 'Mike Tech Reviews',
    platform: 'youtube',
    profileUrl: 'https://youtube.com/@techreviewer_mike',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    followers: 890000,
    avgViews: 120000,
    avgEngagement: 6.2,
    productsPromoted: 78,
    estimatedRevenue: 89000,
    conversionRate: 4.1,
    niches: ['Tech', 'Gadgets', 'Reviews'],
    country: 'UK',
    language: 'en',
    influenceScore: 87,
    authenticity: 95,
    isVerified: true,
    isTracked: true,
    lastPost: '2024-12-11'
  },
  {
    id: '3',
    username: '@homestyle_emma',
    displayName: 'Emma Home Style',
    platform: 'instagram',
    profileUrl: 'https://instagram.com/@homestyle_emma',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    followers: 567000,
    avgViews: 89000,
    avgEngagement: 7.8,
    productsPromoted: 34,
    estimatedRevenue: 45000,
    conversionRate: 2.8,
    niches: ['Home Decor', 'DIY', 'Interior'],
    country: 'FR',
    language: 'fr',
    influenceScore: 82,
    authenticity: 88,
    isVerified: false,
    isTracked: false,
    lastPost: '2024-12-09'
  },
  {
    id: '4',
    username: '@fitlife_carlos',
    displayName: 'Carlos Fitness',
    platform: 'tiktok',
    profileUrl: 'https://tiktok.com/@fitlife_carlos',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    followers: 1200000,
    avgViews: 280000,
    avgEngagement: 9.1,
    productsPromoted: 56,
    estimatedRevenue: 78000,
    conversionRate: 3.8,
    niches: ['Fitness', 'Health', 'Supplements'],
    country: 'ES',
    language: 'es',
    influenceScore: 91,
    authenticity: 90,
    isVerified: true,
    isTracked: true,
    lastPost: '2024-12-12'
  }
]

const platformIcons: Record<string, any> = {
  tiktok: Play,
  instagram: Instagram,
  youtube: Youtube,
  facebook: Users
}

export function InfluencerDiscovery() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('')
  const [selectedNiche, setSelectedNiche] = useState<string>('')
  const [trackedInfluencers, setTrackedInfluencers] = useState<string[]>(['2', '4'])

  const toggleTrack = (id: string) => {
    setTrackedInfluencers(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 75) return 'text-yellow-500'
    return 'text-orange-500'
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'tiktok': return 'bg-gradient-to-r from-pink-500 to-violet-500'
      case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500'
      case 'youtube': return 'bg-red-500'
      default: return 'bg-blue-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockInfluencers.length}</p>
                <p className="text-xs text-muted-foreground">Influenceurs trouvés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Eye className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trackedInfluencers.length}</p>
                <p className="text-xs text-muted-foreground">En surveillance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <ShoppingBag className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">213</p>
                <p className="text-xs text-muted-foreground">Produits promus</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">8.2%</p>
                <p className="text-xs text-muted-foreground">Engagement moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, username, niche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Plateforme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedNiche} onValueChange={setSelectedNiche}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Niche" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes</SelectItem>
                <SelectItem value="beauty">Beauty</SelectItem>
                <SelectItem value="tech">Tech</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
                <SelectItem value="home">Home</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Influencers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockInfluencers.map(influencer => {
          const PlatformIcon = platformIcons[influencer.platform] || Users
          const isTracked = trackedInfluencers.includes(influencer.id)

          return (
            <Card key={influencer.id} className="overflow-hidden hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Avatar & Platform */}
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={influencer.avatarUrl} />
                      <AvatarFallback>{influencer.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${getPlatformColor(influencer.platform)}`}>
                      <PlatformIcon className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{influencer.displayName}</h3>
                          {influencer.isVerified && (
                            <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{influencer.username}</p>
                      </div>
                      <Button
                        variant={isTracked ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleTrack(influencer.id)}
                        className="flex-shrink-0"
                      >
                        {isTracked ? (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Suivi
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Suivre
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Niches */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {influencer.niches.map(niche => (
                        <Badge key={niche} variant="secondary" className="text-xs">
                          {niche}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-lg font-bold">{formatNumber(influencer.followers)}</p>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{formatNumber(influencer.avgViews)}</p>
                    <p className="text-xs text-muted-foreground">Vues moy.</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-500">{influencer.avgEngagement}%</p>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{influencer.productsPromoted}</p>
                    <p className="text-xs text-muted-foreground">Produits</p>
                  </div>
                </div>

                {/* Score Bars */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Influence Score</span>
                      <span className={`font-bold ${getScoreColor(influencer.influenceScore)}`}>
                        {influencer.influenceScore}%
                      </span>
                    </div>
                    <Progress value={influencer.influenceScore} className="h-2" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Authenticité</span>
                      <span className={`font-bold ${getScoreColor(influencer.authenticity)}`}>
                        {influencer.authenticity}%
                      </span>
                    </div>
                    <Progress value={influencer.authenticity} className="h-2" />
                  </div>
                </div>

                {/* Revenue & Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="font-medium">
                      ${influencer.estimatedRevenue?.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">rev. estimé</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Produits
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
