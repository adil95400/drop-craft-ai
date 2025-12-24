import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Play, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Clock,
  RefreshCw
} from 'lucide-react';
import { 
  useRepricingStats, 
  useApplyAllRepricingRules,
  type PricingRule 
} from '@/hooks/useRepricingEngine';
import { RepricingRulesList } from './RepricingRulesList';
import { RepricingRuleForm } from './RepricingRuleForm';
import { RepricingPreviewDialog } from './RepricingPreviewDialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function RepricingDashboard() {
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const { data: stats, isLoading: loadingStats } = useRepricingStats();
  const applyAllRules = useApplyAllRepricingRules();

  const handleEditRule = (rule: PricingRule) => {
    setEditingRule(rule);
    setShowRuleForm(true);
  };

  const handleCloseForm = (open: boolean) => {
    setShowRuleForm(open);
    if (!open) setEditingRule(null);
  };

  const handlePreview = (data: any) => {
    setPreviewData(data);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Règles actives</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? <LoadingSpinner size="sm" /> : stats?.activeRules || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produits impactés</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? <LoadingSpinner size="sm" /> : stats?.totalProductsAffected || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Variation moyenne</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? <LoadingSpinner size="sm" /> : `${stats?.avgPriceChange || 0}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Màj (7 jours)</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? <LoadingSpinner size="sm" /> : stats?.recentUpdates || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Règles de repricing</h2>
          <p className="text-sm text-muted-foreground">
            Configurez et exécutez vos stratégies de prix automatiques
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => applyAllRules.mutate()}
            disabled={applyAllRules.isPending}
          >
            {applyAllRules.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Exécuter toutes
          </Button>
          <Button onClick={() => setShowRuleForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle règle
          </Button>
        </div>
      </div>

      {/* Rules List */}
      <RepricingRulesList 
        onEditRule={handleEditRule}
        onPreviewRule={handlePreview}
      />

      {/* Rule Form Dialog */}
      <RepricingRuleForm 
        open={showRuleForm}
        onOpenChange={handleCloseForm}
        editingRule={editingRule}
      />

      {/* Preview Dialog */}
      <RepricingPreviewDialog 
        open={!!previewData}
        onOpenChange={(open) => !open && setPreviewData(null)}
        preview={previewData}
      />
    </div>
  );
}
