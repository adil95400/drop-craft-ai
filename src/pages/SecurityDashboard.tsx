import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle, Lock, Eye, Settings, Scan } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function SecurityDashboard() {
  const [scanInProgress, setScanInProgress] = useState(false);

  const securityMetrics = [
    { title: 'Score de Sécurité', value: 87, max: 100, status: 'good' },
    { title: 'Vulnérabilités', value: 2, max: 0, status: 'warning' },
    { title: 'Accès Surveillés', value: 1247, status: 'info' },
    { title: 'Dernière Analyse', value: '2h', status: 'info' }
  ];

  const securityAlerts = [
    {
      id: 1,
      type: 'warning',
      title: 'Tentative de connexion suspecte',
      description: 'Connexion depuis une IP non reconnue détectée',
      time: '5 min',
      severity: 'medium'
    },
    {
      id: 2,
      type: 'info',
      title: 'Mise à jour de sécurité disponible',
      description: 'Une nouvelle version avec corrections de sécurité est disponible',
      time: '1h',
      severity: 'low'
    },
    {
      id: 3,
      type: 'success',
      title: 'Scan de sécurité terminé',
      description: 'Analyse complète effectuée avec succès',
      time: '2h',
      severity: 'info'
    }
  ];

  const handleSecurityScan = async () => {
    setScanInProgress(true);
    // Simulation d'un scan de sécurité
    setTimeout(() => {
      setScanInProgress(false);
    }, 3000);
  };

  return (
    <>
      <Helmet>
        <title>Sécurité - Surveillance et Protection | Drop Craft AI</title>
        <meta name="description" content="Monitoring de sécurité avancé pour votre application. Surveillance des accès, détection d'intrusions et audit de sécurité." />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sécurité Avancée</h1>
            <p className="text-muted-foreground">
              Surveillance et protection de votre application en temps réel
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Configuration
            </Button>
            <Button onClick={handleSecurityScan} disabled={scanInProgress}>
              <Scan className="mr-2 h-4 w-4" />
              {scanInProgress ? 'Analyse...' : 'Scanner'}
            </Button>
          </div>
        </div>

        {/* Métriques de Sécurité */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {securityMetrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                {metric.max !== undefined && (
                  <Progress 
                    value={(metric.value / metric.max) * 100} 
                    className="mt-2 h-2"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alertes de Sécurité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertes de Sécurité
            </CardTitle>
            <CardDescription>
              Événements de sécurité récents nécessitant votre attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityAlerts.map((alert) => (
                <Alert key={alert.id} className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />}
                    {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                    {alert.type === 'info' && <Shield className="h-5 w-5 text-blue-500 mt-0.5" />}
                    <div className="flex-1">
                      <AlertDescription>
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {alert.description}
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {alert.time}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Sécurité */}
        <Tabs defaultValue="monitoring" className="space-y-4">
          <TabsList>
            <TabsTrigger value="monitoring">Surveillance</TabsTrigger>
            <TabsTrigger value="access">Contrôle d'Accès</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
            <TabsTrigger value="policies">Politiques</TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Surveillance en Temps Réel</CardTitle>
                <CardDescription>
                  Monitoring des événements de sécurité et des tentatives d'accès
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { event: 'Connexion réussie', user: 'admin@dropcraft.ai', ip: '192.168.1.100', time: '14:23' },
                    { event: 'Échec de connexion', user: 'unknown@test.com', ip: '45.123.67.89', time: '14:15' },
                    { event: 'API Access', user: 'service-account', ip: '10.0.0.50', time: '14:10' },
                    { event: 'Modification de données', user: 'user@company.com', ip: '192.168.1.105', time: '14:05' }
                  ].map((event, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{event.event}</h4>
                          <p className="text-sm text-muted-foreground">
                            {event.user} depuis {event.ip}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {event.time}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contrôle d'Accès</CardTitle>
                <CardDescription>
                  Gestion des permissions et des accès utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Gestion des Accès</h3>
                  <p className="text-muted-foreground">
                    Configuration des rôles et permissions en cours de développement
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Journaux d'Audit</CardTitle>
                <CardDescription>
                  Historique complet des événements de sécurité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Eye className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Audit de Sécurité</h3>
                  <p className="text-muted-foreground">
                    Les journaux détaillés seront bientôt disponibles
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Politiques de Sécurité</CardTitle>
                <CardDescription>
                  Configuration des règles et politiques de sécurité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Configuration des Politiques</h3>
                  <p className="text-muted-foreground">
                    Interface de configuration en cours de développement
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}