import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, X, ChevronLeft, ChevronRight, Check, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { EnhancedVideoPlayer, VideoThumbnail } from './EnhancedVideoPlayer'
import { useVideoProgress } from '@/hooks/useVideoProgress'
import type { TutorialVideo } from '@/data/tutorialVideos'
import { cn } from '@/lib/utils'

interface VideoTutorialSectionProps {
  tutorialId: string
  videos: TutorialVideo[]
  title?: string
  onVideoComplete?: (videoId: string) => void
}

export function VideoTutorialSection({
  tutorialId,
  videos,
  title = 'Vidéos tutoriels',
  onVideoComplete
}: VideoTutorialSectionProps) {
  const [selectedVideo, setSelectedVideo] = useState<TutorialVideo | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const videoIds = videos.map(v => v.id)
  const { progress, markAsCompleted, getCompletionPercentage } = useVideoProgress(videoIds)

  const handleVideoEnd = () => {
    if (selectedVideo) {
      markAsCompleted(selectedVideo.id)
      onVideoComplete?.(selectedVideo.id)
      
      // Auto-play next video
      const nextIndex = currentIndex + 1
      if (nextIndex < videos.length) {
        setCurrentIndex(nextIndex)
        setSelectedVideo(videos[nextIndex])
      }
    }
  }

  const handleSelectVideo = (video: TutorialVideo, index: number) => {
    setSelectedVideo(video)
    setCurrentIndex(index)
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      setSelectedVideo(videos[newIndex])
    }
  }

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      setSelectedVideo(videos[newIndex])
    }
  }

  const completedCount = videoIds.filter(id => progress[id]?.completed).length
  const completionPercentage = getCompletionPercentage()

  if (videos.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Play className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {completedCount}/{videos.length} vidéos • {completionPercentage}% complété
            </p>
          </div>
        </div>
        <Badge variant={completionPercentage === 100 ? 'default' : 'secondary'}>
          {completionPercentage === 100 ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Terminé
            </>
          ) : (
            <>
              <Clock className="w-3 h-3 mr-1" />
              En cours
            </>
          )}
        </Badge>
      </div>

      {/* Video Grid/Carousel */}
      <ScrollArea className="w-full whitespace-nowrap pb-2">
        <div className="flex gap-4">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-64 flex-shrink-0"
            >
              <VideoThumbnail
                youtubeId={video.youtubeId}
                title={video.title}
                duration={video.duration}
                isCompleted={progress[video.id]?.completed}
                onClick={() => handleSelectVideo(video, index)}
              />
              <div className="mt-2">
                <p className="text-sm font-medium truncate">{video.title}</p>
                <p className="text-xs text-muted-foreground truncate">{video.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Video Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Tutoriel vidéo</DialogTitle>
          <AnimatePresence mode="wait">
            {selectedVideo && (
              <motion.div
                key={selectedVideo.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Video Player */}
                <EnhancedVideoPlayer
                  youtubeId={selectedVideo.youtubeId}
                  title={selectedVideo.title}
                  duration={selectedVideo.duration}
                  onVideoEnd={handleVideoEnd}
                  autoPlay
                />

                {/* Video Info & Navigation */}
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedVideo.title}</h3>
                    <p className="text-sm text-muted-foreground">{selectedVideo.description}</p>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Précédent
                    </Button>

                    <div className="flex items-center gap-2">
                      {videos.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectVideo(videos[idx], idx)}
                          className={cn(
                            'w-2 h-2 rounded-full transition-colors',
                            idx === currentIndex
                              ? 'bg-primary'
                              : progress[videos[idx].id]?.completed
                              ? 'bg-green-500'
                              : 'bg-muted'
                          )}
                        />
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleNext}
                      disabled={currentIndex === videos.length - 1}
                    >
                      Suivant
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  {/* Mark as watched button */}
                  {!progress[selectedVideo.id]?.completed && (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => {
                        markAsCompleted(selectedVideo.id)
                        onVideoComplete?.(selectedVideo.id)
                      }}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Marquer comme vu
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Compact video list for tutorial steps
interface VideoStepProps {
  video: TutorialVideo
  isCompleted?: boolean
  onPlay: () => void
}

export function VideoStep({ video, isCompleted, onPlay }: VideoStepProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onPlay}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
        isCompleted
          ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
          : 'bg-card border-border hover:bg-accent'
      )}
    >
      <div className="relative w-20 aspect-video rounded overflow-hidden flex-shrink-0">
        <img
          src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <Play className="w-6 h-6 text-white" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{video.title}</p>
        <p className="text-xs text-muted-foreground">{video.duration}</p>
      </div>

      {isCompleted && (
        <div className="p-1 rounded-full bg-green-500 text-white">
          <Check className="w-3 h-3" />
        </div>
      )}
    </motion.div>
  )
}
