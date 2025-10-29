import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Video, 
  FileText, 
  Rocket, 
  BookOpen, 
  Award,
  Clock,
  CheckCircle2,
  Play,
  Download,
  TrendingUp,
  Users,
  Zap,
  Target
} from 'lucide-react';

const courses = [
  {
    id: 1,
    title: "Dropshipping : Démarrer de Zéro",
    description: "Apprenez les bases du dropshipping et lancez votre première boutique en ligne",
    level: "Débutant",
    duration: "4h 30min",
    lessons: 12,
    category: "basics",
    completed: false,
    thumbnail: "🚀",
    topics: ["Configuration boutique", "Choix des produits", "Première vente"]
  },
  {
    id: 2,
    title: "Product Research Avancé",
    description: "Maîtrisez les techniques de recherche de produits gagnants avec l'IA",
    level: "Intermédiaire",
    duration: "3h 20min",
    lessons: 10,
    category: "research",
    completed: false,
    thumbnail: "🔍",
    topics: ["Analyse tendances", "Scoring produits", "Validation marché"]
  },
  {
    id: 3,
    title: "Marketing & Publicités Facebook",
    description: "Créez des campagnes publicitaires rentables qui convertissent",
    level: "Intermédiaire",
    duration: "5h 15min",
    lessons: 15,
    category: "marketing",
    completed: false,
    thumbnail: "📱",
    topics: ["Créatives", "Audiences", "Optimisation ROI"]
  },
  {
    id: 4,
    title: "Automatisation avec DropCraft AI",
    description: "Automatisez votre business avec nos outils d'IA avancés",
    level: "Avancé",
    duration: "4h 00min",
    lessons: 11,
    category: "automation",
    completed: false,
    thumbnail: "🤖",
    topics: ["Workflows", "Auto-fulfillment", "Customer intelligence"]
  },
  {
    id: 5,
    title: "Scaling : De 0 à 10k$/mois",
    description: "Stratégies éprouvées pour scaler votre dropshipping store",
    level: "Avancé",
    duration: "6h 30min",
    lessons: 18,
    category: "scaling",
    completed: false,
    thumbnail: "📈",
    topics: ["Expansion catalogue", "Team building", "Systèmes"]
  },
  {
    id: 6,
    title: "Customer Service Excellence",
    description: "Gérez vos clients comme un pro et augmentez votre LTV",
    level: "Intermédiaire",
    duration: "2h 45min",
    lessons: 8,
    category: "customer",
    completed: false,
    thumbnail: "💬",
    topics: ["SAV efficace", "Gestion litiges", "Fidélisation"]
  }
];

const guides = [
  {
    title: "Guide Complet du Winner Product",
    description: "Tous les critères pour identifier un produit gagnant",
    icon: Target,
    downloadUrl: "#",
    pages: 42
  },
  {
    title: "Template : Plan d'Action 30 Jours",
    description: "Roadmap complète pour lancer votre store en 1 mois",
    icon: Rocket,
    downloadUrl: "#",
    pages: 28
  },
  {
    title: "Checklist : Optimisation Boutique",
    description: "100+ points de contrôle pour maximiser vos conversions",
    icon: CheckCircle2,
    downloadUrl: "#",
    pages: 15
  },
  {
    title: "Guide : Analyse Concurrentielle",
    description: "Framework pour analyser et battre vos concurrents",
    icon: TrendingUp,
    downloadUrl: "#",
    pages: 35
  }
];

const webinars = [
  {
    title: "Les Tendances E-commerce 2025",
    date: "15 Janvier 2025",
    speaker: "Expert DropCraft",
    duration: "1h 30min",
    registeredCount: 234,
    isLive: false
  },
  {
    title: "Q&A : Stratégies Gagnantes",
    date: "22 Janvier 2025",
    speaker: "Team DropCraft",
    duration: "2h 00min",
    registeredCount: 156,
    isLive: true
  }
];

export default function AcademyPage() {
  const levelColors = {
    "Débutant": "bg-green-500/10 text-green-500 border-green-500/20",
    "Intermédiaire": "bg-blue-500/10 text-blue-500 border-blue-500/20",
    "Avancé": "bg-purple-500/10 text-purple-500 border-purple-500/20"
  };

  return (
    <>
      <Helmet>
        <title>Academy - Formation Dropshipping | Drop Craft AI</title>
        <meta 
          name="description" 
          content="Formations complètes en dropshipping, e-commerce et automatisation. Cours vidéo, guides pratiques et webinars exclusifs." 
        />
      </Helmet>

      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">DropCraft Academy</span>
          </div>
          
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
            Devenez Expert du Dropshipping
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Formations complètes, guides pratiques et webinars exclusifs pour réussir votre business en ligne
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Heures de formation</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2,450</div>
              <div className="text-sm text-muted-foreground">Étudiants actifs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">98%</div>
              <div className="text-sm text-muted-foreground">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="courses" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 max-w-3xl mx-auto">
            <TabsTrigger value="courses" className="gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Cours Vidéo</span>
            </TabsTrigger>
            <TabsTrigger value="guides" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Guides</span>
            </TabsTrigger>
            <TabsTrigger value="webinars" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Webinars</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Ressources</span>
            </TabsTrigger>
          </TabsList>

          {/* Cours Vidéo */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Parcours de Formation</h2>
                <p className="text-muted-foreground">Progressez à votre rythme avec nos cours structurés</p>
              </div>
              <Button variant="outline" className="gap-2">
                <Award className="h-4 w-4" />
                Mes Certifications
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow group cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-5xl">{course.thumbnail}</div>
                      <Badge 
                        variant="outline" 
                        className={levelColors[course.level as keyof typeof levelColors]}
                      >
                        {course.level}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.lessons} leçons
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {course.topics.slice(0, 2).map((topic, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>

                    <Button className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Play className="h-4 w-4" />
                      Commencer le cours
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Guides PDF */}
          <TabsContent value="guides" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Guides Pratiques</h2>
              <p className="text-muted-foreground">Téléchargez nos ressources exclusives</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guides.map((guide, idx) => (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <guide.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{guide.title}</CardTitle>
                        <CardDescription>{guide.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{guide.pages} pages</span>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Télécharger
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Webinars */}
          <TabsContent value="webinars" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Webinars & Événements</h2>
              <p className="text-muted-foreground">Participez à nos sessions live avec les experts</p>
            </div>

            <div className="space-y-4">
              {webinars.map((webinar, idx) => (
                <Card key={idx}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold">{webinar.title}</h3>
                          {webinar.isLive && (
                            <Badge variant="destructive" className="animate-pulse">
                              🔴 LIVE
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>📅 {webinar.date}</span>
                          <span>👨‍🏫 {webinar.speaker}</span>
                          <span>⏱️ {webinar.duration}</span>
                          <span>👥 {webinar.registeredCount} inscrits</span>
                        </div>
                      </div>
                      <Button size="lg" className="gap-2">
                        <Play className="h-4 w-4" />
                        {webinar.isLive ? "Rejoindre" : "S'inscrire"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Ressources */}
          <TabsContent value="resources" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Ressources Complémentaires</h2>
              <p className="text-muted-foreground">Outils et templates pour accélérer votre succès</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Templates Shopify
                  </CardTitle>
                  <CardDescription>
                    10+ thèmes optimisés pour la conversion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Accéder</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Scripts de Pub
                  </CardTitle>
                  <CardDescription>
                    Bibliothèque de scripts testés et validés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Accéder</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Liste Fournisseurs
                  </CardTitle>
                  <CardDescription>
                    100+ fournisseurs vérifiés et fiables
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Accéder</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
