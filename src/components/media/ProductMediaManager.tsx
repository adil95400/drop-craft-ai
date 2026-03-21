/**
 * ProductMediaManager — UI pour gérer les médias produit via Cloudinary
 * Statuts: pending → processing → ready | failed
 * Transformations: thumbnail, gallery, ads_square, ads_story, cdn_auto
 */
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Image, Upload, Loader2, CheckCircle, AlertTriangle, Clock,
  RefreshCw, Zap, Trash2, ExternalLink, Copy, Search,
  LayoutGrid, Maximize2, Smartphone, Monitor, Square
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { fromTable } from '@/integrations/supabase/typedClient'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'

interface ProductMedia {
  id: string
  product_id: string
  status: 'pending' | 'processing' | 'ready' | 'failed'
  original_filename: string
  mime_type: string | null
  format: string | null
  original_size: number | null
  original_width: number | null
  original_height: number | null
  cloudinary_public_id: string | null
  cloudinary_url: string | null
  cdn_url: string | null
  thumbnail_url: string | null
  srcset: string | null
  transforms: Record<string, { url: string; width: number; height: number }> | null
  optimized_size: number | null
  optimization_score: number | null
  position: number
  is_primary: boolean
  alt_text: string | null
  title: string | null
  tags: string[]
  error_message: string | null
  retry_count: number
  processed_at: string | null
  created_at: string
}

const STATUS_CONFIG = {
  pending:    { label: 'En attente',  icon: Clock,         color: 'text-muted-foreground', bg: 'bg-muted' },
  processing: { label: 'Traitement', icon: Loader2,       color: 'text-blue-500',         bg: 'bg-blue-500/10' },
  ready:      { label: 'Prêt',       icon: CheckCircle,   color: 'text-emerald-500',      bg: 'bg-emerald-500/10' },
  failed:     { label: 'Échoué',     icon: AlertTriangle, color: 'text-destructive',      bg: 'bg-destructive/10' },
}

