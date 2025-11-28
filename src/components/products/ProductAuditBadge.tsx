/**
 * Badge de score d'audit produit
 * Affiche le score global avec couleur selon le niveau
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';

interface ProductAuditBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ProductAuditBadge({ 
  score, 
  size = 'md', 
  showLabel = true,
  className 
}: ProductAuditBadgeProps) {
  const getScoreVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 70) return 'default'; // Vert
    if (score >= 40) return 'secondary'; // Orange
    return 'destructive'; // Rouge
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-700 bg-green-100 border-green-300 dark:text-green-400 dark:bg-green-950';
    if (score >= 40) return 'text-orange-700 bg-orange-100 border-orange-300 dark:text-orange-400 dark:bg-orange-950';
    return 'text-red-700 bg-red-100 border-red-300 dark:text-red-400 dark:bg-red-950';
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        sizeClasses[size],
        getScoreColor(score),
        className
      )}
    >
      <Target className={iconSizes[size]} />
      <span>{Math.round(score)}</span>
      {showLabel && size !== 'sm' && (
        <span className="opacity-75 font-normal">/100</span>
      )}
    </div>
  );
}
