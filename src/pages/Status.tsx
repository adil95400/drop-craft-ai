import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  lastCheck: Date;
  responseTime?: number;
  uptime?: number;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  impact: 'minor' | 'major' | 'critical';
  startTime: Date;
  updates: Array<{
    time: Date;
    message: string;
    status: string;
  }>;
}

const Status = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'API Principal',
      status: 'operational',
      lastCheck: new Date(),
      responseTime: 156,
      uptime: 99.98
    },
    {
      name: 'Base de données',
      status: 'operational',
      lastCheck: new Date(),
      responseTime: 45,
      uptime: 99.99
    },
    {
      name: 'Interface Web',
      status: 'operational',
      lastCheck: new Date(),
      responseTime: 89,
      uptime: 99.95
    },
    {
      name: 'Edge Functions',
      status: 'operational',
      lastCheck: new Date(),
      responseTime: 234,
      uptime: 99.92
    },
    {
      name: 'Synchronisation',
      status: 'operational',
      lastCheck: new Date(),
      responseTime: 456,
      uptime: 99.87
    },
    {
      name: 'IA & Analytics',
      status: 'operational',
      lastCheck: new Date(),
      responseTime: 678,
      uptime: 99.94
    }
  ]);

  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: '1',
      title: 'Ralentissement temporaire de l\'API',
      status: 'resolved',
      impact: 'minor',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updates: [
        {
          time: new Date(Date.now() - 30 * 60 * 1000),
          message: 'Le problème a été identifié et résolu. Tous les services fonctionnent normalement.',
          status: 'resolved'
        },
        {
          time: new Date(Date.now() - 90 * 60 * 1000),
          message: 'Nous avons identifié la cause du ralentissement et appliquons un correctif.',
          status: 'identified'
        },
        {
          time: new Date(Date.now() - 2 * 60 * 60 * 1000),
          message: 'Nous enquêtons sur des ralentissements signalés sur l\'API.',
          status: 'investigating'
        }
      ]
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'outage':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'maintenance':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-green-100 text-green-800">Opérationnel</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800">Dégradé</Badge>;
      case 'outage':
        return <Badge className="bg-red-100 text-red-800">Panne</Badge>;
      case 'maintenance':
        return <Badge className="bg-blue-100 text-blue-800">Maintenance</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800">Opérationnel</Badge>;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'minor':
        return <Badge variant="secondary">Impact mineur</Badge>;
      case 'major':
        return <Badge className="bg-orange-100 text-orange-800">Impact majeur</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Impact critique</Badge>;
      default:
        return <Badge variant="secondary">Impact mineur</Badge>;
    }
  };

  const refreshStatus = async () => {
    setIsRefreshing(true);
    
    // Simuler une vérification des services
    setTimeout(() => {
      setServices(prev => prev.map(service => ({
        ...service,
        lastCheck: new Date(),
        responseTime: Math.floor(Math.random() * 500) + 50
      })));
      setIsRefreshing(false);
    }, 1000);
  };

  const overallStatus = services.every(s => s.status === 'operational') 
    ? 'operational' 
    : services.some(s => s.status === 'outage') 
    ? 'outage' 
    : 'degraded';

  return (
    <>
      <Helmet>
        <title>Statut des Services - Drop Craft AI</title>
        <meta 
          name="description" 
          content="Consultez le statut en temps réel des services Drop Craft AI. Incidents, maintenances et performances." 
        />
        <link rel="canonical" href="https://dropcraft.ai/status" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Statut des Services</h1>
            <p className="text-muted-foreground mb-6">
              Surveillance en temps réel de tous nos services
            </p>
            <Button 
              onClick={refreshStatus}
              disabled={isRefreshing}
              className="mb-8"
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Actualiser
            </Button>
          </div>

          {/* Overall Status */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  {getStatusIcon(overallStatus)}
                  Statut Général
                </CardTitle>
                {getStatusBadge(overallStatus)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                {overallStatus === 'operational' 
                  ? 'Tous les systèmes sont opérationnels' 
                  : 'Certains services rencontrent des problèmes'
                }
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Dernière vérification : {new Date().toLocaleString('fr-FR')}
              </p>
            </CardContent>
          </Card>

          {/* Services Status */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {services.map((service) => (
              <Card key={service.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      {service.name}
                    </CardTitle>
                    {getStatusBadge(service.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Temps de réponse</span>
                      <span className="font-mono">{service.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Disponibilité (30j)</span>
                      <span className="font-mono text-green-600">{service.uptime}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Dernière vérification : {service.lastCheck.toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Incidents */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Incidents Récents</CardTitle>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucun incident signalé dans les dernières 48 heures
                </p>
              ) : (
                <div className="space-y-6">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="border-l-4 border-primary pl-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{incident.title}</h3>
                        <div className="flex gap-2">
                          {getImpactBadge(incident.impact)}
                          <Badge 
                            variant={incident.status === 'resolved' ? 'default' : 'secondary'}
                          >
                            {incident.status === 'resolved' && 'Résolu'}
                            {incident.status === 'monitoring' && 'Surveillance'}
                            {incident.status === 'identified' && 'Identifié'}
                            {incident.status === 'investigating' && 'Investigation'}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">
                        Début : {incident.startTime.toLocaleString('fr-FR')}
                      </p>

                      <div className="space-y-3">
                        {incident.updates.map((update, idx) => (
                          <div key={idx} className="bg-muted/50 p-3 rounded">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs text-muted-foreground">
                                {update.time.toLocaleString('fr-FR')}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {update.status}
                              </Badge>
                            </div>
                            <p className="text-sm">{update.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Maintenance programmée */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Programmée</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Aucune maintenance programmée dans les 7 prochains jours
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground mb-4">
              Vous rencontrez un problème non signalé ?
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline">
                Signaler un problème
              </Button>
              <Button variant="outline">
                S'abonner aux mises à jour
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Status;