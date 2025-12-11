import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdSpy } from '@/hooks/useAdSpy'
import {
  Search, Users, Star, TrendingUp, Eye, Heart,
  ExternalLink, CheckCircle, Bell, BellOff, Filter, Sparkles
} from 'lucide-react'

const PLATFORMS = ['Tous', 'TikTok', 'Instagram', 'YouTube', 'Facebook']
const NICHES = ['Tous', 'Tech', 'Beauty', 'Fashion', 'Fitness', 'Lifestyle', 'Food', 'Gaming']

export function InfluencerFinder() {
  const { influencers } = useAdSpy()
  const [searchQuery, setSearchQuery] = useState('')
  const [platform, setPlatform] = useState('Tous')
  const [niche, setNiche] = useState('Tous')
  const [trackedInfluencers, setTrackedInfluencers] = useState<Set<string>>(new Set())

  const toggleTrack = (id: string) => {
    setTrackedInfluencers(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'tiktok': return 'bg-black text-white'
      case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      case 'youtube': return 'bg-red-500 text-white'
      case 'facebook': return 'bg-blue-600 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K'
    return num.toString()
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recherche d'Influenceurs E-commerce
          </CardTitle>
          <CardDescription>
            Trouvez les influenceurs qui promeuvent des produits dropshipping et e-commerce
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, niche, hashtag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={niche} onValueChange={setNiche}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NICHES.map(n => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{influencers.length}</p>
              <p className="text-xs text-muted-foreground">Influenceurs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-500/10">
              <Heart className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatNumber(influencers.reduce((sum, i) => sum + i.followers, 0))}
              </p>
              <p className="text-xs text-muted-foreground">Reach total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(influencers.reduce((sum, i) => sum + i.avgEngagement, 0) / influencers.length).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Engagement moy.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{trackedInfluencers.size}</p>
              <p className="text-xs text-muted-foreground">Suivis</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Influencers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {influencers.map(influencer => (
          <Card key={influencer.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={influencer.avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {influencer.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{influencer.displayName}</h3>
                    {influencer.isVerified && (
                      <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <a 
                    href={influencer.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {influencer.username}
                  </a>
                  <Badge className={`mt-2 ${getPlatformColor(influencer.platform)}`}>
                    {influencer.platform}
                  </Badge>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold">{formatNumber(influencer.followers)}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold">{formatNumber(influencer.avgViews)}</p>
                  <p className="text-xs text-muted-foreground">Vues moy.</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold">{influencer.avgEngagement}%</p>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                </div>
              </div>

              {/* Scores */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Score d'influence</span>
                  <span className="font-bold">{influencer.influenceScore}%</span>
                </div>
                <Progress value={influencer.influenceScore} className="h-2" />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Authenticité</span>
                  <span className="font-bold">{influencer.authenticity}%</span>
                </div>
                <Progress value={influencer.authenticity} className="h-2" />
              </div>

              {/* E-commerce Activity */}
              <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Produits promus</span>
                  <span className="font-bold">{influencer.productsPromoted}</span>
                </div>
                {influencer.estimatedRevenue && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-muted-foreground">CA estimé</span>
                    <span className="font-bold text-green-500">
                      {formatNumber(influencer.estimatedRevenue)}€
                    </span>
                  </div>
                )}
              </div>

              {/* Niches */}
              <div className="flex flex-wrap gap-1 mt-4">
                {influencer.niches.map(nicheItem => (
                  <Badge key={nicheItem} variant="outline" className="text-xs">
                    {nicheItem}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button 
                  variant={trackedInfluencers.has(influencer.id) ? 'outline' : 'default'}
                  className="flex-1"
                  onClick={() => toggleTrack(influencer.id)}
                >
                  {trackedInfluencers.has(influencer.id) ? (
                    <>
                      <BellOff className="h-4 w-4 mr-2" />
                      Suivi
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4 mr-2" />
                      Suivre
                    </>
                  )}
                </Button>
                <Button variant="outline" asChild>
                  <a href={influencer.profileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
