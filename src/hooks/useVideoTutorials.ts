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

// Static tutorials data since video_tutorials table doesn't exist
const STATIC_TUTORIALS: VideoTutorial[] = [
  {
    id: '1',
    platform: 'getting-started',
    title: 'Démarrage rapide avec DropShip',
    description: 'Apprenez les bases de la plateforme en quelques minutes',
    youtube_id: 'dQw4w9WgXcQ',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    duration: '5:30',
    order_index: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    platform: 'products',
    title: 'Importer des produits depuis un fournisseur',
    description: 'Comment ajouter des produits depuis vos fournisseurs',
    youtube_id: 'dQw4w9WgXcQ',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    duration: '8:45',
    order_index: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    platform: 'shopify',
    title: 'Connecter votre boutique Shopify',
    description: 'Intégration complète avec Shopify en quelques clics',
    youtube_id: 'dQw4w9WgXcQ',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    duration: '6:20',
    order_index: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    platform: 'orders',
    title: 'Gérer vos commandes efficacement',
    description: 'Automatisez le traitement de vos commandes',
    youtube_id: 'dQw4w9WgXcQ',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    duration: '10:15',
    order_index: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    platform: 'ai',
    title: 'Optimiser vos fiches produits avec l\'IA',
    description: 'Utilisez l\'intelligence artificielle pour améliorer vos descriptions',
    youtube_id: 'dQw4w9WgXcQ',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    duration: '7:00',
    order_index: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export function useVideoTutorials(platform?: string) {
  return useQuery({
    queryKey: ['video-tutorials', platform],
    queryFn: async () => {
      // Return static tutorials since video_tutorials table doesn't exist
      let tutorials = STATIC_TUTORIALS.filter(t => t.is_active)

      if (platform) {
        tutorials = tutorials.filter(t => t.platform === platform)
      }

      return tutorials.sort((a, b) => a.order_index - b.order_index) as VideoTutorial[]
    },
  })
}
