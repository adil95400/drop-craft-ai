import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Video, Upload, Play, Trash2, Edit, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  category: string;
  duration: string;
  views: number;
  publishedAt: string;
}

export default function VideoTutorialsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock data - remplacer par des vraies données Supabase
  const [tutorials] = useState<VideoTutorial[]>([
    {
      id: '1',
      title: 'Introduction à ShopOpti',
      description: 'Découvrez les fonctionnalités principales de ShopOpti et comment démarrer',
      videoUrl: 'https://example.com/video1.mp4',
      thumbnail: '/placeholder.svg',
      category: 'getting-started',
      duration: '12:34',
      views: 1250,
      publishedAt: '2024-01-15'
    },
    {
      id: '2',
      title: 'Importer des produits depuis AliExpress',
      description: 'Guide complet pour importer et synchroniser vos produits',
      videoUrl: 'https://example.com/video2.mp4',
      thumbnail: '/placeholder.svg',
      category: 'import',
      duration: '18:45',
      views: 890,
      publishedAt: '2024-01-20'
    }
  ]);

  const categories = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'getting-started', label: 'Démarrage' },
    { value: 'import', label: 'Import' },
    { value: 'automation', label: 'Automatisation' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'advanced', label: 'Fonctionnalités avancées' }
  ];

  const handleUploadVideo = () => {
    toast({
      title: 'Upload vidéo',
      description: 'Fonctionnalité d\'upload en cours de développement'
    });
  };

  const handleDeleteVideo = (id: string) => {
    toast({
      title: 'Vidéo supprimée',
      description: `La vidéo ${id} a été supprimée avec succès`
    });
  };

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Vidéos Tutoriels
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez les vidéos tutoriels de la marketplace ShopOpti
          </p>
        </div>
        <Button onClick={handleUploadVideo} className="gap-2">
          <Upload className="h-4 w-4" />
          Uploader une vidéo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Vidéos</p>
                <p className="text-2xl font-bold">{tutorials.length}</p>
              </div>
              <Video className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vues Totales</p>
                <p className="text-2xl font-bold">
                  {tutorials.reduce((sum, t) => sum + t.views, 0).toLocaleString()}
                </p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Durée Totale</p>
                <p className="text-2xl font-bold">2h 45m</p>
              </div>
              <Video className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Catégories</p>
                <p className="text-2xl font-bold">{categories.length - 1}</p>
              </div>
              <Filter className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label>Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par titre ou description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="w-full md:w-64">
              <Label>Catégorie</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutorials.map((tutorial) => (
          <Card key={tutorial.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative aspect-video bg-muted">
              <img 
                src={tutorial.thumbnail} 
                alt={tutorial.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                <Button size="icon" className="rounded-full">
                  <Play className="h-6 w-6" />
                </Button>
              </div>
              <Badge className="absolute top-2 right-2 bg-black/70">
                {tutorial.duration}
              </Badge>
            </div>
            
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg line-clamp-2">{tutorial.title}</CardTitle>
              </div>
              <CardDescription className="line-clamp-2">
                {tutorial.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>{tutorial.views.toLocaleString()} vues</span>
                <span>{new Date(tutorial.publishedAt).toLocaleDateString('fr-FR')}</span>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDeleteVideo(tutorial.id)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTutorials.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune vidéo trouvée pour les critères sélectionnés
          </CardContent>
        </Card>
      )}
    </div>
  );
}
