/**
 * Composant jauge de score d'audit
 * Affiche un score circulaire animé avec couleur dynamique
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AuditScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

export function AuditScoreGauge({ 
  score, 
  size = 'md', 
  showLabel = true,
  label 
}: AuditScoreGaugeProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return { stroke: 'hsl(var(--chart-2))', text: 'text-green-600', bg: 'bg-green-50' };
    if (s >= 60) return { stroke: 'hsl(var(--chart-4))', text: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (s >= 40) return { stroke: 'hsl(var(--chart-5))', text: 'text-orange-600', bg: 'bg-orange-50' };
    return { stroke: 'hsl(var(--destructive))', text: 'text-red-600', bg: 'bg-red-50' };
  };

  const sizeConfig = {
    sm: { width: 40, strokeWidth: 4, fontSize: 'text-xs', labelSize: 'text-[8px]' },
    md: { width: 60, strokeWidth: 5, fontSize: 'text-sm', labelSize: 'text-[10px]' },
    lg: { width: 100, strokeWidth: 8, fontSize: 'text-xl', labelSize: 'text-xs' }
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colors = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        <svg 
          width={config.width} 
          height={config.width}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={config.strokeWidth}
          />
          {/* Score circle */}
          <motion.circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', config.fontSize, colors.text)}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      {showLabel && label && (
        <span className={cn('text-muted-foreground text-center', config.labelSize)}>
          {label}
        </span>
      )}
    </div>
  );
}
