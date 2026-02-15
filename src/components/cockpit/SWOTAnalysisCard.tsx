/**
 * SWOTAnalysisCard — Analyse SWOT automatisée basée sur les données catalogue
 */
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Shield, TrendingUp, AlertTriangle, Crosshair, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SWOTItem {
  text: string
  impact: 'high' | 'medium' | 'low'
}

interface SWOTAnalysisCardProps {
  products: Array<{
    price: number
    cost_price?: number
    stock_quantity?: number
    profit_margin?: number
    description?: string
    image_url?: string
    seo_title?: string
    name: string
  }>
  revenue: number
  orders: number
}

export function SWOTAnalysisCard({ products, revenue, orders }: SWOTAnalysisCardProps) {
  const swot = useMemo(() => {
    const total = products.length
    const withMargin = products.filter(p => (p.profit_margin || 0) > 25).length
    const highMarginPct = total > 0 ? (withMargin / total) * 100 : 0
    const withDesc = products.filter(p => p.description && p.description.length > 50).length
    const withSEO = products.filter(p => p.seo_title).length
    const withImages = products.filter(p => p.image_url).length
    const lowStock = products.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) < 5).length
    const outOfStock = products.filter(p => (p.stock_quantity || 0) === 0).length
    const avgPrice = total > 0 ? products.reduce((s, p) => s + p.price, 0) / total : 0

    const strengths: SWOTItem[] = []
    const weaknesses: SWOTItem[] = []
    const opportunities: SWOTItem[] = []
    const threats: SWOTItem[] = []

    // Strengths
    if (highMarginPct > 40) strengths.push({ text: `${highMarginPct.toFixed(0)}% des produits avec marge > 25%`, impact: 'high' })
    if (withImages / total > 0.8) strengths.push({ text: `${((withImages / total) * 100).toFixed(0)}% produits avec images`, impact: 'medium' })
    if (total > 50) strengths.push({ text: `Catalogue riche (${total} produits)`, impact: 'medium' })
    if (revenue > 5000) strengths.push({ text: `Revenu solide: ${(revenue / 1000).toFixed(1)}k€`, impact: 'high' })
    if (strengths.length === 0) strengths.push({ text: 'Base de catalogue établie', impact: 'low' })

    // Weaknesses
    if (withDesc / total < 0.5) weaknesses.push({ text: `${((1 - withDesc / total) * 100).toFixed(0)}% produits sans description complète`, impact: 'high' })
    if (withSEO / total < 0.3) weaknesses.push({ text: `SEO faible: ${((1 - withSEO / total) * 100).toFixed(0)}% sans titre SEO`, impact: 'high' })
    if (outOfStock > 0) weaknesses.push({ text: `${outOfStock} produit(s) en rupture de stock`, impact: 'medium' })
    if (highMarginPct < 20) weaknesses.push({ text: `Marges faibles sur ${(100 - highMarginPct).toFixed(0)}% du catalogue`, impact: 'high' })
    if (weaknesses.length === 0) weaknesses.push({ text: 'Pas de faiblesse critique détectée', impact: 'low' })

    // Opportunities
    if (withDesc / total < 0.7) opportunities.push({ text: `Enrichir ${total - withDesc} descriptions → +15% SEO estimé`, impact: 'high' })
    if (avgPrice < 30) opportunities.push({ text: 'Potentiel d\'upsell sur produits à bas prix', impact: 'medium' })
    if (total < 100) opportunities.push({ text: 'Élargir le catalogue pour capter plus de segments', impact: 'medium' })
    opportunities.push({ text: 'Automatiser le repricing pour optimiser les marges', impact: 'high' })

    // Threats
    if (lowStock > 5) threats.push({ text: `${lowStock} produits en stock critique (<5 unités)`, impact: 'high' })
    if (outOfStock > total * 0.1) threats.push({ text: `Taux de rupture élevé: ${((outOfStock / total) * 100).toFixed(0)}%`, impact: 'high' })
    if (highMarginPct < 15) threats.push({ text: 'Compression des marges — risque de rentabilité', impact: 'high' })
    if (threats.length === 0) threats.push({ text: 'Surveiller la pression concurrentielle', impact: 'low' })

    return { strengths, weaknesses, opportunities, threats }
  }, [products, revenue, orders])

  const quadrants = [
    { key: 'strengths', title: 'Forces', icon: Shield, items: swot.strengths, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800' },
    { key: 'weaknesses', title: 'Faiblesses', icon: AlertTriangle, items: swot.weaknesses, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800' },
    { key: 'opportunities', title: 'Opportunités', icon: TrendingUp, items: swot.opportunities, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
    { key: 'threats', title: 'Menaces', icon: Crosshair, items: swot.threats, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800' },
  ]

  const impactColors = { high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Analyse SWOT Automatisée
          <Badge variant="outline" className="ml-auto text-xs">Temps réel</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quadrants.map((q, qi) => (
            <motion.div
              key={q.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: qi * 0.08 }}
              className={cn('rounded-lg border p-3 space-y-2', q.bg, q.border)}
            >
              <div className="flex items-center gap-2">
                <q.icon className={cn('h-4 w-4', q.color)} />
                <h4 className={cn('font-semibold text-sm', q.color)}>{q.title}</h4>
              </div>
              <ul className="space-y-1.5">
                {q.items.slice(0, 3).map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs">
                    <Badge className={cn('text-[9px] px-1 h-4 shrink-0', impactColors[item.impact])}>
                      {item.impact === 'high' ? '!!!' : item.impact === 'medium' ? '!!' : '!'}
                    </Badge>
                    <span className="text-foreground/80">{item.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
