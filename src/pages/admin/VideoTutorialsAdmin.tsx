import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Video, Youtube, Upload, Eye, EyeOff, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { VideoTutorialForm } from '@/components/admin/VideoTutorialForm'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface VideoTutorial {
  id: string
  platform: string
  title: string
  description: string | null
  video_type: string // Will be 'youtube' | 'upload' | 'external'
  youtube_id: string | null
  video_url: string | null
  thumbnail_url: string | null
  duration: string | null
  order_index: number
  is_active: boolean
  view_count: number
  created_at: string
}

const platforms = [
  { value: 'shopify', label: 'Shopify', icon: '🛍️' },
  { value: 'woocommerce', label: 'WooCommerce', icon: '🌐' },
  { value: 'etsy', label: 'Etsy', icon: '🎨' },
  { value: 'prestashop', label: 'PrestaShop', icon: '🏪' },
  { value: 'amazon', label: 'Amazon', icon: '📦' },
  { value: 'ebay', label: 'eBay', icon: '🏷️' },
]

export default function VideoTutorialsAdmin() {
  const { toast } = useToast()
  const [videos, setVideos] = useState<VideoTutorial[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState('shopify')
  const [editingVideo, setEditingVideo] = useState<VideoTutorial | null>(null)
  const [deletingVideo, setDeletingVideo] = useState<VideoTutorial | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchVideos()
  }, [selectedPlatform])

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('video_tutorials')
        .select('*')
        .eq('platform', selectedPlatform)
        .order('order_index', { ascending: true })

      if (error) throw error
      setVideos((data as any[]) || [])
    } catch (error: any) {
      console.error('Error fetching videos:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les vidéos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingVideo) return

    try {
      // Delete video file from storage if it exists
      if (deletingVideo.video_url && deletingVideo.video_type === 'upload') {
        const path = deletingVideo.video_url.split('/').pop()
        if (path) {
          await supabase.storage.from('video-tutorials').remove([path])
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('video_tutorials')
        .delete()
        .eq('id', deletingVideo.id)

      if (error) throw error

      toast({
        title: 'Vidéo supprimée',
        description: 'La vidéo a été supprimée avec succès',
      })

      fetchVideos()
    } catch (error: any) {
      console.error('Error deleting video:', error)
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setDeletingVideo(null)
    }
  }

  const handleToggleActive = async (video: VideoTutorial) => {
    try {
      const { error } = await supabase
        .from('video_tutorials')
        .update({ is_active: !video.is_active })
        .eq('id', video.id)

      if (error) throw error

      toast({
        title: video.is_active ? 'Vidéo désactivée' : 'Vidéo activée',
        description: `La vidéo est maintenant ${video.is_active ? 'invisible' : 'visible'} pour les utilisateurs`,
      })

      fetchVideos()
    } catch (error: any) {
      console.error('Error toggling video:', error)
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const getVideoTypeIcon = (type: string) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="h-4 w-4" />
      case 'upload':
        return <Upload className="h-4 w-4" />
      default:
        return <Video className="h-4 w-4" />
    }
  }

  const getVideoTypeBadge = (type: string) => {
    switch (type) {
      case 'youtube':
        return <Badge variant="outline" className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300">YouTube</Badge>
      case 'upload':
        return <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">Upload</Badge>
      default:
        return <Badge variant="outline">Externe</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Vidéos Tutoriels</h1>
            <p className="text-muted-foreground">
              Ajoutez et gérez les vidéos tutoriels pour les guides d'intégration
            </p>
          </div>
          <Button onClick={() => { setEditingVideo(null); setShowForm(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une vidéo
          </Button>
        </div>
      </div>

      <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
        <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-6">
          {platforms.map((platform) => (
            <TabsTrigger key={platform.value} value={platform.value}>
              <span className="mr-2">{platform.icon}</span>
              {platform.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {platforms.map((platform) => (
          <TabsContent key={platform.value} value={platform.value}>
            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-32 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : videos.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Video className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Aucune vidéo</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ajoutez votre première vidéo tutoriel pour {platform.label}
                  </p>
                  <Button onClick={() => { setEditingVideo(null); setShowForm(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une vidéo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {videos.map((video) => (
                  <Card key={video.id} className={!video.is_active ? 'opacity-60' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getVideoTypeIcon(video.video_type)}
                            <CardTitle className="text-lg">{video.title}</CardTitle>
                          </div>
                          <CardDescription>{video.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          {getVideoTypeBadge(video.video_type)}
                          {!video.is_active && (
                            <Badge variant="secondary">Inactif</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {video.thumbnail_url && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Durée: {video.duration || 'N/A'}</span>
                        <span>Vues: {video.view_count}</span>
                        <span>Ordre: #{video.order_index}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => { setEditingVideo(video); setShowForm(true) }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(video)}
                        >
                          {video.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeletingVideo(video)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Form Dialog */}
      {showForm && (
        <VideoTutorialForm
          video={editingVideo}
          platform={selectedPlatform}
          onClose={() => {
            setShowForm(false)
            setEditingVideo(null)
          }}
          onSuccess={() => {
            setShowForm(false)
            setEditingVideo(null)
            fetchVideos()
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingVideo} onOpenChange={(open) => !open && setDeletingVideo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette vidéo ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La vidéo sera définitivement supprimée.
              {deletingVideo?.video_type === 'upload' && (
                <p className="mt-2 font-medium">
                  Le fichier vidéo sera également supprimé du stockage.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
