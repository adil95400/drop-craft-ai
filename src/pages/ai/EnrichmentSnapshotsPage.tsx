/**
 * AI Enrichment Snapshots - Diff history for AI-generated content
 * Before/after comparison with version timeline
 */
import { useState } from 'react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  History, GitCompare, CheckCircle, RotateCcw, Eye, Clock,
  Sparkles, FileText, ArrowRight, ChevronDown, Diff, Undo2,
  TrendingUp, Zap, Package
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Snapshot {
  id: string
  productId: string
  productName: string
  version: number
  timestamp: string
  contentType: 'title' | 'description' | 'keywords' | 'full_seo'
  original: string
  generated: string
  qualityScore: number
  tokensUsed: number
  status: 'applied' | 'generated' | 'reverted'
  model: string
}

const mockSnapshots: Snapshot[] = [
  {
    id: '1', productId: 'p1', productName: 'Wireless Earbuds Pro X', version: 3,
    timestamp: 'Il y a 2h', contentType: 'title',
    original: 'Wireless Earbuds Pro X',
    generated: 'Écouteurs Sans Fil Pro X – Bluetooth 5.3, Réduction de Bruit Active, 40h Autonomie',
    qualityScore: 92, tokensUsed: 145, status: 'applied', model: 'gpt-4.1-mini'
  },
  {
    id: '2', productId: 'p1', productName: 'Wireless Earbuds Pro X', version: 2,
    timestamp: 'Il y a 1j', contentType: 'description',
    original: 'Good quality wireless earbuds with noise cancellation.',
    generated: 'Découvrez les Écouteurs Sans Fil Pro X, dotés de la technologie Bluetooth 5.3 pour une connexion ultra-stable. Profitez d\'une réduction de bruit active avancée et de 40 heures d\'autonomie. Conçus pour le confort avec des embouts ergonomiques et un son Hi-Fi cristallin. Idéal pour le sport, les déplacements et le télétravail.',
    qualityScore: 88, tokensUsed: 289, status: 'applied', model: 'gpt-4.1-mini'
  },
  {
    id: '3', productId: 'p2', productName: 'Smart Watch Ultra', version: 1,
    timestamp: 'Il y a 3h', contentType: 'full_seo',
    original: 'Smart Watch Ultra Edition with health tracking',
    generated: 'Montre Connectée Ultra – Suivi Santé Avancé, GPS Intégré, Écran AMOLED 1.9", Étanche IP68',
    qualityScore: 95, tokensUsed: 312, status: 'generated', model: 'gpt-4.1-mini'
  },
  {
    id: '4', productId: 'p3', productName: 'USB-C Hub Pro', version: 2,
    timestamp: 'Hier', contentType: 'keywords',
    original: 'usb hub, usb-c, adapter',
    generated: 'hub USB-C, adaptateur multiport, station d\'accueil, HDMI 4K, USB 3.0, lecteur SD, MacBook compatible, Thunderbolt',
    qualityScore: 85, tokensUsed: 98, status: 'reverted', model: 'gpt-4.1-mini'
  },
  {
    id: '5', productId: 'p1', productName: 'Wireless Earbuds Pro X', version: 1,
    timestamp: 'Il y a 3j', contentType: 'title',
    original: 'Earbuds wireless',
    generated: 'Wireless Earbuds Pro X – Premium Sound Quality',
    qualityScore: 78, tokensUsed: 67, status: 'reverted', model: 'gpt-4.1-mini'
  },
]

export default function EnrichmentSnapshotsPage() {
  const { toast } = useToast()
  const [snapshots] = useState(mockSnapshots)
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  const products = [...new Set(snapshots.map(s => s.productName))]
  const filtered = snapshots.filter(s => {
    const matchProduct = selectedProduct === 'all' || s.productName === selectedProduct
    const matchType = selectedType === 'all' || s.contentType === selectedType
    return matchProduct && matchType
  })

  const avgScore = snapshots.length > 0 ? Math.round(snapshots.reduce((s, snap) => s + snap.qualityScore, 0) / snapshots.length) : 0
  const totalTokens = snapshots.reduce((s, snap) => s + snap.tokensUsed, 0)
  const appliedCount = snapshots.filter(s => s.status === 'applied').length

  const revertSnapshot = (id: string) => {
    toast({ title: 'Contenu restauré', description: 'Le contenu original a été rétabli.' })
  }

  const applySnapshot = (id: string) => {
    toast({ title: 'Contenu appliqué', description: 'Le contenu IA a été appliqué au produit.' })
  }

  const contentTypeLabel = (type: string) => {
    switch (type) {
      case 'title': return 'Titre'
      case 'description': return 'Description'
      case 'keywords': return 'Mots-clés'
      case 'full_seo': return 'SEO Complet'
      default: return type
    }
  }

  return (
    <ChannablePageWrapper
      title="Snapshots d'Enrichissement"
      description="Historique diff complet des contenus générés par l'IA avec comparaison avant/après."
      heroImage="ai"
      badge={{ label: 'Historique IA', icon: History }}
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Sparkles className="h-4 w-4" /> Total snapshots</div>
          <div className="text-2xl font-bold">{snapshots.length}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><CheckCircle className="h-4 w-4" /> Appliqués</div>
          <div className="text-2xl font-bold text-green-600">{appliedCount}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="h-4 w-4" /> Score moyen</div>
          <div className="text-2xl font-bold text-primary">{avgScore}/100</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Zap className="h-4 w-4" /> Tokens utilisés</div>
          <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Tous les produits" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les produits</SelectItem>
            {products.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tous les types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="title">Titre</SelectItem>
            <SelectItem value="description">Description</SelectItem>
            <SelectItem value="keywords">Mots-clés</SelectItem>
            <SelectItem value="full_seo">SEO Complet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Snapshots Timeline */}
      <div className="space-y-4">
        {filtered.map(snap => (
          <Card key={snap.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{snap.productName}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">v{snap.version}</Badge>
                  <Badge variant="secondary" className="text-xs">{contentTypeLabel(snap.contentType)}</Badge>
                  {snap.status === 'applied' && <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">Appliqué</Badge>}
                  {snap.status === 'generated' && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">En attente</Badge>}
                  {snap.status === 'reverted' && <Badge variant="outline" className="text-xs">Révoqué</Badge>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {snap.timestamp}
                  <Badge variant="outline" className="text-xs">{snap.qualityScore}/100</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Original */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="h-4 w-4" /> Original
                  </div>
                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm leading-relaxed">
                    {snap.original}
                  </div>
                </div>
                {/* Generated */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Sparkles className="h-4 w-4" /> Généré par IA
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm leading-relaxed">
                    {snap.generated}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Modèle: {snap.model}</span>
                  <span>{snap.tokensUsed} tokens</span>
                </div>
                <div className="flex gap-2">
                  {snap.status === 'applied' && (
                    <Button size="sm" variant="outline" onClick={() => revertSnapshot(snap.id)}>
                      <Undo2 className="mr-1 h-3.5 w-3.5" /> Révoquer
                    </Button>
                  )}
                  {snap.status === 'generated' && (
                    <Button size="sm" onClick={() => applySnapshot(snap.id)}>
                      <CheckCircle className="mr-1 h-3.5 w-3.5" /> Appliquer
                    </Button>
                  )}
                  {snap.status === 'reverted' && (
                    <Button size="sm" variant="outline" onClick={() => applySnapshot(snap.id)}>
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Ré-appliquer
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ChannablePageWrapper>
  )
}
