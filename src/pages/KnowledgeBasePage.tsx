import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, BookOpen, Video, HelpCircle, Lightbulb, Rocket, Shield, Zap, ExternalLink, Play, Clock, ChevronRight } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  tags: string[];
}

interface VideoTutorial {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  category: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
}

const ARTICLES: Article[] = [
  { id: '1', title: 'Premiers pas avec ShopOpti+', excerpt: 'Guide complet pour configurer votre boutique et importer vos premiers produits.', category: 'Démarrage', readTime: '5 min', tags: ['onboarding', 'setup'] },
  { id: '2', title: 'Connecter votre boutique Shopify', excerpt: 'Intégrez votre boutique Shopify en quelques clics pour synchroniser produits et commandes.', category: 'Intégrations', readTime: '3 min', tags: ['shopify', 'sync'] },
  { id: '3', title: 'Automatiser les commandes fournisseurs', excerpt: 'Configurez des règles d\'auto-commande pour ne jamais manquer un réapprovisionnement.', category: 'Automatisation', readTime: '7 min', tags: ['automation', 'orders'] },
  { id: '4', title: 'Optimiser vos fiches produits avec l\'IA', excerpt: 'Utilisez notre assistant IA pour générer des titres, descriptions et SEO optimisés.', category: 'IA', readTime: '4 min', tags: ['ai', 'seo', 'products'] },
  { id: '5', title: 'Gérer votre équipe et les permissions', excerpt: 'Invitez des collaborateurs et définissez des rôles granulaires pour chaque membre.', category: 'Équipe', readTime: '3 min', tags: ['team', 'permissions'] },
  { id: '6', title: 'Comprendre le dashboard Analytics', excerpt: 'Décryptez vos KPIs : chiffre d\'affaires, marge, taux de conversion et tendances.', category: 'Analytics', readTime: '6 min', tags: ['analytics', 'kpi'] },
  { id: '7', title: 'Configurer les campagnes PPC', excerpt: 'Créez et optimisez vos campagnes publicitaires avec notre moteur d\'automatisation.', category: 'Marketing', readTime: '8 min', tags: ['ppc', 'ads', 'marketing'] },
  { id: '8', title: 'Sécurité et conformité RGPD', excerpt: 'Protégez vos données et celles de vos clients avec nos outils de conformité intégrés.', category: 'Sécurité', readTime: '5 min', tags: ['security', 'gdpr'] },
];

const VIDEOS: VideoTutorial[] = [
  { id: 'v1', title: 'Tour complet de la plateforme', duration: '12:30', thumbnail: '🎬', category: 'Démarrage', level: 'Débutant' },
  { id: 'v2', title: 'Importer des produits en masse', duration: '8:15', thumbnail: '📦', category: 'Produits', level: 'Débutant' },
  { id: 'v3', title: 'Créer un workflow d\'automatisation', duration: '15:45', thumbnail: '⚡', category: 'Automatisation', level: 'Intermédiaire' },
  { id: 'v4', title: 'Configurer les intégrations marketplace', duration: '10:20', thumbnail: '🔗', category: 'Intégrations', level: 'Intermédiaire' },
  { id: 'v5', title: 'Optimisation SEO avancée', duration: '18:00', thumbnail: '🔍', category: 'SEO', level: 'Avancé' },
  { id: 'v6', title: 'Gestion multi-boutiques', duration: '14:30', thumbnail: '🏪', category: 'Enterprise', level: 'Avancé' },
];

const FAQ = [
  { q: 'Comment réinitialiser mon mot de passe ?', a: 'Cliquez sur "Mot de passe oublié" sur la page de connexion. Un email de réinitialisation vous sera envoyé.' },
  { q: 'Combien de produits puis-je importer ?', a: 'Cela dépend de votre plan. Le plan Free permet 50 produits, Pro 5 000 et Enterprise illimité.' },
  { q: 'Comment connecter Amazon ?', a: 'Allez dans Intégrations > Marketplaces > Amazon, sélectionnez votre région et suivez l\'assistant de connexion.' },
  { q: 'Les données sont-elles sécurisées ?', a: 'Oui, nous utilisons un chiffrement AES-256 au repos et TLS 1.3 en transit. Conforme RGPD.' },
  { q: 'Puis-je exporter mes données ?', a: 'Oui, depuis Paramètres > Export de données. Formats disponibles : CSV, JSON, XLSX.' },
  { q: 'Comment fonctionne la facturation ?', a: 'La facturation est mensuelle. Vous pouvez changer de plan à tout moment, le prorata est calculé automatiquement.' },
];

export default function KnowledgeBasePage() {
  const [search, setSearch] = useState('');

  const filteredArticles = ARTICLES.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.tags.some(t => t.includes(search.toLowerCase()))
  );

  const categories = [...new Set(ARTICLES.map(a => a.category))];

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <BookOpen className="h-10 w-10 text-primary" />
          Centre d'Aide
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Guides, tutoriels vidéo et FAQ pour maîtriser ShopOpti+
        </p>
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            className="pl-10 h-12 text-lg"
            placeholder="Rechercher un article, un tutoriel..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-3">
        {[
          { icon: <Rocket className="h-5 w-5" />, label: 'Démarrage', count: 2 },
          { icon: <Zap className="h-5 w-5" />, label: 'Automatisation', count: 3 },
          { icon: <Lightbulb className="h-5 w-5" />, label: 'IA', count: 2 },
          { icon: <Shield className="h-5 w-5" />, label: 'Sécurité', count: 1 },
        ].map(cat => (
          <Card key={cat.label} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSearch(cat.label)}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">{cat.icon}</div>
              <div>
                <p className="font-medium">{cat.label}</p>
                <p className="text-sm text-muted-foreground">{cat.count} articles</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles"><BookOpen className="mr-1 h-4 w-4" />Articles</TabsTrigger>
          <TabsTrigger value="videos"><Video className="mr-1 h-4 w-4" />Vidéos</TabsTrigger>
          <TabsTrigger value="faq"><HelpCircle className="mr-1 h-4 w-4" />FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {filteredArticles.map(article => (
              <Card key={article.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{article.category}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />{article.readTime}
                    </span>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                    {article.title}
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                  <div className="flex gap-1 mt-3">
                    {article.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            {VIDEOS.map(video => (
              <Card key={video.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="p-4 space-y-3">
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-4xl relative">
                    {video.thumbnail}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                      <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                        <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">{video.category}</Badge>
                      <Badge variant={video.level === 'Débutant' ? 'default' : video.level === 'Intermédiaire' ? 'secondary' : 'outline'} className="text-xs">
                        {video.level}
                      </Badge>
                    </div>
                    <p className="font-medium">{video.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />{video.duration}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="faq" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <Accordion type="multiple" className="w-full">
                {FAQ.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
