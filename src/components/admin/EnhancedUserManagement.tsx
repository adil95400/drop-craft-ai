import { useEffect, useState } from 'react'
import { useAdminRole } from '@/hooks/useAdminRole'
import { usePlanSystem } from '@/lib/unified-plan-system'
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Shield, User, Crown, CreditCard, Settings, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

type PlanType = 'free' | 'pro' | 'ultra_pro'

interface EnhancedUser {
  id: string
  full_name: string | null
  role: string
  is_admin: boolean
  plan: PlanType | null
  subscription_status: string | null
  last_login_at: string | null
  login_count: number
  created_at: string
  updated_at?: string
}

export const EnhancedUserManagement = () => {
  const { users, loading, fetchAllUsers, changeUserRole } = useAdminRole()
  const { t } = useTranslation(['common', 'settings'])
  const { toast } = useToast()
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user')
  const [selectedUserForPlan, setSelectedUserForPlan] = useState<EnhancedUser | null>(null)
  const [newPlan, setNewPlan] = useState<PlanType>('free')
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false)
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false)

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const handleRoleChange = async (userId: string, role: 'admin' | 'user') => {
    await changeUserRole(userId, role)
    setSelectedUser(null)
  }

  const handlePlanChange = async (userId: string, plan: PlanType) => {
    setIsUpdatingPlan(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan,
          subscription_status: plan === 'free' ? 'inactive' : 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      toast({
        title: "Plan mis à jour",
        description: `Le plan a été changé vers ${plan.toUpperCase()} avec succès`,
      })

      // Rafraîchir la liste
      await fetchAllUsers()
      setIsPlanDialogOpen(false)
      setSelectedUserForPlan(null)
    } catch (error: any) {
      console.error('Error updating user plan:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le plan",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingPlan(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  const getPlanBadge = (plan: PlanType | null, subscriptionStatus?: string | null) => {
    const planConfig = {
      free: { label: 'GRATUIT', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
      pro: { label: 'PRO', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      ultra_pro: { label: 'ULTRA PRO', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' }
    }
    
    const config = planConfig[plan as keyof typeof planConfig] || planConfig.free
    const isActive = subscriptionStatus === 'active'
    
    return (
      <div className="flex items-center gap-2">
        <Badge className={config.color}>
          {config.label}
        </Badge>
        {plan !== 'free' && (
          <Badge variant={isActive ? 'default' : 'destructive'} className="text-xs">
            {isActive ? 'ACTIF' : 'INACTIF'}
          </Badge>
        )}
      </div>
    )
  }

  const getActivityStatus = (lastLogin: string | null, loginCount: number) => {
    if (!lastLogin) return { status: 'Jamais connecté', color: 'text-gray-500' }
    
    const daysSinceLogin = Math.floor((Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceLogin === 0) return { status: 'Actif aujourd\'hui', color: 'text-green-600' }
    if (daysSinceLogin <= 7) return { status: `Actif il y a ${daysSinceLogin}j`, color: 'text-blue-600' }
    if (daysSinceLogin <= 30) return { status: `Inactif ${daysSinceLogin}j`, color: 'text-yellow-600' }
    return { status: `Inactif +${daysSinceLogin}j`, color: 'text-red-600' }
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
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestion des Utilisateurs
          </CardTitle>
          <Button onClick={fetchAllUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="text-sm text-muted-foreground">Utilisateurs totaux</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.role === 'admin' || u.is_admin).length}
              </div>
              <div className="text-sm text-muted-foreground">Administrateurs</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.plan === 'pro' || u.plan === 'ultra_pro').length}
              </div>
              <div className="text-sm text-muted-foreground">Abonnés Premium</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.last_login_at && 
                  new Date(u.last_login_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length}
              </div>
              <div className="text-sm text-muted-foreground">Actifs (7j)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
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
              {users.map((user) => {
                const activity = getActivityStatus(user.last_login_at, user.login_count)
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.full_name || 'Nom non renseigné'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.login_count} connexions
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role, user.is_admin)}
                    </TableCell>
                    <TableCell>
                      {getPlanBadge(user.plan as PlanType, user.subscription_status)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className={`text-sm ${activity.color}`}>
                          {activity.status}
                        </div>
                        {user.last_login_at && (
                          <div className="text-xs text-muted-foreground">
                            {formatDate(user.last_login_at)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(user.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {/* Changement de rôle */}
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
                              <Settings className="h-4 w-4 mr-1" />
                              Rôle
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Changer le rôle</AlertDialogTitle>
                              <AlertDialogDescription>
                                Voulez-vous changer le rôle de {user.full_name || user.id} vers{' '}
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

                        {/* Changement de plan */}
                        <Dialog open={isPlanDialogOpen && selectedUserForPlan?.id === user.id} onOpenChange={setIsPlanDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedUserForPlan(user as EnhancedUser)
                                setNewPlan(user.plan as PlanType || 'free')
                                setIsPlanDialogOpen(true)
                              }}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Plan
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Modifier le plan de {user.full_name}</DialogTitle>
                              <DialogDescription>
                                Plan actuel: <strong>{(user.plan || 'free').toUpperCase()}</strong>
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Nouveau plan</label>
                                <Select value={newPlan} onValueChange={(value: PlanType) => setNewPlan(value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="free">GRATUIT</SelectItem>
                                    <SelectItem value="pro">PRO - €29/mois</SelectItem>
                                    <SelectItem value="ultra_pro">ULTRA PRO - €99/mois</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setIsPlanDialogOpen(false)}
                                  disabled={isUpdatingPlan}
                                >
                                  Annuler
                                </Button>
                                <Button 
                                  onClick={() => handlePlanChange(user.id, newPlan)}
                                  disabled={isUpdatingPlan || newPlan === user.plan}
                                >
                                  {isUpdatingPlan && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                  Mettre à jour
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}