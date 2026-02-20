/**
 * ProductVideoPlayer — Display and manage product videos
 * Supports YouTube, TikTok embeds and direct video URLs
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Video, Plus, Trash2, ExternalLink, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ProductVideoPlayerProps {
  videos: string[]
  onVideosChange?: (videos: string[]) => void
  readOnly?: boolean
}

function getVideoEmbed(url: string): { type: 'youtube' | 'tiktok' | 'direct'; embedUrl: string } | null {
  try {
    const u = new URL(url)

    // YouTube
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const videoId = u.hostname.includes('youtu.be')
        ? u.pathname.slice(1)
        : u.searchParams.get('v')
      if (videoId) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${videoId}` }
    }

    // TikTok
    if (u.hostname.includes('tiktok.com')) {
      return { type: 'tiktok', embedUrl: url }
    }

    // Direct video
    if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) {
      return { type: 'direct', embedUrl: url }
    }

    return { type: 'direct', embedUrl: url }
  } catch {
    return null
  }
}

export function ProductVideoPlayer({ videos, onVideosChange, readOnly = false }: ProductVideoPlayerProps) {
  const [newUrl, setNewUrl] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAdd = () => {
    if (!newUrl.trim()) return
    const updated = [...videos, newUrl.trim()]
    onVideosChange?.(updated)
    setNewUrl('')
    setShowAddForm(false)
    toast.success('Vidéo ajoutée')
  }

  const handleRemove = (index: number) => {
    const updated = videos.filter((_, i) => i !== index)
    onVideosChange?.(updated)
    if (activeIndex >= updated.length) setActiveIndex(Math.max(0, updated.length - 1))
    toast.success('Vidéo supprimée')
  }

  const activeVideo = videos[activeIndex]
  const embed = activeVideo ? getVideoEmbed(activeVideo) : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Vidéos produit</h3>
          <Badge variant="secondary">{videos.length}</Badge>
        </div>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <Card className="border-dashed">
          <CardContent className="p-4 flex gap-2">
            <Input
              placeholder="URL vidéo (YouTube, TikTok, MP4...)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button size="sm" onClick={handleAdd} disabled={!newUrl.trim()}>
              Ajouter
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Player */}
      {videos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Video className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">Aucune vidéo</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ajoutez des vidéos YouTube, TikTok ou des fichiers MP4 pour enrichir la fiche produit
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Main player */}
          <Card className="overflow-hidden">
            <div className="aspect-video bg-black relative">
              {embed?.type === 'youtube' ? (
                <iframe
                  src={embed.embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Product video"
                />
              ) : embed?.type === 'direct' ? (
                <video
                  src={embed.embedUrl}
                  controls
                  className="w-full h-full object-contain"
                  preload="metadata"
                >
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/60">
                  <div className="text-center">
                    <Play className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Format non supporté en preview</p>
                    <a href={activeVideo} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline mt-1 inline-flex items-center gap-1">
                      Ouvrir dans un nouvel onglet <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Thumbnails */}
          {videos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {videos.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "relative flex-shrink-0 w-24 h-14 rounded-lg border-2 overflow-hidden bg-muted transition-all group",
                    idx === activeIndex ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/30"
                  )}
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Play className="h-4 w-4 text-white" />
                  </div>
                  <span className="absolute bottom-0.5 right-1 text-[9px] text-white bg-black/60 px-1 rounded">
                    {idx + 1}
                  </span>
                  {!readOnly && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemove(idx) }}
                      className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
