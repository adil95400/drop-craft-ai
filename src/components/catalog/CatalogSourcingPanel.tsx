/**
 * Panneau de sourcing inline — recherche fournisseur depuis le catalogue
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Globe, Search, ExternalLink, Loader2, Package, Star, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CatalogSourcingPanelProps {
  selectedProducts: Array<{ id: string; name: string; price: number; cost_price?: number | null; sku?: string | null }>;
  onClose: () => void;
}

interface SupplierResult {
  title: string;
  url: string;
  price?: number;
  rating?: number;
  platform: string;
  image?: string;
}

export function CatalogSourcingPanel({ selectedProducts, onClose }: CatalogSourcingPanelProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState(selectedProducts[0]?.name || '');
  const [results, setResults] = useState<SupplierResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-search', {
        body: {
          query: `${searchQuery} wholesale supplier dropshipping`,
          options: { limit: 8 }
        }
      });
      if (error) throw error;
      const items = (data?.data || []).map((r: any) => ({
        title: r.title || 'Sans titre',
        url: r.url || '',
        platform: r.url?.includes('aliexpress') ? 'AliExpress' :
                  r.url?.includes('amazon') ? 'Amazon' :
                  r.url?.includes('alibaba') ? 'Alibaba' :
                  r.url?.includes('temu') ? 'Temu' : 'Web',
        price: undefined,
        rating: undefined,
        image: undefined,
      }));
      setResults(items);
      if (items.length === 0) {
        toast({ title: 'Aucun résultat', description: 'Essayez avec d\'autres mots-clés.' });
      }
    } catch {
      toast({ title: 'Erreur de recherche', variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Sourcing fournisseur
        </SheetTitle>
        <SheetDescription>
          Recherchez des fournisseurs pour {selectedProducts.length} produit(s) sélectionné(s)
        </SheetDescription>
      </SheetHeader>

      {/* Selected products summary */}
      <div className="space-y-1.5 max-h-32 overflow-y-auto">
        {selectedProducts.slice(0, 5).map(p => (
          <div key={p.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
            <span className="truncate flex-1">{p.name}</span>
            <span className="text-muted-foreground shrink-0 ml-2">
              {p.price?.toFixed(2)} €
            </span>
          </div>
        ))}
        {selectedProducts.length > 5 && (
          <p className="text-xs text-muted-foreground">+{selectedProducts.length - 5} autres produits</p>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Rechercher un produit ou fournisseur..."
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={isSearching} className="gap-2 shrink-0">
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Chercher
        </Button>
      </div>

      {/* Results */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {results.map((r, i) => (
          <Card key={i} className="hover:border-primary/30 transition-colors">
            <CardContent className="p-3 flex items-start gap-3">
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">{r.platform}</Badge>
                  {r.price && <span className="text-xs text-muted-foreground">{r.price} €</span>}
                  {r.rating && (
                    <span className="text-xs flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {r.rating}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost" size="sm"
                onClick={() => window.open(r.url, '_blank')}
                className="shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick links */}
      <div className="border-t pt-4 space-y-2">
        <Button variant="outline" className="w-full gap-2" onClick={() => { onClose(); navigate('/sourcing'); }}>
          <TrendingUp className="h-4 w-4" />
          Ouvrir le Hub de Sourcing complet
        </Button>
        <Button variant="outline" className="w-full gap-2" onClick={() => { onClose(); navigate('/import/search-suppliers'); }}>
          <Search className="h-4 w-4" />
          Recherche avancée fournisseurs
        </Button>
      </div>
    </div>
  );
}
