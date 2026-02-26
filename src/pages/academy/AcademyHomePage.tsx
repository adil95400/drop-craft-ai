import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, Play, Book, Clock, Star, Search, TrendingUp, Users, 
  Zap, Target, CheckCircle2, ArrowRight, Shield, BarChart3, Globe,
  Bot, ShoppingCart, Package, Layers, Award, BookOpen, Video
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessons: number;
  level: string;
  students: string;
  rating: number;
  category: string;
  image: string;
  highlights: string[];
}

interface LearningPath {
  title: string;
  description: string;
  icon: React.ElementType;
  courses: string[];
  duration: string;
  level: string;
}

const COURSES: Course[] = [
  {
    id: 'dropshipping-101',
    title: 'Démarrer en dropshipping',
    description: 'Apprenez les fondamentaux du dropshipping et lancez votre première boutique en 7 jours.',
    duration: '4h 30min', lessons: 24, level: 'Débutant', students: '5.2k', rating: 4.9,
    category: 'Dropshipping', image: '🚀',
    highlights: ['Choisir une niche rentable', 'Trouver des fournisseurs fiables', 'Créer sa boutique de A à Z', 'Premières ventes en 7 jours']
  },
  {
    id: 'ai-optimization',
    title: 'Optimisation IA avancée',
    description: 'Maîtrisez les outils d\'IA pour automatiser et optimiser votre catalogue produits.',
    duration: '3h 15min', lessons: 18, level: 'Intermédiaire', students: '3.8k', rating: 4.8,
    category: 'IA', image: '🤖',
    highlights: ['Enrichissement automatique de fiches', 'Génération de descriptions SEO', 'Scoring qualité IA', 'Templates de contenu']
  },
  {
    id: 'marketing-automation',
    title: 'Marketing automation',
    description: 'Créez des campagnes automatisées et augmentez vos conversions de 40%.',
    duration: '2h 45min', lessons: 15, level: 'Intermédiaire', students: '4.1k', rating: 4.7,
    category: 'Marketing', image: '📧',
    highlights: ['Séquences email automatiques', 'Segmentation avancée', 'A/B testing efficace', 'ROI marketing +40%']
  },
  {
    id: 'multi-marketplace',
    title: 'Multi-marketplace mastery',
    description: 'Gérez efficacement plusieurs boutiques et marketplaces depuis une seule interface.',
    duration: '5h 00min', lessons: 28, level: 'Avancé', students: '2.3k', rating: 4.9,
    category: 'Multi-boutiques', image: '🌐',
    highlights: ['Shopify + WooCommerce + Amazon', 'Sync bidirectionnelle', 'Gestion centralisée des prix', 'Résolution de conflits']
  },
  {
    id: 'seo-ecommerce',
    title: 'SEO pour e-commerce',
    description: 'Optimisez votre référencement et multipliez votre trafic organique par 3.',
    duration: '3h 30min', lessons: 20, level: 'Intermédiaire', students: '6.7k', rating: 4.8,
    category: 'SEO', image: '🔍',
    highlights: ['Audit SEO complet', 'Structure URL optimale', 'Méta-descriptions IA', 'Schema.org pour produits']
  },
  {
    id: 'analytics-bi',
    title: 'Analytics & Business Intelligence',
    description: 'Prenez de meilleures décisions grâce aux données et prévisions IA.',
    duration: '2h 20min', lessons: 12, level: 'Tous niveaux', students: '4.5k', rating: 4.6,
    category: 'Analytics', image: '📊',
    highlights: ['Dashboards personnalisés', 'KPIs essentiels', 'Prévisions de ventes', 'Rapports automatiques']
  },
  {
    id: 'supplier-sourcing',
    title: 'Sourcing fournisseurs pro',
    description: 'Trouvez et négociez avec les meilleurs fournisseurs pour maximiser vos marges.',
    duration: '3h 00min', lessons: 16, level: 'Intermédiaire', students: '3.2k', rating: 4.7,
    category: 'Fournisseurs', image: '🏭',
    highlights: ['Évaluation de fournisseurs', 'Négociation des prix', 'Contrôle qualité', 'Diversification sourcing']
  },
  {
    id: 'order-management',
    title: 'Gestion des commandes avancée',
    description: 'Automatisez le traitement de vos commandes de la réception à la livraison.',
    duration: '2h 10min', lessons: 14, level: 'Débutant', students: '5.8k', rating: 4.8,
    category: 'Commandes', image: '📦',
    highlights: ['Auto-commande fournisseur', 'Suivi colis en temps réel', 'Gestion des retours', 'Workflows personnalisés']
  },
  {
    id: 'pricing-strategy',
    title: 'Stratégie de prix dynamique',
    description: 'Maîtrisez le repricing automatique et optimisez vos marges en continu.',
    duration: '1h 45min', lessons: 10, level: 'Avancé', students: '1.9k', rating: 4.9,
    category: 'Tarification', image: '💰',
    highlights: ['Règles de prix conditionnelles', 'Monitoring concurrentiel', 'Marges cibles automatiques', 'Prix par canal']
  },
  {
    id: 'security-compliance',
    title: 'Sécurité et conformité RGPD',
    description: 'Protégez votre boutique et respectez les réglementations européennes.',
    duration: '1h 30min', lessons: 8, level: 'Tous niveaux', students: '2.1k', rating: 4.5,
    category: 'Sécurité', image: '🔒',
    highlights: ['Conformité RGPD', 'Protection des données', 'Audit de sécurité', 'Bonnes pratiques']
  },
  {
    id: 'workflow-automation',
    title: 'Workflows d\'automatisation',
    description: 'Construisez des workflows visuels pour automatiser chaque aspect de votre business.',
    duration: '4h 00min', lessons: 22, level: 'Avancé', students: '2.7k', rating: 4.8,
    category: 'Automatisation', image: '⚡',
    highlights: ['Workflow Studio', 'Triggers conditionnels', 'Actions chaînées', 'Monitoring en temps réel']
  },
  {
    id: 'crm-customer',
    title: 'CRM et fidélisation client',
    description: 'Construisez des relations durables avec vos clients pour maximiser la LTV.',
    duration: '2h 30min', lessons: 13, level: 'Intermédiaire', students: '3.5k', rating: 4.6,
    category: 'CRM', image: '👥',
    highlights: ['Segmentation clients', 'Scoring automatique', 'Campagnes ciblées', 'Analyse de cohortes']
  },
];

