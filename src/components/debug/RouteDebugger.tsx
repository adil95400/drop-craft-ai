import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bug, X, CheckCircle, AlertCircle } from 'lucide-react';
import { MODULE_REGISTRY } from '@/config/modules';

export function RouteDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        variant="outline"
        className="fixed bottom-4 right-4 z-50 shadow-lg"
      >
        <Bug className="h-4 w-4" />
      </Button>
    );
  }

  // Collecter toutes les routes des modules et sous-modules
  const allRoutes: Array<{
    route: string;
    name: string;
    type: 'module' | 'sub-module';
    minPlan: string;
    parent?: string;
  }> = [];

  Object.values(MODULE_REGISTRY).forEach(m => {
    allRoutes.push({
      route: m.route,
      name: m.name,
      type: 'module',
      minPlan: m.minPlan
    });
    
    // Ajouter les sous-modules
    if (m.subModules) {
      m.subModules.forEach(sm => {
        allRoutes.push({
          route: sm.route,
          name: sm.name,
          type: 'sub-module',
          minPlan: m.minPlan,
          parent: m.id
        });
      });
    }
  });

  const currentPath = location.pathname;
  const matchingRoute = allRoutes.find(r => r.route === currentPath);

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-[400px] max-h-[600px] shadow-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Route Debugger
          </CardTitle>
          <Button
            onClick={() => setIsOpen(false)}
            size="icon"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Route Status */}
        <div className="p-3 bg-muted rounded-lg space-y-2">
          <div className="text-sm font-medium">Route Actuelle</div>
          <div className="text-xs font-mono bg-background p-2 rounded">
            {currentPath}
          </div>
          {matchingRoute ? (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle className="h-3 w-3" />
              Route valide: {matchingRoute.name}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              Route non trouvée dans la configuration
            </div>
          )}
        </div>

        {/* All Available Routes */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Routes Disponibles ({allRoutes.length})</div>
          <ScrollArea className="h-[350px]">
            <div className="space-y-1">
              {allRoutes.map((route, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded text-xs hover:bg-accent cursor-pointer transition-colors ${
                    route.route === currentPath ? 'bg-accent' : ''
                  }`}
                  onClick={() => navigate(route.route)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 font-mono truncate">{route.route}</div>
                    <div className="flex items-center gap-1">
                      <Badge variant={route.type === 'module' ? 'default' : 'secondary'} className="text-[10px]">
                        {route.type === 'module' ? 'M' : 'SM'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {route.minPlan}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-muted-foreground mt-1 truncate">
                    {route.name}
                    {'parent' in route && route.parent && (
                      <span className="text-[10px]"> → {route.parent}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Legend */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>M = Module principal</div>
          <div>SM = Sous-module</div>
        </div>
      </CardContent>
    </Card>
  );
}
