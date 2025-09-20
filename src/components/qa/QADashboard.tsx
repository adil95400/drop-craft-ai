import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  GitBranch,
  TestTube,
  Activity,
  RefreshCw,
  Eye
} from 'lucide-react'

interface TestCoverage {
  lines: number
  functions: number
  branches: number
  statements: number
}

interface CIStatus {
  status: 'success' | 'failure' | 'running' | 'pending'
  build: string
  timestamp: string
  duration: number
}

export function QADashboard() {
  const [testCoverage, setTestCoverage] = useState<TestCoverage>({
    lines: 78,
    functions: 82,
    branches: 71,
    statements: 79
  })

  const [ciStatus, setCiStatus] = useState<CIStatus>({
    status: 'success',
    build: '#1234',
    timestamp: new Date().toISOString(),
    duration: 142
  })

  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshData = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />
      case 'failure':
        return <XCircle className="h-5 w-5 text-destructive" />
      case 'running':
        return <RefreshCw className="h-5 w-5 text-primary animate-spin" />
      default:
        return <AlertCircle className="h-5 w-5 text-warning" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-success text-success-foreground'
      case 'failure':
        return 'bg-destructive text-destructive-foreground'
      case 'running':
        return 'bg-primary text-primary-foreground'
      default:
        return 'bg-warning text-warning-foreground'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard QA</h1>
          <p className="text-muted-foreground">Monitoring de la qualité et CI/CD</p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="ci-cd">CI/CD</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Couverture Tests</CardTitle>
                <TestTube className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{testCoverage.lines}%</div>
                <p className="text-xs text-muted-foreground">
                  +2% par rapport au mois dernier
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Build Status</CardTitle>
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(ciStatus.status)}
                  <Badge className={getStatusColor(ciStatus.status)}>
                    {ciStatus.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Build {ciStatus.build} - {ciStatus.duration}s
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Erreurs Sentry</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  -5 depuis hier
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98%</div>
                <p className="text-xs text-muted-foreground">
                  Lighthouse Score
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Couverture de Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Lignes</span>
                  <span className="text-sm text-muted-foreground">
                    {testCoverage.lines}%
                  </span>
                </div>
                <Progress value={testCoverage.lines} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fonctions</span>
                  <span className="text-sm text-muted-foreground">
                    {testCoverage.functions}%
                  </span>
                </div>
                <Progress value={testCoverage.functions} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Branches</span>
                  <span className="text-sm text-muted-foreground">
                    {testCoverage.branches}%
                  </span>
                </div>
                <Progress value={testCoverage.branches} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Statements</span>
                  <span className="text-sm text-muted-foreground">
                    {testCoverage.statements}%
                  </span>
                </div>
                <Progress value={testCoverage.statements} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tests Récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Unit Tests', status: 'success', tests: 156, time: '2.3s' },
                  { name: 'Integration Tests', status: 'success', tests: 23, time: '12.1s' },
                  { name: 'E2E Tests', status: 'running', tests: 8, time: '45.0s' }
                ].map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <p className="font-medium">{test.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {test.tests} tests - {test.time}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ci-cd" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Builds Récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { build: '#1234', branch: 'main', status: 'success', duration: '2m 22s', author: 'dev@example.com' },
                  { build: '#1233', branch: 'feature/auth', status: 'success', duration: '1m 45s', author: 'dev@example.com' },
                  { build: '#1232', branch: 'main', status: 'failure', duration: '0m 35s', author: 'test@example.com' }
                ].map((build, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(build.status)}
                      <div>
                        <p className="font-medium">Build {build.build}</p>
                        <p className="text-sm text-muted-foreground">
                          {build.branch} • {build.duration} • {build.author}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Sentry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-destructive">3</div>
                    <p className="text-sm text-muted-foreground">Erreurs</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-warning">12</div>
                    <p className="text-sm text-muted-foreground">Warnings</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">1.2k</div>
                    <p className="text-sm text-muted-foreground">Events</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}