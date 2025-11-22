import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download, 
  Eye, 
  Package,
  TrendingUp
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

export default function ImportResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId') || 'unknown';

  const results = {
    total: 150,
    success: 142,
    failed: 5,
    skipped: 3,
    duration: '2m 34s',
    source: 'AliExpress'
  };

  const successRate = ((results.success / results.total) * 100).toFixed(1);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Résultats d'Import</h1>
          <p className="text-muted-foreground mt-2">
            Job ID: {jobId}
          </p>
        </div>
        <Button onClick={() => navigate('/products')}>
          <Eye className="h-4 w-4 mr-2" />
          Voir les Produits
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{results.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Produits traités</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              Réussis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">
              {results.success}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{successRate}% de succès</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-700 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              Échecs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700 dark:text-red-400">
              {results.failed}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Erreurs d'import</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertCircle className="h-4 w-4" />
              Ignorés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
              {results.skipped}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Déjà existants</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progression de l'Import</CardTitle>
          <CardDescription>
            Source: {results.source} • Durée: {results.duration}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progression</span>
              <span className="font-medium">100%</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>

          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Produits importés</span>
              <Badge variant="secondary">{results.success}</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Taux de réussite</span>
              <Badge variant="default">{successRate}%</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Temps moyen/produit</span>
              <Badge variant="outline">1.1s</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {results.failed > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Produits en Échec ({results.failed})
            </CardTitle>
            <CardDescription>
              Ces produits n'ont pas pu être importés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Produit XYZ', reason: 'Prix invalide' },
                { name: 'Produit ABC', reason: 'Images manquantes' },
                { name: 'Produit DEF', reason: 'Description trop courte' },
                { name: 'Produit GHI', reason: 'Catégorie non supportée' },
                { name: 'Produit JKL', reason: 'SKU déjà existant' }
              ].map((error, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{error.name}</p>
                    <p className="text-sm text-muted-foreground">{error.reason}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Réessayer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Actions Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" onClick={() => navigate('/products')}>
              <Eye className="h-4 w-4 mr-2" />
              Voir les Produits
            </Button>
            <Button variant="outline" onClick={() => navigate('/products/publish')}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Publier sur les Boutiques
            </Button>
            <Button variant="outline" onClick={() => navigate('/products/import')}>
              <Download className="h-4 w-4 mr-2" />
              Nouvel Import
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