const TRANSFORM_LABELS: Record<string, { label: string; icon: typeof Monitor }> = {
  thumbnail:  { label: 'Miniature 300×300',   icon: LayoutGrid },
  gallery:    { label: 'Galerie 1200×1200',   icon: Maximize2 },
  ads_square: { label: 'Pub carré 1080×1080', icon: Square },
  ads_story:  { label: 'Story 1080×1920',     icon: Smartphone },
  cdn_auto:   { label: 'CDN Auto (f/q auto)', icon: Monitor },
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface Props {
  productId?: string
}

export function ProductMediaManager({ productId }: Props) {
  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedMedia, setSelectedMedia] = useState<ProductMedia | null>(null)
  const [searchProduct, setSearchProduct] = useState(productId || '')

  const activeProductId = productId || searchProduct

  // Fetch product media
  const { data: mediaItems = [], isLoading } = useQuery({
    queryKey: ['product-media', activeProductId, filterStatus],
    queryFn: async () => {
      let query = fromTable('product_media')
        .select('*')
        .order('position', { ascending: true })

      if (activeProductId) {
        query = query.eq('product_id', activeProductId)
      }
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query.limit(100)
      if (error) throw error
      return (data || []) as ProductMedia[]
    },
    enabled: true,
    refetchInterval: mediaItems.some(m => m.status === 'processing') ? 3000 : false,
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!activeProductId) {
        throw new Error('Sélectionnez un produit d\'abord')
      }

      const results = []
      for (const file of files) {
        const base64 = await fileToBase64(file)
        const { data, error } = await supabase.functions.invoke('upload-product-media', {
          body: {
            imageData: base64,
            productId: activeProductId,
            fileName: file.name,
          },
        })
        if (error) throw error
        if (data?.error) throw new Error(data.error)
        results.push(data)
      }
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-media'] })
      toast.success('Upload Cloudinary terminé ✓')
    },
    onError: (e) => toast.error(`Erreur upload: ${(e as Error).message}`),
  })

  // Reprocess mutation
  const reprocessMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      const { data, error } = await supabase.functions.invoke('process-product-media', {
        body: { action: 'reprocess', mediaId },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-media'] })
      toast.success('Re-traitement lancé')
    },
    onError: (e) => toast.error(`Erreur: ${(e as Error).message}`),
  })

  // Generate variants mutation
  const variantsMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      const { data, error } = await supabase.functions.invoke('process-product-media', {
        body: { action: 'generate_variants', mediaId },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-media'] })
      toast.success('Variantes générées')
    },
    onError: (e) => toast.error(`Erreur: ${(e as Error).message}`),
  })

  // Batch process
  const batchMutation = useMutation({
    mutationFn: async () => {
      if (!activeProductId) throw new Error('productId requis')
      const { data, error } = await supabase.functions.invoke('process-product-media', {
        body: { action: 'batch_process', productId: activeProductId },
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-media'] })
      toast.success(`${data.succeeded}/${data.total} traités`)
    },
    onError: (e) => toast.error(`Erreur batch: ${(e as Error).message}`),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      const { error } = await fromTable('product_media').delete().eq('id', mediaId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-media'] })
      setSelectedMedia(null)
      toast.success('Média supprimé')
    },
  })

  const onDrop = useCallback((files: File[]) => uploadMutation.mutate(files), [uploadMutation])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    noClick: false,
  })

  // Stats
  const stats = {
    total: mediaItems.length,
    ready: mediaItems.filter(m => m.status === 'ready').length,
    processing: mediaItems.filter(m => m.status === 'processing').length,
    failed: mediaItems.filter(m => m.status === 'failed').length,
    pending: mediaItems.filter(m => m.status === 'pending').length,
    avgScore: mediaItems.filter(m => m.optimization_score).length > 0
      ? Math.round(mediaItems.reduce((s, m) => s + (m.optimization_score || 0), 0) / mediaItems.filter(m => m.optimization_score).length)
      : 0,
  }

  return (
    <div className="space-y-6">
      {/* Header + Search */}
      {!productId && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ID produit..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="processing">En cours</SelectItem>
              <SelectItem value="ready">Prêts</SelectItem>
              <SelectItem value="failed">Échoués</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(['ready', 'processing', 'pending', 'failed'] as const).map((status) => {
          const cfg = STATUS_CONFIG[status]
          const Icon = cfg.icon
          return (
            <Card key={status} className={cn("cursor-pointer hover:shadow-md transition-all", filterStatus === status && "ring-2 ring-primary")} onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", cfg.bg)}>
                  <Icon className={cn("h-4 w-4", cfg.color, status === 'processing' && "animate-spin")} />
                </div>
                <div>
                  <p className={cn("text-xl font-bold tabular-nums", cfg.color)}>{stats[status]}</p>
                  <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums text-primary">{stats.avgScore}%</p>
              <p className="text-[10px] text-muted-foreground">Score optim.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div {...getRootProps()} className={cn("cursor-pointer", isDragActive && "ring-2 ring-primary rounded-lg")}>
          <input {...getInputProps()} />
          <Button className="gap-2" disabled={uploadMutation.isPending || !activeProductId}>
            {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload → Cloudinary
          </Button>
        </div>
        {stats.total > 0 && (
          <Button variant="outline" className="gap-2" onClick={() => batchMutation.mutate()} disabled={batchMutation.isPending}>
            {batchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Regénérer variantes
          </Button>
        )}
      </div>

      {/* Media grid */}
      <div className="flex gap-6">
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
            </div>
          ) : mediaItems.length === 0 ? (
            <div {...getRootProps()} className={cn("border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors", isDragActive && "border-primary bg-primary/5")}>
              <input {...getInputProps()} />
              <Image className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-40" />
              <h3 className="text-lg font-semibold mb-2">Aucun média produit</h3>
              <p className="text-sm text-muted-foreground mb-4">Déposez des images pour les uploader sur Cloudinary</p>
              <p className="text-xs text-muted-foreground">Pipeline: Upload → Cloudinary → Optimisation f_auto/q_auto → CDN → Variantes</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <AnimatePresence>
                {mediaItems.map((media) => {
                  const cfg = STATUS_CONFIG[media.status]
                  const StatusIcon = cfg.icon
                  const imgSrc = media.thumbnail_url || media.cdn_url || media.cloudinary_url
                  return (
                    <motion.div
                      key={media.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={cn(
                        "group relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all hover:shadow-lg",
                        selectedMedia?.id === media.id && "ring-2 ring-primary shadow-lg",
                        media.status === 'failed' && "border-destructive/50"
                      )}
                      onClick={() => setSelectedMedia(media)}
                    >
                      {imgSrc ? (
                        <img src={imgSrc} alt={media.alt_text || media.original_filename} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          {media.status === 'processing' ? (
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                          ) : (
                            <Image className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                      )}

                      {/* Status badge */}
                      <Badge className={cn("absolute top-2 right-2 text-[10px] gap-1", cfg.bg, cfg.color)} variant="secondary">
                        <StatusIcon className={cn("h-3 w-3", media.status === 'processing' && "animate-spin")} />
                        {cfg.label}
                      </Badge>

                      {/* Score badge */}
                      {media.optimization_score != null && media.optimization_score > 0 && (
                        <Badge className="absolute bottom-2 left-2 text-[10px] bg-background/80 backdrop-blur-sm" variant="outline">
                          ⚡ {media.optimization_score}%
                        </Badge>
                      )}

                      {/* Position */}
                      <span className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold">
                        {media.position}
                      </span>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {media.status === 'failed' && (
                          <Button size="sm" variant="secondary" className="gap-1.5 text-xs" onClick={(e) => { e.stopPropagation(); reprocessMutation.mutate(media.id) }}>
                            <RefreshCw className="h-3 w-3" />Retry
                          </Button>
                        )}
                        {media.cdn_url && (
                          <Button size="sm" variant="secondary" className="gap-1.5 text-xs" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(media.cdn_url!); toast.success('URL CDN copiée') }}>
                            <Copy className="h-3 w-3" />CDN
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedMedia && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-80 shrink-0"
            >
              <Card className="sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    Détails média
                    <Badge variant="secondary" className={cn("text-[10px]", STATUS_CONFIG[selectedMedia.status].color)}>
                      {STATUS_CONFIG[selectedMedia.status].label}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Preview */}
                  {(selectedMedia.cdn_url || selectedMedia.cloudinary_url) && (
                    <img
                      src={selectedMedia.cdn_url || selectedMedia.cloudinary_url || ''}
                      alt={selectedMedia.alt_text || ''}
                      className="w-full rounded-lg border"
                    />
                  )}

                  {/* Info */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Fichier</span><span className="font-medium truncate ml-2">{selectedMedia.original_filename}</span></div>
                    {selectedMedia.original_size && <div className="flex justify-between"><span className="text-muted-foreground">Taille originale</span><span>{formatBytes(selectedMedia.original_size)}</span></div>}
                    {selectedMedia.optimized_size && <div className="flex justify-between"><span className="text-muted-foreground">Taille optimisée</span><span className="text-emerald-500">{formatBytes(selectedMedia.optimized_size)}</span></div>}
                    {selectedMedia.original_width && <div className="flex justify-between"><span className="text-muted-foreground">Dimensions</span><span>{selectedMedia.original_width}×{selectedMedia.original_height}</span></div>}
                    {selectedMedia.format && <div className="flex justify-between"><span className="text-muted-foreground">Format</span><span className="uppercase">{selectedMedia.format}</span></div>}
                    {selectedMedia.optimization_score != null && (
                      <div>
                        <div className="flex justify-between mb-1"><span className="text-muted-foreground">Score optimisation</span><span className="font-bold">{selectedMedia.optimization_score}%</span></div>
                        <Progress value={selectedMedia.optimization_score} className="h-1.5" />
                      </div>
                    )}
                    {selectedMedia.error_message && (
                      <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-destructive text-[11px]">{selectedMedia.error_message}</p>
                      </div>
                    )}
                  </div>

                  {/* Transforms */}
                  {selectedMedia.transforms && Object.keys(selectedMedia.transforms).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2">Variantes Cloudinary</p>
                      <ScrollArea className="max-h-40">
                        <div className="space-y-1.5">
                          {Object.entries(selectedMedia.transforms).map(([name, transform]) => {
                            const config = TRANSFORM_LABELS[name]
                            const Icon = config?.icon || Monitor
                            return (
                              <div key={name} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 group/t text-xs">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="flex-1 truncate">{config?.label || name}</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/t:opacity-100" onClick={() => { navigator.clipboard.writeText(transform.url); toast.success(`URL ${name} copiée`) }}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <a href={transform.url} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </a>
                              </div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2 border-t">
                    {selectedMedia.status === 'ready' && (
                      <Button size="sm" variant="outline" className="gap-2 text-xs" onClick={() => variantsMutation.mutate(selectedMedia.id)} disabled={variantsMutation.isPending}>
                        <RefreshCw className={cn("h-3.5 w-3.5", variantsMutation.isPending && "animate-spin")} />
                        Regénérer variantes
                      </Button>
                    )}
                    {selectedMedia.status === 'failed' && (
                      <Button size="sm" className="gap-2 text-xs" onClick={() => reprocessMutation.mutate(selectedMedia.id)} disabled={reprocessMutation.isPending}>
                        <RefreshCw className={cn("h-3.5 w-3.5", reprocessMutation.isPending && "animate-spin")} />
                        Re-traiter
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" className="gap-2 text-xs" onClick={() => deleteMutation.mutate(selectedMedia.id)}>
                      <Trash2 className="h-3.5 w-3.5" />Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
