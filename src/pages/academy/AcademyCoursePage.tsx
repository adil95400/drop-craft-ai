import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Play, Clock, Users, Star, CheckCircle2, Lock,
  BookOpen, Video, Award, Download, MessageCircle, Share2,
  ArrowRight, Zap, Target, BarChart3, Bot, FileText, Lightbulb
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

// ─── Course Data ────────────────────────────────────────────────
interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'exercise' | 'article';
  free: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

interface CourseDetail {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  duration: string;
  lessons: number;
  level: string;
  students: string;
  rating: number;
  category: string;
  emoji: string;
  instructor: { name: string; role: string; avatar: string; bio: string };
  highlights: string[];
  requirements: string[];
  outcomes: string[];
  modules: Module[];
  faqs: { q: string; a: string }[];
  reviews: { name: string; rating: number; text: string; date: string }[];
}

const COURSE_DATA: Record<string, CourseDetail> = {
  'ai-optimization': {
    id: 'ai-optimization',
    title: 'Optimisation IA avancée',
    subtitle: 'Maîtrisez l\'intelligence artificielle pour automatiser et optimiser votre catalogue produits',
    description: 'Formation complète sur l\'utilisation de l\'IA pour générer, enrichir et optimiser automatiquement vos fiches produits.',
    longDescription: `Cette formation premium vous apprend à exploiter la puissance de l'intelligence artificielle pour transformer votre catalogue e-commerce. De la génération automatique de descriptions SEO à l'enrichissement intelligent des attributs produits, chaque leçon est conçue pour vous faire gagner du temps et améliorer vos conversions.

Vous découvrirez comment utiliser les modèles IA intégrés à ShopOpti+ pour analyser vos produits, générer du contenu de qualité professionnelle et automatiser les tâches répétitives. À la fin de cette formation, vous serez capable de gérer un catalogue de 10 000+ produits avec un minimum d'effort.`,
    duration: '3h 15min', lessons: 18, level: 'Intermédiaire', students: '3.8k', rating: 4.8,
    category: 'IA', emoji: '🤖',
    instructor: {
      name: 'Dr. Marc Dupont',
      role: 'Expert IA & E-commerce',
      avatar: '👨‍🔬',
      bio: 'Ancien chercheur en NLP chez Google, Marc accompagne les e-commerçants dans leur transformation IA depuis 2020. Il a formé plus de 3 000 professionnels.'
    },
    highlights: [
      'Enrichissement automatique de fiches produits',
      'Génération de descriptions SEO optimisées',
      'Scoring qualité IA en temps réel',
      'Templates de contenu personnalisables',
      'Traduction multi-langues automatique',
      'Optimisation des images par IA',
    ],
    requirements: [
      'Compte ShopOpti+ actif (plan Standard ou supérieur)',
      'Au moins 10 produits dans votre catalogue',
      'Notions de base en e-commerce',
    ],
    outcomes: [
      'Générer des descriptions produits SEO en 1 clic',
      'Enrichir automatiquement les attributs de vos produits',
      'Configurer le scoring qualité pour votre catalogue',
      'Créer des templates IA réutilisables',
      'Automatiser la traduction de vos fiches produits',
      'Optimiser vos images produits avec l\'IA',
      'Réduire de 80% le temps de gestion catalogue',
    ],
    modules: [
      {
        id: 'mod-1',
        title: 'Introduction à l\'IA pour le e-commerce',
        description: 'Comprendre les fondamentaux de l\'IA appliquée au commerce en ligne.',
        lessons: [
          { id: 'l1', title: 'Qu\'est-ce que l\'IA pour le e-commerce ?', duration: '8:30', type: 'video', free: true },
          { id: 'l2', title: 'Les modèles IA disponibles dans ShopOpti+', duration: '12:15', type: 'video', free: true },
          { id: 'l3', title: 'Quiz : Fondamentaux de l\'IA', duration: '5:00', type: 'quiz', free: false },
        ]
      },
      {
        id: 'mod-2',
        title: 'Génération de descriptions produits',
        description: 'Apprenez à générer des descriptions uniques et optimisées SEO pour chaque produit.',
        lessons: [
          { id: 'l4', title: 'Configurer votre premier template IA', duration: '15:20', type: 'video', free: false },
          { id: 'l5', title: 'Personnaliser le ton et le style', duration: '10:45', type: 'video', free: false },
          { id: 'l6', title: 'Génération en masse (batch)', duration: '12:00', type: 'video', free: false },
          { id: 'l7', title: 'Exercice : Créer 50 descriptions en 10 min', duration: '15:00', type: 'exercise', free: false },
        ]
      },
      {
        id: 'mod-3',
        title: 'Enrichissement des attributs produits',
        description: 'Utilisez l\'IA pour compléter et normaliser les attributs de vos fiches produits.',
        lessons: [
          { id: 'l8', title: 'Analyse automatique des attributs manquants', duration: '11:30', type: 'video', free: false },
          { id: 'l9', title: 'Catégorisation automatique par IA', duration: '9:45', type: 'video', free: false },
          { id: 'l10', title: 'Normalisation des tailles et couleurs', duration: '8:20', type: 'video', free: false },
          { id: 'l11', title: 'Article : Bonnes pratiques d\'enrichissement', duration: '6:00', type: 'article', free: false },
        ]
      },
      {
        id: 'mod-4',
        title: 'Scoring qualité et optimisation continue',
        description: 'Mesurez et améliorez la qualité de votre catalogue en continu.',
        lessons: [
          { id: 'l12', title: 'Comprendre le Quality Score', duration: '10:00', type: 'video', free: false },
          { id: 'l13', title: 'Configurer les seuils d\'alerte', duration: '7:30', type: 'video', free: false },
          { id: 'l14', title: 'Tableau de bord qualité catalogue', duration: '12:15', type: 'video', free: false },
          { id: 'l15', title: 'Quiz : Maîtrisez le scoring', duration: '5:00', type: 'quiz', free: false },
        ]
      },
      {
        id: 'mod-5',
        title: 'Automatisation avancée et workflows IA',
        description: 'Créez des pipelines d\'automatisation complètes pour votre catalogue.',
        lessons: [
          { id: 'l16', title: 'Workflows IA : de l\'import à la publication', duration: '18:00', type: 'video', free: false },
          { id: 'l17', title: 'Traduction automatique multi-langues', duration: '14:30', type: 'video', free: false },
          { id: 'l18', title: 'Projet final : Catalogue 100% automatisé', duration: '20:00', type: 'exercise', free: false },
        ]
      },
    ],
    faqs: [
      { q: 'Ai-je besoin d\'expérience en IA ?', a: 'Non, cette formation est conçue pour être accessible à tous. Aucune connaissance technique en IA n\'est requise. Tout se fait via l\'interface ShopOpti+.' },
      { q: 'Les outils IA sont-ils inclus dans mon abonnement ?', a: 'Oui, tous les plans incluent des crédits IA. Les plans Pro et Business offrent des crédits supplémentaires pour les opérations en masse.' },
      { q: 'Combien de temps faut-il pour suivre la formation ?', a: 'La formation complète dure 3h15. Nous recommandons de la suivre sur 1 à 2 semaines pour bien assimiler chaque module et pratiquer.' },
      { q: 'Y a-t-il un certificat ?', a: 'Oui ! À la fin de la formation, vous recevez un certificat "IA E-commerce Expert" téléchargeable et partageable sur LinkedIn.' },
      { q: 'La formation est-elle mise à jour ?', a: 'Oui, le contenu est mis à jour régulièrement pour refléter les dernières avancées IA et les nouvelles fonctionnalités de ShopOpti+.' },
    ],
    reviews: [
      { name: 'Thomas L.', rating: 5, text: 'Formation exceptionnelle ! J\'ai automatisé 80% de la gestion de mon catalogue de 5 000 produits. Le module sur les workflows IA est une pépite.', date: '2026-02-15' },
      { name: 'Amélie R.', rating: 5, text: 'Les templates IA m\'ont permis de générer 200 descriptions produits en une après-midi. Qualité impressionnante.', date: '2026-02-08' },
      { name: 'Karim B.', rating: 4, text: 'Très bon contenu, bien structuré. J\'aurais aimé plus d\'exercices pratiques, mais les concepts sont solides.', date: '2026-01-28' },
      { name: 'Claire M.', rating: 5, text: 'Le scoring qualité a complètement changé ma façon de gérer mon catalogue. Indispensable pour les gros volumes.', date: '2026-01-20' },
      { name: 'David P.', rating: 5, text: 'Marc est un excellent formateur. Ses explications sont claires et les exemples très concrets. Bravo !', date: '2026-01-12' },
    ],
  },
  'dropshipping-101': {
    id: 'dropshipping-101',
    title: 'Démarrer en dropshipping',
    subtitle: 'Lancez votre première boutique et réalisez vos premières ventes en 7 jours',
    description: 'Formation fondamentale pour créer votre business dropshipping de A à Z.',
    longDescription: 'Ce cours complet vous guide étape par étape dans la création de votre activité de dropshipping. De la sélection de niche à votre première vente, chaque leçon est orientée action pour des résultats rapides.',
    duration: '4h 30min', lessons: 24, level: 'Débutant', students: '5.2k', rating: 4.9,
    category: 'Dropshipping', emoji: '🚀',
    instructor: { name: 'Sophie Martin', role: 'Fondatrice d\'un e-commerce à 7 chiffres', avatar: '👩‍💼', bio: 'Sophie a bâti un empire e-commerce générant +2M€/an. Elle partage son expertise depuis 2021.' },
    highlights: ['Choisir une niche rentable', 'Trouver des fournisseurs fiables', 'Créer sa boutique de A à Z', 'Premières ventes en 7 jours', 'Stratégie marketing initiale', 'Gestion des premières commandes'],
    requirements: ['Aucune expérience requise', 'Un ordinateur avec connexion internet', 'Budget marketing de démarrage (~100€)'],
    outcomes: ['Identifier une niche rentable', 'Sélectionner et vérifier des fournisseurs', 'Créer une boutique professionnelle', 'Configurer les paiements et la livraison', 'Lancer vos premières campagnes', 'Traiter vos premières commandes', 'Analyser vos premiers résultats'],
    modules: [
      { id: 'm1', title: 'Les fondamentaux du dropshipping', description: 'Comprendre le modèle et ses opportunités.', lessons: [
        { id: 'l1', title: 'Qu\'est-ce que le dropshipping ?', duration: '10:00', type: 'video', free: true },
        { id: 'l2', title: 'Avantages et inconvénients', duration: '8:30', type: 'video', free: true },
        { id: 'l3', title: 'Choisir sa niche', duration: '15:00', type: 'video', free: false },
        { id: 'l4', title: 'Étude de marché express', duration: '12:00', type: 'exercise', free: false },
      ]},
      { id: 'm2', title: 'Trouver vos fournisseurs', description: 'Identifier et vérifier les meilleurs fournisseurs.', lessons: [
        { id: 'l5', title: 'AliExpress vs CJ Dropshipping vs BigBuy', duration: '14:00', type: 'video', free: false },
        { id: 'l6', title: 'Vérifier la fiabilité d\'un fournisseur', duration: '10:00', type: 'video', free: false },
        { id: 'l7', title: 'Négocier les prix et conditions', duration: '8:00', type: 'video', free: false },
        { id: 'l8', title: 'Exercice : Sélectionner 5 produits', duration: '20:00', type: 'exercise', free: false },
      ]},
      { id: 'm3', title: 'Créer votre boutique', description: 'Mise en place complète de votre boutique.', lessons: [
        { id: 'l9', title: 'Configurer votre boutique Shopify', duration: '18:00', type: 'video', free: false },
        { id: 'l10', title: 'Importer vos produits avec ShopOpti+', duration: '12:00', type: 'video', free: false },
        { id: 'l11', title: 'Optimiser les fiches produits', duration: '15:00', type: 'video', free: false },
        { id: 'l12', title: 'Configurer les paiements et la livraison', duration: '10:00', type: 'video', free: false },
      ]},
      { id: 'm4', title: 'Lancer et vendre', description: 'Vos premières campagnes et premières ventes.', lessons: [
        { id: 'l13', title: 'Stratégie de lancement', duration: '12:00', type: 'video', free: false },
        { id: 'l14', title: 'Facebook Ads pour débutants', duration: '18:00', type: 'video', free: false },
        { id: 'l15', title: 'Google Ads Shopping', duration: '15:00', type: 'video', free: false },
        { id: 'l16', title: 'Analyser et optimiser', duration: '10:00', type: 'video', free: false },
      ]},
    ],
    faqs: [
      { q: 'Le dropshipping est-il toujours rentable en 2026 ?', a: 'Absolument. Le marché global du dropshipping atteint 500B$ en 2026. La clé est de se différencier avec des outils d\'automatisation et d\'IA.' },
      { q: 'Combien faut-il investir pour démarrer ?', a: 'Avec ShopOpti+, vous pouvez démarrer avec un budget de 100-200€ pour vos premières publicités. La plateforme elle-même offre un essai gratuit.' },
      { q: 'Y a-t-il un certificat ?', a: 'Oui, un certificat "Dropshipper Certifié ShopOpti+" vous est délivré à la fin.' },
    ],
    reviews: [
      { name: 'Marie D.', rating: 5, text: 'Première vente au jour 5 ! La formation est hyper pratique et les templates fournis sont top.', date: '2026-02-20' },
      { name: 'Lucas G.', rating: 5, text: 'Enfin une formation qui ne vend pas du rêve. Contenu concret et résultats mesurables.', date: '2026-02-10' },
      { name: 'Emma T.', rating: 4, text: 'Très complète pour les débutants. J\'aurais aimé plus sur les stratégies TikTok Ads.', date: '2026-01-30' },
    ],
  },
};

