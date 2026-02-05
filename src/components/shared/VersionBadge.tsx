import { VERSION_INFO, isStaging } from '@/config/version';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VersionBadgeProps {
  showFull?: boolean;
  className?: string;
}

export function VersionBadge({ showFull = false, className }: VersionBadgeProps) {
  const staging = isStaging();
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {staging && (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
          STAGING
        </Badge>
      )}
      <span className="text-xs text-muted-foreground font-mono">
        {showFull ? VERSION_INFO.fullVersion : `v${VERSION_INFO.version}`}
      </span>
    </div>
  );
}
