import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Building2, Users, Crown, Shield, Plus, Edit3, Mail, Calendar, TrendingUp
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function OrganizationManager() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['organization-data', user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get user profile for org info
      const [profileRes, teamRes, productsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user!.id).single(),
        supabase.from('user_roles').select('user_id, role').limit(20),
        supabase.from('products').select('id').eq('user_id', user!.id),
      ])

      const profile = profileRes.data
      const teamMembers = teamRes.data || []
      const productsCount = productsRes.data?.length || 0

      // Build org from profile
      const org = {
        id: user!.id,
        name: profile?.company_name || profile?.full_name || 'Mon Organisation',
        plan: profile?.subscription_plan || 'free',
        status: 'active' as const,
        members_count: teamMembers.length,
        created_at: profile?.created_at || new Date().toISOString(),
        productsCount,
      }

      // Map team members
      const members = teamMembers.map((tm: any) => ({
        id: tm.user_id,
        role: tm.role || 'member',
      }))

      return { org, members }
    }
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />
      default: return <Users className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (isLoading) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
  }

  const org = data?.org

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion de l'Organisation</h1>
          <p className="text-muted-foreground">Gérez votre organisation et votre équipe</p>
        </div>
      </div>

      {org && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>{org.name}</CardTitle>
                  <CardDescription>Plan {org.plan} • {org.members_count} membres</CardDescription>
                </div>
              </div>
              <Badge>{org.status}</Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Membres</p>
              <p className="text-lg font-semibold">{org?.members_count || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Produits</p>
              <p className="text-lg font-semibold">{org?.productsCount?.toLocaleString() || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Crown className="h-6 w-6 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="text-lg font-semibold capitalize">{org?.plan || 'free'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Équipe</CardTitle>
          <CardDescription>Membres avec accès à l'organisation</CardDescription>
        </CardHeader>
        <CardContent>
          {(data?.members?.length || 0) > 0 ? (
            <div className="space-y-3">
              {data!.members.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                      {member.id.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(member.role)}
                      <Badge variant="outline">{member.role}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Aucun membre supplémentaire</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
