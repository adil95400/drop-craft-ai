import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ClipboardCheck, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileText,
  BarChart3
} from 'lucide-react'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { useProductAudits, useAuditAnalytics } from '@/hooks/useProductAudit'

export default function AuditDashboard() {
  const navigate = useNavigate()
  const { user } = useUnifiedAuth()
  const { data: audits, isLoading: auditsLoading } = useProductAudits(user?.id || '', 10)
  const { data: analytics, isLoading: analyticsLoading } = useAuditAnalytics(user?.id || '')

  const latestAnalytics = analytics?.[0]
  
  // Use available fields from analytics_insights table
  const avgScore = latestAnalytics?.metric_value || 0
  const totalAudits = audits?.length || 0
  const productsWithErrors = audits?.filter(a => a.errors?.length > 0).length || 0
  const productsOptimized = audits?.filter(a => a.overall_score >= 80).length || 0

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Moyen</Badge>
    return <Badge className="bg-red-100 text-red-800">À améliorer</Badge>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            Audit Intelligent
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyse IA de vos produits pour maximiser les conversions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/audit/products')} size="lg">
            <Sparkles className="mr-2 h-4 w-4" />
            Auditer des produits
          </Button>
          <Button onClick={() => navigate('/audit/batch')} size="lg" variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            Audit en Masse
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/audit/products')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
              {avgScore.toFixed(1)}/100
            </div>
            <p className="text-xs text-muted-foreground">
              {totalAudits} audits réalisés
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/audit/products')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits avec Erreurs</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsWithErrors}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent une attention
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/audit/products')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Optimisés</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{productsOptimized}</div>
            <p className="text-xs text-muted-foreground">
              Prêts pour la vente
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/audit/analytics')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">+12%</div>
            <p className="text-xs text-muted-foreground">
              Amélioration vs. mois dernier
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Audits récents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audits Récents</CardTitle>
              <CardDescription>Derniers audits de produits effectués</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => navigate('/audit/products')}>
              Voir tout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {auditsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : audits && audits.length > 0 ? (
            <div className="space-y-4">
              {audits.slice(0, 5).map((audit) => (
                <div
                  key={audit.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/audit/${audit.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl font-bold ${getScoreColor(audit.overall_score)}`}>
                      {audit.overall_score.toFixed(0)}
                    </div>
                    <div>
                      <div className="font-medium">Produit {audit.product_id.slice(0, 8)}</div>
                      <div className="text-sm text-muted-foreground">
                        {audit.errors.length} erreur(s) · {audit.warnings.length} avertissement(s)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getScoreBadge(audit.overall_score)}
                    <Badge variant="outline">{audit.audit_type}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun audit pour le moment</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par auditer vos produits pour obtenir des recommandations
              </p>
              <Button onClick={() => navigate('/audit/products')}>
                <Sparkles className="mr-2 h-4 w-4" />
                Démarrer un audit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/audit/products')}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Auditer des Produits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Analysez vos produits individuellement ou en masse
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/rewrite/generator')}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Générer du Contenu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Utilisez l'IA pour créer titres et descriptions optimisés
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/audit/analytics')}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Voir les Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Suivez l'évolution de la qualité de votre catalogue
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}