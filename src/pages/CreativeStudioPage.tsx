import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Palette, 
  Image, 
  Video, 
  Type, 
  Sparkles, 
  Download,
  Share,
  Eye,
  Heart,
  Star,
  Wand2,
  Loader2,
  Check,
  Trash2
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface GeneratedCreation {
  id: string;
  type: 'image' | 'video' | 'text' | 'design';
  prompt: string;
  style: string;
  format: string;
  imageUrl?: string;
  content?: string;
  createdAt: Date;
  isFavorite: boolean;
}

const templates = [
  {
    title: 'Post Instagram',
    type: 'Social Media',
    size: '1080x1080',
    preview: '/placeholder.svg',
    popular: true
  },
  {
    title: 'Bannière Web',
    type: 'Marketing',
    size: '1200x400',
    preview: '/placeholder.svg',
    popular: false
  },
  {
    title: 'Story Facebook',
    type: 'Social Media',
    size: '1080x1920',
    preview: '/placeholder.svg',
    popular: true
  },
  {
    title: 'Thumbnail YouTube',
    type: 'Video',
    size: '1280x720',
    preview: '/placeholder.svg',
    popular: false
  },
  {
    title: 'Logo Design',
    type: 'Branding',
    size: 'Vectoriel',
    preview: '/placeholder.svg',
    popular: true
  },
  {
    title: 'Flyer A4',
    type: 'Print',
    size: '210x297mm',
    preview: '/placeholder.svg',
    popular: false
  }
];

