import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProcessProgress {
  current: number;
  total: number;
  success: number;
  failed: number;
}

interface ImageAuditProgressProps {
  progress: ProcessProgress;
  isProcessing: boolean;
}

export function ImageAuditProgress({ progress, isProcessing }: ImageAuditProgressProps) {
  if (!isProcessing) return null;

  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="font-medium">
              Enrichissement en cours... {progress.current}/{progress.total}
            </span>
          </div>
          
          <Progress value={percentage} className="h-2 mb-3" />
          
          <div className="flex gap-6 text-sm">
            <span className="text-green-500 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              {progress.success} réussis
            </span>
            <span className="text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" />
              {progress.failed} échecs
            </span>
            <span className="text-muted-foreground ml-auto">
              {Math.round(percentage)}%
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
