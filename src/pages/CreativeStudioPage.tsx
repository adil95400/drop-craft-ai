import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
  Wand2,
  Loader2,
  Trash2,
  QrCode,
  Eraser,
  Settings,
  Check,
  X,
  Crop,
  Layers,
  Zap,
  RefreshCw
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BackgroundRemovalTool } from '@/components/creative-studio/BackgroundRemovalTool';
import { ImageEnhancerTool } from '@/components/creative-studio/ImageEnhancerTool';
import { TextOverlayTool } from '@/components/creative-studio/TextOverlayTool';
import { PromptSuggestions } from '@/components/creative-studio/PromptSuggestions';

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

interface Template {
  title: string;
  type: string;
  size: string;
  preview: string;
  popular: boolean;
  width: number;
  height: number;
  description: string;
  gradient: string;
}

const templates: Template[] = [
  {
    title: 'Post Instagram',
    type: 'Social Media',
    size: '1080x1080',
    preview: '/placeholder.svg',
    popular: true,
    width: 1080,
    height: 1080,
    description: 'Format carré idéal pour le feed Instagram',
    gradient: 'from-pink-500 via-purple-500 to-indigo-500'
  },
  {
    title: 'Bannière Web',
    type: 'Marketing',
    size: '1200x400',
    preview: '/placeholder.svg',
    popular: false,
    width: 1200,
    height: 400,
    description: 'Bannière large pour sites web et newsletters',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Story Facebook',
    type: 'Social Media',
    size: '1080x1920',
    preview: '/placeholder.svg',
    popular: true,
    width: 1080,
    height: 1920,
    description: 'Format vertical pour stories Facebook et Instagram',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    title: 'Thumbnail YouTube',
    type: 'Video',
    size: '1280x720',
    preview: '/placeholder.svg',
    popular: false,
    width: 1280,
    height: 720,
    description: 'Miniature 16:9 pour vidéos YouTube',
    gradient: 'from-red-600 to-red-400'
  },
  {
    title: 'Logo Design',
    type: 'Branding',
    size: '800x800',
    preview: '/placeholder.svg',
    popular: true,
    width: 800,
    height: 800,
    description: 'Design de logo carré haute résolution',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'Flyer A4',
    type: 'Print',
    size: '2480x3508',
    preview: '/placeholder.svg',
    popular: false,
    width: 2480,
    height: 3508,
    description: 'Format A4 pour impression (300 DPI)',
    gradient: 'from-violet-500 to-purple-500'
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
  const [filterType, setFilterType] = useState<'all' | 'favorites'>('all');
  
  // Modal states
  const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [paletteModalOpen, setPaletteModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState('https://shopopti.com');
  const [watermarkModalOpen, setWatermarkModalOpen] = useState(false);
  const [watermarkText, setWatermarkText] = useState('© Shopopti');
  const [watermarkOpacity, setWatermarkOpacity] = useState([50]);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<GeneratedCreation | null>(null);
  const [generatedPalette, setGeneratedPalette] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<GeneratedCreation | null>(null);
  
  // New tool modals
  const [bgRemovalOpen, setBgRemovalOpen] = useState(false);
  const [imageEnhancerOpen, setImageEnhancerOpen] = useState(false);
  const [textOverlayOpen, setTextOverlayOpen] = useState(false);
  const [selectedImageForTool, setSelectedImageForTool] = useState<string | undefined>();

  // Fetch saved creations from marketing_ai_images
  const { data: savedCreations = [], isLoading: isLoadingCreations, refetch: refetchCreations } = useQuery({
    queryKey: ['creative-studio-creations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('marketing_ai_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      return (data || []).map((img: any) => ({
        id: img.id,
        type: 'image' as const,
        prompt: img.prompt || '',
        style: img.style || 'realistic',
        format: 'square',
        imageUrl: img.image_base64 || img.image_url,
        content: null,
        createdAt: new Date(img.created_at),
        isFavorite: img.metadata?.isFavorite || false
      })) as GeneratedCreation[];
    }
  });

  // AI Generation mutation using real API
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      
      let width = 1024, height = 1024;
      if (format === 'portrait') { width = 768; height = 1024; }
      else if (format === 'landscape') { width = 1024; height = 768; }
      else if (format === 'story') { width = 768; height = 1280; }
      
      const stylePrefix = {
        realistic: 'Photorealistic, high quality, professional',
        cartoon: 'Cartoon style, vibrant colors, playful',
        minimalist: 'Minimalist, clean design, simple shapes',
        artistic: 'Artistic, creative, expressive brushstrokes'
      }[style] || '';
      
      const { data, error } = await supabase.functions.invoke('generate-marketing-image', {
        body: {
          prompt: `${stylePrefix}. ${prompt}`,
          width,
          height,
          style
        }
      });
      
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');
      
      const imageData = data.image;
      if (!imageData) throw new Error('No image returned');
      
      const newId = crypto.randomUUID();
      
      const { error: saveError } = await supabase.from('marketing_ai_images').insert([{
        user_id: user.id,
        prompt: prompt,
        image_base64: imageData,
        width,
        height,
        model: 'google/gemini-2.5-flash-image-preview',
        style: style,
        category: 'creative-studio',
        metadata: { format, type: selectedType, isFavorite: false }
      }]);
      
      if (saveError) console.error('Save error:', saveError);
      
      return {
        id: newId,
        type: selectedType,
        prompt,
        style,
        format,
        imageUrl: imageData,
        content: data.text,
        createdAt: new Date(),
        isFavorite: false
      } as GeneratedCreation;
    },
    onSuccess: (data) => {
      setGeneratedResult(data);
      setCreations(prev => [data, ...prev]);
      refetchCreations();
      toast({ title: "Génération réussie", description: "Votre image a été créée avec succès" });
    },
    onError: (error: any) => {
      console.error('Generation error:', error);
      toast({
        title: "Erreur de génération",
        description: error.message || "Impossible de générer le contenu",
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (creationId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      
      const { error } = await supabase
        .from('marketing_ai_images')
        .delete()
        .eq('id', creationId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return creationId;
    },
    onSuccess: (deletedId) => {
      setCreations(prev => prev.filter(c => c.id !== deletedId));
      refetchCreations();
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      toast({ title: "Supprimé", description: "L'image a été supprimée" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  // Template actions
  const handleTemplatePreview = (template: Template) => {
    setSelectedTemplate(template);
    setTemplatePreviewOpen(true);
  };

  const handleTemplateUse = (template: Template) => {
    setPrompt(`Créer un ${template.title} professionnel, ${template.description}`);
    setSelectedType('design');
    if (template.width === template.height) setFormat('square');
    else if (template.width > template.height) setFormat('landscape');
    else setFormat('portrait');
    
    setTemplatePreviewOpen(false);
    toast({ title: "Template sélectionné", description: `${template.title} - Allez dans Générateur IA` });
  };

  // Gallery actions
  const handleDownload = async (creation: GeneratedCreation) => {
    if (!creation.imageUrl) {
      toast({ title: "Téléchargement impossible", variant: "destructive" });
      return;
    }
    
    try {
      const response = await fetch(creation.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `creation-${creation.id.substring(0, 8)}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Téléchargement démarré" });
    } catch (error) {
      toast({ title: "Erreur de téléchargement", variant: "destructive" });
    }
  };

  const handleShare = async (creation: GeneratedCreation) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ma création Creative Studio',
          text: creation.prompt,
          url: window.location.href
        });
      } catch {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Lien copié" });
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Lien copié" });
    }
  };

  const handleToggleFavorite = async (creation: GeneratedCreation) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const newFavoriteStatus = !creation.isFavorite;
    
    await supabase.from('marketing_ai_images').update({
      metadata: { isFavorite: newFavoriteStatus, format: creation.format, type: creation.type }
    }).eq('id', creation.id);
    
    setCreations(prev => prev.map(c => c.id === creation.id ? { ...c, isFavorite: newFavoriteStatus } : c));
    refetchCreations();
    toast({ title: newFavoriteStatus ? "Ajouté aux favoris" : "Retiré des favoris" });
  };

  const handleDeleteClick = (creation: GeneratedCreation) => {
    setItemToDelete(creation);
    setDeleteConfirmOpen(true);
  };

  const handleViewImage = (creation: GeneratedCreation) => {
    setPreviewImage(creation);
    setImagePreviewOpen(true);
  };

  const handleEditImage = (creation: GeneratedCreation) => {
    setSelectedImageForTool(creation.imageUrl);
    setImageEnhancerOpen(true);
  };

  const handleRemoveBackground = (creation: GeneratedCreation) => {
    setSelectedImageForTool(creation.imageUrl);
    setBgRemovalOpen(true);
  };

  const handleAddText = (creation: GeneratedCreation) => {
    setSelectedImageForTool(creation.imageUrl);
    setTextOverlayOpen(true);
  };

  // Tool functions
  const generatePalette = () => {
    const palettes = [
      ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
      ['#2C3E50', '#E74C3C', '#ECF0F1', '#3498DB', '#2ECC71'],
      ['#F39C12', '#E74C3C', '#9B59B6', '#1ABC9C', '#34495E'],
      ['#667EEA', '#764BA2', '#F093FB', '#F5576C', '#4FACFE'],
      ['#11998E', '#38EF7D', '#43E97B', '#38F9D7', '#08AEEA'],
      ['#FC466B', '#3F5EFB', '#C471ED', '#12CBC4', '#FDA085'],
    ];
    setGeneratedPalette(palettes[Math.floor(Math.random() * palettes.length)]);
  };

  const copyColor = async (color: string) => {
    await navigator.clipboard.writeText(color);
    toast({ title: "Couleur copiée", description: color });
  };

  const allCreations = [...creations, ...savedCreations.filter(sc => !creations.find(c => c.id === sc.id))];
  const filteredCreations = filterType === 'favorites' ? allCreations.filter(c => c.isFavorite) : allCreations;

  const tools = [
    {
      title: 'Suppression de fond',
      description: 'Supprimez automatiquement l\'arrière-plan avec l\'IA',
      icon: Eraser,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      action: () => { setSelectedImageForTool(undefined); setBgRemovalOpen(true); }
    },
    {
      title: 'Éditeur d\'images',
      description: 'Ajustez luminosité, contraste et appliquez des filtres',
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      action: () => { setSelectedImageForTool(undefined); setImageEnhancerOpen(true); }
    },
    {
      title: 'Ajout de texte',
      description: 'Superposez du texte personnalisé sur vos images',
      icon: Type,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      action: () => { setSelectedImageForTool(undefined); setTextOverlayOpen(true); }
    },
    {
      title: 'Générateur de palettes',
      description: 'Créez des palettes de couleurs harmonieuses',
      icon: Palette,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      action: () => { generatePalette(); setPaletteModalOpen(true); }
    },
    {
      title: 'Générateur de QR codes',
      description: 'QR codes personnalisés pour vos campagnes',
      icon: QrCode,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      action: () => setQrModalOpen(true)
    },
    {
      title: 'Watermark automatique',
      description: 'Protégez vos créations avec un filigrane',
      icon: Settings,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      action: () => setWatermarkModalOpen(true)
    }
  ];

  return (
    <>
      <Helmet>
        <title>Creative Studio - Création de Contenu IA | Shopopti</title>
        <meta name="description" content="Studio créatif avec IA pour générer des visuels, supprimer les fonds, éditer vos images et créer des designs professionnels." />
      </Helmet>

      <div className="space-y-6">
        <PageHeader 
          title="Creative Studio"
          description="Créez du contenu visuel professionnel avec l'intelligence artificielle"
        />

        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="generator">Générateur IA</TabsTrigger>
            <TabsTrigger value="gallery">
              Galerie
              {allCreations.length > 0 && (
                <Badge variant="secondary" className="ml-2">{allCreations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tools">Outils</TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group">
                  <div className={`aspect-video bg-gradient-to-br ${template.gradient} relative flex items-center justify-center`}>
                    <div className="text-center text-white">
                      <div className="w-16 h-16 mx-auto mb-2 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Image className="h-8 w-8" />
                      </div>
                      <span className="text-sm font-medium">{template.size}</span>
                    </div>
                    {template.popular && (
                      <Badge className="absolute top-2 right-2 bg-white text-black">
                        Populaire
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{template.title}</CardTitle>
                    <CardDescription className="text-xs">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => handleTemplatePreview(template)}>
                        <Eye className="h-3 w-3 mr-1" />
                        Aperçu
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleTemplateUse(template)}>
                        <Wand2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Generator Tab */}
          <TabsContent value="generator" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Générateur IA
                  </CardTitle>
                  <CardDescription>Décrivez votre vision, l'IA crée le contenu</CardDescription>
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
                      placeholder="Ex: Un chat mignon avec des lunettes de soleil sur une plage tropicale..."
                      className="mt-2"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <PromptSuggestions onSelect={setPrompt} />

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
                          <SelectItem value="portrait">Portrait (3:4)</SelectItem>
                          <SelectItem value="landscape">Paysage (4:3)</SelectItem>
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
                  <CardDescription>Votre création apparaîtra ici</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {generatedResult?.imageUrl ? (
                      <img src={generatedResult.imageUrl} alt="Generated" className="w-full h-full object-contain" />
                    ) : generateMutation.isPending ? (
                      <div className="text-center text-muted-foreground">
                        <Loader2 className="h-12 w-12 mx-auto mb-2 animate-spin" />
                        <p>Génération en cours...</p>
                        <p className="text-xs mt-1">Cela peut prendre quelques secondes</p>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Lancez la génération pour voir le résultat</p>
                      </div>
                    )}
                  </div>
                  
                  {generatedResult && (
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => handleDownload(generatedResult)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditImage(generatedResult)}>
                        <Zap className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleRemoveBackground(generatedResult)}>
                        <Eraser className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleAddText(generatedResult)}>
                        <Type className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Mes Créations</h3>
                <Badge variant="secondary">{filteredCreations.length}</Badge>
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={(v: 'all' | 'favorites') => setFilterType(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="favorites">Favoris</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => refetchCreations()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isLoadingCreations ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredCreations.length === 0 ? (
              <Card className="p-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  {filterType === 'favorites' ? 'Aucun favori' : 'Aucune création'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {filterType === 'favorites' 
                    ? 'Ajoutez des créations à vos favoris' 
                    : 'Utilisez le générateur IA pour créer votre premier contenu'}
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredCreations.map((creation) => (
                  <Card key={creation.id} className="overflow-hidden group">
                    <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                      {creation.imageUrl ? (
                        <img src={creation.imageUrl} alt={creation.prompt} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Sparkles className="h-8 w-8 opacity-50" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity">
                        <div className="grid grid-cols-3 gap-1">
                          <Button size="sm" variant="secondary" onClick={() => handleViewImage(creation)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleDownload(creation)}>
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleShare(creation)}>
                            <Share className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleEditImage(creation)}>
                            <Zap className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleRemoveBackground(creation)}>
                            <Eraser className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(creation)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {creation.isFavorite && (
                        <div className="absolute top-2 right-2">
                          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium truncate">{creation.prompt.substring(0, 40)}...</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(creation.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                        <Button variant="ghost" size="sm" className="p-0 h-auto" onClick={() => handleToggleFavorite(creation)}>
                          <Heart className={`h-3 w-3 ${creation.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool, index) => (
                <Card key={index} className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer" onClick={tool.action}>
                  <CardHeader className="pb-2">
                    <div className={`w-12 h-12 rounded-lg ${tool.bgColor} flex items-center justify-center mb-2`}>
                      <tool.icon className={`h-6 w-6 ${tool.color}`} />
                    </div>
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                    <CardDescription className="text-sm">{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      Ouvrir l'outil
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Tool Modals */}
      <BackgroundRemovalTool 
        open={bgRemovalOpen} 
        onOpenChange={setBgRemovalOpen}
        initialImage={selectedImageForTool}
      />
      <ImageEnhancerTool 
        open={imageEnhancerOpen} 
        onOpenChange={setImageEnhancerOpen}
        initialImage={selectedImageForTool}
      />
      <TextOverlayTool 
        open={textOverlayOpen} 
        onOpenChange={setTextOverlayOpen}
        initialImage={selectedImageForTool}
      />

      {/* Template Preview Modal */}
      <Dialog open={templatePreviewOpen} onOpenChange={setTemplatePreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.title}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>
          <div className={`aspect-video bg-gradient-to-br ${selectedTemplate?.gradient} rounded-lg flex items-center justify-center`}>
            <div className="text-center text-white p-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Image className="h-10 w-10" />
              </div>
              <p className="text-2xl font-bold">{selectedTemplate?.title}</p>
              <p className="text-lg opacity-80">{selectedTemplate?.size}</p>
              <Badge className="mt-2 bg-white/20">{selectedTemplate?.type}</Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplatePreviewOpen(false)}>Fermer</Button>
            <Button onClick={() => selectedTemplate && handleTemplateUse(selectedTemplate)}>
              <Wand2 className="h-4 w-4 mr-2" />
              Utiliser ce template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Palette Modal */}
      <Dialog open={paletteModalOpen} onOpenChange={setPaletteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Générateur de palettes</DialogTitle>
            <DialogDescription>Cliquez sur une couleur pour la copier</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2 h-24">
              {generatedPalette.map((color, index) => (
                <button
                  key={index}
                  className="flex-1 rounded-lg cursor-pointer hover:scale-105 transition-transform flex items-end justify-center pb-2 shadow-lg"
                  style={{ backgroundColor: color }}
                  onClick={() => copyColor(color)}
                >
                  <span className="text-xs font-mono bg-white/90 px-2 py-0.5 rounded shadow">{color}</span>
                </button>
              ))}
            </div>
            <Button onClick={generatePalette} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Générer une nouvelle palette
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Générateur de QR Code</DialogTitle>
            <DialogDescription>Entrez l'URL pour générer un QR code</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>URL</Label>
              <Input value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} placeholder="https://example.com" />
            </div>
            {qrUrl && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrModalOpen(false)}>Fermer</Button>
            <Button onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}`, '_blank')}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Watermark Modal */}
      <Dialog open={watermarkModalOpen} onOpenChange={setWatermarkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paramètres de watermark</DialogTitle>
            <DialogDescription>Configurez le watermark pour vos créations</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Texte du watermark</Label>
              <Input value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="© Votre nom" />
            </div>
            <div>
              <Label>Opacité: {watermarkOpacity[0]}%</Label>
              <Slider value={watermarkOpacity} onValueChange={setWatermarkOpacity} max={100} step={5} className="mt-2" />
            </div>
            <div className="p-4 bg-muted rounded-lg relative">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded flex items-center justify-center">
                <Image className="h-8 w-8 opacity-50" />
              </div>
              <span className="absolute bottom-6 right-6 text-sm font-medium" style={{ opacity: watermarkOpacity[0] / 100 }}>
                {watermarkText}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWatermarkModalOpen(false)}>Annuler</Button>
            <Button onClick={() => { toast({ title: "Watermark configuré" }); setWatermarkModalOpen(false); }}>
              <Check className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Aperçu de l'image</DialogTitle>
            <DialogDescription className="truncate max-w-lg">{previewImage?.prompt}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center bg-muted rounded-lg p-4">
            {previewImage?.imageUrl && (
              <img src={previewImage.imageUrl} alt={previewImage.prompt} className="max-w-full max-h-[60vh] object-contain rounded-lg" />
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setImagePreviewOpen(false)}>Fermer</Button>
            <Button variant="outline" onClick={() => previewImage && handleEditImage(previewImage)}>
              <Zap className="h-4 w-4 mr-2" />
              Éditer
            </Button>
            <Button onClick={() => previewImage && handleDownload(previewImage)}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => itemToDelete && deleteMutation.mutate(itemToDelete.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
