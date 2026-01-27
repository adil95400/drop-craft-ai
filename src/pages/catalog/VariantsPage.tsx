/**
 * VariantsPage - Gestion des anomalies variantes (Version simplifiée)
 */
import { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Package, DollarSign, RefreshCw, CheckCircle, Zap, Search, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function VariantsPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats simulées pour les variantes
  const variantIssues = { noStock: 23, noPrice: 12, notSynced: 18, inconsistent: 7 };
  const totalIssues = variantIssues.noStock + variantIssues.noPrice + variantIssues.notSynced + variantIssues.inconsistent;

  const issueCategories = [
    { id: 'no-stock', label: 'Sans stock', icon: Package, count: variantIssues.noStock, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'no-price', label: 'Sans prix', icon: DollarSign, count: variantIssues.noPrice, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'not-synced', label: 'Non synchronisées', icon: RefreshCw, count: variantIssues.notSynced, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'inconsistent', label: 'Incohérentes', icon: AlertTriangle, count: variantIssues.inconsistent, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <ChannablePageWrapper
      title="Variantes"
      subtitle="Gestion des anomalies"
      description="Identifiez et corrigez les problèmes de variantes produits"
      heroImage="products"
      badge={{ label: `${totalIssues} problèmes`, variant: 'destructive' }}
      actions={<Button><Zap className="h-4 w-4 mr-2" />Corriger en masse</Button>}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {issueCategories.map((cat) => (
            <Card key={cat.id} className={cn("cursor-pointer transition-all hover:shadow-md", activeTab === cat.id && "ring-2 ring-primary")} onClick={() => setActiveTab(cat.id)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl", cat.bg)}><cat.icon className={cn("h-5 w-5", cat.color)} /></div>
                  <div>
                    <p className={cn("text-2xl font-bold", cat.color)}>{cat.count}</p>
                    <p className="text-xs text-muted-foreground">{cat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher une variante..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Layers className="h-5 w-5" />Variantes à corriger</CardTitle></CardHeader>
          <CardContent>
            {totalIssues === 0 ? (
              <div className="text-center py-12"><CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" /><h3 className="text-lg font-semibold">Toutes les variantes sont conformes</h3></div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: Math.min(5, totalIssues) }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground" /></div>
                      <div>
                        <p className="font-medium">Produit #{1000 + i} - Variante {['S', 'M', 'L', 'XL', 'XXL'][i % 5]}</p>
                        <p className="text-sm text-muted-foreground">SKU: VAR-{1000 + i}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive">⚠️ Action</Badge>
                      <Button size="sm" variant="outline">Corriger</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  );
}
