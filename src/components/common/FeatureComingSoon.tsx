import { AlertCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FeatureComingSoonProps {
  title?: string;
  description?: string;
  estimatedDate?: string;
  variant?: 'card' | 'inline';
}

export const FeatureComingSoon = ({ 
  title = "Fonctionnalité à venir",
  description = "Cette fonctionnalité est actuellement en développement et sera disponible prochainement.",
  estimatedDate,
  variant = 'card'
}: FeatureComingSoonProps) => {
  
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-dashed animate-fade-in">
        <Sparkles className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {estimatedDate && (
          <Badge variant="secondary" className="whitespace-nowrap">
            {estimatedDate}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="animate-scale-in">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 blur-xl opacity-30">
              <Sparkles className="h-12 w-12 text-primary mx-auto" />
            </div>
            <Sparkles className="h-12 w-12 text-primary mx-auto relative" />
          </div>
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          {title}
          {estimatedDate && (
            <Badge variant="outline" className="ml-2">
              {estimatedDate}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-base">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Nous travaillons activement sur cette fonctionnalité.
          </p>
          <p className="text-xs text-muted-foreground">
            Vous serez notifié dès qu'elle sera disponible.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
