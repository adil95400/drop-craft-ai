/**
 * Page de statut système public
 * Affiche l'état de tous les services en temps réel
 */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2, AlertCircle, AlertTriangle, XCircle, Wrench, RefreshCw, Clock, Globe,
  Database, Shield, Zap, Server, Cloud, ArrowUpRight, Bell
} from 'lucide-react';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusConfig = {
  operational: { icon: CheckCircle2, label: 'Opérationnel', color: 'text-green-600', bg: 'bg-green-100', badge: 'default' as const },
  degraded: { icon: AlertTriangle, label: 'Performances dégradées', color: 'text-yellow-600', bg: 'bg-yellow-100', badge: 'secondary' as const },
  partial_outage: { icon: AlertCircle, label: 'Panne partielle', color: 'text-orange-600', bg: 'bg-orange-100', badge: 'secondary' as const },
  major_outage: { icon: XCircle, label: 'Panne majeure', color: 'text-red-600', bg: 'bg-red-100', badge: 'destructive' as const },
  maintenance: { icon: Wrench, label: 'Maintenance', color: 'text-blue-600', bg: 'bg-blue-100', badge: 'outline' as const }
};

const serviceIcons: Record<string, React.ElementType> = {
  'API': Server, 'Web App': Globe, 'Database': Database, 'Authentication': Shield,
  'Edge Functions': Zap, 'Storage': Cloud, 'Sync Services': RefreshCw,
  'AI Services': Zap, 'Webhooks': ArrowUpRight, 'Notifications': Bell
};

export default function StatusPage() {
  const { services, isLoading, overallStatus } = useSystemStatus();
  
  const total = services.length;
  const operational = services.filter(s => s.status === 'operational').length;
  
  const overallConfig = statusConfig[overallStatus] || statusConfig.operational;
  const OverallIcon = overallConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">ShopOpti+ Status</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild><Link to="/contact">Support</Link></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className={`inline-flex items-center gap-3 ${overallConfig.bg} px-6 py-4 rounded-2xl mb-6`}>
            <OverallIcon className={`w-8 h-8 ${overallConfig.color}`} />
            <span className={`text-xl font-semibold ${overallConfig.color}`}>
              {overallStatus === 'operational' ? 'Tous les systèmes sont opérationnels' : overallConfig.label}
            </span>
          </div>
          <p className="text-muted-foreground">
            {isLoading ? 'Vérification...' : `${operational}/${total} services opérationnels • Dernière mise à jour : ${format(new Date(), 'HH:mm', { locale: fr })}`}
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">État des services</CardTitle>
            <CardDescription>Statut en temps réel de tous les composants de la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            {isLoading ? (
              <div className="space-y-4 p-4 text-center text-muted-foreground">Chargement des statuts...</div>
            ) : (
              services.map((service, index) => {
                const config = statusConfig[service.status] || statusConfig.operational;
                const StatusIcon = config.icon;
                const ServiceIcon = serviceIcons[service.service_name] || Server;
                
                return (
                  <React.Fragment key={service.id}>
                    {index > 0 && <Separator />}
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${config.bg} rounded-lg flex items-center justify-center`}>
                          <ServiceIcon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <h3 className="font-medium">{service.service_name}</h3>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={config.badge} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Cette page est mise à jour automatiquement toutes les 60 secondes.</p>
          <p className="mt-2">
            <Link to="/" className="text-primary hover:underline">Retour à l'accueil</Link>
          </p>
        </div>
      </main>
    </div>
  );
}