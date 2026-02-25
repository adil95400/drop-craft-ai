import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, UserPlus, Crown, Shield, Eye, Settings } from 'lucide-react'

export default function TeamPage() {
  const [inviteEmail, setInviteEmail] = useState('')
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['team-members', user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get current user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, subscription_plan, created_at')
        .eq('id', user!.id)
        .single()

      // Get user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('user_id', user!.id)

      const currentRole = roles?.[0]?.role || 'user'

      return {
        members: [{
          id: profile?.id || user!.id,
          name: profile?.full_name || user!.email?.split('@')[0] || 'Vous',
          email: profile?.email || user!.email || '',
          role: currentRole === 'admin' ? 'owner' : currentRole,
          joinedAt: profile?.created_at || new Date().toISOString(),
        }]
      }
    }
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />
      default: return <Eye className="w-4 h-4 text-muted-foreground" />
    }
  }

  if (isLoading) {
    return <div className="space-y-6">{[1,2].map(i => <Skeleton key={i} className="h-24" />)}</div>
  }

  const members = data?.members || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Gestion d'Équipe
          </h1>
          <p className="text-muted-foreground mt-2">Gérez les membres de votre équipe et leurs permissions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Input placeholder="Inviter par email..." value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-64" />
          <Button><UserPlus className="w-4 h-4 mr-2" />Inviter</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-sm text-muted-foreground">Membres actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Settings className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">-</div>
            <p className="text-sm text-muted-foreground">Extensions partagées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{members.filter(m => m.role === 'owner' || m.role === 'admin').length}</div>
            <p className="text-sm text-muted-foreground">Administrateurs</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membres de l'Équipe</CardTitle>
          <CardDescription>Gérez les rôles et permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{member.name}</h3>
                          {getRoleIcon(member.role)}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <span className="text-xs text-muted-foreground">Depuis {new Date(member.joinedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
