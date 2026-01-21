/**
 * Page des tutoriels de l'extension Chrome
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Clock, 
  Star, 
  ShoppingCart,
  RefreshCw,
  Target,
  Settings,
  Zap,
  ArrowRight,
  BookOpen,
  Video,
  GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function ExtensionTutorialsPage() {
  const navigate = useNavigate();

  const tutorials = [
    {
      id: 1,
      title: "Premier import de produit",
      description: "Apprenez à importer votre premier produit depuis AliExpress en moins de 2 minutes",
      duration: "2 min",
      level: "Débutant",
      icon: <ShoppingCart className="h-6 w-6" />,
      category: "Import"
    },
    {
      id: 2,
      title: "Configurer la surveillance des prix",
      description: "Activez les alertes automatiques pour être notifié des changements de prix",
      duration: "3 min",
      level: "Débutant",
      icon: <RefreshCw className="h-6 w-6" />,
      category: "Prix"
    },
    {
      id: 3,
      title: "Import d'avis clients avec photos",
      description: "Récupérez les avis et photos clients pour enrichir vos fiches produits",
      duration: "4 min",
      level: "Intermédiaire",
      icon: <Star className="h-6 w-6" />,
      category: "Avis"
    },
    {
      id: 4,
      title: "Configuration de l'Auto-Order",
      description: "Automatisez vos commandes fournisseurs pour gagner du temps",
      duration: "5 min",
      level: "Avancé",
      icon: <Target className="h-6 w-6" />,
      category: "Automatisation"
    },
    {
      id: 5,
      title: "Paramètres avancés de l'extension",
      description: "Personnalisez tous les paramètres pour optimiser votre workflow",
      duration: "4 min",
      level: "Intermédiaire",
      icon: <Settings className="h-6 w-6" />,
      category: "Configuration"
    },
    {
      id: 6,
      title: "Import en masse de produits",
      description: "Importez plusieurs produits simultanément avec les options de lot",
      duration: "6 min",
      level: "Avancé",
      icon: <Zap className="h-6 w-6" />,
      category: "Import"
    }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Débutant': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'Intermédiaire': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'Avancé': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return '';
    }
  };

  return (
    <ChannablePageWrapper
      title="Tutoriels Extension"
      subtitle="Guides Vidéo"
      description="Apprenez à utiliser toutes les fonctionnalités de l'extension ShopOpti+ avec nos tutoriels"
      heroImage="extensions"
      badge={{ label: 'Formation', icon: GraduationCap }}
    >
      {/* Quick Start */}
      <Card className="bg-gradient-to-br from-primary/5 to-blue-500/5 border-primary/20">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-full md:w-64 h-40 bg-slate-800 rounded-xl flex items-center justify-center relative group cursor-pointer">
            <Play className="h-16 w-16 text-white group-hover:scale-110 transition-transform" />
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              5:30
            </div>
          </div>
          <div className="flex-1">
            <Badge className="mb-2">Recommandé</Badge>
            <h3 className="text-xl font-semibold">Guide de Démarrage Complet</h3>
            <p className="text-muted-foreground mt-2">
              Découvrez toutes les fonctionnalités principales de l'extension en une seule vidéo. 
              Installation, premier import, configuration des alertes et plus encore.
            </p>
            <Button className="mt-4">
              <Play className="h-4 w-4 mr-2" />
              Regarder le tutoriel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tutorial Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tutorials.map((tutorial) => (
          <Card key={tutorial.id} className="group cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  {tutorial.icon}
                </div>
                <Badge variant="outline" className={getLevelColor(tutorial.level)}>
                  {tutorial.level}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-3">{tutorial.title}</CardTitle>
              <CardDescription>{tutorial.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {tutorial.duration}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {tutorial.category}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm">
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Text Guides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Guides Textuels
          </CardTitle>
          <CardDescription>
            Préférez-vous lire ? Consultez nos guides détaillés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { title: "Installation pas à pas", path: "/extensions/download" },
              { title: "Documentation complète", path: "/extensions/documentation" },
              { title: "FAQ et dépannage", path: "/extensions/faq" }
            ].map((guide) => (
              <div 
                key={guide.path}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(guide.path)}
              >
                <span className="font-medium">{guide.title}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Need Help */}
      <Card className="bg-muted/30">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Video className="h-10 w-10 text-primary" />
            <div>
              <h3 className="font-semibold">Vous ne trouvez pas ce que vous cherchez ?</h3>
              <p className="text-sm text-muted-foreground">
                Contactez notre support ou suggérez un nouveau tutoriel
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/support')}>
            Contacter le Support
          </Button>
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  );
}
