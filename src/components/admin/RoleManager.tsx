import { useState, useEffect } from 'react'
import { productionLogger } from '@/utils/productionLogger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { supabase } from '@/integrations/supabase/client'
import { 
  Users, 
  Shield, 
  UserCheck, 
  Search, 
  MoreHorizontal,
  Clock,
  MapPin
} from 'lucide-react'

interface UserProfile {
  id: string
  full_name: string
  role: string
  last_login_at?: string
  login_count: number
  created_at: string
  role_updated_at?: string
}

export const RoleManager = () => {
  const { isAdmin } = useEnhancedAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin])

  const loadUsers = async () => {
    setLoading(true)
    try {
      // Get all users with their roles from user_roles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, last_login_at, login_count, created_at')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .maybeSingle()
          
          return {
            ...profile,
            role: roleData?.role || 'user'
          }
        })
      )

      setUsers(usersWithRoles as UserProfile[])
    } catch (error) {
      productionLogger.error('Failed to load users', error as Error, 'RoleManager');
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId)
    try {
      const { data, error } = await supabase.rpc('admin_set_role', {
        target_user_id: userId,
        new_role: newRole as 'admin' | 'moderator' | 'user'
      })

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Rôle mis à jour",
          description: `Le rôle a été changé vers ${newRole}`,
        })
        await loadUsers() // Refresh the list
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du rôle",
        variant: "destructive"
      })
    } finally {
      setUpdating(null)
    }
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: { variant: 'destructive' as const, label: 'Admin' },
      manager: { variant: 'default' as const, label: 'Manager' },
      user: { variant: 'secondary' as const, label: 'User' }
    }
    
    const config = variants[role as keyof typeof variants] || variants.user
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Accès réservé aux administrateurs</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Rôles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des Rôles Utilisateurs
          </CardTitle>
          <CardDescription>
            Gérez les rôles et permissions des utilisateurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                      <UserCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium">
                          {user.full_name || 'Utilisateur sans nom'}
                        </h4>
                        {getRoleBadge(user.role)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Dernière connexion: {formatDate(user.last_login_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {user.login_count} connexions
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                      disabled={updating === user.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions par Rôle</CardTitle>
          <CardDescription>
            Aperçu des permissions associées à chaque rôle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="secondary">User</Badge>
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Gérer ses propres données</li>
                <li>• Voir ses commandes</li>
                <li>• Gérer ses produits</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="default">Manager</Badge>
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Toutes les permissions User</li>
                <li>• Gérer les clients</li>
                <li>• Voir les analytics</li>
                <li>• Gérer tous les produits</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="destructive">Admin</Badge>
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Toutes les permissions Manager</li>
                <li>• Gérer les utilisateurs</li>
                <li>• Accès système complet</li>
                <li>• Gérer les rôles</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}