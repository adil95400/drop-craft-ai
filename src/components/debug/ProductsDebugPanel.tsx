/**
 * Panneau de diagnostic pour les produits
 * Affiche les informations de debug sur les sources de produits
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Database, User, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceStats {
  source: string;
  count: number;
  userSpecific: number;
  error?: string;
}

interface DebugInfo {
  userId: string | null;
  userEmail: string | null;
  sources: SourceStats[];
  totalProducts: number;
  timestamp: Date;
}

export function ProductsDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const sources: SourceStats[] = [];
      
      // Check main tables that we know exist in the schema
      const tableConfigs = [
        { name: 'products', hasUserId: true },
        { name: 'imported_products', hasUserId: true },
        { name: 'catalog_products', hasUserId: false },
        { name: 'supplier_products', hasUserId: true },
      ];
      
      for (const config of tableConfigs) {
        try {
          // Use any to bypass strict typing for dynamic table access
          const query = (supabase as any).from(config.name);
          
          // Total count
          const { count: totalCount, error: totalError } = await query
            .select('*', { count: 'exact', head: true });
          
          // User-specific count
          let userCount = 0;
          if (user && config.hasUserId) {
            const { count } = await (supabase as any)
              .from(config.name)
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id);
            userCount = count || 0;
          } else if (!config.hasUserId) {
            userCount = totalCount || 0;
          }
          
          sources.push({
            source: config.name,
            count: totalCount || 0,
            userSpecific: userCount,
            error: totalError?.message
          });
        } catch (e) {
          sources.push({
            source: config.name,
            count: 0,
            userSpecific: 0,
            error: e instanceof Error ? e.message : 'Unknown error'
          });
        }
      }
      
      const totalProducts = sources.reduce((sum, s) => sum + s.userSpecific, 0);
      
      setDebugInfo({
        userId: user?.id || null,
        userEmail: user?.email || null,
        sources,
        totalProducts,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Diagnostic failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showPanel && !debugInfo) {
      runDiagnostic();
    }
  }, [showPanel]);

  if (!showPanel) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowPanel(true)}
        className="fixed bottom-4 right-4 z-50 gap-2"
      >
        <Database className="h-4 w-4" />
        Debug Produits
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-[400px] max-h-[80vh] overflow-auto shadow-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4" />
            Diagnostic Produits
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={runDiagnostic}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowPanel(false)}
            >
              ✕
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {debugInfo && (
          <>
            {/* User Info */}
            <div className="p-2 bg-muted rounded-md space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span className="font-medium">Utilisateur connecté:</span>
              </div>
              <div className="pl-5 text-muted-foreground">
                <div>Email: {debugInfo.userEmail || 'Non connecté'}</div>
                <div className="truncate">ID: {debugInfo.userId || 'N/A'}</div>
              </div>
            </div>

            {/* Sources */}
            <div className="space-y-2">
              <div className="font-medium flex items-center gap-2">
                <Package className="h-3 w-3" />
                Sources de produits:
              </div>
              {debugInfo.sources.map((source) => (
                <div 
                  key={source.source}
                  className={cn(
                    "p-2 rounded-md flex items-center justify-between",
                    source.error ? "bg-destructive/10" : "bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {source.error ? (
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                    ) : source.userSpecific > 0 ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Database className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span>{source.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {source.userSpecific} / {source.count}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="p-3 bg-primary/10 rounded-md">
              <div className="font-bold text-lg">
                Total accessible: {debugInfo.totalProducts} produits
              </div>
              <div className="text-muted-foreground">
                Dernière mise à jour: {debugInfo.timestamp.toLocaleTimeString()}
              </div>
            </div>

            {/* Help */}
            {debugInfo.totalProducts === 0 && (
              <div className="p-2 bg-yellow-500/10 rounded-md text-yellow-700">
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                Aucun produit trouvé pour votre compte. Vérifiez que vous êtes connecté 
                avec le bon compte ou importez des produits.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
