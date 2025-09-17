import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  Calendar,
  TrendingUp,
  FileText,
  Users,
  Share2
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  category: string;
  tags: string[];
  author: string;
  views: number;
  publish_date: string;
  created_at: string;
  seo_title?: string;
  seo_description?: string;
  ai_generated: boolean;
}

const AdminBlog = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      // Simulate fetching blog posts
      const mockPosts: BlogPost[] = [
        {
          id: '1',
          title: 'Comment optimiser votre boutique en ligne',
          excerpt: 'Découvrez les meilleures stratégies pour augmenter vos ventes...',
          content: '...',
          status: 'published',
          category: 'E-commerce',
          tags: ['SEO', 'Conversion', 'UX'],
          author: 'Admin',
          views: 1250,
          publish_date: '2024-01-15',
          created_at: '2024-01-10T10:00:00Z',
          seo_title: 'Optimisation boutique en ligne - Guide complet',
          seo_description: 'Guide complet pour optimiser votre boutique en ligne et augmenter vos ventes',
          ai_generated: false
        },
        {
          id: '2',
          title: 'IA et E-commerce : Revolution en cours',
          excerpt: 'Comment l\'intelligence artificielle transforme le commerce en ligne...',
          content: '...',
          status: 'published',
          category: 'Innovation',
          tags: ['IA', 'Automation', 'Future'],
          author: 'IA Assistant',
          views: 850,
          publish_date: '2024-01-20',
          created_at: '2024-01-18T14:30:00Z',
          ai_generated: true
        }
      ];
      setPosts(mockPosts);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les articles de blog",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: BlogPost['status']) => {
    switch (status) {
      case 'published':
        return <Badge variant="default">Publié</Badge>;
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'archived':
        return <Badge variant="outline">Archivé</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion Blog</h1>
          <p className="text-muted-foreground">Gérez vos articles de blog et contenus marketing</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nouvel Article
        </Button>
      </div>

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="posts">Articles</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher articles..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Importer
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{post.title}</CardTitle>
                        {post.ai_generated && (
                          <Badge variant="outline" className="text-xs">
                            IA
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{post.excerpt}</CardDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {post.publish_date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.views.toLocaleString()} vues
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {post.author}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(post.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{post.category}</Badge>
                      {post.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Articles Totaux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">+3 ce mois</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Vues Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12.5K</div>
                <p className="text-xs text-muted-foreground">+15% vs mois dernier</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Taux Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.2%</div>
                <p className="text-xs text-muted-foreground">+0.5% vs mois dernier</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Articles IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">33% du contenu</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Score SEO Moyen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">87</div>
                <p className="text-xs text-muted-foreground">+5 points vs mois dernier</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Mots-clés Classés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">+23 nouveaux</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Trafic Organique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.9K</div>
                <p className="text-xs text-muted-foreground">+28% ce mois</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBlog;