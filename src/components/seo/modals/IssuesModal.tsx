/**
 * IssuesModal — Refactoré sur BaseModal (socle)
 */
import { memo } from 'react';
import { BaseModal } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, RefreshCw, Wrench, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { SEOIssue } from '@/hooks/useSEOAudits';

interface IssuesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issues: SEOIssue[];
  isLoading: boolean;
  isApplying: boolean;
  onApplyFix: (action: string, pageId?: string) => void;
  selectedPageId: string | null;
}

const SEVERITY_CONFIG: Record<string, { variant: 'destructive' | 'secondary' | 'outline' | 'default'; icon: typeof AlertCircle; label: string }> = {
  critical: { variant: 'destructive', icon: AlertCircle, label: 'Critique' },
  major: { variant: 'secondary', icon: AlertTriangle, label: 'Majeur' },
  minor: { variant: 'outline', icon: Info, label: 'Mineur' },
  info: { variant: 'outline', icon: Info, label: 'Info' },
};

function IssuesModalComponent({ open, onOpenChange, issues, isLoading, isApplying, onApplyFix, selectedPageId }: IssuesModalProps) {
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Issues SEO"
      description={`${issues.length} problème${issues.length > 1 ? 's' : ''} détecté${issues.length > 1 ? 's' : ''}`}
      hideFooter
      size="lg"
    >
      {isLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-3">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <p className="font-medium">Aucune issue détectée</p>
          <p className="text-sm text-muted-foreground mt-1">Page bien optimisée !</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {issues.map((issue) => {
            const config = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.info;
            const Icon = config.icon;
            return (
              <div key={issue.id} className="p-3 border rounded-lg">
                <div className="flex items-start gap-2.5">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${
                    issue.severity === 'critical' ? 'text-destructive' :
                    issue.severity === 'major' ? 'text-warning' : 'text-muted-foreground'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
                      <span className="font-mono text-xs text-muted-foreground">{issue.code}</span>
                    </div>
                    <p className="font-medium text-sm">{issue.message}</p>
                    {issue.recommendation && <p className="text-xs text-muted-foreground mt-1">{issue.recommendation}</p>}
                    {issue.is_fixable && issue.fix_actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {issue.fix_actions.map((action: string) => (
                          <Button key={action} variant="outline" size="sm" className="h-7 text-xs" disabled={isApplying}
                            onClick={() => onApplyFix(action, selectedPageId || undefined)}>
                            <Wrench className="mr-1 h-3 w-3" />{action.replace(/_/g, ' ')}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BaseModal>
  );
}

export const IssuesModal = memo(IssuesModalComponent);
