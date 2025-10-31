import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, Clock, DollarSign, Users } from 'lucide-react';

interface OpportunityDetailModalProps {
  opportunity: {
    title: string;
    description: string;
    potential: string;
    difficulty: string;
    estimatedRevenue: number;
    competitors: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpportunityDetailModal({ opportunity, open, onOpenChange }: OpportunityDetailModalProps) {
  if (!opportunity) return null;

  const getPotentialColor = (potential: string) => {
    const colors = {
      high: 'text-green-600',
      medium: 'text-amber-600',
      low: 'text-gray-600'
    };
    return colors[potential as keyof typeof colors] || colors.medium;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-amber-600',
      high: 'text-red-600'
    };
    return colors[difficulty as keyof typeof colors] || colors.medium;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="w-6 h-6" />
            {opportunity.title}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {opportunity.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue Potentiel</p>
                    <p className="text-2xl font-bold text-green-600">
                      +{opportunity.estimatedRevenue}€/mois
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Concurrence</p>
                    <p className="text-2xl font-bold">
                      {opportunity.competitors} concurrent{opportunity.competitors > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                <span className="font-medium">Potentiel de Marché</span>
              </div>
              <Badge variant={opportunity.potential === 'high' ? 'default' : 'secondary'}>
                <span className={getPotentialColor(opportunity.potential)}>{opportunity.potential}</span>
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Difficulté d'Implémentation</span>
              </div>
              <Badge variant={opportunity.difficulty === 'high' ? 'destructive' : 'secondary'}>
                <span className={getDifficultyColor(opportunity.difficulty)}>{opportunity.difficulty}</span>
              </Badge>
            </div>
          </div>

          {/* Recommendations */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-3">Recommandations Stratégiques</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="text-sm">
                    Analyser en détail la demande du marché pour cette opportunité
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="text-sm">
                    Évaluer les ressources nécessaires pour l'implémentation
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="text-sm">
                    Créer un plan d'action avec des objectifs mesurables
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="text-sm">
                    Surveiller la concurrence et ajuster la stratégie au besoin
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button className="flex-1">
              Créer un Plan d'Action
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
