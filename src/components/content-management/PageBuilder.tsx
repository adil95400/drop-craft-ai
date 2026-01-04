import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, GripVertical, Trash2, Copy, Eye, Save, Settings,
  Layout, Type, Image, Square, Columns, MessageSquare, Star,
  ChevronUp, ChevronDown, Edit, Globe, FileText, MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Section types
const SECTION_TYPES = {
  hero: { label: 'Hero Banner', icon: Layout, color: 'bg-purple-500' },
  text: { label: 'Texte', icon: Type, color: 'bg-blue-500' },
  image: { label: 'Image', icon: Image, color: 'bg-green-500' },
  gallery: { label: 'Galerie', icon: Square, color: 'bg-yellow-500' },
  columns: { label: 'Colonnes', icon: Columns, color: 'bg-orange-500' },
  testimonials: { label: 'Témoignages', icon: MessageSquare, color: 'bg-pink-500' },
  cta: { label: 'Call to Action', icon: Star, color: 'bg-red-500' },
  features: { label: 'Fonctionnalités', icon: Square, color: 'bg-indigo-500' },
};

interface Section {
  id: string;
  type: keyof typeof SECTION_TYPES;
  content: Record<string, unknown>;
  settings: {
    padding?: string;
    background?: string;
    fullWidth?: boolean;
  };
}

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  content: { sections: Section[] };
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

