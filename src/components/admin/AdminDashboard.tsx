import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { useOrganizations } from '@/hooks/useOrganizations';
import { 
  Users, 
  Activity, 
  Shield, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  UserCheck,
  UserX,
  Database,
  Mail,
  Globe,
  Calendar
} from 'lucide-react';

const AdminDashboard = () => {
  const { adminLogs, isLoadingAdminLogs } = useActivityLogs();
  const { members, isLoadingMembers } = useOrganizations();
  
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<string>('user');

  // Mock admin stats
  const stats = {
    totalUsers: 1247,
    activeUsers: 892,
    newUsersToday: 23,
    totalOrganizations: 156,
    apiCalls: 89432,
    errorRate: 0.3,
  };

  const roles = [
    { value: 'user', label: 'Utilisateur', description: 'Accès de base aux fonctionnalités' },
    { value: 'admin', label: 'Administrateur', description: 'Accès complet à la gestion' },
    { value: 'support', label: 'Support', description: 'Accès au support et modération' },
    { value: 'viewer', label: 'Observateur', description: 'Lecture seule des données' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Administration
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez les utilisateurs, permissions et paramètres globaux
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-border bg-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs</p>
                <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Nouveaux</p>
                <p className="text-2xl font-bold">+{stats.newUsersToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Organisations</p>
                <p className="text-2xl font-bold">{stats.totalOrganizations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">API Calls</p>
                <p className="text-2xl font-bold">{stats.apiCalls.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Erreurs</p>
                <p className="text-2xl font-bold">{stats.errorRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="roles">Rôles</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        {/* Users Management */}
        <TabsContent value="users">
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
              <CardDescription>Gérez les comptes utilisateurs et leurs permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* User Actions */}
              <div className="flex gap-4">
                <Input placeholder="Rechercher un utilisateur..." className="flex-1" />
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="hero">Inviter Utilisateur</Button>
              </div>

              {/* Users List */}
              <div className="space-y-3">
                {isLoadingMembers ? (
                  <p className="text-muted-foreground">Chargement des utilisateurs...</p>
                ) : (
                  members.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground font-semibold">
                            {member.profiles?.full_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{member.profiles?.full_name || 'Nom non défini'}</p>
                          <p className="text-sm text-muted-foreground">{member.profiles?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                        <Switch
                          checked={member.status === 'active'}
                          onCheckedChange={(checked) => {
                            // Handle status change
                          }}
                        />
                        <Button variant="outline" size="sm">
                          Modifier
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Management */}
        <TabsContent value="roles">
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Gestion des Rôles</CardTitle>
              <CardDescription>Configurez les rôles et permissions utilisateur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {roles.map((role) => (
                  <div key={role.value} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{role.label}</h4>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['Lecture', 'Écriture', 'Suppression', 'Admin'].map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Switch 
                            checked={role.value === 'admin' || (role.value === 'user' && permission === 'Lecture')}
                          />
                          <Label className="text-sm">{permission}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Logs */}
        <TabsContent value="logs">
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Logs d'Activité</CardTitle>
              <CardDescription>Surveillez l'activité système et utilisateur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingAdminLogs ? (
                <p className="text-muted-foreground">Chargement des logs...</p>
              ) : (
                <div className="space-y-3">
                  {adminLogs.slice(0, 20).map((log: any) => (
                    <div key={log.id} className="flex items-center space-x-4 p-3 border border-border rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{log.profiles?.full_name || 'Utilisateur'}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{log.action}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.resource}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Global Settings */}
        <TabsContent value="settings">
          <div className="grid gap-6">
            {/* Application Settings */}
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle>Paramètres Application</CardTitle>
                <CardDescription>Configuration générale de l'application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom de l'application</Label>
                    <Input defaultValue="Shopopti Pro" />
                  </div>
                  <div className="space-y-2">
                    <Label>URL de base</Label>
                    <Input defaultValue="https://app.shopopti.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email de support</Label>
                    <Input defaultValue="support@shopopti.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Langue par défaut</Label>
                    <Select defaultValue="fr">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Fonctionnalités</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Inscription ouverte</Label>
                        <p className="text-sm text-muted-foreground">Autoriser les nouvelles inscriptions</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Validation par email</Label>
                        <p className="text-sm text-muted-foreground">Exiger la validation email</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Mode maintenance</Label>
                        <p className="text-sm text-muted-foreground">Activer le mode maintenance</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Analytics</Label>
                        <p className="text-sm text-muted-foreground">Collecter les données d'usage</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Button variant="hero">
                  Sauvegarder les Paramètres
                </Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle>Paramètres de Sécurité</CardTitle>
                <CardDescription>Configuration avancée de la sécurité</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Durée de session (minutes)</Label>
                    <Input type="number" defaultValue="60" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tentatives de connexion max</Label>
                    <Input type="number" defaultValue="5" />
                  </div>
                  <div className="space-y-2">
                    <Label>Blocage temporaire (minutes)</Label>
                    <Input type="number" defaultValue="30" />
                  </div>
                  <div className="space-y-2">
                    <Label>Longueur min. mot de passe</Label>
                    <Input type="number" defaultValue="8" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Politiques de sécurité</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>2FA obligatoire pour admins</Label>
                        <p className="text-sm text-muted-foreground">Forcer l'authentification à 2 facteurs</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Mot de passe fort requis</Label>
                        <p className="text-sm text-muted-foreground">Exiger majuscules, chiffres, symboles</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Déconnexion automatique</Label>
                        <p className="text-sm text-muted-foreground">Déconnecter après inactivité</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Button variant="hero">
                  Sauvegarder la Sécurité
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;