import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Languages, Globe, Plus, Sparkles, Check, Clock, AlertCircle,
  Edit, Trash2, RefreshCw, Eye, ArrowRight, Search, Flag
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SupportedLanguage {
  id: string;
  code: string;
  name: string;
  native_name: string;
  is_default: boolean;
  is_active: boolean;
  url_prefix: string | null;
}

interface Translation {
  id: string;
  content_id: string;
  content_type: string;
  source_language: string;
  target_language: string;
  original_content: Record<string, string>;
  translated_content: Record<string, string>;
  translation_status: string;
  translator_type: string;
  quality_score: number | null;
  created_at: string;
  updated_at: string;
}

const AVAILABLE_LANGUAGES = [
  { code: 'fr', name: 'Français', native_name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'Anglais', native_name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Espagnol', native_name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Allemand', native_name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italien', native_name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portugais', native_name: 'Português', flag: '🇵🇹' },
  { code: 'nl', name: 'Néerlandais', native_name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polonais', native_name: 'Polski', flag: '🇵🇱' },
  { code: 'ar', name: 'Arabe', native_name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinois', native_name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japonais', native_name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Coréen', native_name: '한국어', flag: '🇰🇷' },
];

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'bg-gray-500', icon: Clock },
  pending_review: { label: 'En révision', color: 'bg-yellow-500', icon: AlertCircle },
  approved: { label: 'Approuvé', color: 'bg-green-500', icon: Check },
  published: { label: 'Publié', color: 'bg-blue-500', icon: Globe },
};

