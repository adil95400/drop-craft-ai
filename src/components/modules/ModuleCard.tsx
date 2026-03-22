import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Lock, Check, Settings } from 'lucide-react';
import type { ModuleConfig } from '@/config/modules';
import type { PlanType } from '@/hooks/usePlan';
import { iconMap as sharedIconMap, getIcon } from '@/lib/icon-map';
import { cn } from '@/lib/utils';

interface ModuleCardProps {
  module: ModuleConfig;
  currentPlan: PlanType;
  isAccessible: boolean;
  isEnabled?: boolean;
  className?: string;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  currentPlan,
  isAccessible,
  isEnabled = true,
  className
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const Icon = getIcon(module.icon);
  const hasSubModules = module.subModules && module.subModules.length > 0;

  const planBadgeVariant = (plan: PlanType) => {
    switch (plan) {
      case 'pro': return 'default';
      case 'ultra_pro': return 'secondary';
      default: return 'outline';
    }
  };

  const planColors: Record<string, string> = {
    free: 'bg-muted text-muted-foreground',
    standard: 'bg-info/10 text-info',
    pro: 'bg-primary/10 text-primary',
    ultra_pro: 'bg-warning/10 text-warning',
  };

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300",
      isAccessible && isEnabled
        ? "hover:shadow-lg hover:border-primary/30 cursor-pointer"
        : "opacity-60",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={cn(
            "p-2.5 rounded-xl transition-colors",
            isAccessible ? planColors[module.minPlan] || planColors.free : 'bg-muted'
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex gap-1.5">
            {module.badge && (
              <Badge variant="secondary" className={cn(
                "text-[10px] px-1.5",
                module.badge === 'new' && "bg-success/15 text-success",
                module.badge === 'beta' && "bg-warning/15 text-warning"
              )}>
                {module.badge.toUpperCase()}
              </Badge>
            )}
            <Badge variant={planBadgeVariant(module.minPlan)} className="text-[10px] px-1.5">
              {module.minPlan === 'free' ? 'Free' : module.minPlan.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-base mt-3">{module.name}</CardTitle>
        <CardDescription className="text-xs line-clamp-2">{module.description}</CardDescription>
      </CardHeader>

      {hasSubModules && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="mx-4 mb-2 text-xs gap-1">
              {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {module.subModules!.length} sous-modules
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-3">
              <div className="space-y-1.5 pl-2 border-l-2 border-border/50">
                {module.subModules!.map((sub) => {
                  const SubIcon = getIcon(sub.icon);
                  return (
                    <button
                      key={sub.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(sub.route);
                      }}
                      className="flex items-center gap-2 w-full text-left text-xs p-1.5 rounded hover:bg-accent/50 transition-colors"
                    >
                      <SubIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{sub.name}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      )}

      <CardFooter className="pt-0">
        <Button
          variant={isAccessible ? "default" : "outline"}
          size="sm"
          className="w-full"
          onClick={() => navigate(module.route)}
          disabled={!isAccessible || !isEnabled}
        >
          {isAccessible ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Accéder
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              Débloquer
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
