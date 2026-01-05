/**
 * Page Editor - Éditeur drag-and-drop
 */
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  useLandingPage, 
  useUpdatePageContent,
  usePublishLandingPage,
  useUnpublishLandingPage
} from '@/hooks/useLandingPages';
import { LandingPageService, PageBlock } from '@/services/LandingPageService';
import { 
  ArrowLeft, Save, Eye, Globe, Loader2,
  Plus, Type, Image, Video, Layout, Star, MessageSquare,
  Target, DollarSign, FormInput, HelpCircle, Clock, CheckCircle,
  Trash2, GripVertical, Settings, X
} from 'lucide-react';
import { SortableBlock } from './SortableBlock';
import { BlockEditor } from './BlockEditor';
import { Skeleton } from '@/components/ui/skeleton';

const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero', icon: Layout, description: 'Section principale' },
  { type: 'features', label: 'Features', icon: Star, description: 'Caractéristiques' },
  { type: 'testimonials', label: 'Témoignages', icon: MessageSquare, description: 'Avis clients' },
  { type: 'cta', label: 'CTA', icon: Target, description: 'Appel à l\'action' },
  { type: 'pricing', label: 'Tarifs', icon: DollarSign, description: 'Plans tarifaires' },
  { type: 'form', label: 'Formulaire', icon: FormInput, description: 'Contact / Lead' },
  { type: 'text', label: 'Texte', icon: Type, description: 'Bloc de texte' },
  { type: 'image', label: 'Image', icon: Image, description: 'Image seule' },
  { type: 'video', label: 'Vidéo', icon: Video, description: 'Vidéo intégrée' },
  { type: 'countdown', label: 'Compte à rebours', icon: Clock, description: 'Timer' },
  { type: 'benefits', label: 'Avantages', icon: CheckCircle, description: 'Liste d\'avantages' },
  { type: 'faq', label: 'FAQ', icon: HelpCircle, description: 'Questions fréquentes' },
];

export function PageEditor() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [localContent, setLocalContent] = useState<PageBlock[] | null>(null);

  const { data: page, isLoading } = useLandingPage(pageId || '');
  const updateContentMutation = useUpdatePageContent();
  const publishMutation = usePublishLandingPage();
  const unpublishMutation = useUnpublishLandingPage();

  // Use local content for immediate feedback, fallback to page content
  const content = localContent ?? page?.content ?? [];

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = content.findIndex(b => b.id === active.id);
    const newIndex = content.findIndex(b => b.id === over.id);
    
    const newContent = arrayMove(content, oldIndex, newIndex);
    setLocalContent(newContent);
  }, [content]);

  const handleAddBlock = (type: PageBlock['type']) => {
    const newBlock: PageBlock = {
      id: LandingPageService.generateBlockId(),
      type,
      props: LandingPageService.getDefaultBlockProps(type)
    };

    const newContent = [...content, newBlock];
    setLocalContent(newContent);
    setSelectedBlockId(newBlock.id);
  };

  const handleUpdateBlock = (blockId: string, props: Record<string, any>) => {
    const newContent = content.map(block =>
      block.id === blockId ? { ...block, props: { ...block.props, ...props } } : block
    );
    setLocalContent(newContent);
  };

  const handleDeleteBlock = (blockId: string) => {
    const newContent = content.filter(block => block.id !== blockId);
    setLocalContent(newContent);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const handleSave = () => {
    if (!pageId || !localContent) return;
    updateContentMutation.mutate({ pageId, content: localContent });
  };

  const selectedBlock = content.find(b => b.id === selectedBlockId);

  if (isLoading) {
    return (
      <div className="h-screen flex">
        <Skeleton className="w-64 h-full" />
        <Skeleton className="flex-1 h-full" />
        <Skeleton className="w-80 h-full" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Page non trouvée</p>
          <Button variant="link" onClick={() => navigate('/page-builder')}>
            Retour aux pages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/page-builder')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">{page.title}</h1>
            <p className="text-xs text-muted-foreground">/{page.slug}</p>
          </div>
          <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
            {page.status === 'published' ? 'Publié' : 'Brouillon'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(`/p/${page.slug}`, '_blank')}>
            <Eye className="h-4 w-4 mr-2" />
            Prévisualiser
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSave}
            disabled={updateContentMutation.isPending || !localContent}
          >
            {updateContentMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Sauvegarder
          </Button>

          {page.status === 'published' ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => unpublishMutation.mutate(page.id)}
              disabled={unpublishMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Dépublier
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={() => {
                if (localContent) {
                  updateContentMutation.mutate({ pageId: page.id, content: localContent }, {
                    onSuccess: () => publishMutation.mutate(page.id)
                  });
                } else {
                  publishMutation.mutate(page.id);
                }
              }}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Globe className="h-4 w-4 mr-2" />
              )}
              Publier
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Block Library */}
        <aside className="w-64 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm">Blocs</h2>
            <p className="text-xs text-muted-foreground">Cliquez pour ajouter</p>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="grid grid-cols-2 gap-2">
              {BLOCK_TYPES.map(block => (
                <button
                  key={block.type}
                  onClick={() => handleAddBlock(block.type as PageBlock['type'])}
                  className="p-3 rounded-lg border bg-background hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  <block.icon className="h-5 w-5 mb-2 text-primary" />
                  <p className="text-xs font-medium">{block.label}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Center - Canvas */}
        <main className="flex-1 overflow-auto bg-muted/30 p-6">
          <div className="max-w-3xl mx-auto">
            {content.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Page vide</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ajoutez des blocs depuis la barre latérale pour construire votre page
                  </p>
                </CardContent>
              </Card>
            ) : (
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={content.map(b => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {content.map((block) => (
                      <SortableBlock
                        key={block.id}
                        block={block}
                        isSelected={selectedBlockId === block.id}
                        onSelect={() => setSelectedBlockId(block.id)}
                        onDelete={() => handleDeleteBlock(block.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </main>

        {/* Right Sidebar - Block Editor */}
        <aside className="w-80 border-l bg-card flex flex-col">
          {selectedBlock ? (
            <BlockEditor
              block={selectedBlock}
              onUpdate={(props) => handleUpdateBlock(selectedBlock.id, props)}
              onClose={() => setSelectedBlockId(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <Settings className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Sélectionnez un bloc pour modifier ses propriétés
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
