import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Star, StarOff, Copy, Trash2, Filter, 
  FileText, Tag, Sparkles, Clock, MoreVertical 
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';

interface ContentItem {
  id: string;
  title: string;
  content_type: string;
  content: string;
  metadata: Record<string, unknown>;
  tags: string[];
  is_favorite: boolean;
  usage_count: number;
  ai_generated: boolean;
  created_at: string;
}

const CONTENT_TYPES = {
  all: 'Tout',
  description: 'Descriptions',
  seo_title: 'Titres SEO',
  meta_description: 'Meta Descriptions',
  blog: 'Articles Blog',
  social: 'Posts Sociaux',
  email: 'Emails',
  ad_copy: 'Publicités'
};

export function ContentLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const queryClient = useQueryClient();
  const locale = useDateFnsLocale();

  const { data: contentItems = [], isLoading } = useQuery({
    queryKey: ['content-library', selectedType, showFavorites],
    queryFn: async () => {
      let query = supabase
        .from('content_library')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (selectedType !== 'all') {
        query = query.eq('content_type', selectedType);
      }
      if (showFavorites) {
        query = query.eq('is_favorite', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ContentItem[];
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('content_library')
        .update({ is_favorite: !isFavorite })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-library'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('content_library')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-library'] });
      toast.success('Contenu supprimé');
    }
  });

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copié dans le presse-papier');
  };

  const filteredItems = contentItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      description: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      seo_title: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      meta_description: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      blog: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      social: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      email: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      ad_copy: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans la bibliothèque..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CONTENT_TYPES).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant={showFavorites ? "default" : "outline"}
          onClick={() => setShowFavorites(!showFavorites)}
          className="gap-2"
        >
          <Star className="h-4 w-4" />
          Favoris
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
                <p className="text-2xl font-bold">{contentItems.length}</p>
                <p className="text-sm text-muted-foreground">Total contenus</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {contentItems.filter(i => i.is_favorite).length}
                </p>
                <p className="text-sm text-muted-foreground">Favoris</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {contentItems.filter(i => i.ai_generated).length}
                </p>
                <p className="text-sm text-muted-foreground">Générés par IA</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Copy className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {contentItems.reduce((sum, i) => sum + i.usage_count, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Utilisations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ScrollArea className="h-[600px]">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-20 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Bibliothèque vide</h3>
            <p className="text-muted-foreground">
              Commencez à générer du contenu pour le voir ici
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium truncate">
                        {item.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getTypeColor(item.content_type)}>
                          {CONTENT_TYPES[item.content_type as keyof typeof CONTENT_TYPES] || item.content_type}
                        </Badge>
                        {item.ai_generated && (
                          <Sparkles className="h-3 w-3 text-primary" />
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyToClipboard(item.content)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => toggleFavoriteMutation.mutate({ 
                            id: item.id, 
                            isFavorite: item.is_favorite 
                          })}
                        >
                          {item.is_favorite ? (
                            <>
                              <StarOff className="h-4 w-4 mr-2" />
                              Retirer des favoris
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4 mr-2" />
                              Ajouter aux favoris
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteMutation.mutate(item.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {item.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(item.created_at), 'dd MMM yyyy', { locale })}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.is_favorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                      {item.tags?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {item.tags.length}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
