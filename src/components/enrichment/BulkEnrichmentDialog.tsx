import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Globe,
  Wand2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BulkEnrichmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productIds: string[];
  onComplete?: () => void;
}

const marketplaceSources = [
  { id: 'amazon', name: 'Amazon', description: 'Données PA-API/Rainforest' },
  { id: 'aliexpress', name: 'AliExpress', description: 'Affiliate API' },
  { id: 'ebay', name: 'eBay', description: 'Browse API' },
  { id: 'cdiscount', name: 'Cdiscount', description: 'Marketplace API' },
];

export function BulkEnrichmentDialog({
  open,
  onOpenChange,
  productIds,
  onComplete,
}: BulkEnrichmentDialogProps) {
  const [selectedSources, setSelectedSources] = useState<string[]>(['amazon', 'aliexpress']);
  const [includeAI, setIncludeAI] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ id: string; status: 'success' | 'error'; message?: string }[]>([]);
  const { toast } = useToast();

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleEnrich = async () => {
    if (selectedSources.length === 0) {
      toast({
        title: 'Sélection requise',
        description: 'Sélectionnez au moins une marketplace',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session non trouvée');
      }

      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < productIds.length; i += batchSize) {
        batches.push(productIds.slice(i, i + batchSize));
      }

      let processedCount = 0;
      const allResults: typeof results = [];

      for (const batch of batches) {
        // Marketplace enrichment
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-product`,
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
          throw new Error('Erreur lors de l\'enrichissement marketplace');
        }

        const data = await response.json();
        
        // AI enrichment if enabled
        if (includeAI) {
          for (const productId of batch) {
            try {
              await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-product-ai`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ product_id: productId }),
                }
              );
              allResults.push({ id: productId, status: 'success' });
            } catch (error) {
              allResults.push({ id: productId, status: 'error', message: 'Erreur IA' });
            }
          }
        } else {
          data.results?.forEach((r: any) => {
            allResults.push({
              id: r.product_id,
              status: r.status === 'success' ? 'success' : 'error',
              message: r.message,
            });
          });
        }

        processedCount += batch.length;
        setProgress((processedCount / productIds.length) * 100);
        setResults([...allResults]);
      }

      toast({
        title: 'Enrichissement terminé',
        description: `${allResults.filter(r => r.status === 'success').length}/${productIds.length} produits enrichis`,
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
      setIsProcessing(false);
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Enrichissement en masse
          </DialogTitle>
          <DialogDescription>
            Enrichir automatiquement {productIds.length} produits depuis les marketplaces
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sources Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Sources de données</Label>
            <div className="grid gap-3">
              {marketplaceSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer"
                  onClick={() => toggleSource(source.id)}
                >
                  <Checkbox
                    checked={selectedSources.includes(source.id)}
                    onCheckedChange={() => toggleSource(source.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{source.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{source.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Option */}
          <div
            className="flex items-center space-x-3 p-3 rounded-lg border bg-primary/5 border-primary/20 cursor-pointer"
            onClick={() => setIncludeAI(!includeAI)}
          >
            <Checkbox
              checked={includeAI}
              onCheckedChange={(checked) => setIncludeAI(!!checked)}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                <span className="font-medium">Optimisation IA</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Générer des titres, descriptions et tags SEO optimisés
              </p>
            </div>
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progression</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {successCount} réussis
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <XCircle className="h-3 w-3 text-destructive" />
                    {errorCount} erreurs
                  </Badge>
                )}
              </div>
              
              {errorCount > 0 && (
                <ScrollArea className="h-24 rounded-md border p-2">
                  {results
                    .filter(r => r.status === 'error')
                    .map((r, i) => (
                      <p key={i} className="text-xs text-destructive">
                        {r.id.slice(0, 8)}... : {r.message || 'Erreur'}
                      </p>
                    ))}
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isProcessing ? 'Fermer' : 'Annuler'}
          </Button>
          <Button 
            onClick={handleEnrich} 
            disabled={isProcessing || selectedSources.length === 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enrichissement...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Lancer l'enrichissement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
