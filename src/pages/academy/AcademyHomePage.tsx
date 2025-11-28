import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Play, Book, Clock, Star, Search, TrendingUp, Users, Zap, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AcademyHomePage = () => {
  const navigate = useNavigate();

  const courses = [
    {
      title: 'Démarrer en dropshipping',
      description: 'Apprenez les fondamentaux du dropshipping et lancez votre première boutique en 7 jours',
      duration: '4h 30min',
      lessons: 24,
      level: 'Débutant',
      students: '5.2k',
      rating: 4.9,
      category: 'Dropshipping',
      image: '🚀'
    },
    {
      title: 'Optimisation IA avancée',
      description: 'Maîtrisez les outils d\'IA pour automatiser et optimiser votre catalogue produits',
      duration: '3h 15min',
      lessons: 18,
      level: 'Intermédiaire',
      students: '3.8k',
      rating: 4.8,
      category: 'IA',
      image: '🤖'
    },
    {
      title: 'Marketing automation',
      description: 'Créez des campagnes automatisées et augmentez vos conversions de 40%',
      duration: '2h 45min',
      lessons: 15,
      level: 'Intermédiaire',
      students: '4.1k',
      rating: 4.7,
      category: 'Marketing',
      image: '📧'
    },
    {
      title: 'Multi-marketplace mastery',
      description: 'Gérez efficacement plusieurs boutiques et marketplaces depuis une seule interface',
      duration: '5h 00min',
      lessons: 28,
      level: 'Avancé',
      students: '2.3k',
      rating: 4.9,
      category: 'Multi-boutiques',
      image: '🌐'
    },
    {
      title: 'SEO pour e-commerce',
      description: 'Optimisez votre référencement et multipliez votre trafic organique',
      duration: '3h 30min',
      lessons: 20,
      level: 'Intermédiaire',
      students: '6.7k',
      rating: 4.8,
      category: 'SEO',
      image: '🔍'
    },
    {
      title: 'Analytics & Business Intelligence',
      description: 'Prenez de meilleures décisions grâce aux données et prévisions IA',
      duration: '2h 20min',
      lessons: 12,
      level: 'Tous niveaux',
      students: '4.5k',
      rating: 4.6,
      category: 'Analytics',
      image: '📊'
    }
  ];

  const categories = [
    { name: 'Tous les cours', count: 42, icon: Book },
    { name: 'Dropshipping', count: 12, icon: Target },
    { name: 'IA & Automation', count: 8, icon: Zap },
    { name: 'Marketing', count: 10, icon: TrendingUp },
    { name: 'Analytics', count: 6, icon: Star },
    { name: 'Avancé', count: 6, icon: Users }
  ];

  return (
    <PublicLayout>
      <Helmet>
        <title>Académie ShopOpti - Formations E-commerce</title>
        <meta name="description" content="Formations complètes en dropshipping, automatisation IA, marketing et analytics. Apprenez de zéro à expert." />
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
                42 formations complètes pour maîtriser le dropshipping, l'IA et l'automatisation. 
                De débutant à expert en quelques semaines.
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto pt-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une formation..."
                  className="pl-12 h-12 text-base"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <Button key={index} variant="outline" size="lg" className="gap-2">
                    <Icon className="h-4 w-4" />
                    {category.name}
                    <Badge variant="secondary" className="ml-2">{category.count}</Badge>
                  </Button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Courses Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Formations populaires</h2>
              <p className="text-lg text-muted-foreground">
                Rejoignez plus de 20 000 apprenants et développez vos compétences
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <Card key={index} className="hover:shadow-lg transition-all overflow-hidden group">
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-6xl">
                    {course.image}
                  </div>
                  <CardHeader>
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
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        {course.lessons} leçons
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="secondary">{course.level}</Badge>
                      <span className="text-muted-foreground">{course.students} étudiants</span>
                    </div>
                    <Button className="w-full group-hover:bg-primary/90" onClick={() => navigate('/academy/course/' + index)}>
                      <Play className="h-4 w-4 mr-2" />
                      Commencer
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-6 max-w-2xl mx-auto">
              <GraduationCap className="h-16 w-16 mx-auto text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">
                Prêt à devenir un expert ?
              </h2>
              <p className="text-lg text-muted-foreground">
                Accédez à toutes nos formations avec un compte ShopOpti Pro
              </p>
              <Button size="lg" onClick={() => navigate('/auth')}>
                Commencer gratuitement
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default AcademyHomePage;
