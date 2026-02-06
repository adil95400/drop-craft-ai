import { memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Globe, Download, FileText, Play, RefreshCw } from 'lucide-react';
import type { SEOAudit } from '@/hooks/useSEOAudits';

interface AuditsTabProps {
  audits: SEOAudit[];
  isLoading: boolean;
  isExporting: boolean;
  onNewAudit: () => void;
  onSelectAudit: (id: string) => void;
  onExport: (id: string) => void;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  queued: { label: 'En attente', variant: 'outline' },
  running: { label: 'En cours', variant: 'secondary' },
  succeeded: { label: 'Terminé', variant: 'default' },
  failed: { label: 'Échoué', variant: 'destructive' },
  canceled: { label: 'Annulé', variant: 'outline' },
};

const MODE_LABELS: Record<string, string> = {
  single_url: 'URL unique',
  sitemap: 'Sitemap',
  crawl: 'Crawl',
};

function AuditsTabComponent({ audits, isLoading, isExporting, onNewAudit, onSelectAudit, onExport }: AuditsTabProps) {
  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Chargement des audits…</p>
        </CardContent>
      </Card>
    );
  }

  if (audits.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun audit SEO</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Lancez votre premier audit pour analyser les performances SEO de vos pages
          </p>
          <Button onClick={onNewAudit} size="lg">
            <Play className="mr-2 h-4 w-4" />
            Lancer un audit
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {audits.map((audit) => {
        const status = STATUS_MAP[audit.status] || STATUS_MAP.queued;
        const modeLabel = MODE_LABELS[audit.mode] || audit.mode;
        const summary = audit.summary as Record<string, any> | undefined;

        return (
          <Card
            key={audit.id}
            className="group cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all duration-200"
            onClick={() => onSelectAudit(audit.id)}
          >
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-semibold truncate">{audit.base_url}</span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <Badge variant="outline" className="text-xs">{modeLabel}</Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>{new Date(audit.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="text-border">•</span>
                  <span>Max {audit.max_urls} URLs</span>
                  {summary?.avg_score != null && (
                    <>
                      <span className="text-border">•</span>
                      <span className="font-medium text-foreground">Score: {summary.avg_score}/100</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex gap-2 ml-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onExport(audit.id); }} disabled={isExporting}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Exporter en CSV</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onSelectAudit(audit.id); }}>
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Voir les pages</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export const AuditsTab = memo(AuditsTabComponent);
