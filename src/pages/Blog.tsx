import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Edit3, Eye, Plus, Sparkles, Tag, TrendingUp } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useBlog, type BlogConfig } from "@/hooks/useBlog";

const Blog = () => {
  const { posts, stats, generating, generatePost, editPost, previewPost, publishPost } = useBlog();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [blogConfig, setBlogConfig] = useState<BlogConfig>({
    subject: "",
    category: "Tendances",
    keywords: "",
    length: "medium",
    tone: "professional",
    instructions: "",
    includeImages: true,
    autoPublish: false
  });

  const handleCreatePost = () => {
    if (!blogConfig.subject.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un sujet pour l'article",
        variant: "destructive"
      });
      return;
    }
    
    generatePost(blogConfig);
  };

  const handleConfigChange = (field: keyof BlogConfig, value: any) => {
    setBlogConfig(prev => ({ ...prev, [field]: value }));
  };

  const categories = ["Tendances", "Marketing", "SEO", "Analyses", "Guides", "Actualités"];

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Blog IA
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Créez du contenu automatiquement avec l'intelligence artificielle
            </p>
          </div>
          <Button className="bg-gradient-primary hover:opacity-90 transition-opacity" onClick={handleCreatePost}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Article IA
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Articles Publiés</p>
                  <p className="text-2xl font-bold text-primary">{stats.published}</p>
                </div>
                <Edit3 className="w-8 h-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vues Totales</p>
                  <p className="text-2xl font-bold text-secondary">{stats.totalViews.toLocaleString()}</p>
                </div>
                <Eye className="w-8 h-8 text-secondary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Programmés</p>
                  <p className="text-2xl font-bold text-accent">{stats.scheduled}</p>
                </div>
                <Clock className="w-8 h-8 text-accent/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">IA Générés</p>
                  <p className="text-2xl font-bold text-gradient">{stats.aiGenerated}</p>
                </div>
                <Sparkles className="w-8 h-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="bg-muted/50 border border-border/50">
            <TabsTrigger value="posts">Articles</TabsTrigger>
            <TabsTrigger value="generator">Générateur IA</TabsTrigger>
            <TabsTrigger value="scheduler">Planificateur</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="scheduled">Programmé</SelectItem>
                </SelectContent>
              </Select>

              <Input 
                placeholder="Rechercher un article..." 
                className="flex-1 min-w-[300px]"
              />
            </div>

            {/* Posts List */}
            <div className="grid gap-4">
              {posts.map((post) => (
                <Card key={post.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4 justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-xl font-semibold text-foreground">{post.title}</h3>
                          {post.ai_generated && (
                            <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground">
                              <Sparkles className="w-3 h-3 mr-1" />
                              IA
                            </Badge>
                          )}
                          <Badge variant={
                            post.status === 'published' ? 'default' : 
                            post.status === 'draft' ? 'secondary' : 'outline'
                          }>
                            {post.status === 'published' ? 'Publié' : 
                             post.status === 'draft' ? 'Brouillon' : 'Programmé'}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground">{post.excerpt}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            {post.category}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                             {new Date(post.publish_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {post.views} vues
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => editPost(post.id)}
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => previewPost(post.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="generator" className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Générateur d'Articles IA
                </CardTitle>
                <CardDescription>
                  Créez automatiquement du contenu optimisé SEO avec l'IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Sujet Principal</label>
                      <Input 
                        placeholder="Ex: Produits tendance dropshipping 2024" 
                        value={blogConfig.subject}
                        onChange={(e) => handleConfigChange('subject', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Catégorie</label>
                      <Select value={blogConfig.category} onValueChange={(value) => handleConfigChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Mots-clés SEO</label>
                      <Input 
                        placeholder="dropshipping, ecommerce, tendances..." 
                        value={blogConfig.keywords}
                        onChange={(e) => handleConfigChange('keywords', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Longueur d'article</label>
                      <Select value={blogConfig.length} onValueChange={(value) => handleConfigChange('length', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Court (800-1200 mots)</SelectItem>
                          <SelectItem value="medium">Moyen (1200-2000 mots)</SelectItem>
                          <SelectItem value="long">Long (2000+ mots)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Ton de l'article</label>
                      <Select defaultValue="professional">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professionnel</SelectItem>
                          <SelectItem value="casual">Décontracté</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                          <SelectItem value="beginner">Débutant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Instructions spéciales</label>
                      <Textarea 
                        placeholder="Ajoutez des instructions spécifiques pour l'IA..."
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="include-images" defaultChecked />
                      <label htmlFor="include-images" className="text-sm">
                        Générer des images avec DALL-E
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="auto-publish" />
                      <label htmlFor="auto-publish" className="text-sm">
                        Publier automatiquement
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    className="bg-gradient-primary hover:opacity-90 transition-opacity flex-1"
                    onClick={handleCreatePost}
                    disabled={generating}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generating ? "Génération..." : "Générer l'Article IA"}
                  </Button>
                  <Button variant="outline">
                    Aperçu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduler" className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Planificateur de Contenu
                </CardTitle>
                <CardDescription>
                  Programmez vos publications pour maximiser l'engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="h-64 border border-border rounded-lg flex items-center justify-center text-muted-foreground">
                      Calendrier de planification (à implémenter)
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Articles Programmés</h3>
                    <div className="space-y-2">
                      {posts.filter(p => p.status === 'scheduled').map(post => (
                        <div key={post.id} className="p-3 border border-border rounded-lg">
                          <p className="font-medium text-sm">{post.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.publish_date).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Performance des Articles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 border border-border rounded-lg flex items-center justify-center text-muted-foreground">
                    Graphique des vues (à implémenter)
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Top Articles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {posts
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 3)
                    .map((post, index) => (
                    <div key={post.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{post.title}</p>
                        <p className="text-xs text-muted-foreground">{post.views} vues</p>
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
};

export default Blog;