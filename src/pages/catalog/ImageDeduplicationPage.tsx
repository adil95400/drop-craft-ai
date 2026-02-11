/**
 * Image Deduplication - Hash-based image duplicate detection
 * Prevents catalog redundancy through perceptual hashing
 */
import { useState } from 'react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Image, Search, Trash2, CheckCircle, AlertTriangle,
  Merge, Eye, Zap, ScanLine, RefreshCw, Package,
  Hash, Layers, XCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ImageDuplicate {
  id: string
  groupId: string
  imageUrl: string
  productName: string
  productId: string
  hashSignature: string
  similarity: number
  fileSize: string
  dimensions: string
  isPrimary: boolean
  selected: boolean
}

const mockGroups: { groupId: string; images: ImageDuplicate[] }[] = [
  {
    groupId: 'g1',
    images: [
      { id: '1', groupId: 'g1', imageUrl: '/placeholder.svg', productName: 'Wireless Earbuds Pro X', productId: 'p1', hashSignature: 'a3f2c1', similarity: 100, fileSize: '245 KB', dimensions: '800x800', isPrimary: true, selected: false },
      { id: '2', groupId: 'g1', imageUrl: '/placeholder.svg', productName: 'Écouteurs Sans Fil Pro X (copie)', productId: 'p2', hashSignature: 'a3f2c2', similarity: 97, fileSize: '238 KB', dimensions: '800x800', isPrimary: false, selected: false },
      { id: '3', groupId: 'g1', imageUrl: '/placeholder.svg', productName: 'Wireless Earbuds X Pro', productId: 'p3', hashSignature: 'a3f2c3', similarity: 94, fileSize: '312 KB', dimensions: '1000x1000', isPrimary: false, selected: false },
    ]
  },
  {
    groupId: 'g2',
    images: [
      { id: '4', groupId: 'g2', imageUrl: '/placeholder.svg', productName: 'Smart Watch Ultra', productId: 'p4', hashSignature: 'b7d4e1', similarity: 100, fileSize: '189 KB', dimensions: '600x600', isPrimary: true, selected: false },
      { id: '5', groupId: 'g2', imageUrl: '/placeholder.svg', productName: 'Montre Connectée Ultra', productId: 'p5', hashSignature: 'b7d4e2', similarity: 92, fileSize: '195 KB', dimensions: '600x600', isPrimary: false, selected: false },
    ]
  },
  {
    groupId: 'g3',
    images: [
      { id: '6', groupId: 'g3', imageUrl: '/placeholder.svg', productName: 'USB-C Hub 7in1', productId: 'p6', hashSignature: 'c9a3f1', similarity: 100, fileSize: '156 KB', dimensions: '500x500', isPrimary: true, selected: false },
      { id: '7', groupId: 'g3', imageUrl: '/placeholder.svg', productName: 'Hub USB C Multiport', productId: 'p7', hashSignature: 'c9a3f2', similarity: 89, fileSize: '162 KB', dimensions: '500x500', isPrimary: false, selected: false },
      { id: '8', groupId: 'g3', imageUrl: '/placeholder.svg', productName: 'USB C Adapter Hub', productId: 'p8', hashSignature: 'c9a3f3', similarity: 85, fileSize: '178 KB', dimensions: '600x600', isPrimary: false, selected: false },
      { id: '9', groupId: 'g3', imageUrl: '/placeholder.svg', productName: 'Multiport USB-C', productId: 'p9', hashSignature: 'c9a3f4', similarity: 82, fileSize: '145 KB', dimensions: '500x500', isPrimary: false, selected: false },
    ]
  },
]

export default function ImageDeduplicationPage() {
  const { toast } = useToast()
  const [groups, setGroups] = useState(mockGroups)
  const [threshold, setThreshold] = useState([80])
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)

  const totalDuplicates = groups.reduce((s, g) => s + g.images.length - 1, 0)
  const totalGroups = groups.length
  const estimatedSaving = groups.reduce((s, g) => {
    return s + g.images.slice(1).reduce((is, img) => is + parseInt(img.fileSize), 0)
  }, 0)

  const startScan = () => {
    setIsScanning(true)
    setScanProgress(0)
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) { clearInterval(interval); setIsScanning(false); return 100 }
        return p + Math.random() * 15
      })
    }, 300)
    toast({ title: 'Scan lancé', description: 'Analyse des images par hachage perceptuel...' })
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
    toast({ title: `${totalDuplicates} doublons supprimés`, description: `${estimatedSaving} KB d'espace récupéré.` })
  }

  return (
    <ChannablePageWrapper
      title="Déduplication d'Images"
      description="Détection et suppression des images dupliquées par hachage perceptuel (pHash)."
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Layers className="h-4 w-4" /> Groupes détectés</div>
          <div className="text-2xl font-bold">{totalGroups}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Image className="h-4 w-4" /> Images en double</div>
          <div className="text-2xl font-bold text-destructive">{totalDuplicates}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Zap className="h-4 w-4" /> Espace récupérable</div>
          <div className="text-2xl font-bold text-primary">{(estimatedSaving / 1024).toFixed(1)} MB</div>
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
                    <div className="aspect-square bg-muted rounded-md mb-3 flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium truncate">{img.productName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{img.dimensions}</span>
                        <span>·</span>
                        <span>{img.fileSize}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={img.similarity >= 95 ? 'destructive' : img.similarity >= 85 ? 'default' : 'secondary'} className="text-xs">
                          {img.similarity}% match
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">#{img.hashSignature}</p>
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
              <p className="text-muted-foreground mt-1">Votre catalogue d'images est propre !</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ChannablePageWrapper>
  )
}