function SortableSection({ 
  section, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: { 
  section: Section; 
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sectionType = SECTION_TYPES[section.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 p-4 bg-card border rounded-lg hover:shadow-md transition-shadow"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className={`w-10 h-10 rounded-lg ${sectionType.color} flex items-center justify-center`}>
        <sectionType.icon className="h-5 w-5 text-white" />
      </div>
      
      <div className="flex-1">
        <p className="font-medium">{sectionType.label}</p>
        <p className="text-sm text-muted-foreground">
          {Object.keys(section.content).length} éléments configurés
        </p>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDuplicate}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SectionEditor({ 
  section, 
  onSave, 
  onClose 
}: { 
  section: Section; 
  onSave: (section: Section) => void;
  onClose: () => void;
}) {
  const [editedSection, setEditedSection] = useState(section);

  const updateContent = (key: string, value: unknown) => {
    setEditedSection({
      ...editedSection,
      content: { ...editedSection.content, [key]: value }
    });
  };

  const renderEditor = () => {
    switch (section.type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <Label>Titre principal</Label>
              <Input
                value={(editedSection.content.title as string) || ''}
                onChange={(e) => updateContent('title', e.target.value)}
                placeholder="Votre titre accrocheur"
              />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Textarea
                value={(editedSection.content.subtitle as string) || ''}
                onChange={(e) => updateContent('subtitle', e.target.value)}
                placeholder="Description courte"
              />
            </div>
            <div>
              <Label>Texte du bouton</Label>
              <Input
                value={(editedSection.content.buttonText as string) || ''}
                onChange={(e) => updateContent('buttonText', e.target.value)}
                placeholder="Commencer maintenant"
              />
            </div>
            <div>
              <Label>Lien du bouton</Label>
              <Input
                value={(editedSection.content.buttonLink as string) || ''}
                onChange={(e) => updateContent('buttonLink', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Image de fond (URL)</Label>
              <Input
                value={(editedSection.content.backgroundImage as string) || ''}
                onChange={(e) => updateContent('backgroundImage', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        );
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input
                value={(editedSection.content.title as string) || ''}
                onChange={(e) => updateContent('title', e.target.value)}
              />
            </div>
            <div>
              <Label>Contenu</Label>
              <Textarea
                value={(editedSection.content.text as string) || ''}
                onChange={(e) => updateContent('text', e.target.value)}
                rows={6}
              />
            </div>
          </div>
        );
      case 'cta':
        return (
          <div className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input
                value={(editedSection.content.title as string) || ''}
                onChange={(e) => updateContent('title', e.target.value)}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={(editedSection.content.description as string) || ''}
                onChange={(e) => updateContent('description', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Texte bouton primaire</Label>
                <Input
                  value={(editedSection.content.primaryButtonText as string) || ''}
                  onChange={(e) => updateContent('primaryButtonText', e.target.value)}
                />
              </div>
              <div>
                <Label>Lien</Label>
                <Input
                  value={(editedSection.content.primaryButtonLink as string) || ''}
                  onChange={(e) => updateContent('primaryButtonLink', e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>Éditeur pour "{SECTION_TYPES[section.type].label}" bientôt disponible</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className={`w-10 h-10 rounded-lg ${SECTION_TYPES[section.type].color} flex items-center justify-center`}>
          {(() => {
            const Icon = SECTION_TYPES[section.type].icon;
            return <Icon className="h-5 w-5 text-white" />;
          })()}
        </div>
        <div>
          <h3 className="font-semibold">{SECTION_TYPES[section.type].label}</h3>
          <p className="text-sm text-muted-foreground">Modifier le contenu de cette section</p>
        </div>
      </div>

      {renderEditor()}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={() => onSave(editedSection)}>Enregistrer</Button>
      </div>
    </div>
  );
}

export function PageBuilder() {
  const [selectedPage, setSelectedPage] = useState<LandingPage | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [newPage, setNewPage] = useState({ title: '', slug: '', description: '' });
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['landing-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(page => ({
        ...page,
        content: (page.content as unknown as { sections: Section[] }) || { sections: [] }
      })) as LandingPage[];
    }
  });

  const createPageMutation = useMutation({
    mutationFn: async (pageData: typeof newPage) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase
        .from('landing_pages')
        .insert({
          user_id: user.id,
          title: pageData.title,
          slug: pageData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          description: pageData.description,
          content: { sections: [] },
        } as any)
        .select()
        .single());

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      setIsCreateOpen(false);
      const pageData = {
        ...data,
        content: (data.content as unknown as { sections: Section[] }) || { sections: [] }
      } as LandingPage;
      setSelectedPage(pageData);
      setNewPage({ title: '', slug: '', description: '' });
      toast.success('Page créée');
    }
  });

  const updatePageMutation = useMutation({
    mutationFn: async (page: LandingPage) => {
      const { error } = await supabase
        .from('landing_pages')
        .update({
          title: page.title,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: page.content as any,
          seo_title: page.seo_title,
          seo_description: page.seo_description,
          status: page.status,
        })
        .eq('id', page.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast.success('Page sauvegardée');
    }
  });

  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      setSelectedPage(null);
      toast.success('Page supprimée');
    }
  });

  const handleDragEnd = (event: DragEndEvent) => {
    if (!selectedPage) return;
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const sections = selectedPage.content.sections;
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      
      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSelectedPage({
        ...selectedPage,
        content: { sections: newSections }
      });
    }
  };

  const addSection = (type: keyof typeof SECTION_TYPES) => {
    if (!selectedPage) return;
    
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type,
      content: {},
      settings: { padding: 'normal' }
    };

    setSelectedPage({
      ...selectedPage,
      content: {
        sections: [...selectedPage.content.sections, newSection]
      }
    });
  };

  const updateSection = (updatedSection: Section) => {
    if (!selectedPage) return;

    const newSections = selectedPage.content.sections.map(s =>
      s.id === updatedSection.id ? updatedSection : s
    );

    setSelectedPage({
      ...selectedPage,
      content: { sections: newSections }
    });
    setEditingSection(null);
  };

  const deleteSection = (sectionId: string) => {
    if (!selectedPage) return;

    setSelectedPage({
      ...selectedPage,
      content: {
        sections: selectedPage.content.sections.filter(s => s.id !== sectionId)
      }
    });
  };

  const duplicateSection = (section: Section) => {
    if (!selectedPage) return;

    const newSection = {
      ...section,
      id: `section-${Date.now()}`,
      content: { ...section.content }
    };

    const index = selectedPage.content.sections.findIndex(s => s.id === section.id);
    const newSections = [...selectedPage.content.sections];
    newSections.splice(index + 1, 0, newSection);

    setSelectedPage({
      ...selectedPage,
      content: { sections: newSections }
    });
  };

  if (selectedPage) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedPage(null)}>
              ← Retour
            </Button>
            <div>
              <h2 className="text-xl font-semibold">{selectedPage.title}</h2>
              <p className="text-sm text-muted-foreground">/{selectedPage.slug}</p>
            </div>
            <Badge variant={selectedPage.status === 'published' ? 'default' : 'secondary'}>
              {selectedPage.status === 'published' ? 'Publié' : 'Brouillon'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Prévisualiser
            </Button>
            <Button onClick={() => updatePageMutation.mutate(selectedPage)}>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sections */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Sections</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {Object.entries(SECTION_TYPES).map(([key, { label, icon: Icon, color }]) => (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => addSection(key as keyof typeof SECTION_TYPES)}
                          className="flex items-center gap-2"
                        >
                          <div className={`w-6 h-6 rounded ${color} flex items-center justify-center`}>
                            <Icon className="h-3 w-3 text-white" />
                          </div>
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPage.content.sections.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Layout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Page vide</h3>
                    <p className="text-muted-foreground mb-4">
                      Ajoutez des sections pour construire votre page
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={selectedPage.content.sections.map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {selectedPage.content.sections.map((section) => (
                          <SortableSection
                            key={section.id}
                            section={section}
                            onEdit={() => setEditingSection(section)}
                            onDelete={() => deleteSection(section.id)}
                            onDuplicate={() => duplicateSection(section)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Titre de la page</Label>
                  <Input
                    value={selectedPage.title}
                    onChange={(e) => setSelectedPage({ ...selectedPage, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Statut</Label>
                  <Select
                    value={selectedPage.status}
                    onValueChange={(value) => setSelectedPage({ ...selectedPage, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="published">Publié</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  SEO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Titre SEO</Label>
                  <Input
                    value={selectedPage.seo_title || ''}
                    onChange={(e) => setSelectedPage({ ...selectedPage, seo_title: e.target.value })}
                    placeholder="Titre pour les moteurs de recherche"
                  />
                </div>
                <div>
                  <Label>Meta description</Label>
                  <Textarea
                    value={selectedPage.seo_description || ''}
                    onChange={(e) => setSelectedPage({ ...selectedPage, seo_description: e.target.value })}
                    placeholder="Description pour les résultats de recherche"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section Editor Dialog */}
        <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
          <DialogContent className="max-w-2xl">
            {editingSection && (
              <SectionEditor
                section={editingSection}
                onSave={updateSection}
                onClose={() => setEditingSection(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Constructeur de Pages</h2>
          <p className="text-muted-foreground">
            Créez des landing pages et pages marketing en drag & drop
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle page
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle page</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Titre</Label>
                <Input
                  value={newPage.title}
                  onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                  placeholder="Ma superbe landing page"
                />
              </div>
              <div>
                <Label>URL (slug)</Label>
                <Input
                  value={newPage.slug}
                  onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                  placeholder="ma-landing-page"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newPage.description}
                  onChange={(e) => setNewPage({ ...newPage, description: e.target.value })}
                  placeholder="Description de la page..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => createPageMutation.mutate(newPage)}
                disabled={!newPage.title || !newPage.slug}
              >
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pages list */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pages.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune page</h3>
          <p className="text-muted-foreground mb-4">
            Créez votre première landing page
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer une page
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => (
            <Card
              key={page.id}
              className="group cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedPage(page)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold truncate">{page.title}</h3>
                    <p className="text-sm text-muted-foreground">/{page.slug}</p>
                  </div>
                  <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                    {page.status === 'published' ? 'Publié' : 'Brouillon'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{page.content.sections.length} sections</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedPage(page); }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); deletePageMutation.mutate(page.id); }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
