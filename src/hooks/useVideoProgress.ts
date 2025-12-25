import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface VideoProgress {
  videoId: string
  watchedSeconds: number
  totalSeconds: number
  completed: boolean
  completedAt: string | null
}

interface UseVideoProgressReturn {
  progress: Record<string, VideoProgress>
  isLoading: boolean
  updateProgress: (videoId: string, watchedSeconds: number, totalSeconds: number) => Promise<void>
  markAsCompleted: (videoId: string) => Promise<void>
  getVideoProgress: (videoId: string) => VideoProgress | null
  getCompletionPercentage: () => number
  completedCount: number
  totalVideos: number
}

export function useVideoProgress(videoIds: string[] = []): UseVideoProgressReturn {
  const [progress, setProgress] = useState<Record<string, VideoProgress>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null)
    })
  }, [])

  // Load progress from database
  useEffect(() => {
    async function loadProgress() {
      if (!userId) {
        // Load from localStorage if not authenticated
        const stored = localStorage.getItem('video_progress')
        if (stored) {
          setProgress(JSON.parse(stored))
        }
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_video_progress')
          .select('*')
          .eq('user_id', userId)

        if (error) throw error

        const progressMap: Record<string, VideoProgress> = {}
        data?.forEach(item => {
          progressMap[item.video_id] = {
            videoId: item.video_id,
            watchedSeconds: item.watched_seconds || 0,
            totalSeconds: item.total_seconds || 0,
            completed: item.completed || false,
            completedAt: item.completed_at
          }
        })
        setProgress(progressMap)
      } catch (error) {
        console.error('Error loading video progress:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProgress()
  }, [userId])

  const updateProgress = useCallback(async (
    videoId: string, 
    watchedSeconds: number, 
    totalSeconds: number
  ) => {
    const newProgress: VideoProgress = {
      videoId,
      watchedSeconds,
      totalSeconds,
      completed: watchedSeconds >= totalSeconds * 0.9, // 90% watched = completed
      completedAt: watchedSeconds >= totalSeconds * 0.9 ? new Date().toISOString() : null
    }

    setProgress(prev => {
      const updated = { ...prev, [videoId]: newProgress }
      if (!userId) {
        localStorage.setItem('video_progress', JSON.stringify(updated))
      }
      return updated
    })

    if (userId) {
      try {
        await supabase
          .from('user_video_progress')
          .upsert({
            user_id: userId,
            video_id: videoId,
            watched_seconds: watchedSeconds,
            total_seconds: totalSeconds,
            completed: newProgress.completed,
            completed_at: newProgress.completedAt,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,video_id'
          })
      } catch (error) {
        console.error('Error updating video progress:', error)
      }
    }
  }, [userId])

  const markAsCompleted = useCallback(async (videoId: string) => {
    const existing = progress[videoId]
    const totalSeconds = existing?.totalSeconds || 300 // Default 5 minutes

    await updateProgress(videoId, totalSeconds, totalSeconds)
  }, [progress, updateProgress])

  const getVideoProgress = useCallback((videoId: string): VideoProgress | null => {
    return progress[videoId] || null
  }, [progress])

  const getCompletionPercentage = useCallback((): number => {
    if (videoIds.length === 0) return 0
    const completed = videoIds.filter(id => progress[id]?.completed).length
    return Math.round((completed / videoIds.length) * 100)
  }, [progress, videoIds])

  const completedCount = Object.values(progress).filter(p => p.completed).length
  const totalVideos = videoIds.length

  return {
    progress,
    isLoading,
    updateProgress,
    markAsCompleted,
    getVideoProgress,
    getCompletionPercentage,
    completedCount,
    totalVideos
  }
}
