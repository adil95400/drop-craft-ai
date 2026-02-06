/**
 * PageLayout — Composant socle obligatoire pour toutes les pages
 * Design Channable : header simple (titre, sous-titre, 1-2 actions max)
 * Aucune page ne doit implémenter sa propre structure hors de ce composant.
 */
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  /** Titre principal de la page */
  title: string;
  /** Courte description sous le titre (1 phrase max) */
  subtitle?: string;
  /** 1-2 boutons d'action max */
  actions?: ReactNode;
  /** Contenu principal */
  children: ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
}

export function PageLayout({ title, subtitle, actions, children, className }: PageLayoutProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header — style Channable : compact, data-first */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
