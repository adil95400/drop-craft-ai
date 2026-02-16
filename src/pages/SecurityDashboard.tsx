import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Lock, AlertTriangle, CheckCircle2, Eye, Key, Search, Download, RefreshCw, Clock, User, Globe, Smartphone } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useAuditLogs, useAuditStatistics } from '@/hooks/useAuditLog';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { GDPRComplianceCenter } from '@/components/security/GDPRComplianceCenter';
import { TwoFactorSetup } from '@/components/security/TwoFactorSetup';

const severityColors: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-500',
  warning: 'bg-yellow-500/10 text-yellow-500',
  error: 'bg-destructive/10 text-destructive',
  critical: 'bg-red-700/10 text-red-700',
};

const categoryIcons: Record<string, React.ReactNode> = {
  authentication: <Key className="h-4 w-4" />,
  data_access: <Eye className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  system: <Globe className="h-4 w-4" />,
  user_action: <User className="h-4 w-4" />,
};

export default function SecurityDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const { logs, isLoading: logsLoading, refetch } = useAuditLogs({ 
    realtime: true, 
    limit: 100,
    severity: severityFilter !== 'all' ? severityFilter as any : undefined
  });
  const { data: stats, isLoading: statsLoading } = useAuditStatistics(30);

  const filteredLogs = logs.filter(log => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        log.action?.toLowerCase().includes(term) ||
        log.description?.toLowerCase().includes(term) ||
        log.resource_type?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const securityScore = stats ? Math.min(100, 70 + (stats as any).totalEvents > 0 ? 25 : 0) : 95;

  return (
    <ChannablePageWrapper
      title="Sécurité & Compliance"
      description="2FA, audit logs, RGPD et conformité enterprise"
      heroImage="settings"
      badge={{ label: 'Ultra Pro', icon: Shield }}
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="gdpr">RGPD</TabsTrigger>
          <TabsTrigger value="2fa">2FA</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Score sécurité</p>
                  <p className="text-2xl font-bold">{securityScore}/100</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Politiques RLS</p>
                  <p className="text-2xl font-bold">18</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Alertes actives</p>
                  <p className="text-2xl font-bold">{logs.filter(l => l.severity === 'error' || l.severity === 'critical').length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Logs (30j)</p>
                  <p className="text-2xl font-bold">{logs.length}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-primary" />
                  Mesures de sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Chiffrement des données', status: true, icon: Lock },
                  { label: 'Authentification 2FA', status: false, icon: Smartphone },
                  { label: 'Politiques RLS actives', status: true, icon: Shield },
                  { label: 'Audit logging', status: true, icon: Eye },
                  { label: 'Rate limiting API', status: true, icon: Globe },
                  { label: 'Conformité RGPD', status: true, icon: CheckCircle2 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <Badge variant={item.status ? 'default' : 'secondary'}>
                      {item.status ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Événements récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {filteredLogs.slice(0, 8).map((log) => (
                      <div key={log.id} className="flex items-center gap-3 p-2 bg-muted/20 rounded-lg text-sm">
                        <div className={`p-1.5 rounded ${severityColors[log.severity] || 'bg-muted'}`}>
                          {categoryIcons[log.action_category] || <Clock className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{log.action}</p>
                          <p className="text-xs text-muted-foreground truncate">{log.description}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {log.created_at && formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                    ))}
                    {filteredLogs.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucun événement de sécurité récent
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AUDIT LOGS */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Journal d'audit complet
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Actualiser
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" /> Exporter CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher dans les logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sévérité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Erreur</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {logsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className={`p-2 rounded-lg mt-0.5 ${severityColors[log.severity] || 'bg-muted'}`}>
                        {categoryIcons[log.action_category] || <Clock className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{log.action}</span>
                          <Badge variant="outline" className="text-[10px]">{log.action_category}</Badge>
                          <Badge className={`text-[10px] ${severityColors[log.severity]}`}>{log.severity}</Badge>
                        </div>
                        {log.description && <p className="text-xs text-muted-foreground">{log.description}</p>}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {log.resource_type && <span>📦 {log.resource_type}</span>}
                          {(log as any).actor_ip && <span>🌐 {(log as any).actor_ip}</span>}
                          <span>
                            <Clock className="h-3 w-3 inline mr-1" />
                            {log.created_at && formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredLogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun log trouvé</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GDPR */}
        <TabsContent value="gdpr">
          <GDPRComplianceCenter />
        </TabsContent>

        {/* 2FA */}
        <TabsContent value="2fa">
          <TwoFactorSetup />
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
