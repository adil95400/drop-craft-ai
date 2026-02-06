import { useState, useCallback, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Play, Search, Target, Sparkles, Lightbulb, FileText, RefreshCw } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useSEOAudits, useSEOAuditDetail, useSEOAuditPages, useSEOIssues, useSEOAIGenerate, useSEOFixApply, useSEOExport } from '@/hooks/useSEOAudits';
import { useRealSEO } from '@/hooks/useRealSEO';
import { useToast } from '@/hooks/use-toast';

// Modular components
import { SEOStatsCards } from '@/components/seo/SEOStatsCards';
import { AuditsTab } from '@/components/seo/tabs/AuditsTab';
import { PagesTab } from '@/components/seo/tabs/PagesTab';
import { KeywordsTab } from '@/components/seo/tabs/KeywordsTab';
import { NewAuditModal } from '@/components/seo/modals/NewAuditModal';
import { IssuesModal } from '@/components/seo/modals/IssuesModal';
import { AIGenerateModal } from '@/components/seo/modals/AIGenerateModal';
import { AddKeywordModal } from '@/components/seo/AddKeywordModal';

// Lazy-loaded heavy components
const SEOContentGenerator = lazy(() => import('@/components/seo/SEOContentGenerator').then(m => ({ default: m.SEOContentGenerator })));
const SEORecommendationsCard = lazy(() => import('@/components/seo/SEORecommendationsCard').then(m => ({ default: m.SEORecommendationsCard })));

export default function SEOManagerPage() {
  // UI state
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

  // Data hooks
  const { audits, isLoading: isLoadingAudits, createAudit, isCreating } = useSEOAudits();
  const { audit: selectedAudit } = useSEOAuditDetail(selectedAuditId);
  const { pages, total: totalPages, isLoading: isLoadingPages } = useSEOAuditPages(selectedAuditId, {
    page: pagesPage,
    limit: 50,
    pageType: pageTypeFilter === 'all' ? undefined : pageTypeFilter,
    sort: sortOrder,
  });
  const { issues, isLoading: isLoadingIssues } = useSEOIssues(selectedPageId);
  const { generate: generateAI, isGenerating } = useSEOAIGenerate();
  const { applyFix, isApplying } = useSEOFixApply();
  const { exportAudit, isExporting } = useSEOExport();
  const { keywords, stats, isLoading: isLoadingKeywords, updateKeyword } = useRealSEO();

  const { toast } = useToast();

  // Callbacks
  const handleCreateAudit = useCallback((params: any) => {
    createAudit(params);
    setShowNewAuditModal(false);
  }, [createAudit]);

  const handleExport = useCallback((auditId: string) => {
    exportAudit({ auditId, format: 'csv' });
  }, [exportAudit]);

  const handleSelectAudit = useCallback((id: string) => {
    setSelectedAuditId(id);
  }, []);

  const handleViewIssues = useCallback((pageId: string) => {
    setSelectedPageId(pageId);
    setShowIssuesModal(true);
  }, []);

  const handleGenerateAI = useCallback((pageId: string) => {
    setSelectedPageId(pageId);
    setShowAIModal(true);
  }, []);

  const handleAIGenerate = useCallback((params: any) => {
    generateAI(params);
    setShowAIModal(false);
  }, [generateAI]);

  const handleApplyFix = useCallback((action: string, pageId?: string) => {
    applyFix({ action, page_id: pageId });
  }, [applyFix]);

  const handleToggleKeyword = useCallback((id: string, active: boolean) => {
    updateKeyword({ id, updates: { tracking_active: active } });
  }, [updateKeyword]);

  return (
    <>
      <Helmet>
        <title>SEO Manager Pro — Audit & Optimisation | Drop Craft AI</title>
        <meta name="description" content="Suite SEO professionnelle : audits complets, suivi de mots-clés, génération IA, corrections automatiques." />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SEO Manager</h1>
            <p className="text-muted-foreground mt-1">
              Audits, mots-clés, génération IA et corrections automatiques
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddKeywordModal(true)} className="h-9">
              <Plus className="mr-2 h-4 w-4" />
              Mot-clé
            </Button>
            <Button onClick={() => setShowNewAuditModal(true)} className="h-9">
              <Play className="mr-2 h-4 w-4" />
              Nouvel Audit
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <SEOStatsCards
          auditsCount={audits.length}
          averageScore={stats.averageScore}
          totalKeywords={stats.totalKeywords}
          trackingKeywords={stats.trackingKeywords}
          totalPages={stats.totalPages}
        />

        {/* Main Tabs */}
        <Tabs defaultValue="audits" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-11">
            <TabsTrigger value="audits" className="gap-1.5">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Audits</span>
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-1.5">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Pages</span>
            </TabsTrigger>
            <TabsTrigger value="keywords" className="gap-1.5">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Mots-clés</span>
            </TabsTrigger>
            <TabsTrigger value="generator" className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Générateur IA</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-1.5">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Recommandations</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audits">
            <AuditsTab
              audits={audits}
              isLoading={isLoadingAudits}
              isExporting={isExporting}
              onNewAudit={() => setShowNewAuditModal(true)}
              onSelectAudit={handleSelectAudit}
              onExport={handleExport}
            />
          </TabsContent>

          <TabsContent value="pages">
            <PagesTab
              selectedAuditId={selectedAuditId}
              selectedAudit={selectedAudit}
              pages={pages}
              totalPages={totalPages}
              isLoading={isLoadingPages}
              currentPage={pagesPage}
              pageTypeFilter={pageTypeFilter}
              sortOrder={sortOrder}
              onPageChange={setPagesPage}
              onPageTypeChange={setPageTypeFilter}
              onSortChange={setSortOrder}
              onViewIssues={handleViewIssues}
              onGenerateAI={handleGenerateAI}
            />
          </TabsContent>

          <TabsContent value="keywords">
            <KeywordsTab
              keywords={keywords}
              isLoading={isLoadingKeywords}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onAddKeyword={() => setShowAddKeywordModal(true)}
              onToggleKeyword={handleToggleKeyword}
            />
          </TabsContent>

          <TabsContent value="generator">
            <Suspense fallback={<div className="text-center py-12"><RefreshCw className="h-6 w-6 animate-spin mx-auto" /></div>}>
              <SEOContentGenerator />
            </Suspense>
          </TabsContent>

          <TabsContent value="recommendations">
            <Suspense fallback={<div className="text-center py-12"><RefreshCw className="h-6 w-6 animate-spin mx-auto" /></div>}>
              <SEORecommendationsCard loading={isLoadingAudits} />
            </Suspense>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <NewAuditModal
          open={showNewAuditModal}
          onOpenChange={setShowNewAuditModal}
          onSubmit={handleCreateAudit}
          isCreating={isCreating}
        />

        <IssuesModal
          open={showIssuesModal}
          onOpenChange={setShowIssuesModal}
          issues={issues}
          isLoading={isLoadingIssues}
          isApplying={isApplying}
          onApplyFix={handleApplyFix}
          selectedPageId={selectedPageId}
        />

        <AIGenerateModal
          open={showAIModal}
          onOpenChange={setShowAIModal}
          onGenerate={handleAIGenerate}
          isGenerating={isGenerating}
          selectedPageId={selectedPageId}
        />

        <AddKeywordModal open={showAddKeywordModal} onOpenChange={setShowAddKeywordModal} />
      </div>
    </>
  );
}
