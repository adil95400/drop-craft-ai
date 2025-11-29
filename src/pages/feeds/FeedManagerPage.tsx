import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Download, Settings, RefreshCw, BarChart3, FileText, Globe } from 'lucide-react'
import { FeedService, FeedChannel, FeedFormat } from '@/services/feeds/FeedService'
import { ProductsUnifiedService } from '@/services/ProductsUnifiedService'
import { toast } from 'sonner'

export default function FeedManagerPage() {
  const [selectedChannel, setSelectedChannel] = useState<FeedChannel>('google')
  const [selectedFormat, setSelectedFormat] = useState<FeedFormat>('xml')
  const [minQuality, setMinQuality] = useState(40)
  const [applyRules, setApplyRules] = useState(true)

  const { data: products = [] } = useQuery({
    queryKey: ['all-products-feed'],
    queryFn: async () => {
      const { data: user } = await ProductsUnifiedService['supabase'].auth.getUser()
      if (!user.user) return []
      return ProductsUnifiedService.getAllProducts(user.user.id)
    }
  })

  const feedStats = FeedService.getFeedStats(products, selectedChannel)

  const handleGenerateFeed = async () => {
    try {
      toast.info('Génération du feed en cours...')
      const feed = await FeedService.generateFeed(products, {
        channel: selectedChannel,
        format: selectedFormat,
        minQualityScore: minQuality,
        applyChannelRules: applyRules
      })

      // Télécharger le feed
      const blob = new Blob([feed], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `feed-${selectedChannel}-${Date.now()}.${selectedFormat}`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Feed généré avec succès')
    } catch (error) {
      toast.error('Erreur lors de la génération du feed')
      console.error(error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des Feeds</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos feeds multi-canaux
          </p>
        </div>
        <Button onClick={handleGenerateFeed}>
          <Download className="w-4 h-4 mr-2" />
          Générer Feed
        </Button>
      </div>

      {/* Configuration du feed */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration du Feed</CardTitle>
          <CardDescription>Sélectionnez le canal et les paramètres</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Canal</label>
              <Select value={selectedChannel} onValueChange={(v) => setSelectedChannel(v as FeedChannel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google Shopping</SelectItem>
                  <SelectItem value="meta">Meta Commerce</SelectItem>
                  <SelectItem value="tiktok">TikTok Shop</SelectItem>
                  <SelectItem value="amazon">Amazon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as FeedFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Qualité Min.</label>
              <Select value={String(minQuality)} onValueChange={(v) => setMinQuality(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Aucune limite</SelectItem>
                  <SelectItem value="40">40+</SelectItem>
                  <SelectItem value="70">70+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Appliquer les règles du canal</p>
              <p className="text-sm text-muted-foreground">
                Filtrer les produits selon les exigences spécifiques
              </p>
            </div>
            <Switch checked={applyRules} onCheckedChange={setApplyRules} />
          </div>
        </CardContent>
      </Card>

      {/* Statistiques du feed */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Produits</p>
                <p className="text-2xl font-bold">{feedStats.total_products}</p>
              </div>
              <Globe className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Éligibles</p>
                <p className="text-2xl font-bold text-green-600">{feedStats.eligible_products}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Haute Qualité</p>
                <p className="text-2xl font-bold text-blue-600">{feedStats.high_quality}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux Éligibilité</p>
                <p className="text-2xl font-bold">{feedStats.eligibility_rate.toFixed(0)}%</p>
              </div>
              <RefreshCw className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des feeds configurés */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Feeds Configurés</CardTitle>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Gérer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { channel: 'Google Shopping', format: 'XML', products: feedStats.eligible_products, active: true },
              { channel: 'Meta Commerce', format: 'CSV', products: feedStats.eligible_products, active: true },
              { channel: 'TikTok Shop', format: 'JSON', products: feedStats.eligible_products, active: false },
            ].map((feed, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5"
              >
                <div>
                  <p className="font-medium">{feed.channel}</p>
                  <p className="text-sm text-muted-foreground">
                    {feed.format} • {feed.products} produits
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={feed.active ? 'default' : 'secondary'}>
                    {feed.active ? 'Actif' : 'Inactif'}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
