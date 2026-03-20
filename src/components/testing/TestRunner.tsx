import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Bug,
  Zap,
  Target,
  Activity,
  FileText,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'unit' | 'integration' | 'e2e' | 'api';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  assertions?: Array<{
    name: string;
    passed: boolean;
    expected: any;
    actual: any;
  }>;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestCase[];
  status: 'idle' | 'running' | 'completed';
  passed: number;
  failed: number;
  total: number;
}

interface TestResults {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage?: number;
}

export const TestRunner: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [results, setResults] = useState<TestResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();

  // Données de test simulées
  const mockTestSuites: TestSuite[] = [
    {
      id: 'auth',
      name: 'Authentification',
      description: 'Tests de connexion et gestion des utilisateurs',
      tests: [
        {
          id: 'auth-1',
          name: 'Login avec email valide',
          description: 'Vérifier la connexion avec des identifiants corrects',
          category: 'unit',
          status: 'passed',
          duration: 120
        },
        {
          id: 'auth-2',
          name: 'Login avec email invalide',
          description: 'Vérifier le rejet avec des identifiants incorrects',
          category: 'unit',
          status: 'passed',
          duration: 80
        },
        {
          id: 'auth-3',
          name: 'Protection des routes',
          description: 'Vérifier l\'accès aux pages protégées',
          category: 'integration',
          status: 'failed',
          duration: 200,
          error: 'Route /admin accessible sans authentification',
          assertions: [
            { name: 'Redirection vers login', passed: false, expected: '/login', actual: '/admin' }
          ]
        }
      ],
      status: 'completed',
      passed: 2,
      failed: 1,
      total: 3
    },
    {
      id: 'products',
      name: 'Gestion Produits',
      description: 'Tests CRUD et import de produits',
      tests: [
        {
          id: 'prod-1',
          name: 'Création de produit',
          description: 'Créer un nouveau produit via l\'API',
          category: 'api',
          status: 'passed',
          duration: 150
        },
        {
          id: 'prod-2',
          name: 'Import CSV',
          description: 'Importer des produits depuis un fichier CSV',
          category: 'integration',
          status: 'passed',
          duration: 2500
        },
        {
          id: 'prod-3',
          name: 'Validation des données',
          description: 'Vérifier la validation des champs obligatoires',
          category: 'unit',
          status: 'passed',
          duration: 95
        }
      ],
      status: 'completed',
      passed: 3,
      failed: 0,
      total: 3
    },
    {
      id: 'orders',
      name: 'Traitement Commandes',
      description: 'Tests de workflow des commandes',
      tests: [
        {
          id: 'order-1',
          name: 'Création commande',
          description: 'Créer une nouvelle commande',
          category: 'unit',
          status: 'passed',
          duration: 180
        },
        {
          id: 'order-2',
          name: 'Calcul des totaux',
          description: 'Vérifier le calcul des prix et taxes',
          category: 'unit',
          status: 'failed',
          duration: 110,
          error: 'Calcul TVA incorrect pour les produits digitaux',
          assertions: [
            { name: 'TVA 20%', passed: false, expected: 24.0, actual: 20.0 }
          ]
        },
        {
          id: 'order-3',
          name: 'Workflow complet E2E',
          description: 'Test complet de création à livraison',
          category: 'e2e',
          status: 'pending',
          duration: 0
        }
      ],
      status: 'idle',
      passed: 1,
      failed: 1,
      total: 3
    }
  ];

  useEffect(() => {
    setTestSuites(mockTestSuites);
    calculateResults(mockTestSuites);
  }, []);

  const calculateResults = (suites: TestSuite[]) => {
    const totalTests = suites.reduce((sum, suite) => sum + suite.total, 0);
    const passed = suites.reduce((sum, suite) => sum + suite.passed, 0);
    const failed = suites.reduce((sum, suite) => sum + suite.failed, 0);
    const skipped = totalTests - passed - failed;
    
    const allTests = suites.flatMap(suite => suite.tests);
    const duration = allTests.reduce((sum, test) => sum + (test.duration || 0), 0);

    setResults({
      totalTests,
      passed,
      failed,
      skipped,
      duration,
      coverage: 87.5 // Mock coverage
    });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setLogs([]);
    
    try {
      for (const suite of testSuites) {
        await runTestSuite(suite.id);
      }
      
      toast({
        title: "Tests terminés",
        description: "Tous les tests ont été exécutés",
      });
    } catch (error) {
      toast({
        title: "Erreur lors des tests",
        description: "Une erreur est survenue pendant l'exécution",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runTestSuite = async (suiteId: string) => {
    const suiteIndex = testSuites.findIndex(s => s.id === suiteId);
    if (suiteIndex === -1) return;

    // Update suite status
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? { ...suite, status: 'running' as const }
        : suite
    ));

    addLog(`🚀 Démarrage de la suite: ${testSuites[suiteIndex].name}`);

    // Simulate running each test
    for (const test of testSuites[suiteIndex].tests) {
      await runSingleTest(suiteId, test.id);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }

    // Update suite as completed
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? { ...suite, status: 'completed' as const }
        : suite
    ));

    addLog(`✅ Suite terminée: ${testSuites[suiteIndex].name}`);
  };

  const runSingleTest = async (suiteId: string, testId: string) => {
    addLog(`  🔄 Exécution: ${testId}`);
    
    // Update test status to running
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId
        ? {
            ...suite,
            tests: suite.tests.map(test => 
              test.id === testId
                ? { ...test, status: 'running' as const }
                : test
            )
          }
        : suite
    ));

    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    // For demo, randomly fail some tests that were initially failing
    const suite = testSuites.find(s => s.id === suiteId);
    const test = suite?.tests.find(t => t.id === testId);
    const shouldPass = test?.status !== 'failed' || Math.random() > 0.7;

    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId
        ? {
            ...suite,
            tests: suite.tests.map(t => 
              t.id === testId
                ? { 
                    ...t, 
                    status: shouldPass ? 'passed' as const : 'failed' as const,
                    duration: Math.floor(Math.random() * 500) + 50
                  }
                : t
            )
          }
        : suite
    ));

    addLog(`    ${shouldPass ? '✅' : '❌'} ${testId}: ${shouldPass ? 'PASSED' : 'FAILED'}`);
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'running': return <Clock className="w-4 h-4 text-info animate-spin" />;
      case 'skipped': return <AlertTriangle className="w-4 h-4 text-warning" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-success';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'skipped': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'unit': return <Zap className="w-3 h-3" />;
      case 'integration': return <Target className="w-3 h-3" />;
      case 'e2e': return <Activity className="w-3 h-3" />;
      case 'api': return <Bug className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Test Runner</h1>
          <p className="text-muted-foreground">Exécution et surveillance des tests automatisés</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                En cours...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Lancer tous les tests
              </>
            )}
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configuration
          </Button>
        </div>
      </div>

      {/* Results Overview */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tests Réussis</p>
                  <p className="text-2xl font-bold text-success">{results.passed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tests Échoués</p>
                  <p className="text-2xl font-bold text-destructive">{results.failed}</p>
                </div>
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Couverture</p>
                  <p className="text-2xl font-bold text-info">{results.coverage?.toFixed(1)}%</p>
                </div>
                <Target className="w-8 h-8 text-info" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Durée</p>
                  <p className="text-2xl font-bold text-purple-600">{(results.duration / 1000).toFixed(1)}s</p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="suites" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suites">Suites de Test</TabsTrigger>
          <TabsTrigger value="logs">Logs d'Exécution</TabsTrigger>
          <TabsTrigger value="coverage">Couverture de Code</TabsTrigger>
        </TabsList>

        <TabsContent value="suites" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {testSuites.map((suite) => (
                <Card key={suite.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedSuite(suite)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{suite.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {suite.status === 'running' && <Clock className="w-4 h-4 text-info animate-spin" />}
                        <Badge className={getStatusColor(suite.status === 'completed' ? (suite.failed > 0 ? 'failed' : 'passed') : suite.status)}>
                          {suite.status === 'completed' ? 
                            (suite.failed > 0 ? 'Échecs' : 'Réussi') : 
                            suite.status === 'running' ? 'En cours' : 'En attente'}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{suite.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span>{suite.passed}/{suite.total} tests réussis</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          runTestSuite(suite.id);
                        }}
                        disabled={suite.status === 'running'}
                      >
                        {suite.status === 'running' ? (
                          <Clock className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3 mr-1" />
                        )}
                        Lancer
                      </Button>
                    </div>
                    <Progress value={(suite.passed / suite.total) * 100} className="mt-2 h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedSuite && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedSuite.name}</CardTitle>
                  <CardDescription>Détail des tests individuels</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {selectedSuite.tests.map((test) => (
                        <div key={test.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(test.status)}
                            <Badge variant="outline" className="text-xs">
                              {getCategoryIcon(test.category)}
                              <span className="ml-1 capitalize">{test.category}</span>
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{test.name}</p>
                            <p className="text-xs text-muted-foreground">{test.description}</p>
                            {test.duration && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Durée: {test.duration}ms
                              </p>
                            )}
                            {test.error && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                                <p className="font-medium">Erreur:</p>
                                <p>{test.error}</p>
                              </div>
                            )}
                            {test.assertions && test.assertions.some(a => !a.passed) && (
                              <div className="mt-2 space-y-1">
                                {test.assertions.filter(a => !a.passed).map((assertion, index) => (
                                  <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                                    <p className="font-medium text-red-800">{assertion.name}</p>
                                    <p className="text-destructive">
                                      Attendu: {JSON.stringify(assertion.expected)}, 
                                      Reçu: {JSON.stringify(assertion.actual)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs d'Exécution</CardTitle>
              <CardDescription>Suivi en temps réel de l'exécution des tests</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full">
                <div className="font-mono text-xs space-y-1">
                  {logs.length === 0 ? (
                    <p className="text-muted-foreground">Aucun log disponible. Lancez des tests pour voir les résultats.</p>
                  ) : (
                    logs.map((log, index) => (
                      <p key={index} className="whitespace-pre-wrap">{log}</p>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Couverture par Fichier</CardTitle>
                <CardDescription>Analyse détaillée de la couverture de code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { file: 'src/components/auth/', coverage: 95.2 },
                  { file: 'src/components/products/', coverage: 87.8 },
                  { file: 'src/components/orders/', coverage: 76.4 },
                  { file: 'src/services/', coverage: 92.1 },
                  { file: 'src/utils/', coverage: 84.3 }
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.file}</span>
                      <span className={`font-bold ${item.coverage >= 90 ? 'text-success' : item.coverage >= 80 ? 'text-warning' : 'text-destructive'}`}>
                        {item.coverage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={item.coverage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques de Qualité</CardTitle>
                <CardDescription>Indicateurs de qualité du code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <p className="text-2xl font-bold text-success">A</p>
                    <p className="text-xs text-muted-foreground">Maintenabilité</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <p className="text-2xl font-bold text-info">B</p>
                    <p className="text-xs text-muted-foreground">Fiabilité</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <p className="text-2xl font-bold text-success">A</p>
                    <p className="text-xs text-muted-foreground">Sécurité</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <p className="text-2xl font-bold text-warning">C</p>
                    <p className="text-xs text-muted-foreground">Performance</p>
                  </div>
                </div>
                
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Complexité cyclomatique</span>
                    <span className="font-bold">3.2</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Dette technique</span>
                    <span className="font-bold text-warning">2.1h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Duplications</span>
                    <span className="font-bold text-success">1.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};