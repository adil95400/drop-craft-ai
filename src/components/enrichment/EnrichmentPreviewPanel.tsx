import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  Star, 
  Globe, 
  ImageIcon,
  Tag,
  FileText,
  Loader2,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EnrichmentStatusBadge } from './EnrichmentStatusBadge';

interface EnrichmentData {
  id: string;
  source: string;
  source_url?: string;
  matched_via: string;
  raw_title?: string;
  raw_description?: string;
  raw_images?: string[];
  raw_price?: number;
  raw_currency?: string;
  raw_rating?: number;
  raw_reviews_count?: number;
  raw_attributes?: Record<string, any>;
  ai_output?: {
    optimized_title?: string;
    optimized_description?: string;
    bullets?: string[];
    seo_tags?: string[];
    meta_title?: string;
    meta_description?: string;
    attributes_normalized?: Record<string, any>;
  };
  enrichment_status: string;
  last_fetch_at?: string;
}

interface EnrichmentPreviewPanelProps {
  productId: string;
  currentProduct: {
    name?: string;
    description?: string;
    price?: number;
    image_url?: string;
  };
  onApply?: (enrichmentId: string, fields: string[]) => void;
}

export function EnrichmentPreviewPanel({ 
  productId, 
  currentProduct,
  onApply 
}: EnrichmentPreviewPanelProps) {
  const [enrichments, setEnrichments] = useState<EnrichmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEnrichments();
  }, [productId]);

  const fetchEnrichments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_enrichment')
        .select('*')
        .eq('product_id', productId)
        .order('last_fetch_at', { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []) as unknown as EnrichmentData[];
      setEnrichments(typedData);
      
      if (typedData.length > 0) {
        setSelectedSource(typedData[0].source);
      }
    } catch (error) {
      console.error('Error fetching enrichments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedEnrichment = enrichments.find(e => e.source === selectedSource);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApplyAll = async () => {
    if (!selectedEnrichment) return;
    
    setIsApplying(true);
    try {
      const aiOutput = selectedEnrichment.ai_output;
      
      // Update product with enriched data
      const updateData: Record<string, any> = {};
      
      if (aiOutput?.optimized_title) {
        updateData.name = aiOutput.optimized_title;
      }
      if (aiOutput?.optimized_description) {
        updateData.description = aiOutput.optimized_description;
      }
      if (aiOutput?.meta_title) {
        updateData.seo_title = aiOutput.meta_title;
      }
      if (aiOutput?.meta_description) {
        updateData.seo_description = aiOutput.meta_description;
      }
      if (aiOutput?.seo_tags) {
        updateData.tags = aiOutput.seo_tags;
      }

      if (Object.keys(updateData).length > 0) {
        updateData.enrichment_status = 'success';
        updateData.last_enriched_at = new Date().toISOString();

        const { error } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', productId);

        if (error) throw error;

        // Mark enrichment as applied
        await supabase
          .from('product_enrichment')
          .update({ 
            enrichment_status: 'applied',
            applied_at: new Date().toISOString()
          })
          .eq('id', selectedEnrichment.id);

        toast({
          title: 'Améliorations appliquées',
          description: 'Le produit a été mis à jour avec les données enrichies',
        });

        onApply?.(selectedEnrichment.id, Object.keys(updateData));
      }
    } catch (error: any) {
      console.error('Error applying enrichment:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'application',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (enrichments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Aucun enrichissement disponible</h3>
          <p className="text-muted-foreground mt-2">
            Cliquez sur "Enrichir" pour récupérer des données depuis les marketplaces
          </p>
        </CardContent>
      </Card>
    );
  }

  const aiOutput = selectedEnrichment?.ai_output;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Enrichissement proposé
            </CardTitle>
            <CardDescription>
              Données récupérées et optimisées par IA
            </CardDescription>
          </div>
          <EnrichmentStatusBadge status={selectedEnrichment?.enrichment_status as any || 'none'} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Source Tabs */}
        <Tabs value={selectedSource} onValueChange={setSelectedSource}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${enrichments.length}, 1fr)` }}>
            {enrichments.map((e) => (
              <TabsTrigger key={e.source} value={e.source} className="capitalize">
                <Globe className="h-4 w-4 mr-2" />
                {e.source}
              </TabsTrigger>
            ))}
          </TabsList>

          {enrichments.map((enrichment) => (
            <TabsContent key={enrichment.source} value={enrichment.source} className="space-y-6">
              {/* Marketplace Data */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Données Marketplace
                  </h4>
                  
                  {enrichment.raw_title && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Titre</p>
                      <p className="text-sm">{enrichment.raw_title}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    {enrichment.raw_price && (
                      <div className="p-3 bg-muted/50 rounded-lg flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Prix marché</p>
                        <p className="text-lg font-bold">{enrichment.raw_price} {enrichment.raw_currency}</p>
                      </div>
                    )}
                    
                    {enrichment.raw_rating && (
                      <div className="p-3 bg-muted/50 rounded-lg flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Note</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold">{enrichment.raw_rating}</span>
                          <span className="text-muted-foreground text-sm">
                            ({enrichment.raw_reviews_count} avis)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {enrichment.source_url && (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={enrichment.source_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Voir sur {enrichment.source}
                      </a>
                    </Button>
                  )}
                </div>

                {/* AI Optimized Content */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Optimisé par IA
                  </h4>

                  {aiOutput?.optimized_title && (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground">Titre optimisé</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => handleCopy(aiOutput.optimized_title!, 'title')}
                        >
                          {copiedField === 'title' ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm font-medium">{aiOutput.optimized_title}</p>
                    </div>
                  )}

                  {aiOutput?.meta_title && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Meta Title SEO</p>
                      <p className="text-sm">{aiOutput.meta_title}</p>
                    </div>
                  )}

                  {aiOutput?.meta_description && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Meta Description</p>
                      <p className="text-sm">{aiOutput.meta_description}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Description */}
              {aiOutput?.optimized_description && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Description optimisée
                    </h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleCopy(aiOutput.optimized_description!, 'description')}
                    >
                      {copiedField === 'description' ? (
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      Copier
                    </Button>
                  </div>
                  <ScrollArea className="h-32 w-full rounded-lg border p-3">
                    <p className="text-sm">{aiOutput.optimized_description}</p>
                  </ScrollArea>
                </div>
              )}

              {/* Bullets */}
              {aiOutput?.bullets && aiOutput.bullets.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Points forts</h4>
                  <ul className="space-y-2">
                    {aiOutput.bullets.map((bullet, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SEO Tags */}
              {aiOutput?.seo_tags && aiOutput.seo_tags.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags SEO
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {aiOutput.seo_tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Apply Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={handleApplyAll}
                  disabled={isApplying || enrichment.enrichment_status === 'applied'}
                  className="gap-2"
                >
                  {isApplying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : enrichment.enrichment_status === 'applied' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {enrichment.enrichment_status === 'applied' 
                    ? 'Déjà appliqué' 
                    : 'Appliquer ces améliorations'}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
