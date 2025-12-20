import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, Circle, MessageCircle, Eye } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface PresenceData {
  name?: string
  avatar_url?: string
  status?: 'online' | 'busy' | 'away'
  current_page?: string
  last_activity?: string
}

interface PresenceUser {
  user_id: string
  presence_data: PresenceData
  last_seen: string
  is_active: boolean
}

interface RealtimePresenceProps {
  channelName?: string
  showCurrentPage?: boolean
}

export const RealtimePresence: React.FC<RealtimePresenceProps> = ({ 
  channelName = 'global',
  showCurrentPage = true 
}) => {
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([])
  const [currentUsers, setCurrentUsers] = useState<any[]>([])
  const { user } = useAuth()
  
  // Since realtime_presence table doesn't exist, we'll use in-memory presence
  const updatePresence = useCallback(async () => {
    if (!user) return

    // Using Supabase Realtime presence instead of database table
    console.log('Presence updated for user:', user.id)
  }, [user, channelName])

  const fetchPresenceUsers = useCallback(async () => {
    // Since the table doesn't exist, we rely on Supabase Realtime presence
    // Convert currentUsers to presenceUsers format
    const users: PresenceUser[] = currentUsers.map(u => ({
      user_id: u.user_id || u.id,
      presence_data: {
        name: u.name,
        avatar_url: u.avatar_url,
        status: 'online' as const,
        current_page: u.current_page,
        last_activity: u.online_at
      },
      last_seen: u.online_at || new Date().toISOString(),
      is_active: true
    }))
    setPresenceUsers(users)
  }, [currentUsers])

  useEffect(() => {
    if (!user) return

    // Update presence on mount and every 30 seconds
    updatePresence()
    const presenceInterval = setInterval(updatePresence, 30000)

    // Set up realtime presence tracking using Supabase Realtime
    const roomChannel = supabase.channel(`room_${channelName}`)
    
    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = roomChannel.presenceState()
        const users = Object.entries(newState).map(([key, presences]: [string, any[]]) => ({
          id: key,
          ...presences[0]
        }))
        setCurrentUsers(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return

        const userStatus = {
          user_id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
          avatar_url: user.user_metadata?.avatar_url,
          online_at: new Date().toISOString(),
          current_page: window.location.pathname
        }

        await roomChannel.track(userStatus)
      })

    // Update presence when page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Update presence when user navigates
    const handlePageChange = () => {
      updatePresence()
    }

    window.addEventListener('popstate', handlePageChange)

    // Cleanup
    return () => {
      clearInterval(presenceInterval)
      supabase.removeChannel(roomChannel)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('popstate', handlePageChange)
    }
  }, [user, channelName, updatePresence])

  // Update presenceUsers when currentUsers changes
  useEffect(() => {
    fetchPresenceUsers()
  }, [currentUsers, fetchPresenceUsers])

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'busy': return 'bg-red-500'
      case 'away': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'online': return 'default'
      case 'busy': return 'destructive'
      case 'away': return 'secondary'
      default: return 'outline'
    }
  }

  const formatPageName = (path: string) => {
    const pageNames: Record<string, string> = {
      '/': 'Accueil',
      '/dashboard': 'Dashboard',
      '/import': 'Import',
      '/catalogue': 'Catalogue',
      '/orders': 'Commandes',
      '/crm': 'CRM',
      '/tracking': 'Suivi',
      '/marketing': 'Marketing',
      '/seo': 'SEO',
      '/inventory': 'Inventaire',
      '/automation': 'Automation',
      '/analytics': 'Analytics',
      '/reviews': 'Avis',
      '/security': 'Sécurité',
      '/support': 'Support',
      '/settings': 'Paramètres'
    }
    return pageNames[path] || path.replace('/', '').replace('-', ' ')
  }

  const uniquePages = [...new Set(presenceUsers.map(u => u.presence_data.current_page).filter(Boolean))]

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Utilisateurs en ligne
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <Circle className="w-2 h-2 fill-green-500 text-green-500" />
            {presenceUsers.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Users */}
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {presenceUsers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun utilisateur en ligne</p>
              </div>
            ) : (
              presenceUsers.map((presenceUser) => (
                <div
                  key={presenceUser.user_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={presenceUser.presence_data.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {presenceUser.presence_data.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(presenceUser.presence_data.status)}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {presenceUser.presence_data.name || 'Utilisateur'}
                      </p>
                      {presenceUser.user_id === user?.id && (
                        <Badge variant="outline" className="text-xs">Vous</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge 
                        variant={getStatusBadgeVariant(presenceUser.presence_data.status)}
                        className="text-xs"
                      >
                        {presenceUser.presence_data.status || 'online'}
                      </Badge>
                      
                      {showCurrentPage && presenceUser.presence_data.current_page && (
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{formatPageName(presenceUser.presence_data.current_page)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {new Date(presenceUser.last_seen).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Pages Activity */}
        {showCurrentPage && uniquePages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Activité par page
            </h4>
            <div className="space-y-1">
              {uniquePages.map((page) => {
                const usersOnPage = presenceUsers.filter(u => u.presence_data.current_page === page)
                return (
                  <div key={page} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{formatPageName(page || '')}</span>
                    <Badge variant="outline" className="text-xs">
                      {usersOnPage.length}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}