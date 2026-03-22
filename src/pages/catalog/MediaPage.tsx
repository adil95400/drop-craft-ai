/**
 * MediaPage - Hub média professionnel de niveau AutoDS/Channable
 * 5 onglets: Bibliothèque, Éditeur rapide, Pipeline CDN, Intelligence IA, Problèmes
 */
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Image, ImageOff, VideoOff, Sparkles, CheckCircle, Upload, Wand2,
  AlertTriangle, Euro, Loader2, ArrowRight, Zap, Search,
  Grid, List, Star, Trash2, Copy, Filter, Check, MoreVertical,
  Download, FolderOpen, Scissors, Crop, ExternalLink, Eye,
  BarChart3, TrendingDown, HardDrive, Cloud, Layers, ImagePlus,
  Video, FileText, FileAudio, Edit
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/integrations/supabase/client'
import { useMediaAudit, MediaIssue } from '@/hooks/catalog'
import { MediaAIPanel } from '@/components/catalog/MediaAIPanel'
import { MediaPipelineDashboard } from '@/components/media/MediaPipelineDashboard'
import { MediaAssetDetailPanel } from '@/components/media/MediaAssetDetailPanel'
import { MediaStatsBar } from '@/components/media/MediaStatsBar'
import { ProductMediaManager } from '@/components/media/ProductMediaManager'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next';

// Types
interface MediaAsset {
  id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  media_type: string;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  title: string | null;
  description: string | null;
  tags: string[];
  category: string | null;
  folder_path: string;
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } }

