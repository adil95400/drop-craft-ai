import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGlobalImageOptimization } from "@/hooks/useGlobalImageOptimization";
import { 
  ImageIcon, 
  Zap, 
  FileImage, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Download,
  Sparkles
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function GlobalImageOptimizer() {
  const {
    isScanning,
    isOptimizing,
    scanResults,
    optimizationProgress,
    auditImages,
    optimizeAllImages,
    downloadReport
  } = useGlobalImageOptimization();

  const getTotalIssues = () => {
    if (!scanResults) return 0;
    return scanResults.images.filter(img => 
      img.issues.length > 0
    ).length;
  };

  const getIssuesByType = (type: string) => {
    if (!scanResults) return 0;
    return scanResults.images.filter(img => 
      img.issues.some(issue => issue.type === type)
    ).length;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images Totales</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scanResults?.totalImages || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images Lourdes</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {getIssuesByType('size')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">&gt; 200KB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sans ALT</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {getIssuesByType('alt')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimisées</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {scanResults ? scanResults.totalImages - getTotalIssues() : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Optimisation Globale des Images</CardTitle>
          <CardDescription>
            Auditez et optimisez toutes les images du site automatiquement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={() => auditImages()}
              disabled={isScanning || isOptimizing}
              className="flex-1"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scan en cours...
                </>
              ) : (
                <>
                  <FileImage className="mr-2 h-4 w-4" />
                  Scanner les Images
                </>
              )}
            </Button>

            <Button
              onClick={() => optimizeAllImages()}
              disabled={!scanResults || isOptimizing || getTotalIssues() === 0}
              variant="default"
              className="flex-1"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimisation...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Optimiser Tout ({getTotalIssues()})
                </>
              )}
            </Button>

            <Button
              onClick={downloadReport}
              disabled={!scanResults}
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Rapport
            </Button>
          </div>

          {isOptimizing && optimizationProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{optimizationProgress.message}</span>
                <span className="text-muted-foreground">
                  {optimizationProgress.current}/{optimizationProgress.total}
                </span>
              </div>
              <Progress 
                value={(optimizationProgress.current / optimizationProgress.total) * 100} 
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimization Features */}
      <Card>
        <CardHeader>
          <CardTitle>Fonctionnalités d'Optimisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Compression WebP</h4>
                <p className="text-xs text-muted-foreground">
                  Conversion automatique en WebP pour réduire la taille
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <FileImage className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Redimensionnement Intelligent</h4>
                <p className="text-xs text-muted-foreground">
                  Adaptation selon le contexte d'utilisation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">ALT Tags IA</h4>
                <p className="text-xs text-muted-foreground">
                  Génération automatique de descriptions accessibles
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <ImageIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Versions Responsive</h4>
                <p className="text-xs text-muted-foreground">
                  Génération de plusieurs résolutions (mobile, tablet, desktop)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Results */}
      {scanResults && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats du Scan</CardTitle>
            <CardDescription>
              {getTotalIssues()} image(s) nécessitent une optimisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {scanResults.images.map((image, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <img
                      src={image.url}
                      alt={image.alt || "Image"}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {image.url.split('/').pop()}
                        </p>
                        <Badge variant={image.issues.length > 0 ? "destructive" : "default"}>
                          {Math.round(image.size / 1024)}KB
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {image.dimensions.width}x{image.dimensions.height} • {image.format}
                      </p>
                      {image.issues.length > 0 ? (
                        <div className="space-y-1">
                          {image.issues.map((issue, i) => (
                            <Alert key={i} variant={issue.severity === 'error' ? 'destructive' : 'default'}>
                              <AlertDescription className="text-xs">
                                {issue.message}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Optimisée
                        </Badge>
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
  );
}
