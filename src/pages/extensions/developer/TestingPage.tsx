import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, XCircle, AlertTriangle, Play, Pause, RotateCcw, Bug, Clock, Zap } from 'lucide-react'

export default function TestingPage() {
  const [selectedSuite, setSelectedSuite] = useState('all')
  const [isRunning, setIsRunning] = useState(false)
  const [testProgress, setTestProgress] = useState(0)

  const testSuites = [
    {
      id: 'unit',
      name: 'Tests Unitaires',
      description: 'Tests des fonctions individuelles',
      tests: 156,
      passed: 142,
      failed: 8,
      skipped: 6,
      coverage: 87,
      duration: '2.4s'
    },
    {
      id: 'integration',
      name: 'Tests d\'Intégration',
      description: 'Tests des interactions entre composants',
      tests: 78,
      passed: 69,
      failed: 5,
      skipped: 4,
      coverage: 73,
      duration: '15.7s'
    },
    {
      id: 'e2e',
      name: 'Tests End-to-End',
      description: 'Tests des parcours utilisateur complets',
      tests: 24,
      passed: 20,
      failed: 3,
      skipped: 1,
      coverage: 65,
      duration: '45.2s'
    },
    {
      id: 'performance',
      name: 'Tests de Performance',
      description: 'Tests de vitesse et optimisation',
      tests: 12,
      passed: 10,
      failed: 1,
      skipped: 1,
      coverage: 58,
      duration: '8.9s'
    }
  ]

  const recentTestRuns = [
    {
      id: '1',
      timestamp: '2024-01-15 14:32:15',
      branch: 'feature/data-scraper',
      status: 'passed',
      tests: 270,
      passed: 241,
      failed: 17,
      duration: '72.3s',
      coverage: 78
    },
    {
      id: '2',
      timestamp: '2024-01-15 13:15:42',
      branch: 'main',
      status: 'failed',
      tests: 270,
      passed: 235,
      failed: 23,
      duration: '68.7s',
      coverage: 76
    },
    {
      id: '3',
      timestamp: '2024-01-15 11:28:19',
      branch: 'fix/api-integration',
      status: 'passed',
      tests: 270,
      passed: 248,
      failed: 10,
      duration: '69.1s',
      coverage: 79
    }
  ]

  const failedTests = [
    {
      id: '1',
      name: 'should scrape product data correctly',
      suite: 'DataScraper',
      file: 'src/scrapers/products.test.js',
      error: 'Expected 50 products, but got 48. Missing products: [id: 123, id: 456]',
      stackTrace: `at DataScraper.scrapeProducts (src/scrapers/products.js:45:12)
at Object.<anonymous> (src/scrapers/products.test.js:23:8)`,
      duration: '2.1s'
    },
    {
      id: '2',
      name: 'should handle API rate limiting',
      suite: 'ApiClient',
      file: 'src/api/client.test.js',
      error: 'Request timeout: Expected response within 5000ms but got timeout',
      stackTrace: `at ApiClient.makeRequest (src/api/client.js:89:15)
at Object.<anonymous> (src/api/client.test.js:56:12)`,
      duration: '5.0s'
    }
  ]

  const performanceMetrics = [
    {
      metric: 'Temps de démarrage',
      current: '1.2s',
      target: '< 1.0s',
      status: 'warning',
      trend: '+0.1s'
    },
    {
      metric: 'Utilisation mémoire',
      current: '45MB',
      target: '< 50MB',
      status: 'pass',
      trend: '-2MB'
    },
    {
      metric: 'Temps de scraping',
      current: '3.4s',
      target: '< 5.0s',
      status: 'pass',
      trend: '-0.2s'
    },
    {
      metric: 'Taux d\'erreur',
      current: '0.3%',
      target: '< 1%',
      status: 'pass',
      trend: '-0.1%'
    }
  ]

  const coverageData = [
    { file: 'src/scrapers/products.js', coverage: 95, lines: '156/164' },
    { file: 'src/api/client.js', coverage: 88, lines: '142/161' },
    { file: 'src/utils/parser.js', coverage: 92, lines: '78/85' },
    { file: 'src/background/worker.js', coverage: 73, lines: '89/122' },
    { file: 'src/content/injector.js', coverage: 67, lines: '45/67' }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: 'default' as const,
      failed: 'destructive' as const,
      warning: 'secondary' as const,
      pass: 'default' as const
    }
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>
  }

  const runTests = () => {
    setIsRunning(true)
    setTestProgress(0)
    
    const interval = setInterval(() => {
      setTestProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsRunning(false)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Tests & Validation
          </h1>
          <p className="text-muted-foreground mt-2">
            Testez et validez vos extensions avant le déploiement
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedSuite} onValueChange={setSelectedSuite}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les suites</SelectItem>
              <SelectItem value="unit">Tests unitaires</SelectItem>
              <SelectItem value="integration">Tests intégration</SelectItem>
              <SelectItem value="e2e">Tests E2E</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={runTests} disabled={isRunning}>
            {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isRunning ? 'En cours...' : 'Lancer les Tests'}
          </Button>
        </div>
      </div>

      {isRunning && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Exécution des tests en cours...</span>
            </div>
            <Progress value={testProgress} className="mb-2" />
            <div className="text-sm text-muted-foreground">
              {testProgress}% terminé
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {testSuites.map((suite) => (
          <Card key={suite.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{suite.name}</h3>
                <Badge variant="outline">{suite.tests} tests</Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">{suite.description}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                    Réussis: {suite.passed}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center">
                    <XCircle className="w-3 h-3 mr-1 text-red-500" />
                    Échoués: {suite.failed}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1 text-orange-500" />
                    Ignorés: {suite.skipped}
                  </span>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Couverture</span>
                    <span>{suite.coverage}%</span>
                  </div>
                  <Progress value={suite.coverage} className="h-2" />
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Durée: {suite.duration}</span>
                  <span>Taux: {Math.round((suite.passed / suite.tests) * 100)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="failed">Tests Échoués</TabsTrigger>
          <TabsTrigger value="coverage">Couverture</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Résumé Global</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">270</div>
                  <p className="text-sm text-muted-foreground">Tests totaux</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">241</div>
                  <p className="text-sm text-muted-foreground">Réussis</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">17</div>
                  <p className="text-sm text-muted-foreground">Échoués</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">12</div>
                  <p className="text-sm text-muted-foreground">Ignorés</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Taux de réussite global</span>
                  <span>89.3%</span>
                </div>
                <Progress value={89.3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tests Échoués ({failedTests.length})</CardTitle>
              <CardDescription>
                Analysez et corrigez les tests qui ont échoué
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {failedTests.map((test) => (
                  <Card key={test.id} className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-red-600">{test.name}</h3>
                          <p className="text-sm text-muted-foreground">{test.suite} • {test.file}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {test.duration}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Bug className="w-4 h-4 mr-1" />
                            Debug
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-muted p-3 rounded-lg mb-3">
                        <p className="text-sm font-mono text-red-600">{test.error}</p>
                      </div>
                      
                      <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Voir la stack trace
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs font-mono overflow-x-auto">
                          {test.stackTrace}
                        </pre>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Couverture de Code</CardTitle>
              <CardDescription>
                Analysez quelle partie de votre code est testée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {coverageData.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{file.file}</h4>
                      <p className="text-sm text-muted-foreground">Lignes: {file.lines}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-semibold">{file.coverage}%</div>
                        <Progress value={file.coverage} className="w-24 h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métriques de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {performanceMetrics.map((metric, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{metric.metric}</h4>
                        {getStatusIcon(metric.status)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Actuel</span>
                          <span className="font-semibold">{metric.current}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Cible</span>
                          <span className="text-sm">{metric.target}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Tendance</span>
                          <span className={`text-sm ${metric.trend.startsWith('-') ? 'text-green-600' : 'text-red-600'}`}>
                            {metric.trend}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTestRuns.map((run) => (
                  <Card key={run.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(run.status)}
                          <div>
                            <p className="font-semibold">{run.branch}</p>
                            <p className="text-sm text-muted-foreground">{run.timestamp}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{run.passed}/{run.tests} tests</p>
                          <p className="text-sm text-muted-foreground">
                            {run.duration} • {run.coverage}% couverture
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}