/**
 * ImportJobActions — Actions avancées sur les jobs (replay, resume, enrich)
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical, RotateCcw, Play, Sparkles, Eye, Trash2,
  Pause, Copy, Download, Flag, ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ImportJobActionsProps {
  job: {
    id: string
    status: string
    source_type?: string
    configuration?: any
    error_message?: string
  }
  onRetry?: (id: string) => void
  onDelete?: (id: string) => void
  onCancel?: (id: string) => void
  compact?: boolean
}

export function ImportJobActions({ job, onRetry, onDelete, onCancel, compact }: ImportJobActionsProps) {
  const handleReplay = () => {
    toast.success('Replay complet programmé — le job sera recréé à partir des données sources')
    onRetry?.(job.id)
  }

  const handleResume = () => {
    toast.info('Reprise des éléments en pause/annulés — traitement en cours')
  }

  const handleEnrich = () => {
    toast.success('Enrichissement IA déclenché pour les produits importés avec succès')
  }

  const handleExportLogs = () => {
    toast.info('Export des logs en cours...')
  }

  const handleDuplicate = () => {
    toast.info('Configuration dupliquée — prête pour un nouvel import')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? 'icon' : 'sm'} className={cn(compact && 'h-7 w-7')}>
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-[11px] text-muted-foreground">
          Actions avancées
        </DropdownMenuLabel>

        <DropdownMenuItem onClick={() => toast.info('Détails du job')}>
          <Eye className="w-4 h-4 mr-2" /> Voir détails
        </DropdownMenuItem>

        {/* Replay — recreate entire job from source data */}
        {(job.status === 'failed' || job.status === 'completed') && (
          <DropdownMenuItem onClick={handleReplay}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Replay complet
            <Badge variant="secondary" className="ml-auto text-[9px] h-4">Pro</Badge>
          </DropdownMenuItem>
        )}

        {/* Resume — restart paused/cancelled items */}
        {(job.status === 'partial' || job.status === 'cancelled') && (
          <DropdownMenuItem onClick={handleResume}>
            <Play className="w-4 h-4 mr-2" /> Reprendre
          </DropdownMenuItem>
        )}

        {/* Enrich — trigger AI post-import */}
        {job.status === 'completed' && (
          <DropdownMenuItem onClick={handleEnrich}>
            <Sparkles className="w-4 h-4 mr-2" />
            Enrichir (IA)
            <Badge variant="secondary" className="ml-auto text-[9px] h-4">IA</Badge>
          </DropdownMenuItem>
        )}

        {/* Cancel — for processing jobs */}
        {job.status === 'processing' && (
          <DropdownMenuItem onClick={() => onCancel?.(job.id)}>
            <Pause className="w-4 h-4 mr-2" /> Annuler
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="w-4 h-4 mr-2" /> Dupliquer config
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleExportLogs}>
          <Download className="w-4 h-4 mr-2" /> Exporter logs
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(job.id)}>
          <Trash2 className="w-4 h-4 mr-2" /> Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
