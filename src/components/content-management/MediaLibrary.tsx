import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDropzone } from 'react-dropzone';
import {
  Search, Upload, Image, Video, FileAudio, FileText, Folder,
  Grid, List, Star, StarOff, Trash2, Download, Copy, Edit,
  MoreVertical, FolderPlus, Filter, Tag, Info, X, Check
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
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

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

interface MediaFolder {
  id: string;
  name: string;
  path: string;
  parent_id: string | null;
  color: string | null;
}

const MEDIA_TYPES = {
  all: { label: 'Tout', icon: Grid },
  image: { label: 'Images', icon: Image },
  video: { label: 'Vidéos', icon: Video },
  audio: { label: 'Audio', icon: FileAudio },
  document: { label: 'Documents', icon: FileText },
};

export function MediaLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState('/');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['media-assets', selectedType, currentFolder],
    queryFn: async () => {
      let query = supabase
        .from('media_assets')
        .select('*')
        .eq('folder_path', currentFolder)
        .order('created_at', { ascending: false });

      if (selectedType !== 'all') {
        query = query.eq('media_type', selectedType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MediaAsset[];
    }
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['media-folders', currentFolder],
    queryFn: async () => {
      const parentPath = currentFolder === '/' ? null : currentFolder;
      let query = supabase
        .from('media_folders')
        .select('*')
        .order('name');

      if (parentPath) {
        query = query.eq('path', parentPath);
      } else {
        query = query.is('parent_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MediaFolder[];
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const uploadedAssets = [];

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
          file.type.startsWith('video/') ? 'video' :
          file.type.startsWith('audio/') ? 'audio' : 'document';

        const { data: asset, error: insertError } = await supabase
          .from('media_assets')
          .insert({
            user_id: user.id,
            file_name: fileName,
            original_name: file.name,
            file_path: fileName,
            file_url: publicUrl,
            file_size: file.size,
            mime_type: file.type,
            media_type: mediaType,
            folder_path: currentFolder,
            tags: [],
          })
          .select()
          .single();

        if (insertError) throw insertError;
        uploadedAssets.push(asset);
      }

      return uploadedAssets;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      setIsUploadOpen(false);
      toast.success('Fichiers uploadés avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (assetIds: string[]) => {
      const assetsToDelete = assets.filter(a => assetIds.includes(a.id));
      
      for (const asset of assetsToDelete) {
        await supabase.storage.from('media-library').remove([asset.file_path]);
        await supabase.from('media_assets').delete().eq('id', asset.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      setSelectedFiles(new Set());
      toast.success('Fichiers supprimés');
    }
  });

  const updateAssetMutation = useMutation({
    mutationFn: async (updates: Partial<MediaAsset> & { id: string }) => {
      const { error } = await supabase
        .from('media_assets')
        .update(updates)
        .eq('id', updates.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      setIsEditOpen(false);
      toast.success('Média mis à jour');
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    uploadMutation.mutate(acceptedFiles);
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
      'video/*': ['.mp4', '.webm'],
      'audio/*': ['.mp3', '.wav'],
      'application/pdf': ['.pdf'],
    }
  });

  const filteredAssets = assets.filter(asset =>
    asset.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return FileAudio;
      default: return FileText;
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFiles(newSelected);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiée');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des médias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MEDIA_TYPES).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {selectedFiles.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteMutation.mutate(Array.from(selectedFiles))}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer ({selectedFiles.size})
            </Button>
          )}
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Uploader
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Uploader des médias</DialogTitle>
              </DialogHeader>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Déposez les fichiers ici...</p>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">
                      Glissez-déposez des fichiers ici
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ou cliquez pour sélectionner
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">
                      Images, vidéos, audio, PDF (max 50MB)
                    </p>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(MEDIA_TYPES).map(([type, { label, icon: Icon }]) => {
          const count = type === 'all' 
            ? assets.length 
            : assets.filter(a => a.media_type === type).length;
          return (
            <Card 
              key={type}
              className={`cursor-pointer transition-colors ${selectedType === type ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedType(type)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content */}
      <ScrollArea className="h-[500px]">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <Image className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun média</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par uploader des fichiers
            </p>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Uploader
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredAssets.map((asset) => {
              const Icon = getMediaIcon(asset.media_type);
              const isSelected = selectedFiles.has(asset.id);
              return (
                <div
                  key={asset.id}
                  className={`group relative aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all
                    ${isSelected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-primary/50'}`}
                  onClick={() => setSelectedAsset(asset)}
                >
                  {asset.media_type === 'image' ? (
                    <img
                      src={asset.file_url}
                      alt={asset.alt_text || asset.original_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Icon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-xs truncate">{asset.original_name}</p>
                      <p className="text-white/70 text-xs">{formatFileSize(asset.file_size)}</p>
                    </div>
                  </div>
                  <div
                    className={`absolute top-2 left-2 w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer
                      ${isSelected ? 'bg-primary border-primary' : 'bg-white/80 border-white/50 opacity-0 group-hover:opacity-100'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(asset.id);
                    }}
                  >
                    {isSelected && <Check className="h-4 w-4 text-white" />}
                  </div>
                  {asset.is_favorite && (
                    <Star className="absolute top-2 right-2 h-4 w-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAssets.map((asset) => {
              const Icon = getMediaIcon(asset.media_type);
              return (
                <div
                  key={asset.id}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                    {asset.media_type === 'image' ? (
                      <img src={asset.file_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{asset.original_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(asset.file_size)} • {format(new Date(asset.created_at), 'dd MMM yyyy', { locale: getDateFnsLocale() })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {asset.tags?.length > 0 && (
                      <Badge variant="secondary">{asset.tags.length} tags</Badge>
                    )}
                    <Badge variant="outline">{asset.media_type}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyUrl(asset.file_url)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copier l'URL
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(asset.file_url, '_blank')}>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteMutation.mutate([asset.id])}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Asset Detail Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-4xl">
          {selectedAsset && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                {selectedAsset.media_type === 'image' ? (
                  <img
                    src={selectedAsset.file_url}
                    alt={selectedAsset.alt_text || ''}
                    className="w-full h-full object-contain"
                  />
                ) : selectedAsset.media_type === 'video' ? (
                  <video src={selectedAsset.file_url} controls className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {(() => {
                      const Icon = getMediaIcon(selectedAsset.media_type);
                      return <Icon className="h-24 w-24 text-muted-foreground" />;
                    })()}
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedAsset.original_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedAsset.file_size)} • {selectedAsset.mime_type}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Titre</Label>
                    <Input
                      value={selectedAsset.title || ''}
                      onChange={(e) => setSelectedAsset({ ...selectedAsset, title: e.target.value })}
                      placeholder="Titre du média"
                    />
                  </div>
                  <div>
                    <Label>Texte alternatif (SEO)</Label>
                    <Input
                      value={selectedAsset.alt_text || ''}
                      onChange={(e) => setSelectedAsset({ ...selectedAsset, alt_text: e.target.value })}
                      placeholder="Description pour le SEO"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={selectedAsset.description || ''}
                      onChange={(e) => setSelectedAsset({ ...selectedAsset, description: e.target.value })}
                      placeholder="Description détaillée"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Tags (séparés par des virgules)</Label>
                    <Input
                      value={selectedAsset.tags?.join(', ') || ''}
                      onChange={(e) => setSelectedAsset({
                        ...selectedAsset,
                        tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                      })}
                      placeholder="produit, marketing, hero"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    onClick={() => updateAssetMutation.mutate({
                      id: selectedAsset.id,
                      title: selectedAsset.title,
                      alt_text: selectedAsset.alt_text,
                      description: selectedAsset.description,
                      tags: selectedAsset.tags,
                    })}
                  >
                    Enregistrer
                  </Button>
                  <Button variant="outline" onClick={() => copyUrl(selectedAsset.file_url)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier URL
                  </Button>
                  <Button variant="outline" onClick={() => window.open(selectedAsset.file_url, '_blank')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
