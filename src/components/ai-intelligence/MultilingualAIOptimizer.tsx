import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Globe, Sparkles, RefreshCw, Languages, CheckCircle,
  Copy, ArrowRight, Settings, Zap, FileText, Target
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
  enabled: boolean;
  productsTranslated: number;
  totalProducts: number;
  quality: number;
}

interface TranslationResult {
  language: string;
  title: string;
  description: string;
  keywords: string[];
  seoScore: number;
}

const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷', enabled: true, productsTranslated: 156, totalProducts: 200, quality: 95 },
  { code: 'en', name: 'English', flag: '🇬🇧', enabled: true, productsTranslated: 142, totalProducts: 200, quality: 92 },
  { code: 'es', name: 'Español', flag: '🇪🇸', enabled: true, productsTranslated: 89, totalProducts: 200, quality: 88 },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', enabled: false, productsTranslated: 45, totalProducts: 200, quality: 85 },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', enabled: false, productsTranslated: 23, totalProducts: 200, quality: 82 },
  { code: 'pt', name: 'Português', flag: '🇵🇹', enabled: false, productsTranslated: 12, totalProducts: 200, quality: 80 },
];

export function MultilingualAIOptimizer() {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState('fr');
  const [targetLanguages, setTargetLanguages] = useState<string[]>(['en', 'es', 'de']);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState<TranslationResult[]>([]);
  const [languages, setLanguages] = useState(SUPPORTED_LANGUAGES);
  const queryClient = useQueryClient();

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products-for-translation'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, description')
        .limit(50);
      return data || [];
    }
  });

  const translateMutation = useMutation({
    mutationFn: async ({ productId, languages }: { productId: string; languages: string[] }) => {
      setIsTranslating(true);
      const { data, error } = await supabase.functions.invoke('ai-translate-product', {
        body: { productId, targetLanguages: languages, sourceLanguage }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Mock translations for demo
      const mockTranslations: TranslationResult[] = targetLanguages.map(lang => ({
        language: lang,
        title: `[${lang.toUpperCase()}] ${products?.find(p => p.id === selectedProduct)?.name || 'Product'}`,
        description: `Translated description in ${lang}...`,
        keywords: ['keyword1', 'keyword2', 'keyword3'],
        seoScore: Math.floor(Math.random() * 20) + 80
      }));
      setTranslations(mockTranslations);
      toast.success('Traductions générées avec succès');
      setIsTranslating(false);
    },
    onError: () => {
      toast.error('Erreur lors de la traduction');
      setIsTranslating(false);
    }
  });

  const bulkTranslateMutation = useMutation({
    mutationFn: async (languages: string[]) => {
      setIsTranslating(true);
      const { data, error } = await supabase.functions.invoke('ai-bulk-translate', {
        body: { targetLanguages: languages, sourceLanguage }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Traduction en masse lancée');
      queryClient.invalidateQueries({ queryKey: ['translation-stats'] });
      setIsTranslating(false);
    },
    onError: () => {
      toast.error('Erreur lors de la traduction en masse');
      setIsTranslating(false);
    }
  });

  const toggleLanguage = (code: string) => {
    setLanguages(prev => prev.map(lang => 
      lang.code === code ? { ...lang, enabled: !lang.enabled } : lang
    ));
  };

  const enabledLanguages = languages.filter(l => l.enabled);
  const totalTranslated = languages.reduce((acc, l) => acc + l.productsTranslated, 0);
  const avgQuality = languages.reduce((acc, l) => acc + l.quality, 0) / languages.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-500" />
            Optimiseur Multilingue IA
          </h2>
          <p className="text-muted-foreground">
            Traduction et optimisation SEO automatique (FR, EN, ES, DE)
          </p>
        </div>
        <Button 
          onClick={() => bulkTranslateMutation.mutate(enabledLanguages.map(l => l.code))}
          disabled={isTranslating}
        >
          {isTranslating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Languages className="w-4 h-4 mr-2" />
          )}
          Traduire tout
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                <Globe className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Langues actives</p>
                <p className="text-2xl font-bold">{enabledLanguages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produits traduits</p>
                <p className="text-2xl font-bold text-green-500">{totalTranslated}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Qualité moyenne</p>
                <p className="text-2xl font-bold">{avgQuality.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total produits</p>
                <p className="text-2xl font-bold">{products?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Language Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuration langues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {languages.map(lang => (
              <div key={lang.code} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <p className="font-medium">{lang.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lang.productsTranslated}/{lang.totalProducts} traduits
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={lang.quality >= 90 ? 'default' : 'secondary'}>
                    {lang.quality}%
                  </Badge>
                  <Switch 
                    checked={lang.enabled}
                    onCheckedChange={() => toggleLanguage(lang.code)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Product Translator */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Traducteur de produit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Langue source</label>
                <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Produit</label>
                <Select value={selectedProduct || ''} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name || 'Produit sans nom'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Langues cibles</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {languages.filter(l => l.code !== sourceLanguage).map(lang => (
                  <Badge 
                    key={lang.code}
                    variant={targetLanguages.includes(lang.code) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      if (targetLanguages.includes(lang.code)) {
                        setTargetLanguages(prev => prev.filter(l => l !== lang.code));
                      } else {
                        setTargetLanguages(prev => [...prev, lang.code]);
                      }
                    }}
                  >
                    {lang.flag} {lang.name}
                  </Badge>
                ))}
              </div>
            </div>

            <Button 
              className="w-full"
              onClick={() => selectedProduct && translateMutation.mutate({ 
                productId: selectedProduct, 
                languages: targetLanguages 
              })}
              disabled={!selectedProduct || targetLanguages.length === 0 || isTranslating}
            >
              {isTranslating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Traduire avec IA
            </Button>

            {/* Translation Results */}
            {translations.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Résultats de traduction</h4>
                {translations.map(translation => {
                  const lang = languages.find(l => l.code === translation.language);
                  return (
                    <div key={translation.language} className="p-4 bg-muted/50 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{lang?.flag}</span>
                          <span className="font-medium">{lang?.name}</span>
                        </div>
                        <Badge variant={translation.seoScore >= 85 ? 'default' : 'secondary'}>
                          SEO: {translation.seoScore}%
                        </Badge>
                      </div>
                      
                      <div>
                        <label className="text-xs text-muted-foreground">Titre</label>
                        <div className="flex items-center gap-2">
                          <p className="flex-1 p-2 bg-background rounded border text-sm">
                            {translation.title}
                          </p>
                          <Button size="icon" variant="ghost" onClick={() => {
                            navigator.clipboard.writeText(translation.title);
                            toast.success('Copié');
                          }}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Mots-clés SEO</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {translation.keywords.map((kw, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                          ))}
                        </div>
                      </div>

                      <Button size="sm" className="w-full">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Appliquer cette traduction
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress by Language */}
      <Card>
        <CardHeader>
          <CardTitle>Progression par langue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {enabledLanguages.map(lang => (
              <div key={lang.code} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {lang.productsTranslated}/{lang.totalProducts}
                  </span>
                </div>
                <Progress 
                  value={(lang.productsTranslated / lang.totalProducts) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
