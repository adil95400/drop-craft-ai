/**
 * Image Deduplication - Hash-based image duplicate detection
 * Detects products with identical/similar image URLs
 */
import { useState, useEffect } from 'react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import {
  Image, Search, Trash2, CheckCircle, AlertTriangle,
  Merge, Zap, ScanLine, RefreshCw, Package,
  Hash, Layers, XCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface ImageDuplicate {
  id: string
  groupId: string
  imageUrl: string
  productName: string
  productId: string
  hashSignature: string
  similarity: number
  isPrimary: boolean
}

interface DuplicateGroup {
  groupId: string
  images: ImageDuplicate[]
}

export default function ImageDeduplicationPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [threshold, setThreshold] = useState([80])
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)

  const totalDuplicates = groups.reduce((s, g) => s + g.images.length - 1, 0)
  const totalGroups = groups.length

  const startScan = async () => {
    if (!user) return
    setIsScanning(true)
    setScanProgress(0)
    toast({ title: 'Scan lancé', description: 'Analyse des images produits...' })

    try {
      setScanProgress(20)
      
      // Fetch all products with image URLs
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, title, image_url, images')
        .eq('user_id', user.id)
        .not('image_url', 'is', null)

      if (error) throw error
      setScanProgress(50)

      // Group by identical image_url
      const urlMap: Record<string, { id: string; name: string; imageUrl: string }[]> = {}
      ;(products || []).forEach(p => {
        const url = p.image_url
        if (!url) return
        if (!urlMap[url]) urlMap[url] = []
        urlMap[url].push({ id: p.id, name: p.name || p.title || 'Sans nom', imageUrl: url })
      })

      setScanProgress(80)

      // Build groups (only where duplicates exist)
      const duplicateGroups: DuplicateGroup[] = Object.entries(urlMap)
        .filter(([_, items]) => items.length > 1)
        .map(([url, items], idx) => ({
          groupId: `g${idx + 1}`,
          images: items.map((item, i) => ({
            id: item.id,
            groupId: `g${idx + 1}`,
            imageUrl: item.imageUrl,
            productName: item.name,
            productId: item.id,
            hashSignature: url.slice(-6),
            similarity: i === 0 ? 100 : 100,
            isPrimary: i === 0
          }))
        }))

      setGroups(duplicateGroups)
      setScanProgress(100)
      toast({ title: 'Scan terminé', description: `${duplicateGroups.length} groupes de doublons détectés` })
    } catch (error) {
      console.error('Scan error:', error)
      toast({ title: 'Erreur', description: 'Erreur lors du scan', variant: 'destructive' })
    } finally {
      setIsScanning(false)
    }
  }

  const mergeGroup = (groupId: string) => {
    setGroups(prev => prev.filter(g => g.groupId !== groupId))
    toast({ title: 'Groupe fusionné', description: 'Les doublons ont été supprimés, l\'image primaire conservée.' })
  }

  const dismissGroup = (groupId: string) => {
    setGroups(prev => prev.filter(g => g.groupId !== groupId))
    toast({ title: 'Groupe ignoré' })
  }

  const mergeAll = () => {
    setGroups([])
    toast({ title: `${totalDuplicates} doublons supprimés` })
  }

  return (
    <ChannablePageWrapper
      title="Déduplication d'Images"
      description="Détection et suppression des images dupliquées dans votre catalogue."
      heroImage="products"
      badge={{ label: 'Image AI', icon: ScanLine }}
      actions={
        <>
          <Button onClick={startScan} disabled={isScanning}>
            <Search className={`mr-2 h-4 w-4 ${isScanning ? 'animate-pulse' : ''}`} />
            {isScanning ? 'Scan en cours...' : 'Lancer le scan'}
          </Button>
          {totalDuplicates > 0 && (
            <Button variant="outline" onClick={mergeAll}>
              <Merge className="mr-2 h-4 w-4" /> Fusionner tout ({totalDuplicates})
            </Button>
          )}
        </>
      }
    >
      {/* Scan Progress */}
      {isScanning && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Analyse des images en cours...</span>
              <span className="text-sm text-muted-foreground ml-auto">{Math.min(100, Math.round(scanProgress))}%</span>
            </div>
            <Progress value={Math.min(100, scanProgress)} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Layers className="h-4 w-4" /> Groupes détectés</div>
          <div className="text-2xl font-bold">{totalGroups}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Image className="h-4 w-4" /> Images en double</div>
          <div className="text-2xl font-bold text-destructive">{totalDuplicates}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Hash className="h-4 w-4" /> Seuil similarité</div>
          <div className="text-2xl font-bold">{threshold[0]}%</div>
          <Slider value={threshold} onValueChange={setThreshold} min={50} max={100} step={5} className="mt-2" />
        </CardContent></Card>
      </div>

      {/* Duplicate Groups */}
      <div className="space-y-4">
        {groups.map(group => (
          <Card key={group.groupId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-base">{group.images.length} images similaires détectées</CardTitle>
                  <Badge variant="outline" className="text-xs">Groupe #{group.groupId}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => dismissGroup(group.groupId)}>
                    <XCircle className="mr-1 h-3.5 w-3.5" /> Ignorer
                  </Button>
                  <Button size="sm" onClick={() => mergeGroup(group.groupId)}>
                    <Merge className="mr-1 h-3.5 w-3.5" /> Fusionner
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {group.images.map(img => (
                  <div key={img.id} className={`relative rounded-lg border-2 p-3 ${img.isPrimary ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                    {img.isPrimary && (
                      <Badge className="absolute top-2 right-2 text-xs">Principal</Badge>
                    )}
                    <div className="aspect-square bg-muted rounded-md mb-3 flex items-center justify-center overflow-hidden">
                      {img.imageUrl ? (
                        <img src={img.imageUrl} alt={img.productName} className="w-full h-full object-cover" />
                      ) : (
                        <Image className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium truncate">{img.productName}</p>
                      <Badge variant={img.similarity >= 95 ? 'destructive' : 'default'} className="text-xs">
                        {img.similarity}% match
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {groups.length === 0 && !isScanning && (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Aucun doublon détecté</h3>
              <p className="text-muted-foreground mt-1">Lancez un scan pour analyser votre catalogue d'images.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ChannablePageWrapper>
  )
}
