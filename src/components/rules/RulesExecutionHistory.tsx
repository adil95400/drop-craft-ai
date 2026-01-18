/**
 * RulesExecutionHistory - Historique des exécutions de règles
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  History, Search, Filter, CheckCircle2, XCircle, Clock, 
  RefreshCcw, ChevronDown, ChevronUp, Zap, Package
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  executedAt: string;
  status: 'success' | 'error' | 'partial';
  productsAffected: number;
  duration: number;
  error?: string;
  changes?: Array<{
    productId: string;
    productName: string;
    field: string;
    before: string;
    after: string;
  }>;
}

interface RulesExecutionHistoryProps {
  executions?: ExecutionLog[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

// Mock data pour la démo
const mockExecutions: ExecutionLog[] = [
  {
    id: '1',
    ruleId: 'rule-1',
    ruleName: 'Optimiser titres > 100 caractères',
    executedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'success',
    productsAffected: 45,
    duration: 1250,
    changes: [
      { productId: 'p1', productName: 'iPhone 15 Pro Max', field: 'title', before: 'iPhone 15 Pro Max 256Go Noir Titane - Apple...', after: 'iPhone 15 Pro Max 256Go Noir Titane' },
      { productId: 'p2', productName: 'Samsung Galaxy', field: 'title', before: 'Samsung Galaxy S24 Ultra 512Go Phantom Black...', after: 'Samsung Galaxy S24 Ultra 512Go Phantom Black' },
    ]
  },
  {
    id: '2',
    ruleId: 'rule-2',
    ruleName: 'Appliquer marge 40% électronique',
    executedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'success',
    productsAffected: 128,
    duration: 3420,
  },
  {
    id: '3',
    ruleId: 'rule-3',
    ruleName: 'Exclure stock < 5',
    executedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    status: 'partial',
    productsAffected: 12,
    duration: 890,
    error: '3 produits non traités: données manquantes',
  },
  {
    id: '4',
    ruleId: 'rule-4',
    ruleName: 'Générer descriptions IA',
    executedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'error',
    productsAffected: 0,
    duration: 5000,
    error: 'Limite de tokens API atteinte',
  },
];

export function RulesExecutionHistory({ 
  executions = mockExecutions, 
  isLoading = false,
  onRefresh 
}: RulesExecutionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredExecutions = executions.filter(exec => {
    const matchesSearch = exec.ruleName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: ExecutionLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: ExecutionLog['status']) => {
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
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Actualiser
            </Button>
          )}
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
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(exec.executedAt), { addSuffix: true, locale: fr })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {exec.productsAffected} produit{exec.productsAffected > 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {exec.duration}ms
                            </span>
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
                                <span>{format(new Date(exec.executedAt), 'dd/MM/yyyy à HH:mm:ss', { locale: fr })}</span>
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
                                          <div className="p-1.5 rounded bg-red-500/10 line-through">
                                            {change.before.slice(0, 50)}...
                                          </div>
                                          <div className="p-1.5 rounded bg-emerald-500/10">
                                            {change.after.slice(0, 50)}...
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
  );
}