export function TranslationManager() {
  const [activeTab, setActiveTab] = useState('languages');
  const [isAddLanguageOpen, setIsAddLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);
  const [translationInProgress, setTranslationInProgress] = useState(false);
  const queryClient = useQueryClient();

  const { data: languages = [], isLoading: loadingLanguages } = useQuery({
    queryKey: ['supported-languages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supported_languages')
        .select('*')
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data as SupportedLanguage[];
    }
  });

  const { data: translations = [], isLoading: loadingTranslations } = useQuery({
    queryKey: ['content-translations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_translations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Translation[];
    }
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['blog-posts-for-translation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, content, excerpt, seo_description')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const addLanguageMutation = useMutation({
    mutationFn: async (langCode: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const lang = AVAILABLE_LANGUAGES.find(l => l.code === langCode);
      if (!lang) throw new Error('Langue non trouvée');

      const { error } = await supabase
        .from('supported_languages')
        .insert({
          user_id: user.id,
          code: lang.code,
          name: lang.name,
          native_name: lang.native_name,
          url_prefix: `/${lang.code}/`,
          is_default: languages.length === 0,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supported-languages'] });
      setIsAddLanguageOpen(false);
      setSelectedLanguage('');
      toast.success('Langue ajoutée');
    }
  });

  const deleteLanguageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('supported_languages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supported-languages'] });
      toast.success('Langue supprimée');
    }
  });

  const translateContentMutation = useMutation({
    mutationFn: async ({ contentId, contentType, targetLanguage, content }: {
      contentId: string;
      contentType: string;
      targetLanguage: string;
      content: Record<string, string>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      setTranslationInProgress(true);

      // Call AI for translation
      const response = await supabase.functions.invoke('ai-content-generator', {
        body: {
          action: 'translate',
          content: JSON.stringify(content),
          language: targetLanguage,
        }
      });

      if (response.error) throw response.error;

      const translatedContent = response.data.result;

      // Parse the translated content
      let parsedTranslation: Record<string, string>;
      try {
        parsedTranslation = JSON.parse(translatedContent);
      } catch {
        // If not JSON, assume it's a simple translation
        parsedTranslation = { content: translatedContent };
      }

      const { error } = await supabase
        .from('content_translations')
        .upsert({
          user_id: user.id,
          content_id: contentId,
          content_type: contentType,
          source_language: 'fr',
          target_language: targetLanguage,
          original_content: content,
          translated_content: parsedTranslation,
          translation_status: 'pending_review',
          translator_type: 'ai',
        }, {
          onConflict: 'content_id,target_language'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-translations'] });
      setTranslationInProgress(false);
      toast.success('Traduction générée');
    },
    onError: (error) => {
      setTranslationInProgress(false);
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const updateTranslationStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('content_translations')
        .update({ translation_status: status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-translations'] });
      toast.success('Statut mis à jour');
    }
  });

  const getLanguageInfo = (code: string) => {
    return AVAILABLE_LANGUAGES.find(l => l.code === code) || { flag: '🏳️', name: code };
  };

  const translationStats = {
    total: translations.length,
    draft: translations.filter(t => t.translation_status === 'draft').length,
    pending: translations.filter(t => t.translation_status === 'pending_review').length,
    approved: translations.filter(t => t.translation_status === 'approved').length,
    published: translations.filter(t => t.translation_status === 'published').length,
  };

  const availableToAdd = AVAILABLE_LANGUAGES.filter(
    l => !languages.some(lang => lang.code === l.code)
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="languages" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Langues
          </TabsTrigger>
          <TabsTrigger value="translations" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Traductions
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Workflow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="languages" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{languages.length}</p>
                  <p className="text-xs text-muted-foreground">Langues actives</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Languages className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{translationStats.total}</p>
                  <p className="text-xs text-muted-foreground">Traductions</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{translationStats.pending}</p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{translationStats.published}</p>
                  <p className="text-xs text-muted-foreground">Publiées</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Languages list */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Langues configurées</CardTitle>
              <Dialog open={isAddLanguageOpen} onOpenChange={setIsAddLanguageOpen}>
                <Button size="sm" onClick={() => setIsAddLanguageOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter une langue</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <Label>Sélectionner une langue</Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une langue" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableToAdd.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.name}</span>
                              <span className="text-muted-foreground">({lang.native_name})</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddLanguageOpen(false)}>
                      Annuler
                    </Button>
                    <Button
                      onClick={() => addLanguageMutation.mutate(selectedLanguage)}
                      disabled={!selectedLanguage}
                    >
                      Ajouter
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {languages.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune langue configurée</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {languages.map((lang) => {
                    const langInfo = getLanguageInfo(lang.code);
                    return (
                      <div
                        key={lang.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{langInfo.flag}</span>
                          <div>
                            <p className="font-medium">{lang.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {lang.native_name} • {lang.url_prefix}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {lang.is_default && (
                            <Badge>Par défaut</Badge>
                          )}
                          <Badge variant={lang.is_active ? 'default' : 'secondary'}>
                            {lang.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                          {!lang.is_default && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteLanguageMutation.mutate(lang.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="translations" className="space-y-6">
          {/* Quick translate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Traduction rapide IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Contenu à traduire" />
                  </SelectTrigger>
                  <SelectContent>
                    {blogPosts.map((post) => (
                      <SelectItem key={post.id} value={post.id}>
                        {post.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <Select>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Langue cible" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.filter(l => !l.is_default).map((lang) => {
                      const info = getLanguageInfo(lang.code);
                      return (
                        <SelectItem key={lang.code} value={lang.code}>
                          {info.flag} {lang.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button disabled={translationInProgress}>
                  {translationInProgress ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Traduction...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Traduire
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Translations list */}
          <Card>
            <CardHeader>
              <CardTitle>Traductions existantes</CardTitle>
            </CardHeader>
            <CardContent>
              {translations.length === 0 ? (
                <div className="text-center py-8">
                  <Languages className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune traduction</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contenu</TableHead>
                      <TableHead>De</TableHead>
                      <TableHead>Vers</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {translations.map((translation) => {
                      const sourceInfo = getLanguageInfo(translation.source_language);
                      const targetInfo = getLanguageInfo(translation.target_language);
                      const statusConfig = STATUS_CONFIG[translation.translation_status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
                      
                      return (
                        <TableRow key={translation.id}>
                          <TableCell className="font-medium">
                            {translation.original_content.title || 'Sans titre'}
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              {sourceInfo.flag} {sourceInfo.name}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              {targetInfo.flag} {targetInfo.name}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConfig.color}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {translation.translator_type === 'ai' ? 'IA' : 'Manuel'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              {translation.translation_status === 'pending_review' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateTranslationStatusMutation.mutate({
                                    id: translation.id,
                                    status: 'approved'
                                  })}
                                >
                                  <Check className="h-4 w-4 text-green-500" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow de traduction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                {Object.entries(STATUS_CONFIG).map(([status, config], index) => {
                  const count = translations.filter(t => t.translation_status === status).length;
                  const Icon = config.icon;
                  
                  return (
                    <div key={status} className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{config.label}</p>
                          <p className="text-sm text-muted-foreground">{count} traductions</p>
                        </div>
                      </div>
                      {index < Object.keys(STATUS_CONFIG).length - 1 && (
                        <div className="h-1 bg-muted rounded-full mt-4">
                          <div
                            className={`h-full ${config.color} rounded-full`}
                            style={{ width: `${count > 0 ? 100 : 0}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Traductions en attente de révision</CardTitle>
            </CardHeader>
            <CardContent>
              {translations.filter(t => t.translation_status === 'pending_review').length === 0 ? (
                <div className="text-center py-8">
                  <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">Toutes les traductions sont à jour !</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {translations
                    .filter(t => t.translation_status === 'pending_review')
                    .map((translation) => {
                      const targetInfo = getLanguageInfo(translation.target_language);
                      return (
                        <div
                          key={translation.id}
                          className="flex items-center justify-between p-4 rounded-lg border"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{targetInfo.flag}</span>
                            <div>
                              <p className="font-medium">
                                {translation.original_content.title || 'Sans titre'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Traduit en {targetInfo.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Réviser
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateTranslationStatusMutation.mutate({
                                id: translation.id,
                                status: 'approved'
                              })}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approuver
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
