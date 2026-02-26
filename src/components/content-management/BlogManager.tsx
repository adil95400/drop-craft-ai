import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, FileText, Eye, Edit, Trash2, Search, 
  Calendar, Tag, Sparkles, MoreVertical, Image,
  Send, Clock, CheckCircle, XCircle, Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';
import { RichTextEditor } from './RichTextEditor';
import { AIContentAssistant } from './AIContentAssistant';
import { SEOAnalyzer } from './SEOAnalyzer';
import { ContentVersions } from './ContentVersions';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  status: string;
  category: string | null;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  image_url: string | null;
  publish_date: string | null;
  views: number;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', icon: Clock },
  scheduled: { label: 'Planifié', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Calendar },
  published: { label: 'Publié', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
  archived: { label: 'Archivé', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle }
};

const CATEGORIES = ['Actualités', 'Tutoriels', 'Guides', 'Études de cas', 'Annonces', 'E-commerce', 'Marketing'];

export function BlogManager() {
  const locale = useDateFnsLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft',
    category: '',
    tags: '',
    seo_title: '',
    seo_description: '',
    image_url: '',
    publish_date: ''
  });
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts', selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');
      
      const tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      const { error } = await supabase
        .from('blog_posts')
        .insert({
          user_id: userData.user.id,
          title: data.title,
          content: data.content,
          excerpt: data.excerpt || null,
          status: data.status,
          category: data.category || null,
          tags,
          seo_title: data.seo_title || null,
          seo_description: data.seo_description || null,
          image_url: data.image_url || null,
          publish_date: data.publish_date || null
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Article créé');
      resetForm();
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & typeof formData) => {
      const tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      const { error } = await supabase
        .from('blog_posts')
        .update({
          title: data.title,
          content: data.content,
          excerpt: data.excerpt || null,
          status: data.status,
          category: data.category || null,
          tags,
          seo_title: data.seo_title || null,
          seo_description: data.seo_description || null,
          image_url: data.image_url || null,
          publish_date: data.publish_date || null
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Article mis à jour');
      resetForm();
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
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Article supprimé');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: { status: string; publish_date?: string } = { status };
      if (status === 'published') {
        updateData.publish_date = new Date().toISOString();
      }
      const { error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Statut mis à jour');
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      status: 'draft',
      category: '',
      tags: '',
      seo_title: '',
      seo_description: '',
      image_url: '',
      publish_date: ''
    });
    setEditingPost(null);
    setIsDialogOpen(false);
    setActiveTab('content');
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      status: post.status,
      category: post.category || '',
      tags: post.tags?.join(', ') || '',
      seo_title: post.seo_title || '',
      seo_description: post.seo_description || '',
      image_url: post.image_url || '',
      publish_date: post.publish_date ? format(new Date(post.publish_date), "yyyy-MM-dd'T'HH:mm") : ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Titre et contenu sont requis');
      return;
    }

    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    draft: posts.filter(p => p.status === 'draft').length,
    views: posts.reduce((sum, p) => sum + (p.views || 0), 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {Object.entries(STATUS_OPTIONS).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel Article
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total articles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.published}</p>
                <p className="text-sm text-muted-foreground">Publiés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.draft}</p>
                <p className="text-sm text-muted-foreground">Brouillons</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.views}</p>
                <p className="text-sm text-muted-foreground">Vues totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ScrollArea className="h-[600px]">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Aucun article</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre premier article de blog
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un article
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => {
              const statusConfig = STATUS_OPTIONS[post.status as keyof typeof STATUS_OPTIONS] || STATUS_OPTIONS.draft;
              const StatusIcon = statusConfig.icon;
              return (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {post.image_url ? (
                        <img 
                          src={post.image_url} 
                          alt={post.title}
                          className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-24 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <Image className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold truncate flex items-center gap-2">
                              {post.title}
                              {post.ai_generated && (
                                <Sparkles className="h-4 w-4 text-primary" />
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                              {post.excerpt || post.content.substring(0, 100)}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(post)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              {post.status === 'draft' && (
                                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: post.id, status: 'published' })}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Publier
                                </DropdownMenuItem>
                              )}
                              {post.status === 'published' && (
                                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: post.id, status: 'draft' })}>
                                  <Clock className="h-4 w-4 mr-2" />
                                  Dépublier
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => deleteMutation.mutate(post.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <Badge variant="secondary" className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          {post.category && (
                            <Badge variant="outline">{post.category}</Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.views || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(post.created_at), 'dd MMM yyyy', { locale })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? 'Modifier l\'article' : 'Nouvel article'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="content">Contenu</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="settings">Paramètres</TabsTrigger>
              <TabsTrigger value="preview">Aperçu</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label>Titre de l'article</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAIAssistantOpen(true)}
                  className="gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Assistance IA
                </Button>
              </div>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Entrez le titre de l'article"
              />
              <div className="space-y-2">
                <Label>Extrait (optionnel)</Label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Résumé court de l'article..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Contenu</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Écrivez votre article ici..."
                  minHeight="350px"
                  onAIAssist={() => setIsAIAssistantOpen(true)}
                />
              </div>
            </TabsContent>

            <TabsContent value="seo" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Titre SEO</Label>
                    <Input
                      value={formData.seo_title}
                      onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                      placeholder="Titre optimisé pour les moteurs de recherche"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.seo_title.length}/60 caractères recommandés
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Meta description</Label>
                    <Textarea
                      value={formData.seo_description}
                      onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                      placeholder="Description pour les résultats de recherche"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.seo_description.length}/160 caractères recommandés
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Tags (séparés par des virgules)</Label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="e-commerce, marketing, conseils"
                    />
                  </div>
                </div>
                <SEOAnalyzer
                  title={formData.seo_title || formData.title}
                  content={formData.content}
                  metaDescription={formData.seo_description}
                  focusKeyword={formData.tags.split(',')[0]?.trim()}
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_OPTIONS).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL de l'image</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.image_url && (
                  <img 
                    src={formData.image_url} 
                    alt="Aperçu" 
                    className="w-full max-h-48 object-cover rounded-lg mt-2"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Date de publication</Label>
                <Input
                  type="datetime-local"
                  value={formData.publish_date}
                  onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                />
              </div>
              {editingPost && (
                <ContentVersions
                  contentId={editingPost.id}
                  contentType="blog"
                  currentContent={formData.content}
                  onRestore={(content) => setFormData({ ...formData, content })}
                />
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {formData.image_url && (
                    <img 
                      src={formData.image_url} 
                      alt={formData.title} 
                      className="w-full h-64 object-cover rounded-lg mb-6"
                    />
                  )}
                  <h1 className="text-3xl font-bold mb-4">{formData.title || 'Titre de l\'article'}</h1>
                  {formData.excerpt && (
                    <p className="text-lg text-muted-foreground mb-6 italic">{formData.excerpt}</p>
                  )}
                  <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
                    {formData.category && <Badge variant="secondary">{formData.category}</Badge>}
                    {formData.tags && formData.tags.split(',').slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="outline">{tag.trim()}</Badge>
                    ))}
                  </div>
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-base">
                      {formData.content || 'Le contenu de votre article apparaîtra ici...'}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between">
            <div>
              {editingPost && (
                <ContentVersions
                  contentId={editingPost.id}
                  contentType="blog"
                  currentContent={formData.content}
                  onRestore={(content) => setFormData({ ...formData, content })}
                />
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetForm}>
                Annuler
              </Button>
              <Button onClick={handleSubmit}>
                {editingPost ? 'Mettre à jour' : 'Créer l\'article'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AIContentAssistant
        open={isAIAssistantOpen}
        onOpenChange={setIsAIAssistantOpen}
        initialContent={formData.content}
        onApply={(content) => setFormData({ ...formData, content })}
        contentType="blog"
      />
    </div>
  );
}
