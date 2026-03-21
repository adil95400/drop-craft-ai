/**
 * MediaPipelineDashboard - Dashboard du pipeline média Cloudinary
 * Upload, stats, batch processing et monitoring
 */
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { 
  Upload, Cloud, Zap, HardDrive, TrendingDown, BarChart3, 
  CheckCircle, Loader2, ImagePlus, Layers, ArrowRight, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  getMediaPipelineStats, 
  uploadMedia, 
  batchUploadMedia, 
  fileToBase64, 
  formatFileSize 
} from '@/services/media-pipeline'

export function MediaPipelineDashboard() {
  const queryClient = useQueryClient()
  const [dragOver, setDragOver] = useState(false)
  const [batchUrls, setBatchUrls] = useState('')

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['media-pipeline-stats'],
    queryFn: getMediaPipelineStats,
    staleTime: 30_000,
  })

  const uploadMutation = useMutation({
    mutationFn: uploadMedia,
    onSuccess: (data) => {
      toast.success('Image uploadée et optimisée via Cloudinary', {
        description: `Score: ${data.cloudinary.optimization_score}/100 • ${data.cloudinary.variants_count} variantes générées`
      })
      queryClient.invalidateQueries({ queryKey: ['media-pipeline-stats'] })
    },
    onError: (error) => {
      toast.error('Erreur pipeline', { description: error.message })
    }
  })

  const batchMutation = useMutation({
    mutationFn: batchUploadMedia,
    onSuccess: (data) => {
      toast.success(`Batch terminé: ${data.succeeded}/${data.total} images optimisées`, {
        description: data.failed > 0 ? `${data.failed} échecs` : 'Toutes les images sont prêtes'
      })
      queryClient.invalidateQueries({ queryKey: ['media-pipeline-stats'] })
    },
    onError: (error) => {
      toast.error('Erreur batch', { description: error.message })
    }
  })

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length === 0) return

    if (files.length === 1) {
      const base64 = await fileToBase64(files[0])
      uploadMutation.mutate({ imageData: base64, fileName: files[0].name })
    } else {
      const base64s = await Promise.all(files.slice(0, 50).map(f => fileToBase64(f)))
      batchMutation.mutate({ images: base64s })
    }
  }, [uploadMutation, batchMutation])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (files.length === 1) {
      const base64 = await fileToBase64(files[0])
      uploadMutation.mutate({ imageData: base64, fileName: files[0].name })
    } else {
      const base64s = await Promise.all(
        Array.from(files).slice(0, 50).map(f => fileToBase64(f))
      )
      batchMutation.mutate({ images: base64s })
    }
  }, [uploadMutation, batchMutation])

  const handleBatchUrls = useCallback(() => {
    const urls = batchUrls.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'))
    if (urls.length === 0) {
      toast.error('Entrez au moins une URL d\'image')
      return
    }
    batchMutation.mutate({ images: urls })
    setBatchUrls('')
  }, [batchUrls, batchMutation])

  const isProcessing = uploadMutation.isPending || batchMutation.isPending

  return (
    <div className="space-y-6">
      {/* Pipeline Flow Visualization */}
      <Card className="bg-gradient-to-r from-sky-500/5 via-violet-500/5 to-emerald-500/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Pipeline Média Automatique
          </CardTitle>
          <CardDescription>Upload → Cloudinary → Optimisation → CDN → Distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 overflow-x-auto py-2">
            {[
              { icon: Upload, label: 'Upload', color: 'text-blue-500 bg-blue-500/10' },
              { icon: Cloud, label: 'Cloudinary', color: 'text-violet-500 bg-violet-500/10' },
              { icon: Zap, label: 'Optimisation', color: 'text-amber-500 bg-amber-500/10' },
              { icon: Layers, label: 'Variantes', color: 'text-emerald-500 bg-emerald-500/10' },
              { icon: HardDrive, label: 'CDN', color: 'text-cyan-500 bg-cyan-500/10' },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-2 shrink-0">
                <div className={cn("p-2 rounded-xl", step.color)}>
                  <step.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium whitespace-nowrap">{step.label}</span>
                {i < 4 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black tabular-nums">{statsLoading ? '…' : stats?.totalAssets || 0}</p>
                <p className="text-xs text-muted-foreground">Total médias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <TrendingDown className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-black tabular-nums text-emerald-500">
                  {statsLoading ? '…' : `${stats?.savedPercent || 0}%`}
                </p>
                <p className="text-xs text-muted-foreground">Compression</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10">
                <HardDrive className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-black tabular-nums">
                  {statsLoading ? '…' : formatFileSize(stats?.savedBytes || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Économisé</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <CheckCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-black tabular-nums">
                  {statsLoading ? '…' : `${stats?.averageOptimizationScore || 0}/100`}
                </p>
                <p className="text-xs text-muted-foreground">Score moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Zone */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              Upload via fichier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                dragOver 
                  ? "border-primary bg-primary/5 scale-[1.02]" 
                  : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30",
                isProcessing && "opacity-50 pointer-events-none"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById('media-file-input')?.click()}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-medium">Pipeline en cours...</p>
                  <p className="text-xs text-muted-foreground">Upload → Optimisation → CDN</p>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">Glissez-déposez vos images</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ou cliquez pour sélectionner • Max 50 images par lot
                  </p>
                  <Badge variant="outline" className="mt-3">
                    Auto: WebP/AVIF + 4 variantes + CDN
                  </Badge>
                </>
              )}
              <input
                id="media-file-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              Upload via URLs
            </CardTitle>
            <CardDescription>Collez des URLs d'images (une par ligne)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="w-full h-32 p-3 text-sm rounded-lg border bg-background resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.png\nhttps://..."}
              value={batchUrls}
              onChange={(e) => setBatchUrls(e.target.value)}
              disabled={isProcessing}
            />
            <Button 
              onClick={handleBatchUrls} 
              disabled={!batchUrls.trim() || isProcessing}
              className="w-full gap-2"
            >
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Traitement...</>
              ) : (
                <><Zap className="h-4 w-4" />Lancer le pipeline</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Status */}
      {stats && stats.pipelineStats && Object.keys(stats.pipelineStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statuts du pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              {Object.entries(stats.pipelineStats).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    status === 'completed' ? 'bg-emerald-500' :
                    status === 'processing' ? 'bg-amber-500 animate-pulse' :
                    status === 'failed' ? 'bg-destructive' :
                    'bg-muted-foreground'
                  )} />
                  <span className="text-sm capitalize">{status}</span>
                  <Badge variant="secondary" className="text-xs">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
