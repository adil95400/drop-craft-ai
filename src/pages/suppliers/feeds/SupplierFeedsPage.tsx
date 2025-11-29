import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Zap,
  CheckCircle,
  AlertCircle,
  Download,
  Globe,
  ShoppingBag,
  TrendingUp
} from 'lucide-react'
import { useRealSuppliers } from '@/hooks/useRealSuppliers'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { FeedService, FeedChannel, FeedFormat } from '@/services/feeds/FeedService'
import { toast } from 'sonner'

/**
 * SupplierFeedsPage
 * Page dédiée à la gestion des feeds par fournisseur
 * Intégration avec FeedService pour génération multi-canaux
 */
export default function SupplierFeedsPage() {
  const { supplierId } = useParams<{ supplierId: string }>()
  const navigate = useNavigate()
  const { suppliers } = useRealSuppliers()
  
  const [selectedChannel, setSelectedChannel] = useState<FeedChannel>('google')
  const [selectedFormat, setSelectedFormat] = useState<FeedFormat>('xml')
  
  const supplier = suppliers.find(s => s.id === supplierId)

  // Récupérer les produits du fournisseur
  const { data: supplierProducts = [], isLoading } = useQuery({
    queryKey: ['supplier-products', supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('supplier_id', supplierId)
      
      if (error) throw error
      return data
    },
    enabled: !!supplierId
  })

  // Calculer les stats de feed
  const feedStats = supplierProducts.length > 0 
    ? FeedService.getFeedStats(supplierProducts as any, selectedChannel)
    : null

  const handleGenerateFeed = async () => {
    if (supplierProducts.length === 0) {
      toast.error('Aucun produit disponible pour générer un feed')
      return
    }

    try {
      const feedContent = await FeedService.generateFeed(
        supplierProducts as any,
        {
          channel: selectedChannel,
          format: selectedFormat,
          minQualityScore: 40,
          applyChannelRules: true
        }
      )

      // Télécharger le feed
      const blob = new Blob([feedContent], { 
        type: selectedFormat === 'xml' ? 'application/xml' : 
              selectedFormat === 'csv' ? 'text/csv' : 
              'application/json'
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `feed-${supplier?.name}-${selectedChannel}.${selectedFormat}`
      link.click()
      URL.revokeObjectURL(url)

      toast.success('Feed généré et téléchargé avec succès')
    } catch (error: any) {
      toast.error(`Erreur lors de la génération: ${error.message}`)
    }
  }

  if (!supplier) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Fournisseur introuvable</h2>
          <Button onClick={() => navigate('/suppliers')}>
            Retour aux fournisseurs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Feeds - {supplier.name} - ShopOpti</title>
        <meta name="description" content={`Gérez les feeds pour ${supplier.name}`} />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(`/suppliers/${supplierId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Feeds - {supplier.name}</h1>
              <p className="text-muted-foreground mt-1">
                Générez des feeds multi-canaux pour ce fournisseur
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/feeds')}>
            <Globe className="h-4 w-4 mr-2" />
            Gestionnaire de feeds
          </Button>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Produits</p>
                  <p className="text-2xl font-bold">{supplierProducts.length}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Éligibles</p>
                  <p className="text-2xl font-bold text-green-600">
                    {feedStats?.eligible_products || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Score Qualité</p>
                  <p className="text-2xl font-bold">
                    {feedStats?.avg_quality_score?.toFixed(0) || 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taux éligibilité</p>
                  <p className="text-2xl font-bold">
                    {feedStats?.eligibility_rate?.toFixed(0) || 0}%
                  </p>
                </div>
                <Zap className="h-8 w-8 text-yellow-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Générer un Feed</CardTitle>
            <CardDescription>
              Configurez et téléchargez un feed pour ce fournisseur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Canal</label>
                <Select value={selectedChannel} onValueChange={(v: FeedChannel) => setSelectedChannel(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Google Shopping
                      </div>
                    </SelectItem>
                    <SelectItem value="meta">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Meta Commerce
                      </div>
                    </SelectItem>
                    <SelectItem value="tiktok">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        TikTok Shop
                      </div>
                    </SelectItem>
                    <SelectItem value="amazon">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Amazon
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Format</label>
                <Select value={selectedFormat} onValueChange={(v: FeedFormat) => setSelectedFormat(v)}>
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

              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={handleGenerateFeed}
                  disabled={isLoading || supplierProducts.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Générer & Télécharger
                </Button>
              </div>
            </div>

            {feedStats && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium text-sm">Statistiques pour {selectedChannel} :</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Produits éligibles</p>
                    <p className="font-bold text-green-600">{feedStats.eligible_products}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Haute qualité</p>
                    <p className="font-bold">{feedStats.high_quality}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Basse qualité</p>
                    <p className="font-bold text-red-600">{feedStats.low_quality}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Score moyen</p>
                    <p className="font-bold">{feedStats.avg_quality_score.toFixed(0)}/100</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Canaux disponibles */}
        <Card>
          <CardHeader>
            <CardTitle>Canaux de distribution</CardTitle>
            <CardDescription>
              Plateformes supportées pour la publication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'google', name: 'Google Shopping', format: 'XML', color: 'blue' },
                { id: 'meta', name: 'Meta Commerce', format: 'CSV', color: 'blue' },
                { id: 'tiktok', name: 'TikTok Shop', format: 'JSON', color: 'pink' },
                { id: 'amazon', name: 'Amazon', format: 'JSON', color: 'orange' },
              ].map(channel => {
                const stats = FeedService.getFeedStats(supplierProducts as any, channel.id as FeedChannel)
                return (
                  <Card key={channel.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Globe className={`h-5 w-5 text-${channel.color}-600`} />
                          <h3 className="font-semibold">{channel.name}</h3>
                        </div>
                        <Badge variant="outline">{channel.format}</Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Produits éligibles</span>
                          <span className="font-medium text-green-600">{stats.eligible_products}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taux éligibilité</span>
                          <span className="font-medium">{stats.eligibility_rate.toFixed(0)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/suppliers/${supplierId}/catalog`)}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Catalogue fournisseur</h3>
                  <p className="text-sm text-muted-foreground">
                    {supplierProducts.length} produits
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/suppliers/${supplierId}/import`)}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Download className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Importer des produits</h3>
                  <p className="text-sm text-muted-foreground">
                    Synchroniser le catalogue
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/feeds/optimization')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Optimisation IA</h3>
                  <p className="text-sm text-muted-foreground">
                    Améliorer les feeds
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
