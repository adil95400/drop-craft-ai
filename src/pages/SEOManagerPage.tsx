import { useState, useCallback, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Play, Search, Target, Sparkles, Lightbulb, FileText, RefreshCw, BarChart3 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useSEOAudits, useSEOAuditDetail, useSEOAuditPages, useSEOIssues, useSEOAIGenerate, useSEOFixApply, useSEOExport } from '@/hooks/useSEOAudits';
import { useRealSEO } from '@/hooks/useRealSEO';

import { AuditsTab } from '@/components/seo/tabs/AuditsTab';
import { PagesTab } from '@/components/seo/tabs/PagesTab';
import { KeywordsTab } from '@/components/seo/tabs/KeywordsTab';
import { NewAuditModal } from '@/components/seo/modals/NewAuditModal';
import { IssuesModal } from '@/components/seo/modals/IssuesModal';
import { AIGenerateModal } from '@/components/seo/modals/AIGenerateModal';
import { AddKeywordModal } from '@/components/seo/AddKeywordModal';
import { SEOStatsRow } from '@/components/seo/SEOStatsRow';
import { ProductSeoHub } from '@/components/seo/ProductSeoHub';

const SEOContentGenerator = lazy(() => import('@/components/seo/SEOContentGenerator').then(m => ({ default: m.SEOContentGenerator })));
const SEORecommendationsCard = lazy(() => import('@/components/seo/SEORecommendationsCard').then(m => ({ default: m.SEORecommendationsCard })));

