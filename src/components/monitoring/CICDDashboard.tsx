import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  GitBranch,
  TestTube,
  Shield,
  Zap,
  Server
} from 'lucide-react'

interface PipelineJob {
  name: string
  status: 'success' | 'failed' | 'running' | 'pending'
  duration?: string
  coverage?: number
}

interface CICDDashboardProps {
  branch?: string
  commit?: string
  jobs?: PipelineJob[]
}

const defaultJobs: PipelineJob[] = [
  { name: 'Quality Gate', status: 'success', duration: '1m 23s', coverage: 78 },
  { name: 'Build', status: 'success', duration: '2m 45s' },
  { name: 'Security Audit', status: 'success', duration: '45s' },
  { name: 'E2E Tests', status: 'success', duration: '3m 12s' },
  { name: 'Performance Tests', status: 'success', duration: '1m 58s' }
]

const getStatusIcon = (status: PipelineJob['status']) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />
    case 'running':
      return <Clock className="h-5 w-5 text-blue-500 animate-spin" />
    case 'pending':
      return <Clock className="h-5 w-5 text-muted-foreground" />
  }
}

const getStatusBadge = (status: PipelineJob['status']) => {
  const variants: Record<PipelineJob['status'], 'default' | 'destructive' | 'secondary' | 'outline'> = {
    success: 'default',
    failed: 'destructive',
    running: 'secondary',
    pending: 'outline'
  }
  
  const labels: Record<PipelineJob['status'], string> = {
    success: 'Réussi',
    failed: 'Échec',
    running: 'En cours',
    pending: 'En attente'
  }
  
  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}

export const CICDDashboard: React.FC<CICDDashboardProps> = ({
  branch = 'main',
  commit = 'abc1234',
  jobs = defaultJobs
}) => {
  const successCount = jobs.filter(j => j.status === 'success').length
  const failedCount = jobs.filter(j => j.status === 'failed').length
  const runningCount = jobs.filter(j => j.status === 'running').length
  const overallStatus = failedCount > 0 ? 'failed' : runningCount > 0 ? 'running' : 'success'
  const avgCoverage = jobs.filter(j => j.coverage).reduce((sum, j) => sum + (j.coverage || 0), 0) / jobs.filter(j => j.coverage).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Pipeline CI/CD
              </CardTitle>
              <CardDescription className="mt-1">
                Branche: <code className="bg-muted px-1 rounded">{branch}</code> · 
                Commit: <code className="bg-muted px-1 rounded">{commit}</code>
              </CardDescription>
            </div>
            {getStatusBadge(overallStatus)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-500">{successCount}</div>
              <div className="text-sm text-muted-foreground">Réussis</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-red-500">{failedCount}</div>
              <div className="text-sm text-muted-foreground">Échoués</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-500">{runningCount}</div>
              <div className="text-sm text-muted-foreground">En cours</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{avgCoverage.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Couverture</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Jobs du Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobs.map((job, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(job.status)}
                <div>
                  <div className="font-medium">{job.name}</div>
                  {job.duration && (
                    <div className="text-sm text-muted-foreground">{job.duration}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {job.coverage && (
                  <div className="hidden md:flex items-center gap-2 w-32">
                    <Progress value={job.coverage} className="h-2" />
                    <span className="text-sm text-muted-foreground">{job.coverage}%</span>
                  </div>
                )}
                {getStatusBadge(job.status)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">Tests passés</p>
            <Progress value={98} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">0</div>
            <p className="text-xs text-muted-foreground">Vulnérabilités</p>
            <div className="flex gap-1 mt-2">
              <Badge variant="outline" className="text-xs">npm audit</Badge>
              <Badge variant="outline" className="text-xs">CodeQL</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground">Temps de chargement</p>
            <Progress value={85} className="h-1 mt-2" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CICDDashboard
