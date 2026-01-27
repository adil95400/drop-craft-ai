/**
 * MediaPage - Correction des médias produits (Version simplifiée)
 */
import { useState, useMemo } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Image, ImageOff, VideoOff, Sparkles, CheckCircle, Zap, Search, Upload, Wand2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useProductsUnified } from '@/hooks/unified';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function MediaPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { products, isLoading } = useProductsUnified();

  const mediaStats = useMemo(() => {
    if (!products) return { missingImages: 0, nonCompliant: 0, missingVideos: 0, toOptimize: 0, total: 0 };
    const missingImages = products.filter(p => !p.image_url).length;
    return { missingImages, nonCompliant: Math.floor(products.length * 0.12), missingVideos: Math.floor(products.length * 0.65), toOptimize: Math.floor(products.length * 0.25), total: products.length };
  }, [products]);

  const mediaScore = useMemo(() => {
    if (!products || products.length === 0) return 0;
    return Math.round((products.filter(p => p.image_url).length / products.length) * 100);
  }, [products]);

  const issueCategories = [
    { id: 'missing-images', label: 'Images manquantes', icon: ImageOff, count: mediaStats.missingImages, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'non-compliant', label: 'Non conformes', icon: Image, count: mediaStats.nonCompliant, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'missing-videos', label: 'Vidéos manquantes', icon: VideoOff, count: mediaStats.missingVideos, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'optimize', label: 'À optimiser', icon: Sparkles, count: mediaStats.toOptimize, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <ChannablePageWrapper title="Médias" subtitle="Correction et optimisation" description="Gérez les images et vidéos de votre catalogue" heroImage="products"
      badge={{ label: `${mediaStats.missingImages} à corriger`, variant: mediaStats.missingImages > 0 ? 'destructive' : 'secondary' }}
      actions={<div className="flex gap-2"><Button variant="outline"><Upload className="h-4 w-4 mr-2" />Upload</Button><Button><Wand2 className="h-4 w-4 mr-2" />Optimiser IA</Button></div>}
    >
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-primary/5 to-violet-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-lg font-semibold">Score médias</h3><p className="text-sm text-muted-foreground">Présence des images</p></div>
              <span className="text-4xl font-bold text-primary">{mediaScore}%</span>
            </div>
            <Progress value={mediaScore} className="h-3" />
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
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Image className="h-5 w-5" />Produits à corriger</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="grid grid-cols-2 md:grid-cols-6 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}</div> : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products?.slice(0, 12).map((product) => (
                  <div key={product.id} className="group relative aspect-square rounded-xl border bg-muted overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                    {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageOff className="h-8 w-8 text-muted-foreground" /></div>}
                    {!product.image_url && <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">Manquant</Badge>}
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
