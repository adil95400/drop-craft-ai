/**
 * EnrichmentConfigStatus - Affiche le statut des APIs d'enrichissement configurées
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface APIStatus {
  source: string;
  name: string;
  configured: boolean;
  description: string;
  docsUrl: string;
  secretName: string;
}

export function EnrichmentConfigStatus() {
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const checkApiStatus = async () => {
    setIsRefreshing(true);
    try {
      // Test API availability via edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        (await import('@/lib/supabase-env')).edgeFunctionUrl('enrich-product'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_ids: [], // Empty to just check config
            sources: ['amazon', 'aliexpress', 'ebay'],
          }),
        }
      );

      const result = await response.json();

      // Update statuses based on response
      const configuredSources = result.configured_sources || [];
      
      setApiStatuses([
        {
          source: 'amazon',
          name: 'Amazon (RapidAPI)',
          configured: configuredSources.includes('amazon'),
          description: 'Enrichissement depuis le catalogue Amazon via RapidAPI Product Data API',
          docsUrl: 'https://rapidapi.com/letscrape-6bRBa3QguO5/api/amazon-product-data6',
          secretName: 'RAPIDAPI_KEY',
        },
        {
          source: 'aliexpress',
          name: 'AliExpress Affiliate',
          configured: configuredSources.includes('aliexpress'),
          description: 'Enrichissement depuis AliExpress via l\'API Affiliate officielle',
          docsUrl: 'https://portals.aliexpress.com/',
          secretName: 'ALIEXPRESS_API_KEY, ALIEXPRESS_APP_SECRET',
        },
        {
          source: 'ebay',
          name: 'eBay Browse API',
          configured: configuredSources.includes('ebay'),
          description: 'Enrichissement depuis eBay via l\'API Browse officielle',
          docsUrl: 'https://developer.ebay.com/api-docs/buy/browse/overview.html',
          secretName: 'EBAY_CLIENT_ID, EBAY_CLIENT_SECRET',
        },
      ]);
    } catch (error) {
      console.error('Error checking API status:', error);
      // Set all as unconfigured if error
      setApiStatuses([
        {
          source: 'amazon',
          name: 'Amazon (RapidAPI)',
          configured: false,
          description: 'Enrichissement depuis le catalogue Amazon',
          docsUrl: 'https://rapidapi.com/',
          secretName: 'RAPIDAPI_KEY',
        },
        {
          source: 'aliexpress',
          name: 'AliExpress',
          configured: false,
          description: 'Enrichissement depuis AliExpress',
          docsUrl: 'https://portals.aliexpress.com/',
          secretName: 'ALIEXPRESS_API_KEY',
        },
        {
          source: 'ebay',
          name: 'eBay',
          configured: false,
          description: 'Enrichissement depuis eBay',
          docsUrl: 'https://developer.ebay.com/',
          secretName: 'EBAY_CLIENT_ID',
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkApiStatus();
  }, []);

  const configuredCount = apiStatuses.filter(a => a.configured).length;
  const totalCount = apiStatuses.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              Configuration APIs d'Enrichissement
              <Badge variant={configuredCount > 0 ? 'default' : 'secondary'}>
                {configuredCount}/{totalCount} actives
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              APIs configurées pour enrichir vos produits depuis les marketplaces
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkApiStatus}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {apiStatuses.map((api) => (
              <div
                key={api.source}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {api.configured ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{api.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {api.configured ? 'Configuré et prêt' : `Secret requis: ${api.secretName}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={api.configured ? 'default' : 'outline'}>
                    {api.configured ? 'Actif' : 'Non configuré'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(api.docsUrl, '_blank')}
                    title="Documentation"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {configuredCount === 0 && (
              <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Aucune API d'enrichissement configurée
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Configurez au moins une clé API dans les secrets Supabase pour activer l'enrichissement automatique des produits.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {configuredCount > 0 && configuredCount < totalCount && (
              <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 Ajoutez plus de sources d'enrichissement pour améliorer la couverture et la qualité des données.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
