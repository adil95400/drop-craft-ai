/**
 * RulesExecutionHistory - Historique des exécutions connecté à Supabase
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  History, Search, Filter, CheckCircle2, XCircle, Clock, 
  RefreshCcw, ChevronDown, ChevronUp, Zap, Package, TrendingUp, 
  TrendingDown, AlertTriangle, Brain, BarChart3
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { cn } from '@/lib/utils';
import { useRulesExecutionData, useExecutionAIInsights } from '@/hooks/rules';

interface RulesExecutionHistoryProps {
  onRefresh?: () => void;
}

export function RulesExecutionHistory({ onRefresh }: RulesExecutionHistoryProps) {
  const { executions, stats, isLoading, refetch } = useRulesExecutionData(50);
  const { insights } = useExecutionAIInsights();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredExecutions = executions.filter(exec => {
    const matchesSearch = exec.ruleName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: 'success' | 'error' | 'partial') => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: 'success' | 'error' | 'partial') => {
    const variants: Record<string, { class: string; label: string }> = {
      success: { class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Succès' },
      error: { class: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Erreur' },
      partial: { class: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Partiel' },
    };
    const variant = variants[status];
    return (
      <Badge variant="outline" className={variant.class}>
        {variant.label}
      </Badge>
    );
  };

  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalExecutions}</p>
                <p className="text-sm text-muted-foreground">Total exécutions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-2 rounded-lg",
                stats.successRate >= 80 ? "bg-emerald-500/10" : "bg-amber-500/10"
              )}>
                <CheckCircle2 className={cn(
                  "h-5 w-5",
                  stats.successRate >= 80 ? "text-emerald-500" : "text-amber-500"
                )} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{stats.successRate}%</p>
                  {stats.trendsLastWeek.successRateDelta !== 0 && (
                    <Badge variant={stats.trendsLastWeek.successRateDelta > 0 ? "default" : "destructive"} className="text-xs">
                      {stats.trendsLastWeek.successRateDelta > 0 ? '+' : ''}{stats.trendsLastWeek.successRateDelta}%
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Taux de réussite</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgProductsPerExecution}</p>
                <p className="text-sm text-muted-foreground">Produits/exécution</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-violet-500/10 rounded-lg">
                <Zap className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(stats.avgDuration / 1000)}s</p>
                <p className="text-sm text-muted-foreground">Durée moyenne</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Insights IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((insight, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "p-3 rounded-lg flex items-start gap-3",
                  insight.type === 'warning' && "bg-amber-500/10",
                  insight.type === 'success' && "bg-emerald-500/10",
                  insight.type === 'info' && "bg-blue-500/10"
                )}
              >
                {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />}
                {insight.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />}
                {insight.type === 'info' && <Zap className="h-4 w-4 text-blue-500 mt-0.5" />}
                <div className="flex-1">
                  <p className="font-medium text-sm">{insight.title}</p>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
                {insight.action && (
                  <Button size="sm" variant="ghost">{insight.action}</Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top Performing Rules */}
      {stats.topPerformingRules.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Règles les plus performantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topPerformingRules.slice(0, 3).map((rule, idx) => (
                <div key={rule.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                    <span className="font-medium">{rule.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {rule.executionCount} exéc.
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={rule.successRate} className="w-24 h-2" />
                    <span className="text-sm font-medium w-12 text-right">{rule.successRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des exécutions
              </CardTitle>
              <CardDescription>
                Consultez l'historique des règles exécutées et leurs résultats
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une règle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="partial">Partiel</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Executions list */}
          {filteredExecutions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Aucune exécution trouvée</p>
              <p className="text-sm text-muted-foreground mt-1">
                Les exécutions de règles apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredExecutions.map((exec, index) => (
                  <motion.div
                    key={exec.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        expandedId === exec.id && "ring-1 ring-primary/50"
                      )}
                      onClick={() => setExpandedId(expandedId === exec.id ? null : exec.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(exec.status)}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{exec.ruleName}</h4>
                              {getStatusBadge(exec.status)}
                              <Badge variant="outline" className="text-xs">
                                {exec.ruleType === 'pricing' ? 'Prix' : exec.ruleType === 'feed' ? 'Feed' : 'Catalogue'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(exec.executedAt), { addSuffix: true, locale: getDateFnsLocale() })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {exec.productsAffected} produit{exec.productsAffected > 1 ? 's' : ''}
                              </span>
                              {exec.duration > 0 && (
                                <span className="flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  {exec.duration}ms
                                </span>
                              )}
                            </div>
                          </div>

                          <Button variant="ghost" size="icon" className="shrink-0">
                            {expandedId === exec.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {expandedId === exec.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-4 mt-4 border-t border-border/50 space-y-3">
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Exécuté le: </span>
                                  <span>{format(new Date(exec.executedAt), 'dd/MM/yyyy à HH:mm:ss', { locale: getDateFnsLocale() })}</span>
                                </div>
                                
                                {exec.error && (
                                  <div className="p-3 rounded-lg bg-red-500/10 text-red-600 text-sm">
                                    <strong>Erreur:</strong> {exec.error}
                                  </div>
                                )}

                                {exec.changes && exec.changes.length > 0 && (
                                  <div className="space-y-2">
                                    <h5 className="text-sm font-medium">Modifications apportées:</h5>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {exec.changes.slice(0, 5).map((change, idx) => (
                                        <div key={idx} className="p-2 rounded bg-muted/50 text-sm">
                                          <div className="font-medium text-xs text-muted-foreground mb-1">
                                            {change.productName} • {change.field}
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="p-1.5 rounded bg-red-500/10 line-through truncate">
                                              {change.before}
                                            </div>
                                            <div className="p-1.5 rounded bg-emerald-500/10 truncate">
                                              {change.after}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      {exec.changes.length > 5 && (
                                        <p className="text-xs text-muted-foreground text-center">
                                          + {exec.changes.length - 5} autres modifications
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
