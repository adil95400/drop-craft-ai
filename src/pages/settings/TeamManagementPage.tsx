import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { RequirePlan } from '@/components/plan/RequirePlan';
import { useTeamManagement, TeamMember, DEFAULT_PERMISSIONS, PERMISSION_LABELS } from '@/hooks/useTeamManagement';
import { useStoreManagement } from '@/hooks/useStoreManagement';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Users, Store, UserPlus, Shield, Mail, Clock, Trash2, Plus, Globe, CheckCircle, XCircle, Settings2 } from 'lucide-react';
import { format, type Locale } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { useLanguage } from '@/hooks/useLanguage';

export default function TeamManagementPage() {
  const { t } = useTranslation('settings');
  const { language } = useLanguage();
  const { myInvitations } = useTeamManagement();

  const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    owner: { label: t('team.roleOwner'), color: 'bg-accent text-accent-foreground' },
    admin: { label: t('team.roleAdmin'), color: 'bg-destructive/10 text-destructive' },
    editor: { label: t('team.roleEditor'), color: 'bg-primary/10 text-primary' },
    viewer: { label: t('team.roleViewer'), color: 'bg-muted text-muted-foreground' },
  };

  return (
    <RequirePlan minPlan="pro">
      <ChannablePageWrapper
        title={t('team.title')}
        description={t('team.description')}
        heroImage="integrations"
        badge={{ label: 'Enterprise', icon: Users }}
      >
        <Tabs defaultValue="team" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" /> {t('team.tab')}
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-2 relative">
              <Mail className="h-4 w-4" /> Invitations
              {myInvitations.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {myInvitations.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="stores" className="gap-2">
              <Store className="h-4 w-4" /> {t('team.storesTab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team">
            <TeamTab roleLabels={ROLE_LABELS} dateLocale={getDateFnsLocale()} />
          </TabsContent>
          <TabsContent value="invitations">
            <InvitationsTab roleLabels={ROLE_LABELS} dateLocale={getDateFnsLocale()} />
          </TabsContent>
          <TabsContent value="stores">
            <StoresTab />
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </RequirePlan>
  );
}

/* ── Team Tab ── */
function TeamTab({ roleLabels, dateLocale }: { roleLabels: Record<string, { label: string; color: string }>; dateLocale: Locale }) {
  const { t } = useTranslation('settings');
  const { members, pendingInvites, isLoading, inviteMember, isInviting, updateMemberRole, updateMemberPermissions, removeMember } = useTeamManagement();
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamMember['role']>('editor');
  const [editingPermissions, setEditingPermissions] = useState<string | null>(null);

  const handleInvite = () => {
    if (!email.trim()) return;
    inviteMember({ email: email.trim(), role }, {
      onSuccess: () => { setEmail(''); setShowInvite(false); }
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{members.length}</p>
            <p className="text-sm text-muted-foreground">{t('team.activeMembers')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Mail className="h-8 w-8 mx-auto mb-2 text-accent-foreground" />
            <p className="text-2xl font-bold">{pendingInvites.length}</p>
            <p className="text-sm text-muted-foreground">{t('team.pendingInvites')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{members.filter(m => m.role === 'admin').length}</p>
            <p className="text-sm text-muted-foreground">{t('team.administrators')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Header + invite button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{t('team.teamMembers')}</h3>
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" /> {t('team.invite')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('team.inviteMember')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input type="email" placeholder={t('team.emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} />
              <Select value={role} onValueChange={v => setRole(v as TeamMember['role'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t('team.adminRole')}</SelectItem>
                  <SelectItem value="editor">{t('team.editorRole')}</SelectItem>
                  <SelectItem value="viewer">{t('team.viewerRole')}</SelectItem>
                </SelectContent>
              </Select>
              {/* Default permissions preview */}
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Permissions par défaut :</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(DEFAULT_PERMISSIONS[role]).map(([key, enabled]) => (
                    <Badge key={key} variant={enabled ? 'default' : 'outline'} className="text-xs">
                      {PERMISSION_LABELS[key] || key}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button onClick={handleInvite} disabled={isInviting || !email.trim()} className="w-full">
                {isInviting ? t('team.sending') : t('team.sendInvitation')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Members list */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">{t('team.loading')}</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t('team.noMembers')}</p>
              <p className="text-sm">{t('team.noMembersDesc')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {members.map(member => (
                <div key={member.id} className="p-4 hover:bg-muted/50 transition-colors space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {member.member_email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{member.member_email}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(member.invited_at), 'dd MMM yyyy', { locale: dateLocale })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={roleLabels[member.role]?.color}>
                        {roleLabels[member.role]?.label}
                      </Badge>
                      <Badge variant={member.status === 'active' ? 'default' : 'outline'}>
                        {member.status === 'pending' ? t('team.statusPending') : t('team.statusActive')}
                      </Badge>
                      <Select value={member.role} onValueChange={v => updateMemberRole({ id: member.id, role: v as TeamMember['role'] })}>
                        <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{t('team.roleAdmin')}</SelectItem>
                          <SelectItem value="editor">{t('team.roleEditor')}</SelectItem>
                          <SelectItem value="viewer">{t('team.roleViewer')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => setEditingPermissions(editingPermissions === member.id ? null : member.id)}>
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeMember(member.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Inline permissions editor */}
                  {editingPermissions === member.id && (
                    <div className="rounded-lg border p-3 bg-muted/30">
                      <p className="text-xs font-semibold mb-2 text-muted-foreground">Permissions granulaires</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between gap-2">
                            <span className="text-sm">{label}</span>
                            <Switch
                              checked={member.permissions?.[key] ?? false}
                              onCheckedChange={checked => {
                                updateMemberPermissions({
                                  id: member.id,
                                  permissions: { ...member.permissions, [key]: checked },
                                });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Invitations Tab (invitations received) ── */
function InvitationsTab({ roleLabels, dateLocale }: { roleLabels: Record<string, { label: string; color: string }>; dateLocale: Locale }) {
  const { myInvitations, acceptInvitation, declineInvitation } = useTeamManagement();

  if (myInvitations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune invitation en attente</p>
          <p className="text-sm">Vous serez notifié lorsqu'un propriétaire de compte vous invitera.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {myInvitations.map(inv => (
        <Card key={inv.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Mail className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium">Invitation d'équipe</p>
                <p className="text-sm text-muted-foreground">
                  Rôle : <Badge variant="secondary" className={roleLabels[inv.role]?.color}>{roleLabels[inv.role]?.label}</Badge>
                  {' — '}{format(new Date(inv.invited_at), 'dd MMM yyyy', { locale: dateLocale })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => declineInvitation(inv.id)}>
                <XCircle className="h-4 w-4" /> Décliner
              </Button>
              <Button size="sm" className="gap-1" onClick={() => acceptInvitation(inv.id)}>
                <CheckCircle className="h-4 w-4" /> Accepter
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Stores Tab ── */
function StoresTab() {
  const { t } = useTranslation('settings');
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
        <h3 className="text-lg font-semibold">{t('stores.myStores', { count: stores.length })}</h3>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> {t('stores.addStore')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('stores.newStore')}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder={t('stores.storeName')} value={name} onChange={e => setName(e.target.value)} />
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="shopify">🟢 Shopify</SelectItem>
                  <SelectItem value="woocommerce">🟣 WooCommerce</SelectItem>
                  <SelectItem value="prestashop">🔴 PrestaShop</SelectItem>
                  <SelectItem value="amazon">🟠 Amazon</SelectItem>
                  <SelectItem value="ebay">🔵 eBay</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder={t('stores.domainOptional')} value={domain} onChange={e => setDomain(e.target.value)} />
              <Button onClick={handleAdd} disabled={isAdding || !name.trim()} className="w-full">
                {isAdding ? t('stores.adding') : t('stores.add')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">{t('team.loading')}</div>
      ) : stores.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{t('stores.noStores')}</p>
            <p className="text-sm text-muted-foreground">{t('stores.noStoresDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map(store => (
            <Card key={store.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏪</span>
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
                <Badge variant={store.status === 'active' ? 'default' : 'secondary'}>
                  {store.status === 'active' ? t('stores.active') : store.status}
                </Badge>
                <div className="flex justify-end pt-2">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteStore(store.id)}>
                    <Trash2 className="h-3 w-3 mr-1" /> {t('stores.delete')}
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
