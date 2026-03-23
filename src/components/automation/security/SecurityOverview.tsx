import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, FileText, AlertTriangle, CheckCircle, Activity, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function SecurityOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['automation-security-stats'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('automation-security-engine', {
        body: { action: 'get_security_stats' },
      });
      if (response.error) throw response.error;
      return response.data;
    },
  });

  const healthScore = stats?.health_score ?? 100;
  const healthColor = healthScore >= 80 ? 'text-green-500' : healthScore >= 50 ? 'text-yellow-500' : 'text-red-500';
  const healthBg = healthScore >= 80 ? 'bg-green-500/10' : healthScore >= 50 ? 'bg-yellow-500/10' : 'bg-red-500/10';

  const cards = [
    {
      title: 'Score de Santé',
      value: isLoading ? '...' : `${healthScore}%`,
      icon: Shield,
      description: 'Score global de fiabilité',
      color: healthColor,
      bg: healthBg,
    },
    {
      title: 'Entrées d\'Audit',
      value: isLoading ? '...' : stats?.audit_entries_30d?.toLocaleString() || '0',
      icon: FileText,
      description: '30 derniers jours',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Événements Sécurité',
      value: isLoading ? '...' : stats?.security_events_30d?.toLocaleString() || '0',
      icon: Activity,
      description: '30 derniers jours',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Opérations Échouées',
      value: isLoading ? '...' : stats?.failed_operations?.toLocaleString() || '0',
      icon: AlertTriangle,
      description: 'En attente de retry',
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                </div>
                <div className={`p-3 rounded-full ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* RBAC Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Contrôle d'Accès (RBAC)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { permission: 'Modification des prix', roles: ['admin'], level: 'critical' },
              { permission: 'Commandes fournisseurs', roles: ['admin'], level: 'critical' },
              { permission: 'Configuration workflows', roles: ['admin'], level: 'high' },
              { permission: 'Consultation audit', roles: ['admin'], level: 'high' },
              { permission: 'Visualisation dashboard', roles: ['admin', 'user'], level: 'normal' },
              { permission: 'Consultation stocks', roles: ['admin', 'user'], level: 'normal' },
            ].map((item) => (
              <div
                key={item.permission}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{item.permission}</span>
                </div>
                <div className="flex gap-1">
                  {item.roles.map((role) => (
                    <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
