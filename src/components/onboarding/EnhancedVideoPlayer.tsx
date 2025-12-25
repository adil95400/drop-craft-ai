import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Maximize2, Volume2, VolumeX, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface EnhancedVideoPlayerProps {
  youtubeId: string
  title: string
  duration?: string
  onVideoEnd?: () => void
  onProgressUpdate?: (watchedSeconds: number, totalSeconds: number) => void
  autoPlay?: boolean
  className?: string
}

export function EnhancedVideoPlayer({
  youtubeId,
  title,
  duration,
  onVideoEnd,
  onProgressUpdate,
  autoPlay = false,
  className
}: EnhancedVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  // Initialize player when API is ready
  useEffect(() => {
    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player(`youtube-player-${youtubeId}`, {
          height: '100%',
          width: '100%',
          videoId: youtubeId,
          playerVars: {
            autoplay: autoPlay ? 1 : 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0
          },
          events: {
            onStateChange: handleStateChange,
            onReady: handlePlayerReady
          }
        })
      }
    }

    if (window.YT) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      playerRef.current?.destroy()
    }
  }, [youtubeId, autoPlay])

  const handlePlayerReady = () => {
    if (autoPlay) {
      playerRef.current?.playVideo()
    }
  }

  const handleStateChange = (event: any) => {
    if (event.data === 1) { // PLAYING
      setIsPlaying(true)
      startProgressTracking()
    } else if (event.data === 2) { // PAUSED
      setIsPlaying(false)
      stopProgressTracking()
    } else if (event.data === 0) { // ENDED
      setIsPlaying(false)
      setProgress(100)
      stopProgressTracking()
      onVideoEnd?.()
    }
  }

  const startProgressTracking = () => {
    if (progressIntervalRef.current) return

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime() || 0
        const duration = playerRef.current.getDuration() || 1
        const progressPercent = (currentTime / duration) * 100
        setProgress(progressPercent)
        onProgressUpdate?.(currentTime, duration)
      }
    }, 1000)
  }

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo()
      } else {
        playerRef.current.playVideo()
      }
    }
  }

  const toggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute()
      } else {
        playerRef.current.mute()
      }
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (playerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const duration = playerRef.current.getDuration() || 0
      playerRef.current.seekTo(duration * percentage, true)
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative aspect-video bg-black rounded-lg overflow-hidden group',
        className
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* YouTube Player Container */}
      <div id={`youtube-player-${youtubeId}`} className="w-full h-full" />

      {/* Custom Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"
          >
            {/* Title */}
            <div className="absolute top-0 left-0 right-0 p-4">
              <h4 className="text-white font-medium truncate">{title}</h4>
              {duration && (
                <span className="text-white/70 text-sm">{duration}</span>
              )}
            </div>

            {/* Center Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground shadow-lg"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </motion.button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
              {/* Progress Bar */}
              <div
                className="w-full h-1 bg-white/30 rounded-full cursor-pointer"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20 h-8 w-8"
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20 h-8 w-8"
                    onClick={toggleMute}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={toggleFullscreen}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed Badge */}
      {progress >= 90 && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <Check className="w-3 h-3" />
          Vu
        </div>
      )}
    </div>
  )
}

// Simple video thumbnail for list displays
interface VideoThumbnailProps {
  youtubeId: string
  title: string
  duration?: string
  isCompleted?: boolean
  onClick?: () => void
  className?: string
}

export function VideoThumbnail({
  youtubeId,
  title,
  duration,
  isCompleted = false,
  onClick,
  className
}: VideoThumbnailProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group',
        className
      )}
    >
      <img
        src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
        alt={title}
        className="w-full h-full object-cover"
      />
      
      {/* Play overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
          <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
        </div>
      </div>

      {/* Duration badge */}
      {duration && (
        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-0.5 rounded text-xs">
          {duration}
        </div>
      )}

      {/* Completed badge */}
      {isCompleted && (
        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
          <Check className="w-3 h-3" />
        </div>
      )}

      {/* Title overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-white text-sm font-medium truncate">{title}</p>
      </div>
    </motion.div>
  )
}

// Declare YouTube types
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}
