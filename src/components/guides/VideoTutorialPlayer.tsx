import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, Volume2, VolumeX, Maximize, ExternalLink, FileVideo } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface VideoTutorialPlayerProps {
  title: string
  description?: string
  youtubeId?: string
  videoUrl?: string
  duration?: string
  thumbnailUrl?: string
  platform: string
}

export function VideoTutorialPlayer({
  title,
  description,
  youtubeId,
  videoUrl,
  duration,
  thumbnailUrl,
  platform
}: VideoTutorialPlayerProps) {
  const [showPlaceholder, setShowPlaceholder] = useState(!youtubeId && !videoUrl)

  // YouTube embed
  if (youtubeId) {
    return (
      <Card className="overflow-hidden">
        <div className="aspect-video w-full">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {duration && (
              <Badge variant="secondary">{duration}</Badge>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // Direct video URL
  if (videoUrl) {
    return (
      <Card className="overflow-hidden">
        <div className="aspect-video w-full bg-black">
          <video
            controls
            className="w-full h-full"
            poster={thumbnailUrl}
          >
            <source src={videoUrl} type="video/mp4" />
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {duration && (
              <Badge variant="secondary">{duration}</Badge>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // Placeholder for future video
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-6">
            <FileVideo className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Tutoriel vidéo à venir
            </p>
            <p className="text-xs text-muted-foreground">
              Guide pour {platform}
            </p>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="text-center text-white">
            <Play className="h-16 w-16 mx-auto mb-2" />
            <p className="text-sm font-medium">Vidéo à venir</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {duration && (
            <Badge variant="secondary">{duration}</Badge>
          )}
        </div>
        <Alert className="mt-4">
          <AlertDescription className="text-xs">
            Cette vidéo est en préparation. En attendant, suivez les étapes écrites ci-dessous.
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  )
}

// Component for video gallery
interface VideoGalleryProps {
  videos: Array<{
    id: string
    title: string
    description?: string
    youtubeId?: string
    videoUrl?: string
    duration?: string
    thumbnailUrl?: string
  }>
  platform: string
}

export function VideoGallery({ videos, platform }: VideoGalleryProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {videos.map((video) => (
        <VideoTutorialPlayer
          key={video.id}
          title={video.title}
          description={video.description}
          youtubeId={video.youtubeId}
          videoUrl={video.videoUrl}
          duration={video.duration}
          thumbnailUrl={video.thumbnailUrl}
          platform={platform}
        />
      ))}
    </div>
  )
}