// Fallback for courses not fully detailed
function getDefaultCourse(id: string): CourseDetail {
  return {
    id, title: 'Formation en préparation', subtitle: 'Ce cours sera bientôt disponible', description: 'Contenu en cours de production.',
    longDescription: 'Nous travaillons activement sur ce cours. Inscrivez-vous pour être notifié dès sa sortie.',
    duration: 'À venir', lessons: 0, level: 'À venir', students: '0', rating: 0, category: 'Général', emoji: '📚',
    instructor: { name: 'Équipe ShopOpti+', role: 'Experts e-commerce', avatar: '🎓', bio: 'L\'équipe ShopOpti+ réunit des experts en e-commerce, IA et marketing digital.' },
    highlights: [], requirements: [], outcomes: [], modules: [], faqs: [], reviews: [],
  };
}

// ─── Component ──────────────────────────────────────────────────
const AcademyCoursePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  const course = COURSE_DATA[id || ''] || getDefaultCourse(id || '');
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const freeLessons = course.modules.reduce((acc, m) => acc + m.lessons.filter(l => l.free).length, 0);

  const typeIcons: Record<string, React.ReactNode> = {
    video: <Video className="h-4 w-4 text-primary" />,
    quiz: <Target className="h-4 w-4 text-warning" />,
    exercise: <Zap className="h-4 w-4 text-success" />,
    article: <FileText className="h-4 w-4 text-info" />,
  };

  const typeLabels: Record<string, string> = {
    video: 'Vidéo', quiz: 'Quiz', exercise: 'Exercice', article: 'Article',
  };

  return (
    <PublicLayout>
      <Helmet>
        <title>{course.title} | Académie ShopOpti+</title>
        <meta name="description" content={course.description} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Banner */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <Link to="/academy" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 group">
              <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour à l'Académie
            </Link>

            <div className="grid lg:grid-cols-3 gap-10">
              {/* Left: Course Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="lg:col-span-2 space-y-6"
              >
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary/10 text-primary border-primary/20">{course.category}</Badge>
                  <Badge variant="outline">{course.level}</Badge>
                  {course.rating > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{course.rating}</span>
                      <span className="text-muted-foreground">({course.reviews.length} avis)</span>
                    </div>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">
                  {course.emoji} {course.title}
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">{course.subtitle}</p>

                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{course.duration}</span>
                  <span className="flex items-center gap-1.5"><Video className="h-4 w-4" />{totalLessons} leçons</span>
                  <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{course.students} étudiants</span>
                  <span className="flex items-center gap-1.5"><Award className="h-4 w-4" />Certificat inclus</span>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                    {course.instructor.avatar}
                  </div>
                  <div>
                    <p className="font-semibold">{course.instructor.name}</p>
                    <p className="text-sm text-muted-foreground">{course.instructor.role}</p>
                  </div>
                </div>
              </motion.div>

              {/* Right: Enrollment Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              >
                <Card className="border-2 border-primary/20 shadow-xl sticky top-24">
                  <CardContent className="p-6 space-y-5">
                    {/* Preview video placeholder */}
                    <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative overflow-hidden">
                      <div className="text-7xl">{course.emoji}</div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                          <Play className="h-7 w-7 text-primary-foreground ml-0.5" />
                        </div>
                      </div>
                      <Badge className="absolute top-3 left-3 bg-black/60 text-white border-0">Aperçu gratuit</Badge>
                    </div>

                    <div className="text-center">
                      <p className="text-3xl font-bold">Gratuit</p>
                      <p className="text-sm text-muted-foreground">Inclus avec votre abonnement ShopOpti+</p>
                    </div>

                    <Button size="lg" className="w-full h-12 text-base rounded-xl" onClick={() => navigate('/auth?trial=true')}>
                      <Play className="h-5 w-5 mr-2" /> Commencer la formation
                    </Button>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Accès à vie</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />{totalLessons} leçons ({course.duration})</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />{freeLessons} leçons gratuites</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Certificat de réussite</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Ressources téléchargeables</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Support par chat</div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                        <Share2 className="h-4 w-4" /> Partager
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                        <Download className="h-4 w-4" /> Programme PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container mx-auto px-4 sm:px-6 py-12">
          <Tabs defaultValue="curriculum" className="space-y-8">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="curriculum" className="gap-1.5 rounded-lg"><BookOpen className="h-4 w-4" />Programme</TabsTrigger>
              <TabsTrigger value="overview" className="gap-1.5 rounded-lg"><Lightbulb className="h-4 w-4" />Aperçu</TabsTrigger>
              <TabsTrigger value="instructor" className="gap-1.5 rounded-lg"><Users className="h-4 w-4" />Formateur</TabsTrigger>
              <TabsTrigger value="reviews" className="gap-1.5 rounded-lg"><Star className="h-4 w-4" />Avis ({course.reviews.length})</TabsTrigger>
              <TabsTrigger value="faq" className="gap-1.5 rounded-lg"><MessageCircle className="h-4 w-4" />FAQ</TabsTrigger>
            </TabsList>

            {/* Curriculum Tab */}
            <TabsContent value="curriculum" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Programme de la formation</h2>
                  <p className="text-muted-foreground">{course.modules.length} modules · {totalLessons} leçons · {course.duration}</p>
                </div>
                <Badge variant="outline" className="hidden sm:flex gap-1 text-success border-success/20 bg-success/5 dark:bg-green-950/20">
                  <Play className="h-3 w-3" />{freeLessons} leçons gratuites
                </Badge>
              </div>

              <Accordion type="multiple" className="space-y-3" defaultValue={[course.modules[0]?.id]}>
                {course.modules.map((mod, modIdx) => (
                  <AccordionItem key={mod.id} value={mod.id} className="border rounded-xl px-0 overflow-hidden">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-muted/50">
                      <div className="flex items-center gap-4 text-left">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {modIdx + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{mod.title}</p>
                          <p className="text-sm text-muted-foreground">{mod.lessons.length} leçons · {mod.description}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0">
                      <div className="border-t">
                        {mod.lessons.map((lesson, lIdx) => (
                          <div
                            key={lesson.id}
                            className={`flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer ${lIdx < mod.lessons.length - 1 ? 'border-b border-border/50' : ''}`}
                            onClick={() => lesson.free ? setActiveLesson(lesson.id) : undefined}
                          >
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                              {lesson.free ? (
                                <Play className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{lesson.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {typeIcons[lesson.type]}
                                <span>{typeLabels[lesson.type]}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {lesson.free && (
                                <Badge variant="outline" className="text-xs text-success border-success/20 bg-success/5 dark:bg-green-950/20">
                                  Gratuit
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-10">
              <div className="grid lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">À propos de cette formation</h2>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {course.longDescription.split('\n\n').map((p, i) => (
                        <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" /> Prérequis
                    </h3>
                    <ul className="space-y-2">
                      {course.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" /> Ce que vous allez apprendre
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {course.outcomes.map((outcome, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm">{outcome}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" /> Points forts
                    </h3>
                    <ul className="space-y-2">
                      {course.highlights.map((h, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Instructor Tab */}
            <TabsContent value="instructor" className="space-y-6">
              <Card className="border-2">
                <CardContent className="p-8">
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center text-5xl shrink-0">
                      {course.instructor.avatar}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h2 className="text-2xl font-bold">{course.instructor.name}</h2>
                        <p className="text-primary font-medium">{course.instructor.role}</p>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{course.instructor.bio}</p>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
                        <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {course.rating} note</span>
                        <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {course.students} étudiants</span>
                        <span className="flex items-center gap-1"><Video className="h-4 w-4" /> {totalLessons} leçons</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              {course.reviews.length > 0 ? (
                <>
                  <div className="flex items-center gap-6 mb-2">
                    <div className="text-center">
                      <p className="text-5xl font-bold">{course.rating}</p>
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-5 w-5 ${i < Math.floor(course.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{course.reviews.length} avis</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map(stars => {
                        const count = course.reviews.filter(r => r.rating === stars).length;
                        const pct = course.reviews.length ? (count / course.reviews.length) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-2 text-sm">
                            <span className="w-3">{stars}</span>
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <Progress value={pct} className="flex-1 h-2" />
                            <span className="text-muted-foreground w-8 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {course.reviews.map((review, i) => (
                      <Card key={i} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">{review.name}</p>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, j) => (
                                <Star key={j} className={`h-3.5 w-3.5 ${j < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">"{review.text}"</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun avis pour le moment.</p>
                </div>
              )}
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-6">
              {course.faqs.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-2">
                  {course.faqs.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-5">
                      <AccordionTrigger className="hover:no-underline font-medium hover:text-primary">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">FAQ à venir.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* CTA Bottom */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="container mx-auto px-4 sm:px-6 text-center space-y-6 max-w-3xl">
            <h2 className="text-3xl font-bold">Prêt à maîtriser {course.title.toLowerCase()} ?</h2>
            <p className="text-lg text-muted-foreground">
              Rejoignez {course.students} étudiants et commencez votre progression dès aujourd'hui.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="rounded-xl" onClick={() => navigate('/auth?trial=true')}>
                <Play className="h-5 w-5 mr-2" /> Commencer gratuitement
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl" onClick={() => navigate('/academy')}>
                <ArrowLeft className="h-5 w-5 mr-2" /> Voir toutes les formations
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default AcademyCoursePage;
