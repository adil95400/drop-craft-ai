import { useEffect, useState } from 'react'
import { useAdminRole } from '@/hooks/useAdminRole'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Loader2, Shield, User, Crown, Users, UserCheck, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const UserManagement = () => {
  const { users, loading, fetchAllUsers, changeUserRole, isAdmin } = useAdminRole()
  const { t } = useTranslation(['common', 'settings'])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user')
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    premiumUsers: 0,
    activeUsers: 0
  })

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers()
    }
  }, [isAdmin])

  useEffect(() => {
    if (users.length > 0) {
      setStats({
        totalUsers: users.length,
        adminUsers: users.filter(u => u.role === 'admin' || u.is_admin).length,
        premiumUsers: users.filter(u => u.plan && u.plan !== 'free' && u.plan !== 'standard').length,
        activeUsers: users.filter(u => u.last_login_at && 
          new Date(u.last_login_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length
      })
    }
  }, [users])

  const handleRoleChange = async (userId: string, role: 'admin' | 'user') => {
    await changeUserRole(userId, role)
    setSelectedUser(null)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleBadge = (role: string, isAdmin: boolean) => {
    if (role === 'admin' || isAdmin) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Crown className="h-3 w-3" />
          Admin
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <User className="h-3 w-3" />
        Utilisateur
      </Badge>
    )
  }

  const getPlanBadge = (plan: string | null) => {
    switch (plan) {
      case 'pro':
        return <Badge variant="default">Pro</Badge>
      case 'ultra_pro':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Ultra Pro</Badge>
      case 'standard':
        return <Badge variant="outline">Standard</Badge>
      default:
        return <Badge variant="secondary">Free</Badge>
    }
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Accès restreint</h3>
              <p className="text-muted-foreground">Vous devez être administrateur pour accéder à cette page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
            <Crown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.adminUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnés Premium</CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.premiumUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs (7j)</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gestion des Utilisateurs
            </CardTitle>
            <CardDescription>
              Gérez votre plateforme et surveillez les activités
            </CardDescription>
          </div>
          <Button 
            onClick={fetchAllUsers} 
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Chargement des utilisateurs...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun utilisateur trouvé</h3>
              <p className="text-muted-foreground mb-4">Il semble qu'il n'y ait aucun utilisateur dans le système.</p>
              <Button onClick={fetchAllUsers} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Plan & Status</TableHead>
                  <TableHead>Activité</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{user.full_name || 'Utilisateur anonyme'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role, user.is_admin)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getPlanBadge(user.plan)}
                        {user.subscription_status && (
                          <div className="text-xs text-muted-foreground">
                            {user.subscription_status}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Dernière: {formatDate(user.last_login_at)}</div>
                        <div className="text-muted-foreground">{user.login_count || 0} connexions</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user.id)
                              setNewRole(user.role === 'admin' || user.is_admin ? 'user' : 'admin')
                            }}
                          >
                            Changer le rôle
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer le changement de rôle</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir changer le rôle de{' '}
                              <strong>{user.full_name || user.email}</strong> de "{user.role}" vers{' '}
                              <strong>"{newRole}"</strong> ?
                              <br />
                              Cette action peut avoir des conséquences importantes sur les permissions de l'utilisateur.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleRoleChange(user.id, newRole)}
                            >
                              Confirmer le changement
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}