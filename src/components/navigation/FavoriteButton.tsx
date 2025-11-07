import React from 'react';
import { Star } from 'lucide-react';
import { useFavorites } from '@/stores/favoritesStore';
import { Button } from '@/components/ui/button';
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
          <Button
            variant={variant}
            size={size}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(moduleId);
            }}
            className={cn(
              'transition-all duration-200',
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
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
