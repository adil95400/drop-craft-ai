import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Wand2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { edgeFunctionUrl } from '@/lib/supabase-env';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EnrichmentButtonProps {
  productId: string;
  productIds?: string[];
  currentStatus?: string;
  onEnrichmentComplete?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function EnrichmentButton({
  productId,
  productIds,
  currentStatus,
  onEnrichmentComplete,
  variant = 'outline',
  size = 'default',
  showLabel = true,
}: EnrichmentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const { toast } = useToast();

  const handleEnrich = async (sources: string[] = ['amazon', 'aliexpress']) => {
    setIsLoading(true);
    setLoadingAction('marketplace');
    
    try {
      const ids = productIds || [productId];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session non trouvée');
      }

      const response = await fetch(
        edgeFunctionUrl('enrich-product'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_ids: ids,
            sources,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'enrichissement');
      }

      const result = await response.json();
      
      toast({
        title: 'Enrichissement réussi',
        description: `${ids.length} produit(s) enrichi(s) depuis ${sources.join(', ')}`,
      });

      onEnrichmentComplete?.();
    } catch (error: any) {
      console.error('Enrichment error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'enrichissement',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleAIEnrich = async () => {
    setIsLoading(true);
    setLoadingAction('ai');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session non trouvée');
      }

      const response = await fetch(
        edgeFunctionUrl('enrich-product-ai'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ product_id: productId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur IA');
      }

      toast({
        title: 'Optimisation IA terminée',
        description: 'Le contenu a été généré avec succès',
      });

      onEnrichmentComplete?.();
    } catch (error: any) {
      console.error('AI enrichment error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'optimisation IA',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleFullEnrich = async () => {
    await handleEnrich(['amazon', 'aliexpress', 'ebay']);
    await handleAIEnrich();
  };

  if (productIds && productIds.length > 1) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleEnrich()}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {showLabel && (
          <span className="ml-2">
            Enrichir {productIds.length} produits
          </span>
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {showLabel && <span className="ml-2">Enrichir</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleFullEnrich} disabled={isLoading}>
          <Wand2 className="mr-2 h-4 w-4" />
          <span>Enrichissement complet (IA + Marketplaces)</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleEnrich(['amazon'])}
          disabled={isLoading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          <span>Depuis Amazon</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleEnrich(['aliexpress'])}
          disabled={isLoading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          <span>Depuis AliExpress</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleEnrich(['ebay'])}
          disabled={isLoading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          <span>Depuis eBay</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleEnrich(['cdiscount'])}
          disabled={isLoading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          <span>Depuis Cdiscount</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleAIEnrich} disabled={isLoading}>
          <Sparkles className="mr-2 h-4 w-4" />
          <span>Optimisation IA uniquement</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