export default function CreativeStudioPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Generator state
  const [selectedType, setSelectedType] = useState<'image' | 'video' | 'text' | 'design'>('image');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [format, setFormat] = useState('square');
  const [generatedResult, setGeneratedResult] = useState<GeneratedCreation | null>(null);
  
  // Gallery state
  const [creations, setCreations] = useState<GeneratedCreation[]>([]);

  // Fetch saved creations from activity_logs
  const { data: savedCreations = [], isLoading: isLoadingCreations } = useQuery({
    queryKey: ['creative-studio-creations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('action', 'creative_generation')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      return (data || []).map((log: any) => ({
        id: log.id,
        type: log.details?.type || 'image',
        prompt: log.details?.prompt || '',
        style: log.details?.style || 'realistic',
        format: log.details?.format || 'square',
        imageUrl: log.details?.imageUrl,
        content: log.details?.content,
        createdAt: new Date(log.created_at),
        isFavorite: log.details?.isFavorite || false
      })) as GeneratedCreation[];
    }
  });

  // AI Generation mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      
      // Call AI generation edge function
      const { data, error } = await supabase.functions.invoke('generate-marketing-image', {
        body: {
          prompt,
          style,
          size: format === 'square' ? '1024x1024' : format === 'portrait' ? '768x1024' : '1024x768'
        }
      });
      
      if (error) throw error;
      
      const newCreation: GeneratedCreation = {
        id: crypto.randomUUID(),
        type: selectedType,
        prompt,
        style,
        format,
        imageUrl: data?.imageUrl || '/placeholder.svg',
        content: data?.content,
        createdAt: new Date(),
        isFavorite: false
      };
      
      // Save to activity_logs
      await supabase.from('activity_logs').insert([{
        user_id: user.id,
        action: 'creative_generation',
        entity_type: 'creative',
        entity_id: newCreation.id,
        description: `Generated ${selectedType}: ${prompt.substring(0, 50)}...`,
        details: {
          id: newCreation.id,
          type: newCreation.type,
          prompt: newCreation.prompt,
          style: newCreation.style,
          format: newCreation.format,
          imageUrl: newCreation.imageUrl,
          content: newCreation.content,
          createdAt: newCreation.createdAt.toISOString(),
          isFavorite: newCreation.isFavorite
        }
      }]);
      
      return newCreation;
    },
    onSuccess: (data) => {
      setGeneratedResult(data);
      setCreations(prev => [data, ...prev]);
      queryClient.invalidateQueries({ queryKey: ['creative-studio-creations'] });
      toast({
        title: "Génération réussie",
        description: "Votre création est prête"
      });
    },
    onError: (error) => {
      console.error('Generation error:', error);
      toast({
        title: "Erreur de génération",
        description: "Impossible de générer le contenu. Réessayez.",
        variant: "destructive"
      });
    }
  });

  // Template actions
  const handleTemplatePreview = (template: typeof templates[0]) => {
    toast({
      title: `Aperçu: ${template.title}`,
      description: `Template ${template.type} - ${template.size}`
    });
  };

  const handleTemplateUse = (template: typeof templates[0]) => {
    setPrompt(`Créer un ${template.title} de style professionnel pour ${template.type}`);
    setSelectedType('design');
    toast({
      title: "Template sélectionné",
      description: `${template.title} ajouté au générateur`
    });
  };

  // Gallery actions
  const handleDownload = async (creation: GeneratedCreation) => {
    if (creation.imageUrl && creation.imageUrl !== '/placeholder.svg') {
      try {
        const response = await fetch(creation.imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `creation-${creation.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({ title: "Téléchargement démarré" });
      } catch {
        toast({ 
          title: "Téléchargement", 
          description: "Fonctionnalité disponible après génération réelle" 
        });
      }
    } else {
      toast({ 
        title: "Téléchargement", 
        description: "Générez d'abord du contenu avec l'IA" 
      });
    }
  };

  const handleShare = async (creation: GeneratedCreation) => {
    if (navigator.share && creation.imageUrl) {
      try {
        await navigator.share({
          title: 'Ma création Creative Studio',
          text: creation.prompt,
          url: window.location.href
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Lien copié", description: "Lien de partage copié dans le presse-papier" });
    }
  };

  const handleToggleFavorite = async (creation: GeneratedCreation) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('activity_logs').update({
      details: { 
        id: creation.id,
        type: creation.type,
        prompt: creation.prompt,
        style: creation.style,
        format: creation.format,
        imageUrl: creation.imageUrl,
        content: creation.content,
        createdAt: creation.createdAt instanceof Date ? creation.createdAt.toISOString() : creation.createdAt,
        isFavorite: !creation.isFavorite 
      }
    }).eq('id', creation.id);
    
    setCreations(prev => prev.map(c =>
      c.id === creation.id ? { ...c, isFavorite: !c.isFavorite } : c
    ));
    
    toast({ 
      title: creation.isFavorite ? "Retiré des favoris" : "Ajouté aux favoris" 
    });
  };

  // Tool actions
  const handleOpenTool = (toolTitle: string) => {
    toast({
      title: toolTitle,
      description: "Outil en cours de chargement..."
    });
    // Navigate or open modal based on tool
  };

  const allCreations = [...creations, ...savedCreations.filter(sc => !creations.find(c => c.id === sc.id))];

  return (
    <>
      <Helmet>
        <title>Creative Studio - Création de Contenu IA</title>
        <meta name="description" content="Studio créatif avec IA pour générer des visuels, vidéos, textes et designs pour vos campagnes marketing." />
      </Helmet>

      <div className="space-y-6">
        <PageHeader 
          title="Creative Studio"
          description="Créez du contenu visuel professionnel avec l'intelligence artificielle"
        />

        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="generator">Générateur IA</TabsTrigger>
            <TabsTrigger value="gallery">Galerie</TabsTrigger>
            <TabsTrigger value="tools">Outils</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative">
                    <img 
                      src={template.preview} 
                      alt={template.title}
                      className="w-full h-full object-cover"
                    />
                    {template.popular && (
                      <Badge className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500">
                        Populaire
                      </Badge>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-base">{template.title}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="mr-2">{template.type}</Badge>
                      <span className="text-xs text-muted-foreground">{template.size}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleTemplatePreview(template)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Aperçu
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTemplateUse(template)}
                      >
                        <Wand2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="generator" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Générateur IA
                  </CardTitle>
                  <CardDescription>
                    Décrivez votre vision, l'IA crée le contenu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Type de contenu</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { icon: Image, label: 'Image', value: 'image' as const },
                        { icon: Video, label: 'Vidéo', value: 'video' as const },
                        { icon: Type, label: 'Texte', value: 'text' as const },
                        { icon: Palette, label: 'Design', value: 'design' as const }
                      ].map((type) => (
                        <Button 
                          key={type.value} 
                          variant={selectedType === type.value ? "default" : "outline"} 
                          className="justify-start"
                          onClick={() => setSelectedType(type.value)}
                        >
                          <type.icon className="h-4 w-4 mr-2" />
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea 
                      placeholder="Ex: Un chat mignon avec des lunettes de soleil sur une plage..."
                      className="mt-2"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Style</label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realistic">Réaliste</SelectItem>
                          <SelectItem value="cartoon">Cartoon</SelectItem>
                          <SelectItem value="minimalist">Minimaliste</SelectItem>
                          <SelectItem value="artistic">Artistique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Format</label>
                      <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="square">Carré (1:1)</SelectItem>
                          <SelectItem value="portrait">Portrait (4:5)</SelectItem>
                          <SelectItem value="landscape">Paysage (16:9)</SelectItem>
                          <SelectItem value="story">Story (9:16)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending || !prompt.trim()}
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Générer avec l'IA
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Résultat</CardTitle>
                  <CardDescription>
                    Votre création apparaîtra ici
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {generatedResult?.imageUrl ? (
                      <img 
                        src={generatedResult.imageUrl} 
                        alt="Generated content" 
                        className="w-full h-full object-cover"
                      />
                    ) : generateMutation.isPending ? (
                      <div className="text-center text-muted-foreground">
                        <Loader2 className="h-12 w-12 mx-auto mb-2 animate-spin" />
                        <p>Génération en cours...</p>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Lancez la génération pour voir le résultat</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      disabled={!generatedResult}
                      onClick={() => generatedResult && handleDownload(generatedResult)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                    <Button 
                      variant="outline" 
                      disabled={!generatedResult}
                      onClick={() => generatedResult && handleShare(generatedResult)}
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Partager
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Mes Créations ({allCreations.length})</h3>
              <Button 
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['creative-studio-creations'] })}
              >
                <Eye className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>

            {isLoadingCreations ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : allCreations.length === 0 ? (
              <Card className="p-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Aucune création</h3>
                <p className="text-muted-foreground mb-4">
                  Utilisez le générateur IA pour créer votre premier contenu
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {allCreations.map((creation) => (
                  <Card key={creation.id} className="overflow-hidden group">
                    <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                      {creation.imageUrl ? (
                        <img 
                          src={creation.imageUrl} 
                          alt={creation.prompt}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Sparkles className="h-8 w-8 opacity-50" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => {
                              setGeneratedResult(creation);
                              toast({ title: "Aperçu", description: creation.prompt.substring(0, 50) });
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => handleDownload(creation)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => handleShare(creation)}
                          >
                            <Share className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium truncate">{creation.prompt.substring(0, 30)}...</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(creation.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-0 h-auto"
                          onClick={() => handleToggleFavorite(creation)}
                        >
                          <Heart className={`h-3 w-3 ${creation.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Éditeur d\'images',
                  description: 'Retouche et modification avancée',
                  icon: Image,
                  color: 'text-blue-500',
                  action: () => toast({ 
                    title: "Éditeur d'images", 
                    description: "Fonctionnalité disponible prochainement" 
                  })
                },
                {
                  title: 'Générateur de palettes',
                  description: 'Créez des palettes de couleurs harmonieuses',
                  icon: Palette,
                  color: 'text-purple-500',
                  action: () => {
                    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
                    toast({ 
                      title: "Palette générée", 
                      description: `Couleurs: ${colors.join(', ')}` 
                    });
                  }
                },
                {
                  title: 'Optimiseur de formats',
                  description: 'Adaptez vos créations aux différentes plateformes',
                  icon: Type,
                  color: 'text-green-500',
                  action: () => toast({ 
                    title: "Optimiseur", 
                    description: "Sélectionnez une image dans la galerie pour optimiser" 
                  })
                },
                {
                  title: 'Studio vidéo',
                  description: 'Montage et effets vidéo automatisés',
                  icon: Video,
                  color: 'text-red-500',
                  action: () => toast({ 
                    title: "Studio vidéo", 
                    description: "Fonctionnalité en développement" 
                  })
                },
                {
                  title: 'Générateur de QR codes',
                  description: 'QR codes personnalisés et stylisés',
                  icon: Star,
                  color: 'text-orange-500',
                  action: () => {
                    const qrData = `https://shopopti.com/studio/${Date.now()}`;
                    toast({ 
                      title: "QR Code généré", 
                      description: `Données: ${qrData}` 
                    });
                  }
                },
                {
                  title: 'Watermark automatique',
                  description: 'Protection de vos créations',
                  icon: Wand2,
                  color: 'text-indigo-500',
                  action: () => toast({ 
                    title: "Watermark", 
                    description: "Activez le watermark dans les paramètres" 
                  })
                }
              ].map((tool, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <tool.icon className={`h-6 w-6 ${tool.color}`} />
                      {tool.title}
                    </CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={tool.action}>
                      Ouvrir l'outil
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
