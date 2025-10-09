import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Construction, Sparkles } from 'lucide-react';

interface PagePlaceholderProps {
  title?: string;
  description?: string;
  badge?: string;
}

export function PagePlaceholder({ title, description, badge }: PagePlaceholderProps) {
  const location = useLocation();
  const pageName = title || location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Page';
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold capitalize">{pageName}</h1>
            {badge && (
              <Badge className="bg-purple-500 text-white">
                {badge}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            Page en construction
          </CardTitle>
          <CardDescription>
            Cette fonctionnalité est actuellement en cours de développement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Bientôt disponible avec toutes les fonctionnalités avancées !</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
