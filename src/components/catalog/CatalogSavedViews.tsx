/**
 * Saved Views — sauvegarde/restauration des filtres et tri du catalogue
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bookmark, Plus, Trash2, Check } from 'lucide-react';

export interface CatalogViewState {
  search: string;
  statusFilter: string;
  categoryFilter: string;
  sourceFilter: string;
  sortField: string;
  sortDirection: string;
  viewMode: string;
  itemsPerPage: number;
}

interface SavedView {
  id: string;
  name: string;
  state: CatalogViewState;
  createdAt: string;
}

const STORAGE_KEY = 'catalog-saved-views';

function loadViews(): SavedView[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveViews(views: SavedView[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
}

interface CatalogSavedViewsProps {
  currentState: CatalogViewState;
  onApply: (state: CatalogViewState) => void;
}

export function CatalogSavedViews({ currentState, onApply }: CatalogSavedViewsProps) {
  const [views, setViews] = useState<SavedView[]>(loadViews);
  const [isNaming, setIsNaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  useEffect(() => {
    saveViews(views);
  }, [views]);

  const handleSave = () => {
    if (!newName.trim()) return;
    const view: SavedView = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      state: { ...currentState },
      createdAt: new Date().toISOString(),
    };
    setViews(prev => [...prev, view]);
    setNewName('');
    setIsNaming(false);
    setActiveViewId(view.id);
  };

  const handleApply = (view: SavedView) => {
    setActiveViewId(view.id);
    onApply(view.state);
  };

  const handleDelete = (id: string) => {
    setViews(prev => prev.filter(v => v.id !== id));
    if (activeViewId === id) setActiveViewId(null);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bookmark className="h-4 w-4" />
          Vues
          {views.length > 0 && (
            <Badge variant="secondary" className="h-5 min-w-5 px-1 text-[10px]">
              {views.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {views.length === 0 && !isNaming && (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            Aucune vue sauvegardée
          </div>
        )}
        {views.map(view => (
          <DropdownMenuItem
            key={view.id}
            className="flex items-center justify-between cursor-pointer"
            onClick={() => handleApply(view)}
          >
            <div className="flex items-center gap-2 min-w-0">
              {activeViewId === view.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              <span className="truncate">{view.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0 opacity-50 hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); handleDelete(view.id); }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </DropdownMenuItem>
        ))}
        {views.length > 0 && <DropdownMenuSeparator />}
        {isNaming ? (
          <div className="p-2 flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom de la vue..."
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsNaming(false); }}
            />
            <Button size="sm" className="h-8 px-3" onClick={handleSave} disabled={!newName.trim()}>
              OK
            </Button>
          </div>
        ) : (
          <DropdownMenuItem onClick={() => setIsNaming(true)} className="gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            Sauvegarder la vue actuelle
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
