import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface VideoTutorial {
  id: string
  platform: string
  title: string
  description?: string
  youtube_id?: string
  video_url?: string
  duration?: string
  thumbnail_url?: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useVideoTutorials(platform?: string) {
  return useQuery({
    queryKey: ['video-tutorials', platform],
    queryFn: async () => {
      let query = supabase
        .from('video_tutorials')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (platform) {
        query = query.eq('platform', platform)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching video tutorials:', error)
        throw error
      }

      return data as VideoTutorial[]
    },
  })
}
