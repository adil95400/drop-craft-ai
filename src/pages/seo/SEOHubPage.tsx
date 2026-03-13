import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useNavigate } from 'react-router-dom';
import {
  Search, Globe, BarChart3, Code2, FileText, TrendingUp,
  Languages, Target, Sparkles, ArrowRight, Zap, PenTool
} from 'lucide-react';

const seoModules = [
  {
    title: 'Recherche de mots-clés',
    description: 'Trouvez les mots-clés à fort volume et faible concurrence pour vos produits',
    icon: Search,
    href: '/marketing/seo/keywords',
    badge: 'Essentiel',
    color: 'text-primary',
  },
  {
    title: 'Suivi des positions',
    description: 'Suivez vos classements Google en temps réel avec historique et tendances',
    icon: TrendingUp,
    href: '/marketing/seo/rank-tracker',
    badge: 'Tracking',
    color: 'text-primary',
  },
  {
    title: 'Contenu SEO Multilingue',
    description: 'Générez des descriptions produit SEO dans 50+ langues avec l\'IA',
    icon: Globe,
    href: '/marketing/seo/multilingual',
    badge: 'Nouveau',
    badgeVariant: 'default' as const,
    color: 'text-primary',
  },
  {
    title: 'Audit SEO Produits',
    description: 'Analysez et optimisez le score SEO de votre catalogue produit',
    icon: BarChart3,
    href: '/marketing/seo/dashboard',
    badge: 'Dashboard',
    color: 'text-primary',
  },
  {
    title: 'Schémas structurés',
    description: 'Générez des données structurées JSON-LD pour le rich snippet Google',
    icon: Code2,
    href: '/marketing/seo/schema',
    badge: 'Technique',
    color: 'text-primary',
  },
  {
    title: 'Contenu & Blog IA',
    description: 'Créez des articles de blog optimisés SEO automatiquement',
    icon: PenTool,
    href: '/marketing/content-generation',
    badge: 'IA',
    color: 'text-primary',
  },
];

const stats = [
  { label: 'Langues supportées', value: '50+', icon: Languages },
  { label: 'Outils SEO', value: '6', icon: Zap },
  { label: 'Génération IA', value: 'GPT-5', icon: Sparkles },
  { label: 'Audit en masse', value: 'Illimité', icon: Target },
];

export default function SEOHubPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Hub SEO & Contenu | ShopOpti</title>
        <meta name="description" content="Centre de commande SEO : recherche mots-clés, rank tracker, contenu multilingue 50+ langues" />
      </Helmet>

      <ChannablePageWrapper
        title="Hub SEO & Contenu"
        description="Centre de commande pour l'optimisation SEO et la génération de contenu multilingue"
        heroImage="seo"
        badge={{ label: 'SEO Pro', icon: Search }}
      >
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                  <div className={`p-2.5 rounded-xl bg-muted ${module.color}`}>
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
      </ChannablePageWrapper>
    </>
  );
}
