/**
 * Ligne de produit dans la liste d'audit
 * Affiche les infos produit avec scores et actions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Sparkles, 
  ArrowRight, 
  Image as ImageIcon, 
  FileText, 
  Tag, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuditScoreGauge } from './AuditScoreGauge';
import { ProductAuditResult } from '@/types/audit';
import { motion } from 'framer-motion';

interface ProductData {
  id: string;
  name?: string | null;
  description?: string | null;
  price?: number | null;
  category?: string | null;
  image_url?: string | null;
  images?: string[];
  sku?: string | null;
}

interface ProductAuditRowProps {
  product: ProductData;
  auditResult?: ProductAuditResult | null;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onAudit: () => void;
  onViewAudit?: () => void;
  isAuditing?: boolean;
  index: number;
}

export function ProductAuditRow({
  product,
  auditResult,
  isSelected,
  onSelect,
  onAudit,
  onViewAudit,
  isAuditing,
  index
}: ProductAuditRowProps) {
  const hasAudit = !!auditResult;
  const score = auditResult?.score.global || 0;
  const criticalCount = auditResult?.issues.filter(i => i.severity === 'critical').length || 0;
  const warningCount = auditResult?.issues.filter(i => i.severity === 'warning').length || 0;
  const imageCount = product.images?.length || (product.image_url ? 1 : 0);

  const getScoreLabel = (s: number) => {
    if (s >= 80) return { label: 'Excellent', variant: 'default' as const };
    if (s >= 60) return { label: 'Bon', variant: 'secondary' as const };
    if (s >= 40) return { label: 'Moyen', variant: 'outline' as const };
    return { label: 'Faible', variant: 'destructive' as const };
  };

  const QuickIndicator = ({ 
    icon: Icon, 
    value, 
    good, 
    tooltip 
  }: { 
    icon: any; 
    value: string | number; 
    good: boolean; 
    tooltip: string;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md text-xs",
            good ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}>
            <Icon className="h-3 w-3" />
            <span>{value}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "flex items-center gap-4 p-4 border rounded-lg transition-all",
        "hover:shadow-md hover:border-primary/20",
        isSelected && "border-primary bg-primary/5",
        auditResult?.needsCorrection && "border-l-4 border-l-destructive"
      )}
    >
      {/* Checkbox */}
      <Checkbox 
        checked={isSelected} 
        onCheckedChange={onSelect}
        className="shrink-0"
      />

      {/* Image */}
      <div className="shrink-0 w-14 h-14 rounded-md overflow-hidden bg-muted flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name || 'Product'}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      {/* Info produit */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <h4 className="font-medium truncate">
            {product.name || 'Sans nom'}
          </h4>
          {auditResult?.needsCorrection && (
            <Badge variant="destructive" className="shrink-0 text-xs">
              À corriger
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <span>{product.price ? `${product.price}€` : 'Prix ?'}</span>
          {product.category && (
            <>
              <span>•</span>
              <span className="truncate max-w-[120px]">{product.category}</span>
            </>
          )}
          {product.sku && (
            <>
              <span>•</span>
              <span className="text-xs font-mono">{product.sku}</span>
            </>
          )}
        </div>
      </div>

      {/* Indicateurs rapides */}
      <div className="hidden lg:flex items-center gap-2">
        <QuickIndicator 
          icon={ImageIcon} 
          value={imageCount} 
          good={imageCount >= 2}
          tooltip={`${imageCount} image(s)`}
        />
        <QuickIndicator 
          icon={FileText} 
          value={product.description ? '✓' : '✗'} 
          good={!!product.description}
          tooltip={product.description ? 'Description OK' : 'Sans description'}
        />
        {hasAudit && criticalCount > 0 && (
          <QuickIndicator 
            icon={AlertTriangle} 
            value={criticalCount} 
            good={false}
            tooltip={`${criticalCount} problème(s) critique(s)`}
          />
        )}
      </div>

      {/* Score */}
      {hasAudit && (
        <div className="shrink-0 hidden sm:block">
          <AuditScoreGauge score={score} size="sm" showLabel={false} />
        </div>
      )}

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-2">
        <Badge variant={getScoreLabel(score).variant} className="hidden sm:inline-flex">
          {score}/100
        </Badge>
        <Button
          variant={hasAudit && score >= 60 ? "outline" : "default"}
          size="sm"
          onClick={hasAudit ? onViewAudit : onAudit}
          disabled={isAuditing}
          className="gap-1"
        >
          {isAuditing ? (
            <>
              <Clock className="h-3 w-3 animate-spin" />
              Analyse...
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" />
              Voir l'audit
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
