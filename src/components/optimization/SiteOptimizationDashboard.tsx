import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSiteHealth } from '@/hooks/useSiteHealth';
import { useGlobalOptimization } from '@/hooks/useGlobalOptimization';
import { 
  Sparkles, 
  Search, 
  Image, 
  FileText, 
  Languages, 
  ShoppingBag,
  FolderTree,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useState } from 'react';

export function SiteOptimizationDashboard() {
  const { siteHealth, isLoading: healthLoading } = useSiteHealth();
  const { optimizeSite, isOptimizing, progress } = useGlobalOptimization();
  
  const [optimizationOptions, setOptimizationOptions] = useState({
    products: true,
    pages: true,
    blog: true,
    images: true,
    translations: true,
    seo: true,
    categories: true
  });

  const handleOptimizeAll = () => {
    const enabledOptions = Object.entries(optimizationOptions)
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => key);
    
    optimizeSite(enabledOptions);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', icon: CheckCircle2, color: 'text-green-600' };
    if (score >= 60) return { label: 'À améliorer', icon: AlertCircle, color: 'text-yellow-600' };
    return { label: 'À optimiser', icon: AlertCircle, color: 'text-red-600' };
  };

  const healthCategories = [
    {
      key: 'seo',
      title: 'SEO',
      description: 'Référencement naturel',
      icon: Search,
      score: siteHealth.seo,
      color: 'from-blue-500 to-blue-600'
    },
    {
      key: 'images',
      title: 'Images',
      description: 'Optimisation des images',
      icon: Image,
      score: siteHealth.images,
      color: 'from-purple-500 to-purple-600'
    },
    {
      key: 'content',
      title: 'Contenu',
      description: 'Qualité du contenu',
      icon: FileText,
      score: siteHealth.content,
      color: 'from-green-500 to-green-600'
    },
    {
      key: 'translations',
      title: 'Traductions',
      description: 'Multi-langues',
      icon: Languages,
      score: siteHealth.translations,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Global Health Score */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Score Santé du Site</CardTitle>
              <CardDescription>Évaluation globale de votre site web</CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getScoreColor(siteHealth.overall)}`}>
                {siteHealth.overall}/100
              </div>
              <Badge variant="outline" className="mt-1">
                {getScoreStatus(siteHealth.overall).label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={siteHealth.overall} className="h-3" />
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Dernière optimisation: {siteHealth.lastOptimization}</span>
          </div>
        </CardContent>
      </Card>

      {/* Health Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthCategories.map((category) => {
          const status = getScoreStatus(category.score);
          const Icon = category.icon;
          const StatusIcon = status.icon;

          return (
            <Card key={category.key} className="relative overflow-hidden group hover:shadow-lg transition-all">
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color} text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <StatusIcon className={`w-5 h-5 ${status.color}`} />
                </div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
                <CardDescription className="text-xs">{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Score</span>
                    <span className={`text-xl font-bold ${getScoreColor(category.score)}`}>
                      {category.score}/100
                    </span>
                  </div>
                  <Progress value={category.score} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Optimization Controls */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Optimisation Globale
          </CardTitle>
          <CardDescription>
            Sélectionnez les éléments à optimiser et lancez l'optimisation IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <div>
                  <Label htmlFor="opt-products" className="cursor-pointer">Produits</Label>
                  <p className="text-xs text-muted-foreground">480 produits</p>
                </div>
              </div>
              <Switch
                id="opt-products"
                checked={optimizationOptions.products}
                onCheckedChange={(checked) => 
                  setOptimizationOptions(prev => ({ ...prev, products: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <Label htmlFor="opt-pages" className="cursor-pointer">Pages</Label>
                  <p className="text-xs text-muted-foreground">15 pages</p>
                </div>
              </div>
              <Switch
                id="opt-pages"
                checked={optimizationOptions.pages}
                onCheckedChange={(checked) => 
                  setOptimizationOptions(prev => ({ ...prev, pages: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <Label htmlFor="opt-blog" className="cursor-pointer">Blog</Label>
                  <p className="text-xs text-muted-foreground">156 articles</p>
                </div>
              </div>
              <Switch
                id="opt-blog"
                checked={optimizationOptions.blog}
                onCheckedChange={(checked) => 
                  setOptimizationOptions(prev => ({ ...prev, blog: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3">
                <Image className="w-5 h-5 text-primary" />
                <div>
                  <Label htmlFor="opt-images" className="cursor-pointer">Images</Label>
                  <p className="text-xs text-muted-foreground">1247 images</p>
                </div>
              </div>
              <Switch
                id="opt-images"
                checked={optimizationOptions.images}
                onCheckedChange={(checked) => 
                  setOptimizationOptions(prev => ({ ...prev, images: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3">
                <Languages className="w-5 h-5 text-primary" />
                <div>
                  <Label htmlFor="opt-translations" className="cursor-pointer">Traductions</Label>
                  <p className="text-xs text-muted-foreground">3 langues</p>
                </div>
              </div>
              <Switch
                id="opt-translations"
                checked={optimizationOptions.translations}
                onCheckedChange={(checked) => 
                  setOptimizationOptions(prev => ({ ...prev, translations: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-primary" />
                <div>
                  <Label htmlFor="opt-seo" className="cursor-pointer">SEO Global</Label>
                  <p className="text-xs text-muted-foreground">Toutes les pages</p>
                </div>
              </div>
              <Switch
                id="opt-seo"
                checked={optimizationOptions.seo}
                onCheckedChange={(checked) => 
                  setOptimizationOptions(prev => ({ ...prev, seo: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3">
                <FolderTree className="w-5 h-5 text-primary" />
                <div>
                  <Label htmlFor="opt-categories" className="cursor-pointer">Catégories</Label>
                  <p className="text-xs text-muted-foreground">Organisation</p>
                </div>
              </div>
              <Switch
                id="opt-categories"
                checked={optimizationOptions.categories}
                onCheckedChange={(checked) => 
                  setOptimizationOptions(prev => ({ ...prev, categories: checked }))
                }
              />
            </div>
          </div>

          {/* Progress Bar */}
          {isOptimizing && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Optimisation en cours...</span>
                    <span className="text-muted-foreground">{progress.current}/{progress.total}</span>
                  </div>
                  <Progress value={(progress.current / progress.total) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">{progress.message}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Button */}
          <Button 
            size="lg" 
            className="w-full text-lg h-14 bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:opacity-90 transition-opacity"
            onClick={handleOptimizeAll}
            disabled={isOptimizing || !Object.values(optimizationOptions).some(v => v)}
          >
            {isOptimizing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Optimisation en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Optimiser le Site Complet
              </>
            )}
          </Button>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{siteHealth.optimizationCount}</div>
              <div className="text-xs text-muted-foreground">Optimisations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">+{siteHealth.improvement}%</div>
              <div className="text-xs text-muted-foreground">Amélioration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{siteHealth.nextOptimization}</div>
              <div className="text-xs text-muted-foreground">Prochaine auto</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
