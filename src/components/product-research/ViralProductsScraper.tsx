import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, ExternalLink, Heart, MessageCircle, Share2, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface ViralProduct {
  id: string
  product_name: string
  platform: string
  url: string
  viral_score: number
  views: number
  likes: number
  comments: number
  shares: number
  engagement_rate: number
  price?: number
  estimated_margin?: number
  thumbnail_url?: string
  hashtags?: string[]
  creator_username?: string
  analyzed_at: string
}

export const ViralProductsScraper = () => {
  const [hashtags, setHashtags] = useState('tiktokmademebuyit, amazonfinds, dropshipping')
  const [keywords, setKeywords] = useState('trending product, must have, viral')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Récupérer les produits viraux existants
  const { data: viralProducts, isLoading } = useQuery({
    queryKey: ['viral-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('viral_products')
        .select('*')
        .order('viral_score', { ascending: false })
        .limit(20)

      if (error) throw error
      return data as ViralProduct[]
    }
  })

  // Mutation pour scraper TikTok
  const scrapeTikTokMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiktok-product-scraper`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            hashtags: hashtags.split(',').map(h => h.trim()),
            limit: 20
          })
        }
      )

      if (!response.ok) throw new Error('Failed to scrape TikTok')
      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: 'TikTok scanné avec succès',
        description: `${data.count} produits viraux trouvés`,
      })
      queryClient.invalidateQueries({ queryKey: ['viral-products'] })
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Mutation pour scraper Facebook
  const scrapeFacebookMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-ad-scraper`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            keywords: keywords.split(',').map(k => k.trim()),
            limit: 15
          })
        }
      )

      if (!response.ok) throw new Error('Failed to scrape Facebook')
      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: 'Facebook scanné avec succès',
        description: `${data.count} produits pub trouvés`,
      })
      queryClient.invalidateQueries({ queryKey: ['viral-products'] })
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Scanner de Produits Viraux
          </CardTitle>
          <CardDescription>
            Découvrez les produits tendances sur TikTok et Facebook Ads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Hashtags TikTok</label>
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="tiktokmademebuyit, amazonfinds, dropshipping"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mots-clés Facebook Ads</label>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="trending product, must have, viral"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => scrapeTikTokMutation.mutate()}
              disabled={scrapeTikTokMutation.isPending}
              className="flex-1"
            >
              {scrapeTikTokMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Scanner TikTok
            </Button>
            <Button
              onClick={() => scrapeFacebookMutation.mutate()}
              disabled={scrapeFacebookMutation.isPending}
              variant="outline"
              className="flex-1"
            >
              {scrapeFacebookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Scanner Facebook
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viralProducts && viralProducts.length > 0 ? (
          viralProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              {product.thumbnail_url && (
                <div className="aspect-video bg-muted relative">
                  <img
                    src={product.thumbnail_url}
                    alt={product.product_name}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-2 right-2">
                    Score: {product.viral_score}
                  </Badge>
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold line-clamp-1">{product.product_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {product.platform}
                    </Badge>
                    {product.creator_username && (
                      <span className="text-xs text-muted-foreground">
                        @{product.creator_username}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span>{formatNumber(product.views)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-muted-foreground" />
                    <span>{formatNumber(product.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-muted-foreground" />
                    <span>{formatNumber(product.comments)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="h-3 w-3 text-muted-foreground" />
                    <span>{formatNumber(product.shares)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm">
                    <div className="text-muted-foreground">Engagement</div>
                    <div className="font-semibold">{product.engagement_rate}%</div>
                  </div>
                  {product.price && (
                    <div className="text-sm text-right">
                      <div className="text-muted-foreground">Prix</div>
                      <div className="font-semibold">{product.price}€</div>
                    </div>
                  )}
                </div>

                {product.hashtags && product.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {product.hashtags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(product.url, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Voir le produit
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Aucun produit viral trouvé. Lancez un scan pour découvrir les tendances !
          </div>
        )}
      </div>
    </div>
  )
}
