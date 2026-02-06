import { memo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Issues SEO</DialogTitle>
          <DialogDescription>
            {issues.length} problème{issues.length > 1 ? 's' : ''} détecté{issues.length > 1 ? 's' : ''} sur cette page
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/10 mb-3">
              <CheckCircle className="h-7 w-7 text-success" />
            </div>
            <p className="font-medium">Aucune issue détectée</p>
            <p className="text-sm text-muted-foreground mt-1">Cette page est bien optimisée !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => {
              const config = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.info;
              const Icon = config.icon;

              return (
                <div key={issue.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${
                      issue.severity === 'critical' ? 'text-destructive' :
                      issue.severity === 'major' ? 'text-warning' : 'text-muted-foreground'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
                        <span className="font-mono text-xs text-muted-foreground">{issue.code}</span>
                      </div>
                      <p className="font-medium text-sm">{issue.message}</p>
                      {issue.recommendation && (
                        <p className="text-sm text-muted-foreground mt-1.5">{issue.recommendation}</p>
                      )}
                      {issue.is_fixable && issue.fix_actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {issue.fix_actions.map((action: string) => (
                            <Button
                              key={action}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={isApplying}
                              onClick={() => onApplyFix(action, selectedPageId || undefined)}
                            >
                              <Wrench className="mr-1 h-3 w-3" />
                              {action.replace(/_/g, ' ')}
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
      </DialogContent>
    </Dialog>
  );
}

export const IssuesModal = memo(IssuesModalComponent);
