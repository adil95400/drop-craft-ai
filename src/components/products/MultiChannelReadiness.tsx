import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { useState } from 'react'

interface MultiChannelReadinessProps {
  product: UnifiedProduct
}

interface ChannelData {
  channel: string
  readiness_score: number
  missing_fields: string[]
}

export function MultiChannelReadiness({ product }: MultiChannelReadinessProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [channelData, setChannelData] = useState<ChannelData[]>([])

  const channels = [
    {
      id: 'google_shopping',
      name: 'Google Shopping',
      icon: '🔍',
      color: 'blue',
      requiredFields: ['gtin', 'google_product_category', 'condition', 'availability'],
      docs: 'https://support.google.com/merchants/answer/7052112'
    },
    {
      id: 'meta',
      name: 'Meta Commerce',
      icon: '📸',
      color: 'blue',
      requiredFields: ['fb_product_category', 'condition', 'availability'],
      docs: 'https://www.facebook.com/business/help/120325381656392'
    },
    {
      id: 'amazon',
      name: 'Amazon',
      icon: '📦',
      color: 'orange',
      requiredFields: ['bullet_point_1', 'bullet_point_2', 'search_terms'],
      docs: 'https://sellercentral.amazon.com/gp/help/external/G200216460'
    },
    {
      id: 'tiktok',
      name: 'TikTok Shop',
      icon: '🎵',
      color: 'pink',
      requiredFields: ['tiktok_category', 'video_url'],
      docs: 'https://seller.tiktok.com/university/essay'
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT Shopping',
      icon: '🤖',
      color: 'green',
      requiredFields: ['name', 'description', 'category', 'image_url'],
      docs: 'https://platform.openai.com/docs'
    }
  ]

  const analyzeReadiness = useMutation({
    mutationFn: async (channelId: string) => {
      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const channel = channels.find(c => c.id === channelId)
      if (!channel) throw new Error('Channel not found')
      
      const missingFields = channel.requiredFields.filter(f => !product[f as keyof UnifiedProduct])
      const score = Math.round(((channel.requiredFields.length - missingFields.length) / channel.requiredFields.length) * 100)
      
      return { channel: channelId, readiness_score: score, missing_fields: missingFields }
    },
    onSuccess: (data) => {
      setChannelData(prev => {
        const existing = prev.findIndex(d => d.channel === data.channel)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = data
          return updated
        }
        return [...prev, data]
      })
      toast({
        title: "Analyse terminée",
        description: "L'analyse de compatibilité a été effectuée"
      })
    }
  })

  const calculateReadiness = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId)
    if (!channel) return 0

    const data = channelData.find(d => d.channel === channelId)
    if (data) {
      return data.readiness_score
    }

    // Calculate based on existing product data
    let score = 0
    const requiredCount = channel.requiredFields.length

    channel.requiredFields.forEach(field => {
      if (product[field as keyof UnifiedProduct]) score++
    })

    return Math.round((score / requiredCount) * 100)
  }

  const getMissingFields = (channelId: string) => {
    const data = channelData.find(d => d.channel === channelId)
    if (data) {
      return data.missing_fields
    }

    const channel = channels.find(c => c.id === channelId)
    return channel?.requiredFields.filter(f => !product[f as keyof UnifiedProduct]) || []
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🌐 Compatibilité Multi-Plateforme</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {channels.map((channel) => {
            const readiness = calculateReadiness(channel.id)
            const missing = getMissingFields(channel.id)
            const isReady = readiness >= 80

            return (
              <div key={channel.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{channel.icon}</span>
                    <div>
                      <div className="font-semibold">{channel.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {missing.length} champ{missing.length > 1 ? 's' : ''} manquant{missing.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isReady ? 'default' : readiness >= 50 ? 'secondary' : 'destructive'}>
                      {readiness}%
                    </Badge>
                    {isReady ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : readiness >= 50 ? (
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>

                <Progress value={readiness} className="h-2" />

                {missing.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Champs manquants:</div>
                    <div className="flex flex-wrap gap-2">
                      {missing.map((field, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => analyzeReadiness.mutate(channel.id)}
                    disabled={analyzeReadiness.isPending}
                  >
                    Analyser
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                  >
                    <a href={channel.docs} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Documentation
                    </a>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
