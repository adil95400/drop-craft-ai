/**
 * CatalogRuleCard - Card optimisée pour afficher une règle catalogue
 */
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, Edit, Trash2, Zap, Copy, Clock, CheckCircle2, 
  XCircle, Sparkles, Play, Pause, ExternalLink
} from 'lucide-react';
import { ProductRule } from '@/lib/rules/ruleTypes';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { cn } from '@/lib/utils';

interface CatalogRuleCardProps {
  rule: ProductRule;
  onEdit: (rule: ProductRule) => void;
  onTest: (rule: ProductRule) => void;
  onDuplicate: (rule: ProductRule) => void;
  onDelete: (ruleId: string) => void;
  onToggle: (params: { id: string; enabled: boolean }) => void;
}

const CHANNEL_COLORS: Record<string, string> = {
  global: 'bg-slate-500',
  google: 'bg-blue-500',
  meta: 'bg-indigo-500',
  tiktok: 'bg-pink-500',
  amazon: 'bg-orange-500',
  shopify: 'bg-green-500'
};

const CHANNEL_LABELS: Record<string, string> = {
  global: 'Global',
  google: 'Google',
  meta: 'Meta',
  tiktok: 'TikTok',
  amazon: 'Amazon',
  shopify: 'Shopify'
};

export function CatalogRuleCard({ 
  rule, 
  onEdit, 
  onTest, 
  onDuplicate, 
  onDelete, 
  onToggle 
}: CatalogRuleCardProps) {
  const hasAI = rule?.actions?.some(a => a?.type === 'generate_ai') ?? false;
  const executionCount = rule?.executionCount || 0;
  const successCount = rule?.successCount || 0;
  const successRate = executionCount > 0 
    ? Math.round((successCount / executionCount) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -2 }}
      layout
    >
      <Card className={cn(
        "hover:shadow-lg transition-all duration-300 border-border/50",
        !rule.enabled && "opacity-60"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <CardTitle className="text-lg truncate">{rule.name}</CardTitle>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-white text-xs shrink-0",
                    CHANNEL_COLORS[rule.channel] || CHANNEL_COLORS.global
                  )}
                >
                  {CHANNEL_LABELS[rule.channel] || rule.channel}
                </Badge>
                {hasAI && (
                  <Badge variant="outline" className="gap-1 text-xs shrink-0">
                    <Sparkles className="h-3 w-3" /> IA
                  </Badge>
                )}
                {!rule.enabled && (
                  <Badge variant="secondary" className="gap-1 text-xs shrink-0">
                    <Pause className="h-3 w-3" /> Pausée
                  </Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {rule.description || 'Aucune description'}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Switch
                checked={rule.enabled}
                onCheckedChange={(checked) => onToggle({ id: rule.id, enabled: checked })}
                className="data-[state=checked]:bg-emerald-500"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onEdit(rule)}>
                    <Edit className="h-4 w-4 mr-2" /> Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onTest(rule)}>
                    <Zap className="h-4 w-4 mr-2" /> Tester
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(rule)}>
                    <Copy className="h-4 w-4 mr-2" /> Dupliquer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(rule.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5" title="Nombre d'exécutions">
              <Clock className="h-3.5 w-3.5" />
              <span>{(rule.executionCount || 0).toLocaleString()} exécutions</span>
            </div>
            
            <div className="flex items-center gap-1.5" title="Succès">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>{(rule.successCount || 0).toLocaleString()}</span>
            </div>
            
            <div className="flex items-center gap-1.5" title="Erreurs">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <span>{(rule.errorCount || 0).toLocaleString()}</span>
            </div>
            
            {rule.executionCount > 0 && (
              <div 
                className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                  successRate >= 90 ? "bg-emerald-500/10 text-emerald-600" :
                  successRate >= 70 ? "bg-amber-500/10 text-amber-600" :
                  "bg-red-500/10 text-red-600"
                )}
                title="Taux de succès"
              >
                {successRate}%
              </div>
            )}
            
            {rule.lastExecutedAt && (
              <div className="flex items-center gap-1.5 ml-auto" title="Dernière exécution">
                <span className="text-xs">
                  {formatDistanceToNow(new Date(rule.lastExecutedAt), { 
                    addSuffix: true,
                    locale: getDateFnsLocale() 
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={() => onTest(rule)}
            >
              <Play className="h-3 w-3 mr-1" />
              Tester
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={() => onEdit(rule)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Éditer
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
