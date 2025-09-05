/**
 * Tableau de bord admin pour gérer les utilisateurs et les rôles
 */
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Users,
  Shield,
  Crown,
  User,
  Search,
  Plus,
  Settings,
  Activity,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useUserRole } from '@/hooks/useUserRole'

interface UserProfile {
  id: string
  full_name: string | null
  role: string // Allow any string since Supabase returns string
  plan: string // Allow any string since Supabase returns string
  created_at: string
  updated_at: string
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const { isAdmin } = useUserRole()
  const { toast } = useToast()
  
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user')

  // Fetch users
  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, plan, created_at, updated_at')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, role: 'admin' | 'user') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
      
      if (error) throw error
      
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role } : u
      ))
      
      toast({
        title: "Succès",
        description: `Rôle mis à jour avec succès`
      })
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du rôle",
        variant: "destructive"
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-600" />
      case 'manager':
        return <Shield className="h-4 w-4 text-blue-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadge = (role: string) => {
    const configs = {
      admin: { label: 'Admin', variant: 'default' as const },
      manager: { label: 'Manager', variant: 'secondary' as const },
      user: { label: 'Utilisateur', variant: 'outline' as const }
    }
    const config = configs[role as keyof typeof configs] || configs.user
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPlanBadge = (plan: string) => {
    const configs = {
      ultra_pro: { label: 'Ultra Pro', variant: 'default' as const },
      pro: { label: 'Pro', variant: 'secondary' as const },
      standard: { label: 'Standard', variant: 'outline' as const }
    }
    const config = configs[plan as keyof typeof configs] || configs.standard
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    pro: users.filter(u => u.plan === 'pro' || u.plan === 'ultra_pro').length,
    active: users.length // Since we don't have last_sign_in_at, consider all as active
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
          <h2 className="text-xl font-semibold">Accès restreint</h2>
          <p className="text-muted-foreground">Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs, rôles et permissions de la plateforme
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Inviter utilisateur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.admins / stats.total) * 100)}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Pro</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pro}</div>
            <p className="text-xs text-muted-foreground">
              Plans payants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'activation</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.active / stats.total) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Utilisateurs connectés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
              <CardDescription>
                Gérez les rôles et permissions des utilisateurs
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead>Dernière modification</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((userProfile) => (
                <TableRow key={userProfile.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{userProfile.full_name || 'Sans nom'}</div>
                      <div className="text-sm text-muted-foreground">ID: {userProfile.id.slice(0, 8)}...</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(userProfile.role)}
                      {getRoleBadge(userProfile.role)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getPlanBadge(userProfile.plan)}
                  </TableCell>
                  <TableCell>
                    {new Date(userProfile.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {new Date(userProfile.updated_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedUser(userProfile)}
                          disabled={userProfile.id === user?.id}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Modifier l'utilisateur</DialogTitle>
                          <DialogDescription>
                            Modifiez le rôle de {userProfile.full_name || `Utilisateur ${userProfile.id.slice(0, 8)}`}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Rôle</label>
                            <Select 
                              value={newRole} 
                              onValueChange={(value: 'admin' | 'user') => setNewRole(value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Utilisateur</SelectItem>
                                <SelectItem value="admin">Administrateur</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={() => {
                              if (selectedUser) {
                                updateUserRole(selectedUser.id, newRole)
                              }
                            }}
                          >
                            Sauvegarder
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}