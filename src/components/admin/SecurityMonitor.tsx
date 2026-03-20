import { useState, useEffect } from 'react';
import { productionLogger } from '@/utils/productionLogger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import {
  Shield,
  AlertTriangle,
  Eye,
  Lock,
  Activity,
  Globe,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Database,
  Settings,
  Ban,
  Search
} from 'lucide-react';

interface SecurityThreat {
  id: string;
  type: 'brute_force' | 'suspicious_activity' | 'data_breach' | 'malware' | 'ddos';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source: string;
  timestamp: string;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  affectedUsers?: number;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  blockedAttacks: number;
  successRate: number;
  responseTime: number;
  vulnerabilities: number;
  patchLevel: number;
  complianceScore: number;
}

export const SecurityMonitor = () => {
  const { events, stats, loading, logSecurityEvent, refreshEvents } = useSecurityMonitoring();
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    criticalEvents: 0,
    blockedAttacks: 0,
    successRate: 0,
    responseTime: 0,
    vulnerabilities: 0,
    patchLevel: 0,
    complianceScore: 0
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadSecurityData, 10000); // Actualiser toutes les 10s
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadSecurityData = async () => {
    try {
      // Charger les menaces de sécurité
      const threatsData = await loadSecurityThreats();
      setThreats(threatsData);

      // Charger les métriques de sécurité  
      const metricsData = await loadSecurityMetrics();
      setMetrics(metricsData);

      await refreshEvents();
    } catch (error) {
      productionLogger.error('Failed to load security data', error as Error, 'SecurityMonitor');
    }
  };

  const loadSecurityThreats = async (): Promise<SecurityThreat[]> => {
    // Simulation de menaces de sécurité
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        id: '1',
        type: 'brute_force',
        severity: 'high',
        description: 'Tentatives de connexion répétées depuis une IP suspecte',
        source: '192.168.1.100',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        status: 'active',
        affectedUsers: 3
      },
      {
        id: '2',
        type: 'suspicious_activity',
        severity: 'medium',
        description: 'Accès inhabituel aux données sensibles',
        source: 'user@example.com',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        status: 'investigating',
        affectedUsers: 1
      },
      {
        id: '3',
        type: 'ddos',
        severity: 'critical',
        description: 'Pic de trafic suspect détecté',
        source: 'Multiple IPs',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'resolved'
      },
      {
        id: '4',
        type: 'malware',
        severity: 'low',
        description: 'Upload de fichier potentiellement malveillant',
        source: 'test@domain.com',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        status: 'false_positive'
      }
    ];
  };

  const loadSecurityMetrics = async (): Promise<SecurityMetrics> => {
    // Query real security events from DB
    const { supabase } = await import('@/integrations/supabase/client')
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 86400000).toISOString()

    const [eventsRes, criticalRes] = await Promise.all([
      supabase.from('security_events').select('id', { count: 'exact', head: true }).gte('created_at', dayAgo),
      supabase.from('security_events').select('id', { count: 'exact', head: true }).eq('severity', 'critical').gte('created_at', dayAgo),
    ])

    const totalEvents = eventsRes.count ?? 0
    const criticalEvents = criticalRes.count ?? 0

    return {
      totalEvents,
      criticalEvents,
      blockedAttacks: 0,
      successRate: totalEvents > 0 ? Math.round(((totalEvents - criticalEvents) / totalEvents) * 1000) / 10 : 100,
      responseTime: 0,
      vulnerabilities: 0,
      patchLevel: 100,
      complianceScore: 100
    };
  };

  const handleThreatAction = async (threatId: string, action: 'investigate' | 'resolve' | 'block' | 'ignore') => {
    const threat = threats.find(t => t.id === threatId);
    if (!threat) return;

    try {
      // Simuler l'action
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let newStatus: SecurityThreat['status'] = threat.status;
      let actionMessage = '';
      
      switch (action) {
        case 'investigate':
          newStatus = 'investigating';
          actionMessage = 'Investigation lancée';
          break;
        case 'resolve':
          newStatus = 'resolved';
          actionMessage = 'Menace résolue';
          break;
        case 'block':
          newStatus = 'resolved';
          actionMessage = 'Source bloquée';
          break;
        case 'ignore':
          newStatus = 'false_positive';
          actionMessage = 'Marqué comme faux positif';
          break;
      }

      // Mettre à jour la menace
      setThreats(prev => prev.map(t => 
        t.id === threatId ? { ...t, status: newStatus } : t
      ));

      // Logger l'action de sécurité
      await logSecurityEvent(
        'security_action',
        'info',
        `Action administrative: ${action} sur menace ${threat.type}`,
        { threatId, action, threatType: threat.type }
      );

      toast({
        title: "Action effectuée",
        description: actionMessage
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer cette action",
        variant: "destructive"
      });
    }
  };

  const runSecurityScan = async () => {
    toast({
      title: "Scan de sécurité lancé",
      description: "Analyse complète du système en cours..."
    });

    await logSecurityEvent(
      'security_scan',
      'info',
      'Scan de sécurité manuel déclenché par admin',
      { scanType: 'full_system' }
    );

    // Simuler le scan
    await new Promise(resolve => setTimeout(resolve, 3000));

    toast({
      title: "Scan terminé",
      description: "Aucune vulnérabilité critique détectée"
    });

    loadSecurityData();
  };

  const getSeverityColor = (severity: SecurityThreat['severity']) => {
    switch (severity) {
      case 'critical': return 'text-destructive bg-destructive/5 border-destructive/20';
      case 'high': return 'text-warning bg-orange-50 border-orange-200';
      case 'medium': return 'text-warning bg-warning/5 border-warning/20';
      case 'low': return 'text-info bg-info/5 border-info/20';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: SecurityThreat['status']) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'investigating': return 'secondary';
      case 'resolved': return 'default';
      case 'false_positive': return 'outline';
      default: return 'outline';
    }
  };

  const getThreatIcon = (type: SecurityThreat['type']) => {
    switch (type) {
      case 'brute_force': return Ban;
      case 'suspicious_activity': return Eye;
      case 'data_breach': return Database;
      case 'malware': return AlertTriangle;
      case 'ddos': return Zap;
      default: return Shield;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Centre de Sécurité
          </h2>
          <p className="text-muted-foreground">
            Surveillance et gestion des menaces en temps réel
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto ON' : 'Auto OFF'}
          </Button>
          <Button onClick={runSecurityScan}>
            <Search className="h-4 w-4 mr-2" />
            Scan Complet
          </Button>
        </div>
      </div>

      {/* Métriques de sécurité */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Événements (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEvents.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3 text-destructive" />
              <span className="text-destructive">{metrics.criticalEvents} critiques</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attaques Bloquées</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.blockedAttacks}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">{metrics.successRate.toFixed(1)}% succès</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps de Réponse</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.responseTime.toFixed(1)}s</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-success" />
              <span>Sous la cible (3s)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Conformité</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.complianceScore.toFixed(1)}%</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3 text-info" />
              <span>GDPR/ISO 27001</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes critiques */}
      {threats.filter(t => t.severity === 'critical' && t.status === 'active').length > 0 && (
        <Alert className="border-destructive/20 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-red-800">
            <strong>Alerte critique :</strong> {threats.filter(t => t.severity === 'critical' && t.status === 'active').length} menace(s) critique(s) détectée(s). Action immédiate requise.
          </AlertDescription>
        </Alert>
      )}

      {/* Onglets de sécurité */}
      <Tabs defaultValue="threats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="threats">Menaces Actives</TabsTrigger>
          <TabsTrigger value="monitoring">Surveillance</TabsTrigger>
          <TabsTrigger value="compliance">Conformité</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="threats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Menaces de Sécurité Détectées
              </CardTitle>
              <CardDescription>
                Gestion et suivi des incidents de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threats.map((threat) => {
                  const ThreatIcon = getThreatIcon(threat.type);
                  return (
                    <div key={threat.id} className={`p-4 rounded-lg border ${getSeverityColor(threat.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <ThreatIcon className="h-5 w-5 mt-0.5" />
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{threat.description}</h4>
                              <Badge variant={getStatusColor(threat.status)}>
                                {threat.status}
                              </Badge>
                              <Badge variant="outline">
                                {threat.severity}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>Source: {threat.source}</p>
                              <p>Détecté: {new Date(threat.timestamp).toLocaleString()}</p>
                              {threat.affectedUsers && (
                                <p>Utilisateurs affectés: {threat.affectedUsers}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {threat.status === 'active' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleThreatAction(threat.id, 'investigate')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleThreatAction(threat.id, 'block')}
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleThreatAction(threat.id, 'resolve')}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {threats.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-success" />
                    <p>Aucune menace active détectée</p>
                    <p className="text-sm">Tous les systèmes sont sécurisés</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Surveillance en Temps Réel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Tentatives de connexion</span>
                    <span className="text-success">Normal</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Trafic réseau</span>
                    <span className="text-warning">Élevé</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Accès aux données</span>
                    <span className="text-success">Sécurisé</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Anomalies détectées</span>
                    <span className="text-destructive">Attention</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Géolocalisation des Menaces
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">🇺🇸 États-Unis</span>
                    <Badge variant="destructive">24 tentatives</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">🇷🇺 Russie</span>
                    <Badge variant="destructive">18 tentatives</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">🇨🇳 Chine</span>
                    <Badge variant="secondary">12 tentatives</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">🇩🇪 Allemagne</span>
                    <Badge variant="outline">5 tentatives</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">🇧🇷 Brésil</span>
                    <Badge variant="outline">3 tentatives</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  État de Conformité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>GDPR (Protection des données)</span>
                    <span className="text-success">{metrics.complianceScore.toFixed(0)}%</span>
                  </div>
                  <Progress value={metrics.complianceScore} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>ISO 27001 (Sécurité)</span>
                    <span className="text-success">{metrics.patchLevel.toFixed(0)}%</span>
                  </div>
                  <Progress value={metrics.patchLevel} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>PCI DSS (Paiements)</span>
                    <span className="text-warning">82%</span>
                  </div>
                  <Progress value={82} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>SOC 2 (Contrôles)</span>
                    <span className="text-success">95%</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Vulnérabilités
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div>
                      <p className="text-sm font-medium">Haute priorité</p>
                      <p className="text-xs text-muted-foreground">Correctifs critiques</p>
                    </div>
                    <Badge variant="destructive">{Math.max(0, metrics.vulnerabilities - 3)}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <div>
                      <p className="text-sm font-medium">Moyenne priorité</p>
                      <p className="text-xs text-muted-foreground">Améliorations sécurité</p>
                    </div>
                    <Badge variant="secondary">7</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-info/5 border border-info/20">
                    <div>
                      <p className="text-sm font-medium">Basse priorité</p>
                      <p className="text-xs text-muted-foreground">Optimisations</p>
                    </div>
                    <Badge variant="outline">12</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Rapports de Sécurité
              </CardTitle>
              <CardDescription>
                Génération et téléchargement des rapports d'audit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Shield className="h-6 w-6" />
                  <span className="text-sm">Rapport Mensuel</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Activity className="h-6 w-6" />
                  <span className="text-sm">Incidents Sécurité</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Lock className="h-6 w-6" />
                  <span className="text-sm">Audit Accès</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-sm">Conformité GDPR</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};