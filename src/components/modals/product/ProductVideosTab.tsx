/**
 * ProductVideosTab - Onglet Vidéos pour le modal produit
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Video,
  Play,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Download,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface ProductVideosTabProps {
  videos: string[]
  productName: string
  onAddVideo?: (url: string) => Promise<void>
  onDeleteVideo?: (index: number) => Promise<void>
  isEditing?: boolean
}

export function ProductVideosTab({ 
  videos = [], 
  productName,
  onAddVideo,
  onDeleteVideo,
  isEditing = false
}: ProductVideosTabProps) {
  const [playingVideo, setPlayingVideo] = useState<number | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [previewVideo, setPreviewVideo] = useState<string | null>(null)

  const handleAddVideo = async () => {
    if (!newVideoUrl.trim() || !onAddVideo) return
    
    try {
      new URL(newVideoUrl)
    } catch {
      return
    }

    setIsAdding(true)
    try {
      await onAddVideo(newVideoUrl.trim())
      setNewVideoUrl('')
      setShowAddDialog(false)
    } finally {
      setIsAdding(false)
    }
  }

  const getVideoType = (url: string): string => {
    if (url.includes('.mp4')) return 'MP4'
    if (url.includes('.m3u8')) return 'HLS Stream'
    if (url.includes('.webm')) return 'WebM'
    if (url.includes('youtube') || url.includes('youtu.be')) return 'YouTube'
    if (url.includes('vimeo')) return 'Vimeo'
    return 'Vidéo'
  }

  const getVideoThumbnail = (url: string): string | null => {
    // YouTube thumbnail extraction
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (ytMatch) {
      return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Video className="h-7 w-7 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{videos.length} vidéo{videos.length !== 1 ? 's' : ''}</h3>
                <p className="text-sm text-muted-foreground">
                  Vidéos produit pour {productName}
                </p>
              </div>
            </div>
            {isEditing && (
              <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Videos Grid */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {videos.map((video, idx) => {
              const thumbnail = getVideoThumbnail(video)
              const videoType = getVideoType(video)
              const isPlaying = playingVideo === idx

              return (
                <motion.div
                  key={`${video}-${idx}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="overflow-hidden group hover:shadow-lg transition-all">
                    {/* Video Preview / Thumbnail */}
                    <div className="relative aspect-video bg-black">
                      {previewVideo === video ? (
                        <video
                          src={video}
                          controls
                          autoPlay
                          className="w-full h-full object-contain"
                          onEnded={() => setPreviewVideo(null)}
                        />
                      ) : thumbnail ? (
                        <img 
                          src={thumbnail} 
                          alt={`Video ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                          <Video className="h-16 w-16 text-white/50" />
                        </div>
                      )}

                      {/* Play Overlay */}
                      {previewVideo !== video && (
                        <div 
                          className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                          onClick={() => setPreviewVideo(video)}
                        >
                          <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                            <Play className="h-8 w-8 text-purple-600 ml-1" />
                          </div>
                        </div>
                      )}

                      {/* Type Badge */}
                      <Badge className="absolute top-3 left-3 bg-black/60 text-white border-0">
                        {videoType}
                      </Badge>
                    </div>

                    {/* Video Info */}
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Vidéo {idx + 1}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {video.split('/').pop()?.substring(0, 30) || 'Video'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(video, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <a href={video} download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          {isEditing && onDeleteVideo && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => onDeleteVideo(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Video className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-medium mb-2">Aucune vidéo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Importez des vidéos produit via l'extension Chrome ShopOpti+
              </p>
              {isEditing && (
                <Button variant="outline" onClick={() => setShowAddDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter une vidéo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Video Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Ajouter une vidéo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>URL de la vidéo</Label>
              <Input
                placeholder="https://exemple.com/video.mp4"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
              />
              <p className="text-xs text-muted-foreground">
                Formats supportés: MP4, WebM, YouTube, Vimeo
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddVideo} disabled={isAdding || !newVideoUrl.trim()}>
              {isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
