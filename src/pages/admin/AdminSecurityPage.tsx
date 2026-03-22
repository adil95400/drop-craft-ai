/**
 * Admin Security Dashboard — Audit, sessions, rôles
 */
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Shield, Users, Key, Activity, AlertTriangle, Lock,
  CheckCircle, Clock, Globe, FileText, Eye, UserCheck
} from 'lucide-react';

export default function AdminSecurityPage() {
  const { t: tPages } = useTranslation('pages');
  const { data: auditStats } = useQuery({
    queryKey: ['admin-security-stats'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_audit_statistics', { p_days: 30 });
      return data || {};
    },
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ['recent-audit-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('id, action, action_category, severity, actor_email, resource_type, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('id, user_id, role')
        .limit(50);
      return data || [];
    },
  });

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['admin-api-keys'],
    queryFn: async () => {
      const { data } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, is_active, last_used_at, created_at, scopes')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const stats = auditStats as any || {};

  const severityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <>
      <Helmet>
        <title>Sécurité & Administration | Drop-Craft AI</title>
        <meta name="description" content="Tableau de bord de sécurité : audit, rôles, clés API et surveillance." />
      </Helmet>

      <ChannablePageWrapper
        title={tPages('securiteAdministration.title')}
        description="Surveillez la sécurité, gérez les rôles et auditez les actions"
        heroImage="settings"
        badge={{ label: 'Sécurité', icon: Shield }}
      >
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Événements (30j)', value: stats.total_events ?? '—', icon: Activity, color: 'text-primary' },
            { label: 'Utilisateurs actifs', value: stats.unique_users ?? '—', icon: Users, color: 'text-success' },
            { label: 'Événements critiques', value: stats.critical_events ?? '0', icon: AlertTriangle, color: 'text-destructive' },
            { label: 'Clés API actives', value: apiKeys.filter((k: any) => k.is_active).length, icon: Key, color: 'text-info' },
          ].map((kpi) => (
            <Card key={kpi.label} className="p-4">
              <div className="flex items-center gap-3">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="audit" className="w-full">
          <TabsList>
            <TabsTrigger value="audit">Journal d'Audit</TabsTrigger>
            <TabsTrigger value="roles">Rôles & Permissions</TabsTrigger>
            <TabsTrigger value="api-keys">Clés API</TabsTrigger>
            <TabsTrigger value="policies">Politiques RLS</TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="mt-6 space-y-3">
            {recentLogs.map((log: any) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={severityColor(log.severity)}>{log.severity}</Badge>
                    <div>
                      <p className="font-medium text-sm">{log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.actor_email || 'Système'} • {log.resource_type || '—'} • {log.action_category}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
              </Card>
            ))}
            {recentLogs.length === 0 && (
              <Card className="p-8 text-center">
                <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Aucun événement d'audit récent</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="roles" className="mt-6 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Rôles attribués</h3>
              <Badge variant="outline">{userRoles.length} entrées</Badge>
            </div>
            {userRoles.map((role: any) => (
              <Card key={role.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <code className="text-sm">{role.user_id.substring(0, 8)}...</code>
                  </div>
                  <Badge variant={role.role === 'admin' ? 'destructive' : role.role === 'moderator' ? 'secondary' : 'outline'}>
                    {role.role}
                  </Badge>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="api-keys" className="mt-6 space-y-3">
            {apiKeys.map((key: any) => (
              <Card key={key.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{key.key_prefix}...</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={key.is_active ? 'default' : 'secondary'}>
                      {key.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {key.last_used_at && (
                      <span className="text-xs text-muted-foreground">
                        Dernière utilisation: {new Date(key.last_used_at).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="policies" className="mt-6">
            <Card className="p-6">
              <div className="space-y-4">
                {[
                  { name: 'RLS multi-tenant', status: 'active', desc: 'Isolation auth.uid() = user_id sur toutes les tables' },
                  { name: 'SECURITY DEFINER', status: 'active', desc: 'Fonctions admin protégées avec has_role()' },
                  { name: 'Hachage SHA-256', status: 'active', desc: 'Clés API hachées, préfixe seul visible' },
                  { name: 'Rate Limiting', status: 'active', desc: 'Limitation des requêtes par utilisateur et par heure' },
                  { name: 'Audit Trail', status: 'active', desc: 'Journal immuable de toutes les actions sensibles' },
                ].map((policy) => (
                  <div key={policy.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <div>
                        <p className="font-medium text-sm">{policy.name}</p>
                        <p className="text-xs text-muted-foreground">{policy.desc}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-success">Actif</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