export default function MediaPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // State
  const [viewMode, setViewMode] = useState<'library' | 'cloudinary' | 'pipeline' | 'ai' | 'issues'>('library')
  const [gridMode, setGridMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size'>('recent')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [issueTab, setIssueTab] = useState('critical')

  // Audit data
  const { stats: auditStats, issues, productsWithoutImage, isLoading: auditLoading, bulkEnrichImages, isEnriching, enrichProgress } = useMediaAudit()

  // Library data
  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['media-library-assets', typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (typeFilter !== 'all') {
        query = query.eq('media_type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as MediaAsset[];
    }
  });

  // Computed stats
  const libraryStats = useMemo(() => ({
    totalImages: assets.filter(a => a.media_type === 'image').length,
    totalVideos: assets.filter(a => a.media_type === 'video').length,
    totalDocs: assets.filter(a => !['image', 'video'].includes(a.media_type)).length,
    totalSize: assets.reduce((s, a) => s + (a.file_size || 0), 0),
    avgOptScore: auditStats.score || 0,
    favorites: assets.filter(a => a.is_favorite).length,
  }), [assets, auditStats.score]);

  // Filtered & sorted assets
  const filteredAssets = useMemo(() => {
    let result = assets.filter(a =>
      a.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    if (sortBy === 'name') result.sort((a, b) => a.original_name.localeCompare(b.original_name));
    else if (sortBy === 'size') result.sort((a, b) => b.file_size - a.file_size);
    return result;
  }, [assets, searchQuery, sortBy]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    if (issueTab === 'all') return issues.slice(0, 30);
    if (issueTab === 'critical') return issues.filter(i => i.severity === 'critical').slice(0, 30);
    return issues.filter(i => i.issueType === issueTab).slice(0, 30);
  }, [issues, issueTab]);

  // Upload
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('media-library')
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('media-library')
          .getPublicUrl(fileName);

        const mediaType = file.type.startsWith('image/') ? 'image' :
          file.type.startsWith('video/') ? 'video' : 'document';

        await supabase.from('media_assets').insert({
          user_id: user.id,
          file_name: fileName,
          original_name: file.name,
          file_path: fileName,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          media_type: mediaType,
          folder_path: '/',
          tags: [],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library-assets'] });
      setIsUploadOpen(false);
      toast.success('Fichiers uploadés avec succès');
    },
    onError: (e) => toast.error(`Erreur: ${(e as Error).message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const toDelete = assets.filter(a => ids.includes(a.id));
      for (const asset of toDelete) {
        await supabase.storage.from('media-library').remove([asset.file_path]);
        await supabase.from('media_assets').delete().eq('id', asset.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library-assets'] });
      setSelectedFiles(new Set());
      toast.success('Fichiers supprimés');
    }
  });

  const updateAssetMutation = useMutation({
    mutationFn: async (updates: Partial<MediaAsset> & { id: string }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase.from('media_assets').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library-assets'] });
      toast.success('Média mis à jour');
    }
  });

  const onDrop = useCallback((files: File[]) => uploadMutation.mutate(files), [uploadMutation]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [], 'application/pdf': [] },
    noClick: true,
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedFiles);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedFiles(next);
  };

  const selectAll = () => {
    if (selectedFiles.size === filteredAssets.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredAssets.map(a => a.id)));
    }
  };

  const handleBulkEnrich = async () => {
    const ids = productsWithoutImage.slice(0, 20).map(p => p.id);
    await bulkEnrichImages(ids);
  };

  const issueCategories = [
    { id: 'critical', label: 'Critiques', icon: AlertTriangle, count: issues.filter(i => i.severity === 'critical').length, color: 'text-destructive', bg: 'bg-destructive/10' },
    { id: 'non_compliant', label: 'Non conformes', icon: ImageOff, count: auditStats.nonCompliant, color: 'text-warning', bg: 'bg-warning/10' },
    { id: 'missing_video', label: 'Sans vidéo', icon: VideoOff, count: auditStats.total - auditStats.withVideos, color: 'text-info', bg: 'bg-info/10' },
    { id: 'optimize', label: 'À optimiser', icon: Sparkles, count: auditStats.total - auditStats.withMultipleImages, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return { label: '⚠️ Critique', variant: 'destructive' as const }
      case 'warning': return { label: '⏳ À corriger', variant: 'secondary' as const }
      default: return { label: '💡 Suggestion', variant: 'outline' as const }
    }
  };

  const getMediaIcon = (type: string) => {
    if (type === 'image') return Image;
    if (type === 'video') return Video;
    if (type === 'audio') return FileAudio;
    return FileText;
  };

    const { t: tPages } = useTranslation('pages');

  return (
    <ChannablePageWrapper
      title={tPages('centreMedias.title')}
      subtitle={tPages('bibliothequePipeline.title')}
      description="Gérez, optimisez et distribuez tous vos assets médias depuis un seul hub"
      heroImage="products"
      badge={{ label: `${assets.length} assets • ${auditStats.withoutImages} sans image`, variant: auditStats.withoutImages > 0 ? 'destructive' : 'secondary' }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/media-editor')} className="gap-2">
            <Edit className="h-4 w-4" />Éditeur avancé
          </Button>
          <Button onClick={() => setIsUploadOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
            <Upload className="h-4 w-4" />Uploader
          </Button>
        </div>
      }
    >
      {/* Stats Bar */}
      <MediaStatsBar stats={libraryStats} isLoading={assetsLoading} />

      {/* Main Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)} className="mt-6">
        <TabsList className="bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="library" className="gap-2 data-[state=active]:shadow-md">
            <FolderOpen className="h-4 w-4" />Bibliothèque
            <Badge variant="secondary" className="ml-1 text-[10px]">{assets.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-2 data-[state=active]:shadow-md">
            <Zap className="h-4 w-4" />Pipeline CDN
          </TabsTrigger>
          <TabsTrigger value="cloudinary" className="gap-2 data-[state=active]:shadow-md">
            <Cloud className="h-4 w-4" />Cloudinary Produits
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2 data-[state=active]:shadow-md">
            <Sparkles className="h-4 w-4" />Intelligence IA
          </TabsTrigger>
          <TabsTrigger value="issues" className="gap-2 data-[state=active]:shadow-md">
            <AlertTriangle className="h-4 w-4" />Problèmes
            {issues.length > 0 && <Badge variant="destructive" className="ml-1 text-[10px]">{issues.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* === LIBRARY TAB === */}
        <TabsContent value="library" className="mt-4">
          <div {...getRootProps()} className={cn("min-h-[400px] transition-all rounded-xl", isDragActive && "ring-2 ring-primary ring-dashed bg-primary/5")}>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des médias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tout</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Vidéos</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[120px] h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Plus récents</SelectItem>
                    <SelectItem value="name">Nom A-Z</SelectItem>
                    <SelectItem value="size">Taille ↓</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border rounded-lg p-0.5">
                  <Button variant={gridMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setGridMode('grid')}>
                    <Grid className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant={gridMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setGridMode('list')}>
                    <List className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Bulk actions bar */}
            <AnimatePresence>
              {selectedFiles.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs gap-1.5">
                      <Check className="h-3.5 w-3.5" />
                      {selectedFiles.size === filteredAssets.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </Button>
                    <Badge variant="secondary">{selectedFiles.size} sélectionné(s)</Badge>
                    <div className="flex-1" />
                    <Button size="sm" variant="destructive" className="gap-1.5 text-xs" onClick={() => deleteMutation.mutate(Array.from(selectedFiles))}>
                      <Trash2 className="h-3.5 w-3.5" />Supprimer
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid / List */}
            {assetsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-16">
                <Image className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Aucun média trouvé</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery ? 'Modifiez votre recherche' : 'Commencez par uploader des fichiers'}
                </p>
                <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
                  <Upload className="h-4 w-4" />Uploader des médias
                </Button>
              </div>
            ) : gridMode === 'grid' ? (
              <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedFiles.has(asset.id);
                  const Icon = getMediaIcon(asset.media_type);
                  return (
                    <motion.div
                      key={asset.id}
                      variants={fadeUp}
                      className={cn(
                        "group relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5",
                        isSelected && "ring-2 ring-primary shadow-lg"
                      )}
                      onClick={() => { setSelectedAsset(asset); setDetailOpen(true); }}
                    >
                      {asset.media_type === 'image' ? (
                        <img src={asset.file_url} alt={asset.alt_text || asset.original_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-muted gap-2">
                          <Icon className="h-10 w-10 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{asset.media_type}</span>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                        <p className="text-white text-xs font-medium line-clamp-1">{asset.original_name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-white/60 text-[10px]">{formatFileSize(asset.file_size)}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(asset.file_url); toast.success('URL copiée'); }}>
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" asChild onClick={(e) => e.stopPropagation()}>
                              <a href={asset.file_url} download><Download className="h-3 w-3" /></a>
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Selection checkbox */}
                      <div
                        className={cn(
                          "absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-opacity",
                          isSelected ? "bg-primary border-primary opacity-100" : "bg-background/80 border-border opacity-0 group-hover:opacity-100"
                        )}
                        onClick={(e) => { e.stopPropagation(); toggleSelect(asset.id); }}
                      >
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>

                      {/* Badges */}
                      {asset.is_favorite && <Star className="absolute top-2 right-2 h-3.5 w-3.5 text-warning fill-yellow-500" />}
                      {!asset.alt_text && asset.media_type === 'image' && (
                        <Badge variant="destructive" className="absolute bottom-2 left-2 text-[8px] px-1 py-0 opacity-0 group-hover:opacity-100">No ALT</Badge>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="space-y-1.5">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedFiles.has(asset.id);
                  const Icon = getMediaIcon(asset.media_type);
                  return (
                    <div
                      key={asset.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors",
                        isSelected && "ring-1 ring-primary bg-primary/5"
                      )}
                      onClick={() => { setSelectedAsset(asset); setDetailOpen(true); }}
                    >
                      <div
                        className={cn("w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer", isSelected ? "bg-primary border-primary" : "border-border")}
                        onClick={(e) => { e.stopPropagation(); toggleSelect(asset.id); }}
                      >
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted">
                        {asset.media_type === 'image' ? (
                          <img src={asset.file_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Icon className="h-5 w-5 text-muted-foreground" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{asset.original_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(asset.file_size)} • {asset.media_type}
                          {asset.width && asset.height && ` • ${asset.width}×${asset.height}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {asset.tags?.length > 0 && <Badge variant="secondary" className="text-[10px]">{asset.tags.length} tags</Badge>}
                        {!asset.alt_text && asset.media_type === 'image' && <Badge variant="destructive" className="text-[10px]">No ALT</Badge>}
                        {asset.is_favorite && <Star className="h-3.5 w-3.5 text-warning fill-yellow-500" />}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(asset.file_url); toast.success('URL copiée'); }}>
                              <Copy className="h-4 w-4 mr-2" />Copier URL
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={asset.file_url} download><Download className="h-4 w-4 mr-2" />Télécharger</a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate([asset.id])}>
                              <Trash2 className="h-4 w-4 mr-2" />Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Drop overlay */}
            {isDragActive && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="p-12 rounded-2xl border-2 border-dashed border-primary bg-primary/5 text-center">
                  <Upload className="h-16 w-16 text-primary mx-auto mb-4" />
                  <p className="text-lg font-semibold">Déposez vos fichiers ici</p>
                  <p className="text-sm text-muted-foreground">Images, vidéos, documents</p>
                </div>
              </div>
            )}
            <input {...getInputProps()} />
          </div>
        </TabsContent>

        {/* === PIPELINE TAB === */}
        <TabsContent value="pipeline" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <MediaPipelineDashboard />
          </motion.div>
        </TabsContent>

        {/* === CLOUDINARY PRODUCTS TAB === */}
        <TabsContent value="cloudinary" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <ProductMediaManager />
          </motion.div>
        </TabsContent>

        {/* === AI TAB === */}
        <TabsContent value="ai" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <MediaAIPanel />
          </motion.div>
        </TabsContent>

        {/* === ISSUES TAB === */}
        <TabsContent value="issues" className="mt-4">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
            {/* Score card */}
            <motion.div variants={fadeUp}>
              <Card className="bg-gradient-to-r from-primary/5 via-violet-500/5 to-primary/5 border-primary/20 overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-violet-400/5 to-transparent" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">Score qualité médias</h3>
                      <p className="text-sm text-muted-foreground">{auditStats.withImages}/{auditStats.total} produits avec image</p>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-5xl font-black tracking-tight", auditStats.score >= 80 ? "text-success" : auditStats.score >= 60 ? "text-warning" : "text-destructive")}>
                        {auditStats.score}%
                      </span>
                      {auditStats.score < 80 && <p className="text-xs text-muted-foreground mt-1">Objectif: 80%</p>}
                    </div>
                  </div>
                  <Progress value={auditStats.score} className="h-3" />
                  <div className="flex justify-between mt-3 text-sm text-muted-foreground">
                    <span>{auditStats.withMultipleImages} avec galerie complète</span>
                    <span>{auditStats.withVideos} avec vidéo</span>
                  </div>
                  {auditStats.estimatedImpactWithImages > 0 && (
                    <div className="mt-4 p-3 bg-success/10 rounded-xl border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4 text-success" />
                        <span className="text-sm font-semibold text-success">+{auditStats.estimatedImpactWithImages.toLocaleString()}€ potentiel</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Category cards */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {issueCategories.map((cat) => (
                <Card
                  key={cat.id}
                  className={cn("cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group", issueTab === cat.id && "ring-2 ring-primary shadow-lg")}
                  onClick={() => setIssueTab(cat.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-2xl transition-transform group-hover:scale-110", cat.bg)}>
                        <cat.icon className={cn("h-5 w-5", cat.color)} />
                      </div>
                      <div>
                        <p className={cn("text-2xl font-black tabular-nums", cat.color)}>{cat.count}</p>
                        <p className="text-xs text-muted-foreground truncate">{cat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Enrich progress */}
            {isEnriching && (
              <motion.div variants={fadeUp}>
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold">Enrichissement IA en cours...</p>
                      <Progress value={(enrichProgress.current / enrichProgress.total) * 100} className="h-2 mt-2" />
                    </div>
                    <Badge variant="secondary">{enrichProgress.current}/{enrichProgress.total}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Enrich button */}
            {productsWithoutImage.length > 0 && !isEnriching && (
              <motion.div variants={fadeUp}>
                <Button onClick={handleBulkEnrich} className="gap-2 w-full sm:w-auto">
                  <Wand2 className="h-4 w-4" />Enrichir {Math.min(productsWithoutImage.length, 20)} produits sans image
                </Button>
              </motion.div>
            )}

            {/* Issues grid */}
            <motion.div variants={fadeUp}>
              <Card className="overflow-hidden">
                <CardHeader className="pb-3 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2"><Image className="h-5 w-5" />Produits à corriger</CardTitle>
                    <Badge variant="secondary">{filteredIssues.length} produits</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {auditLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
                    </div>
                  ) : filteredIssues.length === 0 ? (
                    <div className="text-center py-16">
                      <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">Tous les médias sont en ordre !</h3>
                      <p className="text-muted-foreground">Votre catalogue est optimisé</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {filteredIssues.map((issue: MediaIssue, idx) => {
                        const badge = getSeverityBadge(issue.severity);
                        return (
                          <motion.div
                            key={issue.product.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            className="group relative aspect-square rounded-xl border bg-muted overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary hover:shadow-lg transition-all"
                            onClick={() => navigate(`/products?id=${issue.product.id}`)}
                          >
                            {issue.product.image_url ? (
                              <img src={issue.product.image_url} alt={issue.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                <ImageOff className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-xs text-muted-foreground">Sans image</span>
                              </div>
                            )}
                            <Badge variant={badge.variant} className="absolute top-2 right-2 text-[10px] shadow-sm">
                              {issue.issueType === 'missing_image' ? '📷' : issue.issueType === 'non_compliant' ? '⚠️' : issue.issueType === 'missing_video' ? '🎬' : '✨'}
                            </Badge>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                              <p className="text-white text-xs font-semibold line-clamp-2">{issue.product.name}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-white/70 text-[10px]">{issue.suggestedAction}</span>
                                <ArrowRight className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Uploader des médias</DialogTitle>
          </DialogHeader>
          <UploadDropzone onUpload={(files) => uploadMutation.mutate(files)} isUploading={uploadMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Asset Detail Panel */}
      <MediaAssetDetailPanel
        asset={selectedAsset}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={(updates) => updateAssetMutation.mutate(updates)}
        onDelete={(id) => deleteMutation.mutate([id])}
      />
    </ChannablePageWrapper>
  )
}

// Upload dropzone sub-component
function UploadDropzone({ onUpload, isUploading }: { onUpload: (files: File[]) => void; isUploading: boolean }) {
  const onDrop = useCallback((files: File[]) => onUpload(files), [onUpload]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [], 'video/*': [], 'application/pdf': [] } });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30",
        isUploading && "opacity-50 pointer-events-none"
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="font-medium">Upload en cours...</p>
        </div>
      ) : (
        <>
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">
            {isDragActive ? 'Déposez ici...' : 'Glissez-déposez vos fichiers'}
          </p>
          <p className="text-sm text-muted-foreground">ou cliquez pour sélectionner</p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <Badge variant="secondary">JPG, PNG, WebP</Badge>
            <Badge variant="secondary">MP4, MOV</Badge>
            <Badge variant="secondary">PDF</Badge>
          </div>
        </>
      )}
    </div>
  );
}
