import { useEffect, useState } from 'react';
import { validateAllRoutes, logValidationResults } from '@/utils/routeValidator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
interface RouteValidationProviderProps {
  children: React.ReactNode;
  showErrorsInUI?: boolean;
}
export function RouteValidationProvider({
  children,
  showErrorsInUI = true
}: RouteValidationProviderProps) {
  const [validationResults, setValidationResults] = useState<ReturnType<typeof validateAllRoutes> | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  useEffect(() => {
    // Ne valider qu'en mode développement
    if (import.meta.env.DEV) {
      console.log('🚀 Démarrage de la validation des routes...');
      const results = validateAllRoutes();
      setValidationResults(results);
      logValidationResults(results);

      // Afficher le dialogue d'erreur si nécessaire
      if (!results.isValid && showErrorsInUI) {
        setShowErrorDialog(true);
      }
    }
  }, [showErrorsInUI]);

  // Affichage des erreurs en mode développement
  if (showErrorDialog && validationResults && !validationResults.isValid) {
    return <>
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl p-4">
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Erreurs de Configuration des Routes
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowErrorDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm">
                  <strong>{validationResults.summary.errors} erreur(s) détectée(s)</strong> dans la configuration des routes.
                  Certaines routes configurées dans <code>modules.ts</code> ou <code>sub-modules.ts</code> n'existent pas dans les fichiers de routing.
                </p>
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {validationResults.issues.map((issue, index) => <div key={index} className="p-3 bg-muted rounded-lg text-sm space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium">{issue.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{issue.route}</div>
                      </div>
                      <Badge variant={issue.type === 'error' ? 'destructive' : 'secondary'}>
                        {issue.category}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">{issue.issue}</div>
                    {issue.suggestion && <div className="text-xs text-blue-600 dark:text-blue-400">
                        💡 {issue.suggestion}
                      </div>}
                  </div>)}
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => setShowErrorDialog(false)} className="flex-1">
                  Continuer quand même
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log('=== Détails des erreurs de routes ===');
                    validationResults?.issues.forEach((issue, idx) => {
                      console.group(`❌ Erreur ${idx + 1}: ${issue.name}`);
                      console.log('Route:', issue.route);
                      console.log('Catégorie:', issue.category);
                      console.log('Problème:', issue.issue);
                      if (issue.suggestion) console.log('💡 Suggestion:', issue.suggestion);
                      console.groupEnd();
                    });
                  }} 
                  className="flex-1"
                >
                  Voir les détails (Console)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        {children}
      </>;
  }

  // Affichage du succès en mode développement (juste dans la console)
  if (import.meta.env.DEV && validationResults?.isValid) {
    return <>
        <div className="fixed bottom-4 left-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-500">
          <Card className="border-green-500 shadow-lg">
            
          </Card>
        </div>
        {children}
      </>;
  }
  return <>{children}</>;
}