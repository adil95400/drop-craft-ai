import React from 'react';
import { Star } from 'lucide-react';
import { useFavorites } from '@/stores/favoritesStore';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FavoriteButtonProps {
  moduleId: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function FavoriteButton({
  moduleId,
  variant = 'ghost',
  size = 'icon',
  className,
  showLabel = false
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(moduleId);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(moduleId);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(moduleId);
              }
            }}
            className={cn(
              'inline-flex items-center justify-center rounded-md transition-all duration-200 cursor-pointer',
              'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              size === 'icon' && 'h-8 w-8',
              size === 'sm' && 'h-7 px-2',
              size === 'default' && 'h-9 px-3',
              size === 'lg' && 'h-10 px-4',
              favorite && 'text-yellow-500 hover:text-yellow-600',
              className
            )}
          >
            <Star
              className={cn(
                'h-4 w-4 transition-all duration-200',
                favorite && 'fill-yellow-500'
              )}
            />
            {showLabel && (
              <span className="ml-2">
                {favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
