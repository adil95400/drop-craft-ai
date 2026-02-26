/**
 * Page Builder Dashboard
 * Liste et gestion des landing pages
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  useLandingPages, 
  useLandingPagesStats,
  useDeleteLandingPage,
  usePublishLandingPage,
  useDuplicateLandingPage
} from '@/hooks/useLandingPages';
import { 
  Layout, Plus, Search, MoreVertical, Eye, Edit,
  Trash2, Copy, Globe, FileText, BarChart3, Loader2
} from 'lucide-react';
import { CreatePageDialog } from './CreatePageDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-500' },
  published: { label: 'Publié', color: 'bg-green-500' },
  archived: { label: 'Archivé', color: 'bg-red-500' },
};

export function PageBuilderDashboard() {
  const navigate = useNavigate();
  const locale = useDateFnsLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: pages = [], isLoading: isLoadingPages } = useLandingPages(statusFilter);
  const { data: stats, isLoading: isLoadingStats } = useLandingPagesStats();
  const deleteMutation = useDeleteLandingPage();
  const publishMutation = usePublishLandingPage();
  const duplicateMutation = useDuplicateLandingPage();

  // Filter pages by search
  const filteredPages = pages.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoadingStats ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Layout className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.total_pages || 0}</p>
                    <p className="text-xs text-muted-foreground">Pages totales</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Globe className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.published_pages || 0}</p>
                    <p className="text-xs text-muted-foreground">Publiées</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <FileText className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.draft_pages || 0}</p>
                    <p className="text-xs text-muted-foreground">Brouillons</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une page..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="draft">Brouillons</SelectItem>
              <SelectItem value="published">Publiées</SelectItem>
              <SelectItem value="archived">Archivées</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Page
        </Button>
      </div>

      {/* Pages Grid */}
      {isLoadingPages ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : filteredPages.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Aucune page créée</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Créez votre première landing page avec notre éditeur drag-and-drop
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPages.map((page) => {
            const statusConfig = STATUS_CONFIG[page.status] || STATUS_CONFIG.draft;
            
            return (
              <Card key={page.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="p-4">
                  {/* Preview / Thumbnail */}
                  <div 
                    className="h-32 bg-gradient-to-br from-muted to-muted/50 rounded-lg mb-4 flex items-center justify-center cursor-pointer group-hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/page-builder/${page.id}`)}
                  >
                    <Layout className="h-10 w-10 text-muted-foreground/50" />
                  </div>

                  {/* Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{page.title}</h3>
                        <Badge className={`${statusConfig.color} text-white text-xs`}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">/{page.slug}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Modifié {formatDistanceToNow(new Date(page.updated_at), { locale, addSuffix: true })}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/page-builder/${page.id}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Éditer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/p/${page.slug}`, '_blank')}>
                          <Eye className="h-4 w-4 mr-2" />
                          Prévisualiser
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateMutation.mutate(page.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Dupliquer
                        </DropdownMenuItem>
                        {page.status === 'draft' && (
                          <DropdownMenuItem onClick={() => publishMutation.mutate(page.id)}>
                            <Globe className="h-4 w-4 mr-2" />
                            Publier
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(page.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <CreatePageDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
