import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSEOContentGenerator } from '@/hooks/useSEOKeywords';
import {
  Search, Globe, BarChart3, Code2, TrendingUp,
  Languages, Target, Sparkles, ArrowRight, Zap, PenTool,
  Loader2, Copy, Check, FileText
} from 'lucide-react';

const seoModules = [
  {
    title: 'Recherche de mots-clés',
    description: 'Trouvez les mots-clés à fort volume et faible concurrence avec l\'IA',
    icon: Search,
    href: '/marketing/seo/keywords',
    badge: 'IA',
    badgeVariant: 'default' as const,
  },
  {
    title: 'Suivi des positions',
    description: 'Suivez vos classements Google avec estimations IA et historique',
    icon: TrendingUp,
    href: '/marketing/seo/rank-tracker',
    badge: 'Tracking',
  },
  {
    title: 'Contenu SEO Multilingue',
    description: 'Générez des descriptions produit SEO dans 50+ langues',
    icon: Globe,
    href: '/marketing/seo/multilingual',
    badge: 'Nouveau',
    badgeVariant: 'default' as const,
  },
  {
    title: 'Audit SEO Produits',
    description: 'Analysez et optimisez le score SEO de votre catalogue',
    icon: BarChart3,
    href: '/marketing/seo/dashboard',
    badge: 'Dashboard',
  },
  {
    title: 'Schémas structurés',
    description: 'Générez des données structurées JSON-LD pour Google',
    icon: Code2,
    href: '/marketing/seo/schema',
    badge: 'Technique',
  },
  {
    title: 'Contenu & Blog IA',
    description: 'Créez des articles de blog optimisés SEO automatiquement',
    icon: PenTool,
    href: '/marketing/content-generation',
    badge: 'IA',
    badgeVariant: 'default' as const,
  },
];

const stats = [
  { label: 'Langues supportées', value: '50+', icon: Languages },
  { label: 'Outils SEO', value: '6', icon: Zap },
  { label: 'Génération IA', value: 'Gemini', icon: Sparkles },
  { label: 'Audit en masse', value: 'Illimité', icon: Target },
];

function QuickContentGenerator() {
  const { t: tPages } = useTranslation('pages');
  const { generatedContent, isGenerating, generateContent, clearContent } = useSEOContentGenerator();
  const [keyword, setKeyword] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = () => {
    if (keyword.trim()) generateContent(keyword);
  };

  const copyField = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-primary" />
          Générateur rapide de contenu SEO
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Entrez un mot-clé (ex: chaussures running)"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          />
          <Button onClick={handleGenerate} disabled={isGenerating || !keyword.trim()}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Générer
          </Button>
        </div>

        {isGenerating && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {generatedContent && !isGenerating && (
          <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
            {[
              { label: 'Titre SEO', value: generatedContent.title, key: 'title' },
              { label: 'Meta Description', value: generatedContent.metaDescription, key: 'meta' },
              { label: 'H1', value: generatedContent.h1, key: 'h1' },
            ].map(field => (
              <div key={field.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
                  <Button
                    variant="ghost" size="sm" className="h-6 px-2"
                    onClick={() => copyField(field.value, field.key)}
                  >
                    {copied === field.key ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <p className="text-sm">{field.value || '-'}</p>
              </div>
            ))}

            {generatedContent.keywords?.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Mots-clés</span>
                <div className="flex flex-wrap gap-1.5">
                  {generatedContent.keywords.map((kw, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}

            {generatedContent.content && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Contenu</span>
                  <Button
                    variant="ghost" size="sm" className="h-6 px-2"
                    onClick={() => copyField(generatedContent.content, 'content')}
                  >
                    {copied === 'content' ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{generatedContent.content}</p>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={clearContent}>Réinitialiser</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SEOHubPage() {
  const navigate = useNavigate();
  const { t: tPages } = useTranslation('pages');

  return (
    <>
      <Helmet>
        <title>Hub SEO & Contenu | ShopOpti</title>
        <meta name="description" content="Centre de commande SEO : recherche mots-clés IA, rank tracker, contenu multilingue 50+ langues" />
      </Helmet>

      <ChannablePageWrapper
        title={tPages('hubSeoContenu.title')}
        description="Centre de commande pour l'optimisation SEO et la génération de contenu multilingue"
        heroImage="seo"
        badge={{ label: 'SEO Pro', icon: Search }}
      >
        <Tabs defaultValue="modules" className="space-y-6">
          <TabsList>
            <TabsTrigger value="modules" className="gap-1.5">
              <BarChart3 className="h-4 w-4" /> Outils
            </TabsTrigger>
            <TabsTrigger value="generate" className="gap-1.5">
              <Sparkles className="h-4 w-4" /> Générateur rapide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-primary">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Module Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {seoModules.map((module) => (
                <Card
                  key={module.href}
                  className="group hover:shadow-md transition-all cursor-pointer border-border/60 hover:border-primary/30"
                  onClick={() => navigate(module.href)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-muted text-primary">
                        <module.icon className="h-5 w-5" />
                      </div>
                      <Badge variant={module.badgeVariant || 'secondary'} className="text-xs">
                        {module.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-3">{module.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                    <Button variant="ghost" size="sm" className="gap-2 group-hover:text-primary transition-colors p-0">
                      Ouvrir <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="generate">
            <QuickContentGenerator />
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