const LEARNING_PATHS: LearningPath[] = [
  {
    title: 'Parcours Débutant',
    description: 'De zéro à votre première vente en 2 semaines',
    icon: Layers,
    courses: ['dropshipping-101', 'order-management', 'analytics-bi'],
    duration: '9h',
    level: 'Débutant'
  },
  {
    title: 'Parcours Croissance',
    description: 'Passez de 100 à 1000 ventes par mois',
    icon: TrendingUp,
    courses: ['seo-ecommerce', 'marketing-automation', 'pricing-strategy', 'crm-customer'],
    duration: '10h 30min',
    level: 'Intermédiaire'
  },
  {
    title: 'Parcours Expert',
    description: 'Maîtrisez l\'automatisation et le multi-canal',
    icon: Award,
    courses: ['multi-marketplace', 'workflow-automation', 'ai-optimization', 'supplier-sourcing'],
    duration: '15h 15min',
    level: 'Avancé'
  },
];

const TESTIMONIALS = [
  { name: 'Marie D.', role: 'E-commerçante', quote: 'Grâce au parcours débutant, j\'ai fait ma première vente en 5 jours !', course: 'Démarrer en dropshipping', rating: 5 },
  { name: 'Thomas L.', role: 'Entrepreneur', quote: 'L\'automatisation IA m\'a fait gagner 15h par semaine sur mes fiches produit.', course: 'Optimisation IA avancée', rating: 5 },
  { name: 'Sophie M.', role: 'Responsable e-commerce', quote: 'Le cours multi-marketplace a transformé notre stratégie de vente.', course: 'Multi-marketplace mastery', rating: 5 },
];

const AcademyHomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => {
    const cats = [...new Set(COURSES.map(c => c.category))];
    return [{ name: 'Tous', value: 'all', count: COURSES.length }, ...cats.map(c => ({
      name: c, value: c, count: COURSES.filter(co => co.category === c).length
    }))];
  }, []);

  const filteredCourses = useMemo(() => {
    return COURSES.filter(c => {
      const matchCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const matchSearch = !searchQuery || 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <PublicLayout>
      <Helmet>
        <title>Académie ShopOpti - Formations E-commerce</title>
        <meta name="description" content="Plus de 40 formations complètes en dropshipping, automatisation IA, marketing et analytics. De débutant à expert." />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
                <GraduationCap className="h-4 w-4 mr-2" />
                Académie ShopOpti
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                Devenez un expert
                <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  du e-commerce
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                {COURSES.length} formations complètes pour maîtriser le dropshipping, l'IA et l'automatisation. 
                De débutant à expert en quelques semaines.
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-8 pt-4">
                {[
                  { value: `${COURSES.length}+`, label: 'Formations' },
                  { value: '200+', label: 'Leçons vidéo' },
                  { value: '20k+', label: 'Apprenants' },
                  { value: '4.8', label: 'Note moyenne' },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold text-primary">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto pt-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une formation..."
                  className="pl-12 h-12 text-base"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 py-12">
          <Tabs defaultValue="courses" className="space-y-8">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="courses" className="gap-1.5">
                <BookOpen className="h-4 w-4" />Formations ({filteredCourses.length})
              </TabsTrigger>
              <TabsTrigger value="paths" className="gap-1.5">
                <Layers className="h-4 w-4" />Parcours guidés ({LEARNING_PATHS.length})
              </TabsTrigger>
              <TabsTrigger value="testimonials" className="gap-1.5">
                <Star className="h-4 w-4" />Témoignages
              </TabsTrigger>
            </TabsList>

            {/* Courses Tab */}
            <TabsContent value="courses" className="space-y-6">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <Button
                    key={cat.value}
                    variant={selectedCategory === cat.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.value)}
                    className="gap-1.5"
                  >
                    {cat.name}
                    <Badge variant="secondary" className="ml-1 text-xs">{cat.count}</Badge>
                  </Button>
                ))}
              </div>

              {/* Courses Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-all overflow-hidden group flex flex-col">
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-6xl relative">
                      {course.image}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                        <div className="h-14 w-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                          <Play className="h-6 w-6 text-primary-foreground ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{course.category}</Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          <span className="text-sm font-medium">{course.rating}</span>
                        </div>
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {course.title}
                      </CardTitle>
                      <CardDescription>{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                      {/* Highlights */}
                      <ul className="space-y-1.5 flex-1">
                        {course.highlights.map((h, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {course.duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <Video className="h-4 w-4" />
                            {course.lessons} leçons
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <Badge variant="secondary">{course.level}</Badge>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />{course.students}
                          </span>
                        </div>
                        <Button className="w-full group-hover:bg-primary/90" onClick={() => navigate('/academy/course/' + course.id)}>
                          <Play className="h-4 w-4 mr-2" />
                          Commencer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredCourses.length === 0 && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">Aucune formation trouvée</p>
                  <p className="text-muted-foreground">Essayez un autre terme de recherche ou une autre catégorie.</p>
                </div>
              )}
            </TabsContent>

            {/* Learning Paths Tab */}
            <TabsContent value="paths" className="space-y-6">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold">Parcours d'apprentissage guidés</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Suivez un parcours structuré adapté à votre niveau pour progresser étape par étape.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {LEARNING_PATHS.map((path, index) => {
                  const Icon = path.icon;
                  const pathCourses = COURSES.filter(c => path.courses.includes(c.id));
                  const totalLessons = pathCourses.reduce((acc, c) => acc + c.lessons, 0);

                  return (
                    <Card key={index} className="hover:shadow-lg transition-all border-2 hover:border-primary/30">
                      <CardHeader>
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={path.level === 'Débutant' ? 'default' : path.level === 'Intermédiaire' ? 'secondary' : 'outline'}>
                            {path.level}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{path.duration}</span>
                        </div>
                        <CardTitle className="text-xl">{path.title}</CardTitle>
                        <CardDescription>{path.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          {pathCourses.map((course, ci) => (
                            <div key={course.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                                {ci + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{course.title}</p>
                                <p className="text-xs text-muted-foreground">{course.lessons} leçons · {course.duration}</p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                            <span>{pathCourses.length} formations</span>
                            <span>{totalLessons} leçons au total</span>
                          </div>
                          <Button className="w-full" onClick={() => navigate('/academy/course/' + path.courses[0])}>
                            Démarrer le parcours
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Testimonials Tab */}
            <TabsContent value="testimonials" className="space-y-6">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold">Ce qu'en disent nos apprenants</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Plus de 20 000 e-commerçants ont déjà suivi nos formations.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {TESTIMONIALS.map((t, i) => (
                  <Card key={i} className="hover:shadow-md transition-all">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.rating }).map((_, si) => (
                          <Star key={si} className="h-4 w-4 fill-warning text-warning" />
                        ))}
                      </div>
                      <blockquote className="text-sm italic text-muted-foreground">
                        "{t.quote}"
                      </blockquote>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <p className="font-medium text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.role}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{t.course}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-6 max-w-2xl mx-auto">
              <GraduationCap className="h-16 w-16 mx-auto text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">
                Prêt à devenir un expert ?
              </h2>
              <p className="text-lg text-muted-foreground">
                Accédez à toutes nos formations avec un compte ShopOpti Pro. 
                Commencez dès maintenant, progressez à votre rythme.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={() => {
                  try { localStorage.setItem('pending_trial', 'true'); } catch {}
                  navigate('/auth?trial=true');
                }}>
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/knowledge-base')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Centre d'aide
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default AcademyHomePage;
