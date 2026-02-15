/**
 * BulkEnrichmentPanel - Panneau d'enrichissement en masse des produits
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Sparkles, Play, Pause, CheckCircle, AlertCircle, 
  Loader2, Wand2, RefreshCw, Package
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BulkEnrichmentPanelProps {
  productIds: string[];
  onComplete?: () => void;
}

interface EnrichmentResult {
  product_id: string;
  status: 'success' | 'no_results' | 'error';
  sources_enriched: string[];
}

export function BulkEnrichmentPanel({ productIds, onComplete }: BulkEnrichmentPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<EnrichmentResult[]>([]);
  const [selectedSources, setSelectedSources] = useState(['amazon', 'aliexpress', 'ebay']);
  const [includeAI, setIncludeAI] = useState(true);
  const { toast } = useToast();

  const sources = [
    { id: 'amazon', label: 'Amazon', color: 'bg-orange-500' },
    { id: 'aliexpress', label: 'AliExpress', color: 'bg-red-500' },
    { id: 'ebay', label: 'eBay', color: 'bg-blue-500' },
  ];

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const runEnrichment = async () => {
    if (productIds.length === 0 || selectedSources.length === 0) {
      toast({
        title: 'Configuration requise',
        description: 'Sélectionnez au moins un produit et une source',
        variant: 'destructive',
      });
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setResults([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session non trouvée');

      // Process in batches of 5
      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < productIds.length; i += batchSize) {
        batches.push(productIds.slice(i, i + batchSize));
      }

      const allResults: EnrichmentResult[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        // Marketplace enrichment
        const response = await fetch(
          (await import('@/lib/supabase-env')).edgeFunctionUrl('enrich-product'),
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_ids: batch,
              sources: selectedSources,
            }),
          }
        );

        if (!response.ok) {
          console.error('Enrichment batch failed:', await response.text());
        } else {
          const result = await response.json();
          if (result.results) {
            allResults.push(...result.results);
          }
        }

        // AI enrichment if enabled
        if (includeAI) {
          for (const productId of batch) {
            try {
              await fetch(
                (await import('@/lib/supabase-env')).edgeFunctionUrl('enrich-product-ai'),
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ product_id: productId }),
                }
              );
            } catch (error) {
              console.error('AI enrichment failed for:', productId);
            }
          }
        }

        // Update progress
        const progressPercent = ((i + 1) / batches.length) * 100;
        setProgress(progressPercent);
        setResults(allResults);
      }

      const successCount = allResults.filter(r => r.status === 'success').length;
      
      toast({
        title: 'Enrichissement terminé',
        description: `${successCount}/${productIds.length} produits enrichis avec succès`,
      });

      onComplete?.();
    } catch (error: any) {
      console.error('Bulk enrichment error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'enrichissement',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const noResultsCount = results.filter(r => r.status === 'no_results').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Enrichissement en Masse
        </CardTitle>
        <CardDescription>
          Enrichissez {productIds.length} produit(s) depuis les marketplaces
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Source Selection */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Sources de données</Label>
          <div className="flex flex-wrap gap-2">
            {sources.map(source => (
              <Button
                key={source.id}
                variant={selectedSources.includes(source.id) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleSource(source.id)}
                disabled={isRunning}
              >
                <div className={`w-2 h-2 rounded-full ${source.color} mr-2`} />
                {source.label}
              </Button>
            ))}
          </div>
        </div>

        {/* AI Option */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-ai"
            checked={includeAI}
            onCheckedChange={(checked) => setIncludeAI(checked as boolean)}
            disabled={isRunning}
          />
          <Label htmlFor="include-ai" className="text-sm cursor-pointer">
            Inclure l'optimisation IA (titres, descriptions, SEO)
          </Label>
        </div>

        {/* Progress */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">{successCount} réussis</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm">{noResultsCount} sans résultat</span>
            </div>
            {errorCount > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">{errorCount} erreurs</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={runEnrichment}
          disabled={isRunning || productIds.length === 0 || selectedSources.length === 0}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enrichissement en cours...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Lancer l'enrichissement ({productIds.length} produits)
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          L'enrichissement utilise les APIs réelles des marketplaces pour récupérer des données à jour.
        </p>
      </CardContent>
    </Card>
  );
}
