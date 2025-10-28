import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProductResearch } from '@/hooks/useProductResearch';
import { Loader2, Flame, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ViralProductFinder() {
  const [socialUrl, setSocialUrl] = useState('');
  const { analyzeViralProduct, isAnalyzing, viralProducts } = useProductResearch();

  const handleAnalyze = () => {
    if (socialUrl.trim()) {
      analyzeViralProduct({ url: socialUrl });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Détecteur de Produits Viraux
          </CardTitle>
          <CardDescription>
            Analysez les produits tendance sur TikTok, Instagram et Facebook
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="social-url">URL du Post ou Produit</Label>
            <Input
              id="social-url"
              placeholder="https://www.tiktok.com/@user/video/..."
              value={socialUrl}
              onChange={(e) => setSocialUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <p className="text-xs text-muted-foreground">
              Supporte: TikTok, Instagram, Facebook, AliExpress, Amazon
            </p>
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={!socialUrl.trim() || isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Flame className="w-4 h-4 mr-2" />
                Analyser le Produit
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {viralProducts && viralProducts.length > 0 && (
        <div className="grid gap-4">
          {viralProducts.map((product, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{product.product_name}</CardTitle>
                    <CardDescription>{product.source_platform}</CardDescription>
                  </div>
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500">
                    🔥 Viral Score: {product.viral_score}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Vues</p>
                    <p className="text-lg font-bold">{product.views?.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Engagement</p>
                    <p className="text-lg font-bold">{product.engagement_rate}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Prix estimé</p>
                    <p className="text-lg font-bold">${product.estimated_price}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Marge</p>
                    <p className="text-lg font-bold text-green-600">{product.profit_margin}%</p>
                  </div>
                </div>

                {product.description && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Description:</p>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </div>
                )}

                {product.hashtags && product.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.hashtags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {product.source_url && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={product.source_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Voir la Source
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
