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
  Plus, FileText, Star, StarOff, Copy, Edit, Trash2, 
  Search, LayoutTemplate, Tag, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';

interface Template {
  id: string;
  name: string;
  template_type: string;
  content: Record<string, unknown>;
  variables: string[];
  category: string | null;
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
}

const TEMPLATE_TYPES = {
  blog: 'Article Blog',
  product: 'Description Produit',
  social: 'Post Social',
  email: 'Email Marketing',
  seo: 'Contenu SEO'
};

const CATEGORIES = ['Marketing', 'Ventes', 'Support', 'Annonces', 'Promotions', 'Saisonnier'];

const DEFAULT_TEMPLATES = [
  {
    name: 'Description Produit E-commerce',
    template_type: 'product',
    content: {
      body: `🎯 **{{product_name}}**

{{product_description}}

✨ **Caractéristiques principales:**
{{features}}

💡 **Pourquoi choisir {{product_name}}?**
{{benefits}}

📦 **Inclus dans votre achat:**
{{included_items}}

🚚 Livraison gratuite dès {{free_shipping_threshold}}€
⭐ Satisfait ou remboursé sous {{return_days}} jours`,
      structure: 'product'
    },
    variables: ['product_name', 'product_description', 'features', 'benefits', 'included_items', 'free_shipping_threshold', 'return_days'],
    category: 'Ventes'
  },
  {
    name: 'Post Instagram Produit',
    template_type: 'social',
    content: {
      body: `✨ {{hook}}

{{product_name}} est enfin disponible! 🎉

{{product_highlight}}

🔥 {{cta}}

#{{hashtag1}} #{{hashtag2}} #{{hashtag3}} #{{brand}}`,
      structure: 'social'
    },
    variables: ['hook', 'product_name', 'product_highlight', 'cta', 'hashtag1', 'hashtag2', 'hashtag3', 'brand'],
    category: 'Marketing'
  },
  {
    name: 'Email Panier Abandonné',
    template_type: 'email',
    content: {
      body: `Objet: {{customer_name}}, vous avez oublié quelque chose! 🛒

Bonjour {{customer_name}},

Nous avons remarqué que vous avez laissé des articles dans votre panier. Pas de souci, nous les avons gardés pour vous!

📦 Votre panier vous attend:
{{cart_items}}

💰 Total: {{cart_total}}€

🎁 Utilisez le code {{discount_code}} pour obtenir {{discount_percent}}% de réduction!

👉 {{cta_link}}

À bientôt,
L'équipe {{brand_name}}`,
      structure: 'email'
    },
    variables: ['customer_name', 'cart_items', 'cart_total', 'discount_code', 'discount_percent', 'cta_link', 'brand_name'],
    category: 'Ventes'
  }
];

export function ContentTemplates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    template_type: 'product',
    body: '',
    variables: '',
    category: ''
  });
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['content-templates', selectedType],
    queryFn: async () => {
      let query = supabase
        .from('content_templates')
        .select('*')
        .order('is_favorite', { ascending: false })
        .order('usage_count', { ascending: false });
      
      if (selectedType !== 'all') {
        query = query.eq('template_type', selectedType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Template[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');
      
      const variables = data.variables.split(',').map(v => v.trim()).filter(Boolean);
      
      const { error } = await supabase
        .from('content_templates')
        .insert({
          user_id: userData.user.id,
          name: data.name,
          template_type: data.template_type,
          content: { body: data.body },
          variables,
          category: data.category || null
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-templates'] });
      toast.success('Template créé');
      resetForm();
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & typeof formData) => {
      const variables = data.variables.split(',').map(v => v.trim()).filter(Boolean);
      
      const { error } = await supabase
        .from('content_templates')
        .update({
          name: data.name,
          template_type: data.template_type,
          content: { body: data.body },
          variables,
          category: data.category || null
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-templates'] });
      toast.success('Template mis à jour');
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('content_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-templates'] });
      toast.success('Template supprimé');
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('content_templates')
        .update({ is_favorite: !isFavorite })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-templates'] });
    }
  });

  const createDefaultTemplates = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');
      
      const templatesWithUser = DEFAULT_TEMPLATES.map(t => ({
        ...t,
        user_id: userData.user!.id
      }));
      
      const { error } = await supabase
        .from('content_templates')
        .insert(templatesWithUser);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-templates'] });
      toast.success('Templates par défaut créés');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      template_type: 'product',
      body: '',
      variables: '',
      category: ''
    });
    setEditingTemplate(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    const body = typeof template.content?.body === 'string' ? template.content.body : '';
    setFormData({
      name: template.name,
      template_type: template.template_type,
      body,
      variables: template.variables.join(', '),
      category: template.category || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.body.trim()) {
      toast.error('Nom et contenu sont requis');
      return;
    }

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copié dans le presse-papier');
  };

  const getTemplateBody = (template: Template): string => {
    return typeof template.content?.body === 'string' ? template.content.body : '';
  };

  const filteredTemplates = templates.filter(t => {
    const body = getTemplateBody(t);
    return t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      body.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      blog: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      product: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      social: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      email: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      seo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
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
              placeholder="Rechercher des templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {Object.entries(TEMPLATE_TYPES).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button variant="outline" onClick={() => createDefaultTemplates.mutate()}>
              <Sparkles className="h-4 w-4 mr-2" />
              Templates par défaut
            </Button>
          )}
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <LayoutTemplate className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-sm text-muted-foreground">Templates</p>
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
                  {templates.filter(t => t.is_favorite).length}
                </p>
                <p className="text-sm text-muted-foreground">Favoris</p>
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
                  {templates.reduce((sum, t) => sum + t.usage_count, 0)}
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
        ) : filteredTemplates.length === 0 ? (
          <Card className="p-12 text-center">
            <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Aucun template</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre premier template ou importez les templates par défaut
            </p>
            <Button onClick={() => createDefaultTemplates.mutate()}>
              <Sparkles className="h-4 w-4 mr-2" />
              Importer templates par défaut
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        {template.is_favorite && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                        <span className="truncate">{template.name}</span>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getTypeColor(template.template_type)}>
                          {TEMPLATE_TYPES[template.template_type as keyof typeof TEMPLATE_TYPES]}
                        </Badge>
                        {template.category && (
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3 font-mono text-xs">
                    {getTemplateBody(template)}
                  </p>
                  {template.variables.length > 0 && (
                    <div className="flex items-center gap-1 mb-3 flex-wrap">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      {template.variables.slice(0, 3).map((v, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                      {template.variables.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{template.variables.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {template.usage_count} utilisations
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(getTemplateBody(template))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleFavoriteMutation.mutate({
                          id: template.id,
                          isFavorite: template.is_favorite
                        })}
                      >
                        {template.is_favorite ? (
                          <StarOff className="h-4 w-4" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteMutation.mutate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du template</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Description produit premium"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.template_type}
                  onValueChange={(v) => setFormData({ ...formData, template_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATE_TYPES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contenu du template</Label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Utilisez {{variable}} pour les variables dynamiques..."
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Utilisez la syntaxe {'{{variable}}'} pour créer des variables dynamiques
              </p>
            </div>
            <div className="space-y-2">
              <Label>Variables (séparées par des virgules)</Label>
              <Input
                value={formData.variables}
                onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                placeholder="product_name, price, description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              {editingTemplate ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
