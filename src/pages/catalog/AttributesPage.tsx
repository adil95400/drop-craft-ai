/**
 * AttributesPage - Enrichissement des attributs (Version simplifiée)
 */
import { useState, useMemo } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag, AlertTriangle, CheckCircle, Search, Sparkles, ShoppingBag, FileWarning, Wand2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useProductsUnified } from '@/hooks/unified';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AttributesPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { products, isLoading } = useProductsUnified();

  const attributeStats = useMemo(() => {
    if (!products) return { missing: 0, nonStandard: 0, marketplaceCritical: 0, enrichable: 0 };
    return { missing: Math.floor(products.length * 0.22), nonStandard: Math.floor(products.length * 0.15), marketplaceCritical: Math.floor(products.length * 0.18), enrichable: Math.floor(products.length * 0.35) };
  }, [products]);

  const totalIssues = attributeStats.missing + attributeStats.nonStandard + attributeStats.marketplaceCritical;
  const completenessScore = products && products.length > 0 ? Math.round(100 - (totalIssues / products.length) * 100) : 0;

  const criticalAttributes = [
    { marketplace: 'Google Shopping', attributes: ['GTIN/EAN', 'Marque', 'MPN'], missing: 45 },
    { marketplace: 'Amazon', attributes: ['ASIN', 'Bullet Points', 'Catégorie'], missing: 38 },
    { marketplace: 'Meta/Facebook', attributes: ['Marque', 'État', 'Prix soldé'], missing: 22 },
  ];

  const issueCategories = [
    { id: 'missing', label: 'Manquants', icon: FileWarning, count: attributeStats.missing, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'non-standard', label: 'Non normalisés', icon: AlertTriangle, count: attributeStats.nonStandard, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'marketplace-critical', label: 'Critiques', icon: ShoppingBag, count: attributeStats.marketplaceCritical, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'enrichment', label: 'Enrichissement IA', icon: Sparkles, count: attributeStats.enrichable, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <ChannablePageWrapper title="Attributs" subtitle="Enrichissement catalogue" description="Normalisez et enrichissez les attributs" heroImage="products" badge={{ label: 'PRO', variant: 'default' }}
      actions={<Button><Wand2 className="h-4 w-4 mr-2" />Enrichir avec IA</Button>}
    >
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-violet-500/5 to-purple-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-lg font-semibold">Complétude des attributs</h3></div>
              <span className={cn("text-4xl font-bold", completenessScore >= 80 ? "text-emerald-500" : completenessScore >= 60 ? "text-amber-500" : "text-red-500")}>{completenessScore}%</span>
            </div>
            <Progress value={completenessScore} className="h-3" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {issueCategories.map((cat) => (
            <Card key={cat.id} className={cn("cursor-pointer transition-all hover:shadow-md", activeTab === cat.id && "ring-2 ring-primary")} onClick={() => setActiveTab(cat.id)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl", cat.bg)}><cat.icon className={cn("h-5 w-5", cat.color)} /></div>
                  <div><p className={cn("text-2xl font-bold", cat.color)}>{cat.count}</p><p className="text-xs text-muted-foreground truncate">{cat.label}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShoppingBag className="h-5 w-5" />Attributs critiques marketplace</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Marketplace</TableHead><TableHead>Attributs requis</TableHead><TableHead className="text-right">Incomplets</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {criticalAttributes.map((mp) => (
                  <TableRow key={mp.marketplace}>
                    <TableCell className="font-medium">{mp.marketplace}</TableCell>
                    <TableCell><div className="flex flex-wrap gap-1">{mp.attributes.map((attr) => <Badge key={attr} variant="outline" className="text-xs">{attr}</Badge>)}</div></TableCell>
                    <TableCell className="text-right"><Badge variant={mp.missing > 40 ? 'destructive' : 'secondary'}>{mp.missing}</Badge></TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="outline"><Sparkles className="h-3 w-3 mr-1" />Enrichir</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  );
}
