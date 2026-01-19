/**
 * Page d'audit des feeds produits
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Rss, RefreshCw, CheckCircle2, AlertCircle, XCircle, Clock, FileText, Download } from 'lucide-react';

export default function AuditFeedPage() {
  const feeds = [
    { 
      name: 'Google Shopping', 
      status: 'valid', 
      products: 1234, 
      errors: 0, 
      warnings: 12,
      lastSync: '2026-01-19 10:30'
    },
    { 
      name: 'Facebook Catalog', 
      status: 'warning', 
      products: 1180, 
      errors: 0, 
      warnings: 54,
      lastSync: '2026-01-19 09:15'
    },
    { 
      name: 'Amazon Seller', 
      status: 'error', 
      products: 890, 
      errors: 12, 
      warnings: 28,
      lastSync: '2026-01-18 23:00'
    },
    { 
      name: 'Criteo', 
      status: 'valid', 
      products: 1234, 
      errors: 0, 
      warnings: 5,
      lastSync: '2026-01-19 11:00'
    },
  ];

  const feedStats = {
    totalProducts: 1234,
    validProducts: 1156,
    errorProducts: 12,
    warningProducts: 66,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Valide</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" />Avertissements</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Erreurs</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  return (
    <ChannablePageWrapper
      title="Audit Feed"
      description="Vérifiez la qualité de vos flux produits pour chaque marketplace"
      heroImage="schema"
      badge={{ label: "Feed", icon: Rss }}
      actions={
        <div className="flex gap-2">
          <Button size="lg" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Valider tous les feeds
          </Button>
          <Button size="lg" variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter le rapport
          </Button>
        </div>
      }
    >
      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{feedStats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Dans tous les feeds</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-700 dark:text-green-400">Produits Valides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">{feedStats.validProducts}</div>
            <Progress value={(feedStats.validProducts / feedStats.totalProducts) * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-700 dark:text-yellow-400">Avertissements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{feedStats.warningProducts}</div>
            <p className="text-xs text-muted-foreground">À vérifier</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-900/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-700 dark:text-red-400">Erreurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700 dark:text-red-400">{feedStats.errorProducts}</div>
            <p className="text-xs text-muted-foreground">À corriger</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des feeds */}
      <Card>
        <CardHeader>
          <CardTitle>État des Feeds</CardTitle>
          <CardDescription>Statut de synchronisation par marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feeds.map((feed) => (
              <div 
                key={feed.name}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{feed.name}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Dernière sync: {feed.lastSync}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">{feed.products} produits</div>
                    <div className="flex items-center gap-2 text-sm">
                      {feed.errors > 0 && (
                        <span className="text-red-600">{feed.errors} erreurs</span>
                      )}
                      {feed.warnings > 0 && (
                        <span className="text-yellow-600">{feed.warnings} avertissements</span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(feed.status)}
                  <Button size="sm" variant="outline" className="gap-2">
                    <RefreshCw className="h-3 w-3" />
                    Valider
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Problèmes courants */}
      <Card>
        <CardHeader>
          <CardTitle>Problèmes Courants</CardTitle>
          <CardDescription>Erreurs fréquentes détectées dans vos feeds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50 dark:bg-red-900/10">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <span className="font-medium">GTIN invalide</span>
                  <p className="text-sm text-muted-foreground">Le code GTIN n'est pas au format attendu</p>
                </div>
              </div>
              <Badge variant="destructive">12 produits</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <span className="font-medium">Description trop courte</span>
                  <p className="text-sm text-muted-foreground">La description doit contenir au moins 150 caractères</p>
                </div>
              </div>
              <Badge variant="secondary">45 produits</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <span className="font-medium">Catégorie manquante</span>
                  <p className="text-sm text-muted-foreground">La catégorie Google Shopping n'est pas définie</p>
                </div>
              </div>
              <Badge variant="secondary">21 produits</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  );
}