export default function SEOManagerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);
  const [showNewAuditModal, setShowNewAuditModal] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [showIssuesModal, setShowIssuesModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [pagesPage, setPagesPage] = useState(1);
  const [pageTypeFilter, setPageTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('score_desc');

  const { audits, isLoading: isLoadingAudits, createAudit, isCreating } = useSEOAudits();
  const { audit: selectedAudit } = useSEOAuditDetail(selectedAuditId);
  const { pages, total: totalPages, isLoading: isLoadingPages } = useSEOAuditPages(selectedAuditId, { page: pagesPage, limit: 50, pageType: pageTypeFilter === 'all' ? undefined : pageTypeFilter, sort: sortOrder });
  const { issues, isLoading: isLoadingIssues } = useSEOIssues(selectedPageId);
  const { generate: generateAI, isGenerating } = useSEOAIGenerate();
  const { applyFix, isApplying } = useSEOFixApply();
  const { exportAudit, isExporting } = useSEOExport();
  const { keywords, stats, isLoading: isLoadingKeywords, updateKeyword } = useRealSEO();

  const handleCreateAudit = useCallback((params: any) => { createAudit(params); setShowNewAuditModal(false); }, [createAudit]);
  const handleExport = useCallback((auditId: string) => { exportAudit({ auditId, format: 'csv' }); }, [exportAudit]);
  const handleSelectAudit = useCallback((id: string) => { setSelectedAuditId(id); }, []);
  const handleViewIssues = useCallback((pageId: string) => { setSelectedPageId(pageId); setShowIssuesModal(true); }, []);
  const handleGenerateAI = useCallback((pageId: string) => { setSelectedPageId(pageId); setShowAIModal(true); }, []);
  const handleAIGenerate = useCallback((params: any) => { generateAI(params); setShowAIModal(false); }, [generateAI]);
  const handleApplyFix = useCallback((action: string, pageId?: string) => { applyFix({ action, page_id: pageId }); }, [applyFix]);
  const handleToggleKeyword = useCallback((id: string, active: boolean) => { updateKeyword({ id, updates: { tracking_active: active } }); }, [updateKeyword]);

  return (
    <>
      <Helmet>
        <title>SEO Manager — Audit & Optimisation | ShopOpti</title>
        <meta name="description" content="Audits SEO, scoring produit, historique versionné, génération IA et impact business." />
      </Helmet>

      <ChannablePageWrapper
        title="SEO Manager"
        description="Audit structuré, scoring produit, historique versionné et impact business"
        heroImage="marketing"
        badge={{ label: 'SEO Pro', icon: Search }}
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9" onClick={() => setShowAddKeywordModal(true)}>
              <Plus className="mr-1.5 h-4 w-4" />Mot-clé
            </Button>
            <Button size="sm" className="h-9" onClick={() => setShowNewAuditModal(true)}>
              <Play className="mr-1.5 h-4 w-4" />Nouvel Audit
            </Button>
          </>
        }
      >
        <SEOStatsRow auditsCount={audits.length} averageScore={stats.averageScore} totalKeywords={stats.totalKeywords} trackingKeywords={stats.trackingKeywords} totalPages={stats.totalPages} />

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 h-10">
            <TabsTrigger value="products" className="gap-1.5 text-xs sm:text-sm"><BarChart3 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Scoring</span></TabsTrigger>
            <TabsTrigger value="audits" className="gap-1.5 text-xs sm:text-sm"><Search className="h-3.5 w-3.5" /><span className="hidden sm:inline">Audits</span></TabsTrigger>
            <TabsTrigger value="pages" className="gap-1.5 text-xs sm:text-sm"><FileText className="h-3.5 w-3.5" /><span className="hidden sm:inline">Pages</span></TabsTrigger>
            <TabsTrigger value="keywords" className="gap-1.5 text-xs sm:text-sm"><Target className="h-3.5 w-3.5" /><span className="hidden sm:inline">Mots-clés</span></TabsTrigger>
            <TabsTrigger value="generator" className="gap-1.5 text-xs sm:text-sm"><Sparkles className="h-3.5 w-3.5" /><span className="hidden sm:inline">IA</span></TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-1.5 text-xs sm:text-sm"><Lightbulb className="h-3.5 w-3.5" /><span className="hidden sm:inline">Tips</span></TabsTrigger>
          </TabsList>
          <TabsContent value="products"><ProductSeoHub /></TabsContent>
          <TabsContent value="audits"><AuditsTab audits={audits} isLoading={isLoadingAudits} isExporting={isExporting} onNewAudit={() => setShowNewAuditModal(true)} onSelectAudit={handleSelectAudit} onExport={handleExport} /></TabsContent>
          <TabsContent value="pages"><PagesTab selectedAuditId={selectedAuditId} selectedAudit={selectedAudit} pages={pages} totalPages={totalPages} isLoading={isLoadingPages} currentPage={pagesPage} pageTypeFilter={pageTypeFilter} sortOrder={sortOrder} onPageChange={setPagesPage} onPageTypeChange={setPageTypeFilter} onSortChange={setSortOrder} onViewIssues={handleViewIssues} onGenerateAI={handleGenerateAI} /></TabsContent>
          <TabsContent value="keywords"><KeywordsTab keywords={keywords} isLoading={isLoadingKeywords} searchTerm={searchTerm} onSearchChange={setSearchTerm} onAddKeyword={() => setShowAddKeywordModal(true)} onToggleKeyword={handleToggleKeyword} /></TabsContent>
          <TabsContent value="generator"><Suspense fallback={<div className="text-center py-12"><RefreshCw className="h-5 w-5 animate-spin mx-auto" /></div>}><SEOContentGenerator /></Suspense></TabsContent>
          <TabsContent value="recommendations"><Suspense fallback={<div className="text-center py-12"><RefreshCw className="h-5 w-5 animate-spin mx-auto" /></div>}><SEORecommendationsCard loading={isLoadingAudits} /></Suspense></TabsContent>
        </Tabs>

        <NewAuditModal open={showNewAuditModal} onOpenChange={setShowNewAuditModal} onSubmit={handleCreateAudit} isCreating={isCreating} />
        <IssuesModal open={showIssuesModal} onOpenChange={setShowIssuesModal} issues={issues} isLoading={isLoadingIssues} isApplying={isApplying} onApplyFix={handleApplyFix} selectedPageId={selectedPageId} />
        <AIGenerateModal open={showAIModal} onOpenChange={setShowAIModal} onGenerate={handleAIGenerate} isGenerating={isGenerating} selectedPageId={selectedPageId} />
        <AddKeywordModal open={showAddKeywordModal} onOpenChange={setShowAddKeywordModal} />
      </ChannablePageWrapper>
    </>
  );
}
