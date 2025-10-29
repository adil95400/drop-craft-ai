import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCustomerBehavior } from '@/hooks/useCustomerBehavior';
import { Plus, Sparkles, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react';
import { AnalyzeCustomerDialog } from './AnalyzeCustomerDialog';
import { CustomerAnalysisCard } from './CustomerAnalysisCard';

export function BehaviorAnalysisDashboard() {
  const { analyses, stats, isLoadingAnalyses, analyzeBehavior, isAnalyzing } = useCustomerBehavior();
  const [showAnalyzeDialog, setShowAnalyzeDialog] = useState(false);

  if (isLoadingAnalyses) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Analyses</p>
              <p className="text-2xl font-bold">{stats.totalAnalyses}</p>
            </div>
            <Users className="h-8 w-8 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Score Moyen</p>
              <p className="text-2xl font-bold">{stats.avgBehavioralScore}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Valeur Vie Moy.</p>
              <p className="text-2xl font-bold">
                {stats.avgLifetimeValue > 0 
                  ? `${Math.round(stats.avgLifetimeValue)}€` 
                  : 'N/A'}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Clients à Risque</p>
              <p className="text-2xl font-bold text-red-500">{stats.highRiskCustomers}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Action Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analyses Comportementales</h2>
        <Button onClick={() => setShowAnalyzeDialog(true)} disabled={isAnalyzing}>
          <Sparkles className="mr-2 h-4 w-4" />
          Analyser un Client
        </Button>
      </div>

      {/* Analyses List */}
      {analyses.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">
            Aucune analyse comportementale. Commencez par analyser un client !
          </p>
          <Button onClick={() => setShowAnalyzeDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Analyser un Client
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {analyses.map((analysis) => (
            <CustomerAnalysisCard key={analysis.id} analysis={analysis} />
          ))}
        </div>
      )}

      <AnalyzeCustomerDialog 
        open={showAnalyzeDialog} 
        onOpenChange={setShowAnalyzeDialog}
      />
    </div>
  );
}