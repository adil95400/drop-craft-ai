import { useEffect, useState } from 'react'
import { useAdminRole } from '@/hooks/useAdminRole'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Loader2, Shield, User, Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const UserManagement = () => {
  const { users, loading, fetchAllUsers, changeUserRole } = useAdminRole()
  const { t } = useTranslation(['common', 'settings'])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user')

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const handleRoleChange = async (userId: string, role: 'admin' | 'user') => {
    await changeUserRole(userId, role)
    setSelectedUser(null)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const getRoleBadge = (role: string, isAdmin: boolean) => {
    if (role === 'admin' || isAdmin) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Crown className="h-3 w-3" />
          Administrateur
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
    const planColors = {
      standard: 'bg-blue-100 text-blue-800',
      pro: 'bg-purple-100 text-purple-800',
      ultra_pro: 'bg-yellow-100 text-yellow-800'
    }
    
    return (
      <Badge className={planColors[plan as keyof typeof planColors] || 'bg-gray-100 text-gray-800'}>
        {plan?.toUpperCase() || 'STANDARD'}
      </Badge>
    )
  }

  if (loading && users.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {t('settings:userManagement')}
        </CardTitle>
        <Button onClick={fetchAllUsers} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {t('common:refresh')}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Dernière connexion</TableHead>
              <TableHead>Connexions</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.full_name || 'Nom non renseigné'}
                </TableCell>
                <TableCell>
                  {getRoleBadge(user.role, user.is_admin)}
                </TableCell>
                <TableCell>
                  {getPlanBadge(user.plan)}
                </TableCell>
                <TableCell>
                  {formatDate(user.last_login_at)}
                </TableCell>
                <TableCell>{user.login_count}</TableCell>
                <TableCell>
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
                          <strong>{user.full_name || user.id}</strong> vers{' '}
                          <strong>{newRole === 'admin' ? 'Administrateur' : 'Utilisateur'}</strong> ?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleRoleChange(user.id, newRole)}
                        >
                          Confirmer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}