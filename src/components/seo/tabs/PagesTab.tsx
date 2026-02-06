import { memo, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, RefreshCw, Wand2, ChevronLeft, ChevronRight, AlertTriangle, AlertCircle } from 'lucide-react';
import type { SEOAudit, SEOAuditPage } from '@/hooks/useSEOAudits';

interface PagesTabProps {
  selectedAuditId: string | null;
  selectedAudit: SEOAudit | null | undefined;
  pages: SEOAuditPage[];
  totalPages: number;
  isLoading: boolean;
  currentPage: number;
  pageTypeFilter: string;
  sortOrder: string;
  onPageChange: (page: number) => void;
  onPageTypeChange: (type: string) => void;
  onSortChange: (sort: string) => void;
  onViewIssues: (pageId: string) => void;
  onGenerateAI: (pageId: string) => void;
}

const PAGE_TYPE_LABELS: Record<string, string> = {
  product: 'Produit',
  category: 'Catégorie',
  blog: 'Blog',
  home: 'Accueil',
  cms: 'CMS',
  other: 'Autre',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

function getScoreProgressColor(score: number): string {
  if (score >= 80) return '[&>div]:bg-[hsl(var(--success))]';
  if (score >= 50) return '[&>div]:bg-[hsl(var(--warning))]';
  return '[&>div]:bg-[hsl(var(--destructive))]';
}

function PagesTabComponent({
  selectedAuditId, selectedAudit, pages, totalPages, isLoading,
  currentPage, pageTypeFilter, sortOrder,
  onPageChange, onPageTypeChange, onSortChange,
  onViewIssues, onGenerateAI,
}: PagesTabProps) {
  const totalPagesCount = useMemo(() => Math.ceil(totalPages / 50), [totalPages]);

  if (!selectedAuditId) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Sélectionnez un audit</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Cliquez sur un audit dans l'onglet « Audits » pour explorer ses pages analysées
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Pages analysées</CardTitle>
            <CardDescription className="mt-1">
              {totalPages} page{totalPages > 1 ? 's' : ''} — <span className="font-medium text-foreground">{selectedAudit?.base_url}</span>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={pageTypeFilter} onValueChange={onPageTypeChange}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="Tous types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="product">Produit</SelectItem>
                <SelectItem value="category">Catégorie</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
                <SelectItem value="home">Accueil</SelectItem>
                <SelectItem value="cms">CMS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={onSortChange}>
              <SelectTrigger className="w-32 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score_desc">Score ↓</SelectItem>
                <SelectItem value="score_asc">Score ↑</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Aucune page trouvée pour ces filtres.
          </div>
        ) : (
          <div className="space-y-2">
            {pages.map((page) => {
              const issues = page.issues_summary as Record<string, number> || {};
              return (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-sm truncate">{page.url}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {page.page_type && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {PAGE_TYPE_LABELS[page.page_type] || page.page_type}
                        </Badge>
                      )}
                      {page.http_status && (
                        <Badge variant={page.http_status === 200 ? 'default' : 'destructive'} className="text-xs">
                          {page.http_status}
                        </Badge>
                      )}
                      {(issues.critical || 0) > 0 && (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <AlertCircle className="h-3 w-3" />{issues.critical} critique{(issues.critical || 0) > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {(issues.major || 0) > 0 && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <AlertTriangle className="h-3 w-3" />{issues.major} majeur{(issues.major || 0) > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right w-20">
                      <div className={`text-xl font-bold tabular-nums ${getScoreColor(page.score)}`}>
                        {page.score}
                      </div>
                      <Progress value={page.score} className={`h-1.5 mt-1 ${getScoreProgressColor(page.score)}`} />
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onViewIssues(page.id)}>
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Voir les issues</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onGenerateAI(page.id)}>
                            <Wand2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Générer du contenu IA</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              );
            })}

            {totalPagesCount > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Précédent
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums">
                  Page {currentPage} / {totalPagesCount}
                </span>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPagesCount} onClick={() => onPageChange(currentPage + 1)}>
                  Suivant<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const PagesTab = memo(PagesTabComponent);
