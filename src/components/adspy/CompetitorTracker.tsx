import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAdSpy } from '@/hooks/useAdSpy'
import {
  Search, Plus, Eye, Target, TrendingUp, DollarSign,
  Package, BarChart3, Bell, BellOff, ExternalLink,
  ShoppingBag, Globe, Activity, AlertTriangle, CheckCircle, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

export function CompetitorTracker() {
  const { competitors, analyzeCompetitor, trackCompetitor, isLoading } = useAdSpy()
  const [newDomain, setNewDomain] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!newDomain.trim()) return
    setIsAnalyzing(true)
    await analyzeCompetitor(newDomain)
    setNewDomain('')
    setIsAnalyzing(false)
  }

  const getThreatBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-red-500">Menace élevée</Badge>
      case 'medium':
        return <Badge className="bg-yellow-500">Menace moyenne</Badge>
      case 'low':
        return <Badge className="bg-green-500">Menace faible</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Competitor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Suivre un Concurrent
          </CardTitle>
          <CardDescription>
            Entrez l'URL d'une boutique concurrente pour l'analyser et la suivre
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="exemple.com ou https://exemple.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing || !newDomain.trim()}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyse...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Analyser
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Eye className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{competitors.length}</p>
              <p className="text-xs text-muted-foreground">Concurrents suivis</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Activity className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {competitors.reduce((sum, c) => sum + c.adsRunning, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Pubs actives</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(competitors.reduce((sum, c) => sum + c.estimatedRevenue, 0) / 1000).toFixed(0)}K€
              </p>
              <p className="text-xs text-muted-foreground">CA total estimé</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {competitors.filter(c => c.threatLevel === 'high').length}
              </p>
              <p className="text-xs text-muted-foreground">Menaces élevées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitors List */}
      <div className="space-y-4">
        {competitors.map(competitor => (
          <Card key={competitor.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Left: Logo & Basic Info */}
                <div className="flex items-center gap-4 min-w-[250px]">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={competitor.logoUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {competitor.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{competitor.name}</h3>
                    <a 
                      href={`https://${competitor.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      {competitor.domain}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary">{competitor.platform}</Badge>
                      {getThreatBadge(competitor.threatLevel)}
                    </div>
                  </div>
                </div>

                {/* Center: Metrics */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-500" />
                    <p className="text-lg font-bold">{(competitor.estimatedRevenue / 1000).toFixed(0)}K€</p>
                    <p className="text-xs text-muted-foreground">CA estimé</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <ShoppingBag className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                    <p className="text-lg font-bold">{(competitor.estimatedOrders / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-muted-foreground">Commandes</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Package className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                    <p className="text-lg font-bold">{competitor.productCount}</p>
                    <p className="text-xs text-muted-foreground">Produits</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Eye className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                    <p className="text-lg font-bold">{competitor.adsRunning}</p>
                    <p className="text-xs text-muted-foreground">Pubs actives</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <BarChart3 className="h-4 w-4 mx-auto mb-1" />
                    <p className="text-lg font-bold">{competitor.competitionScore}%</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col gap-2 min-w-[150px]">
                  <Button 
                    variant={competitor.isTracked ? 'outline' : 'default'}
                    onClick={() => trackCompetitor(competitor.id)}
                    className="w-full"
                  >
                    {competitor.isTracked ? (
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
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Détails
                  </Button>
                </div>
              </div>

              {/* Social Followers */}
              {competitor.socialFollowers && (
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
                  {competitor.socialFollowers.facebook && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">Facebook</Badge>
                      <span className="font-medium">{(competitor.socialFollowers.facebook / 1000).toFixed(1)}K</span>
                    </div>
                  )}
                  {competitor.socialFollowers.instagram && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">Instagram</Badge>
                      <span className="font-medium">{(competitor.socialFollowers.instagram / 1000).toFixed(1)}K</span>
                    </div>
                  )}
                  {competitor.socialFollowers.tiktok && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">TikTok</Badge>
                      <span className="font-medium">{(competitor.socialFollowers.tiktok / 1000).toFixed(0)}K</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
