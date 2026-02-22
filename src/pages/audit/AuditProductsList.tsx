/**
 * Page d'audit des produits - Version 100% Fonctionnelle
 * Audit local instantané sans dépendance externe
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Package,
  Sparkles,
  Download,
  RefreshCw,
  LayoutGrid,
  List,
  ArrowUpDown,
  TrendingUp,
  Eye,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuditFilters } from '@/hooks/useAuditFilters';
import { useProductsAudit } from '@/hooks/useProductAuditEngine';
import { AuditStatsCards } from '@/components/audit/AuditStatsCards';
import { AuditFiltersPanel } from '@/components/audit/AuditFiltersPanel';
import { ProductAuditRow } from '@/components/audit/ProductAuditRow';
import { AuditScoreGauge } from '@/components/audit/AuditScoreGauge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductAuditResult } from '@/types/audit';

type ProductSource = 'products' | 'imported_products' | 'supplier_products';
type ViewMode = 'list' | 'grid';
type SortBy = 'name' | 'score' | 'price' | 'issues';

export default function AuditProductsList() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<ProductSource>('products');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const [sortAsc, setSortAsc] = useState(false); // Show lowest scores first by default
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [auditingIds, setAuditingIds] = useState<Set<string>>(new Set());
  const [selectedAudit, setSelectedAudit] = useState<ProductAuditResult | null>(null);
  const [showAuditDialog, setShowAuditDialog] = useState(false);

  // Fetch products
  const { data: rawProducts, isLoading, refetch } = useQuery({
    queryKey: ['products-for-audit', activeTab, user?.id],
    queryFn: async () => {
      if (activeTab === 'products') {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, description, price, category, image_url, sku, cost_price, stock_quantity')
          .eq('user_id', user?.id)
          .limit(200);
        if (error) throw error;
        return (data || []).map(p => ({
          ...p,
          images: p.image_url ? [p.image_url] : []
        }));
      } else if (activeTab === 'imported_products') {
        const { data, error } = await supabase
          .from('imported_products')
          .select('id, product_id, price, category, source_platform')
          .eq('user_id', user?.id)
          .limit(200);
        if (error) throw error;
        return (data || []).map(p => ({
          id: p.id,
          name: `Product ${p.product_id?.slice(0, 8) || p.id.slice(0, 8)}`,
          description: `Imported from ${p.source_platform || 'unknown'}`,
          price: p.price,
          category: p.category,
          image_url: null,
          images: [],
          sku: null,
          cost_price: null,
          stock_quantity: null
        }));
      } else {
        const { data, error } = await (supabase.from('supplier_products') as any)
          .select('id, title, description, supplier_price, image_url')
          .eq('user_id', user?.id)
          .limit(200);
        if (error) throw error;
        return (data || []).map((p: any) => ({
          id: p.id,
          name: p.title || 'Supplier Product',
          description: p.description,
          price: p.supplier_price,
          category: null,
          image_url: p.image_url,
          images: p.image_url ? [p.image_url] : [],
          sku: null,
          cost_price: null,
          stock_quantity: null
        }));
      }
    },
    enabled: !!user?.id,
  });

  // Filters
  const { filters, filteredProducts: auditFiltered, updateFilter, resetFilters, activeCount } = useAuditFilters(rawProducts || []);

  // Real-time audit calculation (LOCAL - no API call needed!)
  const { auditResults, stats } = useProductsAudit(auditFiltered);

  // Create audit results map
  const auditMap = useMemo(() => {
    const map = new Map<string, ProductAuditResult>();
    auditResults.forEach(result => {
      map.set(result.productId, result);
    });
    return map;
  }, [auditResults]);

  // Search and sort
  const processedProducts = useMemo(() => {
    let result = auditFiltered.filter(p =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'score':
          const scoreA = auditMap.get(a.id)?.score.global || 0;
          const scoreB = auditMap.get(b.id)?.score.global || 0;
          comparison = scoreA - scoreB;
          break;
        case 'issues':
          const issuesA = auditMap.get(a.id)?.issues.length || 0;
          const issuesB = auditMap.get(b.id)?.issues.length || 0;
          comparison = issuesB - issuesA;
          break;
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [auditFiltered, searchTerm, sortBy, sortAsc, auditMap]);

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(processedProducts.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [processedProducts]);

  const handleSelectProduct = useCallback((id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  // View audit details (LOCAL - instant!)
  const handleViewAudit = useCallback((productId: string) => {
    const audit = auditMap.get(productId);
    if (audit) {
      setSelectedAudit(audit);
      setShowAuditDialog(true);
    }
  }, [auditMap]);

  // Simulate audit animation (the audit is already calculated locally)
  const handleAuditProduct = useCallback((productId: string) => {
    setAuditingIds(prev => new Set(prev).add(productId));
    
    // Simulate brief processing time for UX
    setTimeout(() => {
      setAuditingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      
      const audit = auditMap.get(productId);
      if (audit) {
        if (audit.score.global >= 80) {
          toast.success(`Score: ${audit.score.global}/100 - Excellent! ✨`);
        } else if (audit.score.global >= 60) {
          toast.info(`Score: ${audit.score.global}/100 - Bon`);
        } else {
          toast.warning(`Score: ${audit.score.global}/100 - ${audit.issues.length} problème(s) détecté(s)`);
        }
        setSelectedAudit(audit);
        setShowAuditDialog(true);
      }
    }, 800);
  }, [auditMap]);

  // Bulk audit
  const handleBulkAudit = useCallback(() => {
    if (selectedIds.size === 0) {
      toast.warning('Sélectionnez des produits à auditer');
      return;
    }
    
    const selectedAudits = Array.from(selectedIds)
      .map(id => auditMap.get(id))
      .filter(Boolean) as ProductAuditResult[];
    
    const avgScore = selectedAudits.length > 0
      ? Math.round(selectedAudits.reduce((sum, a) => sum + a.score.global, 0) / selectedAudits.length)
      : 0;
    
    const criticalCount = selectedAudits.reduce(
      (sum, a) => sum + a.issues.filter(i => i.severity === 'critical').length, 
      0
    );
    
    toast.success(
      `${selectedIds.size} produits audités • Score moyen: ${avgScore}/100 • ${criticalCount} problèmes critiques`,
      { duration: 5000 }
    );
    
    setSelectedIds(new Set());
  }, [selectedIds, auditMap]);

  // Export audit
  const handleExportAudit = useCallback(() => {
    if (processedProducts.length === 0) {
      toast.warning('Aucun produit à exporter');
      return;
    }
    
    const data = processedProducts.map(p => {
      const audit = auditMap.get(p.id);
      return {
        nom: p.name || 'Sans nom',
        prix: p.price || 0,
        categorie: p.category || '',
        sku: p.sku || '',
        score_global: audit?.score.global || 0,
        score_seo: audit?.score.seo || 0,
        score_contenu: audit?.score.content || 0,
        score_images: audit?.score.images || 0,
        score_donnees: audit?.score.dataCompleteness || 0,
        score_ai: audit?.score.aiReadiness || 0,
        nb_problemes: audit?.issues.length || 0,
        nb_critiques: audit?.issues.filter(i => i.severity === 'critical').length || 0,
        a_corriger: audit?.needsCorrection ? 'Oui' : 'Non'
      };
    });

    const headers = Object.keys(data[0] || {});
    const csv = [
      headers.join(';'),
      ...data.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé');
  }, [processedProducts, auditMap, activeTab]);

  const toggleSort = useCallback((field: SortBy) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(field === 'name');
    }
  }, [sortBy, sortAsc]);

  const allSelected = processedProducts.length > 0 && selectedIds.size === processedProducts.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < processedProducts.length;

  // Severity helpers
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Critique</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Attention</Badge>;
      default: return <Badge variant="outline">Info</Badge>;
    }
  };

  return (
    <ChannablePageWrapper
      title="Audit Qualité Produits"
      subtitle="Analyse en temps réel"
      description={`${rawProducts?.length || 0} produits chargés • Détection automatique des problèmes`}
      heroImage="analytics"
      badge={{ label: 'Audit IA', icon: Sparkles }}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportAudit}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </>
      }
    >
      <div className="space-y-6">

      {/* Stats Cards */}
      <AuditStatsCards stats={stats} isLoading={isLoading} />

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Catalogue Produits</CardTitle>
              <CardDescription>
                {processedProducts.length} produits affichés • {stats.criticalIssuesCount} problèmes critiques
              </CardDescription>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <AuditFiltersPanel
                filters={filters}
                onFiltersChange={updateFilter}
                onReset={resetFilters}
                activeCount={activeCount}
              />

              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Source Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as ProductSource);
            setSelectedIds(new Set());
          }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="products" className="gap-2">
                  <Package className="h-4 w-4" />
                  Mes Produits
                </TabsTrigger>
                <TabsTrigger value="imported_products">Importés</TabsTrigger>
                <TabsTrigger value="supplier_products">Fournisseurs</TabsTrigger>
              </TabsList>

              {/* Bulk Actions */}
              {selectedIds.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <Badge variant="secondary">{selectedIds.size} sélectionné(s)</Badge>
                  <Button size="sm" onClick={handleBulkAudit}>
                    <Zap className="h-4 w-4 mr-2" />
                    Auditer la sélection
                  </Button>
                </motion.div>
              )}
            </div>

            <TabsContent value={activeTab} className="mt-4 space-y-3">
              {/* Sort Header */}
              <div className="flex items-center gap-4 px-4 py-2 bg-muted/50 rounded-lg text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) (el as any).indeterminate = someSelected;
                    }}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-muted-foreground">Tout</span>
                </div>
                <Separator orientation="vertical" className="h-4 hidden sm:block" />
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-muted-foreground text-xs mr-2">Trier:</span>
                  <Button
                    variant={sortBy === 'score' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => toggleSort('score')}
                  >
                    Score
                    {sortBy === 'score' && <ArrowUpDown className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant={sortBy === 'issues' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => toggleSort('issues')}
                  >
                    Problèmes
                    {sortBy === 'issues' && <ArrowUpDown className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant={sortBy === 'name' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => toggleSort('name')}
                  >
                    Nom
                    {sortBy === 'name' && <ArrowUpDown className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              {/* Products List */}
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : processedProducts.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || activeCount > 0
                      ? 'Essayez de modifier vos filtres ou votre recherche'
                      : 'Commencez par ajouter des produits à votre catalogue'}
                  </p>
                  {activeCount > 0 && (
                    <Button variant="outline" onClick={resetFilters}>
                      Réinitialiser les filtres
                    </Button>
                  )}
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-2">
                    {processedProducts.map((product, index) => (
                      <ProductAuditRow
                        key={product.id}
                        product={product}
                        auditResult={auditMap.get(product.id)}
                        isSelected={selectedIds.has(product.id)}
                        onSelect={(selected) => handleSelectProduct(product.id, selected)}
                        onAudit={() => handleAuditProduct(product.id)}
                        onViewAudit={() => handleViewAudit(product.id)}
                        isAuditing={auditingIds.has(product.id)}
                        index={index}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              )}

              {/* Quick Stats Footer */}
              {processedProducts.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t flex-wrap gap-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {stats.excellentCount} excellents
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>{stats.goodCount} bons</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-destructive">{stats.poorCount} à améliorer</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Score moyen</span>
                    <AuditScoreGauge 
                      score={stats.averageScore} 
                      size="sm" 
                      showLabel={false}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Audit Details Dialog */}
      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Résultat de l'Audit
            </DialogTitle>
            <DialogDescription>
              {selectedAudit?.productName || 'Produit'}
            </DialogDescription>
          </DialogHeader>

          {selectedAudit && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
                {/* Score Overview */}
                <div className="flex items-center justify-center gap-8 py-4">
                  <AuditScoreGauge 
                    score={selectedAudit.score.global} 
                    size="lg" 
                    showLabel 
                    label="Score Global"
                  />
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'SEO', score: selectedAudit.score.seo },
                    { label: 'Contenu', score: selectedAudit.score.content },
                    { label: 'Images', score: selectedAudit.score.images },
                    { label: 'Données', score: selectedAudit.score.dataCompleteness },
                    { label: 'AI Ready', score: selectedAudit.score.aiReadiness },
                  ].map(item => (
                    <div key={item.label} className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">{item.score}</div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>

                {/* Issues */}
                {selectedAudit.issues.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Problèmes détectés ({selectedAudit.issues.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedAudit.issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          {getSeverityIcon(issue.severity)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{issue.message}</span>
                              {getSeverityBadge(issue.severity)}
                            </div>
                            {issue.recommendation && (
                              <p className="text-sm text-muted-foreground mt-1">
                                💡 {issue.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {selectedAudit.strengths.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Points forts ({selectedAudit.strengths.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAudit.strengths.map((strength, i) => (
                        <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          ✓ {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      setShowAuditDialog(false);
                      navigate('/import/preview', {
                        state: {
                          productId: selectedAudit.productId,
                          returnTo: '/audit',
                        }
                      });
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir le produit
                  </Button>
                  <Button variant="outline" onClick={() => setShowAuditDialog(false)}>
                    Fermer
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </ChannablePageWrapper>
  );
}
