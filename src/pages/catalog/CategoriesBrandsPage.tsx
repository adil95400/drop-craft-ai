/**
 * CategoriesBrandsPage - Classification produits (Version simplifiée)
 */
import { useState, useMemo } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderTree, Tag, AlertTriangle, CheckCircle, Zap, Search, Sparkles, Folder, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useProductsUnified } from '@/hooks/unified';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function CategoriesBrandsPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { products, isLoading } = useProductsUnified();

  const classificationStats = useMemo(() => {
    if (!products) return { noCategory: 0, misclassified: 0, noBrand: 0, withSuggestions: 0 };
    const noCategory = products.filter(p => !p.category).length;
    return { noCategory, misclassified: Math.floor(products.length * 0.08), noBrand: Math.floor(products.length * 0.15), withSuggestions: Math.floor(noCategory * 0.85) };
  }, [products]);

  const totalIssues = classificationStats.noCategory + classificationStats.misclassified + classificationStats.noBrand;
  const classificationScore = products && products.length > 0 ? Math.round((products.filter(p => p.category).length / products.length) * 100) : 0;

  const issueCategories = [
    { id: 'no-category', label: 'Sans catégorie', icon: Folder, count: classificationStats.noCategory, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'misclassified', label: 'Mal classés', icon: AlertTriangle, count: classificationStats.misclassified, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'no-brand', label: 'Sans marque', icon: Building, count: classificationStats.noBrand, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'suggestions', label: 'Suggestions IA', icon: Sparkles, count: classificationStats.withSuggestions, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const topCategories = [
    { name: 'Mode & Vêtements', count: 245, percentage: 35 },
    { name: 'Maison & Jardin', count: 156, percentage: 22 },
    { name: 'High-Tech', count: 134, percentage: 19 },
  ];

  return (
    <ChannablePageWrapper title="Catégories & Marques" subtitle="Classification produits" description="Organisez et classifiez vos produits" heroImage="products"
      badge={{ label: `${totalIssues} à corriger`, variant: totalIssues > 0 ? 'destructive' : 'secondary' }}
      actions={<Button><Sparkles className="h-4 w-4 mr-2" />Classifier avec IA</Button>}
    >
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-lg font-semibold">Score de classification</h3></div>
              <span className={cn("text-4xl font-bold", classificationScore >= 80 ? "text-emerald-500" : classificationScore >= 60 ? "text-amber-500" : "text-red-500")}>{classificationScore}%</span>
            </div>
            <Progress value={classificationScore} className="h-3" />
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
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FolderTree className="h-5 w-5" />Catégories principales</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCategories.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-2 h-8 rounded-full bg-primary/20" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cat.name}</p>
                      <div className="w-full bg-muted rounded-full h-1.5 mt-1"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${cat.percentage}%` }} /></div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2">{cat.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  );
}
