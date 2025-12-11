import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Shield, Users, Lock, Key, Plus, Trash2, Edit, Search,
  CheckCircle, XCircle, Eye, EyeOff, Settings, Crown,
  UserPlus, Mail, Calendar, AlertTriangle
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  userCount: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status: 'active' | 'pending' | 'inactive';
  lastActive: string;
}

const defaultRoles: Role[] = [
  { 
    id: 'admin', 
    name: 'Administrateur', 
    description: 'Accès complet à toutes les fonctionnalités',
    permissions: ['all'],
    color: 'bg-red-500',
    userCount: 1
  },
  { 
    id: 'manager', 
    name: 'Manager', 
    description: 'Gestion des produits, commandes et équipe',
    permissions: ['products.all', 'orders.all', 'customers.read', 'analytics.read', 'team.read'],
    color: 'bg-blue-500',
    userCount: 3
  },
  { 
    id: 'editor', 
    name: 'Éditeur', 
    description: 'Création et modification de contenu',
    permissions: ['products.read', 'products.write', 'marketing.read', 'marketing.write'],
    color: 'bg-green-500',
    userCount: 5
  },
  { 
    id: 'viewer', 
    name: 'Lecteur', 
    description: 'Accès en lecture seule',
    permissions: ['products.read', 'orders.read', 'analytics.read'],
    color: 'bg-gray-500',
    userCount: 8
  },
];

const permissionGroups = [
  {
    name: 'Produits',
    permissions: [
      { id: 'products.read', label: 'Voir les produits' },
      { id: 'products.write', label: 'Créer/Modifier les produits' },
      { id: 'products.delete', label: 'Supprimer les produits' },
      { id: 'products.publish', label: 'Publier les produits' },
    ]
  },
  {
    name: 'Commandes',
    permissions: [
      { id: 'orders.read', label: 'Voir les commandes' },
      { id: 'orders.write', label: 'Modifier les commandes' },
      { id: 'orders.fulfill', label: 'Traiter les commandes' },
      { id: 'orders.refund', label: 'Effectuer des remboursements' },
    ]
  },
  {
    name: 'Clients',
    permissions: [
      { id: 'customers.read', label: 'Voir les clients' },
      { id: 'customers.write', label: 'Modifier les clients' },
      { id: 'customers.delete', label: 'Supprimer les clients' },
    ]
  },
  {
    name: 'Marketing',
    permissions: [
      { id: 'marketing.read', label: 'Voir les campagnes' },
      { id: 'marketing.write', label: 'Créer des campagnes' },
      { id: 'marketing.send', label: 'Envoyer des emails' },
    ]
  },
  {
    name: 'Analytics',
    permissions: [
      { id: 'analytics.read', label: 'Voir les analytics' },
      { id: 'analytics.export', label: 'Exporter les données' },
    ]
  },
  {
    name: 'Équipe',
    permissions: [
      { id: 'team.read', label: 'Voir les membres' },
      { id: 'team.invite', label: 'Inviter des membres' },
      { id: 'team.manage', label: 'Gérer les rôles' },
    ]
  },
];

const teamMembers: TeamMember[] = [
  { id: '1', name: 'Jean Dupont', email: 'jean@shopopti.com', role: 'admin', status: 'active', lastActive: 'Il y a 5 min' },
  { id: '2', name: 'Marie Martin', email: 'marie@shopopti.com', role: 'manager', status: 'active', lastActive: 'Il y a 1h' },
  { id: '3', name: 'Pierre Durand', email: 'pierre@shopopti.com', role: 'editor', status: 'active', lastActive: 'Il y a 3h' },
  { id: '4', name: 'Sophie Bernard', email: 'sophie@shopopti.com', role: 'viewer', status: 'pending', lastActive: 'Invitation envoyée' },
];

export function RBACManager() {
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [members, setMembers] = useState<TeamMember[]>(teamMembers);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  const handleInvite = () => {
    if (!inviteEmail) return;
    
    const newMember: TeamMember = {
      id: `m${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'pending',
      lastActive: 'Invitation envoyée'
    };
    
    setMembers([...members, newMember]);
    setInviteEmail('');
    setIsInviteOpen(false);
    toast.success('Invitation envoyée', { description: `Email envoyé à ${inviteEmail}` });
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
    toast.success('Membre supprimé');
  };

  const handleUpdateRole = (memberId: string, newRole: string) => {
    setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    toast.success('Rôle mis à jour');
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Gestion des Accès
          </h2>
          <p className="text-muted-foreground">Gérez les rôles et permissions de votre équipe</p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter un membre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un membre</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Rôle</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleInvite}>
                <Mail className="h-4 w-4 mr-2" />
                Envoyer l'invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Membres ({members.length})</TabsTrigger>
          <TabsTrigger value="roles">Rôles ({roles.length})</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4 mt-6">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un membre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Members List */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredMembers.map((member) => {
                  const role = roles.find(r => r.id === member.role);
                  return (
                    <div key={member.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{member.name}</p>
                            {member.status === 'pending' && (
                              <Badge variant="secondary" className="text-xs">En attente</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">{member.lastActive}</p>
                        </div>
                        <Select 
                          value={member.role} 
                          onValueChange={(value) => handleUpdateRole(member.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", role?.color)} />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(r => (
                              <SelectItem key={r.id} value={r.id}>
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", r.color)} />
                                  {r.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => (
              <Card key={role.id} className="relative overflow-hidden">
                <div className={cn("absolute top-0 left-0 w-1 h-full", role.color)} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {role.id === 'admin' && <Crown className="h-4 w-4 text-yellow-500" />}
                        {role.name}
                      </CardTitle>
                      <CardDescription>{role.description}</CardDescription>
                    </div>
                    <Badge variant="secondary">{role.userCount} utilisateurs</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.includes('all') ? (
                      <Badge variant="outline" className="text-xs">Tous les accès</Badge>
                    ) : (
                      role.permissions.slice(0, 4).map(p => (
                        <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                      ))
                    )}
                    {role.permissions.length > 4 && (
                      <Badge variant="outline" className="text-xs">+{role.permissions.length - 4}</Badge>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    {role.id !== 'admin' && (
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Créer un nouveau rôle
          </Button>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[500px]">
                <div className="space-y-6">
                  {permissionGroups.map((group) => (
                    <div key={group.name}>
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        {group.name}
                      </h3>
                      <div className="space-y-2 pl-6">
                        {group.permissions.map((perm) => (
                          <div key={perm.id} className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
                            <div className="flex items-center gap-3">
                              <code className="text-xs bg-muted px-2 py-1 rounded">{perm.id}</code>
                              <span className="text-sm">{perm.label}</span>
                            </div>
                            <div className="flex gap-2">
                              {roles.map(role => (
                                <Badge 
                                  key={role.id}
                                  variant={role.permissions.includes('all') || role.permissions.includes(perm.id) || role.permissions.includes(perm.id.split('.')[0] + '.all') ? 'default' : 'outline'}
                                  className="text-[10px]"
                                >
                                  {role.name.charAt(0)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
