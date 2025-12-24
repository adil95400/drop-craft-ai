import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, Calendar, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface GoalsWidgetProps {
  timeRange: string;
  settings?: {
    showDetails?: boolean;
  };
}

const goals = [
  { 
    id: 1, 
    name: 'Ventes mensuelles', 
    target: 50000, 
    current: 42500, 
    unit: '€',
    deadline: '30 juin',
    color: 'bg-blue-500'
  },
  { 
    id: 2, 
    name: 'Nouveaux clients', 
    target: 200, 
    current: 156, 
    unit: '',
    deadline: '30 juin',
    color: 'bg-green-500'
  },
  { 
    id: 3, 
    name: 'Commandes', 
    target: 500, 
    current: 423, 
    unit: '',
    deadline: '30 juin',
    color: 'bg-purple-500'
  },
  { 
    id: 4, 
    name: 'Taux de conversion', 
    target: 5, 
    current: 3.8, 
    unit: '%',
    deadline: 'Q2 2024',
    color: 'bg-orange-500'
  },
];

export function GoalsWidget({ settings }: GoalsWidgetProps) {
  const showDetails = settings?.showDetails ?? true;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          Objectifs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const progress = Math.min((goal.current / goal.target) * 100, 100);
          const isCompleted = progress >= 100;
          const isNearComplete = progress >= 80 && progress < 100;
          
          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCompleted && <Award className="h-4 w-4 text-yellow-500" />}
                  <span className="text-sm font-medium">{goal.name}</span>
                </div>
                <span className={`text-sm font-bold ${isCompleted ? 'text-green-500' : isNearComplete ? 'text-orange-500' : ''}`}>
                  {goal.current.toLocaleString('fr-FR')}{goal.unit} / {goal.target.toLocaleString('fr-FR')}{goal.unit}
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={progress} 
                  className="h-2"
                />
                <div 
                  className={`absolute top-0 left-0 h-2 rounded-full ${goal.color}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {showDetails && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{goal.deadline}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isCompleted ? (
                      <span className="text-green-500">Objectif atteint!</span>
                    ) : (
                      <>
                        <TrendingUp className="h-3 w-3" />
                        <span>{progress.toFixed(0)}% complété</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
