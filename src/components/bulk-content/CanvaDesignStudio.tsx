/**
 * Studio de design Canva intégré
 * Permet de créer et gérer des designs directement depuis l'application
 */
import { useState } from 'react';
import { useCanvaIntegration, type CanvaDesign, type CanvaTemplate } from '@/hooks/useCanvaIntegration';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Palette, 
  Link2, 
  Link2Off, 
  Plus, 
  ExternalLink, 
  RefreshCw, 
  Image, 
  Video, 
  Mail, 
  Megaphone,
  Loader2,
  Layout,
  Sparkles
} from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  social: <Image className="h-4 w-4" />,
  ads: <Megaphone className="h-4 w-4" />,
  marketing: <Layout className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />
};

const categoryLabels: Record<string, string> = {
  video: 'Vidéo',
  social: 'Réseaux Sociaux',
  ads: 'Publicités',
  marketing: 'Marketing',
  email: 'Email'
};

export function CanvaDesignStudio() {
  const {
    integration,
    designs,
    templates,
    isConnected,
    isConnecting,
    isLoading,
    connectCanva,
    disconnectCanva,
    openCanvaEditor,
    createDesignFromTemplate,
    getDesigns
  } = useCanvaIntegration();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newDesignTitle, setNewDesignTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filtrer les templates par catégorie
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  // Catégories uniques
  const categories = ['all', ...new Set(templates.map(t => t.category))];

  // Créer un nouveau design
  const handleCreateDesign = async () => {
    if (!selectedTemplate || !newDesignTitle.trim()) return;
    
    setIsCreating(true);
    try {
      await createDesignFromTemplate(selectedTemplate, { title: newDesignTitle.trim() });
      setIsCreateDialogOpen(false);
      setNewDesignTitle('');
      setSelectedTemplate(null);
    } finally {
      setIsCreating(false);
    }
  };

  // Synchroniser les designs
  const handleSyncDesigns = async () => {
    setIsSyncing(true);
    try {
      await getDesigns();
    } finally {
      setIsSyncing(false);
    }
  };

  // Si non connecté, afficher le bouton de connexion
  if (!isConnected) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Palette className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Connectez Canva</h3>
            <p className="text-muted-foreground max-w-md">
              Créez des designs professionnels pour vos produits en connectant votre compte Canva.
              Accédez à des milliers de templates et créez des visuels en quelques clics.
            </p>
          </div>
          <Button 
            onClick={connectCanva} 
            disabled={isConnecting}
            size="lg"
            className="gap-2"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            {isConnecting ? 'Connexion...' : 'Connecter Canva'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec status et actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Palette className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">Canva Studio</h3>
            <p className="text-sm text-muted-foreground">
              Connecté • {designs.length} designs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSyncDesigns}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Synchroniser
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={disconnectCanva}
            className="text-destructive hover:text-destructive"
          >
            <Link2Off className="h-4 w-4 mr-2" />
            Déconnecter
          </Button>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="designs" className="gap-2">
            <Layout className="h-4 w-4" />
            Mes Designs
            {designs.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {designs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          {/* Filtres par catégorie */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="gap-2"
              >
                {cat !== 'all' && categoryIcons[cat]}
                {cat === 'all' ? 'Tous' : categoryLabels[cat] || cat}
              </Button>
            ))}
          </div>

          {/* Grille de templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <Card 
                key={template.id} 
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => {
                  setSelectedTemplate(template.id);
                  setIsCreateDialogOpen(true);
                }}
              >
                <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative flex items-center justify-center overflow-hidden">
                  {template.thumbnail ? (
                    <img 
                      src={template.thumbnail} 
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <div className="h-12 w-12 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
                        {categoryIcons[template.category] || <Image className="h-6 w-6" />}
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Utiliser
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {categoryLabels[template.category] || template.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Mes Designs */}
        <TabsContent value="designs" className="space-y-4">
          {designs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <Layout className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <h4 className="font-medium">Aucun design</h4>
                  <p className="text-sm text-muted-foreground">
                    Créez votre premier design à partir d'un template
                  </p>
                </div>
                <Button onClick={() => openCanvaEditor()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un design
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {designs.map(design => (
                <DesignCard 
                  key={design.id} 
                  design={design} 
                  onEdit={() => openCanvaEditor(design.canva_design_id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de création */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau design</DialogTitle>
            <DialogDescription>
              Donnez un nom à votre design pour le retrouver facilement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom du design</label>
              <Input
                placeholder="Ex: Publicité TikTok - Montre connectée"
                value={newDesignTitle}
                onChange={(e) => setNewDesignTitle(e.target.value)}
              />
            </div>
            {selectedTemplate && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Template : </span>
                  {templates.find(t => t.id === selectedTemplate)?.name}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreateDesign}
              disabled={!newDesignTitle.trim() || isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Composant carte de design
function DesignCard({ 
  design, 
  onEdit
}: { 
  design: CanvaDesign; 
  onEdit: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted relative flex items-center justify-center">
        {design.thumbnail ? (
          <img 
            src={design.thumbnail} 
            alt={design.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Layout className="h-12 w-12 text-muted-foreground" />
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h4 className="font-medium truncate">{design.title}</h4>
          <p className="text-xs text-muted-foreground">
            {design.design_type || 'Design'} • Modifié le{' '}
            {new Date(design.updated_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onEdit}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Éditer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
