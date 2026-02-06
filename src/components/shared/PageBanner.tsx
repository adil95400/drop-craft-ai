/**
 * PageBanner — Bannière contextuelle compacte pour les pages
 * Affiche un gradient thématique avec icône et description courte
 */
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BannerTheme = 'blue' | 'purple' | 'green' | 'orange' | 'rose' | 'cyan' | 'indigo';

interface PageBannerProps {
  icon: LucideIcon;
  title: string;
  description: string;
  theme?: BannerTheme;
  actions?: ReactNode;
  className?: string;
}

const THEME_STYLES: Record<BannerTheme, { bg: string; icon: string; border: string }> = {
  blue:   { bg: 'from-blue-500/10 via-blue-400/5 to-transparent',   icon: 'bg-blue-500/15 text-blue-600',   border: 'border-blue-500/10' },
  purple: { bg: 'from-purple-500/10 via-purple-400/5 to-transparent', icon: 'bg-purple-500/15 text-purple-600', border: 'border-purple-500/10' },
  green:  { bg: 'from-green-500/10 via-green-400/5 to-transparent',  icon: 'bg-green-500/15 text-green-600',  border: 'border-green-500/10' },
  orange: { bg: 'from-orange-500/10 via-orange-400/5 to-transparent', icon: 'bg-orange-500/15 text-orange-600', border: 'border-orange-500/10' },
  rose:   { bg: 'from-rose-500/10 via-rose-400/5 to-transparent',   icon: 'bg-rose-500/15 text-rose-600',   border: 'border-rose-500/10' },
  cyan:   { bg: 'from-cyan-500/10 via-cyan-400/5 to-transparent',   icon: 'bg-cyan-500/15 text-cyan-600',   border: 'border-cyan-500/10' },
  indigo: { bg: 'from-indigo-500/10 via-indigo-400/5 to-transparent', icon: 'bg-indigo-500/15 text-indigo-600', border: 'border-indigo-500/10' },
};

export function PageBanner({ icon: Icon, title, description, theme = 'blue', actions, className }: PageBannerProps) {
  const styles = THEME_STYLES[theme];

  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl border p-5',
      `bg-gradient-to-r ${styles.bg}`,
      styles.border,
      className
    )}>
      {/* Decorative circles */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />
      <div className="absolute -right-2 -bottom-8 h-20 w-20 rounded-full bg-gradient-to-tl from-primary/3 to-transparent" />

      <div className="relative flex items-center gap-4">
        <div className={cn('shrink-0 rounded-lg p-2.5', styles.icon)}>
          <Icon className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
        </div>

        {actions && (
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
