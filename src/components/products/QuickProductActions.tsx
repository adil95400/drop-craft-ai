import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  Plus,
  Upload,
  Download,
  RefreshCw,
  Sparkles,
  Filter,
  LayoutGrid,
  List,
  Search,
  ChevronDown,
  FolderOpen,
  Tag,
  DollarSign,
  Package,
  Settings2,
  Zap,
  Copy,
  Trash2,
  Edit3,
  MoreVertical,
  FileSpreadsheet,
  FileJson,
  Image,
  Archive,
  Star,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickProductActionsProps {
  selectedCount: number;
  totalCount: number;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onCreateNew: () => void;
  onImport: () => void;
  onExport: (format: 'csv' | 'json' | 'excel') => void;
  onRefresh: () => void;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  onBulkDuplicate: () => void;
  onBulkEnrich: () => void;
  onBulkOptimize: () => void;
  onBulkArchive: () => void;
  onBulkFavorite: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isRefreshing?: boolean;
}

export function QuickProductActions({
  selectedCount,
  totalCount,
  viewMode,
  onViewModeChange,
  onCreateNew,
  onImport,
  onExport,
  onRefresh,
  onBulkEdit,
  onBulkDelete,
  onBulkDuplicate,
  onBulkEnrich,
  onBulkOptimize,
  onBulkArchive,
  onBulkFavorite,
  searchTerm,
  onSearchChange,
  isRefreshing = false
}: QuickProductActionsProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Recherche rapide */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, SKU, catégorie..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 h-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => onSearchChange('')}
            >
              ×
            </Button>
          )}
        </div>

        {/* Actions principales */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sélection active */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 p-1 px-2 bg-primary/10 rounded-lg border border-primary/20 animate-in fade-in">
              <Badge variant="secondary" className="gap-1">
                <Package className="h-3 w-3" />
                {selectedCount}
              </Badge>
              
              <div className="h-4 w-px bg-border" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBulkEdit}>
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Éditer</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBulkDuplicate}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Dupliquer</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBulkEnrich}>
                    <Sparkles className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Enrichir IA</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBulkOptimize}>
                    <TrendingUp className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Optimiser prix</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBulkFavorite}>
                    <Star className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Favoris</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBulkArchive}>
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Archiver</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onBulkDelete}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Supprimer</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Vue */}
          <div className="flex items-center border rounded-lg p-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => onViewModeChange('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Grille</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => onViewModeChange('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Liste</TooltipContent>
            </Tooltip>
          </div>

          {/* Refresh */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Actualiser</TooltipContent>
          </Tooltip>

          {/* Import */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={onImport}>
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Importer</TooltipContent>
          </Tooltip>

          {/* Export */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Exporter</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onExport('csv')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('excel')}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('json')}>
                <FileJson className="mr-2 h-4 w-4 text-yellow-600" />
                JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Créer */}
          <Button onClick={onCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau produit</span>
          </Button>
        </div>
      </div>

      {/* Barre d'info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
        <span>
          {totalCount} produit{totalCount > 1 ? 's' : ''}
          {searchTerm && ` correspondant à "${searchTerm}"`}
        </span>
        {selectedCount > 0 && (
          <span className="text-primary font-medium">
            {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}
