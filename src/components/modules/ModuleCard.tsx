import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Lock, Check } from 'lucide-react';
import type { ModuleConfig } from '@/config/modules';
import type { PlanType } from '@/hooks/usePlan';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleCardProps {
  module: ModuleConfig;
  currentPlan: PlanType;
  isAccessible: boolean;
  isEnabled?: boolean;
  className?: string;
}

const iconMap: Record<string, any> = {
  BarChart3: LucideIcons.BarChart3,
  Package: LucideIcons.Package,
  Truck: LucideIcons.Truck,
  Upload: LucideIcons.Upload,
  Trophy: LucideIcons.Trophy,
  TrendingUp: LucideIcons.TrendingUp,
  Zap: LucideIcons.Zap,
  Users: LucideIcons.Users,
  Search: LucideIcons.Search,
  Brain: LucideIcons.Brain,
  Shield: LucideIcons.Shield,
  Plug: LucideIcons.Plug,
  Settings: LucideIcons.Settings,
  Building: LucideIcons.Building,
  Building2: LucideIcons.Building2,
  GraduationCap: LucideIcons.GraduationCap,
  Crown: LucideIcons.Crown,
  Sparkles: LucideIcons.Sparkles,
  ShoppingCart: LucideIcons.ShoppingCart,
};

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  currentPlan,
  isAccessible,
  isEnabled = true,
  className
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const Icon = iconMap[module.icon] || LucideIcons.Settings;
  const hasSubModules = module.subModules && module.subModules.length > 0;

  const planBadgeVariant = (plan: PlanType) => {
    switch (plan) {
      case 'pro': return 'default';
      case 'ultra_pro': return 'secondary';
      default: return 'outline';
    }
  };

  const planLabel = (plan: PlanType) => {
    switch (plan) {
      case 'standard': return 'Standard';
      case 'pro': return 'Pro';
      case 'ultra_pro': return 'Ultra Pro';
      default: return '';
    }
  };

  const handleModuleClick = () => {
    if (isAccessible && isEnabled) {
      navigate(module.route);
    }
  };

  const handleSubModuleClick = (route: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAccessible && isEnabled) {
      navigate(route);
    }
  };

  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-md",
        !isAccessible && "opacity-60",
        !isEnabled && "opacity-50",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isAccessible ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {module.name}
                {!isAccessible && <Lock className="h-4 w-4 text-muted-foreground" />}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {module.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge variant={planBadgeVariant(module.minPlan)}>
              {planLabel(module.minPlan)}
            </Badge>
            {isEnabled && isAccessible && (
              <Badge variant="outline" className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Activé
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {hasSubModules && (
        <CardContent className="pt-0">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {module.subModules!.length} sous-modules
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              {module.subModules!.map((subModule) => (
                <button
                  key={subModule.id}
                  onClick={(e) => handleSubModuleClick(subModule.route, e)}
                  disabled={!isAccessible || !isEnabled}
                  className={cn(
                    "w-full text-left p-3 rounded-md border bg-card hover:bg-accent transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{subModule.name}</div>
                      <div className="text-xs text-muted-foreground">{subModule.description}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      )}

      <CardFooter className="pt-3">
        <Button
          onClick={handleModuleClick}
          disabled={!isAccessible || !isEnabled}
          variant={isAccessible ? "default" : "outline"}
          className="w-full"
        >
          {isAccessible ? (
            "Accéder au module"
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Upgrade requis
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
