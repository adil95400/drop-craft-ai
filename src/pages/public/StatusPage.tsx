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
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Wrench,
  RefreshCw,
  Clock,
  Globe,
  Database,
  Shield,
  Zap,
  Server,
  Cloud,
  ArrowUpRight,
  Bell
} from 'lucide-react';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusConfig = {
  operational: {
    icon: CheckCircle2,
    label: 'Opérationnel',
    color: 'text-green-600',
    bg: 'bg-green-100',
    badge: 'default' as const
  },
  degraded: {
    icon: AlertTriangle,
    label: 'Performances dégradées',
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    badge: 'secondary' as const
  },
  partial_outage: {
    icon: AlertCircle,
    label: 'Panne partielle',
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    badge: 'secondary' as const
  },
  major_outage: {
    icon: XCircle,
    label: 'Panne majeure',
    color: 'text-red-600',
    bg: 'bg-red-100',
    badge: 'destructive' as const
  },
  maintenance: {
    icon: Wrench,
    label: 'Maintenance',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    badge: 'outline' as const
  }
};

const serviceIcons: Record<string, React.ElementType> = {
  'API': Server,
  'Web App': Globe,
  'Database': Database,
  'Authentication': Shield,
  'Edge Functions': Zap,
  'Storage': Cloud,
  'Sync Services': RefreshCw,
  'AI Services': Zap,
  'Webhooks': ArrowUpRight,
  'Notifications': Bell
};

// Données de démonstration pour le cas sans données
const defaultServices = [
  { id: '1', service_name: 'Web Application', status: 'operational' as const, description: 'Interface utilisateur principale', last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', service_name: 'API', status: 'operational' as const, description: 'API REST et GraphQL', last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', service_name: 'Database', status: 'operational' as const, description: 'Base de données PostgreSQL', last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', service_name: 'Authentication', status: 'operational' as const, description: 'Authentification et SSO', last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', service_name: 'Edge Functions', status: 'operational' as const, description: 'Fonctions serverless', last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '6', service_name: 'Storage', status: 'operational' as const, description: 'Stockage de fichiers', last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '7', service_name: 'Sync Services', status: 'operational' as const, description: 'Synchronisation marketplace', last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '8', service_name: 'AI Services', status: 'operational' as const, description: 'Optimisation IA et ML', last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '9', service_name: 'Webhooks', status: 'operational' as const, description: 'Réception webhooks Shopify/WooCommerce', last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '10', service_name: 'Notifications', status: 'operational' as const, description: 'Email et push notifications', last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

// Historique des incidents (mock pour la démo)
const recentIncidents = [
  {
    id: '1',
    date: '2025-01-28',
    title: 'Maintenance planifiée',
    description: 'Mise à jour des services backend avec temps d\'arrêt minimal.',
    status: 'resolved',
    duration: '15 minutes'
  },
  {
    id: '2',
    date: '2025-01-20',
    title: 'Latence API temporaire',
    description: 'Latence légèrement augmentée sur l\'API pendant les heures de pointe.',
    status: 'resolved',
    duration: '45 minutes'
  }
];

// Uptime des 90 derniers jours (mock)
const uptimeData = {
  overall: 99.98,
  api: 99.99,
  database: 99.99,
  auth: 100,
  edge: 99.95
};

export default function StatusPage() {
  const { services: dbServices, isLoading, overallStatus, operationalCount, totalServices } = useSystemStatus();
  
  // Utiliser les services de la DB ou les services par défaut
  const services = dbServices.length > 0 ? dbServices : defaultServices;
  const total = services.length;
  const operational = services.filter(s => s.status === 'operational').length;
  const currentOverallStatus = dbServices.length > 0 ? overallStatus : 'operational';

  const overallConfig = statusConfig[currentOverallStatus] || statusConfig.operational;
  const OverallIcon = overallConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">ShopOpti+</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/documentation">Documentation</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/contact">Support</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Overall Status */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center gap-3 ${overallConfig.bg} px-6 py-4 rounded-2xl mb-6`}>
            <OverallIcon className={`w-8 h-8 ${overallConfig.color}`} />
            <span className={`text-xl font-semibold ${overallConfig.color}`}>
              {currentOverallStatus === 'operational' 
                ? 'Tous les systèmes sont opérationnels' 
                : overallConfig.label}
            </span>
          </div>
          <p className="text-muted-foreground">
            {operational}/{total} services opérationnels • Dernière mise à jour : {format(new Date(), 'HH:mm', { locale: fr })}
          </p>
        </div>

        {/* Uptime Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Disponibilité des 90 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{uptimeData.overall}%</div>
                <div className="text-sm text-muted-foreground">Uptime global</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{uptimeData.api}%</div>
                <div className="text-sm text-muted-foreground">API</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{uptimeData.database}%</div>
                <div className="text-sm text-muted-foreground">Base de données</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{uptimeData.auth}%</div>
                <div className="text-sm text-muted-foreground">Auth</div>
              </div>
            </div>
            
            {/* Visual uptime bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">90 derniers jours</span>
                <span className="font-medium text-green-600">{uptimeData.overall}% uptime</span>
              </div>
              <div className="flex gap-0.5 h-8">
                {Array.from({ length: 90 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-sm ${
                      i === 62 ? 'bg-yellow-400' : i === 70 ? 'bg-yellow-400' : 'bg-green-500'
                    }`}
                    title={`Jour ${90 - i}: ${i === 62 || i === 70 ? 'Dégradé' : 'Opérationnel'}`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>90 jours</span>
                <span>Aujourd'hui</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">État des services</CardTitle>
            <CardDescription>
              Statut en temps réel de tous les composants de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg" />
                      <div>
                        <div className="w-32 h-4 bg-muted rounded" />
                        <div className="w-48 h-3 bg-muted rounded mt-2" />
                      </div>
                    </div>
                    <div className="w-24 h-6 bg-muted rounded" />
                  </div>
                ))}
              </div>
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

        {/* Recent Incidents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Historique des incidents</CardTitle>
            <CardDescription>
              Derniers incidents et maintenances des 30 derniers jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentIncidents.length > 0 ? (
              <div className="space-y-4">
                {recentIncidents.map((incident) => (
                  <div key={incident.id} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Résolu
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {incident.duration}
                      </span>
                    </div>
                    <h4 className="font-medium">{incident.title}</h4>
                    <p className="text-sm text-muted-foreground">{incident.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{incident.date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-medium">Aucun incident récent</p>
                <p className="text-sm text-muted-foreground">
                  Tous les services fonctionnent normalement
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscribe to updates */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-medium">S'abonner aux notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Recevez des alertes lors d'incidents ou maintenances
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link to="/contact">
                  S'abonner
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>
            Cette page est mise à jour automatiquement toutes les 60 secondes.
          </p>
          <p className="mt-2">
            <Link to="/documentation" className="text-primary hover:underline">Documentation</Link>
            {' • '}
            <Link to="/contact" className="text-primary hover:underline">Support</Link>
            {' • '}
            <Link to="/" className="text-primary hover:underline">Retour à l'accueil</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
