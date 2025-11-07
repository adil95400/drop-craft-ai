import React, { useMemo, useState } from 'react';
import { Star, Trash2, GripVertical, X } from 'lucide-react';
import { useFavorites } from '@/stores/favoritesStore';
import { useModules } from '@/hooks/useModules';
import { MODULE_REGISTRY } from '@/config/modules';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableFavoriteItemProps {
  moduleId: string;
  onRemove: (moduleId: string) => void;
}

function SortableFavoriteItem({ moduleId, onRemove }: SortableFavoriteItemProps) {
  const module = MODULE_REGISTRY[moduleId];
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: moduleId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!module) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 bg-card border rounded-lg transition-all',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      
      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{module.name}</p>
          {module.minPlan !== 'standard' && (
            <Badge
              variant="secondary"
              className={cn(
                'text-xs h-5 px-1.5 flex-shrink-0',
                module.minPlan === 'ultra_pro'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                  : 'bg-purple-500 text-white'
              )}
            >
              {module.minPlan === 'ultra_pro' ? 'ULTRA' : 'PRO'}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{module.description}</p>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(moduleId)}
        className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function FavoritesManager() {
  const [open, setOpen] = useState(false);
  const { favorites, removeFavorite, reorderFavorites, clearFavorites } = useFavorites();
  const { canAccess } = useModules();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const favoriteModuleIds = useMemo(() => {
    return favorites
      .map(f => f.moduleId)
      .filter(id => MODULE_REGISTRY[id] && canAccess(id));
  }, [favorites, canAccess]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = favoriteModuleIds.indexOf(active.id);
      const newIndex = favoriteModuleIds.indexOf(over.id);
      const newOrder = arrayMove(favoriteModuleIds, oldIndex, newIndex);
      reorderFavorites(newOrder);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          Gérer les favoris
          <Badge variant="secondary" className="text-xs">
            {favoriteModuleIds.length}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            Gérer mes favoris
          </DialogTitle>
          <DialogDescription>
            Organisez vos modules favoris par glisser-déposer. Les modules en haut apparaissent en premier.
          </DialogDescription>
        </DialogHeader>

        {favoriteModuleIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Star className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Vous n'avez pas encore de modules favoris.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Ajoutez des modules en cliquant sur l'étoile ⭐ dans la navigation.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[400px] pr-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={favoriteModuleIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {favoriteModuleIds.map((moduleId) => (
                      <SortableFavoriteItem
                        key={moduleId}
                        moduleId={moduleId}
                        onRemove={removeFavorite}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ScrollArea>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {favoriteModuleIds.length} module{favoriteModuleIds.length > 1 ? 's' : ''} en favoris
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir supprimer tous les favoris ?')) {
                    clearFavorites();
                  }
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Tout supprimer
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
