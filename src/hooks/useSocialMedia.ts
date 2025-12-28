import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export interface SocialAccount {
  id: string
  platform: string
  username: string
  followers: number
  isConnected: boolean
  profileImage: string
}

export interface SocialPost {
  id: string
  platform: 'instagram' | 'twitter' | 'facebook' | 'linkedin' | 'youtube'
  content: string
  mediaUrls: string[]
  hashtags: string[]
  scheduledAt?: string
  status: 'draft' | 'scheduled' | 'published'
  engagement?: {
    likes: number
    comments: number
    shares: number
    views?: number
  }
  created_at?: string
}

export function useSocialMedia() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch social accounts from integrations table
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['social-accounts', user?.id],
    queryFn: async (): Promise<SocialAccount[]> => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .in('platform', ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok'])

      if (error) throw error

      return (data || []).map((integration: any) => ({
        id: integration.id,
        platform: integration.platform,
        username: integration.store_id || `@${integration.platform}`,
        followers: (integration.config as any)?.followers || 0,
        isConnected: integration.is_active,
        profileImage: '/placeholder.svg'
      }))
    },
    enabled: !!user?.id
  })

  // Fetch social posts from marketing_campaigns with type 'social'
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['social-posts', user?.id],
    queryFn: async (): Promise<SocialPost[]> => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'social')
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((campaign: any) => {
        const metrics = campaign.metrics as any || {}
        return {
          id: campaign.id,
          platform: metrics.platform || 'instagram',
          content: campaign.name,
          mediaUrls: metrics.mediaUrls || [],
          hashtags: metrics.hashtags || [],
          scheduledAt: campaign.start_date,
          status: campaign.status === 'active' ? 'published' : campaign.status === 'scheduled' ? 'scheduled' : 'draft',
          engagement: {
            likes: metrics.likes || 0,
            comments: metrics.comments || 0,
            shares: metrics.shares || 0,
            views: metrics.impressions || 0
          },
          created_at: campaign.created_at
        }
      })
    },
    enabled: !!user?.id
  })

  // Create a new social post
  const createPost = useMutation({
    mutationFn: async (postData: Omit<SocialPost, 'id'>) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert([{
          user_id: user.id,
          name: postData.content,
          type: 'social',
          status: postData.status === 'published' ? 'active' : postData.status,
          start_date: postData.scheduledAt || new Date().toISOString(),
          metrics: {
            platform: postData.platform,
            hashtags: postData.hashtags,
            mediaUrls: postData.mediaUrls,
            likes: postData.engagement?.likes || 0,
            comments: postData.engagement?.comments || 0,
            shares: postData.engagement?.shares || 0,
            impressions: postData.engagement?.views || 0
          }
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] })
      toast({
        title: "Post créé",
        description: "Votre publication a été créée avec succès"
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le post",
        variant: "destructive"
      })
    }
  })

  // Connect a social account
  const connectAccount = useMutation({
    mutationFn: async (platform: string) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('integrations')
        .insert([{
          user_id: user.id,
          platform: platform,
          is_active: true,
          connection_status: 'connected',
          store_id: `@user_${platform}`
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] })
      toast({
        title: "Compte connecté",
        description: "Le compte a été connecté avec succès"
      })
    }
  })

  // Calculate total engagement
  const totalEngagement = posts.reduce((acc, post) => ({
    likes: acc.likes + (post.engagement?.likes || 0),
    comments: acc.comments + (post.engagement?.comments || 0),
    shares: acc.shares + (post.engagement?.shares || 0),
    views: acc.views + (post.engagement?.views || 0)
  }), { likes: 0, comments: 0, shares: 0, views: 0 })

  return {
    accounts,
    posts,
    totalEngagement,
    isLoading: accountsLoading || postsLoading,
    createPost: createPost.mutate,
    connectAccount: connectAccount.mutate,
    isCreating: createPost.isPending
  }
}
