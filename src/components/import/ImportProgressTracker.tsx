// IMPORT PROGRESS TRACKER - Suivi en temps réel avec logs
import { memo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface ImportLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: string;
  productName?: string;
  row?: number;
}

export interface ImportStats {
  total: number;
  processed: number;
  success: number;
  errors: number;
  warnings: number;
  skipped: number;
}

interface ImportProgressTrackerProps {
  isActive: boolean;
  stats: ImportStats;
  logs: ImportLog[];
  currentStep?: string;
  estimatedTimeRemaining?: number;
  onCancel?: () => void;
  onRetryErrors?: () => void;
  onDownloadReport?: () => void;
}

const LogIcon = ({ level }: { level: LogLevel }) => {
  switch (level) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    default:
      return <FileText className="h-4 w-4 text-blue-500" />;
  }
};

const LogEntry = memo(({ log }: { log: ImportLog }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-2 rounded-lg text-sm border-l-2",
        log.level === 'success' && "bg-green-500/5 border-green-500",
        log.level === 'error' && "bg-red-500/5 border-red-500",
        log.level === 'warning' && "bg-amber-500/5 border-amber-500",
        log.level === 'info' && "bg-blue-500/5 border-blue-500"
      )}
    >
      <div className="flex items-start gap-2">
        <LogIcon level={log.level} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{log.message}</span>
            {log.row && (
              <Badge variant="outline" className="text-xs">
                Ligne {log.row}
              </Badge>
            )}
          </div>
          {log.productName && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Produit: {log.productName}
            </p>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {log.timestamp.toLocaleTimeString('fr-FR')}
        </span>
        {log.details && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
      <AnimatePresence>
        {isExpanded && log.details && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono overflow-x-auto"
          >
            {log.details}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

LogEntry.displayName = 'LogEntry';

const ImportProgressTracker = memo(({
  isActive,
  stats,
  logs,
  currentStep,
  estimatedTimeRemaining,
  onCancel,
  onRetryErrors,
  onDownloadReport
}: ImportProgressTrackerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showLogs, setShowLogs] = useState(true);
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all');

  // Auto-scroll vers le bas pour les nouveaux logs
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const progress = stats.total > 0 ? (stats.processed / stats.total) * 100 : 0;
  const isComplete = stats.processed >= stats.total && stats.total > 0;

  const filteredLogs = filterLevel === 'all' 
    ? logs 
    : logs.filter(l => l.level === filterLevel);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {isActive ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground" />
            )}
            {isActive ? 'Import en cours...' : isComplete ? 'Import terminé' : 'Import'}
          </CardTitle>
          
          {estimatedTimeRemaining !== undefined && isActive && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              ~{formatTime(estimatedTimeRemaining)} restant
            </div>
          )}
        </div>

        {/* Barre de progression principale */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {currentStep || `${stats.processed} / ${stats.total} produits`}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
          <div className="p-2 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">{stats.total}</p>
          </div>
          <div className="p-2 bg-green-500/10 rounded-lg text-center">
            <p className="text-xs text-green-600">Réussis</p>
            <p className="text-lg font-semibold text-green-600">{stats.success}</p>
          </div>
          <div className="p-2 bg-red-500/10 rounded-lg text-center">
            <p className="text-xs text-red-600">Erreurs</p>
            <p className="text-lg font-semibold text-red-600">{stats.errors}</p>
          </div>
          <div className="p-2 bg-amber-500/10 rounded-lg text-center">
            <p className="text-xs text-amber-600">Avertissements</p>
            <p className="text-lg font-semibold text-amber-600">{stats.warnings}</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Ignorés</p>
            <p className="text-lg font-semibold">{stats.skipped}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contrôles des logs */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogs(!showLogs)}
            className="gap-2"
          >
            {showLogs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showLogs ? 'Masquer les logs' : 'Afficher les logs'}
            <Badge variant="secondary">{logs.length}</Badge>
          </Button>

          <div className="flex items-center gap-2">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as LogLevel | 'all')}
              className="text-xs border rounded px-2 py-1 bg-background"
            >
              <option value="all">Tous</option>
              <option value="success">Succès</option>
              <option value="error">Erreurs</option>
              <option value="warning">Avertissements</option>
              <option value="info">Info</option>
            </select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
              className={cn(autoScroll && "text-primary")}
            >
              Auto-scroll {autoScroll ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>

        {/* Liste des logs */}
        <AnimatePresence>
          {showLogs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <ScrollArea 
                ref={scrollRef}
                className="h-[250px] border rounded-lg p-2"
              >
                <div className="space-y-2">
                  {filteredLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun log à afficher
                    </p>
                  ) : (
                    filteredLogs.map((log) => (
                      <LogEntry key={log.id} log={log} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          {isActive && onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Annuler l'import
            </Button>
          )}
          
          {!isActive && stats.errors > 0 && onRetryErrors && (
            <Button variant="outline" onClick={onRetryErrors}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer les erreurs ({stats.errors})
            </Button>
          )}

          {!isActive && onDownloadReport && (
            <Button variant="outline" onClick={onDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger le rapport
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ImportProgressTracker.displayName = 'ImportProgressTracker';

export default ImportProgressTracker;
