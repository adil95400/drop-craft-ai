import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRealAdsManager } from '@/hooks/useRealAdsManager';
import { Plus, Play, Pause, TrendingUp, DollarSign, Megaphone, Sparkles } from 'lucide-react';
import { CreateCampaignDialog } from './CreateCampaignDialog';

export function CampaignManager() {
  const { campaigns, isLoading } = useRealAdsManager();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Actif</Badge>;
      case 'paused':
        return <Badge variant="secondary">En pause</Badge>;
      case 'completed':
        return <Badge variant="outline">Terminé</Badge>;
      case 'draft':
        return <Badge variant="outline">Brouillon</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mes Campagnes</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Campagne
        </Button>
      </div>

      {(!campaigns || campaigns.length === 0) ? (
        <Card className="p-12 text-center">
          <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">
            Aucune campagne créée. Lancez votre première campagne maintenant !
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Créer une Campagne
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign: any) => {
            const spentPercentage = campaign.budget_amount > 0
              ? (campaign.spent_amount / campaign.budget_amount) * 100
              : 0;

            return (
              <Card key={campaign.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                      {campaign.ai_optimization_enabled && (
                        <Badge variant="outline" className="text-primary">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Optimisation IA
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {campaign.platform} • {campaign.objective}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {campaign.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => console.log('Pause', campaign.id)}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => console.log('Play', campaign.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="text-lg font-semibold">
                      {campaign.budget_amount}€
                      <span className="text-xs text-muted-foreground ml-1">
                        /{campaign.budget_type === 'daily' ? 'jour' : 'total'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dépensé</p>
                    <p className="text-lg font-semibold">{campaign.spent_amount}€</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Impressions</p>
                    <p className="text-lg font-semibold">
                      {campaign.performance_metrics?.impressions?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ROAS</p>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      {campaign.performance_metrics?.roas || '0'}x
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progression du budget</span>
                    <span className="font-medium">{spentPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={spentPercentage} className="h-2" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCampaignDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
