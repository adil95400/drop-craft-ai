import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface VideoPlayerProps {
  thumbnail: string;
  title?: string;
  description?: string;
}

export function VideoPlayer({ thumbnail, title, description }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <Card className="overflow-hidden border-2 hover:shadow-2xl transition-all duration-300 group">
      <div className="relative aspect-video bg-secondary/30">
        {/* Thumbnail */}
        <img
          src={thumbnail}
          alt={title || 'Video thumbnail'}
          className="w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              size="lg"
              className="rounded-full h-20 w-20 bg-primary hover:bg-primary/90 hover:scale-110 transition-transform"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>
          </div>

          {/* Controls Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-white hover:bg-white/20"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            {/* Progress bar */}
            <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-1/3 transition-all" />
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-white hover:bg-white/20"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-white hover:bg-white/20"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>

          {/* Duration Badge */}
          <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 rounded text-xs text-white font-medium">
            2:35
          </div>
        </div>
      </div>

      {/* Info */}
      {(title || description) && (
        <div className="p-4 space-y-2">
          {title && <h3 className="font-semibold text-lg">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
    </Card>
  );
}
