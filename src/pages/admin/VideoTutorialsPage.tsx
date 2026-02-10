import { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Video, Upload, Play, Trash2, Edit, Search, Filter, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  category: string;
  duration: string;
  views: number;
  created_at: string;
}

export default function VideoTutorialsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    category: 'getting-started',
    duration: ''
  });

  // Fetch tutorials from blog_posts table with category = 'video_tutorial'
  const { data: tutorials = [], isLoading } = useQuery({
    queryKey: ['video-tutorials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('category', 'video_tutorial')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item): VideoTutorial => ({
        id: item.id,
        title: item.title,
        description: item.excerpt || item.content || '',
        video_url: item.image_url || '',
        thumbnail_url: item.seo_title || '/placeholder.svg',
        category: item.seo_description || 'getting-started',
        duration: '00:00',
        views: item.views || 0,
        created_at: item.created_at || new Date().toISOString()
      }));
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (videoData: typeof newVideo) => {
      const { error } = await supabase
        .from('blog_posts')
        .insert({
          user_id: user?.id || '',
          title: videoData.title,
          content: videoData.description,
          excerpt: videoData.description,
          category: 'video_tutorial',
          image_url: videoData.video_url,
          seo_title: videoData.thumbnail_url || '/placeholder.svg',
          seo_description: videoData.category,
          status: 'published'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Vidéo ajoutée avec succès' });
      queryClient.invalidateQueries({ queryKey: ['video-tutorials'] });
      setIsUploadDialogOpen(false);
      setNewVideo({ title: '', description: '', video_url: '', thumbnail_url: '', category: 'getting-started', duration: '' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible d\'ajouter la vidéo', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Vidéo supprimée' });
      queryClient.invalidateQueries({ queryKey: ['video-tutorials'] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de supprimer la vidéo', variant: 'destructive' });
    }
  });

  const categories = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'getting-started', label: 'Démarrage' },
    { value: 'import', label: 'Import' },
    { value: 'automation', label: 'Automatisation' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'advanced', label: 'Fonctionnalités avancées' }
  ];

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement des vidéos...</p>
        </div>
      </div>
    );
  }

  return (
    <ChannablePageWrapper
      title="Vidéos Tutoriels"
      description="Gérez les vidéos tutoriels de la marketplace ShopOpti"
      heroImage="support"
      badge={{ label: 'Tutoriels', icon: Video }}
    >
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Uploader une vidéo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une vidéo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Titre *</Label>
                <Input
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  placeholder="Titre de la vidéo"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newVideo.description}
                  onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                  placeholder="Description de la vidéo"
                />
              </div>
              <div>
                <Label>URL de la vidéo *</Label>
                <Input
                  value={newVideo.video_url}
                  onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Catégorie</Label>
                  <Select value={newVideo.category} onValueChange={(v) => setNewVideo({ ...newVideo, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.value !== 'all').map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Durée</Label>
                  <Input
                    value={newVideo.duration}
                    onChange={(e) => setNewVideo({ ...newVideo, duration: e.target.value })}
                    placeholder="12:34"
                  />
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => uploadMutation.mutate(newVideo)}
                disabled={!newVideo.title || !newVideo.video_url || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Ajouter la vidéo
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
                <p className="text-sm text-muted-foreground">Catégories</p>
                <p className="text-2xl font-bold">{categories.length - 1}</p>
              </div>
              <Filter className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ce mois</p>
                <p className="text-2xl font-bold">
                  {tutorials.filter(t => {
                    const created = new Date(t.created_at);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Video className="h-8 w-8 text-blue-500" />
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
                src={tutorial.thumbnail_url} 
                alt={tutorial.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                <Button 
                  size="icon" 
                  className="rounded-full"
                  onClick={() => window.open(tutorial.video_url, '_blank')}
                >
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
                <span>{new Date(tutorial.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => deleteMutation.mutate(tutorial.id)}
                  disabled={deleteMutation.isPending}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTutorials.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune vidéo trouvée</h3>
            <p className="text-muted-foreground mb-4">
              {tutorials.length === 0 
                ? 'Commencez par ajouter votre première vidéo tutoriel' 
                : 'Aucune vidéo ne correspond aux critères sélectionnés'}
            </p>
            <Button onClick={() => setIsUploadDialogOpen(true)}>Ajouter une vidéo</Button>
          </CardContent>
        </Card>
      )}
    </ChannablePageWrapper>
  );
}
