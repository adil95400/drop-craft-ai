import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Upload, Youtube, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useDropzone } from 'react-dropzone'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'

const formSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  video_type: z.enum(['youtube', 'upload', 'external']),
  youtube_id: z.string().optional(),
  video_url: z.string().optional(),
  thumbnail_url: z.string().optional(),
  duration: z.string().optional(),
  order_index: z.number().min(0),
})

interface VideoTutorialFormProps {
  video?: any
  platform: string
  onClose: () => void
  onSuccess: () => void
}

export function VideoTutorialForm({ video, platform, onClose, onSuccess }: VideoTutorialFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: video?.title || '',
      description: video?.description || '',
      video_type: video?.video_type || 'youtube',
      youtube_id: video?.youtube_id || '',
      video_url: video?.video_url || '',
      thumbnail_url: video?.thumbnail_url || '',
      duration: video?.duration || '',
      order_index: video?.order_index || 0,
    },
  })

  const videoType = watch('video_type')

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Check file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'La taille maximale est de 500MB',
        variant: 'destructive',
      })
      return
    }

    setVideoFile(file)
    
    // Upload to Supabase Storage
    try {
      setLoading(true)
      const fileName = `${platform}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      
      const { data, error } = await supabase.storage
        .from('video-tutorials')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('video-tutorials')
        .getPublicUrl(fileName)

      setUploadedVideoUrl(publicUrl)
      setValue('video_url', publicUrl)
      
      toast({
        title: 'Upload réussi',
        description: 'La vidéo a été uploadée avec succès',
      })
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: 'Erreur d\'upload',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm'],
      'video/quicktime': ['.mov'],
    },
    maxFiles: 1,
    disabled: loading,
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setLoading(true)

      const videoData = {
        platform,
        title: data.title,
        description: data.description,
        video_type: data.video_type,
        youtube_id: data.video_type === 'youtube' ? data.youtube_id : null,
        video_url: data.video_type === 'upload' ? uploadedVideoUrl || data.video_url : data.video_url,
        thumbnail_url: data.thumbnail_url,
        duration: data.duration,
        order_index: data.order_index,
        is_active: true,
      }

      if (video) {
        // Update existing video
        const { error } = await supabase
          .from('video_tutorials')
          .update(videoData)
          .eq('id', video.id)

        if (error) throw error

        toast({
          title: 'Vidéo mise à jour',
          description: 'La vidéo a été mise à jour avec succès',
        })
      } else {
        // Create new video
        const { error } = await supabase
          .from('video_tutorials')
          .insert([videoData])

        if (error) throw error

        toast({
          title: 'Vidéo ajoutée',
          description: 'La vidéo a été ajoutée avec succès',
        })
      }

      onSuccess()
    } catch (error: any) {
      console.error('Form error:', error)
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{video ? 'Modifier' : 'Ajouter'} une vidéo tutoriel</DialogTitle>
          <DialogDescription>
            Plateforme: {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Introduction à l'intégration Shopify"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{String(errors.title.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Vue d'ensemble complète du processus d'intégration"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_type">Type de vidéo *</Label>
            <Select
              value={videoType}
              onValueChange={(value) => setValue('video_type', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">
                  <div className="flex items-center gap-2">
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </div>
                </SelectItem>
                <SelectItem value="upload">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload (Supabase Storage)
                  </div>
                </SelectItem>
                <SelectItem value="external">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    URL externe
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {videoType === 'youtube' && (
            <div className="space-y-2">
              <Label htmlFor="youtube_id">ID YouTube *</Label>
              <Input
                id="youtube_id"
                {...register('youtube_id')}
                placeholder="dQw4w9WgXcQ"
              />
              <p className="text-xs text-muted-foreground">
                Exemple: pour https://youtube.com/watch?v=ABC123, l'ID est ABC123
              </p>
            </div>
          )}

          {videoType === 'upload' && (
            <div className="space-y-2">
              <Label>Upload Vidéo *</Label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input {...getInputProps()} />
                {videoFile || uploadedVideoUrl ? (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-green-500" />
                    <p className="text-sm font-medium">
                      {videoFile?.name || 'Vidéo uploadée'}
                    </p>
                    {uploadedVideoUrl && (
                      <p className="text-xs text-muted-foreground">
                        URL: {uploadedVideoUrl.substring(0, 50)}...
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm">
                      Glissez-déposez une vidéo ou cliquez pour sélectionner
                    </p>
                    <p className="text-xs text-muted-foreground">
                      MP4, WebM, MOV • Max 500MB
                    </p>
                  </div>
                )}
              </div>
              {uploadProgress > 0 && (
                <Progress value={uploadProgress} className="mt-2" />
              )}
            </div>
          )}

          {videoType === 'external' && (
            <div className="space-y-2">
              <Label htmlFor="video_url">URL de la vidéo *</Label>
              <Input
                id="video_url"
                {...register('video_url')}
                placeholder="https://example.com/video.mp4"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Durée</Label>
              <Input
                id="duration"
                {...register('duration')}
                placeholder="5:30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_index">Ordre d'affichage</Label>
              <Input
                id="order_index"
                type="number"
                {...register('order_index', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">URL de la miniature</Label>
            <Input
              id="thumbnail_url"
              {...register('thumbnail_url')}
              placeholder="https://example.com/thumbnail.jpg"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {video ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
