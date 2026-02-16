import React, { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { RequirePlan } from '@/components/plan/RequirePlan';
import { useTeamManagement, TeamMember } from '@/hooks/useTeamManagement';
import { useStoreManagement } from '@/hooks/useStoreManagement';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Store, UserPlus, Shield, Mail, Clock, Trash2, Plus, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  owner: { label: 'Propriétaire', color: 'bg-accent text-accent-foreground' },
  admin: { label: 'Admin', color: 'bg-destructive/10 text-destructive' },
  editor: { label: 'Éditeur', color: 'bg-primary/10 text-primary' },
  viewer: { label: 'Lecteur', color: 'bg-muted text-muted-foreground' },
};

const PLATFORM_ICONS: Record<string, string> = {
  shopify: '🟢',
  woocommerce: '🟣',
  prestashop: '🔴',
  amazon: '🟠',
  ebay: '🔵',
};

export default function TeamManagementPage() {
  return (
    <RequirePlan minPlan="pro">
      <ChannablePageWrapper
        title="Équipe & Boutiques"
        description="Gérez votre équipe et vos boutiques multi-canal"
        heroImage="integrations"
        badge={{ label: 'Multi-Store', icon: Users }}
      >
        <Tabs defaultValue="team" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" /> Équipe
            </TabsTrigger>
            <TabsTrigger value="stores" className="gap-2">
              <Store className="h-4 w-4" /> Boutiques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team">
            <TeamTab />
          </TabsContent>
          <TabsContent value="stores">
            <StoresTab />
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </RequirePlan>
  );
}

function TeamTab() {
  const { members, pendingInvites, isLoading, inviteMember, isInviting, updateMemberRole, removeMember } = useTeamManagement();
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamMember['role']>('editor');

  const handleInvite = () => {
    if (!email.trim()) return;
    inviteMember({ email: email.trim(), role }, {
      onSuccess: () => { setEmail(''); setShowInvite(false); }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{members.length}</p>
            <p className="text-sm text-muted-foreground">Membres actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Mail className="h-8 w-8 mx-auto mb-2 text-accent-foreground" />
            <p className="text-2xl font-bold">{pendingInvites.length}</p>
            <p className="text-sm text-muted-foreground">Invitations en attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{members.filter(m => m.role === 'admin').length}</p>
            <p className="text-sm text-muted-foreground">Administrateurs</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Membres de l'équipe</h3>
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" /> Inviter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un membre</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                type="email"
                placeholder="email@exemple.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <Select value={role} onValueChange={v => setRole(v as TeamMember['role'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — Accès complet</SelectItem>
                  <SelectItem value="editor">Éditeur — Produits & commandes</SelectItem>
                  <SelectItem value="viewer">Lecteur — Consultation seule</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} disabled={isInviting || !email.trim()} className="w-full">
                {isInviting ? 'Envoi...' : "Envoyer l'invitation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun membre dans l'équipe</p>
              <p className="text-sm">Invitez des collaborateurs pour travailler ensemble</p>
            </div>
          ) : (
            <div className="divide-y">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {member.member_email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{member.member_email}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(member.invited_at), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={ROLE_LABELS[member.role]?.color}>
                      {ROLE_LABELS[member.role]?.label}
                    </Badge>
                    <Badge variant={member.status === 'active' ? 'default' : 'outline'}>
                      {member.status === 'pending' ? 'En attente' : 'Actif'}
                    </Badge>
                    <Select
                      value={member.role}
                      onValueChange={v => updateMemberRole({ id: member.id, role: v as TeamMember['role'] })}
                    >
                      <SelectTrigger className="w-28 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Éditeur</SelectItem>
                        <SelectItem value="viewer">Lecteur</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeMember(member.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StoresTab() {
  const { stores, isLoading, addStore, isAdding, deleteStore } = useStoreManagement();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('shopify');
  const [domain, setDomain] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    addStore({ name: name.trim(), platform, domain: domain || undefined }, {
      onSuccess: () => { setName(''); setDomain(''); setShowAdd(false); }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Mes boutiques ({stores.length})</h3>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Ajouter une boutique
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle boutique</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="Nom de la boutique" value={name} onChange={e => setName(e.target.value)} />
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shopify">🟢 Shopify</SelectItem>
                  <SelectItem value="woocommerce">🟣 WooCommerce</SelectItem>
                  <SelectItem value="prestashop">🔴 PrestaShop</SelectItem>
                  <SelectItem value="amazon">🟠 Amazon</SelectItem>
                  <SelectItem value="ebay">🔵 eBay</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Domaine (optionnel)" value={domain} onChange={e => setDomain(e.target.value)} />
              <Button onClick={handleAdd} disabled={isAdding || !name.trim()} className="w-full">
                {isAdding ? 'Ajout...' : 'Ajouter'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Chargement...</div>
      ) : stores.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune boutique configurée</p>
            <p className="text-sm text-muted-foreground">Ajoutez votre première boutique pour commencer</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map(store => (
            <Card key={store.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{PLATFORM_ICONS[store.platform] || '🏪'}</span>
                  <CardTitle className="text-base">{store.name}</CardTitle>
                </div>
                <CardDescription className="capitalize">{store.platform}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {store.domain && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    <span className="truncate">{store.domain}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={store.status === 'active' ? 'default' : 'secondary'}>
                    {store.status === 'active' ? 'Active' : store.status}
                  </Badge>
                </div>
                <div className="flex justify-end pt-2">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteStore(store.id)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
