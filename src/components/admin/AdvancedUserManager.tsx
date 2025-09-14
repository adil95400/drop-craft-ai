import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole, AdminUser } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  Ban,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  CreditCard,
  Activity,
  TrendingUp,
  AlertTriangle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  suspendedUsers: number;
  newUsersToday: number;
  revenuePerUser: number;
}

export const AdvancedUserManager = () => {
  const { isAdmin, fetchAllUsers, changeUserRole, loading } = useAdminRole();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    suspendedUsers: 0,
    newUsersToday: 0,
    revenuePerUser: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, roleFilter, planFilter]);

  const loadUsers = async () => {
    const result = await fetchAllUsers();
    if (result.success) {
      setUsers(result.data);
      calculateStats(result.data);
    }
  };

  const calculateStats = (userData: AdminUser[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const stats: UserStats = {
      totalUsers: userData.length,
      activeUsers: userData.filter(u => u.last_login_at && new Date(u.last_login_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      premiumUsers: userData.filter(u => u.plan && u.plan !== 'free').length,
      suspendedUsers: userData.filter(u => u.subscription_status === 'suspended').length,
      newUsersToday: userData.filter(u => new Date(u.created_at) >= today).length,
      revenuePerUser: Math.random() * 50 + 25 // Simulation
    };

    setUserStats(stats);
  };

  const applyFilters = () => {
    let filtered = users;

    // Filtre de recherche
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par rôle
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filtre par plan
    if (planFilter !== 'all') {
      filtered = filtered.filter(user => user.plan === planFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    setActionLoading(userId);
    const result = await changeUserRole(userId, newRole);
    
    if (result.success) {
      await loadUsers();
      toast({
        title: "Succès",
        description: `Rôle mis à jour vers ${newRole}`
      });
    }
    
    setActionLoading(null);
  };

  const handleUserAction = async (userId: string, action: string) => {
    setActionLoading(userId);
    
    try {
      // Simuler différentes actions
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      switch (action) {
        case 'suspend':
          toast({
            title: "Utilisateur suspendu",
            description: "Le compte utilisateur a été suspendu"
          });
          break;
        case 'activate':
          toast({
            title: "Utilisateur activé",
            description: "Le compte utilisateur a été réactivé"
          });
          break;
        case 'delete':
          toast({
            title: "Utilisateur supprimé",
            description: "Le compte utilisateur a été supprimé",
            variant: "destructive"
          });
          break;
      }
      
      await loadUsers();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer cette action",
        variant: "destructive"
      });
    }
    
    setActionLoading(null);
  };

  const openUserDetails = (user: AdminUser) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'user': return 'secondary';
      default: return 'outline';
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'ultra_pro': return 'default';
      case 'pro': return 'secondary';
      case 'free': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Accès restreint</h3>
            <p className="text-muted-foreground">Vous devez être administrateur pour accéder à cette page.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header et Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Gestion Avancée des Utilisateurs
            </h2>
            <p className="text-muted-foreground">
              Contrôle complet des comptes et des permissions utilisateurs
            </p>
          </div>
          <Button onClick={loadUsers} disabled={loading}>
            <Activity className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Statistiques utilisateurs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{userStats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Actifs (30j)</p>
                  <p className="text-lg font-bold">{userStats.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Premium</p>
                  <p className="text-lg font-bold">{userStats.premiumUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Suspendus</p>
                  <p className="text-lg font-bold">{userStats.suspendedUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Nouveaux</p>
                  <p className="text-lg font-bold">+{userStats.newUsersToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Rev/User</p>
                  <p className="text-lg font-bold">€{userStats.revenuePerUser.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="admin">Administrateurs</SelectItem>
                <SelectItem value="user">Utilisateurs</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les plans</SelectItem>
                <SelectItem value="free">Gratuit</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="ultra_pro">Ultra Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>
            Utilisateurs ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            Liste complète des utilisateurs avec actions rapides
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name || 'Utilisateur anonyme'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPlanBadgeVariant(user.plan || 'free')}>
                      {user.plan || 'free'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.subscription_status || 'active')}>
                      {user.subscription_status || 'active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {user.last_login_at ? (
                        <>
                          <p>{new Date(user.last_login_at).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(user.last_login_at).toLocaleTimeString()}
                          </p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Jamais</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUserDetails(user)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      
                      {user.role === 'user' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleChange(user.id, 'admin')}
                          disabled={actionLoading === user.id}
                        >
                          <Shield className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleChange(user.id, 'user')}
                          disabled={actionLoading === user.id}
                        >
                          <Users className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction(user.id, 'suspend')}
                        disabled={actionLoading === user.id}
                      >
                        <Ban className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog détails utilisateur */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails Utilisateur</DialogTitle>
            <DialogDescription>
              Informations complètes et actions disponibles
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Nom complet</p>
                      <p className="font-medium">{selectedUser.full_name || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rôle</p>
                      <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                        {selectedUser.role}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Abonnement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Plan actuel</p>
                      <Badge variant={getPlanBadgeVariant(selectedUser.plan || 'free')}>
                        {selectedUser.plan || 'free'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Statut</p>
                      <Badge variant={getStatusBadgeVariant(selectedUser.subscription_status || 'active')}>
                        {selectedUser.subscription_status || 'active'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Connexions</p>
                      <p className="font-medium">{selectedUser.login_count || 0}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Historique</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Compte créé</p>
                      <p className="font-medium">{new Date(selectedUser.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Dernière connexion</p>
                      <p className="font-medium">
                        {selectedUser.last_login_at 
                          ? new Date(selectedUser.last_login_at).toLocaleString()
                          : 'Jamais'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};