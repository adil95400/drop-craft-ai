import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGlobalSEO } from '@/hooks/useGlobalSEO';
import { 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Loader2,
  FileText,
  Download,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';

export function GlobalSEOOptimizer() {
  const { 
    pages, 
    scanResults, 
    isScanning, 
    isOptimizing,
    scanProgress,
    optimizeProgress,
    scanAllPages,
    optimizeAllPages,
    generateSitemap,
    isGeneratingSitemap
  } = useGlobalSEO();

  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en' | 'es'>('fr');

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'info':
        return <CheckCircle2 className="w-4 h-4 text-info" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-success" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive/10 text-red-800 border-destructive/20';
      case 'warning':
        return 'bg-warning/10 text-yellow-800 border-warning/20';
      case 'info':
        return 'bg-info/10 text-blue-800 border-info/20';
      default:
        return 'bg-success/10 text-success border-success/20';
    }
  };

  const totalIssues = scanResults.reduce((acc, page) => acc + page.issues.length, 0);
  const criticalIssues = scanResults.reduce(
    (acc, page) => acc + page.issues.filter(i => i.severity === 'critical').length, 
    0
  );
  const averageScore = scanResults.length > 0 
    ? Math.round(scanResults.reduce((acc, page) => acc + page.score, 0) / scanResults.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{pages.length}</div>
              <div className="text-sm text-muted-foreground">Pages scannées</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-success" />
              <div className="text-2xl font-bold">{averageScore}/100</div>
              <div className="text-sm text-muted-foreground">Score moyen SEO</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-warning" />
              <div className="text-2xl font-bold">{totalIssues}</div>
              <div className="text-sm text-muted-foreground">Problèmes détectés</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
              <div className="text-2xl font-bold">{criticalIssues}</div>
              <div className="text-sm text-muted-foreground">Problèmes critiques</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Scanner & Optimiser le SEO
          </CardTitle>
          <CardDescription>
            Analysez toutes les pages de votre site et optimisez automatiquement le SEO
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => scanAllPages()} 
              disabled={isScanning}
              variant="outline"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scan en cours... {scanProgress.current}/{scanProgress.total}
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Scanner toutes les pages
                </>
              )}
            </Button>

            <Button 
              onClick={() => optimizeAllPages(selectedLanguage)}
              disabled={isOptimizing || scanResults.length === 0}
              className="bg-gradient-to-r from-primary to-purple-600"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Optimisation... {optimizeProgress.current}/{optimizeProgress.total}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Optimiser avec IA
                </>
              )}
            </Button>

            <Button 
              onClick={() => generateSitemap()}
              disabled={isGeneratingSitemap}
              variant="secondary"
            >
              {isGeneratingSitemap ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Générer Sitemap.xml
                </>
              )}
            </Button>
          </div>

          {/* Language Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Langue d'optimisation:</span>
            {(['fr', 'en', 'es'] as const).map((lang) => (
              <Button
                key={lang}
                size="sm"
                variant={selectedLanguage === lang ? 'default' : 'outline'}
                onClick={() => setSelectedLanguage(lang)}
              >
                {lang.toUpperCase()}
              </Button>
            ))}
          </div>

          {/* Progress Bars */}
          {isScanning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Scan des pages</span>
                <span className="text-muted-foreground">
                  {scanProgress.current}/{scanProgress.total}
                </span>
              </div>
              <Progress value={(scanProgress.current / scanProgress.total) * 100} />
              <p className="text-xs text-muted-foreground">{scanProgress.message}</p>
            </div>
          )}

          {isOptimizing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Optimisation IA</span>
                <span className="text-muted-foreground">
                  {optimizeProgress.current}/{optimizeProgress.total}
                </span>
              </div>
              <Progress value={(optimizeProgress.current / optimizeProgress.total) * 100} />
              <p className="text-xs text-muted-foreground">{optimizeProgress.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Results */}
      {scanResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats du Scan SEO</CardTitle>
            <CardDescription>
              Problèmes détectés et recommandations par page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {scanResults.map((page, index) => (
                  <Card key={index} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold">{page.url}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {page.title || 'Titre manquant'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline"
                            className={
                              page.score >= 80 ? 'border-success text-success' :
                              page.score >= 60 ? 'border-warning text-yellow-700' :
                              'border-destructive text-red-700'
                            }
                          >
                            Score: {page.score}/100
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {page.issues.length === 0 ? (
                        <div className="flex items-center gap-2 text-success text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Aucun problème détecté</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {page.issues.map((issue, issueIndex) => (
                            <div 
                              key={issueIndex}
                              className={`flex items-start gap-2 p-2 rounded border ${getSeverityColor(issue.severity)}`}
                            >
                              {getSeverityIcon(issue.severity)}
                              <div className="flex-1 text-sm">
                                <div className="font-medium">{issue.type}</div>
                                <div className="text-xs mt-0.5">{issue.message}</div>
                                {issue.recommendation && (
                                  <div className="text-xs mt-1 italic">
                                    💡 {issue.recommendation}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Optimized Content */}
                      {page.optimized && (
                        <div className="mt-4 pt-4 border-t space-y-2">
                          <div className="flex items-center gap-2 text-success text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            Contenu optimisé par IA
                          </div>
                          {page.optimized.title && (
                            <div>
                              <div className="text-xs text-muted-foreground">Nouveau titre:</div>
                              <div className="text-sm font-medium">{page.optimized.title}</div>
                            </div>
                          )}
                          {page.optimized.metaDescription && (
                            <div>
                              <div className="text-xs text-muted-foreground">Nouvelle meta description:</div>
                              <div className="text-sm">{page.optimized.metaDescription}</div>
                            </div>
                          )}
                          {page.optimized.h1 && (
                            <div>
                              <div className="text-xs text-muted-foreground">Nouveau H1:</div>
                              <div className="text-sm font-medium">{page.optimized.h1}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
