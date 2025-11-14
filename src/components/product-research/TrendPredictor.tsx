import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Zap, Loader2, Calendar, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface TrendPrediction {
  product_name: string
  current_trend_score: number
  predicted_30d: number
  predicted_60d: number
  predicted_90d: number
  trend_direction: 'rising' | 'peak' | 'declining' | 'stable'
  momentum: 'slow' | 'moderate' | 'fast' | 'viral'
  seasonality: string | null
  confidence: number
  recommendations: string[]
}

export const TrendPredictor = () => {
  const [productName, setProductName] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState<TrendPrediction | null>(null)
  const { toast } = useToast()

  const predictTrend = async () => {
    if (!productName.trim()) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-trend-predictor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            product_name: productName,
            hashtags: hashtags.split(',').map(h => h.trim()).filter(Boolean)
          })
        }
      )

      if (!response.ok) throw new Error('Failed to predict trend')
      
      const data = await response.json()
      setPrediction(data.prediction)
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'rising': return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'declining': return <TrendingDown className="h-5 w-5 text-red-600" />
      case 'peak': return <Zap className="h-5 w-5 text-yellow-600" />
      default: return <Minus className="h-5 w-5 text-gray-600" />
    }
  }

  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case 'viral': return 'bg-red-500'
      case 'fast': return 'bg-orange-500'
      case 'moderate': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const chartData = prediction ? [
    { period: 'Maintenant', score: prediction.current_trend_score },
    { period: '30 jours', score: prediction.predicted_30d },
    { period: '60 jours', score: prediction.predicted_60d },
    { period: '90 jours', score: prediction.predicted_90d }
  ] : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prédicteur de Tendances IA</CardTitle>
          <CardDescription>
            Prédisez l'évolution des tendances sur 30, 60 et 90 jours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom du produit</label>
            <Input
              placeholder="Ex: Portable Blender, Smart Watch..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Hashtags associés (optionnel)</label>
            <Input
              placeholder="Ex: fitness, kitchen, tech (séparés par virgule)"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />
          </div>

          <Button 
            onClick={predictTrend} 
            disabled={loading || !productName.trim()}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Prédire la Tendance
          </Button>
        </CardContent>
      </Card>

      {prediction && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getTrendIcon(prediction.trend_direction)}
                  {prediction.product_name}
                </CardTitle>
                <Badge className={getMomentumColor(prediction.momentum)}>
                  {prediction.momentum === 'viral' && '🔥'} {prediction.momentum}
                </Badge>
              </div>
              <CardDescription>
                Confiance: {prediction.confidence}% | Direction: {prediction.trend_direction}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1}
                      fill="url(#colorScore)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{prediction.current_trend_score}</div>
                  <div className="text-xs text-muted-foreground">Maintenant</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{prediction.predicted_30d}</div>
                  <div className="text-xs text-muted-foreground">30 jours</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{prediction.predicted_60d}</div>
                  <div className="text-xs text-muted-foreground">60 jours</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{prediction.predicted_90d}</div>
                  <div className="text-xs text-muted-foreground">90 jours</div>
                </div>
              </div>

              {prediction.seasonality && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-900 rounded-lg">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    <strong>Saisonnalité détectée:</strong> {prediction.seasonality}
                  </span>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Recommandations IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {prediction.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
